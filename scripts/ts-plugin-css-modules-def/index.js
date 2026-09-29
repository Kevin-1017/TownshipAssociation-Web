/**
 * tsserver 插件：修复 CSS Module 类名的 Ctrl+左键跳转坐标。
 *
 * 背景：typescript-plugin-css-modules（即便开 goToDefinition 选项）用「按 CSS 行号垫行的虚拟
 * d.ts」实现跳转，但默认导出 `style.xxx` 解析到的是合成文件尾部/垫行错位的坐标（如 116 行的
 * 文件跳去幻影行）；上游 issue #247 未修。该插件做后处理：任何解析进 .module.css 的 definition
 * 结果，都改为在磁盘上的真实 CSS 文本里定位同名类的选择器位置。
 *
 * 注册在 typescript-plugin-css-modules 之后（TS 按列表顺序包装 LS，后者拿到前者的返回值）。
 * 注意 LS 层字段与协议层不同：DocumentSpan 为 { fileName, textSpan: {start,length} }，
 * 字符偏移，tsserver 再转成协议层的 file/start.line。
 */
/* eslint-disable @typescript-eslint/no-require-imports -- tsserver 以 CJS require 加载插件，不能改 ESM */
const fs = require('fs');

/** 在 CSS 文本里找 `.className` 作为选择器 token 的首次出现，返回字符偏移与长度。 */
function findSelector(cssText, className) {
  const esc = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 前导须为行首/空白/选择器分隔符；后随不得是标识符字符（.title 不误中 .titleBox）
  const re = new RegExp('(^|[\\s>+~,])\\.' + esc + '(?![\\w-])');
  let lineStart = 0;
  for (const line of cssText.split('\n')) {
    const m = re.exec(line);
    if (m) {
      const dotCol = m.index + m[0].indexOf('.');
      return { start: lineStart + dotCol, length: 1 + className.length };
    }
    lineStart += line.length + 1;
  }
  return null;
}

/** 取光标处属性名：优先 QuickInfo 符号名，退回按光标扩出标识符并要求前导为 '.'。 */
function propertyNameAt(ls, fileName, position) {
  try {
    const qi = ls.getQuickInfoAtPosition(fileName, position);
    const name = qi && qi.symbol && qi.symbol.name;
    if (typeof name === 'string' && name !== 'default' && name !== '__index') return name;
  } catch {
    /* ignore */
  }
  try {
    const text = fs.readFileSync(fileName, 'utf8');
    let s = position;
    let e = position;
    while (s > 0 && /[\w$]/.test(text[s - 1])) s--;
    while (e < text.length && /[\w$]/.test(text[e])) e++;
    if (s === e || text[s - 1] !== '.') return null;
    return text.slice(s, e);
  } catch {
    return null;
  }
}

function create(info) {
  const ls = info.languageService;

  const unquote = (n) => String(n).replace(/^['"]+|['"]+$/g, '');

  /** 把 definitions 里落在 .module.css 上的坐标改写为真实选择器位置；返回是否改写过 */
  function rewrite(defs, fileName, position) {
    const fileProp = (d) => d.fileName || d.file;
    if (!defs || !defs.some((d) => /\.module\.css$/.test(fileProp(d) || ''))) return false;
    let name = defs.find((d) => d.name && /\.module\.css$/.test(fileProp(d) || ''))?.name;
    if (!name) name = propertyNameAt(ls, fileName, position);
    if (!name) return false;
    let touched = false;
    for (const def of defs) {
      const cssPath = fileProp(def);
      if (!cssPath || !/\.module\.css$/.test(cssPath)) continue;
      let css;
      try {
        css = fs.readFileSync(cssPath, 'utf8');
      } catch {
        continue;
      }
      const pos = findSelector(css, unquote(def.name || name));
      if (!pos) continue;
      // LS 层 TextSpan 是 {start, length} 字符偏移
      def.textSpan = { start: pos.start, length: pos.length };
      def.contextSpan = { start: pos.start, length: pos.length };
      if (def.originalTextSpan) {
        def.originalTextSpan = { start: pos.start, length: pos.length };
      }
      touched = true;
    }
    return touched;
  }

  // 官方模式：返回新的代理 LS（Object.create 委托其余方法），不要原地改写 info.languageService。
  // VS Code 的 Go to Definition 走 protocol definition → LS.getDefinitionAtPosition；
  // definitionAndBoundSpan → LS.getDefinitionAndBoundSpan。两条路径都要包。
  const proxy = Object.create(ls);

  proxy.getDefinitionAtPosition = (fileName, position) => {
    const defs = ls.getDefinitionAtPosition(fileName, position);
    if (defs) rewrite(defs, fileName, position);
    return defs;
  };

  proxy.getDefinitionAndBoundSpan = (fileName, position) => {
    const result = ls.getDefinitionAndBoundSpan(fileName, position);
    if (result && result.definitions) rewrite(result.definitions, fileName, position);
    return result;
  };

  /**
   * tsserver 把协议坐标换算委托给 LS.toLineColumnOffset —— 而它读到的 .module.css 快照是
   * typescript-plugin-css-modules 合成的虚拟 d.ts（行数远少于真实 CSS），会把我们改写的
   * 真实偏移映射到幻影行。这里对 .module.css 改用磁盘文本建行索引，其余原样委托。
   */
  const lineIndexCache = new Map();
  function lineIndex(filePath) {
    const st = fs.statSync(filePath);
    const key = `${st.mtimeMs}-${st.size}`;
    let idx = lineIndexCache.get(filePath);
    if (!idx || idx.key !== key) {
      const text = fs.readFileSync(filePath, 'utf8');
      const starts = [0];
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
      }
      idx = { key, starts };
      lineIndexCache.set(filePath, idx);
    }
    return idx;
  }

  proxy.toLineColumnOffset = (fileName, position) => {
    if (/\.module\.css$/i.test(fileName)) {
      try {
        const { starts } = lineIndex(fileName);
        let lo = 0;
        let hi = starts.length - 1;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (starts[mid] <= position) lo = mid;
          else hi = mid - 1;
        }
        return { line: lo, character: position - starts[lo] };
      } catch {
        /* 磁盘读失败则退回默认实现 */
      }
    }
    return ls.toLineColumnOffset(fileName, position);
  };

  return proxy;
}

// tsserver 约定：插件模块本身须导出工厂函数 init(modules) => { create }
module.exports = function init() {
  return { create };
};

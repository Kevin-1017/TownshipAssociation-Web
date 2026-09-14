// 构建后置脚本：把 out/ 里 __next.<seg>/ 目录形态的 RSC 载荷镜像成客户端实际请求的
// 点号扁平形态（Next 16 静态导出的已知错位：next start/Vercel 内置了这层路由映射，
// 纯静态 Nginx 没有，导致软导航预取全部 404 回退整页加载）。
// 规则：__next.!KHNpdGUp/foundation/__PAGE__.txt → 同层生成 __next.!KHNpdGUp.foundation.__PAGE__.txt
// 只增不改：目录原件保留，脚本幂等可重复执行。
import { readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, sep } from "node:path";

const OUT = process.argv[2] ?? "out";

function listFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) files.push(...listFiles(p));
    else files.push(p);
  }
  return files;
}

let count = 0;
for (const file of listFiles(OUT)) {
  if (!file.endsWith(".txt")) continue;
  const segs = file.split(sep);
  const dirSegs = segs.slice(0, -1); // 只看祖先目录，跳过文件名自身的 __next. 前缀
  const idx = dirSegs.findIndex((s) => s.startsWith("__next."));
  if (idx === -1) continue;
  const before = dirSegs.slice(0, idx);
  const tokenDir = dirSegs[idx];
  const inner = [...dirSegs.slice(idx + 1), segs.at(-1)];
  const target = join(...before, `${tokenDir}.${inner.join(".")}`);
  if (!existsSync(target)) {
    mkdirSync(join(...before), { recursive: true });
    copyFileSync(file, target);
    count++;
  }
}
console.log(`[flatten-rsc] 生成扁平 RSC 镜像文件 ${count} 个`);

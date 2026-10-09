# 部署手册(tsa-api / tsa-web → 生产服务器)

> 本手册只写**流程与方法**,不记逐次部署日志;版本号、回滚文件名等时点性信息一律不入本文。
> 下列环境事实均为服务器实测;隔了较长时间再部署时,动手前先复验一遍。

---

## 1. 环境事实

| 项 | 值 |
| --- | --- |
| 服务器 | 腾讯云轻量应用服务器,Ubuntu Server 24.04 LTS。现役唯一生产机:香港 `VM-0-13-ubuntu`(43.161.230.68);新加坡 `VM-0-4-ubuntu` 已于 2026-10 退网 |
| 登录 | 走 `~/.ssh/config` 主机别名:`ssh tsa-hk`(`User ubuntu`,密钥 `~/.ssh/tsa_hk_kevin.pem`)。历史文档曾写"kevin.pem 在 Downloads"当作 SG 的登录方式,**是错的**——SG 从来没用过控制台下载的 pem |
| sudo | ubuntu 免密 sudo 已配置(`sudo -n` 全自动可用) |
| 后端服务 | systemd unit `/etc/systemd/system/tsa-api.service`:root 运行,`ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /opt/tsa/api/tsa-api.jar`,`EnvironmentFile=/opt/tsa/api/env`(600 root,含 `SPRING_PROFILES_ACTIVE/DATASOURCE_URL/USERNAME/PASSWORD`、`SERVER_FORWARDHEADERSSTRATEGY`、`TSA_FILES_DIR`、`TZ`、knife4j 开关等),`Restart=on-failure` |
| 数据库 | 本机 MySQL 8 系(`mysql.service`),库名 `tsa`;连接串 `jdbc:mysql://localhost:3306/tsa?...serverTimezone=Asia/Shanghai`(凭据在 `/opt/tsa/api/env`) |
| Java(服务器) | OpenJDK 25.0.4,与仓库 `java.version=25` 匹配,新 jar 可直接跑 |
| Nginx | 站点配置 `/etc/nginx/sites-enabled/tsa`;`server_name gdutgaginang.cn www.gdutgaginang.cn`;静态根 `/opt/tsa/web`(属主 `ubuntu:ubuntu`);`/tsa` 反代 `http://127.0.0.1:8080`;页面 `try_files $uri $uri/index.html $uri.html =404` |

### 如何判断线上 jar 是否落后于本地 HEAD(通用)

不要靠 jar 时间戳猜。三重独立验证,任一不过即视为需要重新部署:

1. **类存在性**:取本地 HEAD 新增/改动的特征类名,查线上 jar 内是否有:

   ```bash
   ssh tsa-hk "python3 -c \"import zipfile; \
   print([n for n in zipfile.ZipFile('/opt/tsa/api/tsa-api.jar').namelist() \
   if '<特征类名>' in n])\""
   ```

2. **DB 列就位**:新提交带来的迁移列在 `tsa` 库 `information_schema.columns` 中确实存在;
3. **路由行为**:新端点无 token 访问应返回 Sa-Token 的 401 壳(`{"code":401,...}`,HTTP 层 200),而非 404。

---

## 2. 前置:sudo 免密

部署全程需要 `sudo`。若 `sudo -n true` 报错(免密失效),在腾讯云控制台实例卡片
「登录」→ OrcaTerm 执行下面三行即可恢复:

```bash
sudo -s
echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/91-ubuntu-nopasswd
chmod 440 /etc/sudoers.d/91-ubuntu-nopasswd
exit
```

(安全性:服务器已禁密码登录、仅密钥可入,ubuntu 被攻破≈root 被攻破,风险增量可接受。)

### 控制台防火墙(新机器必踩)

本站**不在系统里开 ufw/iptables**,唯一的端口屏障是轻量应用服务器控制台**实例级**的防火墙规则。
所以「配置全对但公网打不开」第一先查这里:80/443 必须在控制台放行(22 默认放行)。
两个连带性质:规则不随自定义镜像带过来、也**不在系统盘里**,重装系统不会恢复。

---

## 3. 后端部署

前提:上节验证显示线上 jar 落后于本地 HEAD。

> 全程 root 执行。本地先 `./mvnw -q package -DskipTests`,产物在
> `target/tsa-api-0.0.1-SNAPSHOT.jar`。

```bash
# 0) 本机上传(scp 用 kevin.pem)
scp target/tsa-api-0.0.1-SNAPSHOT.jar tsa-hk:/home/ubuntu/

# 1) 服务器:备份现役 jar
cp -a /opt/tsa/api/tsa-api.jar /opt/tsa/api/tsa-api.jar.bak.$(date +%F-%H%M)

# 2) 先跑迁移(以本次待部署提交新增的 sql/migrate-*.sql 为准,逐个确认幂等性再执行;
#    用 env 里的账号或 root socket 连 tsa 库;跑前必做逻辑备份)
mysqldump --single-transaction tsa > /root/tsa-backup-$(date +%F).sql
mysql tsa < /path/to/sql/<本次新增的迁移文件>.sql

# 3) 换 jar + 重启(属主与 systemd 一致)
install -o root -m 644 /home/ubuntu/tsa-api-0.0.1-SNAPSHOT.jar /opt/tsa/api/tsa-api.jar
systemctl restart tsa-api
journalctl -u tsa-api -n 50 --no-pager    # 确认 Started,无堆栈异常

# 4) 冒烟见第 6 节;失败回滚:
# cp -a /opt/tsa/api/tsa-api.jar.bak.xxx /opt/tsa/api/tsa-api.jar && systemctl restart tsa-api
# (SQL 迁移若已跑,回滚 jar 即可;迁移语句为加列型,旧 jar 能容忍新列——回滚前确认此前提)
```

## 4. 前端部署(web 静态)

本地(Web 仓库):`npx tsc --noEmit && npm run lint && npm run build`
→ 产物 `out/`(postbuild 自动生成 RSC 扁平镜像,控制台应打印 `[flatten-rsc] 生成扁平 RSC 镜像文件 N 个`)。

```bash
# 本地上传
tar czf out.tgz -C out .
scp out.tgz tsa-hk:/home/ubuntu/

# 服务器:站点根是 /opt/tsa/web,先备份再替换
mv /opt/tsa/web /opt/tsa/web.bak.$(date +%F-%H%M)
mkdir /opt/tsa/web && tar xzf /home/ubuntu/out.tgz -C /opt/tsa/web
chown -R ubuntu:ubuntu /opt/tsa/web
```

> 注意:`.env.production` 的 `NEXT_PUBLIC_API_BASE_URL` 留空 = 同源相对路径,
> 换服务器/换域名都不用重新构建;构建期常量,改了必须重 build。

## 5. (可选加固)反代现状

现网 `proxy_pass http://127.0.0.1:8080` + env 里 `SERVER_FORWARDHEADERSSTRATEGY` —— 与限频的
「反代必须配 forward-headers」要求一致,**不改不验,动 nginx 前单独评审**。

## 6. 冒烟清单(部署后,走域名公网验)

```
1. https://www.gdutgaginang.cn/tsa/health                     → code=200
2. GET  https://www.gdutgaginang.cn/tsa/admin/community/posts → 未带 token 应 401 壳
   (返回 404/网关错说明该路由的 jar 未上线;每次部署可换成本次新增的特征端点来验)
3. 官网首页/公告/事件/社区列表能出数据(浏览器 F12 看 /tsa 响应 code=200)
4. 后台 /admin/login 登录成功;动态审核台能列待审
5. RSC 预取:Network 里 __next… .txt 全部 200(0 个 404)——flatten-rsc 生效证据
6. 图片上传发布一条测试动态 → 列表可见性符合审核制(需先过审)
```

## 7. 待办/存疑

- [x] 迁到香港机:DNS 已切、新加坡机已退,`tsa-hk` 是唯一生产机(2026-10)。
- [ ] **异地备份**:现网只有每次部署前的一份 `mysqldump`(留最近 7 份)加旧站目录,全在同一块盘上;机器没了就等于没有。上 COS 是当前最高优先待办。
- [ ] 定时 dump cron 是否存在,**从未验证过**——别把它当既有保障。
- [ ] 证书 2026-12-12 到期,换 `acme.sh` + DNSPod API 走 DNS 验证自动续期(不依赖端口与线路)。
- [ ] `ops/` 含部署入口 `deploy.sh`,但不进任何 git 仓;改它没有版本历史,只能靠机上的 root:root 权限防别人动。

---

## 8. 整机换/新建:用仓库根的 `ops/` 三段脚本

> 位置:`<仓库根>/ops/`(与 tsa-api、tsa-web 平级,不属于任何一个 git 仓库)。
> 目标机由脚本顶部 `DST`/`HOST` 变量决定,默认 `tsa-hk`;按顺序跑,每段都可重复执行。

| 脚本 | 干什么 | 关键设计 |
| --- | --- | --- |
| `01-provision.sh` | 裸机装成与现役同构的环境:JDK/MySQL(低内存调优)/Nginx 站点/systemd 单元/fail2ban/sshd 收紧 | 单元与站点内容照抄现网实测;`nginx -t` 过但**先不 enable 站点**,等证书到位 |
| `02-migrate-data.sh` | 搬数据:`mysqldump` + 上传目录 + `env` + 证书;在目标机就地建库建用户 | 源机**只读**、不停服务;DB 口令从 `env` 就地解析后走 stdin,不进命令行也不进对话;本机 `ops/.tmp/` 留一份带时间戳的 gz 当回滚资产 |
| `03-deploy-app.sh` | 本地跑测试→打包 jar→构建 `out/`→装到目标机→挂站点起服务→**对新 IP 走公网冒烟** | 切 DNS 前用 `curl --resolve 域名:443:新IP` 验,证书仍按域名校验;末尾列出需人工做的 hosts/DNS/轮换口令 |

### 三个只有实测才知道的坑

1. **包名**:Ubuntu 24.04(noble)**没有 `openjdk-25` 元包**,必须写 `openjdk-25-jdk`。写错会让整条 `apt-get install` 中止,连带 mysql/nginx/fail2ban 一个都没装上,而报错只有一行 `Unable to locate package`。
2. **`TSA_FILES_DIR` 是最容易漏的一项**:库里只存路径,图片/封面本体在磁盘上。漏搬不报错,只表现为线上图片全 404。`02` 脚本从 `env` 里就地解析目录名再打包,不要手写路径。
3. **env 可整份原样搬**:连接串是 `localhost`,换机不改任何值——口令不变、不用重新生成。目标机只需把它设成 `root:root 600`。

### 跨地域自定义镜像(备选路,不作主路)

腾讯云轻量的自定义镜像支持跨地域复制,新加坡⇄中国香港在允许范围内(限制只针对"中国内地地域,不含中国香港")。
但这套栈不建议走它:会被 2G 逼出来的压制参数(`-Xmx512m`、`buffer 256M`)和 `/opt/tsa/backups`、`web.bak.*`、历史 `jar.bak`、日志、fail2ban ban 记录一起刻进去;做镜像还得停机或容忍 InnoDB crash recovery;而真正要搬的只有一个 dump 和一个上传目录。**留着当保险**——脚本方案卡住时才有整盘可退。

---

## 9. CI/CD 自动部署(2026-10-09 起)

日常上线走 GitHub Actions;上面 §3/§4 的手工路径降为**应急通道**(CI 挂掉时才用)。

| 件 | 在哪 | 干什么 |
| --- | --- | --- |
| 前端流水 | `tsa-web/.github/workflows/deploy.yml` | push master → `npm ci` → `next build` → `tsc --noEmit` → lint → tar →〔Approve〕→ scp → 换包 |
| 后端流水 | `tsa-api/.github/workflows/deploy.yml` | push master → `./mvnw test` → package →〔Approve〕→ scp jar → 换包+重启 |
| 服务器侧入口 | `/opt/tsa/deploy/deploy.sh <api\|web> <git-sha>` | 源文件 `ops/deploy.sh`,root:root 755。动手前必 `mysqldump`;自检不过自动回滚;`flock` 串行,防两次 Approve 撞车 |
| 部署账号 | `tsa-deploy` | sudoers 只放行上面那一条命令;`~/incoming/` 是 CI 唯一能写的地方 |

四条边界,以后谁改流水都别破:

1. **CI 不经手 `/opt/tsa/api/env`** —— 那是 DB 口令的唯一副本;也不碰 `upload-data/`,图片本体在磁盘、库里只存路径。
2. **只有 `push` 触发部署** —— 两仓都是公开仓,给 `pull_request` / `pull_request_target` 开部署,等于任何人都能靠一个 PR 读到部署私钥。
3. **SQL 迁移仍人工** —— 流水不跑 DDL,改了实体先在测试库过一遍再按 §5 上机执行。
4. **审批靠 Environment** —— 两仓各建名为 `production` 的 Environment 且勾 Required reviewers;没建 GitHub 会静默建一个不拦人的,变成 push 即上线。

四个 Secret 填在**仓库级**(Settings → Secrets and variables → Actions → **Secrets** 标签页,不是 Variables):`DEPLOY_USER`、`DEPLOY_HOST`、`DEPLOY_SSH_KEY`、`DEPLOY_KNOWN_HOSTS`,两仓各一份。流水第一步就是检查这四个是否非空,空则报名字退出,而不是甩一个 `Could not resolve hostname`。

两个只有跑过才知道的坑:

- **构建顺序不能反**:`next-env.d.ts` 与 `.next/types/**` 都在 `.gitignore` 里,干净 checkout 中不存在,而 `layout.tsx` 用的全局 `LayoutProps<>` 正来自那里。先 `tsc` 后 `build` 必然 `TS2304`,本机因为跑过 `next dev` 所以看不出来。
- **断言一律用 `case`,不要用 `curl … | grep -q …`**:`set -o pipefail` 下 grep 一命中就退出并关掉管道,上游 curl 吃 SIGPIPE 退 141,整条管道算失败——命中与否都过不去。同理,探活必须看响应 body,因为应用的错误响应也是 HTTP 200 包 JSON 壳。

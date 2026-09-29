# 部署手册(tsa-api / tsa-web → 生产服务器)

> 本文所有条目均为 2026-09-29 在服务器实测确认;凡「未验证」字样处,执行前须先验证。
> ⚠️ 仓库其它文档(AGENTS.md 等)若与本文冲突,**以本文为准并顺手改掉旧文**:
> 服务器不是香港而是**新加坡 43.156.74.60**(gdutgaginang.cn 现解析于此);
> 密钥是 **`kevin.pem`**(Windows 本机位于 Downloads),不是 `lighthub.pem`;
> 数据库实名 **`tsa`**,不是 `tsa_prod`;jar 实名 **`/opt/tsa/api/tsa-api.jar`**。

---

## 1. 现状(已验证)

| 项 | 值 |
| --- | --- |
| 服务器 | 腾讯云轻量应用服务器,新加坡,Ubuntu Server 24.04 LTS(主机名 `VM-0-4-ubuntu`) |
| 登录 | `ssh -i <kevin.pem路径> ubuntu@43.156.74.60` ✓ 实测可连 |
| sudo | ✅ 2026-09-29 已按 §2 路 A 解锁(`/etc/sudoers.d/91-ubuntu-nopasswd`),`sudo -n` 全自动可用 |
| 后端服务 | systemd unit `/etc/systemd/system/tsa-api.service`:root 运行,`ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /opt/tsa/api/tsa-api.jar`,`EnvironmentFile=/opt/tsa/api/env`(600 root,含 `SPRING_PROFILES_ACTIVE/DATASOURCE_URL/USERNAME/PASSWORD`、`SERVER_FORWARDHEADERSSTRATEGY`、`TSA_FILES_DIR`、`TZ`、knife4j 开关等),`Restart=on-failure` |
| 数据库 | 本机 MySQL 8 系(`mysql.service`),**库名 `tsa`**;连接串 `jdbc:mysql://localhost:3306/tsa?...serverTimezone=Asia/Shanghai`(凭据在 `/opt/tsa/api/env`) |
| Java(服务器) | OpenJDK **25.0.4**(与仓库 `java.version=25` 匹配,可直接跑新 jar) |
| Nginx | 站点配置 `/etc/nginx/sites-enabled/tsa`;`server_name gdutgaginang.cn www.gdutgaginang.cn`;静态根 **`/opt/tsa/web`**;`/tsa` 反代 `http://127.0.0.1:8080`;页面 `try_files $uri $uri/index.html $uri.html =404` |
| 当前线上 jar | 构建/部署于 **2026-09-15 01:25**(+08:00),40,808,791 字节,属主 `ubuntu` |
| 本地仓库 HEAD | `c6dd22c`(提交时间 **2026-09-15 01:31**),即「审核制+事件年份区间」那一版 |
| 本机 jar 产物 | `target/tsa-api-0.0.1-SNAPSHOT.jar` 40,811,646 字节(2026-09-29,`./mvnw -q package -DskipTests` 构建,HEAD=c6dd22c) |

### 版本判断 ✅ 已定案(2026-09-29)

**线上 jar 即 HEAD `c6dd22c` 审核制版,后端无需重新部署。** 三重独立证据:

1. 该提交新增的类全部存在于线上 jar:`AdminCommunityController` / `AdminEventController` / `CommunityAuditRequest` / `UploadRules`;
2. `tsa` 库审核列已就位:`community_post.status`、`community_comment.status`、`community_comment.post_id`(迁移脚本只加这些列,无 `audit_note`);
3. 无 token `GET /tsa/admin/community/posts` 返回 Sa-Token 的 401 壳(`{"code":401,"message":"未登录或登录已过期"}`,HTTP 层 200),而非 404。

> 勘误:本节旧版给的 build-info.txt 验证命令是**误写**——Api 仓库根本没有
> `generated/build-info.txt` 这套机制(grep 无引用,jar 内无此路径),已删。

复现命令:

```bash
ssh -i <kevin.pem> ubuntu@43.156.74.60 "python3 -c \"import zipfile; \
print([n for n in zipfile.ZipFile('/opt/tsa/api/tsa-api.jar').namelist() \
if 'AdminCommunity' in n or 'CommunityAuditRequest' in n])\""

sudo mysql -N -e "SELECT table_name,column_name FROM information_schema.columns \
  WHERE table_schema='tsa' AND table_name IN ('community_post','community_comment') \
  AND column_name IN ('status','post_id') ORDER BY 1,2;"
```

---

## 2. 解锁自动化:二选一 ✅ 已走「路 A」完成解锁(2026-09-29)

历史背景:所有生产操作要 root 读 `/opt/tsa/api/env`、写 `/opt/tsa/api/`、`systemctl restart`。

**路 A(推荐,一次解锁长期自动化)**
你(或有密码的人)在服务器终端(腾讯云控制台实例卡片「登录」→ OrcaTerm)执行:

```bash
sudo -s
echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/91-ubuntu-nopasswd
chmod 440 /etc/sudoers.d/91-ubuntu-nopasswd
exit
```

完成后告诉我,我即可从本机全自动执行 §3/§4。
(安全性说明:已禁密码登录、仅密钥可入,ubuntu 被攻破≈root 被攻破,风险增量可接受。)

**路 B(不解锁,我出逐条命令)**
我把 §3/§4 写成可整段粘贴的脚本,你在 OrcaTerm 里 `sudo -i` 后粘贴,把输出回传给我判读。

---

## 3. 后端部署 runbook(前提:§1 验证显示线上 jar ≠ HEAD,或你要把新改动推上去)

> **2026-09-29 §1 定案:线上 jar 已 = HEAD `c6dd22c`,本节本次无需执行。**
> 仅当你之后又推了新提交时按此走。

> 全程 root 执行。本地先 `./mvnw -q package -DskipTests`,产物在
> `target/tsa-api-0.0.1-SNAPSHOT.jar`(**不是**旧文档写的 `TownshipAssociation-Api-*.jar`)。

```bash
# 0) 本机上传(scp 用 kevin.pem)
scp -i <kevin.pem> target/tsa-api-0.0.1-SNAPSHOT.jar ubuntu@43.156.74.60:/home/ubuntu/

# 1) 服务器:备份现役 jar
cp -a /opt/tsa/api/tsa-api.jar /opt/tsa/api/tsa-api.jar.bak.$(date +%F-%H%M)

# 2) 先跑迁移(HEAD 含两个迁移文件,幂等性各自确认后再执行)
#    mysql <schema 名为 tsa> 用 env 里的账号,或直接 root socket:
mysql tsa < /path/to/sql/migrate-2026-09-14-community-audit.sql
mysql tsa < /path/to/sql/migrate-2026-09-15-comment-audit.sql
#    (迁移文件随仓库 git 取,或 scp 上去;跑前 mysqldump 逻辑备份一份 tsa 库)
mysqldump --single-transaction tsa > /root/tsa-backup-$(date +%F).sql

# 3) 换 jar + 重启(属主与 systemd 一致)
install -o root -m 644 /home/ubuntu/tsa-api-0.0.1-SNAPSHOT.jar /opt/tsa/api/tsa-api.jar
systemctl restart tsa-api
journalctl -u tsa-api -n 50 --no-pager    # 确认 Started,无堆栈异常

# 4) 冒烟见 §6;失败回滚:
# cp -a /opt/tsa/api/tsa-api.jar.bak.xxx /opt/tsa/api/tsa-api.jar && systemctl restart tsa-api
# (SQL 迁移若已跑,回滚 jar 即可;迁移语句为加列型,旧 jar 能容忍新列——回滚前确认此前提)
```

## 4. 前端部署 runbook(web 静态)

本地(Web 仓库):`npx tsc --noEmit && npm run lint && npm run build`
→ 产物 `out/`(postbuild 自动生成 RSC 扁平镜像,控制台应打印 `[flatten-rsc] 生成扁平 RSC 镜像文件 N 个`)。

```bash
# 本地上传
tar czf out.tgz -C out .
scp -i <kevin.pem> out.tgz ubuntu@43.156.74.60:/home/ubuntu/

# 服务器:站点根是 /opt/tsa/web(nginx root 实测),先备份再替换
mv /opt/tsa/web /opt/tsa/web.bak.$(date +%F-%H%M)
mkdir /opt/tsa/web && tar xzf /home/ubuntu/out.tgz -C /opt/tsa/web
chown -R ubuntu:ubuntu /opt/tsa/web   # 实测现网属主就是 ubuntu:ubuntu(非 www-data),照抄即可
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
   (旧 jar 无此路由会 404/网关错 —— 这条同时验「审核制接口已上线」)
3. 官网首页/公告/事件/社区列表能出数据(浏览器 F12 看 /tsa 响应 code=200)
4. 后台 /admin/login 登录成功;动态审核台能列待审
5. RSC 预取:Network 里 __next… .txt 全部 200(0 个 404)——flatten-rsc 生效证据
6. 图片上传发布一条测试动态 → 列表可见性符合审核制(需先过审)
```

## 7. 待办/存疑

- [x] §1 两条决定性验证(审核列 ✅;build-info 机制不存在,已勘误)—— sudo 已解锁,2026-09-29 完成;
- [x] 版本定案:线上 = `c6dd22c`,后端免部署;
- [ ] 旧文档纠偏:`TownshipAssociation-Api` 仓库的 AGENTS/README、Web `docs/TECHNOLOGY.md` §6
      「香港/lighthub/`/tsa` 目录结构」等以本文为准改写;
- [ ] `web` 仓库根仍有未跟踪的 `pnpm-lock.yaml`/`pnpm-workspace.yaml`:确认 npm 路线后删除或迁移,二选一;
- [ ] `tsa` 库的逻辑备份 cron:现网是否存在**未验证**。

# Sub-Merger-CFWorker

基于CF Worker的Clash系软件的订阅合并，增加分流配置

优势：

- 无论订阅地址是否被墙，CF的节点都是可以去拉取的
- 你的Worker绑一个没被墙的域名，就可以无需代理更新订阅配置了

**注意：**

现在分流配置是我写死的，如果你有不同的需求，请fork了代码，自行修改

关于Clash中流量和有效期的显示：

- 流量是所有订阅源返回的数据累加起来的
- 有效期是所有订阅源中返回的最早的到期时间

# 消费降级，性价比机场推荐

AFF机场推荐：

| 机场名                | 价格                                                                      | 注册网址                                                                   | 特色                                                                                 |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 【强烈推荐】SOS加速器 | ￥50/一次性（150G/100Mbps），￥19.7/70G/50Mbps/月，￥39.7/300G/300Mbps/月 | [SOS加速器网址](hhttps://www.sosjsq.com/index.php#/register?code=E9zVBYSD) | 有一次性流量包，价格稍微有点高，但速度是真快，39.7那档说是300Mbps，我实测能到500Mbps |
| 宝可梦星云            | ￥19.9/180G/月，￥39.9/211G/一次性                                        | [宝可梦网址](https://love.p6m6.com/#/register?code=6UZHzm0o)               | 有一次性流量包，每个月有免费的包月体验套餐，有IPLC线路                               |

# Wrangler 初始化指南

首次使用或在新环境部署前，需要先完成以下步骤。

## 1. 安装 Wrangler

（若已全局安装可跳过）

```bash
npm i -g wrangler
# 或
pnpm add -g wrangler
```

## 2. 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开 Cloudflare 授权页，登录并授权后即可。

## 3. 创建 KV 命名空间

本项目使用 KV 存储订阅缓存，需先创建一个 KV 命名空间：

```bash
wrangler kv namespace create SUB_MERGER_KV
```

命令会输出该命名空间的 **id**（一串 32 位字符），请复制保存，下一步会用到。

也可在 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **KV** → **Create namespace** 中创建，创建后在详情页查看 **Namespace ID**。

## 4. 生成并填写 wrangler.toml

```bash
cp wrangler.toml.template wrangler.toml
```

编辑 `wrangler.toml`：

- 在 **`[[kv_namespaces]]`** 中，将 `id = "REPLACE_ME"` 改为上一步得到的 **Namespace ID**。
- 按需修改 **`[vars]`** 中的 `PASSWORD`、`SALT`、`MAGIC` 等（详见下方「环境变量说明」）。

> 提示：`wrangler.toml` 含敏感配置，请勿提交到仓库（建议已加入 `.gitignore`）。

完成以上步骤后，即可进行本地开发或部署到 CF。

---

# 本地开发、调试

1. 安装依赖

```
pnpm install

```

2. 启动本地服务器

```
pnpm run dev
```

# 部署到CF

若尚未完成 Wrangler 初始化，请先阅读上方「Wrangler 初始化指南」。

1. 确认已有 `wrangler.toml`（由 `wrangler.toml.template` 复制并填好 KV id 与变量）

2. 推送到CF

```
pnpm run deploy
```

# 定时任务

默认1小时更新一次，保存到缓存中

通过合并地址拉取时，访问间隔在5分钟之外的，自动读取缓存；在5分钟之内的，强制重新从订阅源拉取

# DB说明

## KV

使用了KV，绑定名必须是`SUB_MERGER_KV`

# 环境变量说明

| 变量名                   | 说明                                   |
| ------------------------ | -------------------------------------- |
| PASSWORD                 | 登录密码                               |
| SALT                     | 密码加密盐值                           |
| TABLENAME                | KV存储表名（前缀）                     |
| MAGIC                    | 订阅链接中的魔法字符串                 |
| UA                       | 请求订阅时使用的User-Agent             |
| BARK_OPENID              | Bark 通知的 openid                     |
| EXCLUDE_PATTERN          | 排除节点的正则表达式                   |
| OTHER_MATCH_PATTERN      | 需要的其他类型节点的正则表达式         |
| FALLBACK_MATCH_PATTERN   | 需要的Fallback节点的正则表达式         |
| YOUTUBE_MATCH_PATTERN    | 需要的YouTube节点的正则表达式          |
| EMBY_MATCH_PATTERN       | 需要的EMBY节点的正则表达式             |
| TWITTER_MATCH_PATTERN    | 需要的Twitter节点的正则表达式          |
| TELEGRAM_MATCH_PATTERN   | 需要的Telegram节点的正则表达式         |
| STEAM_MATCH_PATTERN      | 需要的Steam节点的正则表达式            |
| OTHER_EXCLUDE_PATTERN    | 排除的其他类型节点的正则表达式         |
| FALLBACK_EXCLUDE_PATTERN | 排除的Fallback节点的正则表达式         |
| YOUTUBE_EXCLUDE_PATTERN  | 排除的YouTube节点的正则表达式          |
| EMBY_EXCLUDE_PATTERN     | 排除的EMBY节点的正则表达式             |
| TWITTER_EXCLUDE_PATTERN  | 排除的Twitter节点的正则表达式          |
| TELEGRAM_EXCLUDE_PATTERN | 排除的Telegram节点的正则表达式         |
| STEAM_EXCLUDE_PATTERN    | 排除的Steam节点的正则表达式            |
| INSTANT_REFRESH_INTERVAL | 获取订阅内容不使用缓存的请求间隔（秒） |

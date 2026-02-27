import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

import { SubscriptionType } from "./types/types";
import type { FinalObj } from "./types/types";

import { generatePasswordHash } from "./utils/passwordMgr";
import {
  getSubscribeYaml,
  generateSubscriptionUserInfoString,
} from "./utils/getSubscribeYaml";
import generateProxyConfigYaml from "./utils/generateProxyConfigYaml";
import { getDefaultYaml } from "./data/defaultYmal";

type Bindings = {
  SUB_MERGER_KV: KVNamespace;
  PASSWORD: string;
  SALT: string;
  TABLENAME: string;
  KEY_VERSION: string;
  MAGIC: string;
  UA: string;
  INSTANT_REFRESH_INTERVAL: string;
  NOTIFICATION: {
    BARK_OPENID: string;
  };
  ONETIME_PATTERN: {
    EXCLUDE_PATTERN: string;
    FALLBACK_MATCH_PATTERN: string;
    OTHER_MATCH_PATTERN: string;
    MEDIA_MATCH_PATTERN: string;
    EMBY_MATCH_PATTERN: string;
    TELEGRAM_MATCH_PATTERN: string;
    STEAM_MATCH_PATTERN: string;
    POKER_MATCH_PATTERN: string;
    PROXY_MATCH_PATTERN: string;
    EXIT_MATCH_PATTERN: string;
    TAIGUO_MATCH_PATTERN: string;

    FALLBACK_EXCLUDE_PATTERN: string;
    OTHER_EXCLUDE_PATTERN: string;
    MEDIA_EXCLUDE_PATTERN: string;
    EMBY_EXCLUDE_PATTERN: string;
    TELEGRAM_EXCLUDE_PATTERN: string;
    STEAM_EXCLUDE_PATTERN: string;
    POKER_EXCLUDE_PATTERN: string;
    PROXY_EXCLUDE_PATTERN: string;
    EXIT_EXCLUDE_PATTERN: string;
    TAIGUO_EXCLUDE_PATTERN: string;
  };
  SUBSCRIBE_PATTERN: {
    EXCLUDE_PATTERN: string;
    FALLBACK_MATCH_PATTERN: string;
    OTHER_MATCH_PATTERN: string;
    MEDIA_MATCH_PATTERN: string;
    TELEGRAM_MATCH_PATTERN: string;
    STEAM_MATCH_PATTERN: string;
    POKER_MATCH_PATTERN: string;
    PROXY_MATCH_PATTERN: string;
    EXIT_MATCH_PATTERN: string;
    TAIGUO_MATCH_PATTERN: string;

    FALLBACK_EXCLUDE_PATTERN: string;
    OTHER_EXCLUDE_PATTERN: string;
    MEDIA_EXCLUDE_PATTERN: string;
    TELEGRAM_EXCLUDE_PATTERN: string;
    STEAM_EXCLUDE_PATTERN: string;
    POKER_EXCLUDE_PATTERN: string;
    PROXY_EXCLUDE_PATTERN: string;
    EXIT_EXCLUDE_PATTERN: string;
    TAIGUO_EXCLUDE_PATTERN: string;
  };
};

const app = new Hono<{ Bindings: Bindings }>();

const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    min-height: 100vh;
    padding: 24px;
    color: #111827;
    background:
      radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.14), transparent 55%),
      radial-gradient(circle at 100% 100%, rgba(14, 165, 233, 0.18), transparent 55%),
      #f3f4f6;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }
  
  /* 通用容器（Dashboard 外壳）：Banner → 导航 → 内容 → 按钮 四段式布局 */
  .container {
    background: #ffffff;
    border-radius: 20px;
    box-shadow:
      0 18px 40px rgba(15, 23, 42, 0.12),
      0 0 0 1px rgba(148, 163, 184, 0.25);
    max-width: 1440px;
    width: 100%;
    height: 92vh;
    max-height: 92vh;
    margin: auto;
    overflow: hidden;
    backdrop-filter: blur(14px);
    display: flex;
    flex-direction: column;
    color: #111827;
  }
  
  /* 登录页布局 */
  .auth-page {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .auth-card {
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 60%),
      radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.12), transparent 60%),
      #ffffff;
    border-radius: 20px;
    padding: 32px 28px 28px;
    width: 100%;
    max-width: 420px;
    box-shadow:
      0 18px 40px rgba(15, 23, 42, 0.08),
      0 0 0 1px rgba(209, 213, 219, 0.8);
    position: relative;
    overflow: hidden;
  }
  
  .auth-card::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 19px;
    background: radial-gradient(circle at top, rgba(191, 219, 254, 0.55), transparent 70%);
    opacity: 0.7;
    pointer-events: none;
    mix-blend-mode: screen;
  }
  
  .auth-inner {
    position: relative;
    z-index: 1;
  }
  
  .auth-title {
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    margin: 0 0 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #111827;
  }
  
  .auth-title span.logo-dot {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    background: conic-gradient(from 160deg, #2563eb, #22c55e, #ec4899, #2563eb);
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.5);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #ffffff;
  }
  
  .auth-subtitle {
    margin: 0 0 22px;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #6b7280;
  }
  
  .auth-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    font-size: 0.8rem;
    color: #9ca3af;
  }
  
  .auth-badge {
    padding: 2px 10px;
    border-radius: 999px;
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(22, 163, 74, 0.45);
    color: #166534;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  
  .auth-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
  }
  
  .auth-footer {
    margin-top: 20px;
    font-size: 0.75rem;
    color: #9ca3af;
    text-align: center;
  }
  
  /* 顶部 Banner：固定高度，不参与挤压 */
  .dashboard-header {
    flex-shrink: 0;
    min-height: 72px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 40%, #4f46e5 100%);
    color: #ffffff;
    padding: 1.6rem 2.4rem 1.2rem;
    text-align: left;
    overflow: hidden;
    position: relative;
  }
  
  .dashboard-header::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -10%;
    width: 260px;
    height: 260px;
    background: radial-gradient(circle, rgba(219, 234, 254, 0.35), transparent 60%);
    pointer-events: none;
  }
  
  .dashboard-header h1 {
    margin: 0 0 6px;
    font-size: 1.8rem;
    font-weight: 500;
    position: relative;
    z-index: 1;
  }
  
  .dashboard-header p {
    margin: 0;
    font-size: 0.9rem;
    color: #e5e7eb;
    position: relative;
    z-index: 1;
  }
  
  /* 导航栏：固定区域，不随内容挤压 */
  .tabs {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    background: linear-gradient(to right, #f9fafb, #f3f4f6);
    border-bottom: 1px solid #e5e7eb;
    min-height: 52px;
    z-index: 10;
    margin-bottom: 0.5rem;
    box-shadow: 0 2px 0 rgba(37, 99, 235, 0.06);
  }
  
  .tab {
    flex: 1;
    min-width: 90px;
    padding: 1rem 2rem;
    background: none;
    border: none;
    font-size: 0.95rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    border-bottom: 2px solid transparent;
  }
  
  .tab:hover {
    background: #e5f0ff;
    color: #1d4ed8;
  }
  
  .tab.active {
    color: #1d4ed8;
    background: #ffffff;
    border-bottom: 2px solid #2563eb;
    font-weight: 600;
  }
  
  /* 标签页内容区：占据剩余空间，内部可滚动 */
  .tab-content {
    display: none;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    flex-direction: column;
  }
  
  .tab-content.active {
    display: flex;
    flex-direction: column;
  }
  
  .tab-content-inner {
    flex: 1;
    min-height: 0;
    padding: 2rem;
    overflow-y: auto;
    background: #f9fafb;
  }
  
  .tab-content-header {
    flex-shrink: 0;
    margin-top: 0.75rem;
    padding: 0.75rem 2rem;
    background: linear-gradient(145deg, #f0f2f5 0%, #e8eaef 50%, #f5f6f8 100%);
    border-top: 2px solid rgba(255, 255, 255, 0.95);
    border-bottom: 2px solid #d1d5db;
    display: flex;
    align-items: center;
    min-height: 0;
    box-shadow:
      inset 2px 2px 4px rgba(255, 255, 255, 0.9),
      inset -2px -2px 4px rgba(0, 0, 0, 0.06),
      0 1px 1px rgba(0, 0, 0, 0.04);
  }
  
  .tab-content-header h2 {
    margin: 0;
    border: none;
    padding: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }
  
  .form {
    display: flex;
    flex-direction: column;
  }
  
  input[type="password"], input[type="text"], select {
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.18s ease;
    background: #ffffff;
    color: #111827;
  }
  
  input[type="password"]:focus, input[type="text"]:focus, select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4f46e5 100%);
    color: #ffffff;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.18s ease;
    box-shadow: 0 12px 25px rgba(37, 99, 235, 0.35);
  }
  
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 35px rgba(37, 99, 235, 0.45);
    filter: brightness(1.02);
  }
  
  button:active {
    transform: translateY(0);
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
  }
  
  .error-message {
    color: #b91c1c;
    margin-top: 10px;
    text-align: center;
    display: none;
    padding: 0.5rem 0.75rem;
    background: #fee2e2;
    border-radius: 999px;
    border: 1px solid #fecaca;
    font-size: 0.82rem;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
    border: 1px solid #e5e7eb;
  }
  
  th, td {
    padding: 0.9rem 1rem;
    text-align: left;
    border-bottom: 1px solid #edf0f3;
  }
  
  th {
    background: #f9fafb;
    font-weight: 600;
    color: #4b5563;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  
  tr:hover {
    background: #f3f4ff;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .btn {
    padding: 0.45rem 1rem;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.18s ease;
  }
  
  .btn-delete {
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    color: #ffffff;
  }
  
  .btn-delete:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(248, 113, 113, 0.4);
  }
  
  .btn-add {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: #ffffff;
    margin-right: 0.75rem;
  }
  
  .btn-add:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(74, 222, 128, 0.4);
  }
  
  .btn-save {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff;
  }
  
  .btn-save:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
  }
  
  .btn-copy {
    background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
    color: #ffffff;
    position: relative;
  }
  
  .btn-copy:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(34, 211, 238, 0.4);
  }
  
  .copy-tooltip {
    position: absolute;
    background: #111827;
    color: #f9fafb;
    padding: 0.45rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1000;
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.35);
  }
  
  .copy-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border: 5px solid;
    border-color: #111827 transparent transparent transparent;
  }
  
  .copy-tooltip.show {
    opacity: 1;
  }
  
  h1, h2, h3 {
    color: #111827;
    margin-bottom: 1.5rem;
  }
  
  h2 {
    font-size: 1.4rem;
    font-weight: 600;
    color: #111827;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .subscription-url {
    width: 100%;
    min-width: 200px;
  }
  
  #subscriptionsTable {
    table-layout: fixed;
    width: 100%;
  }
  
  #subscriptionsTable th:nth-child(1) { width: 20%; }
  #subscriptionsTable th:nth-child(2) { width: 15%; }
  #subscriptionsTable th:nth-child(3) { width: 50%; }
  #subscriptionsTable th:nth-child(4) { width: 15%; }
  
  #subscriptionsTable td {
    white-space: nowrap;
    overflow: hidden;
  }
  
  #subscriptionsTable input[type="text"],
  #subscriptionsTable select {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    margin-bottom: 0;
    background: #ffffff;
  }
  
  .config-textarea {
    width: 100%;
    min-height: 400px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    resize: vertical;
    background: #f9fafb;
    transition: all 0.18s ease;
    line-height: 1.5;
    color: #111827;
  }
  
  .config-textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
    background: #ffffff;
  }
  
  .config-label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #111827;
    font-size: 1rem;
  }
  
  .config-item {
    margin-bottom: 2rem;
  }

  /* 合并预览内的子 Tab 切换 */
  .preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  .preview-sub-tabs {
    display: flex;
    gap: 0;
    background: #e5e7eb;
    border-radius: 10px;
    padding: 4px;
    width: fit-content;
  }
  .preview-sub-tab {
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .preview-sub-tab:hover {
    color: #1d4ed8;
  }
  .preview-sub-tab.active {
    background: #ffffff;
    color: #1d4ed8;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }
  .preview-editor-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .preview-copy-btn {
    padding: 0.4rem 0.9rem;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  #previewYamlEditor {
    height: 420px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }

  /* 底部操作按钮：固定区域，不参与挤压 */
  .button-group {
    flex-shrink: 0;
    display: flex;
    gap: 1rem;
    padding: 1.25rem 2rem;
    background: #ffffff;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.04);
  }
  
  .fixed-bottom-buttons {
    flex-shrink: 0;
  }
  
  .link-display {
    background: #f9fafb;
    padding: 1rem;
    border-radius: 12px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    word-break: break-all;
    border: 1px solid #e5e7eb;
    color: #111827;
  }
  
  .scrollable-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 2rem;
    background: #f9fafb;
  }
  
  /* 自定义滚动条 */
  .scrollable-content::-webkit-scrollbar,
  .config-textarea::-webkit-scrollbar {
    width: 8px;
  }
  
  .scrollable-content::-webkit-scrollbar-track,
  .config-textarea::-webkit-scrollbar-track {
    background: #e5e7eb;
    border-radius: 4px;
  }
  
  .scrollable-content::-webkit-scrollbar-thumb,
  .config-textarea::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5f5 0%, #9ca3af 100%);
    border-radius: 4px;
  }
  
  .scrollable-content::-webkit-scrollbar-thumb:hover,
  .config-textarea::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  }
  
  @media (max-width: 768px) {
    body {
      padding: 12px;
    }
    
    .container {
      margin: 0;
      border-radius: 16px;
      height: 96vh;
      max-height: 96vh;
    }
    
    .dashboard-header {
      padding: 1rem 1.25rem;
      min-height: 56px;
    }
    
    .dashboard-header h1 {
      font-size: 1.25rem;
      margin: 0;
    }
    
    .tabs {
      min-height: 48px;
      flex-wrap: wrap;
    }
    
    .tab {
      text-align: center;
      padding: 0.75rem 0.5rem;
      min-width: 72px;
    }
    
    .tab-content-header {
      margin-top: 0.5rem;
      padding: 0.6rem 1.25rem;
    }
    
    .tab-content-header h2 {
      font-size: 1.05rem;
    }
    
    .tab-content-inner,
    .scrollable-content {
      padding: 1rem 1.1rem;
    }
    
    .button-group {
      flex-direction: column;
      padding: 1rem;
    }
    
    table {
      font-size: 0.875rem;
    }
    
    th, td {
      padding: 0.5rem;
    }
    
    .config-textarea {
      min-height: 200px;
      padding: 1.1rem;
    }
  }
`;

app.post("/login", async (c) => {
  const param = await c.req.json();
  console.debug("/login -> req:", param);

  const resultObj = {
    code: 0,
    msg: "success",
  };

  const password = c.env.PASSWORD;
  if (password !== param.password) {
    console.warn(`password not match, [${password}] != [${param.password}]`);
    resultObj.code = 1;
    resultObj.msg = "password not match";
    return c.json(resultObj, 401);
  }

  // 设置cookie
  const authPass = await generatePasswordHash(c.env.PASSWORD, c.env.SALT);
  setCookie(c, "auth", authPass, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 24, // 1天有效期
  });

  // 跳转到dashboard页面
  return c.json(resultObj);
});

app.get("/set", async (c) => {
  const valueStr = JSON.stringify({ foo: "bar" });
  await c.env.SUB_MERGER_KV.put("foo", valueStr);
  return c.text(`set succ, foo=${valueStr}`);
});

app.get("/get", async (c) => {
  const result = await c.env.SUB_MERGER_KV.get("foo", "json");
  console.debug("/get, reuslt=", result);
  await c.env.SUB_MERGER_KV.delete("foo");

  const outputStr = result ? JSON.stringify(result) : "";
  return c.text(`get succ, foo=[${outputStr}]`);
});

// 创建一个中间件来验证用户是否已登录
const authMiddleware = async (c: any, next: any) => {
  const authPass = await generatePasswordHash(c.env.PASSWORD, c.env.SALT);
  const authCookie = getCookie(c, "auth");
  if (authCookie !== authPass) {
    // 如果未登录，重定向到首页
    deleteCookie(c, "auth");
    return c.redirect("/");
  }
  // 如果已登录，继续执行下一个中间件或路由处理器
  await next();
};

// 将中间件应用到需要身份验证的路由
app.use("/dashboard", authMiddleware);
app.use("/api/*", authMiddleware);

async function GetSubYamlWithCache(
  subType: SubscriptionType,
  env: Bindings,
  noCache: boolean = false,
): Promise<FinalObj> {
  console.debug("GetSubYamlWithCache, subType=", subType, "noCache=", noCache);

  const cacheKey = `${env.TABLENAME}:${env.KEY_VERSION}:cacheObj:${subType}`;

  if (!noCache) {
    // 优先从缓存中获取
    console.debug("===== 1. 优先从缓存中获取 ======");
    const subCacheObj = (await env.SUB_MERGER_KV.get(
      cacheKey,
      "json",
    )) as FinalObj;
    if (subCacheObj) {
      console.debug("===== 2. 从缓存中获取成功 ======");
      return subCacheObj;
    }
  }

  const finalObj: FinalObj = {
    subUserInfo: {
      upload: 0,
      download: 0,
      total: 0,
      expire: 9999999999,
    },
    normalYaml: "",
    stashYaml: "",
  };

  // 没有缓存，或者要求不从缓存获取
  const subData = (await env.SUB_MERGER_KV.get(env.TABLENAME, "json")) as any;
  if (!subData) {
    // 没有配置订阅源
    finalObj.normalYaml = "# 没有配置订阅源（通用）";
    finalObj.stashYaml = "# 没有配置订阅源（Stash）";
    return finalObj;
  }

  const allTarget = subData.filter((sub: any) => sub.subType === subType);
  if (allTarget.length === 0) {
    // 没有匹配类型的订阅源
    finalObj.normalYaml = `# 没有配置该类型的订阅源（通用）：${subType}`;
    finalObj.stashYaml = `# 没有配置该类型的订阅源（Stash）：${subType}`;
    return finalObj;
  }

  const [subuserInfo, totalNode] = await getSubscribeYaml(allTarget, env);
  const { normalYaml, stashYaml } = await generateProxyConfigYaml(
    totalNode,
    subType === SubscriptionType.Monthly
      ? env.SUBSCRIBE_PATTERN
      : env.ONETIME_PATTERN,
    env,
  );
  const defaultYaml = await getDefaultYaml(env);
  finalObj.normalYaml =
    `# 最后更新时间（通用）：${dayjs().tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm:ss")}\n\n` +
    normalYaml +
    defaultYaml;
  finalObj.stashYaml =
    `# 最后更新时间（Stash）：${dayjs().tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm:ss")}\n\n` +
    stashYaml +
    defaultYaml;
  finalObj.subUserInfo = subuserInfo;

  // 设置缓存
  await env.SUB_MERGER_KV.put(cacheKey, JSON.stringify(finalObj));

  return finalObj;
}

app.get("/onetime/:magic", async (c) => {
  const magic = c.req.param("magic");
  if (magic !== c.env.MAGIC) {
    return c.text("magic not match", 403);
  }

  console.debug(`/onetime -> User-Agent=[${c.req.header("user-agent")}]`);

  const instantRefreshInterval = c.env.INSTANT_REFRESH_INTERVAL
    ? parseInt(c.env.INSTANT_REFRESH_INTERVAL)
    : 300;
  const currTimeStamp = dayjs().unix();
  const subType = SubscriptionType.TrafficPackage;

  // 获取上次访问接口的时间
  const accessKey = `${c.env.TABLENAME}:${c.env.KEY_VERSION}:access:${subType}`;
  const lastAccessObj = (await c.env.SUB_MERGER_KV.get(
    accessKey,
    "json",
  )) as any;
  const lastAccessTimeStamp = lastAccessObj?.lastAccessTimeStamp || 0;
  const diff = currTimeStamp - lastAccessTimeStamp;
  const noCache = diff < instantRefreshInterval;

  console.debug(
    "GetSubYamlWithCache, subType=",
    subType,
    "noCache=",
    noCache,
    "instantRefreshInterval=",
    instantRefreshInterval,
    "currTimeStamp=",
    currTimeStamp,
    "lastAccessTimeStamp=",
    lastAccessTimeStamp,
    "diff=",
    diff,
  );

  // 获取订阅数据
  const finalObj = await GetSubYamlWithCache(subType, c.env, noCache);

  // 更新访问时间
  const lastAccessStr = JSON.stringify({ lastAccessTimeStamp: currTimeStamp });
  await c.env.SUB_MERGER_KV.put(accessKey, lastAccessStr);

  // 设置流量和使用时长信息
  c.header(
    "subscription-userinfo",
    generateSubscriptionUserInfoString(finalObj.subUserInfo),
  );

  // 是否预览模式（不触发下载）
  const previewParam = c.req.query("preview");
  const isPreview = previewParam === "1" || previewParam === "true";

  // 非预览模式时设置下载文件名
  if (!isPreview) {
    const fileName = encodeURIComponent(`流量包（订阅合并）`);
    c.header("Content-Disposition", `attachment; filename*=UTF-8''${fileName}`);
  }

  // 检查user-agent是否包含Stash
  const userAgent = c.req.header("user-agent") || "";
  if (userAgent.toLowerCase().includes("stash")) {
    // 如果包含Stash，进行节点过滤
    return c.text(finalObj.stashYaml);
  }

  return c.text(finalObj.normalYaml);
});

app.get("/subscribe/:magic", async (c) => {
  const magic = c.req.param("magic");
  if (magic !== c.env.MAGIC) {
    return c.text("magic not match", 403);
  }
  console.debug(`/subscribe -> User-Agent=[${c.req.header("user-agent")}]`);

  const instantRefreshInterval = c.env.INSTANT_REFRESH_INTERVAL
    ? parseInt(c.env.INSTANT_REFRESH_INTERVAL)
    : 300;
  const currTimeStamp = dayjs().unix();
  const subType = SubscriptionType.Monthly;

  // 获取上次访问接口的时间
  const accessKey = `${c.env.TABLENAME}:${c.env.KEY_VERSION}:access:${subType}`;
  const lastAccessObj = (await c.env.SUB_MERGER_KV.get(
    accessKey,
    "json",
  )) as any;
  const lastAccessTimeStamp = lastAccessObj?.lastAccessTimeStamp || 0;
  const diff = currTimeStamp - lastAccessTimeStamp;
  const noCache = diff < instantRefreshInterval;

  console.debug(
    "GetSubYamlWithCache, subType=",
    subType,
    "noCache=",
    noCache,
    "instantRefreshInterval=",
    instantRefreshInterval,
    "currTimeStamp=",
    currTimeStamp,
    "lastAccessTimeStamp=",
    lastAccessTimeStamp,
    "diff=",
    diff,
  );

  // 获取订阅数据
  const finalObj = await GetSubYamlWithCache(subType, c.env, noCache);

  // 更新访问时间
  const lastAccessStr = JSON.stringify({ lastAccessTimeStamp: currTimeStamp });
  await c.env.SUB_MERGER_KV.put(accessKey, lastAccessStr);

  // 设置流量和使用时长信息
  c.header(
    "subscription-userinfo",
    generateSubscriptionUserInfoString(finalObj.subUserInfo),
  );

  // 是否预览模式（不触发下载）
  const previewParam = c.req.query("preview");
  const isPreview = previewParam === "1" || previewParam === "true";

  // 非预览模式时设置下载文件名
  if (!isPreview) {
    const fileName = encodeURIComponent(`包年包月（订阅合并)`);
    c.header("Content-Disposition", `attachment; filename*=UTF-8''${fileName}`);
  }

  // 检查user-agent是否包含Stash
  const userAgent = c.req.header("user-agent") || "";
  if (userAgent.toLowerCase().includes("stash")) {
    // 如果包含Stash，进行节点过滤
    return c.text(finalObj.stashYaml);
  }

  return c.text(finalObj.normalYaml);
});

app.get("/", async (c) => {
  // 检查cookie中的auth状态
  const authPass = await generatePasswordHash(c.env.PASSWORD, c.env.SALT);
  const authCookie = getCookie(c, "auth");
  if (authCookie === authPass) {
    // 如果已经验证通过，直接跳转到dashboard页面
    return c.redirect("/dashboard");
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sub Merger 登录</title>
      <style>${globalStyles}</style>
    </head>
    <body>
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-inner">
            <div class="auth-meta">
              <div class="auth-badge">
                <span class="auth-badge-dot"></span>
                已启用 Cloudflare Worker
              </div>
            </div>
            <h1 class="auth-title">
              <span class="logo-dot">S</span>
              Sub Merger 控制台
            </h1>
            <p class="auth-subtitle">
              统一管理你的 Clash / Stash 订阅源，自动合并规则与自建节点。请输入后台访问密码继续。
            </p>
            <form class="form" id="loginForm">
              <input
                type="password"
                id="password"
                placeholder="输入后台访问密码"
                autocomplete="current-password"
                required
              >
              <button type="submit">进入控制台</button>
              <div id="errorMessage" class="error-message"></div>
            </form>
            <div class="auth-footer">
              Sub-Merger · 运行于 Cloudflare Workers
            </div>
          </div>
        </div>
      </div>
      <script>
        function showError(message) {
          const errorElement = document.getElementById('errorMessage');
          errorElement.textContent = message;
          errorElement.style.display = 'block';
        }

        function hideError() {
          const errorElement = document.getElementById('errorMessage');
          errorElement.style.display = 'none';
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          hideError();
          const password = document.getElementById('password').value;
          try {
            const response = await fetch('/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ password }),
            });
            const data = await response.json();
            if (data.code === 0) {
              window.location.href = '/dashboard';
            } else {
              showError(data.msg);
            }
          } catch (error) {
            console.error('登录出错:', error);
            showError('登录过程中出现错误');
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.get("/dashboard", async (c) => {
  const subData = await c.env.SUB_MERGER_KV.get(c.env.TABLENAME, "json");
  const subscriptions = subData || []; //[{subName: '机场1', subType: '包年/包月', subUrl: 'https://example.com/sub1'}, {subName: '机场2', subType: '流量包', subUrl: 'https://example.com/sub2'}]

  const magic = c.env.MAGIC;
  const suffix = magic ? `/${magic}` : "";

  // 步骤1: 将subscriptions转换为JavaScript数组字符串
  const subscriptionsScript = `
    <script>
      let subscriptions = ${JSON.stringify(subscriptions)};
    </script>
  `;

  // 步骤2: HTML和主要的JavaScript代码
  const mainHtml = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>订阅管理控制台</title>
    <style>${globalStyles}</style>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/loader.js"></script>
    <script>
      // 初始化 Monaco Editor（用于 YAML 配置和自建节点 JSON）
      function initMonacoEditor() {
        if (!window.require) {
          console.error('Monaco loader 未加载');
          return;
        }
        window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' } });
        window.require(['vs/editor/editor.main'], function () {
          const yamlTextarea = document.getElementById('defaultYamlConfig');
          const yamlEditorContainer = document.getElementById('defaultYamlEditor');
          const selfNodeTextarea = document.getElementById('selfNodeConfig');
          const selfNodeEditorContainer = document.getElementById('selfNodeEditor');

          // YAML 编辑器
          if (yamlEditorContainer) {
            const initialYamlValue = yamlTextarea ? yamlTextarea.value : '';
            window.defaultYamlEditor = monaco.editor.create(yamlEditorContainer, {
              value: initialYamlValue,
              language: 'yaml',
              automaticLayout: true,
              theme: 'vs-dark',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            });
          }

          // 自建节点 JSON 编辑器
          if (selfNodeEditorContainer) {
            const initialSelfNodeValue = selfNodeTextarea ? selfNodeTextarea.value : '';
            window.selfNodeEditor = monaco.editor.create(selfNodeEditorContainer, {
              value: initialSelfNodeValue,
              language: 'json',
              automaticLayout: true,
              theme: 'vs-dark',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            });
          }

          // 合并预览 YAML 编辑器（只读）
          const previewEditorContainer = document.getElementById('previewYamlEditor');
          if (previewEditorContainer) {
            window.previewYamlEditor = monaco.editor.create(previewEditorContainer, {
              value: '# 点击下方刷新按钮加载预览',
              language: 'yaml',
              readOnly: true,
              automaticLayout: true,
              theme: 'vs-dark',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            });
            if (typeof updatePreviewEditorValue === 'function') updatePreviewEditorValue();
          }
        });
      }
    </script>
  </head>
  <body>
    <div class="container">
      <div class="dashboard-header">
        <h1>🚀 订阅管理控制台</h1>
      </div>
      
      <div class="tabs">
        <button class="tab active" onclick="switchTab('subscriptions')">📋 订阅管理</button>
        <button class="tab" onclick="switchTab('nodes')">🔧 自建节点</button>
        <button class="tab" onclick="switchTab('yaml')">⚙️ YAML配置</button>
        <button class="tab" onclick="switchTab('preview')">👀 合并预览</button>
        <button class="tab" onclick="switchTab('links')">🔗 订阅链接</button>
      </div>
      
      <!-- 订阅管理标签页 -->
      <div id="subscriptions" class="tab-content active">
        <div class="tab-content-header">
          <h2>订阅源管理</h2>
        </div>
        <div class="tab-content-inner">
          <div style="overflow-x: auto;">
            <table id="subscriptionsTable">
              <thead>
                <tr>
                  <th>机场名称</th>
                  <th>订阅类型</th>
                  <th>订阅链接</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="subscriptionsBody">
              </tbody>
            </table>
          </div>
        </div>
        <div class="button-group fixed-bottom-buttons">
          <button class="btn btn-add" onclick="addRow()">➕ 添加订阅源</button>
          <button class="btn btn-save" onclick="saveChanges()">💾 保存更改</button>
        </div>
      </div>
      
      <!-- 自建节点配置标签页 -->
      <div id="nodes" class="tab-content">
        <div class="tab-content-header">
          <h2>自建节点配置</h2>
        </div>
        <div class="scrollable-content">
          <div class="config-item">
            <label class="config-label" for="selfNodeConfig">
              🖥️ 自建节点配置 (JSON格式)
              <small style="color: #6c757d; font-weight: normal;">配置你的自建代理节点，支持各种协议</small>
            </label>
            <textarea id="selfNodeConfig" class="config-textarea" style="display:none;" placeholder="请输入自建节点的JSON配置，例如：
[
  {
    &quot;name&quot;: &quot;自建节点1&quot;,
    &quot;type&quot;: &quot;ss&quot;,
    &quot;server&quot;: &quot;your-server.com&quot;,
    &quot;port&quot;: 8388,
    &quot;cipher&quot;: &quot;aes-256-gcm&quot;,
    &quot;password&quot;: &quot;your-password&quot;
  },
  {
    &quot;name&quot;: &quot;自建节点2&quot;,
    &quot;type&quot;: &quot;vmess&quot;,
    &quot;server&quot;: &quot;your-server2.com&quot;,
    &quot;port&quot;: 443,
    &quot;uuid&quot;: &quot;your-uuid&quot;,
    &quot;alterId&quot;: 0,
    &quot;cipher&quot;: &quot;auto&quot;,
    &quot;network&quot;: &quot;ws&quot;,
    &quot;ws-opts&quot;: {
      &quot;path&quot;: &quot;/path&quot;,
      &quot;headers&quot;: {
        &quot;Host&quot;: &quot;your-server2.com&quot;
      }
    },
    &quot;tls&quot;: true
  }
]"></textarea>
            <div id="selfNodeEditor" class="config-textarea" style="height: 520px; padding: 0;"></div>
          </div>
        </div>
        <div class="button-group fixed-bottom-buttons">
          <button class="btn btn-save" onclick="saveConfig()">💾 保存节点配置</button>
        </div>
      </div>
      
      <!-- YAML配置标签页 -->
      <div id="yaml" class="tab-content">
        <div class="tab-content-header">
          <h2>默认YAML规则配置</h2>
        </div>
        <div class="scrollable-content">
          <div class="config-item">
            <label class="config-label" for="defaultYamlConfig">
              📝 默认YAML规则配置
              <small style="color: #6c757d; font-weight: normal;">配置DNS、规则提供者和路由规则</small>
            </label>
            <textarea id="defaultYamlConfig" class="config-textarea" style="display:none;" placeholder="请输入默认的YAML规则配置，例如：
dns:
  enable: true
  listen: 0.0.0.0:53
  default-nameserver:
    - 119.29.29.29
    - 223.5.5.5
  nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query
  fallback:
    - https://1.1.1.1/dns-query
    - https://dns.google/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4

rule-providers:
  reject:
    type: http
    behavior: domain
    url: https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt
    path: ./ruleset/reject.yaml
    interval: 86400

  icloud:
    type: http
    behavior: domain
    url: https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt
    path: ./ruleset/icloud.yaml
    interval: 86400

  apple:
    type: http
    behavior: domain
    url: https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt
    path: ./ruleset/apple.yaml
    interval: 86400

  google:
    type: http
    behavior: domain
    url: https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt
    path: ./ruleset/google.yaml
    interval: 86400

  proxy:
    type: http
    behavior: domain
    url: https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt
    path: ./ruleset/proxy.yaml
    interval: 86400

  direct:
    type: http
    behavior: domain
    url: https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt
    path: ./ruleset/direct.yaml
    interval: 86400

  cncidr:
    type: http
    behavior: ipcidr
    url: https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt
    path: ./ruleset/cncidr.yaml
    interval: 86400

rules:
  - RULE-SET,reject,REJECT
  - RULE-SET,icloud,DIRECT
  - RULE-SET,apple,DIRECT
  - RULE-SET,google,节点选择
  - RULE-SET,proxy,节点选择
  - RULE-SET,direct,DIRECT
  - RULE-SET,cncidr,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,节点选择"></textarea>
            <div id="defaultYamlEditor" class="config-textarea" style="height: 520px; padding: 0;"></div>
          </div>
        </div>
        <div class="button-group fixed-bottom-buttons">
          <button class="btn btn-save" onclick="saveConfig()">💾 保存YAML配置</button>
        </div>
      </div>

      <!-- 合并预览标签页 -->
      <div id="preview" class="tab-content">
        <div class="tab-content-header">
          <h2>合并结果预览</h2>
        </div>
        <div class="scrollable-content">
          <div class="config-item">
            <div class="preview-toolbar">
              <div class="preview-sub-tabs">
                <button type="button" class="preview-sub-tab active" id="previewSubTabMonthly" onclick="switchPreviewSubTab('monthly')">📅 包年/包月（通用）</button>
                <button type="button" class="preview-sub-tab" id="previewSubTabOnetime" onclick="switchPreviewSubTab('onetime')">📦 流量包（通用）</button>
              </div>
              <button type="button" class="btn btn-copy preview-copy-btn" onclick="copyPreviewLink(this)" title="复制当前预览对应的订阅链接">
                📋 复制订阅链接
                <span class="copy-tooltip">已复制!</span>
              </button>
            </div>
            <div class="preview-editor-wrap">
              <div id="previewYamlEditor" class="config-textarea" style="padding: 0;"></div>
            </div>
          </div>
        </div>
        <div class="button-group fixed-bottom-buttons">
          <button class="btn btn-save" onclick="refreshPreview()">🔄 刷新预览（强制重新拉取）</button>
        </div>
      </div>
      
      <!-- 订阅链接标签页 -->
      <div id="links" class="tab-content">
        <div class="tab-content-header">
          <h2>合并后的订阅链接</h2>
        </div>
        <div class="tab-content-inner">
          <table id="mergedSubscriptionsTable">
            <thead>
              <tr>
                <th style="width: 20%;">订阅类型</th>
                <th style="width: 60%;">链接地址</th>
                <th style="width: 20%;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>📅 包年/包月</strong></td>
                <td><div class="link-display" id="subscribeLink"></div></td>
                <td>
                  <button class="btn btn-copy" onclick="copyToClipboard('subscribeLink', this)">
                    📋 复制链接
                    <span class="copy-tooltip">已复制到剪贴板!</span>
                  </button>
                </td>
              </tr>
              <tr>
                <td><strong>📦 流量包</strong></td>
                <td><div class="link-display" id="onetimeLink"></div></td>
                <td>
                  <button class="btn btn-copy" onclick="copyToClipboard('onetimeLink', this)">
                    📋 复制链接
                    <span class="copy-tooltip">已复制到剪贴板!</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <script>
      // 当前活动的标签页
      let currentTab = 'subscriptions';
      
      // 标签页切换功能
      function switchTab(tabName) {
        // 隐藏所有标签页内容
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // 移除所有标签的活动状态
        document.querySelectorAll('.tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // 显示选中的标签页内容
        document.getElementById(tabName).classList.add('active');
        
        // 设置对应标签为活动状态
        event.target.classList.add('active');
        
        currentTab = tabName;
      }
      
      function renderTable(newSubscriptions) {
        const currSubData = newSubscriptions || subscriptions
        const tbody = document.getElementById('subscriptionsBody');
        tbody.innerHTML = currSubData.map((sub, index) => 
          '<tr>' +
            '<td><input type="text" value="' + (sub.subName || '') + '" data-field="subName" placeholder="输入机场名称"></td>' +
            '<td>' +
              '<select data-field="subType">' +
                '<option value="包年/包月"' + (sub.subType === '包年/包月' ? ' selected' : '') + '>📅 包年/包月</option>' +
                '<option value="流量包"' + (sub.subType === '流量包' ? ' selected' : '') + '>📦 流量包</option>' +
              '</select>' +
            '</td>' +
            '<td><input type="text" class="subscription-url" value="' + (sub.subUrl || '') + '" data-field="subUrl" placeholder="输入订阅链接URL"></td>' +
            '<td>' +
              '<div class="action-buttons">' +
                '<button class="btn btn-delete" onclick="deleteRow(' + index + ')" title="删除此订阅源">🗑️ 删除</button>' +
              '</div>' +
            '</td>' +
          '</tr>'
        ).join('');
      }

      function addRow() {
        subscriptions.push({subName: '', subType: '包年/包月', subUrl: ''});
        const tbody = document.getElementById('subscriptionsBody');
        const newRowIndex = subscriptions.length - 1;
        const newRow = document.createElement('tr');
        newRow.innerHTML = 
          '<td><input type="text" value="" data-field="subName" placeholder="输入机场名称"></td>' +
          '<td>' +
            '<select data-field="subType">' +
              '<option value="包年/包月" selected>📅 包年/包月</option>' +
              '<option value="流量包">📦 流量包</option>' +
            '</select>' +
          '</td>' +
          '<td><input type="text" class="subscription-url" value="" data-field="subUrl" placeholder="输入订阅链接URL"></td>' +
          '<td>' +
            '<div class="action-buttons">' +
              '<button class="btn btn-delete" onclick="deleteRow(' + newRowIndex + ')" title="删除此订阅源">🗑️ 删除</button>' +
            '</div>' +
          '</td>';
        tbody.appendChild(newRow);
      }

      function deleteRow(index) {
        if (confirm('确定要删除这个订阅源吗？')) {
          const table = document.getElementById('subscriptionsTable').getElementsByTagName('tbody')[0];
          const rows = Array.from(table.rows);
          const newSubscriptions = rows.map((row, idx) => {
            const subName = row.querySelector('[data-field="subName"]').value.trim();
            const subType = row.querySelector('[data-field="subType"]').value;
            const subUrl = row.querySelector('[data-field="subUrl"]').value.trim();
            return { subName, subType, subUrl }
          })
          newSubscriptions.splice(index, 1);
          renderTable(newSubscriptions);
        }
      }

      function isValidUrl(string) {
        try {
          new URL(string);
          return true;
        } catch (_) {
          return false;  
        }
      }

      function saveChanges() {
        const table = document.getElementById('subscriptionsTable').getElementsByTagName('tbody')[0];
        const rows = Array.from(table.rows);
        
        if (rows.length === 0) {
          alert('❌ 错误: 至少需要添加一个订阅源才能保存');
          return;
        }

        let isValid = true;
        let errorMessage = '';

        const newSubscriptions = rows.map((row, index) => {
          const subName = row.querySelector('[data-field="subName"]').value.trim();
          const subType = row.querySelector('[data-field="subType"]').value;
          const subUrl = row.querySelector('[data-field="subUrl"]').value.trim();

          if (subName === '') {
            isValid = false;
            errorMessage += '第 ' + (index + 1) + ' 行: 机场名不能为空\\n';
          }

          if (!isValidUrl(subUrl)) {
            isValid = false;
            errorMessage += '第 ' + (index + 1) + ' 行: 订阅链接必须是一个合法的网址\\n';
          }

          if (subType !== '包年/包月' && subType !== '流量包') {
            isValid = false;
            errorMessage += '第 ' + (index + 1) + ' 行: 订阅类型必须是"包年/包月"或"流量包"\\n';
          }

          return { subName, subType, subUrl };
        });

        if (!isValid) {
          alert('❌ 保存失败，请修正以下错误:\\n\\n' + errorMessage);
          return;
        }

        subscriptions = newSubscriptions;

        const saveButton = event.target;
        const originalText = saveButton.textContent;
        saveButton.textContent = '💾 保存中...';
        saveButton.disabled = true;

        fetch('/api/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscriptions }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.code === 0) {
            alert('✅ 订阅源配置保存成功！');
          } else {
            alert('❌ 保存失败: ' + (data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('保存出错:', error);
          alert('❌ 保存过程中出现网络错误');
        })
        .finally(() => {
          saveButton.textContent = originalText;
          saveButton.disabled = false;
        });
      }

      function updateMergedLinks() {
        const currentUrl = window.location.origin;
        document.getElementById('subscribeLink').textContent = currentUrl + '/subscribe${suffix}';
        document.getElementById('onetimeLink').textContent = currentUrl + '/onetime${suffix}';
      }

      function copyToClipboard(elementId, button) {
        const text = document.getElementById(elementId).textContent;
        navigator.clipboard.writeText(text).then(() => {
          const tooltip = button.querySelector('.copy-tooltip');
          tooltip.classList.add('show');
          setTimeout(() => {
            tooltip.classList.remove('show');
          }, 2000);
        }, (err) => {
          console.error('无法复制文本: ', err);
          // 降级方案：使用传统的复制方法
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            const tooltip = button.querySelector('.copy-tooltip');
            tooltip.classList.add('show');
            setTimeout(() => {
              tooltip.classList.remove('show');
            }, 2000);
          } catch (err) {
            alert('复制失败，请手动复制链接');
          }
          document.body.removeChild(textArea);
        });
      }

      function loadConfig() {
        fetch('/api/config')
          .then(response => response.json())
          .then(data => {
            if (data.code === 0) {
              document.getElementById('selfNodeConfig').value = data.data.selfNodeData || '';
              if (window.selfNodeEditor && typeof window.selfNodeEditor.setValue === 'function') {
                window.selfNodeEditor.setValue(data.data.selfNodeData || '');
              }
              const defaultYaml = data.data.defaultYaml || '';
              const defaultYamlTextarea = document.getElementById('defaultYamlConfig');
              if (defaultYamlTextarea) {
                defaultYamlTextarea.value = defaultYaml;
              }
              if (window.defaultYamlEditor && typeof window.defaultYamlEditor.setValue === 'function') {
                window.defaultYamlEditor.setValue(defaultYaml);
              }
            } else {
              console.error('加载配置失败:', data.msg);
            }
          })
          .catch(error => {
            console.error('加载配置出错:', error);
          });
      }

      function saveConfig() {
        let selfNodeData = '';
        if (window.selfNodeEditor) {
          selfNodeData = window.selfNodeEditor.getValue().trim();
        } else {
          const selfNodeTextarea = document.getElementById('selfNodeConfig');
          selfNodeData = selfNodeTextarea ? selfNodeTextarea.value.trim() : '';
        }
        let defaultYaml = '';
        if (window.defaultYamlEditor) {
          defaultYaml = window.defaultYamlEditor.getValue().trim();
        } else {
          const textarea = document.getElementById('defaultYamlConfig');
          defaultYaml = textarea ? textarea.value.trim() : '';
        }

        // 验证自建节点配置是否为有效JSON（如果不为空）
        if (selfNodeData) {
          try {
            const parsed = JSON.parse(selfNodeData);
            if (!Array.isArray(parsed)) {
              alert('❌ 自建节点配置必须是一个JSON数组');
              return;
            }
          } catch (error) {
            alert('❌ 自建节点配置不是有效的JSON格式:\\n\\n' + error.message);
            return;
          }
        }

        const saveButton = event.target;
        const originalText = saveButton.textContent;
        saveButton.textContent = '💾 保存中...';
        saveButton.disabled = true;

        fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ selfNodeData, defaultYaml }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.code === 0) {
            alert('✅ 配置保存成功！缓存已自动清理，新配置将在下次订阅更新时生效。');
          } else {
            alert('❌ 配置保存失败: ' + (data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('保存配置出错:', error);
          alert('❌ 保存配置过程中出现网络错误');
        })
        .finally(() => {
          saveButton.textContent = originalText;
          saveButton.disabled = false;
        });
      }

      let previewMonthlyYaml = '';
      let previewOnetimeYaml = '';
      let currentPreviewSubTab = 'monthly';

      function updatePreviewEditorValue() {
        if (window.previewYamlEditor) {
          const text = currentPreviewSubTab === 'monthly' ? previewMonthlyYaml : previewOnetimeYaml;
          window.previewYamlEditor.setValue(text || '# 暂无数据，请点击下方刷新按钮');
        }
      }

      function switchPreviewSubTab(type) {
        currentPreviewSubTab = type;
        document.getElementById('previewSubTabMonthly').classList.toggle('active', type === 'monthly');
        document.getElementById('previewSubTabOnetime').classList.toggle('active', type === 'onetime');
        updatePreviewEditorValue();
      }

      function copyPreviewLink(button) {
        const id = currentPreviewSubTab === 'monthly' ? 'subscribeLink' : 'onetimeLink';
        const el = document.getElementById(id);
        const text = el ? el.textContent.trim() : '';
        if (!text) {
          alert('链接未就绪，请稍候再试');
          return;
        }
        navigator.clipboard.writeText(text).then(function () {
          var tip = button.querySelector('.copy-tooltip');
          if (tip) { tip.classList.add('show'); setTimeout(function () { tip.classList.remove('show'); }, 2000); }
        }, function () {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
            var tip = button.querySelector('.copy-tooltip');
            if (tip) { tip.classList.add('show'); setTimeout(function () { tip.classList.remove('show'); }, 2000); }
          } catch (e) { alert('复制失败，请手动复制'); }
          document.body.removeChild(ta);
        });
      }

      function loadPreview(forceRefresh) {
        const noCacheParam = forceRefresh ? '&noCache=1' : '';

        fetch('/api/preview?type=monthly' + noCacheParam)
          .then(response => response.json())
          .then(data => {
            if (data.code === 0) {
              previewMonthlyYaml = data.data.normalYaml || '';
              if (currentPreviewSubTab === 'monthly') updatePreviewEditorValue();
            }
          })
          .catch(error => {
            console.error('加载包年/包月预览出错:', error);
          });

        fetch('/api/preview?type=onetime' + noCacheParam)
          .then(response => response.json())
          .then(data => {
            if (data.code === 0) {
              previewOnetimeYaml = data.data.normalYaml || '';
              if (currentPreviewSubTab === 'onetime') updatePreviewEditorValue();
            }
          })
          .catch(error => {
            console.error('加载流量包预览出错:', error);
          });
      }

      function refreshPreview() {
        loadPreview(true);
      }

      // 页面加载完成后初始化
      renderTable();
      updateMergedLinks();
      loadConfig();
      loadPreview(false);
      window.addEventListener('load', () => {
        try {
          initMonacoEditor();
        } catch (e) {
          console.error('初始化 Monaco 失败:', e);
        }
      });
    </script>
  </body>
  </html>
`;

  // 组合两部分
  return c.html(subscriptionsScript + mainHtml);
});

app.post("/api/save", async (c) => {
  const param = await c.req.json();
  console.debug("/api/save -> req:", param);

  const resultObj = {
    code: 0,
    msg: "success",
  };

  const subscriptions = param.subscriptions;
  if (!subscriptions || subscriptions.length === 0) {
    console.warn("no subscriptions or empty", param);
    resultObj.code = 1;
    resultObj.msg = "no subscriptions or empty";
    return c.json(resultObj, 400);
  }

  // 过滤一下字段前后可能存在的空格/回车
  const realSubscriptions = subscriptions.map((sub: any) => {
    sub.subName = sub.subName.trim();
    sub.subType = sub.subType.trim();
    sub.subUrl = sub.subUrl.trim();
    return sub;
  });

  await c.env.SUB_MERGER_KV.put(
    c.env.TABLENAME,
    JSON.stringify(realSubscriptions),
  );

  return c.json(resultObj, 200);
});

app.get("/api/config", async (c) => {
  const configKey = `${c.env.TABLENAME}:config`;
  const rawConfig = (await c.env.SUB_MERGER_KV.get(configKey, "json")) as any;

  // 获取默认值作为备用
  const { getDefaultSelfNodeData } = await import("./data/selfNodeData");
  const { getDefaultYamlString } = await import("./data/defaultYmal");

  const defaultSelfNodeData = getDefaultSelfNodeData();
  const defaultYamlString = getDefaultYamlString();

  const config = (rawConfig || {}) as any;

  const finalConfig = {
    ...config,
    selfNodeData:
      typeof config.selfNodeData === "string" &&
      config.selfNodeData.trim().length > 0
        ? config.selfNodeData
        : defaultSelfNodeData,
    defaultYaml:
      typeof config.defaultYaml === "string" &&
      config.defaultYaml.trim().length > 0
        ? config.defaultYaml
        : defaultYamlString,
  };

  return c.json({
    code: 0,
    data: finalConfig,
  });
});

app.post("/api/config", async (c) => {
  const param = await c.req.json();
  console.debug("/api/config -> req:", param);

  const resultObj = {
    code: 0,
    msg: "success",
  };

  const { selfNodeData, defaultYaml } = param;

  if (selfNodeData === undefined || defaultYaml === undefined) {
    resultObj.code = 1;
    resultObj.msg = "selfNodeData and defaultYaml are required";
    return c.json(resultObj, 400);
  }

  const config = {
    selfNodeData: selfNodeData.trim(),
    defaultYaml: defaultYaml.trim(),
    updatedAt: new Date().toISOString(),
  };

  const configKey = `${c.env.TABLENAME}:config`;
  await c.env.SUB_MERGER_KV.put(configKey, JSON.stringify(config));

  // 清理缓存，强制重新生成配置
  const cacheKeys = [
    `${c.env.TABLENAME}:${c.env.KEY_VERSION}:cacheObj:${SubscriptionType.Monthly}`,
    `${c.env.TABLENAME}:${c.env.KEY_VERSION}:cacheObj:${SubscriptionType.TrafficPackage}`,
  ];

  for (const key of cacheKeys) {
    await c.env.SUB_MERGER_KV.delete(key);
  }

  return c.json(resultObj, 200);
});

app.get("/api/preview", async (c) => {
  const type = c.req.query("type") || "monthly";
  const noCacheParam = c.req.query("noCache");
  const noCache = noCacheParam === "1" || noCacheParam === "true";

  let subType: SubscriptionType;
  if (type === "onetime") {
    subType = SubscriptionType.TrafficPackage;
  } else {
    subType = SubscriptionType.Monthly;
  }

  const finalObj = await GetSubYamlWithCache(subType, c.env, noCache);

  return c.json({
    code: 0,
    data: {
      normalYaml: finalObj.normalYaml,
      stashYaml: finalObj.stashYaml,
      subUserInfo: finalObj.subUserInfo,
    },
  });
});

// 定时任务
async function scheduled(batch: any, env: Bindings) {
  console.log("===== scheduled begin =====");

  // 不使用缓存获取订阅信息
  let finalYaml = await GetSubYamlWithCache(
    SubscriptionType.TrafficPackage,
    env,
    true,
  );
  finalYaml = await GetSubYamlWithCache(SubscriptionType.Monthly, env, true);

  console.log("===== scheduled end =====");
}

export default {
  fetch: app.fetch,
  scheduled: scheduled,
};

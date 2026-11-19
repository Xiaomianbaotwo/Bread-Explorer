# 面包 AI · Bread AI

入口：主站右上角「更多工具」→「面包 AI」  
文件：`bread-ai/index.html`

## 当前范围

- 19 家服务商入口已登记：DeepSeek、Qwen、Zhipu GLM、Kimi、豆包、千帆、混元、MiniMax、StepFun、SiliconFlow、OpenAI、Claude、Gemini、Grok、Mistral、Groq、OpenRouter、Ollama、vLLM。
- 模型 ID 已改成下拉框，最后一项「自定义模型」可以手填任意模型 ID。
- 对话输入和发送已开放；请求会走 `supabase/functions/ai-proxy/index.ts`。
- 主题中心按 Base / Plus / Max / Ultimate 分档展示；背景漂浮 Emoji、时间问候、烟花已从主站接回。
- 天气效果继续复用主站 `js/21-rain.js` 与 `js/18-winter.js`。

## 真实 AI 请求链路

1. 浏览器 → Supabase Edge Function（`ai-proxy`）→ Cloudflare Worker（`cloudflare/ai-worker.js`）→ AI 模型。
2. 如果 Cloudflare Worker 未配置或调用失败，自动回退：浏览器 → Supabase Edge Function → AI 模型。
3. 不提供“浏览器 → Cloudflare Worker → AI”这条独立路径。

### Edge Function 环境变量

在 Supabase Edge Function Secrets 里配置：

- `CLOUDFLARE_AI_WORKER_URL`：Cloudflare Worker 地址；不填则直接走直连。
- `CLOUDFLARE_AI_SHARED_SECRET`：与 Worker 的 `PROXY_SHARED_SECRET` 相同。
- `AI_KEY_ENCRYPTION_SECRET`：厂商 Key 的 AES-GCM 加密密钥，必须配置，否则不能保存云端 Key。
- Supabase 会提供 `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`；如果没有，需要手动补。

### Cloudflare Worker 环境变量

- `PROXY_SHARED_SECRET`：必须与 Edge 的 `CLOUDFLARE_AI_SHARED_SECRET` 一致。

## 配置与保存

- 顶部语言按钮左侧的 `🧰` 打开模型配置面板；侧边栏点击模型入口只会切换当前服务商。
- 可配置：API Key、模型 ID、上下文长度、最大输出 Token、深度思考开关与强度。
- API Key 默认只写入 `sessionStorage`（关闭标签页即失效）；勾选“记住 Key（仅本机）”后才写入 `localStorage`。
- 有 Supabase 登录会话时，保存配置还会调用 Edge `save_settings`，把非敏感配置和加密后的厂商 Key 写入 `bread_ai_settings`。
- 30 天免验证进入时没有 access token，只能本地保存，不写云端；重新输入密码验证后会恢复云端同步。
- 历史对话先写 `bread-ai-history`，登录会话下同时写 `bread_ai_conversations`。
- 主题、夜间模式、字体、语言在登录会话下同步到 `bread_ai_preferences`；30 天免验证期间没有 access token，只保存在本机。

## 数据库

执行 `sql/20261119-bread-ai.sql`：

- `bread_ai_settings`：用户当前服务商、模型、上下文/输出上限、思考档位、加密后的厂商 Key。
- `bread_ai_conversations`：按 `user_id + conversation_id` 保存历史对话 `messages`。
- `bread_ai_preferences`：主题、夜间/白天模式、字体和语言。
- 三张表都开启 RLS，但没有给 anon/authenticated 直接读写策略；只允许 Edge Function 的 service_role 访问。
- 不要在前端、日志或 Git 里写厂商 Key 明文。

## 门禁流程

1. 主站必须已登录：读取 `bb-current-user` 与 `bb-users`。
2. 进入子站后，再输入当前账号的面包 Key 和密码。
3. 面包 Key 与本地用户对象里的 `key` / `bread_key` 比对。
4. 密码校验走主站同一套 Supabase Auth；成功时把 `access_token` 放到本次 `sessionStorage`，供 Edge 识别用户，不保存密码。
5. 校验通过后本机记住 30 天：只保存 `{ name, ts }` 到 `bread-ai-unlock`，不保存面包 Key 或密码。

> 前端门禁不是服务端授权。真正的权限与 Key 使用必须在 Edge Function 里再次校验；不要只相信前端传来的用户名。

## 本地存储键

- `bread-ai-lang`
- `bread-ai-mode`
- `bread-ai-theme`
- `bread-ai-font-zh` / `bread-ai-font-en`
- `bread-ai-unlock`
- `bread-ai-provider-config`
- `bread-ai-provider-keys-session`（sessionStorage）
- `bread-ai-provider-keys-local`（仅勾选“记住 Key”）
- `bread-ai-active-provider`
- `bread-ai-history` / `bread-ai-active-chat`
- `bread-ai-auth-token`（sessionStorage，仅本次会话）

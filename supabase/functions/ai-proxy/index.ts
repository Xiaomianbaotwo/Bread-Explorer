// =========================================================
// supabase/functions/ai-proxy/index.ts
// 面包 AI 子站 · Supabase Edge Function
//
// 链路：
//   1) 浏览器 → Supabase Edge → Cloudflare Worker → AI 模型
//   2) 浏览器 → Supabase Edge → AI 模型（长链路失败时自动回退）
//
// 说明：
//   - 不提供“浏览器 → Cloudflare Worker → AI”这条独立路径。
//   - 厂商 Key 优先使用请求里的 apiKey；如果当前用户已登录且云端有密文，
//     则可以回退到 bread_ai_settings 里的密文解密结果。
//   - 该函数需要以下 Edge Secrets：
//       CLOUDFLARE_AI_WORKER_URL     可选，不填就直接走直连
//       CLOUDFLARE_AI_SHARED_SECRET  Cloudflare Worker 的共享密钥
//       AI_KEY_ENCRYPTION_SECRET     厂商 Key 的 AES-GCM 加密密钥
// =========================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

// 【固定端点表】避免让前端传 baseUrl 造成 SSRF。
const PROVIDERS: Record<string, { baseUrl: string; protocol: 'openai' | 'anthropic' }> = {
  deepseek:     { baseUrl: 'https://api.deepseek.com/v1', protocol: 'openai' },
  qwen:         { baseUrl: 'https://maas.qianwenaiapi.com/compatible-mode/v1', protocol: 'openai' },
  glm:          { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', protocol: 'openai' },
  kimi:         { baseUrl: 'https://api.moonshot.cn/v1', protocol: 'openai' },
  doubao:       { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', protocol: 'openai' },
  qianfan:      { baseUrl: 'https://qianfan.baidubce.com/v2', protocol: 'openai' },
  hunyuan:      { baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', protocol: 'openai' },
  minimax:      { baseUrl: 'https://api.minimax.cn/v1', protocol: 'openai' },
  stepfun:      { baseUrl: 'https://api.stepfun.com/v1', protocol: 'openai' },
  siliconflow:  { baseUrl: 'https://api.siliconflow.cn/v1', protocol: 'openai' },
  openai:       { baseUrl: 'https://api.openai.com/v1', protocol: 'openai' },
  claude:       { baseUrl: 'https://api.anthropic.com/v1', protocol: 'anthropic' },
  gemini:       { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', protocol: 'openai' },
  grok:         { baseUrl: 'https://api.x.ai/v1', protocol: 'openai' },
  mistral:      { baseUrl: 'https://api.mistral.ai/v1', protocol: 'openai' },
  groq:         { baseUrl: 'https://api.groq.com/openai/v1', protocol: 'openai' },
  openrouter:   { baseUrl: 'https://openrouter.ai/api/v1', protocol: 'openai' },
  ollama:       { baseUrl: 'http://localhost:11434/v1', protocol: 'openai' },
  vllm:         { baseUrl: 'http://localhost:8000/v1', protocol: 'openai' }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function normalizeMessages(value: unknown): Array<{ role: string; content: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: String((item as any).role || 'user'),
      content: String((item as any).content || '')
    }))
    .filter((item) => item.content.trim().length > 0);
}

/** 从 Authorization 里解析当前 Supabase 用户；没有 token 就返回 null。 */
async function getAuthUser(request: Request): Promise<any | null> {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const url = Deno.env.get('SUPABASE_URL') || '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!url || !anon) return null;

  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { 'apikey': anon, 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (_error) {
    return null;
  }
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !serviceRole) return null;
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encryptionKey(): Promise<CryptoKey | null> {
  const secret = Deno.env.get('AI_KEY_ENCRYPTION_SECRET') || '';
  if (!secret) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptKey(plain: string): Promise<string | null> {
  const key = await encryptionKey();
  if (!key) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );
  const cipherBytes = new Uint8Array(cipher);
  const packed = new Uint8Array(iv.length + cipherBytes.length);
  packed.set(iv, 0);
  packed.set(cipherBytes, iv.length);
  return bytesToBase64(packed);
}

async function decryptKey(value: string): Promise<string | null> {
  const key = await encryptionKey();
  if (!key) return null;
  try {
    const packed = base64ToBytes(value);
    const iv = packed.slice(0, 12);
    const cipher = packed.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch (_error) {
    return null;
  }
}

/** Cloudflare Worker 长链路；未配置 URL 或失败时返回 null，让调用方回退直连。 */
async function callCloudflareWorker(payload: any): Promise<{ content: string; route: string } | null> {
  const workerUrl = Deno.env.get('CLOUDFLARE_AI_WORKER_URL') || '';
  const sharedSecret = Deno.env.get('CLOUDFLARE_AI_SHARED_SECRET') || '';
  if (!workerUrl) return null;

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Secret': sharedSecret
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = String(data.content || (data.choices?.[0]?.message?.content) || '');
    if (!content) return null;
    return { content, route: 'cloudflare-worker' };
  } catch (_error) {
    return null;
  }
}

/** 直连模型。任何 4xx/5xx 都抛错，让外层回传真实状态。 */
async function callProviderDirect(payload: any): Promise<{ content: string; route: string }> {
  const provider = PROVIDERS[String(payload.provider || '')];
  if (!provider) throw new Error(`unknown provider: ${payload.provider}`);
  const model = String(payload.model || '').trim();
  if (!model) throw new Error('model is required');
  const apiKey = String(payload.apiKey || '').trim();
  if (!apiKey) throw new Error('apiKey is required');

  const messages = normalizeMessages(payload.messages);
  if (!messages.length) throw new Error('messages are required');

  if (provider.protocol === 'anthropic') {
    const system = messages.filter((item) => item.role === 'system').map((item) => item.content).join('\n');
    const anthropicMessages = messages
      .filter((item) => item.role !== 'system')
      .map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content }));

    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: Number(payload.maxTokens) > 0 ? Number(payload.maxTokens) : 4096,
        messages: anthropicMessages,
        ...(system ? { system } : {})
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
    const content = Array.isArray(data.content)
      ? data.content.map((part: any) => String(part?.text || '')).join('')
      : '';
    if (!content) throw new Error('empty response');
    return { content, route: 'edge-direct' };
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.7,
      ...(Number(payload.maxTokens) > 0 ? { max_tokens: Number(payload.maxTokens) } : {})
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || `HTTP ${response.status}`);
  }
  const content = String(data?.choices?.[0]?.message?.content || data?.content || '');
  if (!content) throw new Error('empty response');
  return { content, route: 'edge-direct' };
}

/** 从云端读取当前用户保存的加密 Key；没有登录或没有记录就返回空。 */
async function getStoredProviderKey(user: any, providerId: string): Promise<string> {
  if (!user || !user.id) return '';
  const admin = adminClient();
  if (!admin) return '';
  try {
    const { data, error } = await admin
      .from('bread_ai_settings')
      .select('key_ciphertext, provider_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data || data.provider_id !== providerId || !data.key_ciphertext) return '';
    return (await decryptKey(data.key_ciphertext)) || '';
  } catch (_error) {
    return '';
  }
}

/** 保存配置 + 加密 Key；没有登录会话时拒绝写库。 */
async function handleSaveSettings(request: Request, user: any): Promise<Response> {
  if (!user || !user.id) return json({ error: 'login required' }, 401);
  const admin = adminClient();
  if (!admin) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, 500);

  const body = await request.json().catch(() => ({}));
  const providerId = String(body.provider || '').trim();
  const model = String(body.model || '').trim();
  if (!providerId || !model) return json({ error: 'provider and model are required' }, 400);

  let cipher: string | null = null;
  if (body.apiKey) {
    cipher = await encryptKey(String(body.apiKey));
    if (!cipher) return json({ error: 'AI_KEY_ENCRYPTION_SECRET not configured' }, 500);
  }

  const patch = {
    user_id: user.id,
    provider_id: providerId,
    model_id: model,
    context_window: Number(body.context) > 0 ? Number(body.context) : null,
    max_output_tokens: Number(body.maxTokens) > 0 ? Number(body.maxTokens) : null,
    reasoning_enabled: !!body.reasoningEnabled,
    reasoning_level: String(body.reasoningLevel || ''),
    ...(cipher ? { key_ciphertext: cipher } : {}),
    updated_at: new Date().toISOString()
  };

  const { error } = await admin
    .from('bread_ai_settings')
    .upsert(patch, { onConflict: 'user_id' });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

/** 保存主题 / 夜间模式 / 字体 / 语言；与模型配置分开建行。 */
async function handleSavePreferences(request: Request, user: any): Promise<Response> {
  if (!user || !user.id) return json({ error: 'login required' }, 401);
  const admin = adminClient();
  if (!admin) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, 500);

  const body = await request.json().catch(() => ({}));
  const patch = {
    user_id: user.id,
    theme_key: String(body.theme || ''),
    mode: String(body.mode || ''),
    font_zh: String(body.fontZh || ''),
    font_en: String(body.fontEn || ''),
    language: String(body.lang || ''),
    updated_at: new Date().toISOString()
  };
  const { error } = await admin
    .from('bread_ai_preferences')
    .upsert(patch, { onConflict: 'user_id' });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

/** 登录后读取云端偏好与模型配置；Key 只返回“是否已配置”，不回传密文或明文。 */
async function handleGetState(user: any): Promise<Response> {
  if (!user || !user.id) return json({ error: 'login required' }, 401);
  const admin = adminClient();
  if (!admin) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, 500);

  const [prefsResult, settingsResult] = await Promise.all([
    admin.from('bread_ai_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('bread_ai_settings').select('*').eq('user_id', user.id).maybeSingle()
  ]);

  if (prefsResult.error) return json({ error: prefsResult.error.message }, 500);
  if (settingsResult.error) return json({ error: settingsResult.error.message }, 500);

  return json({
    ok: true,
    preferences: prefsResult.data || null,
    settings: settingsResult.data
      ? {
          provider: settingsResult.data.provider_id,
          model: settingsResult.data.model_id,
          context: settingsResult.data.context_window,
          maxTokens: settingsResult.data.max_output_tokens,
          reasoningEnabled: settingsResult.data.reasoning_enabled,
          reasoningLevel: settingsResult.data.reasoning_level,
          keyConfigured: !!settingsResult.data.key_ciphertext
        }
      : null
  });
}

async function handleChat(request: Request, user: any): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const providerId = String(body.provider || '').trim();
  const model = String(body.model || '').trim();
  let apiKey = String(body.apiKey || '').trim();

  if (!providerId || !model) return json({ error: 'provider and model are required' }, 400);

  // 如果前端没有带 Key，再尝试从云端密文里取；仍然没有就报错。
  if (!apiKey) apiKey = await getStoredProviderKey(user, providerId);
  if (!apiKey) return json({ error: 'provider apiKey is required' }, 400);

  const payload = {
    provider: providerId,
    model,
    apiKey,
    messages: normalizeMessages(body.messages),
    maxTokens: Number(body.maxTokens) > 0 ? Number(body.maxTokens) : null,
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
    /* 【新增】20261119：思考开关与档位随请求传到代理层；
       具体厂商是否接受该参数，由各厂商接口决定，代理不强行塞不兼容字段。 */
    reasoning: !!body.reasoning,
    reasoningLevel: String(body.reasoningLevel || '')
  };
  if (!payload.messages.length) return json({ error: 'messages are required' }, 400);

  // 第一条路：Supabase Edge → Cloudflare Worker → AI。
  let result = await callCloudflareWorker(payload);
  // 第二条路：长链路失败或未配置时，Supabase Edge 直连 AI。
  if (!result) {
    try {
      result = await callProviderDirect(payload);
    } catch (error) {
      return json({ error: String((error as Error)?.message || error) }, 502);
    }
  }
  if (!result) return json({ error: 'no available route' }, 502);

  // 【可选】登录用户把这一轮对话写进 bread_ai_conversations。
  if (user && user.id && body.conversationId) {
    const admin = adminClient();
    if (admin) {
      const history = normalizeMessages(body.historyMessages);
      const finalMessages = [...history, { role: 'assistant', content: result.content }];
      const { error } = await admin
        .from('bread_ai_conversations')
        .upsert({
          conversation_id: String(body.conversationId),
          user_id: user.id,
          title: String(body.title || ''),
          provider_id: providerId,
          model_id: model,
          messages: finalMessages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,conversation_id' });
      if (error) console.error('save conversation failed:', error.message);
    }
  }

  return json({ ok: true, content: result.content, route: result.route });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';
  const user = await getAuthUser(request);

  try {
    if (action === 'save_settings') return await handleSaveSettings(request, user);
    if (action === 'save_preferences') return await handleSavePreferences(request, user);
    if (action === 'get_state') return await handleGetState(user);
    return await handleChat(request, user);
  } catch (error) {
    return json({ error: String((error as Error)?.message || error) }, 500);
  }
});

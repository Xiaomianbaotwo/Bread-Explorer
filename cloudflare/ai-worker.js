// =========================================================
// cloudflare/ai-worker.js
// 面包 AI 子站 · Cloudflare Worker（长链路中间层）
//
// 只接受 Supabase Edge Function 的服务端调用：
//   Supabase Edge → 本 Worker → AI 模型
//
// 部署环境变量：
//   PROXY_SHARED_SECRET = 与 Supabase Edge 的 CLOUDFLARE_AI_SHARED_SECRET 相同
//
// 注意：不把 Worker 暴露成浏览器直连入口；Worker 会校验共享密钥。
// =========================================================

const PROVIDERS = {
  deepseek:    { baseUrl: 'https://api.deepseek.com/v1', protocol: 'openai' },
  qwen:        { baseUrl: 'https://maas.qianwenaiapi.com/compatible-mode/v1', protocol: 'openai' },
  glm:         { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', protocol: 'openai' },
  kimi:        { baseUrl: 'https://api.moonshot.cn/v1', protocol: 'openai' },
  doubao:      { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', protocol: 'openai' },
  qianfan:     { baseUrl: 'https://qianfan.baidubce.com/v2', protocol: 'openai' },
  hunyuan:     { baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', protocol: 'openai' },
  minimax:     { baseUrl: 'https://api.minimax.cn/v1', protocol: 'openai' },
  stepfun:     { baseUrl: 'https://api.stepfun.com/v1', protocol: 'openai' },
  siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', protocol: 'openai' },
  openai:      { baseUrl: 'https://api.openai.com/v1', protocol: 'openai' },
  claude:      { baseUrl: 'https://api.anthropic.com/v1', protocol: 'anthropic' },
  gemini:      { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', protocol: 'openai' },
  grok:        { baseUrl: 'https://api.x.ai/v1', protocol: 'openai' },
  mistral:     { baseUrl: 'https://api.mistral.ai/v1', protocol: 'openai' },
  groq:        { baseUrl: 'https://api.groq.com/openai/v1', protocol: 'openai' },
  openrouter:  { baseUrl: 'https://openrouter.ai/api/v1', protocol: 'openai' },
  ollama:      { baseUrl: 'http://localhost:11434/v1', protocol: 'openai' },
  vllm:        { baseUrl: 'http://localhost:8000/v1', protocol: 'openai' }
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function normalizeMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: String(item.role || 'user'),
      content: String(item.content || '')
    }))
    .filter((item) => item.content.trim());
}

async function callProvider(payload) {
  const provider = PROVIDERS[String(payload.provider || '')];
  if (!provider) throw new Error(`unknown provider: ${payload.provider}`);
  const model = String(payload.model || '').trim();
  const apiKey = String(payload.apiKey || '').trim();
  if (!model || !apiKey) throw new Error('model and apiKey are required');

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
      ? data.content.map((part) => String(part?.text || '')).join('')
      : '';
    if (!content) throw new Error('empty response');
    return { content, route: 'cloudflare-worker' };
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
  if (!response.ok) throw new Error(data?.error?.message || data?.message || `HTTP ${response.status}`);
  const content = String(data?.choices?.[0]?.message?.content || data?.content || '');
  if (!content) throw new Error('empty response');
  return { content, route: 'cloudflare-worker' };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

    // 只允许 Supabase Edge 携带共享密钥调用。
    const secret = request.headers.get('X-Proxy-Secret') || '';
    if (!env.PROXY_SHARED_SECRET || secret !== env.PROXY_SHARED_SECRET) {
      return json({ error: 'forbidden' }, 403);
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch (_error) {
      return json({ error: 'invalid json' }, 400);
    }

    try {
      const result = await callProvider(payload);
      return json(result);
    } catch (error) {
      return json({ error: String(error?.message || error) }, 502);
    }
  }
};

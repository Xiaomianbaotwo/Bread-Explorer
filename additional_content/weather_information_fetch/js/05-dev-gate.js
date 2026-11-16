/* ============================================================
 * 【新增】05-dev-gate.js —— 天气调试页的主理人门禁
 * 作用：和主站「按 K 键打开开发者面板」用同一把锁 ——
 *       只有 Supabase 用户 id === DEV_UUID 的那个人，才能用这个调试页；
 *       其他人打开只会看到一块遮罩提示，查询按钮点了也不会发请求。
 *
 * 校验方式（不引入 supabase-js，避免多一个依赖）：
 *   1. 从 localStorage 里找主站登录留下的会话（sb-<project-ref>-auth-token）
 *   2. 用 access_token 调主站项目的 /auth/v1/user
 *   3. 比对返回的 user.id 是否等于 DEV_UUID
 *
 * 依赖：04-i18n.js 提供的 T()；没加载也能跑（T 会退化成中文）
 * ============================================================ */
(function () {
  const MAIN_URL = 'https://usvzxosmdtpsynteesls.supabase.co';
  const MAIN_KEY = 'sb_publishable_jwTfelaxB_KG0auuUOaYnw_k6t1UaM0';
  const DEV_UUID = 'b53b3bc6-6126-42a5-8f9c-c80f93196d58';   // 与 js/10-dev.js 里的 DEV_UUID 完全一致

  /* 【修改】文案统一走 04-i18n.js 里的 TG 词表（中英成对维护），不再在这里写裸中文 */
  const TG = (key, fallback) => (typeof window.TG === 'function' ? window.TG(key, fallback) : (fallback === undefined ? key : fallback));
  window.__DEV_GATE_OK = false;

  /* 从 localStorage 里取出主站会话的 access_token */
  function readAccessToken() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k) || k === 'supabase.auth.token') keys.push(k);
      }
      // 优先取主站项目的那个 key
      keys.sort(a => 0); // 保持原序
      const prefer = keys.find(k => k.indexOf('usvzxosmdtpsynteesls') >= 0);
      const target = prefer || keys[0];
      if (!target) return null;
      const raw = localStorage.getItem(target);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj && (obj.access_token || (obj.currentSession && obj.currentSession.access_token)) || null;
    } catch (e) { return null; }
  }

  async function checkIdentity() {
    const token = readAccessToken();
    if (!token) return { ok: false, reason: 'no-session' };
    try {
      const res = await fetch(MAIN_URL + '/auth/v1/user', {
        headers: { apikey: MAIN_KEY, Authorization: 'Bearer ' + token }
      });
      if (!res.ok) return { ok: false, reason: 'token-invalid' };
      const user = await res.json();
      return { ok: !!(user && user.id === DEV_UUID), reason: user && user.id === DEV_UUID ? 'ok' : 'not-owner' };
    } catch (e) {
      return { ok: false, reason: 'network' };
    }
  }

  function showBlockScreen(reason) {
    const tipMap = {
      'no-session': TG('gate.tipNoSession'),
      'token-invalid': TG('gate.tipTokenInvalid'),
      'not-owner': TG('gate.tipNotOwner'),
      'network': TG('gate.tipNetwork')
    };
    const tip = tipMap[reason] || tipMap['not-owner'];

    const mask = document.createElement('div');
    mask.id = 'devGateMask';
    mask.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'background:rgba(28,24,20,.92)', 'backdrop-filter:blur(6px)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:24px', 'box-sizing:border-box'
    ].join(';');
    mask.innerHTML = `
      <div style="max-width:420px; width:100%; background:#fff8ec; color:#3d3226; border-radius:16px;
                  padding:26px 24px; text-align:center; box-shadow:0 18px 50px rgba(0,0,0,.28);">
        <div style="font-size:34px; line-height:1;">🔒</div>
        <div style="font-size:17px; font-weight:700; margin:12px 0 8px;">
          ${TG('gate.ownerOnly')}
        </div>
        <div style="font-size:13px; line-height:1.7; opacity:.85;">${tip}</div>
        <a href="../../index.html" style="display:inline-block; margin-top:18px; padding:9px 20px; border-radius:20px;
           background:#c98a2b; color:#fff; text-decoration:none; font-size:13px; font-weight:600;">
          ${TG('gate.backHome')}
        </a>
      </div>`;
    document.body.appendChild(mask);

    // 双保险：即便遮罩被手动删掉，按钮也点不动
    document.querySelectorAll('button, input, textarea, a[href]').forEach(el => {
      if (el.closest('#devGateMask')) return;
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.55';
    });
  }

  async function run() {
    const r = await checkIdentity();
    window.__DEV_GATE_OK = r.ok;
    if (r.ok) {
      document.documentElement.setAttribute('data-dev-gate', 'ok');
      document.dispatchEvent(new CustomEvent('devGateReady', { detail: { ok: true } }));
    } else {
      document.documentElement.setAttribute('data-dev-gate', 'blocked');
      showBlockScreen(r.reason);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

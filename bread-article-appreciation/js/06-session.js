/* =========================================================
   js/06-session.js
   花事书房 · 面包篮登录态读取（只读）
   【新增】整份文件为本轮新增
   【命名】按附属站 js/ 目录现有最大编号 +1 = 06

   规则：
   1. 只读 localStorage 的 bb-current-user / bb-users，取当前用户名、avatar、bio；
   2. 侧边栏 logo 下方显示当前用户；未登录显示提示；
   3. 登录态首次进入弹一次欢迎层（localStorage 键 read-session-ack 只弹一次）；
   4. 不做密码输入、不读 pwd 字段、不做独立注册登录、不引入 Supabase、不写任何云端数据；
   5. 所有读写都包在 try/catch，localStorage 异常时降级为「未登录」，页面不报错。
   ========================================================= */

(() => {
  'use strict';

  const ACK_KEY = 'read-session-ack';
  const GUEST_TEXT = '未登录 · 请回面包篮登录';
  const LOGIN_URL = '../index.html';

  /* 安全读取：JSON 正常解析则返回值，解析失败按原始字符串处理，任何异常都返回 fallback */
  function readStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      try {
        const parsed = JSON.parse(raw);
        return (parsed === null || parsed === undefined) ? fallback : parsed;
      } catch (e) {
        return raw;
      }
    } catch (e) {
      return fallback;
    }
  }

  /* 读取当前登录态：只取用户名、avatar、bio，不读 pwd；任一环节异常都视为未登录 */
  function readSession() {
    try {
      const rawName = readStored('bb-current-user', null);
      if (typeof rawName !== 'string') return null;
      const name = rawName.trim();
      if (!name || name === 'null' || name === 'undefined') return null;

      const users = readStored('bb-users', null);
      if (!users || typeof users !== 'object' || Array.isArray(users)) return null;

      const user = users[name];
      if (!user || typeof user !== 'object' || Array.isArray(user)) return null;

      return {
        name: name,
        avatar: (typeof user.avatar === 'string') ? user.avatar : '',
        bio: (typeof user.bio === 'string') ? user.bio : ''
      };
    } catch (e) {
      return null;
    }
  }

  /* 在侧边栏 logo 下方插入登录状态（头像 + 当前用户：xxx，签名有值就补一行小字） */
  function renderStatusLine(session) {
    try {
      const header = document.querySelector('.sidebar-header');
      if (!header) return;

      const old = document.getElementById('sessionStatusBox');
      if (old) old.remove();

      const box = document.createElement('div');
      box.id = 'sessionStatusBox';
      box.style.cssText = 'margin-top:12px;';

      const pill = document.createElement('div');
      pill.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;padding:5px 10px;border:1px solid var(--card-border);background:var(--card);border-radius:999px;font-size:12px;font-weight:600;color:var(--ink-soft);';

      if (session) {
        if (session.avatar) {
          const img = document.createElement('img');
          img.src = session.avatar;
          img.alt = '';
          img.style.cssText = 'width:18px;height:18px;border-radius:50%;object-fit:cover;flex-shrink:0;';
          img.onerror = () => { img.remove(); };
          pill.appendChild(img);
        } else {
          const fallback = document.createElement('span');
          fallback.textContent = session.name.charAt(0).toUpperCase();
          fallback.style.cssText = 'width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;';
          pill.appendChild(fallback);
        }

        const text = document.createElement('span');
        text.textContent = '当前用户：' + session.name;
        text.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px;';
        text.title = session.bio ? ('签名：' + session.bio) : ('当前用户：' + session.name);
        pill.appendChild(text);
        box.appendChild(pill);

        if (session.bio) {
          const bio = document.createElement('div');
          bio.textContent = session.bio;
          bio.style.cssText = 'margin-top:6px;padding:0 8px;font-size:11px;color:var(--ink-soft);opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          box.appendChild(bio);
        }
      } else {
        const link = document.createElement('a');
        link.href = LOGIN_URL;
        link.textContent = GUEST_TEXT;
        link.style.cssText = 'color:inherit;text-decoration:none;';
        pill.appendChild(link);
        box.appendChild(pill);
      }

      const clock = header.querySelector('.sidebar-clock');
      if (clock) header.insertBefore(box, clock);
      else header.appendChild(box);
    } catch (e) {
      /* 渲染失败不影响阅读页本身 */
    }
  }

  /* 轻量欢迎层：只在已登录且从未确认过时弹一次 */
  function showWelcomeOnce(session) {
    try {
      if (localStorage.getItem(ACK_KEY) === 'true') return;
    } catch (e) {
      return; // localStorage 不可用时直接不弹，保证页面不报错
    }

    const overlay = document.createElement('div');
    overlay.id = 'sessionWelcomeOverlay';
    overlay.className = 'overlay';
    overlay.style.zIndex = '80';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'width:min(420px,100%);text-align:center;';

    const title = document.createElement('h3');
    title.textContent = '🌸 欢迎回来';

    const desc = document.createElement('p');
    desc.style.cssText = 'font-size:13px;color:var(--ink-soft);line-height:1.9;';
    const line1 = document.createElement('span');
    line1.textContent = '已从面包篮同步登录状态';
    desc.appendChild(line1);
    desc.appendChild(document.createElement('br'));

    const nameEl = document.createElement('strong');
    nameEl.textContent = session.name;
    nameEl.style.color = 'var(--ink)';
    desc.appendChild(nameEl);

    if (session.bio) {
      desc.appendChild(document.createElement('br'));
      const bioEl = document.createElement('span');
      bioEl.textContent = session.bio;
      bioEl.style.fontSize = '12px';
      desc.appendChild(bioEl);
    }

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.style.cssText = 'justify-content:center;margin-top:20px;';

    const btn = document.createElement('button');
    btn.className = 'btn primary';
    btn.type = 'button';
    btn.textContent = '知道了';
    btn.style.width = '100%';
    actions.appendChild(btn);

    modal.appendChild(title);
    modal.appendChild(desc);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.classList.add('show');

    const close = () => {
      overlay.classList.remove('show');
      try { localStorage.setItem(ACK_KEY, 'true'); } catch (e) {}
      setTimeout(() => overlay.remove(), 200);
    };
    btn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', onKey);
      }
    });
  }

  function initSession() {
    try {
      const session = readSession();
      renderStatusLine(session);
      if (session) showWelcomeOnce(session);
    } catch (e) {
      renderStatusLine(null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSession);
  } else {
    initSession();
  }
})();

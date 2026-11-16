/* =========================================================
   01-core.js
   ========================================================= */

const $ = s => document.querySelector(s);

/* 【新增】全局翻译入口占位
   modules/i18n/（01-i18n-core.js + 06-i18n-init.js）加载后会用真实实现覆盖它；
   这里先放一个安全兜底，避免任何模块在 i18n 就绪前调用 _loadT 时报 ReferenceError */
/* 【修改】全局翻译入口占位
   【修改】i18n 已拆到 modules/i18n/ 目录（按模块分文件），由 01-i18n-core.js + 06-i18n-init.js 提供真实实现覆盖它；这里只是兜底。
   ★ 修复：第二个参数只在「是字符串」时才当作兜底文案返回。
   之前写成 `return fallback === undefined ? key : fallback`，
   而 14-loading.js 里有 `_loadT('loading.loadedPercent', { percent: n })` 这种传对象的调用，
   一旦此时 i18n 还没就绪，占位桩会把整个对象返回，界面上直接显示 [object Object]。 */
window._loadT = function (key, fallback) { return (typeof fallback === 'string') ? fallback : key; };

const SUPABASE_CONFIG = {
  URL: 'https://usvzxosmdtpsynteesls.supabase.co', 
  KEY: 'sb_publishable_jwTfelaxB_KG0auuUOaYnw_k6t1UaM0'
};

const sb = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

function showSyncError(msg) {
  const old = document.getElementById('syncErrorModal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'syncErrorModal';
  overlay.className = 'overlay show';
  overlay.style.zIndex = '10000';
  overlay.innerHTML = `
    <div class="modal" style="text-align: center; width: min(360px, 90vw);">
      <h3 style="color: #e74c3c; margin-bottom: 12px; font-size: 18px;">${_loadT('core.syncFailedTitle')}</h3>
      <p style="font-size: 13px; color: var(--ink-soft); margin-bottom: 24px; line-height: 1.6; word-break: break-all;">${msg}</p>
      <div class="modal-actions" style="justify-content: center;">
        <button class="btn primary" onclick="document.getElementById('syncErrorModal').remove()" style="width: 100%;">${_loadT('core.syncFailedOk')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

const store = {
  get(k, d) {
    try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      
      if ((k === 'bb-users' || k.startsWith('bb-sites_') || k.startsWith('bb-history_')) && currentUser) {
        const u = v[currentUser];
        if (!u || !u.user_id) return Promise.resolve();

        return Promise.all([
          sb.from('bread_users').upsert({ 
            username: currentUser, user_id: u.user_id, email: u.email, 
            bread_key: u.key, avatar: u.avatar || '', reg_time: u.regTime || Date.now(),
            weather_city: u.weather_city || '北京', weather_id: u.weather_id || '101010100'
          }),
          sb.from('bread_assets').upsert({ 
            username: currentUser, user_id: u.user_id, points: u.points || 0, 
            vip_type: u.vipType || 'none', 
            vip_expire: u.vipExpire || 0, unlocked_themes: u.unlockedThemes || [], 
            emails: u.emails || [] 
          }),
          sb.from('bread_preferences').upsert({ 
            username: currentUser, user_id: u.user_id, sites: u.sites || [], 
            history: u.history || [], current_theme: u.currentTheme || 'default', 
            settings: { 
              enFont: u.enFont, zhFont: u.zhFont, fwSpeed: u.fwSpeed, fwFreq: u.fwFreq, fwThemeColor: u.fwThemeColor,
              screenShake: u.screenShake, customFonts: u.customFonts || [], 
              lastRpDate: u.lastRpDate || '', rpCount: u.rpCount || 0, 
              day7Sent: u.day7Sent || false, day30Sent: u.day30Sent || false, springSent: u.springSent || false,
              lastPointDate: u.lastPointDate || '',
              clock12h: u.clock12h || false,           // ★ 新增
              weatherRange: u.weatherRange || '24',    // ★ 新增
              lang: (localStorage.getItem('bb-language') || 'zh'),  // 【新增】当前界面语言，供服务端生成邮件时选择中/英
              /* 【新增】VIP 等级 / 星光值（MC 经验条模型：level + point）
                 放在 settings（jsonb）里随用户数据同步，不需要给 bread_preferences 加列；
                 等 20261115-vip-level-system.sql 在 Supabase 执行后，可平滑切到独立的
                 user_vip_progress 表，这里保留的是本地优先的兜底副本。 */
              vipLevel: u.vipLevel || 1,
              vipPoint: u.vipPoint || 0,
              vipAppliedType: u.vipAppliedType || (u.vipType || 'none'),
              vipTaskState: u.vipTaskState || {},
              vipRewardSent: u.vipRewardSent || [],
              vipRewardLog: (u.vipRewardLog || []).slice(-50),
              /* 【新增】个性签名（80 字上限），同样走 settings 同步；
                 后续切到 bread_users.bio 列时只需改这一处与回拉逻辑 */
              bio: u.bio || ''
            }
          })
        ]).catch(err => { 
          console.error('云端同步失败', err); 
          showSyncError(err.message); 
        });
      }
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  }
};

function hashCode(str) { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return hash.toString(16); }
function generateRandomStr(len) { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let res = ''; for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length)); return res; }
function parseTimeStr(timeStr) { timeStr = (timeStr || '').toUpperCase(); if (timeStr === 'LIFE') return 0; const num = parseInt(timeStr, 10); const unit = timeStr.slice(-1); if (unit === 'D') return num; if (unit === 'M') return num * 30; if (unit === 'Q') return num * 90; if (unit === 'Y') return num * 365; return NaN; }
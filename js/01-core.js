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

/* 【新增】20261118 P0：资产同步基线。
   bread_assets 以前是「客户端整行 upsert」：换语言、换字体、打开邮件、改城市
   都会把本地那份可能已经过期的 points/vip_level/star_point/themes 写回云端。
   这里在每次云端拉取后记录一份基线，store.set('bb-users') 只提交「相对基线确实变了」的列。
   没有基线（弱网游客态 / 新设备尚未回拉）时宁可这次不写 assets，也不能拿默认 0/1 覆盖云端。 */
let __bbAssetsBase = null;
let __bbPrefsBase = null;
let __bbUsersWriteChain = Promise.resolve();

function __bbSameArray(a, b) {
  const aa = Array.isArray(a) ? a.slice().sort() : [];
  const bb = Array.isArray(b) ? b.slice().sort() : [];
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
}
window.__bbSameArray = __bbSameArray;

window.__bbSetAssetsBase = function (assets, uid) {
  if (!assets || !uid) return;
  __bbAssetsBase = {
    user_id: uid,
    points: Number(assets.points) || 0,
    vip_type: assets.vip_type || 'none',
    vip_expire: Number(assets.vip_expire) || 0,
    vip_level: Math.min(100, Math.max(1, Number(assets.vip_level) || 1)),
    star_point: Math.max(0, Number(assets.star_point) || 0),
    unlocked_themes: Array.isArray(assets.unlocked_themes) ? assets.unlocked_themes.slice() : []
  };
};

window.__bbSetPrefsBase = function (settings, uid) {
  if (!settings || typeof settings !== 'object' || !uid) return;
  try { __bbPrefsBase = { user_id: uid, settings: JSON.parse(JSON.stringify(settings)) }; }
  catch (e) { __bbPrefsBase = { user_id: uid, settings: Object.assign({}, settings) }; }
};

window.__bbGetAssetsBase = function (uid) {
  return (__bbAssetsBase && __bbAssetsBase.user_id === uid) ? __bbAssetsBase : null;
};

/* 【修改】20261118 P3：服务端 apply_points 成功后同步本地基线，
   避免下一次 syncFromCloud 把这次服务端加/扣分当成“本地待推送”又写一遍。 */
window.__bbSetAssetsPoints = function (points, uid) {
  if (!__bbAssetsBase || (uid && __bbAssetsBase.user_id !== uid)) return;
  __bbAssetsBase.points = Number(points) || 0;
};

/* 【新增】20261118 P3：积分服务端权威模式。
   第一次 apply_points / exchange_star / 购买 RPC 成功后置 true，
   store.set('bb-users') 就不再提交 points 列；SQL 未执行时保持 false，
   旧路径仍按原逻辑整列写，保证前端可以先行部署。 */
window.__bbPointsServerMode = false;

/* 统一的服务端积分变更入口：正数=奖励，负数=消费。
   返回 { ok:true, points } / { ok:false, business:true } / { ok:false, notDeployed:true } */
window.__bbApplyPointsRpc = async function (u, delta, reason, ref) {
  if (!u || !u.user_id || window.isLocalMode || typeof sb === 'undefined' || !sb.rpc) {
    return { ok: false, local: true };
  }
  const n = Math.floor(Number(delta) || 0);
  if (!n) return { ok: true, points: Number(u.points) || 0, amount: 0 };
  let res;
  try {
    res = await sb.rpc('apply_points', {
      p_delta: n,
      p_reason: String(reason || ''),
      p_ref: String(ref || '')
    });
  } catch (e) {
    return { ok: false, network: true, error: e };
  }
  if (res && res.error) {
    const code = res.error.code || '';
    const msg = String(res.error.message || '');
    if (code === 'PGRST202' || /could not find the function|does not exist/i.test(msg)) {
      return { ok: false, notDeployed: true, error: res.error };
    }
    return { ok: false, network: true, error: res.error };
  }
  const d = res && res.data;
  if (!d || d.ok !== true) {
    return { ok: false, business: true, msg: (d && (d.msg || d.message)) || 'point rejected' };
  }
  window.__bbPointsServerMode = true;
  u.points = Number(d.points) || 0;
  window.__bbSetAssetsPoints(u.points, u.user_id);
  return { ok: true, points: u.points, amount: Number(d.amount) || n, period: d.period };
};

window.__bbGetPrefsBase = function (uid) {
  return (__bbPrefsBase && __bbPrefsBase.user_id === uid) ? (__bbPrefsBase.settings || {}) : {};
};

/* 【新增】20261118 P0：区分「没有基线」和「基线是空对象」，
   sites/history 的兜底 upsert 在没有基线时必须跳过，否则会把 settings 写成默认值。 */
window.__bbHasPrefsBase = function (uid) {
  return !!(__bbPrefsBase && __bbPrefsBase.user_id === uid);
};

function __bbApplyAssetsPatch(patch) {
  if (!patch || !patch.user_id) return;
  if (!__bbAssetsBase || __bbAssetsBase.user_id !== patch.user_id) {
    __bbAssetsBase = { user_id: patch.user_id, points: 0, vip_type: 'none', vip_expire: 0, vip_level: 1, star_point: 0, unlocked_themes: [] };
  }
  if (patch.points !== undefined) __bbAssetsBase.points = Number(patch.points) || 0;
  if (patch.vip_type !== undefined) __bbAssetsBase.vip_type = patch.vip_type || 'none';
  if (patch.vip_expire !== undefined) __bbAssetsBase.vip_expire = Number(patch.vip_expire) || 0;
  if (patch.vip_level !== undefined) __bbAssetsBase.vip_level = Number(patch.vip_level) || 1;
  if (patch.star_point !== undefined) __bbAssetsBase.star_point = Number(patch.star_point) || 0;
  if (patch.unlocked_themes !== undefined) __bbAssetsBase.unlocked_themes = Array.isArray(patch.unlocked_themes) ? patch.unlocked_themes.slice() : [];
}

const store = {
  get(k, d) {
    try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  },
  set(k, v, opts) {
    try {
      localStorage.setItem(k, JSON.stringify(v));

      if (!currentUser) return Promise.resolve();

      /* 【新增】20261119：纯本地外观偏好（如背景 emoji 漂浮方向）
         不需要整表云端 upsert；避免一次下拉切换触发云同步 + realtime 回拉，
         造成页面短时间卡死。 */
      if (opts && opts.skipCloud) return Promise.resolve();

      /* 【修改】以前这里把 `bb-sites_` / `bb-history_` 的数组也当成「用户表」去取 v[currentUser]：
         数组按用户名取属性永远 undefined，于是每次都提前 return —— 面包篮与搜索历史的改动
         从来没被推上云端（bread_preferences.sites 一直是空的）。现在按 key 分流：
         bb-users 走整表同步，sites / history 走各自的单列推送。 */
      if (k.startsWith('bb-sites_'))   return pushSitesToCloud(Array.isArray(v) ? v : []);
      if (k.startsWith('bb-history_')) return pushHistoryToCloud(Array.isArray(v) ? v : []);

      if (k === 'bb-users') {
        const u = v[currentUser];
        if (!u || !u.user_id) return Promise.resolve();

        /* 【修改】20261118 P0：不再无条件整行 upsert bread_assets。
           只提交相对云端基线发生变化的列；没有任何变化就完全不碰 bread_assets。
           这样换语言 / 换字体 / 打开邮件 / 改城市这类纯偏好动作，不会再把旧积分、
           旧 VIP 等级、旧星光写回云端。 */
        const forceAssets = !!(opts && opts.forceAssets);
        const write = () => {
          const base = window.__bbGetAssetsBase(u.user_id);
          /* 【修改】20261118 P0：没有云端基线时（弱网游客态 / 新设备还没回拉），
             任何 bread_users / bread_preferences / bread_assets 写入都可能拿默认值覆盖云端。
             只有注册这种显式 forceAssets 的建行场景才允许在无基线时写。 */
          if (!base && !forceAssets) {
            console.warn('[store] 云端基线尚未建立，跳过本次用户数据写入');
            return Promise.resolve();
          }
          const patch = { username: currentUser, user_id: u.user_id };
          let changed = false;
          const setCol = (col, val) => { patch[col] = val; changed = true; };
          /* 【修改】20261118 P0：本地字段缺失（老版本快照 / 新设备装配前）不能当成 0 / none / []。
             缺什么就用云端基线里的原值，避免一次普通保存把云端资产写成默认值。 */
          const hasVal = v => v !== undefined && v !== null;
          const points = hasVal(u.points) && isFinite(Number(u.points)) ? Number(u.points) : (base ? base.points : 0);
          const vipType = (hasVal(u.vipType) && u.vipType) ? u.vipType : (base ? base.vip_type : 'none');
          const vipExpire = hasVal(u.vipExpire) && isFinite(Number(u.vipExpire)) ? Number(u.vipExpire) : (base ? base.vip_expire : 0);
          const vipLevel = hasVal(u.vipLevel) && Number(u.vipLevel) > 0
            ? Math.min(100, Math.max(1, Number(u.vipLevel)))
            : (base ? base.vip_level : 1);
          const starPoint = hasVal(u.vipPoint) && isFinite(Number(u.vipPoint))
            ? Math.max(0, Number(u.vipPoint))
            : (base ? base.star_point : 0);
          const themes = Array.isArray(u.unlockedThemes)
            ? u.unlockedThemes
            : (base ? base.unlocked_themes : []);
          /* 【修改】20261118 P3：默认不再从客户端提交 points。
             积分只能由服务端 apply_points / 购买 / 兑换 RPC 修改；
             只有本地模式、注册建行（points 必须 0）或显式 legacyPoints 才允许带 points。 */
          const includePoints = !!(opts && opts.legacyPoints) || !!window.isLocalMode || forceAssets;
          const pointsForWrite = forceAssets ? 0 : points;

          if (forceAssets) {
            /* 【修改】20261118 P3：新用户建行也不从客户端写 points，交给数据库默认值 0；
               配合列级权限，authenticated 对 points 没有 INSERT/UPDATE 权限。 */
            setCol('vip_type', vipType);
            setCol('vip_expire', vipExpire);
            setCol('unlocked_themes', themes);
            setCol('vip_level', vipLevel);
            setCol('star_point', starPoint);
          } else if (base) {
            if (includePoints && pointsForWrite !== base.points) setCol('points', pointsForWrite);
            if (vipType !== base.vip_type) setCol('vip_type', vipType);
            if (vipExpire !== base.vip_expire) setCol('vip_expire', vipExpire);
            if (vipLevel !== base.vip_level) setCol('vip_level', vipLevel);
            if (starPoint !== base.star_point) setCol('star_point', starPoint);
            if (!__bbSameArray(themes, base.unlocked_themes)) setCol('unlocked_themes', themes);
          }
          /* 没有 base 时：这次不写 assets，避免默认值覆盖云端。
             注册流程用 opts.forceAssets 显式建行；正常登录由 startCloudSync 先建 base。 */

          const prefsRow = prefsRowFromUser(u);
          const jobs = [
            sb.from('bread_users').upsert({
              username: currentUser, user_id: u.user_id, email: u.email,
              bread_key: u.key, avatar: u.avatar || '', reg_time: u.regTime || Date.now(),
              weather_city: u.weather_city || '北京', weather_id: u.weather_id || '101010100'
            }),
            sb.from('bread_preferences').upsert(prefsRow)
          ];
          if (changed) jobs.splice(1, 0, sb.from('bread_assets').upsert(patch));

          return Promise.all(jobs).then(() => {
            if (changed) __bbApplyAssetsPatch(patch);
            window.__bbSetPrefsBase(prefsRow.settings, u.user_id);
          }).catch(err => {
            console.error('云端同步失败', err);
            showSyncError(err.message);
          });
        };

        /* 【新增】串行化 bb-users 写入：并发 upsert 到达顺序不确定，
           旧快照后到会把新值盖掉。排队后至少保证「后发起的写」最后落库。 */
        __bbUsersWriteChain = __bbUsersWriteChain.then(write, write);
        return __bbUsersWriteChain;
      }
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  }
};

/* =========================================================
   【新增】面包篮 / 搜索历史 的云端推送与回拉（20261117）
   ---------------------------------------------------------
   背景：`bread_preferences` 一行同时存放 sites、history、settings。
   以前只有「整表同步」一条路径，且 sites 的写入分支是坏的（详见 store.set 注释）。
   这里补上两条单列推送路径，并把 settings 的拼装抽成 prefsRowFromUser()，
   避免出现「改一处忘一处」的字段漂移。
   ========================================================= */

/* 当前登录用户在 bb-users 里的那条记录（必须拿到 user_id 才算可同步） */
function currentUserRecord() {
  if (!currentUser) return null;
  let users = null;
  try { users = (typeof getUsersDB === 'function') ? getUsersDB() : store.get('bb-users', {}); }
  catch (e) { users = null; }
  const u = users && users[currentUser];
  return (u && u.user_id) ? u : null;
}

/* 统一的 bread_preferences 行构造；over 可覆盖 sites / history / current_theme
   【注意】sites / history 采用「有值才带」策略：
   bb-users 触发的整表 upsert 不能顺手把 sites 写成 []，否则会把云端面包篮清空。
   没有本地数据时干脆不带这个键，PostgREST 的 upsert 就不会动这一列。 */
function prefsRowFromUser(u, over) {
  over = over || {};
  const local = key => { try { return store.get(key, undefined); } catch (e) { return undefined; } };
  /* 【修改】20261118 P0：settings 以「云端基线 + 本地已定义字段」合并。
     换设备/清缓存时 u 可能还没有 vipTaskState / starExchange / bio，
     以前会写成 {} / {} / ""，把云端任务进度、兑换额度、签名整片清空。
     现在缺字段就保留 base 里的原值，只有 u 明确带了该字段（包括显式清空）才覆盖。 */
  const base = (typeof window.__bbGetPrefsBase === 'function') ? window.__bbGetPrefsBase(u.user_id) : {};
  const pick = (key, fallback) => (u[key] !== undefined ? u[key] : (base[key] !== undefined ? base[key] : fallback));
  const row = {
    username: currentUser, user_id: u.user_id,
    current_theme: over.current_theme !== undefined ? over.current_theme : (u.currentTheme || base.current_theme || 'default'),
    settings: {
      enFont: pick('enFont', 'default'), zhFont: pick('zhFont', 'default'), fwSpeed: pick('fwSpeed', 1.0), fwFreq: pick('fwFreq', 1.0), fwThemeColor: pick('fwThemeColor', true),
      screenShake: pick('screenShake', true),
      customFonts: u.customFonts !== undefined ? (u.customFonts || []) : (base.customFonts || []),
      lastRpDate: pick('lastRpDate', ''), rpCount: pick('rpCount', 0),
      day7Sent: pick('day7Sent', false), day30Sent: pick('day30Sent', false), springSent: pick('springSent', false),
      lastPointDate: pick('lastPointDate', ''),
      clock12h: pick('clock12h', false),
      weatherRange: pick('weatherRange', '24'),
      lang: (localStorage.getItem('bb-language') || 'zh'),
      /* VIP 等级 / 星光值（MC 经验条模型：level + point），jsonb 内存放，不额外建表 */
      vipLevel: Math.min(100, Math.max(1, Number(u.vipLevel) || Number(base.vipLevel) || 1)),
      vipPoint: Math.max(Number(u.vipPoint) || 0, Number(base.vipPoint) || 0),
      vipAppliedType: u.vipAppliedType || base.vipAppliedType || (u.vipType || 'none'),
      vipTaskState: u.vipTaskState !== undefined ? u.vipTaskState : (base.vipTaskState || {}),
      /* 【新增】20261118：积分兑星光的每日额度也上云，换设备才不会「今日已兑」被重置 */
      starExchange: u.starExchange !== undefined ? u.starExchange : (base.starExchange || {}),
      vipRewardSent: u.vipRewardSent !== undefined ? (u.vipRewardSent || []) : (base.vipRewardSent || []),
      vipRewardLog: u.vipRewardLog !== undefined ? (u.vipRewardLog || []).slice(-50) : (base.vipRewardLog || []).slice(-50),
      bio: u.bio !== undefined ? u.bio : (base.bio || '')
    }
  };
  const sitesVal = over.sites !== undefined ? over.sites
    : (u.sites !== undefined ? u.sites : local(`bb-sites_${currentUser}`));
  if (sitesVal !== undefined && sitesVal !== null) row.sites = sitesVal;
  const histVal = over.history !== undefined ? over.history
    : (u.history !== undefined ? u.history : local(`bb-history_${currentUser}`));
  if (histVal !== undefined && histVal !== null) row.history = histVal;
  return row;
}

/* 「本设备有未推送的改动」标记：在 11-init.js 回拉时用它决定谁覆盖谁 */
function sitesDirtyKey() { return `bb-sites-dirty_${currentUser}`; }
function markSitesDirty() { try { localStorage.setItem(sitesDirtyKey(), '1'); } catch (e) {} }
function clearSitesDirty() { try { localStorage.removeItem(sitesDirtyKey()); } catch (e) {} }
function isSitesDirty() { try { return localStorage.getItem(sitesDirtyKey()) === '1'; } catch (e) { return false; } }

/* 面包篮推送：
   1) 云端若已建好 rpc_upsert_sites —— 由服务端算容量并裁决（权威）；
   2) 函数还没建（PGRST202 / schema cache / does not exist）—— 自动降级为直接 upsert，
      此时容量只能靠前端预检（06-sites.js），不影响功能可用。 */
function pushSitesToCloud(list) {
  const u = currentUserRecord();
  if (!u) return Promise.resolve();
  markSitesDirty();

  const fallbackUpsert = () => {
    /* 【修改】20261118 P0：没有云端偏好基线时不要走整行 upsert，
       否则 prefsRowFromUser 会用默认 settings 覆盖云端字体/任务/签名。 */
    if (typeof window.__bbHasPrefsBase === 'function' && !window.__bbHasPrefsBase(u.user_id)) {
      console.warn('[sites] 偏好基线尚未建立，本次只保留本地面包篮');
      return Promise.resolve();
    }
    return sb.from('bread_preferences')
    .upsert(prefsRowFromUser(u, { sites: list }))
    .then(res => {
      if (res && res.error) throw res.error;
      clearSitesDirty();
      if (typeof updateSiteCounter === 'function') updateSiteCounter(list.length);
      return res;
    })
    .catch(err => {
      console.warn('面包篮云端同步失败（已保留本地未同步标记）', err && err.message ? err.message : err);
      showSyncError((err && err.message) ? err.message : String(err));
    });
  };

  if (typeof sb.rpc !== 'function') return fallbackUpsert();

  return sb.rpc('rpc_upsert_sites', { p_user_id: u.user_id, p_sites: list })
    .then(res => {
      if (res.error) {
        const msg = String(res.error.message || '') + ' ' + String(res.error.code || '');
        if (/rpc_upsert_sites|schema cache|does not exist|not found|PGRST202/i.test(msg)) return fallbackUpsert();
        throw res.error;
      }
      const r = res.data || {};
      /* 服务端判超限：以云端列表为准回拉，保持前后端一致（本地刚加的那条会被撤掉） */
      if (r.ok === false) {
        if (typeof showToast === 'function') showToast(_loadT('sites.limitReached', { limit: r.limit }), '🧺');
        return pullSitesFromCloud();
      }
      clearSitesDirty();
      if (typeof updateSiteCounter === 'function') updateSiteCounter(r.used, r.limit);
      return res;
    })
    .catch(err => {
      console.warn('rpc_upsert_sites 调用异常，转为直接 upsert', err);
      return fallbackUpsert();
    });
}

/* 以云端列表覆盖本地（服务端拒绝写入、或多端冲突时使用） */
function pullSitesFromCloud() {
  const u = currentUserRecord();
  if (!u) return Promise.resolve();
  return sb.from('bread_preferences').select('sites').eq('user_id', u.user_id).maybeSingle()
    .then(res => {
      if (res.error) throw res.error;
      const cloud = (res.data && res.data.sites) || [];
      try { localStorage.setItem(`bb-sites_${currentUser}`, JSON.stringify(cloud)); } catch (e) {}
      sites = cloud;
      clearSitesDirty();
      if (typeof renderSites === 'function') renderSites();
      if (typeof updateSiteCounter === 'function') updateSiteCounter(cloud.length);
    })
    .catch(err => { console.warn('回拉面包篮失败', err && err.message ? err.message : err); });
}

/* 搜索历史推送（结构简单，不需要 RPC 裁决） */
function pushHistoryToCloud(list) {
  const u = currentUserRecord();
  if (!u) return Promise.resolve();
  /* 【修改】20261118 P0：没有偏好基线时只保留本地历史，不能拿默认 settings 整行覆盖云端。 */
  if (typeof window.__bbHasPrefsBase === 'function' && !window.__bbHasPrefsBase(u.user_id)) {
    return Promise.resolve();
  }
  return sb.from('bread_preferences')
    .upsert(prefsRowFromUser(u, { history: list }))
    .then(res => {
      if (res && res.error) throw res.error;
      return res;
    })
    .catch(err => { console.warn('搜索历史同步失败', err && err.message ? err.message : err); });
}

function hashCode(str) { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return hash.toString(16); }function generateRandomStr(len) { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let res = ''; for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length)); return res; }
function parseTimeStr(timeStr) { timeStr = (timeStr || '').toUpperCase(); if (timeStr === 'LIFE') return 0; const num = parseInt(timeStr, 10); const unit = timeStr.slice(-1); if (unit === 'D') return num; if (unit === 'M') return num * 30; if (unit === 'Q') return num * 90; if (unit === 'Y') return num * 365; return NaN; }
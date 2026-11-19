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
    unlocked_themes: Array.isArray(assets.unlocked_themes) ? assets.unlocked_themes.slice() : [],
    user_level: Math.min(60, Math.max(1, Number(assets.user_level) || 1)),
    user_bake: Math.max(0, Number(assets.user_bake) || 0)
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

/* 【新增】20261119 P4：服务端改完星光/等级/会员后同步基线，
   避免下一次 store.set 把本地旧值当成“待推送资产”。 */
window.__bbSetAssetsVip = function (level, point, uid) {
  if (!__bbAssetsBase || (uid && __bbAssetsBase.user_id !== uid)) return;
  __bbAssetsBase.vip_level = Math.min(100, Math.max(1, Number(level) || 1));
  __bbAssetsBase.star_point = Math.max(0, Number(point) || 0);
};

window.__bbSetAssetsVipStatus = function (type, expire, uid) {
  if (!__bbAssetsBase || (uid && __bbAssetsBase.user_id !== uid)) return;
  __bbAssetsBase.vip_type = type || 'none';
  __bbAssetsBase.vip_expire = Number(expire) || 0;
};

window.__bbSetAssetsLevel = function (level, bake, uid) {
  if (!__bbAssetsBase || (uid && __bbAssetsBase.user_id !== uid)) return;
  __bbAssetsBase.user_level = Math.min(60, Math.max(1, Number(level) || 1));
  __bbAssetsBase.user_bake = Math.max(0, Number(bake) || 0);
};

/* 【新增】20261119 P4：星光值服务端入口。
   本地先按原逻辑乐观更新，这里负责让服务端真正落库并校正基线。
   【修改】20261119：优先调用 apply_star_v2，让 Lv100 满级后的溢出星光值自动转积分；
   未部署 v2 时回退原 apply_star，保证旧环境仍然可用。
   返回 { ok:true, level, point, points, overflowPoints } / { ok:false, notDeployed|business|network }。 */
window.__bbApplyStarRpc = async function (u, amount, source) {
  if (!u || !u.user_id || window.isLocalMode || typeof sb === 'undefined' || !sb.rpc) {
    return { ok: false, local: true };
  }
  const n = Math.floor(Number(amount) || 0);
  if (!n) return { ok: true, local: true };

  let res;
  try {
    res = await sb.rpc('apply_star_v2', { p_amount: n, p_source: String(source || '') });
  } catch (e) {
    return { ok: false, network: true, error: e };
  }

  /* v2 未部署时回退旧函数；业务拒绝 / 网络错误不在这里盲目回退。 */
  if (res && res.error) {
    const code = res.error.code || '';
    const msg = String(res.error.message || '');
    if (code === 'PGRST202' || /could not find the function|does not exist/i.test(msg)) {
      try {
        res = await sb.rpc('apply_star', { p_amount: n, p_source: String(source || '') });
      } catch (e) {
        return { ok: false, network: true, error: e };
      }
    }
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
    return { ok: false, business: true, duplicate: !!(d && d.duplicate), msg: (d && (d.msg || d.message)) || 'star rejected' };
  }

  u.vipLevel = Math.min(100, Math.max(1, Number(d.level) || Number(u.vipLevel) || 1));
  u.vipPoint = Math.max(0, Number(d.point) || 0);
  window.__bbSetAssetsVip(u.vipLevel, u.vipPoint, u.user_id);

  /* v2 会返回转换溢出后的权威积分；旧函数没有 points，保持本地原值。 */
  const overflowPoints = Math.max(0, Number(d.overflowPoints) || 0);
  if (d.points !== undefined && d.points !== null) {
    u.points = Math.max(0, Number(d.points) || 0);
    if (typeof window.__bbSetAssetsPoints === 'function') window.__bbSetAssetsPoints(u.points, u.user_id);
  }

  return {
    ok: true,
    level: u.vipLevel,
    point: u.vipPoint,
    points: u.points,
    overflowStar: Math.max(0, Number(d.overflowStar) || 0),
    overflowPoints,
    levelUp: d.levelUp || []
  };
};

/* 【新增】20261119 P4：红包雨 VIP 服务端入口。 */
window.__bbApplyRedpacketVipRpc = async function (u, level, days) {
  if (!u || !u.user_id || window.isLocalMode || typeof sb === 'undefined' || !sb.rpc) {
    return { ok: false, local: true };
  }

  let res;
  try {
    res = await sb.rpc('apply_redpacket_vip', { p_level: Number(level), p_days: Number(days) });
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
    return { ok: false, business: true, duplicate: !!(d && d.duplicate), msg: (d && (d.msg || d.message)) || 'vip rejected' };
  }

  u.vipType = d.type || u.vipType;
  u.vipExpire = Number(d.expire) || 0;
  window.__bbSetAssetsVipStatus(u.vipType, u.vipExpire, u.user_id);
  return { ok: true, type: u.vipType, expire: u.vipExpire };
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
  if (patch.user_level !== undefined) __bbAssetsBase.user_level = Number(patch.user_level) || 1;
  if (patch.user_bake !== undefined) __bbAssetsBase.user_bake = Number(patch.user_bake) || 0;
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

      /* 【修改】20261119：skipCloud 仍用于确实不需要云端的临时外观值；
         主题设置与布局改走下面的 prefsOnly 轻量通道。 */
      if (opts && opts.skipCloud) return Promise.resolve();

      /* 【修改】以前这里把 `bb-sites_` / `bb-history_` 的数组也当成「用户表」去取 v[currentUser]：
         数组按用户名取属性永远 undefined，于是每次都提前 return —— 面包篮与搜索历史的改动
         从来没被推上云端（bread_preferences.sites 一直是空的）。现在按 key 分流：
         bb-users 走整表同步，sites / history 走各自的单列推送。 */
      if (k.startsWith('bb-sites_'))   return pushSitesToCloud(Array.isArray(v) ? v : []);
      if (k.startsWith('bb-history_')) return pushHistoryToCloud(Array.isArray(v) ? v : []);

      /* 【新增】20261119：只同步 bread_preferences.settings 的轻量通道。
         布局编辑、Emoji 方向/频率、烟花时段、冬日雪效都走这里；
         不碰 bread_users / bread_assets，避免一次外观设置触发整行资产写入。 */
      if (k === 'bb-users' && opts && opts.prefsOnly) {
        const u = v[currentUser];
        if (!u || !u.user_id) return Promise.resolve();
        if (typeof window.__bbHasPrefsBase === 'function' && !window.__bbHasPrefsBase(u.user_id)) {
          console.warn('[store] 偏好基线尚未建立，跳过本次 settings 写入');
          return Promise.resolve();
        }
        const prefsRow = prefsRowFromUser(u, { settingsOnly: true });
        return sb.from('bread_preferences').upsert(prefsRow).then(({ error }) => {
          if (error) throw error;
          window.__bbSetPrefsBase(prefsRow.settings, u.user_id);
        }).catch(err => {
          console.error('偏好同步失败', err);
          showSyncError(err && err.message ? err.message : String(err));
        });
      }

      if (k === 'bb-users') {
        const u = v[currentUser];
        if (!u || !u.user_id) return Promise.resolve();

        /* 【修改】20261119 P4：不再用 store.set 直接写 bread_assets 的任何数值资产。
           原因：P4 已撤销 authenticated 对 points / star_point / vip_* / user_level /
           user_bake 的 INSERT/UPDATE；这些字段现在只能由服务端 RPC 修改。
           这里只保留两个安全的云端动作：
           1) bread_users / bread_preferences 正常同步；
           2) unlocked_themes 过渡期仍允许直写（面包币、等级邮件仍在本地解锁）。
           积分、星光、VIP、面包等级分别走 apply_points / apply_star /
           apply_redpacket_vip / user_add_bake。 */
        const forceAssets = !!(opts && opts.forceAssets);
        const write = () => {
          const base = window.__bbGetAssetsBase(u.user_id);
          /* 没有云端基线时（弱网游客态 / 新设备还没回拉），不写用户资产；
             注册这种显式建行场景交给 init_user_assets RPC 建行。 */
          if (!base && !forceAssets) {
            console.warn('[store] 云端基线尚未建立，跳过本次用户数据写入');
            return Promise.resolve();
          }

          /* 主题是 P4 过渡期唯一还允许客户端直写的资产列。
             缺字段时用基线，避免一次普通保存把云端主题写成空数组。 */
          const themes = Array.isArray(u.unlockedThemes)
            ? u.unlockedThemes
            : (base ? base.unlocked_themes : []);
          const themeChanged = !!base && !__bbSameArray(themes, base.unlocked_themes);

          const prefsRow = prefsRowFromUser(u);
          const jobs = [
            sb.from('bread_users').upsert({
              username: currentUser, user_id: u.user_id, email: u.email,
              bread_key: u.key, avatar: u.avatar || '', reg_time: u.regTime || Date.now(),
              weather_city: u.weather_city || '北京', weather_id: u.weather_id || '101010100'
            }),
            sb.from('bread_preferences').upsert(prefsRow)
          ];
          /* 只更新主题列，绝不碰积分 / 星光 / VIP / 等级列。 */
          if (themeChanged) {
            jobs.splice(1, 0, sb.from('bread_assets')
              .update({ unlocked_themes: themes })
              .eq('user_id', u.user_id));
          }

          return Promise.all(jobs).then(() => {
            if (themeChanged) __bbApplyAssetsPatch({ user_id: u.user_id, unlocked_themes: themes });
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
      enFont: pick('enFont', 'default'), zhFont: pick('zhFont', 'default'),
      /* 【修改】20261119：烟花速度 / 频率上限放宽到 25，保存时统一夹取。 */
      fwSpeed: Math.min(25, Math.max(0.1, Number(pick('fwSpeed', 1)) || 1)),
      fwFreq: Math.min(25, Math.max(0.1, Number(pick('fwFreq', 1)) || 1)),
      fwThemeColor: pick('fwThemeColor', true),
      /* 【新增】20261119：主题中心的烟花时段也上云；以前只放本地，换设备会丢。 */
      fwTimeMode: pick('fwTimeMode', 'both'),
      /* 【新增】20261119：背景 Emoji 方向 / 频率上云，换设备保持一致。 */
      emojiDir: pick('emojiDir', 'up'),
      emojiFreq: Math.min(25, Math.max(0.5, Number(pick('emojiFreq', 1)) || 1)),
      /* 【新增】20261119：问候语 / 心情短句是否跟随主题。 */
      homeTextFollowTheme: pick('homeTextFollowTheme', false),
      /* 【新增】20261119：冬日雪效参数上云；这些以前只在 bb-users 本地字段里。
         上限统一放宽到 25。 */
      winterSnowSpeed: Math.min(25, Math.max(0.2, Number(pick('winterSnowSpeed', 1)) || 1)),
      winterSnowWind: Math.min(25, Math.max(0, Number(pick('winterSnowWind', 0.5)) || 0)),
      winterSnowDir: pick('winterSnowDir', 'right'),
      winterSnowDensity: Math.min(25, Math.max(0.2, Number(pick('winterSnowDensity', 1)) || 1)),
      winterSnowForce: pick('winterSnowForce', false),
      /* 【新增】20261119：雨效参数上云（绿野仙踪 / 春日花信 / 盛夏海岸 / 秋日私语）。 */
      rainSpeed: Math.min(25, Math.max(0.2, Number(pick('rainSpeed', 1)) || 1)),
      rainWind: Math.min(25, Math.max(0, Number(pick('rainWind', 0.5)) || 0)),
      rainDir: pick('rainDir', 'right'),
      rainDensity: Math.min(25, Math.max(0.2, Number(pick('rainDensity', 1)) || 1)),
      rainForce: pick('rainForce', false),
      /* 【新增】20261119：网页声音开关（雨声 / 雷声）也保存到云端；默认开启。 */
      rainSound: pick('rainSound', true),
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
      /* 【修改】20261119 P4：不再对本地/云端取最大值。
           bread_assets.star_point 已是权威值；取 max 会把开发者重置、
           重复领取回滚后的旧本地高值永久留在 settings 里。 */
      vipPoint: (u.vipPoint !== undefined && u.vipPoint !== null)
        ? Math.max(0, Number(u.vipPoint) || 0)
        : Math.max(0, Number(base.vipPoint) || 0),
      vipAppliedType: u.vipAppliedType || base.vipAppliedType || (u.vipType || 'none'),
      vipTaskState: u.vipTaskState !== undefined ? u.vipTaskState : (base.vipTaskState || {}),
      /* 【新增】20261118：积分兑星光的每日额度也上云，换设备才不会「今日已兑」被重置 */
      starExchange: u.starExchange !== undefined ? u.starExchange : (base.starExchange || {}),
      vipRewardSent: u.vipRewardSent !== undefined ? (u.vipRewardSent || []) : (base.vipRewardSent || []),
      vipRewardLog: u.vipRewardLog !== undefined ? (u.vipRewardLog || []).slice(-50) : (base.vipRewardLog || []).slice(-50),
      bio: u.bio !== undefined ? u.bio : (base.bio || '')
    }
  };
  /* 【新增】20261119：布局字段只在「本地有布局」或「云端已有布局」时才写，
     避免普通字体/语言设置保存时顺手写入空布局，把另一台设备的布局清掉。
     bread_preferences.settings 是 jsonb，不需要额外加表列。 */
  if (u.layout !== undefined || base.layout !== undefined) {
    row.settings.layout = (u.layout !== undefined ? u.layout : base.layout) || {};
  }
  if (u.layoutWidgets !== undefined || Array.isArray(base.layoutWidgets)) {
    row.settings.layoutWidgets = Array.isArray(u.layoutWidgets)
      ? u.layoutWidgets
      : (Array.isArray(base.layoutWidgets) ? base.layoutWidgets : []);
  }
  if (u.layoutUniformScale !== undefined || base.layoutUniformScale !== undefined) {
    row.settings.layoutUniformScale = u.layoutUniformScale !== undefined
      ? !!u.layoutUniformScale
      : !!base.layoutUniformScale;
  }
  /* 【新增】20261119：轻量 settings 通道不带 sites / history，
     避免只改一个 Emoji 设置却把本地可能过期的面包篮整列写回去。 */
  if (over.settingsOnly) return row;
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
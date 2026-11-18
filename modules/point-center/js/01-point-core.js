/* =========================================================
   modules/point-center/js/01-point-core.js
   积分中心 · 核心（常量 / 上下文读写 / 积分加减 / 连续签到）

   【新增】20261119：
     - 侧栏新增「积分中心」入口（排在面包等级下面），展示获取积分的地方
     - 原来首页那个 🎁 入口改叫「积分兑换商城」，负责花积分（买主题/兑星光）
     - 本文件只管积分本身，任务与签到在 03-point-task.js
   ========================================================= */

const POINT_ENTRY_ID = 'btnPointEntry';
const POINT_OVERLAY_ID = 'pointOverlay';

/* 签到与连续签到奖励（可在 02-point-config.js 读云端覆盖） */
const P_CHECKIN = { points: 10, streak7: 100, streak30: 500, makeupCost: 50, fullAward: 300, fullNeed: 28 };   /* makeupCost 补签消耗；fullAward 月度全勤奖；fullNeed 全勤所需签到天数 */

/* 默认积分任务（云端没配置时兜底）
   event 用的是行为事件名，进度直接读面包等级记的同一份计数器 */
const P_DEFAULT_TASKS = [
  { id: 'p_d_open',    cycle: 'day',  event: 'open',        need: 1,  points: 10 },
  { id: 'p_d_search',  cycle: 'day',  event: 'search',      need: 5,  points: 20 },
  { id: 'p_d_basket',  cycle: 'day',  event: 'basketAdd',   need: 2,  points: 10 },
  { id: 'p_d_profile', cycle: 'day',  event: 'profileView', need: 1,  points: 5  },
  { id: 'p_d_suggest', cycle: 'day',  event: 'suggest',     need: 1,  points: 20 },
  { id: 'p_w_search',  cycle: 'week', event: 'search',      need: 30, points: 60 },
  { id: 'p_w_theme',   cycle: 'week', event: 'themeShop',   need: 5,  points: 30 },
  { id: 'p_w_suggest', cycle: 'week', event: 'suggest',     need: 3,  points: 40 },
  /* 【新增】20261119：每月任务（每月 1 号刷新）
     【修改】20261118 P2：删除第二组重复的 p_m_search / p_m_basket / p_m_suggest，
     同一个 id 出现两次会让 02-point-config 把两组都渲染出来。保留第一组阈值。 */
  { id: 'p_m_search',  cycle: 'month', event: 'search',    need: 150, points: 200 },
  { id: 'p_m_basket',  cycle: 'month', event: 'basketAdd', need: 30,  points: 150 },
  { id: 'p_m_suggest', cycle: 'month', event: 'suggest',   need: 10,  points: 120 }
];

function pPad2(n) { return n < 10 ? '0' + n : '' + n; }
function pDayKey(d) { d = d || new Date(); return `${d.getFullYear()}-${pPad2(d.getMonth() + 1)}-${pPad2(d.getDate())}`; }
/* 【新增】20261119：每月任务周期 key（每月 1 号刷新） */
function pMonthKey(d) { d = d || new Date(); return `${d.getFullYear()}-${pPad2(d.getMonth() + 1)}`; }
function pWeekKey(d) {
  d = d || new Date();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (t.getDay() + 6) % 7;            /* 周一 = 0 */
  t.setDate(t.getDate() - day);
  return `${t.getFullYear()}-${pPad2(t.getMonth() + 1)}-${pPad2(t.getDate())}`;
}
function pT(key, opts) {
  let s = (typeof T === 'function') ? T(key, opts) : key;
  if (s === key && opts) {
    Object.keys(opts).forEach(k => { s = s.replace(new RegExp('{{' + k + '}}', 'g'), opts[k]); });
  }
  return s;
}

/* 当前用户 + 保存（与面包等级同一套写法） */
function pRec() {
  try {
    if (typeof currentUserRecord === 'function') {
      const u = currentUserRecord();
      if (u) return { u };
    }
  } catch (e) { /* 继续走下面的兜底 */ }
  try {
    if (typeof currentUser !== 'string' || !currentUser) return null;
    const db = (typeof getUsersDB === 'function') ? getUsersDB() : store.get('bb-users', null);
    const u = db && db[currentUser];
    return u ? { u } : null;
  } catch (e) { return null; }
}

function pSave(u, legacyPoints) {
  if (!u) return;
  const db = (typeof getUsersDB === 'function') ? getUsersDB() : store.get('bb-users', null);
  if (!db || typeof db !== 'object') return;
  if (typeof currentUser !== 'string' || !currentUser) return;
  db[currentUser] = u;
  /* 【修改】20261118 P3：默认不写 points；只有 SQL 未部署时的兼容回退才带 legacyPoints。 */
  store.set('bb-users', db, { legacyPoints: !!legacyPoints });
}

/* 【修改】20261118 P3：积分变动统一走服务端 apply_points。
   本地先乐观更新，RPC 成功后用服务端余额覆盖；SQL 未执行时回落旧的本地+整列写。 */
function pAddPoints(u, amount, reason, ref) {
  const n = Math.floor(Number(amount) || 0);
  if (!n) return Number(u.points) || 0;
  const oldPts = Number(u.points) || 0;
  u.points = Math.max(0, oldPts + n);
  pSave(u);
  const paint = () => {
    const el = document.getElementById('pointsDisplay');
    if (el) el.textContent = u.points;
  };
  paint();

  const commit = window.__bbApplyPointsRpc;
  if (typeof commit !== 'function') {
    pSave(u, true);
    return u.points;
  }
  Promise.resolve(commit(u, n, reason || 'legacy', ref || '')).then(d => {
    if (d && d.ok) {
      u.points = Number(d.points) || 0;
      pSave(u);
      paint();
      return;
    }
    if (d && d.notDeployed) {
      /* SQL 还没执行：保持旧行为，把本地值整列写回云端 */
      pSave(u, true);
      return;
    }
    if (d && d.business) {
      /* 服务端拒绝（重复领取/每日上限/余额不足）：回滚本地乐观值 */
      u.points = oldPts;
      pSave(u);
      paint();
    }
  }).catch(() => { /* 网络失败保留本地乐观值，下一次同步会以云端为准 */ });
  return u.points;
}

/* 积分中心自己的状态：任务领取标记 / 签到日期 / 连续天数 */
function pState(u) {
  const day = pDayKey(), week = pWeekKey();
  if (!u.pointState || typeof u.pointState !== 'object') u.pointState = {};
  const s = u.pointState;
  if (!s.d || s.d.key !== day) s.d = { key: day, cl: {} };
  if (!s.w || s.w.key !== week) s.w = { key: week, cl: {} };
  /* 【新增】20261119：每月任务容器 */
  if (!s.m || s.m.key !== pMonthKey()) s.m = { key: pMonthKey(), cl: {} };
  if (!s.d.cl) s.d.cl = {};
  if (!s.w.cl) s.w.cl = {};
  if (!s.m.cl) s.m.cl = {};
  if (typeof s.streak !== 'number') s.streak = 0;
  if (typeof s.last !== 'string') s.last = '';
  if (typeof s.streak7At !== 'number') s.streak7At = 0;
  if (typeof s.streak30At !== 'number') s.streak30At = 0;
  return s;
}

/* pAddPoints 已在上方改为服务端积分入口，旧同步版本不再保留。 */

/* =========================================================
   modules/bread-level/js/01-bread-core.js
   面包等级 · 核心（公式 / 上下文 / 记录读写 / 视图）

   等级 1~60，每 5 级一档，升一级需要 40 × 档位序号；
   成长值叫「烘焙度」，与 VIP 的星光值完全独立。
   云端配置由 02-bread-config.js 提供，任务逻辑在 03-bread-task.js。
   ========================================================= */
  const MAX_LEVEL = 60;
  const GROUP = 5;
  const UNIT = 40;

  const ENTRY_ID = 'btnBreadEntry';
  const OVERLAY_ID = 'breadOverlay';

  /* 积分 → 烘焙度 兑换档位（烘焙度比星光值便宜，所以给的更多；不做每日上限） */
  const EXCHANGE_PKGS = [
    { id: 'b1',   cost: 5,    bake: 12    },
    { id: 'b2',   cost: 50,   bake: 130   },
    { id: 'b3',   cost: 250,  bake: 680   },
    { id: 'b4',   cost: 1000, bake: 2800  },
    { id: 'b5',   cost: 5000, bake: 15000 }
  ];

  /* 默认任务（云端没配置时兜底） */
  const DEFAULT_TASKS = [
    { id: 'd_open',    cycle: 'day',  event: 'open',        need: 1,  bake: 5  },
    { id: 'd_search',  cycle: 'day',  event: 'search',      need: 5,  bake: 8  },
    { id: 'd_basket',  cycle: 'day',  event: 'basketAdd',   need: 2,  bake: 6  },
    { id: 'd_profile', cycle: 'day',  event: 'profileView', need: 1,  bake: 3  },
    { id: 'w_search',  cycle: 'week', event: 'search',      need: 30, bake: 40 },
    { id: 'w_theme',   cycle: 'week', event: 'themeShop',   need: 5,  bake: 25 },
    { id: 'w_redeem',  cycle: 'week', event: 'redeemUse',   need: 3,  bake: 30 },
    { id: 'w_suggest', cycle: 'week', event: 'suggest',     need: 3,  bake: 60 },
    /* 【新增】20261119：每月任务（每月 1 号刷新） */
    { id: 'm_search',  cycle: 'month', event: 'search',      need: 150, bake: 120 },
    { id: 'm_theme',   cycle: 'month', event: 'themeShop',   need: 20,  bake: 100 },
    { id: 'm_open',    cycle: 'month', event: 'open',        need: 60,  bake: 80 },
    { id: 'm_suggest', cycle: 'month', event: 'suggest',     need: 10,  bake: 150 }
    /* 【修改】20261118 P2：删除第二组重复的 m_search / m_theme / m_open，
       同一个 id 出现两次会让任务列表同一任务渲染两遍。保留第一组阈值。 */
  ];

  /* 默认签到积分（云端没配置时兜底） */
  const DEFAULT_CHECKIN = 5;

  /* ---------- 工具 ---------- */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dayKey(d) { d = d || new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
  /* 【新增】20261119：每月任务的周期 key（每月 1 号刷新） */
  function monthKey(d) { d = d || new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; }
  function weekKey(d) {
    d = d || new Date();
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = (t.getDay() + 6) % 7;
    t.setDate(t.getDate() - day + 3);
    const firstThu = new Date(t.getFullYear(), 0, 4);
    const diff = Math.round((t - firstThu) / 86400000);
    return `${t.getFullYear()}-W${Math.floor(diff / 7) + 1}`;
  }

  function T(key, opts) {
    return (typeof _loadT === 'function') ? _loadT(key, opts) : key;
  }

  function needOf(level) {
    const lv = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
    if (lv >= MAX_LEVEL) return 0;
    return UNIT * Math.ceil(lv / GROUP);
  }

  function capOf(level) {
    const lv = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
    return lv >= MAX_LEVEL ? UNIT * Math.ceil(MAX_LEVEL / GROUP) : needOf(lv);
  }

  function basketBonus(level) {
    const lv = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
    return Math.floor(lv / 10) * 5;
  }

  function dailyPointBonus(level) {
    const lv = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
    return Math.floor(lv / 10) * 5;
  }

  function titleOf(level) {
    const lv = Number(level) || 1;
    if (lv >= 60) return 'bread.title60';
    if (lv >= 50) return 'bread.title50';
    if (lv >= 40) return 'bread.title40';
    if (lv >= 30) return 'bread.title30';
    if (lv >= 20) return 'bread.title20';
    if (lv >= 10) return 'bread.title10';
    return null;
  }

  function speedFactor(level) {
    const lv = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
    return Math.max(2300, 3500 - lv * 20);
  }

  /* ---------- 用户记录 ---------- */
  function rec() {
    if (typeof currentUserRecord === 'function') {
      const u = currentUserRecord();
      return u ? { u } : null;
    }
    return null;
  }

  /* 【修改】20261118：必须把改过的那份 user 对象写回用户表。
     store.get / getUsersDB 每次都是重新 JSON.parse 出的新对象，
     只写 store.set('bb-users', 同一份旧数据) 等于什么都没保存 ——
     签到标记、烘焙度、任务计数全丢，表现就是「点了没反应，过一会儿又突然加上了」。
     这里和 VIP 任务模块的 save(u) 采用同一套写法。 */
  function save(u, legacyPoints) {
    if (!u) return;
    const db = (typeof getUsersDB === 'function') ? getUsersDB() : store.get('bb-users', null);
    if (!db || typeof db !== 'object') return;
    if (typeof currentUser !== 'string' || !currentUser) return;
    db[currentUser] = u;
    /* 【修改】20261118 P3：默认不写 points；SQL 未部署时用 legacyPoints 回退。 */
    store.set('bb-users', db, { legacyPoints: !!legacyPoints });
  }

  function stateOf(u) {
    const day = dayKey(), week = weekKey(), month = monthKey();
    if (!u.breadState || typeof u.breadState !== 'object') u.breadState = {};
    const s = u.breadState;

    if (!s.d || s.d.key !== day) s.d = { key: day, c: {}, cl: {} };
    if (!s.w || s.w.key !== week) s.w = { key: week, c: {}, cl: {} };
    /* 【新增】20261119：每月任务容器 */
    if (!s.m || s.m.key !== month) s.m = { key: month, c: {}, cl: {} };
    if (!s.d.c) s.d.c = {};
    if (!s.d.cl) s.d.cl = {};
    if (!s.w.c) s.w.c = {};
    if (!s.w.cl) s.w.cl = {};
    if (!s.m.c) s.m.c = {};      /* 【新增】20261119：每月任务计数 / 领取标记 */
    if (!s.m.cl) s.m.cl = {};
    if (typeof s.tokens !== 'number') s.tokens = 0;
    if (!s.levels) s.levels = {};
    if (typeof s.checkin !== 'string') s.checkin = '';
    if (!s.dailyKey || s.dailyKey !== day) s.dailyKey = '';
    return s;
  }

  /* 【修改】20261119：支持每月任务容器 m（month = 每月任务 / week = 每周任务 / 其它 = 每日任务） */
  function boxOf(s, cycle) { return cycle === 'month' ? s.m : (cycle === 'week' ? s.w : s.d); }

  /* ---------- 视图 ---------- */
  function getView(u) {
    u = u || (rec() && rec().u);
    if (!u) return null;
    const level = Math.max(1, Math.min(MAX_LEVEL, Number(u.userLevel) || 1));
    const bake = Math.max(0, Number(u.userBake) || 0);
    const cap = capOf(level);
    const s = stateOf(u);
    return {
      level, bake, cap,
      need: needOf(level),
      isMax: level >= MAX_LEVEL,
      percent: cap ? Math.min(100, Math.round((bake / cap) * 100)) : 100,
      basketBonus: basketBonus(level),
      dailyPoints: dailyPointBonus(level),
      tokens: s.tokens || 0,
      title: titleOf(level) ? T(titleOf(level)) : '',
      checkedIn: s.checkin === dayKey(),
      checkinBake: checkinBake(),
      tasks: tasksNow().map(task => {
        const box = boxOf(s, task.cycle);
        return {
          id: task.id, cycle: task.cycle, need: task.need, bake: task.bake,
          done: Math.min(task.need, Number(box.c[task.event]) || 0),
          claimed: !!box.cl[task.id]
        };
      })
    };
  }
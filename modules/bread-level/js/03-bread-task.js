/* =========================================================
   modules/bread-level/js/03-bread-task.js
   面包等级 · 任务 / 签到 / 每日积分 / 积分兑烘焙度

   任务门槛与奖励读 bread_task_config（没有配置就用 DEFAULT_TASKS 兜底）；
   签到发的也是烘焙度（经验），不是积分。
   ========================================================= */
  /* ---------- 云端配置 ---------- */
  function tasksNow() {
    try {
      if (window.BreadConfig && typeof window.BreadConfig.tasks === 'function') {
        const cfg = window.BreadConfig.tasks();
        if (cfg && cfg.length) return cfg;
      }
    } catch (e) { /* 忽略 */ }
    return DEFAULT_TASKS;
  }

  function taskName(taskId) {
    try {
      if (window.BreadConfig && typeof window.BreadConfig.taskText === 'function') {
        const s = window.BreadConfig.taskText(taskId, 'name');
        if (s) return s;
      }
    } catch (e) { /* 忽略 */ }
    return T('bread.task_' + taskId);
  }

  /* 签到奖励：读 vip_task_config 里 task_id='bread_checkin' 的 reward_bake（烘焙度） */
  function checkinBake() {
    try {
      if (window.BreadConfig && typeof window.BreadConfig.checkin === 'function') {
        const c = window.BreadConfig.checkin();
        if (c && c.enabled !== false && Number(c.bake) > 0) return Number(c.bake);
      }
    } catch (e) { /* 忽略 */ }
    return DEFAULT_CHECKIN;
  }


  /* ---------- 写入烘焙度 ---------- */
  function localApply(u, amount) {
    let lv = Math.max(1, Math.min(MAX_LEVEL, Number(u.userLevel) || 1));
    let bake = Math.max(0, Number(u.userBake) || 0) + amount;
    const ups = [];
    while (lv < MAX_LEVEL) {
      const need = needOf(lv);
      if (bake < need) break;
      bake -= need;
      lv += 1;
      ups.push(lv);
    }
    /* 【修改】20261119：满级允许烘焙度到上限（480），不再卡在 479。
       【新增】20261119：满级后超出上限的烘焙度不再丢弃，按 3 烘焙度 = 1 积分转换。 */
    let overflowBake = 0;
    let overflowPoints = 0;
    if (lv >= MAX_LEVEL) {
      const maxBake = capOf(MAX_LEVEL);
      if (bake > maxBake) {
        overflowBake = bake - maxBake;
        overflowPoints = Math.floor(overflowBake / 3);
        bake = maxBake;
        if (overflowPoints > 0) {
          u.points = (Number(u.points) || 0) + overflowPoints;
          if (typeof window.__bbSetAssetsPoints === 'function') {
            window.__bbSetAssetsPoints(u.points, u.user_id);
          }
        }
      }
    }
    u.userLevel = lv;
    u.userBake = bake;
    return {
      level: lv,
      bake,
      cap: capOf(lv),
      levelUp: ups,
      overflowBake,
      overflowPoints
    };
  }

  function applyRewards(u, ups, skipPoints) {
    if (!ups || !ups.length) return { points: 0, tokens: 0 };
    const s = stateOf(u);
    let points = 0, tokens = 0;
    ups.forEach(lv => {
      if ([5, 15, 25, 35, 45, 55].includes(lv)) points += 100 + ((lv - 5) / 10) * 50;
      else if ([10, 20, 30, 40, 50, 60].includes(lv)) points += 150 + ((lv - 10) / 10) * 50;
      if ([20, 40, 60].includes(lv)) { tokens += 1; s.tokens = (s.tokens || 0) + 1; }
      s.levels[lv] = true;
    });
    /* 【修改】20261118 P3：新版 user_add_bake 已在服务端把升级奖励加进 points 并返回权威余额，
       此时只补 tokens / 等级标记，不能在客户端再加一遍。 */
    if (points > 0 && !skipPoints) u.points = (Number(u.points) || 0) + points;
    return { points, tokens };
  }

  /* 【新增】20261119：升到 Lv40 / Lv60 时自动解锁面包原野 Plus / Max，并发一封通知邮件 */
  function afterLevelChange(u) {
    try {
      if (window.BreadMail && typeof window.BreadMail.checkAndSave === 'function') {
        window.BreadMail.checkAndSave(u);
      }
    } catch (e) { /* 忽略 */ }
  }

  function doAdd(u, amount, source, cost) {
    /* 【修改】20261118 P2：前端也做一次范围校验，避免负数/超大值在 RPC 失败后
       被本地兜底逻辑直接写进本地等级。服务端仍有同样的上限。
       source：task / checkin / exchange；exchange 由服务端原子扣积分，防止绕过前端。 */
    const amt = Math.floor(Number(amount));
    if (!isFinite(amt) || amt <= 0 || amt > 15000) {
      return Promise.resolve({ ok: false, reason: 'bad-amount', levelUp: [] });
    }
    const src = source || 'task';
    const cst = Math.max(0, Math.floor(Number(cost) || 0));
    const canRpc = (typeof sb !== 'undefined') && sb.rpc && !window.isLocalMode && u.user_id;
    if (!canRpc) {
      const res = localApply(u, amt);
      const got = applyRewards(u, res.levelUp);
      if (got.points) toastLevelUp(res.level, got.points);
      afterLevelChange(u);
      return Promise.resolve(Object.assign({ ok: true, points: u.points }, res, { reward: got }));
    }

    /* 【修改】20261119：优先调用 user_add_bake_v2。
       v2 会在 Lv60 满级后把超出的烘焙度按 3:1 转成积分；
       如果后端还没执行 20261119-max-level-overflow.sql，就自动回退旧函数。 */
    const callBakeRpc = async () => {
      let rpcRes = await sb.rpc('user_add_bake_v2', { p_amount: amt, p_source: src, p_cost: cst });
      if (rpcRes && rpcRes.error) {
        const code = rpcRes.error.code || '';
        const msg = String(rpcRes.error.message || '');
        if (code === 'PGRST202' || /could not find the function|does not exist/i.test(msg)) {
          rpcRes = await sb.rpc('user_add_bake', { p_amount: amt, p_source: src, p_cost: cst });
        }
      }
      return rpcRes;
    };

    return callBakeRpc().then(res => {
      if (res && res.error) throw res.error;
      const d = res && res.data;
      if (!d || !d.ok) {
        /* 【修改】20261118 P2：服务端明确拒绝（每日上限 / 积分不足）时不能走本地兜底，
           否则限额会被 catch 里的 localApply 绕过。 */
        const bizErr = new Error((d && d.msg) || 'rpc failed');
        bizErr.code = 'BUSINESS';
        throw bizErr;
      }

      u.userLevel = Number(d.level) || (Number(u.userLevel) || 1);
      u.userBake = Number(d.bake) || 0;
      /* 【新增】20261119 P4：user_level / user_bake 也改由服务端写入，
         这里同步本地基线，避免后续 store.set 再尝试直写这两列。 */
      if (typeof window.__bbSetAssetsLevel === 'function') {
        window.__bbSetAssetsLevel(u.userLevel, u.userBake, u.user_id);
      }
      /* 【修改】20261118 P3：新版服务端返回权威 points（含兑换扣分 + 升级奖励），
         所有来源都以它为准；旧版 RPC 没有 points 时才由 applyRewards 本地补升级奖励。 */
      const hasServerPoints = (d.points !== undefined && d.points !== null);
      if (hasServerPoints) {
        u.points = Number(d.points) || 0;
        /* 【修改】20261118 P3：标记积分已由服务端结算，后续 store.set 不再提交 points。 */
        window.__bbPointsServerMode = true;
        if (typeof window.__bbSetAssetsPoints === 'function') window.__bbSetAssetsPoints(u.points, u.user_id);
      }
      const ups = Array.isArray(d.levelUp) ? d.levelUp : [];
      const got = applyRewards(u, ups, hasServerPoints);
      if (got.points) toastLevelUp(d.level, got.points);
      afterLevelChange(u);
      return {
        ok: true,
        points: u.points,
        level: d.level,
        bake: d.bake,
        cap: d.cap,
        levelUp: ups,
        reward: got,
        overflowBake: Math.max(0, Number(d.overflowBake) || 0),
        overflowPoints: Math.max(0, Number(d.overflowPoints) || 0)
      };
    }).catch(err => {
      /* 【修改】20261118 P2：业务拒绝不本地兜底，避免绕过服务端每日限额。 */
      if (err && err.code === 'BUSINESS') {
        console.warn('[面包等级] 服务端拒绝：', err.message);
        return { ok: false, reason: err.message, levelUp: [] };
      }
      console.warn('[面包等级] 服务端写入失败，本地兜底', err && err.message);
      const res = localApply(u, amt);
      const got = applyRewards(u, res.levelUp);
      if (got.points) toastLevelUp(res.level, got.points);
      afterLevelChange(u);
      return Object.assign({ ok: true, points: u.points }, res, { reward: got });
    });
  }

  function toastLevelUp(level, points) {
    if (typeof showToast !== 'function') return;
    let msg = T('bread.levelUpToast', { level, points });
    const title = titleOf(level);
    if (title) msg += ' ' + T(title);
    showToast(msg, '🍞');
  }

  /* ---------- 行为计数 ---------- */
  function track(event) {
    const r = rec();
    if (!r) return;
    const u = r.u;
    const s = stateOf(u);
    tasksNow().forEach(task => {
      if (task.event !== event) return;
      const box = boxOf(s, task.cycle);
      box.c[event] = (Number(box.c[event]) || 0) + 1;
    });
    save(u);
    refreshPanel();
  }

  /* ---------- 领任务 ---------- */
  function claim(taskId) {
    const r = rec();
    if (!r) return;
    const u = r.u;
    const s = stateOf(u);
    const task = tasksNow().find(x => x.id === taskId);
    if (!task) return;

    const box = boxOf(s, task.cycle);
    const done = Number(box.c[task.event]) || 0;
    if (done < task.need) return;
    if (box.cl[task.id]) return;

    box.cl[task.id] = true;
    doAdd(u, task.bake, 'task').then((res) => {
      if (!res || !res.ok) {
        /* 【修改】20261118 P2：服务端拒绝（每日上限等）时撤销领取标记，避免“显示领了但没加”。 */
        box.cl[task.id] = false;
        save(u); refreshPanel();
        if (typeof showToast === 'function') {
          showToast(T('bread.claimFail', { reason: (res && res.reason) || 'limit' }), '⚠️');
        }
        return;
      }
      save(u); refreshPanel();
      if (typeof showToast === 'function') {
        const overflow = Math.max(0, Number(res.overflowPoints) || 0);
        showToast(T(overflow > 0 ? 'bread.claimOkOverflow' : 'bread.claimOk',
          { n: task.bake, points: overflow }), '🍞');
      }
      /* 【新增】20261119：面包任务完成后顺带发积分（每日 10 / 每周 25），
         由「积分中心」统一入账，任务数值仍可在这里调整 */
      try {
        const pts = task.cycle === 'week' ? 25 : 10;
        if (window.PointCenterTasks && window.PointCenterTasks.reward) {
          const total = window.PointCenterTasks.reward('breadTask', pts, task.id);
          if (typeof showToast === 'function' && total) showToast(T('bread.taskPoints', { n: pts, total }), '🪙');
        }
      } catch (e) { /* 发积分失败不影响任务领取 */ }
    });
  }

  /* ---------- 签到（奖励烘焙度，可后端配置） ---------- */
  function checkedInToday(u) {
    const s = stateOf(u);
    return s.checkin === dayKey();
  }

  function checkin() {
    const r = rec();
    if (!r) return;
    const u = r.u;
    const s = stateOf(u);
    if (checkedInToday(u)) return;

    const bake = checkinBake();
    s.checkin = dayKey();                 /* 先记签到，避免连点重复发 */
    save(u);                              /* 先落盘签到标记，断网/慢请求也不会被重复点 */
    renderAll();
    doAdd(u, bake, 'checkin').then((res) => {
      if (!res || !res.ok) {
        /* 【修改】20261118 P2：服务端拒绝时撤销今日签到标记，保证还能重试。 */
        s.checkin = '';
        save(u); renderAll();
        if (typeof showToast === 'function') {
          showToast(T('bread.claimFail', { reason: (res && res.reason) || 'limit' }), '⚠️');
        }
        return;
      }
      save(u);
      renderAll();
      if (typeof showToast === 'function') {
        const overflow = Math.max(0, Number(res.overflowPoints) || 0);
        showToast(T(overflow > 0 ? 'bread.checkinOkOverflow' : 'bread.checkinOk',
          { n: bake, points: overflow }), '🍞');
      }
    });
  }

  /* ---------- 每日额外积分 ---------- */
  function grantDailyPoints() {
    /* 【修改】20261118 P0：弱网游客态 / 云端还没回拉时不要发每日积分。
       以前 2.5s 就执行，此时本地 points 可能是旧值或 0，save 会整行写回云端。 */
    if (window.isLocalMode) return;
    const r = rec();
    if (!r) return;
    const u = r.u;
    if (!u || !u.user_id) return;
    if (typeof window.__bbGetAssetsBase === 'function' && !window.__bbGetAssetsBase(u.user_id)) return;
    const s = stateOf(u);
    const day = dayKey();
    if (s.dailyKey === day) return;
    const bonus = dailyPointBonus(u.userLevel);
    s.dailyKey = day;
    if (bonus > 0) {
      /* 【修改】20261118 P3：每日积分改由服务端 claim_bread_daily / apply_points 发放，
         本地先显示，成功后用服务端余额覆盖；SQL 未部署时回退旧写盘。 */
      const oldPts = Number(u.points) || 0;
      u.points = oldPts + bonus;
      if (typeof window.__bbApplyPointsRpc === 'function') {
        Promise.resolve(window.__bbApplyPointsRpc(u, bonus, 'bread_daily', day)).then(d => {
          if (d && d.ok) {
            u.points = d.points;
            save(u); refreshPanel();
          } else if (d && d.notDeployed) {
            save(u, true); refreshPanel();
          } else if (d && d.business) {
            u.points = oldPts;
            save(u); refreshPanel();
          }
        }).catch(() => { save(u); refreshPanel(); });
      } else {
        save(u, true);
      }
      if (typeof showToast === 'function') showToast(T('bread.dailyPoints', { n: bonus }), '🍞');
    } else {
      save(u);
    }
    refreshPanel();
  }

  /* ---------- 积分兑烘焙度 ---------- */
  function exchange(pkgId) {
    const r = rec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    const pkg = EXCHANGE_PKGS.find(p => p.id === pkgId);
    if (!pkg) return { ok: false, reason: 'bad-pkg' };

    const have = Number(u.points) || 0;
    if (have < pkg.cost) return { ok: false, reason: 'no-points', need: pkg.cost - have };

    /* 【修改】20261118 P2：前端先本地预扣，兼容旧版 user_add_bake；新版服务端会返回
       权威 points，成功时覆盖本地值。这样迁移前后都不会出现“免费加烘焙度”。 */
    u.points = have - pkg.cost;
    return doAdd(u, pkg.bake, 'exchange', pkg.cost).then(res => {
      if (!res || !res.ok) {
        /* 服务端拒绝时退回本地预扣的积分。 */
        u.points = have;
        save(u);
        renderAll();
        if (typeof showToast === 'function') showToast(T('bread.exchangeFail'), '❌');
        return { ok: false, reason: (res && res.reason) || 'limit' };
      }
      if (typeof res.points === 'number') u.points = res.points;
      save(u);
      renderAll();
      if (typeof showToast === 'function') {
        const ups = (res && res.levelUp) || [];
        const overflow = Math.max(0, Number(res.overflowPoints) || 0);
        if (overflow > 0) {
          showToast(T('bread.exchangeOverflow', { bake: pkg.bake, points: overflow }), '🍞');
        } else {
          showToast(ups.length
            ? T('bread.exchangeLevelUp', { bake: pkg.bake, level: res.level })
            : T('bread.exchangeOk', { bake: pkg.bake }), ups.length ? '🎉' : '🍞');
        }
      }
      return { ok: true, bake: pkg.bake };
    });
  }

  /* ---------- 免费主题额度 ---------- */
  function tokenThemeOptions() {
    const r = rec();
    if (!r) return [];
    const u = r.u;
    const owned = Array.isArray(u.unlockedThemes) ? u.unlockedThemes : [];
    const list = [];
    Object.keys(THEMES || {}).forEach(k => {
      if (/-plus$|-max$/.test(k)) return;
      if (k === 'default' || k === 'spring') return;
      const meta = THEMES[k];
      if (!meta || !meta.cost) return;
      if (owned.indexOf(k) >= 0) return;
      list.push({ key: k, name: meta.name, cost: meta.cost });
    });
    return list;
  }

  function useToken(themeKey) {
    const r = rec();
    if (!r) return;
    const u = r.u;
    const s = stateOf(u);
    if (!s.tokens || s.tokens <= 0) return;
    if (!THEMES[themeKey]) return;
    if (!Array.isArray(u.unlockedThemes)) u.unlockedThemes = [];
    if (u.unlockedThemes.indexOf(themeKey) >= 0) return;

    u.unlockedThemes.push(themeKey);
    s.tokens -= 1;
    save(u);
    renderAll();
    if (typeof showToast === 'function') showToast(T('bread.themeOk', { name: THEMES[themeKey].name }), '🎨');
  }

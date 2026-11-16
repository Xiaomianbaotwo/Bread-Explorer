/* =========================================================
   modules/vip-level/js/01-vip-core.js
   VIP / SVIP 等级成长内核：星光值（point）计算、升级判定、身份切换
   【新增】本轮新增文件，不改动任何既有逻辑

   ★★ 存储模型：参照 Minecraft 经验条 ★★
   只保存 level（当前等级 1~100）+ point（本等级内进度，上限 = 本级升级所需星光值）。
   不保存「全局累计总星光」。point 满了就 level+1、point 归零并连锁升级。
   切换会员身份（VIP <-> SVIP）时 level / point 数值原样保留，只换一套升级消耗曲线。

   【内部隐藏逻辑，请勿写入 README / 弹窗 / i18n / 对外的任何说明文档】
   因为 VIP 与 SVIP 共用同一份 level + point，用户把 VIP 刷到 Lv100 之后再开通 SVIP，
   切换瞬间等级直接继承为 SVIP-Lv100（只换曲线、不清零），相当于免掉了 SVIP 曲线
   从 Lv1 刷到 Lv100 的全部星光值成本。这是给满级 VIP 的隐性回馈，
   仅作为内部巧思保留在代码里，不在界面上提示、不在文档中描述。
   ========================================================= */

(() => {
  /* ---------- 升级消耗曲线 ----------
     VIP ：每 5 级为一个区间，单级升级所需星光值 = 100 × 区间序号
     SVIP：每 5 级为一个区间，单级升级所需星光值 = 200 × 区间序号
     例：Lv1~5 → VIP 100 / SVIP 200；Lv6~10 → VIP 200 / SVIP 400 …… */
  const MAX_LEVEL = 100;
  const GROUP_SIZE = 5;
  const STEP_VIP = 100;
  const STEP_SVIP = 200;

  /* 两套会员身份互斥：同一时刻只有一种生效（none / vip / svip） */
  const MEMBER_TYPES = ['none', 'vip', 'svip'];

  /* 升级需要的星光值（本级上限） */
  function capOf(level, memberType) {
    /* 【修改】非会员没有等级进度可言：明确返回 0，避免外部误读成「Lv1 已解锁 100」 */
    if (memberType !== 'vip' && memberType !== 'svip') return 0;
    const lv = Math.min(MAX_LEVEL, Math.max(1, Number(level) || 1));
    const group = Math.ceil(lv / GROUP_SIZE);           // 第几个 5 级区间，从 1 开始
    const step = (memberType === 'svip') ? STEP_SVIP : STEP_VIP;
    return step * group;
  }

  function maxLevel() { return MAX_LEVEL; }

  /* 当前生效的会员身份（走既有 checkVipStatus，过期自动回落 none） */
  function memberTypeOf(u) {
    if (typeof checkVipStatus === 'function') {
      const st = checkVipStatus(u);
      return (st && st.type) ? st.type : 'none';
    }
    return (u && typeof u.vipType === 'string') ? u.vipType : 'none';
  }

  /* 取当前用户记录（没登录返回 null） */
  function currentRecord() {
    if (typeof currentUser === 'undefined' || !currentUser) return null;
    if (typeof getUsersDB !== 'function') return null;
    const db = getUsersDB();
    return db[currentUser] ? { db, u: db[currentUser] } : null;
  }

  /* ---------- 状态补齐 ----------
     u.vipLevel        当前等级
     u.vipPoint        本等级内星光进度
     u.vipAppliedType  上次结算时生效的会员身份，用于识别身份切换 */
  function ensureState(u) {
    if (typeof u.vipLevel !== 'number' || !isFinite(u.vipLevel)) u.vipLevel = 1;
    if (u.vipLevel < 1) u.vipLevel = 1;
    if (u.vipLevel > MAX_LEVEL) u.vipLevel = MAX_LEVEL;
    if (typeof u.vipPoint !== 'number' || !isFinite(u.vipPoint) || u.vipPoint < 0) u.vipPoint = 0;
    if (typeof u.vipAppliedType !== 'string' || !MEMBER_TYPES.includes(u.vipAppliedType)) {
      u.vipAppliedType = memberTypeOf(u);
    }
    if (!Array.isArray(u.vipRewardSent)) u.vipRewardSent = [];
    if (!Array.isArray(u.vipRewardLog)) u.vipRewardLog = [];
    return u;
  }

  /* ---------- 归一化：point 达到本级上限就升级，溢出继续连锁 ----------
     返回从旧等级到新等级之间「跨过」的等级列表（用于补发等级奖励邮件） */
  function normalize(u, memberType) {
    const type = (memberType === 'svip') ? 'svip' : (memberType === 'vip' ? 'vip' : 'none');
    const crossed = [];
    if (type === 'none') {
      /* 非会员不参与成长；point 原样留着，等再次开通会员继续用 */
      u.vipPoint = Math.max(0, Number(u.vipPoint) || 0);
      return crossed;
    }
    let guard = 0;
    while (u.vipLevel < MAX_LEVEL && guard++ < MAX_LEVEL + 5) {
      const cap = capOf(u.vipLevel, type);
      if (u.vipPoint < cap) break;
      u.vipPoint -= cap;
      u.vipLevel += 1;
      crossed.push(u.vipLevel);
    }
    /* 满级后不再升级，point 封顶在本级上限减一，避免进度条溢出 */
    if (u.vipLevel >= MAX_LEVEL) {
      u.vipPoint = Math.min(u.vipPoint, capOf(MAX_LEVEL, type) - 1);
    }
    return crossed;
  }

  /* 保存到本地用户库（store.set 会顺带把用户数据写回云端） */
  function persist(u) {
    if (typeof getUsersDB !== 'function' || typeof store === 'undefined') return;
    const db = getUsersDB();
    if (typeof currentUser === 'undefined' || !currentUser) return;
    db[currentUser] = u;
    store.set('bb-users', db);
  }

  /* ---------- 身份切换结算 ----------
     切换会员身份（含开通 / 到期）时调用：
     1. 数值不清零，只按新曲线重新判定 point 是否已经超上限（超了就连锁升级）；
     2. 记录本次生效的身份，避免重复结算。 */
  function syncIdentity(u) {
    ensureState(u);
    const nowType = memberTypeOf(u);
    const changed = (nowType !== u.vipAppliedType);
    if (changed) {
      /* 换曲线后 point 可能高于新上限（SVIP→VIP 时会出现），这里做一次连锁升级 */
      normalize(u, nowType);
      u.vipAppliedType = nowType;
    } else {
      /* 同一身份下也做一次安全归一化（历史数据可能越界） */
      normalize(u, nowType);
    }
    return { changed, type: nowType };
  }

  /* ---------- 加星光值 ----------
     amount：本次获得的星光值；source：来源标识（任务 / 签到）
     返回 { ok, levelUp:[跨过的等级], level, point, cap, status } */
  function addStar(amount, source) {
    const rec = currentRecord();
    if (!rec) return { ok: false, reason: 'no-user' };
    const u = rec.u;
    ensureState(u);
    const type = memberTypeOf(u);
    if (type === 'none') return { ok: false, reason: 'not-member' };

    const gain = Math.max(0, Math.floor(Number(amount) || 0));
    if (gain <= 0) return { ok: false, reason: 'bad-amount' };

    /* 身份可能刚切换（例如刚开通 SVIP），先结算一次再累加 */
    syncIdentity(u);

    const oldLevel = u.vipLevel;
    u.vipPoint += gain;
    const crossed = normalize(u, memberTypeOf(u));

    /* 升级后触发等级奖励邮件（由 04-vip-mail-reward.js 注册的处理函数接管） */
    if (crossed.length && typeof window.VipReward !== 'undefined'
        && typeof window.VipReward.onLevelCrossed === 'function') {
      try { window.VipReward.onLevelCrossed(u, crossed, memberTypeOf(u)); }
      catch (e) { console.warn('[VIP] 等级奖励邮件生成失败（不影响升级）', e); }
    }

    persist(u);

    /* 升级后刷新界面（面板开着时即时看到进度） */
    if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
      try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略渲染异常 */ }
    }

    return {
      ok: true,
      gain,
      source: source || '',
      oldLevel,
      level: u.vipLevel,
      point: u.vipPoint,
      cap: capOf(u.vipLevel, type),
      levelUp: crossed,
      status: type
    };
  }

  /* ---------- 对外只读快照（UI 用） ---------- */
  function snapshot(u) {
    const rec = u ? { u } : currentRecord();
    if (!rec) return null;
    const user = rec.u;
    ensureState(user);
    const type = memberTypeOf(user);
    return {
      memberType: type,
      level: user.vipLevel,
      point: user.vipPoint,
      cap: capOf(user.vipLevel, type),
      maxLevel: MAX_LEVEL,
      toNext: Math.max(0, capOf(user.vipLevel, type) - user.vipPoint),
      isMax: user.vipLevel >= MAX_LEVEL
    };
  }

  window.VIPCore = {
    MAX_LEVEL, MEMBER_TYPES,
    capOf, maxLevel, memberTypeOf,
    ensureState, normalize, syncIdentity,
    addStar, snapshot, persist,
    currentRecord
  };
})();

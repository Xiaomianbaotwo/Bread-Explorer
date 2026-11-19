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
    /* 【修改】20261119：Lv100 满级统一按 4000 星光值上限，和服务端 apply_star 对齐；
       原先后端允许攒到 4000，前端 capOf 却按 VIP 曲线算成 2000，
       会把满级玩家已有的 2000~4000 星光值误判成溢出。 */
    if (lv >= MAX_LEVEL) return 4000;
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
     返回 { crossed: 从旧等级到新等级之间「跨过」的等级列表, overflowPoint: 满级后溢出星光 } */
  function normalize(u, memberType) {
    const type = (memberType === 'svip') ? 'svip' : (memberType === 'vip' ? 'vip' : 'none');
    const crossed = [];
    let overflowPoint = 0;
    if (type === 'none') {
      /* 非会员不参与成长；point 原样留着，等再次开通会员继续用 */
      u.vipPoint = Math.max(0, Number(u.vipPoint) || 0);
      return { crossed, overflowPoint };
    }
    let guard = 0;
    while (u.vipLevel < MAX_LEVEL && guard++ < MAX_LEVEL + 5) {
      const cap = capOf(u.vipLevel, type);
      if (u.vipPoint < cap) break;
      u.vipPoint -= cap;
      u.vipLevel += 1;
      crossed.push(u.vipLevel);
    }
    /* 满级后不再升级：星光值允许一直攒到本级上限（4000），进度条显示满格；
       【修改】20261119：满级后超过 4000 的部分不再直接丢弃，
       先记到 overflowPoint，由 addStar 按 1 星光值 = 3 积分转换。 */
    if (u.vipLevel >= MAX_LEVEL) {
      const maxPoint = capOf(MAX_LEVEL, type);
      if (u.vipPoint > maxPoint) {
        overflowPoint = u.vipPoint - maxPoint;
        u.vipPoint = maxPoint;
      }
      u.vipPoint = Math.min(u.vipPoint, maxPoint);
    }
    return { crossed, overflowPoint };
  }

  /* 保存到本地用户库（store.set 会顺带把用户数据写回云端） */
  function persist(u) {
    if (typeof getUsersDB !== 'function' || typeof store === 'undefined') return;
    const db = getUsersDB();
    if (typeof currentUser === 'undefined' || !currentUser) return;
    db[currentUser] = u;
    store.set('bb-users', db);
    /* 【修改】20261118 P0：emails 不再随 bread_assets 整行 upsert，
       升级时新发的等级奖励邮件改用单列 RPC 同步。 */
    if (typeof syncEmailsToCloud === 'function') {
      try { syncEmailsToCloud(u); } catch (e) { /* 邮件同步失败不影响等级落库 */ }
    }
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
    const oldPoint = u.vipPoint;
    u.vipPoint += gain;
    const norm = normalize(u, memberTypeOf(u));
    const crossed = norm.crossed;
    const overflowStar = norm.overflowPoint;
    const overflowPoints = Math.max(0, overflowStar) * 3;  /* 1 星光值 = 3 积分 */

    /* 【新增】20261119：Lv100 满级后溢出星光值本地先转积分；
       服务端 apply_star_v2 会返回权威 points，异步回包后再覆盖。 */
    if (overflowPoints > 0) {
      u.points = (Number(u.points) || 0) + overflowPoints;
      if (typeof window.__bbSetAssetsPoints === 'function') {
        window.__bbSetAssetsPoints(u.points, u.user_id);
      }
    }

    /* 升级后触发等级奖励邮件（由 04-vip-mail-reward.js 注册的处理函数接管） */
    if (crossed.length && typeof window.VipReward !== 'undefined'
        && typeof window.VipReward.onLevelCrossed === 'function') {
      try { window.VipReward.onLevelCrossed(u, crossed, memberTypeOf(u)); }
      catch (e) { console.warn('[VIP] 等级奖励邮件生成失败（不影响升级）', e); }
    }

    persist(u);

    /* 【新增】20261119 P4：星光值不能再由 store.set 直接写云端。
       本地保留乐观计算保证 UI 立即响应，同时异步调用 apply_star 落库；
       服务端返回等级/星光后再校正本地基线。重复领取或网络失败时，
       下一次 syncFromCloud 会以服务端值为准。
       exchange: 来源是 exchange_star RPC 未部署时的本地回退，不能再调
       apply_star，否则会被服务端当成非法来源拒绝。 */
    if (typeof window.__bbApplyStarRpc === 'function' && String(source || '').indexOf('exchange:') !== 0) {
      Promise.resolve(window.__bbApplyStarRpc(u, gain, source || '')).then(d => {
        /* 【修复】20261119：异步回包必须重新取「当前」用户记录再落盘。
           原来这里直接 persist(u)，u 是发起 addStar 时的旧快照；
           用户领取任务后，领取标记写在 claimTask 新读到的记录里，
           等 RPC 回来再用旧快照 persist，会把 claimed 标记覆盖掉，
           表现为「领了第一个任务，再领第二个，第一个又变成未领取」。
           这里改成 currentRecord()，把等级/星光写回最新记录，保留任务领取状态。 */
        const latest = currentRecord();
        const target = latest ? latest.u : u;
        if (d && d.ok) {
          target.vipLevel = d.level;
          target.vipPoint = d.point;
          /* v2 返回溢出转换后的权威积分；旧函数没有 points 就保持最新记录原值。 */
          if (d.points !== undefined && d.points !== null) {
            target.points = Math.max(0, Number(d.points) || 0);
            if (typeof window.__bbSetAssetsPoints === 'function') {
              window.__bbSetAssetsPoints(target.points, target.user_id);
            }
          }
          persist(target);
        } else if (d && d.business && typeof syncFromCloud === 'function') {
          /* 服务端拒绝（例如同一周期已经领过），回滚本地乐观值后再回拉。
             优先回到云端基线，避免旧本地高值继续污染下一次同步。 */
          const base = (typeof window.__bbGetAssetsBase === 'function')
            ? window.__bbGetAssetsBase(target.user_id)
            : null;
          if (base) {
            target.vipLevel = Math.min(100, Math.max(1, Number(base.vip_level) || 1));
            target.vipPoint = Math.max(0, Number(base.star_point) || 0);
          } else {
            target.vipLevel = oldLevel;
            target.vipPoint = oldPoint;
          }
          persist(target);
          Promise.resolve(syncFromCloud()).catch(() => {});
        }
      }).catch(() => { /* 网络失败保留本地值，下一次同步以云端为准 */ });
    }

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
      overflowStar,
      overflowPoints,
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

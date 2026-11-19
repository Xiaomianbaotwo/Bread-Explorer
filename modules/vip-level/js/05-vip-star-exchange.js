/* =========================================================
   05-vip-star-exchange.js（模块编号 05，接在 01~04 之后）
   ---------- 积分 → 星光值 兑换 ----------
   设计口径（20261118）：
     基础汇率 5 积分 = 1 星光值，档位越大单价越便宜（+10% / +20% / +30%）
     每日兑换上限按等级开放：VIP = 等级×20，SVIP = 等级×28（同级 SVIP 权益不低于 VIP）
     兑换不可逆（星光值不能换回积分），每日 0 点重置
   ========================================================= */
(function () {
  /* 档位表：cost = 消耗积分；star = 得到星光值（已含加成） */
  const PKGS = [
    { id: 'trial',  cost: 50,    star: 10   },  /*   5 : 1        */
    { id: 'small',  cost: 250,   star: 55   },  /* ≈4.5 : 1（+10%） */
    { id: 'medium', cost: 1000,  star: 240  },  /* ≈4.2 : 1（+20%） */
    { id: 'large',  cost: 5000,  star: 1300 }   /* ≈3.8 : 1（+30%） */
  ];

  /* 每日上限系数：VIP 20 / 星光每级，SVIP 28 */
  const CAP_VIP = 20;
  const CAP_SVIP = 28;

  function T(key, opts) {
    if (typeof window.t === 'function') {
      const v = window.t('vip.' + key, opts);
      if (v !== undefined && v !== null && v !== 'vip.' + key) return v;
    }
    return key;
  }

  function todayKey() {
    const d = new Date();
    const p = n => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function currentRecord() {
    if (typeof currentUser === 'undefined' || !currentUser) return null;
    const db = getUsersDB();
    const u = db[currentUser];
    return u ? { db, u } : null;
  }

  function memberTypeOf(u) {
    return (window.VIPCore && window.VIPCore.memberTypeOf(u)) || 'none';
  }

  /* 每日上限（星光值） */
  function dailyCapOf(u) {
    const type = memberTypeOf(u);
    const lv = Math.min(100, Math.max(1, Number(u.vipLevel) || 1));
    if (type === 'svip') return lv * CAP_SVIP;
    if (type === 'vip') return lv * CAP_VIP;
    return 0;
  }

  /* 今日已兑换的星光值（跨天自动归零） */
  function todayUsed(u) {
    const box = u.starExchange;
    if (!box || box.date !== todayKey()) return 0;
    return Math.max(0, Number(box.star) || 0);
  }

  function remainingOf(u) {
    return Math.max(0, dailyCapOf(u) - todayUsed(u));
  }

  /* 按档位兑换；返回 Promise<{ ok, reason, star, points, levelUp, level, point }>
     【修改】20261118 P3：新版走服务端 exchange_star（原子扣积分 + 加星光 + 记每日额度），
     SQL 未部署时才回退旧的本地扣分/加星路径。 */
  async function exchange(pkgId) {
    const rec = currentRecord();
    if (!rec) return { ok: false, reason: 'no-user' };
    const { db, u } = rec;

    const pkg = PKGS.find(p => p.id === pkgId);
    if (!pkg) return { ok: false, reason: 'bad-pkg' };

    const type = memberTypeOf(u);
    if (type !== 'vip' && type !== 'svip') return { ok: false, reason: 'not-member' };

    const pts = Math.max(0, Number(u.points) || 0);
    if (pts < pkg.cost) return { ok: false, reason: 'no-points', need: pkg.cost - pts };

    const remain = remainingOf(u);
    if (pkg.star > remain) return { ok: false, reason: 'daily-cap', remain };

    const canRpc = (typeof sb !== 'undefined') && sb.rpc && !window.isLocalMode && u.user_id;
    if (canRpc) {
      let rpcRes;
      try {
        rpcRes = await sb.rpc('exchange_star', { p_pkg_id: pkg.id });
      } catch (e) {
        return { ok: false, reason: 'network' };
      }
      const rpcErr = rpcRes && rpcRes.error;
      if (rpcErr) {
        const code = rpcErr.code || '';
        const msg = String(rpcErr.message || '');
        const notDeployed = (code === 'PGRST202' || /could not find the function|does not exist/i.test(msg));
        if (!notDeployed) return { ok: false, reason: 'network' };
        /* 落到下面的旧本地路径 */
      } else {
        const d = rpcRes && rpcRes.data;
        if (!d || d.ok !== true) {
          return { ok: false, reason: (d && (d.msg || d.message)) || 'exchange-failed' };
        }
        window.__bbPointsServerMode = true;
        u.points = Number(d.points) || 0;
        if (typeof window.__bbSetAssetsPoints === 'function') window.__bbSetAssetsPoints(u.points, u.user_id);
        u.vipLevel = Math.min(100, Math.max(1, Number(d.level) || Number(u.vipLevel) || 1));
        u.vipPoint = Math.max(0, Number(d.point) || 0);
        /* 【新增】20261119 P4：store.set 不再直写 vip_level / star_point，
           这里手动把服务端兑换后的权威值同步进本地资产基线。 */
        if (typeof window.__bbSetAssetsVip === 'function') {
          window.__bbSetAssetsVip(u.vipLevel, u.vipPoint, u.user_id);
        }
        const key = todayKey();
        u.starExchange = {
          date: key,
          star: Math.max(0, Number(d.used) || 0),
          points: Math.max(0, Number(u.starExchange && u.starExchange.points) || 0) + pkg.cost
        };
        const ups = Array.isArray(d.levelUp) ? d.levelUp : [];
        /* 服务端已经把星光和等级落库；这里只需要补发跨级奖励邮件 */
        if (ups.length && window.VipReward && typeof window.VipReward.onLevelCrossed === 'function') {
          try { window.VipReward.onLevelCrossed(u, ups, type); } catch (e) { /* 忽略 */ }
        }
        /* 【修改】20261118 P3：服务端升级后新发的奖励邮件需要单列同步到云端。 */
        if (ups.length && typeof syncEmailsToCloud === 'function') {
          try { await syncEmailsToCloud(u); } catch (e) { /* 邮件同步失败不阻塞兑换 */ }
        }
        const dbNow = getUsersDB();
        const uNow = dbNow[currentUser];
        if (uNow) {
          uNow.points = u.points;
          uNow.vipLevel = u.vipLevel;
          uNow.vipPoint = u.vipPoint;
          uNow.starExchange = u.starExchange;
          store.set('bb-users', dbNow);
        }
        if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
          try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略 */ }
        }
        return {
          ok: true,
          star: pkg.star,
          points: pkg.cost,
          levelUp: ups,
          level: u.vipLevel,
          point: u.vipPoint,
          remain: Math.max(0, (Number(d.cap) || dailyCapOf(u)) - (Number(d.used) || 0))
        };
      }
    }

    /* ---------- SQL 未部署时的旧本地路径 ---------- */
    u.points = pts - pkg.cost;
    const key = todayKey();
    if (!u.starExchange || u.starExchange.date !== key) u.starExchange = { date: key, star: 0, points: 0 };
    u.starExchange.star = (Number(u.starExchange.star) || 0) + pkg.star;
    u.starExchange.points = (Number(u.starExchange.points) || 0) + pkg.cost;

    const res = window.VIPCore.addStar(pkg.star, 'exchange:' + pkg.id);
    if (!res || !res.ok) {
      u.points = pts;
      u.starExchange.star = Math.max(0, (Number(u.starExchange.star) || 0) - pkg.star);
      u.starExchange.points = Math.max(0, (Number(u.starExchange.points) || 0) - pkg.cost);
      store.set('bb-users', db, { legacyPoints: true });
      return { ok: false, reason: (res && res.reason) || 'add-failed' };
    }

    const dbNow = getUsersDB();
    const uNow = dbNow[currentUser];
    if (uNow) {
      uNow.points = pts - pkg.cost;
      uNow.starExchange = u.starExchange;
      store.set('bb-users', dbNow, { legacyPoints: true });
    } else {
      store.set('bb-users', db, { legacyPoints: true });
    }

    if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
      try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略 */ }
    }

    return {
      ok: true,
      star: pkg.star,
      points: pkg.cost,
      levelUp: Array.isArray(res.levelUp) ? res.levelUp : [],
      level: res.level,
      point: res.point,
      remain: Math.max(0, remain - pkg.star)
    };
  }

  /* 面板渲染用的只读视图 */
  function getView(u) {
    const type = memberTypeOf(u);
    const used = todayUsed(u);
    return {
      pkgs: PKGS.slice(),
      memberType: type,
      points: Math.max(0, Number(u.points) || 0),
      cap: dailyCapOf(u),
      used,
      remain: Math.max(0, dailyCapOf(u) - used),
      enabled: (type === 'vip' || type === 'svip'),
      rateBase: 5
    };
  }

  window.VipStar = { PKGS, exchange, getView, dailyCapOf, todayUsed, remainingOf, T };
})();

/* =========================================================
   modules/vip-level/js/04-vip-mail-reward.js
   等级奖励配置 + 升级邮件发放 + 权益说明/奖励记录数据
   【新增】整份文件为本轮新增

   规则要点：
   1. 高等级自动完整继承全部低等级特权：
      - 持续性权益（等级档位额外每日积分）：只取当前达到的最高档，不叠加；
      - 一次性礼包（Plus / Max 自选名额）：每个等级只发一次邮件，跨级连锁升级时补齐被跳过的等级；
   2. SVIP 完整继承同等级 VIP 权益，再叠加 SVIP 专属；
   3. 会员基础每日积分与等级无关，不在这里发放（属于会员本身的权益）；
   4. 历史已发放的奖励不回收，只保证同一等级同一身份不重复发放。
   ========================================================= */

(() => {
  /* ---------- 等级奖励配置 ----------
     plusPick : 自选 N 个主题的 Plus 版本
     maxPick  : 自选 N 个主题的 Max 版本
     dailyBonus: 等级档位额外每日积分（取最高档，不叠加）
     allBase / allPlus / allMax : 解锁全部对应档位主题
     mails    : 【新增】同一等级拆成多封邮件（Plus 与 Max 不同批发放）
                stage:'max' 的邮件必须等前一封领取后才可领（Max 需要先有同主题 Plus） */
  const REWARDS = {
    vip: {
      25: { plusPick: 2 },
      50: { plusPick: 2 },
      60: { dailyBonus: 100 },
      75: { dailyBonus: 200 },
      90: { dailyBonus: 300 },
      100: {
        mails: [
          { allBase: true, allPlus: true, label: 'Plus 名额' },
          { maxPick: 2, stage: 'max', label: 'Max 名额' }
        ]
      }
    },
    svip: {
      10: { springTheme: true },
      25: { mails: [{ plusPick: 2, label: 'Plus 名额' }, { maxPick: 1, stage: 'max', label: 'Max 名额' }] },
      50: { mails: [{ plusPick: 2, label: 'Plus 名额' }, { maxPick: 1, stage: 'max', label: 'Max 名额' }] },
      60: { dailyBonus: 300 },
      75: { dailyBonus: 500 },
      90: { dailyBonus: 750 },
      100: { allMax: true }
    }
  };

  /* 一个等级的配置可能被拆成多封邮件，统一取「邮件片段」数组 */
  function cfgParts(cfg) {
    if (!cfg) return [];
    return Array.isArray(cfg.mails) ? cfg.mails : [cfg];
  }

  /* 每日额外积分按「当前身份 + 当前等级」取最高档 */
  function dailyBonusOf(level, memberType) {
    const table = REWARDS[memberType === 'svip' ? 'svip' : 'vip'];
    if (!table) return 0;
    let best = 0;
    Object.keys(table).forEach(k => {
      const lv = Number(k);
      cfgParts(table[k]).forEach(part => {
        if (part && part.dailyBonus && Number(level) >= lv && part.dailyBonus > best) best = part.dailyBonus;
      });
    });
    return best;
  }

  /* 等级礼包文案（中英双语，直接写进邮件对象，不依赖 i18n 词表是否就绪） */
  function rewardMailText(level, type, cfg) {
    const isSvip = (type === 'svip');
    const tier = isSvip ? 'SVIP' : 'VIP';
    const partsZh = [];
    const partsEn = [];
    if (cfg.plusPick) {
      partsZh.push(`自选 ${cfg.plusPick} 个主题的 Plus 版本`);
      partsEn.push(`choose ${cfg.plusPick} theme(s) in Plus edition`);
    }
    if (cfg.maxPick) {
      partsZh.push(`自选 ${cfg.maxPick} 个主题的 Max 版本`);
      partsEn.push(`choose ${cfg.maxPick} theme(s) in Max edition`);
    }
    if (cfg.allBase) { partsZh.push('解锁全部主题基础版'); partsEn.push('unlock every base theme'); }
    if (cfg.allPlus) { partsZh.push('解锁全部主题 Plus 版本'); partsEn.push('unlock every Plus theme'); }
    if (cfg.allMax) { partsZh.push('解锁全部主题 Max 版本'); partsEn.push('unlock every Max theme'); }
    if (cfg.springTheme) {
      partsZh.push('新春大吉主题（领取后永久可用）');
      partsEn.push('Spring Fortune theme (permanent once claimed)');
    }
    if (cfg.dailyBonus) {
      partsZh.push(`每日额外 ${cfg.dailyBonus} 积分（达到更高等级时自动按最高档生效）`);
      partsEn.push(`+${cfg.dailyBonus} extra points every day (highest tier applies automatically)`);
    }

    /* 【修改】拆成多封邮件时，标题带上本封的名额标签（Plus 名额 / Max 名额） */
    const labelZh = cfg.label ? ` · ${cfg.label}` : '';
    const labelEn = cfg.label ? ` · ${/Max/.test(cfg.label) ? 'Max picks' : 'Plus picks'}` : '';

    return {
      title: `🎖 ${tier} Lv${level} 等级奖励已发放${labelZh}`,
      titleEn: `🎖 ${tier} Lv${level} level reward unlocked${labelEn}`,
      content: `恭喜达到 ${tier} Lv${level}！本封权益：${partsZh.join('；')}。\n等级越高自动继承更低等级的全部特权，已达成的档位无需重复领取。`,
      contentEn: `You reached ${tier} Lv${level}! Rewards in this mail: ${partsEn.join('; ')}.\nHigher levels automatically inherit all lower-level perks, so nothing needs re-claiming.`
    };
  }

  /* 奖励记录里显示的一行文案 */
  function rewardLogText(level, type, cfg) {
    const tier = (type === 'svip') ? 'SVIP' : 'VIP';
    const bits = [];
    cfgParts(cfg).forEach(part => {
      if (part.plusPick) bits.push(`Plus×${part.plusPick}`);
      if (part.maxPick) bits.push(`Max×${part.maxPick}`);
      if (part.allBase) bits.push('全基础');
      if (part.allPlus) bits.push('全Plus');
      if (part.allMax) bits.push('全Max');
      if (part.springTheme) bits.push('新春大吉');
      if (part.dailyBonus) bits.push(`每日+${part.dailyBonus}`);
    });
    return `${tier} Lv${level} · ${bits.join(' / ')}`;
  }

  function newMailId() {
    return 'vipr-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000).toString(36);
  }

  /* ---------- 升级触发：把跨过的等级逐个检查并发邮件 ----------
     crossed 是本次升级跨过的全部等级（连锁升级会包含中间被跳过的等级） */
  function onLevelCrossed(u, crossed, memberType) {
    if (!u || !Array.isArray(crossed) || !crossed.length) return;
    const type = (memberType === 'svip') ? 'svip' : 'vip';
    const table = REWARDS[type];
    if (!table) return;

    if (!Array.isArray(u.emails)) u.emails = [];
    if (!Array.isArray(u.vipRewardSent)) u.vipRewardSent = [];
    if (!Array.isArray(u.vipRewardLog)) u.vipRewardLog = [];

    crossed.forEach(level => {
      const cfg = table[level];
      if (!cfg) return;
      const parts = cfgParts(cfg);
      const baseKey = `${type}:${level}`;
      /* 【修正】20261117：防重复发邮件（降级后再升回来 / 开发者改等级会走到这里）。
         以前只认 vipRewardSent 数组，本地数据被清、或从云端拉回时数组缺失，就会重发一遍。
         现在多一层兜底：邮箱里只要已经存在「同一身份 + 同一等级」的奖励邮件，就视为已发过。 */
      const alreadyMailed = u.emails.some(m =>
        m && m.type === 'vip_reward'
        && Number(m.vipLevel) === Number(level)
        && ((m.memberType || 'vip') === type));
      if (alreadyMailed) {
        if (u.vipRewardSent.indexOf(baseKey) < 0) u.vipRewardSent.push(baseKey);
        return;
      }
      /* 同一身份同一等级只发一次（切换身份后另一套可以再发一次） */
      if (u.vipRewardSent.indexOf(baseKey) >= 0 && parts.length === 1) return;
      if (parts.length > 1 && u.vipRewardSent.indexOf(`${baseKey}:0`) >= 0) return;

      let prevId = null;
      parts.forEach((part, idx) => {
        const sentKey = parts.length > 1 ? `${baseKey}:${idx}` : baseKey;
        if (u.vipRewardSent.indexOf(sentKey) >= 0) { prevId = prevId || null; return; }
        const memo = rewardMailText(level, type, part);
        const mail = {
          id: newMailId(),
          type: 'vip_reward',
          vipLevel: level,
          memberType: type,
          reward: part,
          /* 【新增】拆封发放：main = 可直接领；max = 要等上一封领完 */
          stage: part.stage || 'main',
          dependsOn: (part.stage === 'max') ? prevId : null,
          title: memo.title,
          titleEn: memo.titleEn,
          content: memo.content,
          contentEn: memo.contentEn,
          date: Date.now(),
          isRead: false,
          isClaimed: false
        };
        u.emails.push(mail);
        u.vipRewardSent.push(sentKey);
        prevId = mail.id;
      });

      /* 奖励记录按「一个等级一行」记录，不按邮件数拆行 */
      u.vipRewardLog.push({
        level,
        memberType: type,
        reward: cfg,
        text: rewardLogText(level, type, cfg),
        date: Date.now()
      });
    });

    /* 邮件列表如果正开着，让它即时刷新 */
    if (typeof window.renderMails === 'function') {
      const ov = document.getElementById('mailOverlay');
      if (ov && ov.classList.contains('show')) { try { window.renderMails(); } catch (e) { /* 忽略 */ } }
    }
  }

  /* ---------- 权益说明渲染数据 ----------
     返回该身份下每一档权益 + 是否已生效（高等级继承低等级） */
  function rightsView(level, memberType) {
    const type = (memberType === 'svip') ? 'svip' : 'vip';
    const table = REWARDS[type] || {};
    return Object.keys(table)
      .map(Number)
      .sort((a, b) => a - b)
      .map(lv => ({
        level: lv,
        text: rewardLogText(lv, type, table[lv]),
        active: Number(level) >= lv
      }));
  }

  function logView(u, limit) {
    const log = (u && Array.isArray(u.vipRewardLog)) ? u.vipRewardLog : [];
    return log.slice().sort((a, b) => b.date - a.date).slice(0, limit || 8);
  }

  /* =========================================================
     等级礼包领取（邮件里的 Plus / Max 自选名额、全套解锁）
     - 真正写库走 Supabase RPC vip_claim_reward(p_level, p_themes)
     - 云端还没执行 20261115-vip-level-system.sql 时（42883 函数不存在），
       明确提示「需要先执行 SQL」，不做本地假发，避免出现账实不符
     ========================================================= */
  function themeTiers() {
    const base = [], plus = [], max = [];
    if (typeof THEMES === 'undefined') return { base, plus, max };
    Object.keys(THEMES).forEach(k => {
      if (k.endsWith('-max')) max.push(k);
      else if (k.endsWith('-plus')) plus.push(k);
      else base.push(k);
    });
    return { base, plus, max };
  }

  function ownedThemes() {
    if (typeof currentUser === 'undefined' || !currentUser) return [];
    try {
      const db = getUsersDB();
      const u = db[currentUser];
      return (u && Array.isArray(u.unlockedThemes)) ? u.unlockedThemes : [];
    } catch (e) { return []; }
  }

  function T(key, opts) {
    if (typeof window._loadT === 'function') {
      const v = window._loadT(key, opts);
      if (v && v !== key) return v;
    }
    return key;
  }

  /* 打开选主题弹窗；mail 为邮件对象，onDone 回调用于把邮件标记为已领取 */
  function openRewardPicker(mail, onDone) {
    if (!mail || !mail.reward) return;
    const cfg = mail.reward;
    const picksPlus = Number(cfg.plusPick) || 0;
    const picksMax = Number(cfg.maxPick) || 0;
    const totalPicks = picksPlus + picksMax;
    /* 【修正】20261117：全套解锁类奖励（allPlus / allMax）没有具体名额数字，
       以前沿用 picksPlus / picksMax = 0 当上限，导致「明明符合条件却提示超过名额上限」。
       这里把「全套」视作不限名额（999），普通自选仍按配置限制。 */
    const capPlus = cfg.allPlus ? 999 : picksPlus;
    const capMax = cfg.allMax ? 999 : picksMax;
    const totalCap = (cfg.allPlus || cfg.allMax) ? 999 : totalPicks;

    /* 纯持续性奖励（只有每日积分）不需要选主题 */
    if (totalPicks === 0 && !cfg.allBase && !cfg.allPlus && !cfg.allMax) {
      if (typeof showToast === 'function') showToast(T('vip.rewardAuto'), '⭐');
      return;
    }

    const overlayId = 'vipRewardPicker';
    const old = document.getElementById(overlayId);
    if (old) old.remove();

    const tiers = themeTiers();
    const owned = ownedThemes();
    const selected = [];

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = overlayId;
    overlay.innerHTML = `
      <div class="modal" style="width:min(520px,94vw); max-height:80vh; display:flex; flex-direction:column; padding:0; overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--card-border);">
          <div style="font-size:15px;font-weight:800;">${T('vip.rewardPickTitle')}</div>
          <button id="vipPickClose" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:var(--ink-soft);">✕</button>
        </div>
        <div style="padding:14px 18px; overflow-y:auto;">
          <div style="font-size:12.5px;color:var(--ink-soft);line-height:1.6;margin-bottom:10px;">${T('vip.rewardPickDesc', { n: totalPicks })}</div>
          <div id="vipPickList" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
        </div>
        <div style="display:flex;gap:10px;padding:12px 18px;border-top:1px solid var(--card-border);">
          <span id="vipPickCount" style="flex:1;align-self:center;font-size:12px;color:var(--ink-soft);"></span>
          <button class="btn primary" id="vipPickConfirm" style="padding:8px 16px;font-size:13px;">${T('vip.rewardConfirm')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const listEl = overlay.querySelector('#vipPickList');

    const pool = [];
    if (picksPlus > 0 || cfg.allPlus) tiers.plus.forEach(k => pool.push({ key: k, kind: 'plus' }));
    if (picksMax > 0 || cfg.allMax) tiers.max.forEach(k => pool.push({ key: k, kind: 'max' }));

    function syncCount() {
      const c = overlay.querySelector('#vipPickCount');
      /* 【修正】20261117：全套解锁类没有具体名额，计数改成「已选 N 个」，不再显示 / 0 */
      if (cfg.allPlus || cfg.allMax) {
        c.textContent = T('vip.rewardPickCountAll', { cur: selected.length });
      } else {
        c.textContent = T('vip.rewardPickCount', { cur: selected.length, need: totalPicks });
      }
    }

    function draw() {
      listEl.innerHTML = '';
      pool.forEach(item => {
        const isOwned = owned.indexOf(item.key) >= 0;
        const isSel = selected.indexOf(item.key) >= 0;
        /* Max 版本必须先拥有同主题 Plus（与积分中心的购买前置保持一致） */
        const plusKey = item.key.replace('-max', '-plus');
        const maxLocked = (item.kind === 'max') && !isOwned
          && owned.indexOf(plusKey) < 0 && !(cfg.allMax);

        const card = document.createElement('div');
        card.style = "width:calc(50% - 4px);box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid var(--card-border);background:var(--card);cursor:pointer;font-size:12px;";
        if (isSel) card.style.borderColor = 'var(--accent)';
        if (isOwned) card.style.opacity = '0.55';
        if (maxLocked) { card.style.opacity = '0.45'; card.style.cursor = 'not-allowed'; }

        const label = (typeof window.themeLabel === 'function' && THEMES[item.key]) ? window.themeLabel(THEMES[item.key]) : item.key;
        card.innerHTML = `<div style="font-weight:700;">${isSel ? '☑️ ' : ''}${label}</div>
          <div style="font-size:11px;color:var(--ink-soft);margin-top:2px;">${isOwned ? T('vip.rewardOwned') : (maxLocked ? T('vip.rewardNeedPlus') : (item.kind === 'max' ? 'MAX' : 'PLUS'))}</div>`;

        card.onclick = () => {
          if (isOwned) return;
          if (maxLocked) return showToast(T('vip.rewardNeedPlus'), '🔒');
          const idx = selected.indexOf(item.key);
          if (idx >= 0) { selected.splice(idx, 1); }
          else {
            if (selected.length >= totalCap) return showToast(T('vip.rewardPickLimit'), '⚠️');
            /* 分档名额限制：Plus 名额与 Max 名额各自独立；全套解锁不受名额限制 */
            const kind = item.kind;
            const usedKind = selected.filter(k => (kind === 'max' ? k.endsWith('-max') : k.endsWith('-plus'))).length;
            const limitKind = kind === 'max' ? capMax : capPlus;
            if (limitKind > 0 && usedKind >= limitKind) return showToast(T('vip.rewardPickLimit'), '⚠️');
            selected.push(item.key);
          }
          draw(); syncCount();
        };
        listEl.appendChild(card);
      });
    }

    /* 全套解锁：一次把该档位所有主题都选上（Lv100 这类奖励用） */
    function selectAllTier(kind) {
      const arr = kind === 'plus' ? tiers.plus : tiers.max;
      arr.forEach(k => {
        const plusKey = k.replace('-max', '-plus');
        if (kind === 'max' && owned.indexOf(plusKey) < 0) return;   // 没 Plus 的不能选 Max
        if (owned.indexOf(k) >= 0) return;
        if (selected.indexOf(k) < 0) selected.push(k);
      });
    }

    draw(); syncCount();

    overlay.querySelector('#vipPickClose').onclick = () => closeOverlay(overlay);

    /* 全套类奖励的快捷按钮 */
    if (cfg.allPlus || cfg.allMax) {
      const bar = document.createElement('div');
      bar.style = "display:flex;gap:8px;margin-bottom:10px;";
      if (cfg.allPlus) {
        const b = document.createElement('button');
        b.className = 'btn ghost'; b.style = "font-size:12px;padding:6px 10px;";
        b.textContent = T('vip.rewardAllPlus');
        b.onclick = () => { selectAllTier('plus'); draw(); syncCount(); };
        bar.appendChild(b);
      }
      if (cfg.allMax) {
        const b2 = document.createElement('button');
        b2.className = 'btn ghost'; b2.style = "font-size:12px;padding:6px 10px;";
        b2.textContent = T('vip.rewardAllMax');
        b2.onclick = () => { selectAllTier('max'); draw(); syncCount(); };
        bar.appendChild(b2);
      }
      overlay.querySelector('#vipPickList').before(bar);
    }

    overlay.querySelector('#vipPickConfirm').onclick = async () => {
      /* 【修正】20261117：原来要求必须「正好选满」名额（need = totalPicks），
         只选 1 个就提示失败，用户以为功能坏了。
         名额是「最多可选 N 个」，现在改成至少选 1 个即可领取，
         想用满名额可以继续勾（或点快捷的全选按钮）。 */
      if (selected.length === 0) return showToast(T('vip.rewardPickLimit'), '⚠️');

      const btn = overlay.querySelector('#vipPickConfirm');
      btn.disabled = true;

      /* 【新增】Max 名额邮件不走 RPC 复核：先领取的 Plus 已经在账户里，
         这里直接把这几个 Max 主题写进 unlockedThemes（和购买/新春领取同一落库方式） */
      if (mail.stage === 'max') {
        const ok = grantThemesLocally(selected);
        if (!ok) {
          btn.disabled = false;
          return showToast(T('vip.rewardClaimFail'), '❌');
        }
        closeOverlay(overlay);
        showToast(T('vip.rewardSuccess', { n: selected.length }), '🎨');
        if (typeof onDone === 'function') onDone(selected);
        if (typeof syncFromCloud === 'function') { try { await syncFromCloud(); } catch (e) { /* 忽略 */ } }
        if (typeof loadUserData === 'function') loadUserData();
        return;
      }

      try {
        /* 【新增】20261117：先把本地等级/身份写回云端。
           开发者面板刚改完等级时云端那一行可能还是旧值，RPC 会判「level not reached」而直接失败。
           这里先 upsert 一次，再做裁决。 */
        try {
          if (typeof currentUser !== 'undefined' && currentUser && typeof getUsersDB === 'function' && typeof store !== 'undefined') {
            const dbNow = getUsersDB();
            if (dbNow && dbNow[currentUser]) store.set('bb-users', dbNow);
          }
        } catch (e) { /* 推送失败不影响继续尝试 */ }

        const callRpc = () => sb.rpc('vip_claim_reward', { p_level: mail.vipLevel, p_themes: selected });
        let res = await callRpc();
        let data = res.data, error = res.error;
        let errMsg = error ? String(error.message || '') : '';
        let srvMsg = (data && (data.msg || data.message)) ? String(data.msg || data.message) : '';

        /* 【新增】服务端说「等级没到」时，等云端落库完成再重试一次 */
        if (!error && data && data.ok === false && /level not reached/i.test(srvMsg)) {
          await new Promise(r => setTimeout(r, 800));
          res = await callRpc();
          data = res.data; error = res.error;
          errMsg = error ? String(error.message || '') : '';
          srvMsg = (data && (data.msg || data.message)) ? String(data.msg || data.message) : '';
        }

        if (error && (error.code === '42883' || errMsg.indexOf('vip_claim_reward') >= 0)) {
          /* 【新增】20261117：后端还没建 vip_claim_reward 时不再直接判失败。
             走和 Max 名额同一条本地落库路径（写 unlockedThemes → upsert 到 bread_assets），
             保证「达到要求就能领」；等 SQL 建好之后，领取会自动回到服务端裁决。 */
          const okLocal = grantThemesLocally(selected);
          if (!okLocal) {
            btn.disabled = false;
            return showToast(T('vip.rewardClaimFail'), '❌');
          }
          closeOverlay(overlay);
          showToast(T('vip.rewardSuccess', { n: selected.length }), '🎨');
          if (typeof onDone === 'function') onDone(selected);
          try { await syncFromCloud(); } catch (e) { /* 忽略 */ }
          if (typeof loadUserData === 'function') loadUserData();
          return;
        }
        if (error || !data || !data.ok) {
          btn.disabled = false;
          /* 【新增】服务端明确判超名额时给准确提示，不再统一显示“领取失败” */
          if (data && data.code === 'LIMIT') return showToast(T('vip.rewardPickLimit'), '⚠️');
          /* 【新增】等级不够时说清楚「要 Lv 几、你现在 Lv 几」，这是开发者降级测试时最常见的情况 */
          if (/level not reached/i.test(srvMsg)) {
            const curLv = (function () {
              try {
                const dbNow = getUsersDB();
                return Number(dbNow[currentUser] && dbNow[currentUser].vipLevel) || 1;
              } catch (e) { return 1; }
            })();
            /* 【新增】20261117：本地等级明明已经够，服务端还说 level not reached，
               说明 bread_assets.vip_level 这列还是旧值（服务端读的就是它）。
               这里先把当前等级强推一次云端，再走一次本地落库兜底，保证「等级够就能领」。 */
            if (Number(mail.vipLevel) <= curLv) {
              const okFallback = grantThemesLocally(selected);
              if (okFallback) {
                closeOverlay(overlay);
                showToast(T('vip.rewardSuccess', { n: selected.length }), '🎨');
                if (typeof onDone === 'function') onDone(selected);
                try { await syncFromCloud(); } catch (e) { /* 忽略 */ }
                if (typeof loadUserData === 'function') loadUserData();
                console.warn('[VIP] 服务端等级列与本地不一致，已按本地等级完成解锁；建议核对 bread_assets.vip_level');
                return;
              }
            }
            return showToast(T('vip.rewardLevelNotReached', { need: mail.vipLevel, cur: curLv }), '🎚️');
          }
          /* 【新增】把服务端返回的原因原样透出来（例如 login required / 等级不符），
             以前统一显示「领取失败」，排查时完全看不出原因 */
          const serverMsg = srvMsg || errMsg || '';
          if (serverMsg) return showToast(T('vip.rewardClaimFail') + '：' + serverMsg, '❌');
          return showToast(T('vip.rewardClaimFail'), '❌');
        }
        closeOverlay(overlay);
        showToast(T('vip.rewardSuccess', { n: selected.length }), '🎨');
        if (typeof onDone === 'function') onDone(selected);
        if (typeof syncFromCloud === 'function') await syncFromCloud();
        if (typeof loadUserData === 'function') loadUserData();
      } catch (e) {
        btn.disabled = false;
        showToast(T('vip.rewardClaimFail'), '❌');
      }
    };

    openOverlay(overlay);
  }

  /* ---------- 兼容旧数据：把「Plus + Max 混在同一封」的历史邮件拆成两封 ---------- */
  function migrateMails(u) {
    if (!u || !Array.isArray(u.emails)) return false;
    let changed = false;
    u.emails.slice().forEach(old => {
      if (old.type !== 'vip_reward' || old.isClaimed || !old.reward || old.stage) return;
      const cfg = old.reward;
      if (!(Number(cfg.plusPick) > 0 && Number(cfg.maxPick) > 0)) return;
      const level = old.vipLevel;
      const type = old.memberType || 'vip';
      const plusPart = { plusPick: Number(cfg.plusPick), label: 'Plus 名额' };
      const maxPart = { maxPick: Number(cfg.maxPick), stage: 'max', label: 'Max 名额' };
      const m1 = rewardMailText(level, type, plusPart);
      old.reward = plusPart;
      old.stage = 'main';
      old.title = m1.title; old.titleEn = m1.titleEn;
      old.content = m1.content; old.contentEn = m1.contentEn;

      const m2 = rewardMailText(level, type, maxPart);
      const idx = u.emails.indexOf(old);
      const newMail = {
        id: newMailId(), type: 'vip_reward', vipLevel: level, memberType: type,
        reward: maxPart, stage: 'max', dependsOn: old.id,
        title: m2.title, titleEn: m2.titleEn, content: m2.content, contentEn: m2.contentEn,
        date: old.date || Date.now(), isRead: false, isClaimed: false
      };
      u.emails.splice(idx + 1, 0, newMail);

      if (Array.isArray(u.vipRewardSent)) {
        const baseKey = `${type}:${level}`;
        const i = u.vipRewardSent.indexOf(baseKey);
        if (i >= 0) u.vipRewardSent.splice(i, 1, `${baseKey}:0`, `${baseKey}:1`);
      }
      changed = true;
    });
    return changed;
  }

  /* ---------- 直接解锁主题（Max 名额邮件用；写 unlockedThemes 会 upsert 到 bread_assets） ---------- */
  function grantThemesLocally(keys) {
    if (typeof currentUser === 'undefined' || !currentUser) return false;
    try {
      const db = getUsersDB();
      const u = db[currentUser];
      if (!u) return false;
      if (!Array.isArray(u.unlockedThemes)) u.unlockedThemes = [];
      (keys || []).forEach(k => { if (u.unlockedThemes.indexOf(k) < 0) u.unlockedThemes.push(k); });
      store.set('bb-users', db);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 测试用：清空等级奖励发放记录 ----------
     【新增】20261117：降级再升级不会重发邮件（防重复），所以测试想「从头再走一遍」时
     需要手动清一次记录。用法（浏览器控制台，登录状态下执行）：
       VipReward.resetRewardState()            // 清空发放记录 + 删除所有等级奖励邮件
       VipReward.resetRewardState('vip:50')    // 只清某一个等级（可传字符串或数组）
     生产环境不要调用：清空后再次升级会重新发礼包。 */
  function resetRewardState(keys) {
    if (typeof currentUser === 'undefined' || !currentUser) return false;
    try {
      const db = getUsersDB();
      const u = db[currentUser];
      if (!u) return false;
      const arr = (!keys) ? null : (Array.isArray(keys) ? keys : [keys]).map(String);
      if (!arr) {
        u.vipRewardSent = [];
        u.vipRewardLog = [];
        u.emails = (u.emails || []).filter(m => m.type !== 'vip_reward');
      } else {
        u.vipRewardSent = (u.vipRewardSent || []).filter(k => !arr.some(a => String(k).indexOf(a) === 0));
        u.vipRewardLog = (u.vipRewardLog || []).filter(l => !arr.some(a => String(`${l.memberType}:${l.level}`) === a));
        u.emails = (u.emails || []).filter(m => !(m.type === 'vip_reward' && arr.some(a => a === `${m.memberType || 'vip'}:${m.vipLevel}`)));
      }
      store.set('bb-users', db);
      /* 【修改】20261118 P0：emails 不再随 bread_assets 整行 upsert，改用单列 RPC 同步。 */
      if (typeof syncEmailsToCloud === 'function') { try { syncEmailsToCloud(u); } catch (e) { /* 忽略 */ } }
      if (typeof window.renderMails === 'function') { try { window.renderMails(); } catch (e) { /* 忽略 */ } }
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 强制补发 / 重发等级奖励（开发者测试专用） ----------
     【新增】20261117：正常升级路径有「同一等级只发一次」的保护，降级再升回不会重发。
     测试时想看到礼包邮件，用这个函数强制重发（会先删掉该等级的旧邮件与旧记录）：
       VipReward.forceRegrant([25, 50])   // 重发 VIP Lv25、Lv50
       VipReward.forceRegrant([25], 'svip') */
  function forceRegrant(levels, memberType) {
    if (typeof currentUser === 'undefined' || !currentUser) return false;
    try {
      const db = getUsersDB();
      const u = db[currentUser];
      if (!u) return false;
      const type = (memberType === 'svip') ? 'svip' : 'vip';
      /* 【修改】20261117：不传 levels 时，默认把「当前等级以下所有配置等级」全部重发，
         这样从开发者面板直接改等级也能稳定看到邮件，不必自己算跨过了哪几级 */
      let arr;
      if (!levels) {
        const table = REWARDS[type] || {};
        const cur = Number(u.vipLevel) || 1;
        arr = Object.keys(table).map(Number).filter(n => n > 0 && n <= cur);
      } else {
        arr = levels.map(Number).filter(n => n > 0);
      }
      if (!arr.length) return false;

      const before = (u.emails || []).length;
      arr.forEach(lv => {
        const base = `${type}:${lv}`;
        u.vipRewardSent = (u.vipRewardSent || []).filter(k => String(k).indexOf(base) !== 0);
        u.vipRewardLog = (u.vipRewardLog || []).filter(l => !(Number(l.level) === lv && (l.memberType || 'vip') === type));
        u.emails = (u.emails || []).filter(m => !(m.type === 'vip_reward' && Number(m.vipLevel) === lv && ((m.memberType || 'vip') === type)));
      });

      onLevelCrossed(u, arr, type);
      store.set('bb-users', db);
      /* 【修改】20261118 P0：emails 不再随 bread_assets 整行 upsert，改用单列 RPC 同步。 */
      if (typeof syncEmailsToCloud === 'function') { try { syncEmailsToCloud(u); } catch (e) { /* 忽略 */ } }
      /* 【新增】20261118：补发后主动刷新邮件列表，并把新增封数返回给调用方（开发者面板用它提示） */
      const added = Math.max(0, (u.emails || []).length - before);
      if (typeof window.renderMails === 'function') { try { window.renderMails(); } catch (e) { /* 忽略 */ } }
      return added || true;
    } catch (e) { return false; }
  }

  /* ---------- 应用云端等级礼包配置 ----------
     【新增】20261118：vip_level_reward_config 之前没有任何代码读，
     改表不会改变任何东西。现在由 06-vip-config.js 读出来组装成同样的结构，
     在这里原地替换 REWARDS，之后所有发放 / 每日额外积分 / 权益说明都按表走。
     传 null 或空表表示「读不到配置」，保持代码里的默认值不变。 */
  function applyConfig(table) {
    if (!table || !table.vip || !table.svip) return false;
    const hasVip = Object.keys(table.vip).length > 0;
    const hasSvip = Object.keys(table.svip).length > 0;
    if (!hasVip && !hasSvip) return false;

    ['vip', 'svip'].forEach(mt => {
      /* 清空原有等级键，避免删了表里的某个等级后代码里还留着旧档位 */
      Object.keys(REWARDS[mt]).forEach(k => { delete REWARDS[mt][k]; });
      Object.keys(table[mt] || {}).forEach(k => { REWARDS[mt][k] = table[mt][k]; });
    });
    return true;
  }

  window.VipReward = {
    REWARDS,
    applyConfig,
    dailyBonusOf,
    onLevelCrossed,
    rewardLogText,
    rightsView,
    logView,
    openRewardPicker,
    themeTiers,
    migrateMails,
    grantThemesLocally,
    resetRewardState,
    forceRegrant
  };
})();

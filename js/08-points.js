/* =========================================================
   08-points.js
   积分中心、购买VIP、解锁主题 (多选批量购买版)
   ========================================================= */

let selectedThemes = [];

/* 【修复】_pts 原来定义在 openPointsShop() 内部，但 renderThemeShop() 里也调用它，
   属于跨函数作用域错误 —— 主题卡片一渲染就抛 ReferenceError: _pts is not defined，
   结果就是「积分中心点不开、主题中心一跳转就消失」。
   现在把它提到模块顶层，两个函数共用同一份。 */
function _pts(cost) {
  return (typeof window.t === 'function') ? window.t('modals.pts', { cost }) : `🪙 ${cost} 积分`;
}

/* 【新增】20261118：把购买 RPC 的真实失败原因转成能看懂的提示。
   以前 executeBatchPurchase 只要没成功就统一说“批量购买失败，请检查网络”，
   把 PGRST203（函数重载冲突）、未登录、资产缺失等真实原因全吞掉了。 */
function themePurchaseErrorText(data, error) {
  const isEn = (typeof window.getLang === 'function' && window.getLang() === 'en');
  const pick = (zh, en) => isEn ? en : zh;

  if (error) {
    const code = error.code || '';
    const msg = error.message || error.details || '';
    if (code === 'PGRST203' || /Could not choose the best candidate function/i.test(msg)) {
      return pick(
        '服务端接口存在重复版本（PGRST203），请先执行 20261118-fix-rpc-overload.sql',
        'The server has overloaded RPC versions (PGRST203). Run 20261118-fix-rpc-overload.sql first.'
      );
    }
    if (/Failed to fetch|NetworkError|network request|fetch failed/i.test(msg)) {
      return pick('网络请求失败，请检查网络后重试', 'Network request failed. Check your connection and retry.');
    }
    if (/permission denied/i.test(msg)) {
      return pick('没有权限调用购买接口，请确认登录状态', 'No permission to call the purchase API. Please sign in again.');
    }
    return msg || pick('未知错误', 'Unknown error');
  }

  if (data && data.ok === false) {
    const reason = data.msg || '';
    const map = {
      'not authenticated': pick('登录状态已失效，请重新登录', 'Your session has expired. Please sign in again.'),
      'assets not found': pick('云端资产记录缺失，请刷新或重新登录', 'Cloud asset record is missing. Refresh or sign in again.'),
      'insufficient points': pick('积分不足', 'Not enough points.'),
      'required theme not owned': pick('需要先拥有前置主题', 'You need to own the prerequisite theme first.'),
      'theme price not configured': pick('该主题价格未配置', 'This theme has no configured price.'),
      'bread-level only': pick('该主题只能通过面包等级解锁', 'This theme can only be unlocked by Bread Level.'),
      'bad theme': pick('主题参数无效', 'Invalid theme parameter.'),
      'already svip': pick('你已经是 SVIP，不能降级购买 VIP', 'You are already SVIP and cannot downgrade to VIP.'),
      'bad days': pick('购买天数无效', 'Invalid purchase duration.'),
      'bad level': pick('会员等级无效', 'Invalid membership level.'),
      'bad price': pick('价格参数无效', 'Invalid price parameter.')
    };
    return map[reason] || reason || pick('购买失败', 'Purchase failed.');
  }

  return '';
}

/* 【新增】主题购买前置校验（唯一权威规则，渲染和下单都走这里）：
   1. 新春大吉原版不走积分，只能靠 SVIP Lv10 礼包邮件领取；
   2. 买 xxx-plus 必须先拥有原版 xxx（原版免费 / 会员档位自带 / 已购买都算拥有）；
   3. 买 xxx-max 必须先拥有 xxx-plus；
   会员档位不再无脑视为「全部拥有」：Plus / Max 一律要自己买或拿奖励。 */
function themePurchaseBlock(key, u, status) {
  const t = THEMES[key];
  if (!t) return { ok: false, kind: 'invalid', msg: '' };
  /* 【修改】20261118：真正的拥有记录优先。
     只要 unlockedThemes 里已经有这个主题，就直接放行，
     不再先走 VIP/SVIP 或前置主题判断，避免“明明已拥有却提示缺前置”。
     注意这里只看真实解锁记录，不把“会员期内可用”的档位主题当成已购买。 */
  if (typeof themeOwnedKeys === 'function' && themeOwnedKeys(u).indexOf(key) >= 0) {
    return { ok: true, kind: 'owned', msg: '' };
  }
  /* 【新增】20261119：面包等级专属主题（蜂蜜工坊）不参与积分购买，
     只能靠面包等级解锁；未达标时点一下只提示门槛。 */
  if (t.breadOnly) {
    const need = Number(t.breadLevel) || 0;
    const lv = (typeof window.UserLevel !== 'undefined' && window.UserLevel.level) ? Number(window.UserLevel.level) : 1;
    const msg = (typeof window.getLang === 'function' && window.getLang() === 'en')
      ? `This theme unlocks at Bread Level Lv${need} (current Lv${lv}).`
      : `这个主题需要面包等级 Lv${need} 解锁（当前 Lv${lv}）。`;
    return { ok: false, kind: 'bread', msg: msg };
  }
  if (t.isSpring && !key.endsWith('-plus') && !key.endsWith('-max')) {
    return { ok: false, kind: 'code', msg: _loadT('modals.springOnlyCode') };
  }
  /* 【新增】20261119：季节主题暂时只走兑换码，不参与积分购买。 */
  if (t.redeemOnly || t.season) {
    return { ok: false, kind: 'code', msg: _loadT('modals.seasonRedeemOnly') };
  }
  /* 【新增】会员档位专属的基础主题不能单独用积分买：
     樱花漫舞 / 黄金时代 / 绿野仙踪 → VIP；钻石星辰 / 深海幽蓝 / 暗夜黑金 / 赛博朋克 → SVIP */
  if (TIER_ONLY_THEMES.indexOf(key) >= 0) {
    const svipOnly = ['diamond', 'ocean', 'blackgold', 'cyber'].indexOf(key) >= 0;
    const msgKey = svipOnly ? 'modals.tierSvipOnly' : 'modals.tierVipOnly';
    return {
      ok: false,
      kind: 'tier',
      msg: _loadT(msgKey, { name: themeLabel(t) })
    };
  }
  const baseKey = key.replace('-plus', '').replace('-max', '').replace('-ultimate', '');
  if (key.endsWith('-plus')) {
    const baseConf = THEMES[baseKey];
    const owns = (typeof themeIsOwned === 'function')
      ? themeIsOwned(baseKey, u, status)
      : (typeof themeOwnedKeys === 'function' ? themeOwnedKeys(u).includes(baseKey) : false);
    if (!owns) {
      let msg = _loadT('modals.needBase', { name: themeLabel(t), base: baseConf ? themeLabel(baseConf) : baseKey });
      /* 【新增】20261118：如果是 Plus 缺基础版，且基础版本身是会员专属，
         把“当前会员档位不够”说清楚，避免看起来像无理由拦截。 */
      if (TIER_ONLY_THEMES.indexOf(baseKey) >= 0) {
        const needTier = ['diamond', 'ocean', 'blackgold', 'cyber'].indexOf(baseKey) >= 0 ? 'SVIP' : 'VIP';
        const nowType = (status && status.type) ? status.type : 'none';
        const nowTier = nowType === 'svip' ? 'SVIP' : (nowType === 'vip' ? 'VIP' : '普通用户');
        const isEn = (typeof window.getLang === 'function' && window.getLang() === 'en');
        msg += isEn
          ? ` (${baseConf ? themeLabel(baseConf) : baseKey} is ${needTier}-only; current: ${nowTier})`
          : `（${baseConf ? themeLabel(baseConf) : baseKey} 是 ${needTier} 专属，当前是${nowTier}）`;
      }
      return { ok: false, kind: 'base', msg };
    }
  }
  if (key.endsWith('-max')) {
    const plusKey = `${baseKey}-plus`;
    const owns = (typeof themeIsOwned === 'function')
      ? themeIsOwned(plusKey, u, status)
      : (typeof themeOwnedKeys === 'function' ? themeOwnedKeys(u).includes(plusKey) : false);
    if (!owns) {
      return { ok: false, kind: 'plus', msg: _loadT('modals.needPlus', { name: themeLabel(t), plus: THEMES[plusKey] ? themeLabel(THEMES[plusKey]) : plusKey }) };
    }
  }
  return { ok: true, kind: 'buy', msg: '' };
}

function openPointsShop() {
  /* 【修改】20261119：先开窗再渲染，避免第二次打开时渲染抛错导致点了没反应 */
  const _ovFirst = $('#pointsOverlay');
  const _wasOpen = !!(_ovFirst && _ovFirst.classList.contains('show'));
  if (_ovFirst) openOverlay(_ovFirst);
  /* 【新增】VIP 任务记账：打开主题商店（积分中心内含主题商店）。
     只在面板本来没打开时记一次，购买后重复渲染不会重复计数；track 内部对非会员自动忽略 */
  try {
    if (window.VipTasks && !_wasOpen) window.VipTasks.track('themeShop');
  } catch (e) { /* 记账失败不影响打开 */ }
  /* 【修复】原来第一行是 `if (!currentUser) return showToast(...)`，
     游客模式 / 本地模式 / 本地用户记录缺失（users[currentUser] 为空）时，
     点 🎁 只会闪一条提示、弹窗根本不打开 —— 也就没有购买 VIP / SVIP 的入口。
     现在改为：拿不到用户记录就用只读兜底对象，积分中心照常打开（价格可看），
     真正下单时在 buyVip / executeBatchPurchase 里再拦一次登录。 */
  const users = getUsersDB();
  const realU = (currentUser && users[currentUser]) ? users[currentUser] : null;
  const u = realU || { points: 0, unlockedThemes: [], emails: [], vipType: 'none', vipExpire: 0 };
  const status = checkVipStatus(u);

  $('#shopPoints').textContent = u.points;

  let discount = 1;
  if (status.type === 'vip') discount = 0.9;
  if (status.type === 'svip') discount = 0.7;

  const gridVip = $('#shopGridVip'); gridVip.innerHTML = '';
  const gridSvip = $('#shopGridSvip'); gridSvip.innerHTML = '';

  const vipPrices = (window.cloudSettings && window.cloudSettings.vip_vip_prices) ? window.cloudSettings.vip_vip_prices : SHOP_ITEMS;
  const svipPrices = (window.cloudSettings && window.cloudSettings.vip_svip_prices) ? window.cloudSettings.vip_svip_prices : SHOP_ITEMS.map(i => ({...i, base: i.base * 3}));

  /* 【修复】原来这里有一份局部 _pts，已提升到模块顶层，这里不再重复定义 */

  vipPrices.forEach(item => {
    const pVip = Math.floor(item.base * discount);
    const elVip = document.createElement('div');
    elVip.className = 'shop-item';
    elVip.innerHTML = `<div class="title">VIP ${planLabel(item)}</div><div class="price">${_pts(pVip)}</div>`;
    elVip.onclick = () => buyVip(1, item.days, pVip, planLabel(item));
    gridVip.appendChild(elVip);
  });

  svipPrices.forEach(item => {
    const pSvip = Math.floor(item.base * discount);
    const elSvip = document.createElement('div');
    elSvip.className = 'shop-item';
    elSvip.innerHTML = `<div class="title">SVIP ${planLabel(item)}</div><div class="price">${_pts(pSvip)}</div>`;
    elSvip.onclick = () => buyVip(2, item.days, pSvip, planLabel(item));
    gridSvip.appendChild(elSvip);
  });

  selectedThemes = [];
  renderThemeShop(u, status);
}

function renderThemeShop(u, status) {
  const themeGrid = $('#themeShopGrid'); themeGrid.innerHTML = '';
  
  const _t = (key, fallback) => (typeof window.t === 'function') ? window.t('modals.' + key, { defaultValue: (fallback === undefined ? key : fallback) }) : fallback;

  const actionBar = document.createElement('div');
  actionBar.style = "grid-column: 1 / -1; display: flex; gap: 10px; margin-bottom: 10px;";
  actionBar.innerHTML = `
    <button id="btnBuySelected" class="btn primary" style="flex:1; font-size:13px; padding:8px;">${_t('buyingSelected', '🛒 购买选中')} (0)</button>
    <button id="btnBuyAll" class="btn ghost" style="flex:1; font-size:13px; padding:8px; border-color:var(--accent); color:var(--accent);">${_t('buyAll', '⚡ 一键购买所有可买')}</button>
  `;
  themeGrid.appendChild(actionBar);

  const allKeys = Object.keys(THEMES);
  const baseKeys = [], plusKeys = [], maxKeys = [];

  allKeys.forEach(key => {
    if (key.endsWith('-max')) maxKeys.push(key);
    else if (key.endsWith('-plus')) plusKeys.push(key);
    else baseKeys.push(key);
  });

  const sortedThemeKeys = [...baseKeys, ...plusKeys, ...maxKeys];
  let visibleThemes = [];

  sortedThemeKeys.forEach(key => {
    const t = THEMES[key];
    let baseKey = key.replace('-plus', '').replace('-max', '');
    let isBase = (key === baseKey);
    let isPlus = key.endsWith('-plus');
    let isMax = key.endsWith('-max');

    const baseConf = THEMES[baseKey];
    const baseCost = baseConf ? baseConf.cost : undefined;
    const baseIsFree = (baseCost === undefined || baseCost === 0);

    /* 【修复】原来这里用 return 直接把「前置主题没买」的档位隐藏掉，
       导致用户看不到 Plus/Max 档位、也完全绕过了依赖校验。
       现在改为：仍然显示，但置灰并标注前置要求，点击只提示原因、不扣分。 */
    if (isBase && baseIsFree && !t.isSpring) return;

    /* 【修改】是否已拥有统一走 themeIsOwned：个人已解锁优先，其次看当前会员档位（会员期内有效） */
    const isOwned = (typeof themeIsOwned === 'function')
      ? themeIsOwned(key, u, status)
      : ((status.type === 'svip') || u.unlockedThemes.includes(key));
    /* 【新增】20261119：面包等级专属主题没解锁前不在积分商店里露出（避免出现买不了的卡片） */
    if (t.breadOnly && !isOwned) return;
    const block = isOwned ? { ok: true, msg: '' } : themePurchaseBlock(key, u, status);
    const cloudThemeCost = (window.cloudSettings && window.cloudSettings.theme_prices) ? window.cloudSettings.theme_prices[key] : null;
    const finalCost = cloudThemeCost !== undefined && cloudThemeCost !== null ? cloudThemeCost : t.cost;

    if (!isOwned && !block.ok) {
      // 前置条件不满足：显示出来但不可购买（没有任何价格时也不参与批量）
    } else if (!isOwned && (finalCost === undefined || finalCost === null)) {
      return;
    }
    if (!isOwned && block.ok) visibleThemes.push({ key, cost: finalCost });

    const el = document.createElement('div');
    const isSelected = selectedThemes.includes(key);
    el.className = 'theme-shop-item' + (isOwned ? ' owned' : '') + (isSelected ? ' selected' : '');
    el.style.position = 'relative';   // 【新增】给右上角“多选”小选框定位用
    /* 【新增】前置未满足的卡片降低视觉权重，避免用户误以为可以直接买 */
    if (!isOwned && !block.ok) { el.style.opacity = '0.55'; el.style.cursor = 'not-allowed'; }
    
    if (isSelected) el.style.border = '2px solid var(--accent)';
    
    let priceHtml = '';
    if (isOwned) priceHtml = _t('owned', '✅ 已拥有');
    else if (!block.ok) {
      /* 【修改】20261118：VIP/SVIP 专属、面包等级、兑换码专属主题不再显示价格，
         直接显示获取方式；只有真正可以积分购买、但缺前置的 Plus/Max 才显示价格。 */
      const noPrice = (block.kind === 'tier' || block.kind === 'bread' || block.kind === 'code' || block.kind === 'invalid');
      if (noPrice) {
        priceHtml = `🔒 ${block.msg}`;
      } else {
        priceHtml = `🔒 ${finalCost !== undefined && finalCost !== null ? _pts(finalCost) + ' · ' : ''}${block.msg || _t('lockedTag', '需先拥有前置主题')}`;
      }
    }
    else if (isSelected) priceHtml = _t('selected', '☑️ 已选中');
    else priceHtml = _pts(finalCost);

    /* 【优化】未拥有的主题：点卡片正文 = 弹自定义确认窗后直接购买（“是 / 手滑了”）；
       右上角小选框仍然保留原来的“多选 → 批量购买”能力，两种操作互不干扰。 */
    const pickHtml = (isOwned || !block.ok) ? '' :
      `<span class="pick-toggle" style="position:absolute; top:4px; right:6px; font-size:12px; cursor:pointer; opacity:0.85;">${isSelected ? '☑️' : '⬜'}</span>`;

    el.innerHTML = `
      ${pickHtml}
      <div class="title">${themeLabel(t)}</div>
      <div class="price">${priceHtml}</div>
    `;
    
    if (!isOwned) {
      const pick = el.querySelector('.pick-toggle');
      if (pick) pick.onclick = (ev) => {
        ev.stopPropagation();
        if (selectedThemes.includes(key)) {
          selectedThemes = selectedThemes.filter(k => k !== key);
        } else {
          selectedThemes.push(key);
        }
        renderThemeShop(u, status);
      };
      /* 【修改】按需求：积分中心里点主题卡片 = 直接购买，不再弹确认窗。
         前置条件不满足时只提示原因，绝不进入扣分流程。 */
      el.onclick = () => {
        if (!block.ok) return showToast(block.msg, '🔒');
        executeBatchPurchase([key], u, status);
      };
    }
    themeGrid.appendChild(el);
  });

  const btnBuySelected = $('#btnBuySelected');
  const btnBuyAll = $('#btnBuyAll');
  
  if (btnBuySelected) {
    btnBuySelected.textContent = `${_t('buyingSelected', '🛒 购买选中')} (${selectedThemes.length})`;
    if (selectedThemes.length === 0) {
      btnBuySelected.disabled = true;
      btnBuySelected.style.opacity = '0.5';
    } else {
      btnBuySelected.onclick = () => executeBatchPurchase(selectedThemes, u, status);
    }
  }

  if (btnBuyAll) {
    if (visibleThemes.length === 0) {
      btnBuyAll.disabled = true;
      btnBuyAll.style.opacity = '0.5';
    } else {
      btnBuyAll.onclick = () => {
        const allKeys = visibleThemes.map(v => v.key);
        showConfirmModal(_loadT('points.buyAllTitle'), _loadT('points.buyAllDesc', { count: allKeys.length }), () => {
          executeBatchPurchase(allKeys, u, status);
        }, false);
      };
    }
  }
}

async function executeBatchPurchase(keys, u, status) {
  if (!keys || keys.length === 0) return;
  /* 【修复】下单前统一拦一次登录状态：游客/本地模式只能浏览，不能真正扣分购买 */
  if (!currentUser || !getUsersDB()[currentUser]) return showToast(_loadT('common.loginRequired'), '🔒');
  
  /* 【修复】下单前逐个校验前置依赖（Plus 需原版、Max 需 Plus、新春原版只能兑换码）。
     以前这里完全不校验，主题中心和批量购买都能绕过依赖直接买到 Max，
     现在任何一项不满足就整单中止，不扣一分积分。 */
  for (const k of keys) {
    const blk = themePurchaseBlock(k, u, status);
    if (!blk.ok) return showToast(blk.msg, '🔒');
  }

  let totalCost = 0;
  const itemsToBuy = [];
  
  for (const k of keys) {
    const t = THEMES[k];
    if (!t) continue;
    const cloudThemeCost = (window.cloudSettings && window.cloudSettings.theme_prices) ? window.cloudSettings.theme_prices[k] : null;
    const finalCost = cloudThemeCost !== undefined && cloudThemeCost !== null ? cloudThemeCost : t.cost;
    /* 【新增】没有任何价格来源的主题（例如新春原版）不允许参与扣分 */
    if (finalCost === undefined || finalCost === null || Number.isNaN(Number(finalCost))) {
      return showToast(_loadT('points.buyFail'), '❌');
    }
    totalCost += Number(finalCost);
    itemsToBuy.push({ key: k, cost: finalCost });
  }

  const _t = (key, fallback) => (typeof window.t === 'function') ? window.t('modals.' + key, { defaultValue: (fallback === undefined ? key : fallback) }) : fallback;

  if (u.points < totalCost) {
    return showToast(_loadT('points.insufficientDetail', { cost: totalCost, own: u.points }), '❌');
  }

  showToast(`${_t('processing', '正在处理支付...')}`, '⏳');
  
  let successCount = 0;
  /* 【新增】20261118：记录失败数量和第一条真实原因，避免统一误报成网络问题 */
  let failedCount = 0;
  let lastErrorText = '';
  for (let item of itemsToBuy) {
    /* 【修改】20261118 P2：服务端加固后返回 jsonb { ok:false } 也要判失败；
       以前只看 error，服务端拒绝扣款但返回 ok:false 时会被当成购买成功。 */
    const { data, error } = await sb.rpc('purchase_theme', { p_theme: item.key, p_cost: item.cost });
    if (!error && data !== false && !(data && data.ok === false)) {
      successCount++;
    } else {
      failedCount++;
      lastErrorText = themePurchaseErrorText(data, error) || lastErrorText;
    }
  }

  if (successCount > 0) {
    const successText = _t('allBuySuccess', `成功购买并解锁 ${successCount} 个主题！`).replace('{{count}}', successCount);
    if (failedCount > 0) {
      showToast(`${successText}；${failedCount} 个失败${lastErrorText ? '：' + lastErrorText : ''}`, '⚠️');
    } else {
      showToast(successText, '🎉');
    }
    selectedThemes = [];
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData();
    
    const upUsers = getUsersDB();
    const upU = upUsers[currentUser];
    const upStatus = checkVipStatus(upU);
    $('#shopPoints').textContent = upU.points;
    renderThemeShop(upU, upStatus);
  } else {
    /* 【修改】20261118：单买不再复用“批量”措辞；并显示 RPC 真实失败原因 */
    const isBatch = itemsToBuy.length > 1;
    const baseText = isBatch
      ? _t('themeBatchFailed', '批量购买失败')
      : _t('themeBuyFail', '购买失败');
    showToast(`${baseText}${lastErrorText ? '：' + lastErrorText : ''}`, '❌');
  }
}

$('#btnPoints').onclick = openPointsShop;
$('#btnPointsClose').onclick = () => closeOverlay($('#pointsOverlay'));

function buyVip(level, days, singleCost, label) {
  let users = getUsersDB(); let u = users[currentUser];
  /* 【修复】游客/本地模式没有用户记录时，点价格不再静默失败或抛出 TypeError，直接提示登录 */
  if (!u) return showToast(_loadT('common.loginRequired'), '🔒');
  if (u.points < singleCost) return showToast(_loadT('points.insufficient'), '❌');

  const _t = (key, fallback) => (typeof window.t === 'function') ? window.t('modals.' + key, { defaultValue: (fallback === undefined ? key : fallback) }) : fallback;

  showInputModal(_t('buyCountTitle', '选择购买数量'), _t('buyCountDesc', `请输入要购买的数量（单份 ${singleCost} 积分）`).replace('{{cost}}', singleCost), '1', async (input) => {
    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) return showToast(_loadT('points.invalidQty'), '❌');

    const totalCost = singleCost * count;
    let upUsers = getUsersDB(); let upU = upUsers[currentUser];

    if (upU.points < totalCost) return showToast(_loadT('points.insufficientNeed', { cost: totalCost }), '❌');

    showToast(_t('processing', '正在处理支付...'), '⏳');
    const totalDays = days * count;
    
    const { data, error } = await sb.rpc('purchase_vip', { 
      p_level: level, p_days: totalDays, p_cost: totalCost 
    });

    /* 【修改】20261118 P2：服务端加固后返回 jsonb { ok:false } 也要判失败。
       【修改】20261118：会员购买同样显示真实失败原因，不再统一说“网络错误”。 */
    if (error || data === false || (data && data.ok === false)) {
      const reason = themePurchaseErrorText(data, error);
      return showToast(`${_t('themeBuyFail', '购买失败')}${reason ? '：' + reason : ''}`, '❌');
    }

    const typeStr = level === 1 ? 'VIP' : 'SVIP';
    showToast(_t('buyVipSuccess', `成功购买 ${count} 份 ${typeStr} ${label}`).replace('{{count}}', count).replace('{{type}}', typeStr).replace('{{label}}', label), '🎉');
    
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData();
    openPointsShop();
  });
}
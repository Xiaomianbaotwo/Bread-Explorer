/* =========================================================
   04-auth.js
   ========================================================= */

function getSafeEmailPrefix(name) {
    if (/^[a-zA-Z0-9]+$/.test(name)) return name.toLowerCase();
    return encodeURIComponent(name).replace(/%/g, '').toLowerCase();
}

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'bread-key-';
  for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

function getUsersDB() {
  let db = store.get('bb-users', {});
  if (!db || typeof db !== 'object' || Array.isArray(db)) db = {};

  for (let name in db) {
    if (typeof db[name] === 'string') db[name] = { pwd: db[name], key: generateKey(), regTime: Date.now(), avatar: '', vipType: 'none', vipExpire: 0, currentTheme: 'default', emails: [], lastPointDate: '' };
    if (typeof db[name].vipType !== 'string') db[name].vipType = 'none';
    if (typeof db[name].vipExpire !== 'number') db[name].vipExpire = 0;
    if (typeof db[name].currentTheme !== 'string') db[name].currentTheme = 'default';
    if (!Array.isArray(db[name].emails)) db[name].emails = [];
    if (typeof db[name].regTime !== 'number' || !db[name].regTime) db[name].regTime = Date.now();
    if (typeof db[name].avatar !== 'string') db[name].avatar = '';
    if (typeof db[name].points !== 'number') db[name].points = 0;
    if (typeof db[name].lastResetMonth !== 'string') db[name].lastResetMonth = '';
    if (!Array.isArray(db[name].unlockedThemes)) db[name].unlockedThemes = [];
    if (!Array.isArray(db[name].customFonts)) db[name].customFonts = [];
    if (typeof db[name].enFont !== 'string') db[name].enFont = 'default';
    if (typeof db[name].zhFont !== 'string') db[name].zhFont = 'default';
    if (typeof db[name].lastRpDate !== 'string') db[name].lastRpDate = '';
    if (typeof db[name].rpCount !== 'number') db[name].rpCount = 0;
    if (typeof db[name].day7Sent !== 'boolean') db[name].day7Sent = false;
    if (typeof db[name].day30Sent !== 'boolean') db[name].day30Sent = false;
    if (typeof db[name].screenShake !== 'boolean') db[name].screenShake = true;
    if (typeof db[name].springSent !== 'boolean') db[name].springSent = false;
    if (typeof db[name].fwSpeed !== 'number') db[name].fwSpeed = 1.0;
    if (typeof db[name].fwFreq !== 'number') db[name].fwFreq = 1.0;
    if (typeof db[name].fwThemeColor !== 'boolean') db[name].fwThemeColor = true;
    if (typeof db[name].clock12h !== 'boolean') db[name].clock12h = false;
    if (typeof db[name].weatherRange !== 'string') db[name].weatherRange = '24';
  }
  return db;
}

function getSavedUsers() { return store.get('bb-saved-users', []); }
function saveUserToQuickList(name) {
  let list = getSavedUsers();
  if (!list.includes(name)) { list.unshift(name); store.set('bb-saved-users', list); }
}
function removeUserFromQuickList(name) {
  let list = getSavedUsers().filter(n => n !== name);
  store.set('bb-saved-users', list); renderQuickLogin();
}

function renderQuickLogin() {
  const area = $('#quickLoginArea');
  const listEl = $('#quickLoginList');
  if (!area || !listEl) return;
  const users = getUsersDB();
  const list = getSavedUsers().filter(name => users[name]);
  if (list.length === 0) { area.style.display = 'none'; return; }
  area.style.display = 'block';
  listEl.innerHTML = '';
  
  list.forEach(name => {
    const u = users[name];
    const btn = document.createElement('div');
    btn.style = "display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; border:1px solid var(--card-border); background:var(--card); cursor:pointer; font-size:13px; font-weight:bold; transition:0.2s; position:relative;";
    btn.onmouseover = () => btn.style.borderColor = 'var(--accent)';
    btn.onmouseout = () => btn.style.borderColor = 'var(--card-border)';
    if (u && u.avatar) {
      btn.innerHTML = `<img src="${u.avatar}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;"><span>${name}</span>`;
    } else {
      btn.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;">${name[0].toUpperCase()}</div><span>${name}</span>`;
    }
    const delBtn = document.createElement('span');
    delBtn.innerHTML = '✕';
    delBtn.style = "margin-left:4px; font-size:10px; color:#e74c3c; opacity:0.6; cursor:pointer;";
    delBtn.onclick = (e) => { e.stopPropagation(); removeUserFromQuickList(name); };
    btn.appendChild(delBtn);
    
    btn.onclick = () => {
      $('#authName').value = name;
      $('#authPwd').value = '';
      $('#authPwd').focus();
      showToast(_loadT('auth.needPassword'), '🔑');
    };
    listEl.appendChild(btn);
  });
}

function checkVipStatus(userObj) {
  if (!userObj) return { expire: 0, type: 'none' };
  let type = userObj.vipType || 'none';
  if (userObj.vipExpire !== 0 && Date.now() > userObj.vipExpire) {
      return { expire: 0, type: 'none' };
  }
  return { expire: userObj.vipExpire, type: type };
}

function checkSystemEmails(u) {
  let changed = false;
  if (!u.emails) u.emails = [];
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  if (u.lastResetMonth !== monthStr) { u.points = 0; u.lastResetMonth = monthStr; changed = true; }
  return changed;
}

function loadUserData() {
  const sitesKey = currentUser ? `bb-sites_${currentUser}` : 'bb-sites-guest';
  sites = store.get(sitesKey, null) || JSON.parse(JSON.stringify(DEFAULT_SITES));

  let users = null;
  if (currentUser) {
    users = getUsersDB();
    if (!users[currentUser]) { currentUser = null; store.set('bb-current-user', null); users = null; }
  }

  if (currentUser && users) {
    const u = users[currentUser];
    if (checkSystemEmails(u)) store.set('bb-users', users);
    
    const status = checkVipStatus(u);
    if (u.vipType !== status.type) {
        u.vipType = status.type;
        u.vipExpire = status.expire;
        store.set('bb-users', users);
    }

    /* 【新增】历史等级奖励邮件里「Plus + Max 混在一封」的，自动拆成两封（Plus 先领，Max 后领） */
    if (window.VipReward && typeof window.VipReward.migrateMails === 'function') {
      if (window.VipReward.migrateMails(u)) store.set('bb-users', users);
    }

    /* 【新增】把当前界面语言补写进云端 settings.lang：
       只在"上次同步过的语言"和当前语言不一致时写一次，避免每次加载都多发请求。
       服务端定时任务（每日积分邮件等）据此决定用中文还是英文生成内容。 */
    const curLang = localStorage.getItem('bb-language') || 'zh';
    if (store.get('bb-lang-synced', null) !== curLang) {
      store.set('bb-users', users);
      store.set('bb-lang-synced', curLang);
    }

    if (typeof window.updateClockFormat === 'function') {
      window.updateClockFormat(u.clock12h === true);
    }

    let rawHistory = store.get(`bb-history_${currentUser}`, []);
    history = rawHistory.map(item => typeof item === 'string' ? { q: item, t: Date.now() - 100000000 } : item);

    currentTheme = u.currentTheme || 'default';
    if (!THEMES[currentTheme]) currentTheme = 'default';

    const tConf = THEMES[currentTheme];
    /* 【修改】原先只有「带价格的主题」才会在未解锁时回落默认主题，
       现在统一走档位规则：会员到期后，档位自带的主题会自动锁回。
       个人已解锁（购买/奖励/新春邮件）的主题不受影响。 */
    const isUnlocked = themeIsOwned(currentTheme, u, status);
    if (!isUnlocked) currentTheme = 'default';
    applyFont(u.enFont, u.zhFont, u);
  } else {
    history = []; currentTheme = 'default'; applyFont('default', 'default', null);
  }

  applyTheme();
  if (typeof renderSites === 'function') renderSites();
  updateUserUI();
  $('#pointsDisplay').textContent = currentUser ? (users[currentUser].points || 0) : '0';
}

function updateUserUI() {
  const btn = $('#btnUser');
  const nameDisp = $('#userNameDisplay');
  const avatarImg = $('#topAvatar');
  const btnMail = $('#btnMail');
  const mailDot = $('#mailDot');

  btn.classList.remove('is-vip', 'is-svip');
  if (currentUser) {
    const users = getUsersDB(); const u = users[currentUser]; const status = checkVipStatus(u);
    
    // ★ 核心修复：登录后移除 data-i18n，防止语言包强行覆盖名字
    nameDisp.removeAttribute('data-i18n');
    nameDisp.textContent = currentUser;
    
    btn.style.color = ''; btn.style.borderColor = '';
    if (status.type === 'vip') btn.classList.add('is-vip');
    if (status.type === 'svip') btn.classList.add('is-svip');
    if (u.avatar) { avatarImg.src = u.avatar; btn.classList.add('has-avatar'); }
    else btn.classList.remove('has-avatar');
    btnMail.style.display = 'flex';
    const unread = u.emails && u.emails.some(e => !e.isRead);
    mailDot.style.display = unread ? 'block' : 'none';
    $('#pointsDisplay').textContent = u.points || 0;
  } else {
    // ★ 核心修复：未登录时加回 data-i18n，随语言切换
    nameDisp.setAttribute('data-i18n', 'modals.login');
    nameDisp.textContent = (typeof window.t === 'function') ? window.t('modals.login') : '登录';

    /* 【新增】未登录时面板里的“用户名”占位也跟随语言（登录后会被真实用户名覆盖） */
    const pName = $('#profileName');
    if (pName) pName.textContent = _loadT('userCenter.guestUser');
    
    btn.style.color = ''; btn.style.borderColor = '';
    btn.classList.remove('has-avatar'); btnMail.style.display = 'none'; $('#pointsDisplay').textContent = '0';
  }
}

/* 【新增】统一兑换入口（前端唯一的云端兑换调用点）
   1. 优先调用新函数 redeem_code_v4：它负责「共享码 allow_multi_use / 7天过期 / 已使用」的校验，
      并在成功时写回码表的 is_used、used_by、is_expired（这三个字段全部由后端写，前端不碰）。
   2. 如果云端尚未部署新函数（PostgREST 返回 42883 = function does not exist），
      自动回落到老的 redeem_external_code_v3，保证旧版本照常可兑换、不会白屏。 */
async function redeemCodeViaCloud(code) {
  const body = { p_code: code };
  let res = await sb.rpc('redeem_code_v4', body);
  const errMsg = (res && res.error) ? String(res.error.message || '') : '';
  if (res && res.error && (res.error.code === '42883' || errMsg.includes('redeem_code_v4'))) {
    res = await sb.rpc('redeem_external_code_v3', body);
  }
  return res;
}
window.redeemCodeViaCloud = redeemCodeViaCloud;

async function doRedeem(code, fromMail = false) {  if (!currentUser) { showToast(_loadT('common.loginRequired'), '🔒'); return false; }
  if (!code) return false;
  code = code.trim().toUpperCase();

  let users = getUsersDB(); let u = users[currentUser];
  
  /* 【修改】旧版硬编码口令 THEME-SPRING-UNLOCK 原来是「只要手输这串就发新春原版 + Plus」，
     而 JS 是公开的，任何人看到源码都能白嫖，还绕过了「Plus 必须用积分买」的规则。
     现在把这段收进「这串码必须存在于本人邮件里」才生效，拿着老邮件的用户不受影响。 */

  let mailId = '';
  if (u.emails) {
    /* 【修改】查找邮件时同时兼容新的多码数组 e.codes，一封邮件里任意一条码都能被识别 */
    const mail = u.emails.find(e => (e.code || '').toUpperCase() === code
      || (Array.isArray(e.codes) && e.codes.some(c => (c.code || '').toUpperCase() === code)));
    if (mail) {
      /* 【新增】多码邮件按「这一条码自己」的状态判断是否已领取，不再整封一起判定 */
      const entry = Array.isArray(mail.codes) ? mail.codes.find(c => (c.code || '').toUpperCase() === code) : null;
      if (entry ? !!entry.isUsed : !!mail.isUsed) { showToast(_loadT('auth.mailCodeUsed'), '❌'); return false; }
      mailId = mail.id;

      if (code === 'THEME-SPRING-UNLOCK') {
        showToast(_loadT('auth.requestingUnlock'), '⏳');
        const { error } = await sb.rpc('redeem_benefits', { p_type: 'theme', p_amount: 0, p_level: 0, p_theme: 'spring', p_mail_id: '' });
        if (error) return showToast(_loadT('auth.netRedeemFail'), '❌');
        await sb.rpc('redeem_benefits', { p_type: 'theme', p_amount: 0, p_level: 0, p_theme: 'spring-plus', p_mail_id: '' });

        if (entry) { entry.isUsed = true; } else { mail.isUsed = true; }
        store.set('bb-users', users);
        showToast(_loadT('auth.springUnlocked'), '🧧');
        if (typeof syncFromCloud === 'function') await syncFromCloud();
        loadUserData(); if (!fromMail) $('#btnUser').click();
        return true;
      }

      const ptsMail = code.match(/^POINT-STRING-(VIP|SVIP)-[A-Z0-9]{10}$/);
      if (ptsMail) {
        showToast(_loadT('auth.claimingPoints'), '⏳');
        const addPts = ptsMail[1] === 'SVIP' ? 150 : 100;
        const { data, error } = await sb.rpc('redeem_benefits', { p_type: 'points', p_amount: addPts, p_level: 0, p_theme: '', p_mail_id: mailId, p_code: code });
        if (error || data === false) return showToast(_loadT('auth.claimMaybeDone'), '❌');

        if (entry) { entry.isUsed = true; entry.isClaimed = true; } else { mail.isUsed = true; }
        store.set('bb-users', users);

        const msg = window.getLang() === 'zh' ? `兑换成功！获得 ${addPts} 积分` : `Success! Obtained ${addPts} points`;
        showToast(msg, '🪙');

        if (typeof syncFromCloud === 'function') await syncFromCloud();
        loadUserData(); if (!fromMail) $('#btnUser').click();
        return true;
      }
    }
  }

  showToast(_loadT('auth.verifyingCloud'), '⏳');
  /* 【修改】统一走 redeemCodeViaCloud：优先新函数 redeem_code_v4（支持共享码、7天过期判定），
     云端还没部署新函数时自动回落到老的 redeem_external_code_v3，不会白屏。 */
  const { data, error } = await redeemCodeViaCloud(code);

  if (error) {
    console.error(error);
    return showToast(_loadT('auth.netErrorLater'), '❌');
  }
  
  if (!data.success) {
    /* 【修改】优先用后端返回的 msgKey 走中英词表，老函数没返回 msgKey 时回落中文 msg */
    const zhMsg = data.msg || _loadT('auth.codeInvalidUsed');
    const tip = (data.msgKey && _loadT(data.msgKey) !== data.msgKey) ? _loadT(data.msgKey) : zhMsg;
    return showToast(tip, '❌');
  }

  if (data.type === 'points') {
    const msg = window.getLang() === 'zh' ? `兑换成功！获得 ${data.value} 积分` : `Success! Obtained ${data.value} points`;
    showToast(msg, '🪙'); 
  } else if (data.type === 'theme') {
    /* 【新增】主题类兑换码（新版新春码）的成功提示，中英双语走词表 */
    showToast(_loadT('auth.themeCodeSuccess'), '🎨');
  } else {
    const duration = data.value === 0 ? (window.getLang() === 'zh' ? '永久' : 'Permanent') : data.value + (window.getLang() === 'zh' ? '天' : ' Days');
    const typeStr = data.type === 'svip' ? 'SVIP' : 'VIP';
    const msg = window.getLang() === 'zh' ? `兑换成功！已获得 ${typeStr} ${duration}` : `Success! Obtained ${typeStr} for ${duration}`;
    showToast(msg, '🎉');
  }

  if (typeof syncFromCloud === 'function') await syncFromCloud();
  loadUserData(); if (!fromMail) $('#btnUser').click();

  /* 【新增】VIP 任务记账：成功兑换了一个兑换码（周任务「使用一个兑换码」） */
  try { if (window.VipTasks) window.VipTasks.track('redeemUse'); } catch (e) { /* 记账失败不影响兑换 */ }
  return true;
}

function startVipCountdown(expireTime) {
  if (window.vipTimer) clearInterval(window.vipTimer);
  const el = $('#vipCountdown');
  if (expireTime === 0) { 
    el.textContent = window.getLang() === 'zh' ? '♾️ 永久有效' : '♾️ Permanent'; 
    return; 
  }
  function update() {
    const diff = expireTime - Date.now();
    if (diff <= 0) { 
      el.textContent = window.getLang() === 'zh' ? '❌ 特权已过期' : '❌ Expired'; 
      el.style.color = '#e74c3c'; 
      clearInterval(window.vipTimer); 
      return; 
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (window.getLang() === 'zh') {
      el.textContent = `⏳ 剩余：${d > 0 ? d + '天 ' : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
    } else {
      el.textContent = `⏳ Remaining: ${d > 0 ? d + 'd ' : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    el.style.color = 'var(--accent)';
  }
  update(); window.vipTimer = setInterval(update, 1000);
}

$('#btnUser').onclick = () => {
  if (!currentUser) { renderQuickLogin(); return openOverlay($('#loginOverlay')); }
  const users = getUsersDB(); const u = users[currentUser]; const status = checkVipStatus(u);
  const days = Math.max(1, Math.ceil((Date.now() - u.regTime) / (1000 * 60 * 60 * 24)));
  $('#profileName').textContent = currentUser;
  $('#profileName').className = 'profile-name' + (status.type === 'vip' ? ' is-vip' : status.type === 'svip' ? ' is-svip' : '');
  
  if (status.type !== 'none') {
    const tag = document.createElement('span'); tag.className = 'vip-tag ' + (status.type === 'svip' ? 'svip' : 'vip');
    tag.textContent = status.type === 'svip' ? 'SVIP' : 'VIP'; $('#profileName').appendChild(tag);
    
    let expireText = '';
    if (u.vipExpire === 0) {
      expireText = window.getLang() === 'zh' ? '永久' : 'Permanent';
    } else {
      const dateStr = new Date(u.vipExpire).toLocaleDateString();
      expireText = window.getLang() === 'zh' ? dateStr + ' 到期' : 'Expires ' + dateStr;
    }
    
    $('#vipStatusText').textContent = window.getLang() === 'zh' ? `特权状态：已激活（${expireText}）` : `Status: Active (${expireText})`; 
    startVipCountdown(u.vipExpire);
  } else { 
    $('#vipStatusText').textContent = ''; 
    $('#vipCountdown').textContent = ''; 
    if (window.vipTimer) clearInterval(window.vipTimer); 
  }

  $('#profileDays').textContent = window.getLang() === 'zh' ? `面包浏览器陪伴了你 ${days} 天` : `Bread Browser has accompanied you for ${days} days`;

  /* 【新增】个性签名：回填到输入框 + 渲染在个人主页 */
  const bioVal = (typeof u.bio === 'string') ? u.bio : '';
  const bioInput = $('#bioInput');
  if (bioInput) bioInput.value = bioVal;
  const bioCount = $('#bioCount');
  if (bioCount) bioCount.textContent = `${bioVal.length} / 80`;
  const profileBio = $('#profileBio');
  if (profileBio) profileBio.textContent = bioVal;
  $('#avatarWrap').className = 'avatar-wrap' + (status.type === 'vip' ? ' is-vip' : status.type === 'svip' ? ' is-svip' : '');
  if (u.avatar) { $('#userAvatar').src = u.avatar; $('#userAvatar').style.display = 'block'; $('#userAvatarPlaceholder').style.display = 'none'; }
  else { $('#userAvatar').style.display = 'none'; $('#userAvatarPlaceholder').style.display = 'flex'; $('#userAvatarPlaceholder').textContent = currentUser[0].toUpperCase(); }

  $('#screenShakeToggle').checked = u.screenShake !== false;
  
  const betaToggle = document.getElementById('showBetaToggle');
  if (betaToggle) {
    betaToggle.checked = localStorage.getItem('bb-show-beta') === 'true';
  }

  const clockToggle = document.getElementById('clock12hToggle');
  if (clockToggle) {
    clockToggle.checked = u.clock12h === true; 
  }

  openOverlay($('#userOverlay'));

  /* 【新增】VIP 任务记账：查看个人主页（每日任务「查看个人主页」） */
  try { if (window.VipTasks) window.VipTasks.track('profileView'); } catch (e) { /* 记账失败不影响打开面板 */ }
};

$('#btnThemeSelect').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  const users = getUsersDB(); const u = users[currentUser]; const status = checkVipStatus(u);
  const grid = $('#themeGrid'); grid.innerHTML = '';
  
  Object.entries(THEMES).forEach(([key, t]) => {
    /* 【修改】主题中心改为全部展示：能不能用统一由 themeIsOwned 判定
       （个人已解锁 or 当前会员档位自带），不再靠 level 字段决定是否渲染。
       档位自带的主题只给「会员期内」使用权，到期后再点会提示锁定原因。 */
    const isUnlocked = themeIsOwned(key, u, status);

    const b = document.createElement('button');
    b.className = 'theme-btn' + (currentTheme === key ? ' active' : '') + (isUnlocked ? '' : ' locked');
    b.textContent = themeLabel(t);
    b.onclick = () => {
      if (!isUnlocked) {
        /* 统一前置校验（Plus 需原版 / Max 需 Plus / 新春原版靠 Lv10 邮件），不满足只提示原因 */
        const block = (typeof themePurchaseBlock === 'function')
          ? themePurchaseBlock(key, u, status) : { ok: true, msg: '' };
        if (!block.ok) return showToast(block.msg, '🔒');

        /* 点击「未拥有的主题」先弹自定义确认窗（未解锁｜是 / 手滑了），确认后才购买；
           确认窗关闭后仍停留在主题中心，购买成功后自动刷新列表。 */
        const cloudCost = (window.cloudSettings && window.cloudSettings.theme_prices && window.cloudSettings.theme_prices[key] !== undefined && window.cloudSettings.theme_prices[key] !== null)
          ? window.cloudSettings.theme_prices[key] : t.cost;
        showConfirmModal(
          _loadT('points.themeLockedTitle'),
          _loadT('points.themeLockedDesc', { name: themeLabel(t), cost: cloudCost, points: u.points }),
          () => {
            if (typeof executeBatchPurchase !== 'function') return;
            executeBatchPurchase([key], u, status).then(() => {
              // 购买后重新渲染主题中心，让刚解锁的主题立刻可用
              const btn = document.getElementById('btnThemeSelect');
              if (btn) btn.click();
            });
          },
          false,
          _loadT('points.buyYes'),
          _loadT('points.buyOops')
        );
        return;
      }
      currentTheme = key; u.currentTheme = key; store.set('bb-users', users);
      loadUserData(); closeOverlay($('#themeOverlay')); showToast(_loadT('auth.themeSwitched'), '🎨');
    };
    grid.appendChild(b);
  });

  const isFwTheme = currentTheme.includes('plus') || currentTheme.includes('max') || currentTheme === 'spring';
  const configArea = $('#fwConfigArea');
  if (isFwTheme && u.unlockedThemes.length >= 0) {
    configArea.style.display = 'block';
    if ($('#fwSpeedInput')) $('#fwSpeedInput').value = u.fwSpeed.toFixed(1);
    if ($('#fwFreqInput')) $('#fwFreqInput').value = u.fwFreq.toFixed(1);
    if ($('#fwThemeColorToggle')) $('#fwThemeColorToggle').checked = u.fwThemeColor !== false;
  } else {
    configArea.style.display = 'none';
  }
  openOverlay($('#themeOverlay'));
};

document.addEventListener('change', (e) => {
  if (!currentUser) return;
  
  if (e.target.id === 'fwSpeedInput' || e.target.id === 'fwFreqInput') {
    let users = getUsersDB();
    let u = users[currentUser];
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 1.0;
    val = Math.max(0.1, Math.min(5.0, val));
    e.target.value = val.toFixed(1);
    if (e.target.id === 'fwSpeedInput') u.fwSpeed = val;
    else u.fwFreq = val;
    store.set('bb-users', users);
    showToast(_loadT('auth.fwUpdated'), '⚙️');
  }

  if (e.target.id === 'fwThemeColorToggle') {
    let users = getUsersDB();
    let u = users[currentUser];
    u.fwThemeColor = e.target.checked;
    store.set('bb-users', users);
    showToast(e.target.checked ? _loadT('auth.fwColorOn') : _loadT('auth.fwColorOff'), '🎨');
  }
});

$('#btnThemeClose').onclick = () => closeOverlay($('#themeOverlay'));

$('#btnFontSelect').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  $('#enFontSearch').value = '';
  $('#zhFontSearch').value = '';
  renderFontLists();
  if ($('#enFontPreview')) updatePreviewBoxes(); 
  openOverlay($('#fontOverlay'));
};
$('#btnFontClose').onclick = () => closeOverlay($('#fontOverlay'));

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'screenShakeToggle') {
    if (!currentUser) return;
    let users = getUsersDB(); users[currentUser].screenShake = e.target.checked; store.set('bb-users', users);
    showToast(e.target.checked ? _loadT('auth.shakeOn') : _loadT('auth.shakeOff'), '📳');
  }
});

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'clock12hToggle') {
    if (!currentUser) return;
    let users = getUsersDB(); 
    users[currentUser].clock12h = e.target.checked; 
    store.set('bb-users', users);
    if (typeof window.updateClockFormat === 'function') {
      window.updateClockFormat(e.target.checked);
    }
    showToast(e.target.checked ? _loadT('auth.clock12On') : _loadT('auth.clock12Off'), '🕒');
  }
});

let isReg = false;

$('#btnAuthCancel').onclick = () => closeOverlay($('#loginOverlay'));

$('#tabLogin').onclick = () => { 
  isReg = false;
  $('#tabLogin').classList.add('active'); 
  $('#tabRegister').classList.remove('active'); 
  $('#normalInputArea').style.display = 'block';
  $('#quickLoginArea').style.display = getSavedUsers().length > 0 ? 'block' : 'none';
  $('#btnAuthSubmit').textContent = window.getLang() === 'zh' ? '登录' : 'Login'; 
  $('#pwdLabel').childNodes[0].textContent = window.getLang() === 'zh' ? '密码' : 'Password'; 
  $('#authPwd').placeholder = window.getLang() === 'zh' ? '请输入登录密码' : 'Enter password'; 
};

$('#tabRegister').onclick = () => { 
  isReg = true;
  $('#tabRegister').classList.add('active'); 
  $('#tabLogin').classList.remove('active'); 
  $('#normalInputArea').style.display = 'block';
  $('#quickLoginArea').style.display = 'none';
  $('#btnAuthSubmit').textContent = window.getLang() === 'zh' ? '注册' : 'Register'; 
  $('#pwdLabel').childNodes[0].textContent = window.getLang() === 'zh' ? '设置密码' : 'Set Password'; 
  $('#authPwd').placeholder = window.getLang() === 'zh' ? '请设置一个新密码' : 'Set a new password'; 
};

$('#btnAuthSubmit').onclick = async () => {
  const name = $('#authName').value.trim(); 
  const pwd = $('#authPwd').value.trim();
  if (!name || !pwd) return showToast(_loadT('auth.accPwdEmpty'), '⚠️');
  
  let users = getUsersDB();
  const fakeEmail = `${getSafeEmailPrefix(name)}@bread.com`;

  if (isReg) {
    if (users[name]) return showToast(_loadT('auth.userExists'), '❌');
    showToast(_loadT('auth.registering'), '⏳');

    const { data, error } = await sb.auth.signUp({ email: fakeEmail, password: pwd });
    if (error) return showToast((window.getLang() === 'zh' ? '注册失败: ' : 'Register failed: ') + error.message, '❌');

    const uid = data.user.id;
    const key = generateKey();

    users[name] = { 
      email: fakeEmail, user_id: uid, key: key, regTime: Date.now(), 
      vipType: 'none', vipExpire: 0, currentTheme: 'default', emails: [],
      clock12h: false, weatherRange: '24'
    };
    
    currentUser = name; 
    store.set('bb-current-user', name);
    
    showToast(_loadT('auth.syncingProfile'), '⏳');
    await store.set('bb-users', users); 
    
    await sb.rpc('init_user_assets', { p_username: name });
    
    saveUserToQuickList(name); 
    closeOverlay($('#loginOverlay')); 
    loadUserData();
    $('#regSuccessKey').textContent = key; 
    openOverlay($('#registerSuccessOverlay'));

  } else {
    showToast(_loadT('auth.verifyingVault'), '⏳');
    const { data, error } = await sb.auth.signInWithPassword({ email: fakeEmail, password: pwd });
    if (error) return showToast(_loadT('auth.wrongCred'), '❌');

    currentUser = name; 
    store.set('bb-current-user', name); 
    saveUserToQuickList(name); 
    closeOverlay($('#loginOverlay')); 
    
    showToast(_loadT('auth.welcomeBack'), '🍞');
    
    loadUserData(); 
    
    if (typeof checkRedPacketTime === 'function') checkRedPacketTime();
    if (typeof syncFromCloud === 'function') syncFromCloud();
  }
};

$('#regSuccessKey').onclick = () => {
  const keyText = $('#regSuccessKey').textContent;
  navigator.clipboard.writeText(keyText).then(() => { showToast(_loadT('auth.copied'), '📋'); }).catch(() => { showToast(_loadT('auth.copyFail'), '⚠️'); });
};
$('#btnRegSuccessClose').onclick = () => closeOverlay($('#registerSuccessOverlay'));

$('#btnUserClose').onclick = () => closeOverlay($('#userOverlay'));
$('#btnLogout').onclick = async () => {
  await sb.auth.signOut();
  currentUser = null; store.set('bb-current-user', null);
  if (typeof closeDevPanel === 'function') closeDevPanel();
  window.isDevMode = false;
  window.isAutoRainEnabled = false;
  closeOverlay($('#userOverlay')); loadUserData();
};
$('#btnChangePwd').onclick = () => { $('#oldPwd').value = ''; $('#newPwd').value = ''; openOverlay($('#pwdOverlay')); };
$('#btnRedeemCode').onclick = () => { $('#redeemInput').value = ''; openOverlay($('#redeemOverlay'));
  /* 【新增】VIP 任务记账：打开兑换特权页面（每日任务「查看兑换特权页面」） */
  try { if (window.VipTasks) window.VipTasks.track('redeemPage'); } catch (e) { /* 记账失败不影响打开 */ }
};

$('#btnDeleteAccount').onclick = () => { openOverlay($('#deleteConfirmOverlay')); };
$('#btnDeleteCancel').onclick = () => closeOverlay($('#deleteConfirmOverlay'));

$('#btnDeleteConfirm').onclick = () => {
  let users = getUsersDB(); let u = users[currentUser];
  showInputModal(_loadT('auth.deactivateTitle'), _loadT('auth.deactivateDesc'), '', (inputKey) => {
    if (inputKey !== u.key) return showToast(_loadT('auth.keyWrong'), '❌');
    
    delete users[currentUser]; store.set('bb-users', users);
    localStorage.removeItem(`bb-sites_${currentUser}`); localStorage.removeItem(`bb-history_${currentUser}`);
    removeUserFromQuickList(currentUser); currentUser = null; store.set('bb-current-user', null);
    if (typeof closeDevPanel === 'function') closeDevPanel();
    closeOverlay($('#deleteConfirmOverlay')); closeOverlay($('#userOverlay'));
    showToast(_loadT('auth.deactivated'), '🧹');
    setTimeout(() => { loadUserData(); showToast(_loadT('auth.cloudSyncDone'), '☁️'); }, 1500);
  });
};

$('#btnPwdCancel').onclick = () => closeOverlay($('#pwdOverlay'));

$('#btnPwdSave').onclick = async () => {
  const oldV = $('#oldPwd').value.trim(); 
  const newV = $('#newPwd').value.trim();
  
  if (!oldV || !newV) return showToast(_loadT('auth.fillComplete'), '⚠️');
  if (newV.length < 8) return showToast(_loadT('auth.pwdTooShort'), '⚠️');
  
  let users = getUsersDB(); 
  let u = users[currentUser];

  if (u.key !== oldV) {
    return showToast(_loadT('auth.oldPwdWrong'), '❌');
  }

  showToast(_loadT('auth.keyVerified'), '⏳');
  const { data, error } = await sb.auth.updateUser({ password: newV });
  
  if (error) {
    showToast((window.getLang() === 'zh' ? '密码修改失败: ' : 'Password change failed: ') + error.message, '❌');
  } else {
    closeOverlay($('#pwdOverlay')); 
    showToast(_loadT('auth.pwdChanged'), '🔐');
  }
};

$('#btnRedeemCancel').onclick = () => closeOverlay($('#redeemOverlay'));
$('#btnRedeemSubmit').onclick = async () => {
  const code = $('#redeemInput').value.trim();
  if (await doRedeem(code, false)) closeOverlay($('#redeemOverlay'));
};

$('#avatarWrap').onclick = () => { $('#avatarUpload').click(); };
$('#avatarUpload').onchange = (e) => {
  const f = e.target.files[0]; 
  if (!f) return;
  
  if (f.size > 2 * 1024 * 1024) {
    showToast(_loadT('auth.imgTooLarge'), '⚠️');
    e.target.value = ''; 
    return;
  }
  
  showToast(_loadT('auth.processingImg'), '⏳');
  const reader = new FileReader();
  
  reader.onload = ev => {
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement('canvas'); 
      const MAX = 512; 
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
      c.width = w; c.height = h; 
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      
      c.toBlob(async (blob) => {
        if (!blob) return showToast(_loadT('auth.imgProcessFail'), '❌');
        
        const userData = getUsersDB()[currentUser];
        const safePrefix = userData && userData.user_id ? userData.user_id : 'user_' + Date.now();
        const fileName = `${safePrefix}.jpg`; 
        
        try {
          const { data, error } = await sb.storage.from('avatars').upload(fileName, blob, {
            upsert: true,
            contentType: 'image/jpeg'
          });
          if (error) throw error;
          
          const { data: urlData } = sb.storage.from('avatars').getPublicUrl(fileName);
          const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
          
          let users = getUsersDB(); 
          users[currentUser].avatar = publicUrl; 
          
          await store.set('bb-users', users); 
          
          updateUserUI();
          $('#userAvatar').src = publicUrl; 
          $('#userAvatar').style.display = 'block'; 
          $('#userAvatarPlaceholder').style.display = 'none';
          showToast(_loadT('auth.avatarUpdated'), '🖼️');

          /* 【新增】VIP 任务记账：修改个人资料（换头像即计入「每日修改一次个人资料」） */
          try { if (window.VipTasks) window.VipTasks.track('profileEdit'); } catch (e) { /* 记账失败不影响上传 */ }

        } catch (err) {
          console.error(err);
          showToast((window.getLang() === 'zh' ? '头像上传失败: ' : 'Avatar upload failed: ') + err.message, '❌');
        }
      }, 'image/jpeg', 0.85); 
    }; 
    img.src = ev.target.result;
  }; 
  
  reader.readAsDataURL(f); 
  e.target.value = '';
};

/* 【新增】个性签名交互：字数统计 + 保存（最多 80 字）
   保存成功后计入 VIP 任务「修改一次个人资料」；清空保存同样算一次修改。 */
(function initBioEditor() {
  const input = $('#bioInput');
  const btn = $('#btnSaveBio');
  const count = $('#bioCount');
  if (!input || !btn) return;

  const syncCount = () => { if (count) count.textContent = `${input.value.length} / 80`; };
  input.addEventListener('input', syncCount);
  syncCount();

  btn.onclick = async () => {
    if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
    const users = getUsersDB();
    const u = users[currentUser];
    if (!u) return showToast(_loadT('common.loginRequired'), '🔒');

    const val = String(input.value || '').slice(0, 80);
    u.bio = val;
    await store.set('bb-users', users);

    const profileBio = $('#profileBio');
    if (profileBio) profileBio.textContent = val;
    showToast(val ? _loadT('userCenter.bioSaved') : _loadT('userCenter.bioEmpty'), '✍️');

    /* 记账：修改资料（与换头像共用同一个事件） */
    try { if (window.VipTasks) window.VipTasks.track('profileEdit'); } catch (e) { /* 记账失败不影响保存 */ }
  };
})();
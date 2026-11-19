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
    /* 【修改】20261118 P0：老快照缺资产字段时，如果已经有云端基线就补基线值，
       不要一律补 0 / none / []，否则下一次 store.set 会把云端资产写成默认值。 */
    const baseNow = (typeof window.__bbGetAssetsBase === 'function' && db[name].user_id)
      ? window.__bbGetAssetsBase(db[name].user_id) : null;
    if (typeof db[name].vipType !== 'string') db[name].vipType = baseNow ? baseNow.vip_type : 'none';
    if (typeof db[name].vipExpire !== 'number') db[name].vipExpire = baseNow ? baseNow.vip_expire : 0;
    if (typeof db[name].currentTheme !== 'string') db[name].currentTheme = 'default';
    if (!Array.isArray(db[name].emails)) db[name].emails = [];
    if (typeof db[name].regTime !== 'number' || !db[name].regTime) db[name].regTime = Date.now();
    if (typeof db[name].avatar !== 'string') db[name].avatar = '';
    if (typeof db[name].points !== 'number') db[name].points = baseNow ? baseNow.points : 0;
    if (typeof db[name].lastResetMonth !== 'string') db[name].lastResetMonth = '';
    if (!Array.isArray(db[name].unlockedThemes)) db[name].unlockedThemes = baseNow ? baseNow.unlocked_themes.slice() : [];
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
  /* 【修改】20261119：按需求取消「积分每月清零」，只记录月份，不再把 points 置 0 */
  if (u.lastResetMonth !== monthStr) { u.lastResetMonth = monthStr; changed = true; }
  return changed;
}

function loadUserData() {
  const sitesKey = currentUser ? `bb-sites_${currentUser}` : 'bb-sites-guest';
  sites = store.get(sitesKey, null) || JSON.parse(JSON.stringify(DEFAULT_SITES));

  let users = null;
  if (currentUser) {
    users = getUsersDB();
    /* 【修改】20261118 P0：本地确实没有这条记录时，直接按游客渲染。
       以前在 __guestFallback 下保留 currentUser，但 users[currentUser] 仍是 undefined，
       后面 checkSystemEmails / updateUserUI 会直接抛 TypeError。
       新设备登录已在登录流程里先重载一次装回云端记录，这里只是兜底。 */
    if (!users[currentUser]) {
      currentUser = null; store.set('bb-current-user', null); users = null;
    }
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
      if (window.VipReward.migrateMails(u)) {
        store.set('bb-users', users);
        /* 【修改】20261118 P0：拆信只改 emails，改用单列 RPC 同步。 */
        if (typeof syncEmailsToCloud === 'function') syncEmailsToCloud(u);
      }
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
  /* 【新增】20261119：主题码也走邮箱/礼物统一入口时，直接路由到主题核销 RPC。 */
  const normalized = String(code || '').trim().toUpperCase();
  if (THEME_REDEEM_CODE_RE.test(normalized)) {
    return sb.rpc('redeem_theme_code', { p_code: normalized });
  }
  const body = { p_code: code };
  let res = await sb.rpc('redeem_code_v4', body);
  const errMsg = (res && res.error) ? String(res.error.message || '') : '';
  if (res && res.error && (res.error.code === '42883' || errMsg.includes('redeem_code_v4'))) {
    res = await sb.rpc('redeem_external_code_v3', body);
  }
  return res;
}
window.redeemCodeViaCloud = redeemCodeViaCloud;

/* 【新增】20261119：主题兑换码统一走后端码表。
   格式：THEME-STRING-<主题Key>-UNLOCK-<10位随机大写字母/数字>
   例如：THEME-STRING-WINTER-UNLOCK-A1B2C3D4E5
   前端只做格式校验，码是否存在、是否过期、是否已用全部由后端
   redeem_theme_code 判断，避免固定码写死在前端被白嫖。 */
const THEME_REDEEM_CODE_RE = /^THEME-STRING-([A-Z0-9]+)-UNLOCK-([A-Z0-9]{10})$/;

async function redeemThemeCodeViaCloud(code) {
  return sb.rpc('redeem_theme_code', { p_code: code });
}

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
        /* 【修改】20261118 P0：emails 不再随 bread_assets 整行 upsert，改用单列 RPC 同步。 */
        if (typeof syncEmailsToCloud === 'function') await syncEmailsToCloud(u);
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
        /* 【修改】20261118 P0：emails 不再随 bread_assets 整行 upsert，改用单列 RPC 同步。 */
        if (typeof syncEmailsToCloud === 'function') await syncEmailsToCloud(u);

        const msg = window.getLang() === 'zh' ? `兑换成功！获得 ${addPts} 积分` : `Success! Obtained ${addPts} points`;
        showToast(msg, '🪙');

        if (typeof syncFromCloud === 'function') await syncFromCloud();
        loadUserData(); if (!fromMail) $('#btnUser').click();
        return true;
      }
    }
  }

  /* 【新增】20261119：主题兑换码走后端码表核销，前端不再写死固定码。 */
  if (THEME_REDEEM_CODE_RE.test(code)) {
    showToast(_loadT('auth.verifyingCloud'), '⏳');
    const { data, error } = await redeemThemeCodeViaCloud(code);
    if (error) {
      console.error('[theme redeem]', error);
      showToast(_loadT('auth.netErrorLater'), '❌');
      return false;
    }
    if (!data || data.success === false) {
      const key = (data && data.msgKey) ? data.msgKey : 'auth.codeInvalidUsed';
      const tip = _loadT(key, _loadT('auth.codeInvalidUsed'));
      showToast(tip, '❌');
      return false;
    }

    showToast(_loadT('auth.themeCodeSuccess'), '🎨');
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData(); if (!fromMail) $('#btnUser').click();
    return true;
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
    /* 【修改】20261118：兑换成功后先在本地加一次积分，界面立刻有反馈；
       随后 syncFromCloud() 会用云端权威值再校正一遍，不会重复加。 */
    try {
      u.points = (Number(u.points) || 0) + (Number(data.value) || 0);
      store.set('bb-users', users);
      $('#pointsDisplay').textContent = u.points;
    } catch (e) { /* 本地更新失败不影响云端结果 */ }
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
  /* 【修改】20261119：先开窗再渲染，第二次打开时渲染异常也不会「点了没反应」 */
  openOverlay($('#userOverlay'));
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

  /* 【修改】20261119：openOverlay 已移到函数开头，这里不再重复打开 */

  /* 【新增】VIP 任务记账：查看个人主页（每日任务「查看个人主页」） */
  try { if (window.VipTasks) window.VipTasks.track('profileView'); } catch (e) { /* 记账失败不影响打开面板 */ }
};

/* 【修正】20261119：主题中心偶发「点了打不开、刷新才好」。
   原因有两个：
   1) 原来 openOverlay 写在函数最后，函数体里 currentTheme / u.unlockedThemes 缺失时
      抛异常就直接中断，弹窗永远打不开；
   2) 点击事件是直接挂 onclick 的，元素一旦被重渲染就丢监听。
   现在改为：先开弹窗再做渲染（出错只落日志），并用事件委托绑定。 */
function openThemeCenter() {
  const ov = $('#themeOverlay');
  if (!ov) return;

  /* 用户对象容错：内存里的 currentUser 丢了就从本地记录兜回来 */
  const uname = currentUser || store.get('bb-current-user', null);
  const users = getUsersDB();
  const u = (uname && users[uname]) ? users[uname] : null;

  openOverlay(ov);
  if (!u) return showToast(_loadT('common.loginRequired'), '🔒');
  if (!Array.isArray(u.unlockedThemes)) {
    u.unlockedThemes = (typeof themeOwnedKeys === 'function') ? themeOwnedKeys(u) : [];
  }
  const status = checkVipStatus(u);
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
      loadUserData();
      /* 【修改】20261119：切主题后立刻换一组问候语 / 心情短句；
         同系列换档（如 flower → flower-plus）也照样换。 */
      if (typeof window.refreshHomeTextForThemeChange === 'function') {
        window.refreshHomeTextForThemeChange();
      }
      closeOverlay($('#themeOverlay')); showToast(_loadT('auth.themeSwitched'), '🎨');
    };
    grid.appendChild(b);
  });

  /* 【修改】20261119：Base 不放烟花，只有 Plus / Max / Ultimate 才显示参数。 */
  const isFwTheme = !!currentTheme && (
    currentTheme.includes('plus') ||
    currentTheme.includes('max') ||
    currentTheme.includes('ultimate') ||
    (typeof window.hasThemeSpecialFireworks === 'function' && window.hasThemeSpecialFireworks(currentTheme))
  );
  const configArea = $('#fwConfigArea');
  if (isFwTheme) {
    configArea.style.display = 'block';
    if ($('#fwSpeedInput')) $('#fwSpeedInput').value = Number(u.fwSpeed || 1).toFixed(1);
    if ($('#fwFreqInput')) $('#fwFreqInput').value = Number(u.fwFreq || 1).toFixed(1);
    if ($('#fwThemeColorToggle')) $('#fwThemeColorToggle').checked = u.fwThemeColor !== false;
    if ($('#fwTimeMode')) $('#fwTimeMode').value = u.fwTimeMode || 'both';
  } else {
    configArea.style.display = 'none';
  }

  /* 【新增】20261119：背景 emoji 方向 + 冬日雪境设置 */
  if ($('#emojiDirSelect')) $('#emojiDirSelect').value = (() => {
    try {
      const saved = store.get('bb-emoji-dir', null);
      if (saved && saved.user === currentUser && saved.dir) return saved.dir;
    } catch (err) { /* 忽略本地读取失败 */ }
    return u.emojiDir || 'up';
  })();
  /* 【新增】20261119：背景 Emoji 出现频率回填（本地小键） */
  if ($('#emojiFreqInput')) {
    let freq = 1;
    try {
      const saved = store.get('bb-emoji-freq', null);
      if (saved && saved.user === currentUser && Number.isFinite(Number(saved.freq))) {
        freq = Math.min(25, Math.max(0.5, Number(saved.freq)));
      }
      if (typeof window.currentEmojiFrequency === 'function') {
        freq = window.currentEmojiFrequency();
      }
    } catch (err) { /* 忽略本地读取失败 */ }
    $('#emojiFreqInput').value = freq.toFixed(1);
  }
  /* 【新增】20261119：问候语 / 心情短句跟随主题回填 */
  if ($('#homeTextThemeToggle')) {
    let follow = false;
    try { follow = localStorage.getItem('bb-home-text-follow-theme') === '1'; } catch (err) { /* 忽略 */ }
    $('#homeTextThemeToggle').checked = follow;
    $('#homeTextThemeToggle').onchange = (e) => {
      if (typeof window.updateHomeTextFollowTheme === 'function') {
        window.updateHomeTextFollowTheme(e.target.checked);
      }
    };
  }

  const isWinterFx = /^winter-(plus|max|ultimate)$/.test(currentTheme || '');
  const winterArea = $('#winterConfigArea');
  if (winterArea) winterArea.style.display = isWinterFx ? 'block' : 'none';
  if (isWinterFx) {
    if ($('#winterSnowSpeed')) $('#winterSnowSpeed').value = Number(u.winterSnowSpeed || 1).toFixed(1);
    if ($('#winterSnowWind')) $('#winterSnowWind').value = Number(u.winterSnowWind === undefined ? 0.5 : u.winterSnowWind).toFixed(1);
    if ($('#winterSnowDir')) $('#winterSnowDir').value = u.winterSnowDir || 'right';
    if ($('#winterSnowDensity')) $('#winterSnowDensity').value = Number(u.winterSnowDensity || 1).toFixed(1);
    if ($('#winterSnowForce')) $('#winterSnowForce').checked = !!u.winterSnowForce;
  }
  if (window.WinterFX && typeof window.WinterFX.sync === 'function') {
    try { window.WinterFX.sync(); } catch (err) { console.warn('[冬日雪境] 同步失败', err); }
  }

  /* 【新增】20261119：雨效设置回填（绿野仙踪 / 春日花信 / 盛夏海岸 / 秋日私语） */
  const themeMeta = (typeof THEMES !== 'undefined' && THEMES) ? THEMES[currentTheme] : null;
  /* 【修改】20261119：雨效只对 Plus / Max / Ultimate 开放，基础版不显示设置、不触发。 */
  const isRainTier = /-(plus|max|ultimate)$/.test(currentTheme || '');
  const isRainFx = isRainTier && (/^forest(-|$)/.test(currentTheme || '')
    || !!(themeMeta && (themeMeta.season === 'spring' || themeMeta.season === 'summer' || themeMeta.season === 'autumn')));
  const rainArea = $('#rainConfigArea');
  if (rainArea) rainArea.style.display = isRainFx ? 'block' : 'none';
  /* 【新增】20261119：网页声音总开关在所有主题下都回填；旧账号默认开启。 */
  if ($('#rainSound')) $('#rainSound').checked = u.rainSound === undefined ? true : !!u.rainSound;
  if (isRainFx) {
    if ($('#rainSpeed')) $('#rainSpeed').value = Number(u.rainSpeed || 1).toFixed(1);
    if ($('#rainWind')) $('#rainWind').value = Number(u.rainWind === undefined ? 0.5 : u.rainWind).toFixed(1);
    if ($('#rainDir')) $('#rainDir').value = u.rainDir === 'left' ? 'left' : 'right';
    if ($('#rainDensity')) $('#rainDensity').value = Number(u.rainDensity || 1).toFixed(1);
    if ($('#rainForce')) $('#rainForce').checked = !!u.rainForce;
  }
  /* 【新增】20261119：主题中心打开时同步雨效，主题未切换也不会残留旧雨层 */
  if (window.RainFX && typeof window.RainFX.sync === 'function') {
    try { window.RainFX.sync(); } catch (err) { console.warn('[雨效] 同步失败', err); }
  }
}

/* 【修正】20261119：事件委托绑定，元素被重渲染也不会丢监听；双击防抖 */
document.addEventListener('click', (e) => {
  const btn = e.target.closest ? e.target.closest('#btnThemeSelect') : null;
  if (!btn) return;
  e.preventDefault();
  try { openThemeCenter(); } catch (err) { console.warn('[主题中心] 打开失败', err); }
});

document.addEventListener('change', (e) => {
  if (!currentUser) return;
  
  if (e.target.id === 'fwSpeedInput' || e.target.id === 'fwFreqInput') {
    let users = getUsersDB();
    let u = users[currentUser];
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 1.0;
    val = Math.max(0.1, Math.min(25.0, val));
    e.target.value = val.toFixed(1);
    if (e.target.id === 'fwSpeedInput') u.fwSpeed = val;
    else u.fwFreq = val;
    /* 【修改】20261119：只写 preferences.settings，不整行写 assets */
    store.set('bb-users', users, { prefsOnly: true });
    showToast(_loadT('auth.fwUpdated'), '⚙️');
  }

  if (e.target.id === 'fwThemeColorToggle') {
    let users = getUsersDB();
    let u = users[currentUser];
    u.fwThemeColor = e.target.checked;
    store.set('bb-users', users, { prefsOnly: true });
    showToast(e.target.checked ? _loadT('auth.fwColorOn') : _loadT('auth.fwColorOff'), '🎨');
  }

  /* 【新增】20261119：烟花时段（白天 / 夜间 / 都放） */
  if (e.target.id === 'fwTimeMode') {
    let users = getUsersDB();
    let u = users[currentUser];
    u.fwTimeMode = e.target.value === 'day' || e.target.value === 'night' ? e.target.value : 'both';
    store.set('bb-users', users, { prefsOnly: true });
    showToast(_loadT('auth.fwTimeUpdated'), '🕒');
  }

  /* 【新增】20261119：背景 emoji 方向切换后立即重排背景 */
  if (e.target.id === 'emojiDirSelect') {
    if (!currentUser) return;
    const dir = e.target.value || 'up';
    /* 【修改】20261119：切换方向仍只做轻量本地值，但额外把方向写进 preferences.settings，
       换设备后能恢复；prefsOnly 不会碰 bread_assets，避免整行资产写入。 */
    window.__emojiDir = { user: currentUser, dir };
    try {
      localStorage.setItem('bb-emoji-dir', JSON.stringify({ user: currentUser, dir }));
    } catch (err) { console.warn('[emojiDir] 本地保存失败', err); }
    try {
      const users = getUsersDB();
      const u = users[currentUser];
      if (u && u.user_id) {
        u.emojiDir = dir;
        store.set('bb-users', users, { prefsOnly: true });
      }
    } catch (err) { console.warn('[emojiDir] 云端保存失败', err); }
    if (typeof refreshEmojiBackground === 'function') refreshEmojiBackground(true);
    showToast(_loadT('auth.emojiDirUpdated') || '🌀', '🌀');
  }

  /* 【新增】20261119：背景 emoji 出现频率。
     本地立即生效，再把频率轻量写进 preferences.settings。 */
  if (e.target.id === 'emojiFreqInput') {
    if (!currentUser) return;
    let freq = parseFloat(e.target.value);
    if (!Number.isFinite(freq)) freq = 1;
    freq = Math.min(25, Math.max(0.5, freq));
    e.target.value = freq.toFixed(1);
    window.__emojiFreq = { user: currentUser, freq };
    try {
      localStorage.setItem('bb-emoji-freq', JSON.stringify({ user: currentUser, freq }));
    } catch (err) { console.warn('[emojiFreq] 本地保存失败', err); }
    /* 【新增】20261119：出现频率也写进 preferences.settings，换设备保留 */
    try {
      const users = getUsersDB();
      const u = users[currentUser];
      if (u && u.user_id) {
        u.emojiFreq = freq;
        store.set('bb-users', users, { prefsOnly: true });
      }
    } catch (err) { console.warn('[emojiFreq] 云端保存失败', err); }
    if (typeof refreshEmojiBackground === 'function') refreshEmojiBackground();
    showToast(_loadT('auth.emojiFreqUpdated') || '✨', '✨');
  }
});

$('#btnThemeClose').onclick = () => closeOverlay($('#themeOverlay'));

$('#btnFontSelect').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  /* 【修改】20261119：先开窗再渲染，字体列表渲染异常时也不会「点了没反应」 */
  openOverlay($('#fontOverlay'));
  $('#enFontSearch').value = '';
  $('#zhFontSearch').value = '';
  try {
    renderFontLists();
    if ($('#enFontPreview')) updatePreviewBoxes();
  } catch (err) { console.warn('[字体中心] 渲染失败', err); }
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
    /* 【修改】20261118 P0：注册是新行，显式 forceAssets；普通保存不再整行写资产。 */
    await store.set('bb-users', users, { forceAssets: true });
    
    await sb.rpc('init_user_assets', { p_username: name });
    
    /* 【修改】20261118 P0：注册后立刻建立云端基线。
       否则接下来 loadUserData / 新人邮件 / 任务奖励的 store.set 都会因为「没有基线」被跳过，
       要等用户手动刷新一次才恢复同步。 */
    if (typeof syncFromCloud === 'function') {
      try { await syncFromCloud(); } catch (e) { /* 首次拉取失败不阻塞注册 */ }
    }

    saveUserToQuickList(name); 
    closeOverlay($('#loginOverlay')); 
    loadUserData();
    $('#regSuccessKey').textContent = key; 
    openOverlay($('#registerSuccessOverlay'));

  } else {
    showToast(_loadT('auth.verifyingVault'), '⏳');
    const { data, error } = await sb.auth.signInWithPassword({ email: fakeEmail, password: pwd });
    if (error) return showToast(_loadT('auth.wrongCred'), '❌');

    /* 【修改】20261118 P0：新设备/清缓存后本地没有这条用户记录。
       以前直接 loadUserData()，会在 users[currentUser] 为空时抛 TypeError；
       而且 syncFromCloud() 也因为没有 u 直接 return，本次会话一直空白。
       这里记下登录态后重载一次，让 startCloudSync 按 bread_users + bread_assets 把本地用户装回来。 */
    const localDb = getUsersDB();
    if (!localDb[name]) {
      currentUser = name;
      store.set('bb-current-user', name);
      saveUserToQuickList(name);
      closeOverlay($('#loginOverlay'));
      const langNow = (typeof window.getLang === 'function') ? window.getLang() : (localStorage.getItem('bb-language') || 'zh');
      showToast(langNow === 'zh' ? '正在从云端恢复账号…' : 'Restoring account from cloud…', '☁️');
      setTimeout(() => { location.reload(); }, 500);
      return;
    }

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
  /* 【修改】20261118 P1：退出登录必须确认 signOut 成功再清本地登录态；
     否则清掉本地后 Supabase 会话还在，刷新会被 startCloudSync 自动装回来。 */
  try {
    const { error } = await sb.auth.signOut();
    if (error) {
      const langNow = (typeof window.getLang === 'function') ? window.getLang() : (localStorage.getItem('bb-language') || 'zh');
      return showToast(langNow === 'zh' ? '退出登录失败，请检查网络后重试' : 'Logout failed. Check your network and try again.', '❌');
    }
  } catch (e) {
    const langNow = (typeof window.getLang === 'function') ? window.getLang() : (localStorage.getItem('bb-language') || 'zh');
    return showToast(langNow === 'zh' ? '退出登录失败，请检查网络后重试' : 'Logout failed. Check your network and try again.', '❌');
  }
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
  if (!u) return showToast(_loadT('common.loginRequired', '🔒'));
  const langNow = (typeof window.getLang === 'function') ? window.getLang() : (localStorage.getItem('bb-language') || 'zh');
  showInputModal(_loadT('auth.deactivateTitle'), _loadT('auth.deactivateDesc'), '', async (inputKey) => {
    if (inputKey !== u.key) return showToast(_loadT('auth.keyWrong'), '❌');

    showToast(langNow === 'zh' ? '正在删除云端账号…' : 'Deleting cloud account…', '⏳');

    /* 【修改】20261118 P1：注销账号必须先让服务端删除 bread_users / bread_assets /
       bread_preferences 以及 Supabase auth 用户，再清本地。
       以前只删 localStorage，云端记录还在，刷新后 startCloudSync 会把账号原样装回来。
       对应 SQL 函数：public.delete_account()（见 sql/20261118-p1-p2-hardening.sql）。 */
    let rpcRes;
    try {
      rpcRes = await sb.rpc('delete_account');
    } catch (e) {
      rpcRes = { error: e };
    }
    const ok = !!(rpcRes && !rpcRes.error
      && (rpcRes.data === true || (rpcRes.data && rpcRes.data.ok === true)));
    if (!ok) {
      const msg = (rpcRes && rpcRes.error && rpcRes.error.message)
        || (rpcRes && rpcRes.data && rpcRes.data.msg)
        || 'delete_account failed';
      console.error('[account] 云端注销失败', msg);
      showToast(langNow === 'zh'
        ? `注销失败：${msg}（请确认已执行 delete_account SQL）`
        : `Delete failed: ${msg} (make sure the delete_account SQL is applied)`, '❌');
      return;
    }

    try { await sb.auth.signOut(); } catch (e) { /* auth 用户已删除，signOut 失败也不影响 */ }

    delete users[currentUser]; store.set('bb-users', users);
    localStorage.removeItem(`bb-sites_${currentUser}`); localStorage.removeItem(`bb-history_${currentUser}`);
    removeUserFromQuickList(currentUser); currentUser = null; store.set('bb-current-user', null);
    if (typeof closeDevPanel === 'function') closeDevPanel();
    closeOverlay($('#deleteConfirmOverlay')); closeOverlay($('#userOverlay'));
    showToast(_loadT('auth.deactivated'), '🧹');
    /* 【修改】20261118 P1：重载一次，确保没有任何旧会话/旧本地记录把账号装回来 */
    setTimeout(() => { location.reload(); }, 800);
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
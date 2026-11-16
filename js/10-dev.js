/* =========================================================
   10-dev.js
   开发者模式：免密通行证、三端执行、云端数据强改
   ========================================================= */

window.isDevMode = false; 
window.isAutoRainEnabled = false; 
const DEV_UUID = 'b53b3bc6-6126-42a5-8f9c-c80f93196d58';

function closeDevPanel() {
  window.isDevMode = false;
  window.isAutoRainEnabled = false; 
  const btn = $('#btnDevAutoRain');
  if (btn) {
    btn.style.color = '#9b59b6'; btn.style.background = 'transparent';
    btn.textContent = _loadT('dev.autoRainBtnOff', '🤖 自动领取红包(0.7秒)');
  }
  $('#devPanel').classList.remove('show');
}

document.addEventListener('keydown', async (e) => {
  if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
  if (currentUser && e.key.toLowerCase() === 'k') {
    if (window.isDevMode) {
      window.isDevMode = false; $('#devPanel').classList.remove('show');
      return showToast(_loadT('dev.devOff', '开发者模式已关闭'), '🔒');
    }
    try {
      showToast(_loadT('dev.verifyingIdentity', '正在向云端验证身份...'), '⏳');
      const { data: { user }, error } = await sb.auth.getUser();
      if (error || !user) return showToast(_loadT('dev.verifyFailNotLogged', '验证失败：未登录'), '❌');
      if (user.id === DEV_UUID) {
        window.isDevMode = true; $('#devPanel').classList.add('show');
        showToast(_loadT('dev.verifySuccess', '身份验证通过，欢迎主理人！'), '👑');
      } else { showToast(_loadT('dev.accessDenied', '拒绝访问：无管理员权限'), '🚫'); }
    } catch (err) { showToast(_loadT('dev.requestFail', '请求失败，检查网络'), '❌'); }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = $('#searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val.startsWith('bread-key-') && val.length === 42) {
          e.preventDefault();
          try {
            const { data: { user }, error } = await sb.auth.getUser();
            if (!error && user && user.id === DEV_UUID) {
              const users = getUsersDB();
              if (users[currentUser] && users[currentUser].key === val) {
                window.isDevMode = true;
                $('#devPanel').classList.add('show');
                showToast(_loadT('dev.geekPass', '极客暗号验证通过，欢迎主理人！'), '🕶️');
                searchInput.value = '';
                return;
              }
            }
            showToast(_loadT('dev.invalidKeyword', '无效的暗号'), '🚫');
            searchInput.value = '';
          } catch (err) {
            showToast(_loadT('dev.keywordFail', '暗号验证失败'), '❌');
          }
        }
      }
    });
  }
});

$('#btnDevClose').onclick = () => { closeDevPanel(); showToast(_loadT('dev.devOff', '开发者模式已关闭'), '🔒'); };

let currentRunMode = 'js';

function checkDevSecret(mode, callback) {
    const now = Date.now();
    const bypassDataStr = localStorage.getItem('bb-dev-bypass');
    if (bypassDataStr) {
        try {
            const bypass = JSON.parse(bypassDataStr);
            if (bypass[mode] && bypass[mode].count > 0 && bypass[mode].expire > now) {
                bypass[mode].count--;
                localStorage.setItem('bb-dev-bypass', JSON.stringify(bypass));
                showToast(_loadT('dev.bypassPass', { count: bypass[mode].count }), '🔓');
                callback();
                return;
            }
        } catch(e) {}
    }
    
    const modeName = mode === 'js' ? _loadT('dev.modeJs', '前端') : mode === 'sql' ? _loadT('dev.modeSql', '后端') : _loadT('dev.modeAll', '全栈');
    showInputModal(_loadT('dev.authTitle', '身份验证'), _loadT('dev.authDesc', { mode: modeName }), '', async (input) => {
        if (!input) return;
        showToast(_loadT('dev.verifyingKey', '正在向云端验证密钥...'), '⏳');
        const { data, error } = await sb.rpc('verify_dev_secret', { p_mode: mode, p_input: input });
        
        if (error) return showToast(_loadT('dev.netError', '网络错误: ') + error.message, '❌');
        
        if (data === true) {
            showToast(_loadT('dev.keyCorrect', '密钥正确，欢迎主理人'), '👑');
            setTimeout(() => {
                showInputModal(_loadT('dev.bypassTitle', '免密设置'), _loadT('dev.bypassDesc', '是否在当前电脑开启免密通行证？\n请输入免密次数 (输入0则本次单次生效)'), '15', (countStr) => {
                    const count = parseInt(countStr, 10);
                    if (!isNaN(count) && count > 0) {
                        const bypassDataStr = localStorage.getItem('bb-dev-bypass');
                        let bypass = bypassDataStr ? JSON.parse(bypassDataStr) : {};
                        bypass[mode] = { count: count - 1, expire: now + 24 * 60 * 60 * 1000 };
                        localStorage.setItem('bb-dev-bypass', JSON.stringify(bypass));
                        showToast(_loadT('dev.bypassOn', { count: count - 1 }), '🔓');
                    }
                    callback();
                });
            }, 300);
        } else {
            showToast(_loadT('dev.keyWrong', '密钥错误，拒绝访问！'), '🚫');
        }
    });
}

function openDevRunner(mode) {
    currentRunMode = mode;
    const title = $('#runCodeTitle');
    const jsArea = $('#jsCodeArea');
    const sqlArea = $('#sqlCodeArea');
    
    if (!title || !jsArea || !sqlArea) return alert(_loadT('dev.missingRunner', '页面缺少双端输入弹窗结构，请更新 index.html！'));
    
    if (mode === 'js') title.textContent = _loadT('dev.runJsTitle', '💻 执行自定义代码(前端)');
    else if (mode === 'sql') title.textContent = _loadT('dev.runSqlTitle', '📡 执行自定义代码(后端)');
    else title.textContent = _loadT('dev.runAllTitle', '🚀 执行自定义代码(前端+后端)');

    jsArea.style.display = (mode === 'js' || mode === 'all') ? 'block' : 'none';
    sqlArea.style.display = (mode === 'sql' || mode === 'all') ? 'block' : 'none';
    
    $('#runJsInput').value = '';
    $('#runSqlInput').value = '';
    openOverlay($('#runCodeOverlay'));
}

$('#btnDevRunJs').onclick = () => checkDevSecret('js', () => openDevRunner('js'));
$('#btnDevRunSql').onclick = () => checkDevSecret('sql', () => openDevRunner('sql'));
$('#btnDevRunAll').onclick = () => checkDevSecret('all', () => openDevRunner('all'));
$('#btnRunCodeCancel').onclick = () => closeOverlay($('#runCodeOverlay'));

$('#btnRunCodeExecute').onclick = async () => {
    const jsCode = $('#runJsInput').value.trim();
    const sqlCode = $('#runSqlInput').value.trim();
    
    if (currentRunMode === 'js' || currentRunMode === 'all') {
        if (jsCode) {
            try {
                new Function(jsCode)();
                showToast(_loadT('dev.jsOk', '前端代码执行成功'), '✅');
            } catch (e) {
                return showToast(_loadT('dev.jsErr', '前端代码错误: ') + e.message, '❌');
            }
        }
    }

    if (currentRunMode === 'sql' || currentRunMode === 'all') {
        if (sqlCode) {
            showToast(_loadT('dev.requesting', '正在请求云端执行...'), '⏳');
            const { data, error } = await sb.rpc('dev_execute_sql', { p_sql: sqlCode });
            if (error) return showToast(_loadT('dev.rpcErr', '网络或 RPC 错误: ') + error.message, '❌');
            if (!data.success) return showToast(_loadT('dev.sqlFail', '后端执行失败: ') + data.error, '❌');
            showToast(_loadT('dev.sqlOk', '后端代码执行成功'), '✅');
        }
    }

    closeOverlay($('#runCodeOverlay'));
    if (currentRunMode !== 'js' && sqlCode) {
        setTimeout(() => { if (typeof syncFromCloud === 'function') syncFromCloud(); }, 500);
    }
};

$('#btnDevStartRain').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired', '请先登录'), '⚠️');
  closeOverlay($('#confirmOverlay')); 
  if (typeof startRedPacketRain === 'function') { startRedPacketRain(); showToast(_loadT('dev.rainStarted', '红包雨已启动'), '🧧'); }
};

$('#btnDevAutoRain').onclick = () => {
  window.isAutoRainEnabled = !window.isAutoRainEnabled;
  const btn = $('#btnDevAutoRain');
  if (window.isAutoRainEnabled) {
    btn.style.color = '#fff'; btn.style.background = '#9b59b6';
    btn.textContent = _loadT('dev.autoRainBtnOn', '🤖 自动领取：已开启(0.7秒)');
    showToast(_loadT('dev.autoRainOn', '已开启自动领取'), '🤖');
  } else {
    btn.style.color = '#9b59b6'; btn.style.background = 'transparent';
    btn.textContent = _loadT('dev.autoRainBtnOff', '🤖 自动领取红包(0.7秒)');
    showToast(_loadT('dev.autoRainOff', '已关闭自动领取'), '🔒');
  }
};

$('#btnDevAddDay').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired', '请先登录'), '⚠️');
  showInputModal(_loadT('dev.addDaysTitle', '模拟增加注册时长'), _loadT('dev.addDaysDesc', '请输入要增加的天数（如：10）'), '10', async (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return showToast(_loadT('dev.invalidDays', '请输入有效的天数'), '❌');
    
    showToast(_loadT('dev.syncing', '正在同步云端...'), '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    u.regTime -= days * 24 * 60 * 60 * 1000;
    
    const { error } = await sb.from('bread_users').update({ reg_time: u.regTime }).eq('user_id', u.user_id);
    if (error) return showToast(_loadT('dev.syncFail', '同步失败'), '❌');

    store.set('bb-users', users);
    loadUserData();
    showToast(_loadT('dev.addedDays', { days }), '🛠️');
  });
};

$('#btnDevSetDay').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired', '请先登录'), '⚠️');
  showInputModal(_loadT('dev.setDaysTitle', '模拟设置注册时长'), _loadT('dev.setDaysDesc', '请输入要设置的天数（如：30）'), '30', async (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return showToast(_loadT('dev.invalidDays', '请输入有效的天数'), '❌');
    
    showToast(_loadT('dev.syncing', '正在同步云端...'), '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    u.regTime = Date.now() - days * 24 * 60 * 60 * 1000;
    
    const { error } = await sb.from('bread_users').update({ reg_time: u.regTime }).eq('user_id', u.user_id);
    if (error) return showToast(_loadT('dev.syncFail', '同步失败'), '❌');

    store.set('bb-users', users);
    loadUserData();
    showToast(_loadT('dev.daysSet', { days }), '🛠️');
  });
};

$('#btnDevSetPoints').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired', '请先登录'), '⚠️');
  showInputModal(_loadT('dev.setPointsTitle', '设置用户积分'), _loadT('dev.setPointsDesc', '请输入要设置的积分数'), '10000', async (input) => {
    const pts = parseInt(input, 10);
    if (isNaN(pts) || pts < 0) return showToast(_loadT('dev.invalidNumber', '请输入有效数字'), '❌');
    
    showToast(_loadT('dev.syncing', '正在同步云端...'), '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    const vLevel = u.vipType === 'svip' ? 2 : (u.vipType === 'vip' ? 1 : 0);
    const vExpire = u.vipExpire || 0;

    const { error } = await sb.rpc('dev_update_assets', {
      p_points: pts, p_vip_level: vLevel, p_vip_expire: vExpire, p_admin_id: DEV_UUID
    });
    if (error) return showToast(_loadT('dev.cloudFail', '云端修改失败: ') + error.message, '❌');

    u.points = pts;
    store.set('bb-users', users); 
    loadUserData();
    showToast(_loadT('dev.pointsSet', { pts }), '🪙');
  });
};

/* 【新增】开发者面板：星光值 / (S)VIP 等级调试（本轮新增，复用 VIPCore，不另造数值逻辑） */
function devVipRecord() {
  if (typeof window.VIPCore === 'undefined' || typeof window.VIPCore.currentRecord !== 'function') return null;
  return window.VIPCore.currentRecord();
}

/* 星光值只对会员有意义：先确认已登录且当前是 VIP / SVIP */
function devVipNeedMember() {
  const rec = devVipRecord();
  if (!rec) { showToast(_loadT('common.loginRequired', '请先登录'), '⚠️'); return null; }
  window.VIPCore.ensureState(rec.u);
  const type = window.VIPCore.memberTypeOf(rec.u);
  if (type === 'none') { showToast(_loadT('dev.needMember', '请先设为 VIP / SVIP，再调整星光值'), '⚠️'); return null; }
  return rec;
}

/* 改完数值后统一刷新：用户库 + 打开着的星礼面板 */
function devVipRefreshAfterChange() {
  loadUserData();
  if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
    try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略渲染异常 */ }
  }
}

$('#btnDevSetStar').onclick = () => {
  const rec = devVipNeedMember(); if (!rec) return;
  const snap = window.VIPCore.snapshot(rec.u);
  showInputModal(
    _loadT('dev.setStarTitle', '设置星光值'),
    _loadT('dev.setStarDesc', { level: snap.level, cap: snap.cap }, `当前 Lv${snap.level}，本级上限 ${snap.cap}。请输入要设置的星光值（到达上限会自动升级）`),
    String(snap.point),
    (input) => {
      const n = parseInt(input, 10);
      if (isNaN(n) || n < 0) return showToast(_loadT('dev.invalidNumber', '请输入有效数字'), '❌');
      const type = window.VIPCore.memberTypeOf(rec.u);
      rec.u.vipPoint = n;
      window.VIPCore.normalize(rec.u, type);
      window.VIPCore.persist(rec.u);
      devVipRefreshAfterChange();
      const s = window.VIPCore.snapshot(rec.u);
      showToast(_loadT('dev.starSet', { level: s.level, point: s.point, cap: s.cap }, `星光值已设为 Lv${s.level} 的 ${s.point}/${s.cap}`), '⭐');
    }
  );
};

$('#btnDevAddStar').onclick = () => {
  const rec = devVipNeedMember(); if (!rec) return;
  showInputModal(
    _loadT('dev.addStarTitle', '增加星光值'),
    _loadT('dev.addStarDesc', '请输入要增加的星光值（如：500）'),
    '500',
    (input) => {
      const n = parseInt(input, 10);
      if (isNaN(n) || n <= 0) return showToast(_loadT('dev.invalidNumber', '请输入有效数字'), '❌');
      const res = window.VIPCore.addStar(n, 'dev');
      if (!res || !res.ok) {
        const reason = res && res.reason === 'not-member'
          ? _loadT('dev.needMember', '请先设为 VIP / SVIP，再调整星光值')
          : _loadT('dev.invalidNumber', '请输入有效数字');
        return showToast(reason, '⚠️');
      }
      devVipRefreshAfterChange();
      const up = Array.isArray(res.levelUp) && res.levelUp.length;
      showToast(
        up
          ? _loadT('dev.starLevelUp', { amount: n, level: res.level }, `星光值 +${n}，升到 Lv${res.level}！`)
          : _loadT('dev.starAdded', { amount: n, level: res.level, point: res.point, cap: res.cap }, `星光值 +${n}，现为 Lv${res.level}（${res.point}/${res.cap}）`),
        up ? '🎉' : '✨'
      );
    }
  );
};

$('#btnDevSetLevel').onclick = () => {
  const rec = devVipNeedMember(); if (!rec) return;
  showInputModal(
    _loadT('dev.setLevelTitle', '设置 (S)VIP 等级'),
    _loadT('dev.setLevelDesc', '请输入目标等级（1~100），星光值会归零'),
    String(rec.u.vipLevel),
    (input) => {
      const lv = parseInt(input, 10);
      const max = window.VIPCore.maxLevel();
      if (isNaN(lv) || lv < 1 || lv > max) return showToast(_loadT('dev.invalidNumber', '请输入有效数字'), '❌');
      rec.u.vipLevel = lv;
      rec.u.vipPoint = 0;
      rec.u.vipAppliedType = window.VIPCore.memberTypeOf(rec.u);
      window.VIPCore.persist(rec.u);
      devVipRefreshAfterChange();
      const s = window.VIPCore.snapshot(rec.u);
      showToast(_loadT('dev.levelSet', { level: s.level, point: s.point, cap: s.cap }, `已设为 Lv${s.level}（星光值 ${s.point}/${s.cap}）`), '🎖️');
    }
  );
};

function setDevVip(level) {
  if (!currentUser) return showToast(_loadT('common.loginRequired', '请先登录'), '⚠️');
  
  if (level === 0) {
    showInputModal(_loadT('dev.setNoneTitle', '设为普通用户'), _loadT('dev.setNoneDesc', '确认清空所有 VIP 特权？输入任意字符确认'), _loadT('dev.confirmWord', '确认'), async (input) => {
      showToast(_loadT('dev.syncing', '正在同步云端...'), '⏳');
      let users = getUsersDB(); let u = users[currentUser];
      
      const { error } = await sb.rpc('dev_update_assets', {
        p_points: u.points || 0, p_vip_level: 0, p_vip_expire: 0, p_admin_id: DEV_UUID
      });
      if (error) return showToast(_loadT('dev.cloudFail', '云端修改失败: ') + error.message, '❌');

      u.vipType = 'none'; u.vipExpire = 0;
      store.set('bb-users', users); 
      loadUserData();
      showToast(_loadT('dev.setNoneOk', '已设为普通用户并同步云端'), '🔧');
    });
    return;
  }
  
  showInputModal(_loadT('dev.setVipTitle', { level: level === 1 ? 'VIP' : 'SVIP' }), _loadT('dev.vipDaysDesc', '输入时长（天，0为永久）'), level === 1 ? '30' : '365', async (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days < 0) return showToast(_loadT('dev.invalidDays', '请输入有效的天数'), '❌');
    
    showToast(_loadT('dev.syncing', '正在同步云端...'), '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    const expireTime = days === 0 ? 0 : Date.now() + days * 24 * 60 * 60 * 1000;

    const { error } = await sb.rpc('dev_update_assets', {
      p_points: u.points || 0, p_vip_level: level, p_vip_expire: expireTime, p_admin_id: DEV_UUID
    });
    if (error) return showToast(_loadT('dev.cloudFail', '云端修改失败: ') + error.message, '❌');

    u.vipType = level === 2 ? 'svip' : 'vip';
    u.vipExpire = expireTime;
    store.set('bb-users', users); 
    loadUserData();
    showToast(_loadT('dev.setVipOk', { level: level === 1 ? 'VIP' : 'SVIP' }), '🔧');
  });
}

$('#btnDevSetNone').onclick = () => setDevVip(0);
$('#btnDevSetVip').onclick = () => setDevVip(1);
$('#btnDevSetSvip').onclick = () => setDevVip(2);

$('#btnDevSetForever').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired', '请先登录'), '⚠️');
  showToast(_loadT('dev.syncing', '正在同步云端...'), '⏳');
  let users = getUsersDB(); let u = users[currentUser];

  sb.rpc('dev_update_assets', {
    p_points: u.points || 0, p_vip_level: 2, p_vip_expire: 0, p_admin_id: DEV_UUID
  }).then(({ error }) => {
    if (error) return showToast(_loadT('dev.cloudFail', '云端修改失败: ') + error.message, '❌');
    u.vipType = 'svip'; u.vipExpire = 0;
    store.set('bb-users', users); 
    loadUserData();
    showToast(_loadT('dev.foreverOk', '已设为永久 SVIP 并同步云端'), '🔧');
  });
};

$('#btnDevManageCodes').onclick = () => { $('#codeManageInput').value = ''; openOverlay($('#codeManageOverlay')); };

$('#btnDevGenCode').onclick = () => {
  showInputModal(_loadT('dev.genTitle', '批量生成兑换码'), _loadT('dev.genDesc', '格式：类型,数值,数量。\n例如：SVIP,30,10'), 'SVIP,30,10', async (input) => {
      const parts = input.split(',').map(s => s.trim());
      const type = (parts[0] || '').toLowerCase(); 
      const val = parseInt(parts[1], 10);
      const count = parseInt(parts[2], 10) || 1;

      if (type !== 'vip' && type !== 'svip' && type !== 'points') {
        return showToast(_loadT('dev.genTypeErr', '类型只能是 VIP / SVIP / POINT'), '❌');
      }
      if (isNaN(val) || val < 0) return showToast(_loadT('dev.genValueErr', '天数或积分数无效'), '❌');

      showToast(_loadT('dev.genRequest', { count }), '⏳');
      
      const { data, error } = await sb.rpc('generate_redeem_code_v3', {
        p_type: type, p_value: val, p_count: count, p_admin_id: DEV_UUID
      });

      if (error) return showToast(_loadT('dev.genFail', '生成失败：') + error.message, '❌');

      const codeListText = data.join('\n');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(codeListText).then(() => {
          showToast(_loadT('dev.genCopied', { count }), '📋');
        }).catch(() => {
          showToast(_loadT('dev.genDone', { count }), '🎉');
        });
      }
      showInputModal(_loadT('dev.genResultTitle', { count }), _loadT('dev.genResultDesc', '10位乱序，有效期7天。'), data[0], () => {});
    }
  );
};
$('#btnCodeManageCancel').onclick = () => closeOverlay($('#codeManageOverlay'));
/* 【修改】原来是「保存并追加」到本地 localStorage，兑换流程根本不读它，
   等于白存。现在改成：解析每行兑换码 → 直接写入云端 bread_redeem_codes 码表，
   用户输入即可立刻兑换；本地仍保留一份原始文本作为备份。 */
$('#btnCodeManageSave').onclick = async () => {
  const raw = $('#codeManageInput').value.trim();
  if (!raw) return showToast(_loadT('dev.codeEmpty', '请先输入兑换码'), '⚠️');

  const lines = raw.split(/\r?\n/).map(s => s.trim().toUpperCase()).filter(Boolean);
  const rows = [], bad = [], fixedThemeCodes = [];

  lines.forEach(line => {
    // 新春主题码是前端固定字符串，不需要写进码表
    if (line === 'THEME-SPRING-UNLOCK') { fixedThemeCodes.push(line); return; }
    const m = line.match(/^(VIP|SVIP|POINT)-STRING-([A-Z0-9]+)-([A-Z0-9]+)$/);
    if (!m) { bad.push(line); return; }
    const type = (m[1] === 'POINT') ? 'points' : m[1].toLowerCase();  // POINT → points
    const token = m[2];
    let value;
    if (token === 'LIFE') value = 0;            // LIFE = 永久
    else { const n = token.match(/\d+/); value = n ? parseInt(n[0], 10) : NaN; }
    if (!Number.isFinite(value)) { bad.push(line); return; }
    rows.push({ code: line, type, value });
  });

  if (bad.length) {
    return showToast(_loadT('dev.codeFormatErr', '以下兑换码格式不正确：') + ' ' + bad.join(' / '), '❌');
  }

  // 本地备份（保留原有行为）
  let oldRaw = store.get('bb-custom-codes-raw', '');
  if (oldRaw && !oldRaw.endsWith('\n')) oldRaw += '\n';
  store.set('bb-custom-codes-raw', oldRaw + lines.join('\n'));

  if (!rows.length) {
    closeOverlay($('#codeManageOverlay'));
    return showToast(_loadT('dev.springCodeHint', '新春兑换码是固定主题码，无需写入码表'), '🧧');
  }

  showToast(_loadT('dev.syncing', '正在同步云端...'), '⏳');
  const { error } = await sb.from('bread_redeem_codes').insert(rows);
  if (error) return showToast(_loadT('dev.codeCloudFail', '写入云端失败：') + error.message, '❌');

  closeOverlay($('#codeManageOverlay'));
  showToast(_loadT('dev.codeCloudOk', { count: rows.length }), '☁️');
};
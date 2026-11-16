/* =========================================================
   14-loading.js (极速加载版 - 防卡死、防翻译冲突)
   ========================================================= */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isBooting = false; 
let isEntered = false;
let totalDuration = 3500; 
let startTime = 0;
let animationFrameId = null;
let countdownInterval = null;
let watchdogTimer = null;   // ★ 强制进入兜底定时器
let requestDone = false; 
let currentPhaseText = ""; 

/* 【修改】改用 modules/i18n 目录（按模块拆分后的全局 _loadT('loading.xxx')）读取词条，
   删除本文件内重复维护的 dictZh / dictEn（原先与词表各存一份，容易改漏） */

function startCountdown() {
  const timeLeftEl = document.getElementById('loadingTimeLeft');
  if (!timeLeftEl) return;
  
  if (countdownInterval) clearInterval(countdownInterval);
  
  countdownInterval = setInterval(() => {
    if (isEntered) return;
    let elapsed = performance.now() - startTime;
    let leftMs = Math.max(0, totalDuration - elapsed);
    let leftSec = (leftMs / 1000).toFixed(1);
    
    if (leftMs <= 0) {
      timeLeftEl.textContent = _loadT('loading.entering');
    } else {
      timeLeftEl.textContent = _loadT('loading.remainingTime', { sec: leftSec });
    }
  }, 100);
}

function startTimelineAnimation() {
  const globalBar = document.getElementById('globalProgressBar');
  const progressBar = document.getElementById('progressBar');
  const percentText = document.getElementById('loadingPercent');
  const textEl = document.getElementById('loadingText');
  
  if (globalBar) { globalBar.style.transition = 'none'; globalBar.style.width = '0%'; }
  if (progressBar) { progressBar.style.transition = 'none'; progressBar.style.width = '0%'; }
  if (percentText) percentText.textContent = _loadT('loading.loadedPercent', { percent: 0 });

  startTime = performance.now();

  function frame(currentTime) {
    if (isEntered) return;
    
    let elapsed = currentTime - startTime;
    let globalPercent = (elapsed / totalDuration) * 100;
    if (globalPercent > 100) globalPercent = 100;
    
    if (globalBar) globalBar.style.width = globalPercent + '%';
    if (percentText) percentText.textContent = _loadT('loading.loadedPercent', { percent: Math.floor(globalPercent) });

    let upperPercent = 0;
    if (elapsed < 1000) {
      upperPercent = (elapsed / 1000) * 100;
    } else {
      let phase2Duration = totalDuration - 1000;
      upperPercent = ((elapsed - 1000) / phase2Duration) * 100;
    }
    if (upperPercent > 100) upperPercent = 100;
    
    if (progressBar) progressBar.style.width = upperPercent + '%';

    if (textEl && currentPhaseText) {
        let htmlStr = currentPhaseText.replace(
            /(\[\d+\/\d+\])/, 
            '<span style="font-size: 16px; font-weight: 900; color: var(--accent); margin-right: 6px; vertical-align: text-bottom;">$1</span>'
        );
        textEl.innerHTML = `<span style="color: var(--ink-soft); font-weight: bold; margin-right: 6px;">${Math.floor(upperPercent)}%</span>` + htmlStr;
    }

    if (elapsed < totalDuration) {
      animationFrameId = requestAnimationFrame(frame);
    } else {
      if (requestDone) enterApp();
    }
  }
  
  animationFrameId = requestAnimationFrame(frame);
  startCountdown();

  // ★ 看门狗：就算云端请求一直不返回，最多再等 3 秒也强制进入，绝不停在 100%
  if (watchdogTimer) clearTimeout(watchdogTimer);
  watchdogTimer = setTimeout(() => {
    if (!isEntered) {
      console.warn('⚠️ 加载超时兜底：强制进入界面');
      requestDone = true;
      enterApp();
    }
  }, totalDuration + 3000);
}

function updateTextByTimeline(isVip, isSvip) {
  const modeName = isSvip ? _loadT('loading.stageConfigSvip') : (isVip ? _loadT('loading.stageConfigVip') : _loadT('loading.stageConfigNormal'));
  
  setTimeout(() => { if(!isEntered) updateMajorStage(_loadT('loading.stageConnect')); }, 0);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_7_1'); }, 50);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_7_2'); }, 150);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_7_3'); }, 250);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_7_4'); }, 350);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_7_5'); }, 450);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_7_6'); }, 550);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_7_7'); }, 650);
  
  setTimeout(() => {
    if(!isEntered) {
      updateMajorStage(_loadT('loading.stageConfigStep', { mode: modeName }));
      if (!isVip && !isSvip) {
        const hint = document.getElementById('vipSpeedupHint');
        if (hint) {
          hint.style.display = 'block';
          hint.textContent = _loadT('loading.vipSpeedup');
        }
      }
      currentPhaseText = _loadT('loading.phase1_6_1');
    }
  }, 1000);

  let p2Duration = totalDuration - 1000;
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_6_2'); }, 1000 + p2Duration * 0.2);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_6_3'); }, 1000 + p2Duration * 0.4);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_6_4'); }, 1000 + p2Duration * 0.6);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_6_5'); }, 1000 + p2Duration * 0.8);
  setTimeout(() => { if(!isEntered) currentPhaseText = _loadT('loading.phase1_6_6'); }, 1000 + p2Duration * 0.95);
}

function enterApp() {
  if (isEntered) return;
  isEntered = true;
  window.isLoadedOnce = true;
  
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (countdownInterval) clearInterval(countdownInterval);
  if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
  
  const globalBar = document.getElementById('globalProgressBar');
  const progressBar = document.getElementById('progressBar');
  const percentText = document.getElementById('loadingPercent');
  if (globalBar) globalBar.style.width = '100%';
  if (progressBar) progressBar.style.width = '100%';
  if (percentText) percentText.textContent = _loadT('loading.loadedPercent', { percent: 100 });
  
  // ★ loadUserData 里任何异常都不能把遮罩卡住，单独兜住
  try {
    if (typeof loadUserData === 'function') loadUserData();
  } catch (e) {
    console.error('❌ loadUserData 执行失败（界面仍会进入）:', e);
  }

  if (currentUser) {
    try {
      const u = getUsersDB()[currentUser];
      if (u && u.weather_city && u.weather_id) {
        localStorage.setItem('bb-weather-city', u.weather_city);
        localStorage.setItem('bb-weather-id', u.weather_id);
      }
    } catch (e) {
      console.error('❌ 天气信息恢复失败:', e);
    }
  }

  setTimeout(() => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.style.display = 'none'; }, 300); 
    }
  }, 100); 
}

function showConnectError(msg) {
  isBooting = false;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (countdownInterval) clearInterval(countdownInterval);
  
  const loadingContent = document.getElementById('loadingContent');
  const errorContent = document.getElementById('errorContent');
  
  if (loadingContent) loadingContent.style.display = 'none';
  if (errorContent) {
    errorContent.style.display = 'flex';
    
    errorContent.innerHTML = `
      <div style="text-align: center; width: 100%; max-width: 320px; animation: rise 0.4s ease-out;">
        <div style="font-size: 60px; margin-bottom: 20px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));">☁️</div>
        <h3 style="color: #e74c3c; font-size: 22px; margin-bottom: 12px; letter-spacing: 1px;">${_loadT('loading.connectFailed')}</h3>
        
        <div style="background: rgba(231, 76, 60, 0.08); border: 1px dashed #e74c3c; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: var(--ink); font-size: 14px; line-height: 1.6; margin: 0; text-align: center; word-break: break-all;">
            ${msg || _loadT('loading.connectFailedDesc')}
          </p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button class="btn primary" id="btnRetryCloud" style="width: 100%; padding: 12px; border-radius: 12px; font-size: 15px; font-weight: bold;">${_loadT('loading.retry')}</button>
          <button class="btn ghost" id="btnLocalMode" style="width: 100%; padding: 12px; border-radius: 12px; font-size: 15px;">${_loadT('loading.localMode')}</button>
        </div>
      </div>
    `;

    document.getElementById('btnLocalMode').onclick = () => {
      const errorContentDiv = document.getElementById('errorContent');
      const tip = document.createElement('div');
      tip.style = "color: #e74c3c; font-size: 13px; margin-top: 15px; font-weight: bold; background: rgba(231, 76, 60, 0.1); padding: 10px 14px; border-radius: 8px; border: 1px dashed #e74c3c; animation: rise 0.3s;";
      tip.textContent = _loadT('loading.localModeBlock');
      
      if (!document.getElementById('localModeBlockTip')) {
        tip.id = 'localModeBlockTip';
        errorContentDiv.appendChild(tip);
      }
    };

    document.getElementById('btnRetryCloud').onclick = () => {
      const tip = document.getElementById('localModeBlockTip');
      if (tip) tip.remove();
      
      errorContent.style.display = 'none';
      if (loadingContent) loadingContent.style.display = 'flex';
      startCloudSync();
    };
  }
}

async function startCloudSync() {
  if (isEntered || isBooting) return;
  isBooting = true;

  // ★ 核心修复：给云端请求加 1.5 秒超时，超时直接按游客模式进，绝不卡死
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), 1500)
  );

  try {
    const authPromise = sb.auth.getUser();
    const { data: authData, error } = await Promise.race([authPromise, timeoutPromise]);
    
    if (error || !authData.user) {
      window.isLocalMode = true;
      updateMajorStage(_loadT('loading.guestMode'));
      currentPhaseText = _loadT('loading.phaseGuest');
      totalDuration = 1000;
      startTimelineAnimation();
      requestDone = true;
      return; 
    }

    let curUser = localStorage.getItem('bb-current-user') ? JSON.parse(localStorage.getItem('bb-current-user')) : null;
    if (!curUser || curUser === 'null') {
      const { data: dbUser } = await sb.from('bread_users').select('username').eq('user_id', authData.user.id).maybeSingle();
      if (dbUser && dbUser.username) {
        curUser = dbUser.username;
        localStorage.setItem('bb-current-user', JSON.stringify(curUser));
        if (typeof currentUser !== 'undefined') currentUser = curUser;
      }
    }

    const resAssetsPre = await sb.from('bread_assets').select('vip_type, vip_expire').eq('user_id', authData.user.id).maybeSingle();
    
    let isVip = false;
    let isSvip = false;
    
    if (resAssetsPre.data) {
      let type = resAssetsPre.data.vip_type || 'none';
      let expire = resAssetsPre.data.vip_expire || 0;
      if (expire !== 0 && Date.now() > expire) type = 'none'; 

      if (type === 'svip') { isSvip = true; totalDuration = 1000; }
      else if (type === 'vip') { isVip = true; totalDuration = 2000; }
    }

    updateTextByTimeline(isVip, isSvip);
    startTimelineAnimation();

    const uid = authData.user.id;
    const resPrefs = await sb.from('bread_preferences').select('*').eq('user_id', uid).maybeSingle();
    const resUser = await sb.from('bread_users').select('*').eq('user_id', uid).maybeSingle();

    if (resUser.error) throw new Error(resUser.error.message);

    if (resUser.data) {
      const u = resUser.data;
      const a = resAssetsPre.data || {};
      const p = resPrefs.data || {};
      const set = p.settings || {};

      const assembledUser = {
        email: u.email, user_id: u.user_id, key: u.bread_key, avatar: u.avatar || '', regTime: u.reg_time || Date.now(),
        points: a.points || 0, vipType: a.vip_type || 'none', vipExpire: a.vip_expire || 0, unlockedThemes: a.unlocked_themes || [], emails: a.emails || [],
        customSites: p.sites || [], customHistory: p.history || [], currentTheme: p.current_theme || 'default',
        enFont: set.enFont || 'default', zhFont: set.zhFont || 'default', fwSpeed: set.fwSpeed || 1.0, fwFreq: set.fwFreq || 1.0, fwThemeColor: set.fwThemeColor !== false,
        screenShake: set.screenShake !== false, customFonts: set.customFonts || [], lastRpDate: set.lastRpDate || '', rpCount: set.rpCount || 0, 
        day7Sent: set.day7Sent || false, day30Sent: set.day30Sent || false, springSent: set.springSent || false, lastPointDate: set.lastPointDate || '',
        weather_city: u.weather_city || '北京', weather_id: u.weather_id || '101010100',
        clock12h: set.clock12h || false,           
        weatherRange: set.weatherRange || '24'     
      };

      let localUsers = store.get('bb-users', {});
      localUsers[curUser] = { ...localUsers[curUser], ...assembledUser };
      localStorage.setItem('bb-users', JSON.stringify(localUsers));
    }

    requestDone = true;
    
    let elapsed = performance.now() - startTime;
    if (elapsed >= totalDuration) {
      enterApp();
    }

  } catch (e) {
    if (e.message === 'TIMEOUT') {
      // 超时，当作游客模式进入
      window.isLocalMode = true;
      updateMajorStage(_loadT('loading.guestMode'));
      currentPhaseText = _loadT('loading.phaseGuest');
      totalDuration = 1000;
      startTimelineAnimation();
      requestDone = true;
      return;
    }
    console.error('❌ 云端拉取失败', e);
    showConnectError(e.message);
  }
}

function updateMajorStage(stageText) {
  const majorTxt = document.getElementById('majorStageText');
  if (majorTxt) majorTxt.innerHTML = _loadT('loading.currentStage', { stage: stageText });
}

startCloudSync();
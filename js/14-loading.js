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
          /* 【新增】20261118：面包等级也会提速，提示里一并说明 */
          /* 【修改】20261118：Lv60 已是满级，不能再提示“继续升级还能更快” */
          const breadLv = Math.max(1, Math.min(60, Number(window.__breadSpeedLv) || 1));
          const breadHintKey = breadLv >= 60 ? 'loading.breadSpeedupMax' : 'loading.breadSpeedup';
          hint.textContent = _loadT('loading.vipSpeedup') + '　' + _loadT(breadHintKey, { level: breadLv });
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
      /* 【修改】20261118：淡出后同时移除 show 类，避免加载遮罩永久占着 .overlay.show
         影响其它弹窗的“是否还有弹窗打开”判断 */
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('show');
        /* 【新增】20261119：通知首页，加载遮罩已完全消失，可以开始问候语计时。 */
        window.dispatchEvent(new Event('breadAppEntered'));
      }, 300);
    } else {
      window.dispatchEvent(new Event('breadAppEntered'));
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

  // ★ 核心修复：给云端请求加超时，超时按游客模式进，绝不卡死
  // 【修改】20261118：1.5 秒太短，网络稍慢就会把已登录用户误判成游客，
  //                   改成 4 秒并允许重试一次（共两轮，最多约 8 秒）
  const TIMEOUT_MS = 4000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
  );

  try {
    /* 【修改】20261118：getUser 失败/超时不再立刻当游客，先重试一次 */
    let authData = null, authError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await Promise.race([sb.auth.getUser(), timeoutPromise]);
        authData = r.data;
        authError = r.error;
        if (!authError && authData && authData.user) break;
      } catch (e) {
        authError = authError || e;
      }
      if (attempt === 0) await new Promise(res => setTimeout(res, 400));
    }

    if (authError || !authData || !authData.user) {
      /* 【新增】20261118：会话过期时先试着刷新一次 token，别一过期就判游客 */
      try {
        const rf = await sb.auth.refreshSession();
        if (!rf.error && rf.data && rf.data.user) {
          authData = { user: rf.data.user };
          authError = null;
        }
      } catch (e2) { /* 刷新失败就是真没登录 */ }
    }

    if (authError || !authData || !authData.user) {
      window.isLocalMode = true;
      /* 【新增】20261118：临时游客兜底标记，避免 loadUserData 把本地登录态抹掉 */
      window.__guestFallback = true;
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

    /* 【修改】20261118：这里原来只 select 了 vip_type / vip_expire / user_level，
       导致下面组装用户时 a.points 是 undefined → points 被写成 0，
       每次刷新都会先把本地积分清零，再等云端同步来救（同步失败/被排队丢掉就真的清零了）。
       改成 select('*')，一次性把 points / star_point / user_bake 等全部拿全。 */
    const resAssetsPre = await sb.from('bread_assets').select('*').eq('user_id', authData.user.id).maybeSingle();
    /* 【修改】20261118 P0：查询失败不能再当作「积分 0」继续往下装。
       以前 error 被忽略，a = {} → points: 0 写进本地，随后任意一次 store.set 推回云端就是真清零。 */
    if (resAssetsPre.error) throw new Error('资产读取失败: ' + resAssetsPre.error.message);
    
    let isVip = false;
    let isSvip = false;
    
    if (resAssetsPre.data) {
      let type = resAssetsPre.data.vip_type || 'none';
      let expire = resAssetsPre.data.vip_expire || 0;
      if (expire !== 0 && Date.now() > expire) type = 'none'; 

      if (type === 'svip') { isSvip = true; totalDuration = 1000; }
      else if (type === 'vip') { isVip = true; totalDuration = 2000; }
      else {
        /* 【新增】20261118：不是会员时按面包等级缩短加载时间
           Lv1 = 3480ms，每级 -20ms，Lv60 = 2300ms；
           始终比 VIP（2000ms）慢，体现「普通用户的等级福利但不如会员」 */
        /* 【修改】20261119：曲线加强为每级 -25ms，下限 2100ms
           Lv1 = 3475ms → Lv60 = max(2100, 2000) = 2100ms；仍慢于 VIP（2000ms） */
        const breadLv = Math.max(1, Math.min(60, Number(resAssetsPre.data.user_level) || 1));
        totalDuration = Math.max(2100, 3500 - breadLv * 25);
        window.__breadSpeedLv = breadLv;
        /* 【新增】20261119：把实际生效的加载时长打到控制台，方便验证「等级提速」是否真的走了 */
        console.info(`[loading] 普通用户 · 面包等级 Lv${breadLv} · 加载时长 ${totalDuration}ms`);
      }
    } else {
      /* 【新增】20261119：没有资产行时提示一下，避免误以为提速失效 */
      console.info('[loading] 未找到 bread_assets 行，按默认 3500ms 计时');
    }
    if (isSvip) console.info('[loading] SVIP · 固定 1000ms（面包等级提速不参与）');
    else if (isVip) console.info('[loading] VIP · 固定 2000ms（面包等级提速不参与）');

    updateTextByTimeline(isVip, isSvip);
    startTimelineAnimation();

    const uid = authData.user.id;
    const resPrefs = await sb.from('bread_preferences').select('*').eq('user_id', uid).maybeSingle();
    const resUser = await sb.from('bread_users').select('*').eq('user_id', uid).maybeSingle();

    if (resUser.error) throw new Error(resUser.error.message);
    /* 【修改】20261118 P0：偏好读取失败也不能当成空 settings 继续装，
       否则任意一次 store.set 都会把云端字体/任务/签名写成默认值。 */
    if (resPrefs.error) throw new Error('偏好读取失败: ' + resPrefs.error.message);

    if (resUser.data) {
      const u = resUser.data;
      const a = resAssetsPre.data || {};
      const p = resPrefs.data || {};
      const set = p.settings || {};

      /* 【新增】20261118 P0：先记住云端基线，再装本地用户。
         这样 loadUserData / 2.5s 每日积分保存 触发的 store.set 只会写「真变了」的列，
         不会把 assembledUser 里缺失的 vipLevel / vipPoint 写成 1 / 0。 */
      if (resAssetsPre.data) window.__bbSetAssetsBase(resAssetsPre.data, uid);
      if (p.settings) window.__bbSetPrefsBase(p.settings, uid);

      const assembledUser = {
        email: u.email, user_id: u.user_id, key: u.bread_key, avatar: u.avatar || '', regTime: u.reg_time || Date.now(),
        points: a.points || 0, vipType: a.vip_type || set.vipType || 'none', vipExpire: a.vip_expire || 0, unlockedThemes: a.unlocked_themes || [], emails: a.emails || [],
        customSites: p.sites || [], customHistory: p.history || [], currentTheme: p.current_theme || 'default',
        enFont: set.enFont || 'default', zhFont: set.zhFont || 'default', fwSpeed: set.fwSpeed || 1.0, fwFreq: set.fwFreq || 1.0, fwThemeColor: set.fwThemeColor !== false,
        screenShake: set.screenShake !== false, customFonts: set.customFonts || [], lastRpDate: set.lastRpDate || '', rpCount: set.rpCount || 0, 
        day7Sent: set.day7Sent || false, day30Sent: set.day30Sent || false, springSent: set.springSent || false, lastPointDate: set.lastPointDate || '',
        weather_city: u.weather_city || '北京', weather_id: u.weather_id || '101010100',
        clock12h: set.clock12h || false,           
        weatherRange: set.weatherRange || '24',
        /* 【新增】20261118 P0：补齐以前没从云端装回来的 VIP / 任务 / 签名 / 面包等级字段。
           缺这些字段时，store.set 会把 vip_level 写 1、star_point 写 0，
           并把 vipTaskState / starExchange / bio 清空。 */
        /* 【修改】20261118 P1：等级以 bread_assets.vip_level 为唯一权威来源。
           以前用 Math.max(a.vip_level, set.vipLevel)，settings 里一个旧的高等级就能把
           服务端真正等级顶上去。只有资产列没有有效值时，才回落到 settings。 */
        vipLevel: (() => {
          const aLv = Number(a.vip_level);
          const sLv = Number(set.vipLevel);
          const use = (isFinite(aLv) && aLv > 0) ? aLv : (isFinite(sLv) ? sLv : 1);
          return Math.min(100, Math.max(1, use));
        })(),
        vipPoint: (() => {
          if (a.star_point !== undefined && a.star_point !== null && isFinite(Number(a.star_point))) {
            return Math.max(0, Number(a.star_point));
          }
          return Math.max(0, Number(set.vipPoint) || 0);
        })(),
        vipAppliedType: set.vipAppliedType || a.vip_type || 'none',
        vipTaskState: set.vipTaskState || {},
        starExchange: set.starExchange || {},
        vipRewardSent: set.vipRewardSent || [],
        vipRewardLog: set.vipRewardLog || [],
        bio: set.bio || '',
        userLevel: Math.min(60, Math.max(1, Number(a.user_level) || 1)),
        userBake: Math.max(0, Number(a.user_bake) || 0)
      };

      let localUsers = store.get('bb-users', {});
      localUsers[curUser] = { ...localUsers[curUser], ...assembledUser };
      localStorage.setItem('bb-users', JSON.stringify(localUsers));
    }

    requestDone = true;
    /* 【新增】20261118：云端数据拉到且用户装好了，说明这次是真·在线，清掉临时游客标记 */
    window.__guestFallback = false;

    let elapsed = performance.now() - startTime;
    if (elapsed >= totalDuration) {
      enterApp();
    }

  } catch (e) {
    if (e.message === 'TIMEOUT') {
      // 超时，当作游客模式进入
      window.isLocalMode = true;
      /* 【新增】20261118：临时兜底标记，别让本地登录态被抹掉 */
      window.__guestFallback = true;
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
/* =========================================================
   13-updater.js
   独立版本更新检测引擎 (支持带后缀显示，底层纯净对比)
   ========================================================= */

// ★ 1. 当前版本号（你可以随便加后缀了，比如 -Release, -Beta）
const CURRENT_VERSION = "0.0.3"; 

// 2. 安全比较版本号大小的函数（已加入智能净化）
function isNewerVersion(cloudVer, localVer) {
  // ★ 核心升级：提取纯数字部分（比如把 "1.5.0-Release" 提取成 ["1", "5", "0"]）
  const getPureNums = (ver) => {
      const match = ver.match(/\d+(\.\d+)*/); // 正则匹配纯数字和点
      return match ? match[0].split('.').map(Number) : [0];
  };

  const c = getPureNums(cloudVer);
  const l = getPureNums(localVer);
  
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cNum = c[i] || 0;
    const lNum = l[i] || 0;
    if (cNum > lNum) return true;  // 云端大，说明有新版本
    if (cNum < lNum) return false; // 本地大，坚决不乱弹窗
  }
  return false; // 一样大
}

// 3. 弹窗 UI 渲染
function showUpdateModal(data) {
  const hasLink = data.download_url && data.download_url.trim() !== '' && data.download_url !== '#';
  
  const buttonHtml = hasLink 
    ? `<a href="${data.download_url}" target="_blank" class="btn primary" style="text-decoration: none; width: 100%;">${_loadT('updater.downloadNow')}</a>`
    : `<button class="btn primary" disabled style="width: 100%; opacity: 0.5;">${_loadT('updater.preparing')}</button>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay show';
  overlay.style.zIndex = '10000';
  overlay.innerHTML = `
    <div class="modal" style="text-align: center; width: min(400px, 90vw);">
      <h3 style="color: var(--accent); margin-bottom: 12px;">${_loadT('updater.newVersion', { version: data.version })}</h3>
      <div style="margin: 15px 0; text-align: left; white-space: pre-wrap; font-size: 14px; color: var(--ink-soft); background: rgba(150,150,150,0.1); padding: 10px; border-radius: 8px;">${data.update_log}</div>
      <div class="modal-actions" style="justify-content: center; margin-top: 20px;">
        ${buttonHtml}
        <button class="btn ghost" onclick="this.closest('.overlay').remove()" style="width: 100%;">${_loadT('updater.later')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// 4. 核心检测逻辑（去云端拿 version.json）
let __shownUpdateVersion = null;   // 【新增】记录已经弹过的版本，避免反复弹同一个窗

async function checkForUpdates() {
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`);
    if (!res.ok) return; 

    const latestData = await res.json();

    if (isNewerVersion(latestData.version, CURRENT_VERSION)) {
      /* 【新增】同一个新版本只弹一次；如果用户关掉了弹窗，
         后续复检到同一版本不再骚扰，等到更高版本再来。 */
      if (__shownUpdateVersion === latestData.version) return;
      __shownUpdateVersion = latestData.version;
      showUpdateModal(latestData);
    }
  } catch (e) {
    console.log("网络错误或未找到版本文件，跳过更新检测。");
  }
}

// ================= 启动应用 =================
setTimeout(checkForUpdates, 3000);

/* 【新增】页面一直挂着（老标签页）时的复检机制：
   原来只在打开后 3 秒查一次，用户不刷新就永远感知不到新版本，
   所以「上传了 1.6.1，旧页面却没弹更新」就是这里缺的。
   现在：切回标签页 + 每 3 分钟（仅在页面可见时）各复检一次。 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdates();
});

setInterval(() => {
  if (document.visibilityState === 'visible') checkForUpdates();
}, 3 * 60 * 1000);

window.addEventListener('focus', () => checkForUpdates());
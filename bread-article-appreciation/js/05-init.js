function pad(n) { return String(n).padStart(2, '0'); }

// 时钟与问候语更新
function tick() {
  const now = new Date();
  const clockEl = $('#clock');
  if (clockEl) {
    clockEl.innerHTML = pad(now.getHours()) + '<span style="opacity:.4">:</span>' + pad(now.getMinutes()) + '<span style="opacity:.4">:</span>' + pad(now.getSeconds());
  }
  
  const dateEl = $('#dateLine');
  if (dateEl) {
    dateEl.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
  }

  const h = now.getHours();
  let greet = '夜深了，早点休息 🌙';
  if (h >= 5 && h < 9) greet = '早安！春意盎然 🌅';
  else if (h < 12) greet = '上午好，品一杯清茶 🍵';
  else if (h < 14) greet = '午好！小憩片刻 ☀️';
  else if (h < 18) greet = '下午好，读一篇好文 📖';
  else if (h < 22) greet = '晚上好，晚风温柔 🌆';
  
  const greetEl = $('#greeting');
  if (greetEl) {
    greetEl.textContent = greet;
  }
}

// 初始化启动
document.addEventListener('DOMContentLoaded', () => {
  // 1. 启动时钟
  setInterval(tick, 1000); 
  tick();

  // 2. 初始化主题和背景特效
  applyTheme();
  applyFont(currentFont);
  
  // 3. 渲染侧边栏目录
  renderMenu();

  // 4. 移动端侧边栏按钮显示判断
  const checkMobile = () => {
    const isMobile = window.innerWidth <= 768;
    $('#toggleSidebar').style.display = isMobile ? 'flex' : 'none';
    if (!isMobile) $('#sidebar').classList.remove('show');
  };
  window.addEventListener('resize', checkMobile);
  checkMobile();
});
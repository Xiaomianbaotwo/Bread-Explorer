/* =========================================================
   03-ui.js
   通用弹窗控制、Toast 提示
   ========================================================= */

// ========== 弹窗控制 ==========
function openOverlay(el) { 
  el.classList.add('show'); 
  document.body.classList.add('modal-open'); 
}

function closeOverlay(el) {
  el.classList.remove('show');
  if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  if (el.id === 'userOverlay' && window.vipTimer) clearInterval(window.vipTimer);
}

// ★ 核心白名单：在这里的弹窗，点击背景空白处【不会】关闭
const noOutsideCloseOverlays = [
  'registerSuccessOverlay', 'inputOverlay', 'confirmOverlay', 'runCodeOverlay', 'codeManageOverlay'
];

// 🚀 终极修复：防止拖拽选中文字滑出弹窗导致误关闭
document.querySelectorAll('.overlay').forEach(el => {
  let mousedownOnOverlay = false;

  el.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = (e.target === el);
  });

  el.addEventListener('mouseup', (e) => {
    if (e.target === el && mousedownOnOverlay) {
      if (noOutsideCloseOverlays.includes(el.id)) return; 
      closeOverlay(el); 
    }
    mousedownOnOverlay = false;
  });

  el.addEventListener('touchstart', (e) => {
    if (e.target === el) mousedownOnOverlay = true;
  }, { passive: true });

  el.addEventListener('touchend', (e) => {
    if (e.target === el && mousedownOnOverlay) {
      if (noOutsideCloseOverlays.includes(el.id)) return; 
      closeOverlay(el); 
    }
    mousedownOnOverlay = false;
  });
});

// ========== 通用输入与确认弹窗 ==========
let inputModalCallback = null;
let confirmModalCallback = null;

function showInputModal(title, desc, defaultValue, callback) {
  $('#inputTitle').textContent = title;
  $('#inputDesc').textContent = desc;
  $('#inputValue').value = defaultValue || '';
  inputModalCallback = callback;
  openOverlay($('#inputOverlay'));
  setTimeout(() => $('#inputValue').focus(), 100);
}

$('#btnInputCancel').onclick = () => closeOverlay($('#inputOverlay'));
$('#btnInputConfirm').onclick = () => {
  const val = $('#inputValue').value.trim();
  closeOverlay($('#inputOverlay'));
  if (inputModalCallback) inputModalCallback(val);
};
$('#inputValue').onkeydown = e => { if (e.key === 'Enter') $('#btnInputConfirm').click(); };

/* 【新增】okText / cancelText 为可选参数：不传时按钮文案仍由词表（modals.globalConfirm / globalCancel）决定，
   传了就临时替换，避免影响其它调用方。词表未就绪时回退到中文默认值，避免弹窗上出现 key 字符串。 */
function showConfirmModal(title, desc, callback, isDanger = true, okText = null, cancelText = null) {
  const _ct = (key, fb) => {
    const v = (typeof _loadT === 'function') ? _loadT(key) : null;
    return (v && v !== key) ? v : fb;
  };
  $('#confirmTitle').textContent = title;
  $('#confirmDesc').innerHTML = desc;
  $('#btnGlobalConfirmOk').className = 'btn ' + (isDanger ? 'danger' : 'primary');
  $('#btnGlobalConfirmOk').textContent = (okText !== null && okText !== undefined) ? okText : _ct('modals.globalConfirm', '确认');
  $('#btnGlobalConfirmCancel').textContent = (cancelText !== null && cancelText !== undefined) ? cancelText : _ct('modals.globalCancel', '取消');
  confirmModalCallback = callback;
  openOverlay($('#confirmOverlay'));
}

$('#btnGlobalConfirmCancel').onclick = () => closeOverlay($('#confirmOverlay'));
$('#btnGlobalConfirmOk').onclick = () => {
  closeOverlay($('#confirmOverlay'));
  if (confirmModalCallback) confirmModalCallback();
};

// ========== Toast ==========
let toastTimer;
function showToast(msg, icon = '🍞') {
  const t = $('#toast'); 
  if (!t) return;
  
  let finalMsg = msg;
  if (typeof window.t === 'function') {
    // ★ 局部关闭 keySeparator，完美解决省略号（...）导致查不到翻译的问题
    finalMsg = i18next.t('toast.' + msg, { 
      defaultValue: msg,
      keySeparator: false 
    });
  }

  t.innerHTML = `<span>${icon}</span> ${finalMsg}`; 
  t.classList.add('show');
  clearTimeout(toastTimer); 
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
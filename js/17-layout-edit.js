/* =========================================================
   js/17-layout-edit.js
   编辑布局（Beta）
   - 右上角独立开关：白色=关闭，主题色=开启
   - 编辑模式：拖动、框选多选、成组拖动、四角缩放、置顶/置底、复制
   - 工具箱：石英钟 / 自定义文字
   - 位置、缩放、层级保存在 localStorage，刷新后仍然生效
   - 按 H 恢复系统默认布局
   【新增】20261118
   ========================================================= */

(() => {
  'use strict';

  const STORAGE_KEY = 'bb-layout-edit-v1';
  const WIDGET_KEY = 'bb-layout-widgets-v1';
  const UNIFORM_KEY = 'bb-layout-uniform-scale-v1';
  const SNAP = 8;                 // 拖动吸附网格，避免对不齐
  const DRAG_THRESHOLD = 4;

  /* 可拖动目标：品牌细节、右上角按钮、左侧入口、首页主要区块、天气卡片、自定义组件 */
  const TARGET_SELECTOR = [
    '#brandBreadEmoji',
    '#brandTitle',
    '#brandSubtitle',
    '#readme-version-badge',
    '#btnFriendsEntry',
    '#btnSuggestEntry',
    '#btnVipEntry',
    '#btnBreadEntry',
    '#btnPointEntry',
    '#clockBlock',
    '#greeting',
    '#quote',
    '#searchWrap',
    '#sitesHead',
    '#sitesGrid',
    '#weatherWidget',
    '.header-actions .icon-btn',
    '.layout-widget'
  ].join(',');

  let editing = false;
  let drag = null;
  let resize = null;
  let marquee = null;
  let selected = null;
  let selectedEls = [];
  let saved = loadJSON(STORAGE_KEY, {});
  let widgetDefs = loadJSON(WIDGET_KEY, []);
  if (!Array.isArray(widgetDefs)) widgetDefs = [];
  let uniformScale = false;
  try { uniformScale = localStorage.getItem(UNIFORM_KEY) === '1'; } catch (e) { /* 忽略 */ }
  const widgetEls = new Map();     // id -> { el, timer, tick, stop }

  /* 【新增】20261119：页面切回前台 / 窗口重新聚焦时，全部石英钟立刻按电脑时间走一格。 */
  function syncQuartzClocks() {
    widgetEls.forEach(item => {
      if (item && typeof item.tick === 'function') item.tick();
    });
  }
  function stopWidgetTimer(item) {
    if (!item) return;
    if (typeof item.stop === 'function') item.stop();
    else if (item.timer) clearInterval(item.timer);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncQuartzClocks();
  });
  window.addEventListener('focus', syncQuartzClocks);
window.addEventListener('pageshow', syncQuartzClocks);

  const btnEdit = document.getElementById('btnLayoutEdit');
  const btnReset = document.getElementById('btnLayoutReset');
  const selectionBox = document.getElementById('layoutSelectionBox');
  const marqueeBox = document.getElementById('layoutMarquee');

  function T(key, fallback) {
    try {
      return (typeof _loadT === 'function') ? _loadT(key, fallback) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function persistSaved() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (e) { /* 忽略 */ }
  }

  function persistWidgets() {
    try { localStorage.setItem(WIDGET_KEY, JSON.stringify(widgetDefs)); } catch (e) { /* 忽略 */ }
  }

  function patchSaved(key, patch) {
    if (!key) return;
    saved[key] = Object.assign({}, saved[key] || {}, patch);
    persistSaved();
  }

  function getScale(el) {
    const raw = (el.style.scale || '').trim();
    if (!raw) return { x: 1, y: 1 };
    const parts = raw.split(/\s+/);
    return {
      x: parseFloat(parts[0]) || 1,
      y: parseFloat(parts[1] || parts[0]) || 1
    };
  }

  function setScale(el, x, y) {
    const sx = Math.min(3, Math.max(0.35, x));
    const sy = Math.min(3, Math.max(0.35, y));
    el.style.scale = `${sx.toFixed(3)} ${sy.toFixed(3)}`;
    return { x: sx, y: sy };
  }

  function applySaved(el, key) {
    const pos = saved[key];
    if (!pos) return;

    if (pos.hidden) el.style.display = 'none';

    if (pos.absolute && typeof pos.x === 'number' && typeof pos.y === 'number') {
      if (getComputedStyle(el).position === 'static') el.style.position = 'absolute';
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.style.transform = 'none';
      el.dataset.layoutAbsolute = '1';
    } else if (typeof pos.x === 'number' && typeof pos.y === 'number') {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
    }

    if (typeof pos.sx === 'number' || typeof pos.sy === 'number') {
      el.style.scale = `${pos.sx || 1} ${pos.sy || 1}`;
    }
    if (typeof pos.z === 'number') {
      el.style.zIndex = String(pos.z);
    }
  }

  function register(el) {
    if (!el || !el.id) return;
    if (el.dataset.layoutBound === '1') return;
    if (el.closest('#layoutEditDock') || el.closest('#layoutEditToolbar')) return;

    el.dataset.layoutBound = '1';
    el.dataset.layoutKey = el.id;
    /* 记录原始内联样式，H 重置时恢复 */
    el.dataset.layoutOrigPosition = el.style.position || '';
    el.dataset.layoutOrigLeft = el.style.left || '';
    el.dataset.layoutOrigTop = el.style.top || '';
    el.dataset.layoutOrigTransform = el.style.transform || '';
    el.dataset.layoutOrigScale = el.style.scale || '';
    el.dataset.layoutOrigZ = el.style.zIndex || '';
    el.dataset.layoutOrigDisplay = el.style.display || '';

    el.classList.add('layout-draggable');
    applySaved(el, el.id);

    el.addEventListener('pointerdown', onPointerDown);
  }

  function registerAll() {
    document.querySelectorAll(TARGET_SELECTOR).forEach(register);
  }

  function clearSelection() {
    selectedEls.forEach(el => {
      el.classList.remove('layout-selected', 'layout-multi-selected');
    });
    selectedEls = [];
    selected = null;
    updateSelectionBox();
  }

  function setSelection(list, primary, preferLeaf) {
    const unique = Array.from(new Set(list)).filter(el => el && el.classList.contains('layout-draggable'));
    /* 普通点选/Shift 多选保留父级，避免父子一起被拖动导致位移叠加；
       框选时优先保留叶子元素，这样 logo 里的 emoji / 标题 / 英文 / 版本号可以分别选中 */
    const deduped = preferLeaf
      ? unique.filter(el => !unique.some(other => other !== el && el.contains(other)))
      : unique.filter(el => !unique.some(other => other !== el && other.contains(el)));

    selectedEls.forEach(el => el.classList.remove('layout-selected', 'layout-multi-selected'));
    selectedEls = deduped;
    selected = primary && deduped.includes(primary) ? primary : (deduped[deduped.length - 1] || null);

    deduped.forEach(el => {
      el.classList.add(deduped.length > 1 ? 'layout-multi-selected' : 'layout-selected');
    });
    updateSelectionBox();
  }

  function selectElement(el, additive) {
    if (!el) return;
    if (additive) {
      const list = selectedEls.includes(el)
        ? selectedEls.filter(x => x !== el)
        : selectedEls.concat(el);
      setSelection(list, el);
    } else {
      setSelection([el], el);
    }
  }

  function updateSelectionBox() {
    if (!editing || !selected || !selectionBox) {
      if (selectionBox) {
        selectionBox.classList.remove('is-visible', 'is-multi');
      }
      return;
    }

    let left, top, right, bottom;
    if (selectedEls.length > 1) {
      const rects = selectedEls.map(el => el.getBoundingClientRect());
      left = Math.min(...rects.map(r => r.left));
      top = Math.min(...rects.map(r => r.top));
      right = Math.max(...rects.map(r => r.right));
      bottom = Math.max(...rects.map(r => r.bottom));
      selectionBox.classList.add('is-multi');
    } else {
      const r = selected.getBoundingClientRect();
      left = r.left;
      top = r.top;
      right = r.right;
      bottom = r.bottom;
      selectionBox.classList.remove('is-multi');
    }

    selectionBox.style.left = (left - 3) + 'px';
    selectionBox.style.top = (top - 3) + 'px';
    selectionBox.style.width = Math.max(1, right - left + 6) + 'px';
    selectionBox.style.height = Math.max(1, bottom - top + 6) + 'px';
    selectionBox.classList.add('is-visible');
  }

  function prepareDragItem(el) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const isAbsolute = cs.position === 'fixed' || cs.position === 'absolute';

    if (isAbsolute && el.dataset.layoutAbsolute !== '1') {
      /* 固定/绝对定位元素第一次拖动时转成像素坐标，避免 left:50% 之类跳位 */
      el.style.left = rect.left + 'px';
      el.style.top = rect.top + 'px';
      el.style.transform = 'none';
      el.dataset.layoutAbsolute = '1';
    } else if (!isAbsolute && cs.position === 'static') {
      /* 普通文档流元素默认是 static，只写 left/top 不会动；先转成 relative */
      el.style.position = 'relative';
    }

    return {
      el,
      key: el.dataset.layoutKey,
      startLeft: parseFloat(el.style.left) || 0,
      startTop: parseFloat(el.style.top) || 0,
      absolute: el.dataset.layoutAbsolute === '1',
      scale: getScale(el)
    };
  }

  function onPointerDown(e) {
    if (!editing || e.button !== 0) return;
    if (e.target.closest('#layoutSelectionBox')) return;

    const el = e.currentTarget;
    if (!el.matches(TARGET_SELECTOR)) return;
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;

    if (additive) {
      selectElement(el, true);
    } else if (!selectedEls.includes(el)) {
      setSelection([el], el);
    } else {
      selected = el;
      updateSelectionBox();
    }

    const items = (selectedEls.length ? selectedEls : [el]).map(prepareDragItem);

    drag = {
      items,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };

    items.forEach(item => item.el.classList.add('layout-dragging'));
    el.classList.add('layout-dragging');

    if (el.setPointerCapture) {
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    }

    e.preventDefault();
    e.stopPropagation();
  }

  function onResizeDown(e) {
    if (!editing || !selected) return;

    e.preventDefault();
    e.stopPropagation();

    const corner = e.currentTarget.dataset.corner;
    const rect = selected.getBoundingClientRect();
    const scale = getScale(selected);

    resize = {
      el: selected,
      key: selected.dataset.layoutKey,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startScaleX: scale.x,
      startScaleY: scale.y,
      baseW: Math.max(1, selected.offsetWidth || rect.width),
      baseH: Math.max(1, selected.offsetHeight || rect.height),
      uniform: uniformScale
    };
  }

  function onDocumentPointerDown(e) {
    if (!editing || e.button !== 0) return;
    if (e.target.closest('.layout-draggable')) return;
    if (e.target.closest('#layoutEditDock')) return;
    if (e.target.closest('#layoutEditToolbar')) return;
    if (e.target.closest('#layoutSelectionBox')) return;
    if (e.target.closest('.overlay')) return;

    clearSelection();
    marquee = {
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };

    if (marqueeBox) {
      marqueeBox.style.display = 'block';
      marqueeBox.style.left = e.clientX + 'px';
      marqueeBox.style.top = e.clientY + 'px';
      marqueeBox.style.width = '0px';
      marqueeBox.style.height = '0px';
    }
    e.preventDefault();
  }

  function updateMarquee(e) {
    if (!marquee) return;

    const dx = e.clientX - marquee.startX;
    const dy = e.clientY - marquee.startY;

    if (!marquee.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
      return;
    }
    marquee.moved = true;

    const left = Math.min(e.clientX, marquee.startX);
    const top = Math.min(e.clientY, marquee.startY);
    const width = Math.abs(dx);
    const height = Math.abs(dy);

    if (marqueeBox) {
      marqueeBox.style.left = left + 'px';
      marqueeBox.style.top = top + 'px';
      marqueeBox.style.width = width + 'px';
      marqueeBox.style.height = height + 'px';
    }

    const box = { left, top, right: left + width, bottom: top + height };
    const hits = [];
    document.querySelectorAll('.layout-draggable').forEach(el => {
      if (el.closest('#layoutEditDock') || el.closest('#layoutEditToolbar')) return;
      if (!el.offsetParent && el.id !== 'weatherWidget') return;
      const r = el.getBoundingClientRect();
      if (r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom) return;
      hits.push(el);
    });

    setSelection(hits, hits[hits.length - 1] || null, true);
  }

  function onPointerMove(e) {
    if (resize) {
      const dx = e.clientX - resize.startX;
      const dy = e.clientY - resize.startY;
      let sx = resize.startScaleX;
      let sy = resize.startScaleY;
      let ax = 0;
      let ay = 0;

      if (resize.corner.includes('e')) ax = dx / resize.baseW;
      if (resize.corner.includes('w')) ax = -dx / resize.baseW;
      if (resize.corner.includes('s')) ay = dy / resize.baseH;
      if (resize.corner.includes('n')) ay = -dy / resize.baseH;

      if (resize.uniform) {
        /* 等比例缩放：取用户拖动更明显的那个方向作为统一缩放比例 */
        const useX = Math.abs(ax) >= Math.abs(ay);
        const factor = useX ? sx + ax : sy + ay;
        sx = factor;
        sy = factor;
      } else {
        sx += ax;
        sy += ay;
      }

      const applied = setScale(resize.el, sx, sy);
      resize.scale = applied;
      updateSelectionBox();
      e.preventDefault();
      return;
    }

    if (marquee) {
      updateMarquee(e);
      e.preventDefault();
      return;
    }

    if (!drag) return;

    let dx = e.clientX - drag.startX;
    let dy = e.clientY - drag.startY;

    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    drag.moved = true;

    /* 默认按 8px 网格吸附；按住 Alt 可自由微调 */
    if (!e.altKey) {
      dx = Math.round(dx / SNAP) * SNAP;
      dy = Math.round(dy / SNAP) * SNAP;
    }

    drag.items.forEach(item => {
      item.el.style.left = (item.startLeft + dx) + 'px';
      item.el.style.top = (item.startTop + dy) + 'px';
    });

    updateSelectionBox();
    e.preventDefault();
  }

  function onPointerUp() {
    if (resize) {
      if (resize.key && resize.scale) {
        patchSaved(resize.key, { sx: resize.scale.x, sy: resize.scale.y });
      }
      resize = null;
      updateSelectionBox();
      return;
    }

    if (marquee) {
      if (!marquee.moved) clearSelection();
      marquee = null;
      if (marqueeBox) marqueeBox.style.display = 'none';
      return;
    }

    if (!drag) return;

    if (drag.moved) {
      drag.items.forEach(item => {
        patchSaved(item.key, {
          x: parseFloat(item.el.style.left) || 0,
          y: parseFloat(item.el.style.top) || 0,
          absolute: item.absolute
        });
      });
    }

    drag.items.forEach(item => item.el.classList.remove('layout-dragging'));
    drag = null;
    updateSelectionBox();
  }

  function onKeyDown(e) {
    if (e.key !== 'h' && e.key !== 'H') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!editing && !Object.keys(saved).length) return;

    const t = e.target;
    if (t && (
      t.tagName === 'INPUT' ||
      t.tagName === 'TEXTAREA' ||
      t.tagName === 'SELECT' ||
      t.isContentEditable
    )) return;

    e.preventDefault();
    resetLayout(true);
  }

  function setEditing(on, silent) {
    editing = !!on;
    document.body.classList.toggle('layout-edit-active', editing);

    if (!editing) {
      clearSelection();
      if (marqueeBox) marqueeBox.style.display = 'none';
      marquee = null;
      drag = null;
      resize = null;
    }

    if (btnEdit) {
      btnEdit.classList.toggle('is-on', editing);
      btnEdit.setAttribute('aria-checked', editing ? 'true' : 'false');
      btnEdit.setAttribute('aria-pressed', editing ? 'true' : 'false');
      const label = btnEdit.querySelector('.layout-edit-text');
      if (label) {
        label.textContent = editing
          ? T('layout.editing', '编辑中')
          : T('layout.edit', '编辑布局');
      }
    }

    if (silent) return;

    if (editing) {
      registerAll();
      showToast(T('layout.onTip', '编辑布局已开启：拖动、框选、缩放；按 H 恢复默认'), '✏️');
    } else {
      showToast(T('layout.offTip', '布局已保存'), '💾');
    }
  }

  function resetLayout(exitEdit) {
    saved = {};
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* 忽略 */ }

    widgetDefs = [];
    try { localStorage.removeItem(WIDGET_KEY); } catch (e) { /* 忽略 */ }

    widgetEls.forEach(item => {
      stopWidgetTimer(item);
      item.el.remove();
    });
    widgetEls.clear();

    /* 复制出来的视觉副本也一起清掉 */
    const customLayer = document.getElementById('layoutCustomLayer');
    if (customLayer) customLayer.innerHTML = '';

    document.querySelectorAll('.layout-draggable').forEach(el => {
      /* 恢复注册前的内联样式 */
      const restore = (prop, value) => {
        if (value) el.style[prop] = value;
        else el.style.removeProperty(prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()));
      };
      restore('position', el.dataset.layoutOrigPosition || '');
      restore('left', el.dataset.layoutOrigLeft || '');
      restore('top', el.dataset.layoutOrigTop || '');
      restore('transform', el.dataset.layoutOrigTransform || '');
      restore('scale', el.dataset.layoutOrigScale || '');
      restore('zIndex', el.dataset.layoutOrigZ || '');
      restore('display', el.dataset.layoutOrigDisplay || '');
      delete el.dataset.layoutAbsolute;
      el.classList.remove('layout-selected', 'layout-multi-selected', 'layout-dragging');
    });

    selectedEls = [];
    selected = null;
    updateSelectionBox();

    showToast(T('layout.resetDone', '布局已重置'), '↩️');
    if (exitEdit && editing) setEditing(false, true);
  }

  function applyZ(order) {
    if (!selectedEls.length) {
      showToast(T('layout.selectFirst', '请先选中一个元素'), '👆');
      return;
    }

    selectedEls.forEach(el => {
      const z = order === 'front' ? 9999 : 0;
      el.style.zIndex = String(z);
      patchSaved(el.dataset.layoutKey, { z });
    });
    showToast(order === 'front' ? T('layout.frontDone', '已置顶') : T('layout.backDone', '已置底'), '✅');
  }

  function updateUniformSwitch() {
    const btn = document.getElementById('btnLayoutUniformScale');
    if (!btn) return;
    btn.classList.toggle('is-on', uniformScale);
    btn.setAttribute('aria-checked', uniformScale ? 'true' : 'false');
    btn.setAttribute('aria-pressed', uniformScale ? 'true' : 'false');
  }

  function toggleUniformScale() {
    uniformScale = !uniformScale;
    try { localStorage.setItem(UNIFORM_KEY, uniformScale ? '1' : '0'); } catch (e) { /* 忽略 */ }
    updateUniformSwitch();
    showToast(
      uniformScale
        ? T('layout.uniformOn', '等比例缩放已开启')
        : T('layout.uniformOff', '等比例缩放已关闭，改为自由缩放'),
      uniformScale ? '🔒' : '↔️'
    );
  }

  /* 【新增】只恢复当前选中元素的原始位置，不影响其他元素 */
  function restoreSelectedPosition() {
    if (!selectedEls.length) {
      showToast(T('layout.selectFirst', '请先选中一个元素'), '👆');
      return;
    }

    const restore = (el, prop, value) => {
      if (value) el.style[prop] = value;
      else el.style.removeProperty(prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()));
    };

    selectedEls.forEach(el => {
      const key = el.dataset.layoutKey;
      restore(el, 'position', el.dataset.layoutOrigPosition || '');
      restore(el, 'left', el.dataset.layoutOrigLeft || '');
      restore(el, 'top', el.dataset.layoutOrigTop || '');
      restore(el, 'transform', el.dataset.layoutOrigTransform || '');
      restore(el, 'display', el.dataset.layoutOrigDisplay || '');
      delete el.dataset.layoutAbsolute;

      if (key && saved[key]) {
        delete saved[key].x;
        delete saved[key].y;
        delete saved[key].absolute;
        delete saved[key].hidden;
        if (!Object.keys(saved[key]).length) delete saved[key];
      }
      el.classList.remove('layout-dragging');
    });

    persistSaved();
    updateSelectionBox();
    showToast(T('layout.restorePosDone', '已恢复选中元素的位置'), '↩️');
  }

  /* 【新增】删除选中：自定义组件真删除；页面原有元素先隐藏，H 重置可恢复 */
  function deleteSelected() {
    if (!selectedEls.length) {
      showToast(T('layout.selectFirst', '请先选中一个元素'), '👆');
      return;
    }

    const targets = selectedEls.slice();
    let removedCustom = 0;
    let hiddenCore = 0;

    targets.forEach(el => {
      const key = el.dataset.layoutKey;
      const isCustom = !!el.closest('#layoutCustomLayer') || el.classList.contains('layout-widget');
      if (isCustom) {
        const item = key ? widgetEls.get(key) : null;
        if (item) {
          stopWidgetTimer(item);
          item.el.remove();
          widgetEls.delete(key);
        } else {
          el.remove();
        }
        if (key) {
          widgetDefs = widgetDefs.filter(def => def.id !== key);
          delete saved[key];
        }
        removedCustom++;
      } else {
        el.style.display = 'none';
        if (key) patchSaved(key, { hidden: true });
        hiddenCore++;
      }
    });

    if (removedCustom) persistWidgets();
    persistSaved();
    clearSelection();

    if (removedCustom && hiddenCore) {
      showToast(T('layout.deleteMixed', '已删除组件；页面元素已隐藏，按 H 可恢复'), '🗑️');
    } else if (hiddenCore) {
      showToast(T('layout.deleteCore', '已隐藏选中元素，按 H 可恢复'), '🙈');
    } else {
      showToast(T('layout.deleteDone', '已删除选中组件'), '🗑️');
    }
  }

  function duplicateSelected() {
    if (!selected) {
      showToast(T('layout.selectFirst', '请先选中一个元素'), '👆');
      return;
    }

    const type = selected.dataset.layoutWidget;
    if (type === 'quartz' || type === 'text') {
      addWidget(type, type === 'text' ? selected.textContent : '', 28, 28);
      return;
    }

    const layer = ensureLayer();
    const rect = selected.getBoundingClientRect();
    const clone = selected.cloneNode(true);
    const newId = 'layout-copy-' + Date.now().toString(36);

    clone.id = newId;
    clone.classList.add('layout-widget');
    clone.classList.remove('layout-selected', 'layout-multi-selected', 'layout-dragging', 'layout-draggable');
    clone.removeAttribute('data-layout-bound');
    clone.removeAttribute('data-layout-key');
    clone.removeAttribute('data-layout-absolute');
    clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));

    clone.style.position = 'absolute';
    clone.style.left = (rect.left + 24) + 'px';
    clone.style.top = (rect.top + 24) + 'px';
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.zIndex = '50';

    /* 尽量保留按钮自身的 onclick（addEventListener 注册的监听无法复制） */
    if (typeof selected.onclick === 'function') clone.onclick = selected.onclick;

    layer.appendChild(clone);
    register(clone);
    patchSaved(newId, { x: parseFloat(clone.style.left), y: parseFloat(clone.style.top), absolute: true });
    widgetDefs.push({ id: newId, type: 'clone', html: clone.outerHTML });
    persistWidgets();
    selectElement(clone, false);
    showToast(T('layout.copyDone', '已复制一个视觉副本'), '📄');
  }

  function ensureLayer() {
    let layer = document.getElementById('layoutCustomLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'layoutCustomLayer';
      document.body.appendChild(layer);
    }
    return layer;
  }

  function createQuartzContent(el) {
    const face = document.createElement('div');
    face.className = 'qc-face';

    /* 60 根分钟刻度：每 5 分钟加粗成长刻度，和参考图一致 */
    for (let i = 0; i < 60; i++) {
      const mark = document.createElement('span');
      mark.className = 'qc-mark' + (i % 5 === 0 ? ' major' : ' minor');
      mark.style.transform = `rotate(${i * 6}deg)`;
      face.appendChild(mark);
    }

    /* 纯钟面：不显示数字，只保留刻度和指针 */

    const hour = document.createElement('span');
    hour.className = 'qc-hand hour';
    const minute = document.createElement('span');
    minute.className = 'qc-hand minute';
    const second = document.createElement('span');
    second.className = 'qc-second-axis';
    second.innerHTML = '<span class="qc-second-line"></span><span class="qc-second-tail"></span><span class="qc-second-ring"></span>';
    const center = document.createElement('span');
    center.className = 'qc-center';

    face.appendChild(hour);
    face.appendChild(minute);
    face.appendChild(second);
    face.appendChild(center);
    el.appendChild(face);

    const tick = () => {
      const now = new Date();
      /* 秒针按整秒跳，避免毫秒让它停在两根刻度之间 */
      const sec = now.getSeconds();
      const min = now.getMinutes() + sec / 60;
      const hr = (now.getHours() % 12) + min / 60;

      second.style.transform = `rotate(${sec * 6}deg)`;
      minute.style.transform = `rotate(${min * 6}deg)`;
      hour.style.transform = `rotate(${hr * 30}deg)`;
    };

    tick();
    /* 【修改】20261119：石英钟不再用 setInterval 从创建瞬间开始数。
       先等到下一个整秒，再每一秒按真实时间重排，避免越走越偏；
       切回页面时由 global listener 立即校时。 */
    let timer = null;
    function startAlignedClock() {
      if (timer) clearTimeout(timer);
      const delay = 1000 - (Date.now() % 1000) + 5;
      timer = setTimeout(function run() {
        tick();
        timer = setTimeout(run, 1000 - (Date.now() % 1000));
      }, delay);
    }
    startAlignedClock();
    return { timer, tick, stop: () => { if (timer) clearTimeout(timer); } };
  }

  function createWidget(def) {
    if (!def || !def.id || widgetEls.has(def.id)) return null;
    if (document.getElementById(def.id)) return null;

    const layer = ensureLayer();

    /* 视觉副本：从保存的 outerHTML 复原 */
    if (def.type === 'clone') {
      const holder = document.createElement('div');
      holder.innerHTML = def.html || '';
      const node = holder.firstElementChild;
      if (!node) return null;

      node.id = def.id;
      node.classList.add('layout-widget');
      node.classList.remove('layout-selected', 'layout-multi-selected', 'layout-dragging', 'layout-draggable');
      node.removeAttribute('data-layout-bound');
      node.removeAttribute('data-layout-key');
      node.style.position = 'absolute';
      node.style.margin = '0';
      node.style.zIndex = node.style.zIndex || '50';

      layer.appendChild(node);
      register(node);
      widgetEls.set(def.id, { el: node });
      return node;
    }

    const el = document.createElement('div');
    el.id = def.id;
    el.className = 'layout-widget';
    el.dataset.layoutWidget = def.type;

    if (def.type === 'quartz') {
      el.classList.add('quartz-clock');
    } else if (def.type === 'text') {
      el.classList.add('text-widget');
      el.textContent = def.text || T('layout.defaultText', '自定义文字');
    }

    const pos = saved[def.id];
    if (pos && pos.absolute) {
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.dataset.layoutAbsolute = '1';
    } else {
      const offsetX = def.offsetX || 0;
      const offsetY = def.offsetY || 0;
      const width = def.type === 'quartz' ? 240 : 180;
      const height = def.type === 'quartz' ? 240 : 180;
      el.style.left = Math.max(8, Math.round(window.innerWidth / 2 - width / 2 + offsetX)) + 'px';
      el.style.top = Math.max(8, Math.round(window.innerHeight / 2 - height / 2 + offsetY)) + 'px';
      el.dataset.layoutAbsolute = '1';
      patchSaved(def.id, { x: parseFloat(el.style.left), y: parseFloat(el.style.top), absolute: true });
    }

    layer.appendChild(el);

    if (def.type === 'quartz') {
      const quartz = createQuartzContent(el);
      widgetEls.set(def.id, { el, timer: quartz.timer, tick: quartz.tick, stop: quartz.stop });
    } else {
      widgetEls.set(def.id, { el });
    }

    register(el);
    return el;
  }

  function addWidget(type, text, offsetX, offsetY) {
    const id = 'layout-widget-' + type + '-' + Date.now().toString(36);
    const def = {
      id,
      type,
      text: text || '',
      offsetX: offsetX || 0,
      offsetY: offsetY || 0
    };

    widgetDefs.push(def);
    persistWidgets();

    const el = createWidget(def);
    if (el) {
      selectElement(el, false);
      showToast(type === 'quartz' ? T('layout.clockAdded', '已添加石英钟') : T('layout.textAdded', '已添加自定义文字'), '✨');
    }
  }

  function renderWidgets() {
    widgetDefs.forEach(def => {
      try { createWidget(def); } catch (e) { /* 忽略单个坏数据 */ }
    });
  }

  function bind() {
    if (!btnEdit) return;

    btnEdit.addEventListener('click', () => setEditing(!editing));
    if (btnReset) btnReset.addEventListener('click', () => resetLayout(false));

    const btnAddClock = document.getElementById('btnLayoutAddClock');
    const btnCopy = document.getElementById('btnLayoutCopy');
    const btnRestorePos = document.getElementById('btnLayoutRestorePos');
    const btnDelete = document.getElementById('btnLayoutDelete');
    const btnUniformScale = document.getElementById('btnLayoutUniformScale');
    const btnFront = document.getElementById('btnLayoutFront');
    const btnBack = document.getElementById('btnLayoutBack');
    const btnToolboxReset = document.getElementById('btnLayoutToolboxReset');

    if (btnAddClock) btnAddClock.addEventListener('click', () => {
      const offset = (widgetDefs.length % 5) * 26;
      addWidget('quartz', '', offset, offset);
    });
    if (btnCopy) btnCopy.addEventListener('click', duplicateSelected);
    if (btnRestorePos) btnRestorePos.addEventListener('click', restoreSelectedPosition);
    if (btnDelete) btnDelete.addEventListener('click', deleteSelected);
    if (btnUniformScale) btnUniformScale.addEventListener('click', toggleUniformScale);
    if (btnFront) btnFront.addEventListener('click', () => applyZ('front'));
    if (btnBack) btnBack.addEventListener('click', () => applyZ('back'));
    if (btnToolboxReset) btnToolboxReset.addEventListener('click', () => resetLayout(false));

    if (selectionBox) {
      selectionBox.querySelectorAll('.lrh').forEach(handle => {
        handle.addEventListener('pointerdown', onResizeDown);
      });
    }

    /* 品牌整体不再作为可拖动目标，避免选中细节时外层又被整圈虚线框住 */
    const oldBrandBox = document.getElementById('brandLogo');
    if (oldBrandBox) {
      oldBrandBox.classList.remove('layout-draggable', 'layout-selected', 'layout-multi-selected', 'layout-dragging');
    }

    registerAll();
    renderWidgets();
    updateUniformSwitch();

    [0, 300, 1200, 2500, 4000].forEach(ms => setTimeout(registerAll, ms));

    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (window.MutationObserver) {
      const observer = new MutationObserver(registerAll);
      [header, main].forEach(root => {
        if (root) observer.observe(root, { childList: true, subtree: true });
      });
    }

    document.addEventListener('pointerdown', onDocumentPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', updateSelectionBox, true);
    window.addEventListener('resize', updateSelectionBox);

    /* 编辑模式下一律不触发页面原有按钮，只让工具箱/开关可点 */
    document.addEventListener('click', e => {
      if (!editing) return;
      if (e.target.closest('#layoutEditDock') || e.target.closest('#layoutEditToolbar') || e.target.closest('#layoutSelectionBox')) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();

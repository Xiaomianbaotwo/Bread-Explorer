/* =========================================================
   friend/js/04-friends-chat-render.js —— 消息气泡渲染 / 礼物气泡 / 滚动
   【拆分自】原 js/friend-system/02-friends-chat.js（渲染部分，逐字保留）
   ========================================================= */

function renderMessageBubble(msg, myName) {
  const chatBox = document.getElementById('chatMessages');
  if (document.getElementById(`msg-${msg.id}`)) return;

  const isSelf = msg.sender_name === myName;
  const row = document.createElement('div');
  row.id = `msg-${msg.id}`;
  row.className = `msg-row ${isSelf ? 'self' : 'other'}`;
  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ★ 需求1：系统通知（拆礼物提示）
  if (msg.content.startsWith('[SYSTEM]')) {
    row.style = "justify-content: center; width: 100%;";
    row.innerHTML = `<div style="font-size:12px; color:var(--ink-soft); background:rgba(150,150,150,0.1); padding:4px 12px; border-radius:20px; text-align:center;">${msg.content.replace('[SYSTEM] ', '')}</div>`;
    chatBox.appendChild(row);
    return;
  }

  // 撤回消息展示
  if (msg.is_recalled) {
    row.style = "justify-content: center; width: 100%;";
    row.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${isSelf ? _loadT('friend.selfYou') : _loadT('friend.selfOther')} ${_loadT('friend.recalledOne')}</div>`;
    chatBox.appendChild(row);
    return;
  }

  if (msg.content.startsWith('[GIFT]')) {
    let giftData = { type: 'points', amount: 0, text: _loadT('friend.giftMystery'), mailId: '' };
    try { giftData = JSON.parse(msg.content.replace('[GIFT]', '')); } catch(e) {}
    
    const isInvalid = !giftData.mailId;
    const btnText = isSelf ? _loadT('friend.giftWaiting') : (isInvalid ? _loadT('friend.giftInvalid') : _loadT('friend.giftOpen'));
    const bubbleBg = isInvalid ? 'linear-gradient(135deg, #7f8c8d, #95a5a6)' : 'linear-gradient(135deg, #ff9800, #e74c3c)';

    row.innerHTML = `
      <div class="msg-bubble" style="background: ${bubbleBg}; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; cursor: ${isSelf || isInvalid ? 'default' : 'pointer'};">
        <div style="font-size: 40px; margin-bottom: 8px;">${isInvalid ? '📦' : '🎁'}</div>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">${giftData.text || _loadT('friend.giftUnknown')}</div>
        <div class="gift-open-btn" style="font-size: 12px; background: rgba(255,255,255,0.3); padding: 4px 12px; border-radius: 20px;">${btnText}</div>
        <div class="msg-time" style="color: rgba(255,255,255,0.8); margin-top: 8px;">${timeStr}</div>
      </div>
    `;
    
    if (!isSelf && !isInvalid) {
      const bubble = row.querySelector('.msg-bubble');
      bubble.onclick = () => showGiftPopup(giftData, bubble);
    }
  } else {
    // ★ 需求2：普通文本消息增加撤回按钮
    let recallBtnHtml = '';
    if (isSelf) {
      const msgTime = new Date(msg.created_at).getTime();
      // 15分钟内才能撤回
      if (Date.now() - msgTime < 15 * 60 * 1000) {
        recallBtnHtml = `<span class="recall-btn" data-id="${msg.id}" style="font-size:10px; color:var(--ink-soft); cursor:pointer; margin-left:8px; text-decoration:underline;">${_loadT('friend.recall')}</span>`;
      }
    }

    row.innerHTML = `
      <div class="msg-bubble" style="position:relative;">
        <span class="msg-text" data-i18n-skip>${msg.content}</span>
        <div class="msg-time">${timeStr} ${recallBtnHtml}</div>
      </div>
    `;

    // 绑定撤回事件
    const recallBtn = row.querySelector('.recall-btn');
    if (recallBtn) {
      recallBtn.onclick = async (e) => {
        e.stopPropagation();
        showConfirmModal(_loadT('friend.recallTitle'), _loadT('friend.recallDesc'), async () => {
          await sb.from('bread_messages').update({ is_recalled: true }).eq('id', msg.id);
          showToast(_loadT('friend.recalled'), '↩️');
        });
      };
    }
  }
  
  if (chatBox.innerHTML.includes('还没有聊天记录')) chatBox.innerHTML = '';
  chatBox.appendChild(row);
}

function scrollToBottom() {
  const chatBox = document.getElementById('chatMessages');
  chatBox.scrollTop = chatBox.scrollHeight;
}

function lockGiftBubble(bubbleEl, text) {
  if (!bubbleEl) return;
  bubbleEl.style.background = 'linear-gradient(135deg, #7f8c8d, #95a5a6)';
  const btn = bubbleEl.querySelector('.gift-open-btn');
  if (btn) btn.textContent = text;
  bubbleEl.onclick = null;
}

function showGiftPopup(giftData, bubbleEl) {
  const overlay = document.createElement('div');
  overlay.style = "position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: rise 0.3s;";
  
  const box = document.createElement('div');
  box.innerHTML = '🎁';
  box.style = "font-size: 120px; cursor: pointer; transition: transform 0.3s;";
  
  const text = document.createElement('div');
  text.textContent = _loadT("friend.clickToOpen");
  text.style = "color:#fff; font-size:18px; font-weight:bold; margin-top:20px; text-shadow:0 2px 10px rgba(255,255,255,0.5);";
  
  overlay.appendChild(box);
  overlay.appendChild(text);
  document.body.appendChild(overlay);

  box.onclick = async () => {
    if (!giftData.mailId) {
      showToast(_loadT('friend.giftVoucherLost'), '❌');
      lockGiftBubble(bubbleEl, _loadT('friend.invalid'));
      overlay.remove();
      return;
    }

    box.style.transform = 'scale(1.5)';
    box.innerHTML = '💥';
    box.style.pointerEvents = 'none';
    text.textContent = _loadT('friend.openingGift');

    try {
      if (giftData.type === 'code') {
         const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: giftData.itemId });
         if (error || !data.success) throw new Error(data?.msg || _loadT('friend.redeemFailed'));
      } else {
         const { data, error } = await sb.rpc('claim_friend_gift', { p_mail_id: giftData.mailId, p_username: currentUser });
         if (error || data === false) throw new Error(error?.message || _loadT('friend.openFailed'));
      }

      setTimeout(async () => {
        box.innerHTML = '✨';
        text.textContent = _loadT('friend.gotGift', { name: giftData.text });
        text.style.color = '#f1c40f';
        
        lockGiftBubble(bubbleEl, _loadT('friend.opened'));
        if (typeof syncFromCloud === 'function') await syncFromCloud();
        updateUserUI();

        setTimeout(() => overlay.remove(), 2000);
      }, 300);

    } catch (err) {
      text.textContent = _loadT('friend.openFailedDetail', { msg: err.message });
      text.style.color = '#e74c3c';
      box.innerHTML = '❌';
      lockGiftBubble(bubbleEl, _loadT('friend.invalidOpened'));
      setTimeout(() => overlay.remove(), 2000);
    }
  };
}


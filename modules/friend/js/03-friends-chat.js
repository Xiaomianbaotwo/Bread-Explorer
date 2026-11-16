/* =========================================================
   friend/js/03-friends-chat.js —— 聊天窗口 / 历史 / 发送 / 实时
   【拆分自】原 js/friend-system/02-friends-chat.js（逻辑部分，逐字保留）
   ========================================================= */

let currentChatFriendName = null;
let chatRealtimeChannel = null;

// ★ 需求3：本地彻底隐藏/删除当前对话
window.clearLocalChat = function() {
  if (!currentChatFriendName) return;
  showConfirmModal(_loadT('friend.clearChatTitle'), _loadT('friend.clearChatDesc'), () => {
    let deletedMsgs = JSON.parse(localStorage.getItem(`deleted_msgs_${currentUser}`) || '[]');
    // 把当前屏幕上的消息 ID 全塞进去
    document.querySelectorAll('.msg-row').forEach(row => {
      if (row.id && row.id.startsWith('msg-')) {
        const msgId = row.id.replace('msg-', '');
        if (!deletedMsgs.includes(msgId)) deletedMsgs.push(msgId);
      }
    });
    localStorage.setItem(`deleted_msgs_${currentUser}`, JSON.stringify(deletedMsgs));
    
    document.getElementById('chatMessages').innerHTML = `<div style="text-align:center; font-size:12px; color:var(--ink-soft); margin-top:20px;">${_loadT('friend.cleared')}</div>`;
    showToast(_loadT('friend.clearedToast'), '🧹');
  });
};

// ★ 需求4：关闭窗口时重置右侧 UI
window.resetChatUI = function() {
  currentChatFriendName = null;
  document.getElementById('chatEmptyState').style.display = 'flex';
  document.getElementById('chatHeader').style.display = 'none';
  document.getElementById('chatMessages').style.display = 'none';
  document.getElementById('chatInputArea').style.display = 'none';
  document.getElementById('chatMessages').innerHTML = '';
  document.getElementById('giftPanel').classList.remove('show');
};

window.switchChatWindow = async function(friend) {
  currentChatFriendName = friend.username;
  document.getElementById('chatEmptyState').style.display = 'none';
  document.getElementById('chatHeader').style.display = 'flex';
  document.getElementById('chatMessages').style.display = 'flex';
  document.getElementById('chatInputArea').style.display = 'flex';
  document.getElementById('chatFriendName').textContent = friend.username;
  document.getElementById('chatInput').value = '';

  await loadChatHistory();
  initChatRealtime();
};

async function loadChatHistory() {
  if (!currentChatFriendName) return;
  const chatBox = document.getElementById('chatMessages');
  chatBox.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--ink-soft); margin-top:10px;">${_loadT('friend.loadingChat')}</div>`;
  
  try {
    const { data, error } = await sb
      .from('bread_messages')
      .select('*')
      .or(`and(sender_name.eq.${currentUser},receiver_name.eq.${currentChatFriendName}),and(sender_name.eq.${currentChatFriendName},receiver_name.eq.${currentUser})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    chatBox.innerHTML = '';
    if (!data || data.length === 0) {
      chatBox.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--ink-soft); margin-top:20px;">${_loadT('friend.noChat')}</div>`;
      return;
    }

    let deletedMsgs = JSON.parse(localStorage.getItem(`deleted_msgs_${currentUser}`) || '[]');

    data.forEach(msg => {
      // 如果消息被我在本地删除了，就不显示
      if (deletedMsgs.includes(String(msg.id))) return;
      renderMessageBubble(msg, currentUser);
    });
    
    scrollToBottom();
  } catch (err) {
    chatBox.innerHTML = `<div style="text-align:center; font-size:12px; color:#e74c3c;">${_loadT('friend.chatLoadFailed')}</div>`;
  }
}


window.initChatSystem = function() {
  document.getElementById('btnSendMessage').onclick = async () => {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content || !currentChatFriendName) return;

    input.value = '';
    try {
      const tempId = 'temp_' + Date.now();
      const now = new Date().toISOString();
      renderMessageBubble({ id: tempId, sender_name: currentUser, receiver_name: currentChatFriendName, content: content, created_at: now, is_recalled: false }, currentUser);
      scrollToBottom();
      await sb.from('bread_messages').insert({ sender_name: currentUser, receiver_name: currentChatFriendName, content: content });
    } catch (err) { showToast(_loadT('friend.sendFailed'), '❌'); }
  };
  document.getElementById('chatInput').onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('btnSendMessage').click(); };
};

function initChatRealtime() {
  if (chatRealtimeChannel) return;
  chatRealtimeChannel = sb.channel('custom_all_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bread_messages' }, async (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMsg = payload.new;
        const isForMe = newMsg.receiver_name === currentUser;
        const isFromMe = newMsg.sender_name === currentUser;
        if (!isForMe && !isFromMe) return;
        if (isFromMe && !newMsg.content.startsWith('[GIFT]')) return;

        if ((isForMe && newMsg.sender_name === currentChatFriendName) || (isFromMe && newMsg.receiver_name === currentChatFriendName)) {
          renderMessageBubble(newMsg, currentUser);
          scrollToBottom();
        } else if (isForMe) {
          showToast(_loadT('friend.newMessage'), '💬');
        }
      } else if (payload.eventType === 'UPDATE') {
        // ★ 处理撤回状态同步
        const updMsg = payload.new;
        if (updMsg.is_recalled) {
          const el = document.getElementById(`msg-${updMsg.id}`);
          if (el) {
            el.style = "justify-content: center; width: 100%;";
            const isSelf = updMsg.sender_name === currentUser;
            el.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${isSelf ? _loadT('friend.selfYou') : _loadT('friend.selfOther')} ${_loadT('friend.recalledOne')}</div>`;
          }
        }
      }
    }).subscribe();
}
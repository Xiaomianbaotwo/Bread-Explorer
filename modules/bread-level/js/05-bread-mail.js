/* =========================================================
   modules/bread-level/js/05-bread-mail.js
   面包等级 · 解锁通知邮件（面包原野 Plus / Max）

   【新增】20261119：
     1. 面包等级到 Lv40 → 直接解锁主题「面包原野 Plus」（default-plus）
     2. 面包等级到 Lv60 → 直接解锁主题「面包原野 Max」（default-max）
     3. 解锁时只发一封通知邮件（isClaimed:true，邮件里没有「领取」按钮，只做提醒）
     4. 按 breadUnlockSent 去重，降级后再升回来不会重复发信
   ========================================================= */

(() => {
  /* 解锁档位：改这里即可调整门槛
     面包原野 Plus = Lv40、面包原野 Max = Lv60；
     面包等级专属主题「蜂蜜工坊」= Lv30 原版 / Lv50 Plus / Lv60 Max。 */
  const TIERS = [
    {
      key: 'honey', level: 30, theme: 'honey',
      title: '蜂蜜工坊已解锁',
      titleEn: 'Honey Atelier unlocked',
      content: '面包等级达到 Lv30，已为你永久解锁面包等级专属主题「🍯 蜂蜜工坊」，可在主题中心直接使用。',
      contentEn: 'Bread Level reached Lv30. Bread-Level-exclusive theme "🍯 Honey Atelier" is now permanently unlocked in the Theme Center.'
    },
    {
      key: 'plus', level: 40, theme: 'default-plus',
      title: '面包原野 Plus 已解锁',
      titleEn: 'Bread Plains Plus unlocked',
      content: '面包等级达到 Lv40，已为你永久解锁主题「✨ 面包原野 Plus」，可在主题商店直接使用。',
      contentEn: 'Bread Level reached Lv40. Theme "✨ Bread Plains Plus" is now permanently unlocked in the theme shop.'
    },
    {
      key: 'honey-plus', level: 50, theme: 'honey-plus',
      title: '蜂蜜工坊 Plus 已解锁',
      titleEn: 'Honey Atelier Plus unlocked',
      content: '面包等级达到 Lv50，已为你永久解锁「✨ 蜂蜜工坊 Plus」，蜂蜜金更深一档。',
      contentEn: 'Bread Level reached Lv50. "✨ Honey Atelier Plus" is now permanently unlocked.'
    },
    {
      key: 'max', level: 60, theme: 'default-max',
      title: '面包原野 Max 已解锁',
      titleEn: 'Bread Plains Max unlocked',
      content: '面包等级已满级 Lv60，已为你永久解锁主题「👑 面包原野 Max」，可在主题商店直接使用。',
      contentEn: 'Bread Level hit Lv60. Theme "👑 Bread Plains Max" is now permanently unlocked in the theme shop.'
    },
    {
      key: 'honey-max', level: 60, theme: 'honey-max',
      title: '蜂蜜工坊 Max 已解锁',
      titleEn: 'Honey Atelier Max unlocked',
      content: '面包等级已满级 Lv60，已为你永久解锁「👑 蜂蜜工坊 Max」，奶油白 + 深焦糖 + 金边的满级配色。',
      contentEn: 'Bread Level hit Lv60. "👑 Honey Atelier Max" is now permanently unlocked.'
    }
  ];

  function newMailId() {
    return 'breadr-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000).toString(36);
  }

  /* 把主题写进 unlockedThemes（和主题商店购买用的是同一个字段） */
  function grantTheme(u, key) {
    if (!Array.isArray(u.unlockedThemes)) u.unlockedThemes = [];
    if (u.unlockedThemes.indexOf(key) >= 0) return false;
    u.unlockedThemes.push(key);
    return true;
  }

  /* 检查当前等级是否触发解锁；命中就解锁 + 发通知邮件 */
  function check(u, level) {
    if (!u) return false;
    const lv = Math.max(1, Math.min(60, Number(level) || Number(u.userLevel) || 1));
    if (!Array.isArray(u.emails)) u.emails = [];
    if (!Array.isArray(u.breadUnlockSent)) u.breadUnlockSent = [];

    let changed = false;
    TIERS.forEach(t => {
      if (lv < t.level) return;

      /* 主题可能已经买过 / 别处送过 → 只补记录，不再发信 */
      const had = grantTheme(u, t.theme);
      if (had) changed = true;

      if (u.breadUnlockSent.indexOf(t.key) >= 0) return;
      /* 邮箱里已有同一档通知邮件也算已发过（云端拉回本地后数组可能缺） */
      const mailed = u.emails.some(m => m && m.type === 'bread_unlock' && m.breadTier === t.key);
      u.breadUnlockSent.push(t.key);
      changed = true;
      if (mailed) return;

      u.emails.push({
        id: newMailId(),
        type: 'bread_unlock',
        breadTier: t.key,
        breadLevel: t.level,
        theme: t.theme,
        title: t.title,
        titleEn: t.titleEn,
        content: t.content,
        contentEn: t.contentEn,
        date: Date.now(),
        isRead: false,
        /* 只是通知，不需要领取：邮件里不会出现「领取」按钮 */
        isClaimed: true
      });
    });
    return changed;
  }

  /* 对外：升级后调用（03-bread-task.js 里升级 / 签到 / 兑换都会走到） */
  function checkAndSave(u) {
    if (!u) return;
    const level = Math.max(1, Math.min(60, Number(u.userLevel) || 1));
    if (check(u, level)) {
      try { save(u); } catch (e) { /* 忽略 */ }
      /* 【修改】20261118 P0：emails 不再随 bread_assets 整行 upsert，改用单列 RPC 同步。 */
      if (typeof syncEmailsToCloud === 'function') {
        try { syncEmailsToCloud(u); } catch (e) { /* 忽略 */ }
      }
      reRenderMail();
    }
  }

  function reRenderMail() {
    try {
      if (typeof window.renderMails === 'function') {
        const ov = document.getElementById('mailOverlay');
        if (ov && ov.classList.contains('show')) window.renderMails();
      }
    } catch (e) { /* 忽略 */ }
  }

  window.BreadMail = { TIERS, check, checkAndSave };
})();

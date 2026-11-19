/* =========================================================
   modules/bread-level/js/06-bread-i18n.js
   面包等级 · 中英文词条（从 modules/i18n/07-i18n-vip.js 抽出）

   命名空间仍是 window.__BB_I18N['bread']，词条 key 不变，
   所以 01~04 里 T('bread.xxx') 的调用无需改动。
   ========================================================= */

(() => {
  window.__BB_I18N = window.__BB_I18N || {};
  window.__BB_I18N.zh = window.__BB_I18N.zh || {};
  window.__BB_I18N.en = window.__BB_I18N.en || {};
  window.__BB_I18N.zh['bread'] = {
    entry: "🍞 面包等级",
    panelTitle: "🍞 面包等级成长",
    levelName: "面包等级",
    title0: "初来乍到的面包",
    bakeProgress: "烘焙度 {{cur}} / {{cap}}",
    maxPoint: "累计烘焙度 {{n}}",
    checkinBtn: "每日签到 +{{n}} 烘焙度",
    checkinDone: "今日已签到 +{{n}} 烘焙度",
    checkinOk: "签到成功，+{{n}} 烘焙度",
    checkinOkOverflow: "签到成功，+{{n}} 烘焙度；已满级，溢出部分自动转为 {{points}} 积分",
    nextNeed: "再攒 {{n}} 烘焙度升级",
    maxed: "已满级 Lv60 · 多余烘焙度自动转积分（3:1）",

    taskDay: "今日任务",
    taskWeek: "本周任务",
    taskMonth: "每月任务",
    resetMonth: "每月 1 号刷新",
    resetDay: "每天 0 点刷新",
    resetWeek: "每周一刷新",
    claim: "领取",
    claimed: "已领取",
    ongoing: "进行中",
    bakeUnit: "烘焙度",
    progressFmt: "进度 {{cur}} / {{need}}",

    exchangeTitle: "积分兑烘焙度",
    exchangePoints: "当前积分：{{points}}",
    exchangeTip: "烘焙度就是面包等级的升级经验；兑换没有每日上限，积分够就能换",
    exchangeNoPoints: "积分不足，还差 {{need}}",
    exchangeFail: "兑换失败，请稍后再试",
    exchangeOk: "兑换成功，+{{bake}} 烘焙度",
    exchangeLevelUp: "兑换成功，+{{bake}} 烘焙度，等级升到 Lv{{level}}",
    exchangeOverflow: "兑换成功，+{{bake}} 烘焙度；已满级，溢出部分自动转为 {{points}} 积分",
    taskReach: "完成 {{n}} 次，可得 {{bake}} 烘焙度",
    claimOk: "任务完成，+{{n}} 烘焙度",
    claimOkOverflow: "任务完成，+{{n}} 烘焙度；已满级，溢出部分自动转为 {{points}} 积分",
    claimFail: "领取失败：{{reason}}，今日烘焙度额度可能已用完",
    taskPoints: "顺带 +{{n}} 积分（当前 {{total}}）",   /* 【新增】20261119：面包任务顺带发积分 */

    task_d_open: "打开一次面包浏览器",
    task_d_search: "搜索 5 次",
    task_d_basket: "新增 2 个面包篮",
    task_d_profile: "查看 1 次个人资料",
    task_w_search: "本周搜索 30 次",
    task_w_theme: "本周逛 5 次主题商店",
    task_w_redeem: "本周使用 3 次兑换码",
    task_w_suggest: "本周提 3 次建议或反馈",
    /* 【新增】20261119：每月任务名称（四档） */
    task_m_search: "本月搜索 150 次",
    task_m_theme: "本月逛 20 次主题商店",
    task_m_open: "本月打开 60 次面包浏览器",
    task_m_suggest: "本月提 10 次建议或反馈",

    perksTitle: "等级权益",
    perkCapacity: "面包篮容量",
    perkDaily: "每日额外积分",
    perkSpeed: "加载提速（仍慢于 VIP）",
    perkRoom: "解锁「花事书房」",
    roomLv30: "Lv30",
    tokens: "免费主题额度：{{n}}",
    tokensHint: "Lv20 / Lv40 / Lv60 各送 1 个",
    pickTheme: "选主题",
    tokenPickTip: "选一个基础主题，永久解锁（Plus / Max 不参与）",
    tokenEmpty: "暂时没有可解锁的基础主题了",
    themeOk: "已解锁主题：{{name}}",
    pointsUnit: "积分",

    levelUpToast: "面包等级升到 Lv{{level}}，赠送 {{points}} 积分",
    dailyPoints: "面包等级每日福利，+{{n}} 积分",
    title10: "新手面包师",
    title20: "面包学徒",
    title30: "熟练面包师",
    title40: "资深面包师",
    title50: "传奇面包师",
    title60: "面包大师"
  };

  window.__BB_I18N.en['bread'] = {
    entry: "🍞 Bread Level",
    panelTitle: "🍞 Bread Level",
    levelName: "Bread Level",
    title0: "Fresh Crumb",
    bakeProgress: "Bake {{cur}} / {{cap}}",
    maxPoint: "Total bake {{n}}",
    checkinBtn: "Daily check-in +{{n}} bake",
    checkinDone: "Checked in today +{{n}} bake",
    checkinOk: "Check-in done, +{{n}} bake",
    checkinOkOverflow: "Check-in done, +{{n}} bake; max level, overflow converted to {{points}} points",
    nextNeed: "{{n}} more bake to level up",
    maxed: "Max level Lv60 · extra bake auto-converts to points (3:1)",

    taskDay: "Daily Tasks",
    taskWeek: "Weekly Tasks",
    taskMonth: "Monthly Tasks",       /* 【新增】20261119：每月任务 */
    resetMonth: "Resets on the 1st",
    resetDay: "Resets at midnight",
    resetWeek: "Resets every Monday",
    claim: "Claim",
    claimed: "Claimed",
    ongoing: "Ongoing",
    bakeUnit: "bake",
    progressFmt: "Progress {{cur}} / {{need}}",

    exchangeTitle: "Points → Bake",
    exchangePoints: "Points: {{points}}",
    exchangeTip: "Bake is the EXP for Bread Level. No daily limit — exchange as long as you have points",
    exchangeNoPoints: "Not enough points, {{need}} short",
    exchangeFail: "Exchange failed, try again later",
    exchangeOk: "Exchange done, +{{bake}} bake",
    exchangeLevelUp: "Exchange done, +{{bake}} bake, now Lv{{level}}",
    exchangeOverflow: "Exchange done, +{{bake}} bake; max level, overflow converted to {{points}} points",
    taskReach: "Do it {{n}} time(s) for {{bake}} bake",
    claimOk: "Task completed, +{{n}} bake",
    claimOkOverflow: "Task completed, +{{n}} bake; max level, overflow converted to {{points}} points",
    claimFail: "Claim failed: {{reason}}. Today's bake limit may be used up.",
    taskPoints: "Bonus +{{n}} points (total {{total}})",

    task_d_open: "Open Bread Explorer once",
    task_d_search: "Search 5 times",
    task_d_basket: "Add 2 basket sites",
    task_d_profile: "View your profile once",
    task_w_search: "Search 30 times this week",
    task_w_theme: "Visit the theme shop 5 times this week",
    task_w_redeem: "Use a redeem code 3 times this week",
    task_w_suggest: "Send 3 suggestions or reports this week",
    /* 【新增】20261119：每月任务名称（四档） */
    task_m_search: "Search 150 times this month",
    task_m_theme: "Visit the theme shop 20 times this month",
    task_m_open: "Open Bread Explorer 60 times this month",
    task_m_suggest: "Send 10 suggestions or reports this month",

    perksTitle: "Level Perks",
    perkCapacity: "Basket capacity",
    perkDaily: "Extra daily points",
    perkSpeed: "Faster loading (still slower than VIP)",
    perkRoom: "Unlock the Reading Room",
    roomLv30: "Lv30",
    tokens: "Free theme tokens: {{n}}",
    tokensHint: "One each at Lv20 / Lv40 / Lv60",
    pickTheme: "Choose",
    tokenPickTip: "Pick one base theme to unlock forever (Plus / Max excluded)",
    tokenEmpty: "No base theme left to unlock",
    themeOk: "Theme unlocked: {{name}}",
    pointsUnit: "points",

    levelUpToast: "Bread Level up to Lv{{level}}, +{{points}} points",
    dailyPoints: "Bread Level daily bonus, +{{n}} points",
    title10: "Novice Baker",
    title20: "Baker Apprentice",
    title30: "Skilled Baker",
    title40: "Senior Baker",
    title50: "Legendary Baker",
    title60: "Bread Master"
  };
})();

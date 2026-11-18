/* =========================================================
   modules/point-center/js/05-point-i18n.js
   积分中心 · 中英文词条（命名空间 window.__BB_I18N['point']）

   任务名按任务 id 取词条：point.task_p_d_open 之类；
   云端新增任务 id 时，若这里没有对应词条会退回显示任务 id，不会报错。
   ========================================================= */

(() => {
  window.__BB_I18N = window.__BB_I18N || {};
  window.__BB_I18N.zh = window.__BB_I18N.zh || {};
  window.__BB_I18N.en = window.__BB_I18N.en || {};

  window.__BB_I18N.zh['point'] = {
    entry: '🪙 积分中心',
    panelTitle: '🪙 积分中心 · 获取积分',
    pointsLabel: '当前积分',
    pointsTip: '当前可用积分：{{points}}（积分不再每月清零）',

    checkinBtn: '每日签到 +{{n}} 积分（已连续 {{streak}} 天）',
    checkinDone: '今日已签到 +{{n}} 积分（连续 {{streak}} 天）',
    checkinDoneToday: '今天已经签过到了',
    needLogin: '登录后才能签到领积分',

    /* 【新增】20261119：签到月历 */
    calWeekday: '一,二,三,四,五,六,日',
    calMonth: '{{y}} 年 {{m}} 月',
    calFoot: '本月已签 {{n}} 天 · 连续 {{streak}} 天',
    /* 【新增】20261119：活动日 / 热力图 / 补签 */
    calEventTip: '🎁 高亮日期为活动日，当天签到与任务积分 ×{{mult}}',
    heatTitle: '近 30 天活跃',
    makeupBtn: '补签昨天（-{{cost}} 积分）',
    makeupOk: '补签成功，连续 {{streak}} 天',
    makeupNoPoints: '积分不够，补签需要更多积分',
    calFootPast: '本月已签 {{n}} 天 · 共得 {{pts}} 积分',
    calCountdown: '距离下一个活动日还有 {{n}} 天（{{date}}）',
    calDetailHint: '点任意日期查看当天明细，鼠标悬停也会显示',
    calDetailLine: '{{date}}：签到 {{ck}} · 任务 {{tasks}} 个 · 当日积分 {{pts}}',
    fullProgress: '本月全勤进度 {{cur}} / {{need}} 天',
    fullClaim: '领全勤奖 +{{n}}',
    fullClaimed: '本月全勤奖已领取',
    fullLocked: '签满 {{need}} 天可领',
    chestLabel: '七天连胜宝箱',
    chestBtn: '开宝箱',
    chestNone: '暂无可开的宝箱',
    chestOk: '宝箱开出 {{n}} 积分，当前共 {{total}}',
    fullOk: '全勤奖 +{{n}} 积分，当前共 {{total}}',
    birthdayLabel: '生日（当天签到双倍）',
    birthdaySaved: '生日已保存，当天签到双倍积分',
    /* 【新增】20261118 生日改为手动输入年/月/日 */
    birthYear: '年',
    birthMonth: '月',
    birthDay: '日',
    birthdayHint: '年份只做记录，可留空；双倍只看月和日。',
    birthdayInvalid: '月和日要填对：月 1~12，日 1~31',
    remindLabel: '每日签到提醒（20:00）',
    remindOn: '开启提醒',
    remindOff: '关闭提醒',
    remindOnToast: '已开启提醒，每晚 20:00 未签到会通知你',
    remindDenied: '浏览器未授权通知，提醒无法开启',
    remindTitle: '今天还没签到',
    remindBody: '来积分中心签到，连续签到还有额外奖励',

    taskReach: '完成 {{n}} 次，可得 {{pts}} 积分',
    progressFmt: '进度 {{cur}} / {{need}}',
    pointsUnit: '积分',
    taskMonth: '本月任务',
    resetMonth: '每月 1 号刷新',

    taskDay: '今日任务',
    taskWeek: '本周任务',
    resetDay: '每天 0 点刷新',
    resetWeek: '每周一刷新',
    claim: '领取',
    claimed: '已领取',
    ongoing: '进行中',
    taskClaimed: '积分 +{{n}}，当前共 {{total}}',

    task_p_d_open: '打开一次面包浏览器',
    task_p_d_search: '搜索 {{n}} 次',
    task_p_d_basket: '往面包篮添加 {{n}} 个站点',
    task_p_d_profile: '查看个人主页 {{n}} 次',
    task_p_d_suggest: '提交 {{n}} 条建议或反馈',
    task_p_w_search: '一周累计搜索 {{n}} 次',
    task_p_w_theme: '一周打开主题商店 {{n}} 次',
    task_p_w_suggest: '一周提交 {{n}} 条建议或反馈',
    /* 【新增】20261119：每月任务 */
    task_p_m_search: '本月搜索 {{n}} 次',
    task_p_m_basket: '本月往面包篮添加 {{n}} 个站点',
    task_p_m_suggest: '本月提交 {{n}} 条建议或反馈',

    shopTitle: '去积分兑换商城 →'
  };

  window.__BB_I18N.en['point'] = {
    entry: '🪙 Points Center',
    panelTitle: '🪙 Points Center · Earn Points',
    pointsLabel: 'Current Points',
    pointsTip: 'Available points: {{points}} (points no longer reset monthly)',

    checkinBtn: 'Daily check-in +{{n}} points (streak {{streak}} days)',
    checkinDone: 'Checked in today +{{n}} points (streak {{streak}} days)',
    checkinDoneToday: 'You already checked in today',
    needLogin: 'Log in to check in and earn points',

    /* 【新增】20261119：签到月历 */
    calWeekday: 'M,T,W,T,F,S,S',
    calMonth: '{{m}}/{{y}}',
    calFoot: 'Checked in {{n}} day(s) this month · streak {{streak}}',
    calEventTip: '🎁 Highlighted dates are event days: x{{mult}} points for check-ins and tasks',
    heatTitle: 'Last 30 days activity',
    makeupBtn: 'Make up yesterday (-{{cost}} points)',
    makeupOk: 'Make-up done, streak {{streak}}',
    makeupNoPoints: 'Not enough points for a make-up',
    calFootPast: 'Checked in {{n}} day(s), earned {{pts}} points this month',
    calCountdown: 'Next event day in {{n}} day(s) ({{date}})',
    calDetailHint: 'Tap any date for details; hover also shows them',
    calDetailLine: '{{date}} — check-in {{ck}} · {{tasks}} task(s) · {{pts}} points',
    fullProgress: 'Monthly attendance {{cur}} / {{need}} days',
    fullClaim: 'Claim +{{n}}',
    fullClaimed: 'Attendance reward already claimed',
    fullLocked: 'Check in {{need}} days to unlock',
    chestLabel: '7-day streak chest',
    chestBtn: 'Open chest',
    chestNone: 'No chest available',
    chestOk: 'Chest gave {{n}} points, total {{total}}',
    fullOk: 'Attendance reward +{{n}} points, total {{total}}',
    birthdayLabel: 'Birthday (double check-in points)',
    birthdaySaved: 'Birthday saved — double points on that day',
    /* 【新增】20261118 birthday as three manual fields */
    birthYear: 'Year',
    birthMonth: 'Month',
    birthDay: 'Day',
    birthdayHint: 'Year is just for record and can be left blank; only month and day decide the double bonus.',
    birthdayInvalid: 'Invalid month/day: month 1-12, day 1-31',
    remindLabel: 'Daily reminder (20:00)',
    remindOn: 'Enable reminder',
    remindOff: 'Disable reminder',
    remindOnToast: 'Reminder on — you will be notified at 20:00 if not checked in',
    remindDenied: 'Notifications are not permitted, cannot enable',
    remindTitle: 'Not checked in yet today',
    remindBody: 'Check in at the Points Center — streaks give bonus points',

    taskReach: 'Complete {{n}} time(s) for {{pts}} points',
    progressFmt: 'Progress {{cur}} / {{need}}',
    pointsUnit: 'pts',
    taskMonth: "This Month's Tasks",
    resetMonth: 'Resets on the 1st',

    taskDay: "Today's Tasks",
    taskWeek: "This Week's Tasks",
    resetDay: 'Resets at 00:00 every day',
    resetWeek: 'Resets every Monday',
    claim: 'Claim',
    claimed: 'Claimed',
    ongoing: 'In progress',
    taskClaimed: '+{{n}} points, total {{total}}',

    task_p_d_open: 'Open Bread Explorer once',
    task_p_d_search: 'Search {{n}} times',
    task_p_d_basket: 'Add {{n}} sites to the bread basket',
    task_p_d_profile: 'View your profile {{n}} time(s)',
    task_p_d_suggest: 'Submit {{n}} suggestion(s) or feedback',
    task_p_w_search: 'Search {{n}} times this week',
    task_p_w_theme: 'Open the theme shop {{n}} times this week',
    task_p_w_suggest: 'Submit {{n}} suggestion(s) this week',
    task_p_m_search: 'Search {{n}} times this month',
    task_p_m_basket: 'Add {{n}} sites to the basket this month',
    task_p_m_suggest: 'Submit {{n}} suggestion(s) this month',

    shopTitle: 'Go to Points Shop →'
  };
})();

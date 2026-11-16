// modules/i18n/02-i18n-ui.js —— 中英双语词条：界面 / 通用 / 加载 / 站点 / 页头
// 【拆分自】原 js/16-i18n.js，按领域逐字搬过来，中英放在同一文件，只换成按模块挂载
(() => {
  window.__BB_I18N = window.__BB_I18N || { zh: {}, en: {} };

  /* ---------- 中文 ---------- */
  window.__BB_I18N.zh['weather'] = {
          cachedAt: "🕒 数据缓存于：{{time}}",
          loading: "加载中...",
          cityDataFail: "城市数据加载失败",
          cityDataFailHint: "请确认 modules/weather/cities/ 下有 txt 文件",
          citiesCount: "共 {{n}} 城",
          noCityMatch: "未找到匹配的城市",
          updating: "正在更新天气...",
          fastReading: "极速读取中...",
          viewDetail: "点击查看详情",
          requestingCloud: "请求云端...",
          noData: "暂无数据",
          goSettings: "请前往【用户中心-天气地区设置】中重新选择",
          detailTitle: "📍 天气详情",
          hours24: "24小时",
          hours: "{{n}}小时",
          cityTitle: "📍 选择城市",
          cityPlaceholder: "输入城市名，如：福州、New York",
          close: "关闭",
          detailTitleCity: "📍 {{city}} 天气详情",
          reportTitle: "🌤️ **{{city}} 今日实时天气**",
          reportData: "📊 **实况数据**",
          rTemp: "· 当前气温：{{temp}}℃ (体感 {{feel}}℃)",
          rCond: "· 天气状况：{{text}}",
          rWind: "· 风向风力：{{dir}} {{scale}}级",
          rHumidity: "· 相对湿度：{{h}}%",
          rPressure: "· 气压：{{p}} hPa",
          rVis: "· 能见度：{{v}} 公里",
          rCloud: "· 云量：{{c}}%",
          rPrecip: "· 降水量：{{p}} mm",
          reportToday: "📅 **今日预报**",
          rTempRange: "· 温度范围：{{min}} ~ {{max}}℃",
          rDayNight: "· 白天/夜间：{{day}} / {{night}}",
          rSun: "· 日出/日落：{{rise}} / {{set}}",
          reportTrend: "⏳ **未来 24 小时气温趋势**",
          chartOmit: "[📈折线图略：{{data}}]",
          report7: "🗓️ **未来 7 天预报**",
          thDate: "日期",
          thDay: "白天",
          thNight: "夜间",
          thTemp: "气温",
          reportTip: "💡 **温馨提示：**",
          reportTipBody: "这是基于您在工具中查询到的完整实况及预测数据生成的基础播报。",
          noDetailData: "暂无详细数据，请稍后刷新。",
          chartFailed: "图表库加载失败",
          batchSuccess: "✅ 第 {{num}}/{{total}} 批更新成功：{{names}}",
          batchDone: "🎉 全量更新已全部完成！",
          other: "其他",
  };

  window.__BB_I18N.zh['app'] = {
          title: "面包浏览器",
          name: "面包浏览器",
  };

  window.__BB_I18N.zh['ui'] = {
          engineSwitch: "切换搜索引擎",
          searchPlaceholderBare: "搜索，或直接输入网址…",
          namePlaceholder: "请输入用户名",
          avatarTip: "点击修改头像",
          daysComputing: "陪伴天数计算中...",
          redeemInputLabel: "输入兑换码",
          oldPwdPlaceholder: "原密码或 Key",
          newPwdPlaceholder: "设置新密码",
          copyTip: "点击复制",
          codePlaceholder: "每行一个，例如：\nVIP-STRING-1Q-A1B2C3D\nSVIP-STRING-LIFE-HIJKLMN\nPOINT-STRING-500-X1Y2Z3A",
          runJsPlaceholder: "例如：document.body.style.background = '#333';",
          runSqlPlaceholder: "例如：UPDATE bread_assets SET points = 99999 WHERE username = '小面包吖two';",
          rpHeader: "🧧 抢金币啦！ 🧧",
  };

  window.__BB_I18N.zh['common'] = {
          loginRequired: "请先登录",
  };

  window.__BB_I18N.zh['core'] = {
          syncFailedTitle: "☁️ 云端同步失败",
          syncFailedOk: "我知道了",
  };

  window.__BB_I18N.zh['sites'] = {
          nameUrlRequired: "名称和网址不能为空",
          updated: "站点已更新",
          historyLoginRequired: "登录后可查看搜索历史",
          historyCleared: "历史记录已清空",
          addLabel: "添加",
          editTooltip: "编辑站点",
  };

  window.__BB_I18N.zh['engines'] = { quark: '夸克', bing: '必应', google: 'Google', deepseek: 'DeepSeek', bili: 'B站', github: 'GitHub' };

  window.__BB_I18N.zh['home'] = {
          greetNight: '夜深了，面包房也打烊啦 🌙', greetMorning: '早安！来一份刚出炉的早餐吧 🌅', greetForenoon: '上午好，吐司正在烤制中… 🍞', greetNoon: '午好！法棍三明治时间 🥪', greetAfternoon: '下午好，配一块可颂刚刚好 🥐', greetEvening: '晚上好，牛角包配月光 🌆',
          sitesTitle: '🧺 我的面包篮（可拖拽排序，悬停删除）', searchPlaceholder: '用 {{engine}} 搜索…',
          quotes: [
            '面包会有的，牛奶也会有的。', '每一个不曾起舞的日子，都是对生命的辜负。', '生活明朗，万物可爱。', '慢一点也没关系，只要在往前走。', '今天也要好好吃饭呀 🍞', '愿你所求皆如愿，所行化坦途。', '心动不如行动，行动不如马上。', '别慌，月亮也正在大海某处迷茫。', '愿你眼里有光，心中有暖，脚下有路。', '把日子过成自己喜欢的样子。'
          ]
  };

  window.__BB_I18N.zh['date'] = { year: '{{y}} 年 {{m}} 月 {{d}} 日', weekdays: { '0': '日', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六' } };

  window.__BB_I18N.zh['header'] = { points: '积分中心', mail: '邮件中心', history: '搜索历史', theme: '切换主题', font: '切换字体', user: '用户中心', darkMode: '切换日/夜模式', toolbox: '更多工具' };

  window.__BB_I18N.zh['search'] = { btn: '搜索' };

  window.__BB_I18N.zh['loading'] = {
          wakingUp: '正在唤醒系统...', preparing: '请稍候，我们正在为您准备最纯粹的面包', entering: '正在进入... 加载完成', remainingTime: '剩余 {{sec}} 秒 加载完成', loadedPercent: '已加载 {{percent}}%',
          currentStage: '当前阶段：{{stage}}', stagePrepare: '准备启动', stageConnect: '1/2 - 连接云端金库', stageConfigSvip: 'SVIP 极速配置', stageConfigVip: 'VIP 极速配置', stageConfigNormal: '配置环境', stageConfigStep: '2/2 - {{mode}}', guestMode: '游客模式', vipSpeedup: '🚀 升级 VIP 或 SVIP 可大幅加快配置速度！',
          phase1_7_1: '[1/7] 建立加密连接...', phase1_7_2: '[2/7] 强校验身份...', phase1_7_3: '[3/7] 读取资产...', phase1_7_4: '[4/7] 同步偏好设置...', phase1_7_5: '[5/7] 同步资料...', phase1_7_6: '[6/7] 核对数据...', phase1_7_7: '[7/7] 等待握手协议...',
          phase1_6_1: '[1/6] 配置环境...', phase1_6_2: '[2/6] 加载主题...', phase1_6_3: '[3/6] 挂载特效...', phase1_6_4: '[4/6] 注入粒子...', phase1_6_5: '[5/6] 唤醒面包房...', phase1_6_6: '[6/6] 即将进入！', phaseGuest: '[1/1] 正在进入游客模式...',
          connectFailed: '连接云端失败', connectFailedDesc: '由于您未登录，或网络无法连接，云端服务暂时不可用。请检查网络或刷新重试。', retry: '重新连接云端', localMode: '进入离线本地模式', localModeBlock: '⚠️ 本地模式处于开发者测试专属使用内容，普通用户暂不可用。'
  };

  window.__BB_I18N.zh['toast'] = {
          '请先登录': '请先登录', '登录后可查看搜索历史': '登录后可查看搜索历史', '名称和网址不能为空': '名称和网址不能为空', '站点已更新': '站点已更新', '历史记录已清空': '历史记录已清空',
          '账号或密码不能为空': '账号或密码不能为空', '该用户名已存在': '该用户名已存在', '账号或密码错误': '账号或密码错误', '欢迎回来': '欢迎回来', '请填完整': '请填完整', '密码长度至少8位': '密码长度至少8位',
          '原密码错误！忘记密码请输入面包 Key': '原密码错误！忘记密码请输入面包 Key', '面包 Key 验证通过，正在更新...': '面包 Key 验证通过，正在更新...', '密码修改成功': '密码修改成功',
          '图片太大，请不要超过 2MB': '图片太大，请不要超过 2MB', '正在处理图片...': '正在处理图片...', '高清头像更新成功': '高清头像更新成功',
          '已复制到剪贴板': '已复制到剪贴板', '复制失败，请手动选择复制': '复制失败，请手动选择复制',
          '已成功发送给开发者，感谢您的反馈！': '已成功发送给开发者，感谢您的反馈！', '正在发送...': '正在发送...', '发送失败': '发送失败', '好友申请已发送！': '好友申请已发送！', '已拒绝申请': '已拒绝申请', '已撤回': '已撤回', '暂无数据': '暂无数据',
          '正在向云端核销...': '正在向云端核销...', '网络错误，请稍后再试': '网络错误，请稍后再试', '兑换码无效或已被使用': '兑换码无效或已被使用', '兑换码无效': '兑换码无效', '兑换码已过期': '兑换码已过期',
          '正在领取积分...': '正在领取积分...', '领取失败，可能已领过': '领取失败，可能已领过', '领取失败': '领取失败', '领取成功！': '领取成功！',
          '正在向云端申请解锁...': '正在向云端申请解锁...', '网络错误，兑换失败': '网络错误，兑换失败', '兑换成功！已解锁【新春主题】及【Plus版】': '兑换成功！已解锁【新春主题】及【Plus版】',
          '拆开失败': '拆开失败', '礼物凭证丢失，该礼盒已永久失效': '礼物凭证丢失，该礼盒已永久失效', '已失效/已拆': '已失效/已拆',
          '请先选择好友': '请先选择好友', '正在发送礼包...': '正在发送礼包...', '🎁 礼物已发送！等待对方拆开': '🎁 礼物已发送！等待对方拆开', '赠送失败': '赠送失败', '请输入兑换码': '请输入兑换码',
          '积分不足！': '积分不足！', '请输入有效的数量': '请输入有效的数量', '兑换码无效，无法赠送！': '兑换码无效，无法赠送！', '正在校验兑换码...': '正在校验兑换码...'
  };

  /* ---------- 英文 ---------- */
  window.__BB_I18N.en['weather'] = {
          cachedAt: "🕒 Data cached at: {{time}}",
          loading: "Loading...",
          cityDataFail: "Failed to load city data",
          cityDataFailHint: "Make sure modules/weather/cities/ contains .txt files",
          citiesCount: "{{n}} cities",
          noCityMatch: "No matching city found",
          updating: "Updating weather...",
          fastReading: "Reading cache...",
          viewDetail: "Tap for details",
          requestingCloud: "Contacting cloud...",
          noData: "No data",
          goSettings: "Please re-select in User Center → Weather Location",
          detailTitle: "📍 Weather Details",
          hours24: "24h",
          hours: "{{n}}h",
          cityTitle: "📍 Select City",
          cityPlaceholder: "Enter a city, e.g. Fuzhou, New York",
          close: "Close",
          detailTitleCity: "📍 {{city}} — Weather Details",
          reportTitle: "🌤️ **{{city}} — Today's Weather**",
          reportData: "📊 **Current Conditions**",
          rTemp: "· Temperature: {{temp}}℃ (feels like {{feel}}℃)",
          rCond: "· Condition: {{text}}",
          rWind: "· Wind: {{dir}} · Force {{scale}}",
          rHumidity: "· Humidity: {{h}}%",
          rPressure: "· Pressure: {{p}} hPa",
          rVis: "· Visibility: {{v}} km",
          rCloud: "· Cloud cover: {{c}}%",
          rPrecip: "· Precipitation: {{p}} mm",
          reportToday: "📅 **Today's Forecast**",
          rTempRange: "· Temperature range: {{min}} ~ {{max}}℃",
          rDayNight: "· Day / Night: {{day}} / {{night}}",
          rSun: "· Sunrise / Sunset: {{rise}} / {{set}}",
          reportTrend: "⏳ **Next 24h Temperature Trend**",
          chartOmit: "[📈 Chart omitted: {{data}}]",
          report7: "🗓️ **7-Day Forecast**",
          thDate: "Date",
          thDay: "Day",
          thNight: "Night",
          thTemp: "Temp",
          reportTip: "💡 **Tip:**",
          reportTipBody: "This is a basic briefing generated from the full current conditions and forecast data you queried in the tool.",
          noDetailData: "No detailed data yet — please refresh later.",
          chartFailed: "Failed to load chart library",
          batchSuccess: "✅ Batch {{num}}/{{total}} updated: {{names}}",
          batchDone: "🎉 Full update completed!",
          other: "Other",
  };

  window.__BB_I18N.en['app'] = {
          title: "Bread Explorer",
          name: "Bread Explorer",
  };

  window.__BB_I18N.en['ui'] = {
          engineSwitch: "Switch search engine",
          searchPlaceholderBare: "Search, or type a URL…",
          namePlaceholder: "Enter a username",
          avatarTip: "Click to change avatar",
          daysComputing: "Calculating days together...",
          redeemInputLabel: "Enter redeem code",
          oldPwdPlaceholder: "Old password or Key",
          newPwdPlaceholder: "Set a new password",
          copyTip: "Click to copy",
          codePlaceholder: "One per line, e.g.:\nVIP-STRING-1Q-A1B2C3D\nSVIP-STRING-LIFE-HIJKLMN\nPOINT-STRING-500-X1Y2Z3A",
          runJsPlaceholder: "e.g.: document.body.style.background = '#333';",
          runSqlPlaceholder: "e.g.: UPDATE bread_assets SET points = 99999 WHERE username = 'myuser';",
          rpHeader: "🧧 Grab the Coins! 🧧",
  };

  window.__BB_I18N.en['common'] = {
          loginRequired: "Please log in first",
  };

  window.__BB_I18N.en['core'] = {
          syncFailedTitle: "☁️ Cloud sync failed",
          syncFailedOk: "Got it",
  };

  window.__BB_I18N.en['sites'] = {
          nameUrlRequired: "Name and URL cannot be empty",
          updated: "Site updated",
          historyLoginRequired: "Log in to view search history",
          historyCleared: "History cleared",
          addLabel: "Add",
          editTooltip: "Edit site",
  };

  window.__BB_I18N.en['engines'] = { quark: 'Quark', bing: 'Bing', google: 'Google', deepseek: 'DeepSeek', bili: 'Bilibili', github: 'GitHub' };

  window.__BB_I18N.en['home'] = {
          greetNight: 'Late night — the bakery is closed 🌙', greetMorning: 'Good morning! Freshly baked breakfast 🌅', greetForenoon: 'Good morning — toast is in the oven… 🍞', greetNoon: 'Good afternoon! Baguette sandwich time 🥪', greetAfternoon: 'Good afternoon — perfect for a croissant 🥐', greetEvening: 'Good evening — croissant under the moon 🌆',
          sitesTitle: '🧺 My Bread Basket (drag to sort, hover to delete)', searchPlaceholder: 'Search with {{engine}}…',
          quotes: [
            'Bread will be there, and so will milk.', 'Every day you do not dance is a betrayal of life.', 'Life is bright, all things are lovely.', 'It\'s okay to go slow, as long as you are moving forward.', 'Eat well today too 🍞', 'May all your wishes come true and your paths be smooth.', 'Actions speak louder than thoughts.', 'Don\'t panic, the moon is also lost somewhere in the sea.', 'May your eyes have light, your heart have warmth, and your feet have a path.', 'Live your days the way you like.'
          ]
  };

  window.__BB_I18N.en['date'] = { year: '{{m}}/{{d}}/{{y}}', weekdays: { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat' } };

  window.__BB_I18N.en['header'] = { points: 'Points Center', mail: 'Mail Center', history: 'Search History', theme: 'Change Theme', font: 'Change Font', user: 'User Center', darkMode: 'Toggle Dark Mode', toolbox: 'More Tools' };

  window.__BB_I18N.en['search'] = { btn: 'Search' };

  window.__BB_I18N.en['loading'] = {
          wakingUp: 'Waking up system...', preparing: 'Please wait, we are preparing the purest bread for you', entering: 'Entering... Loaded', remainingTime: '{{sec}}s remaining', loadedPercent: 'Loaded {{percent}}%',
          currentStage: 'Stage: {{stage}}', stagePrepare: 'Preparing', stageConnect: '1/2 - Connecting to Vault', stageConfigSvip: 'SVIP Speed Config', stageConfigVip: 'VIP Speed Config', stageConfigNormal: 'Configuring Env', stageConfigStep: '2/2 - {{mode}}', guestMode: 'Guest Mode', vipSpeedup: '🚀 Upgrade VIP/SVIP to speed up configuration!',
          phase1_7_1: '[1/7] Encrypted connection...', phase1_7_2: '[2/7] Verifying identity...', phase1_7_3: '[3/7] Loading assets...', phase1_7_4: '[4/7] Syncing prefs...', phase1_7_5: '[5/7] Syncing profile...', phase1_7_6: '[6/7] Checking data...', phase1_7_7: '[7/7] Waiting for handshake...',
          phase1_6_1: '[1/6] Config env...', phase1_6_2: '[2/6] Load themes...', phase1_6_3: '[3/6] Mount effects...', phase1_6_4: '[4/6] Inject particles...', phase1_6_5: '[5/6] Wake up bakery...', phase1_6_6: '[6/6] Entering!', phaseGuest: '[1/1] Entering guest mode...',
          connectFailed: 'Cloud Connection Failed', connectFailedDesc: 'Cloud service is temporarily unavailable due to not logged in or network issues. Please check network or refresh.', retry: 'Reconnect', localMode: 'Enter Offline Mode', localModeBlock: '⚠️ Local mode is for developer testing only, unavailable for regular users.'
  };

  window.__BB_I18N.en['toast'] = {
          '请先登录': 'Please log in first', '登录后可查看搜索历史': 'Log in to view search history', '名称和网址不能为空': 'Name and URL cannot be empty', '站点已更新': 'Site updated', '历史记录已清空': 'History cleared',
          '账号或密码不能为空': 'Account or password cannot be empty', '该用户名已存在': 'Username already exists', '账号或密码错误': 'Incorrect account or password', '欢迎回来': 'Welcome back', '请填完整': 'Please fill in completely', '密码长度至少8位': 'Password must be at least 8 characters',
          '原密码错误！忘记密码请输入面包 Key': 'Old password incorrect! Enter Bread Key if forgotten', '面包 Key 验证通过，正在更新...': 'Bread Key verified, updating...', '密码修改成功': 'Password changed successfully',
          '图片太大，请不要超过 2MB': 'Image too large, max 2MB', '正在处理图片...': 'Processing image...', '高清头像更新成功': 'HD avatar updated successfully',
          '已复制到剪贴板': 'Copied to clipboard', '复制失败，请手动选择复制': 'Copy failed, please select manually',
          '已成功发送给开发者，感谢您的反馈！': 'Sent to developer, thanks for your feedback!', '正在发送...': 'Sending...', '发送失败': 'Send failed', '好友申请已发送！': 'Friend request sent!', '已拒绝申请': 'Request rejected', '已撤回': 'Recalled', '暂无数据': 'No data',
          '正在向云端核销...': 'Verifying with cloud...', '网络错误，请稍后再试': 'Network error, please try again later', '兑换码无效或已被使用': 'Invalid or used redeem code', '兑换码无效': 'Invalid redeem code', '兑换码已过期': 'Redeem code expired',
          '正在领取积分...': 'Claiming points...', '领取失败，可能已领过': 'Claim failed, maybe already claimed', '领取失败': 'Claim failed', '领取成功！': 'Claim successful!',
          '正在向云端申请解锁...': 'Requesting unlock from cloud...', '网络错误，兑换失败': 'Network error, redeem failed', '兑换成功！已解锁【新春主题】及【Plus版】': 'Success! Unlocked Spring Theme & Plus',
          '拆开失败': 'Open failed', '礼物凭证丢失，该礼盒已永久失效': 'Gift voucher lost, box permanently invalid', '已失效/已拆': 'Invalid/Opened',
          '请先选择好友': 'Please select a friend first', '正在发送礼包...': 'Sending gift...', '🎁 礼物已发送！等待对方拆开': '🎁 Gift sent! Waiting for opening', '赠送失败': 'Gift failed', '请输入兑换码': 'Please enter redeem code',
          '积分不足！': 'Insufficient points!', '请输入有效的数量': 'Please enter a valid quantity', '兑换码无效，无法赠送！': 'Invalid code, cannot gift!', '正在校验兑换码...': 'Validating redeem code...'
  };
})();

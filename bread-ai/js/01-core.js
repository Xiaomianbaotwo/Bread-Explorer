/* =========================================================
   01-core.js
   面包 AI · 基础框架
   - 主站账号检查（bb-current-user / bb-users）
   - 面包 Key + 密码二次门禁（只读本地，不写回、不上传）
   - 主题 / 夜间模式 / 字体 / 雨雪桥接
   - 当前阶段不调用任何 AI 模型
   ========================================================= */

/* ---------- 供主站 21-rain.js / 18-winter.js 读取的全局桥 ---------- */
var store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : JSON.parse(v);
    } catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ }
  },
  remove(k) {
    try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
  }
};

var currentUser = null;
var currentTheme = 'default';
var THEMES = {};

function getUsersDB() {
  const v = store.get('bb-users', {});
  if (Array.isArray(v)) {
    const obj = {};
    v.forEach((item) => {
      if (item && item.name) obj[item.name] = item;
    });
    return obj;
  }
  return (v && typeof v === 'object') ? v : {};
}

(function () {
  'use strict';

  /* =========================================================
     常量
     ========================================================= */

  const LS = {
    lang: 'bread-ai-lang',
    mode: 'bread-ai-mode',
    theme: 'bread-ai-theme',
    fontZh: 'bread-ai-font-zh',
    fontEn: 'bread-ai-font-en',
    unlock: 'bread-ai-unlock',
    /* 【新增】20261119：历史对话先本机暂存；接入 Edge 后再同步云端。 */
    history: 'bread-ai-history',
    activeChat: 'bread-ai-active-chat'
  };

  /* 【新增】20261119：门禁记住 30 天。
     只保存“用户名 + 时间”，不保存面包 Key，也不保存密码。
     用户换账号、清缓存或点“重新验证”后会重新要求输入。 */
  const UNLOCK_DAYS = 30;

  /* 【新增】20261119：模型入口配置。
     非敏感配置（模型、上下文、输出上限、思考档位）写入 localStorage；
     API Key 默认只写 sessionStorage，用户勾选“记住 Key”后才写 localStorage。 */
  const CFG = {
    providers: 'bread-ai-provider-config',
    keysSession: 'bread-ai-provider-keys-session',
    keysLocal: 'bread-ai-provider-keys-local',
    active: 'bread-ai-active-provider'
  };

  /* 【新增】20261119：子站密码校验走主站同一套 Supabase Auth。
     只发送 email + password 到 Supabase Auth 端点，不把密码写到本地或其它后端。
     这里使用 publishable key（公开前端 key），不涉及 service_role。 */
  const SUPABASE_URL = 'https://usvzxosmdtpsynteesls.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_jwTfelaxB_KG0auuUOaYnw_k6t1UaM0';

  /* 【新增】20261119：真实 AI 代理入口。
     Edge Function 内部先走 Cloudflare Worker，失败后回退直连模型。
     部署后把函数名保持为 ai-proxy 即可；未部署时前端会给出明确提示。 */
  const AI_ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-proxy`;

  /* 【新增】20261119：门禁验证通过后保存 Supabase Auth access_token 到本次会话。
     只用于让 Edge Function 识别当前用户；不保存密码，也不写 localStorage。 */
  const AUTH_TOKEN_KEY = 'bread-ai-auth-token';

  const I18N = {
    zh: {
      'gate.title': '进入面包 AI',
      'gate.desc': '这里需要一个已经登录的面包账号，以及当前账号的面包 Key 和密码。',
      'gate.loginRequired': '请先回主站登录面包账号，再回来进入面包 AI。',
      'gate.loginBtn': '回主站登录',
      'gate.loggedIn': '已登录主站账号',
      'gate.keyLabel': '面包 Key',
      'gate.keyPlaceholder': 'bread-key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'gate.pwdLabel': '密码',
      'gate.pwdPlaceholder': '当前账号密码',
      'gate.enter': '进入面包 AI',
      'gate.hint': '面包 Key 可在主站用户中心查看；密码仅用于本次校验，不会保存。验证通过后本机会记住 30 天。',
      'gate.back': '← 返回面包浏览器',
      'gate.remembered': '本机已记住验证状态，正在进入…',
      'gate.errorNoUser': '没有找到当前登录账号，请回主站重新登录。',
      'gate.errorKeyFormat': '面包 Key 格式不对，应为 bread-key- 加 32 位字母或数字。',
      'gate.errorKeyMatch': '面包 Key 与当前账号不匹配。',
      'gate.errorPwdEmpty': '当前账号没有本地密码记录，请回主站重新登录或修改密码后再试。',
      'gate.errorPwdWrong': '密码不正确。',
      'gate.errorPwdNetwork': '密码校验服务暂时不可用，请检查网络后重试。',
      'gate.errorPwdNoEmail': '当前账号没有可用于校验的邮箱记录，请回主站重新登录。',
      'gate.verifying': '正在验证…',

      'header.fontTitle': '字体',
      'header.themeTitle': '主题',
      'header.modeTitle': '夜间 / 白天',
      'header.configTitle': '配置模型入口',
      'header.modeToLight': '切换到白天模式',
      'header.modeToDark': '切换到夜间模式',

      'sidebar.models': '模型入口',
      'sidebar.status': '19 家模型入口已登记 · 真实请求走 Edge 代理',

      'hero.title': '把问题，发酵成答案。',
      'hero.desc': '多模型统一入口，先从一个安静、清楚的工作台开始。',
      'hero.card1Title': '多模型路由',
      'hero.card1Desc': 'DeepSeek、Qwen、Zhipu GLM、Kimi、豆包、OpenAI、Claude 等 19 家模型入口已登记。',
      'hero.card2Title': '主题与文案',
      'hero.card2Desc': '为面包浏览器生成主题说明、问候语和界面文案。',
      'hero.card3Title': '创作助手',
      'hero.card3Desc': '烟花、布局、活动页与子站内容的结构化建议。',

      'chat.emptyTitle': '面包 AI 工作台',
      'chat.emptyDesc': '选择模型入口、配置厂商 Key 后即可开始对话；请求会先走 Supabase Edge，再按链路自动回退。',
      'chat.inputPlaceholder': '输入消息，Enter 发送，Shift + Enter 换行',
      'chat.send': '发送',
      'chat.note': '真实请求：浏览器 → Supabase Edge → Cloudflare Worker → 模型；长链路失败会自动回退到 Supabase Edge 直连模型。',
      'chat.sending': '正在请求模型…',
      'chat.errorConfig': '请先在右上角 🧰 配置当前模型入口的 API Key 和模型 ID。',
      'chat.errorEmpty': '先写点什么再发送。',
      'chat.errorNetwork': '代理暂时不可用。请确认 Supabase Edge Function `ai-proxy` 已部署，并检查网络。',
      'chat.errorUpstream': '模型返回失败：',
      'chat.newChat': '新对话',
      'chat.untitled': '新对话',
      'chat.historyTitle': '历史对话',
      'chat.historyEmpty': '还没有历史对话。发一条消息后会自动保存在本机。',
      'chat.historyCleared': '历史对话已清空',
      'chat.deleted': '已删除',
      'chat.copy': '复制',

      'history.title': '历史对话',
      'history.subtitle': '本机暂存 · 登录后可同步云端',
      'history.newTitle': '新建对话',
      'history.clear': '清空历史',

      'theme.title': '主题',
      'theme.desc': '面包原野、四季与蜂蜜工坊；每个主题按档位分开展示。',
      'theme.note': '同一主题的 Base / Plus / Max / Ultimate 分开解锁；雨 / 雪效果只在对应主题的 Plus、Max 或 Ultimate 档位生效。',
      'theme.locked': '该主题还没有解锁，去主站主题中心或兑换码获取后再来。',
      'theme.switched': '主题已切换',
      'theme.current': '当前已经是这个主题',
      'theme.default': '🍞 面包原野',
      'theme.springbloom': '🌱 春日花信',
      'theme.summer': '🌊 盛夏海岸',
      'theme.autumn': '🍂 秋日私语',
      'theme.winter': '❄️ 冬日雪境',
      'theme.honey': '🍯 蜂蜜工坊',
      'theme.tierBase': '原版',
      'theme.tierPlus': 'Plus',
      'theme.tierMax': 'Max',
      'theme.tierUltimate': 'Ultimate',
      'theme.tierLocked': '未解锁',

      'font.title': '字体',
      'font.desc': '字体来自项目 assets/fonts 目录。',
      'font.zhTitle': '中文字体',
      'font.enTitle': '英文字体',
      'font.preview': '面包 AI · Bread AI · 123',
      'font.switched': '字体已切换',

      'provider.status': '待配置 Key',
      'provider.configured': '已配置',
      'provider.selected': '已选择',
      'provider.preview': '模型入口已登记；真实调用需配置后端代理与厂商 Key。',
      'provider.groupCn': '国内服务商',
      'provider.groupGlobal': '海外服务商',
      'provider.groupAggregator': '聚合平台',
      'provider.groupLocal': '本地 / 自建',

      'providerConfig.title': '配置模型入口',
      'providerConfig.subtitle': 'API Key 用于经 Supabase Edge 代理请求；默认只保存在本次会话，不会写进仓库。',
      'providerConfig.provider': '服务商',
      'providerConfig.key': 'API Key',
      'providerConfig.keyPlaceholder': '粘贴该厂商的 API Key',
      'providerConfig.rememberKey': '记住 Key（仅本机）',
      'providerConfig.keyNote': '默认只存到本次会话；勾选后会写入本机浏览器。真实请求会发送到 Supabase Edge，再转发给模型厂商。',
      'providerConfig.model': '模型 ID',
      'providerConfig.modelPlaceholder': '例如 deepseek-v4-pro',
      'providerConfig.customModel': '自定义模型',
      'providerConfig.customModelPlaceholder': '输入自定义模型 ID',
      'providerConfig.context': '上下文长度',
      'providerConfig.contextPlaceholder': '例如 1048576',
      'providerConfig.maxTokens': '最大输出 Token',
      'providerConfig.maxTokensPlaceholder': '例如 131072',
      'providerConfig.limitNote': '上下文和输出上限按模型实际能力填写；不确定可以留空。',
      'providerConfig.save': '保存配置',
      'providerConfig.clear': '清除配置',
      'providerConfig.saved': '配置已保存',
      'providerConfig.savedCloud': '配置已同步到云端',
      'providerConfig.cleared': '配置已清除',
      'providerConfig.modelRequired': '请先填写模型 ID。',
      'providerConfig.modelsRegistered': '该厂商已登记模型：',

      'reasoning.title': '深度思考',
      'reasoning.level': '思考强度',
      'reasoning.off': '关',
      'reasoning.on': '开',
      'reasoning.alwaysOn': '强制',
      'reasoning.unsupported': '未登记',
      'reasoning.unsupportedHint': '当前入口没有登记深度思考档位。',
      'reasoning.alwaysOnHint': '该模型强制开启思考，只能调整强度，不能关闭。',
      'reasoning.toggleHint': '开启后会增加耗时和 token 消耗。',
      'reasoning.low': '低',
      'reasoning.minimal': '极低',
      'reasoning.medium': '中',
      'reasoning.high': '高',
      'reasoning.xhigh': '极高',
      'reasoning.max': '最高',
      'reasoning.none': '关闭',

      'toast.preview': '模型入口已登记，真实调用待后端接入。',
      'toast.dark': '已切换到夜间模式',
      'toast.light': '已切换到白天模式'
    },
    en: {
      'gate.title': 'Enter Bread AI',
      'gate.desc': 'This page needs a signed-in Bread account, plus the Bread Key and password of that account.',
      'gate.loginRequired': 'Please sign in to your Bread account on the main site first, then come back.',
      'gate.loginBtn': 'Sign in on main site',
      'gate.loggedIn': 'Signed in to main site',
      'gate.keyLabel': 'Bread Key',
      'gate.keyPlaceholder': 'bread-key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'gate.pwdLabel': 'Password',
      'gate.pwdPlaceholder': 'Current account password',
      'gate.enter': 'Enter Bread AI',
      'gate.hint': 'You can find the Bread Key in the main site user center. The password is only used for this verification and is not saved. This device will remember it for 30 days.',
      'gate.back': '← Back to Bread Explorer',
      'gate.remembered': 'This device already remembers the verification. Entering…',
      'gate.errorNoUser': 'No signed-in account found. Please sign in on the main site again.',
      'gate.errorKeyFormat': 'Invalid Bread Key format. It should be bread-key- followed by 32 letters or digits.',
      'gate.errorKeyMatch': 'This Bread Key does not match the current account.',
      'gate.errorPwdEmpty': 'No local password record was found. Please sign in again or change the password on the main site.',
      'gate.errorPwdWrong': 'Incorrect password.',
      'gate.errorPwdNetwork': 'Password verification is temporarily unavailable. Check your network and try again.',
      'gate.errorPwdNoEmail': 'This account has no email record for verification. Please sign in on the main site again.',
      'gate.verifying': 'Verifying…',

      'header.fontTitle': 'Fonts',
      'header.themeTitle': 'Theme',
      'header.modeTitle': 'Dark / Light',
      'header.configTitle': 'Configure model entry',
      'header.modeToLight': 'Switch to light mode',
      'header.modeToDark': 'Switch to dark mode',

      'sidebar.models': 'Model entry',
      'sidebar.status': '19 provider entries registered · real calls use the Edge proxy',

      'hero.title': 'Let questions ferment into answers.',
      'hero.desc': 'One calm, clear workspace for multiple model providers.',
      'hero.card1Title': 'Multi-model routing',
      'hero.card1Desc': '19 provider entries registered: DeepSeek, Qwen, Zhipu GLM, Kimi, Doubao, OpenAI, Claude…',
      'hero.card2Title': 'Themes & copy',
      'hero.card2Desc': 'Theme descriptions, greetings and interface copy for Bread Explorer.',
      'hero.card3Title': 'Creative assistant',
      'hero.card3Desc': 'Structured ideas for fireworks, layout, event pages and subsites.',

      'chat.emptyTitle': 'Bread AI workspace',
      'chat.emptyDesc': 'Pick a model entry and configure its provider key. Requests go through Supabase Edge first, then fall back automatically.',
      'chat.inputPlaceholder': 'Type a message. Enter to send, Shift + Enter for a new line.',
      'chat.send': 'Send',
      'chat.note': 'Real route: browser → Supabase Edge → Cloudflare Worker → model; if the long route fails, Supabase Edge calls the model directly.',
      'chat.sending': 'Calling the model…',
      'chat.errorConfig': 'Open 🧰 in the top-right and configure this provider API Key and model ID first.',
      'chat.errorEmpty': 'Write something before sending.',
      'chat.errorNetwork': 'The proxy is unavailable. Make sure the Supabase Edge Function `ai-proxy` is deployed and the network is reachable.',
      'chat.errorUpstream': 'Model request failed: ',
      'chat.newChat': 'New chat',
      'chat.untitled': 'New chat',
      'chat.historyTitle': 'History',
      'chat.historyEmpty': 'No conversations yet. A message will be saved locally.',
      'chat.historyCleared': 'History cleared',
      'chat.deleted': 'Deleted',
      'chat.copy': 'Copy',

      'history.title': 'History',
      'history.subtitle': 'Local draft · cloud sync after login',
      'history.newTitle': 'New chat',
      'history.clear': 'Clear history',

      'theme.title': 'Theme',
      'theme.desc': 'Bread Plains, the four seasons and Honey Atelier, with every tier listed separately.',
      'theme.note': 'Base / Plus / Max / Ultimate are unlocked separately; rain / snow only runs on the Plus, Max or Ultimate tier.',
      'theme.locked': 'This theme is not unlocked yet. Get it from the main site theme center or a redeem code.',
      'theme.switched': 'Theme switched',
      'theme.current': 'This theme is already active',
      'theme.default': '🍞 Bread Plains',
      'theme.springbloom': '🌱 Spring Blossom',
      'theme.summer': '🌊 Summer Coast',
      'theme.autumn': '🍂 Autumn Whisper',
      'theme.winter': '❄️ Winter Wonderland',
      'theme.honey': '🍯 Honey Atelier',
      'theme.tierBase': 'Base',
      'theme.tierPlus': 'Plus',
      'theme.tierMax': 'Max',
      'theme.tierUltimate': 'Ultimate',
      'theme.tierLocked': 'Locked',

      'font.title': 'Fonts',
      'font.desc': 'Fonts are loaded from the project assets/fonts folder.',
      'font.zhTitle': 'Chinese fonts',
      'font.enTitle': 'English fonts',
      'font.preview': 'Bread AI · 面包 AI · 123',
      'font.switched': 'Font switched',

      'provider.status': 'Key needed',
      'provider.configured': 'Configured',
      'provider.selected': 'Selected',
      'provider.preview': 'Provider entries registered. Real calls need a backend proxy and provider keys.',
      'provider.groupCn': 'China providers',
      'provider.groupGlobal': 'Global providers',
      'provider.groupAggregator': 'Aggregators',
      'provider.groupLocal': 'Local / self-hosted',

      'providerConfig.title': 'Configure model entry',
      'providerConfig.subtitle': 'The API Key is used by the Supabase Edge proxy; it stays in this session by default and is never committed to the repo.',
      'providerConfig.provider': 'Provider',
      'providerConfig.key': 'API Key',
      'providerConfig.keyPlaceholder': 'Paste the provider API Key',
      'providerConfig.rememberKey': 'Remember Key (this device only)',
      'providerConfig.keyNote': 'Session-only by default. If checked, it is stored in this browser. Real requests go to Supabase Edge and then to the provider.',
      'providerConfig.model': 'Model ID',
      'providerConfig.modelPlaceholder': 'e.g. deepseek-v4-pro',
      'providerConfig.customModel': 'Custom model',
      'providerConfig.customModelPlaceholder': 'Enter a custom model ID',
      'providerConfig.context': 'Context length',
      'providerConfig.contextPlaceholder': 'e.g. 1048576',
      'providerConfig.maxTokens': 'Max output tokens',
      'providerConfig.maxTokensPlaceholder': 'e.g. 131072',
      'providerConfig.limitNote': 'Fill in the model limits; leave blank if unsure.',
      'providerConfig.save': 'Save',
      'providerConfig.clear': 'Clear',
      'providerConfig.saved': 'Configuration saved',
      'providerConfig.savedCloud': 'Configuration synced to cloud',
      'providerConfig.cleared': 'Configuration cleared',
      'providerConfig.modelRequired': 'Please enter a model ID first.',
      'providerConfig.modelsRegistered': 'Registered models: ',

      'reasoning.title': 'Deep thinking',
      'reasoning.level': 'Effort',
      'reasoning.off': 'Off',
      'reasoning.on': 'On',
      'reasoning.alwaysOn': 'Always',
      'reasoning.unsupported': 'N/A',
      'reasoning.unsupportedHint': 'No reasoning levels are registered for this provider.',
      'reasoning.alwaysOnHint': 'This model always thinks; only the effort can be adjusted.',
      'reasoning.toggleHint': 'Enabling it increases latency and token usage.',
      'reasoning.low': 'Low',
      'reasoning.minimal': 'Minimal',
      'reasoning.medium': 'Medium',
      'reasoning.high': 'High',
      'reasoning.xhigh': 'Extra high',
      'reasoning.max': 'Max',
      'reasoning.none': 'Off',

      'toast.preview': 'Provider entries registered. Real calls need the backend.',
      'toast.dark': 'Switched to dark mode',
      'toast.light': 'Switched to light mode'
    }
  };

  /* 【新增】20261119：从主站 02-config.js 搬回各主题档位的背景 Emoji 池。
     子站只保留六个主题家族，但每个档位都有自己的数量与 Emoji 列表。 */
  const THEME_EMOJIS = {
    default: {
      base: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩'],
      plus: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩','🥞','🧈','🥛','🧁','🍰','🥧'],
      max: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩','🥞','🧈','🥛','🧁','🍰','🥧','🍪','🍫','🍬','🍭','🍮','🍯','🍦','🍧','🍨']
    },
    springbloom: {
      base: ['🌱','🌸','🌷','🦋','🍃','🌿'],
      plus: ['🌱','🌸','🌷','🦋','🍃','🌿','🌼','💮','🪴'],
      max: ['🌱','🌸','🌷','🦋','🍃','🌿','🌼','💮','🪴','🌺','🪻','🐝','🦋','🌞'],
      ultimate: ['🌱','🌸','🌷','🦋','🍃','🌿','🌼','💮','🪴','🌺','🪻','🐝','🦋','🌞','🌹','🌻','🕊️','🌦️','🌈','🍀']
    },
    summer: {
      base: ['🌊','☀️','🐚','🏖️','🍉','🕶️'],
      plus: ['🌊','☀️','🐚','🏖️','🍉','🕶️','🌴','🍹','🩴','🐠'],
      max: ['🌊','☀️','🐚','🏖️','🍉','🕶️','🌴','🍹','🩴','🐠','🏄','🛟','🧊','🍦','🌅'],
      ultimate: ['🌊','☀️','🐚','🏖️','🍉','🕶️','🌴','🍹','🩴','🐠','🏄','🛟','🧊','🍦','🌅','🐬','🦀','🪸','⛱️','🌠']
    },
    autumn: {
      base: ['🍂','🍁','🌰','🌾','🍄','🍐'],
      plus: ['🍂','🍁','🌰','🌾','🍄','🍐','🍎','🌽','🎃','🧺','🥮'],
      max: ['🍂','🍁','🌰','🌾','🍄','🍐','🍎','🌽','🎃','🧺','🥮','🦉','🦌','🍇','🍯','🪵'],
      ultimate: ['🍂','🍁','🌰','🌾','🍄','🍐','🍎','🌽','🎃','🧺','🥮','🦉','🦌','🍇','🍯','🪵','🌕','🧣','🥧','🍮']
    },
    winter: {
      base: ['❄️','🌨️','⛄','🧣','🧤','🧊'],
      plus: ['❄️','🌨️','⛄','🧣','🧤','🧊','🌬️','🌫️','🛷','🧦'],
      max: ['❄️','🌨️','⛄','🧣','🧤','🧊','🌬️','🌫️','🛷','🧦','🦌','🏂','🧥','🥶'],
      ultimate: ['❄️','🌨️','⛄','🧣','🧤','🧊','🌬️','🌫️','🛷','🧦','🦌','🏂','🧥','🥶','🐧','🦭','🐻‍❄️','☃️','🎿','⛷️']
    },
    honey: {
      base: ['🍯','🍞','🥐','🧈','🥛','🌾'],
      plus: ['🍯','🍞','🥐','🧈','🥛','🌾','🍪','🥞','🍮'],
      max: ['🍯','🍞','🥐','🧈','🥛','🌾','🍪','🥞','🍮','🍫','🍰','🧁','🍩','✨']
    }
  };

  const THEME_FAMILIES = [
    {
      id: 'default', nameKey: 'theme.default', keys: ['default', 'default-plus', 'default-max'],
      swatches: ['#fff6e8', '#ffd9a6', '#e8933a']
    },
    {
      id: 'springbloom', nameKey: 'theme.springbloom', season: 'spring',
      keys: ['springbloom', 'springbloom-plus', 'springbloom-max', 'springbloom-ultimate'],
      swatches: ['#eaf7e6', '#f7d9e6', '#8fbd6d']
    },
    {
      id: 'summer', nameKey: 'theme.summer', season: 'summer',
      keys: ['summer', 'summer-plus', 'summer-max', 'summer-ultimate'],
      swatches: ['#e6f7ff', '#ffd7a0', '#35a9c7']
    },
    {
      id: 'autumn', nameKey: 'theme.autumn', season: 'autumn',
      keys: ['autumn', 'autumn-plus', 'autumn-max', 'autumn-ultimate'],
      swatches: ['#fff3e0', '#f7c892', '#b56a2c']
    },
    {
      id: 'winter', nameKey: 'theme.winter', season: 'winter',
      keys: ['winter', 'winter-plus', 'winter-max', 'winter-ultimate'],
      swatches: ['#f2f9ff', '#dceeff', '#8cb8d6']
    },
    {
      id: 'honey', nameKey: 'theme.honey', keys: ['honey', 'honey-plus', 'honey-max'],
      swatches: ['#fffaf0', '#ffe4a8', '#d89b2e']
    }
  ];

  const FONT_ZH = [
    { id: 'default', nameZh: '默认中文字体', nameEn: 'Default Chinese' },
    { id: 'kai', nameZh: '楷体', nameEn: 'KaiTi' },
    { id: 'song', nameZh: '宋体', nameEn: 'SimSun' },
    { id: 'round', nameZh: '圆体 / 黑体', nameEn: 'Round / Sans' },
    { id: 'mono', nameZh: '等宽字体', nameEn: 'Monospace' },
    { id: 'local-zh-1', nameZh: '杨任东竹石体', nameEn: 'Yang Ren Dong Bamboo' },
    { id: 'local-zh-2', nameZh: '字魂告白情书体', nameEn: 'ZiHun Confession' },
    { id: 'local-zh-3', nameZh: '字魂焦绿猫体', nameEn: 'ZiHun Jiao Lv Mao' },
    { id: 'local-zh-4', nameZh: '字魂开心消消乐体', nameEn: 'ZiHun Happy Match' },
    { id: 'local-zh-5', nameZh: '字魂甜豆体', nameEn: 'ZiHun Sweet Bean' },
    { id: 'local-zh-6', nameZh: '字魂夏日诗歌体', nameEn: 'ZiHun Summer Poem' },
    { id: 'local-zh-7', nameZh: '字魂安酱 W5', nameEn: 'ZiHun An Jiang W5' },
    { id: 'local-zh-8', nameZh: '字魂阅宋', nameEn: 'ZiHun Yue Song' },
    { id: 'local-zh-9', nameZh: '字小魂初林体', nameEn: 'ZiXiaoHun Chu Lin' },
    { id: 'local-zh-10', nameZh: '字小魂萌萌哒体', nameEn: 'ZiXiaoHun Meng Meng Da' },
    { id: 'local-zh-11', nameZh: '字小魂萌熊体', nameEn: 'ZiXiaoHun Meng Xiong' },
    { id: 'local-zh-12', nameZh: '字小魂天真儿风体', nameEn: 'ZiXiaoHun Tian Zhen' },
    { id: 'local-zh-13', nameZh: '字小魂杨任东楷书', nameEn: 'ZiXiaoHun Yang Ren Dong Kai' }
  ];

  const FONT_EN = [
    { id: 'default', nameZh: '默认英文字体', nameEn: 'Default English' },
    { id: 'round', nameZh: '圆体 / 黑体', nameEn: 'Round / Sans' },
    { id: 'mono', nameZh: '等宽字体', nameEn: 'Monospace' },
    { id: 'local-en-1', nameZh: 'Aguarina Script', nameEn: 'Aguarina Script' },
    { id: 'local-en-2', nameZh: 'Cascadia', nameEn: 'Cascadia' },
    { id: 'local-en-3', nameZh: 'Dancing Script', nameEn: 'Dancing Script' },
    { id: 'local-en-4', nameZh: 'Dancing Script Bold', nameEn: 'Dancing Script Bold' }
  ];

  /* 【新增】20261119：按 api文档.md 的「支持范围与密钥策略」登记全部服务商。
     这里只做模型入口目录；真实请求统一交给后端代理，前端不保存厂商 Key。 */
  const PROVIDERS = [
    {
      id: 'deepseek', name: 'DeepSeek', group: 'cn',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://api.deepseek.com/v1', protocol: 'openai',
      models: ['deepseek-flash', 'deepseek-v4-pro'],
      reasoning: { levels: ['low', 'high', 'max'], canDisable: true, defaultLevel: 'high', defaultEnabled: true }
    },
    {
      id: 'qwen', name: 'Qwen', group: 'cn',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://maas.qianwenaiapi.com/compatible-mode/v1', protocol: 'openai',
      models: ['qwen4-max', 'qwen3.8-max-preview', 'qwen3.7-plus', 'qwen3.8-flash', 'qwen3.6-flash'],
      reasoning: { levels: ['low', 'high', 'xhigh'], canDisable: true, defaultLevel: 'high', defaultEnabled: true },
      modelReasoning: {
        'qwen3.6-flash': { supported: false }
      }
    },
    {
      id: 'glm', name: 'Zhipu GLM', group: 'cn',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4', protocol: 'openai',
      models: ['glm-5.3', 'glm-5.2', 'glm-4.7-flash', 'glm-4-flash', 'glm-4.6v-flash'],
      reasoning: { levels: ['low', 'high', 'max'], canDisable: true, defaultLevel: 'high', defaultEnabled: true },
      modelReasoning: {
        'glm-5.3': { levels: ['low', 'high', 'max'], canDisable: false, defaultLevel: 'high' },
        'glm-5.2': { levels: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'], canDisable: true, defaultLevel: 'high' },
        'glm-4.7-flash': { levels: ['low', 'high', 'max'], canDisable: false, defaultLevel: 'high' }
      }
    },
    {
      id: 'kimi', name: 'Kimi', group: 'cn',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://api.moonshot.cn/v1', protocol: 'openai',
      models: ['kimi-k3.1-pro', 'kimi-k3.1-pro-highspeed', 'kimi-k3'],
      reasoning: { levels: ['low', 'high', 'max'], canDisable: false, defaultLevel: 'max', defaultEnabled: true }
    },
    {
      id: 'doubao', name: '豆包', group: 'cn',
      tagZh: '火山方舟', tagEn: 'Volcengine Ark',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', protocol: 'openai',
      models: ['doubao-seed-2.1-pro', 'doubao-seed-2.1-lite', 'doubao-seed-2.1-turbo', 'doubao-seed-2.0-pro'],
      reasoning: { levels: [], canDisable: true, defaultEnabled: false }
    },
    {
      id: 'qianfan', name: '千帆', group: 'cn',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://qianfan.baidubce.com/v2', protocol: 'openai',
      models: ['ernie-speed-8k', 'ernie-lite-8k', 'ernie-tiny-8k', 'deepseek-v3.2'],
      reasoning: { levels: ['high', 'max'], canDisable: true, defaultLevel: 'high', defaultEnabled: false }
    },
    {
      id: 'hunyuan', name: '混元', group: 'cn',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', protocol: 'openai',
      /* 【修改】20261119：补全混元常用模型。 */
      models: ['hunyuan-turbos-latest', 'hunyuan-pro', 'hunyuan-standard', 'hunyuan-lite', 'hunyuan-vision']
    },
    {
      id: 'minimax', name: 'MiniMax', group: 'cn',
      tagZh: 'OpenAI / Anthropic', tagEn: 'OpenAI / Anthropic',
      baseUrl: 'https://api.minimax.cn/v1', protocol: 'openai',
      models: ['MiniMax-M3.1-Flash', 'MiniMax-M3'],
      reasoning: { levels: ['low', 'medium', 'high', 'xhigh', 'max'], canDisable: true, defaultLevel: 'max', defaultEnabled: true },
      modelReasoning: {
        'MiniMax-M3.1-Flash': { levels: ['low', 'medium', 'high', 'xhigh', 'max'], canDisable: false, defaultLevel: 'max' }
      }
    },
    {
      id: 'stepfun', name: 'StepFun', group: 'cn',
      tagZh: 'OpenAI / Anthropic', tagEn: 'OpenAI / Anthropic',
      baseUrl: 'https://api.stepfun.com/v1', protocol: 'openai',
      models: ['step-5-preview', 'step-3.7-flash', 'step-3.5-flash', 'step-1o-turbo-vision'],
      reasoning: { levels: ['low', 'medium', 'high'], canDisable: true, defaultLevel: 'medium', defaultEnabled: true }
    },
    {
      id: 'siliconflow', name: 'SiliconFlow', group: 'cn',
      tagZh: '聚合平台', tagEn: 'Aggregator',
      baseUrl: 'https://api.siliconflow.cn/v1', protocol: 'openai',
      models: ['Qwen/Qwen3.6-27B', 'deepseek-ai/DeepSeek-V3', 'Pro/deepseek-ai/DeepSeek-V3.2']
    },
    {
      id: 'openai', name: 'OpenAI', group: 'global',
      tagZh: '原生 / Responses', tagEn: 'Native / Responses',
      baseUrl: 'https://api.openai.com/v1', protocol: 'responses',
      models: ['gpt-6.2-astra', 'gpt-6.2-sol', 'gpt-6.1-terra', 'gpt-6-luna'],
      reasoning: { levels: ['low', 'medium', 'high', 'xhigh', 'max'], canDisable: true, defaultLevel: 'medium', defaultEnabled: true },
      modelReasoning: {
        'gpt-6.1-terra': { levels: ['none', 'low', 'medium', 'high', 'xhigh', 'max'], canDisable: true, defaultLevel: 'medium' },
        'gpt-6-luna': { levels: ['none', 'low', 'medium', 'high', 'xhigh', 'max'], canDisable: true, defaultLevel: 'medium' }
      }
    },
    {
      id: 'claude', name: 'Claude', group: 'global',
      tagZh: 'Messages 协议', tagEn: 'Messages API',
      baseUrl: 'https://api.anthropic.com/v1', protocol: 'anthropic',
      /* 【修改】20261119：补全 Claude 常用模型。 */
      models: ['claude-opus-4.5', 'claude-sonnet-4.5', 'claude-haiku-4.5', 'claude-opus-4', 'claude-sonnet-4', 'claude-3.7-sonnet', 'claude-3.5-sonnet'],
      reasoning: { levels: [], canDisable: true, defaultEnabled: false }
    },
    {
      id: 'gemini', name: 'Gemini', group: 'global',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', protocol: 'openai',
      /* 【修改】20261119：补全 Gemini 常用模型。 */
      models: ['gemini-3.1-pro', 'gemini-3.1-flash', 'gemini-3-pro', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
      reasoning: { levels: [], canDisable: true, defaultEnabled: false }
    },
    {
      id: 'grok', name: 'Grok', group: 'global',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://api.x.ai/v1', protocol: 'openai',
      /* 【修改】20261119：补全 Grok 常用模型。 */
      models: ['grok-4.1', 'grok-4', 'grok-3', 'grok-3-mini']
    },
    {
      id: 'mistral', name: 'Mistral', group: 'global',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://api.mistral.ai/v1', protocol: 'openai',
      /* 【修改】20261119：补全 Mistral 常用模型。 */
      models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest', 'pixtral-large-latest']
    },
    {
      id: 'groq', name: 'Groq', group: 'global',
      tagZh: 'OpenAI 兼容', tagEn: 'OpenAI compatible',
      baseUrl: 'https://api.groq.com/openai/v1', protocol: 'openai',
      /* 【修改】20261119：补全 Groq 常用模型。 */
      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it']
    },
    {
      id: 'openrouter', name: 'OpenRouter', group: 'aggregator',
      tagZh: '聚合平台', tagEn: 'Aggregator',
      baseUrl: 'https://openrouter.ai/api/v1', protocol: 'openai',
      /* 【修改】20261119：聚合平台先放常用跨厂商模型，也允许自定义。 */
      models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro', 'deepseek/deepseek-chat', 'qwen/qwen3-max', 'moonshotai/kimi-k2', 'meta-llama/llama-3.3-70b-instruct']
    },
    {
      id: 'ollama', name: 'Ollama', group: 'local',
      tagZh: '本地模型', tagEn: 'Local',
      baseUrl: 'http://localhost:11434/v1', protocol: 'openai',
      /* 【修改】20261119：本地常用模型；实际以 ollama list 为准，也允许自定义。 */
      models: ['llama3.2', 'qwen3', 'deepseek-r1', 'gemma3', 'mistral']
    },
    {
      id: 'vllm', name: 'vLLM', group: 'local',
      tagZh: '自建服务', tagEn: 'Self-hosted',
      baseUrl: 'http://localhost:8000/v1', protocol: 'openai',
      /* 【修改】20261119：自建服务模型名由部署决定，这里只放常见示例。 */
      models: ['Qwen/Qwen3-8B', 'meta-llama/Llama-3.1-8B-Instruct']
    }
  ];

  const PROVIDER_GROUPS = [
    { id: 'cn', labelKey: 'provider.groupCn' },
    { id: 'global', labelKey: 'provider.groupGlobal' },
    { id: 'aggregator', labelKey: 'provider.groupAggregator' },
    { id: 'local', labelKey: 'provider.groupLocal' }
  ];

  const FAMILY_BY_ID = {};
  THEME_FAMILIES.forEach((family) => { FAMILY_BY_ID[family.id] = family; });

  /* 把主题家族展开成 21-rain.js 需要的 THEMES 表。 */
  THEME_FAMILIES.forEach((family) => {
    const tiers = family.keys.length === 4
      ? ['base', 'plus', 'max', 'ultimate']
      : ['base', 'plus', 'max'];
    family.keys.forEach((key, index) => {
      const tier = tiers[index] || 'base';
      const pool = (THEME_EMOJIS[family.id] || {})[tier] || [];
      THEMES[key] = {
        key,
        family: family.id,
        season: family.season || null,
        tier,
        emojis: pool
      };
    });
  });
  window.THEMES = THEMES;

  /* =========================================================
     状态与工具
     ========================================================= */

  let lang = 'zh';
  let mode = 'dark';
  let fontZh = 'default';
  let fontEn = 'default';
  let appReady = false;
  let toastTimer = 0;
  let gateBusy = false;
  let activeProviderId = 'deepseek';
  let configProviderId = 'deepseek';

  /* 【新增】20261119：对话、历史与时间问候。 */
  let chatMessages = [];
  let activeChatId = '';
  let chatBusy = false;
  let timeGreetingTimer = 0;
  let emojiRefreshTimer = 0;
  let authAccessToken = '';
  let cloudKeyConfigured = false;
  let cloudKeyProviderId = '';

  function t(key) {
    const dict = I18N[lang] || I18N.zh;
    return dict[key] || I18N.zh[key] || key;
  }

  function $(id) { return document.getElementById(id); }

  function safeText(value) { return String(value == null ? '' : value); }

  function readMainUser() {
    const name = store.get('bb-current-user', null);
    if (!name || typeof name !== 'string') return null;
    const users = getUsersDB();
    let user = users[name];
    if (!user) return null;
    if (typeof user === 'string') user = { key: user, pwd: '' };
    return { name, user, users };
  }

  function currentMainUser() {
    if (!currentUser) return null;
    return getUsersDB()[currentUser] || null;
  }

  function getBreadLevel(user) {
    const value = Number(user && (user.userLevel || user.breadLevel || user.bread_level));
    return Math.max(1, Math.min(60, Number.isFinite(value) && value > 0 ? value : 1));
  }

  function familyIdOf(key) {
    return safeText(key).replace(/-(plus|max|ultimate)$/, '');
  }

  function tierOf(key) {
    const m = /-(plus|max|ultimate)$/.exec(safeText(key));
    return m ? m[1] : 'base';
  }

  function ownedThemeKeys(user) {
    if (!user) return [];
    const result = [];
    const add = (value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach((item) => { if (typeof item === 'string') result.push(item); });
      } else if (typeof value === 'string') {
        value.split(/[,\s]+/).forEach((item) => { if (item) result.push(item); });
      }
    };
    add(user.unlockedThemes);
    add(user.unlocked_themes);
    add(user.themes);
    if (typeof user.currentTheme === 'string') result.push(user.currentTheme);
    return Array.from(new Set(result));
  }

  function canUseTheme(key, user) {
    if (!THEMES[key]) return false;
    if (key === 'default') return true;
    const owned = ownedThemeKeys(user);
    if (owned.indexOf(key) >= 0) return true;

    /* 蜂蜜工坊走面包等级解锁，不依赖兑换码。 */
    if (THEMES[key].family === 'honey') {
      const level = getBreadLevel(user);
      const tier = THEMES[key].tier;
      if (tier === 'base') return level >= 30;
      if (tier === 'plus') return level >= 50;
      if (tier === 'max') return level >= 60;
    }
    return false;
  }

  function bestThemeKey(family, user) {
    if (!family) return null;
    for (let i = family.keys.length - 1; i >= 0; i -= 1) {
      if (canUseTheme(family.keys[i], user)) return family.keys[i];
    }
    return null;
  }

  function initialThemeKey(user) {
    const saved = store.get(LS.theme, null);
    if (saved && THEMES[saved] && canUseTheme(saved, user)) return saved;

    const mainKey = user && user.currentTheme;
    if (mainKey && THEMES[mainKey] && canUseTheme(mainKey, user)) return mainKey;

    const family = FAMILY_BY_ID[familyIdOf(mainKey)];
    if (family) {
      const best = bestThemeKey(family, user);
      if (best) return best;
    }
    return 'default';
  }

  function getFontFamily(id, type) {
    if (type === 'en') {
      if (id === 'default') return 'Arial, Helvetica';
      if (id === 'mono') return 'Consolas, "Courier New"';
      if (id === 'round') return 'Verdana, Arial';
      if (id === 'kai') return 'Georgia, "Times New Roman"';
      if (id === 'song') return '"Times New Roman", Times';
      if (id === 'local-en-1') return "'AguarinaScript'";
      if (id === 'local-en-2') return "'Cascadia'";
      if (id === 'local-en-3') return "'DancingScript'";
      if (id === 'local-en-4') return "'DancingScriptBold'";
      return '';
    }
    if (id === 'default') return '"PingFang SC", "Microsoft YaHei", sans-serif';
    if (id === 'kai') return '"KaiTi", "STKaiti", "楷体"';
    if (id === 'song') return '"SimSun", "Songti SC", "宋体"';
    if (id === 'round') return '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"';
    if (id === 'mono') return '"Consolas", "Courier New", monospace';
    if (id === 'local-zh-1') return "'YangRenDong'";
    if (id === 'local-zh-2') return "'ZiHunGaoBai'";
    if (id === 'local-zh-3') return "'ZiHunJiaoLvMao'";
    if (id === 'local-zh-4') return "'ZiHunXiaoXiaoLe'";
    if (id === 'local-zh-5') return "'ZiHunTianDou'";
    if (id === 'local-zh-6') return "'ZiHunXiaRi'";
    if (id === 'local-zh-7') return "'ZiHunAnJiang'";
    if (id === 'local-zh-8') return "'ZiHunYueSong'";
    if (id === 'local-zh-9') return "'ZiXiaoHunChuLin'";
    if (id === 'local-zh-10') return "'ZiXiaoHunMengMengDa'";
    if (id === 'local-zh-11') return "'ZiXiaoHunPangPang'";
    if (id === 'local-zh-12') return "'ZiXiaoHunTianZhen'";
    if (id === 'local-zh-13') return "'ZiXiaoHunYangRenDong'";
    return '';
  }

  /* =========================================================
     语言 / 主题 / 字体
     ========================================================= */

  function applyI18n() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      el.setAttribute('title', t(key));
    });
    const btnLang = $('btnLang');
    if (btnLang) btnLang.textContent = lang === 'zh' ? 'EN' : '中';
    updateModeButton();
    updateFontPreview();
    renderTimeGreeting();
  }

  function updateModeButton() {
    const btn = $('btnMode');
    if (!btn) return;
    btn.textContent = mode === 'dark' ? '☀' : '☾';
    btn.title = mode === 'dark' ? t('header.modeToLight') : t('header.modeToDark');
  }

  function updateFontPreview() {
    const preview = $('fontPreview');
    if (!preview) return;
    preview.textContent = t('font.preview');
    preview.style.fontFamily = `${getFontFamily(fontEn, 'en')}, ${getFontFamily(fontZh, 'zh')}`;
  }

  function applyFont(zhId, enId, opts) {
    const nextZh = FONT_ZH.some((f) => f.id === zhId) ? zhId : 'default';
    const nextEn = FONT_EN.some((f) => f.id === enId) ? enId : 'default';
    fontZh = nextZh;
    fontEn = nextEn;

    const family = `${getFontFamily(fontEn, 'en')}, ${getFontFamily(fontZh, 'zh')}`;
    document.body.style.fontFamily = family;
    document.documentElement.style.setProperty('--bai-font', family);

    if (!opts || opts.save !== false) {
      store.set(LS.fontZh, fontZh);
      store.set(LS.fontEn, fontEn);
      cloudSavePreferences();
    }
    updateFontPreview();
    renderFontLists();
  }

  /* 【新增】20261119：主站时间问候 / 心情短句，按本地时间取时段。 */
  function timePeriodForHour(hour) {
    if (hour >= 5 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 12) return 'forenoon';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  function renderTimeGreeting() {
    const line = $('timeLine');
    if (!line) return;
    const data = window.BB_HOME_TEXT && window.BB_HOME_TEXT[lang === 'en' ? 'en' : 'zh'];
    if (!data) { line.textContent = ''; return; }
    const period = timePeriodForHour(new Date().getHours());
    const greetings = (data.greetings && data.greetings[period]) || [];
    const quotes = (data.quotes && data.quotes[period]) || [];
    const pick = (list) => list.length ? list[Math.floor(Math.random() * list.length)] : '';
    const greeting = pick(greetings);
    const quote = pick(quotes);
    line.textContent = [greeting, quote].filter(Boolean).join(' · ');
  }

  /* 【新增】20261119：背景漂浮 Emoji 引擎。
     数量和主站一样按档位递增；每次切主题/切模式重建，避免旧主题的 Emoji 残留。 */
  function emojiCountForTheme() {
    const tier = tierOf(currentTheme);
    if (tier === 'ultimate') return 30;
    if (tier === 'max') return 24;
    if (tier === 'plus') return 19;
    return 15;
  }

  function refreshBreadEmoji() {
    const layer = $('breadBg');
    if (!layer) return;
    layer.textContent = '';
    const theme = THEMES[currentTheme] || THEMES.default;
    const pool = (theme && theme.emojis && theme.emojis.length) ? theme.emojis : ['🍞','🥐','🥖'];
    const count = emojiCountForTheme();
    const dirs = ['', 'dir-down', 'dir-dr', 'dir-dl', 'dir-ur', 'dir-ul'];

    for (let i = 0; i < count; i += 1) {
      const span = document.createElement('span');
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      span.className = `bread${dir ? ' ' + dir : ''}`;
      span.style.left = `${Math.random() * 100}%`;
      span.style.top = dir ? `${Math.random() * 18}%` : '0';
      span.style.setProperty('--op', (0.32 + Math.random() * 0.28).toFixed(2));
      span.style.fontSize = `${14 + Math.random() * 24}px`;
      span.style.animationDuration = `${18 + Math.random() * 22}s`;
      span.style.animationDelay = `-${Math.random() * 32}s`;
      const inner = document.createElement('i');
      inner.textContent = pool[i % pool.length];
      span.appendChild(inner);
      layer.appendChild(span);
    }

    window.clearTimeout(emojiRefreshTimer);
    emojiRefreshTimer = window.setTimeout(refreshBreadEmoji, 90000);
  }

  function applyTheme(key, opts) {
    const nextKey = THEMES[key] ? key : 'default';
    currentTheme = nextKey;
    window.currentTheme = nextKey;

    if (!opts || opts.save !== false) store.set(LS.theme, nextKey);
    if (!opts || opts.save !== false) cloudSavePreferences();

    const body = document.body;
    body.classList.remove('dark');
    Array.from(body.classList).forEach((cls) => {
      if (cls.indexOf('theme-') === 0) body.classList.remove(cls);
    });

    if (mode === 'dark') body.classList.add('dark');

    const family = familyIdOf(nextKey);
    if (family !== 'default') body.classList.add(`theme-${family}`);
    const tier = tierOf(nextKey);
    if (tier !== 'base') body.classList.add(`theme-tier-${tier}`);

    body.dataset.theme = nextKey;

    /* 雨 / 雪模块由主站提供；切主题后按新主题重新同步。
       雨效传 true：同一季节只换档位时也重新排雨滴。 */
    try { if (window.RainFX && typeof window.RainFX.sync === 'function') window.RainFX.sync(true); } catch (e) { /* ignore */ }
    try { if (window.WinterFX && typeof window.WinterFX.sync === 'function') window.WinterFX.sync(); } catch (e) { /* ignore */ }

    refreshBreadEmoji();
    renderThemeGrid();
  }

  function setMode(nextMode, opts) {
    mode = nextMode === 'light' ? 'light' : 'dark';
    if (!opts || opts.save !== false) store.set(LS.mode, mode);
    applyTheme(currentTheme, { save: false });
    updateModeButton();
    if (!opts || opts.save !== false) cloudSavePreferences();
    if (!opts || opts.toast !== false) {
      showToast(mode === 'dark' ? t('toast.dark') : t('toast.light'));
    }
  }

  function setLanguage(nextLang) {
    lang = nextLang === 'en' ? 'en' : 'zh';
    store.set(LS.lang, lang);
    applyI18n();
    renderProviders();
    updateThinkingControl();
    renderThemeGrid();
    renderFontLists();
    renderProviderPicker();
    renderTimeGreeting();
    renderHistory();
    renderChatMessages();
    updateChatBusy(chatBusy);
    cloudSavePreferences();
    const providerOverlay = $('providerOverlay');
    if (providerOverlay && !providerOverlay.hidden) {
      const provider = getProvider(configProviderId);
      const title = $('providerTitle');
      if (provider && title) title.textContent = `${t('providerConfig.title')} · ${provider.name}`;
      const picker = $('providerPicker');
      if (picker) picker.value = configProviderId;
    }
  }

  /* =========================================================
     门禁
     ========================================================= */

  function setGateError(message) {
    const el = $('gateError');
    if (el) el.textContent = message || '';
  }

  function rememberUnlock() {
    if (!currentUser) return;
    store.set(LS.unlock, { name: currentUser, ts: Date.now() });
  }

  function isUnlockRemembered(name) {
    if (!name) return false;
    const record = store.get(LS.unlock, null);
    if (!record || record.name !== name) return false;
    const age = Date.now() - Number(record.ts || 0);
    return age >= 0 && age < UNLOCK_DAYS * 24 * 60 * 60 * 1000;
  }

  function forgetUnlock() {
    store.remove(LS.unlock);
  }

  function renderGate(session) {
    const guest = $('gateGuest');
    const form = $('gateForm');
    if (!session) {
      if (guest) guest.hidden = false;
      if (form) form.hidden = true;
      setGateError('');
      return;
    }

    currentUser = session.name;
    window.currentUser = session.name;

    if (guest) guest.hidden = true;
    if (form) form.hidden = false;

    const nameEl = $('gateUserName');
    const fallback = $('gateAvatarFallback');
    const avatar = $('gateAvatar');
    if (nameEl) nameEl.textContent = session.name;

    const avatarSrc = safeText(session.user && session.user.avatar);
    if (avatar && avatarSrc) {
      avatar.src = avatarSrc;
      avatar.hidden = false;
      if (fallback) fallback.hidden = true;
    } else {
      if (avatar) { avatar.hidden = true; avatar.removeAttribute('src'); }
      if (fallback) {
        fallback.hidden = false;
        fallback.textContent = session.name.slice(0, 1).toUpperCase();
      }
    }

    setGateError('');
    const keyInput = $('gateKey');
    if (keyInput) setTimeout(() => keyInput.focus(), 40);
  }

  function setGateBusy(busy) {
    gateBusy = !!busy;
    const form = $('gateForm');
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = !!busy;
    button.textContent = busy ? t('gate.verifying') : t('gate.enter');
  }

  /* 【新增】20261119：用 Supabase Auth 校验密码。
     主站注册只把密码交给 Supabase Auth，本地 bb-users 不存 pwd，
     因此子站不能只靠 u.pwd 比较；这里直接调用 Auth token 端点，
     成功时把 access_token 留在本次 sessionStorage，供 Edge Function 识别用户。 */
  async function verifyPasswordWithSupabase(user, password) {
    const email = safeText(user && user.email);
    if (!email) return { ok: false, reason: 'no-email' };

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return { ok: true, reason: 'ok', accessToken: safeText(data && data.access_token) };
      }

      /* 400 / 401 通常是密码错误；其它状态按“服务不可用”处理，避免误导。 */
      if (response.status === 400 || response.status === 401) {
        return { ok: false, reason: 'bad-password' };
      }
      return { ok: false, reason: 'network' };
    } catch (e) {
      return { ok: false, reason: 'network' };
    }
  }

  async function handleGateSubmit(event) {
    event.preventDefault();
    if (gateBusy) return;
    setGateError('');

    if (!currentUser) {
      setGateError(t('gate.errorNoUser'));
      return;
    }

    const users = getUsersDB();
    const user = users[currentUser];
    if (!user || typeof user !== 'object') {
      setGateError(t('gate.errorNoUser'));
      return;
    }

    const keyInput = $('gateKey');
    const pwdInput = $('gatePwd');
    const key = keyInput ? keyInput.value.trim() : '';
    const pwd = pwdInput ? pwdInput.value.trim() : '';

    if (!/^bread-key-[A-Za-z0-9]{32}$/.test(key)) {
      setGateError(t('gate.errorKeyFormat'));
      return;
    }

    const expectedKey = safeText(user.key || user.bread_key || user.breadKey);
    if (!expectedKey || expectedKey !== key) {
      setGateError(t('gate.errorKeyMatch'));
      return;
    }

    if (!pwd) {
      setGateError(t('gate.errorPwdWrong'));
      return;
    }

    setGateBusy(true);
    try {
      let passwordOk = false;

      if (user.email) {
        const verified = await verifyPasswordWithSupabase(user, pwd);
        if (verified.ok) {
          passwordOk = true;
          /* 【新增】20261119：把本次校验返回的 access_token 放到 sessionStorage。 */
          authAccessToken = verified.accessToken || '';
          try {
            const ss = sessionStore();
            if (ss && authAccessToken) ss.setItem(AUTH_TOKEN_KEY, authAccessToken);
            else if (ss) ss.removeItem(AUTH_TOKEN_KEY);
          } catch (e) { /* ignore */ }
        } else if (verified.reason === 'network') {
          setGateError(t('gate.errorPwdNetwork'));
          return;
        } else if (verified.reason === 'no-email') {
          setGateError(t('gate.errorPwdNoEmail'));
          return;
        }
      } else {
        /* 兼容极老的本地账号：如果本地存了 pwd，才允许本地比较。 */
        const localPwd = safeText(user.pwd || user.password);
        if (!localPwd) {
          setGateError(t('gate.errorPwdNoEmail'));
          return;
        }
        passwordOk = localPwd === pwd;
      }

      if (!passwordOk) {
        setGateError(t('gate.errorPwdWrong'));
        return;
      }

      if (keyInput) keyInput.value = '';
      if (pwdInput) pwdInput.value = '';
      unlockApp();
    } finally {
      setGateBusy(false);
    }
  }

  function unlockApp(opts) {
    if (!opts || opts.remember !== false) rememberUnlock();
    const gate = $('gate');
    const app = $('app');
    if (gate) {
      gate.hidden = true;
      gate.style.display = 'none';
    }
    if (app) app.hidden = false;
    initApp();
  }

  /* =========================================================
     主界面渲染
     ========================================================= */

  function initApp() {
    if (appReady) return;
    appReady = true;

    lang = store.get(LS.lang, store.get('bb-language', 'zh')) === 'en' ? 'en' : 'zh';
    mode = store.get(LS.mode, 'dark') === 'light' ? 'light' : 'dark';

    const user = currentMainUser() || {};
    const savedZh = store.get(LS.fontZh, user.zhFont || 'default');
    const savedEn = store.get(LS.fontEn, user.enFont || 'default');

    /* 【新增】20261119：恢复本次会话的 Supabase access_token（如果有）。 */
    try {
      const ss = sessionStore();
      authAccessToken = (ss && ss.getItem(AUTH_TOKEN_KEY)) || '';
    } catch (e) { authAccessToken = ''; }

    applyI18n();
    applyFont(savedZh, savedEn, { save: false });
    applyTheme(initialThemeKey(user), { save: false });
    const savedProvider = store.get(CFG.active, 'deepseek');
    activeProviderId = getProvider(savedProvider) ? savedProvider : 'deepseek';
    renderProviders();
    updateThinkingControl();
    renderThemeGrid();
    renderFontLists();
    renderHistory();
    renderChatMessages();
    updateChatBusy(false);

    /* 【新增】20261119：恢复上次对话；没有就保持空状态。 */
    const lastChat = store.get(LS.activeChat, '');
    if (lastChat && loadHistory().some((item) => item.id === lastChat)) openChat(lastChat);

    window.clearInterval(timeGreetingTimer);
    timeGreetingTimer = window.setInterval(renderTimeGreeting, 20000);

    /* 【新增】20261119：有登录会话时异步拉云端偏好；失败就继续用本地。 */
    loadCloudState();

    /* 让页面重新排一次雨/雪画布尺寸，避免刚显示时窗口尺寸读到 0。 */
    window.setTimeout(() => {
      try { if (window.RainFX && window.RainFX.sync) window.RainFX.sync(); } catch (e) { /* ignore */ }
      try { if (window.WinterFX && window.WinterFX.sync) window.WinterFX.sync(); } catch (e) { /* ignore */ }
    }, 80);
  }

  function sessionStore() {
    try { return window.sessionStorage; } catch (e) { return null; }
  }

  function getProvider(id) {
    return PROVIDERS.find((provider) => provider.id === id) || null;
  }

  function getProviderConfigs() {
    const value = store.get(CFG.providers, {});
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
  }

  function getProviderConfig(id) {
    const configs = getProviderConfigs();
    return (configs[id] && typeof configs[id] === 'object') ? configs[id] : {};
  }

  function setProviderConfig(id, patch) {
    const configs = getProviderConfigs();
    configs[id] = Object.assign({}, getProviderConfig(id), patch || {});
    store.set(CFG.providers, configs);
  }

  function getProviderKey(id) {
    const ss = sessionStore();
    try {
      const sessionKeys = JSON.parse((ss && ss.getItem(CFG.keysSession)) || '{}');
      if (sessionKeys && typeof sessionKeys[id] === 'string' && sessionKeys[id]) return sessionKeys[id];
    } catch (e) { /* ignore */ }
    const localRaw = store.get(CFG.keysLocal, {});
    const localKeys = (localRaw && typeof localRaw === 'object' && !Array.isArray(localRaw)) ? localRaw : {};
    return (typeof localKeys[id] === 'string') ? localKeys[id] : '';
  }

  function saveProviderKey(id, key, remember) {
    const ss = sessionStore();
    let sessionKeys = {};
    try { sessionKeys = JSON.parse((ss && ss.getItem(CFG.keysSession)) || '{}') || {}; } catch (e) { sessionKeys = {}; }
    if (key) sessionKeys[id] = key;
    else delete sessionKeys[id];
    try { if (ss) ss.setItem(CFG.keysSession, JSON.stringify(sessionKeys)); } catch (e) { /* ignore */ }

    const localRaw = store.get(CFG.keysLocal, {});
    const localKeys = (localRaw && typeof localRaw === 'object' && !Array.isArray(localRaw)) ? localRaw : {};
    if (remember && key) localKeys[id] = key;
    else delete localKeys[id];
    store.set(CFG.keysLocal, localKeys);
  }

  function removeProviderKey(id) {
    saveProviderKey(id, '', false);
  }

  function activeProvider() {
    return getProvider(activeProviderId) || PROVIDERS[0];
  }

  function setActiveProvider(id) {
    const provider = getProvider(id);
    if (!provider) return;
    activeProviderId = id;
    store.set(CFG.active, id);
    renderProviders();
    updateThinkingControl();
    showToast(`${t('provider.selected')} ${provider.name}`);
  }

  /* =========================================================
     历史对话 / 真实模型请求
     ========================================================= */

  function loadHistory() {
    const value = store.get(LS.history, []);
    return Array.isArray(value) ? value.filter((item) => item && item.id && Array.isArray(item.messages)) : [];
  }

  function saveHistory(list) {
    store.set(LS.history, (Array.isArray(list) ? list : []).slice(0, 40));
  }

  function historyTitleFor(messages) {
    const firstUser = (messages || []).find((msg) => msg.role === 'user' && msg.content);
    const text = safeText(firstUser && firstUser.content).replace(/\s+/g, ' ').trim();
    if (!text) return t('chat.untitled');
    return text.length > 28 ? `${text.slice(0, 28)}…` : text;
  }

  function renderHistory() {
    const list = $('historyList');
    if (!list) return;
    const records = loadHistory().sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    list.textContent = '';
    if (!records.length) {
      const empty = document.createElement('div');
      empty.className = 'bai-history-empty';
      empty.textContent = t('chat.historyEmpty');
      list.appendChild(empty);
      return;
    }
    records.forEach((record) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `bai-history-item${record.id === activeChatId ? ' is-active' : ''}`;
      button.dataset.chatId = record.id;

      const title = document.createElement('span');
      title.className = 'bai-history-title';
      title.textContent = record.title || historyTitleFor(record.messages);

      const meta = document.createElement('span');
      meta.className = 'bai-history-meta';
      const time = record.updatedAt ? new Date(record.updatedAt) : null;
      meta.textContent = [record.model || record.providerId || '', time ? time.toLocaleString() : ''].filter(Boolean).join(' · ');

      button.appendChild(title);
      button.appendChild(meta);
      list.appendChild(button);
    });
  }

  function saveActiveChat() {
    if (!activeChatId || !chatMessages.length) return;
    const list = loadHistory();
    const index = list.findIndex((item) => item.id === activeChatId);
    const record = {
      id: activeChatId,
      title: historyTitleFor(chatMessages),
      updatedAt: Date.now(),
      providerId: activeProviderId,
      model: getProviderConfig(activeProviderId).model || '',
      messages: chatMessages.filter((msg) => !msg.pending && !msg.error)
    };
    if (index >= 0) list[index] = record;
    else list.unshift(record);
    saveHistory(list);
    store.set(LS.activeChat, activeChatId);
    renderHistory();
  }

  function renderChatMessages() {
    const container = $('chatMessages');
    const empty = $('chatEmpty');
    if (!container) return;
    const visible = chatMessages.length > 0;
    container.classList.toggle('is-visible', visible);
    if (empty) empty.hidden = visible;
    container.textContent = '';

    chatMessages.forEach((msg) => {
      const bubble = document.createElement('div');
      bubble.className = `bai-msg is-${msg.role === 'user' ? 'user' : 'assistant'}${msg.error ? ' is-error' : ''}`;

      const role = document.createElement('span');
      role.className = 'bai-msg-role';
      role.textContent = msg.role === 'user' ? (lang === 'en' ? 'YOU' : '你') : 'BREAD AI';

      const body = document.createElement('span');
      body.className = 'bai-msg-body';
      body.textContent = safeText(msg.content);

      bubble.appendChild(role);
      bubble.appendChild(body);
      container.appendChild(bubble);
    });
    container.scrollTop = container.scrollHeight;
  }

  function updateChatBusy(busy) {
    const send = $('chatSend');
    const input = $('chatInput');
    if (send) {
      send.disabled = busy;
      send.textContent = busy ? '…' : t('chat.send');
    }
    if (input) input.disabled = busy;
  }

  function startNewChat() {
    activeChatId = '';
    chatMessages = [];
    store.remove(LS.activeChat);
    renderChatMessages();
    renderHistory();
    const input = $('chatInput');
    if (input) input.focus();
  }

  function openChat(id) {
    const record = loadHistory().find((item) => item.id === id);
    if (!record) return;
    activeChatId = id;
    chatMessages = record.messages.map((msg) => Object.assign({}, msg));
    store.set(LS.activeChat, id);
    renderChatMessages();
    renderHistory();
  }

  function currentModelId() {
    const provider = activeProvider();
    const config = getProviderConfig(provider.id);
    return config.model || (provider.models && provider.models[0]) || '';
  }

  /* 当前服务商是否有可用 Key：本机 Key 优先，其次云端已加密保存的 Key。 */
  function hasUsableProviderKey(providerId) {
    return !!getProviderKey(providerId) || (cloudKeyConfigured && cloudKeyProviderId === providerId);
  }

  /* 【新增】20261119：把主题 / 模式 / 字体 / 语言同步到 bread_ai_preferences。
     没有登录会话时跳过，本地设置仍然有效。 */
  async function cloudSavePreferences() {
    if (!authAccessToken) return;
    try {
      await fetch(`${AI_ENDPOINT}?action=save_preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authAccessToken}`
        },
        body: JSON.stringify({
          theme: currentTheme,
          mode,
          fontZh,
          fontEn,
          lang
        })
      });
    } catch (e) { /* 云端同步失败不阻塞本地使用 */ }
  }


  /* 【新增】20261119：把非敏感配置和厂商 Key 交给 Edge 保存。
     没有 Supabase access_token（例如 30 天免验证进入）时自动跳过，只在本地保存。 */
  async function cloudSaveSettings(provider, config, apiKey) {
    if (!authAccessToken) return { ok: false, reason: 'no-session' };
    try {
      const response = await fetch(`${AI_ENDPOINT}?action=save_settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authAccessToken}`
        },
        body: JSON.stringify({
          provider: provider.id,
          model: config.model,
          context: config.context || null,
          maxTokens: config.maxTokens || null,
          reasoningEnabled: !!config.reasoningEnabled,
          reasoningLevel: config.reasoningLevel || '',
          apiKey: apiKey || ''
        })
      });
      return { ok: response.ok };
    } catch (e) {
      return { ok: false, reason: 'network' };
    }
  }

  /* 【新增】20261119：登录后把云端偏好与模型配置回填到当前页面。
     主题/字体/模式不触发二次云端写入；厂商 Key 只判断“是否已配置”，不下载明文。 */
  async function loadCloudState() {
    if (!authAccessToken) return;
    try {
      const response = await fetch(`${AI_ENDPOINT}?action=get_state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authAccessToken}`
        }
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => ({}));

      const prefs = data.preferences;
      if (prefs && typeof prefs === 'object') {
        if (prefs.language === 'zh' || prefs.language === 'en') lang = prefs.language;
        if (prefs.mode === 'dark' || prefs.mode === 'light') mode = prefs.mode;
        if (prefs.font_zh && FONT_ZH.some((font) => font.id === prefs.font_zh)) fontZh = prefs.font_zh;
        if (prefs.font_en && FONT_EN.some((font) => font.id === prefs.font_en)) fontEn = prefs.font_en;

        bodyModeApply();
        applyI18n();
        applyFont(fontZh, fontEn, { save: false });
        if (prefs.theme_key && THEMES[prefs.theme_key] && canUseTheme(prefs.theme_key, currentMainUser() || {})) {
          applyTheme(prefs.theme_key, { save: false });
        }
        renderFontLists();
      }

      const settings = data.settings;
      if (settings && getProvider(settings.provider)) {
        activeProviderId = settings.provider;
        store.set(CFG.active, activeProviderId);
        const patch = {
          model: settings.model || '',
          context: settings.context || null,
          maxTokens: settings.maxTokens || null,
          reasoningEnabled: !!settings.reasoningEnabled,
          reasoningLevel: settings.reasoningLevel || ''
        };
        setProviderConfig(activeProviderId, patch);
        cloudKeyConfigured = !!settings.keyConfigured;
        cloudKeyProviderId = settings.provider;
        renderProviders();
        updateThinkingControl();
      }
    } catch (e) { /* 云端状态读取失败时继续用本地配置 */ }
  }

  function bodyModeApply() {
    document.body.classList.toggle('dark', mode === 'dark');
    updateModeButton();
  }

  async function callAI(messages) {
    const provider = activeProvider();
    const config = getProviderConfig(provider.id);
    const model = currentModelId();
    const apiKey = getProviderKey(provider.id);
    if (!model) throw new Error(t('chat.errorConfig'));
    if (!apiKey && !hasUsableProviderKey(provider.id)) throw new Error(t('chat.errorConfig'));

    const reasoning = reasoningFor(provider, model);
    const body = {
      provider: provider.id,
      model,
      messages,
      apiKey,
      context: config.context || null,
      maxTokens: config.maxTokens || null,
      /* 【新增】20261119：Edge 在登录会话下会把对话写进 bread_ai_conversations。 */
      conversationId: activeChatId || '',
      title: historyTitleFor(chatMessages),
      historyMessages: chatMessages
        .filter((msg) => !msg.pending && !msg.error && (msg.role === 'user' || msg.role === 'assistant'))
        .map((msg) => ({ role: msg.role, content: msg.content })),
      reasoning: reasoning && config.reasoningEnabled !== false,
      reasoningLevel: reasoning ? (config.reasoningLevel || reasoning.defaultLevel || '') : ''
        ? { level: config.reasoningLevel || reasoning.defaultLevel || '' }
        : null
    };

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    };
    if (authAccessToken) headers.Authorization = `Bearer ${authAccessToken}`;
    /* 没有登录 token（30 天免验证）时用 anon JWT 过网关；Edge 内部识别不到用户，只聊天不写库。 */
    else headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }

      if (!response.ok) {
        if (response.status === 404) throw new Error(t('chat.errorNetwork'));
        throw new Error(`${t('chat.errorUpstream')}${data.error || data.message || `HTTP ${response.status}`}`);
      }
      const content = data.content
        || (data.message && data.message.content)
        || (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
        || '';
      if (!content) throw new Error(`${t('chat.errorUpstream')}${data.error || 'empty response'}`);
      return { content: safeText(content), route: safeText(data.route || '') };
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error(t('chat.errorNetwork'));
      throw e;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function sendChat() {
    if (chatBusy) return;
    const input = $('chatInput');
    const text = input ? input.value.trim() : '';
    if (!text) {
      showToast(t('chat.errorEmpty'));
      return;
    }

    const provider = activeProvider();
    const model = currentModelId();
    if (!model || !hasUsableProviderKey(provider.id)) {
      showToast(t('chat.errorConfig'));
      openProviderConfig(provider.id);
      return;
    }

    if (!activeChatId) activeChatId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    chatMessages.push({ role: 'user', content: text });
    if (input) input.value = '';
    chatMessages.push({ role: 'assistant', content: t('chat.sending'), pending: true });
    chatBusy = true;
    updateChatBusy(true);
    renderChatMessages();
    saveActiveChat();

    const requestMessages = [
      {
        role: 'system',
        content: lang === 'en'
          ? 'You are Bread AI, a concise and practical assistant inside Bread Explorer. Answer in the user language.'
          : '你是面包 AI，面包浏览器里的简洁实用助手。请使用用户当前的语言回答。'
      },
      ...chatMessages.filter((msg) => !msg.pending && !msg.error && (msg.role === 'user' || msg.role === 'assistant'))
        .map((msg) => ({ role: msg.role, content: msg.content }))
    ];

    const pending = chatMessages[chatMessages.length - 1];
    try {
      const result = await callAI(requestMessages);
      pending.content = result.content;
      pending.pending = false;
      pending.route = result.route;
    } catch (e) {
      pending.content = safeText(e && e.message ? e.message : e);
      pending.pending = false;
      pending.error = true;
    } finally {
      chatBusy = false;
      updateChatBusy(false);
      renderChatMessages();
      saveActiveChat();
    }
  }

  function reasoningFor(provider, modelId) {
    if (!provider) return null;
    const perModel = (provider.modelReasoning && modelId) ? provider.modelReasoning[modelId] : null;
    if (perModel && perModel.supported === false) return null;
    const base = provider.reasoning || null;
    if (!base && !perModel) return null;
    return Object.assign({ levels: [], canDisable: true, defaultEnabled: false }, base || {}, perModel || {});
  }

  function reasoningLevelLabel(level) {
    return t(`reasoning.${level}`);
  }

  function hasLocalProviderKey(id) {
    const localRaw = store.get(CFG.keysLocal, {});
    const localKeys = (localRaw && typeof localRaw === 'object' && !Array.isArray(localRaw)) ? localRaw : {};
    return typeof localKeys[id] === 'string' && !!localKeys[id];
  }

  function renderProviderPicker() {
    const picker = $('providerPicker');
    if (!picker) return;
    picker.textContent = '';
    PROVIDER_GROUPS.forEach((group) => {
      const items = PROVIDERS.filter((provider) => provider.group === group.id);
      if (!items.length) return;
      const optgroup = document.createElement('optgroup');
      optgroup.label = t(group.labelKey);
      items.forEach((provider) => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = provider.name;
        optgroup.appendChild(option);
      });
      picker.appendChild(optgroup);
    });
  }

  function loadProviderConfigForm(id) {
    const provider = getProvider(id);
    if (!provider) return;
    configProviderId = provider.id;

    const config = getProviderConfig(provider.id);
    const picker = $('providerPicker');
    if (picker) picker.value = provider.id;

    const title = $('providerTitle');
    if (title) title.textContent = `${t('providerConfig.title')} · ${provider.name}`;

    const keyInput = $('providerKey');
    if (keyInput) keyInput.value = getProviderKey(provider.id);

    const remember = $('providerRememberKey');
    if (remember) remember.checked = hasLocalProviderKey(provider.id);

    const modelSelect = $('providerModel');
    const customInput = $('providerModelCustom');
    const modelId = config.model || (provider.models && provider.models[0]) || '';
    const knownModels = provider.models || [];
    const isCustom = !!modelId && knownModels.indexOf(modelId) < 0;

    if (modelSelect) {
      modelSelect.textContent = '';
      knownModels.forEach((model) => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
      const customOption = document.createElement('option');
      customOption.value = '__custom__';
      customOption.textContent = t('providerConfig.customModel');
      modelSelect.appendChild(customOption);
      modelSelect.value = isCustom ? '__custom__' : (modelId || '__custom__');
    }
    if (customInput) {
      customInput.hidden = !isCustom && !!(modelSelect && modelSelect.value !== '__custom__');
      customInput.value = isCustom ? modelId : '';
    }

    const contextInput = $('providerContext');
    if (contextInput) contextInput.value = Number.isFinite(config.context) ? config.context : '';

    const maxInput = $('providerMaxTokens');
    if (maxInput) maxInput.value = Number.isFinite(config.maxTokens) ? config.maxTokens : '';

    const note = $('providerModelListNote');
    if (note) {
      note.textContent = knownModels.length
        ? `${t('providerConfig.modelsRegistered')}${knownModels.join(lang === 'en' ? ', ' : '、')}`
        : '';
    }

    const error = $('providerConfigError');
    if (error) error.textContent = '';

    updateProviderReasoningForm(provider, isCustom ? modelId : (modelSelect ? modelSelect.value : modelId), config);
  }

  function updateProviderReasoningForm(provider, modelId, config) {
    const group = $('providerReasoningGroup');
    const enabled = $('providerReasoningEnabled');
    const level = $('providerReasoningLevel');
    const note = $('providerReasoningNote');
    if (!group || !enabled || !level || !note) return;

    const reasoning = reasoningFor(provider, modelId);
    if (!reasoning) {
      group.hidden = true;
      return;
    }

    group.hidden = false;
    const levels = (reasoning.levels || []).filter((item) => item !== 'none');
    const configEnabled = config && typeof config.reasoningEnabled === 'boolean'
      ? config.reasoningEnabled
      : !!reasoning.defaultEnabled;
    const isAlwaysOn = reasoning.canDisable === false;

    enabled.checked = isAlwaysOn ? true : configEnabled;
    enabled.disabled = isAlwaysOn;

    level.textContent = '';
    levels.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = reasoningLevelLabel(item);
      level.appendChild(option);
    });
    const fallbackLevel = reasoning.defaultLevel || levels[0] || '';
    level.value = (config && config.reasoningLevel && levels.indexOf(config.reasoningLevel) >= 0)
      ? config.reasoningLevel
      : fallbackLevel;
    level.hidden = levels.length === 0 || (!isAlwaysOn && !enabled.checked);
    level.disabled = !isAlwaysOn && !enabled.checked;

    note.textContent = isAlwaysOn
      ? t('reasoning.alwaysOnHint')
      : (levels.length ? t('reasoning.toggleHint') : t('reasoning.toggleHint'));
  }

  function openProviderConfig(id) {
    const provider = getProvider(id) || activeProvider();
    renderProviderPicker();
    loadProviderConfigForm(provider.id);
    openOverlay('providerOverlay');
  }

  function handleProviderSave() {
    const provider = getProvider(configProviderId);
    if (!provider) return;

    const modelSelect = $('providerModel');
    const customInput = $('providerModelCustom');
    const keyInput = $('providerKey');
    const contextInput = $('providerContext');
    const maxInput = $('providerMaxTokens');
    const remember = $('providerRememberKey');
    const reasoningEnabled = $('providerReasoningEnabled');
    const reasoningLevel = $('providerReasoningLevel');
    const error = $('providerConfigError');

    const selectedModel = modelSelect ? modelSelect.value : '';
    const model = selectedModel === '__custom__'
      ? (customInput ? customInput.value.trim() : '')
      : selectedModel;
    if (!model) {
      if (error) error.textContent = t('providerConfig.modelRequired');
      return;
    }

    const contextValue = contextInput ? Number(contextInput.value) : 0;
    const maxValue = maxInput ? Number(maxInput.value) : 0;
    const config = {
      model,
      context: Number.isFinite(contextValue) && contextValue > 0 ? Math.floor(contextValue) : null,
      maxTokens: Number.isFinite(maxValue) && maxValue > 0 ? Math.floor(maxValue) : null
    };

    const reasoning = reasoningFor(provider, model);
    if (reasoning) {
      config.reasoningEnabled = reasoning.canDisable === false ? true : !!(reasoningEnabled && reasoningEnabled.checked);
      config.reasoningLevel = (reasoningLevel && reasoningLevel.value) || reasoning.defaultLevel || '';
    }

    setProviderConfig(provider.id, config);
    saveProviderKey(
      provider.id,
      keyInput ? keyInput.value.trim() : '',
      !!(remember && remember.checked)
    );

    /* 【新增】20261119：有 Supabase 会话时同步一份到 Edge；失败不影响本地保存。 */
    cloudSaveSettings(provider, config, keyInput ? keyInput.value.trim() : '').then((result) => {
      if (result && result.ok) showToast(t('providerConfig.savedCloud'));
    });

    activeProviderId = provider.id;
    store.set(CFG.active, provider.id);
    if (error) error.textContent = '';

    renderProviders();
    updateThinkingControl();
    closeOverlay('providerOverlay');
    showToast(t('providerConfig.saved'));
  }

  function handleProviderClear() {
    const provider = getProvider(configProviderId);
    if (!provider) return;
    const configs = getProviderConfigs();
    delete configs[provider.id];
    store.set(CFG.providers, configs);
    removeProviderKey(provider.id);
    loadProviderConfigForm(provider.id);
    renderProviders();
    updateThinkingControl();
    showToast(t('providerConfig.cleared'));
  }

  function updateThinkingControl() {
    const toggle = $('thinkingToggle');
    const state = $('thinkingState');
    const level = $('thinkingLevel');
    if (!toggle || !state || !level) return;

    const provider = activeProvider();
    const config = getProviderConfig(provider.id);
    const modelId = config.model || provider.models[0] || '';
    const reasoning = reasoningFor(provider, modelId);

    if (!reasoning) {
      toggle.disabled = true;
      toggle.setAttribute('aria-pressed', 'false');
      toggle.title = t('reasoning.unsupportedHint');
      state.textContent = t('reasoning.unsupported');
      level.hidden = true;
      level.textContent = '';
      return;
    }

    const isAlwaysOn = reasoning.canDisable === false;
    const enabled = isAlwaysOn
      ? true
      : (typeof config.reasoningEnabled === 'boolean' ? config.reasoningEnabled : !!reasoning.defaultEnabled);
    const levels = (reasoning.levels || []).filter((item) => item !== 'none');

    toggle.disabled = isAlwaysOn;
    toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    toggle.title = isAlwaysOn ? t('reasoning.alwaysOnHint') : t('reasoning.toggleHint');
    state.textContent = isAlwaysOn ? t('reasoning.alwaysOn') : (enabled ? t('reasoning.on') : t('reasoning.off'));

    level.textContent = '';
    levels.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = reasoningLevelLabel(item);
      level.appendChild(option);
    });
    const fallbackLevel = reasoning.defaultLevel || levels[0] || '';
    level.value = (config.reasoningLevel && levels.indexOf(config.reasoningLevel) >= 0)
      ? config.reasoningLevel
      : fallbackLevel;
    level.hidden = levels.length === 0 || (!isAlwaysOn && !enabled);
    level.disabled = !isAlwaysOn && !enabled;
  }

  function handleThinkingToggle() {
    const provider = activeProvider();
    const config = getProviderConfig(provider.id);
    const modelId = config.model || provider.models[0] || '';
    const reasoning = reasoningFor(provider, modelId);
    if (!reasoning || reasoning.canDisable === false) return;

    const current = typeof config.reasoningEnabled === 'boolean'
      ? config.reasoningEnabled
      : !!reasoning.defaultEnabled;
    setProviderConfig(provider.id, {
      reasoningEnabled: !current,
      reasoningLevel: config.reasoningLevel || reasoning.defaultLevel || ''
    });
    updateThinkingControl();
  }

  function handleThinkingLevelChange(event) {
    const provider = activeProvider();
    const config = getProviderConfig(provider.id);
    const modelId = config.model || provider.models[0] || '';
    const reasoning = reasoningFor(provider, modelId);
    if (!reasoning) return;
    setProviderConfig(provider.id, {
      reasoningEnabled: reasoning.canDisable === false
        ? true
        : (typeof config.reasoningEnabled === 'boolean' ? config.reasoningEnabled : !!reasoning.defaultEnabled),
      reasoningLevel: event.target.value
    });
  }

  function renderProviders() {
    const list = $('providerList');
    if (!list) return;
    list.textContent = '';
    PROVIDER_GROUPS.forEach((group) => {
      const items = PROVIDERS.filter((provider) => provider.group === group.id);
      if (!items.length) return;

      const heading = document.createElement('div');
      heading.className = 'bai-provider-group';
      heading.textContent = t(group.labelKey);
      list.appendChild(heading);

      items.forEach((provider) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `bai-provider${provider.id === activeProviderId ? ' is-active' : ''}`;
        button.dataset.provider = provider.id;
        button.title = `${provider.name} · ${provider.baseUrl}`;

        const text = document.createElement('span');
        const name = document.createElement('span');
        name.className = 'bai-provider-name';
        name.textContent = provider.name;
        const tag = document.createElement('span');
        tag.className = 'bai-provider-tag';
        tag.textContent = lang === 'en' ? provider.tagEn : provider.tagZh;
        text.appendChild(name);
        text.appendChild(document.createElement('br'));
        text.appendChild(tag);

        const state = document.createElement('span');
        state.className = 'bai-provider-state';
        state.textContent = hasUsableProviderKey(provider.id) ? t('provider.configured') : t('provider.status');

        button.appendChild(text);
        button.appendChild(state);
        list.appendChild(button);
      });
    });
  }

  function themeName(family) { return t(family.nameKey); }

  function tierLabel(tier) {
    if (tier === 'plus') return t('theme.tierPlus');
    if (tier === 'max') return t('theme.tierMax');
    if (tier === 'ultimate') return t('theme.tierUltimate');
    return t('theme.tierBase');
  }

  function renderThemeGrid() {
    const grid = $('themeGrid');
    if (!grid) return;
    const user = currentMainUser() || {};
    grid.textContent = '';

    /* 【修改】20261119：不再每个家族只显示“最佳档位”一张卡。
       像主站一样把 Base / Plus / Max / Ultimate 分别列出来。 */
    THEME_FAMILIES.forEach((family) => {
      family.keys.forEach((key) => {
        const theme = THEMES[key];
        if (!theme) return;
        const active = key === currentTheme;
        const locked = !canUseTheme(key, user);

        const card = document.createElement('button');
        card.type = 'button';
        card.className = `bai-theme-card${active ? ' is-active' : ''}${locked ? ' is-locked' : ''}`;
        card.dataset.key = key;
        card.dataset.family = family.id;
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
        card.style.setProperty('--sw1', family.swatches[0]);
        card.style.setProperty('--sw2', family.swatches[1]);
        card.style.setProperty('--sw3', family.swatches[2]);

        const swatch = document.createElement('span');
        swatch.className = 'bai-theme-swatch';

        const nameRow = document.createElement('span');
        nameRow.className = 'bai-theme-name';
        const name = document.createElement('strong');
        name.textContent = themeName(family);
        const tier = document.createElement('span');
        tier.className = 'bai-theme-tier';
        tier.textContent = locked ? t('theme.tierLocked') : tierLabel(theme.tier);
        nameRow.appendChild(name);
        nameRow.appendChild(tier);

        const lock = document.createElement('span');
        lock.className = 'bai-theme-lock';
        lock.textContent = locked ? '🔒' : (active ? '✓' : '');

        card.appendChild(swatch);
        card.appendChild(nameRow);
        card.appendChild(lock);
        grid.appendChild(card);
      });
    });
  }

  function renderFontLists() {
    renderFontList($('fontZhList'), FONT_ZH, fontZh, 'zh');
    renderFontList($('fontEnList'), FONT_EN, fontEn, 'en');
  }

  function renderFontList(container, list, currentId, type) {
    if (!container) return;
    container.textContent = '';
    list.forEach((font) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `bai-font-item${font.id === currentId ? ' is-active' : ''}`;
      button.dataset.fontId = font.id;
      button.dataset.fontType = type;
      button.textContent = lang === 'en' ? font.nameEn : font.nameZh;
      button.style.fontFamily = `${getFontFamily(font.id, type)}, ${getFontFamily(font.id === 'default' ? 'default' : 'default', 'zh')}`;
      container.appendChild(button);
    });
  }

  /* =========================================================
     弹窗 / Toast
     ========================================================= */

  function openOverlay(id) {
    const overlay = $(id);
    if (!overlay) return;
    overlay.hidden = false;
  }

  function closeOverlay(id) {
    const overlay = $(id);
    if (!overlay) return;
    overlay.hidden = true;
  }

  function closeAllOverlays() {
    document.querySelectorAll('.bai-overlay').forEach((overlay) => { overlay.hidden = true; });
  }

  function showToast(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* =========================================================
     事件绑定
     ========================================================= */

  function bindEvents() {
    const gateForm = $('gateForm');
    if (gateForm) gateForm.addEventListener('submit', handleGateSubmit);

    const btnTheme = $('btnTheme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        renderThemeGrid();
        openOverlay('themeOverlay');
      });
    }

    const btnFont = $('btnFont');
    if (btnFont) {
      btnFont.addEventListener('click', () => {
        renderFontLists();
        openOverlay('fontOverlay');
      });
    }

    const btnMode = $('btnMode');
    if (btnMode) {
      btnMode.addEventListener('click', () => {
        setMode(mode === 'dark' ? 'light' : 'dark');
      });
    }

    const btnProviderConfig = $('btnProviderConfig');
    if (btnProviderConfig) {
      btnProviderConfig.addEventListener('click', () => openProviderConfig(activeProviderId));
    }

    const providerPicker = $('providerPicker');
    if (providerPicker) {
      providerPicker.addEventListener('change', (event) => loadProviderConfigForm(event.target.value));
    }

    const providerSave = $('providerSave');
    if (providerSave) providerSave.addEventListener('click', handleProviderSave);

    const providerClear = $('providerClear');
    if (providerClear) providerClear.addEventListener('click', handleProviderClear);

    const providerModel = $('providerModel');
    if (providerModel) {
      providerModel.addEventListener('change', () => {
        const provider = getProvider(configProviderId);
        if (!provider) return;
        const customInput = $('providerModelCustom');
        const isCustom = providerModel.value === '__custom__';
        if (customInput) {
          customInput.hidden = !isCustom;
          if (isCustom) customInput.focus();
        }
        updateProviderReasoningForm(
          provider,
          isCustom ? (customInput ? customInput.value.trim() : '') : providerModel.value,
          getProviderConfig(provider.id)
        );
      });
    }

    const providerModelCustom = $('providerModelCustom');
    if (providerModelCustom) {
      providerModelCustom.addEventListener('input', () => {
        const provider = getProvider(configProviderId);
        if (!provider) return;
        updateProviderReasoningForm(provider, providerModelCustom.value.trim(), getProviderConfig(provider.id));
      });
    }

    const providerReasoningEnabled = $('providerReasoningEnabled');
    if (providerReasoningEnabled) {
      providerReasoningEnabled.addEventListener('change', () => {
        const provider = getProvider(configProviderId);
        if (!provider) return;
        const modelSelect = $('providerModel');
        const customInput = $('providerModelCustom');
        const modelId = modelSelect && modelSelect.value === '__custom__'
          ? (customInput ? customInput.value.trim() : '')
          : (modelSelect ? modelSelect.value : '');
        const reasoning = reasoningFor(provider, modelId);
        const level = $('providerReasoningLevel');
        if (level) {
          const show = !!(reasoning && reasoning.levels && reasoning.levels.length && providerReasoningEnabled.checked);
          level.hidden = !show;
          level.disabled = !show;
        }
      });
    }

    const thinkingToggle = $('thinkingToggle');
    if (thinkingToggle) thinkingToggle.addEventListener('click', handleThinkingToggle);

    const thinkingLevel = $('thinkingLevel');
    if (thinkingLevel) thinkingLevel.addEventListener('change', handleThinkingLevelChange);

    const chatSend = $('chatSend');
    if (chatSend) chatSend.addEventListener('click', sendChat);

    const chatInput = $('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendChat();
        }
      });
    }

    const btnNewChat = $('btnNewChat');
    if (btnNewChat) btnNewChat.addEventListener('click', startNewChat);

    const historyList = $('historyList');
    if (historyList) {
      historyList.addEventListener('click', (event) => {
        const button = event.target.closest('.bai-history-item');
        if (button && button.dataset.chatId) openChat(button.dataset.chatId);
      });
    }

    const btnClearHistory = $('btnClearHistory');
    if (btnClearHistory) {
      btnClearHistory.addEventListener('click', () => {
        if (!loadHistory().length) return;
        if (!window.confirm(t('history.clear'))) return;
        store.set(LS.history, []);
        store.remove(LS.activeChat);
        activeChatId = '';
        chatMessages = [];
        renderChatMessages();
        renderHistory();
        showToast(t('chat.historyCleared'));
      });
    }

    const btnLang = $('btnLang');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        setLanguage(lang === 'zh' ? 'en' : 'zh');
      });
    }

    document.querySelectorAll('[data-close]').forEach((button) => {
      button.addEventListener('click', () => closeOverlay(button.getAttribute('data-close')));
    });

    document.querySelectorAll('.bai-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) overlay.hidden = true;
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllOverlays();
    });

    const providerList = $('providerList');
    if (providerList) {
      providerList.addEventListener('click', (event) => {
        const button = event.target.closest('.bai-provider');
        if (!button) return;
        setActiveProvider(button.dataset.provider);
      });
    }

    const themeGrid = $('themeGrid');
    if (themeGrid) {
      themeGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.bai-theme-card');
        if (!card) return;
        if (card.classList.contains('is-locked') || !card.dataset.key) {
          showToast(t('theme.locked'));
          return;
        }
        const key = card.dataset.key;
        if (key === currentTheme) {
          showToast(t('theme.current'));
          closeOverlay('themeOverlay');
          return;
        }
        applyTheme(key);
        showToast(t('theme.switched'));
        closeOverlay('themeOverlay');
      });
    }

    const fontZhList = $('fontZhList');
    if (fontZhList) {
      fontZhList.addEventListener('click', (event) => {
        const button = event.target.closest('.bai-font-item');
        if (!button) return;
        applyFont(button.dataset.fontId, fontEn);
        showToast(t('font.switched'));
      });
    }

    const fontEnList = $('fontEnList');
    if (fontEnList) {
      fontEnList.addEventListener('click', (event) => {
        const button = event.target.closest('.bai-font-item');
        if (!button) return;
        applyFont(fontZh, button.dataset.fontId);
        showToast(t('font.switched'));
      });
    }
  }

  /* =========================================================
     启动
     ========================================================= */

  function boot() {
    lang = store.get(LS.lang, store.get('bb-language', 'zh')) === 'en' ? 'en' : 'zh';
    mode = store.get(LS.mode, 'dark') === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('dark', mode === 'dark');

    bindEvents();
    applyI18n();

    const session = readMainUser();
    renderGate(session);

    /* 【新增】20261119：同账号在本机验证过就直接进入，不再每次输入 Key + 密码。 */
    if (session && isUnlockRemembered(session.name)) {
      unlockApp({ remember: false });
    }
  }

  window.BAI = {
    boot,
    applyTheme,
    applyFont,
    setMode,
    setLanguage,
    unlockApp,
    forgetUnlock
  };
})();

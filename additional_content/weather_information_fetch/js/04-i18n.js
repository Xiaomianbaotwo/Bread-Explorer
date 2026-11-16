/* ============================================================
 * 【新增】天气 API 查询工具页的语言适配
 * 独立页面（不在主站 16-i18n.js 的作用域内），所以这里做一个极简版：
 *   1. window.T(中文, 英文)  —— 给 JS 里动态生成的文案用；
 *   2. 页面加载时按 window.T 一次性把静态 HTML 文案换成英文（不做监听、不做后续替换）。
 * 语言取自主站同一个 localStorage 键 bb-language（同一域名下共享）。
 * ============================================================ */
(function () {
  var LANG = "zh";
  try { LANG = localStorage.getItem("bb-language") || "zh"; } catch (e) {}
  var IS_EN = LANG === "en";

  window.BB_TOOL_LANG = LANG;
  window.T = function (zh, en) { return IS_EN ? (en === undefined ? zh : en) : zh; };

  /* 静态文案字典：键 = 页面上原样的中文文本（取 trim 后精确匹配） */
  var DICT = {
    /* ---- index.html ---- */
    "天气 API 查询工具": "Weather API Query Tool",
    "输入城市名称 · 自动定位编码 · 返回原始 JSON": "Enter a city name · auto-resolve location ID · raw JSON returned",
    "全局配置": "Global Settings",
    "和风天气 API Key（只需在此填写一次，即可全局通用）": "QWeather API Key (fill in once, applies everywhere)",
    "请输入你的和风天气 API Key": "Enter your QWeather API Key",
    "保存": "Save",
    "✓ API Key 已保存在本机浏览器中。": "✓ API Key saved in this browser.",
    "选择查询区域": "Choose a Query Scope",
    "国内版对接和风天气（中国境内城市）；国外版对接和风天气全球搜索。查询结果可一键复制或下载为 JSON 文件。":
      "Domestic mode covers cities in mainland China; overseas mode searches cities worldwide. Results can be copied or downloaded as JSON.",
    "国内版 · 和风天气": "Domestic · QWeather",
    "面向中国境内城市，限定范围查询 Location ID，返回实况天气原始 JSON。":
      "For cities in mainland China: scoped Location ID lookup, returning raw current-weather JSON.",
    "中国境内": "Mainland China",
    "精确到市": "City-level",
    "国外版 · 和风天气": "Overseas · QWeather",
    "面向中国境外城市，全球范围匹配城市 Location ID，返回实况天气原始 JSON。":
      "For cities outside mainland China: worldwide Location ID matching, returning raw current-weather JSON.",
    "境外城市": "Overseas cities",
    "全球匹配": "Global match",
    "提示：数据内容以天气服务商接口返回为准。": "Note: data is exactly what the weather provider's API returns.",

    /* ---- pages/domestic.html ---- */
    "国内版 · 和风天气 API 查询": "Domestic · QWeather API Query",
    "中国境内城市 · 城市名 → Location ID → 实况天气": "Mainland China · city name → Location ID → current weather",
    "返回首页": "Back to home",
    "查询条件": "Query Parameters",
    "城市名称（精确到市，例如：福州、北京、上海）": "City name (city-level, e.g. Fuzhou, Beijing, Shanghai)",
    "输入中文城市名": "Enter a city name",
    "查询天气": "Query weather",
    "流程：先调用": "Flow: first call",
    "把城市名转换为 Location ID，再调用": "to convert the city name into a Location ID, then call",
    "获取实况。": "to fetch current weather.",
    "注意：请确保已在首页“全局配置”中填写并保存 API Key。":
      "Note: make sure the API Key is filled in and saved under “Global Settings” on the home page.",
    "定位结果": "Location Result",
    "城市名": "City",
    "省份 / 地区": "Province / Region",
    "经纬度": "Coordinates",
    "接口返回 JSON": "API Response JSON",
    "复制内容": "Copy",
    "下载 JSON": "Download JSON",
    "暂无数据": "No data yet",
    "输入城市名并点击「查询天气」，返回的原始 JSON 将显示在这里。":
      "Enter a city name and click “Query weather”; the raw JSON returned will be shown here.",
    "数据来源：和风天气开发服务（QWeather）。若浏览器提示跨域（CORS）限制，需通过自建后端代理转发请求。":
      "Data source: QWeather developer service. If the browser reports a CORS restriction, proxy the request through your own backend.",

    /* ---- pages/overseas.html ---- */
    "国外版 · 和风天气 API 查询": "Overseas · QWeather API Query",
    "中国境外城市 · 全球匹配 Location ID → 实况天气": "Cities outside mainland China · worldwide Location ID → current weather",
    "城市名称（支持中文 / 英文 / 当地语言，例如：Tokyo、Paris、纽约）":
      "City name (Chinese / English / local language, e.g. Tokyo, Paris, New York)",
    "输入境外城市名": "Enter an overseas city name",
    "流程：先调用全球匹配接口获取 Location ID，再请求实况天气。全程使用和风天气":
      "Flow: call the global matching API to get the Location ID, then request current weather. Uses QWeather's",
    "免费开发版": "free developer plan",
    "接口。": "endpoints throughout.",
    "国家 / 地区": "Country / Region",
    "数据来源：和风天气开发服务（QWeather）。全球城市支持超过 50 万个，以 GeoAPI 实时查询结果为准。":
      "Data source: QWeather developer service. Over 500,000 cities worldwide are supported; results follow the GeoAPI response in real time."
  };

  function swapTextNodes(root) {
    if (!IS_EN || !root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var raw = node.nodeValue;
      var key = raw ? raw.trim() : "";
      if (!key) return;
      var hit = DICT[key];
      if (hit) node.nodeValue = raw.replace(key, hit);
    });
  }

  function swapAttrs(root) {
    if (!IS_EN || !root) return;
    root.querySelectorAll("[placeholder],[title]").forEach(function (el) {
      ["placeholder", "title"].forEach(function (attr) {
        var v = el.getAttribute(attr);
        if (v && DICT[v.trim()]) el.setAttribute(attr, DICT[v.trim()]);
      });
    });
  }

  function apply() {
    if (!IS_EN) return;
    document.title = DICT[document.title.trim()] || document.title;
    swapTextNodes(document.body);
    swapAttrs(document.body);
  }

  /* ============================================================
   * 【新增】JS 动态文案词表（门禁弹窗、校验失败提示等，中英成对维护）
   * 与上面的 DICT 分开：DICT 管静态 HTML 文本节点，这里管运行时生成的字符串。
   * 用法：TG('gate.ownerOnly')  →  中文环境返回 zh，英文环境返回 en
   * ============================================================ */
  var KEYS = {
    'gate.ownerOnly':     { zh: '仅限主理人使用',              en: 'Owner Only' },
    'gate.tipNoSession':  { zh: '未检测到登录状态。请先回主站用你的账号登录，再回来打开本页。',
                            en: 'No session found. Sign in on the main site first, then reopen this page.' },
    'gate.tipTokenInvalid': { zh: '登录状态已失效，请回主站重新登录。',
                              en: 'Your session expired. Please sign in again on the main site.' },
    'gate.tipNotOwner':   { zh: '当前账号不是主理人，无法使用天气调试工具。',
                            en: 'This account is not the owner, so the weather debug tool is unavailable.' },
    'gate.tipNetwork':    { zh: '无法连接主站校验身份，请检查网络后刷新。',
                            en: 'Could not reach the server to verify identity. Check your network and refresh.' },
    'gate.backHome':      { zh: '返回主站',                    en: 'Back to main site' },
    'gate.queryBlocked':  { zh: '⛔ 仅限主理人使用：身份校验未通过。',
                            en: '⛔ Owner only: identity check failed.' }
  };

  window.TG = function (key, fallback) {
    var e = KEYS[key];
    if (!e) return (fallback === undefined ? key : fallback);
    return IS_EN ? e.en : e.zh;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();

/* ============================================================
 * 国外版 · 和风天气 (专注境外，支持全球/大洲批量，带 UUID 验证)
 * ============================================================ */

(() => {
  const API_HOST = "pe3yfv7mpt.re.qweatherapi.com";
  const GEO_BASE = `https://${API_HOST}/geo/v2/city/lookup`;
  const NOW_BASE = `https://${API_HOST}/v7/weather/now`;
  const HOURLY_BASE = `https://${API_HOST}/v7/weather/24h`;
  const DAILY_BASE = `https://${API_HOST}/v7/weather/7d`;

  const cityEl = document.getElementById("cityInput");
  const queryBtn = document.getElementById("queryBtn");
  const statusBar = document.getElementById("statusBar");
  const metaPanel = document.getElementById("metaPanel");
  const metaName = document.getElementById("metaName");
  const metaId = document.getElementById("metaId");
  const metaCountry = document.getElementById("metaCountry");
  const metaCoord = document.getElementById("metaCoord");
  const jsonBody = document.getElementById("jsonBody");
  const resultSize = document.getElementById("resultSize");
  const copyBtn = document.getElementById("copyBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  let lastResult = null;
  let lastCity = "";

  // 全世界包含所有文件
  const ALL_WORLD_FILES = [
    'china.txt', 'japan.txt', 'asia.txt', 'uk.txt', 'france.txt', 
    'europe.txt', 'usa.txt', 'north-america.txt', 'south-america.txt', 
    'africa.txt', 'oceania.txt'
  ];

  // ★ 核心修正：此处的亚洲彻底去掉了中国，和主站保持绝对一致
  const CITY_MAP = {
    '全世界': ALL_WORLD_FILES,
    '全球': ALL_WORLD_FILES,
    '亚洲': ['japan.txt', 'asia.txt'], // 只包含日本和亚洲其他
    '欧洲': ['uk.txt', 'france.txt', 'europe.txt'],
    '北美洲': ['usa.txt', 'north-america.txt'],
    '南美洲': ['south-america.txt'],
    '非洲': ['africa.txt'],
    '大洋洲': ['oceania.txt'],
    /* 【新增】英文别名，英文界面下输入 worldwide / global / Asia 等也能命中分组 */
    'worldwide': ALL_WORLD_FILES,
    'world': ALL_WORLD_FILES,
    'global': ALL_WORLD_FILES,
    'asia': ['japan.txt', 'asia.txt'],
    'europe': ['uk.txt', 'france.txt', 'europe.txt'],
    'north america': ['usa.txt', 'north-america.txt'],
    'south america': ['south-america.txt'],
    'africa': ['africa.txt'],
    'oceania': ['oceania.txt']
  };

  // 并发控制池
  async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of array) {
      const p = Promise.resolve().then(() => iteratorFn(item));
      ret.push(p);
      if (poolLimit <= array.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= poolLimit) {
          await Promise.race(executing);
        }
      }
    }
    return Promise.all(ret);
  }

  // 获取当前用户 UUID 验证身份
  function getCurrentUid() {
    try {
      const savedUser = localStorage.getItem('bb-current-user');
      if (!savedUser) return null;
      const currentName = JSON.parse(savedUser);
      const usersDB = JSON.parse(localStorage.getItem('bb-users') || '{}');
      return usersDB[currentName]?.user_id || null;
    } catch(e) { return null; }
  }

  async function getCitiesFromGroup(inputName) {
    /* 【修改】统一转小写比较，中英文别名都能命中分组 */
    const rawInput = String(inputName || '').toLowerCase();
    let targetKey = Object.keys(CITY_MAP).find(k => rawInput.includes(k.toLowerCase()));
    let filesToRead = [];

    if (targetKey) {
      filesToRead = CITY_MAP[targetKey];
    } else {
      // 如果输入的不是大洲，就默认去中国文件里找找有没有这个省份
      try {
        const res = await fetch('../../../modules/weather/cities/china.txt');
        if (!res.ok) return [];
        const text = await res.text();
        const lines = text.split(/\r?\n/);
        let inTarget = false;
        const cities = [];
        const target = inputName.replace(/省|市|自治区|维吾尔|壮族|回族/g, '').trim();

        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('# 分组:')) {
            inTarget = line.replace('# 分组:', '').trim().includes(target);
            continue;
          }
          if (line.startsWith('#')) continue;
          if (inTarget && line) cities.push(line);
        }
        if (cities.length > 0) return cities.sort((a, b) => a.localeCompare(b, 'zh-CN'));
      } catch (e) { return []; }
    }

    const allCities = new Set();
    for (const file of filesToRead) {
      try {
        const res = await fetch(`../../../modules/weather/cities/${file}`);
        if (!res.ok) continue;
        const text = await res.text();
        text.split(/\r?\n/).forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return;
          let cityName = line;
          if (line.includes('|')) cityName = line.split('|')[1].trim(); // 提取中文
          allCities.add(cityName);
        });
      } catch (e) {}
    }
    return Array.from(allCities).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }

  async function fetchCityFullData(city, key) {
    const geoUrl = GEO_BASE + "?location=" + encodeURIComponent(city) + "&key=" + encodeURIComponent(key) + "&number=1";
    const geoResp = await Common.fetchJson(geoUrl);
    const geoData = geoResp.data;
    
    if (String(geoData.code) !== "200" || !geoData.location || geoData.location.length === 0) {
      throw new Error(T("未找到该城市", "City not found"));
    }

    const place = geoData.location[0];
    const [nowResp, hourlyResp, dailyResp] = await Promise.all([
      Common.fetchJson(NOW_BASE + "?location=" + encodeURIComponent(place.id) + "&key=" + encodeURIComponent(key)),
      Common.fetchJson(HOURLY_BASE + "?location=" + encodeURIComponent(place.id) + "&key=" + encodeURIComponent(key)),
      Common.fetchJson(DAILY_BASE + "?location=" + encodeURIComponent(place.id) + "&key=" + encodeURIComponent(key))
    ]);

    return { place, geoData, nowData: nowResp.data, hourlyData: hourlyResp.data, dailyData: dailyResp.data };
  }

  async function handleQuery() {
    // 【新增】主理人门禁：身份校验没过就别发批量请求（遮罩只是视觉层，这里才是真正的闸门）
    if (!window.__DEV_GATE_OK) {
      return Common.showStatus(statusBar, "error", TG('gate.queryBlocked'));
    }
    const key = (localStorage.getItem("qweather_key") || "").trim();
    const inputVal = cityEl.value.trim();

    if (!key) return Common.showStatus(statusBar, "error", T("未检测到 API Key，请返回首页填写后重试。", "No API Key found. Please go back to the home page, enter one and try again."));
    if (!inputVal) return Common.showStatus(statusBar, "error", T("请输入要查询的城市、国家或大洲名称。", "Enter the city, country or continent name to query."));

    queryBtn.disabled = true;
    metaPanel.style.display = "none";
    
    try {
      Common.showStatus(statusBar, "info", T("正在判断分类并拉取城市列表...", "Detecting the category and loading the city list..."));
      const cities = await getCitiesFromGroup(inputVal);

      if (cities.length > 0) {
        // 批量验证 UUID
        const currentUid = getCurrentUid();
        if (!currentUid) {
          throw new Error(T("⛔ 安全拦截：查询“省份/大洲/全世界”等批量数据，必须返回主站登录账号！", "⛔ Blocked: bulk queries (province / continent / worldwide) require signing in to the main site first!"));
        }
        if (cities.length > 500) {
           Common.showStatus(statusBar, "info", T("数据量极大，请耐心等待，不要关闭页面...", "Very large data set — please wait and do not close this page..."));
        }

        let completed = 0;
        let successCount = 0;
        const total = cities.length;
        jsonBody.innerHTML = `<div class="empty-tip" style="color:var(--accent); font-weight:bold;">${T(`开始并发批量查询【${inputVal}】共 ${total} 个城市...`, `Starting batch query for "${inputVal}" (${total} cities)...`)}</div>`;
        
        await asyncPool(5, cities, async (city) => {
          try {
            const data = await fetchCityFullData(city, key);
            await Common.uploadWeatherData(city, {
              now: data.nowData.code === "200" ? data.nowData.now : {},
              hourly: data.hourlyData.code === "200" ? data.hourlyData.hourly : [],
              daily: data.dailyData.code === "200" ? data.dailyData.daily : []
            });
            successCount++;
          } catch (err) { 
            console.warn(`城市 ${city} 查询失败`, err); 
          } finally {
            completed++;
            Common.showStatus(statusBar, "info", `${T(`并发查询进度 (${completed}/${total})，成功: ${successCount} ...`, `Batch progress (${completed}/${total}), succeeded: ${successCount} ...`)}`);
          }
        });
        
        Common.showStatus(statusBar, "ok", T(`✅ 批量查询完成！成功上传 ${successCount} 个城市数据。`, `✅ Batch query complete! ${successCount} cities uploaded.`));
        jsonBody.innerHTML = `<div class="empty-tip" style="color:var(--ok); font-weight:bold;">${T(`批量查询完成！\n成功上传 ${successCount} / ${total} 个城市数据至主库。`, `Batch query complete!\n${successCount} / ${total} cities uploaded to the main database.`)}</div>`;
        
      } else {
        // 单城市模式
        Common.showStatus(statusBar, "info", T("正在获取该城市详细天气...", "Fetching detailed weather for this city..."));
        const data = await fetchCityFullData(inputVal, key);
        const { place, geoData, nowData, hourlyData, dailyData } = data;

        renderMeta(place);
        lastResult = {
          query: { inputCity: inputVal, source: "qweather-overseas", locationId: place.id, country: place.country, queriedAt: new Date().toISOString() },
          geoLookup: geoData,
          weatherNow: nowData,
          weatherHourly: hourlyData,
          weatherDaily: dailyData
        };

        Common.renderJson(jsonBody, lastResult);
        Common.uploadWeatherData(inputVal, { 
          now: nowData.code === "200" ? nowData.now : {},
          hourly: hourlyData.code === "200" ? hourlyData.hourly : [],
          daily: dailyData.code === "200" ? dailyData.daily : []
        });

        const size = new Blob([JSON.stringify(lastResult)]).size;
        resultSize.textContent = T("约 ", "Approx. ") + (size / 1024).toFixed(1) + " KB";
        Common.showStatus(statusBar, "ok", T("查询完成，已获取到数据并同步至主库。", "Query complete. Data fetched and synced to the main database."));
      }
    } catch (e) {
      resultSize.textContent = T("暂无数据", "No data yet");
      jsonBody.innerHTML = `<div class="empty-tip" style="color:var(--err); font-weight:bold;">${e.message}</div>`;
      Common.showStatus(statusBar, "error", e.message || T("未知错误", "Unknown error"));
    } finally {
      queryBtn.disabled = false;
    }
  }

  function renderMeta(place) {
    metaName.textContent = place.name || "—";
    metaId.textContent = place.id || "—";
    metaCountry.textContent = [place.country, place.adm1].filter(Boolean).join(" / ") || "—";
    metaCoord.textContent = place.lat && place.lon ? (place.lat + ", " + place.lon) : "—";
    metaPanel.style.display = "block";
  }

  async function handleCopy() {
    if (!lastResult) { return; }
    const ok = await Common.copyText(JSON.stringify(lastResult, null, 2));
    Common.showStatus(statusBar, ok ? "ok" : "error", ok ? T("已复制。", "Copied.") : T("复制失败。", "Copy failed."));
  }

  function handleDownload() {
    if (!lastResult) { return; }
    Common.downloadJson(lastResult, lastCity);
    Common.showStatus(statusBar, "ok", T("下载已开始。", "Download started."));
  }

  queryBtn.addEventListener("click", handleQuery);
  cityEl.addEventListener("keydown", (e) => { if (e.key === "Enter") handleQuery(); });
  copyBtn.addEventListener("click", handleCopy);
  downloadBtn.addEventListener("click", handleDownload);
})();
/* =========================================================
   modules/weather/js/02-weather-core.js
   天气核心引擎 (终极秒开版：精确查库 + 智能兜底 + 极地支持)
   ========================================================= */

const WORKER_API_URL = 'https://bread-weather-proxy.3605740274.workers.dev';
const BREAD_ENGINE_URL = 'https://txlozorhwmkpvrbkmyfn.supabase.co';
const BREAD_ENGINE_KEY = 'sb_publishable_VkgDzUbskjLJIVlLezUvTw_YSVungPy';

let currentWeatherData = null;
let currentTimeRange = '24'; 

// ================== 1. 数据获取核心 ==================
function extractChinese(str) {
  if (!str) return '';
  return str.replace(/[^\u4e00-\u9fa5]/g, '');
}

async function fetchFromSupabase(queryName) {
  const targetChinese = extractChinese(queryName);
  try {
    const sbUrl = `${BREAD_ENGINE_URL}/rest/v1/bread_weather?city_name=eq.${encodeURIComponent(queryName)}&select=*`;
    const sbRes = await fetch(sbUrl, {
      headers: { 'apikey': BREAD_ENGINE_KEY, 'Authorization': `Bearer ${BREAD_ENGINE_KEY}` }
    });
    if (!sbRes.ok) return null;
    const sbData = await sbRes.json();
    
    if (sbData && sbData.length > 0) {
      return buildCacheResult(sbData[0]);
    }

    if (targetChinese && targetChinese !== queryName) {
      const sbUrl2 = `${BREAD_ENGINE_URL}/rest/v1/bread_weather?city_name=eq.${encodeURIComponent(targetChinese)}&select=*`;
      const sbRes2 = await fetch(sbUrl2, {
        headers: { 'apikey': BREAD_ENGINE_KEY, 'Authorization': `Bearer ${BREAD_ENGINE_KEY}` }
      });
      const sbData2 = await sbRes2.json();
      if (sbData2 && sbData2.length > 0) {
        return buildCacheResult(sbData2[0]);
      }
    }
  } catch (e) {}
  return null;
}

function buildCacheResult(cache) {
  const timeStr = new Date(cache.updated_at).toLocaleString();
  return {
    cityName: currentWeatherCity,
    ai_text: cache.ai_tips ? (cache.ai_tips + `\n\n${_loadT('weather.cachedAt', { time: timeStr })}`) : '',
    weather_data: cache.weather_data || {},
    fromCache: true
  };
}

async function fetchFromWorker(cityId, queryName) {
  try {
    const url = `${WORKER_API_URL}?cityId=${encodeURIComponent(cityId)}&cityName=${encodeURIComponent(queryName)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const result = await response.json();
    if (result.error) return null;
    return { 
      cityName: currentWeatherCity, 
      ai_text: result.ai_text, 
      weather_data: result.weather_data || {}, 
      fromCache: result.fromCache 
    };
  } catch (error) {
    return null;
  }
}

// ================== 2. 本地城市池与网格渲染 ==================
const CITY_GROUPS_CONFIG = [
  { name: '中国', en: 'China', files: ['china.txt'] },
  { name: '亚洲', en: 'Asia', files: ['japan.txt', 'asia.txt'] },
  { name: '非洲', en: 'Africa', files: ['africa.txt'] },
  { name: '北美洲', en: 'North America', files: ['usa.txt', 'north-america.txt'] },
  { name: '南美洲', en: 'South America', files: ['south-america.txt'] },
  { name: '欧洲', en: 'Europe', files: ['uk.txt', 'france.txt', 'europe.txt'] },
  { name: '大洋洲', en: 'Oceania', files: ['oceania.txt'] },
  { name: '南极洲', en: 'Antarctica', files: ['antarctica.txt'] } // ★ 加上这一行
];

let cachedCityGroups = null;

function parseCityLine(line) {
  if (!line) return null;
  if (line.startsWith('# 分组:')) {
    return { isHeader: true, headerName: line.replace('# 分组:', '').trim() };
  }
  if (line.startsWith('#')) return null;
  
  if (line.includes('|')) {
    const parts = line.split('|');
    const en = (parts[0] || '').trim();
    const zh = (parts[1] || '').trim();
    if (!zh) return null;
    return { en, zh, display: en ? `${en} (${zh})` : zh };
  }
  return { en: '', zh: line, display: line };
}

async function loadAllCities() {
  const result = [];
  for (const g of CITY_GROUPS_CONFIG) {
    const cities = [];
    let currentSubGroup = _loadT('weather.other');

    for (const f of g.files) {
      try {
        const res = await fetch(`./modules/weather/cities/${f}?t=${Date.now()}`);
        if (!res.ok) continue;
        const text = await res.text();
        text.split(/\r?\n/).forEach(raw => {
          const c = parseCityLine(raw.trim());
          if (!c) return;
          if (c.isHeader) {
            currentSubGroup = c.headerName;
          } else {
            c.subGroup = currentSubGroup;
            cities.push(c);
          }
        });
      } catch (e) {}
    }
    if (cities.length > 0) result.push({ name: g.name, cities });
  }
  return result;
}

async function getCityGroups() {
  if (cachedCityGroups) return cachedCityGroups;
  cachedCityGroups = await loadAllCities();
  /* 【新增】建立「中文城市名 → 英文名」映射，供英文界面的天气卡片显示英文城市名 */
  try {
    window.__cityEnMap = window.__cityEnMap || {};
    cachedCityGroups.forEach(g => (g.cities || []).forEach(c => { if (c.zh && c.en) window.__cityEnMap[c.zh] = c.en; }));
  } catch (e) {}
  return cachedCityGroups;
}

async function renderCityGrid(keyword) {
  const resultsDiv = document.getElementById('citySearchResults');
  if (!resultsDiv) return;
  resultsDiv.innerHTML = `<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${_loadT('weather.loading')}</div>`;

  const groups = await getCityGroups();
  if (groups.length === 0) {
    resultsDiv.innerHTML = `<div style="text-align:center; padding:20px; color:#e74c3c; font-size:13px; line-height:1.6;">${_loadT('weather.cityDataFail')}<br>${_loadT('weather.cityDataFailHint')}</div>`;
    return;
  }

  const kw = (keyword || '').trim().toLowerCase();
  let html = '';

  for (const g of groups) {
    const filtered = kw
      ? g.cities.filter(c => 
          (c.zh && c.zh.includes(kw)) || 
          (c.en && c.en.toLowerCase().includes(kw)) ||
          g.name.includes(kw)
        )
      : g.cities;
    if (filtered.length === 0) continue;

    html += `<div style="font-size: 15px; font-weight: bold; color: var(--accent); margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 1px dashed var(--card-border);">${(typeof window.getLang === 'function' && window.getLang() === 'en' && g.en) ? g.en : g.name} <span style="font-size:12px; font-weight:normal; color:var(--ink-soft);">${_loadT('weather.citiesCount', { n: filtered.length })}</span></div>`;
    
    const subGroups = {};
    filtered.forEach(c => {
      if (!subGroups[c.subGroup]) subGroups[c.subGroup] = [];
      subGroups[c.subGroup].push(c);
    });

    for (const [subName, cities] of Object.entries(subGroups)) {
      html += `<div style="font-size: 13px; font-weight: 600; color: var(--ink); margin: 12px 0 6px; padding-left: 4px;">${subName}</div>`;
      html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); gap: 8px; margin-bottom: 8px;">`;
      
      cities.forEach(c => {
        const queryName = c.zh; 
        html += `<button class="city-btn" data-query="${queryName}" data-display="${c.zh}" style="padding: 8px 4px; border-radius: 8px; border: 1px solid var(--card-border); background: var(--card); color: var(--ink); cursor: pointer; font-size: 13px; transition: all 0.2s; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.display}">${c.display}</button>`;
      });
      html += `</div>`;
    }
  }

  if (!html) {
    resultsDiv.innerHTML = `<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${_loadT('weather.noCityMatch')}</div>`;
    return;
  }
  resultsDiv.innerHTML = html;

  resultsDiv.querySelectorAll('.city-btn').forEach(btn => {
    btn.onmouseover = () => { btn.style.borderColor = 'var(--accent)'; btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = 'var(--shadow)'; };
    btn.onmouseout = () => { btn.style.borderColor = 'var(--card-border)'; btn.style.transform = 'none'; btn.style.boxShadow = 'none'; };
    btn.onclick = () => selectCityByName(btn.dataset.query, btn.dataset.display);
  });
}

// ================== 3. 选择城市逻辑 ==================
async function selectCityByName(queryName, displayName) {
  document.getElementById('citySearchOverlay').classList.remove('show');
  if (typeof closeOverlay === 'function') closeOverlay(document.getElementById('userOverlay'));
  
  showToast(_loadT('weather.updating'), '📍');
  
  currentWeatherCity = displayName; 
  localStorage.setItem('bb-weather-city', displayName); 
  
  if (currentUser) {
    const users = getUsersDB();
    users[currentUser].weather_city = displayName;
    localStorage.setItem('bb-users', JSON.stringify(users));
    sb.from('bread_users').update({ weather_city: displayName }).eq('user_id', users[currentUser].user_id).then(()=>{});
  }

  await loadAndRenderWeather(null, queryName);

  try {
    const res = await fetch(`${WORKER_API_URL}/geo?query=${encodeURIComponent(queryName)}`);
    const cities = await res.json();
    if (cities && cities.length > 0) {
      const city = cities[0];
      currentWeatherCityId = city.id;
      localStorage.setItem('bb-weather-id', city.id);
      
      if (currentUser) {
        const users = getUsersDB();
        users[currentUser].weather_id = city.id;
        localStorage.setItem('bb-users', JSON.stringify(users));
        await sb.from('bread_users').update({ weather_id: city.id }).eq('user_id', users[currentUser].user_id);
      }
      await loadAndRenderWeather(city.id, queryName);
    }
  } catch (e) {}
}

// ================== 4. 渲染与调度 ==================
function initWeatherUI() {
  const showBeta = localStorage.getItem('bb-show-beta') === 'true';
  if (!showBeta) {
    const widget = document.getElementById('weatherWidget');
    if (widget) widget.style.display = 'none';
    const btnWeatherSetting = document.getElementById('btnChangeWeatherCity');
    if (btnWeatherSetting) btnWeatherSetting.style.display = 'none';
    return; 
  }

  if (!document.getElementById('weatherWidget')) {
    const widget = document.createElement('div');
    widget.id = 'weatherWidget';
    widget.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${_loadT('weather.loading')}</div>`;
    document.body.appendChild(widget);
  }

  if (!document.getElementById('weatherDetailOverlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'weatherDetailOverlay';
    overlay.innerHTML = `
      <div class="weather-detail-modal">
        <div class="w-detail-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: nowrap; gap: 10px;">
          <h3 id="wModalTitle" style="margin: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${_loadT('weather.detailTitle')}</h3>
          <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
            <button id="btnToggleTime" style="white-space: nowrap; flex-shrink: 0; background: var(--card); border: 1px solid var(--card-border); color: var(--accent); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; outline: none;">${_loadT('weather.hours24')}</button>
            <button id="btnCloseWeather" style="flex-shrink: 0; background: var(--card); border: 1px solid var(--card-border); color: var(--ink-soft); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transition: 0.2s; outline: none;">✕</button>
          </div>
        </div>
        <div id="weatherTextContent" style="line-height: 1.8; font-size: 14px; color: var(--ink);"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btnCloseWeather').onclick = () => {
      document.getElementById('weatherDetailOverlay').classList.remove('show');
    };
  }

  if (!document.getElementById('citySearchOverlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'citySearchOverlay';
    overlay.innerHTML = `
      <div class="city-select-modal" style="width: min(760px, 94vw); max-height: 85vh; display: flex; flex-direction: column;">
        <h3 style="margin-bottom:16px; color:var(--ink);">${_loadT('weather.cityTitle')}</h3>
        <input type="text" id="citySearchInput" placeholder="${_loadT('weather.cityPlaceholder')}" style="width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--card-border); background: var(--card); color: var(--ink); outline: none; margin-bottom: 12px; font-size: 14px;">
        <div id="citySearchResults" style="flex: 1; overflow-y: auto; padding-right: 6px; min-height: 100px;">
          <div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${_loadT('weather.loading')}</div>
        </div>
        <div style="display:flex; gap:10px; margin-top: 16px;">
          <button class="btn ghost" id="btnCancelCitySearch" style="flex:1; border-radius: 12px;">${_loadT('weather.close')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btnCancelCitySearch').onclick = () => {
      document.getElementById('citySearchOverlay').classList.remove('show');
    };

    let searchTimer = null;
    document.getElementById('citySearchInput').oninput = (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(() => renderCityGrid(val), 180);
    };
  }

  const btnWeatherSetting = document.getElementById('btnChangeWeatherCity');
  if (btnWeatherSetting) {
    btnWeatherSetting.onclick = async () => {
      document.getElementById('citySearchInput').value = '';
      document.getElementById('citySearchOverlay').classList.add('show');
      await renderCityGrid('');
    };
  }

  setTimeout(() => {
    const savedCity = localStorage.getItem('bb-weather-city') || '北京';
    currentWeatherCity = savedCity;
    /* 【新增】预加载城市中英对照表，英文界面天气卡片才能显示英文城市名；加载完再刷新一次卡片 */
    getCityGroups().then(() => { if (currentWeatherData) renderWeatherWidget(currentWeatherData); }).catch(() => {});
    loadAndRenderWeather(currentWeatherCityId, savedCity);
  }, 1000);
}

function renderWeatherWidget(data) {
  const widget = document.getElementById('weatherWidget');
  if (!widget) return;
  /* 【新增】英文界面优先显示城市英文名（映射表在 getCityGroups 里建）；
     极地等没有登记英文名的条目用这里的小字典兜底（含繁体写法，历史数据里可能是“南極洲”）。 */
  const isEn = (typeof window.getLang === 'function' && window.getLang() === 'en');
  const cityMap = window.__cityEnMap || {};
  const extra = {
    '南极洲': 'Antarctica', '南極洲': 'Antarctica',
    '北极': 'Arctic', '北極': 'Arctic',
    '珠穆朗玛峰': 'Mount Everest', '聖母峰': 'Mount Everest'
  };
  const dispCity = isEn ? (cityMap[data.cityName] || extra[data.cityName] || data.cityName) : data.cityName;
  widget.innerHTML = `
    <div class="w-city" style="text-align: center; width: 100%;">📍 ${dispCity}</div>
    <div class="w-icon" style="font-size: 42px; margin: 10px 0;">🌤️</div>
    <div class="w-text" style="font-size: 12px; color: var(--ink-soft); background: var(--card-border); padding: 4px 8px; border-radius: 12px; text-align: center;">${_loadT('weather.viewDetail')}</div>
  `;
  widget.onclick = () => {
    if (!currentWeatherData) return;
    showWeatherDetail();
  };
}

async function loadAndRenderWeather(cityId, queryName) {
  const widget = document.getElementById('weatherWidget');
  if (widget) widget.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${_loadT('weather.fastReading')}</div>`;

  const cacheData = await fetchFromSupabase(queryName);
  if (cacheData) {
    currentWeatherData = cacheData;
    renderWeatherWidget(cacheData);
  } else {
    if (widget) widget.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${_loadT('weather.requestingCloud')}</div>`;
  }

  if (!cityId) return; 
  
  fetchFromWorker(cityId, queryName).then(newData => {
    if (newData) {
      currentWeatherData = newData;
      renderWeatherWidget(newData);
    } else if (!cacheData) {
      if (widget) {
        widget.innerHTML = `
          <div style="text-align: center; color: var(--ink-soft); cursor: pointer;">
            <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;">☁️</div>
            <div style="font-size: 12px;">${_loadT('weather.noData')}</div>
          </div>
        `;
        widget.onclick = () => showToast(_loadT('weather.goSettings'), 'ℹ️');
      }
    }
  });
}

// ================== 5. 渲染详情弹窗 ==================
let currentAiParsedCharts = []; 

function generateDateLabels(timeStrings) {
  if (!timeStrings || timeStrings.length === 0) return [];
  let baseDate = new Date();
  let dayOffset = 0;
  let prevHour = -1;
  
  return timeStrings.map(t => {
    let hour = parseInt(t.split(':')[0], 10);
    if (prevHour !== -1 && hour < prevHour) {
      dayOffset++;
    }
    prevHour = hour;
    
    let d = new Date(baseDate);
    d.setDate(d.getDate() + dayOffset);
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let date = String(d.getDate()).padStart(2, '0');
    return `${month}-${date} ${t}`;
  });
}

function showWeatherDetail() {
  const overlay = document.getElementById('weatherDetailOverlay');
  if (!overlay) return;
  const cleanCityName = currentWeatherData.cityName;
  document.getElementById('wModalTitle').textContent = _loadT('weather.detailTitleCity', { city: cleanCityName });

  let rawText = currentWeatherData.ai_text || '';
  const contentDiv = document.getElementById('weatherTextContent');
  
  if ((!rawText || rawText.trim() === '' || rawText.includes('等待更新') || rawText.includes('暂无数据')) && currentWeatherData.weather_data) {
    const wd = currentWeatherData.weather_data;
    const now = wd.now || {};
    const daily = wd.daily || [];
    const hourly = wd.hourly || [];
    
    if (now.temp) {
      let fallbackText = _loadT('weather.reportTitle', { city: cleanCityName }) + '\n\n';
      
      fallbackText += _loadT('weather.reportData') + '\n';
      fallbackText += _loadT('weather.rTemp', { temp: now.temp, feel: now.feelsLike }) + '\n';
      fallbackText += _loadT('weather.rCond', { text: now.text }) + '\n';
      fallbackText += _loadT('weather.rWind', { dir: now.windDir, scale: now.windScale }) + '\n';
      fallbackText += _loadT('weather.rHumidity', { h: now.humidity }) + '\n';
      if (now.pressure) fallbackText += _loadT('weather.rPressure', { p: now.pressure }) + '\n';
      if (now.vis) fallbackText += _loadT('weather.rVis', { v: now.vis }) + '\n';
      if (now.cloud) fallbackText += _loadT('weather.rCloud', { c: now.cloud }) + '\n';
      if (now.precip && now.precip !== "0.0") fallbackText += _loadT('weather.rPrecip', { p: now.precip }) + '\n';
      fallbackText += `\n`;

      if (daily.length > 0) {
        const today = daily[0];
        fallbackText += _loadT('weather.reportToday') + '\n';
        fallbackText += _loadT('weather.rTempRange', { min: today.tempMin, max: today.tempMax }) + '\n';
        fallbackText += _loadT('weather.rDayNight', { day: today.textDay, night: today.textNight }) + '\n';
        if (today.sunrise) fallbackText += _loadT('weather.rSun', { rise: today.sunrise, set: today.sunset }) + '\n';
        fallbackText += `\n`;
      }

      if (hourly.length > 0) {
        fallbackText += _loadT('weather.reportTrend') + '\n';
        const chartDataStr = hourly.map(h => {
           const timeStr = new Date(h.fxTime).getHours() + ':00';
           return `${timeStr} ${h.temp}℃`;
        }).join(', ');
        fallbackText += _loadT('weather.chartOmit', { data: chartDataStr }) + '\n\n';
      }

      if (daily.length > 1) {
        fallbackText += _loadT('weather.report7') + '\n\n';
        fallbackText += `<table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:13px; text-align:center;">\n`;
        fallbackText += `<tr style="background:rgba(150,150,150,0.1);"><th style="padding:8px; border:1px solid var(--card-border);">${_loadT('weather.thDate')}</th><th style="padding:8px; border:1px solid var(--card-border);">${_loadT('weather.thDay')}</th><th style="padding:8px; border:1px solid var(--card-border);">${_loadT('weather.thNight')}</th><th style="padding:8px; border:1px solid var(--card-border);">${_loadT('weather.thTemp')}</th></tr>\n`;
        for (let i = 1; i < daily.length; i++) {
          const d = daily[i];
          const dateStr = d.fxDate.slice(5);
          fallbackText += `<tr>\n`;
          fallbackText += `<td style="padding:8px; border:1px solid var(--card-border);">${dateStr}</td>\n`;
          fallbackText += `<td style="padding:8px; border:1px solid var(--card-border);">${d.textDay}</td>\n`;
          fallbackText += `<td style="padding:8px; border:1px solid var(--card-border);">${d.textNight}</td>\n`;
          fallbackText += `<td style="padding:8px; border:1px solid var(--card-border);">${d.tempMin}~${d.tempMax}℃</td>\n`;
          fallbackText += `</tr>\n`;
        }
        fallbackText += `</table>\n\n`;
      }

      fallbackText += _loadT('weather.reportTip') + '\n';
      fallbackText += _loadT('weather.reportTipBody');
      
      rawText = fallbackText.trim();
    } else {
      rawText = _loadT('weather.noDetailData');
    }
  }

  currentAiParsedCharts = []; 

  try {
    rawText = rawText.replace(/\[📈折线图略：(.*?)\]/g, (match, dataString) => {
      const labels = [];
      const values = [];
      const itemRegex = /(\d{1,2}:\d{2})\s*([\d.]+)/g;
      let m;
      while ((m = itemRegex.exec(dataString)) !== null) {
        labels.push(m[1]);
        values.push(parseFloat(m[2]));
      }

      if (labels.length === 0) {
        for(let i=0; i<24; i++) {
          labels.push(`${String(i).padStart(2,'0')}:00`);
          values.push(10 + Math.sin(i) * 5);
        }
      }

      let lineColor = '#e8933a';
      let isPercent = false;

      if (dataString.includes('雨') || dataString.includes('%') || dataString.includes('云') || dataString.includes('湿度')) {
        lineColor = '#00bcd4';
        isPercent = true;
      } else if (dataString.includes('能见度') || dataString.includes('km')) {
        lineColor = '#9b59b6';
      } else if (dataString.includes('风') || dataString.includes('气压')) {
        lineColor = '#2ecc71';
      }

      const canvasId = 'chart_' + Math.random().toString(36).substr(2, 9);
      currentAiParsedCharts.push({ canvasId, labels, values, lineColor, isPercent });

      return `<div style="height:220px; margin: 20px 0; padding-right: 15px;"><canvas id="${canvasId}"></canvas></div>`;
    });
  } catch (e) {}

  try {
    rawText = rawText.replace(/·/g, '\n- ');
    const tableRegex = /(<table[\s\S]*?<\/table>|\|.*?\|(?:\n\|.*?\|)+)/g;
    const parts = rawText.split(tableRegex);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] && !parts[i].startsWith('<table') && !parts[i].startsWith('|')) {
        parts[i] = parts[i].replace(/\n/g, '\n\n');
      }
    }
    rawText = parts.join('');
    rawText = rawText.replace(/\n{3,}/g, '\n\n');
  } catch (e) {}

  try {
    if (typeof marked !== 'undefined') {
      contentDiv.innerHTML = marked.parse(rawText);
    } else {
      contentDiv.innerHTML = rawText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    }
  } catch (e) {
    contentDiv.innerHTML = rawText;
  }

  try {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(contentDiv, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false 
      });
    }
  } catch (e) {}

  let u = currentUser ? getUsersDB()[currentUser] : null;
  currentTimeRange = (u && u.weatherRange) ? u.weatherRange : '24';
  
  const btnToggleTime = document.getElementById('btnToggleTime');
  if (btnToggleTime) {
    btnToggleTime.textContent = _loadT('weather.hours', { n: currentTimeRange });
    btnToggleTime.onclick = () => {
      currentTimeRange = currentTimeRange === '24' ? '12' : '24';
      btnToggleTime.textContent = _loadT('weather.hours', { n: currentTimeRange });
      
      if (currentUser) {
        let users = getUsersDB();
        users[currentUser].weatherRange = currentTimeRange;
        store.set('bb-users', users);
      }
      
      renderAllCharts(); 
    };
  }

  renderAllCharts();
  overlay.classList.add('show');
}

function renderAllCharts() {
  try {
    currentAiParsedCharts.forEach(chartData => {
      const canvas = document.getElementById(chartData.canvasId);
      if (!canvas) return;
      
      if (typeof Chart === 'undefined') {
         canvas.parentElement.innerHTML = `<div style="text-align:center; color:#999; line-height: 220px;">${_loadT('weather.chartFailed')}</div>`;
         return;
      }

      if (window['chartInstance_' + chartData.canvasId]) {
        window['chartInstance_' + chartData.canvasId].destroy();
      }

      let rawLabels = [...chartData.labels];
      let values = [...chartData.values];
      
      let labels = generateDateLabels(rawLabels);

      if (currentTimeRange === '12' && labels.length > 12) {
        labels = labels.slice(0, 12);
        values = values.slice(0, 12);
      }

      let yAxisConfig = {
        display: true,
        beginAtZero: false,
        grid: { color: 'rgba(150, 150, 150, 0.15)' },
        ticks: { color: 'var(--ink-soft)', font: {size: 11} }
      };

      if (chartData.isPercent) {
        yAxisConfig.min = 0;
        yAxisConfig.max = 100;
        yAxisConfig.ticks.stepSize = 20;
        yAxisConfig.ticks.callback = function(value) {
          return value + '%';
        };
      } else {
        yAxisConfig.grace = '10%'; 
      }

      window['chartInstance_' + chartData.canvasId] = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            borderColor: chartData.lineColor,
            backgroundColor: chartData.lineColor + '22',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: chartData.lineColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { left: 0, right: 15, top: 10, bottom: 0 } },
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) { label += ': '; }
                  if (chartData.isPercent) {
                    label += context.parsed.y + '%';
                  } else {
                    label += context.parsed.y;
                  }
                  return label;
                }
              }
            }
          },
          scales: { 
            x: { 
              display: true, 
              grid: { display: false }, 
              ticks: { 
                color: 'var(--ink-soft)', 
                font: {size: 10},
                maxRotation: 45,  
                minRotation: 0
              } 
            }, 
            y: yAxisConfig 
          }
        }
      });
    });
  } catch (e) {
    console.error("Chart.js 绘制失败:", e);
  }
}

// ================== 6. 监听全量更新进度 ==================
let lastNotifiedBatch = 0;

async function checkUpdateProgress() {
  try {
    const res = await fetch(`${BREAD_ENGINE_URL}/rest/v1/bread_weather?city_name=eq.SYSTEM_UPDATE_STATUS&select=*`, {
      headers: { 'apikey': BREAD_ENGINE_KEY, 'Authorization': `Bearer ${BREAD_ENGINE_KEY}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    
    if (data && data.length > 0) {
      const record = data[0];
      const status = record.ai_tips;
      const info = record.weather_data || {};

      if (status === 'updating') {
        if (info.batchNum && info.batchNum > lastNotifiedBatch) {
          lastNotifiedBatch = info.batchNum;
          showToast(_loadT('weather.batchSuccess', { num: info.batchNum, total: info.totalBatches, names: info.batchNames }), '🎉');
        }
      } else if (status === 'idle' && lastNotifiedBatch > 0) {
        lastNotifiedBatch = 0;
        showToast(_loadT('weather.batchDone'), '✅');
        if (typeof loadAndRenderWeather === 'function') {
          loadAndRenderWeather(currentWeatherCityId, currentWeatherCity);
        }
      }
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  initWeatherUI();
  if (localStorage.getItem('bb-show-beta') === 'true') {
    setInterval(checkUpdateProgress, 3000);
  }
});
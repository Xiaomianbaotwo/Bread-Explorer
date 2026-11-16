/* ============================================================
 * 公共工具：状态提示 / JSON 高亮 / 复制 / 下载
 * ============================================================ */

const Common = (() => {
  function showStatus(el, type, message) {
    el.className = "status show " + type;
    el.textContent = message;
  }
  function hideStatus(el) {
    el.className = "status";
    el.textContent = "";
  }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function highlightJson(obj) {
    const raw = JSON.stringify(obj, null, 2);
    if (raw == null) return "";
    return escapeHtml(raw).replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g,
      (match) => {
        let cls = "num";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "key" : "str";
        } else if (/true|false/.test(match)) {
          cls = "bool";
        } else if (/null/.test(match)) {
          cls = "bool";
        }
        return '<span class="' + cls + '">' + match + "</span>";
      }
    );
  }
  function renderJson(preEl, obj) {
    preEl.innerHTML = highlightJson(obj);
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }
  function downloadJson(obj, cityName) {
    const text = JSON.stringify(obj, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (cityName || "city").replace(/[\\/:*?"<>|]/g, "_");
    a.href = url;
    a.download = "weather_" + safe + "_" + Date.now() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  async function fetchJson(url) {
    let resp;
    try { resp = await fetch(url); } 
    catch (e) { throw new Error(T("网络请求失败：", "Network request failed: ") + e.message); }
    let data;
    try { data = await resp.json(); } 
    catch (e) { throw new Error(T("返回内容不是有效 JSON（HTTP ", "Response is not valid JSON (HTTP ") + resp.status + ")"); }
    return { status: resp.status, data };
  }

  // ★ 核心新增：将实时天气上传到主站天气库（bread_weather 表）
  async function uploadWeatherData(cityName, weatherData) {
    try {
      const res = await fetch('https://txlozorhwmkpvrbkmyfn.supabase.co/rest/v1/bread_weather', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_VkgDzUbskjLJIVlLezUvTw_YSVungPy',
          'Authorization': 'Bearer sb_publishable_VkgDzUbskjLJIVlLezUvTw_YSVungPy',
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          city_name: cityName,
          weather_data: weatherData,
          updated_at: new Date().toISOString()
        })
      });
      if (!res.ok) console.warn('同步天气数据失败:', await res.text());
      else console.log('✅ 已成功将实时天气同步至主库');
    } catch (e) {
      console.error('同步天气数据出错:', e);
    }
  }

  // 把方法暴露出去
  return {
    showStatus, hideStatus, escapeHtml, highlightJson,
    renderJson, copyText, downloadJson, fetchJson,
    uploadWeatherData // ★ 确保这里包含了上传方法
  };
})();

// 静默同步云端 Key
(async function syncCloudKey() {
  try {
    const savedUser = localStorage.getItem('bb-current-user');
    if (!savedUser) return;

    const currentName = JSON.parse(savedUser);
    const usersDB = JSON.parse(localStorage.getItem('bb-users') || '{}');
    const currentUid = usersDB[currentName]?.user_id;
    
    if (currentUid) {
      const res = await fetch(`https://txlozorhwmkpvrbkmyfn.supabase.co/rest/v1/bread_weather_config?user_id=eq.${currentUid}&select=qweather_key`, {
        headers: { 
          'apikey': 'sb_publishable_VkgDzUbskjLJIVlLezUvTw_YSVungPy', 
          'Authorization': 'Bearer sb_publishable_VkgDzUbskjLJIVlLezUvTw_YSVungPy' 
        }
      });
      const data = await res.json();
      if (data && data.length > 0 && data[0].qweather_key) {
        localStorage.setItem("qweather_key", data[0].qweather_key);
        const keyInput = document.getElementById('globalApiKey');
        if (keyInput && !keyInput.value) {
          keyInput.value = data[0].qweather_key;
          const status = document.getElementById('keyStatus');
          if (status) status.style.display = 'block';
        }
      }
    }
  } catch(e) { console.error('拉取天气库配置失败', e); }
})();
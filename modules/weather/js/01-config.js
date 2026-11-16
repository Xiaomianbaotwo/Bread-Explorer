/* =========================================================
   modules/weather/js/01-config.js (纯中文极简版)
   ========================================================= */

const DEFAULT_CITY = { name: '北京', id: '101010100' };

let currentWeatherCity = localStorage.getItem('bb-weather-city') || DEFAULT_CITY.name;
let currentWeatherCityId = localStorage.getItem('bb-weather-id') || DEFAULT_CITY.id;
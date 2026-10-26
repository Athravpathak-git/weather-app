/**
 * ============================================================================
 * SKYPULSE WEATHER — LIVE WEATHER & FORECAST
 * Production Application Engine & Real Open-Meteo Meteorological Integrations
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. CONSTANTS & CONFIGURATION
   ---------------------------------------------------------------------------- */
const CONFIG = {
    // Real, Public Open-Meteo Endpoints (No API key required)
    GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_API: 'https://api.open-meteo.com/v1/forecast',
    AIR_QUALITY_API: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    REVERSE_GEO_API: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
    NOMINATIM_GEO_API: 'https://nominatim.openstreetmap.org/reverse',
    STORAGE_KEYS: {
        THEME: 'skypulse_theme',
        TEMP_UNIT: 'skypulse_temp_unit',
        WIND_UNIT: 'skypulse_wind_unit',
        FAVORITES: 'skypulse_favorites_v2',
        LAST_LOCATION: 'skypulse_last_location'
    },
    LEGACY_STORAGE_KEYS: {
        THEME: 'aether_theme',
        TEMP_UNIT: 'aether_temp_unit',
        WIND_UNIT: 'aether_wind_unit',
        FAVORITES: 'aether_favorites_v2',
        LAST_LOCATION: 'aether_last_location'
    },
    DEFAULT_LOCATION: {
        id: 2643743,
        name: 'London',
        country: 'United Kingdom',
        region: 'England',
        latitude: 51.5085,
        longitude: -0.1257,
        timezone: 'Europe/London'
    },
    INITIAL_FAVORITES: [
        { name: 'London', country: 'United Kingdom', latitude: 51.5085, longitude: -0.1257, timezone: 'Europe/London' },
        { name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
        { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
        { name: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
        { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' }
    ]
};

// Legacy cities array preserved from original script.js
const cities = ["Mumbai", "Delhi", "Pune", "Nagpur", "Akola", "Bangalore", "Chennai", "Kolkata"];

/* ----------------------------------------------------------------------------
   2. APPLICATION STATE
   ---------------------------------------------------------------------------- */
const state = {
    location: null,
    weather: null,
    airQuality: null,
    units: {
        temp: 'C',   // 'C' | 'F'
        wind: 'kmh'  // 'kmh' | 'mph' | 'ms'
    },
    theme: 'dark',
    favorites: [],
    searchDebounceTimer: null,
    searchAbortController: null,
    weatherAbortController: null,
    currentHourlyView: 'timeline', // 'timeline' | 'chart'
    lastFetchTimestamp: null
};

/* ----------------------------------------------------------------------------
   3. SVG WEATHER ICONS & WMO DECODER
   ---------------------------------------------------------------------------- */
const SVG_ICONS = {
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    cloudSun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="M20 12h2"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M15.5 8.5A4.5 4.5 0 0 0 12 7c-1.5 0-2.8.7-3.6 1.8A5 5 0 0 0 3 13.5 5 5 0 0 0 8 18.5h9a4.5 4.5 0 0 0 4.5-4.5c0-2-1.3-3.7-3-4.3"></path></svg>`,
    cloudMoon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 13a4 4 0 0 0-4-4c-1.2 0-2.2.5-3 1.3A5 5 0 0 0 2 15a5 5 0 0 0 5 5h10a4 4 0 0 0 4-4c0-1.8-1.2-3.3-2.8-3.8A5 5 0 0 0 14.5 8c-.6 0-1.2.1-1.7.3A4.5 4.5 0 0 1 11 13z"></path><path d="M16 3a5 5 0 0 0 5 5"></path></svg>`,
    cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
    fog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h14"></path><path d="M3 14h18"></path><path d="M6 18h12"></path></svg>`,
    drizzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12a4 4 0 0 0-4-4h-1A7 7 0 0 0 4 12a4 4 0 0 0 3 4h12a4 4 0 0 0 0-8z"></path><path d="M8 18v2"></path><path d="M12 18v2"></path><path d="M16 18v2"></path></svg>`,
    rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path><path d="m8 18-1 3"></path><path d="m12 18-1 3"></path><path d="m16 18-1 3"></path></svg>`,
    heavyRain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="m8 16-2 6"></path><path d="m12 16-2 6"></path><path d="m16 16-2 6"></path><path d="m20 16-2 6"></path></svg>`,
    snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path><path d="M8 19h.01"></path><path d="M8 15h.01"></path><path d="M12 17h.01"></path><path d="M12 21h.01"></path><path d="M16 19h.01"></path><path d="M16 15h.01"></path></svg>`,
    thunder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="13 11 9 17 15 17 11 23"></polyline></svg>`,
    drop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`
};

/**
 * WMO Weather code interpreter mapping
 */
function interpretWmoCode(code, isDay = 1) {
    const isDayBool = Boolean(isDay);

    switch (code) {
        case 0:
            return {
                text: 'Clear Sky',
                category: 'clear',
                icon: isDayBool ? SVG_ICONS.sun : SVG_ICONS.moon,
                themeClass: isDayBool ? 'weather-theme-clear-day' : 'weather-theme-clear-night'
            };
        case 1:
            return {
                text: 'Mainly Clear',
                category: 'clear',
                icon: isDayBool ? SVG_ICONS.sun : SVG_ICONS.moon,
                themeClass: isDayBool ? 'weather-theme-clear-day' : 'weather-theme-clear-night'
            };
        case 2:
            return {
                text: 'Partly Cloudy',
                category: 'cloudy',
                icon: isDayBool ? SVG_ICONS.cloudSun : SVG_ICONS.cloudMoon,
                themeClass: 'weather-theme-cloudy'
            };
        case 3:
            return {
                text: 'Overcast',
                category: 'cloudy',
                icon: SVG_ICONS.cloud,
                themeClass: 'weather-theme-cloudy'
            };
        case 45:
        case 48:
            return {
                text: 'Foggy Horizon',
                category: 'foggy',
                icon: SVG_ICONS.fog,
                themeClass: 'weather-theme-foggy'
            };
        case 51:
        case 53:
        case 55:
            return {
                text: 'Light Drizzle',
                category: 'rainy',
                icon: SVG_ICONS.drizzle,
                themeClass: 'weather-theme-rainy'
            };
        case 56:
        case 57:
            return {
                text: 'Freezing Drizzle',
                category: 'snowy',
                icon: SVG_ICONS.drizzle,
                themeClass: 'weather-theme-snowy'
            };
        case 61:
            return {
                text: 'Slight Rain',
                category: 'rainy',
                icon: SVG_ICONS.rain,
                themeClass: 'weather-theme-rainy'
            };
        case 63:
            return {
                text: 'Moderate Rain',
                category: 'rainy',
                icon: SVG_ICONS.rain,
                themeClass: 'weather-theme-rainy'
            };
        case 65:
            return {
                text: 'Heavy Rain',
                category: 'rainy',
                icon: SVG_ICONS.heavyRain,
                themeClass: 'weather-theme-rainy'
            };
        case 66:
        case 67:
            return {
                text: 'Freezing Rain',
                category: 'snowy',
                icon: SVG_ICONS.rain,
                themeClass: 'weather-theme-snowy'
            };
        case 71:
        case 73:
        case 75:
        case 77:
            return {
                text: 'Snowfall',
                category: 'snowy',
                icon: SVG_ICONS.snow,
                themeClass: 'weather-theme-snowy'
            };
        case 80:
        case 81:
            return {
                text: 'Rain Showers',
                category: 'rainy',
                icon: SVG_ICONS.rain,
                themeClass: 'weather-theme-rainy'
            };
        case 82:
            return {
                text: 'Violent Rain Showers',
                category: 'rainy',
                icon: SVG_ICONS.heavyRain,
                themeClass: 'weather-theme-rainy'
            };
        case 85:
        case 86:
            return {
                text: 'Snow Showers',
                category: 'snowy',
                icon: SVG_ICONS.snow,
                themeClass: 'weather-theme-snowy'
            };
        case 95:
            return {
                text: 'Thunderstorm',
                category: 'thunderstorm',
                icon: SVG_ICONS.thunder,
                themeClass: 'weather-theme-thunderstorm'
            };
        case 96:
        case 99:
            return {
                text: 'Severe Thunderstorm & Hail',
                category: 'thunderstorm',
                icon: SVG_ICONS.thunder,
                themeClass: 'weather-theme-thunderstorm'
            };
        default:
            return {
                text: 'Atmospheric Conditions',
                category: 'cloudy',
                icon: SVG_ICONS.cloud,
                themeClass: 'weather-theme-cloudy'
            };
    }
}

/* ----------------------------------------------------------------------------
   4. UNIT CONVERSIONS & FORMATTING
   ---------------------------------------------------------------------------- */
function formatTemperature(celsius) {
    if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
    if (state.units.temp === 'F') {
        const f = (celsius * 9 / 5) + 32;
        return `${Math.round(f)}°`;
    }
    return `${Math.round(celsius)}°`;
}

function formatTemperatureFull(celsius) {
    if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
    const val = formatTemperature(celsius);
    return `${val}${state.units.temp}`;
}

function formatWindSpeed(kmh) {
    if (kmh === null || kmh === undefined || isNaN(kmh)) return { value: '--', unit: state.units.wind };
    if (state.units.wind === 'mph') {
        return { value: Math.round(kmh * 0.621371), unit: 'mph' };
    } else if (state.units.wind === 'ms') {
        return { value: (kmh / 3.6).toFixed(1), unit: 'm/s' };
    }
    return { value: Math.round(kmh), unit: 'km/h' };
}

function formatVisibility(meters) {
    if (meters === null || meters === undefined || isNaN(meters)) return { value: '--', unit: 'km' };
    const km = meters / 1000;
    if (state.units.wind === 'mph') {
        const miles = km * 0.621371;
        return { value: miles >= 10 ? Math.round(miles) : miles.toFixed(1), unit: 'mi' };
    }
    return { value: km >= 10 ? Math.round(km) : km.toFixed(1), unit: 'km' };
}

function degreesToCardinal(deg) {
    if (deg === null || deg === undefined) return '--';
    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return cardinals[index];
}

/* ----------------------------------------------------------------------------
   5. STORAGE HELPERS (WITH BACKWARD COMPATIBILITY)
   ---------------------------------------------------------------------------- */
function safeStorageGet(key, fallback = null) {
    try {
        let item = localStorage.getItem(key);
        // Fallback to legacy key if skypulse key not yet stored
        if (!item) {
            for (const [k, v] of Object.entries(CONFIG.STORAGE_KEYS)) {
                if (v === key && CONFIG.LEGACY_STORAGE_KEYS[k]) {
                    item = localStorage.getItem(CONFIG.LEGACY_STORAGE_KEYS[k]);
                    break;
                }
            }
        }
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        return fallback;
    }
}

function safeStorageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // Ignored in private/sandboxed mode
    }
}

/* ----------------------------------------------------------------------------
   6. UI STATE CONTROLLERS (FAIL-SAFE VISIBILITY)
   ---------------------------------------------------------------------------- */
function showLoading(show) {
    const loadingOverlay = document.getElementById('dashboardLoading');
    if (loadingOverlay) {
        loadingOverlay.hidden = !show;
        loadingOverlay.style.display = show ? 'flex' : 'none';
        loadingOverlay.classList.toggle('is-active', show);
    }
}

function showError(title, message) {
    showLoading(false);
    const errorPanel = document.getElementById('errorPanel');
    const dashboardContent = document.getElementById('dashboardContent');
    if (errorPanel) {
        const titleEl = document.getElementById('errorTitle');
        const descEl = document.getElementById('errorDescription');
        if (titleEl) titleEl.textContent = title || 'Unable to Load Weather Data';
        if (descEl) descEl.textContent = message || 'Please check your internet connection and try again.';
        errorPanel.hidden = false;
        errorPanel.style.display = 'block';
        errorPanel.classList.add('is-active');
    }
    if (dashboardContent) {
        dashboardContent.style.opacity = '1';
        dashboardContent.style.display = 'none';
    }
}

function hideError() {
    const errorPanel = document.getElementById('errorPanel');
    const dashboardContent = document.getElementById('dashboardContent');
    if (errorPanel) {
        errorPanel.hidden = true;
        errorPanel.style.display = 'none';
        errorPanel.classList.remove('is-active');
    }
    if (dashboardContent) {
        dashboardContent.style.display = 'grid';
        dashboardContent.style.opacity = '1';
    }
}

function showAlert(message, type = 'error') {
    const alertEl = document.getElementById('appAlert');
    const messageEl = document.getElementById('alertMessage');
    if (!alertEl || !messageEl) return;

    messageEl.textContent = message;
    alertEl.className = `app-alert-banner ${type} is-active`;
    alertEl.style.display = 'flex';
    alertEl.hidden = false;
}

function dismissAlert() {
    const alertEl = document.getElementById('appAlert');
    if (alertEl) {
        alertEl.classList.remove('is-active');
        alertEl.style.display = 'none';
        alertEl.hidden = true;
    }
}

/* ----------------------------------------------------------------------------
   7. API CLIENT METHODS
   ---------------------------------------------------------------------------- */
/**
 * Search locations using Open-Meteo Geocoding
 */
async function searchLocations(query) {
    if (!query || query.trim().length < 2) return [];

    if (state.searchAbortController) {
        state.searchAbortController.abort();
    }
    state.searchAbortController = new AbortController();

    const url = `${CONFIG.GEOCODING_API}?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;

    try {
        const res = await fetch(url, { signal: state.searchAbortController.signal });
        if (!res.ok) throw new Error(`Geocoding HTTP error ${res.status}`);
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        if (err.name === 'AbortError') return null;
        console.warn('Geocoding search failed:', err);
        return [];
    }
}

/**
 * Fetch comprehensive weather forecast for coordinates
 */
async function fetchWeatherForecast(lat, lon, timezone = 'auto') {
    if (state.weatherAbortController) {
        state.weatherAbortController.abort();
    }
    state.weatherAbortController = new AbortController();

    const params = new URLSearchParams({
        latitude: Number(lat),
        longitude: Number(lon),
        current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'is_day',
            'precipitation',
            'weather_code',
            'cloud_cover',
            'pressure_msl',
            'wind_speed_10m',
            'wind_direction_10m',
            'visibility'
        ].join(','),
        hourly: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'precipitation_probability',
            'precipitation',
            'weather_code',
            'uv_index',
            'wind_speed_10m',
            'is_day'
        ].join(','),
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'sunrise',
            'sunset',
            'daylight_duration',
            'uv_index_max',
            'precipitation_sum',
            'precipitation_probability_max',
            'wind_speed_10m_max'
        ].join(','),
        timezone: timezone,
        forecast_days: 7
    });

    const url = `${CONFIG.WEATHER_API}?${params.toString()}`;

    const res = await fetch(url, { signal: state.weatherAbortController.signal });
    if (!res.ok) throw new Error(`Weather API error HTTP ${res.status}`);
    return await res.json();
}

/**
 * Fetch air quality parameters from Open-Meteo Air Quality endpoint
 */
async function fetchAirQuality(lat, lon, timezone = 'auto') {
    const params = new URLSearchParams({
        latitude: Number(lat),
        longitude: Number(lon),
        current: [
            'european_aqi',
            'us_aqi',
            'pm10',
            'pm2_5',
            'carbon_monoxide',
            'nitrogen_dioxide',
            'sulphur_dioxide',
            'ozone',
            'uv_index'
        ].join(','),
        timezone: timezone
    });

    const url = `${CONFIG.AIR_QUALITY_API}?${params.toString()}`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn('Air quality telemetry not available:', err);
        return null;
    }
}

/**
 * Reverse geocoding for GPS coordinates
 */
async function reverseGeocodeCoords(lat, lon) {
    try {
        const url = `${CONFIG.REVERSE_GEO_API}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const cityName = data.city || data.locality || data.principalSubdivision || 'Your Location';
            const country = data.countryName || '';
            const region = data.principalSubdivision || '';
            return {
                name: cityName,
                country: country,
                region: region,
                latitude: lat,
                longitude: lon,
                timezone: 'auto'
            };
        }
    } catch (e) {
        // Fallback below
    }

    return {
        name: 'Current Location',
        country: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
        region: 'GPS Telemetry',
        latitude: lat,
        longitude: lon,
        timezone: 'auto'
    };
}

/* ----------------------------------------------------------------------------
   8. UI RENDERING PIPELINE
   ---------------------------------------------------------------------------- */

/**
 * Set and switch theme (Dark / Light)
 */
function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    safeStorageSet(CONFIG.STORAGE_KEYS.THEME, theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0e17' : '#f1f5f9');
    }
}

/**
 * Update the background atmospheric canvas class
 */
function updateAtmosphereTheme(conditionInfo) {
    const body = document.body;
    const classes = [
        'weather-theme-default',
        'weather-theme-clear-day',
        'weather-theme-clear-night',
        'weather-theme-cloudy',
        'weather-theme-rainy',
        'weather-theme-snowy',
        'weather-theme-thunderstorm',
        'weather-theme-foggy'
    ];
    body.classList.remove(...classes);
    body.classList.add(conditionInfo.themeClass || 'weather-theme-default');
}

/**
 * Render the primary hero weather card
 */
function renderHeroCard() {
    const { weather, location } = state;
    if (!weather || !weather.current) return;

    const current = weather.current;
    const daily = weather.daily || {};
    const conditionInfo = interpretWmoCode(current.weather_code, current.is_day);

    // Apply atmospheric theme
    updateAtmosphereTheme(conditionInfo);

    // Location info
    const cityEl = document.getElementById('city');
    const countryRegionEl = document.getElementById('countryRegion');
    const coordsPillEl = document.getElementById('coordsPill');
    const timezoneBadgeEl = document.getElementById('timezoneBadge');

    if (cityEl) cityEl.textContent = location.name;
    if (countryRegionEl) {
        const parts = [location.region, location.country].filter(Boolean);
        countryRegionEl.textContent = parts.join(', ');
    }
    if (coordsPillEl) {
        const latText = `${Math.abs(location.latitude).toFixed(2)}° ${location.latitude >= 0 ? 'N' : 'S'}`;
        const lonText = `${Math.abs(location.longitude).toFixed(2)}° ${location.longitude >= 0 ? 'E' : 'W'}`;
        coordsPillEl.textContent = `${latText}, ${lonText}`;
    }
    if (timezoneBadgeEl) {
        timezoneBadgeEl.textContent = weather.timezone_abbreviation ? `Zone: ${weather.timezone_abbreviation}` : weather.timezone;
    }

    // Weather condition and icon
    const conditionEl = document.getElementById('condition');
    const heroWeatherIconEl = document.getElementById('heroWeatherIcon');
    if (conditionEl) conditionEl.textContent = conditionInfo.text;
    if (heroWeatherIconEl) heroWeatherIconEl.innerHTML = conditionInfo.icon;

    // Primary Temperature
    const tempEl = document.getElementById('temp');
    if (tempEl) tempEl.textContent = formatTemperatureFull(current.temperature_2m);

    // Feels like
    const feelsLikeEl = document.getElementById('feelsLikeValue');
    if (feelsLikeEl) feelsLikeEl.textContent = formatTemperatureFull(current.apparent_temperature);

    // High and Low for today
    const heroHighLowEl = document.getElementById('heroHighLow');
    if (heroHighLowEl && daily.temperature_2m_max && daily.temperature_2m_min) {
        const high = formatTemperature(daily.temperature_2m_max[0]);
        const low = formatTemperature(daily.temperature_2m_min[0]);
        heroHighLowEl.textContent = `H: ${high} • L: ${low}`;
    }

    // Precipitation summary
    const heroPrecipSummaryEl = document.getElementById('heroPrecipSummary');
    if (heroPrecipSummaryEl && daily.precipitation_sum && daily.precipitation_probability_max) {
        const sum = daily.precipitation_sum[0] !== undefined ? daily.precipitation_sum[0] : 0;
        const prob = daily.precipitation_probability_max[0] !== undefined ? daily.precipitation_probability_max[0] : 0;
        heroPrecipSummaryEl.textContent = `${sum} mm (${prob}%)`;
    }

    // Timestamp
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastUpdatedEl.textContent = `Updated at ${timeStr}`;
    }

    // Favorite status button
    updateFavoriteButtonState();
}

/**
 * Render 24-hour hourly forecast timeline and SVG chart
 */
function renderHourlyForecast() {
    const { weather } = state;
    if (!weather || !weather.hourly) return;

    const hourly = weather.hourly;
    const timelineEl = document.getElementById('hourlyTimeline');
    if (!timelineEl) return;

    timelineEl.innerHTML = '';

    // Find starting hour corresponding to current local hour
    const currentTimeStr = weather.current.time;
    let startIndex = 0;
    if (currentTimeStr && hourly.time) {
        const idx = hourly.time.findIndex(t => t >= currentTimeStr);
        if (idx !== -1) startIndex = idx;
    }

    const next24 = [];
    const count = Math.min(24, hourly.time.length - startIndex);

    for (let i = 0; i < count; i++) {
        const index = startIndex + i;
        const timeVal = hourly.time[index];
        const tempVal = hourly.temperature_2m[index];
        const codeVal = hourly.weather_code[index];
        const isDayVal = hourly.is_day[index];
        const precipProb = hourly.precipitation_probability ? hourly.precipitation_probability[index] : 0;

        const dateObj = new Date(timeVal);
        let timeLabel = i === 0 ? 'Now' : dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });

        const cond = interpretWmoCode(codeVal, isDayVal);

        next24.push({
            timeLabel,
            timeVal,
            temp: tempVal,
            code: codeVal,
            cond,
            precipProb: precipProb || 0
        });

        // DOM element
        const itemEl = document.createElement('div');
        itemEl.className = `hourly-item ${i === 0 ? 'current-hour' : ''}`;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'hourly-time';
        timeSpan.textContent = timeLabel;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'hourly-icon';
        iconDiv.innerHTML = cond.icon;

        const tempSpan = document.createElement('span');
        tempSpan.className = 'hourly-temp';
        tempSpan.textContent = formatTemperature(tempVal);

        const precipDiv = document.createElement('div');
        precipDiv.className = 'hourly-precip';
        if (precipProb > 5) {
            precipDiv.innerHTML = `${SVG_ICONS.drop}<span>${precipProb}%</span>`;
        } else {
            precipDiv.innerHTML = `<span>&nbsp;</span>`;
        }

        itemEl.appendChild(timeSpan);
        itemEl.appendChild(iconDiv);
        itemEl.appendChild(tempSpan);
        itemEl.appendChild(precipDiv);

        timelineEl.appendChild(itemEl);
    }

    // Render interactive SVG Chart
    renderSvgTrendChart(next24);
}

/**
 * Render Interactive SVG Trend Chart
 */
function renderSvgTrendChart(hours) {
    const svgEl = document.getElementById('temperatureChartSvg');
    const tooltipEl = document.getElementById('chartTooltip');
    const wrapperEl = document.getElementById('svgChartWrapper');
    if (!svgEl || hours.length < 2) return;

    const width = 800;
    const height = 220;
    const padding = { top: 30, right: 30, bottom: 45, left: 30 };

    const temps = hours.map(h => state.units.temp === 'F' ? (h.temp * 9 / 5) + 32 : h.temp);
    const minTemp = Math.floor(Math.min(...temps) - 2);
    const maxTemp = Math.ceil(Math.max(...temps) + 2);
    const tempRange = Math.max(1, maxTemp - minTemp);

    const stepX = (width - padding.left - padding.right) / (hours.length - 1);

    const points = hours.map((h, i) => {
        const x = padding.left + i * stepX;
        const currentT = state.units.temp === 'F' ? (h.temp * 9 / 5) + 32 : h.temp;
        const y = padding.top + (1 - (currentT - minTemp) / tempRange) * (height - padding.top - padding.bottom);
        return { x, y, hour: h, displayTemp: currentT };
    });

    // Create smooth SVG cubic spline path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = (p0.x + p1.x) / 2;
        pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    // Construct SVG Elements
    svgEl.innerHTML = `
        <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--chart-line)" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="var(--chart-line)" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="var(--accent-weather)"/>
                <stop offset="100%" stop-color="#38bdf8"/>
            </linearGradient>
        </defs>

        <!-- Horizontal Guide Lines -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="var(--chart-grid)" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="var(--chart-grid)" stroke-width="1" />

        <!-- Area Fill -->
        <path d="${areaD}" fill="url(#chartAreaGrad)" />

        <!-- Line Stroke -->
        <path d="${pathD}" fill="none" stroke="url(#chartLineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Precipitation Bars at bottom -->
        ${points.map((p) => {
            const barH = (p.hour.precipProb / 100) * 35;
            const barY = height - padding.bottom - barH;
            return `<rect x="${p.x - 4}" y="${barY}" width="8" height="${barH}" rx="2" fill="#38bdf8" opacity="0.3" />`;
        }).join('')}

        <!-- Interactive Data Circles -->
        ${points.map((p, i) => `
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--bg-page)" stroke="var(--chart-line)" stroke-width="2" class="chart-point" data-index="${i}" />
            <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="var(--text-primary)" font-size="11" font-weight="700">${Math.round(p.displayTemp)}°</text>
            <text x="${p.x}" y="${height - 15}" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-weight="500">${p.hour.timeLabel}</text>
        `).join('')}

        <!-- Vertical Hover Guide -->
        <line id="chartHoverGuide" x1="0" y1="${padding.top}" x2="0" y2="${height - padding.bottom}" stroke="var(--accent-weather)" stroke-width="1.5" stroke-dasharray="3 3" style="display:none;" />
    `;

    // Interactive Hover Tracking
    if (wrapperEl) {
        wrapperEl.onmousemove = (e) => {
            const rect = wrapperEl.getBoundingClientRect();
            const relX = (e.clientX - rect.left) * (width / rect.width);

            let closest = points[0];
            let minDist = Math.abs(relX - points[0].x);
            for (let p of points) {
                const dist = Math.abs(relX - p.x);
                if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                }
            }

            const guide = document.getElementById('chartHoverGuide');
            if (guide) {
                guide.setAttribute('x1', closest.x);
                guide.setAttribute('x2', closest.x);
                guide.style.display = 'block';
            }

            if (tooltipEl) {
                const screenX = (closest.x / width) * rect.width;
                const screenY = (closest.y / height) * rect.height;
                tooltipEl.textContent = `${closest.hour.timeLabel}: ${Math.round(closest.displayTemp)}°${state.units.temp} • ${closest.hour.cond.text} (${closest.hour.precipProb}% rain)`;
                tooltipEl.style.left = `${screenX}px`;
                tooltipEl.style.top = `${screenY}px`;
                tooltipEl.hidden = false;
                tooltipEl.style.display = 'block';
            }
        };

        wrapperEl.onmouseleave = () => {
            const guide = document.getElementById('chartHoverGuide');
            if (guide) guide.style.display = 'none';
            if (tooltipEl) {
                tooltipEl.hidden = true;
                tooltipEl.style.display = 'none';
            }
        };
    }
}

/**
 * Render 8 Atmospheric Metrics Glass Cards
 */
function renderAtmosphericMetrics() {
    const { weather } = state;
    if (!weather || !weather.current) return;

    const current = weather.current;
    const daily = weather.daily || {};

    // 1. Wind & Compass
    const windSpeedEl = document.getElementById('windSpeedVal');
    const windSpeedUnitEl = document.getElementById('windSpeedUnit');
    const windDirectionValEl = document.getElementById('windDirectionVal');
    const compassNeedleEl = document.getElementById('compassNeedle');

    const windData = formatWindSpeed(current.wind_speed_10m);
    if (windSpeedEl) windSpeedEl.textContent = windData.value;
    if (windSpeedUnitEl) windSpeedUnitEl.textContent = windData.unit;

    const cardinal = degreesToCardinal(current.wind_direction_10m);
    if (windDirectionValEl) {
        windDirectionValEl.textContent = `${cardinal} (${current.wind_direction_10m ?? 0}°)`;
    }
    if (compassNeedleEl && current.wind_direction_10m !== undefined) {
        compassNeedleEl.style.transform = `rotate(${current.wind_direction_10m}deg)`;
    }

    // 2. Humidity & Progress
    const humidityValEl = document.getElementById('humidityVal');
    const humidityProgressEl = document.getElementById('humidityProgress');
    const humidityCommentEl = document.getElementById('humidityComment');

    const hum = current.relative_humidity_2m ?? 0;
    if (humidityValEl) humidityValEl.textContent = `${hum}%`;
    if (humidityProgressEl) humidityProgressEl.style.width = `${Math.min(100, Math.max(0, hum))}%`;

    if (humidityCommentEl) {
        if (hum < 30) humidityCommentEl.textContent = 'Dry ambient air';
        else if (hum <= 65) humidityCommentEl.textContent = 'Comfortable moisture level';
        else if (hum <= 80) humidityCommentEl.textContent = 'Humid & moist air';
        else humidityCommentEl.textContent = 'Very saturated moisture';
    }

    // 3. Pressure
    const pressureValEl = document.getElementById('pressureVal');
    const pressureMarkerEl = document.getElementById('pressureMarker');
    const p = current.pressure_msl ?? 1013;
    if (pressureValEl) {
        pressureValEl.innerHTML = `${Math.round(p)} <span class="metric-unit-inline">hPa</span>`;
    }
    if (pressureMarkerEl) {
        const normalized = ((p - 970) / (1050 - 970)) * 100;
        pressureMarkerEl.style.left = `${Math.min(95, Math.max(5, normalized))}%`;
    }

    // 4. UV Index
    const uvIndexValEl = document.getElementById('uvIndexVal');
    const uvBadgeEl = document.getElementById('uvBadge');
    const uvGuidanceEl = document.getElementById('uvGuidance');

    let uvVal = 0;
    if (daily.uv_index_max && daily.uv_index_max[0] !== undefined) {
        uvVal = daily.uv_index_max[0];
    }

    if (uvIndexValEl) uvIndexValEl.textContent = Number(uvVal).toFixed(1);

    if (uvBadgeEl && uvGuidanceEl) {
        if (uvVal <= 2) {
            uvBadgeEl.textContent = 'Low';
            uvBadgeEl.style.background = 'rgba(16, 185, 129, 0.2)';
            uvBadgeEl.style.color = '#10b981';
            uvGuidanceEl.textContent = 'Minimal protection needed';
        } else if (uvVal <= 5) {
            uvBadgeEl.textContent = 'Moderate';
            uvBadgeEl.style.background = 'rgba(245, 158, 11, 0.2)';
            uvBadgeEl.style.color = '#f59e0b';
            uvGuidanceEl.textContent = 'Wear sunscreen & shade';
        } else if (uvVal <= 7) {
            uvBadgeEl.textContent = 'High';
            uvBadgeEl.style.background = 'rgba(249, 115, 22, 0.2)';
            uvBadgeEl.style.color = '#f97316';
            uvGuidanceEl.textContent = 'Sun protection required';
        } else if (uvVal <= 10) {
            uvBadgeEl.textContent = 'Very High';
            uvBadgeEl.style.background = 'rgba(239, 68, 68, 0.2)';
            uvBadgeEl.style.color = '#ef4444';
            uvGuidanceEl.textContent = 'Take extra precautions';
        } else {
            uvBadgeEl.textContent = 'Extreme';
            uvBadgeEl.style.background = 'rgba(168, 85, 247, 0.2)';
            uvBadgeEl.style.color = '#a855f7';
            uvGuidanceEl.textContent = 'Avoid prolonged sun exposure';
        }
    }

    // 5. Cloud Cover
    const cloudCoverValEl = document.getElementById('cloudCoverVal');
    const cloudCoverProgressEl = document.getElementById('cloudCoverProgress');
    const cloudCoverDescEl = document.getElementById('cloudCoverDesc');

    const cc = current.cloud_cover ?? 0;
    if (cloudCoverValEl) cloudCoverValEl.textContent = `${cc}%`;
    if (cloudCoverProgressEl) cloudCoverProgressEl.style.width = `${cc}%`;
    if (cloudCoverDescEl) {
        if (cc < 10) cloudCoverDescEl.textContent = 'Clear open sky';
        else if (cc <= 40) cloudCoverDescEl.textContent = 'Scattered clouds';
        else if (cc <= 75) cloudCoverDescEl.textContent = 'Broken cloud layer';
        else cloudCoverDescEl.textContent = 'Dense cloud ceiling';
    }

    // 6. Visibility
    const visibilityValEl = document.getElementById('visibilityVal');
    const visibilityQualityEl = document.getElementById('visibilityQuality');
    const vis = formatVisibility(current.visibility);

    if (visibilityValEl) {
        visibilityValEl.innerHTML = `${vis.value} <span class="metric-unit-inline">${vis.unit}</span>`;
    }
    if (visibilityQualityEl) {
        const meters = current.visibility ?? 10000;
        if (meters >= 10000) visibilityQualityEl.textContent = 'Clear visual horizon';
        else if (meters >= 5000) visibilityQualityEl.textContent = 'Moderate visibility';
        else if (meters >= 1000) visibilityQualityEl.textContent = 'Mist or haze';
        else visibilityQualityEl.textContent = 'Dense fog alert';
    }

    // 7. Precipitation
    const precipSumValEl = document.getElementById('precipSumVal');
    const precipProbValEl = document.getElementById('precipProbVal');

    const precipToday = daily.precipitation_sum && daily.precipitation_sum[0] !== undefined ? daily.precipitation_sum[0] : 0;
    const precipProbMax = daily.precipitation_probability_max && daily.precipitation_probability_max[0] !== undefined ? daily.precipitation_probability_max[0] : 0;

    if (precipSumValEl) {
        precipSumValEl.innerHTML = `${precipToday.toFixed(1)} <span class="metric-unit-inline">mm</span>`;
    }
    if (precipProbValEl) {
        precipProbValEl.textContent = `Max chance today: ${precipProbMax}%`;
    }

    // 8. Thermal Perception Difference
    const apparentDiffValEl = document.getElementById('apparentDiffVal');
    const apparentSummaryEl = document.getElementById('apparentSummary');

    if (apparentDiffValEl && apparentSummaryEl && current.temperature_2m !== undefined && current.apparent_temperature !== undefined) {
        const diff = current.apparent_temperature - current.temperature_2m;
        if (Math.abs(diff) < 0.8) {
            apparentDiffValEl.textContent = 'Matches Air';
            apparentSummaryEl.textContent = 'Wind chill and humidity effects are currently balanced.';
        } else if (diff > 0) {
            apparentDiffValEl.textContent = `Feels Warmer`;
            apparentSummaryEl.textContent = `High moisture is elevating the heat index by +${Math.round(diff)}°.`;
        } else {
            apparentDiffValEl.textContent = `Feels Cooler`;
            apparentSummaryEl.textContent = `Brisk airflow is lowering perceived temperature by ${Math.round(diff)}°.`;
        }
    }
}

/**
 * Render Air Quality Index and Particulates telemetry
 */
function renderAirQuality() {
    const { airQuality } = state;
    const aqiNumberEl = document.getElementById('aqiNumber');
    const aqiBadgeLevelEl = document.getElementById('aqiBadgeLevel');
    const aqiDescriptorEl = document.getElementById('aqiDescriptor');
    const aqiPinMarkerEl = document.getElementById('aqiPinMarker');

    // If Air Quality is unavailable for this region
    if (!airQuality || !airQuality.current) {
        if (aqiNumberEl) aqiNumberEl.textContent = '--';
        if (aqiBadgeLevelEl) {
            aqiBadgeLevelEl.textContent = 'Not Reporting';
            aqiBadgeLevelEl.style.color = 'var(--text-muted)';
        }
        if (aqiDescriptorEl) aqiDescriptorEl.textContent = 'Environmental sensors are not broadcasting for this geographical station.';
        if (aqiPinMarkerEl) aqiPinMarkerEl.style.left = '0%';

        ['pm25Val', 'pm10Val', 'no2Val', 'o3Val', 'so2Val', 'coVal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'N/A';
        });
        ['pm25Status', 'pm10Status', 'no2Status', 'o3Status', 'so2Status', 'coStatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = 'Unavailable';
                el.style.color = 'var(--text-muted)';
            }
        });
        return;
    }

    const current = airQuality.current;
    const eaqi = current.european_aqi ?? current.us_aqi ?? null;

    if (aqiNumberEl && eaqi !== null) {
        aqiNumberEl.textContent = eaqi;

        let level = 'Good';
        let desc = 'Air quality is satisfactory with negligible particulate risk.';
        let pct = 15;
        let color = '#10b981';

        if (eaqi <= 20) {
            level = 'Good';
            desc = 'Air quality is considered satisfactory; air pollution poses little or no health risk.';
            pct = 12;
            color = '#10b981';
        } else if (eaqi <= 40) {
            level = 'Fair';
            desc = 'Air quality is acceptable; however, sensitive groups may experience minor effects.';
            pct = 32;
            color = '#84cc16';
        } else if (eaqi <= 60) {
            level = 'Moderate';
            desc = 'Air quality is acceptable; respiratory-sensitive individuals should monitor outdoor exposure.';
            pct = 54;
            color = '#f59e0b';
        } else if (eaqi <= 80) {
            level = 'Poor';
            desc = 'Pollution levels may cause discomfort for vulnerable groups and children.';
            pct = 75;
            color = '#ef4444';
        } else {
            level = 'Very Poor';
            desc = 'General population is likely to be affected. Outdoor physical exertion should be reduced.';
            pct = 95;
            color = '#7f1d1d';
        }

        if (aqiBadgeLevelEl) {
            aqiBadgeLevelEl.textContent = level;
            aqiBadgeLevelEl.style.color = color;
        }
        if (aqiDescriptorEl) aqiDescriptorEl.textContent = desc;
        if (aqiPinMarkerEl) aqiPinMarkerEl.style.left = `${pct}%`;
    }

    // Specific Pollutants
    const updatePollutant = (id, statusId, val, unit, limits) => {
        const valEl = document.getElementById(id);
        const statusEl = document.getElementById(statusId);
        if (!valEl) return;

        if (val === null || val === undefined) {
            valEl.textContent = 'N/A';
            if (statusEl) {
                statusEl.textContent = 'Sensor unavailable';
                statusEl.style.color = 'var(--text-muted)';
            }
            return;
        }

        valEl.textContent = `${Number(val).toFixed(1)} ${unit}`;

        if (statusEl) {
            if (val <= limits.good) {
                statusEl.textContent = 'Optimal';
                statusEl.style.color = '#10b981';
            } else if (val <= limits.moderate) {
                statusEl.textContent = 'Acceptable';
                statusEl.style.color = '#f59e0b';
            } else {
                statusEl.textContent = 'Elevated';
                statusEl.style.color = '#ef4444';
            }
        }
    };

    updatePollutant('pm25Val', 'pm25Status', current.pm2_5, 'μg/m³', { good: 10, moderate: 25 });
    updatePollutant('pm10Val', 'pm10Status', current.pm10, 'μg/m³', { good: 20, moderate: 50 });
    updatePollutant('no2Val', 'no2Status', current.nitrogen_dioxide, 'μg/m³', { good: 40, moderate: 100 });
    updatePollutant('o3Val', 'o3Status', current.ozone, 'μg/m³', { good: 60, moderate: 120 });
    updatePollutant('so2Val', 'so2Status', current.sulphur_dioxide, 'μg/m³', { good: 100, moderate: 250 });
    updatePollutant('coVal', 'coStatus', current.carbon_monoxide, 'μg/m³', { good: 500, moderate: 1500 });
}

/**
 * Render Sun Horizon arc & Daylight tracking
 */
function renderCelestialCycle() {
    const { weather } = state;
    if (!weather || !weather.daily) return;

    const daily = weather.daily;
    const sunriseStr = daily.sunrise ? daily.sunrise[0] : null;
    const sunsetStr = daily.sunset ? daily.sunset[0] : null;
    const daylightSecs = daily.daylight_duration ? daily.daylight_duration[0] : null;

    const sunriseTimeEl = document.getElementById('sunriseTime');
    const sunsetTimeEl = document.getElementById('sunsetTime');
    const daylightDurationPillEl = document.getElementById('daylightDurationPill');
    const solarPhaseTextEl = document.getElementById('solarPhaseText');
    const sunMarkerGroupEl = document.getElementById('sunMarkerGroup');
    const sunProgressArcEl = document.getElementById('sunProgressArc');

    if (!sunriseStr || !sunsetStr) return;

    const sunriseDate = new Date(sunriseStr);
    const sunsetDate = new Date(sunsetStr);

    if (sunriseTimeEl) {
        sunriseTimeEl.textContent = sunriseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (sunsetTimeEl) {
        sunsetTimeEl.textContent = sunsetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Daylight duration
    if (daylightDurationPillEl && daylightSecs) {
        const hrs = Math.floor(daylightSecs / 3600);
        const mins = Math.floor((daylightSecs % 3600) / 60);
        daylightDurationPillEl.textContent = `${hrs} hrs ${mins} mins Daylight`;
    }

    // Solar Phase and Sun Position on Arc
    const now = new Date();
    const totalDaylightMs = sunsetDate.getTime() - sunriseDate.getTime();
    const elapsedMs = now.getTime() - sunriseDate.getTime();
    let progressRatio = elapsedMs / totalDaylightMs;

    if (progressRatio < 0) {
        if (solarPhaseTextEl) solarPhaseTextEl.textContent = 'Sun is below horizon (Pre-Dawn)';
        progressRatio = 0;
    } else if (progressRatio > 1) {
        if (solarPhaseTextEl) solarPhaseTextEl.textContent = 'Sun has set for today (Dusk)';
        progressRatio = 1;
    } else {
        if (solarPhaseTextEl) solarPhaseTextEl.textContent = 'Sun is currently above horizon';
    }

    const angle = Math.PI - (progressRatio * Math.PI);
    const sunX = 160 + 130 * Math.cos(angle);
    const sunY = 140 - 110 * Math.sin(angle);

    if (sunMarkerGroupEl) {
        sunMarkerGroupEl.setAttribute('transform', `translate(${sunX.toFixed(1)}, ${sunY.toFixed(1)})`);
    }

    if (sunProgressArcEl) {
        sunProgressArcEl.setAttribute('d', `M 30 140 A 130 110 0 0 1 ${sunX.toFixed(1)} ${sunY.toFixed(1)}`);
    }
}

/**
 * Render 7-Day Extended Forecast with Apple Weather style range bars
 */
function renderDailyForecast() {
    const { weather } = state;
    if (!weather || !weather.daily) return;

    const daily = weather.daily;
    const container = document.getElementById('dailyForecastList');
    if (!container || !daily.time) return;

    container.innerHTML = '';

    const allMins = daily.temperature_2m_min.map(t => state.units.temp === 'F' ? (t * 9 / 5) + 32 : t);
    const allMaxs = daily.temperature_2m_max.map(t => state.units.temp === 'F' ? (t * 9 / 5) + 32 : t);
    const weekMin = Math.min(...allMins);
    const weekMax = Math.max(...allMaxs);
    const weekRange = Math.max(1, weekMax - weekMin);

    const currentTempNormalized = state.units.temp === 'F' && weather.current
        ? (weather.current.temperature_2m * 9 / 5) + 32
        : (weather.current ? weather.current.temperature_2m : null);

    const daysCount = Math.min(7, daily.time.length);

    for (let i = 0; i < daysCount; i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr + 'T00:00:00');
        const code = daily.weather_code[i];
        const minTemp = allMins[i];
        const maxTemp = allMaxs[i];
        const precipProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

        let dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString([], { weekday: 'short' });
        const monthDay = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

        const cond = interpretWmoCode(code, 1);

        const barLeftPct = ((minTemp - weekMin) / weekRange) * 100;
        const barWidthPct = Math.max(4, ((maxTemp - minTemp) / weekRange) * 100);

        let currentMarkerHtml = '';
        if (i === 0 && currentTempNormalized !== null) {
            const markerPct = Math.min(100, Math.max(0, ((currentTempNormalized - weekMin) / weekRange) * 100));
            currentMarkerHtml = `<div class="daily-current-marker" style="left: ${markerPct.toFixed(1)}%;" title="Current: ${Math.round(currentTempNormalized)}°"></div>`;
        }

        const rowEl = document.createElement('div');
        rowEl.className = `daily-row ${i === 0 ? 'today-row' : ''}`;

        rowEl.innerHTML = `
            <div class="daily-day-block">
                <span class="daily-day-name">${dayName}</span>
                <span class="daily-date">${monthDay}</span>
            </div>

            <div class="daily-condition-block">
                <div class="daily-weather-icon" title="${cond.text}">
                    ${cond.icon}
                </div>
                <span class="daily-condition-text">${cond.text}</span>
                ${precipProb > 15 ? `
                    <div class="daily-precip-badge">
                        ${SVG_ICONS.drop}
                        <span>${precipProb}%</span>
                    </div>
                ` : ''}
            </div>

            <div class="daily-temp-bar-block">
                <span class="daily-min-temp">${Math.round(minTemp)}°</span>
                <div class="daily-range-track">
                    <div class="daily-range-fill" style="left: ${barLeftPct.toFixed(1)}%; width: ${barWidthPct.toFixed(1)}%;"></div>
                    ${currentMarkerHtml}
                </div>
                <span class="daily-max-temp">${Math.round(maxTemp)}°</span>
            </div>
        `;

        container.appendChild(rowEl);
    }
}

/**
 * Update UI across all sections when units or weather changes
 */
function renderAllWeatherViews() {
    renderHeroCard();
    renderHourlyForecast();
    renderAtmosphericMetrics();
    renderAirQuality();
    renderCelestialCycle();
    renderDailyForecast();
}

/* ----------------------------------------------------------------------------
   9. FAVORITES & HISTORY MANAGEMENT
   ---------------------------------------------------------------------------- */
function initFavorites() {
    let saved = safeStorageGet(CONFIG.STORAGE_KEYS.FAVORITES);
    if (!saved || !Array.isArray(saved) || saved.length === 0) {
        saved = CONFIG.INITIAL_FAVORITES;
        safeStorageSet(CONFIG.STORAGE_KEYS.FAVORITES, saved);
    }
    state.favorites = saved;
    renderFavoritesBar();
}

function renderFavoritesBar() {
    const container = document.getElementById('favoritesChipsContainer');
    const emptyEl = document.getElementById('favoritesEmpty');
    if (!container) return;

    // Remove old chips except empty message
    const oldChips = container.querySelectorAll('.favorite-chip');
    oldChips.forEach(c => c.remove());

    if (state.favorites.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
    }

    if (emptyEl) emptyEl.hidden = true;

    state.favorites.forEach((fav) => {
        const isCurrent = state.location && (
            (fav.name.toLowerCase() === state.location.name.toLowerCase()) ||
            (Math.abs(fav.latitude - state.location.latitude) < 0.05 && Math.abs(fav.longitude - state.location.longitude) < 0.05)
        );

        const chip = document.createElement('div');
        chip.className = `favorite-chip ${isCurrent ? 'active' : ''}`;
        chip.tabIndex = 0;
        chip.setAttribute('role', 'button');
        chip.setAttribute('aria-label', `View weather in ${fav.name}`);

        chip.innerHTML = `
            <span>${fav.name}</span>
            <button type="button" class="fav-remove-btn" aria-label="Remove ${fav.name} from favorites">&times;</button>
        `;

        chip.onclick = (e) => {
            if (e.target.classList.contains('fav-remove-btn')) {
                e.stopPropagation();
                removeFavorite(fav);
            } else {
                selectLocation(fav);
            }
        };

        chip.onkeydown = (e) => {
            if (e.key === 'Enter') selectLocation(fav);
        };

        container.appendChild(chip);
    });
}

function updateFavoriteButtonState() {
    const favBtn = document.getElementById('favToggleBtn');
    if (!favBtn || !state.location) return;

    const isFav = state.favorites.some(f => 
        f.name.toLowerCase() === state.location.name.toLowerCase() ||
        (Math.abs(f.latitude - state.location.latitude) < 0.05 && Math.abs(f.longitude - state.location.longitude) < 0.05)
    );

    if (isFav) {
        favBtn.classList.add('saved');
        favBtn.setAttribute('title', 'Remove from favorites');
        favBtn.setAttribute('aria-label', `Remove ${state.location.name} from favorites`);
    } else {
        favBtn.classList.remove('saved');
        favBtn.setAttribute('title', 'Save to favorites');
        favBtn.setAttribute('aria-label', `Save ${state.location.name} to favorites`);
    }
}

function toggleCurrentFavorite() {
    if (!state.location) return;

    const index = state.favorites.findIndex(f => 
        f.name.toLowerCase() === state.location.name.toLowerCase() ||
        (Math.abs(f.latitude - state.location.latitude) < 0.05 && Math.abs(f.longitude - state.location.longitude) < 0.05)
    );

    if (index >= 0) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.unshift({
            name: state.location.name,
            country: state.location.country,
            region: state.location.region,
            latitude: state.location.latitude,
            longitude: state.location.longitude,
            timezone: state.location.timezone
        });
    }

    safeStorageSet(CONFIG.STORAGE_KEYS.FAVORITES, state.favorites);
    renderFavoritesBar();
    updateFavoriteButtonState();
}

function removeFavorite(favToRemove) {
    state.favorites = state.favorites.filter(f => f.name !== favToRemove.name);
    safeStorageSet(CONFIG.STORAGE_KEYS.FAVORITES, state.favorites);
    renderFavoritesBar();
    updateFavoriteButtonState();
}

/* ----------------------------------------------------------------------------
   10. MAIN LOCATION SELECTION & WEATHER DISPATCHER
   ---------------------------------------------------------------------------- */
async function selectLocation(loc) {
    if (!loc) return;

    dismissAlert();
    hideError();
    showLoading(true);

    state.location = loc;
    safeStorageSet(CONFIG.STORAGE_KEYS.LAST_LOCATION, loc);

    try {
        // 1. Fetch live meteorological forecast
        const weatherData = await fetchWeatherForecast(loc.latitude, loc.longitude, loc.timezone || 'auto');
        state.weather = weatherData;
        state.lastFetchTimestamp = Date.now();

        // 2. Fetch air quality data non-blockingly (failure never breaks the forecast)
        try {
            state.airQuality = await fetchAirQuality(loc.latitude, loc.longitude, loc.timezone || 'auto');
        } catch (aqiErr) {
            console.warn('Air quality telemetry unavailable for coordinates:', aqiErr);
            state.airQuality = null;
        }

        renderAllWeatherViews();
        renderFavoritesBar();
        hideError();
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load atmospheric intelligence:', err);
        showError(
            'Weather Telemetry Error',
            `Unable to retrieve real-time weather observations for ${loc.name || 'the selected location'}. Please verify your network connection and click Try Again.`
        );
        showAlert('Could not retrieve weather data. Please click Try Again.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Global entry point preserving existing `getWeather()` contract
 */
async function getWeather() {
    const input = document.getElementById('cityInput');
    const query = input ? input.value.trim() : '';

    if (!query) {
        showAlert('Please enter a city name to search.', 'info');
        return;
    }

    // Dismiss any open dropdown
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) {
        dropdown.hidden = true;
        dropdown.style.display = 'none';
        dropdown.classList.remove('is-active');
    }
    if (input) input.setAttribute('aria-expanded', 'false');

    const spinner = document.getElementById('searchSpinner');
    if (spinner) {
        spinner.hidden = false;
        spinner.style.display = 'block';
        spinner.classList.add('is-active');
    }

    showLoading(true);
    hideError();

    try {
        const results = await searchLocations(query);
        if (results && results.length > 0) {
            const first = results[0];
            const loc = {
                name: first.name,
                country: first.country || '',
                region: first.admin1 || '',
                latitude: first.latitude,
                longitude: first.longitude,
                timezone: first.timezone || 'auto'
            };
            await selectLocation(loc);
            dismissAlert();
        } else {
            showLoading(false);
            showError(
                'City Not Found',
                `No meteorological station or city found matching "${query}". Please check your spelling or search for another location.`
            );
            showAlert(`No location found for "${query}".`, 'error');
        }
    } catch (e) {
        showLoading(false);
        showError(
            'Search Service Unreachable',
            'The city search service is temporarily unreachable. Please check your internet connection and try again.'
        );
        showAlert('Search service unavailable. Please retry.', 'error');
    } finally {
        if (spinner) {
            spinner.hidden = true;
            spinner.style.display = 'none';
            spinner.classList.remove('is-active');
        }
    }
}

/**
 * Legacy support function preserving original `getAllCitiesWeather()` contract
 */
async function getAllCitiesWeather() {
    console.info('Fetching overview for signature cities:', cities);
    for (let city of cities) {
        try {
            const results = await searchLocations(city);
            if (results && results.length > 0) {
                const loc = results[0];
                const weather = await fetchWeatherForecast(loc.latitude, loc.longitude);
                console.log(`📍 ${city} → ${weather.current.temperature_2m}°C`);
            }
        } catch (e) {
            console.warn(`Could not fetch data for ${city}`);
        }
    }
}

/* ----------------------------------------------------------------------------
   11. GEOLOCATION ("USE MY LOCATION") FLOW
   ---------------------------------------------------------------------------- */
function handleUseMyLocation() {
    if (!navigator.geolocation) {
        showAlert('Browser Geolocation is not supported by your device.', 'error');
        return;
    }

    const geoBtn = document.getElementById('geoBtn');
    if (geoBtn) geoBtn.classList.add('loading');

    showAlert('Requesting GPS coordinate permissions...', 'info');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            if (geoBtn) geoBtn.classList.remove('loading');
            dismissAlert();

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const loc = await reverseGeocodeCoords(lat, lon);
                await selectLocation(loc);
            } catch (err) {
                console.warn('Reverse geocoding error:', err);
                await selectLocation({
                    name: 'Current Coordinates',
                    country: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
                    region: 'GPS Telemetry',
                    latitude: lat,
                    longitude: lon,
                    timezone: 'auto'
                });
            }
        },
        (error) => {
            if (geoBtn) geoBtn.classList.remove('loading');
            let msg = 'Geolocation permission denied.';
            if (error.code === error.PERMISSION_DENIED) {
                msg = 'Geolocation access was denied. You can search for your city name manually above.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = 'GPS satellite telemetry is currently unavailable. Please search manually.';
            } else if (error.code === error.TIMEOUT) {
                msg = 'GPS location request timed out. Please search manually.';
            }
            showAlert(msg, 'error');
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

/* ----------------------------------------------------------------------------
   12. AUTOCOMPLETE & SEARCH INTERACTIONS
   ---------------------------------------------------------------------------- */
function setupSearchAutocomplete() {
    const input = document.getElementById('cityInput');
    const dropdown = document.getElementById('searchDropdown');
    const suggestionsList = document.getElementById('suggestionsList');
    const clearBtn = document.getElementById('clearSearchBtn');
    const spinner = document.getElementById('searchSpinner');

    if (!input || !dropdown || !suggestionsList) return;

    let activeIndex = -1;

    const renderSuggestions = (items) => {
        suggestionsList.innerHTML = '';
        activeIndex = -1;

        if (!items || items.length === 0) {
            suggestionsList.innerHTML = `
                <li class="suggestion-empty">
                    <span>No locations matched your search</span>
                </li>
            `;
            dropdown.hidden = false;
            dropdown.style.display = 'block';
            dropdown.classList.add('is-active');
            input.setAttribute('aria-expanded', 'true');
            return;
        }

        items.forEach((item, idx) => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.setAttribute('role', 'option');
            li.setAttribute('id', `suggestion-${idx}`);

            const regionParts = [item.admin1, item.country].filter(Boolean).join(', ');

            li.innerHTML = `
                <div class="suggestion-main">
                    <span class="suggestion-city">${item.name}</span>
                    <span class="suggestion-country">${regionParts}</span>
                </div>
                <span class="suggestion-coords">${Math.abs(item.latitude).toFixed(1)}°${item.latitude >= 0 ? 'N' : 'S'}</span>
            `;

            li.onclick = () => {
                input.value = item.name;
                dropdown.hidden = true;
                dropdown.style.display = 'none';
                dropdown.classList.remove('is-active');
                input.setAttribute('aria-expanded', 'false');
                selectLocation({
                    name: item.name,
                    country: item.country || '',
                    region: item.admin1 || '',
                    latitude: item.latitude,
                    longitude: item.longitude,
                    timezone: item.timezone || 'auto'
                });
            };

            suggestionsList.appendChild(li);
        });

        dropdown.hidden = false;
        dropdown.style.display = 'block';
        dropdown.classList.add('is-active');
        input.setAttribute('aria-expanded', 'true');
    };

    // Debounced search on typing
    input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (clearBtn) {
            clearBtn.hidden = val.length === 0;
            clearBtn.style.display = val.length === 0 ? 'none' : 'flex';
            clearBtn.classList.toggle('is-active', val.length > 0);
        }

        clearTimeout(state.searchDebounceTimer);

        if (val.trim().length < 2) {
            dropdown.hidden = true;
            dropdown.style.display = 'none';
            dropdown.classList.remove('is-active');
            input.setAttribute('aria-expanded', 'false');
            if (spinner) {
                spinner.hidden = true;
                spinner.style.display = 'none';
                spinner.classList.remove('is-active');
            }
            return;
        }

        if (spinner) {
            spinner.hidden = false;
            spinner.style.display = 'block';
            spinner.classList.add('is-active');
        }

        state.searchDebounceTimer = setTimeout(async () => {
            const results = await searchLocations(val);
            if (spinner) {
                spinner.hidden = true;
                spinner.style.display = 'none';
                spinner.classList.remove('is-active');
            }
            if (results !== null) {
                renderSuggestions(results);
            }
        }, 280);
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
        const items = suggestionsList.querySelectorAll('.suggestion-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length > 0) {
                activeIndex = (activeIndex + 1) % items.length;
                updateActiveSuggestion(items);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length > 0) {
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                updateActiveSuggestion(items);
            }
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && items[activeIndex]) {
                e.preventDefault();
                items[activeIndex].click();
            } else {
                dropdown.hidden = true;
                dropdown.style.display = 'none';
                dropdown.classList.remove('is-active');
                input.setAttribute('aria-expanded', 'false');
                getWeather();
            }
        } else if (e.key === 'Escape') {
            dropdown.hidden = true;
            dropdown.style.display = 'none';
            dropdown.classList.remove('is-active');
            input.setAttribute('aria-expanded', 'false');
        }
    });

    function updateActiveSuggestion(items) {
        items.forEach((item, idx) => {
            if (idx === activeIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
                input.setAttribute('aria-activedescendant', item.id);
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Clear search button
    if (clearBtn) {
        clearBtn.onclick = () => {
            input.value = '';
            clearBtn.hidden = true;
            clearBtn.style.display = 'none';
            clearBtn.classList.remove('is-active');
            dropdown.hidden = true;
            dropdown.style.display = 'none';
            dropdown.classList.remove('is-active');
            input.setAttribute('aria-expanded', 'false');
            input.focus();
        };
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-module')) {
            dropdown.hidden = true;
            dropdown.style.display = 'none';
            dropdown.classList.remove('is-active');
            input.setAttribute('aria-expanded', 'false');
        }
    });
}

/* ----------------------------------------------------------------------------
   13. EVENT LISTENERS & INITIALIZATION
   ---------------------------------------------------------------------------- */
function setupEventListeners() {
    // Form submission (Enter key and Search button click)
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            getWeather();
        });
    }

    // Geolocation trigger
    const geoBtn = document.getElementById('geoBtn');
    if (geoBtn) geoBtn.onclick = handleUseMyLocation;

    // Refresh weather button
    const refreshBtn = document.getElementById('refreshWeatherBtn');
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            if (state.location) selectLocation(state.location);
        };
    }

    // Favorite toggle button
    const favBtn = document.getElementById('favToggleBtn');
    if (favBtn) favBtn.onclick = toggleCurrentFavorite;

    // Retry button on error panel
    const retryBtn = document.getElementById('errorRetryBtn');
    if (retryBtn) {
        retryBtn.onclick = () => {
            hideError();
            if (state.location) selectLocation(state.location);
            else selectLocation(CONFIG.DEFAULT_LOCATION);
        };
    }

    // Dismiss alert button
    const alertDismissBtn = document.getElementById('alertDismissBtn');
    if (alertDismissBtn) alertDismissBtn.onclick = dismissAlert;

    // Theme toggle button
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(nextTheme);
        };
    }

    // Unit toggle buttons (Celsius / Fahrenheit)
    const celsiusBtn = document.getElementById('unitCelsiusBtn');
    const fahrenheitBtn = document.getElementById('unitFahrenheitBtn');

    if (celsiusBtn && fahrenheitBtn) {
        celsiusBtn.onclick = () => {
            if (state.units.temp === 'C') return;
            state.units.temp = 'C';
            celsiusBtn.classList.add('active');
            celsiusBtn.setAttribute('aria-pressed', 'true');
            fahrenheitBtn.classList.remove('active');
            fahrenheitBtn.setAttribute('aria-pressed', 'false');
            safeStorageSet(CONFIG.STORAGE_KEYS.TEMP_UNIT, 'C');
            renderAllWeatherViews();
        };

        fahrenheitBtn.onclick = () => {
            if (state.units.temp === 'F') return;
            state.units.temp = 'F';
            fahrenheitBtn.classList.add('active');
            fahrenheitBtn.setAttribute('aria-pressed', 'true');
            celsiusBtn.classList.remove('active');
            celsiusBtn.setAttribute('aria-pressed', 'false');
            safeStorageSet(CONFIG.STORAGE_KEYS.TEMP_UNIT, 'F');
            renderAllWeatherViews();
        };
    }

    // Wind unit toggle
    const windUnitBtn = document.getElementById('windUnitBtn');
    const windUnitLabel = document.getElementById('windUnitLabel');
    if (windUnitBtn && windUnitLabel) {
        windUnitBtn.onclick = () => {
            if (state.units.wind === 'kmh') {
                state.units.wind = 'mph';
            } else if (state.units.wind === 'mph') {
                state.units.wind = 'ms';
            } else {
                state.units.wind = 'kmh';
            }
            windUnitLabel.textContent = state.units.wind === 'ms' ? 'm/s' : state.units.wind;
            windUnitBtn.setAttribute('aria-label', `Toggle wind speed unit: currently ${state.units.wind}`);
            safeStorageSet(CONFIG.STORAGE_KEYS.WIND_UNIT, state.units.wind);
            renderAtmosphericMetrics();
        };
    }

    // Hourly Forecast View Toggles (Timeline vs Chart)
    const viewListBtn = document.getElementById('viewHourlyListBtn');
    const viewChartBtn = document.getElementById('viewHourlyChartBtn');
    const timelineWrapper = document.getElementById('hourlyTimelineWrapper');
    const chartContainer = document.getElementById('hourlyChartContainer');

    if (viewListBtn && viewChartBtn && timelineWrapper && chartContainer) {
        viewListBtn.onclick = () => {
            viewListBtn.classList.add('active');
            viewListBtn.setAttribute('aria-selected', 'true');
            viewChartBtn.classList.remove('active');
            viewChartBtn.setAttribute('aria-selected', 'false');
            timelineWrapper.hidden = false;
            timelineWrapper.style.display = 'block';
            chartContainer.hidden = true;
            chartContainer.style.display = 'none';
            state.currentHourlyView = 'timeline';
        };

        viewChartBtn.onclick = () => {
            viewChartBtn.classList.add('active');
            viewChartBtn.setAttribute('aria-selected', 'true');
            viewListBtn.classList.remove('active');
            viewListBtn.setAttribute('aria-selected', 'false');
            timelineWrapper.hidden = true;
            timelineWrapper.style.display = 'none';
            chartContainer.hidden = false;
            chartContainer.style.display = 'block';
            state.currentHourlyView = 'chart';
            // Re-render chart to ensure dimensions
            renderHourlyForecast();
        };
    }

    // Hourly Timeline Scroll Arrows
    const scrollLeftBtn = document.getElementById('hourlyScrollLeft');
    const scrollRightBtn = document.getElementById('hourlyScrollRight');
    const timeline = document.getElementById('hourlyTimeline');

    if (scrollLeftBtn && scrollRightBtn && timeline) {
        scrollLeftBtn.onclick = () => {
            timeline.scrollBy({ left: -240, behavior: 'smooth' });
        };
        scrollRightBtn.onclick = () => {
            timeline.scrollBy({ left: 240, behavior: 'smooth' });
        };
    }

    // Global keyboard shortcut '/' to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const input = document.getElementById('cityInput');
            if (input) {
                input.focus();
                input.select();
            }
        }
    });
}

/**
 * Bootstrap Application
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Restore User Units
    const savedTemp = safeStorageGet(CONFIG.STORAGE_KEYS.TEMP_UNIT, 'C');
    state.units.temp = savedTemp;
    if (savedTemp === 'F') {
        const cBtn = document.getElementById('unitCelsiusBtn');
        const fBtn = document.getElementById('unitFahrenheitBtn');
        if (cBtn && fBtn) {
            cBtn.classList.remove('active');
            fBtn.classList.add('active');
        }
    }

    const savedWind = safeStorageGet(CONFIG.STORAGE_KEYS.WIND_UNIT, 'kmh');
    state.units.wind = savedWind;
    const windUnitLabel = document.getElementById('windUnitLabel');
    if (windUnitLabel) {
        windUnitLabel.textContent = savedWind === 'ms' ? 'm/s' : savedWind;
    }

    // 2. Setup interactive components
    setupSearchAutocomplete();
    setupEventListeners();
    initFavorites();

    // 3. Load initial location (Last visited or Default London)
    const lastLoc = safeStorageGet(CONFIG.STORAGE_KEYS.LAST_LOCATION, CONFIG.DEFAULT_LOCATION);
    selectLocation(lastLoc);
});

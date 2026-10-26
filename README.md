# SkyPulse Weather — Live Weather & Forecast

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)]()
[![API: Open--Meteo](https://img.shields.io/badge/Weather%20Data-Open--Meteo-38bdf8.svg)](https://open-meteo.com/)
[![Stack: Vanilla Web](https://img.shields.io/badge/Architecture-Vanilla%20HTML5%20%7C%20CSS3%20%7C%20ES6+-f59e0b.svg)]()

> **SkyPulse Weather** is an editorial, production-grade weather application featuring live meteorological intelligence, modern glass surfaces, cinematic atmospheric backgrounds, and responsive weather visualizations. Powered directly by Open-Meteo's open APIs without requiring private API keys or secret tokens.

---

## 🌟 Highlights & Key Features

### 1. Global Geocoding & City Search
- **Worldwide Coverage:** Search over 200,000 cities, towns, and regions via the Open-Meteo Geocoding engine.
- **Accessible Autocomplete:** Debounced real-time suggestions dropdown with full keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- **Quick Keyboard Shortcut:** Press `/` anywhere in the app to instantly focus the search bar.
- **Graceful Error States:** Clear messages for misspelled or unavailable locations.

### 2. Geolocation Intelligence
- **"Use My Location":** One-click GPS telemetry request with explicit permission handling.
- **Reverse Geocoding:** Automatically translates GPS coordinates into human-readable city, state, and country names.
- **Polite Denial Fallback:** Helpful guidance and instant fallback to manual search if location access is denied or unavailable.

### 3. Current Atmospheric Conditions
- **High-Contrast Hero Section:** Real-time temperature display with high-visibility typography.
- **Condition Classification:** Complete WMO weather code interpretation with custom vector SVG icons for both day and night states.
- **Comprehensive Metrics:** Feels-like (apparent) temperature, daily highs and lows, relative humidity, wind speed and directional compass rose, barometric pressure, cloud cover percentage, and visual horizon distance.

### 4. Interactive 24-Hour Forecast & Trend Chart
- **Dual View Modes:**
  - **Scrollable Timeline:** 24 hourly cards showing local time, weather icon, temperature, and precipitation chance.
  - **Dynamic SVG Trend Curve:** Smooth cubic bezier spline chart showing 24-hour temperature gradients, precipitation probability volume bars, and an interactive hover tooltip.
- **Timezone Awareness:** All hourly projections strictly respect the selected city's local timezone.

### 5. 7-Day Extended Outlook
- **Apple Weather Style Range Bars:** Dynamic horizontal temperature bars representing each day's minimum and maximum temperatures relative to the full week's range.
- **Live Temperature Indicator:** Real-time marker on today's bar illustrating the current temperature within the day's span.
- **Precipitation Probability Badges:** Clear percentage indicators for rain and snow risks.

### 6. Air Quality Index (AQI) & Particulates
- **European Air Quality Index (EAQI):** Color-coded scale bar and clear qualitative rating (Good, Fair, Moderate, Poor, Very Poor).
- **Comprehensive Pollutant Telemetry:** Live sensor data for **PM2.5**, **PM10**, **NO₂**, **O₃**, **SO₂**, and **CO** in $\mu\text{g/m}^3$.
- **Responsible Environmental Explanations:** Objective descriptions without implying medical certainty.

### 7. Sun Horizon & Celestial Tracking
- **Diurnal Progress Arc:** A visual parabolic arc illustrating the sun's real-time position above or below the horizon based on current local solar time.
- **Daylight Metrics:** Exact sunrise time, sunset time, and calculated total daylight duration.

### 8. Theming & Weather-Adaptive Visual Atmosphere
- **Cinematic Atmosphere:** Lightweight CSS-driven ambient backdrop and subtle particle effects that adapt to conditions (Sunny, Night Clear, Cloudy, Rainy, Snowy, Stormy).
- **Dark & Light Modes:** Deep midnight theme (`#0a0e17`) and soft cloud-white theme (`#f1f5f9`) with instant toggle.
- **Zero Theme Flashing:** Inline anti-flash script preserves and restores the user's preferred theme before initial render.
- **Motion Sensitivity:** Automatically disables particle animations when `prefers-reduced-motion` is detected in system settings.

### 9. Multi-Unit Conversion Engine
- **Temperature:** Instant toggle between Celsius (°C) and Fahrenheit (°F).
- **Wind Speed:** Toggle between `km/h`, `mph`, and `m/s`.
- **True Mathematical Recalculation:** Recomputes all on-screen metrics and chart data instantaneously without making repeated network requests.

### 10. Saved Favorite Locations
- **Favorites Bar:** Quick-access chips to switch between pinned cities with a single click.
- **Persistent Storage:** Saved in `localStorage` across browsing sessions.
- **Preloaded Defaults:** Curated signature locations (London, Tokyo, New York, Mumbai, Paris).

---

## 🛠️ Architecture & Tech Stack

Aether Weather is built with zero heavy frameworks or bloated dependencies. It runs everywhere as a pure, hyper-performant static web application.

- **Markup:** Semantic HTML5 with ARIA landmark roles, accessible live regions, and `role="combobox"` search.
- **Styles:** Modern CSS3 featuring custom properties (variables), CSS Grid, Flexbox, glassmorphic backdrop filters, and responsive typography (`Plus Jakarta Sans` & `Outfit`).
- **Logic:** Modular ES6+ JavaScript with `async/await`, `AbortController` for request cancellation, debounced event streaming, and custom SVG rendering.
- **Graphics:** Handcrafted, scalable SVG vectors with zero external icon font stylesheets to guarantee offline resilience and zero layout shifts.

---

## 📡 API Attribution & Integration

All meteorological data is sourced in real-time from [Open-Meteo](https://open-meteo.com/):

1. **Weather Forecast API:** Provides temperature, humidity, apparent temperature, WMO weather codes, cloud cover, pressure, wind velocity/direction, visibility, and 7-day daily aggregates.
   - Docs: [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)
2. **Geocoding API:** Fast worldwide city lookups with administrative region names, country codes, and geographical coordinates.
   - Docs: [https://open-meteo.com/en/docs/geocoding-api](https://open-meteo.com/en/docs/geocoding-api)
3. **Air Quality API:** Atmospheric chemistry models supplying EAQI, US AQI, PM2.5, PM10, Ozone, Carbon Monoxide, Nitrogen Dioxide, and Sulphur Dioxide.
   - Docs: [https://open-meteo.com/en/docs/air-quality-api](https://open-meteo.com/en/docs/air-quality-api)

> **Data Attribution:** Weather and Air Quality data by Open-Meteo under the [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) license. Geocoding data is sourced from OpenStreetMap under the Open Database License (ODbL).

---

## 🚀 Getting Started

### Local Development

Because SkyPulse Weather is a static application, you can run it immediately without running `npm install` or any build tool:

#### Option A: Direct Browser Launch
Simply double-click `index.html` or open it in your browser of choice (Chrome, Edge, Firefox, Safari).

#### Option B: Local Web Server (Recommended)
Using a lightweight local HTTP server ensures full compatibility with browser geolocation and fetch features:

**Using Python:**
```bash
# Python 3
python -m http.server 8000
```
Then visit: `http://localhost:8000`

**Using Node.js:**
```bash
npx serve .
```

**Using VS Code:**
Install the "Live Server" extension and click **Go Live** on `index.html`.

---

## 🌐 Deployment Instructions

SkyPulse Weather is designed to deploy seamlessly to any static hosting provider.

### Deploying to GitHub Pages
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "fix: repair weather loading and rebrand to SkyPulse"
   git push origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Select branch `main` and folder `/(root)`.
   - Click **Save**.
3. Your application will be live at `https://<your-username>.github.io/<repo-name>/`.

### Deploying to Vercel / Netlify / Cloudflare Pages
- **Build Command:** *(Leave empty)*
- **Output Directory:** `.` *(Root directory)*

---

## ♿ Accessibility & Security Standards

- **WCAG AA Compliant:** Contrast ratios for all text, badges, and controls exceed 4.5:1 against glassmorphic backgrounds in both themes.
- **Tab & Keyboard Navigation:** Complete tab indexing, focus rings (`:focus-visible`), and ARIA attributes (`aria-expanded`, `aria-controls`, `aria-selected`).
- **No Unsafe InnerHTML:** User inputs and external API responses are safely parsed and inserted using secure DOM methods to prevent Cross-Site Scripting (XSS).
- **Zero API Key Leakage:** Open-Meteo endpoints require no private API keys, ensuring no secrets are exposed in client-side code.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
Weather and geospatial data provided under CC BY 4.0 and ODbL by [Open-Meteo](https://open-meteo.com/).

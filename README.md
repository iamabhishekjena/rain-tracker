# Rain Tracker 🌧

A beautiful weather rain tracking app with animated backgrounds, a full-year rainfall calendar, and live forecasts for any city in the world.

**Live demo → [iamabhishekjena.github.io/rain-tracker](https://iamabhishekjena.github.io/rain-tracker)**

---

## Features

- **Search any city worldwide** — autocomplete suggestions as you type
- **Full-year rainfall calendar** — 12 month cards with bar charts and dot grids
- **Countdown timer** to the next rain event
- **Animated backgrounds** — rain drops, lightning bolts, sun rays, cloud wisps — all matching the actual weather
- **Month detail sheet** — click a month to see rain days, total precipitation, and storm count
- **Day detail overlay** — click any day for hourly rain breakdown, temperature, wind, and an animated weather backdrop
- **No API key needed** — powered entirely by [Open-Meteo](https://open-meteo.com/) (free, open-source)

---

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Canvas API |
| Backend  | Spring Boot 3 (Java 17) |
| Weather  | Open-Meteo (forecast + historical) |
| Hosting  | GitHub Pages (frontend) |

---

## Run Locally

### Frontend only (no backend needed)
```bash
cd frontend
npm install
npm start
```
Opens at `http://localhost:3001`

### Full stack (frontend + Spring Boot backend)
```bash
# Terminal 1 — backend
cd backend
mvn spring-boot:run

# Terminal 2 — frontend
cd frontend
npm install
npm start
```

---

## Deploy to GitHub Pages

```bash
cd frontend
npm run deploy
```

This builds the React app and pushes it to the `gh-pages` branch automatically.

---

## Project Structure

```
rain-tracker/
├── frontend/                  React app (deployable to GitHub Pages)
│   └── src/
│       ├── App.jsx            City search + main layout
│       ├── components/
│       │   ├── RainCanvas.jsx Animated weather background
│       │   ├── Countdown.jsx  Countdown to next rain
│       │   ├── MonthCard.jsx  Month card with bar chart + dot calendar
│       │   ├── MonthSheet.jsx Month detail bottom sheet
│       │   └── DayOverlay.jsx Day detail with animated canvas
│       ├── services/
│       │   └── weatherApi.js  Open-Meteo API calls + geocoding
│       └── utils/
│           └── weatherUtils.js Weather code classification
└── backend/                   Spring Boot REST API (optional)
    └── src/main/java/com/raintracker/
        ├── controller/        WeatherController
        ├── service/           WeatherService (Open-Meteo)
        └── model/             RainData
```

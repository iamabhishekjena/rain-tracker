import { useState, useEffect } from 'react';
import { geocodeCity, fetchYearForecast } from './services/weatherApi';
import { classifyWeather, findNextRainEvents } from './utils/weatherUtils';
import RainCanvas from './components/RainCanvas';
import Countdown from './components/Countdown';
import MonthCard from './components/MonthCard';
import MonthSheet from './components/MonthSheet';
import DayOverlay from './components/DayOverlay';

const YEAR = new Date().getFullYear();

export default function App() {
  const [cityInput, setCityInput] = useState('');
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [scene, setScene] = useState('rain');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [openMonth, setOpenMonth] = useState(null);
  const [openDay, setOpenDay] = useState(null);

  const nextRains = findNextRainEvents(weatherData, 2);

  // Set ambient scene from today's weather
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const day = weatherData[today];
    if (day) setScene(classifyWeather(day.code, day.precip).scene);
  }, [weatherData]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setLoading(true);
    setError('');
    setWeatherData({});
    setLocation(null);
    try {
      setLoadingMsg('finding city…');
      const loc = await geocodeCity(cityInput.trim());
      setLocation(loc);
      setLoadingMsg('fetching forecast…');
      const data = await fetchYearForecast(loc.lat, loc.lon, loc.timezone);
      setWeatherData(data);
      setLoadingMsg('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const hasData = Object.keys(weatherData).length > 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@200;300;400&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
        @keyframes blink{0%,100%{opacity:.25}50%{opacity:.06}}
        @keyframes gin{from{transform:scale(.78) translateY(44px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .mc:hover{transform:scale(1.035) translateY(-3px)!important;background:rgba(255,255,255,.11)!important;box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 0 .5px rgba(255,255,255,.18)!important}
      `}</style>

      <RainCanvas scene={scene} />

      <div style={S.app}>
        {/* Header */}
        <header style={S.header}>
          <div>
            <div style={S.brandName}>Rain Tracker</div>
            {location && <div style={S.brandSub}>{location.name}, {location.country} · {YEAR}</div>}
          </div>
          <form onSubmit={handleSearch} style={S.searchForm}>
            <input
              style={S.input}
              type="text"
              placeholder="Search city…"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
            />
            <button style={S.searchBtn} type="submit" disabled={loading}>
              {loading ? loadingMsg || '…' : 'Search'}
            </button>
          </form>
        </header>

        {error && <div style={S.error}>{error}</div>}

        {!hasData && !loading && (
          <div style={S.empty}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🌧</span>
            <div style={S.emptyTitle}>Search any city to see its full year rain forecast</div>
            <div style={S.emptySub}>Powered by Open-Meteo · No API key needed</div>
          </div>
        )}

        {hasData && (
          <>
            <Countdown
              targetDate={nextRains[0]?.dt}
              nextRain={nextRains[0]}
              followingRain={nextRains[1]}
            />

            <div style={S.calWrap}>
              <div style={S.yearTag}>{YEAR} — full year rainfall forecast · {location?.name}</div>
              <div style={S.monthsGrid}>
                {Array.from({ length: 12 }, (_, m) => (
                  <MonthCard
                    key={m}
                    month={m}
                    year={YEAR}
                    data={weatherData}
                    onMonthClick={setOpenMonth}
                    onDayClick={setOpenDay}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <MonthSheet
        month={openMonth}
        year={YEAR}
        data={weatherData}
        onClose={() => setOpenMonth(null)}
        onDayClick={key => { setOpenDay(key); setOpenMonth(null); }}
      />

      <DayOverlay
        dayKey={openDay}
        data={weatherData}
        onClose={() => setOpenDay(null)}
      />
    </>
  );
}

const S = {
  app: { position: 'relative', zIndex: 10, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Outfit',system-ui,sans-serif", color: '#fff' },
  header: { padding: '2.8rem 2.8rem 1.4rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 },
  brandName: { fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.7rem,3.5vw,2.4rem)', fontWeight: 300, fontStyle: 'italic', color: '#fff', lineHeight: 1, textShadow: '0 2px 24px rgba(0,0,0,.35)' },
  brandSub: { fontFamily: "'DM Mono',monospace", fontSize: '.58rem', letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginTop: '.18rem' },
  searchForm: { display: 'flex', gap: '.5rem', alignItems: 'center' },
  input: { background: 'rgba(255,255,255,.09)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '.5px solid rgba(255,255,255,.18)', borderRadius: 100, color: '#fff', fontFamily: "'DM Mono',monospace", fontSize: '.68rem', letterSpacing: '.08em', padding: '.48rem 1.2rem', outline: 'none', width: 200 },
  searchBtn: { background: 'rgba(106,180,255,.2)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '.5px solid rgba(106,180,255,.35)', borderRadius: 100, color: '#fff', fontFamily: "'DM Mono',monospace", fontSize: '.68rem', letterSpacing: '.08em', padding: '.48rem 1.2rem', cursor: 'pointer' },
  error: { fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: '#f87171', textAlign: 'center', padding: '.5rem 2.8rem' },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' },
  emptyTitle: { fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,.75)', marginBottom: '.5rem' },
  emptySub: { fontFamily: "'DM Mono',monospace", fontSize: '.6rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' },
  calWrap: { flex: 1, overflowY: 'auto', padding: '.8rem 2.8rem 2.5rem', scrollbarWidth: 'none' },
  yearTag: { fontFamily: "'DM Mono',monospace", fontSize: '.53rem', letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', marginBottom: '.9rem' },
  monthsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.9rem' },
};

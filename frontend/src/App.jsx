import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchYearForecast, searchCitySuggestions } from './services/weatherApi';
import { classifyWeather, findNextRainEvents } from './utils/weatherUtils';
import RainCanvas from './components/RainCanvas';
import Countdown from './components/Countdown';
import MonthCard from './components/MonthCard';
import MonthSheet from './components/MonthSheet';
import DayOverlay from './components/DayOverlay';

const YEAR = new Date().getFullYear();

export default function App() {
  const [cityInput, setCityInput]     = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [location, setLocation]       = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [scene, setScene]             = useState('rain');
  const [todayScene, setTodayScene]   = useState('rain');
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [error, setError]             = useState('');
  const [openMonth, setOpenMonth]     = useState(null);
  const [openDay, setOpenDay]         = useState(null);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  const nextRains = findNextRainEvents(weatherData, 2);

  // Ambient scene from today's weather
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const day = weatherData[today];
    if (day) { const s = classifyWeather(day.code, day.precip).scene; setScene(s); setTodayScene(s); }
  }, [weatherData]);

  // Background shifts to match opened day's weather
  useEffect(() => {
    if (openDay && weatherData[openDay]) {
      setScene(classifyWeather(weatherData[openDay].code, weatherData[openDay].precip).scene);
    } else {
      setScene(todayScene);
    }
  }, [openDay]); // eslint-disable-line

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Debounced suggestions fetch
  const fetchSuggestions = useCallback((value) => {
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCitySuggestions(value);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch { setSuggestions([]); }
    }, 280);
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setCityInput(val);
    fetchSuggestions(val);
  }

  async function loadCity(loc) {
    setCityInput(loc.name);
    setShowDropdown(false);
    setSuggestions([]);
    setLoading(true);
    setError('');
    setWeatherData({});
    setLocation(loc);
    try {
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

  function handleFormSubmit(e) {
    e.preventDefault();
    if (suggestions.length > 0) loadCity(suggestions[0]);
  }

  const hasData = Object.keys(weatherData).length > 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@200;300;400&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{font-size:18px}
        html,body{height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
        @keyframes blink{0%,100%{opacity:.25}50%{opacity:.06}}
        @keyframes gin{from{transform:scale(.78) translateY(44px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes ddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .mc:hover{transform:scale(1.035) translateY(-3px)!important;background:rgba(255,255,255,.11)!important;box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 0 .5px rgba(255,255,255,.18)!important}
        .sug-item:hover{background:rgba(255,255,255,.12)!important}
        input::placeholder{color:rgba(255,255,255,.35)}
      `}</style>

      <RainCanvas scene={scene} />

      <div style={S.app}>
        <header style={S.header}>
          <div>
            <div style={S.brandName}>Rain Tracker</div>
            {location && <div style={S.brandSub}>{location.name}, {location.country} · {YEAR}</div>}
          </div>

          {/* Search with suggestions */}
          <div ref={wrapRef} style={S.searchWrap}>
            <form onSubmit={handleFormSubmit} style={S.searchForm}>
              <input
                style={S.input}
                type="text"
                placeholder="Search any city…"
                value={cityInput}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                autoComplete="off"
              />
              <button style={S.searchBtn} type="submit" disabled={loading}>
                {loading ? loadingMsg || '…' : 'Search'}
              </button>
            </form>

            {showDropdown && (
              <div style={S.dropdown}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="sug-item"
                    style={S.sugItem}
                    onMouseDown={() => loadCity(s)}
                  >
                    <span style={S.sugName}>{s.name}</span>
                    <span style={S.sugMeta}>{[s.admin1, s.country].filter(Boolean).join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <Countdown targetDate={nextRains[0]?.dt} nextRain={nextRains[0]} followingRain={nextRains[1]} />
            <div style={S.calWrap}>
              <div style={S.yearTag}>{YEAR} — full year rainfall forecast · {location?.name}</div>
              <div style={S.monthsGrid}>
                {Array.from({ length: 12 }, (_, m) => (
                  <MonthCard key={m} month={m} year={YEAR} data={weatherData} onMonthClick={setOpenMonth} onDayClick={setOpenDay} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <MonthSheet month={openMonth} year={YEAR} data={weatherData} onClose={() => setOpenMonth(null)} onDayClick={key => { setOpenDay(key); setOpenMonth(null); }} onMonthChange={m => setOpenMonth(m)} />
      <DayOverlay dayKey={openDay} data={weatherData} onClose={() => setOpenDay(null)} />
    </>
  );
}

const S = {
  app:        { position:'relative', zIndex:10, height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:"'Outfit',system-ui,sans-serif", color:'#fff' },
  header:     { padding:'2.8rem 2.8rem 1.4rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexShrink:0 },
  brandName:  { fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(1.7rem,3.5vw,2.4rem)', fontWeight:300, fontStyle:'italic', color:'#fff', lineHeight:1, textShadow:'0 2px 24px rgba(0,0,0,.35)' },
  brandSub:   { fontFamily:"'DM Mono',monospace", fontSize:'.65rem', letterSpacing:'.28em', textTransform:'uppercase', color:'rgba(255,255,255,.28)', marginTop:'.18rem' },
  searchWrap: { position:'relative', display:'flex', flexDirection:'column', alignItems:'flex-end' },
  searchForm: { display:'flex', gap:'.5rem', alignItems:'center' },
  input:      { background:'rgba(255,255,255,.09)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'.5px solid rgba(255,255,255,.18)', borderRadius:100, color:'#fff', fontFamily:"'DM Mono',monospace", fontSize:'.78rem', letterSpacing:'.08em', padding:'.48rem 1.2rem', outline:'none', width:220 },
  searchBtn:  { background:'rgba(106,180,255,.2)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'.5px solid rgba(106,180,255,.35)', borderRadius:100, color:'#fff', fontFamily:"'DM Mono',monospace", fontSize:'.78rem', letterSpacing:'.08em', padding:'.48rem 1.2rem', cursor:'pointer' },
  dropdown:   { position:'absolute', top:'calc(100% + 8px)', right:0, width:320, background:'rgba(8,20,48,.96)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', border:'.5px solid rgba(255,255,255,.14)', borderRadius:16, overflow:'hidden', zIndex:500, animation:'ddIn .2s ease' },
  sugItem:    { display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'1rem', padding:'.65rem 1.1rem', cursor:'pointer', transition:'background .15s', background:'transparent' },
  sugName:    { fontFamily:"'Outfit',sans-serif", fontSize:'.95rem', color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  sugMeta:    { fontFamily:"'DM Mono',monospace", fontSize:'.65rem', color:'rgba(255,255,255,.38)', whiteSpace:'nowrap', flexShrink:0 },
  error:      { fontFamily:"'DM Mono',monospace", fontSize:'.75rem', color:'#f87171', textAlign:'center', padding:'.5rem 2.8rem' },
  empty:      { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'2rem' },
  emptyTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', fontStyle:'italic', fontWeight:300, color:'rgba(255,255,255,.75)', marginBottom:'.5rem' },
  emptySub:   { fontFamily:"'DM Mono',monospace", fontSize:'.7rem', letterSpacing:'.15em', textTransform:'uppercase', color:'rgba(255,255,255,.25)' },
  calWrap:    { flex:1, overflowY:'auto', padding:'.8rem 2.8rem 2.5rem', scrollbarWidth:'none' },
  yearTag:    { fontFamily:"'DM Mono',monospace", fontSize:'.62rem', letterSpacing:'.28em', textTransform:'uppercase', color:'rgba(255,255,255,.2)', marginBottom:'.9rem' },
  monthsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.9rem' },
};

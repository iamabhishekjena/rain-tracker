import { useState } from "react";
import { fetchRainData } from "./services/weatherApi";
import RainCard from "./components/RainCard";

export default function App() {
  const [city, setCity] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const result = await fetchRainData(city.trim());
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Rain Tracker</h1>
      <form onSubmit={handleSearch} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check Rain"}
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
      {data && <RainCard data={data} />}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f172a", padding: "2rem", fontFamily: "sans-serif" },
  title: { color: "#7dd3fc", textAlign: "center", fontSize: "2.5rem", marginBottom: "1.5rem" },
  form: { display: "flex", justifyContent: "center", gap: "0.75rem" },
  input: {
    padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #334155",
    background: "#1e293b", color: "#f1f5f9", fontSize: "1rem", width: 280,
  },
  button: {
    padding: "0.6rem 1.2rem", borderRadius: 8, border: "none",
    background: "#0ea5e9", color: "#fff", fontSize: "1rem", cursor: "pointer",
  },
  error: { color: "#f87171", textAlign: "center", marginTop: "1rem" },
};

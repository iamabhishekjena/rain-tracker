export default function RainCard({ data }) {
  return (
    <div style={styles.card}>
      <h2>{data.city}, {data.country}</h2>
      <div style={styles.status}>
        {data.raining ? "🌧️ It is raining" : "☀️ No rain right now"}
      </div>
      <div style={styles.grid}>
        <Stat label="Rain (last 1h)" value={`${data.rainMm} mm`} />
        <Stat label="Temperature" value={`${data.temperature}°C`} />
        <Stat label="Humidity" value={`${data.humidity}%`} />
        <Stat label="Condition" value={data.description} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
    </div>
  );
}

const styles = {
  card: {
    background: "#1e293b",
    borderRadius: 16,
    padding: "2rem",
    color: "#f1f5f9",
    maxWidth: 480,
    margin: "2rem auto",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  status: { fontSize: "1.4rem", margin: "1rem 0" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" },
  stat: { background: "#0f172a", borderRadius: 8, padding: "0.75rem 1rem" },
  label: { fontSize: "0.75rem", color: "#94a3b8", marginBottom: 4 },
  value: { fontSize: "1.1rem", fontWeight: 600 },
};

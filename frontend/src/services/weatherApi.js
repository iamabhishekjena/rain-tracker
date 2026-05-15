export async function fetchRainData(city) {
  const res = await fetch(`/api/weather/rain?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error("City not found or API error");
  return res.json();
}

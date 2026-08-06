// Real-time weather proxy via Open-Meteo (free, keyless, CN-reachable).
// Accepts ?lat=&lng= to query any point (location picker). Default = Phu Quoc.
// ?nocache=1 bypasses the server cache (manual refresh). Cached 10 min otherwise.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat")) || 10.2;
  const lng = Number(searchParams.get("lng")) || 104.0;
  const nocache = searchParams.get("nocache") === "1";
  const cacheOpt = nocache ? { cache: "no-store" as const } : { next: { revalidate: 600 } };

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,visibility,wind_speed_10m,uv_index` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
    `&timezone=Asia/Ho_Chi_Minh&forecast_days=5`;
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
    `&current=pm2_5,us_aqi&timezone=Asia/Ho_Chi_Minh`;

  try {
    const [f, a] = await Promise.all([
      fetch(forecastUrl, cacheOpt),
      fetch(aqUrl, cacheOpt),
    ]);
    if (!f.ok || !a.ok) return Response.json({ error: "upstream" }, { status: 502 });
    const forecast = await f.json();
    const air = await a.json();
    return Response.json({
      lat,
      lng,
      current: forecast.current,
      hourly: forecast.hourly,
      daily: forecast.daily,
      air: air.current,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json({ error: "weather-unreachable" }, { status: 502 });
  }
}

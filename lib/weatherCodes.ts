// Map WMO weather codes (used by Open-Meteo) to emoji + Chinese label.
export type Wx = { emoji: string; text: string };

export function wmo(code: number): Wx {
  if (code === 0) return { emoji: "☀️", text: "晴" };
  if (code === 1) return { emoji: "🌤️", text: "晴间多云" };
  if (code === 2) return { emoji: "⛅", text: "多云" };
  if (code === 3) return { emoji: "☁️", text: "阴" };
  if (code === 45 || code === 48) return { emoji: "🌫️", text: "雾" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", text: "毛毛雨" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", text: "雨" };
  if (code >= 71 && code <= 77) return { emoji: "❄️", text: "雪" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", text: "阵雨" };
  if (code === 85 || code === 86) return { emoji: "🌨️", text: "阵雪" };
  if (code >= 95) return { emoji: "⛈️", text: "雷暴" };
  return { emoji: "🌡️", text: "—" };
}

export function aqiLevel(aqi: number): { label: string; color: string; pct: number } {
  // US AQI scale 0-300+
  if (aqi <= 50) return { label: "优", color: "#4CAF50", pct: 16 };
  if (aqi <= 100) return { label: "良", color: "#A0C840", pct: 33 };
  if (aqi <= 150) return { label: "轻度污染", color: "#FFC107", pct: 50 };
  if (aqi <= 200) return { label: "中度污染", color: "#FF7A45", pct: 66 };
  if (aqi <= 300) return { label: "重度污染", color: "#E53935", pct: 83 };
  return { label: "严重污染", color: "#7B1FA2", pct: 100 };
}

export function uvLevel(uv: number): { label: string; color: string } {
  if (uv < 3) return { label: "低", color: "#4CAF50" };
  if (uv < 6) return { label: "中等", color: "#FFC107" };
  if (uv < 8) return { label: "强", color: "#FF7A45" };
  if (uv < 11) return { label: "很强", color: "#E53935" };
  return { label: "极强", color: "#7B1FA2" };
}

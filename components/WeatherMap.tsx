"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const PIN = L.divIcon({
  className: "",
  html: `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function Clicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function WeatherMap({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={11}
      style={{ height: 300, width: "100%", cursor: "crosshair" }}
      className="z-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
    >
      <TileLayer
        attribution="&copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
      <Clicker onPick={onPick} />
      <Marker position={[lat, lng]} icon={PIN} />
      <Recenter lat={lat} lng={lng} />
    </MapContainer>
  );
}

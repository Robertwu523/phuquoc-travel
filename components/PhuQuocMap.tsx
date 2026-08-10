"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocale, useTranslations } from "next-intl";

import { pois, type PoiCategory } from "@/data/pois";
import { useTripStore } from "@/lib/store";
import {
  poiToMapStop,
  customToMapStop,
  resolveStop,
  snapToCurated,
  type MapStop,
  type Locale,
} from "@/lib/stops";
import { categoryStyles } from "@/lib/categories";
import { reverseGeocodeRich } from "@/lib/geocode";
import {
  osrmRoute,
  osrmOptimizeTrip,
  formatDuration,
  formatDistance,
  type RouteResult,
} from "@/lib/routing";
import { buildReviewLinks } from "@/lib/reviews";
import { googleNavUrl } from "@/lib/nav";
import AddPlaceDialog, { type Pending } from "./AddPlaceDialog";

const CENTER: [number, number] = [10.2, 103.96];
const KNOWN_CATS = ["beach", "family", "nature", "island", "market", "temple", "culture"] as const;

const iconCache = new Map<string, L.DivIcon>();
function makeIcon(stop: MapStop, highlighted: boolean) {
  const ring = highlighted ? "pq-pin--added" : "";
  // Cache by appearance only, so renaming a pin (which doesn't change the icon)
  // doesn't create a new icon object and destabilize the open popup / input.
  const key = `${stop.color}|${stop.emoji}|${ring}`;
  let ic = iconCache.get(key);
  if (!ic) {
    ic = L.divIcon({
      className: "pq-marker",
      html: `<div class="pq-pin ${ring}" style="--pin-color:${stop.color}">${stop.emoji}</div>`,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -38],
    });
    iconCache.set(key, ic);
  }
  return ic;
}

function FitBounds({
  coords,
  dayKey,
}: {
  coords: [number, number][];
  dayKey: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 14, { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], animate: true });
    // Re-fit only when the selected day changes — NOT on every add/rename,
    // so adding a pin doesn't whip the view away from where the user clicked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);
  return null;
}

/** Fly the map to a point when its nonce changes (e.g. when a search result is picked). */
function FlyTo({
  target,
}: {
  target: { lat: number; lng: number; zoom: number; nonce: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.nonce]);
  return null;
}

/** Captures background map clicks to drop a custom pin. */
function DropHandler({ onDrop }: { onDrop: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      // Ignore clicks that originated on a marker, popup, or map control —
      // Leaflet can let these "pass through" to the map and would otherwise
      // create an unwanted pin when pressing buttons inside a popup.
      const target = e.originalEvent.target as HTMLElement | null;
      if (
        target &&
        (target.closest(".leaflet-popup") ||
          target.closest(".leaflet-marker-icon") ||
          target.closest(".leaflet-control"))
      ) {
        return;
      }
      onDrop(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ReviewButtons({ name, locale }: { name: string; locale: Locale }) {
  const links = buildReviewLinks(name, locale);
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {links.map((l) => (
        <a
          key={l.key}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-teal-100 hover:text-teal-700 dark:bg-slate-700 dark:text-slate-200"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

export default function PhuQuocMap() {
  const locale = useLocale() as Locale;
  const t = useTranslations("Map");
  const tp = useTranslations("Planner");
  const tc = useTranslations("Categories");

  const selectedDay = useTripStore((s) => s.selectedDay);
  const dayAssignments = useTripStore((s) => s.dayAssignments);
  const customPins = useTripStore((s) => s.customPins);
  const addPoiToDay = useTripStore((s) => s.addPoiToDay);
  const removePoiFromDay = useTripStore((s) => s.removePoiFromDay);
  const addPlace = useTripStore((s) => s.addPlace);
  const updateCustomPin = useTripStore((s) => s.updateCustomPin);
  const removeCustomPin = useTripStore((s) => s.removeCustomPin);
  const hideCurated = useTripStore((s) => s.hideCurated);
  const hiddenCurated = useTripStore((s) => s.hiddenCurated);
  const setDayOrder = useTripStore((s) => s.setDayOrder);
  const flyTo = useTripStore((s) => s.flyTo);

  const selectedIds = dayAssignments[selectedDay] ?? [];
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedStops: MapStop[] = useMemo(
    () =>
      selectedIds
        .map((id) => resolveStop(id, customPins, locale))
        .filter((s): s is MapStop => Boolean(s)),
    [selectedIds, customPins, locale]
  );

  const routeCoords: [number, number][] = useMemo(
    () => selectedStops.map((s) => [s.lat, s.lng]),
    [selectedStops]
  );

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [layer, setLayer] = useState<"satellite" | "street">("street");

  const idsKey = selectedIds.join(",");
  useEffect(() => {
    if (routeCoords.length < 2) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    setRouteLoading(true);
    osrmRoute(routeCoords).then((r) => {
      if (cancelled) return;
      setRoute(r);
      setRouteLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Clicking the map opens a confirmation panel — it never creates a point
  // directly. We first try to recognize the place (snap to a curated POI, or
  // reverse-geocode the region online), then ask the user to confirm + categorize.
  function openAdd(lat: number, lng: number) {
    const snapped = snapToCurated(lat, lng, 1);
    if (snapped) {
      setPending({
        lat,
        lng,
        loading: false,
        name: snapped.name[locale],
        info: snapped.description[locale],
        category: snapped.category,
        duration: snapped.duration,
        snappedId: snapped.id,
      });
      return;
    }
    setPending({
      lat,
      lng,
      loading: true,
      name: "",
      info: "",
      category: "culture",
      duration: 1,
      snappedId: null,
    });
    reverseGeocodeRich(lat, lng, locale)
      .then((g) =>
        setPending((p) =>
          p
            ? {
                ...p,
                loading: false,
                name: p.name || g.name,
                info: g.info || g.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              }
            : p
        )
      )
      .catch(() =>
        setPending((p) =>
          p ? { ...p, loading: false, name: p.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}` } : p
        )
      );
  }

  function confirmAdd() {
    if (!pending) return;
    if (pending.snappedId) {
      addPoiToDay(selectedDay, pending.snappedId);
    } else {
      addPlace(selectedDay, {
        name: pending.name.trim(),
        lat: pending.lat,
        lng: pending.lng,
        category: pending.category.trim() || "自定义",
        info: pending.info,
        duration: pending.duration,
      });
    }
    setPending(null);
  }

  async function optimizeOrder() {
    if (selectedStops.length < 3) return;
    setOptimizing(true);
    try {
      const trip = await osrmOptimizeTrip(
        selectedStops.map((s) => [s.lat, s.lng]),
        { fixedStart: true }
      );
      if (trip.ok && trip.order.length === selectedIds.length) {
        setDayOrder(selectedDay, trip.order.map((i) => selectedIds[i]));
      }
    } finally {
      setOptimizing(false);
    }
  }

  const curatedStops = useMemo(
    () =>
      pois
        .map((p) => poiToMapStop(p, locale))
        .filter((s) => !hiddenCurated.includes(s.id)),
    [locale, hiddenCurated]
  );
  const pinStops = useMemo(
    () => Object.values(customPins).map(customToMapStop),
    [customPins]
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={CENTER}
        zoom={11}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", minHeight: 420, cursor: "crosshair" }}
      >
        <TileLayer
          key={layer}
          attribution={
            layer === "satellite"
              ? "&copy; Esri, Maxar, Earthstar Geographics"
              : "&copy; OpenStreetMap contributors"
          }
          url={
            layer === "satellite"
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          maxZoom={19}
        />

        <DropHandler onDrop={openAdd} />

        {curatedStops.map((stop) => {
          const added = selectedSet.has(stop.id);
          return (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={makeIcon(stop, added)}>
              <Popup>
                <div className="min-w-[190px]">
                  <div className="text-sm font-bold text-slate-900">{stop.name}</div>
                  <div className="mt-0.5 text-xs font-medium text-teal-700">
                    {stop.emoji} {t("durationHours", { hours: stop.duration })}
                  </div>
                  <ReviewButtons name={stop.name} locale={locale} />
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => addPoiToDay(selectedDay, stop.id)}
                    className={
                      "mt-2 w-full rounded-md px-2 py-1.5 text-xs font-semibold transition " +
                      (added
                        ? "cursor-default bg-teal-100 text-teal-700"
                        : "bg-teal-600 text-white hover:bg-teal-700")
                    }
                  >
                    {added
                      ? t("added", { day: selectedDay + 1 })
                      : `${t("addToTrip")} · ${tp("day", { n: selectedDay + 1 })}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => hideCurated(stop.id)}
                    className="mt-1 w-full rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  >
                    从目录移除 ✕
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {pinStops.map((stop) => {
          const added = selectedSet.has(stop.id);
          const pin = customPins[stop.id];
          return (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={makeIcon(stop, added)}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-pink-600">
                    {t("customPin")}
                  </div>
                  <input
                    value={pin?.name ?? ""}
                    onChange={(e) => updateCustomPin(stop.id, { name: e.target.value })}
                    className="w-full rounded border border-slate-300 px-1.5 py-1 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none"
                  />
                  {pin && (
                    <div className="mt-2">
                      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {t("categoryLabel")}
                      </div>
                      <select
                        value={
                          (KNOWN_CATS as readonly string[]).includes(pin.category)
                            ? pin.category
                            : "__custom__"
                        }
                        onChange={(e) =>
                          updateCustomPin(stop.id, {
                            category: e.target.value === "__custom__" ? "" : e.target.value,
                          })
                        }
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                      >
                        {KNOWN_CATS.map((c) => (
                          <option key={c} value={c}>
                            {categoryStyles[c].emoji} {tc(c)}
                          </option>
                        ))}
                        <option value="__custom__">✏️ 自定义</option>
                      </select>
                      {!(KNOWN_CATS as readonly string[]).includes(pin.category) && (
                        <input
                          value={pin.category}
                          onChange={(e) => updateCustomPin(stop.id, { category: e.target.value })}
                          placeholder="输入分类"
                          className="mt-1 w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                        />
                      )}
                    </div>
                  )}
                  {pin && (
                    <div className="mt-1">
                      <ReviewButtons name={pin.name || "Phu Quoc"} locale={locale} />
                    </div>
                  )}
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        added ? removePoiFromDay(selectedDay, stop.id) : addPoiToDay(selectedDay, stop.id)
                      }
                      className={
                        "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition " +
                        (added
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-teal-600 text-white hover:bg-teal-700")
                      }
                    >
                      {added ? tp("remove") : `${t("addToTrip")} · ${tp("day", { n: selectedDay + 1 })}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomPin(stop.id)}
                      className="rounded-md bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {route?.ok && route.geometry.length > 1 && (
          <Polyline
            positions={route.geometry}
            pathOptions={{ color: "#0d9488", weight: 5, opacity: 0.85 }}
            lineCap="round"
          />
        )}

        <FitBounds coords={routeCoords} dayKey={String(selectedDay)} />
        <FlyTo target={flyTo} />
      </MapContainer>

      {/* Route summary + optimize overlay */}
      {selectedStops.length >= 2 && (
        <div className="pointer-events-auto absolute bottom-3 left-3 z-[500] max-w-[240px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {routeLoading ? (
                <span className="text-slate-400">{t("routing")}</span>
              ) : route?.ok ? (
                <span>
                  🚗 {formatDistance(route.distance)} · {t("about")} {formatDuration(route.duration)}
                </span>
              ) : (
                <span className="text-slate-400">{t("routeUnavailable")}</span>
              )}
            </div>
          </div>
          {route?.ok && route.legs.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
              {route.legs.map((leg, i) => (
                <li key={i}>
                  {i + 1} → {i + 2}: {formatDuration(leg.duration)}
                </li>
              ))}
            </ul>
          )}
          {selectedStops.length >= 3 && (
            <button
              type="button"
              onClick={optimizeOrder}
              disabled={optimizing}
              className="mt-2 w-full rounded-md bg-teal-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              {optimizing ? t("optimizing") : t("optimize")}
            </button>
          )}

          <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-700/60">
            <a
              href={googleNavUrl(selectedStops)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1 rounded-md bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
            >
              🧭 {t("navigateLabel")} · {t("navGoogle")}
            </a>
          </div>
        </div>
      )}

      {/* Layer toggle (satellite / street) */}
      <div className="absolute right-3 top-3 z-[500] flex overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        {(["satellite", "street"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setLayer(k)}
            className={
              "px-2.5 py-1.5 text-xs font-semibold transition " +
              (layer === k
                ? "bg-teal-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300")
            }
          >
            {k === "satellite" ? "🛰️ 卫星" : "🗺️ 街道"}
          </button>
        ))}
      </div>

      {pending && (
        <AddPlaceDialog
          pending={pending}
          onChange={(patch) => setPending((p) => (p ? { ...p, ...patch } : p))}
          onConfirm={confirmAdd}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

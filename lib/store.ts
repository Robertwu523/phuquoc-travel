"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CustomPin } from "@/lib/stops";

type TripState = {
  /** ISO yyyy-mm-dd, the departure date from Hong Kong */
  startDate: string | null;
  /** number of days on the island */
  days: number;
  /** day index (0-based) currently being edited / highlighted on the map */
  selectedDay: number;
  /** dayIndex -> ordered stop ids (curated POI ids OR custom pin ids) */
  dayAssignments: Record<number, string[]>;
  /** registry of user-dropped custom pins, keyed by id */
  customPins: Record<string, CustomPin>;
  /** per-stop custom duration overrides: key = `${day}-${idx}` → hours */
  stopDurations: Record<string, number>;
  /** per-stop explicit start time (minutes from midnight): key = `${day}-${idx}` */
  stopStartTimes: Record<string, number>;
  /** ids of curated POIs the user has deleted from their catalog */
  hiddenCurated: string[];
  _hasHydrated: boolean;
  /** ephemeral "fly map to this point" pulse (not persisted) */
  flyTo: { lat: number; lng: number; zoom: number; nonce: number } | null;

  setStartDate: (d: string | null) => void;
  setDays: (n: number) => void;
  setSelectedDay: (d: number) => void;
  addPoiToDay: (day: number, poiId: string) => void;
  removePoiFromDay: (day: number, poiId: string) => void;
  movePoi: (day: number, index: number, dir: -1 | 1) => void;
  setStopDuration: (day: number, idx: number, hours: number) => void;
  setStopStartTime: (day: number, idx: number, minutes: number) => void;
  /** drag a stop from one index to another within a day */
  dragMove: (day: number, fromIdx: number, toIdx: number) => void;
  setDayOrder: (day: number, ids: string[]) => void;
  clearDay: (day: number) => void;
  clearAll: () => void;

  addCustomPin: (pin: CustomPin) => void;
  updateCustomPin: (id: string, patch: Partial<CustomPin>) => void;
  removeCustomPin: (id: string) => void;
  /** hide a curated POI from the catalog/map (and drop it from any day) */
  hideCurated: (id: string) => void;
  /** restore all previously hidden curated POIs */
  restoreAllCurated: () => void;
  /** register a user-added place, assign to `day`, return its id */
  addPlace: (
    day: number,
    data: {
      name: string;
      lat: number;
      lng: number;
      category: CustomPin["category"];
      info?: string;
      duration?: number;
    }
  ) => string;

  setHasHydrated: (b: boolean) => void;
  setFlyTo: (f: { lat: number; lng: number; zoom: number } | null) => void;
};

const clampDays = (n: number) => Math.max(1, Math.min(30, Math.round(n)));

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      startDate: null,
      days: 5,
      selectedDay: 0,
      dayAssignments: {},
      customPins: {},
      stopDurations: {},
      stopStartTimes: {},
      hiddenCurated: [],
      _hasHydrated: false,
      flyTo: null,

      setStartDate: (startDate) => set({ startDate }),
      setDays: (n) =>
        set((s) => {
          const days = clampDays(n);
          const dayAssignments: Record<number, string[]> = {};
          for (let i = 0; i < days; i++) dayAssignments[i] = s.dayAssignments[i] ?? [];
          const selectedDay = Math.min(s.selectedDay, days - 1);
          return { days, dayAssignments, selectedDay };
        }),
      setSelectedDay: (selectedDay) => set({ selectedDay }),
      addPoiToDay: (day, poiId) =>
        set((s) => {
          const list = s.dayAssignments[day] ?? [];
          if (list.includes(poiId)) return {};
          return {
            dayAssignments: { ...s.dayAssignments, [day]: [...list, poiId] },
          };
        }),
      removePoiFromDay: (day, poiId) =>
        set((s) => ({
          dayAssignments: {
            ...s.dayAssignments,
            [day]: (s.dayAssignments[day] ?? []).filter((id) => id !== poiId),
          },
        })),
      movePoi: (day, index, dir) =>
        set((s) => {
          const list = s.dayAssignments[day] ?? [];
          const j = index + dir;
          if (j < 0 || j >= list.length) return {};
          const next = [...list];
          [next[index], next[j]] = [next[j], next[index]];
          return { dayAssignments: { ...s.dayAssignments, [day]: next } };
        }),
      clearDay: (day) =>
        set((s) => ({ dayAssignments: { ...s.dayAssignments, [day]: [] } })),
      setDayOrder: (day, ids) =>
        set((s) => ({ dayAssignments: { ...s.dayAssignments, [day]: ids } })),
      dragMove: (day, fromIdx, toIdx) =>
        set((s) => {
          const list = [...(s.dayAssignments[day] ?? [])];
          if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) return {};
          const [item] = list.splice(fromIdx, 1);
          list.splice(toIdx, 0, item);
          return { dayAssignments: { ...s.dayAssignments, [day]: list } };
        }),
      setStopDuration: (day, idx, hours) =>
        set((s) => ({
          stopDurations: { ...s.stopDurations, [`${day}-${idx}`]: Math.max(0.25, Math.min(24, hours)) },
        })),
      setStopStartTime: (day, idx, minutes) =>
        set((s) => ({
          stopStartTimes: { ...s.stopStartTimes, [`${day}-${idx}`]: Math.max(0, Math.min(23 * 60 + 59, minutes)) },
        })),
      clearAll: () => set({ dayAssignments: {}, stopDurations: {}, stopStartTimes: {} }),

      addCustomPin: (pin) =>
        set((s) => ({ customPins: { ...s.customPins, [pin.id]: pin } })),
      updateCustomPin: (id, patch) =>
        set((s) =>
          s.customPins[id]
            ? { customPins: { ...s.customPins, [id]: { ...s.customPins[id], ...patch } } }
            : {}
        ),
      removeCustomPin: (id) =>
        set((s) => {
          const next = { ...s.customPins };
          delete next[id];
          const dayAssignments: Record<number, string[]> = {};
          for (const [k, v] of Object.entries(s.dayAssignments)) {
            dayAssignments[Number(k)] = v.filter((x) => x !== id);
          }
          return { customPins: next, dayAssignments };
        }),
      hideCurated: (id) =>
        set((s) => {
          if (s.hiddenCurated.includes(id)) return {};
          const dayAssignments: Record<number, string[]> = {};
          for (const [k, v] of Object.entries(s.dayAssignments)) {
            dayAssignments[Number(k)] = v.filter((x) => x !== id);
          }
          return { hiddenCurated: [...s.hiddenCurated, id], dayAssignments };
        }),
      restoreAllCurated: () => set({ hiddenCurated: [] }),
      addPlace: (day, data) => {
        const id = `pin-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const pin: CustomPin = {
          id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          category: data.category,
          info: data.info,
          duration: data.duration ?? 1,
        };
        get().addCustomPin(pin);
        get().addPoiToDay(day, id);
        return id;
      },

      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
      setFlyTo: (f) =>
        set({
          flyTo: f ? { ...f, nonce: Date.now() } : null,
        }),
    }),
    {
      name: "phu-quoc-trip-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        startDate: s.startDate,
        days: s.days,
        selectedDay: s.selectedDay,
        dayAssignments: s.dayAssignments,
        customPins: s.customPins,
        stopDurations: s.stopDurations,
        stopStartTimes: s.stopStartTimes,
        hiddenCurated: s.hiddenCurated,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

export const selectTotalPois = (s: TripState) =>
  Object.values(s.dayAssignments).reduce((acc, list) => acc + list.length, 0);

/**
 * Subscribe to persisted-state changes and flag them for cloud sync.
 * Returns an unsubscribe fn. Call only after hydration + login, to avoid
 * echoing the rehydrate itself or syncing logged-out usage.
 */
export function subscribeTripSync() {
  let lastSnapshot = "";
  return useTripStore.subscribe((s) => {
    if (!s._hasHydrated) return;
    const snap = JSON.stringify({
      startDate: s.startDate,
      days: s.days,
      selectedDay: s.selectedDay,
      dayAssignments: s.dayAssignments,
      customPins: s.customPins,
      stopDurations: s.stopDurations,
      stopStartTimes: s.stopStartTimes,
      hiddenCurated: s.hiddenCurated,
    });
    if (snap === lastSnapshot) return;
    lastSnapshot = snap;
    // Dynamic import breaks the (currently benign) store↔sync edge at load time.
    import("@/lib/sync").then(({ markDirty }) => markDirty("phu-quoc-trip-v2"));
  });
}

"use client";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AttendanceZone } from "@ubm-hyogo/shared";
import {
  PERIOD_PRESETS,
  type PeriodPresetId,
  presetToPeriod,
  SELECTABLE_ZONES,
} from "../lib/format-attendance";

export interface AttendanceFilterState {
  readonly periodPreset: PeriodPresetId;
  readonly periodFrom: string | null;
  readonly periodTo: string | null;
  readonly zones: readonly AttendanceZone[];
}

const VALID_PRESETS = new Set<string>(PERIOD_PRESETS.map((p) => p.id));

export const readFilterFromQuery = (
  q: URLSearchParams | Record<string, string | undefined>,
): AttendanceFilterState => {
  const get = (k: string): string | undefined =>
    q instanceof URLSearchParams ? q.get(k) ?? undefined : q[k];
  const presetRaw = get("preset");
  const preset = (presetRaw && VALID_PRESETS.has(presetRaw) ? presetRaw : "all") as PeriodPresetId;
  const { periodFrom, periodTo } = presetToPeriod(preset);
  const zoneRaw = get("zone");
  const zones: AttendanceZone[] = zoneRaw
    ? zoneRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is AttendanceZone => SELECTABLE_ZONES.includes(s as AttendanceZone))
    : [];
  return { periodPreset: preset, periodFrom, periodTo, zones };
};

export function useAttendanceFilters(initial: AttendanceFilterState) {
  const router = useRouter();
  const search = useSearchParams();

  const state = useMemo<AttendanceFilterState>(() => {
    if (!search) return initial;
    return readFilterFromQuery(search);
  }, [search, initial]);

  const setPreset = useCallback(
    (preset: PeriodPresetId) => {
      const params = new URLSearchParams(search?.toString() ?? "");
      if (preset === "all") params.delete("preset");
      else params.set("preset", preset);
      router.replace(`?${params.toString()}`);
    },
    [router, search],
  );

  const toggleZone = useCallback(
    (zone: AttendanceZone) => {
      const params = new URLSearchParams(search?.toString() ?? "");
      const current = (params.get("zone")?.split(",").filter(Boolean) ?? []) as AttendanceZone[];
      const next = current.includes(zone)
        ? current.filter((z) => z !== zone)
        : [...current, zone];
      if (next.length === 0) params.delete("zone");
      else params.set("zone", next.join(","));
      router.replace(`?${params.toString()}`);
    },
    [router, search],
  );

  return { state, setPreset, toggleZone };
}

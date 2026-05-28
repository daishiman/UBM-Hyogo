"use client";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AttendanceZone } from "@ubm-hyogo/shared";
import type { PeriodPresetId } from "../lib/format-attendance";
import {
  readFilterFromQuery,
  type AttendanceFilterState,
} from "../lib/read-attendance-filter";

export { readFilterFromQuery, type AttendanceFilterState };

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

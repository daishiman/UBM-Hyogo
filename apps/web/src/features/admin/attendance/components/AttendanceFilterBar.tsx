"use client";
import type { AttendanceZone } from "@ubm-hyogo/shared";
import {
  PERIOD_PRESETS,
  SELECTABLE_ZONES,
  ZONE_LABEL,
  type PeriodPresetId,
} from "../lib/format-attendance";
import { useAttendanceFilters, type AttendanceFilterState } from "../hooks/useAttendanceFilters";
import { buildAttendanceExportUrlClient } from "./buildExportUrlClient";

interface Props {
  readonly initial: AttendanceFilterState;
}

export function AttendanceFilterBar({ initial }: Props) {
  const { state, setPreset, toggleZone } = useAttendanceFilters(initial);

  return (
    <div
      className="attendance-filter-bar"
      role="group"
      aria-label="出席分析フィルタ"
      data-testid="attendance-filter-bar"
    >
      <fieldset className="attendance-period-filter">
        <legend>期間</legend>
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={state.periodPreset === preset.id}
            data-active={state.periodPreset === preset.id}
            data-testid={`attendance-period-${preset.id}`}
            onClick={() => setPreset(preset.id as PeriodPresetId)}
          >
            {preset.label}
          </button>
        ))}
      </fieldset>
      <fieldset className="attendance-zone-filter">
        <legend>累計の出席回数</legend>
        {SELECTABLE_ZONES.map((zone) => (
          <label key={zone} data-testid={`attendance-zone-${zone}`}>
            <input
              type="checkbox"
              checked={state.zones.includes(zone as AttendanceZone)}
              onChange={() => toggleZone(zone as AttendanceZone)}
            />
            <span>{ZONE_LABEL[zone]}</span>
          </label>
        ))}
      </fieldset>
      <a
        className="attendance-export-link"
        data-testid="attendance-export-link"
        href={buildAttendanceExportUrlClient({
          periodFrom: state.periodFrom,
          periodTo: state.periodTo,
          zones: state.zones,
        })}
        download
      >
        表計算ファイルで書き出す
      </a>
    </div>
  );
}

# 2026-06-05 issue-1101-attendance-analytics-calc-correction

`issue-1101-attendance-analytics-calc-correction` を `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` として同期。

- `AttendanceZoneZ` を `zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown` へ再設計。
- `zoneFromCount(100+)` が `unknown` に落ちる境界バグを修正し、`unknown` を分類不能専用に分離。
- 旧矢印 query 値 `0→1` / `1→10` / `10→100` は API/web parser で新キーへ互換正規化。
- `AttendanceOverviewExt` に `uniqueAttendeeCount` / `uniqueAttendanceRate` を additive 追加し、`overallRate` は延べ率として明確化。
- web の `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` / `KpiPanel` を新キーと unique KPI へ同期。
- `docs/00-getting-started-manual/specs/01-api-schema.md`、quick-reference、resource-map、task-workflow-active、artifact inventory を同一 wave で同期。
- focused Vitest root 6 files / 21 tests PASS、D1 repository 1 file / 13 tests PASS。routes/migrations diff empty。
- staging authenticated screenshot、commit、push、PR は user-gated。

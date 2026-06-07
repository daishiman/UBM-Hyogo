# Phase 3: 設計レビュー

Phase 2 設計を Phase 4（テスト作成）へ進めてよいか判定する。

## レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R1 | enum 集合と `zoneFromCount` 返り値が一致するか | ✅ PASS | Phase 2 §5 の 4 面一致マップで 5 キーが完全一致 |
| R2 | `unknown` の責務が分類不能フォールバックに限定されたか | ✅ PASS | `zoneFromCount` は `<0`/NaN のみ unknown。100+ は `zone_100_plus` |
| R3 | additive field が `.strict()` schema を壊さないか | ✅ PASS | `AttendanceOverviewExtZ.extend(...).strict()` に required 2 field 追加。既存 consumer（route passthrough）は素通し |
| R4 | unique SQL の集計母数が overview と整合するか | ✅ PASS | active session（`deleted_at IS NULL`）+ active member（`is_deleted=0`）+ period clause を totalSessions / attendCount と共通化 |
| R5 | bind 順序の変更が他クエリに波及しないか | ⚠️ 要注意（PASS 条件付き） | `fetchOverviewRow` は 3 サブクエリ × period binds に増える。SELECT 出現順に bind を並べること。Phase 5 §注意 で手順固定 |
| R6 | filter 互換（旧 bookmark URL）でランタイムエラーが出ないか | ✅ PASS | `safeParse` fail → 無視（全件）。400 を返さない既存方針と整合 |
| R7 | 別ドメイン zone（成長フェーズ）を誤って変更しないか | ✅ PASS | Phase 1 §5 で `AttendanceZone` import 有無により境界確定。Phase 9 grep gate で保証 |
| R8 | D1 migration / endpoint / Form schema 不変か | ✅ PASS | SELECT のみ・schema 変更なし・route 非変更 |
| R9 | consumer wiring（unique field の表示先）が存在するか | ✅ PASS | KpiPanel に unique タイル追加で field を consume（[UT-W3] 漏れ防止） |
| R10 | 1 サイクル 1 PR で完結するか（CONST_007） | ✅ PASS | zone 是正 + unique 追加 + 4 面同期は同一型・同一ファイル群。先送り要素なし |

## MINOR 指摘（未タスク化候補・Phase 12 で記録）

- **M-1**: API filter parse 層（`parse-attendance-filter.ts`）での旧矢印 bookmark URL 救済は本タスク scope 外（Phase 2 §4）。旧 URL の後方互換が将来必要なら未タスク候補。
- **M-2**: `zone-distribution` endpoint の `zone_100_plus` 行が常時表示されることで、100+ 該当ゼロ期間に空バーが増える可能性。表示間引きルール（`unknown` 同様 count>0 で残す）を `zone_100_plus` にも適用するかは UI 判断。本タスクでは「全正常帯は常時表示・unknown のみ間引き」を踏襲。

> MINOR は機能ブロッカーではない。automation-30 再検証後、Phase 12 `unassigned-task-detection.md` に解消結果を記録する。

## ゲート判定

**Phase 4 へ進行可（GO）**。R5 のみ実装時の注意事項として Phase 5 に手順を固定済み。ブロッカー指摘なし。

## 完了条件（Phase 3）

- [ ] R1..R10 を判定し、ブロッカーが無いことを確認した。
- [ ] MINOR（M-1 / M-2）の解消結果を Phase 12 に記録した。
- [ ] GO 判定を記録した。

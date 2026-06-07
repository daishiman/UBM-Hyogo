# システム仕様更新サマリ（issue-1101-attendance-analytics-calc-correction）

Phase 12 Task 2。Step 1-A / 1-B / 1-C と Step 2（I/F 変更同期）の判定を個別に記録する。

## Step 1-A: 完了タスク記録

| 項目 | 内容 |
| --- | --- |
| 判定 | **記録済み（local implementation completed）** |
| 反映先 | workflow root（index.md / phase-1..13）・実コード・`01-api-schema.md`・aiworkflow-requirements inventory / quick-reference / resource-map / changelog / task-workflow を同 wave 同期 |
| 状態語彙 | `implemented_local_evidence_captured` で統一（index.md / artifacts.json metadata / 本サマリ） |
| 備考 | 実コード差分・focused vitest は本サイクルで実施。commit / push / PR / staging screenshot は user-gated |

## Step 1-B: 実装状況の判定

| 項目 | 内容 |
| --- | --- |
| 判定 | **`implemented_local_evidence_captured`** |
| 根拠 | `apps/api` / `packages/shared` / `apps/web` / `docs` への実変更を完了し、focused Vitest（root 6 files / 21 tests、D1 repository 1 file / 13 tests）を PASS。Phase 13（commit / PR / staging）は user-gated |
| drift チェック | index.md・artifacts.json・Phase 11/12 すべてで `implemented_local_evidence_captured` と user-gated 境界を分離 |

## Step 1-C: 関連タスクの再同期

| 項目 | 内容 |
| --- | --- |
| 判定 | **記録済み** |
| 親タスク | `docs/30-workflows/admin-attendance-dashboard-ux/`（#1108 merged・完了済み）。本タスクはその Phase 12 で検出された「計算意味論の残課題」を formalize したもの |
| 参照 grep | 親タスク Phase 12 の `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（分離 spec）を本 workflow root が consume した関係。親子の単方向リンクを維持 |
| 重複確認 | `git log` 上、親 #1108 以降に `attendance-analytics.ts` / `admin-attendance.ts` の本修正は存在せず。別タスクでの先行修正なし（本タスクは未解決課題に対する必要タスク） |

## Step 2: I/F 変更同期（system spec 更新要否）

| 項目 | 内容 |
| --- | --- |
| 判定 | **該当（system spec 更新要）** |
| 変更 I/F | (1) `AttendanceZoneZ` enum 値集合の再設計（`zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown`、旧矢印値廃止）。(2) `AttendanceOverviewExt` に additive field `uniqueAttendeeCount`（int nonneg）/ `uniqueAttendanceRate`（0..1）を追加 |
| 更新対象 doc | `docs/00-getting-started-manual/specs/01-api-schema.md`（Zone 派生規則・集計母数定義・overview response shape を新仕様へ更新済み） |
| 更新内容 | Zone 派生: `>=100 → 'zone_100_plus'`（旧 `>=100 → 'unknown'` の是正）。overview response: `uniqueAttendeeCount` / `uniqueAttendanceRate` を additive で追記。`overallRate`（延べ率 = attendCount / (totalSessions × totalMembers)）の分母・分子を明記 |
| 4 面一致 | API `zoneFromCount` / shared `AttendanceZoneZ` / web `ZONE_LABEL` / doc `01-api-schema.md` の 4 面で zone キーと rate 定義を一致させる（Phase 2 §5 の 4 面一致マップが正本） |
| 注意 | endpoint path / HTTP method / D1 schema は **非変更**（AC-8）。response shape は additive のみ（`.strict()` 維持）。旧矢印 `zone` query は API/web の parse 層で新キーへ互換正規化 |

## 同値転記の整合

`workflow_state` / Step 2 判定 / 変更ファイル集合は本サマリ・`documentation-changelog.md`・`phase12-task-spec-compliance-check.md`・`unassigned-task-detection.md` で同一値を用いる。
- workflow_state = `implemented_local_evidence_captured`
- Step 2 = 該当（01-api-schema.md 更新済み）
- 未タスク current = 0（M-1 実装済み、M-2 設計判断完了）

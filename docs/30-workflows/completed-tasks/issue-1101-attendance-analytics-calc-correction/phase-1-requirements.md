# Phase 1: 要件定義

## §0 実装区分の判定（CONST_004）

- **判定: [実装区分: 実装仕様書]**（デフォルト）。
- 根拠: 本タスクの目的は「`zoneFromCount` の境界バグ修正」「`AttendanceZone` enum の再設計」「unique 指標の API 追加」「UI label / KPI の追従」であり、**コード変更なしでは目的を達成できない**（API/shared/web/doc/test の 4 面を同一変更セットで揃える）。issue #1101 は CLOSED だが、ユーザー指示により「クローズド維持のまま仕様書化」する。issue 自体の状態は変更しない。

## §1 タスク分類

- taskType: `implementation`（NON_VISUAL 寄りだが KPI タイル 1 件追加・label 文言変更があるため visualEvidence は `VISUAL`）
- implementation_mode: `new`（P50 チェック結果: current branch / upstream いずれにも本修正の実装は存在しない → 通常の TDD RED/GREEN サイクル）
- 単一責務: 「出席分析の計算意味論（zone 境界・延べ/unique rate）の是正と 4 面同期」。

### P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の実装 Phase（Phase 5 = 新規実装） |
| upstream（dev/main）にマージ済み | No（`git log` で親 #1108 以降に該当修正なし） | 未マージとして扱う |
| 前提タスク（`admin-attendance-dashboard-ux`）完了済み | Yes（#1108 merged） | 依存解消済み。UI ラベルは現行境界に忠実なため本タスクと独立実装可能 |

## §2 受け入れ基準（AC・正本）

- **AC-1**: `zoneFromCount(n)` が `n >= 100` で `zone_100_plus` を返し、`unknown` に落ちない。`n < 0` / `!Number.isFinite(n)` のみ `unknown`。
- **AC-2**: 旧矢印 enum 値（`"0→1"` / `"1→10"` / `"10→100"`）が `AttendanceZoneZ` の enum メンバーから消える。`normalizeZone` は新キーをそのまま返し、旧矢印値は互換マッピング（`"0→1"→"zone_0"` 等）で吸収する。互換マッピングに明示テストがある。
- **AC-3**: `overallRate`（延べ率 = 出席イベント総数 / 出席可能枠総数）、`uniqueAttendeeCount`（期間内 1 回以上出席の active member 数）、`uniqueAttendanceRate`（uniqueAttendeeCount / totalMembers, 0..1 clamp）の定義がコード・schema・doc・UI ラベルで一致。
- **AC-4**: `AttendanceZoneZ` の enum 集合と `zoneFromCount` の返り値集合が完全一致（`zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown`）。
- **AC-5**: `ZONE_LABEL` が新キー 5 種を網羅（`unknown` = 「分類不能」）、`SELECTABLE_ZONES` が `unknown` を除く 4 種。`ZONE_HELP` の文言が新境界と整合。
- **AC-6**: `KpiPanel` が `uniqueAttendanceRate` / `uniqueAttendeeCount` を表示する KPI タイル（`data-testid="attendance-kpi-unique"`）を持ち、additive field を consume する（consumer wiring 完結 [UT-W3]）。
- **AC-7**: focused vitest（API internals / repository / web format / web KpiPanel）・`pnpm typecheck`・`pnpm lint` が PASS。
- **AC-8**: `git diff --name-only -- apps/api/migrations apps/api/src/routes` が空（D1 migration / endpoint path / method 不変）。Google Form schema 差分ゼロ。

## §3 inventory（変更対象棚卸し）

事前棚卸しコマンド（実装着手時に実行）:

```bash
rg -n '"0→1"|"1→10"|"10→100"|AttendanceZone|zoneFromCount|overallRate|unique_member_count' \
  apps/api/src apps/web/src/features/admin/attendance packages/shared \
  docs/00-getting-started-manual/specs/01-api-schema.md
```

### 変更対象ファイル一覧

| パス | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/api/src/repository/attendance-analytics.ts` | 編集 | `zoneFromCount` 境界修正・`normalizeZone` 互換マッピング・`counts` Record / `zones` 配列を新キーへ・`computeAttendanceOverviewExt` に unique 計算追加 |
| `packages/shared/src/zod/admin-attendance.ts` | 編集 | `AttendanceZoneZ` enum 再設計・`AttendanceOverviewExtZ` に `uniqueAttendeeCount` / `uniqueAttendanceRate` 追加 |
| `apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts` | 編集 | 境界値・normalize の期待値を新キーへ |
| `apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts` | 編集 | overview rate / unique / zone distribution の期待値 |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 編集 | `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` 追従 |
| `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 編集 | label 期待値追従 |
| `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 編集 | unique KPI タイル追加 |
| `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 編集 | unique タイル test 追加 |
| `apps/api/src/lib/parse-attendance-filter.ts` | 編集 | 旧矢印 `zone` query を新キーへ互換正規化 |
| `apps/api/src/lib/__tests__/parse-attendance-filter.spec.ts` | 編集 | 旧矢印 query 互換 test 追加 |
| `apps/web/src/features/admin/attendance/lib/read-attendance-filter.ts` | 編集 | web query reader で旧矢印 `zone` を新キーへ互換正規化 |
| `apps/web/playwright/fixtures/auth.ts` | 編集 | local Playwright mock API の attendance zone fixture を新キーへ同期 |
| `apps/web/playwright/tests/issue-1101-attendance-analytics-calc-correction.spec.ts` | 新規 | Phase 11 local screenshot evidence（desktop/mobile）取得 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | Zone 派生・集計母数・overview response shape を新仕様へ |

### 連動確認のみ（変更しないが破綻しないこと）

| パス | 確認内容 |
| --- | --- |
| `apps/web/src/lib/admin/fetch-attendance.ts` | `AttendanceZone` 型 import。型整合のみ |
| `apps/api/src/routes/admin/attendance.ts` | overview を passthrough。reshape していないこと（追加 field がそのまま通る）を確認・**変更しない** |

## §4 命名規則の分析（既存コードベース）

- shared zod enum: 文字列リテラル。既存 `AttendanceTrendBucket` 等は camelCase field。新キーは **snake_case の機械可読キー**（`zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus`）を採用 → ユーザー確定（推奨案）。理由: 表示文字列（矢印）とキーを分離し、web `ZONE_LABEL` で日本語表示を持つ。
- repository helper: `zoneFromCount` / `normalizeZone`（camelCase）— 既存命名を踏襲。
- web field: `uniqueAttendeeCount` / `uniqueAttendanceRate`（camelCase）— `AttendanceTrendBucket.uniqueMemberCount` の前例に倣う。
- test 命名: `*.spec.ts(x)` のみ（不変条件 #8）。

## §5 スコープ境界の厳格化（別ドメイン非変更）

`0→1` / `1→10` / `10→100` という**視覚ラベル**は本リポジトリで 2 つの無関係なドメインに登場する:

1. **出席回数帯（本タスク対象）**: `@ubm-hyogo/shared` の `AttendanceZone` 型。出席分析専用。
2. **UBM 事業成長フェーズ（本タスク非対象）**: 会員企業の成長段階（立ち上げ/拡大/組織化）。`byZone.ts`（`0to1`/`1to10`/`10to100`）、`AboutUbm.tsx` / `MemberFilters.client.tsx` / `SelectedFiltersBar.client.tsx`（`0_to_1`/`1_to_10`/`10_to_100`）。**`AttendanceZone` 型を import していない**。

→ 本タスクは (1) のみ変更する。(2) のファイルは grep gate（Phase 9）で「触れていないこと」を保証する。

## 完了条件（Phase 1）

- [ ] 実装区分が `[実装区分: 実装仕様書]` と判定・記録された。
- [ ] AC-1..AC-8 が確定した。
- [ ] 変更対象ファイル一覧・連動確認・別ドメイン非変更境界が棚卸しされた。
- [ ] 命名規則（snake_case enum キー / camelCase field）が確定した。

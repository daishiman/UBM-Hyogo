[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新（Documentation Update / Workflow Close-out）

> 依存: Phase 11 local evidence summary。VISUAL runtime screenshot / staging evidence が未取得の場合は `implemented_local_runtime_pending` として close-out し、staging/browser PASS を主張しない。
> 後続: Phase 13（PR 仕上げ・最終リリース判定）。commit / push / PR はユーザー明示承認後のみ。

## 0. 目的

1. 実装内容を **AI/人間どちらも辿れる粒度** でドキュメント化（Task 12-1: 2 パート構成 = 中学生レベル概念 + 技術詳細）。
2. システム正本仕様（`docs/00-getting-started-manual/specs/01-api-schema.md`）と本ワークフローの **整合性** を取り、`artifacts.json` の状態遷移 `spec_created → implemented_local_runtime_pending` を実施（Task 12-2）。
3. ドキュメント更新履歴を **workflow-local 同期 と global skill sync** で別ブロックとして記録（Task 12-3, FB BEFORE-QUIT-003）。
4. Phase 10 で formalize した unassigned-tasks に加え、Phase 11 改善提案 / 残存 TODO/FIXME / describe.skip を **0 件でも明示** で報告（Task 12-4, FB-CANCEL-004-2）。
5. スキル / ワークフロー / ドキュメント観点で改善フィードバックを返す（Task 12-5）。
6. **6 成果物が揃い、artifact 名 parity・identifier drift が無い** ことを確認（Task 12-6, FB W1-02b-3）。

## 1. 入力

- `_shared-context.md` §3〜§9
- `outputs/phase-2/` 〜 `outputs/phase-11/` の全アウトプット（特に Phase 10 `final-review-result.md` / `unassigned-tasks.yaml`、Phase 11 `visual-evidence-index.md`）
- `artifacts.json`（current）
- 正本仕様: `docs/00-getting-started-manual/specs/01-api-schema.md`（特に L184-214 Admin Dashboard Attendance API セクション）
- 関連 ledger / index:
  - `docs/30-workflows/_backlog/index.md`
  - `docs/30-workflows/_completed/index.md`
  - `docs/30-workflows/_lanes/index.md`
  - `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/index.md`
  - `docs/00-getting-started-manual/specs/_index.md`
- フィードバックチケット: `FB BEFORE-QUIT-003` / `FB-CANCEL-004-2` / `FB W1-02b-3` / `FB-04`

## 2. Task 12-1: 実装ガイド（2 パート構成）

### 2.1 出力ファイル

`outputs/phase-12/implementation-guide.md`

### 2.2 Part 1: 中学生レベル概念説明

> 対象: 非エンジニア / 新規参画者 / 半年後に自分が読み返した時にも理解できる粒度。

**比喩**: 「出席分析ページ」は **学校行事の出席簿** に相当する。

- **セッション（meeting_session）** = 「文化祭」「体育祭」のような **1 回の行事**。日付（held_on）とタイトル（title）を持つ。
- **メンバー出席（member_attendance）** = 「誰が、どの行事に出席したか」のチェック表。1 人 × 1 行事 = 1 行（複合主キー）。
- **区画（zone: 0→1 / 1→10 / 10→100）** = メンバーを **「初参加 / 中堅 / ベテラン」** の 3 グループに分けたもの（過去の出席回数で自動分類）。
- **出席率** = ある期間内に「行事の総回数」分の「実出席回数」を割った値。クラスの出席率と同じ計算。
- **トレンド** = 月ごとの出席率を **折れ線グラフ** で並べたもの。学期成績の推移グラフと同じ見方。
- **TOP10 ランキング** = 出席回数の多いメンバーを **順位表** にしたもの。皆勤賞候補。
- **欠席アラート** = 「直近 N 回連続で来ていないメンバー」を **赤いリスト** で表示。担任が声をかけるべき生徒の一覧。
- **CSV エクスポート** = この出席簿を **Excel に貼り付けられる形式** でダウンロードする機能。

**画面の流れ**: ページを開く → 期間フィルタ（今月/3M/6M/1Y/All）と区画フィルタ（0→1, 1→10, 10→100）を選ぶ → KPI 4 枚（全体出席率 / 総出席者数 / 平均出席数 / トレンド比）が上に並ぶ → トレンド折れ線と区画別積上げ棒が並ぶ → セッションテーブル（クリックで詳細 Modal）→ メンバーテーブル → TOP10 → 欠席アラート、の順で読む。

### 2.3 Part 2: 技術的詳細

#### 2.3.1 TS interface（packages/shared 配置）

```ts
// packages/shared/src/types/admin-attendance.ts (re-export from zod)
export type AttendanceTrendBucket = z.infer<typeof AttendanceTrendBucketZ>;
export type AttendanceTrend = z.infer<typeof AttendanceTrendZ>;
export type AttendanceZoneDistributionRow = z.infer<typeof AttendanceZoneDistributionRowZ>;
export type AttendanceSessionDetail = z.infer<typeof AttendanceSessionDetailZ>;
export type AttendanceAbsentee = z.infer<typeof AttendanceAbsenteeZ>;
```

#### 2.3.2 API シグネチャ（8 endpoints, base = `/admin/dashboard/attendance`）

| Method | Path | Query | Response Zod | 区分 |
| --- | --- | --- | --- | --- |
| GET | `/overview` | `periodFrom?`, `periodTo?`, `zone?` | `AttendanceOverviewZ` (拡張) | 既存拡張 |
| GET | `/by-session` | `limit?`, `periodFrom?`, `periodTo?`, `zone?` | `SessionAttendanceRowZ[]` | 既存拡張 |
| GET | `/ranking` | `limit?`, `periodFrom?`, `periodTo?`, `zone?` | `MemberAttendanceRankingZ[]` | 既存拡張 |
| GET | `/trend` | `periodFrom?`, `periodTo?`, `granularity=month` | `AttendanceTrendZ` | 新規 |
| GET | `/zone-distribution` | `periodFrom?`, `periodTo?` | `AttendanceZoneDistributionRowZ[]` | 新規 |
| GET | `/sessions/:sessionId/attendees` | - | `AttendanceSessionDetailZ` | 新規 |
| GET | `/absentees` | `lastN=3`, `periodFrom?`, `periodTo?`, `zone?` | `AttendanceAbsenteeZ[]` | 新規 |
| GET | `/export` | `periodFrom?`, `periodTo?`, `zone?`, `format=csv` | `text/csv` (UTF-8 BOM) | 新規 |

#### 2.3.3 Zod（`packages/shared/src/zod/admin-attendance.ts`）

shared-context §3 「新規 Zod スキーマ」に準拠。**全 schema `.strict()`**。`AttendanceOverviewZ` に `periodFrom / periodTo / zoneFilter / previousPeriodRate` を追加。

#### 2.3.4 エラーハンドリング

- API: `requireAdmin` 失敗 → 401。limit / period パース失敗 → **400 を返さず default fallback (clamp)**（shared-context §3 URL クエリ規約 / 正本 L186-194）。集計 500 → 既存 `safe-fetch` で `ADMIN_FETCH_500` 正規化。
- Web: `safeServerFetch<T>()` で `SafeResult<T | SafeResultError>` を返却。partial failure は `AdminSectionErrorClient` で degrade 表示（page error.tsx へ throw しない）。

#### 2.3.5 設定パラメータ

| key | default | range | 所在 |
| --- | --- | --- | --- |
| `limit` | 50 | 1〜200 (clamp) | `dashboard.ts:33-39` |
| `lastN`（absentees） | 3 | 1〜10 (clamp) | `attendance-absentees.ts` |
| `granularity`（trend） | `month` | enum: `month` のみ（将来 `week` 拡張余地） | `attendance-trend.ts` |
| `format`（export） | `csv` | enum: `csv` のみ | `attendance-export.ts` |
| `INTERNAL_API_BASE_URL` | - | 環境別 | `server-fetch.ts` |
| `x-internal-auth` | - | secret | `server-fetch.ts` |

### 2.4 視覚証跡セクション

Phase 11 で生成された canonical screenshot を **canonical 名** で参照（rename 禁止）:

```markdown
## Visual Evidence

- ![overview-desktop](../phase-11/screenshots/admin-attendance-overview-desktop.png)
- ![overview-mobile](../phase-11/screenshots/admin-attendance-overview-mobile.png)
- ![period-filter-3M](../phase-11/screenshots/admin-attendance-period-filter-3M.png)
- ![zone-filter](../phase-11/screenshots/admin-attendance-zone-filter.png)
- ![trend-chart](../phase-11/screenshots/admin-attendance-trend-chart.png)
- ![zone-distribution](../phase-11/screenshots/admin-attendance-zone-distribution.png)
- ![session-table](../phase-11/screenshots/admin-attendance-session-table.png)
- ![drilldown-modal](../phase-11/screenshots/admin-attendance-drilldown-modal.png)
- ![member-table](../phase-11/screenshots/admin-attendance-member-table.png)
- ![top10](../phase-11/screenshots/admin-attendance-top10.png)
- ![absentee-alert](../phase-11/screenshots/admin-attendance-absentee-alert.png)
- ![csv-export](../phase-11/screenshots/admin-attendance-csv-export.png)
```

ファイル名は Phase 11 で確定した canonical を一字一句変えない（identifier drift 防止）。存在しない場合は Phase 11 へ差し戻し。

### 2.5 完了条件

- `implementation-guide.md` に Part 1 / Part 2 / Visual Evidence 3 セクションが揃う
- Part 1 が**比喩のみで書かれており**専門用語（Zod / SafeResult / D1 等）が登場しない
- Part 2 の API 表が 8 endpoints 全て埋まる
- canonical screenshot 12 枚（最低 8 枚）が参照解決可能（broken link 0）

## 3. Task 12-2: システム仕様更新

### 3.1 出力ファイル

`outputs/phase-12/system-spec-update-summary.md`

### 3.2 Step 1-A: 完了タスク記録（テスト件数 / 成果物テーブル）

`system-spec-update-summary.md` 冒頭に以下表を埋める:

```markdown
## Completed Tasks (admin-attendance-analytics-redesign)

| 種別 | 件数 | 出所 |
| --- | --- | --- |
| API contract spec | <N> | apps/api/src/routes/admin/__tests__/attendance-analytics.contract.spec.ts |
| API repository spec | <N> | apps/api/src/repository/__tests__/attendance-analytics.spec.ts |
| Web vitest | <N> | apps/web/src/features/admin/attendance/__tests__/*.spec.tsx |
| Playwright visual | <N> | apps/web/playwright/tests/visual/admin-attendance.spec.ts |
| 合計 | <N> | - |

## Deliverables

| 種別 | path | 行数 | 状態 |
| --- | --- | --- | --- |
| Web Component | apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx | <N> | new |
| ... | ... | ... | ... |
```

shared-context §6「新規作成」「編集」全ファイルを 1 行ずつ列挙し、Phase 7 実装サマリ（`outputs/phase-7/web-impl-summary.md` 等）から行数を引用。

### 3.3 Step 1-B: 実装状況テーブル更新（状態語彙）

`artifacts.json` の `phases.phase-1` 〜 `phases.phase-12` の `status` は、ローカル実装・テスト・Phase 11 local evidence が揃った場合 `completed` に更新する。staging visual evidence が未取得の場合は root `metadata.workflow_state = implemented_local_runtime_pending` とし、Phase 13 は `pending` のまま維持する。

ルート `status` も `spec_created → completed` に遷移。

更新前後の **diff** を `system-spec-update-summary.md` §「artifacts.json diff」に貼付。

```diff
- "status": "spec_created",
+ "status": "completed",
- "phase-1": { "status": "spec_created", "artifact": "phase-1.md" },
+ "phase-1": { "status": "completed", "artifact": "phase-1.md" },
... (phase-12 まで)
```

### 3.4 Step 1-C: 関連タスクテーブル更新

Phase 10 §6.2 で `superseded_by: admin-attendance-analytics-redesign` 候補として識別された関連ワークフロー（`outputs/phase-10/final-review-result.md` §4 related_task_diff から転記）を以下表に記録:

```markdown
## Related Tasks Resolution

| workflow | relation | action | resulting status |
| --- | --- | --- | --- |
| <path> | superseded | close | superseded |
| <path> | partial-overlap | unassigned-task | unassigned |
```

`close` 判定したものは `docs/30-workflows/<wf>/index.md` の status を `superseded` に更新し、`superseded_by: admin-attendance-analytics-redesign` を frontmatter / metadata に追記。

### 3.5 Step 2: 正本 `docs/00-getting-started-manual/specs/01-api-schema.md` 更新

#### 3.5.1 対象セクション

L184-214 付近「Admin Dashboard Attendance API」セクション。

#### 3.5.2 差分内容

- 既存 3 endpoints (`/overview`, `/by-session`, `/ranking`) の query に `periodFrom?`, `periodTo?`, `zone?` を追加（型・default・clamp 仕様明記）。
- 新規 5 endpoints (`/trend`, `/zone-distribution`, `/sessions/:sessionId/attendees`, `/absentees`, `/export`) を追記。各 endpoint に:
  - HTTP method / path / query 定義
  - response Zod 名（`packages/shared/src/zod/admin-attendance.ts` 参照）
  - エラー仕様（401 / 400 不可 / 500 → `ADMIN_FETCH_500`）
  - 例レスポンス（最低 1 件）
- Zod 拡張: `AttendanceOverviewZ` の追加フィールド (`periodFrom / periodTo / zoneFilter / previousPeriodRate`) を仕様文に追記。

#### 3.5.3 更新手順

1. 該当セクションを diff（Phase 6 `api-impl-summary.md` の API 設計と突き合わせ）
2. `pnpm --filter @ubm-hyogo/shared test` で Zod schema と spec の一致を確認
3. 更新差分（unified diff）を `system-spec-update-summary.md` §「01-api-schema.md diff」に貼付

### 3.6 完了条件

- `system-spec-update-summary.md` が §3.2 / §3.3 / §3.4 / §3.5 全セクションを含む
- `artifacts.json` の status 遷移が実施され、JSON が valid（`python3 -m json.tool` パス）
- `01-api-schema.md` が更新され、新規/拡張 8 endpoints と Zod 拡張が反映

## 4. Task 12-3: ドキュメント更新履歴

### 4.1 出力ファイル

`outputs/phase-12/documentation-changelog.md`

### 4.2 構成（FB BEFORE-QUIT-003: 別ブロック必須）

```markdown
# Documentation Changelog (Phase 12)

## Block A: Workflow-local 同期

> 本ワークフロー配下のドキュメント更新。リポジトリ内完結。

| timestamp (ISO8601) | file | change_type (added/modified/deleted) | summary |
| --- | --- | --- | --- |
| <ISO> | docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/artifacts.json | modified | status: spec_created → completed |
| <ISO> | docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/index.md | modified | phase-12 completion entry 追加 |
| <ISO> | docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/phase-12/*.md | added | 6 成果物 |
| <ISO> | docs/00-getting-started-manual/specs/01-api-schema.md | modified | Admin Attendance API 8 endpoints + Zod 拡張 |
| <ISO> | docs/30-workflows/_backlog/index.md | modified | 本ワークフロー entry を completed lane に移動 |
| <ISO> | docs/30-workflows/_completed/index.md | modified | 本ワークフロー entry 追記 |
| <ISO> | docs/30-workflows/_lanes/index.md | modified | lane 状態同期 |
| <ISO> | docs/00-getting-started-manual/specs/_index.md | modified | 01-api-schema.md セクションリンク更新 |

## Block B: Global skill sync

> リポジトリ外（global skill: skill-creator / skill-intake / task-specification-creator など）への反映。

| timestamp (ISO8601) | skill | scope | change_type | summary | sync_status |
| --- | --- | --- | --- | --- | --- |
| <ISO> | task-specification-creator | Phase 12 規約 | feedback | 「視覚証跡セクション canonical 名 rename 禁止」運用知見 | pending |
| <ISO> | skill-creator | ledger 5 点同 wave 更新 | feedback | FB-04 既知パターン再確認 | pending |
| <ISO> | (該当なしの場合) | - | - | global skill 反映不要 | n/a |

> sync_status は `pending / synced / n/a` のいずれか。`pending` の場合は Phase 13 / 後続フォローで処理。
```

### 4.3 完了条件

- Block A / Block B が **明確に別セクション** として存在（ヘッダ重複禁止、混在禁止）
- 該当なしの場合も Block B 自体は出力（行内 `n/a` で明示）

## 5. 詳細手順 appendix

500行制限を守るため、以下は [phase-12-appendix.md](phase-12-appendix.md) へ責務分離する。

- Task 12-4 未タスク検出の詳細フォーマット
- Task 12-5 スキルフィードバック観点
- Task 12-6 コンプライアンスチェックの詳細項目
- close-out 同期チェックリスト
- Phase 12 全体完了条件
- 失敗時リカバリ

# Phase 12: ドキュメント更新

実装区分: 実装仕様書（CONST_004 デフォルト適用 — admin 出席ダッシュボードの実装に伴う正本 spec / index 同期を実装仕様書として記述）

## 12.1 outputs 一覧（Phase 12 の 6 必須タスク）

| # | 必須タスク | 配置 | 内容 |
| --- | --- | --- | --- |
| T1 | 実装ガイド作成 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル） |
| T2 | システム仕様書更新 | `outputs/phase-12/system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/01-api-schema.md` への admin dashboard attendance API 追加・`08-free-database.md` への analytics index 追記 |
| T3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` | 本タスクで更新したドキュメント一覧 |
| T4 | 未タスク検出レポート | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力必須 |
| T5 | スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力必須 |
| T6 | コンプライアンスチェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` | CONST_001〜CONST_007 適合確認 |

## 12.2 implementation-guide 概要（T1）

### Part 1: 中学生レベル概念説明

- 「集会に誰がどれくらい来てくれているかを、数えて絵にして見せるダッシュボード」
- 「同じ生データから 3 つの見方（全体合計 / 集会別 / 会員別ランキング）を作る」
- 「データを毎回ゼロから数えると遅いので、データベースに『見出し（index）』を貼って早く検索できるようにする」
- 「画面は admin（運営役）しか見られないように鍵がかかっている」

### Part 2: 技術者レベル設計

- aggregate 関数を `apps/api/src/repository/attendance.ts` 末尾に追記する方針（既存 read/write を壊さない）
- 3 endpoint は **同一 repository 関数群を共有**し、route layer は I/O 整形のみ（chunk pattern 流用禁止: 既存 chunk 実装は member listing 用途で出席集計には不適合）
- `apps/api/migrations/00XX_attendance_analytics_indexes.sql` で `idx_member_attendance_member` のみを新設し、session 側は既存 `idx_member_attendance_session`、meeting 側は既存 `idx_meeting_sessions_active_held_on` を流用
- admin UI は `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` で Server Component → API fetch
- 認証は既存 admin gate (`requireAdminSession`) を経由、route 単体迂回禁止
- 大量データケースの p95 < 300ms を EXPLAIN + Workers Analytics で担保

### chunk pattern 流用禁止方針

既存の chunk 集計パターン（member listing で利用）は 1 entity に対する pagination 用途であり、本 dashboard の cross-entity GROUP BY aggregate には適用しない。誤って chunk を流用すると N+1 発行になるため禁止する。本実装は **単一 SQL の GROUP BY** で集計し、index で性能を担保する。

## 12.3 system-spec-update 影響（T2）

| spec ファイル | 変更内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `Admin Dashboard Attendance Analytics API` セクション新設（overview / by-session / ranking の path / query / response schema） |
| `docs/00-getting-started-manual/specs/08-free-database.md` | analytics index 1 本（`idx_member_attendance_member`）の D1 free tier 容量影響を追記。既存 index 流用分は重複追加しない |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-370 attendance dashboard close-out 行を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | UT-02A followup-002 entry 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | implemented-local entry として登録 |
| `.claude/skills/aiworkflow-requirements/changelog/20260506-ut-02a-followup-002-attendance-dashboard-analytics.md` | 同一 wave 反映 changelog 追加 |

aiworkflow-requirements skill との同一 wave 反映を必須とする（spec / index / changelog がドリフトしないよう本 Phase 内で完結させる）。

## 12.4 documentation-changelog（T3）

実装完了時に以下を `outputs/phase-12/documentation-changelog.md` に列挙する:

- `index.md` / `phase-01.md`〜`phase-13.md`（本仕様書群）
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- aiworkflow-requirements `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` / `changelog/*.md`
- 起票元 unassigned task の解消記録（該当があれば）

## 12.5 未タスク検出レポート（T4）

`outputs/phase-12/unassigned-task-detection.md` に以下を記録:

- 検出件数（0 件でも出力必須）
- 検出があれば: scope out した将来拡張点（CSV export / 月次自動集計 / 個人別 timeline 詳細など）を別 Issue 候補として列挙
- 本タスクスコープ内で対応した範囲との境界を明記

## 12.6 skill-feedback-report（T5）

`outputs/phase-12/skill-feedback-report.md` に以下を記録（改善点なしでも出力必須）:

| skill | 観察 / 提案 |
| --- | --- |
| task-specification-creator | VISUAL タスク × admin UI で screenshot 推奨枚数 30+ ガイドが Phase 11 テンプレに整合することを確認 |
| aiworkflow-requirements | `01-api-schema.md` への admin dashboard セクション追記の経路を確認、analytics index 追記の `08-free-database.md` 経路も確立済み |

## 12.7 7 ファイル実体確認 ledger

Phase 12 完了条件として以下 7 ファイルが実体存在することを ledger で確認する。aiworkflow changelog は same-wave sync の追加成果物であり、7 ファイル ledger には数えない:

| # | ファイル | 存在確認 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | ☐ |
| 2 | `outputs/phase-12/implementation-guide.md` | ☐ |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | ☐ |
| 4 | `outputs/phase-12/documentation-changelog.md` | ☐ |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | ☐ |
| 6 | `outputs/phase-12/skill-feedback-report.md` | ☐ |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ☐ |

## 12.8 CONST_001〜007 適合確認（T6）

| 制約 | 適合 | 根拠 |
| --- | --- | --- |
| CONST_001 設計書（Phase 1-3）完成までタスク仕様書に着手しない | ✅ | Phase 1→2→3→4... の順で作成 |
| CONST_002 コミット・PR・push 禁止（指示なし） | ✅ | spec drafted のみ。Phase 13 で user 承認後に PR 作成 |
| CONST_003 テンプレート機械適用ではなくタスク特性最適化 | ✅ | VISUAL タスクとして UI screenshot 30+ / EXPLAIN gate / chunk pattern 流用禁止を本タスク固有に展開 |
| CONST_004 デフォルトは実装仕様書 | ✅ | 全 phase 冒頭に「実装区分: 実装仕様書（CONST_004 デフォルト適用 — ...）」明記 |
| CONST_005 実装仕様書必須項目 | ✅ | 変更ファイル一覧 / 入出力定義 / ローカル実行コマンド / DoD を Phase 2-10 に完備 |
| CONST_006 実装の「実行」は本プロンプト責務外 | ✅ | 本サイクルでは local implementation と focused tests まで実行済み。runtime curl / browser screenshot 採取は user-approved runtime capture cycle で実行 |
| CONST_007 1 サイクル内完了スコープ / 先送り禁止 | ✅ | 本サイクルで検出した仕様矛盾・outputs 欠落・正本索引欠落・コード集計不整合は同一サイクル内で修正。runtime capture は環境起動と認証が必要な visual evidence boundary として残す |

## 12.9 VISUAL_ON_EXECUTION close-out 状態

本 Phase 12 完了時点での状態語彙:

- local implementation + focused tests completed → `implemented-local / local_tests_passed_visual_runtime_pending`
- runtime PASS は別途 user-approved capture cycle で採取（Phase 11 evidence ledger に従う）
- runtime PASS 確認後に `PASS_RUNTIME_VERIFIED` へ昇格

## 12.10 DoD

- 12.1 全 6 outputs と Phase 12 main が `outputs/phase-12/` に存在
- 12.3 aiworkflow-requirements index / changelog 同一 wave 反映済み
- 12.7 7 ファイル ledger 全 ✅
- 12.8 CONST_001〜007 全 ✅
- 12.9 close-out 状態が `implemented-local / local_tests_passed_visual_runtime_pending` で記録

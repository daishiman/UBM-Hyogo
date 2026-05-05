# ut-02a-attendance-profile-integration — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-attendance-profile-integration |
| タスクID | task-imp-02a-attendance-profile-integration-001 |
| ディレクトリ | docs/30-workflows/ut-02a-attendance-profile-integration |
| Issue | #107 |
| 親タスク | 02a-parallel-member-identity-status-and-response-repository |
| Wave | 2 (follow-up / improvement) |
| 実行種別 | sequential (single-task improvement) |
| 作成日 | 2026-05-01 |
| 担当 | implemented in this branch |
| 状態 | implemented |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | priority:medium |
| 発見元 | 02a Phase 12 unassigned-task-detection |

## purpose

`apps/api/src/repository/_shared/builder.ts` 内の `MemberProfile.attendance: []` stub を排除し、
`meeting_sessions` / `member_attendance` テーブルから取得した実出席履歴を `MemberProfile` に注入する。
N+1 を発生させずバッチ取得経路を確立し、マイページおよび admin 詳細画面で出席履歴 UI を機能させる。

02a で固定された `MemberProfile.attendance: AttendanceRecord[]` の型契約はそのまま維持し、
本タスクは内部実装と repository 新設のみを行う（interface 破壊的変更なし）。

## scope in / out

### scope in

- `meeting_sessions` / `member_attendance` テーブル定義の確認、不足カラム / index のマイグレーション差分起票
- `apps/api/src/repository/attendance.ts` に `AttendanceProvider.findByMemberIds()` を実装
- `apps/api/src/repository/_shared/builder.ts` の `attendance: []` stub 排除と attendance 注入経路追加
- branded type `MeetingSessionId` / `AttendanceRecordId` の独立 module 定義
- N+1 防止（`IN (?,?,...)` バッチ + bind 上限チャンク分割）
- 単体テスト（attendance 0/1/N 件、削除 meeting 除外、重複登録、100 件超 chunk）
- 統合テスト（builder への attendance 注入、02a 既存テスト regression なし）
- API 通電確認（`/me/profile` 等のエンドポイントで attendance が返ること）
- マイページ / admin 詳細画面の通電確認（既存 UI 流用、新規 UI 実装なし）
- 02a Phase 12 `unassigned-task-detection.md` の本項目を「解消済み」へ更新

### scope out

- 出席登録 / 編集 / 削除（write 系オペレーション）
- meeting session 自体の CRUD（02b 側スコープ）
- attendance 集計ダッシュボード / 統計可視化
- `MemberProfile` interface の構造変更（02a 確定済み契約を保護）
- 出席履歴 UI の新規実装 / デザイン変更（既存 UI 流用のみ）
- production deploy（09a/09b 責務）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a `parallel-member-identity-status-and-response-repository` | `MemberProfile` interface / builder 責務確定済み |
| 上流 | 02b `parallel-meeting-tag-queue-and-schema-diff-repository` | meeting domain 側との境界 / schema diff 取扱い |
| 推奨並列 | attendance 専用タスク（独立切り出し時） | 02b スコープが膨張する場合の代替経路 |
| 参照 | 02a Phase 12 `outputs/phase-12/unassigned-task-detection.md` | 発見元 |
| 参照 | 02a Phase 12 `outputs/phase-12/implementation-guide.md` | builder 責務範囲 |
| external gate | D1 schema availability | `meeting_sessions` / `member_attendance` の利用可能性確認 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件全般 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | API schema / repository 契約 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 / bind 上限制約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | 旧単票（本 workflow root が正本に昇格） |
| 必須 | apps/api/src/repository/_shared/builder.ts | 修正対象 |
| 参考 | apps/api/src/repository/ | 既存 repository pattern |
| 参考 | docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/ | 親タスク |

## AC（Acceptance Criteria）

- AC-1: `apps/api/src/repository/_shared/builder.ts` から `attendance: []` の stub 行が排除され、`attendanceProvider` 経由で実データが注入される
- AC-2: `AttendanceRepository.findByMemberIds(ids: MemberId[]): Promise<Map<MemberId, AttendanceRecord[]>>` が新設され、N+1 を発生させない `IN (?,?,...)` バッチクエリで取得する
- AC-3: bind 上限（D1 / SQLite で実用 80〜100 件程度）を超える `MemberId[]` でもチャンク分割で安定動作する
- AC-4: 単体テストで「attendance 0/1/N 件、削除済み meeting 除外、同一 member の同一 meeting 重複、100 件超 chunk」を網羅し全て PASS
- AC-5: 02a 既存テストおよび `MemberProfile` interface 利用箇所が **回帰しない**（型契約・テスト全 PASS）
- AC-6: `pnpm typecheck` / `pnpm lint` / `pnpm build` が完全通過
- AC-7: `MeetingSessionId` / `AttendanceRecordId` が独立 module で `Brand<...>` として定義され、既存 `MemberId` / `ResponseId` の import を改変しない
- AC-8: API 通電確認で `/me/profile`（または相当エンドポイント）レスポンスに attendance 実データが含まれることを curl evidence で確認
- AC-9: マイページ / admin 詳細画面で attendance が描画されることを通電レベルで確認（NON_VISUAL: API レスポンス → UI 描画ログでの裏付け可）
- AC-10: 02a Phase 12 `unassigned-task-detection.md` の本項目が「解消済み」へ更新され、関連ドキュメント（02b 仕様書 / system spec）から本 workflow への参照が張られる

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（DI 方式・branded type 衝突・bind 上限）と AC-1〜10 確定 |
| 2 | 設計 | phase-02.md | repository interface / builder 注入方式 / branded type module / chunk 戦略 / Schema Ownership 宣言 |
| 3 | 設計レビュー | phase-03.md | alternative（引数追加 vs ctx 注入 vs DI container）、PASS-MINOR-MAJOR、依存契約レビュー |
| 4 | テスト戦略 | phase-04.md | 単体 / 統合 test matrix、AC × test mapping、N+1 計測手順 |
| 5 | 実装ランブック | phase-05.md | schema 確認 → repository 実装 → builder 統合 → 通電確認の順序固定 runbook |
| 6 | 異常系検証 | phase-06.md | bind 上限超過、削除 meeting、null `MemberId`、空配列、API 500、D1 timeout |
| 7 | AC マトリクス | phase-07.md | AC × test × 不変条件 × evidence の N:M トレース |
| 8 | DRY 化 | phase-08.md | 既存 repository の共通 helper / branded type module 整理 |
| 9 | 品質保証 | phase-09.md | typecheck / lint / build / coverage / 02a regression / N+1 metric / 無料枠負荷 |
| 10 | 最終レビュー | phase-10.md | GO / NO-GO（依存 02a/02b の AC 充足、schema 利用可、interface 不変） |
| 11 | 実装 smoke | phase-11.md | API curl evidence + UI 通電 evidence（NON_VISUAL 縮約テンプレ準拠） |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/repository-contract.md
outputs/phase-02/branded-type-module.md
outputs/phase-02/builder-injection-design.md
outputs/phase-02/schema-ownership.md
outputs/phase-03/main.md
outputs/phase-03/alternatives-comparison.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-06/failure-cases.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-09/n-plus-1-metric.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/api-curl/me-profile-attendance.json
outputs/phase-11/evidence/api-curl/me-profile-attendance.curl.txt
outputs/phase-11/evidence/ui-smoke/mypage-attendance-rendered.md
outputs/phase-11/evidence/ui-smoke/admin-detail-attendance-rendered.md
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| DB | Cloudflare D1 (`ubm-hyogo-db-*`) | apps/api Worker binding | `meeting_sessions` / `member_attendance` |
| API | apps/api (Hono) | Worker | `/me/profile` 経由で attendance 露出 |
| UI | apps/web (Next.js) | Worker | 既存 mypage / admin 詳細を流用 |
| Secrets | （新規導入なし） | — | Cloudflare Secrets / 1Password 既存運用に従う |

## invariants touched

- **#1** 実フォーム schema をコードに固定しすぎない（attendance は admin-managed data 側）
- **#4** admin-managed data として form schema 外で分離（`meeting_sessions` / `member_attendance` は admin 管理対象）
- **#5** D1 への直接アクセスは `apps/api` に閉じる（apps/web から直接 D1 触らない）
- **interface 不変**: `MemberProfile.attendance: AttendanceRecord[]` の型契約を本タスクで破壊しない（02a 確定済み）

## Schema / 共有コード Ownership 宣言

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `apps/api/src/repository/attendance/**` | 本タスク | 新設 |
| `apps/api/src/repository/_shared/builder.ts` | 本タスク（02a 後継） | `attendance` 注入箇所のみ。02a 確定済み identity / status / response 部は触らない |
| `apps/api/src/repository/_shared/branded-types/meeting.ts` | 本タスク | 新設（`MeetingSessionId` / `AttendanceRecordId`） |
| `apps/api/migrations/*.sql` | 02b 優先 | 不足カラム / index がある場合は 02b と調整 |
| `apps/web/**` の attendance UI | 既存（06b 等） | 流用のみ。新規実装なし |

## completion definition

- Phase 1〜10 が completed、Phase 11 で AC-1〜10 の evidence 取得済み
- AC-1〜10 が Phase 7 マトリクスで完全トレース
- 4 条件評価（価値 / 実現 / 整合 / 運用）が Phase 1 / Phase 12 で整合
- 02a 既存テスト全 PASS（regression なし）
- N+1 metric が Phase 9 で baseline と一致または改善
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| implemented | Phase 1〜12 と NON_VISUAL evidence が完了、Phase 13 は user approval 待ち | 不可 |
| design_locked | Phase 1〜3 完了、設計レビュー PASS | 不可 |
| implementation_in_progress | Phase 5 ランブック実行中 | 不可 |
| implemented | repository / builder 修正完了、Phase 9 全ゲート PASS | 不可 |
| smoke_passed | Phase 11 evidence 全取得、AC-1〜10 充足 | Phase 11 完了可 |
| completed | smoke_passed + Phase 12 same-wave sync + Phase 13 user approval | 可 |

## 補足

- 旧単票 `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` は legacy stub として残置し、正本は本 workflow root に昇格する。Phase 12 で legacy stub に `## Canonical Status` 節を追加して相互参照を確立する。
- Issue #107 は CLOSED 状態のまま本仕様書を作成する（reopen しない）。Phase 13 PR template には `Refs #107` で参照する（`Closes` は使用しない）。
- 02b の進行状況によっては、本タスクを 02b に内包するか独立タスクとして残すかを Phase 1 で再判断する。

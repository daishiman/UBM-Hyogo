# 03b-followup-005-sync-jobs-design-spec - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-03b-followup-005-sync-jobs-design-spec |
| タスク名 | sync_jobs job_type enum / lock TTL / metrics_json schema の TS ランタイム正本化 |
| ディレクトリ | docs/30-workflows/03b-followup-005-sync-jobs-design-spec |
| Issue | #198 (CLOSED, 2026-05-02 — クローズドのまま実装仕様化) |
| 親タスク | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups |
| 起票元 unassigned | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-005-sync-jobs-design-spec.md |
| Wave | 3 |
| 実行種別 | parallel（実装仕様書 / sync 系コード refactor） |
| 担当 | backend-sync |
| 作成日 | 2026-05-02 |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| 実装区分 | 実装完了（CONST_004 例外条件適用 / Phase 13 は pending_user_approval） |

### CONST_004 例外条件の適用根拠

ユーザー指定は当初 docs-only であったが、目的達成（`sync_jobs` の正本仕様 drift 防止）には `job_type` enum・lock TTL・`metrics_json` schema を **TypeScript ランタイム値として一元化する必要がある**。markdown 単独では実装値（リテラル）と仕様書の同期が機械検証できず、`DEFAULT_LOCK_TTL_MS` / `SyncJobKind` / `JSON.parse(...) as { cursor?: string }` といった既存 drift を構造的に解消できない。よって CONST_004 の例外条件（実態優先）に基づき、本タスクは **実装仕様書** として作成する。

## 目的

`sync_jobs` テーブルは Google Forms の schema sync（03a）と response sync（03b）の双方が共通で使う ledger である。`job_type` enum・`metrics_json` schema・lock TTL（10 分）が複数ファイルにリテラル散在しており、新 wave 追加時の同期更新漏れと spec drift のリスクを抱える。

本タスクでは下記を実施する:

1. `apps/api/src/jobs/_shared/sync-jobs-schema.ts` を新規作成し、`SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `metricsJsonBaseSchema` / `responseSyncMetricsSchema` / `schemaSyncMetricsSchema` / `assertNoPii` / `parseMetricsJson` を export して TS ランタイム正本にする。
2. 既存 3 ファイル（`sync-forms-responses.ts` / `repository/syncJobs.ts` / `cursor-store.ts`）を共有 module 経由参照に差し替える。
3. `_design/sync-jobs-spec.md` を markdown 論理正本としてそのまま維持し、TS 正本への参照を §3 / §5 に追記する。
4. `database-schema.md` の `sync_jobs` 節を `_design/sync-jobs-spec.md` 参照に統一する。

## スコープ

### 含む（本 PR / 1 実装サイクルで完了）

- 新規ファイル: `apps/api/src/jobs/_shared/sync-jobs-schema.ts`
- 新規テスト: `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`
- 既存ファイル編集: `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/repository/syncJobs.ts` / `apps/api/src/jobs/cursor-store.ts`
- ドキュメント更新: `docs/30-workflows/_design/sync-jobs-spec.md` / `.claude/skills/aiworkflow-requirements/references/database-schema.md` / 03a/03b 関連 spec の参照確認
- `mise exec -- pnpm indexes:rebuild` による drift 解消と evidence 保存

### 含まない

- `sync_jobs` テーブルの DDL 変更
- D1 マイグレーション新規追加
- observability 基盤の構築

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver-followups | followup 起票元 spec / 実装 lock TTL の根拠 |
| 上流 | 03a parallel forms schema sync | schema sync 側の job_type / metrics 表現 |
| 上流 | `apps/api/package.json` の `zod` 既存導入 | metricsJsonBaseSchema の前提（万一未導入なら Phase 3 で依存追加） |
| 下流 | 後続 03a / 03b 派生 sync wave（job_type 追加時に `_shared/sync-jobs-schema.ts` と `_design/` を更新） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-005-sync-jobs-design-spec.md | 起票元 followup（Why / What / How） |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | markdown 論理正本（既存） |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | `DEFAULT_LOCK_TTL_MS` リテラル除去対象 |
| 必須 | apps/api/src/repository/syncJobs.ts | `SyncJobKind` ローカル定義の re-export 化対象 |
| 必須 | apps/api/src/jobs/cursor-store.ts | 文字列 `'response_sync'` / `JSON.parse` の置換対象 |
| 必須 | apps/api/src/jobs/sync-lock.ts | TTL 引数の呼び出し元 |
| 必須 | apps/api/migrations/0003_auth_support.sql / 0005_response_sync.sql | DDL 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節（参照差し替え対象） |
| 推奨 | .github/workflows/verify-indexes.yml | indexes drift 検証 CI gate |
| 推奨 | docs/00-getting-started-manual/lefthook-operations.md | indexes 再生成運用 |

## 受入条件 (AC)

- AC-1: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` が新規作成され、`SYNC_JOB_TYPES` / `SyncJobKind` / `SYNC_LOCK_TTL_MS` / `SYNC_LOCK_TTL_MINUTES` / `metricsJsonBaseSchema` / `responseSyncMetricsSchema` / `schemaSyncMetricsSchema` / `PII_FORBIDDEN_KEYS` / `assertNoPii` / `parseMetricsJson` を export している
- AC-2: `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` が vitest でパスする
- AC-3: `apps/api/src/jobs/sync-forms-responses.ts` の `DEFAULT_LOCK_TTL_MS` リテラルが除去され、`SYNC_LOCK_TTL_MS` を import して使用している
- AC-4: `apps/api/src/repository/syncJobs.ts` の `SyncJobKind` が `_shared/sync-jobs-schema` から re-export されている（後方互換維持）
- AC-5: `apps/api/src/jobs/cursor-store.ts` が `parseMetricsJson(..., responseSyncMetricsSchema)` 経由で metrics を読み、文字列リテラル `'response_sync'` も共有定数に置換されている
- AC-6: 既存テスト（`sync-forms-responses.test.ts` / `sync-sheets-to-d1.test.ts` / `sync-forms-responses.types.test.ts`）が全件パスする
- AC-7: `docs/30-workflows/_design/sync-jobs-spec.md` §3 / §5 に「TS ランタイム正本: `apps/api/src/jobs/_shared/sync-jobs-schema.ts`」と差分同期手順が追記されている
- AC-8: `.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節が `_design/sync-jobs-spec.md` 参照に統一されている
- AC-9: `mise exec -- pnpm indexes:rebuild` で indexes drift がない
- AC-10: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` がパスする
- AC-11: PII 不混入の自動検証（`assertNoPii`）がテストカバーされ、`syncJobs.succeed()` の `metrics_json` 書き込み直前で実行されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義（Why/What/不変条件/4条件評価/AC 再マッピング） | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計（_shared/sync-jobs-schema.ts API + _design 集約 schema 設計） | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 実装計画（変更ファイル 4 件 + 順序 + zod 依存確認） | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | verify suite 設計（typecheck / vitest / grep / indexes drift） | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 既存定義棚卸し（DEFAULT_LOCK_TTL_MS / SyncJobKind / cursor-store の差分一覧） | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | _shared/sync-jobs-schema.ts 実装 + テスト + _design 注記追加 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | sync-forms-responses.ts / syncJobs.ts / cursor-store.ts の差し替え | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | database-schema.md の参照更新 + 03a/03b spec 参照確認 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | indexes 再生成 + drift 検証 + typecheck/lint/test 実行 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | レビュー + 整合確認（実装と _design の対応 1:1） | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | NON_VISUAL evidence 収集（grep / typecheck / vitest / indexes diff） | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback（中学生レベル概念説明含む） | phase-12.md | completed | outputs/phase-12/ 一式 |
| 13 | PR 作成（Refs #198） | phase-13.md | pending_user_approval | outputs/phase-13/pr-body.md |

## 実行原則

- **CONST_007 遵守**: 全変更を 1 PR / 1 実装サイクルで完了させる。先送り・別 PR 提案は禁止。PII 不混入の `assertNoPii` 書き込み経路適用も本タスク内で完了する。
- `apps/api` 配下のコードは仕様書通りに実装し、既存テスト・既存挙動を破壊しない（不変条件）。
- DDL 変更・マイグレーション追加は含めない（既存 schema 準拠）。
- `metrics_json` に PII を含めないことを `_design/sync-jobs-spec.md` と `assertNoPii` で二重に守る。
- lock TTL（10 分）は 03b 実装値を正本として `_shared/sync-jobs-schema.ts` の `SYNC_LOCK_TTL_MS = 10 * 60 * 1000` に固定。
- `Refs #198` を採用、`Closes` は使用しない（Issue は CLOSED）。
- 実装と schema の整合は本タスク内で吸収し、検出した drift は同 PR で解消する。

## 苦戦箇所【親 03b followup から引き継ぎ】

- 対象: 03a / 03b の task spec で `job_type` enum / `metrics_json` schema / lock TTL が個別定義され、enum 追加時の同期更新漏れリスクが残存
- 原因: `_design/` 配下に sync 系正本仕様の集約ファイルが存在せず、TS ランタイム値も複数ファイルにリテラル散在していた
- 対策: 本タスクで `_shared/sync-jobs-schema.ts` を TS 正本化し、`_design/sync-jobs-spec.md` を markdown 論理正本として参照リンクで結合する
- 参照: 03b Phase 12 `unassigned-task-detection.md` #7 / `skill-feedback-report.md` 1.4 節

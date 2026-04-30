# u-04-serial-sheets-to-d1-sync-implementation — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | u-04-serial-sheets-to-d1-sync-implementation |
| ディレクトリ | `docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation` |
| 種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | Phase 1-12 completed / Phase 13 pending |
| 起源 Issue | GitHub #67（CLOSED 維持・reopen しない） |
| 出典 | `docs/30-workflows/completed-tasks/U-04-sheets-to-d1-sync-implementation.md` |

## 概要

UT-01 の Sheets → D1 同期方式を `apps/api/src/sync/` に実装するタスク。
manual / scheduled / backfill / audit の 4 経路を `SYNC_ADMIN_TOKEN` Bearer、`sync_locks` mutex、`sync_job_logs` audit ledger で保護し、Cloudflare Cron `0 * * * *` から `runScheduledSync(env)` を実行する。

## Phase 一覧

| Phase | 名称 | 仕様書 | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2 | 設計 | [phase-02.md](phase-02.md) | completed |
| 3 | 設計レビュー | [phase-03.md](phase-03.md) | completed |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | completed |
| 5 | 実装ランブック | [phase-05.md](phase-05.md) | completed |
| 6 | 異常系検証 | [phase-06.md](phase-06.md) | completed |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | completed |
| 8 | 品質保証 | [phase-08.md](phase-08.md) | completed |
| 9 | リファクタリング | [phase-09.md](phase-09.md) | completed |
| 10 | ドキュメント整備 | [phase-10.md](phase-10.md) | completed |
| 11 | 受け入れ確認 | [phase-11.md](phase-11.md) | completed |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | completed |
| 13 | PR 作成 | [phase-13.md](phase-13.md) | pending / user approval required |

## 主要成果物

| 領域 | パス |
| --- | --- |
| 実装 | `apps/api/src/sync/`, `apps/api/src/middleware/require-sync-admin.ts`, `apps/api/src/index.ts`, `apps/api/wrangler.toml` |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md`, `outputs/phase-11/evidence/non-visual-evidence.md` |
| Phase 12 guide | `outputs/phase-12/implementation-guide.md` |
| Phase 12 system sync | `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/documentation-changelog.md` |
| 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` |
| ledger | [artifacts.json](artifacts.json) |

## Decision Log

| 日付 | 決定 | 理由 |
| --- | --- | --- |
| 2026-04-30 | Issue #67 は reopen せず、仕様・実装履歴を本 workflow で完結させる | GitHub issue lifecycle と Phase 1-13 workflow の履歴管理を分離するため |
| 2026-04-30 | Phase 13 は pending のまま保持 | commit / PR はユーザー明示承認まで禁止 |

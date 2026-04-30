# Phase 11 成果物 — 手動 smoke test サマリー（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 11 / 13 — 手動 smoke test |
| 作成日 | 2026-04-29 |
| visualEvidence | NON_VISUAL（screenshots 未作成） |
| docsOnly | true（実 DDL 非混入 / spec PR 段階） |
| workflow_state | spec_created |

## 概要

本 Phase は Cloudflare D1 の schema 設計タスクの一次証跡 (CLI) を採取する手動 smoke の **手順仕様** を確定する Phase であり、本 spec PR 段階では実 migration / 実 INSERT は未実行。各証跡は `manual-smoke-log.md` 内で `TBD` プレースホルダとして整備済みで、実装 Phase（後続 PR）で実 dev 環境への apply 後に追記する。

`apps/api/migrations/*.sql` は本 PR に含めず、UT-04 実装 PR / UT-06 / UT-26 の各 wave で順次反映する。視覚証跡は不要のため `screenshots/` は意図的に未作成（NON_VISUAL 整合）。

## smoke 実行サマリー（仕様化のみ・実行は TBD）

| # | シナリオ | コマンド経路 | 期待 | 実行状態 |
| --- | --- | --- | --- | --- |
| 1 | dev 環境 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev` | 全 migration が `Migrated` で完了 | TBD |
| 2 | schema 確認 | `bash scripts/cf.sh d1 execute ... --command=".schema"` | 全テーブル DDL / index 出力 | TBD |
| 3 | migration 履歴確認 | `bash scripts/cf.sh d1 migrations list ...` | 連番整合 | TBD |
| 4 | NOT NULL violation reject | 直 INSERT で必須カラム省略 | `SQLITE_CONSTRAINT_NOTNULL` | TBD |
| 5 | UNIQUE violation reject | 同一 `response_id` を 2 回 INSERT | 2 回目 `SQLITE_CONSTRAINT_UNIQUE` | TBD |
| 6 | FOREIGN KEY violation reject | `PRAGMA foreign_keys` 確認 + 違反 INSERT | `PRAGMA=1` + `SQLITE_CONSTRAINT_FOREIGNKEY` | TBD |
| 7 | 正常系 INSERT + SELECT | fixture 1 行 INSERT + SELECT | 1 行取得 / `created_at` ISO8601 | TBD |

> wrangler 直接呼び出し 0 件（CLAUDE.md 「Cloudflare 系 CLI 実行ルール」厳守）。詳細コマンドと出力プレースホルダは [manual-smoke-log.md](./manual-smoke-log.md) を参照。

## NON_VISUAL evidence 差分表（S-1〜S-7）

| ID | シナリオ | 元前提 | 代替手段（NON_VISUAL） | カバー範囲 | 保証外 / 申し送り先 |
| --- | --- | --- | --- | --- | --- |
| S-1 | migration apply | dev D1 への実 apply | `scripts/cf.sh d1 migrations apply --env dev` 実行ログ | DDL 適用成功 / 連番整合 | production apply（→ UT-06 / UT-26） |
| S-2 | schema 一致 | アプリ repository での実利用 | `.schema` 出力 + DDL diff | テーブル / カラム / 型 / 制約 / index | runtime クエリ性能（→ UT-08 monitoring） |
| S-3 | NOT NULL reject | アプリ層 validation | 直 INSERT で `SQLITE_CONSTRAINT_NOTNULL` | DB レベル制約 | アプリ側エラーハンドリング（→ UT-09） |
| S-4 | UNIQUE reject | UT-09 idempotency | 直 INSERT × 2 で `SQLITE_CONSTRAINT_UNIQUE` | DB レベル冪等性保証 | sync 層 retry / upsert（→ UT-09） |
| S-5 | FK reject | アプリ側参照整合 | `PRAGMA foreign_keys` + 違反 INSERT | FK 有効化確認 | 実運用 cascade 挙動（→ UT-08） |
| S-6 | mapping 成立 | Sheets→D1 実 sync | fixture 1 行 INSERT + SELECT | 型 / consent / timestamp 規約 | 実 Sheets API 経由整合（→ UT-09 phase-11） |
| S-7 | production apply | 本番 D1 への apply | dev 成功実績 + runbook 完備 | 手順正しさ | production 実 apply（→ UT-06） |

> 本表により「本 Phase が DB レベルで保証する範囲」と「他 wave へ委譲する範囲」を明示する。screenshot は NON_VISUAL のため不要。

## 既知制限リスト（6 件以上）

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | production 環境への apply は本 Phase で実行しない | 本番反映の確証 | UT-06 / UT-26 |
| 2 | 実 Sheets API 経由のマッピング成立確認は対象外 | 実 Form 連携 | UT-09 phase-11 |
| 3 | 性能観測（slow query / lock contention）は実運用後判断 | 実トラフィック挙動 | UT-08 monitoring |
| 4 | field-level 暗号化は MVP 不採用 | PII 強化策の不在 | Phase 12 unassigned-task |
| 5 | audit_logs / sync_job_logs の retention 自動削除は別タスク | storage 増加対策 | UT-08 / unassigned-task |
| 6 | NON_VISUAL のため screenshot 不要、CLI ログのみが一次証跡 | 視覚証跡なし | link-checklist.md で補完 |
| 7 | 本 spec PR では実 migration ファイルを commit せず TBD で記載 | 実 apply ログ未取得 | UT-04 実装 Phase（後続 PR） |
| 8 | wrangler 直接呼び出しは禁止（scripts/cf.sh 経由必須） | 認証 / esbuild 整合 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 |

## Phase 12 への引き渡し

- 既知制限 #1 → UT-06 へ register（production apply 委譲）
- 既知制限 #4 / #5 → unassigned-task として formalize（[unassigned-task-detection.md](../phase-12/unassigned-task-detection.md)）
- schema 確定状態（DDL 適用済み）→ UT-09 mapper 実装の前提として引き渡し
- smoke 手順の TBD を実装 Phase で実値に置換し、改めて Phase 11 を再採取する旨を Phase 13 PR body に明記

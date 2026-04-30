# Documentation Changelog (UT-26)

## 仕様書 / 成果物

| 日付 | 種別 | パス | 備考 |
| --- | --- | --- | --- |
| 2026-04-29 | create | `docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/` | UT-26 workflow specs と artifacts ledger |
| 2026-04-29 | sync | `outputs/artifacts.json` | root artifacts.json と同期 |
| 2026-04-29 | refine | `phase-01.md` | taskType / visualEvidence / aiworkflow 正本照合 / Ownership 宣言 |
| 2026-04-29 | refine | `phase-13.md` | Phase 13 必須出力 / approval gate 明記 |
| 2026-04-29 | create | `outputs/phase-01/main.md` | 要件定義主成果物 |
| 2026-04-29 | create | `outputs/phase-02/smoke-test-design.md` | smoke route / script モジュール設計 + シーケンス図 |
| 2026-04-29 | create | `outputs/phase-02/cache-and-error-mapping.md` | token cache 仕様 / 401・403・429・PARSE・NETWORK 分類 |
| 2026-04-29 | create | `outputs/phase-03/main.md` | 代替案レビュー (5案) + ADR-UT26-001 + GO 判定 |
| 2026-04-29 | create | `outputs/phase-04/test-strategy.md` | unit / contract / smoke / authorization 戦略 |
| 2026-04-29 | create | `outputs/phase-05/implementation-runbook.md` | env 名 Decision / 擬似コード / wrangler コマンド |
| 2026-04-29 | create | `outputs/phase-06/failure-cases.md` | 異常系 15 件マトリクス + ログサンプル |
| 2026-04-29 | create | `outputs/phase-07/ac-matrix.md` | AC-1〜AC-11 トレース表 |
| 2026-04-29 | create | `outputs/phase-08/main.md` | DRY 化 / wrapper-adapter 採用 |
| 2026-04-29 | create | `outputs/phase-09/main.md` | 品質チェックリスト 12 項目 |
| 2026-04-29 | create | `outputs/phase-09/free-tier-estimation.md` | Workers / Sheets API 無料枠見積もり |
| 2026-04-29 | create | `outputs/phase-10/go-no-go.md` | GO 判定 / blocker / 4 条件再評価 |
| 2026-04-29 | update | `outputs/phase-11/main.md` | vitest pass + AC 進捗表 |
| 2026-04-29 | update | `outputs/phase-11/manual-smoke-log.md` | エビデンス表 / 結果記録テンプレ / live 実行手順 |
| 2026-04-29 | update | `outputs/phase-11/troubleshooting-runbook.md` | 403 切り分け Step A〜D / 内部 errorCode 分類 |
| 2026-04-29 | update | `outputs/phase-12/implementation-guide.md` | Part 1 中学生向け / Part 2 技術者向け |
| 2026-04-29 | update | `outputs/phase-12/main.md` | Phase 12 サマリ / Close-Out ルール |
| 2026-04-29 | update | `outputs/phase-12/documentation-changelog.md` | 本ファイル |

## 実装コード

| 日付 | 種別 | パス | 備考 |
| --- | --- | --- | --- |
| 2026-04-29 | create | `apps/api/src/routes/admin/smoke-sheets.ts` | `createSmokeSheetsRoute()` を export |
| 2026-04-29 | create | `apps/api/src/routes/admin/smoke-sheets.test.ts` | vitest 10 ケース、全 pass |
| 2026-04-29 | edit | `apps/api/src/index.ts` | Env に SMOKE_ADMIN_TOKEN 追加 / route mount |

## next: Phase 13 で PR 説明文に本 changelog を引用

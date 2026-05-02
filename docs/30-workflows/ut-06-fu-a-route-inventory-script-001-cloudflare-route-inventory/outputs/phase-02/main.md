# Phase 2 要約: 設計

タスク: UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 / docs-only / NON_VISUAL / Issue #328

## 目的

Phase 1 で確定した「split-brain を 0 にする出力契約の固定」要件を、4 concern に分解して設計する:

1. **Cloudflare API call layer**: `bash scripts/cf.sh` 経由の read-only endpoint allowlist
2. **Inventory data shape**: TypeScript 型 `RouteInventoryEntry` / `InventoryReport`
3. **Output writer**: JSON + Markdown 2 形式同時出力 + secret mask layer
4. **Safety boundary**: mutation 禁止 / secret 漏洩防止 / `wrangler` 直接呼び出し禁止

本 Phase ではコードを書かない。型シグネチャ・出力フォーマット雛形・コマンド一覧の Markdown のみを成果物とする。

> 依存順序 (重複明記 2/3): 親タスク #246 preflight runbook 完了が本タスク前提条件。

## 設計範囲 (lane 構成)

| concern | 概要 | 担当 | lane |
| --- | --- | --- | --- |
| Cloudflare API call layer | ラッパー経由で read-only endpoint のみを叩く | `api-allowlist.md` | 1 |
| Inventory data shape | `RouteInventoryEntry` / `InventoryReport` 型と JSON schema | `route-inventory-shape.md` | 2 |
| Output writer | JSON + Markdown + secret mask layer | `route-inventory-shape.md` / `secret-leak-guard-design.md` | 3 |
| Safety boundary | mutation 禁止 / grep gate / `wrangler` 検出 / DI 境界 | `secret-leak-guard-design.md` | 横断 |

## 詳細章への索引

- §2 Cloudflare API endpoint allowlist (read-only 3 endpoint + mutation 除外表) → `api-allowlist.md`
- §3 Inventory data shape (TypeScript 型 / JSON schema / mismatch 抽出ロジック) → `route-inventory-shape.md`
- §4 Output writer (JSON + Markdown 雛形 + host mask) → `route-inventory-shape.md`
- §5 Safety boundary (DI 境界 / secret 漏洩防止 / `wrangler` 自己検査) → `secret-leak-guard-design.md`

## target topology table

| layer | 物理的所在 (仮) | 役割 | 入力 | 出力 |
| --- | --- | --- | --- | --- |
| Cloudflare API call layer | `scripts/cloudflare/route-inventory.ts` (別 PR で命名想定) | ラッパー経由で Workers list / Routes / Custom Domains を read-only で取得 | account_id / zone_id (op run 注入) | 生 API レスポンス (メモリのみ) |
| Inventory data shape | TypeScript 型定義 | API レスポンスを正規化 | 生 API レスポンス | `InventoryReport` |
| Output writer | JSON / Markdown 出力レイヤ | 出力 2 形式生成 + secret mask | `InventoryReport` | `outputs/route-inventory.json` / `outputs/route-inventory.md` |
| Safety boundary | grep gate / allowlist チェック / `wrangler` 検出 | 出力・コードに mutation / secret / wrangler が混入していないことを保証 | 出力 / script ソース | grep 検証ステータス (PASS/FAIL) |

## validation matrix (command 単位)

| # | コマンド | 用途 | 期待出力 |
| --- | --- | --- | --- |
| 1 | `pnpm lint` | 別 PR の script 実装側で TypeScript / ESLint gate | エラー 0 |
| 2 | `pnpm typecheck` | `RouteInventoryEntry` / `InventoryReport` 型整合 | エラー 0 |
| 3 | `bash scripts/cf.sh whoami` | 認証確認 (read-only) | アカウント名 |
| 4 | `bash scripts/cf.sh node scripts/cloudflare/route-inventory.ts --dry-run` | 出力 schema 確認 (別 PR 実装後) | JSON / Markdown 雛形が schema に整合 |

> #4 は別 PR の実装後に有効化。本タスク Phase 11 では #1〜#3 のみで NON_VISUAL evidence を確保する。

## 仕様語 ↔ 実装語対応表

| 仕様語 | 実装語 / 物理的所在 |
| --- | --- |
| expectedWorker | `apps/web/wrangler.toml` `[env.production].name = "ubm-hyogo-web-production"` |
| route pattern | `GET /zones/{zone_id}/workers/routes` の `pattern` |
| target worker name | 同 API レスポンスの `script` |
| custom domain | `GET /accounts/{account_id}/workers/domains` の `hostname` |
| zone | API レスポンスの `zone_name` または `zone_id` |
| source (api) | 上記 read-only API 経由で取得した entry |
| source (dashboard-fallback) | API で取得不能な場合の手動転記 (暫定経路) |
| ラッパー | `scripts/cf.sh` (`op run` + `mise exec` + `ESBUILD_BINARY_PATH`) |
| 親 runbook | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md` |

## 影響範囲・依存

| 影響範囲 | 内容 |
| --- | --- |
| `apps/web/wrangler.toml` | `[env.production].name` の正本 (読み取りのみ) |
| `scripts/cf.sh` | 既存ラッパー (読み取りのみ) |
| 新設想定 (別 PR) `scripts/cloudflare/route-inventory.{ts,sh}` | 本タスクの設計対象 |
| 親タスク #246 runbook | preflight 章への script 起動手順追記 (本タスクでは実施しない) |
| Cloudflare 本番アカウント | read-only API call のみ。mutation 0 件 |

## セキュリティ (重複明記 — aiworkflow-requirements 整合)

| 観点 | 方針 |
| --- | --- |
| `bash scripts/cf.sh` 強制 | 全 Cloudflare API call はラッパー経由 (CLAUDE.md C-1) |
| read-only | mutation endpoint 0 件。allowlist は §2 表の 3 endpoint のみ |
| secret 漏洩防止 | 出力フィールドに値を含めない / API レスポンスを stdout に出さない / 自己 grep で fail-fast |
| `.env` 実値 Read 禁止 | op 参照のみ。script 側で `.env` を直接 fs.read しない |
| `wrangler login` 禁止 | OAuth トークン保持禁止 |
| API Token / OAuth Token 転記禁止 | 出力 / 仕様書 / コミットメッセージに転記しない |

## テスト系縮退方針 (Phase 4-7)

| Phase | 通常タスクでの内容 | 本タスクでの内容 |
| --- | --- | --- |
| 4 | 自動テスト実装 | type / contract test の観点設計 (JSON schema / allowlist / grep gate) |
| 5 | コード実装 | 仕様書 / 設計の最終整備のみ |
| 6 | 異常系自動テスト | 異常系シナリオ列挙 (mutation / secret / `wrangler` / dashboard-fallback) |
| 7 | カバレッジ閾値 | AC-1〜AC-5 が設計章で完全カバーされる AC matrix |

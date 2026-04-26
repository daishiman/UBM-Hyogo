# Phase 5: セットアップ実行 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## 実行サマリー

このタスクは `code_and_docs` タスクである。本 Phase では runtime foundation の最小ファイルを作成し、secret 登録は行わない。構築手順は runbook として残し、後続 task が同じ構成を再現できる状態にする。

## 確認結果（現在のリポジトリ状態）

| ファイル / ディレクトリ | 状態 | 備考 |
| --- | --- | --- |
| apps/web/wrangler.toml | 存在する | OpenNext Workers 形式（`main = ".open-next/worker.js"` / `[assets]`）へ更新済み |
| apps/api/wrangler.toml | 存在する | Hono Workers 設定・D1 binding（prod/staging）が正しく設定済み |
| pnpm-workspace.yaml | 作成済み | workspace package を定義 |
| package.json（ルート） | 作成済み | engines / packageManager / scripts を定義 |
| .nvmrc | 作成済み | Node 24.x を固定 |
| apps/web/package.json | 作成済み | Next.js / OpenNext scripts を定義 |
| apps/web/next.config.ts | 作成済み | @opennextjs/cloudflare dev 初期化を設定 |
| apps/api/package.json | 作成済み | Hono Workers scripts を定義 |
| apps/api/src/index.ts | 作成済み | Hono entry point を実装 |
| packages/shared/ | 作成済み | runtime foundation contract を実装 |
| packages/integrations/ | 作成済み | integration runtime target を実装 |

詳細な構築手順は `outputs/phase-05/foundation-bootstrap-runbook.md` を参照。

## sanity check（実行後確認）

| 確認項目 | PASS 条件 |
| --- | --- |
| scope 外サービスの追加 | なし |
| branch / env / secret placement | 正本仕様（version-policy.md）と一致 |
| downstream 参照 path | 03/04/05b が参照できる path が存在する |
| 正本仕様との差分 | TypeScript 6.x の同期が Phase 12 Step 2 の対象として残っている |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 後続 task が参照する runbook と実装 skeleton を確立する |
| 実現性 | PASS | workspace / apps / packages の最小構成を作成済み |
| 整合性 | PASS | outputs/phase-02 の設計と一致した手順を記録 |
| 運用性 | PASS | foundation-bootstrap-runbook.md に rollback 手順・downstream 参照表を記録 |

## Phase 5 → Phase 6 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| foundation-bootstrap-runbook.md | outputs/phase-05/foundation-bootstrap-runbook.md（Phase 5 の主要成果物） |
| downstream 参照表 | 03-serial-data-source-and-storage-contract 向け参照パス一覧 |
| 未完了ファイル一覧 | Node 24.x 実環境での build / bundle size 証跡のみ UT-20 に縮小 |
| blocker | なし |

## 完了条件チェック

- [x] 主成果物が作成済み（foundation-bootstrap-runbook.md）
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている

# Phase 7 成果物: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 名称 | 検証項目網羅性 |
| 状態 | completed |
| 作成日 | 2026-04-23 |

## 1. 入力確認

Phase 6 成果物: `outputs/phase-06/main.md`（異常系シナリオ A1〜A8）

## 2. AC トレースマトリクス

| AC | 検証ポイント | 担当 Phase | 検証方法 | PASS 判定基準 |
| --- | --- | --- | --- | --- |
| AC-1 | Pages が `apps/web` のみ、Workers が `apps/api` のみ担当していること | Phase 5 | wrangler.toml の `name` フィールドと Cloudflare Pages のビルド設定を確認 | Pages: `ubm-hyogo-web` / `ubm-hyogo-web-staging`、Workers: `ubm-hyogo-api` / `ubm-hyogo-api-staging` と一致 |
| AC-2 | staging = `dev` ブランチ、production = `main` ブランチであること | Phase 5 | Cloudflare Pages の Git Integration 設定（Production Branch / Preview Branch）を確認 | Production Branch = `main`、Preview Branch = `dev` と設定されている |
| AC-3 | API Token が Pages:Edit + Workers:Edit + D1:Edit の3スコープのみであること | Phase 4, 5 | Cloudflare Dashboard > My Profile > API Tokens で Token のスコープ一覧を確認 | 3スコープのみが付与され、Zone:Read などの余分なスコープがない |
| AC-4 | Pages build count（500 builds/月）と Workers req/day（100k req/day）の監視設定が整っていること | Phase 11 | Cloudflare Analytics および Dashboard のクォータ表示で確認 | 両指標が Dashboard で確認可能な状態になっている |
| AC-5 | Pages と Workers のロールバックが独立して機能すること | Phase 11 | 各 rollback 手順のドライランを実行し、独立して動作することを確認 | Pages rollback と Workers rollback がそれぞれ単独で完結し、相互依存がない |

## 3. 網羅性チェックリスト

### 正常系

| チェック項目 | 担当 Phase | 確認方法 | 状態 |
| --- | --- | --- | --- |
| Pages デプロイが成功し `ubm-hyogo-web.pages.dev` でアクセスできる | Phase 5, 11 | `curl` または ブラウザで 200 OK を確認 | Phase 11 で確認予定 |
| Pages staging デプロイが成功し staging URL でアクセスできる | Phase 5, 11 | `curl` で 200 OK を確認 | Phase 11 で確認予定 |
| Workers デプロイが成功し `/api/health` でレスポンスが返る | Phase 5, 11 | `curl` で 200 OK を確認 | Phase 11 で確認予定 |
| Workers staging デプロイが成功し staging エンドポイントで返る | Phase 5, 11 | `curl` で 200 OK を確認 | Phase 11 で確認予定 |
| D1（`ubm-hyogo-db-prod`）が作成され migration が適用できる | Phase 5, 11 | `wrangler d1 migrations apply ubm-hyogo-db-prod` が成功 | Phase 11 で確認予定 |
| D1 staging（`ubm-hyogo-db-staging`）が作成され migration が適用できる | Phase 5, 11 | `wrangler d1 migrations apply ubm-hyogo-db-staging --env staging` が成功 | Phase 11 で確認予定 |

### 異常系

| チェック項目 | 担当 Phase | 対応シナリオ | 状態 |
| --- | --- | --- | --- |
| ビルド失敗時に旧バージョンが維持され、エンドユーザーへの影響がない | Phase 6 | A1（Pages ビルド失敗） | 完了 |
| API Token の権限不足で `wrangler deploy` が拒否される | Phase 6 | A2（Workers デプロイ権限不足） | 完了 |
| D1 の `database_id` 未設定で `wrangler d1 execute` がエラーを返す | Phase 6 | A3（D1 database_id 未設定） | 完了 |
| ブランチ表記の drift（`develop` / `dev` 混在）が検出できる | Phase 6 | A4（branch drift） | 完了 |
| `CLOUDFLARE_API_TOKEN` の誤配置（Cloudflare Secrets への配置）が検出できる | Phase 6 | A5（secret placement ミス） | 完了 |
| Sheets と D1 の責務重複が architecture 仕様との照合で検出できる | Phase 6 | A6（D1 source-of-truth 競合） | 完了 |
| Workers の req/day が無料枠（100k）に近づいた際に監視で検出できる | Phase 6 | A7（無料枠逸脱リスク） | 完了 |
| wrangler.toml の環境名不一致が `--dry-run` で検出できる | Phase 6 | A8（wrangler.toml 環境名不一致） | 完了 |

### 境界値

| チェック項目 | 担当 Phase | 確認方法 | 状態 |
| --- | --- | --- | --- |
| Pages の無料枠上限（500 builds/月）を把握し、Dashboard で現在値を確認できる | Phase 9, 11 | Cloudflare Dashboard の Pages > Usage で build count を確認 | Phase 11 で確認予定 |
| Workers の無料枠上限（100k req/day）を把握し、Dashboard で現在値を確認できる | Phase 9, 11 | Cloudflare Dashboard の Workers > Analytics で req/day を確認 | Phase 11 で確認予定 |
| D1 の無料枠上限（5GB ストレージ・25M rows read/day）を把握している | Phase 9, 11 | Cloudflare Dashboard の D1 > Usage で現在値を確認 | Phase 11 で確認予定 |

## 4. 未カバー AC とフォロー方針

| AC | 未カバー理由 | フォロー方針 |
| --- | --- | --- |
| AC-4 | 実環境前提（Cloudflare Analytics） | Phase 11 smoke test で実地確認 |
| AC-5 | rollback ドライランが実環境前提 | Phase 11 smoke test で実地確認 |

実環境前提の AC は docs-only 前提で runbook completed に言い換え。
カバーできないものは Phase 12 で unassigned 化し、close-out ドキュメントに記録する。

## 5. 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC-1〜AC-5 が全て追跡可能な状態になっている |
| 実現性 | PASS | 正常系・異常系・境界値の全観点で検証項目を定義した |
| 整合性 | PASS | A1〜A8 のシナリオと AC トレースが一致している |
| 運用性 | PASS | Phase 11 での実地確認パスが明確になっている |

## 6. downstream handoff

AC トレースマトリクスと網羅性チェックリストを Phase 8 以降の設定 DRY 化および Phase 10 の gate 判定の根拠として使用する。

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
- [x] AC トレースマトリクスで全 AC（AC-1〜AC-5）が追跡可能であることが確認済み
- [x] 網羅性チェックリストで正常系・異常系・境界値が全てカバーされていることが確認済み

# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-23 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | pending |

## 目的

Cloudflare 基盤ブートストラップ における Phase 7 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。
具体的には、AC-1〜AC-5 が全て追跡可能な状態になっているかを AC トレースマトリクスで確認し、正常系・異常系・境界値の観点で検証項目に漏れがないことを網羅性チェックリストで保証する。

## 実行タスク

- input / output を確定する
- Phase 6 の異常系シナリオ表（A1〜A8）を読んで網羅性を評価する
- AC トレースマトリクスを作成し、全 AC が追跡可能であることを確認する
- 網羅性チェックリストを作成し、正常系・異常系・境界値を網羅する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 必須 | outputs/phase-06/main.md | Phase 6 の異常系シナリオ表（A1〜A8） |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## 実行手順

### ステップ 1: input と前提の確認
- Phase 6 の成果物（outputs/phase-06/main.md）を読み、異常系シナリオ A1〜A8 を把握する。
- 確定済み設計（Pages/Workers/D1 名称、ブランチ戦略、APIトークンスコープ、AC-1〜AC-5 の PASS 判定結果）を参照する。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-07/main.md に作成・更新する。
- AC トレースマトリクスと網羅性チェックリストを中心に記述する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 本 Phase の出力を入力として使用 |
| Phase 6 | 異常系シナリオ表（A1〜A8）を網羅性評価の入力として使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 7 | pending | Phase 6 の異常系シナリオ表（A1〜A8）を読んで網羅性を評価 |
| 2 | 成果物更新 | 7 | pending | outputs/phase-07/main.md（AC トレースマトリクス + 網羅性チェックリスト） |
| 3 | 4条件確認 | 7 | pending | 全 AC が追跡可能な状態になっていることを確認し、next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている
- AC トレースマトリクスで全 AC（AC-1〜AC-5）が追跡可能であることが確認済み
- 網羅性チェックリストで正常系・異常系・境界値が全てカバーされていることが確認済み

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (設定 DRY 化)
- 引き継ぎ事項: AC トレースマトリクスと網羅性チェックリストを Phase 8 以降の設定 DRY 化および Phase 10 の gate 判定の根拠として使用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## AC トレースマトリクス

| AC | 検証ポイント | 担当 Phase | 検証方法 | PASS 判定基準 |
| --- | --- | --- | --- | --- |
| AC-1 | Pages が `apps/web` のみ、Workers が `apps/api` のみ担当していること | Phase 5 | wrangler.toml の `name` フィールドと Cloudflare Pages のビルド設定を確認 | Pages: `ubm-hyogo-web` / `ubm-hyogo-web-staging`、Workers: `ubm-hyogo-api` / `ubm-hyogo-api-staging` と一致 |
| AC-2 | staging = `dev` ブランチ、production = `main` ブランチであること | Phase 5 | Cloudflare Pages の Git Integration 設定（Production Branch / Preview Branch）を確認 | Production Branch = `main`、Preview Branch = `dev` と設定されている |
| AC-3 | API Token が Pages:Edit + Workers:Edit + D1:Edit の 3 スコープのみであること | Phase 4 | Cloudflare Dashboard > My Profile > API Tokens で Token のスコープ一覧を確認 | 3 スコープのみが付与され、Zone:Read などの余分なスコープがない |
| AC-4 | Pages build count（500 builds/月）と Workers req/day（100k req/day）の監視設定が整っていること | Phase 11 | Cloudflare Analytics および Dashboard のクォータ表示で確認 | 両指標が Dashboard で確認可能な状態になっている |
| AC-5 | Pages と Workers のロールバックが独立して機能すること | Phase 11 | 各 rollback 手順のドライランを実行し、Pages は旧デプロイへの切り替え、Workers は `wrangler rollback` で独立して動作することを確認 | Pages rollback と Workers rollback がそれぞれ単独で完結し、相互依存がない |

## 網羅性チェックリスト

### 正常系

| チェック項目 | 担当 Phase | 確認方法 |
| --- | --- | --- |
| Pages デプロイが成功し `ubm-hyogo-web.pages.dev` の URL でアクセスできる | Phase 5, 11 | `curl` または ブラウザで URL にアクセスし 200 OK を確認 |
| Pages staging デプロイが成功し `ubm-hyogo-web-staging.pages.dev` の URL でアクセスできる | Phase 5, 11 | `curl` または ブラウザで URL にアクセスし 200 OK を確認 |
| Workers デプロイが成功し `/api/health` エンドポイントでレスポンスが返る | Phase 5, 11 | `curl https://ubm-hyogo-api.<account>.workers.dev/api/health` で 200 OK を確認 |
| Workers staging デプロイが成功し staging エンドポイントでレスポンスが返る | Phase 5, 11 | `curl` で staging Workers エンドポイントを叩き 200 OK を確認 |
| D1 データベース（`ubm-hyogo-db-prod`）が作成され migration が適用できる | Phase 5, 11 | `wrangler d1 migrations apply ubm-hyogo-db-prod` が成功することを確認 |
| D1 staging データベース（`ubm-hyogo-db-staging`）が作成され migration が適用できる | Phase 5, 11 | `wrangler d1 migrations apply ubm-hyogo-db-staging --env staging` が成功することを確認 |

### 異常系

| チェック項目 | 担当 Phase | 対応シナリオ |
| --- | --- | --- |
| ビルド失敗時に旧バージョンが維持され、エンドユーザーへの影響がない | Phase 6 | A1（Pages ビルド失敗） |
| API Token の権限不足で `wrangler deploy` が拒否される | Phase 6 | A2（Workers デプロイ権限不足） |
| D1 の `database_id` 未設定で `wrangler d1 execute` がエラーを返す | Phase 6 | A3（D1 database_id 未設定） |
| ブランチ表記の drift（`develop` / `dev` 混在）が検出できる | Phase 6 | A4（branch drift） |
| `CLOUDFLARE_API_TOKEN` の誤配置（Cloudflare Secrets への配置）が検出できる | Phase 6 | A5（secret placement ミス） |
| Sheets と D1 の責務重複が architecture 仕様との照合で検出できる | Phase 6 | A6（D1 source-of-truth 競合） |
| Workers の req/day が無料枠（100k）に近づいた際にアラートまたは監視で検出できる | Phase 6 | A7（無料枠逸脱リスク） |
| wrangler.toml の環境名不一致が `--dry-run` で検出できる | Phase 6 | A8（wrangler.toml 環境名不一致） |

### 境界値

| チェック項目 | 担当 Phase | 確認方法 |
| --- | --- | --- |
| Pages の無料枠上限（500 builds/月）を把握し、Dashboard で現在値を確認できる | Phase 9, 11 | Cloudflare Dashboard の Pages > Usage で build count を確認 |
| Workers の無料枠上限（100k req/day）を把握し、Dashboard で現在値を確認できる | Phase 9, 11 | Cloudflare Dashboard の Workers > Analytics で req/day を確認 |
| D1 の無料枠上限（5GB ストレージ・25M rows read/day）を把握している | Phase 9, 11 | Cloudflare Dashboard の D1 > Usage で現在値を確認 |

## 未カバー AC とフォロー方針

- 実環境前提の AC は docs-first 前提で runbook completed に言い換える。
- AC-4（監視設定）と AC-5（rollback ドライラン）は Phase 11 で実環境を使って最終検証する。
- カバーできないものは Phase 12 で unassigned 化し、close-out ドキュメントに記録する。

# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

staging deploy / sync / Playwright / smoke で起こり得る失敗ケース 12 種を列挙し、それぞれの検出方法と rollback / 差し戻し先を `outputs/phase-06/failure-cases.md` に固定する。本タスクは staging のみ責務なので、production rollback は 09c に委ねる。

## 実行タスク

1. failure case を 12 種類列挙（HTTP / D1 / sync / Playwright / 認可 / 無料枠）
2. 検出方法（grep / wrangler tail / Cloudflare Analytics）を併記
3. staging 環境での mitigation（rollback or workaround）を記述
4. 09c へ伝搬する production 異常パターンとの線引きを明示

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-05.md | runbook 各ステップ |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | sync 失敗時の運用方針 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | rollback / cron 失敗運用 |
| 参考 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | rollback 全体 |

## 実行手順

### ステップ 1: failure case 12 種列挙
- HTTP / D1 / sync / Playwright / 認可 / 無料枠を網羅

### ステップ 2: 検出方法を各ケースに付与
- wrangler tail / Analytics / sync_jobs SELECT を活用

### ステップ 3: mitigation 記述
- staging で完結する rollback は実施、production 影響あれば 09c へ escalate

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 異常系検証ケースを AC matrix の "negative" 列に入れる |
| Phase 11 | 手動 smoke で異常系を 1 件は再現する |
| 並列 09b | 監視 / alert 設定が異常系を検出できるか相互参照 |
| 下流 09c | production rollback 手順との線引きを引き渡す |

## 多角的チェック観点（不変条件）

- 不変条件 #5: D1 直アクセスを試みる失敗ケースを網羅
- 不変条件 #10: 無料枠超過時の検出と対処（query 削減 / sync 一時停止）
- 不変条件 #11: staging admin で本人本文を編集しようとする攻撃ケースを 422 で阻止

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 列挙 | 6 | pending | 12 種 |
| 2 | 検出方法 付与 | 6 | pending | wrangler / curl / dash |
| 3 | mitigation 記述 | 6 | pending | rollback or workaround |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系サマリ |
| ドキュメント | outputs/phase-06/failure-cases.md | 12 ケース詳細 |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 完了条件

- [ ] failure case が 12 種記述
- [ ] 各ケースに検出方法と mitigation が併記
- [ ] production rollback との線引きが明示

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 12 ケースすべてに検出方法 + mitigation
- artifacts.json の phase 6 を completed に更新

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: failure-cases.md
- ブロック条件: 失敗ケース未列挙、または rollback 手順なしのケースが残る場合は次 Phase に進まない

## Failure cases（12 ケース）

| # | カテゴリ | 失敗内容 | 検出方法 | mitigation（staging） | production 伝搬 |
| --- | --- | --- | --- | --- | --- |
| F-1 | deploy | wrangler deploy が 5xx で失敗 | GitHub Actions step log | retry → 失敗続けば adapter 設定 (apps/web/wrangler.toml) を 04 へ差し戻し | 09c へ escalate |
| F-2 | D1 migration | `wrangler d1 migrations apply --remote` が ROLLBACK | `wrangler tail` で SQL error 確認 | 該当 migration を `apps/api/migrations` で fix → re-deploy | production migration 適用前に 09c で同じ修正を確認 |
| F-3 | secret 不足 | `wrangler secret list` で必要 secret が欠落 | step 3 で grep | `wrangler secret put <NAME> --config apps/api/wrangler.toml` で追加 | 09c へ secret 状況を伝搬 |
| F-4 | sync 401 | `POST /admin/sync/schema` が 401 | curl 結果 + `wrangler tail` | admin token / cookie 確認 → 05a / 04c で修正 | production sync 設計に反映 |
| F-5 | sync 422 | sync で 422 (zod fail) が返る | response body | 03a / 03b の zod schema を仕様に合わせ修正 | 同 |
| F-6 | sync 5xx | sync 中に Forms API rate limit / 5xx | sync_jobs.error column | 5 分待機して retry → 復旧しない場合 03a/b へ差し戻し | production cron で同事象起きたら 09b runbook で alert |
| F-7 | sync 部分失敗 | unknown field が大量に schema_diff_queue へ積まれる | `SELECT COUNT(*) FROM schema_diff_queue WHERE status='pending';` | 07b alias 割当 workflow へ差し戻し | production では事前に staging で alias を確定 |
| F-8 | Playwright e2e | E-2 (AuthGateState) が fail | Playwright HTML report | 05b へ差し戻し（`/no-access` 残置等は即修正） | production リリース前必須修正 |
| F-9 | 認可 leak | 一般 user が `/admin/*` で 200 を取る | curl + Playwright A-2 | 05a admin gate / 04c authorization へ差し戻し | production blocker（必ず修正） |
| F-10 | UI bundle に D1 | apps/web bundle に `D1Database` import | rg | 02c data-access-boundary lint へ差し戻し | production blocker |
| F-11 | 無料枠超過 | staging Workers req 24h で 30k 超え | Cloudflare Analytics | sync 頻度を 09b で再設計、過剰 query 04* を refactor | production cron 頻度に reflect |
| F-12 | admin UI 編集 form 残存 | staging `/admin/members/:id` で「本人本文編集 form」を発見 | 手動 smoke + grep 検索 | 06c へ差し戻し（form 削除 → 再 deploy） | production blocker |

## production 伝搬パターン

- F-2 / F-9 / F-10 / F-12 は production blocker として 09c の事前ゲート（Phase 1）で再確認
- F-6 / F-7 / F-11 は 09b の monitoring 設計で alert に変換
- F-1 / F-3 / F-4 / F-5 / F-8 は staging 完結で修正後再デプロイ

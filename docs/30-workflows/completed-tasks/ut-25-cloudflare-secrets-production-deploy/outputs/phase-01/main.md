# Phase 1 成果物 — 要件定義

## 1. 背景

UT-03（apps/api/src/jobs/sheets-fetcher.ts）で Cloudflare Workers 環境変数 `GOOGLE_SERVICE_ACCOUNT_JSON` を参照する Sheets API 認証経路が実装済み。Service Account JSON key は 01c-parallel-google-workspace-bootstrap で発行され、1Password に保管済み。apps/api の Workers 環境（staging / production）も 01b-parallel-cloudflare-base-bootstrap で作成済み。残るは「1Password の SA JSON を Cloudflare Workers の secret として staging / production 双方に配置する」手動オペレーションだが、現時点で未配置のため UT-26（Sheets API E2E 疎通）と UT-09（Sheets→D1 同期）が unblock できない。本ワークフローは、その配置オペレーションを Phase 1〜13 に分解した **タスク仕様書整備**に閉じる（実 `wrangler secret put` は Phase 13 ユーザー承認後の別オペレーション）。

## 2. 課題（why this task）

| # | 課題 | 影響 |
| --- | --- | --- |
| C-1 | secret 未配置のため apps/api がランタイムで Sheets API に署名できない | UT-26 / UT-09 が unblock できない |
| C-2 | `wrangler secret put` はインタラクティブ or stdin 必要で、誤った実行はシェル履歴に値を残す | secret leak リスク |
| C-3 | SA JSON の `private_key` 内 `\n` 改行を破壊する経路（コピペ / echo）で投入すると認証失敗 | production で 401 / 422 連発 |
| C-4 | staging 確認なしで production 直行すると、失敗時に production が先に壊れる | production incident |
| C-5 | 配置後の値は読み取り不可で、機能確認が secret list の name 表示だけでは完結しない | 認証成否は UT-26 まで判定不能 |
| C-6 | `apps/api/.dev.vars` の `.gitignore` 除外が抜けると誤コミットで leak | 永続的な secret 漏洩 |
| C-7 | `wrangler` 直接呼び出しは CLAUDE.md ルール違反（op + esbuild + mise の解決が抜ける） | 環境 drift / token leak リスク |

## 3. AC（受入条件）

AC-1〜AC-11 は `index.md` §受入条件と同期。本 Phase で blocker は検出されず、Phase 2（設計）へ進行可能。要点を再掲：

- **AC-1 + AC-7**: `bash scripts/cf.sh` ラッパー経路 + `wrangler secret delete` rollback の固定（CLAUDE.md ルール準拠）
- **AC-2**: staging-first → production の順序固定
- **AC-3 + AC-4**: `private_key` 改行保全 stdin パイプ + シェル履歴汚染防止
- **AC-5**: `wrangler secret list` での name 確認（値読取不能前提を明示）
- **AC-6**: ローカル `apps/api/.dev.vars` 設定 + `.gitignore` 除外確認
- **AC-8**: UT-03 runbook への配置完了反映ルート定義
- **AC-9**: スコープ「実投入は Phase 13 後の別オペレーション」明記
- **AC-10〜AC-11**: 4 条件 PASS / Phase 1〜13 状態整合

## 4. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-26 / UT-09 を unblock し、Sheets API 認証経路を本番化する |
| 実現性 | PASS | `bash scripts/cf.sh` ラッパー + `op read` stdin パイプは既存技術範囲。1Password / Workers 環境は完了済み |
| 整合性 | PASS | 不変条件 #5 を侵害しない。CLAUDE.md ルール（wrangler 直接禁止 / 平文 .env 禁止 / op 注入）と整合 |
| 運用性 | PASS | staging-first 順序 + delete + 再 put の rollback + name 確認 evidence ファイル分離で運用安全 |

## 5. スコープ

### 含む（spec scope）

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体
- staging-first → production 順序固定
- `bash scripts/cf.sh` ラッパー経路の固定（wrangler 直接禁止）
- `op read` stdin パイプによる `private_key` 改行保全 + 履歴汚染防止
- ローカル `apps/api/.dev.vars` 設定 + `.gitignore` 除外確認
- rollback 経路（delete + 旧 key 再投入）の文書化
- UT-03 runbook への配置完了反映ルート定義

### 含まない

- 実 `wrangler secret put` 投入（Phase 13 ユーザー承認後の別オペレーション）
- Sheets API E2E 疎通（UT-26）
- Sheets→D1 同期（UT-09）
- SA key 発行・ローテーション（01c で完了済み）
- Workers 環境作成（01b で完了済み）
- GitHub Actions 経由自動投入（将来評価）

## 6. タスク種別の固定

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_secrets_deployment |
| deploy_method | scripts/cf.sh wrapper + stdin injection from 1Password (MVP) |

`artifacts.json.metadata` と完全一致。

## 7. 苦戦箇所サマリ（親仕様 §苦戦箇所写経）

1. **インタラクティブ入力 / シェル履歴汚染**: `wrangler secret put` は stdin 必須。`HISTFILE=/dev/null` / `set +o history` / `op read` 直接 stdin パイプで対処。Phase 2 投入経路設計で受け皿化。
2. **`--env` 切替**: staging / production の `--env` 切替を `apps/api/wrangler.toml` の env 宣言と grep で照合。Phase 2 staging-first 順序設計 + Phase 6 異常系で受け皿化。
3. **JSON `private_key` 改行保全**: stdin バイト透過パイプで構造的に保全（`op read | wrangler secret put`）。Phase 2 投入経路設計で受け皿化。
4. **配置後値読取不可**: `wrangler secret list` は name のみ。機能確認は UT-26 疎通テストへ委譲。Phase 2 / 11 / UT-26 の責務分離で受け皿化。
5. **`apps/api/.dev.vars` gitignore 確認**: `grep -E '^\.dev\.vars$' apps/api/.gitignore` を Phase 11 smoke test 必須項目化。

## 8. 命名規則チェックリスト

- secret 名: `GOOGLE_SERVICE_ACCOUNT_JSON`（UT-03 確定済み・全環境共通）
- 環境名: `staging` / `production`（apps/api/wrangler.toml と一致）
- ラッパー経路: `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env <env>`
- ローカル: `apps/api/.dev.vars`（`.gitignore` 除外）
- evidence: `outputs/phase-13/secret-list-evidence-{staging,production}.txt`
- runbook: `outputs/phase-13/{deploy,rollback}-runbook.md`
- コミットメッセージ（Phase 13 後）: `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to staging/production [UT-25]`

## 9. 引き渡し

Phase 2（設計）へ：

- 真の論点 = 5 リスク（履歴汚染 / 改行破壊 / 順序事故 / 値読取不能前提 / wrangler 直接呼び出し）の同時封じ
- 投入経路 = `op read 'op://Vault/SA-JSON/credential' | bash scripts/cf.sh secret put ... --env <env>`
- staging-first → production 順序固定
- rollback = `secret delete` + 1Password 旧 key 再取得経由 `secret put`
- `apps/api/.dev.vars` の `.gitignore` 除外確認手順
- 値読取不能前提 → 機能確認は UT-26 疎通テストに委譲
- 4 条件 PASS の根拠
- スコープ境界（仕様書整備に閉じる / 実投入は Phase 13 後）

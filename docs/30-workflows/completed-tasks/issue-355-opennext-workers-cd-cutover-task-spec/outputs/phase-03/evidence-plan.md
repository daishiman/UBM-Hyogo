# Evidence 取得計画（E-1〜E-5）

`phase-03.md` 仕様 + Phase 11 NON_VISUAL evidence 設計の入力。本タスクは `visualEvidence = NON_VISUAL` のため screenshot は取得せず、以下の代替 evidence で AC を gate する。

## evidence 一覧

| ID | evidence | 取得方法 | 保存先 | 対応 AC |
| --- | --- | --- | --- | --- |
| E-1 | Web CD deploy log contract | GitHub Actions の deploy job ログ抜粋 + build command確認 | `outputs/phase-11/web-cd-deploy-log.md` | AC-1 / AC-2 |
| E-2 | wrangler deploy output contract | Workers deploy output、`.open-next/` 生成物、VERSION_ID をmask済みで記録 | `outputs/phase-11/wrangler-deploy-output.md` | AC-1 / AC-2 / AC-5 |
| E-3 | staging smoke result contract | `curl -I` 結果 + T-20〜T-30 PASS/FAIL 一覧 | `outputs/phase-11/staging-smoke-results.md` | AC-3 / AC-4 |
| E-4 | route mapping snapshot contract | Workers / Pages / custom domain / route のbefore-afterを記録 | `outputs/phase-11/route-mapping-snapshot.md` | AC-3 / AC-6 |
| E-5 | rollback readiness contract | previous VERSION_ID、rollback command、Pages dormant境界を記録 | `outputs/phase-11/rollback-readiness.md` | AC-6 |

> 元の `phase-03.md` では evidence を 6 行（build log / ls / wrangler deploy log / staging HTTP / smoke result / rollback log）で列挙していたが、AC との対応で集約し E-1〜E-5 の 5 グループに整理した。

## evidence ↔ AC 対応マトリクス

| AC | 主 evidence |
| --- | --- |
| AC-1 | E-1, E-2 |
| AC-2 | E-3 |
| AC-3 | E-4（smoke 結果） |
| AC-4 | E-3（deploy log）, E-4（HTTP 応答） |
| AC-5 | （静的 grep 検証のみ。evidence ファイル不要、PR description で grep 結果転載） |
| AC-6 | E-5 |

## secret hygiene

- `curl -I` 結果は API token を含めない（`-H "Authorization: ..."` を使わない）
- wrangler deploy log は API token / OAuth secret を mask した状態で保存
- evidence ファイルに `CLOUDFLARE_API_TOKEN` の実値を出力しない（CLAUDE.md 禁止事項整合）

## NON_VISUAL 整合

本タスクは UI 視覚変化なし（`visualEvidence = NON_VISUAL`）のため screenshot は取得しない。Phase 11 で `phase-11-non-visual-alternative-evidence.md` 整合の代替 evidence contract ファイル群として E-1〜E-5 を配置する。spec_created の本workflowでは各ファイルは `PENDING_IMPLEMENTATION_FOLLOW_UP` とし、runtime PASS は主張しない。

## 取得タイミング

| evidence | 取得タイミング |
| --- | --- |
| E-1 / E-2 | ローカル / CI build 完了直後 |
| E-3 | dev / main merge 後の CD job 完了直後 |
| E-4 | staging cutover 完了直後（および production cutover 完了直後に再取得） |
| E-5 | staging rollback drill 実施直後 + runbook 完成時点 |

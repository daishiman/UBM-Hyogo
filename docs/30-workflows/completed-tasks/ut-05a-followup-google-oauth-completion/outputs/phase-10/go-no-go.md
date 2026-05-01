# Phase 10 主成果物 — 最終レビューゲート (GO / NO-GO)

> 仕様: `phase-10.md`

## ゲート判定基準

| 観点 | 判定 |
| --- | --- |
| AC-1〜AC-12 すべてに evidence path 定義済 | DESIGN_PASS |
| 4 条件（価値性/実現性/整合性/運用性）すべて設計上 PASS | DESIGN_PASS |
| failure case マトリクス 14 件以上 / 苦戦箇所 4 件すべてカバー | PASS（18 件） |
| `cf.sh` 単一経路 / `wrangler login` 排除が runbook で固定 | PASS |
| 実値混入 0 件（仕様書 / outputs / 設計書） | PASS |
| 段階間ゲート（A/B/C）の通過条件と失敗時戻り経路が明確 | PASS |
| Phase 12 反映項目（02-auth / 13-mvp-auth / 05a placeholder）が明確 | PASS |
| Phase 11 必須 evidence 構成（screenshot 9 / curl / session JSON / log）が明示 | PASS |

## 総合判定

**GO_FOR_MANUAL_EXECUTION** — Phase 11 実機実行に進む。

これは OAuth 完了 / B-03 解除の GO 判定ではない。OAuth 完了判定は Phase 11 の Stage A/B/C evidence が実配置され、Phase 12 の system spec update が実結果で再適用された後にのみ行う。

## Phase 11 への前提

- 1Password で `op://Vault/UBM-Auth/*` 4 項目（auth-secret-staging / auth-secret-prod / google-client-id / google-client-secret）が登録済
- Cloudflare API token が `op://Vault/Cloudflare/api-token` で利用可能
- staging / production の Cloudflare Workers が deploy 可能状態（`apps/api/wrangler.toml` / `apps/web/wrangler.toml` の env 設定済）
- Google Cloud Console で OAuth client / consent screen の編集権限あり
- 外部 Gmail account が 1 つ用意可能（testing user 未登録）

## NO-GO 条件（参考）

以下のいずれかが満たされない場合は Phase 11 に進まず Phase 5 / Phase 9 に戻る:

- 1Password に必要 secret が未登録
- Cloudflare API token が無効 / 権限不足
- privacy / terms / home の URL が production deploy で 200 を返さない
- staging / production wrangler.toml に host 設定の drift がある

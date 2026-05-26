# Phase 7: カバレッジ確認

## 目的

concern と dependency edge の coverage を可視化する。

## concern カバレッジマトリクス

| concern | カバーする test | AC |
| ------- | --------------- | -- |
| production env 引数受理 | TC-PA / TC-PH | AC-1 |
| `needs: deploy-production` + `if: main` | actionlint + FP-P8 + Gate-B | AC-2 |
| production /admin 200 probe | TC-PA / FP-P2 | AC-3 |
| production tail digest grep | TC-PF / FP-P3 | AC-4 |
| 意図的 throw regression fail evidence | Gate-B（user-gated 実走 1 回）| AC-5 |
| production graceful skip | FP-P7 | AC-6 |
| redaction grep gate | G-P3 + 既存 staging test | AC-7 |
| `wrangler` 直叩きなし | G-P1 | AC-8 |
| main required status check 追加準備 | Phase 13 user-gated 手順 | AC-9 |
| cross-env leak 防止 | G-P5 / G-P6 + TC-P3 / TC-P4 | (cross-cutting) |
| 後方互換（staging 挙動不変）| G-P7 + 既存 staging test 全件 | (regression) |

→ 全 AC に最低 1 test が紐づく。AC-2/AC-3/AC-4 の runtime 部分は Gate-B（production 実走）で最終確認。
AC-5 と AC-9 は意図的に user-gated boundary（実本番影響 / branch protection PUT）。

## dependency edge カバレッジ

| edge | 確認 |
| ---- | ---- |
| runner → cf.sh tail（production env pass-through）| TC-PD（worker name 既定）+ G-P1（wrangler 直叩きなし）|
| job → mint helper（CLI `production`）| mint step が PRODUCTION_* prefix で cookie 発行（実走で確認）|
| job → runner（production env 引数）| run step exit code が job 成否に反映 |
| deploy-production → admin-runtime-smoke-production | `needs:` 依存（actionlint で構文、実走で順序）|
| GitHub Environment `production-runtime-smoke` → job | environment scope で secret 注入（Gate-B 実走で確認）|

## カバレッジ上の既知ギャップ（Gate-B で解消）

- 実 production の `/admin` が本当に 200 を返すか（session cookie 2 層通過の実証）は unit では stub のため、Gate-B（production deploy 後実走）でのみ確定する。
- AC-5 の意図的 throw regression fail evidence は 1 回限りの実本番 deploy + revert で取得。本 wave の test では fail path 分類のみカバー。
- AC-9 の main required status check PUT は read-only before JSON のみ事前取得可能。実 PUT は user-gated。

## 完了判定

- [x] 全 AC に test 紐付け
- [x] runtime-only / user-gated ギャップを Gate-B / Phase 13 へ明示移譲
- [x] cross-env leak / 後方互換 guard を明示

# AC マトリクス — 06a-followup-001

7 行（AC-1〜7）× 6 列（観点 / verify 手段 / 期待値 / evidence / 不変条件 / 失敗時戻し先）。

| AC | 観点 | verify 手段 | 期待値 | evidence | 不変条件 | 失敗時戻し先 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | local 起動 / esbuild | `bash scripts/cf.sh dev --config apps/api/wrangler.toml` を 2 回連続 fresh 起動 | `Listening on http://127.0.0.1:8787` を 2 回観測、`Host version` mismatch エラーなし | `local-curl.log` 冒頭セクション | — | Phase 6 異常系 → Phase 5 runbook |
| AC-2 | local 4 route family / 5 smoke cases | `curl -s -o /dev/null -w "%{http_code}\n"` を `/`, `/members`, `/members/{seeded-id}`, `/members/UNKNOWN`, `/register` の順で実行 | `200 / 200 / 200 / 404 / 200` | `local-curl.log` 中段 | #1（200 応答が schema 固定回避を間接担保） | Phase 5 runbook |
| AC-3 | 実 D1 経由証跡 | API 側 `GET /public/members` の `items.length >= 1` と、その ID を使った web `/members/{seeded-id}` の `200` を確認 | `items.length >= 1` かつ seeded detail `200` | `local-curl.log` 中段（API body summary セクション） | #1 | Phase 6 異常系（D1 migration apply 確認） |
| AC-4 | staging 4 route family / 5 smoke cases | staging URL に対し AC-2 と同形式の curl を実行 | `200 / 200 / 200 / 404 / 200` | `staging-curl.log` 中段 | — | Phase 5 runbook → Phase 2 設計 |
| AC-5 | staging vars | Cloudflare deployed vars を `bash scripts/cf.sh` 経由で確認。`apps/web/wrangler.toml` は現状未定義のため補助確認のみ | deployed vars が `localhost` を含まず apps/api staging URL を含む。未設定なら NO-GO | `staging-curl.log` 冒頭コメント行（値は記録しない） | — | Phase 2 設計 → Phase 5 |
| AC-6 | evidence trace | 06a 親へ本 followup task evidence index の相対リンクを追記し、実体ファイルは本 task 側に保持 | 親側にリンク trace 1 行 + 本 task 側に 3 planned evidence | 06a 親 Phase 11 evidence index / 本 task `outputs/phase-11/evidence/` | — | Phase 12 documentation |
| AC-7 | 不変条件 #5 再確認 | `pnpm --filter @ubm-hyogo/web exec rg -n "D1Database\|env\\.DB" app src --glob '!**/*.test.*' --glob '!**/__tests__/**'` を実行 | 0 件 | `local-curl.log` 末尾セクション | **#5（主担当）** | Phase 2 設計（境界違反は scope out として別 followup） |

## 列補足

- **observability**: AC-2 / AC-3 / AC-4 はすべて HTTP status または応答 body の 1 値で観測可能（複合判定なし）
- **secret hygiene**: 全 AC で API token / D1 database id を verify 出力に含めないこと（Phase 9 のチェックで担保）
- **evidence ファイル 3 種固定**: Phase 8 DRY 化と整合
- **不変条件 #6**: smoke ルートに GAS endpoint を含めないことで自動担保のため、本マトリクスでは個別 AC に紐付けない

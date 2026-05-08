# Phase 10: リスク再評価

## リスク一覧

| ID | リスク | 影響 | 確率 | 対策 |
| --- | --- | --- | --- | --- |
| R-01 | staging WAF / Cloudflare Access が curl request をブロック | smoke 全失敗 | M | `scripts/cf.sh whoami` で先に到達性確認。Cloudflare Access service token は `STAGING_ADMIN_BEARER` 等と独立し `.env` op 参照経由で注入 |
| R-02 | bearer / session / PII が evidence に実値で残る | secret / PII 漏洩 | M | raw body 永続化禁止 + summary-only runtime log + `grep-gate.log` 検証で防御 |
| R-03 | POST /me/visibility-request 等で DB 状態が変わる | staging 汚染 | L | POST route は実行対象から外す。route inventory には載せるが runtime smoke は GET のみ |
| R-04 | production への誤実行 | 重大 | L | env 引数 staging 以外を `exit 2` で reject。production URL を script 内に hardcode しない |
| R-05 | rate limit (`rateLimitSelfRequest`) で 429 | smoke 一部失敗 | L | 429 は AC-2/3 に直接影響しない（POST のみ）。429 は許容。GET 系で 429 が出たら時間を空けて再実行 |
| R-06 | staging member データ不在で `:memberId` 404 | AC-2 部分失敗 | L | `STAGING_MEMBER_ID` を 1Password 管理にし、テスト用永続 member を確保 |
| R-07 | `attendance` 配列が空（空 array） | hydrate 検証曖昧 | L | 期待は `"attendance":[]` でも array 型なら PASS。`jq -e 'type == "array"'` 相当の正規表現で判定（非空必須にしない） |
| R-08 | scripts/smoke 失敗時に親タスク state を誤更新 | 偽の completed 化 | L | Phase 12 の親タスク index.md 更新は **Phase 11 全 evidence 取得後** にのみ実施（順序ゲート） |

## リスク受容判断

- R-02 / R-04 は最重要。Phase 6 / Phase 9 の検査で **ブロッキング条件**として扱う
- 他は監視・運用対応で許容

## 完了条件

- 上記リスク表が `outputs/phase-10/risk-reassessment.md`（または本ファイル）に確定
- R-02 / R-04 の対策が Phase 5 / Phase 6 の checklist に反映済み

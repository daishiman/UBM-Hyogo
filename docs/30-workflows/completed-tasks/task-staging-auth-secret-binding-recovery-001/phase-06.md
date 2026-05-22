# Phase 6: テスト拡充

[実装区分: 実装仕様書]

## 1. fail path / 回帰 guard

| 観点 | 追加テスト | spec |
|------|-----------|------|
| AUTH_SECRET が大文字小文字違いで設定された場合 | `c.env.auth_secret` を読まない（env access の case sensitivity 確認） | spec-02 |
| AUTH_SECRET が valid だが JWT verify 失敗 | 既存 401 path 維持確認（503 や 500 に退化しない） | spec-02 |
| /me/* endpoint 経由で AUTH_SECRET falsy | `createMeSessionResolver()` の同 path 検証（503/500 のどちらを返すか確認） | spec-02 |
| auth-gate smoke 中に network timeout | curl `--max-time 10` 設定で hang しない | spec-03 |
| `cf.sh secret put` に valid 値 + 既存 secret 上書き | dry-run で abort せず通過 | spec-04 |

[OPEN-QUESTION-06] `createMeSessionResolver()` 側が AUTH_SECRET falsy 時に 503 を返すか 500 を返すか実装確認が必要。挙動が異なる場合は spec-02 で middleware と整合させる。

## 2. boundary case

- AUTH_SECRET length が 31 文字（zod min-32 違反 boundary）
- AUTH_SECRET length が 32 文字（zod min-32 boundary OK）
- ENVIRONMENT 値が `staging` / `production` / `development` の 3 値で logError の `env` field が正しく出力されること

## 3. Phase 6 DoD

- fail path / 回帰 guard ケースが Phase 4 ケース表に追加されている
- OPEN-QUESTION-06 が Phase 7 ローカル検証で実装読み解きにより解消

# Phase 3 成果物: 設計レビュー

issue #1056 の設計レビュー主成果物。代替案・指摘の詳細は `../../phase-03.md` を正本とする。

## 代替案比較（結論）

- **A（採用）**: `binding-policy-drift.ts` 新設 + `loadExpected` 再利用 + `cf.sh alerts binding-drift` + PR validate job。
- B（既存 diff 統合）/ C（独立 mjs）/ D（CI gate follow-up 分離）/ E（TOML ライブラリ）はいずれも不採用。理由は突合軸混線・重複・CONST_007 違反・コメント判別不能。

## レビュー指摘

| # | 重大度 | 要約 | 対応 |
| --- | --- | --- | --- |
| R1 | MINOR | コメント binding 行の skip | テスト (f) で保証 |
| R2 | MINOR | policy 不在時 undefined | `?? false` で disabled 扱い |
| R3 | MINOR | env 非対称 active | account 単位「いずれか active=active」集約 |
| R4 | PASS | 既存 diff と排他 | 別型・別サブコマンド |
| R5 | PASS | read-only | write API/op 非呼び出し |
| R6 | PASS | baseline | 現状 drift 0 |
| R7 | PASS | CI 配置 | secret 不要 validate job |

## 判定

MAJOR **0 件** / MINOR 3 件（吸収済）→ **着手可**。4 条件すべて PASS 再確認。

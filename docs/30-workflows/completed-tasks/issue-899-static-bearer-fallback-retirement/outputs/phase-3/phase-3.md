# Phase 3 — 設計レビュー

## 1. 設計レビュー観点

| 観点                          | 評価     | 根拠                                                                                                |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| 順序制約の正当性              | PASS     | #916 → workflow edit → mint smoke green → physical secret delete の逆転は技術的に不可能（fail する）|
| Redaction 不変条件の保全      | PASS     | mint step の `::add-mask::` → `GITHUB_ENV export` sequence は撤去後も同一構造を維持                |
| 後方互換捨て切りの正当性      | PASS     | mint helper は実装済み・前提 #916 で provisioning + smoke green が担保されてから merge する          |
| fail-fast guard の必要性      | PASS     | secret 欠落 silent skip による static 経路復活を構造的に防ぐ唯一手段                                |
| freshness hard-fail 昇格      | PASS     | 静的 bearer 寿命切れ吸収目的が消えるため warn-only の根拠喪失。env 削除で既定 hard-fail へ          |
| mask step 簡素化              | PASS     | mint 常時実行で `RUNTIME_SMOKE_AUTH_PATH=minted` 保証。`unknown` defensive fallback のみ残す       |
| 既存 `verify required secrets` step との整合 | PASS | mint step が GITHUB_ENV export するため check 対象 4 secret は引き続き runtime に存在            |

## 2. 反証検討（why-not-this-design）

| 別案                                                  | 採否     | 理由                                                                              |
| ----------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| job.env から `STAGING_AUTH_SECRET` も削除して step env に閉じる | 不採用 | job-scope env として残す方が他 step からも参照可能で fail-fast guard の汎用性が高い |
| `RUNTIME_SMOKE_FRESHNESS_ENFORCE` を `'1'` 明示       | 不採用   | 既定 hard-fail と二重指定になり drift 源になる。env 削除のほうが SSOT 化         |
| mask step を完全削除                                  | 不採用   | `STAGING_API_BASE` / `STAGING_MEMBER_ID` の add-mask は引き続き必要                |
| physical secret 削除を本仕様書 PR で実行              | 不採用   | 順序制約違反（workflow edit が先）。仕様書 PR には実コード変更を含めない方針      |

## 3. 影響範囲確認

| 影響先                                          | 評価                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| `scripts/smoke/runtime-attendance-provider.sh`  | 影響なし（GITHUB_ENV 経由で `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` を参照） |
| `scripts/smoke/mint-staging-bearers.mts`        | 影響なし（mint step が常時呼び出される点が変わるのみ）                     |
| `scripts/smoke/bearer-freshness-gate.mts`       | 影響なし（env 未設定時 hard-fail 既定動作に依存するだけ）                  |
| 他 workflow（`runtime-smoke-staging.yml` を `workflow_call` する側）| 影響なし（公開 IF 不変） |
| `verify-pr-ready.sh`                            | 影響なし                                                                   |

## 4. レビュー判定

- 設計承認: **可**
- Phase 4（テスト計画）へ進む

# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## 目的

Phase 2 設計が Phase 4 (テスト Red) へ進める品質か判定する。

## レビュー観点

| # | 観点 | 判定基準 |
|---|------|---------|
| R-01 | API surface 適合 | Phase 1 inventory と Phase 2 helper / component contract の差異が 0 |
| R-02 | 命名一貫性 | 既存 `apps/web/src/lib/admin/*` / `apps/web/src/components/admin/*` の命名と整合 (FB-SDK-07-4) |
| R-03 | OKLch 純度 | HEX / `bg-[#...]` 0 件で表現可能か机上確認 |
| R-04 | a11y | role / aria-label / heading hierarchy が WAI-ARIA 適合 |
| R-05 | state ownership | 親 / 子 / URL の三者で重複所有が無いか |
| R-06 | テスト容易性 | internal state vs prop の区別が Phase 4 テスト設計に渡る粒度で記述されている |
| R-07 | 並列タスク衝突 | task-15/16 の更新範囲と被らない |
| R-08 | エラー UI | 想定 status code (409/422/500) の UI 表現が定義済み |
| R-09 | 不在 endpoint フォールバック | `/admin/schema/aliases` 不在時の disabled + tooltip が機能要件として確定 |
| R-10 | フォーム/searchParams sync | `AuditLogPanel` の URL 双方向同期が submit/reset で正しく動く |

## 判定種別

- **APPROVE**: Phase 4 へ進む
- **MINOR**: 軽微な指摘 → 未タスク化候補に挙げて Phase 4 進行可
- **MAJOR / BLOCKING**: Phase 2 へ差し戻し

## Existing Owner 衝突検査 (FB-04)

| canonical owner | 同一 package 内既存 | 方針 |
|--------------|-----------------|-----|
| `SchemaDiffPanel` | あり | patch existing |
| `IdentityConflictRow` | あり | patch existing |
| `AuditLogPanel` | あり | patch existing |
| `apps/web/src/lib/admin/api.ts` | あり | additive export only |
| `apps/web/src/lib/admin/server-fetch.ts` | あり | reuse |

> Phase 5 着手前に `rg --files apps/web/app apps/web/src/components apps/web/src/lib | rg "schema|identity-conflicts|audit|SchemaDiff|IdentityConflict|AuditLog"` を再実行し、stale duplicate tree を作らないことを確認する。

## 成果物

- `outputs/phase-03/review-result.md` — 上記 R-01〜R-10 の判定 + MINOR 指摘リスト
- `outputs/phase-03/class-name-collision-check.md` — クラス名衝突検査結果

## DoD

- [ ] 全観点で APPROVE または MINOR (Phase 4 進行可) が確定
- [ ] MAJOR/BLOCKING があれば Phase 2 を更新済み
- [ ] MINOR は未タスク化候補に登録 (Phase 12 Task 4 で formalize)

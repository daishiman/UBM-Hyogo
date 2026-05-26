# Phase 8 — リファクタリング

## 1. 方針

**追加最小化**。本タスクは「削除」が主目的のため、新規追加は以下 2 点に限定する:

1. mint step 冒頭の `STAGING_AUTH_SECRET` fail-fast guard（5 行）
2. mask step の defensive `${RUNTIME_SMOKE_AUTH_PATH:-unknown}` notice（1 行）

## 2. 削除中心の差分

| 削除対象                                              | 行数（概算） |
| ----------------------------------------------------- | ------------ |
| job.env `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`  | 2            |
| job.env fallback 説明コメント                         | 2            |
| job.env `RUNTIME_SMOKE_FRESHNESS_ENFORCE` + コメント | 3            |
| mint step `if` guard                                  | 1            |
| mint step ヘッダコメント（AC-4 言及）                 | 2            |
| mask step `if`-`else` 分岐                            | 6            |
| runbook fallback section                              | ~30          |
| runbook 即時運用復旧 section                          | ~25          |

差分合計（概算）: -71 / +10 行。

## 3. naming / structure 整理

- workflow comment 内の「後方互換 fallback」「AC-4 fallback」記述を全削除し、`issue #899 で撤去済み` で一本化
- runbook 冒頭サマリーから「mint 導入前後で 2 経路」のような分岐記述を削除し「mint 一本化」のみへ簡素化

## 4. レビュー観点

- 不要な abstraction 追加なし
- DRY 違反なし（mint step / mask step / freshness step の責務分離は維持）
- naming consistency: `RUNTIME_SMOKE_AUTH_PATH=minted` は mint step が唯一の export 元

# Phase 7: 実装

[実装区分: 実装仕様書]

## 1. 目的

Phase 5 仕様に従い実コードを書く。サブタスク T1-T7 をこの Phase で全完了させる（T8 は Phase 10 で staging 実機実行）。

## 2. 実行手順

### Step 1: `quota-base.json` 編集（T1）

`infra/cloudflare-alerts/quota-base.json` に KV quota を追加し `snapshotAt` を更新。

### Step 2: KV policy JSON 新規作成（T2）

- `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json` を作成
- `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json` を作成
- `enabled: false` で初期コミット

### Step 3: schema 拡張（T3、条件付き）

Phase 2 で必要と判断された場合のみ `policy.schema.json` の `alert_type` enum / `conditions` oneOf を編集。

### Step 4: lib 更新（T4、条件付き）

namespace filter / 新 alert_type が API request body に影響する場合のみ `canonicalize.ts` / `api-client.ts` を編集。

### Step 5: テスト fixture / spec 追加（T5）

- `tests/fixtures/cloudflare-alerts/api-list-policies.json` に mock policy 2 件を追加
- 該当 spec ファイルにテストケース追加（Phase 6 リスト準拠）

### Step 6: README 更新（T6）

`infra/cloudflare-alerts/README.md` の policy 一覧表に KV policy 行を追加。

### Step 7: runbook 更新（T7）

`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の Step 4 / Step 4b を以下方針で更新:

- Step 4: `pnpm cf:alerts:diff` の対象に KV policy が含まれることを明記
- Step 4b: 既存の `kv:namespace list` / `kv:key list` 手順を維持しつつ、上位に「KV policy は repo に宣言済み、初期 `enabled:false`」の一文を追加。policy 名 (`workers-kv-writes-per-day`, `workers-kv-stored-bytes`) を runbook に列挙

## 3. 検証コマンド（各 Step 後）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test:alerts
mise exec -- pnpm cf:alerts:list           # repo expected vs Cloudflare actual
mise exec -- pnpm cf:alerts:diff           # drift 検知（apply 前は missing 期待）
```

## 4. 入出力 / 副作用

- Step 1-6 はファイル変更のみ。Cloudflare API への書き込みは行わない
- `cf:alerts:list` / `diff` は read-only token で実行（副作用なし）

## 5. ロールバック手順

- `git restore <path>` でファイル単位 revert
- Cloudflare 側は Phase 7 では未操作のため roll back 不要

## 6. 完了条件 (DoD)

- [ ] Step 1-7 すべて完了
- [ ] `typecheck` / `lint` / `test:alerts` がすべて PASS
- [ ] `cf:alerts:diff` が「KV policy missing」を 1 件以上検知（apply 前の期待挙動）
- [ ] 既存 policy の diff に影響が出ていない（regression なし）

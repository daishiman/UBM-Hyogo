# Phase 6: テスト計画

[実装区分: 実装仕様書]

## 1. 目的

Phase 5 で確定した変更に対し、追加・更新するテストケースを網羅し、Phase 9 でのテスト補強と Phase 11 evidence の対応関係を確定する。

## 2. テストレイヤ

| レイヤ | 対象 | テストファイル |
| --- | --- | --- |
| Unit (lib) | `canonicalize.ts` / `diff.ts` / `resolve.ts` / `load.ts` | `infra/cloudflare-alerts/lib/__tests__/*.spec.ts` |
| Integration (mock API) | `api-client.ts` の POST/PUT/DELETE フロー | `infra/cloudflare-alerts/lib/__tests__/api-client.spec.ts` |
| Schema validation | `policy.schema.json` 整合 | `load.spec.ts` 内 |
| Runtime (staging) | 擬似発火 → `/internal/alert-relay` → Slack | Phase 11 manual evidence |

## 3. テストケース追加

### 3.1 `load.spec.ts`

- `policies/` 配下を読み込み、エントリ数が +1 / +2 になる（KV policy 追加分）
- 新 fixture が `policy.schema.json` validation を通る
- `enabled: false` の policy も load 対象に含まれる

### 3.2 `canonicalize.spec.ts`

- KV policy の閾値が `quotaBase.values.workers_kv_writes_per_day * 0.8` に展開される
- webhook reference `name: "ut-17-relay"` が ID 直書きされず保持される

### 3.3 `diff.spec.ts`

- 「repo に新 KV policy あり / Cloudflare 上に無し」状態で `diff` が `missing` を返す
- `apply --yes` 後の状態を mock し `diff` が空になる（冪等性）
- 既存 `workers-requests` / `d1-*` / `pages-*` / `r2-*` policy の diff が影響を受けない（regression）

### 3.4 `api-client.spec.ts`

- KV policy 用 POST request body が Cloudflare API v4 仕様に準拠（alert_type / filters 含む）
- 403 / 422 等のエラー時に exit code 非 0 で fail
- `--ci` フラグでは `op run` をスキップする

### 3.5 schema regression

- 既存 5 policy が新 schema でも validation を通る（後方互換）

## 4. テスト除外条件

- Cloudflare 公式 API の実呼び出しは Unit / Integration では行わない（Phase 10 で staging のみ）

## 5. ローカル実行コマンド

```bash
mise exec -- pnpm test:alerts                # 一括
mise exec -- pnpm test:alerts -- canonicalize.spec   # 単体
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 6. テスト命名規約

`*.spec.ts` を使用（CLAUDE.md 不変条件 8。`*.test.ts` は禁止）。

## 7. 完了条件 (DoD)

- [ ] 全テストケースが spec ファイル単位で列挙されている
- [ ] regression 観点（既存 policy が壊れない）が含まれている
- [ ] Phase 11 で取得すべき runtime evidence の対応が明示されている

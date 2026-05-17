# Phase 5: 実装計画

> 本タスクは **仕様書生成のみ**。実コード変更は別タスクで行う。本ファイルは別タスクで参照するための変更ファイル一覧と実装順序を定義する。

## 変更ファイル一覧

### 新規（new）

| パス | 種類 | 責務 |
|------|------|------|
| `apps/api/src/routes/internal/service-token.ts` | TS | `POST /internal/service-token/{admin,member}` のハンドラ |
| `apps/api/src/lib/hmac.ts` | TS | HMAC-SHA256 検証ヘルパー（timing-safe） |
| `apps/api/src/lib/service-token-audit.ts` | TS | audit_log insert ラッパー |
| `apps/api/src/routes/internal/__tests__/service-token.spec.ts` | TS test | endpoint 単体 + 統合テスト |
| `apps/api/src/lib/__tests__/hmac.spec.ts` | TS test | HMAC 単体テスト |
| `apps/api/src/lib/__tests__/service-token-audit.spec.ts` | TS test | audit 単体テスト |
| `.github/workflows/runtime-smoke-production.yml` | yaml | production smoke workflow |
| `scripts/smoke/provision-runtime-smoke-secrets.sh` | shell | secret 投入ラッパー（staging / production 両対応） |
| `scripts/smoke/__tests__/runtime-attendance-provider.spec.sh` | shell test | smoke runner 拡張のテスト |

### 修正（modify）

| パス | 変更内容 |
|------|---------|
| `apps/api/src/index.ts` | service-token route の mount 追加 |
| `apps/api/wrangler.toml` | `SERVICE_TOKEN_SHARED_SECRET` / `JWT_SIGNING_KEY` / `SERVICE_TOKEN_REGISTERED_KIDS` / `SMOKE_ADMIN_USER_ID` / `SMOKE_MEMBER_USER_ID` の宣言追加。KV binding 追加（nonce / rate limit 用） |
| `apps/api/.dev.vars.example` | 上記 secret の `op://...` 参照記述追加 |
| `scripts/smoke/runtime-attendance-provider.sh` | staging-only ガード解除 / env 分岐 / `SMOKE_READONLY` ガード追加 |
| `scripts/ci/verify-env-secrets.allowlist` | `production-runtime-smoke: PROD_API_BASE PROD_ADMIN_BEARER PROD_MEMBER_ID PROD_ME_BEARER` 行追加 |
| `scripts/ci/__tests__/verify-env-secrets.spec.sh` | production scope 用テストケース追記 |

### 削除（delete）

| パス | 理由 |
|------|------|
| `scripts/smoke/provision-staging-secrets.sh` | `provision-runtime-smoke-secrets.sh` に rename。git mv で履歴維持 |

## 実装順序（依存関係）

```
1. apps/api/src/lib/hmac.ts             (依存なし)
2. apps/api/src/lib/service-token-audit.ts (依存なし)
3. apps/api/src/routes/internal/service-token.ts (1, 2 に依存)
4. apps/api/src/index.ts mount          (3 に依存)
5. apps/api/wrangler.toml + .dev.vars.example (3 と並行)
6. unit/integration テスト追加          (1-4 完了後)
7. scripts/smoke/runtime-attendance-provider.sh 拡張 (独立)
8. scripts/smoke/__tests__/runtime-attendance-provider.spec.sh (7 完了後)
9. scripts/smoke/provision-runtime-smoke-secrets.sh + git rm 旧名 (独立)
10. scripts/ci/verify-env-secrets.allowlist 追記 (独立)
11. scripts/ci/__tests__/verify-env-secrets.spec.sh 追記 (10 完了後)
12. .github/workflows/runtime-smoke-production.yml (1-11 完了後、staging 版を雛形に作成)
```

## 差分確認（verify_existing 部分）

| 既存ファイル | 確認内容 |
|------------|---------|
| `.github/workflows/runtime-smoke-staging.yml` | trigger / environment / steps を雛形として保持。新 workflow に流用 |
| `scripts/ci/verify-env-secrets.sh` | コアロジック不変。allowlist 拡張で挙動が変わらないことを既存テストで確認 |
| `scripts/smoke/runtime-attendance-provider.sh` | staging 部分の挙動が retain される（既存テスト互換） |

## canUseTool 適用可能範囲（FB-P0-09-U1-2 準拠）

本タスクは Electron / SDK callback を扱わないため canUseTool 配線は非該当。

## IPC surface（FB-SDK-07-2 準拠）

本タスクは Electron Preload を扱わないため Preload API 経由必須ルールは非該当。

## 完了条件

- 新規 / 修正 / 削除のファイル一覧が全件列挙されている
- 実装順序が依存関係順に並んでいる
- verify_existing 部分の確認内容が明記されている

## 成果物

- `outputs/phase-05/implementation-plan.md`（本ファイル）

## 次 Phase 入力

- Phase 6: fail path / 回帰 guard のテスト追加
- Phase 7: coverage 確認対象範囲

# Phase 4: テスト計画

## テスト戦略概要

| 領域 | テスト種別 | フレームワーク | 配置先 |
|------|----------|--------------|--------|
| service-token endpoint | unit + integration | Vitest + `*.spec.ts` | `apps/api/src/routes/internal/__tests__/service-token.spec.ts` |
| HMAC ヘルパー | unit | Vitest | `apps/api/src/lib/__tests__/hmac.spec.ts` |
| audit ヘルパー | unit | Vitest | `apps/api/src/lib/__tests__/service-token-audit.spec.ts` |
| allowlist verify | shell spec | bats 互換 / 既存 `*.spec.sh` | `scripts/ci/__tests__/verify-env-secrets.spec.sh`（既存に追記） |
| smoke runner 拡張 | shell spec | 既存 pattern | `scripts/smoke/__tests__/runtime-attendance-provider.spec.sh`（新設） |
| production workflow | static yaml lint + actionlint | `actionlint` | CI 上で実行（既存 lint job 流用） |

## 1. service-token endpoint テスト

### 1.1 単体テスト（unit）

| # | テストケース | 期待 |
|---|-------------|------|
| TC-ST-U-01 | 正しい HMAC + 有効な ts + 未使用 nonce で admin token 発行 | 200 / `role=admin` / `exp = iat + 90日` |
| TC-ST-U-02 | 正しい HMAC + 有効な ts + 未使用 nonce で member token 発行 | 200 / `role=member` |
| TC-ST-U-03 | HMAC 不正 | 401 / `error=unauthorized` |
| TC-ST-U-04 | ts skew > 300秒 | 400 / `error=invalid_request` / `reason=ts_skew` |
| TC-ST-U-05 | ts skew < -300秒 | 400 |
| TC-ST-U-06 | nonce 重複 | 409 / `error=nonce_replayed` |
| TC-ST-U-07 | kid 未登録 | 401 |
| TC-ST-U-08 | body parse 失敗（不正 JSON） | 400 |
| TC-ST-U-09 | rate limit 超過（11 req/h 目） | 429 / `retry_after > 0` |
| TC-ST-U-10 | JWT claim に `sub` / `role` / `iat` / `exp` / `jti` / `iss` / `aud` 全件含まれる | claim 検証 PASS |
| TC-ST-U-11 | JWT 署名が `JWT_SIGNING_KEY` で検証可能 | 検証 PASS |
| TC-ST-U-12 | 監査ログに secret / token 本体が含まれない | `grep -E 'eyJ|<secret>'` が 0 件 |

### 1.2 統合テスト（integration）

| # | テストケース | 期待 |
|---|-------------|------|
| TC-ST-I-01 | 発行された admin token で `/api/admin/audit` にアクセス可能 | 200 |
| TC-ST-I-02 | 発行された member token で `/api/me` にアクセス可能 | 200 |
| TC-ST-I-03 | 発行された member token で `/api/admin/*` にアクセス不可 | 403 |
| TC-ST-I-04 | 監査ログ insert が D1 に記録される | row count +1 |

## 2. HMAC ヘルパー単体テスト

| # | テストケース | 期待 |
|---|-------------|------|
| TC-HMAC-01 | 正しい signature で `true` | true |
| TC-HMAC-02 | 1 byte 違う signature で `false` | false |
| TC-HMAC-03 | 空 signature で `false` | false |
| TC-HMAC-04 | timing-safe 比較が動作する（実行時間が等価） | 比較時間の variance < 閾値 |

## 3. audit ヘルパー単体テスト

| # | テストケース | 期待 |
|---|-------------|------|
| TC-AUD-01 | `logServiceTokenIssue` で D1 insert | row 確認 |
| TC-AUD-02 | metadata に secret 値が混入しない | metadata json に `eyJ...` 不在 |
| TC-AUD-03 | `logServiceTokenFailure` で `action=issue_service_token_failed` | record 確認 |

## 4. allowlist verify テスト（shell）

既存 `scripts/ci/__tests__/verify-env-secrets.spec.sh` に追記:

| # | テストケース | 期待 |
|---|-------------|------|
| TC-AL-01 | `production-runtime-smoke` scope で 4 件全揃い → exit 0 | exit 0 |
| TC-AL-02 | `PROD_ADMIN_BEARER` 欠落 → exit 1 + stderr に missing 表示 | exit 1 |
| TC-AL-03 | 未知の environment 名 → exit 2 | exit 2 |
| TC-AL-04 | `staging-runtime-smoke` の既存テストが回帰しない | exit 0 |

## 5. smoke runner spec テスト（shell）

新設 `scripts/smoke/__tests__/runtime-attendance-provider.spec.sh`:

| # | テストケース | 期待 |
|---|-------------|------|
| TC-SR-01 | `ENV=staging` で GET + POST 両方が実行される | 関連 curl 呼び出しを mock で確認 |
| TC-SR-02 | `ENV=production SMOKE_READONLY=1` で GET のみ実行、POST/PUT/DELETE skip | mock 確認 |
| TC-SR-03 | `ENV=unknown` で exit 1 + usage 表示 | exit 1 |
| TC-SR-04 | 必須 env var 欠落で exit 1 | exit 1 |
| TC-SR-05 | bearer / api_base / member_id の env 切替が staging/production で適切 | mock 確認 |

## 6. workflow yaml lint

- `actionlint` で `.github/workflows/runtime-smoke-production.yml` を検査
- 既存 `runtime-smoke-staging.yml` と diff を取り、構造差分が schedule + SMOKE_READONLY + secret 名のみであることを確認

## 7. private method テスト方針

本タスクの service-token endpoint は class ベースではなく function ベース実装のため private method キャストは不要。必要時は `(facade as unknown as FacadePrivate)` パターンを使う方針を明記（FB-P0-09-U1-1 準拠）。

## 8. fail path カバレッジ

| シナリオ | テスト ID |
|---------|----------|
| HMAC 不正 | TC-ST-U-03 |
| ts skew | TC-ST-U-04, 05 |
| nonce replay | TC-ST-U-06 |
| kid 未登録 | TC-ST-U-07 |
| rate limit | TC-ST-U-09 |
| read-only 違反試行 | TC-SR-02 |
| allowlist 欠落 | TC-AL-02 |

## 9. テスト実行コマンド

```bash
# unit/integration
mise exec -- pnpm --filter @repo/api test -- --run apps/api/src/routes/internal/__tests__/service-token.spec.ts
mise exec -- pnpm --filter @repo/api test -- --run apps/api/src/lib/__tests__/hmac.spec.ts
mise exec -- pnpm --filter @repo/api test -- --run apps/api/src/lib/__tests__/service-token-audit.spec.ts

# shell spec
bash scripts/ci/__tests__/verify-env-secrets.spec.sh
bash scripts/smoke/__tests__/runtime-attendance-provider.spec.sh

# yaml lint
actionlint .github/workflows/runtime-smoke-production.yml
```

## 完了条件

- TC-ST-U-01〜12 / TC-ST-I-01〜04 / TC-HMAC-01〜04 / TC-AUD-01〜03 / TC-AL-01〜04 / TC-SR-01〜05 が定義されている
- fail path カバレッジ表が記録されている

## 成果物

- `outputs/phase-04/test-plan.md`（本ファイル）

## 次 Phase 入力

- Phase 5: 変更ファイル一覧（新規 / 修正）、実装順序、依存関係

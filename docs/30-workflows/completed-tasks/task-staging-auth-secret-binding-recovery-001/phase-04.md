# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## 1. テスト設計

| テスト | 対象 spec | 種別 | path |
|--------|-----------|------|------|
| TC-MW-01〜03 | spec-02 | unit | `apps/api/src/middleware/require-admin.spec.ts` |
| TC-ENV-01〜02 | spec-02 | unit | `apps/api/src/env.spec.ts` |
| TC-CONTRACT-01 | spec-02 | contract | `apps/api/src/routes/admin/members.contract.spec.ts` |
| TC-SMOKE-01〜02 | spec-03 | shell | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |
| TC-CFSH-01〜02 | spec-04 | shell（手動 dry-run） | spec-04 仕様書内に dry-run コマンド明記 |

## 2. require-admin.spec.ts ケース

| ID | input `c.env.AUTH_SECRET` | request | expected |
|----|---------------------------|---------|----------|
| TC-MW-01 | `undefined` | `GET /admin/members` (Bearer 付き) | status=500, body=`{"error":"auth misconfigured"}`, `logError` 1 回呼出 (`code: "UBM-AUTH-SECRET-MISSING"`) |
| TC-MW-02 | `""` (空文字) / min length 未満 | 同上 | 同上（空文字・短すぎる値も fail close） |
| TC-MW-03 | `"x".repeat(32)` (valid) | 有効 JWT 付き | next() に進む、status=200（mock ハンドラ経由） |

- `logError` は `vi.fn()` で stub し、call args の `code` / `env` / `secretLength` を assert
- 既存 spec ファイルがある場合は `describe("AUTH_SECRET binding", ...)` を追加

## 3. env.spec.ts ケース

| ID | input | expected |
|----|-------|----------|
| TC-ENV-01 | `AUTH_SECRET` 未設定 | zod parse throw（message に "AUTH_SECRET" を含む） |
| TC-ENV-02 | `AUTH_SECRET = ""` / `"short"` | zod parse throw（min length 違反） |

- 既存 zod schema が存在する場合は AUTH_SECRET 行のみ追加

## 4. members.contract.spec.ts ケース

| ID | scenario | expected |
|----|----------|----------|
| TC-CONTRACT-01 | middleware 内で AUTH_SECRET falsy | status=500, body shape `{error:"auth misconfigured"}` を厳密比較 |

- PR #854 で追加された defensive ハンドラ系テストとは独立に追加

## 5. smoke script test ケース

| ID | input | expected |
|----|-------|----------|
| TC-SMOKE-01 | mock server が `status=500 body={"error":"auth misconfigured"}` または空白入り JSON を返す | summary/log に `auth-secret-binding-missing` reason が含まれる、exit code 1 |
| TC-SMOKE-02 | mock server が status=200 を返す | summary に `auth-secret-binding-missing` reason が含まれない、exit code 0 |

## 6. cf.sh guard 手動 dry-run

| ID | 入力 | 期待 |
|----|------|------|
| TC-CFSH-01 | `echo -n "" \| bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run` | exit 78 + stderr に `refusing empty stdin` |
| TC-CFSH-02 | `echo -n "validvalue" \| bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run` | exit 0（実投入はしない） |

- `--dry-run` フラグは spec-04 で新規追加（実投入を抑止）

## 7. Phase 4 DoD

- 全テストケース ID が確定
- 既存 test ファイル vs 新規分が明示
- mock 戦略（`vi.fn()` / mock server）が決定

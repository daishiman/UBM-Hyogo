# Phase 4: テスト計画（logger tag 昇格 / sentry-alerts IaC）

> 入力: [phase-3-design-review.md](phase-3-design-review.md)
> 出力: `outputs/phase-4/test-plan.md`（本ファイルの確定版）
> implementation_mode: `new`（RED/GREEN サイクル）
> 対象タスク種別: **NON_VISUAL**（UI/UX 変更なし。logger 内部 + IaC ファイル群のみ）

## 4-0. TDD RED 前チェック（命名規則整合）

Phase 1-3 で確認した命名規則と整合していることを RED 着手前に確認する。

| 観点 | Phase 1-3 で確定した規則 | 本 Phase での適用 |
|---|---|---|
| logger tag キー | 既存 tags は `event` / `runtime`（camelCase ではなく snake/単語） | 追加 tag は `scope` / `digest`（既存 emit field 名と一致） |
| IaC lib ファイル名 | `infra/cloudflare-alerts/lib/{types,load,diff,api-client,canonicalize,cli}.ts`（kebab-case ファイル） | `infra/sentry-alerts/lib/` も同名で揃える |
| IaC test ファイル | `*.spec.ts` のみ（lefthook `block-test-suffix` が `*.test.ts` を reject） | `schema-contract.spec.ts` / `load.spec.ts` / `diff.spec.ts` |
| policy JSON 命名 | `infra/cloudflare-alerts/policies/<kebab>.json` | `infra/sentry-alerts/policies/admin-error-boundary.json` |
| 関数命名 | `loadExpected` / `diffPolicy` / `canonicalizePolicy`（camelCase 動詞 + 名詞） | `loadPolicies` / `diffPolicies` / `canonicalize` |

## 4-1. RED 対象テストケース一覧

### (A) logger.ts tag 昇格（`apps/web/src/lib/__tests__/logger.spec.ts` に追加）

mock 戦略: 既存ファイル冒頭の `vi.mock("../sentry/capture", ...)` を再利用する。`captureException` / `captureMessage` は `vi.fn()` で、`toHaveBeenCalledWith` の `tags` 引数を `expect.objectContaining` で検証する。`capture.ts` の `setTag` 呼び出しそのものは `capture.ts` 内部実装であり logger の責務外なので、logger テストでは「logger が tags オブジェクトに scope/digest を載せて capture を呼ぶこと」までを検証する（setTag の検証は sentry-alerts ではなく capture.ts 既存テストの責務）。

> **環境注意**: 既存 `logger.spec.ts` は `// @vitest-environment jsdom` 宣言済み。`window` を差し替える必要がある場合も `vi.stubGlobal("window", ...)` は**禁止**（React/happy-dom の `instanceof` 判定が壊れる）。必要時は `Object.defineProperty(window, "...", { value, writable: true })` を使う。本 Phase の追加ケースは `window` 差し替え不要。

| ID | テスト名（it） | 入力 | 期待値 | 対象ファイル |
|---|---|---|---|---|
| TC-LOG-01 | `promotes scope and digest into Sentry tags on error()` | `logger.error({ event:"error.boundary.caught", scope:"admin", digest:"167275886", err })` | `captureException` の第2引数 `.tags` が `{ event:"error.boundary.caught", runtime: expect.any(String), scope:"admin", digest:"167275886" }` を `objectContaining` で満たす | `logger.spec.ts`(修正) → `logger.ts`(修正) |
| TC-LOG-02 | `omits scope and digest tags when absent` | `logger.error({ event:"plain.error", err })`（scope/digest なし） | `captureException` の `.tags` が `scope` / `digest` キーを**持たない**（`expect(tags).not.toHaveProperty("scope")` / `not.toHaveProperty("digest")`）。`event` / `runtime` は従来通り存在（回帰 guard） | `logger.spec.ts`(修正) → `logger.ts`(修正) |
| TC-LOG-03 | `stringifies non-string digest defensively / drops non-string scope` | `logger.error({ event:"e", scope:123 as unknown, digest:undefined, err })` | `merged.scope` が string でないため `tags.scope` は付かない（`typeof === "string"` guard）。`digest` も同様に付かない | `logger.spec.ts`(修正) → `logger.ts`(修正) |
| TC-LOG-04 | `promotes scope into tags on warn() via captureMessage` | `logger.warn({ event:"w", scope:"admin" })` | `captureMessage` の第2引数 `.tags` が `{ event:"w", scope:"admin" }` を `objectContaining` で満たす（warn 経路も同一昇格ロジックを通る回帰確認） | `logger.spec.ts`(修正) → `logger.ts`(修正) |

> 既存テスト（`emits JSON one-line` / `calls captureException once` / `keeps err alias` 等）はそのまま PASS し続けること（回帰 guard）。`extras: payload` に scope/digest が含まれる従来挙動も維持されることを TC-LOG-01 の追加 assertion（`extras` に `scope` が残る）で確認してもよい。

### (B) sentry-alerts IaC（`infra/sentry-alerts/lib/__tests__/` に新規）

mock 戦略: `infra/cloudflare-alerts/lib/__tests__/schema-contract.spec.ts` と同様、`fs.readFileSync` で実ファイルを読む（実 IaC ファイルの contract test）。`load`/`diff` は純関数 + fixture dir 読み込みなので外部 mock 不要。API client は `SENTRY_ALERTS_MOCK_DIR` 環境変数（cloudflare 側の `CF_ALERTS_MOCK_DIR` をミラー）で fixture 切替する設計のため、Phase 4 の RED では API client を呼ばない純関数レイヤ（schema-contract / load / diff）に絞る。

| ID | テスト名（it） | 入力 | 期待値 | 対象ファイル |
|---|---|---|---|---|
| TC-IAC-01 | `policy schema requires event/scope filters and frequency` | `policy.schema.json` を読み、`required` と `properties` を検証 | `required` に `name,environment,action_match,filter_match,filters,frequency,notification_interval_minutes,actions` を含む。`filters` items が `field`(enum: `event`,`scope`) + `value` を要求 | `schema-contract.spec.ts`(新規) → `policy.schema.json`(新規) |
| TC-IAC-02 | `admin-error-boundary manifest has no server id and matches schema shape` | `policies/admin-error-boundary.json` を読む | `id` undefined / `filters` に `event=error.boundary.caught` と `scope=admin` の2件 / `frequency.window_minutes=5` / `frequency.threshold=3` / `actions[0]` が slack target と workspace env / `environment="staging"` | `schema-contract.spec.ts`(新規) → `admin-error-boundary.json`(新規) |
| TC-IAC-03 | `loadPolicies reads all json from policies dir sorted` | `loadPolicies(<repoRoot>/infra/sentry-alerts/policies)` | 戻り値が `Policy[]` で、`admin-error-boundary` を含む。ファイル名昇順 sort。canonicalize 済み（キー sort・description trim） | `load.spec.ts`(新規) → `load.ts`(新規) |
| TC-IAC-04 | `loadPolicies returns empty array for missing dir` | 存在しない dir | `[]`（cloudflare 側 `listJsonFiles` と同じ fail-soft） | `load.spec.ts`(新規) → `load.ts`(新規) |
| TC-IAC-05 | `diffPolicies detects missing rule (local present, remote absent)` | local=[admin-error-boundary], remote=[] | `[{ kind:"missing", name:"admin-error-boundary" }]` | `diff.spec.ts`(新規) → `diff.ts`(新規) |
| TC-IAC-06 | `diffPolicies detects changed threshold` | local.threshold=3, remote.threshold=10（その他同一） | `[{ kind:"changed", name:"admin-error-boundary", path:"frequency.threshold", expected:3, actual:10 }]` | `diff.spec.ts`(新規) → `diff.ts`(新規) |
| TC-IAC-07 | `diffPolicies returns empty when local equals remote` | local==remote（canonicalize 後一致） | `[]`（exit 0 判定の根拠） | `diff.spec.ts`(新規) → `diff.ts`(新規) |

## 4-2. private/内部の検証方針

- logger の `emit()` は module-private 関数。テストは public `logger.error()` / `logger.warn()` 経由で行い、`emit` を直接呼ばない（既存テストと同方針）。
- sentry-alerts lib の純関数（`loadPolicies` / `diffPolicies` / `canonicalize`）は named export なので直接 import して検証する。
- `api-client.ts` の private（`cfRequest` 相当）はテストせず、export 関数（`listRules` 等）を mock dir 経由で間接検証する（Phase 6 で追加。Phase 4 RED スコープ外）。

## 4-3. 実行コマンド

```bash
# 依存整合（worktree 直後の esbuild mismatch 回避）
mise exec -- pnpm install

# (A) logger テスト（jsdom 環境・対象ファイル指定）
mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/logger.spec.ts

# (B) sentry-alerts lib テスト（IaC lib は vitest 対象ファイル指定）
mise exec -- pnpm exec vitest run infra/sentry-alerts/lib/__tests__

# RED 時点では (A) の新規4ケース / (B) の7ケースが fail（実装前なので想定どおり）
```

## 4-4. RED → GREEN 遷移条件

- (A): `logger.ts` の `emit()` に scope/digest 昇格を実装すると TC-LOG-01..04 が GREEN。
- (B): `policy.schema.json` / `admin-error-boundary.json` / `load.ts` / `diff.ts` / `canonicalize.ts` / `types.ts` を実装すると TC-IAC-01..07 が GREEN。
- 既存テスト全件が PASS のまま維持されること（回帰 guard）を GREEN 判定の必須条件とする。

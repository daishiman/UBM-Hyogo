# Phase 1 サマリ: 要件定義

詳細: [`../../phase-1-requirements.md`](../../phase-1-requirements.md)

## 実装区分

- `[実装区分: 実装仕様書]`（CONST_004）。3 lane すべて新規 script / 既存 script 修正 / CI workflow 修正を伴う。
- タスク種別: **CI recovery / NON_VISUAL**。Phase 11 は screenshot 不要、自動テスト + CI 観測を代替証跡とする。
- `implementation_mode`: `new`。

## 3 lane

| Lane | 失敗 | 根本原因 |
|---|---|---|
| A | `runtime-smoke-staging / smoke` admin-list 401 | 静的 24h JWT bearer secret が失効 → `verifySessionJwt` が null → require-admin 401 |
| B | `coverage-gate` MISSING 誤検知 → exit 1 | shard 失敗で `coverage-packages` artifact 未 upload → `--no-run` が summary 欠落を MISSING 報告。Lane C の純粋な下流 |
| C | `coverage-gate-shard (packages)` checkout 失敗 exit 128 | `actions/checkout@v4` が credential を読めず fetch 失敗。`ci.yml` に top-level `permissions:` 欠如 |

## 受入条件（要点）

- AC-1/2: mint 方式で admin-list 200 + `.members` array、admin JWT は `isAdmin=true` / me JWT は `isAdmin=false` で `verifySessionJwt` 通過。
- AC-3: secret / 署名鍵 / JWT が log / 成果物 / docs に平文露出しない（`::add-mask::`）。
- AC-4: `STAGING_AUTH_SECRET` 未設定時は静的 bearer fallback が動作。
- AC-5: `ci.yml` top-level `permissions: contents: read` + shard checkout 明示 token + actionlint PASS。
- AC-6/7: shard 成功時は coverage-summary.json 検出で exit 0。shard 失敗時は MISSING ではなく「upstream shard failed」を先に出す。
- AC-8: required context 名（`coverage-gate` / `runtime smoke staging / smoke`）不変。
- AC-9: typecheck / lint / unit 全 PASS。

## 命名規則

- mint helper: `scripts/smoke/mint-staging-bearers.mts`（`.mts` + `tsx`。型安全と `@ubm-hyogo/shared` parity を優先）。
- test: `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（`*.spec.ts` のみ / 不変条件 #8）。

## 確定シグネチャ（auth.ts 実体）

- `signSessionJwt(secret: string, input: { memberId, email, isAdmin, name?, nowSeconds?, ttlSeconds? }): Promise<string>`
- `verifySessionJwt(token: string, secret: string, nowSeconds?: number): Promise<SessionJwtClaims | null>`
- `SESSION_JWT_TTL_SECONDS = 86400`（24h。これが失効の原因）。

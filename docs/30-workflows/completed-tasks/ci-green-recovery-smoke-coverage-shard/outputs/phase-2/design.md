# Phase 2 サマリ: 設計

詳細: [`../../phase-2-design.md`](../../phase-2-design.md)

## Lane A — CI 実行時 mint 方式

- 静的 24h JWT bearer secret を廃し、smoke 実行直前に署名鍵 `STAGING_AUTH_SECRET`（staging API の `AUTH_SECRET` と同値）から短命 JWT を mint。失効が原理的に起きない。
- 新規 helper `scripts/smoke/mint-staging-bearers.mts`：

  ```ts
  export async function mintStagingBearers(env: {
    authSecret: string; adminMemberId: string; adminEmail: string;
    meMemberId: string; meEmail: string; ttlSeconds?: number;
  }): Promise<{ adminBearer: string; meBearer: string; memberId: string }>;
  ```

  - `signSessionJwt(authSecret, { memberId, email, isAdmin, ttlSeconds })` を 2 回呼ぶ。admin=`isAdmin:true` / me=`isAdmin:false`。既定 ttl 600（10 分）。
  - 純粋関数 + CLI guard 構造。`process.env` を直接読まず引数で受ける（test 可能化）。
  - JWT を console / stdout に出さず `GITHUB_OUTPUT` 追記のみ。必須 env 欠落で `exit 2`。
- `runtime-smoke-staging.yml`：setup-project 追加 + mint step（mint→`::add-mask::`→`GITHUB_ENV` を 1 step に閉じる）+ `if: env.STAGING_AUTH_SECRET != ''` で fallback（静的 bearer 維持）。
- `runtime-attendance-provider.sh`：reason 分岐拡張（500 auth misconfigured=`auth-secret-binding-missing` / 401 unauthorized=`auth-token-invalid-or-expired` / 403 forbidden=`auth-not-admin`）。JWT は出力しない。
- runbook：mint secret 5 種 + 即時再発行手順を追記（実行はユーザー gated）。

## Lane C — checkout hardening

- `ci.yml` の `on:`→`jobs:` 間に top-level `permissions: contents: read` を追加（`runtime-smoke-staging.yml:15-16` と同形）。
- `coverage-gate-shard` / `coverage-gate` の checkout に `token: ${{ github.token }}` / `persist-credentials: true` を明示。
- 防御的設計（transient の可能性は残るが hardening は無害・回帰リスクなし）。

## Lane B — MISSING 誤検知解消

- `coverage-gate` job の step 順序を入れ替え：「Fail closed on failed shard」を `coverage-guard.sh --no-run` の**前**へ移動。shard 失敗時は「upstream shard failed」を先に出して exit 1、誤解を招く MISSING に到達しない。
- `coverage-guard.sh` の `--no-run` MISSING 出力に診断誘導メッセージを追記（判定ロジックは不変 / false negative を作らない）。
- Lane B(a) と Lane C は同一 `ci.yml` を編集 → 1 diff に統合。

## 変更対象ファイル 7 件

1. `scripts/smoke/mint-staging-bearers.mts`（新規）
2. `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（新規）
3. `scripts/smoke/runtime-attendance-provider.sh`（修正）
4. `.github/workflows/runtime-smoke-staging.yml`（修正）
5. `.github/workflows/ci.yml`（修正・Lane B+C 統合）
6. `scripts/coverage-guard.sh`（修正）
7. `docs/.../runbooks/secret-provisioning.md`（修正）

## 不変条件

required context 名不変 / secret・JWT・署名鍵を平文露出させない（`::add-mask::`）/ mint JWT は `verifySessionJwt` で parity 必須 / coverage 判定ロジック不変 / 新規 test は `*.spec.ts`。

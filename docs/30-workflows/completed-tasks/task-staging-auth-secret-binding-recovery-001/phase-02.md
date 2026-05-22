# Phase 2: 設計

[実装区分: 実装仕様書]

## 1. 設計方針

真因が「ランタイムでの secret 値欠落」である以上、対策は次の 4 層で構成する。

| 層 | 目的 | spec |
|----|------|------|
| 即時 recovery | staging / production の AUTH_SECRET を再投入し runtime green | spec-01 |
| 構造的検知 | middleware 500 を構造化ログ化 + boot 時 zod 検証で early-fail | spec-02 |
| CI 早期検知 | deploy 直後に auth-gate smoke を打ち、500 + `auth misconfigured` を fail として返す | spec-03 |
| 運用 guard | `cf.sh secret put` の empty-value 弾き + runbook 3 段チェック明文化 | spec-04 |

## 2. システム観点

### 2.1 因果ループ
- 強化ループ: secret 値欠落 → middleware 500 → admin endpoint 全滅 → smoke fail → deploy 後気付けず → 同事象繰り返し
- バランスループ（追加）: deploy 直後 auth-gate smoke で 500/`auth misconfigured` 検知 → CI fail → 再投入で復旧 → 強化ループ遮断

### 2.2 責務境界
- `require-admin.ts` middleware: 認証ガード + 「secret 欠落」観測（throw せず構造化ログ + 500）
- `env.ts` (zod): boot/lazy 初期化時の必須 secret 検証（empty string も reject）
- `cf.sh`: secret 投入時の empty-value 入口 guard
- `runtime-attendance-provider.sh`: 500 + 特定 body の semantic 検出
- `backend-ci.yml`: deploy → auth-gate smoke → 全 smoke の段階 gate

### 2.3 状態所有権
- AUTH_SECRET の **値の正本**は 1Password。Cloudflare Secrets は **runtime mirror**。
- 検証責任: middleware は runtime fallback 検知のみ、`env.ts` zod は boot-time fail-fast。

## 3. recovery 手順（spec-01）

1. user 明示承認後、`bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging` を実行（stdin に 1Password の値を流す）
2. `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` で再登録確認（値は表示されない）
3. `/admin/healthz`（auth 不要）と `/admin/members`（auth 必須）で挙動差を確認:
   ```
   curl -i $STAGING_API_BASE/admin/healthz                          # 200 期待
   curl -i -H "Authorization: Bearer $STAGING_ADMIN_BEARER" $STAGING_API_BASE/admin/members
   # 200 + {members:[...]} 期待（auth misconfigured が消えること）
   ```
4. production 側も同手順で verify（500 が出る場合は再投入）

[OPEN-QUESTION-05] `/admin/healthz` 相当の auth-free endpoint が存在するか要確認。存在しない場合は spec-03 で追加するか別 endpoint で代替するか決定。

## 4. 構造化ログ + zod 検証（spec-02）

### 4.1 middleware diff（`require-admin.ts:104-107`）
```ts
const secret = c.env.AUTH_SECRET;
if (!secret) {
  logError({
    code: "UBM-AUTH-SECRET-MISSING",
    env: c.env.ENVIRONMENT,
    hasAuthSecretBinding: typeof c.env.AUTH_SECRET !== "undefined",
    secretLength: typeof secret === "string" ? secret.length : -1,
  });
  return c.json({ error: "auth misconfigured" }, 500);
}
```

- `logError` は既存 PR #854 と同じ構造化ログ規約を踏襲（同 PR で既に導入されている `logger` ヘルパを再利用）
- 値そのものはログ出力禁止。length と type だけ出す

### 4.2 `apps/api/src/env.ts` の zod 検証追加
```ts
const ApiEnvZ = z.object({
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  // 既存項目はそのまま
});
```

- boot 時 throw → `apps/web/src/app/error.tsx` 相当の API 側 error boundary（Hono の `onError`）で 500 として観測
- 既存 env loader に同様パターンが存在する場合はそれに合わせる（OPEN-QUESTION-01）

## 5. CI gate（spec-03）

### 5.1 `backend-ci.yml` の deploy-staging 後段
```yaml
- name: auth-gate smoke
  run: |
    set -euo pipefail
    body=$(curl -s -o /dev/stderr -w "%{http_code}" -H "Authorization: Bearer ${STAGING_ADMIN_BEARER}" "${STAGING_API_BASE}/admin/members" 2>/tmp/body.txt)
    if grep -q "auth misconfigured" /tmp/body.txt; then
      echo "::error::auth-secret-binding-missing (auth misconfigured returned)"
      exit 1
    fi
```

### 5.2 `runtime-attendance-provider.sh` の分岐追加
- 500 body に `auth misconfigured` を見つけたら summary に `auth-secret-binding-missing` reason を出す
- fail 自体は維持しつつ、根本原因 hint を出力

## 6. `cf.sh` empty-secret guard（spec-04）

`scripts/cf.sh` の secret put サブコマンド:
- stdin で読んだ値の length が 0 なら abort（exit 78）
- file 経由でも同様

runbook（`docs/30-workflows/.../specs/spec-04-*.md`）で次の 3 段チェックを明文化:
1. `secret list` → name 登録確認
2. （実値表示はされないが）再投入後の挙動 verify
3. curl で auth gate 動作確認（500 + `auth misconfigured` が消えること）

## 7. Phase 2 DoD

- 4 spec の責務境界・I/O・diff 形式が確定
- recovery / 検知 / CI / wrapper の 4 層が因果ループ上で遮断点として機能することが明文化
- OPEN-QUESTION-01, -05 が Phase 4 以降の作業項目として残されている

# Phase 9: 品質保証

## 目的

実装サイクルの最終一括判定。typecheck / lint / 対象 vitest / PR pre-flight gate /
localhost 焼き込み gate / client bundle grep を**全て緑**にする。失敗は最大 3 回まで自動修復し、修復差分もコミット対象に含める（Phase 13 で user-gated）。

> cf 系 CLI（secret put / staging deploy / smoke 実走）は **user-gated** のため Phase 9 では実行しない。
> Phase 9 の判定対象は read-only / local で完結するものに限る。

## 一括判定コマンド

```bash
# 1. typecheck（全 workspace）
mise exec -- pnpm typecheck

# 2. lint（必要なら --fix を先に）
mise exec -- pnpm lint

# 3. 対象 vitest（明示指定・全件禁止）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/transport.spec.ts src/lib/fetch/authed.spec.ts \
  src/lib/fetch/public.spec.ts src/lib/__tests__/env.spec.ts \
  app/api/me/'[...path]'/route.route.spec.ts \
  app/api/auth/magic-link/route.route.spec.ts \
  app/api/auth/magic-link/verify/route.route.spec.ts \
  app/api/auth/callback/email/route.route.spec.ts
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts

# 4. PR pre-flight（phase12-compliance / gate-metadata / indexes drift）
bash scripts/verify-pr-ready.sh

# 5. localhost 焼き込み gate（src + bundle）
bash scripts/verify-no-localhost-bake.sh --src-only
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare \
  && bash scripts/verify-no-localhost-bake.sh --bundle-only

# 6. bash 構文チェック（Lane C 4 script）
for f in diagnose-auth-secret-parity cf-secret-put-auth-secret verify-no-localhost-bake smoke-staging-me; do
  bash -n "scripts/$f.sh"
done

# 7. cf-secret-put --check（dry-run・長さ検証のみ・投入なし）
printf '%s' "$SOME_32CHAR_VALUE" | bash scripts/cf-secret-put-auth-secret.sh --check
```

## 判定テーブル

| # | 項目 | コマンド | 合格基準 |
|---|------|---------|---------|
| Q1 | 型 | `pnpm typecheck` | exit 0（`getEnvironment` 等の新規 export 含め型整合） |
| Q2 | lint | `pnpm lint` | exit 0（HEX 直書きなし・style gate 緑） |
| Q3 | unit（Lane A/B） | 上記 vitest | 全 pass・既存 contract spec の 127.0.0.1→localhost 更新済 |
| Q4 | self-test（Lane C） | `verify-no-localhost-bake.spec.ts` | dirty exit1 / clean exit0 / allowlist exit0 全 pass |
| Q5 | PR pre-flight | `verify-pr-ready.sh` | phase12-compliance ok:true / gate-metadata ERROR 0 / indexes drift 0 |
| Q6 | 焼き込み gate（src） | `verify-no-localhost-bake.sh --src-only` | exit 0（allowlist 付き local 分岐以外に localhost なし） |
| Q7 | 焼き込み gate（bundle） | build → `--bundle-only` | exit 0（client bundle に `localhost:8787`/`127.0.0.1` 不在＝AC-4） |
| Q8 | bash 構文 | `bash -n`×4 | 全 exit 0 |
| Q9 | secret-put dry-run | `--check` | 長さ 32+ で exit 0・投入なし |

## client bundle grep（AC-4 の最終確認・FB-UI-02-1）

```bash
grep -rn "localhost:8787\|127.0.0.1:8787" \
  apps/web/.open-next/assets/*.js apps/web/.open-next/**/*.js 2>/dev/null
#   → 0 件
```

判定（FB-UI-02-1）: 「削除確認」は次のいずれかが PASS:
1. 旧 `DEFAULT_BASE_URL = "http://localhost:8787"`（無条件 fallback）が **git diff で削除**されている、または
2. client bundle / 非 local 経路から `localhost:8787` への **参照が 0**（grep 0 件）。

どちらかが満たされれば AC-4 合格（両方満たすのが理想）。

## 自動修復方針（最大 3 回）

| 失敗 | 修復 |
|------|------|
| typecheck | unused import / 型注釈漏れ / export-import 不整合を最小差分修正 |
| lint | `pnpm lint --fix` → 残違反のみ手修正 |
| vitest | 既存 contract spec の `127.0.0.1` 期待を `localhost` へ更新（task-a §4-4）。mock 不足を補う |
| 焼き込み gate | 未 annotate の local fallback に `// localhost-allow:local-fallback` 付与、または非 local 焼き込みを transport 分岐へ寄せる |
| verify-pr-ready | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1-5 順で切り分け |

## 完了判定

Q1〜Q9 + client bundle grep が全緑。user-gated（secret 実投入 / staging deploy / smoke 実走）は
Phase 13 で承認後に実施し、Phase 9 の DoD には含めない。

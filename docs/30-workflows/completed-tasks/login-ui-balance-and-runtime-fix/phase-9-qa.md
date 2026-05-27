# Phase 9 — QA

## 一括判定コマンド

```bash
set -e
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-no-process-env-internal-api.sh
mise exec -- pnpm --filter @repo/web exec vitest run \
  apps/web/app/api/auth/magic-link/route.route.spec.ts \
  apps/web/app/api/auth/magic-link/verify/route.route.spec.ts \
  apps/web/app/login/_components/__tests__/LoginPanel.component.spec.tsx \
  apps/web/app/login/_components/MagicLinkForm.component.spec.tsx
mise exec -- pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts
```

全 green を Gate-A の前提とする。

## チェックリスト

| 観点 | 判定 |
| ---- | ---- |
| typecheck | pending |
| lint | pending |
| targeted vitest | pending |
| playwright visual | runtime_pending（baseline 更新差分が AC-1/AC-2 範囲のみであることを後続確認） |
| grep gate | pending |
| `apps/web/src/lib/env.ts` schema | `INTERNAL_API_BASE_URL` 含む |
| `wrangler.toml` env vars | staging / production に `INTERNAL_API_BASE_URL` あり |
| line budget | 仕様書全体 ≤ 既存 workflow 平均 |
| mirror parity | aiworkflow-requirements / task-specification-creator へ same-wave sync |
| link 整合 | index.md と各 phase の相互リンク確認 |

## NG 時のフォールバック

| 症状 | 対応 |
| ---- | ---- |
| `pnpm typecheck` で `getAuthEnv` import 失敗 | `apps/web/src/lib/env.ts` の export と alias / 相対 path を確認 |
| visual baseline 差分が広域 | `auth.css` の変更が `auth-card` scope 外に漏れていないか確認 |
| grep gate exit 1 | `rg -n "process\.env" apps/web/{src,app}/` で残置箇所を特定 |
| `bash scripts/serve-prototype.sh` で 404 | `.jsx` MIME 補正の handler が `extensions_map` を正しく上書きしているか確認 |

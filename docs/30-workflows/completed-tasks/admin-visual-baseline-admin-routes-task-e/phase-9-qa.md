---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 9
phase_name: QA
created_at: 2026-05-27
---

# Phase 9: QA

[実装区分: 実装仕様書]

## 1. ローカル検証（macOS）

```bash
# Node 24 で実行
mise exec -- pnpm install

# spec list 検証 — 48 entry が list される（env-gated 8 は未設定時 skip 表示）
PLAYWRIGHT_SKIP_WEB_SERVER=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --list

# 1 project だけ dry-run（撮影分は commit しない）
PLAYWRIGHT_SKIP_WEB_SERVER=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --project=admin-staging-visual-desktop --reporter=line
```

期待値:
- list 出力: required 10 × 4 + env-gated 2 × 4 = **48 test entry**
- env-gated は `skipped`（未設定時）
- macOS 撮影 png は staging 撮影とは異なる → **commit 禁止**

---

## 2. CI 検証

- `admin-visual` matrix 4 viewport 全 green
- baseline png 数を script で集計:
  ```bash
  find apps/web/playwright/tests/visual/admin-shell -name '*-linux.png' | wc -l
  ```
  期待値: **40**（env-gated 無）または **48**（有）。**44 は不採用**。

- regression dry-run:
  1. `apps/web/src/styles/tokens.css` の `--color-surface` を一時改変
  2. CI で `admin-visual` job が fail することを確認
  3. revert

---

## 3. grep gate

```bash
git grep -n "tests/visual/admin-dashboard.spec.ts" -- apps/web .github/workflows
git grep -n "admin-dashboard.spec.ts-snapshots" -- apps/web
```

両方 **0 件** を要求。

---

## 4. CI / hook gate

| gate | コマンド | 期待 |
|---|---|---|
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green |
| PR ready | `mise exec -- bash scripts/verify-pr-ready.sh` | green |
| gate-metadata | `mise exec -- pnpm gate-metadata:validate` | ERROR:0 |
| phase12-compliance | `mise exec -- pnpm verify:phase12-compliance` | pass |
| indexes idempotent | `mise exec -- pnpm indexes:rebuild` → 再実行で md5 一致 | idempotent |
| test:suffix | lefthook `block-test-suffix` | 0 hit（`.test.ts` 新規無し） |
| design-tokens | CI `verify-design-tokens` | green |

---

## 5. 認可後 visual の整合確認

- `staging-visual-authenticated` setup project の storageState 経路が runtime-smoke-mint パターンと一致しているかを Phase 5 着手時に検証
- 認可失敗時の挙動（401 ページに飛ばない）を確認

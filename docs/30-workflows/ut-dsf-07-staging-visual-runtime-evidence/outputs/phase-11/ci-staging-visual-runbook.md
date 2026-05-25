# CI 経由 staging-visual 実行 runbook（ops cycle）

本タスクの code 部分（`staging-visual` Playwright project / 4 spec / `e2e:visual:staging` script / `playwright-smoke.yml` への staging-visual job 配線）は実装・local 検証済み。
本 runbook は、`op` 未ログイン環境では自律実行できない **staging deploy + baseline 生成 + gate 解除**（T-04〜T-07）を **CI と user-gated ops** で完遂する手順を定める。

> baseline 正本は **CI ubuntu-latest 生成の `-staging-visual-chromium-linux.png`**（phase-04 §4）。macOS local 生成 baseline はコミットしない。

---

## 前提

- `op` にログイン済み（`! op signin`）。`cf.sh` が `op run` で Cloudflare API token を注入できること。
- staging secrets が `bash scripts/cf.sh secret put` で投入済み（`.dev.vars.example` の `op://` 参照と drift なし）。

---

## ステップ

### 1. staging deploy（T-04 / G1）

```bash
WF=docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence
mkdir -p "$WF/outputs/phase-11/evidence"

# build 健全性を local で先に確認（next build --webpack / OpenNext 互換）
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$WF/outputs/phase-11/evidence/build.log"

# staging deploy（cf.sh 経由のみ・wrangler 直接実行禁止）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging 2>&1 \
  | tee "$WF/outputs/phase-11/evidence/staging-deploy.log"
# target: https://ubm-hyogo-web-staging.daishimanju.workers.dev
```

> `staging-deploy.log` に API Token / OAuth 値が混入していないことを確認（CLAUDE.md / phase-11 L-04）。

### 2. CI で baseline 初回生成（T-05 / G2）

deploy 完了後、GitHub Actions `playwright-smoke` を `workflow_dispatch` で起動し、staging URL を渡す。
**初回は `staging_visual_update_snapshots = true`** で baseline を生成する。

```bash
gh workflow run playwright-smoke.yml \
  -f staging_visual_base_url=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  -f staging_visual_update_snapshots=true
```

- `staging-visual (chromium, 4 screens)` job のみが走る（`if: workflow_dispatch && staging_visual_base_url != ''`）。
- job 完了後、artifact `staging-visual-baselines` に 4 枚の `*-staging-visual-chromium-linux.png` が含まれる。

```bash
# 最新 run の artifact を取得
gh run download --name staging-visual-baselines --dir /tmp/staging-visual-baselines
# 取得した PNG を spec の snapshots ディレクトリへ配置
mkdir -p apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts-snapshots
cp /tmp/staging-visual-baselines/.../public-top-staging-visual-chromium-linux.png \
   apps/web/playwright/tests/visual-staging/public-top.spec.ts-snapshots/
# login / profile / admin-dashboard も同様
```

### 3. 回帰確認（baseline コミット後）

baseline をコミットした後、`staging_visual_update_snapshots` を **false**（既定）で再 dispatch すると、
diff < 5%（`maxDiffPixelRatio: 0.05`）で pass することを確認する。

```bash
gh workflow run playwright-smoke.yml \
  -f staging_visual_base_url=https://ubm-hyogo-web-staging.daishimanju.workers.dev
```

### 4. evidence 配置（T-06）

CI 実行ログ / screenshot を `outputs/phase-11/` へ物理配置する（phase-11 ledger）。

```bash
WF=docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence
mkdir -p "$WF/outputs/phase-11/screenshots"
# baseline PNG を semantic 名で複製（phase-11 §2.2）
cp apps/web/playwright/tests/visual-staging/public-top.spec.ts-snapshots/public-top-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/public-top.png"
cp apps/web/playwright/tests/visual-staging/login.spec.ts-snapshots/login-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/login.png"
cp apps/web/playwright/tests/visual-staging/profile.spec.ts-snapshots/profile-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/profile.png"
cp apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts-snapshots/admin-dashboard-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/admin-dashboard.png"
```

local gate ログ（CI と等価）:

```bash
mise exec -- pnpm typecheck 2>&1 | tee "$WF/outputs/phase-11/evidence/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$WF/outputs/phase-11/evidence/lint.log"
bash scripts/verify-pr-ready.sh 2>&1 | tee "$WF/outputs/phase-11/evidence/verify-pr-ready.log"
mise exec -- pnpm verify:phase12-compliance 2>&1 | tee "$WF/outputs/phase-11/evidence/verify-phase12-compliance.log"
```

### 5. parent root workflow gate 解除（T-07 / G7）

**実 staging evidence（screenshot 4 枚 + deploy log + visual log）が揃ってから**、parent を更新する。

- `docs/30-workflows/ui-prototype-design-system-foundation/index.md`: `visualEvidence: VISUAL_RUNTIME_PENDING` → `VISUAL_RUNTIME_OK`
- `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json`: 同上 + `Gate-B` / `Gate-C` を `passed`（`passed_at` ISO 8601 / `evidence_path` を本 workflow `outputs/phase-11/` へ）

更新差分は `outputs/phase-11/root-gate-release.md`（M-04）に監査記録する。

> evidence が揃う前に gate を解除してはならない（phase-08 §4 / phase-12 §11）。

### 6. PR（user 明示承認後）

`gh pr create --base dev`（phase-13 §5）。commit / push / PR は user 明示承認後のみ。

---

## CI 配線サマリ（本タスクで実装済み）

| 要素 | 実装 |
|------|------|
| workflow_dispatch 入力 | `staging_visual_base_url`（staging URL）/ `staging_visual_update_snapshots`（baseline 生成 flag） |
| job | `staging-visual (chromium, 4 screens)`（`if: workflow_dispatch && staging_visual_base_url != ''`） |
| env | `PLAYWRIGHT_STAGING_BASE_URL` / `PLAYWRIGHT_SKIP_WEB_SERVER=1` / `PLAYWRIGHT_EVIDENCE_DIR`（本 workflow evidence へ） |
| baseline artifact | `staging-visual-baselines`（`*-staging-visual-chromium-linux.png` × 4） |
| diff artifact（失敗時） | `staging-visual-artifacts`（test-results） |

> 既存 workflow（`playwright-smoke.yml`）の拡張のみ。新規 workflow ファイルは作成していない（spec OUT）。
> staging-visual は手動 deploy 後の dispatch を前提とするため、PR 毎 required status check には含めない（ops gate 扱い / phase-07 §2）。

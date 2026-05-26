---
phase: 7
title: 品質ゲート — 最小 7 gate と required status check 候補
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. 最小 7 gate（Phase 1 §2 再掲）

| # | Gate | 種別 | CI workflow / local |
|---|------|-----|---------------------|
| G1 | staging deploy 成功（`cf.sh deploy --env staging`） | local / 手動 ops | `web-cd.yml`（既存）/ 手動 |
| G2 | staging visual 4 screens 取得（`staging-visual` project） | local / CI 任意 | `playwright-smoke.yml`（workflow_dispatch 拡張） |
| G3 | `pnpm typecheck` | CI 必須 | 既存 build pipeline |
| G4 | `pnpm lint` | CI 必須 | 既存 build pipeline |
| G5 | `pnpm --filter @ubm-hyogo/web build`（`next build --webpack`） | CI 必須 | 既存 build pipeline |
| G6 | `bash scripts/verify-pr-ready.sh` | local 必須・CI 相当 | `verify-phase12-compliance.yml` / `verify-gate-metadata.yml` / `verify-indexes.yml` |
| G7 | root `VISUAL_RUNTIME_OK` 解除 + Gate-B/C `passed` 整合 | local / レビュー | parent `index.md` / `artifacts.json` |

## 2. required status check 候補（dev / main branch protection）

CLAUDE.md の方針に従い、実 `gh api -X PUT` はユーザー明示承認後のみ実行。本タスクは **候補リスト確定** までを担う。

| context 名 | 出所 workflow | 想定 status |
|-----------|-------------|------------|
| `verify-design-tokens / verify-design-tokens` | `verify-design-tokens.yml` | required |
| `playwright-smoke / smoke (chromium)` | `playwright-smoke.yml` | required |
| `playwright-smoke / visual (chromium, 4 screens)` | `playwright-smoke.yml` | required（既存 local visual） |
| `verify-phase12-compliance / verify` | `verify-phase12-compliance.yml` | required |
| `verify-gate-metadata / verify` | `verify-gate-metadata.yml` | required |
| `verify-indexes-up-to-date / verify` | `verify-indexes.yml` | required |
| `verify-test-suffix / verify` | `verify-test-suffix.yml` | required（既存有効化済の可能性高） |

> staging-visual は手動 deploy 後の `workflow_dispatch` 実行を前提とするため、PR 毎の required status check には**含めない**（運用上 staging URL が常時 deploy 済とは限らないため）。staging visual は ops gate（G2）として扱う。

## 3. CI workflow の trigger path 確認

| workflow | 必要 path | 確認結果（spec 作成時） |
|---------|----------|----------------------|
| `playwright-smoke.yml` | `apps/web/playwright/tests/visual-staging/**` | 実装時に確認。`workflow_dispatch` の base_url 入力で staging URL を渡す |
| `verify-design-tokens.yml` | `apps/web/src/styles/{tokens,globals}.css` | 既存で十分（本タスクは src 不変） |
| `verify-phase12-compliance.yml` | `docs/30-workflows/**` | 既存で十分 |
| `verify-gate-metadata.yml` | `docs/30-workflows/**/artifacts.json` | 既存で十分 |
| `verify-indexes.yml` | `.claude/skills/aiworkflow-requirements/indexes/**` | 既存で十分 |

## 4. ローカル gate 実行順序

```bash
# 1. dependency install
mise exec -- pnpm install --frozen-lockfile

# 2. static gate
mise exec -- pnpm typecheck         # G3
mise exec -- pnpm lint               # G4

# 3. build gate
mise exec -- pnpm --filter @ubm-hyogo/web build   # G5

# 4. staging deploy（G1）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 5. staging visual gate（G2）
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging

# 6. pre-flight gate（G6）
bash scripts/verify-pr-ready.sh
```

## 5. gate 失敗時のリカバリ

| gate | 失敗パターン | 対応 |
|------|------------|-----|
| G1 | deploy fail（secrets 不足 / build エラー） | `.dev.vars.example` の op 参照 drift / build.log を確認。secrets は `cf.sh secret put` で投入 |
| G2 | snapshot diff | Phase 6 §6 フロー（design system 退行 vs SSR データ揺れの切り分け） |
| G3/G4/G5 | 型・lint・build エラー | 該当を最小修正。`apps/web/src` の退行は本タスク外として該当 PR にバックポート |
| G6 | `verify:phase12-compliance` fail | `outputs/phase-11/` evidence 不足を補完 / Phase 11 表との整合修正 |
| G6 | `gate-metadata:validate` fail | `artifacts.json` の zod schema 違反を修正 |
| G6 | `indexes:rebuild` drift | `mise exec -- pnpm indexes:rebuild` 実行し差分コミット |
| G7 | parent gate 整合不全 | `index.md` / `artifacts.json` の `VISUAL_RUNTIME_OK` + Gate-B/C `passed` + `evidence_path` を再確認 |

## 6. 不変条件 / governance 整合

- branch protection は CLAUDE.md「solo 運用ポリシー」継承（`required_pull_request_reviews=null`）。
- CODEOWNERS は `.github/workflows/**` / `apps/web/**` を governance path として扱う。workflow / playwright.config 編集時は `.github/CODEOWNERS` の owner を確認。
- `bypassPermissions` 設定下でも `--no-verify` は使わない（CLAUDE.md PR pre-flight 方針）。
- Cloudflare CLI は `scripts/cf.sh` 経由のみ。

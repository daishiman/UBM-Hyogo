---
phase: 7
title: 品質ゲート — required status check 候補と CI workflow 対応
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. 最小 6 gate（再掲）

| # | Gate | 種別 | CI workflow / local |
|---|------|-----|---------------------|
| G1 | Playwright visual 4 screens | CI 必須 | `playwright-smoke.yml` / `playwright-visual-full.yml` |
| G2 | verify-design-tokens（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件） | CI 必須 | `verify-design-tokens.yml` |
| G3 | `pnpm typecheck` | CI 必須 | 既存 build pipeline |
| G4 | `pnpm lint` | CI 必須 | 既存 build pipeline |
| G5 | `pnpm build`（`next build --webpack`） | CI 必須 | 既存 build pipeline |
| G6 | `bash scripts/verify-pr-ready.sh` | local 必須・CI 相当 | `verify-phase12-compliance.yml` / `verify-gate-metadata.yml` / `verify-indexes.yml` |

## 2. required status check 候補（dev / main branch protection）

CLAUDE.md の方針に従い、実 `gh api -X PUT` はユーザー明示承認後のみ実行する。本 SW は **候補リストの確定** までを担う。

| context 名 | 出所 workflow | 想定 status |
|-----------|-------------|------------|
| `verify-design-tokens / verify-design-tokens` | `verify-design-tokens.yml` | required |
| `playwright-smoke / smoke (chromium)` | `playwright-smoke.yml` | required |
| `playwright-smoke / visual (chromium, 4 screens)` | `playwright-smoke.yml` | required |
| `verify-phase12-compliance / verify` | `verify-phase12-compliance.yml` | required |
| `verify-gate-metadata / verify` | `verify-gate-metadata.yml` | required |
| `verify-indexes-up-to-date / verify` | `verify-indexes.yml` | required |
| `verify-test-suffix / verify` | `verify-test-suffix.yml` | required（既存有効化済の可能性高） |

## 3. CI workflow の trigger path 確認

| workflow | 必要 path | 確認結果（spec 作成時） |
|---------|----------|----------------------|
| `playwright-smoke.yml` | `apps/web/playwright/tests/visual/**` | 実装時に確認、不足時は Phase 5 §5.1 で追加 |
| `playwright-visual-full.yml` | `apps/web/playwright/tests/visual-full/**`（既存）と独立 | 本 SW から変更不要 |
| `verify-design-tokens.yml` | `apps/web/src/styles/{tokens,globals}.css` | 既存で十分 |
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
mise exec -- pnpm verify:tokens      # G2

# 3. build gate
mise exec -- pnpm --filter @ubm-hyogo/web build   # G5

# 4. visual gate（local 上は smoke のみ・baseline 更新は CI 経由）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual   # G1

# 5. pre-flight gate
bash scripts/verify-pr-ready.sh      # G6
```

## 5. gate 失敗時のリカバリ

| gate | 失敗パターン | 対応 |
|------|------------|-----|
| G1 | snapshot diff | Phase 6 §6 フロー |
| G2 | HEX / arbitrary value 検出 | serial-00..06 のコードを修正、本 SW では修正しない |
| G3/G4/G5 | 型・lint・build エラー | 該当 SW にバックポート |
| G6 | `verify:phase12-compliance` fail | `outputs/phase-11/` evidence 不足を補完 / Phase 11 表との整合修正 |
| G6 | `gate-metadata:validate` fail | `artifacts.json` の zod schema 違反を修正 |
| G6 | `indexes:rebuild` drift | `mise exec -- pnpm indexes:rebuild` 実行し差分コミット |

## 6. 不変条件 / governance 整合

- branch protection は CLAUDE.md「solo 運用ポリシー」を継承（`required_pull_request_reviews=null`）
- CODEOWNERS は `.github/workflows/**` を governance path として扱うため、workflow 編集時は `.github/CODEOWNERS` の owner を確認
- `bypassPermissions` 設定下でも `--no-verify` は使わない（CLAUDE.md PR pre-flight 方針）

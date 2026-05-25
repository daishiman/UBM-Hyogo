---
workflow_id: issue-874-login-staging-visual-smoke
workflow_state: implemented_local_runtime_pending
created_at: 2026-05-24
owner: daishiman
taskType: implementation
visualEvidence: VISUAL
implementation_mode: new
implementation_status: local_validation_ready_staging_pending
source_issue: https://github.com/daishiman/UBM-Hyogo/issues/874
source_followup_id: FU-LOGIN-003
parent_workflow: docs/30-workflows/completed-tasks/login-page-prototype-alignment/
---

# issue-874 / FU-LOGIN-003 `/login` Staging Visual Smoke (Cloudflare dev) Evidence Capture

**[実装区分: 実装仕様書]**

## 目的

`/login` ページに対する Playwright visual smoke を **Cloudflare Workers `dev` (staging) 環境** に向けて実行し、7 state（`input` / `sent` / `unregistered` / `rules_declined` / `deleted` / `error` / `input-mobile`）の staging evidence PNG を `outputs/phase-11/staging-screenshots/` に取得する。あわせて `apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` を `PLAYWRIGHT_EVIDENCE_DIR` 環境変数で上書き可能にし、local baseline と staging evidence の保存先を分離する。実行用ヘルパー `scripts/run-login-staging-smoke.sh` を新規追加する。

## 背景

親 workflow `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` の Phase 12 unassigned-task-detection で **FU-LOGIN-003: staging visual smoke 実行 + staging evidence 取得** が独立フォローアップとして検出された。local visual evidence 8 PNG は親 workflow で取得済みだが、staging evidence は未取得。Cloudflare Workers `dev` 環境の URL を `PLAYWRIGHT_STAGING_BASE_URL` に与えて smoke を回し、staging-specific evidence を本 workflow 配下に固定する必要がある。

現状の `apps/web/playwright/tests/login-smoke.spec.ts` は `EVIDENCE_DIR` を親 workflow path にハードコードしており、staging evidence を別 path に保存できない。`playwright.config.ts` は既に `staging` project と `PLAYWRIGHT_EVIDENCE_DIR` を読む global rule を持つため、spec 側の hardcoded path だけが gap である。

## 実装サマリ

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/` |
| 状態 | `implemented_local_runtime_pending` |
| 実装対象 | `apps/web/playwright/tests/login-smoke.spec.ts`（`EVIDENCE_DIR` の env-override 化のみ）、`scripts/run-login-staging-smoke.sh`（新規追加）、`outputs/phase-11/staging-screenshots/*.png`（staging 実行で生成）、親 workflow 側 unassigned-task spec / detection.md の consumed 反映 |
| 正本 source | `apps/web/playwright.config.ts`（staging project 既存）、`docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` |
| 主要変更 | spec env-override 1 行差分 + 新規 shell helper（staging 対象 7 screenshot test のみ grep 実行）+ staging evidence 7 PNG + consumed trace |
| API / auth boundary | 既存 `signInWithEmail` flow のみ。`apps/api/**` 差分なし |
| runtime boundary | local 実装と検証は本サイクルで実施。`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` と `pnpm exec playwright test --project=staging` の実行は user-gated |

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | runtime_pending |
| 2 | `outputs/phase-2/phase-2.md` | runtime_pending |
| 3 | `outputs/phase-3/phase-3.md` | runtime_pending |
| 4 | `outputs/phase-4/phase-4.md` | runtime_pending |
| 5 | `outputs/phase-5/phase-5.md` | runtime_pending |
| 6 | `outputs/phase-6/phase-6.md` | runtime_pending |
| 7 | `outputs/phase-7/phase-7.md` | runtime_pending |
| 8 | `outputs/phase-8/phase-8.md` | runtime_pending |
| 9 | `outputs/phase-9/phase-9.md` | runtime_pending |
| 10 | `outputs/phase-10/phase-10.md` | pending |
| 11 | `outputs/phase-11/phase-11.md` | spec ready / staging evidence pending |
| 12 | `outputs/phase-12/main.md` | runtime_pending |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 受入条件 (AC)

- AC-1: staging URL に対し `login-smoke.spec.ts --project=staging --grep 'renders LoginCard|captures mobile input' --reporter=line` が 0 fail / 0 flaky / 7 passed で完走
- AC-2: staging evidence 7 PNG が `outputs/phase-11/staging-screenshots/` に保存、各 non-empty かつ ≤ 500KB
- AC-3: local baseline との目視 diff で構造的回帰なし
- AC-4: `login-smoke.spec.ts` の `EVIDENCE_DIR` が `PLAYWRIGHT_EVIDENCE_DIR` で env-override 可能、local 既定値は従来通り
- AC-5: unassigned-task spec の FU-LOGIN-003 が `consumed`、completed-tasks 側 detection.md も同期
- AC-6: staging deploy は `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 経由・user 承認後の記録あり
- AC-7: production smoke は本 task に含めない（別 followup 化を明記）

## 4 条件 verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | spec env-override は local 既定値を維持し既存 local baseline 互換を保つ |
| 漏れなし | PASS | spec 改修 / shell helper / staging evidence / consumed trace すべてスコープ化 |
| 整合性あり | PASS | `implemented_local_runtime_pending` / `VISUAL` / `new` の状態語彙で統一。`playwright.config.ts` の staging project / `PLAYWRIGHT_EVIDENCE_DIR` global rule と整合 |
| 依存関係整合 | PASS | API / D1 / auth handler 不変。staging deploy + smoke + PR は Phase 11 / 13 で user-gated |

## 関連

- 親 workflow: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/`
- 元 unassigned spec: `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md`
- 兄弟 followup: FU-LOGIN-001 (`docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/`)

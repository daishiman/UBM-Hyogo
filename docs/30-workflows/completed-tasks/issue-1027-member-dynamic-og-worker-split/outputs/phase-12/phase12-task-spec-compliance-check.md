# Phase 12 Task Spec Compliance Check — issue-1027-member-dynamic-og-worker-split

> Phase 12 close-out の canonical 証跡。`scripts/verify-phase12-compliance.ts` がこのファイルの見出し集合を canonical として検証する。

## 1. Summary verdict

- 結論: #1027「member 動的 OG」を **OG 専用 Worker 分離（Free 維持）** アーキでローカル実装・検証済み。実装区分 = `implementation`。
- artifacts status: `implemented_local_runtime_pending`（staging deploy / staging runtime PNG capture は user-gated）。
- 対象 issue / PR: Issue #1027（**実態 CLOSED** — 仕様書作成時点では OPEN だったが close-out 時点で CLOSED を確認。reopen は user-gated のため実施せず、CLOSED 維持）/ PR は未作成（Phase 13 blocked / user-gated）。

## 2. Changed-files classification

| 区分 | パス | 備考 |
|------|------|------|
| code | `apps/og/**`, `apps/web/**`, `.github/workflows/og-cd.yml`, `pnpm-lock.yaml` | OG Worker / web metadata integration / CI / dependency lock |
| spec/doc | `docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split/**` | index + artifacts×2 + phase-1〜13 + outputs phase-1〜12 |
| skill | `.claude/skills/aiworkflow-requirements/**` | quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS 同一 wave 同期 |

## 3. `workflow_state` and phase status consistency

- `artifacts.json` status: `implemented_local_runtime_pending`（phase-1〜12 completed / phase-13 blocked）。
- `index.md` phase 表: 同上で一致。
- 不一致の有無: なし（`artifacts.json` と `outputs/artifacts.json` は parity 一致）。

## 4. Phase 11 evidence file inventory

VISUAL_ON_EXECUTION。ローカル unit / build / size gate と local PNG capture は present。staging SNS preview は deploy 後 user-gated。

| Classification | Path | Status |
| --- | --- | --- |
| local evidence (og typecheck/test) | outputs/phase-11/og-local-verification.log | present |
| local evidence (build + size gate) | outputs/phase-11/og-local-verification.log | present |
| local screenshot | outputs/phase-11/screenshots/member-og-image-named.png | present |
| local screenshot | outputs/phase-11/screenshots/member-og-image-default.png | present |
| staging SNS preview | outputs/phase-13/staging-og-preview.md | pending |
| manual test result | outputs/phase-11/manual-test-result.md | present |

## 5. Phase 12 strict 7 file inventory

| # | ファイル | 有無 |
|---|---------|------|
| 1 | implementation-guide.md | ✅ |
| 2 | system-spec-update-summary.md | ✅ |
| 3 | documentation-changelog.md | ✅ |
| 4 | unassigned-task-detection.md | ✅ |
| 5 | skill-feedback-report.md | ✅ |
| 6 | phase12-task-spec-compliance-check.md | ✅（本ファイル） |
| 7 | main.md | ✅ |

## 6. Skill/reference/system spec same-wave sync

- 更新ファイル: `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`, `.claude/skills/aiworkflow-requirements/references/workflow-issue-1027-member-dynamic-og-worker-split-artifact-inventory.md`, `.claude/skills/aiworkflow-requirements/changelog/20260531-issue1027-member-dynamic-og-worker-split.md`, `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`。
- 正本反映: `OG_IMAGE_BASE_URL` / `apps/og` Worker 契約 / Free 3MiB independent worker budget を same-wave sync。

## 7. Runtime or user-gated boundary

- runtime pending: OG worker deploy / staging での OG 画像取得 / Phase 11 screenshot 取得。
- user-gated 操作: Cloudflare deploy、commit、push、PR 作成、Issue #1027 状態変更。

## 8. Archive/delete stale-reference gate

- stale 参照確認: 元 unassigned task は consumed 化し、`web-worker-size-limit-fix` follow-up から本 workflow へ接続。
- archive/delete 対象: なし。

## 9. Four-condition verdict

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | ✅ | SNS シェア時の member 個別 OG を Free 維持のまま復活 |
| 実現性 | ✅ | `apps/og`（Hono + workers-og）+ web 統合 + CI を 1 実装サイクルで完了可能（CONST_007） |
| 整合性 | ✅ | D1 直アクセス禁止 / env アクセサ経由 / 既存 API surface のみ / 回帰ガード維持と矛盾なし |
| 運用性 | ✅ | OG worker 専用 size gate を CI に組み込み再肥大を検知。各 worker 独立 3MiB 予算 |

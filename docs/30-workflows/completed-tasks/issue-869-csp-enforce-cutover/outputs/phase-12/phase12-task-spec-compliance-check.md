# Phase 12 Task Spec Compliance Check

## 1. Summary verdict

`implemented_local_evidence_captured (2026-05-24)`.

issue #869 [AWSHH-FU-001] CSP report-only → enforce 切替を `spec-from-closed-issue` / `implementation` / `NON_VISUAL` として仕様書化し、同一 cycle でローカル実装と証跡取得まで完了した。`getSecurityHeaderEnv()` + `CSP_MODE` zod enum を `apps/web/src/lib/env.ts` に追加し、`apps/web/middleware.ts` の `buildSecurityHeaderConfig()` を env 経由配線へ変更し、`apps/web/wrangler.toml` 各環境に `CSP_MODE` vars を設定済み。lib 層（`security-headers.ts` の `SecurityHeaderMode` 型 + header 名切替）は完了済みのため変更しない。GitHub issue #869 は CLOSED 状態を維持し reopen しない。commit・push・PR・staging/production deploy・production enforce 実切替はユーザー明示承認後に実施する。

## 2. Changed-files classification

| Path | Classification | Status |
| --- | --- | --- |
| `apps/web/src/lib/env.ts` | implementation（`CSP_MODE` schema + `getSecurityHeaderEnv()` accessor） | implemented |
| `apps/web/middleware.ts` | implementation（`buildSecurityHeaderConfig()` env-driven 配線） | implemented |
| `apps/web/wrangler.toml` | config（`[vars]`/`[env.staging.vars]`/`[env.production.vars]` の `CSP_MODE`） | implemented |
| `apps/web/src/lib/env.spec.ts` | unit test（TC-01〜04） | implemented / PASS |
| `apps/web/playwright/tests/security-headers.spec.ts` | HTTP response smoke（TC-07/08 mode 追従） | implemented / PASS |
| `apps/web/src/lib/security-headers.ts` | implementation (SSOT) | 実装済み・変更禁止 |
| `apps/web/src/lib/security-headers.spec.ts` | enforce 回帰ガード | 実装済み・変更禁止 |
| `docs/30-workflows/issue-869-csp-enforce-cutover/**` | workflow spec / evidence | implemented_local_evidence_captured（present） |

## 3. `workflow_state` and phase status consistency

| Item | Value | Status |
| --- | --- | --- |
| `artifacts.json.status` | `implemented_local_evidence_captured` | PASS |
| `artifacts.json.metadata.workflow_state` | `implemented_local_evidence_captured` | PASS |
| `artifacts.json.metadata.taskType` | `implementation` | PASS |
| `artifacts.json.metadata.visualEvidence` | `NON_VISUAL` | PASS |
| `artifacts.json.metadata.implementation_mode` | `new` | PASS |
| `artifacts.json.metadata.issue_status` | `CLOSED` | PASS |
| `artifacts.json.metadata.spec_created` | `true` | PASS |
| Phase 1-10 | completed with artifact pointer | PASS |
| Phase 11 | completed（NON_VISUAL）manual-test-result.md | PASS |
| Phase 12 | canonical 6 outputs present | PASS |
| Phase 13 | `blocked` pending user approval | runtime_pending（user-gated PR） |

`status` / `workflow_state` は `implemented_local_evidence_captured` へ更新済み。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | `outputs/phase-11/manual-test-result.md` | present |
| TC-07/08 証跡（Playwright report-only） | outputs/phase-11/evidence/playwright-report/results.json | present |
| TC-07/08 証跡（Playwright enforce） | outputs/phase-11/evidence-enforce/playwright-report/results.json | present |
| TC-07/08 monocart report (report-only) | outputs/phase-11/evidence/monocart/index.html | present |
| TC-07/08 monocart report (enforce) | outputs/phase-11/evidence-enforce/monocart/index.html | present |
| screenshot | n/a（NON_VISUAL） | n/a |

## 5. Phase 12 strict 7 file inventory

| Output | Status |
| --- | --- |
| `implementation-guide.md` | present |
| `system-spec-update-summary.md` | present |
| `documentation-changelog.md` | present |
| `unassigned-task-detection.md` | present |
| `skill-feedback-report.md` | present |
| `phase12-task-spec-compliance-check.md` | present（本ファイル） |

> 本タスクは `main.md` を持たず、Phase 12 canonical outputs は 6 ファイル構成（インストラクション指定と一致）。`outputs/artifacts.json` は workflow root `artifacts.json` の mirror として root/output parity を PASS とする。

### 5.1 Task 12-1〜12-6 / Step 1-A〜1-C / Step 2 root evidence（補足）

| Task / Step | 成果物・内容 | 状態 |
|------|--------|------|
| Task 12-1 | `implementation-guide.md`（Part 1 例え話 + Part 2 型/シグネチャ/runbook） | PASS |
| Task 12-2 | `system-spec-update-summary.md`（Step 1-A/1-B/1-C/Step 2） | PASS |
| Task 12-3 | `documentation-changelog.md`（workflow-local / global sync 分離） | PASS |
| Task 12-4 | `unassigned-task-detection.md`（0 件 + 関連 issue 差分確認） | PASS |
| Task 12-5 | `skill-feedback-report.md`（改善知見） | PASS |
| Task 12-6 | `phase12-task-spec-compliance-check.md`（本ファイル） | PASS |
| Step 1-A | spec-from-closed-issue / CLOSED 維持の方針明記 | PASS |
| Step 1-B | 実装状況テーブル（implemented_local_evidence_captured） | PASS |
| Step 1-C | 関連タスクテーブル（#868/871/870） | PASS |
| Step 2 | 新規 IF（`getSecurityHeaderEnv` / `CSP_MODE`）→ aiworkflow 反映方針 | PASS |

### 5.2 識別子一致確認

| 識別子 | 使用箇所 | 設計 SSOT 一致 |
|-------|--------|----------------|
| `getSecurityHeaderEnv()` | `implementation-guide.md` Part 2 シグネチャ | 一致 |
| `CSP_MODE` | wrangler.toml vars / EnvSchema / accessor 戻り値 | 一致 |
| `SecurityHeaderMode` | `"report-only" \| "enforce"`（変更禁止 lib 型） | `security-headers.ts` 実装済み型と一致 |
| `buildSecurityHeaderConfig()` | middleware 配線箇所 | 一致 |
| `applySecurityHeaders()` | middleware 適用関数（変更禁止） | 一致 |
| `NEXT_PUBLIC_API_BASE_URL` | `getSecurityHeaderEnv()` の `apiBaseUrl` ソース | env.ts canonical と一致 |

## 6. Skill/reference/system spec same-wave sync

| 対象 | 状態 | 備考 |
| --- | --- | --- |
| aiworkflow `security-web-response-headers.md` | completed | `CSP_MODE` + `getSecurityHeaderEnv` 追記済み |
| aiworkflow `quick-reference.md` | completed | issue-869 workflow エントリ追加済み |
| aiworkflow `resource-map.md` | completed | workflow inventory 行追加済み |
| aiworkflow artifact inventory | completed | issue-869 専用 inventory 追加済み |
| `SKILL.md` / `SKILL-changelog.md` | completed | 新規インターフェースと closeout rule を登録済み |
| Skill feedback routing | completed | `outputs/phase-12/skill-feedback-report.md` と skill reference へ反映済み |

同波 sync は実装完了と同じ cycle で実施済み。

## 7. Runtime or user-gated boundary

| 境界 | 状態 | 理由 |
| --- | --- | --- |
| ローカル実装（env.ts / middleware.ts / wrangler.toml） | completed | 実コード・実設定へ反映済み |
| Vitest（TC-01〜04 / TC-05/06 + 回帰） | PASS | `mise exec -- pnpm --filter @ubm-hyogo/web test -- env.spec security-headers.spec middleware.spec` |
| Playwright（TC-07/08 enforce + report-only） | PASS | `security-headers.spec.ts --project=desktop-chromium` を両 mode で実行 |
| Typecheck / Lint / Build | PASS | build は既存 env 必須契約に従い local env を明示して実行 |
| Grep guard（`127.0.0.1:8888` 焼き込み 0 維持） | PASS | task-18 gate |
| staging 応答確認（curl） | runtime_pending（user-gated） | 外部 runtime 境界 |
| production 応答確認（curl） | runtime_pending（user-gated） | 外部 runtime 境界 |
| production enforce 実切替（ops runbook config 変更 + redeploy） | runtime_pending（user-gated） | observation 後にユーザーが判断 |
| commit / push / PR | runtime_pending（user-gated） | 明示承認必須 |

## 8. Archive/delete stale-reference gate

workflow root の削除・移動なし。本タスクは新規 workflow dir（`docs/30-workflows/issue-869-csp-enforce-cutover/`）の新規作成のみで、既存ファイルの削除・リネームを伴わないため stale reference はゼロ。lib SSOT（`security-headers.ts`）は変更禁止のため既存参照は不変。関連 follow-up（#868 Reporting-Endpoints / #871 nonce / #870 apps/api header hardening）は別 issue・別 surface のため本仕様書では参照のみ（重複起票なし、`unassigned-task-detection.md` で差分確認済み）。issue #869 は CLOSED 維持・reopen しないため GitHub state の drift なし。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS（spec 設計レベル） | 識別子（`getSecurityHeaderEnv` / `CSP_MODE` / `SecurityHeaderMode`）が実装済み SSOT と一致。middleware ハードコード廃止の before/after を明記 |
| 漏れなし | PASS（spec 設計レベル） | canonical 6 outputs・Phase 11 evidence inventory・未タスク 0 件確認・関連 issue 差分確認・production runbook・skill feedback が揃う |
| 整合性あり | PASS | `system-spec-update-summary.md` と `documentation-changelog.md` が同一語彙（`implemented_local_evidence_captured` / `getSecurityHeaderEnv` / `CSP_MODE`）を共有。root / outputs artifacts.json が parity |
| 依存関係整合 | PASS（spec 設計レベル） | #868 soft 依存（非ブロッカー・enforce は reporting endpoint 無しで機能）/ #871 独立 / #870 独立 surface を明示。lib SSOT 変更禁止を宣言。env.ts → security-headers.ts の非循環依存を維持 |

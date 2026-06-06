# Phase 12 Task Spec Compliance Check — staging-api-url-and-session-recovery

このファイルは canonical heading SSOT（`references/phase12-compliance-check-template.md` の Required Sections 1..9）に逐語整合する。

## 1. Summary verdict

判定: **PASS（implemented_local_evidence_captured / runtime is user-gated）**。

ステージングの「localhost アドレス」「セッション取得失敗」2 症状を根本原因（同一 account workers.dev への web→api loopback 404 / `PUBLIC_API_BASE_URL` 非 inline による localhost fallback / `AUTH_SECRET` parity 未保証）まで遡り、3 レーン（A: service-binding 統一 / B: client localhost 根絶 / C: secret parity + grep gate + smoke）を同一サイクルで実装した。focused Vitest 94 PASS、typecheck PASS、localhost-bake source gate PASS。commit・PR・`cf.sh secret put`・staging deploy・smoke 実走は user-gated。

## 2. Changed-files classification

| 分類 | パス | 種別 |
| --- | --- | --- |
| workflow spec | `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/index.md` | new (untracked) |
| design docs | `outputs/phase-1..3/phase-*.md` | new |
| lane specs | `tasks/task-a..c-*.md` | new |
| phase outputs | `outputs/phase-4..13/phase-*.md` | new |
| phase 11 evidence | `outputs/phase-11/manual-test-result.md` | new |
| phase 12 strict 7 | `outputs/phase-12/*.md` | new |
| metadata | `artifacts.json`, `outputs/artifacts.json` | new |
| implementation | `apps/web/src/lib/fetch/transport.ts`, `apps/web/src/lib/fetch/{authed,public}.ts`, `apps/web/src/lib/env.ts`, `apps/web/app/api/{me,admin,auth}/**`, `apps/web/src/lib/auth/verify-magic-link.ts` | edited/new |
| operation gate | `scripts/verify-no-localhost-bake.sh`, `scripts/diagnose-auth-secret-parity.sh`, `scripts/cf-secret-put-auth-secret.sh`, `scripts/smoke-staging-me.sh`, `.github/workflows/verify-no-localhost-bake.yml` | new |

実装対象コード（`apps/web/**`, `scripts/**`, `.github/workflows/**`）は本 wave で実コード・scripts・CI gate まで実装済み。

## 3. `workflow_state` and phase status consistency

- `artifacts.json.status` = `implemented_local_evidence_captured`、`metadata.workflow_state` = `implemented_local_evidence_captured`、`implementation_status` = `implemented_local`。
- `index.md` Phase 表: Phase 1-12 = completed、Phase 13 = blocked（user-gated）。
- root `artifacts.json` と `outputs/artifacts.json` は byte parity（同一内容コピー）。
- Gate-A = passed（spec_review）、Gate-B = passed（local implementation evidence）、Gate-C = pending（runtime / PR user gate）。
- local implementation complete を主張し、external mutation/runtime/PR は user-gated と分離している。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| phase 11 spec | outputs/phase-11/phase-11.md | present |
| main | outputs/phase-11/main.md | present |
| manual smoke log | outputs/phase-11/manual-smoke-log.md | present |
| link checklist | outputs/phase-11/link-checklist.md | present |
| canonical paths | outputs/phase-11/canonical-paths.json | present |
| screenshot | outputs/phase-11/screenshots | n/a |

NON_VISUAL のため screenshot は n/a。runtime（staging smoke）証跡は user-gated のため本 wave では未取得。

## 5. Phase 12 strict 7 file inventory

| # | File | Status | 備考 |
| --- | --- | --- | --- |
| 1 | outputs/phase-12/main.md | present | Phase 12 サマリ |
| 2 | outputs/phase-12/implementation-guide.md | present | Part 1（例え話・本文 3 行以上）+ Part 2（型/契約）+ 視覚証跡 NON_VISUAL |
| 3 | outputs/phase-12/system-spec-update-summary.md | present | Step 1-A/1-B/1-C/Step 2 個別記録 |
| 4 | outputs/phase-12/documentation-changelog.md | present | 全 Step 結果 |
| 5 | outputs/phase-12/unassigned-task-detection.md | present | current 0 / baseline 2 |
| 6 | outputs/phase-12/skill-feedback-report.md | present | 改善候補 3 件 |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | present | 本ファイル |

`implementation-guide.md` は Part 1/Part 2 とも見出しのみではなく本文を持つ（heading-only reject 非該当）。

## 6. Skill/reference/system spec same-wave sync

- 本タスクは UBM-Hyogo プロダクトの workflow であり、`task-specification-creator` skill template の正本仕様変更は伴わない。
- `aiworkflow-requirements` は same-wave sync 済み: `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` / `references/workflow-staging-api-url-and-session-recovery-artifact-inventory.md`。
- system spec（`docs/00-getting-started-manual/specs/`）への新規 interface 追加判定: `transport.ts`（`ApiTransportEnv` / `resolveApiFetch`）と `getEnvironment` は `apps/web` 内部 helper のため正本 spec 更新は N/A（`system-spec-update-summary.md` Step 2 に記録）。
- 関連先行 `task-05a-fetchpublic-service-binding-001` の取りこぼし完結である旨を index.md / phase-1 に記録（same-wave で参照整合）。

## 7. Runtime or user-gated boundary

| 区分 | 項目 |
| --- | --- |
| 本 wave で完了 | Phase 1-12 仕様書・artifacts parity・compliance check・local code implementation・focused Vitest・typecheck・localhost-bake source gate・aiworkflow index sync |
| user-gated（実走承認後） | commit、push、PR（base=dev）、`cf.sh secret put`（AUTH_SECRET 投入）、staging deploy、`smoke-staging-me.sh` |

`actual_mutation_evidence_files` は本 wave で空（Cloudflare mutation 未実行）。root は `implemented_local_evidence_captured` であり、runtime mutation と混同していない。

## 8. Archive/delete stale-reference gate

- 本 workflow は新規 root の追加のみ。既存 root の削除・移動は無し。
- stale reference 検査: `staging-api-url-and-session-recovery` は workflow 本体と aiworkflow index / inventory に登録済み。既存 root の削除・移動はない。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | state=implemented_local_evidence_captured、Gate-B local PASS、Gate-C runtime/user mutation pending が分離。 |
| 漏れなし | PASS | strict 7 + 3 lane spec（CONST_005 6 項目）+ Phase 11 canonical paths + aiworkflow sync が揃う。 |
| 整合性あり | PASS | 用語・パス・artifacts metadata・gate schema（status/passed_at/evidence_path）一致。root と outputs の artifacts parity。 |
| 依存関係整合 | PASS | Lane B が Lane A の `getEnvironment` に依存する点を明記。先行 task-05a の完結。aiworkflow index / active workflow / inventory 同期済み。 |

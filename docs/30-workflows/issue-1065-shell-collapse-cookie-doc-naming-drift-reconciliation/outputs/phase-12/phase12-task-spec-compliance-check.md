# Phase 12 Task Spec Compliance Check — issue-1065

- task_id: issue-1065-shell-collapse-cookie-doc-naming-drift-reconciliation
- workflow: `docs/30-workflows/issue-1065-shell-collapse-cookie-doc-naming-drift-reconciliation/`
- 区分: 実装仕様書（NON_VISUAL / implementation_mode: new）
- workflow_state: `implemented_local_evidence_captured`（実装 landed local・uncommitted / commit・PR は user-gated）
- issue: #1065（CLOSED・2026-06-02T21:40:20Z・reopen しない）
- source unassigned-task（対象未タスク）: `docs/30-workflows/unassigned-task/issue-1024-followup-002-shell-collapse-cookie-doc-naming-drift-reconciliation.md`
- 総合判定: **PASS（implemented_local_evidence_captured 段階の判定）**

## 1. Summary verdict

本 workflow は実装が working tree に landed（uncommitted）した `implemented_local_evidence_captured` 段階の実装仕様書として、Phase 1-12 の成果物と Phase 13 計画、parity 済み artifacts.json を備える。canonical 9 見出しを逐語で満たし、Phase 11 evidence inventory・strict 7 inventory ともに present で揃う。実装証跡（dead alias 3 行削除 / issue-1024 design doc primary 名整合 / typecheck green / focused Vitest 4 pass / apps/web/src dead alias 参照 0）取得済み。commit / push / PR / completed-tasks への physical move は user-gated。矛盾・漏れ・不整合・依存関係不整合いずれも検出されず、**PASS（implemented_local_evidence_captured）**。

## 2. Changed-files classification

| 分類 | パス | 状態 |
| --- | --- | --- |
| spec backbone | `phase-1-requirements.md` … `phase-10-final-review.md` | present（spec 成果物） |
| spec PR plan | `phase-13-pr.md` | present（PR は user-gated） |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md` | present |
| Phase 12 strict 7 | `outputs/phase-12/*.md`（本ファイル含む） | present |
| artifacts parity | `artifacts.json` / `outputs/artifacts.json` | present（`implemented_local_evidence_captured` で parity） |
| 実装対象（**変更済み・landed local**） | `apps/web/src/components/shell/shell-collapse-cookie.ts` | dead alias 3 行削除済み（diff = alias 削除のみ・cookie 名/value/属性 不変） |
| doc 整合対象（**変更済み・landed local**） | issue-1024 配下 design doc（primary 名へ整合） | 旧名 token を primary 名へ置換済み（残る旧名は「削除済みを説明する枠組み」のみ） |

実装差分は `apps/web/src/components/shell/shell-collapse-cookie.ts`（alias 削除のみ）+ issue-1024 design doc に限定。`apps/api` への混入なし。commit/PR は user-gated。

## 3. `workflow_state` and phase status consistency

| 項目 | 値 | 整合 |
| --- | --- | --- |
| `metadata.workflow_state` | `implemented_local_evidence_captured` | PASS |
| `metadata.implementation_status` | `implemented_local_evidence_captured` | PASS |
| phase-1〜12 | completed | PASS |
| phase-13 | blocked（commit/PR が user-gated） | PASS |
| Gate-A / Gate-B | passed（passed_at あり） | PASS |
| Gate-C（commit / PR 実行） | pending（passed_at: null・commit/PR 未実施） | PASS |

`implemented_local_evidence_captured` は「実装は landed local だが commit/PR は未実施」を表す。Gate-C を pending（passed_at:null）に保つことで、landed local と commit 済みを混同しない（gate-metadata zod refine: passed_at は status=passed 時のみ非 null）。drift なし。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |

> NON_VISUAL のため screenshot 行は作成しない。manual-test-result.md は Lane B が物理生成するため present。

## 5. Phase 12 strict 7 file inventory

| # | Classification | Path | Status |
| --- | --- | --- | --- |
| 1 | implementation-guide | outputs/phase-12/implementation-guide.md | present |
| 2 | system-spec-update-summary | outputs/phase-12/system-spec-update-summary.md | present |
| 3 | documentation-changelog | outputs/phase-12/documentation-changelog.md | present |
| 4 | unassigned-task-detection | outputs/phase-12/unassigned-task-detection.md | present |
| 5 | skill-feedback-report | outputs/phase-12/skill-feedback-report.md | present |
| 6 | phase12-task-spec-compliance-check | outputs/phase-12/phase12-task-spec-compliance-check.md | present |
| 7 | manual test result（Phase 11 分） | outputs/phase-11/manual-test-result.md | present |

### implementation-guide.md Part 別本文量（heading-only reject 対策）

| Part | lines（本文非空行・概算） | key_sections_present |
| --- | --- | --- |
| Part 1 | ≥ 20 | 背景 / 要約 / 実装ステップ / 既知制限（4 項目） |
| Part 2 | ≥ 40 | 背景 / 要約 / 実装ステップ / 検証コマンド / 既知制限（5 項目） |

各 Part とも本文 3 行以上かつ必須 key section 2 項目以上を満たす（heading-only reject に該当しない）。SSOT 正本 API 対応表（5 概念）・issue 前提誤り訂正注記・視覚証跡セクションを含む。

## 6. Skill/reference/system spec same-wave sync

| 対象 | 状態 | 判定 |
| --- | --- | --- |
| aiworkflow-requirements（IPC/API 仕様） | 更新不要（N/A・内部 helper・公開境界でない・references 非編集で drift なし） | PASS（N/A 確定） |
| task-specification-creator SKILL-changelog / SKILL.md | **追記済**（`v2026.06.03-issue1065-...`） | PASS |
| task-specification-creator references | **promotion 済**（`phase-template-phase1.md` issue 前提検証 gate / `phase12-skill-feedback-promotion.md` Applied Examples / `patterns-lessons-and-pitfalls.md` L-I1065-001/002 / `resource-map.md`） | PASS |
| design-tokens / API schema | N/A（色 / apps/api 非関与） | PASS（N/A） |
| skill-feedback 知見 | skill-feedback-report.md の 2 知見を実装/同期 wave で promotion 済み | PASS |

skill-feedback-report.md の 2 知見（issue 前提実コード検証 / docs-only→実装仕様書昇格）を `task-specification-creator` へ promotion 済み。`indexes:rebuild` は aiworkflow-requirements 専用で本 skill 非対象（`task-specification-creator` に `indexes/` なし）。

## 7. Runtime or user-gated boundary

| 操作 | 境界 |
| --- | --- |
| コード実装（alias 3 行削除） | **実施済み（landed local・uncommitted）** |
| 設計 doc の primary 名整合 | **実施済み（landed local・uncommitted）** |
| typecheck / focused Vitest | **実行済み（typecheck green / Vitest 4 pass）** |
| commit / push | user-gated（未実施） |
| PR 作成（base=dev） | user-gated（明示承認後のみ・未実施） |
| completed-tasks への physical move / source unassigned-task の consume 移動 | user-gated（close-out wave・未実施） |

実装と skill 反映・LOGS 追記は本 wave で完了。commit / push / PR / physical move は user 明示承認後にのみ実行する。

## 8. Archive/delete stale-reference gate

削除した workflow root なし → **N/A（stale 参照なし）**。

source unassigned-task は consume 対象だが physical move は close-out wave で実施予定であり、本 spec 段階では削除・移動を行わないため stale 参照は発生しない。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | workflow_state=`implemented_local_evidence_captured` と全 phase 記述・evidence・skill sync 記述が整合。commit 済みを主張する記述なし（Gate-C pending 維持） |
| 漏れなし | PASS | strict 7 + Phase 11 evidence + artifacts parity すべて present。skill 反映 / LOGS 追記も本 wave で完了 |
| 整合性あり | PASS | primary 名 / cookie 定数 / path / artifacts metadata / ledger / skill references 記述が一致。残る旧名は「削除済みを説明する枠組み」のみ |
| 依存関係整合 | PASS | parent(issue-1024) doc 整合範囲・source unassigned-task 論理 consumed（physical move は close-out）・Gate 状態が同期 |

> 4 条件いずれも PASS。実装は landed local（uncommitted）で skill 反映・LOGS 追記まで本 wave で完了。Gate-C（commit / PR 実行）は user-gated で pending（passed_at:null 維持）。

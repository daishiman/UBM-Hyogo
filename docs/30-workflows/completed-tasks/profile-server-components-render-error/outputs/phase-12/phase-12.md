# Phase 12: ドキュメント更新

## 概要

Phase 12 strict 7 を物理配置し、root/output artifacts parity と aiworkflow-requirements 同期計画を完了する。

| Task | Output | Status |
| --- | --- | --- |
| Task 12-0 phase summary | `phase-12.md` | present |
| Task 12-1 implementation guide | `implementation-guide.md` | present |
| Task 12-2 system spec update summary | `system-spec-update-summary.md` | present |
| Task 12-3 documentation changelog | `documentation-changelog.md` | present |
| Task 12-4 unassigned task detection | `unassigned-task-detection.md` | present |
| Task 12-5 skill feedback report | `skill-feedback-report.md` | present |
| Task 12-6 compliance check | `phase12-task-spec-compliance-check.md` | present |

## Canonical 9 headings

### 1. 実装ガイド作成（中学生レベル + 技術者レベル）

`implementation-guide.md` 参照。Part 1（中学生レベル）と Part 2（技術者レベル）の二段構成。

### 2. システム仕様書更新

`system-spec-update-summary.md` 参照。`apps/web/src/lib/fetch/authed.ts` の env 参照経路の正本契約を `getApiBaseEnv()` 経由・localhost fallback なしに同期する。

### 3. ドキュメント差分

`documentation-changelog.md` 参照。Step 1-A / 1-B / 1-C / Step 2 の各結果を個別に明記。

### 4. 未タスク検出（0 件でも必須）

`unassigned-task-detection.md` 参照。今サイクルで解消すべき直接原因は 0 件残し。

### 5. Skill フィードバック

`skill-feedback-report.md` 参照。今回タスクで気づいた skill 改善余地を routing する。

### 6. Phase 11 evidence 表

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| focused Vitest | outputs/phase-11/evidence/focused-vitest.log | present |
| static source guard | outputs/phase-11/evidence/static-source-guard.log | present |

User-gated runtime evidence is tracked separately and is not a `present` validator claim:

| Runtime Evidence | Path | Boundary |
| --- | --- | --- |
| staging profile curl | outputs/phase-11/evidence/staging-profile-curl.log | pending_user_approval |
| staging profile tail clean | outputs/phase-11/evidence/staging-profile-tail.log | pending_user_approval |

### 7. Compliance check

`phase12-task-spec-compliance-check.md` 参照。Task 12-1 〜 12-5 の成果物と Phase 11 manual-test-result の存在を root evidence として残す。

### 8. Runtime boundary 明示

Cloudflare staging deploy、authenticated `/profile` curl、commit、push、PR はユーザー承認後にのみ実行する。

### 9. Phase 12 漏れ防止チェック

- [x] Step 1-C 実行（aiworkflow-requirements ledger 同期計画）
- [x] documentation-changelog.md に Step 全件記載
- [x] `unassigned-task-detection.md` を 0 件でも出力
- [x] `skill-feedback-report.md` を出力
- [x] `artifacts.json` と `outputs/artifacts.json` parity（`implemented_local_evidence_captured` / Phase 13 `pending_user_approval`）
- [x] Phase 11 evidence 表を Phase 12 内に再掲

# Phase 12: 仕様同期

[実装区分: 実装仕様書]

## 更新対象

| ファイル | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `PublicMemberProfile.attendance` と privacy boundary |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory へ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | public profile attendance 導線を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | `verified / implementation / NON_VISUAL / implementation_complete_pending_pr` として同期 |

## 必須成果物

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/main.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## コマンド

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
```

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- 仕様同期ファイルと index 再生成が完了。
- 未タスクが 0 件でも `outputs/phase-12/unassigned-task-detection.md` を作る。
- Issue #533 は CLOSED 維持、PR 文脈は `Refs #533`。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 12 |
| status | completed |

## 目的

Phase 12: 仕様同期 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 12 の成果と後続依存を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `packages/shared/src/types/viewmodel/index.ts`

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-12.md`
- [x] Related artifacts are reflected in `artifacts.json`.

## 依存成果物参照

- `outputs/phase-01/requirements.md`
- `outputs/phase-02/design.md`
- `outputs/phase-03/privacy-attendance-public-contract.md`
- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

依存Phase参照: Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 / Phase 13

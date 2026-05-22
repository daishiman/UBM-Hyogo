# Phase 9: 契約・不変条件検証

[実装区分: 実装仕様書]

## Grep Gate

```bash
rg -n "responseEmail|audit|adminNotes|admin_member_notes" packages/shared/src/types/viewmodel/index.ts packages/shared/src/zod/viewmodel.ts apps/api/src/routes/public apps/api/src/use-cases/public apps/api/src/repository/_shared/builder.ts
rg -n "sessionGuard|requireAdmin" apps/api/src/routes/public
rg -n "attendanceProviderMiddleware|RepositoryProviderVariables" apps/api/src/routes/public apps/api/src/repository/_shared/builder.ts
```

期待値:

- 1 本目は public response へ禁止項目を追加していないことを人間が確認する。
- 2 本目は `/public/*` に session/admin guard が混入していないことを確認する。
- 3 本目は provider middleware / type が public profile 経路に入っていることを確認する。

## Contract Matrix

| 不変条件 | 証明 |
| --- | --- |
| public response に attendance が入る | `apps/api/src/routes/public/index.test.ts`, `apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts` |
| provider 未注入は silent fallback しない | `apps/api/src/repository/__tests__/builder.test.ts` |
| 公開不適格 member では attendance provider を呼ばない | `apps/api/src/repository/__tests__/builder.test.ts` |
| admin notes / responseEmail を公開しない | `apps/api/src/repository/__tests__/builder.test.ts`, `apps/api/src/view-models/public/__tests__/public-member-profile-view.test.ts`, `apps/api/src/repository/__tests__/adminNotes.test.ts` |

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- `outputs/phase-11/evidence/grep-gate.log` に結果を保存。
- privacy 禁止項目が public response に混入していない。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 9 |
| status | completed |

## 目的

Phase 9: 契約・不変条件検証 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 9 の成果と後続依存を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `packages/shared/src/types/viewmodel/index.ts`

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-09.md`
- [x] Related artifacts are reflected in `artifacts.json`.

## 統合テスト連携

- [x] Focused Vitest and typecheck evidence are recorded under `outputs/phase-11/`.
- [x] NON_VISUAL task; browser screenshot evidence is not required.

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

# Phase 6: コードレビュー観点

[実装区分: 実装仕様書]

## レビュー観点

| 観点 | 確認内容 |
| --- | --- |
| 型境界 | shared package が API package を import していない |
| provider 境界 | attendance 取得が `c.var.attendanceProvider` 経由 |
| 公開境界 | 404 条件が attendance read より前に維持されている |
| privacy | admin notes / responseEmail / member-only fields が response に混入していない |
| 互換性 | `/me/profile` と admin detail の attendance contract を壊していない |
| cache | `/public/members/:memberId` は `Cache-Control: no-store` を維持 |

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- 上記観点を PR review checklist に転記できる。
- 指摘が出た場合は Phase 5 の対象ファイル内で閉じる。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 6 |
| status | completed |

## 目的

Phase 6: コードレビュー観点 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 6 の成果と後続依存を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `packages/shared/src/types/viewmodel/index.ts`

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-06.md`
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

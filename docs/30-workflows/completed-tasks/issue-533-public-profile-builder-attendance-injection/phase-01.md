# Phase 1: 要件定義

[実装区分: 実装仕様書]

Issue #533 は CLOSED のまま、public profile に attendance を含める仕様変更を実装可能な粒度に formalize する。コード変更が必須のため docs-only ではない。

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | `GET /public/members/:memberId` の response に `attendance: AttendanceRecord[]` を含める |
| AC-2 | attendance は `c.var.attendanceProvider` 経由で取得し、builder / use-case に直接 D1 SQL を増やさない |
| AC-3 | provider 未注入は silent fallback せず `/attendanceProvider not bound/i` で throw する |
| AC-4 | 公開不適格 member は従来通り 404。attendance 取得前に公開可否を確定する |
| AC-5 | `PublicMemberProfile` に admin notes / responseEmail / member-only fields / admin-only fields を含めない |
| AC-6 | shared type / zod / API route / builder / route tests が同期する |

## 実装対象

- `packages/shared/src/types/viewmodel/index.ts`
- `packages/shared/src/zod/viewmodel.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `apps/api/src/use-cases/public/get-public-member-profile.ts`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/routes/public/index.ts`
- 対応テストファイル

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| system spec | `docs/00-getting-started-manual/specs/01-api-schema.md` | profile / attendance contract |
| system spec | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | public member detail boundary |
| workflow | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` | ctx 注入パターン |
| code | `apps/api/src/middleware/repository-providers.ts` | `attendanceProviderMiddleware` |

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- AC-1 から AC-6 が後続 Phase に展開されている。
- Phase 2 が変更対象ファイル・関数シグネチャ・データ構造を確定できる。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 1 |
| status | completed |

## 目的

Phase 1: 要件定義 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 1 の成果と後続依存を確認する。

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-01.md`
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

# Phase 5: 実装手順

[実装区分: 実装仕様書]

本 Phase はコード実装そのものを後続実行者に委譲する手順書である。

## 手順

1. `packages/shared/src/types/viewmodel/index.ts` の `PublicMemberProfile` が `attendance` と optional `attendanceMeta` を持つことを確認・維持する。
2. `packages/shared/src/zod/viewmodel.ts` の `PublicMemberProfileZ` を同形に更新し、zod test を補強する。
3. `apps/api/src/repository/_shared/builder.ts` の `buildPublicMemberProfile` 引数を `RepositoryProviderCtx` に変更し、`fetchAttendancePagedFor` を使って attendance を埋める。
4. `apps/api/src/use-cases/public/get-public-member-profile.ts` は direct converter で attendance を組み立てず、builder へ寄せる。既存 converter を残す場合でも provider 経由の取得結果を明示的に渡す。
5. `apps/api/src/routes/public/member-profile.ts` に `attendanceProviderMiddleware` を結線し、`ctx` と `c.var.attendanceProvider` を use-case / builder へ渡す。
6. `apps/api/src/routes/public/index.ts` の Hono 型を `RepositoryProviderVariables` と合成する。
7. テスト fixture に meeting / attendance rows を追加し、Phase 4 のテストを実装する。
8. `docs/00-getting-started-manual/specs/01-api-schema.md` に public profile attendance contract を追記する。

## 実装結果（2026-05-08）

- `PublicMemberProfile` / `PublicMemberProfileZ` に `attendance` と optional `attendanceMeta` を同期。
- `buildPublicMemberProfile` を `RepositoryProviderCtx` 化し、公開適格判定後に `fetchAttendancePagedFor` で attendance を注入。
- public route に `attendanceProviderMiddleware` を結線し、use-case へ provider ctx を渡す。
- public profile converter は attendance DTO を明示的に受け、privacy deny fields を返さない。

## 禁止事項

- `/public/*` に session guard を追加しない。
- apps/web から D1 や repository を直接 import しない。
- `PublicMemberProfile` に `responseEmail`, `audit`, admin note, member-only/admin-only field を追加しない。
- Issue #533 を reopen / close 操作しない。

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- Phase 4 の focused tests が PASS。
- Phase 7〜9 の gate を実行できる状態になっている。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 5 |
| status | completed |

## 目的

Phase 5: 実装手順 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 5 の成果と後続依存を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `packages/shared/src/types/viewmodel/index.ts`

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-05.md`
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

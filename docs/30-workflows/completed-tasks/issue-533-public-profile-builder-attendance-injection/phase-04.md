# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## 追加・更新するテスト

| ファイル | ケース |
| --- | --- |
| `packages/shared/src/zod/viewmodel.test.ts` | `PublicMemberProfileZ` が attendance 配列を受理する |
| `apps/api/src/repository/__tests__/builder.test.ts` | `buildPublicMemberProfile(withProvider(ctx), m_001)` が attendance を返す |
| `apps/api/src/repository/__tests__/builder.test.ts` | provider 未注入時に `/attendanceProvider not bound/i` で throw |
| `apps/api/src/repository/__tests__/builder.test.ts` | `audit` / `responseEmail` が public profile に存在しない |
| `apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts` | use-case から provider 経由で attendance が返る |
| `apps/api/src/routes/public/index.test.ts` | `/public/members/m-1` が attendance と `Cache-Control: no-store` を返す |
| `apps/api/src/routes/public/index.test.ts` | public route は session guard なしで到達可能 |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- src/zod/viewmodel.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test -- src/repository/__tests__/builder.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test -- src/use-cases/public/__tests__/get-public-member-profile.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test -- src/routes/public/index.test.ts
```

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- RED → GREEN の差分がテスト名で説明できる。
- route / builder / shared schema の 3 層で同じ response contract を検証している。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 4 |
| status | completed |

## 目的

Phase 4: テスト戦略 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 4 の成果と後続依存を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `packages/shared/src/types/viewmodel/index.ts`

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-04.md`
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

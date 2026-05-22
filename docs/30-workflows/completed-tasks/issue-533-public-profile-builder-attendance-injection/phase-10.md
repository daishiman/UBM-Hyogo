# Phase 10: リスク再評価

[実装区分: 実装仕様書]

## リスクと対策

| リスク | 対策 |
| --- | --- |
| shared が API 型を逆 import する | shared 側に同形 type / zod を置く |
| public route に session guard を足してしまう | Phase 9 grep gate と route test で防ぐ |
| attendance read が公開不適格 member に走る | `existsPublicMember` / builder null 判定の後に取得する設計を確認 |
| public response が肥大化する | default 50 件まで。cursor endpoint は今回追加しない |
| 既存 converter と builder が二重正本化する | Phase 5 で builder へ寄せる方針を優先 |

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- 上記リスクが Phase 5/9 の実装手順と gate に接続されている。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 10 |
| status | completed |

## 目的

Phase 10: リスク再評価 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 10 の成果と後続依存を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `packages/shared/src/types/viewmodel/index.ts`

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-10.md`
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

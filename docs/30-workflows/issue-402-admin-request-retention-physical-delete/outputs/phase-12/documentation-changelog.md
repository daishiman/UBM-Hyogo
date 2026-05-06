# Documentation Changelog — Issue #402

| 日付 | ファイル | 変更内容 |
| --- | --- | --- |
| 2026-05-06 | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/index.md` | 新規（タスク仕様書 root） |
| 2026-05-06 | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/artifacts.json` | 新規（Phase 1-13 状態管理） |
| 2026-05-06 | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/phase-{01..13}.md` | 新規（Phase 1-13 スタブ） |
| 2026-05-06 | `outputs/phase-{1..9}/*` | 新規（Phase 1-9 実装仕様 / チーム 1, 2 担当） |
| 2026-05-06 | `outputs/phase-10/phase-10.md` | 新規（rollback 経路 / 不可逆境界 / member 通知文言レビュー） |
| 2026-05-06 | `outputs/phase-11/phase-11.md` | 新規（NON_VISUAL evidence 7 ファイル取得手順） |
| 2026-05-06 | `outputs/phase-12/phase-12.md` | 新規（索引） |
| 2026-05-06 | `outputs/phase-12/main.md` | 新規（6 必須タスク表） |
| 2026-05-06 | `outputs/phase-12/implementation-guide.md` | 新規（Part 1 中学生 + Part 2 技術者） |
| 2026-05-06 | `outputs/phase-12/documentation-changelog.md` | 新規（本ファイル） |
| 2026-05-06 | `outputs/phase-12/unassigned-task-detection.md` | 新規（0 件） |
| 2026-05-06 | `outputs/phase-12/skill-feedback-report.md` | 新規（3 観点） |
| 2026-05-06 | `outputs/phase-12/system-spec-update-summary.md` | 新規（`data-retention-policy.md` 反映方針） |
| 2026-05-06 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |
| 2026-05-06 | `outputs/phase-13/phase-13.md` | 新規（blocked_pending_user_approval） |
| 2026-05-06 | `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md` | 新規（Issue #402 retention policy SSOT） |
| 2026-05-06 | `docs/00-getting-started-manual/specs/07-edit-delete.md` | Issue #402 180 日 retention exception を追記 |
| 2026-05-06 | `docs/00-getting-started-manual/specs/11-admin-management.md` | admin approve 直後の論理削除原則と retention exception を分離 |
| 2026-05-06 | `.claude/skills/aiworkflow-requirements/indexes/*` | `pnpm indexes:rebuild` で同期 |

## 実装時に更新するファイル

| 予定日 | ファイル | 変更内容 |
| --- | --- | --- |
| TBD | `apps/api/src/jobs/retention-purge.ts` ほか実装ファイル群 | Phase 5 で生成 |

## 関連参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/402 (CLOSED)
- 関連 SSOT: `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md`（新規）
- 関連 spec: `docs/00-getting-started-manual/specs/02-auth.md`, `08-free-database.md`

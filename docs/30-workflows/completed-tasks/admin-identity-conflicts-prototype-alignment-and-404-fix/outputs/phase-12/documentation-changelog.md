# Documentation changelog

本サイクルで追加・更新するドキュメント全量。

## 追加 (本仕様書サイクル)

| path | 内容 |
|------|------|
| `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/index.md` | workflow index (別エージェント) |
| `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/artifacts.json` | gate metadata (別エージェント) |
| `outputs/phase-1/phase-1.md` | スコープ / 既存実装インベントリ (別エージェント) |
| `outputs/phase-2/phase-2.md` | 設計詳細 (A UI + B 404 仮説 H1-H5) (別エージェント) |
| `outputs/phase-3/phase-3.md` | AC / 依存関係 / 変更マップ (別エージェント) |
| `outputs/phase-4/phase-4.md` | 実装ガイド本体 + H1-H5 切り分けフロー (別エージェント) |
| `outputs/phase-5/phase-5.md` | 実装順序・依存グラフ (別エージェント) |
| `outputs/phase-6/phase-6.md` | ローカル動作確認手順 (別エージェント) |
| `outputs/phase-7/phase-7.md` | エラーハンドリング (別エージェント) |
| `outputs/phase-8/phase-8.md` | 観測性 / Sentry tag scheme |
| `outputs/phase-9/phase-9.md` | セキュリティ / PII / 不変条件 |
| `outputs/phase-10/phase-10.md` | リリース計画 / rollback |
| `outputs/phase-11/phase-11.md` | Evidence 取得仕様 |
| `outputs/phase-12/main.md` | Phase 12 集約 entry |
| `outputs/phase-12/implementation-guide.md` | 実装ハンドブック (CONST_005 5 必須項目) |
| `outputs/phase-12/system-spec-update-summary.md` | 正本 spec 影響 (本サイクルは N/A) |
| `outputs/phase-12/skill-feedback-report.md` | skill 追記候補 (L-AIDC-001..N) |
| `outputs/phase-12/unassigned-task-detection.md` | FU-AIDC-* 候補 + CONST_007 判定 |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings compliance |
| `outputs/phase-13/phase-13.md` | PR 作成手順 |

## 実装サイクルで追加・更新済み

| path | 内容 |
|------|------|
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 本 workflow root 1 行追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 同上 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | entry 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-identity-conflicts-prototype-alignment-and-404-fix-artifact-inventory.md` | 新規 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | 追記 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | `AdminPageHeader` / `AdminSectionCard` / `Pagination` へ整合 |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | `Button` / `Badge` / `Textarea` primitive と既存 tokens へ整合 |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | `ADMIN_FETCH_404` を `admin_fetch_404` warn として観測 |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` | 404 warn 発火検証を追加 |

## 実装サイクルで未取得 (user-gated)

| path | 内容 |
|------|------|
| `outputs/phase-11/evidence/build.log` | production build log |
| `outputs/phase-11/screenshots/*.png` | 8 枚以上 |

## 正本 spec 更新

**N/A** (詳細は `system-spec-update-summary.md`)

## 実コードの changelog

git 履歴で管理し本ファイルには列挙しない (skill `references/phase12-skill-feedback-promotion.md` 規約)。

# Phase 12: ドキュメント更新

`[実装区分: 実装仕様書]` / status: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | `TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001` |
| workflow | `admin-schema-terminology-clarity` |
| taskType | implementation |
| visualEvidence | `VISUAL`（UI 文言変更＝視覚的差分あり） |
| workflow_state | `implemented_local_evidence_captured`（実装・ローカル検証完了。authenticated staging screenshot / commit / PR は user-gated） |
| branch | `feat/admin-schema-terminology-clarity` |
| 変更範囲 | `apps/web` 表現層のみ（API / D1 / Google Form / endpoint surface 不変） |

## 目的

`/admin/schema` とその波及先（ダッシュボード KPI / アラート、サイドバー、履歴画面）に表示される
エンジニア用語・英語テクニカル表記（スキーマ / stableKey / resolve / revision / CURRENT REVISION /
FORM SCHEMA GUIDE / DIFF ITEMS / Bulk Resolve / Bulk Rollback / ALIAS HISTORY）を、非エンジニア管理者が
直感的に理解できる平易な日本語へ統一し、意味のない内部 revisionId の生表示を隠す。Phase 12 は、この
実装仕様書ウェーブのドキュメント正本（厳格7成果物）を揃え、Phase 13（PR 作成）への受け渡し条件を確定する。

## 実行タスク

1. 厳格7成果物（下記「成果物」表）を `outputs/phase-12/` に作成する。
2. `implementation-guide.md` に Part 1（中学生レベルの例え話）と Part 2（開発者レベルの変更ファイル一覧・
   `formatJstDate` シグネチャ・用語リネーム表・grep gate）と「視覚証跡」セクションを記述する。
3. `phase12-task-spec-compliance-check.md` を canonical 9 見出し逐語で作成し、Gate-A evidence とする。
4. `unassigned-task-detection.md` を current（0 件）/ baseline 分離で作成する。
5. Phase 13 への受け渡し条件（user-gated 境界）を明記する。

## 参照資料

- `docs/30-workflows/completed-tasks/admin-schema-terminology-clarity/shared-context.md`（設計 SSOT・用語リネーム正本テーブル）
- `docs/30-workflows/completed-tasks/admin-schema-terminology-clarity/artifacts.json`（metadata 引用元）
- `outputs/phase-11/screenshot-plan.json` / `outputs/phase-11/phase11-capture-metadata.json`（VISUAL 計画）
- 合格例: `docs/30-workflows/completed-tasks/admin-schema-diff-review-resolve-ux/outputs/phase-12/*`

## 成果物

| # | ファイル | 役割 | 状態 |
|---|---------|------|------|
| 1 | `main.md` | 本インデックス | present |
| 2 | `implementation-guide.md` | Part 1（中学生）/ Part 2（開発者）/ 視覚証跡 | present |
| 3 | `system-spec-update-summary.md` | Step 1-A〜1-C / Step 2 判定 | present |
| 4 | `documentation-changelog.md` | Step 1-A/1-B/1-C/Step 2 更新履歴 | present |
| 5 | `unassigned-task-detection.md` | 未タスク検出（current 0 件 / baseline 分離） | present |
| 6 | `skill-feedback-report.md` | skill フィードバック | present |
| 7 | `phase12-task-spec-compliance-check.md` | canonical 9 見出し compliance（Gate-A evidence） | present |

## 統合テスト連携

本タスクは apps/web 表現層の文言リネームに閉じるため、新規の統合テストは追加しない。表示文言の
回帰検証は Phase 4 で定義した focused vitest（`page.spec.tsx` / `SidebarNavItem.spec.tsx` /
`shell-config.spec.tsx` / `SidebarShell.server.spec.tsx` の期待文字列更新）と、Phase 11 の VISUAL
証跡（staging スクリーンショット）で担保する。実 vitest 実行・スクリーンショット取得は user-gated。
API / D1 / endpoint surface を変更しないため、`apps/api` 側の統合テストは無影響（`git diff --quiet -- apps/api`）。

## 完了条件

- [ ] 厳格7成果物がすべて `outputs/phase-12/` に present。
- [ ] `implementation-guide.md` が Part 1 / Part 2 / 視覚証跡を含む。
- [ ] `phase12-task-spec-compliance-check.md` が canonical 9 見出しを逐語で含み Gate-A evidence になる。
- [ ] `unassigned-task-detection.md` が current（0 件）/ baseline を分離して記述。
- [ ] Phase 13 への user-gated 境界が明記されている。

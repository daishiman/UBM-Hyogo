# Phase 11: 手動テスト

正本: `outputs/phase-11/manual-test-result.md`

この root entry は `validate-phase-output.js` / `validate-phase11-screenshot-coverage.js` が参照する Phase 11 仕様入口である。実行計画・判断根拠・証跡一覧は `outputs/phase-11/manual-test-result.md` を正本とする。

## メタ情報

| 項目 | 値 |
|------|------|
| taskId | `ADMIN-MEMBER-DETAIL-TAG-SOURCE-500-AND-DRAWER-RESILIENCE` |
| visualEvidence | `VISUAL`（Lane B が drawer error UI を変更） |
| workflow_state | `implemented_local_evidence_captured`（PNG 未取得・実装後 staging で撮影） |

## 目的

詳細 API 500 解消（Lane A）と `MemberDrawer` の fetch 失敗時 retry 回復（Lane B）の手動テスト計画と視覚証跡計画を固定する。

## 参照資料

- `outputs/phase-11/manual-test-result.md`（正本）
- `_shared-context.md §8`（Phase 11/12 の扱い）
- `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md`

## 実行タスク

1. 実装後に focused Vitest 3 spec を実行（Lane A 2 spec / Lane B 1 spec）。
2. staging で admin 認証下に `/admin/members` → TEST-MEM-09 詳細ドロワーを開き、SC-01/02/03 を撮影（user-gated）。
3. `GET /api/admin/members/TEST-MEM-09` が 200 を返すことを Network で確認。

## 成果物

| 成果物 | パス |
|--------|------|
| 手動テスト結果（正本） | `outputs/phase-11/manual-test-result.md` |
| 手動テストレポート | `outputs/phase-11/manual-test-report.md` |
| 発見事項 | `outputs/phase-11/discovered-issues.md` |
| UI sanity / visual review | `outputs/phase-11/ui-sanity-visual-review.md` |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` |
| screenshot coverage | `outputs/phase-11/screenshot-coverage.md` |

## 画面カバレッジマトリクス

| ID | Target | 証跡 | Status |
| --- | --- | --- | --- |
| SC-01 | `/admin/members` 詳細ドロワー fetch 失敗時の error + 再試行ボタン（`member-detail-retry`） | `outputs/phase-11/screenshots/member-detail-error-retry.png` | pending |
| SC-02 | 再試行 → TEST-MEM-09 詳細ドロワー正常表示（seed source タグ表示） | `outputs/phase-11/screenshots/member-detail-recovered.png` | pending |
| SC-03 | `GET /api/admin/members/TEST-MEM-09` 200（network） | `outputs/phase-11/screenshots/member-detail-api-200.png` | pending |

## 統合テスト連携

Lane A は `apps/api` の `buildAdminMemberDetailView` 経路を focused Vitest（`builder.repository.spec.ts`）で回帰検証し、`GET /api/admin/members/:id` のフルアプリ経路は実装後の手動テスト（SC-03）で 200 を確認する。Lane B は `MemberDrawer.spec.tsx` の jsdom render で retry 回復を検証する。

## 完了条件

- [x] focused Vitest 3 spec が PASS（実装後）
- [ ] SC-01/02/03 を staging で撮影（実装後・admin 認証必須・user-gated）
- [x] implemented_local_evidence_captured wave: 撮影計画・capture metadata（status=staging_visual_pending_user_gate）を固定
- [x] 補助成果物（manual-test-report / discovered-issues / ui-sanity-visual-review / screenshot-plan / capture-metadata）を配置

## 二段境界

本 wave は `implemented_local_evidence_captured`（PNG 0 件・status=pending）。staging 認証 runtime screenshot は実装後にログインセッション下で取得するため user-gated とする。

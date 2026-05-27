# admin-requests-prototype-alignment-and-404-fix

> workflow root — `/admin/requests`（依頼キュー）の UI/UX プロトタイプ整合 + staging で発生中の `ADMIN_FETCH_404` の根本修正。

| 項目 | 値 |
|------|-----|
| workflow_state | `implemented_local_evidence_captured` |
| implementation_mode | `new` |
| branch | `feat/admin-requests-prototype-alignment-and-404-fix` |
| base | `dev` |
| 対象画面 | `apps/web/app/(admin)/admin/requests/page.tsx` + `apps/web/src/components/admin/RequestQueuePanel.tsx` + `RequestQueueDetail.tsx` |
| 対象 API | `apps/api/src/routes/admin/requests.ts` + 関連 mount (`apps/api/src/index.ts:281`) |
| visual_mode | VISUAL（管理画面UI変更を含む） |
| 関連 spec | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` §7 Requests |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/` (pages-admin.jsx primitives) |

---

## 目的

1. **UI/UX 整合（Task B）**: 既存 `RequestQueuePanel` を `page-enter / stack-lg / page-head / card card-pad-lg / h-section / btn-row / card-flat` 等のプロトタイプ primitives に揃え、admin shell（topbar + sidebar）配下の他画面（members / meetings / schema / tags / dashboard）と視覚的に整合させる。
2. **API 404 修正（Task A）**: staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/requests` で発生する `admin api /admin/requests?status=pending&type=visibility_request failed: 404` / `code ADMIN_FETCH_404` を根本修正する。

---

## 真の論点（要件レビュー）

| 観点 | 結論 |
|------|------|
| 価値性 | admin が依頼キューを開けない＝公開/退会 governance が止まる。最優先で復旧する価値。UI整合は admin shell 一貫性で operability を上げる。 |
| 実現性 | 既存 `RequestQueuePanel` の構造（list/detail/dialog）はそのまま温存し、外側 wrapper と primitive 適用に限定する。1サイクル内完了可能。 |
| 整合性 | API 修正は不変条件 #5（D1 アクセスは apps/api に閉じる）を維持。UI 修正は不変条件 #2（OKLch トークン正本化）を維持。 |
| 運用性 | Playwright admin-staging-visual project（既存）に `/admin/requests` を追加し、回帰を CI で担保。 |

---

## スコープ

### 含む（今サイクルで完了）

| Task | 責務 | 対象ファイル |
|------|------|-------------|
| Task A | API 404 根本原因調査 + 修正 + 回帰 vitest spec | `apps/api/src/routes/admin/requests.ts` 周辺、`apps/api/src/index.ts`、`apps/web/src/lib/admin/server-fetch.ts` のエラー code propagation |
| Task B | UI/UX プロトタイプ整合 + Playwright admin-staging-visual 追加 | `apps/web/app/(admin)/admin/requests/page.tsx`、`apps/web/src/components/admin/RequestQueuePanel.tsx`、`apps/web/src/components/admin/RequestQueueDetail.tsx`、`apps/web/playwright/tests/visual/admin-staging.spec.ts` |

### 含まない（CONST_007 例外）

- 新規 API endpoint 追加（不変条件 #1）。
- D1 schema 変更。
- 新 design token / 新 primitive の追加（既存 primitive 群で構成する）。
- 通知 / outbox の挙動変更（不変条件 #4）。

---

## Phase テーブル

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | spec_created | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | spec_created | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | spec_created | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成 | spec_created | `outputs/phase-4/phase-4.md` |
| 5 | 実装 | completed | `outputs/phase-5/phase-5.md` + `tasks/task-A-api-404-fix.md` + `tasks/task-B-ui-prototype-alignment.md` |
| 6 | テスト拡充 | spec_created | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | spec_created | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | spec_created | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | completed | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | completed | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | local_evidence_captured | `outputs/phase-11/phase-11.md` |
| 12 | ドキュメント更新 | completed | `outputs/phase-12/phase-12.md` |
| 13 | PR 作成 | pending_user_approval | `outputs/phase-13/phase-13.md` |

---

## 関連タスク

- 親 workflow: `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment/`（Task A/B/C/D/E 完了済み）
- 同種完了: `admin-shell-topbar-sidebar-integration` / `admin-meetings-prototype-alignment` / `admin-schema-page-prototype-alignment-and-diff-fetch-fix` / `admin-tag-queue-ui-and-404`
- API 系統: `04b-followup-004-admin-queue-resolve-workflow`（resolve エンドポイントの正本）

## 未タスク候補（Phase 12 で確定）

なし（現時点）— Phase 12 detection で正式判定。

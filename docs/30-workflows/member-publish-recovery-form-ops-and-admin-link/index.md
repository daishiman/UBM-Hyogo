# Workflow: member-publish-recovery-form-ops-and-admin-link

> **[実装区分: 実装仕様書 / implementation]** — 4 タスクすべてコード変更を伴う。
> automation-30 準拠レビュー後、本 cycle で実コード・実仕様書へ反映済み（`workflow_state=implemented_local_static_evidence_captured_runtime_visual_pending`）。
> コミット・PR・staging deploy・production flag/secret 操作はユーザー明示指示まで行わない（CONST_002）。

会員ディレクトリ（`/members`）に「現在、公開設定中のメンバーがいません」と表示される問題（会員2名在籍・公開0件）、
既存 Google Form 回答の反映、反映タイミングの説明、管理画面からの Google Form 回答一覧表への導線追加を、
**責務分離した 4 タスク**として根本解決するタスク仕様書一式。

- ブランチ: `docs/member-directory-form-reflection-and-admin-link-specs`
- ベースブランチ: `dev`
- 起票元: ユーザー直接依頼（2026-05-31、staging `/members` スクリーンショット添付）

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation |
| workflow_state | implemented_local_static_evidence_captured_runtime_visual_pending |
| implementation_state | implementation_complete_runtime_visual_pending |
| visualEvidence | VISUAL_ON_EXECUTION |
| Phase 12 strict 7 | `outputs/phase-12/` に implemented local close-out evidence として物理配置 |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` を同一内容で同期 |
| 正本 | `docs/00-getting-started-manual/google-form/02-result.md`（編集/回答一覧 URL）、`docs/00-getting-started-manual/specs/` |

---

## 0. 事前調査結論（実装前ベースライン）

「会員2名在籍・公開0件」「既存フォーム回答の反映」「反映時間」「管理画面→Form 一覧リンク」の 4 観点を最新コードで調査した結論。

| 観点 | 調査対象 | 結果 |
|------|---------|------|
| 公開状態 enum | `apps/api/migrations/0002_admin_managed.sql:5-15`, `packages/shared/src/types/common.ts:5` | `publish_state ∈ {public, member_only(default), hidden}` |
| 公開フィルタ | `apps/api/src/repository/publicMembers.ts:37-39` | `public_consent='consented' AND publish_state='public' AND is_deleted=0` の 3 条件 AND |
| auto-publish flag | `apps/api/wrangler.toml:72`(prod=`false`) / `:168`(staging=`true`) | flag ON かつ sync 実行時のみ member_only→public 昇格 |
| backfill endpoint | `apps/api/src/routes/admin/sync-backfill-publish-state.ts:49-58` | **実装済み**。`POST /admin/sync/responses?fullSync=true-publish-state?dryRun=true\|false`。admin UI 導線が**無い** |
| 手動 sync | `apps/api/src/routes/admin/sync.ts`（`POST /admin/sync/responses`） | **実装済み**。admin UI 導線が**無い** |
| 診断 | `apps/api/src/diagnostics/forms-pipeline.ts`, `apps/web/app/(admin)/admin/sync-status/page.tsx` | `GET /admin/diagnostics/forms-pipeline` + 診断ページ**実装済み**（表示のみ・操作ボタン無し） |
| 反映 SLA doc | `docs/00-getting-started-manual/specs/03-data-fetching.md` | レイテンシ SLA の明記が**無い** |
| admin nav | `apps/web/src/components/shell/shell-config.ts:56-91` | nav は内部 `<Link>` 専用。外部リンク（Form）項目が**無い** |
| Form 編集/回答 URL | `docs/00-getting-started-manual/google-form/02-result.md:12` | `https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit` |

> **結論**: バックエンド（backfill / manual sync / diagnostics endpoint）は**すでに実装済み**。
> 本質的な欠落は (1) これらを**管理画面から操作する UI 導線**、(2) **反映タイミングの可視化と説明ドキュメント**、(3) **管理画面→Form 回答一覧表の外部リンク**である。
> したがって本 workflow は新規バックエンド契約を最小化し、UI 導線 + ドキュメント + 軽微な API 拡張に集約して 1 サイクル完了できる単一スコープへ確定する（CONST_007）。

---

## 1. タスク分解（責務分離）

ユーザー要望「複数用途にまたがるので責務を分離して」に従い、単一責務原則（SRP）で 4 タスクへ分解する。

| Task | 責務（単一） | 主成果物 | 仕様書 |
|------|------------|---------|--------|
| **A** | 公開状態 backfill の**管理 UI 化**（同意済み×member_only メンバーを public へ救済） | sync-status ページに dry-run→apply パネル | [tasks/A-publish-state-backfill-admin-ui.md](tasks/A-publish-state-backfill-admin-ui.md) |
| **B** | 既存フォーム回答の**手動再取込 UI 化**（保存済み回答を一覧へ反映） | sync-status ページに手動 sync 実行パネル | [tasks/B-manual-form-resync-admin-ui.md](tasks/B-manual-form-resync-admin-ui.md) |
| **C** | **反映タイミングの可視化 + 反映 SLA ドキュメント**（質問 Q3/Q4 の恒久回答） | `/members`・`/profile` の「最終同期時刻／反映目安」表示 + spec doc | [tasks/C-reflection-timing-visibility-and-sla-doc.md](tasks/C-reflection-timing-visibility-and-sla-doc.md) |
| **D** | 管理サイドバー→**Google Form 回答一覧表 外部リンク**追加 | shell nav 外部リンク対応 + 定数 + icon | [tasks/D-admin-google-form-responses-link.md](tasks/D-admin-google-form-responses-link.md) |

### 責務境界（重複・依存）

- A と B はどちらも `admin/sync-status` ページに UI を追加する。**同一ページ・別パネル**として配置し、ファイル競合を避けるためパネルを別コンポーネント（`BackfillPublishStatePanel` / `ManualFormResyncPanel`）に分離する。
- C は A/B の sync 実行結果（最終同期時刻）を表示に利用しうるが、データ取得は既存 `forms-pipeline` snapshot / `sync_jobs` から行い、A/B に実装依存しない。
- D は完全独立（shell nav + 定数 + icon のみ）。
- 4 タスクとも **1 サイクル内完了**（CONST_007）。先送り・別 PR 分離は無し。

---

## 2. スコープ

詳細は [phase-2.md](phase-2.md)。

- **含む**: admin UI 導線（A/B）、反映タイミング表示 + SLA doc（C）、外部リンク（D）、各タスクのテスト追加。
- **含まない**: 新規 D1 migration、Google Form schema 変更、cron 間隔変更、production auto-publish flag の実切替（運用判断・user-gated）。
- **不変条件**: D1 直接アクセスは `apps/api` に閉じる（#5）、admin form input は `FormField` 経由（#9）、admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10）、OKLch トークン正本（HEX 直書き禁止）。

## 4. 実装結果（automation-30 改善）

| Task | 実装結果 |
|------|---------|
| A | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` と `diagnostics/backfill.ts` を追加し、`/admin/sync-status` に dry-run/apply UI を配置 |
| B | `ManualFormResyncPanel.client.tsx` と `diagnostics/manual-sync.ts` を追加し、Next admin proxy が sync 系 path へ server-side `SYNC_ADMIN_TOKEN` Bearer を注入 |
| C | `ReflectionTimingNote.tsx` を `/members` と `/profile` に配置し、`docs/00-getting-started-manual/specs/03-data-fetching.md` に反映 SLA を追記 |
| D | `FORM_RESPONSES_EDIT_URL`、`ShellNavItem.external?`、external `<a target="_blank" rel="noopener noreferrer">` 分岐、Form 回答 nav item を追加 |

Focused verification: `pnpm --filter @ubm-hyogo/web typecheck` PASS、focused Vitest 8 files / 53 tests PASS（spec DoD ケース TC-A1..A7 / TC-B1..B8 / TC-S1..S6 を網羅）。full web suite 1451 passed / 1 skipped、root lint PASS、verify-design-tokens 9 PASS。

---

## 3. フェーズ設計

詳細は [phase-3.md](phase-3.md)。Phase 1-3 = 設計書（本 workflow root）、Phase 4-13 = 各タスク仕様書（tasks/）の実装〜close-out。

---

## 参照ドキュメント

| 参照 | パス | 内容 |
|------|------|------|
| Google Form 結果 | `docs/00-getting-started-manual/google-form/02-result.md` | formId / 編集 URL / 回答一覧 URL の正本 |
| Google Form 設計 | `docs/00-getting-started-manual/google-form/01-design.md` | 31 問 / 6 セクション / consent 項目 |
| データ取得仕様 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | データフロー（反映 SLA は C で追記） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | フォーム schema と項目定義 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/` | 既存設計との整合確認 |

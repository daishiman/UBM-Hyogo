# Phase 12 Documentation — main

## サマリ

`member-publish-recovery-form-ops-and-admin-link` workflow の Phase 12 close-out（`implemented_local_static_evidence_captured_runtime_visual_pending`）。
会員ディレクトリ「公開0件」問題・既存フォーム回答の反映・反映タイミング説明・管理画面→Form 回答一覧リンクを、
責務分離した 4 タスク（A/B/C/D）の実装として `apps/web` と実仕様書に反映した。

## 成果物

| 種別 | パス |
|------|------|
| 設計書 | `phase-1.md`（要件/AC）, `phase-2.md`（スコープ）, `phase-3.md`（フェーズ設計/俯瞰） |
| タスク仕様書 | `tasks/A-publish-state-backfill-admin-ui.md` 〜 `tasks/D-admin-google-form-responses-link.md` |
| Phase 4-13 | `phase-4.md` 〜 `phase-13.md` |
| Phase 11 | `outputs/phase-11/main.md`（local static PASS / runtime pending） |
| Phase 12 strict 7 | 本ディレクトリ |

## 状態

- workflow_state: `implemented_local_static_evidence_captured_runtime_visual_pending`
- implementation_state: `implementation_complete_runtime_visual_pending`
- visualEvidence: `VISUAL_ON_EXECUTION`（authenticated runtime screenshot は user-gated）

## 主要な調査結論

backend（backfill / manual sync / diagnostics endpoint + sync-status 診断ページ）は**すでに実装済み**。
欠落は (1) admin UI 操作導線（A/B）、(2) 反映タイミング可視化 + SLA doc（C）、(3) admin→Form 外部リンク（D）。
横断前提として sync 系 endpoint の web proxy 認証経路（`SYNC_ADMIN_TOKEN` 注入）を Task B に集約した。

## 実装・検証結果

- A/B: `/admin/sync-status` に backfill / manual resync 操作パネルを追加。
- B: `apps/web/app/api/admin/[...path]/route.ts` が sync 系 path に server-side Bearer を注入。
- C: `/members` と `/profile` に `ReflectionTimingNote` を追加し、`03-data-fetching.md` に反映 SLA を追記。
- D: Admin sidebar に Google Form 回答編集画面の external nav item を追加。
- Verification: web typecheck PASS、focused Vitest 7 files / 45 tests PASS。

# Phase 1: 要件定義

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: なし（起点）
**次 Phase**: phase-2-design

## 目的

admin/requests 画面で `visibility_request` および `delete_request` の approve/reject を二段階確認 UI で実行できるようにする。同時に他管理者の先行解決による 409 conflict を専用 toast + `router.refresh()` で処理し、UI と実態の乖離を防ぐ。

## スコープ（CONST_007 単一サイクル）

- 変更対象 (modify):
  - `apps/web/src/components/admin/RequestQueuePanel.tsx`
  - `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx`
- 追加 (add):
  - `apps/web/src/components/admin/RequestQueueDetail.tsx`
  - `apps/web/src/components/admin/RequestConfirmDialog.tsx`
  - `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx`
  - `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx`

## スコープ外

- API endpoint (`POST /api/admin/requests/:noteId/resolve`) の変更（実装済）
- D1 schema 変更
- 新規 design token / primitive の追加
- e2e (playwright) 拡充（必要に応じ phase-9 で手動 QA のみ）

## 前提

| 項目 | 内容 |
|---|---|
| step-01 | `@/features/admin/hooks/useAdminMutation` 確立済（router.refresh() pattern 含む） |
| step-06 | `useConfirmDialog` 確立済（requireNote=true で reject 理由必須化可） |
| parallel-08 | toast provider と design token 導入済 |
| API | `POST /api/admin/requests/:noteId/resolve` 実装済（200 / 404 / 409 / 422） |

## 成功基準（AC）

| AC | 内容 |
|---|---|
| AC-1 | request list から item を選択すると `RequestQueueDetail` に詳細表示される |
| AC-2 | approve button 押下で `RequestConfirmDialog (kind='approve')` が `showModal()` される |
| AC-3 | reject button 押下で `RequestConfirmDialog (kind='reject')` が `showModal()` され、resolutionNote textarea が必須となる |
| AC-4 | 200 response 受領で toast 成功通知 + list が反映される |
| AC-5 | 409 response (`already_resolved`) で toast「他の管理者が既に処理済み」 + `router.refresh()` |
| AC-6 | 400 / 404 / 422 は実 error body（`unsupported note type`, `note not found`, `invalid desiredState in request payload` 等）に応じた固有メッセージの toast |
| AC-7 | `delete_request` の approve は `isDestructive=true` で警告色表示 |
| AC-8 | mutation in-flight 中は dialog の submit / cancel ボタンが disabled |
| AC-9 | 3 spec ファイル (`RequestQueuePanel.component.spec.tsx` / `RequestQueueDetail.spec.tsx` / `RequestConfirmDialog.spec.tsx`) 全 case green |
| AC-10 | `pnpm typecheck` / `pnpm lint` / `pnpm build` 0 error、`verify-design-tokens` gate green |

## 不変条件

- CLAUDE.md 不変条件 9: dialog 内 textarea / input は `FormField` 経由。
- CLAUDE.md 不変条件 10: `@/features/admin/hooks/useAdminMutation` 経由のみ。
- HEX 直書き禁止（design token 経由）。
- D1 直接アクセス禁止（API 経由）。
- 新規 test ファイルは `*.spec.tsx` のみ。

## 実装区分

**実装仕様書** — TSX component の追加・改修と test 追加。コード変更を伴う（CONST_004 デフォルト）。

## リスク・制約（親 spec Section 10 参照）

1. HTML5 `<dialog>` 互換性: iOS Safari 17.4+ 周辺挙動。fallback の要否は phase-3-design-review で判断。
2. 409 conflict 戦略: 全体再読込（`router.refresh()`）で確定。段階的再読込はやらない。
3. `resolutionNote` 最大 500 文字制限。
4. 404 vs 409 のメッセージ分岐。

# step-07-requests-approve-reject — admin/requests approve/reject 二段階確認 + 409 conflict 処理

**[実装区分: 実装仕様書]** — mutation UI + 共通基盤再利用（useAdminMutation step-01 / useConfirmDialog step-06）

## メタ情報

```yaml
workflow_id: step-07-requests-approve-reject
title: admin/requests visibility_request / delete_request 二段階確認 approve/reject
category: Admin Mutation UI
status: implemented_local_evidence_captured
parent_workflow: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/
parent_spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-07-requests-approve-reject/spec.md
created_date: 2026-05-22
taskType: implementation
visualEvidence: NON_VISUAL
workflow_state: implemented_local_evidence_captured
implementation_status: implemented_local
scope: single-cycle
serial_order: 7/8
prerequisites:
  - step-01-useAdminMutation
  - step-06-useConfirmDialog
```

## 背景

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-07-requests-approve-reject/spec.md` で確立された admin/requests の二段階確認 approve/reject フローを、Phase 1-13 の実行可能タスク仕様書とローカル実装へ展開する。

step-01 で確立した `@/features/admin/hooks/useAdminMutation` と step-06 で確立した `useConfirmDialog` を再利用し、`RequestQueuePanel.tsx` の state を圧縮しつつ、409 conflict（他管理者による先行解決）を toast + `router.refresh()` で扱う。

2026-05-23 時点で `apps/web/src/components/admin/RequestQueuePanel.tsx`、`RequestQueueDetail.tsx`、`RequestConfirmDialog.tsx` と focused component specs はローカル実装済み。Phase 13 の commit / push / PR はユーザー承認待ち。

## スコープ（CONST_007 単一サイクル）

| 種別 | path |
|---|---|
| modify | `apps/web/src/components/admin/RequestQueuePanel.tsx` |
| add | `apps/web/src/components/admin/RequestQueueDetail.tsx` |
| add | `apps/web/src/components/admin/RequestConfirmDialog.tsx` |
| modify | `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` |
| add | `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` |
| add | `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` |

API endpoint `POST /api/admin/requests/:noteId/resolve` は実装済のため変更しない。

## Phase 一覧

| Phase | 種別 | ファイル |
|---|---|---|
| 1 | requirements | `phase-1-requirements.md` |
| 2 | design | `phase-2-design.md` |
| 3 | design-review | `phase-3-design-review.md` |
| 4 | test-plan | `phase-4-test-plan.md` |
| 5 | implementation | `phase-5-implementation.md` |
| 6 | test-additions | `phase-6-test-additions.md` |
| 7 | coverage | `phase-7-coverage.md` |
| 8 | refactor | `phase-8-refactor.md` |
| 9 | qa | `phase-9-qa.md` |
| 10 | final-review | `phase-10-final-review.md` |
| 11 | manual-test | `phase-11-manual-test.md` |
| 12 | documentation | `phase-12-documentation.md` |
| 13 | pr | `phase-13-pr.md` |

## DoD（親 spec Section 9 準拠）

### 実装完了
- `RequestQueuePanel.tsx` を hook 統合 refactor（state 圧縮）
- `RequestQueueDetail.tsx` 新規実装（detail view component）
- `RequestConfirmDialog.tsx` 新規実装（HTML5 `<dialog>` element + form）
- 3 spec ファイル全 case green

### 品質
- TypeScript strict mode
- design token 利用（HEX 直書き禁止 / `verify-design-tokens` CI gate green）
- a11y: dialog role / aria-label / label↔input 紐付け
- destructive=true（delete_request approve）時の警告色表示

### 動作確認
- dialog `showModal()` / `close()`
- reject 時 `resolutionNote` validation
- 409 conflict → toast「他の管理者が既に処理済み」 + `router.refresh()`
- approve/reject 成功 → toast + list 更新

## 不変条件継承

CLAUDE.md 不変条件:

1. **9 (FormField 経由)**: dialog 内 textarea / input は `FormField` 経由を標準とする。
2. **10 (useAdminMutation)**: `@/features/admin/hooks/useAdminMutation` 経由のみ使用、legacy `@/lib/useAdminMutation` への新規参照禁止。
3. **D1 直接アクセス禁止**: mutation は `apps/api` の `POST /api/admin/requests/:noteId/resolve` 経由のみ。
4. **design token 正本**: `apps/web/src/styles/tokens.css` の OKLch token を用い、`verify-design-tokens` CI gate に通すこと。
5. **`*.spec.tsx` 拡張子**: 新規 test ファイルは `*.spec.tsx` のみ（`*.test.tsx` 禁止）。

## 参照

- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-07-requests-approve-reject/spec.md`
- step-01 hook: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- step-06 hook: `apps/web/src/features/admin/hooks/useConfirmDialog.ts`
- API: `apps/api/src/routes/admin/requests.ts` (`POST /requests/:noteId/resolve`)

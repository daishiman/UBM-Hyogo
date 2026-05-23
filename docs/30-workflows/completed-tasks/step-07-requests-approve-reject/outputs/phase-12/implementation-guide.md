# Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

管理者の画面には、「この会員情報を公開してよいか」「この会員を削除してよいか」というお願いが並ぶ。
これをワンクリックで処理すると、押し間違いや、別の管理者が先に処理した後の古い画面操作が起きやすい。
そのため、処理前に確認画面を挟み、すでに処理済みなら画面を新しくする必要がある。

### 日常の例え

学校の係が提出物を確認するとき、名簿にチェックを入れる前に「本当にこの人の分で合っているか」をもう一度見る。
もし別の係が先にチェック済みなら、古い名簿へ二重に書き込まず、新しい名簿を見直す。
今回の admin/requests 画面も同じで、確認してから承認・却下し、競合時は最新状態へ戻す。

### 何をするか

この機能でできることは、依頼を選び、詳細を見て、確認してから承認または却下すること。
処理が成功したら一覧を更新し、古い情報で操作したときは新しい状態を取り直す。

### 今回作ったもの

`RequestQueuePanel` を整理し、依頼一覧、依頼詳細、確認ダイアログを分ける。
承認と却下は既存の admin API `POST /admin/requests/:noteId/resolve` を使う。
却下には理由を入力させ、他の管理者が先に処理した 409 `already_resolved` は専用メッセージと再読み込みで扱う。

### 専門用語セルフチェック

| 用語 | 簡単な意味 |
| --- | --- |
| mutation | データを変更する操作 |
| conflict | 同じ対象を複数人が触って状態がぶつかること |
| toast | 画面に短く出る通知 |
| dialog | 操作前に確認する小さな画面 |
| schema | 送るデータの形を決めるルール |

## Part 2: 技術者向け詳細

### TypeScript 型定義

```ts
type RequestNoteType = "visibility_request" | "delete_request";
type Resolution = "approve" | "reject";

interface RequestConfirmDialogProps {
  readonly kind: Resolution | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (note: string) => Promise<void> | void;
  readonly isDestructive?: boolean;
  readonly busy: boolean;
  readonly destructiveMessage?: string;
}

interface AdminRequestResolveBody {
  readonly resolution: Resolution;
  readonly resolutionNote?: string;
}
```

### APIシグネチャ

```http
POST /admin/requests/:noteId/resolve
Content-Type: application/json

{ "resolution": "approve" | "reject", "resolutionNote"?: string }
```

The route is implemented in `apps/api/src/routes/admin/requests.ts`.
The web helper is `resolveAdminRequest(noteId, body)` in `apps/web/src/lib/admin/api.ts`.
The shared schema is `adminRequestResolveBodySchema` and accepts `resolution` plus optional `resolutionNote` up to 500 characters.

### 使用例

```ts
await resolveAdminRequest(current.noteId, {
  resolution: confirming,
  ...(trimmedNote ? { resolutionNote: trimmedNote } : {}),
});
```

The UI should call this through `useAdminMutation` so duplicate submit guarding, auth handling, toast integration, and refresh behavior stay consistent with the admin mutation foundation.

### エラーハンドリング

| Status | Body | UI handling |
| --- | --- | --- |
| 400 | `invalid json`, zod message, `unsupported note type` | failure toast |
| 404 | `note not found`, `member_status_not_found` | not-found toast + refresh where useful |
| 409 | `already_resolved`, `currentStatus` | already-processed toast + `router.refresh()` |
| 422 | `invalid desiredState in request payload` | invalid request toast |

Reject with an empty note is stopped in the client dialog before calling the API.
Network failure and 5xx use the generic mutation failure toast.
Auth 401/403 handling remains owned by `useAdminMutation`.

### エッジケース

The selected item may disappear after refresh, so the panel must choose the next item or clear selection.
The dialog must disable submit and cancel while mutation is in flight to prevent duplicate calls.
The destructive style applies only to `delete_request` approve, not ordinary reject.

### 設定項目と定数一覧

| Name | Value |
| --- | --- |
| reject note max length | 500 |
| success path | remove resolved item locally and refresh |
| conflict path | toast + refresh |
| test extension | `*.spec.tsx` only |
| color policy | design tokens only, no HEX literals |

### テスト構成

| File | Coverage |
| --- | --- |
| `RequestQueuePanel.component.spec.tsx` | initial render, dialog open, destructive warning, 409 refresh, pagination, PII redaction |
| `RequestQueueDetail.spec.tsx` | details, labels, button callbacks, busy state |
| `RequestConfirmDialog.spec.tsx` | showModal/close, reject validation, 500-char limit, destructive style |

Phase 11 evidence for this NON_VISUAL task is `outputs/phase-11/manual-test.md`, which records focused Vitest, primitive adoption, and design-token grep gates as screenshot substitutes. Authenticated manual runtime/staging evidence remains outside the local close-out and is user-gated.

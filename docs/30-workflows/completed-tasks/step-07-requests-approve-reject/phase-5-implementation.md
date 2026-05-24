# Phase 5: 実装手順

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-4-test-plan
**次 Phase**: phase-6-test-additions

## 目的

phase-2 / phase-3 で確定した設計を最小差分で実装する手順を確定する。本仕様書はコード変更を伴うが、本 phase 5 ドキュメントは「実装する内容の手順書」であり、コード自体の commit は phase-13-pr で実行する。

## 変更対象ファイル一覧

| Path | 種別 | 概要 |
|---|---|---|
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | modify | hook 統合 / state 圧縮 / 409 handler |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | add | detail view |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | add | HTML5 `<dialog>` wrapper |

## 関数シグネチャ（再掲）

phase-2-design § 関数・型シグネチャ をそのまま採用。

## 差分方針

### 1. `RequestQueuePanel.tsx`（modify）

- 既存の useState 群（approveOpen / rejectOpen / target / note 等）を `useConfirmDialog` 1 つに置換。
- mutation 部分を `useAdminMutation` に置換し、`onSuccess` / `onError` callback で toast / refresh を扱う。
- list と detail の描画を `RequestQueueDetail` に委譲。
- dialog は `RequestConfirmDialog` に委譲。
- `isDestructive` は `type === 'delete_request' && kind === 'approve'` で決定。

擬似コード（要点のみ）:

```tsx
const router = useRouter();
const mutation = useAdminMutation<ResolveResp, ResolveBody>({
  endpoint: (noteId: string) => `/api/admin/requests/${noteId}/resolve`,
  method: 'POST',
  onSuccess: () => { toast({ kind: 'success', message: '処理しました' }); router.refresh(); },
  onError: (err) => { /* phase-2 §409 conflict 戦略 */ },
});

const confirm = useConfirmDialog({ requireNote: true });
```

### 2. `RequestQueueDetail.tsx`（add）

- props のみで pure な presentational component。
- design token 経由の色のみ使用。
- `type` label は `RequestNoteType` から map で解決。

### 3. `RequestConfirmDialog.tsx`（add）

- `useRef<HTMLDialogElement>(null)` を保持。
- `useEffect` で `open` true 時 `showModal()`、false 時 `close()`。
- reject 時 `<form method="dialog">` 内に `FormField` + `<textarea>` を配置。
- submit 時 reject なら note 必須、approve なら空文字許容。

### 4. import 規約

- `useAdminMutation` は `@/features/admin/hooks/useAdminMutation` から（CLAUDE.md 不変条件 10）。
- legacy `@/lib/useAdminMutation` への新規参照は追加しない。
- `useConfirmDialog` は step-06 で配置された path から import。

## 入出力・副作用（再掲）

phase-2-design § 入出力・副作用 を踏襲。

## 不変条件チェックリスト

- [ ] HEX 直書きなし（`verify-design-tokens` 想定）
- [ ] `process.env.*` 直接参照なし（CLAUDE.md `getEnv()` 経由）
- [ ] D1 への直接アクセスなし（API 経由のみ）
- [ ] FormField 経由（dialog 内 textarea）
- [ ] `*.spec.tsx` 拡張子のみ追加

## ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test apps/web --run -- RequestQueuePanel.component.spec.tsx
mise exec -- pnpm test apps/web --run -- RequestQueueDetail.spec.tsx
mise exec -- pnpm test apps/web --run -- RequestConfirmDialog.spec.tsx
mise exec -- pnpm build
```

## 完了条件

phase-1 AC-1〜AC-10 のうち AC-1〜AC-3, AC-7, AC-8 が実装上満たされ、AC-4〜AC-6, AC-9, AC-10 は phase-6 以降の test / 検証で確認される。

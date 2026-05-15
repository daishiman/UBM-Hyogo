# step-01-members-note 実装仕様書

**[実装区分: 実装仕様書 (UI mutation + shared hook)]**
**[直列順序: 1/5 | 前提: なし]**

## 1. 目的

MemberDrawer に note 作成/編集フォームを追加し、**useAdminMutation** hook を確立する。この hook は step-02..05 で再利用される共通基盤となる。

## 2. スコープ

- **新規実装**: `useAdminMutation` hook + `NoteForm` component
- **変更対象**: `MemberDrawer.tsx` 内容拡張
- **API**: `POST /api/admin/members/:memberId/notes` (実装済)
- **UI パターン**: form submit → mutation → toast + router.refresh()

## 3. 変更対象ファイル一覧

```
apps/web/src/features/admin/hooks/
  ├── useAdminMutation.ts (新規)
  └── index.ts (export 追加)

apps/web/src/features/admin/components/_members/
  ├── MemberDrawer.tsx (step-01 拡張: note section → form)
  ├── NoteForm.tsx (新規)
  └── index.ts (NoteForm export)

apps/web/src/features/admin/hooks/__tests__/
  └── useAdminMutation.spec.ts (新規)

apps/web/src/features/admin/components/_members/__tests__/
  └── NoteForm.spec.tsx (新規)
```

## 4. 設計

### 4.1 useAdminMutation hook

**役割**: admin endpoint への mutation（POST/PATCH） + 自動 server re-fetch + toast 通知

**シグネチャ**:
```typescript
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: {
    onSuccess?: (data: T) => void | Promise<void>;
    onError?: (error: Error) => void;
  }
): {
  trigger: (payload: unknown) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
};
```

**動作フロー**:
1. trigger(payload) 呼び出し
2. fetch(endpoint, { method, headers: {"content-type": "application/json"}, body })
3. 成功時 (2xx)
   - response.json() → onSuccess?(data)
   - router.refresh() (server re-fetch)
   - toast("✓ 保存しました")
4. 失敗時 (4xx/5xx)
   - response.json() → error field 抽出
   - onError?(error)
   - toast("✗ エラー: {message}")

**前提（parallel-08 / parallel-10 と連携）**:
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` を新規作成
- `apps/web/src/features/admin/hooks/index.ts` で `export { useAdminMutation, type UseAdminMutationOptions, type UseAdminMutationReturn } from "./useAdminMutation";` を提供
- step-02..07 はすべて `import { useAdminMutation } from "@/features/admin/hooks";` で import
- ToastProvider は **parallel-08** で root layout に配置済の前提 — 未配置の状態で本 hook を呼ぶと runtime error になる
- 401 / 403 ハンドリングは **parallel-10 (auth-session)** の `FetchAuthedError` / `AuthRequiredError` を再利用。hook 内部で再 throw して errorBoundary に委譲

**API error response shape (確認済)**:
```typescript
// apps/api/src/routes/admin/* の error response 統一形式
interface AdminErrorResponse {
  ok: false;
  error: string;        // error code (例: "DUPLICATE_PENDING_REQUEST")
  message?: string;     // user-friendly message
  details?: unknown;
}
```
- hook 内部の parse: `const msg = body.message ?? body.error ?? "サーバーエラー"; toast(\`✗ \${msg}\`);`
- 409 / 422 など特殊コードは step ごとに `onError` で個別 message にマッピング

### 4.2 NoteForm component

**役割**: member note 作成/編集フォーム

**Props**:
```typescript
interface NoteFormProps {
  readonly memberId: string;
  readonly initialBody?: string;
  readonly noteId?: string; // 編集時のみ
  readonly onSuccess?: () => void | Promise<void>;
}
```

**フォーム要素**:
- textarea: body（最小2文字、最大2000文字）
- submit button: "追加" (新規) / "更新" (編集)
- cancel button: フォーム close

**API Contract**:
```
POST /api/admin/members/:memberId/notes
{ "body": "text" }

PATCH /api/admin/members/:memberId/notes/:noteId
{ "body": "updated text" }

Response (201 / 200):
{ "ok": true, "note": { "noteId": "...", "body": "...", "createdAt": "...", "updatedAt": "..." } }
```

### 4.3 MemberDrawer 拡張

**現在の content 構成**:
- identity section
- status section
- audit log section

**追加内容**:
- notes section（下部に新規追加）
  - 既存 note 一覧（read-only）
  - NoteForm（新規/編集の toggle）

**state 管理**:
- `isEditingNote`: form 表示/非表示
- `editingNoteId`: 編集対象 note ID（null = 新規）

## 5. 関数・型シグネチャ

### useAdminMutation
```typescript
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: {
    onSuccess?: (data: T) => void | Promise<void>;
    onError?: (error: Error) => void;
  }
): {
  trigger: (payload: unknown) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
};
```

### NoteForm
```typescript
export function NoteForm({
  memberId,
  initialBody,
  noteId,
  onSuccess,
}: NoteFormProps): ReactNode;
```

### MemberDrawer (既存 export 継続)
```typescript
export function MemberDrawer({
  memberId,
  onClose,
}: MemberDrawerProps): ReactNode;
```

## 6. 入出力・副作用

### useAdminMutation
- **入力**: endpoint, method, payload
- **出力**: trigger 関数, isLoading boolean, error Error | null
- **副作用**: router.refresh(), toast(), fetch()

### NoteForm
- **入力**: memberId, initialBody?, noteId?
- **出力**: form HTML + submit button
- **副作用**: mutation trigger via useAdminMutation, onSuccess callback

### MemberDrawer
- **入力**: memberId, onClose
- **出力**: drawer + note section
- **副作用**: fetch member detail data (既存), NoteForm toggle

## 7. テスト方針

### useAdminMutation.spec.ts
- [✓] trigger 呼び出し → fetch 実行 (mock)
- [✓] 2xx 応答 → onSuccess 呼び出し + toast
- [✓] 4xx 応答 → toast error + onError
- [✓] isLoading state 遷移
- [✓] router.refresh() 呼び出し確認 (mock)

### NoteForm.spec.tsx
- [✓] form render (textarea + submit)
- [✓] textarea change → state update
- [✓] submit → mutation trigger
- [✓] validation: body 길이 체크
- [✓] success → onSuccess() callback

### MemberDrawer integration
- [✓] note section 표시
- [✓] NoteForm toggle (add/edit)
- [✓] mutation 後 note 一覧 재fetch

## 8. ローカル実行コマンド

```bash
# unit test
pnpm test apps/web --run -- useAdminMutation.spec.ts
pnpm test apps/web --run -- NoteForm.spec.tsx

# dev server (admin page)
pnpm dev
# → http://localhost:3000/admin/members (login 後)
# → member row クリック → drawer 표시
# → note section で form 操作

# smoke test
pnpm e2e:smoke
```

## 9. DoD (Definition of Done)

### 実装完了
- [✓] useAdminMutation hook 実装 + export
- [✓] NoteForm component 実装 + export
- [✓] MemberDrawer 拡張 (note section 추가)
- [✓] unit test green (useAdminMutation, NoteForm)

### 品質
- [✓] TypeScript strict mode
- [✓] design token 色 사용 (HEX 직書き 없음)
- [✓] JSDoc 주석 기재 (hook, component)
- [✓] accessibility: label ↔ input 关联

### 動作確認
- [✓] toast 通知 出现 (成功/失敗)
- [✓] mutation 後 drawer 內容 自動更新
- [✓] router.refresh() 実行確認
- [✓] 既存 admin smoke test PASS

## 10. リスク

1. **router.refresh() timing**: next.js 側の server re-fetch 遅延の可能性
2. **toast コンポーネント**: 既存 toast library 확인 필요 (依존 名 확認)
3. **fetch abort**: component unmount 時の cleanup

## 11. 前提

**なし。step-01 は entry point.**

## 12. 依存ライブラリ

### 既存（확인済）
- `next/navigation`: useRouter
- `react`: useState, useEffect, useTransition
- `@ubm-hyogo/shared`: type definitions

### 新規確認필요
- toast library (既存 components に記載?)

---

**Updated**: 2026-05-15
**Status**: Ready for implementation

# Phase 1 — 要件定義 (output)

## taskType / visualEvidence

- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 機能要件

1. `fetchAuthed` は 401 で `AuthRequiredError`、その他非2xx で `FetchAuthedError(status, body)` を throw する（既存挙動を検証で確認）。
2. mutation 共通 hook `useAdminMutation` を新規実装し、
   - 401 を catch すると現在 path から `/login?redirect=<encoded>` を生成して redirect する
   - 403 を catch すると `"権限がありません"` の alert toast を表示し、`error` state に格納してフォームを残す
   - その他エラーは `error` state に格納し `onError?.` を呼ぶ
   - 成功時は `onSuccess?.` と `router.refresh()` を呼ぶ
3. Toast は `role="status"`（既定）と `role="alert"`（destructive）を出し分け、`aria-live` 領域も `polite` / `assertive` に分ける。

## 非機能要件

- TypeScript strict (`exactOptionalPropertyTypes: true`) で型エラーゼロ
- vitest 単体実行で外部依存なし（fetchAuthed mock、redirector / toaster DI）
- a11y: alert role 出力時に `aria-live="assertive"`

## 制約

- API surface 変更禁止
- D1 直接アクセス禁止
- OKLch トークン正本
- `process.env.*` の直接参照禁止
- `apps/web` での bare `window` 参照禁止（`isBrowser()` 経由必須・`no-restricted-globals` lint）

## 完了基準

- 実装ファイルが `apps/web/src/features/admin/hooks/useAdminMutation.ts` に存在
- Toast 拡張が後方互換（既存 `toast(message)` 呼び出しを破壊しない）
- typecheck / lint / vitest / build すべて exit 0

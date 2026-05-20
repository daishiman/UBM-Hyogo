# Phase 9: QA

## 1. 自動 QA チェックリスト

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web test -- app/login
mise exec -- pnpm --filter @ubm/web build
```

すべて exit code 0 を確認。

## 2. 静的 a11y チェック

- `axe-core` または `@testing-library/jest-dom` の `toHaveNoViolations()` を任意で追加（既存 utility がある場合のみ）
- 手動 grep:

```bash
grep -n "aria-live\|aria-busy\|role=\"alert\"\|role=\"status\"" apps/web/app/login/loading.tsx apps/web/app/login/error.tsx
```

期待: loading.tsx に `role="status"` `aria-busy="true"` `aria-live="polite"` / error.tsx に `role="alert"` `aria-live="assertive"` が一意に存在。

## 3. 視覚 QA (visual regression)

- task-709 visual baseline に `/login`（throttled loading state）と `/login` error 状態が含まれているか確認
- 含まれていなければ本タスクでは追加せず、別 issue 化（task-709 scope）

## 4. 設計トークン QA

```bash
grep -nE "bg-\[#|text-\[#|border-\[#" apps/web/app/login/loading.tsx apps/web/app/login/error.tsx
```

期待: ヒット 0 件（HEX 直書き禁止 / task-18 `verify-design-tokens` gate を事前通過）。

## 5. 手動 a11y QA（任意）

- macOS VoiceOver で `/login` を navigate し、loading 中に "ログイン画面を読み込み中" がアナウンスされること
- error 強制発生時に h1 "ログイン画面でエラーが発生しました" が assertive アナウンスされること
- Tab キーで reset button にすぐ到達できること

## 6. QA 結果記録

`outputs/phase-9/qa-result.md` に上記コマンド出力と判定結果を記録（任意）。

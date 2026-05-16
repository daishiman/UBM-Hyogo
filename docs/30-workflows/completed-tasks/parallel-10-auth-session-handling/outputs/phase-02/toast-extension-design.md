# Phase 2.3 — Toast Extension Design

## 変更点

- `ToastItem` に `variant: "alert" | "status"` を追加
- `toast(message)` → `toast(message, variant?: "alert" | "status")` に拡張（既定 `"status"`）
- `<div aria-live="polite">` には `variant === "status"` のみ描画（`role="status"`）
- `<div aria-live="assertive">` を新設し、`variant === "alert"` を描画（`role="alert"`）
- 既存 `toast(message)` 呼び出しは optional 引数のため変更不要（後方互換）

## a11y

| variant | aria-live | role |
| --- | --- | --- |
| status (default) | polite | status |
| alert | assertive | alert |

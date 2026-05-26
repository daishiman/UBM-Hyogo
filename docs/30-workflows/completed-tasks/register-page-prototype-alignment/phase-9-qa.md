---
phase: 9
title: QA
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 9 — QA

[実装区分: 実装仕様書]

## 1. 手動 QA 観点

| 観点 | チェック内容 |
|------|-------------|
| ブラウザ | Chrome（latest） / Safari（latest） / Firefox（latest） で `/register` 描画一致 |
| 幅 | 360px / 768px / 1024px / 1440px の各 breakpoint で grid-3 → 1col 切替が機能 |
| Dark mode | `prefers-color-scheme: dark` 切替で OKLch 変数経由の色が破綻しない（HEX 0 件のため自動追従）|
| Keyboard | Tab で「Google フォームを開く」 / 「トップに戻る」 / 各 details summary / Bottom CTA を順送り可能。Enter / Space で details が toggle |
| SR | Hero heading が `<h1>` 配下の `<h2>`、各 section heading が `<h2>` で landmark 一貫 |
| 外部リンク | CTA を新規タブで開き、Google Form が表示。`rel="noopener noreferrer"` で `window.opener` が null |
| preview error | API を一時的に止めて `previewError` ブランチに入り、`role="alert"` が読み上げられる |
| reduced-motion | radial-gradient 背景に animation を付けない（Phase 5 §4 の通り static）|

## 2. 既存 snapshot / golden 影響

- `RegisterHeroCallout.component.spec.tsx` および `FormPreviewSections.component.spec.tsx` で snapshot を取得している場合、構造変更により diff が出る。意図的更新としてレビュー対象に明示し、Phase 10 で diff を要約する。
- Playwright visual baseline の `/register` フルページ baseline は本 PR で **更新しない**（既存 baseline 影響を最小化）。後続タスクで visual 更新する場合は別 issue 起票（unassigned-task-detection に列挙）。

## 3. 既知 NG パターンと対処

| 症状 | 対処 |
|------|------|
| `details` summary が SR で button として読まれない | 既存ブラウザ実装に依存。問題が出れば `role="button"` を追加せず、`<button>` ベース実装に切替（本 PR では native details 採用）|
| Hero の radial-gradient が low-contrast 警告 | `pointer-events: none` + `aria-hidden="true"` で装飾扱い |
| Bottom CTA inverted の text-on-dark contrast | OKLch 上で WCAG AA を満たすことを Phase 5 で確認済（`var(--text)` 反転 + `var(--panel)`）|

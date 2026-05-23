# Phase 3: 設計レビュー

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-2-design
**次 Phase**: phase-4-test-plan

## 目的

phase-2-design の設計を a11y / 409 conflict 戦略 / `<dialog>` 互換性 / design token 利用の 4 観点でレビューし、phase-4 以降に持ち越す未決事項を 0 にする。

## レビュー観点と判定

### 1. a11y

| 観点 | 判定 | 根拠 |
|---|---|---|
| dialog role | OK | HTML5 `<dialog>` の `showModal()` で自動的に modal role + focus trap |
| aria-labelledby | OK | dialog 内に `<h2 id="...">` を置き、`<dialog aria-labelledby>` で紐付け |
| label↔input | OK | `FormField` (CLAUDE.md 不変条件 9) で `<label htmlFor>` と `<textarea id>` を紐付け |
| ESC close | OK | `<dialog>` 標準挙動。`onClose` で state 更新 |
| busy 時 disabled | OK | submit / cancel button を `aria-busy` + `disabled` で表現 |
| destructive 表示 | OK | 色だけでなく「削除リクエスト承認」等の文言で識別 |

### 2. 409 conflict 戦略

| 観点 | 判定 | 根拠 |
|---|---|---|
| 全体再読込 (`router.refresh()`) | OK | step-01 確立 pattern。SSR fetch を再走しサーバ側状態と同期 |
| 段階的再読込（個別 item のみ refetch） | 不採用 | 隣接 item も他管理者が触っている可能性があるため全体 refresh が安全 |
| toast 文言 | OK | 「他の管理者が既に処理済みです」で原因を明示 |
| 404 / 422 との区別 | OK | error code で分岐し、固有メッセージを出す（phase-2 §409 conflict 戦略） |

### 3. HTML5 `<dialog>` 互換性

| 観点 | 判定 | 根拠 |
|---|---|---|
| iOS Safari 17.4+ | OK | `<dialog>` + `showModal()` は 17 系で安定。fallback Modal は導入しない |
| FireFox / Chrome | OK | 標準サポート |
| backdrop styling | OK | `dialog::backdrop` に token 経由で半透明色を指定可能 |
| polyfill 要否 | 不要 | 対象ブラウザ範囲（CLAUDE.md UI primitives）で native API 利用 |

リスク受容: 古い iOS（17 以前）では showModal が動作しない可能性があるが、admin 利用者のブラウザは最新 Chromium/Safari を前提とする（手動 QA で確認）。

### 4. design token 利用

| 観点 | 判定 | 根拠 |
|---|---|---|
| HEX 直書き | 禁止 / OK | tokens.css 経由のみ。`verify-design-tokens` CI gate で fail 判定 |
| approve / reject 色 | OK | `--color-action-primary` / `--color-action-secondary` |
| destructive 色 | OK | `--color-action-destructive` |
| dialog backdrop | OK | `--color-overlay` 経由 |

### 5. hook 再利用

| 観点 | 判定 | 根拠 |
|---|---|---|
| `useAdminMutation` (step-01) | OK | `@/features/admin/hooks/useAdminMutation` を直接 import |
| `useConfirmDialog` (step-06) | OK | `kind` + `requireNote=true` を渡して reject UX を統合 |
| legacy `@/lib/useAdminMutation` への参照 | 禁止 | CLAUDE.md 不変条件 10 |

## 未決事項

なし。phase-4 以降に持ち越す事項は無し。

## 承認

design は phase-2 で確定した内容のまま phase-4 (test-plan) に進める。

# Change Summary — issue-1063

Status: `implemented_local_evidence_captured`（コード変更済み・focused Vitest PASS）

本サイクルでは仕様書更新に加えて `apps/web` の 2 ファイルを変更した:

Applied edits:

- `apps/web/src/components/shell/shell-collapse-cookie.ts`
  - private ヘルパ `isSecureRuntimeContext()` を新設（`browserDocument()?.location.protocol === "https:"`）。
  - `serializeShellCollapsedCookie(collapsed, secure = isSecureRuntimeContext())` へ第2引数を追加し、`secure` true 時に末尾 `; Secure` を append。
  - `writeShellCollapsedCookie` / parser / reader / alias は無改修（後方互換）。
- `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`
  - `Secure` 属性の focused test（TC-1〜TC-6 相当）を追記。既存ケースは維持。

New files: 0（既存 serializer module 内に環境分岐を閉じ込める）。

User-gated（本サイクルで未実行）:

- Commit
- Push
- PR creation
- Browser smoke（DevTools Application タブでの Secure フラグ目視）
- GitHub Issue mutation（#1063 は CLOSED のまま・reopen しない）

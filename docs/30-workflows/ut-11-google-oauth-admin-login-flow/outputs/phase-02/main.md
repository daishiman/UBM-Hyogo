# Phase 2 成果物 — 設計サマリ（placeholder）

このファイルは Phase 2 実行時に確定する設計成果物の入れ物。`../../phase-02.md` を入力に、以下を本ファイルへ転記する。

- 採用構造の Mermaid 図（Browser → Google → callback → session 発行 → admin gate）
- モジュール設計表（`apps/web/src/app/api/auth/login/route.ts` 他）
- API contract（`/api/auth/login`, `/api/auth/callback/google`, `/api/auth/logout`, middleware）
- session JWT 構造（HS256 / claim 一覧 / TTL 24h）
- Cookie 属性表（`oauth_state`, `oauth_verifier`, `session`）
- env / secrets / redirect URI 3 環境表
- ホワイトリストパース仕様（lowercase 完全一致 / fail closed）

## 関連ファイル

- `outputs/phase-02/architecture.md` — Mermaid 構造図
- `outputs/phase-02/api-contract.md` — endpoint signature 一覧
- `outputs/phase-02/admin-gate-flow.md` — middleware 責務分離
- `outputs/phase-02/secrets.md` — env / secrets / redirect URI 表

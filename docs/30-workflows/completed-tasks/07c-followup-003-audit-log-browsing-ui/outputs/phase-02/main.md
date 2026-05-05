# Phase 2 設計サマリ

API は `GET /admin/audit`、repository は `auditLog.listFiltered`、web は `apps/web/app/(admin)/admin/audit/page.tsx` を中心に設計する。API response は raw `before_json` / `after_json` を返さず、`maskedBefore` / `maskedAfter` と `parseError` を返す。UI は masked view を再 mask し、DOM に raw PII を置かない。

admin gate は UI layout / proxy / API `requireAdmin` の二段防御を維持する。

cursor は base64url JSON `{ createdAt, auditId }`、order は `created_at DESC, audit_id DESC`。date range は JST 入力を UTC に変換し、`from <= created_at < toExclusive` で評価する。

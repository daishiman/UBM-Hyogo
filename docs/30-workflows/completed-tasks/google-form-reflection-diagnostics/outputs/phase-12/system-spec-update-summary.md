# Phase 12 strict — system-spec-update-summary

## `docs/00-getting-started-manual/specs/` への影響

| spec | 影響 | 対応 |
| --- | --- | --- |
| `01-api-schema.md` | なし | 既存 schema を read-only で参照するのみ |
| `02-auth.md` | なし | 既存 admin middleware を再利用 |
| `08-free-database.md` | なし | D1 schema 変更なし |
| `11-admin-management.md` | **候補: diagnostics 節追加** | Spec-A 完了後に `/admin/sync-status` の運用節を新規追加可能。本 Spec-A ではメモのみとし、追加実施は Spec-B/PR レビュー時に判断 |
| `13-mvp-auth.md` | なし | 認証境界変更なし |

## 結論

本 Spec-A は **基本的に specs 側を破壊しない**。`11-admin-management.md` への diagnostics 節追加は候補のみ記録し、追加判断は user に委ねる (Phase 8 D-11 / Spec-B 起票判断と同時)。

## メモ

将来 `11-admin-management.md` に追加する場合の節タイトル候補:

- 「Google Form 反映診断 (`/admin/sync-status`)」
- 「Member 別診断タブ (admin Drawer)」
- 「diagnostics endpoint のセキュリティ境界 (boolean-only secrets readiness)」

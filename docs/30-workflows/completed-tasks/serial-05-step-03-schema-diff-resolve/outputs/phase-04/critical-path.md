**[実装区分: 実装仕様書]**

# Phase 4: クリティカルパス — serial-05-step-03-schema-diff-resolve

## 1. Critical Path

```text
T0 current topology verification
  -> T1 page.tsx / server-fetch contract confirmation
  -> T2 SchemaDiffPanel hardening
  -> T3 postSchemaAlias contract confirmation
  -> T5 focused tests
  -> T8 visual evidence
```

## 2. Blocking Edges

| From | To | Reason |
| --- | --- | --- |
| T0 | T1 | Existing `SchemaDiffPanel` / `fetchAdmin("/admin/schema/diff")` を確認してから仕様を固定する |
| T1 | T2 | `{ total, items }` / `queued|resolved` を UI contract に反映する |
| T2 + T3 | T5 | UI feedback と API helper の分岐が揃ってから tests を更新する |
| T5 | T8 | visual evidence は focused tests green 後に取得する |

## 3. No-Go Conditions

- 新規 env `ADMIN_SCHEMA_RESOLVE_ENABLED` を導入する必要が出た場合は system spec update を再判定する。
- POST 422 / 409 / 202 を read-only fallback として扱う設計は不採用。
- Existing `SchemaDiffPanel` を無視して greenfield component を追加する変更は不採用。

## 4. Rollback

実装 wave で問題が出た場合は、`SchemaDiffPanel.tsx` / `api.ts` / related tests の hardening 差分のみを revert する。`page.tsx` の既存 `SchemaDiffPanel` 接続は現行実装なので撤去しない。

# Phase 8: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (local 受入確認) |
| 状態 | spec_created |

## 目的

正本 spec 群への差分追記を確定する。

## 11-admin-management.md 追記方針

`docs/00-getting-started-manual/specs/11-admin-management.md` の `/admin/schema` セクションに「rollback / undo」サブセクションを追加:

- 権限: admin（resolve と同等）
- rollback フロー: list → confirm modal（影響件数表示）→ API → audit log
- undo フロー: resolve 完了後 5 分以内のクイック取消トースト
- audit 記録項目: actor / aliasId / relatedAuditId / reason / rolledBackAt (`audit_log.after_json`)
- 不変条件: D1 直接修正は禁止（rollback / undo を必ず使用）

## 01-api-schema.md 追記方針

`docs/00-getting-started-manual/specs/01-api-schema.md` の admin endpoint 一覧に追記:

```
POST /admin/schema/aliases/:aliasId/rollback
  headers: If-Match: version=<N>
  body: { reason?: string }
  200: { aliasId, rolledBackAt, relatedAuditId, newVersion, impact: { affectedResponseCount, recomputeRequired } }
  400: If-Match 不正
  403: non-admin
  404: not_found / already_deleted
  409: version_mismatch
  500: batch_failed
```

## 完了条件

- [ ] 11-admin-management.md 追記済
- [ ] 01-api-schema.md 追記済

## 次 Phase

- 次: 9（local 受入確認）

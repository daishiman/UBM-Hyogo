# Phase 12 output: system spec update summary

[実装区分: 実装仕様書]

## 更新対象正本仕様

### docs/00-getting-started-manual/specs/11-admin-management.md

`/admin/schema` セクションに「rollback / undo」サブセクション追加:
- 権限: admin（resolve と同等）
- rollback フロー: HistoryPane list → confirm modal → API → audit log
- undo フロー: resolve 直後 5 分以内のクイック取消 toast
- audit 記録項目: actor / aliasId / relatedAuditId / reason / rolledBackAt
- 楽観ロック仕様: `If-Match: version=<N>` 不一致時 409
- 不変条件: D1 直接修正禁止、rollback / undo を必ず使用

### docs/00-getting-started-manual/specs/01-api-schema.md

admin endpoint 一覧に追加:
- `POST /admin/schema/aliases/:aliasId/rollback`
- request / response shape / error 体系（`outputs/phase-02/api-contract.md` 参照）

## 影響を受けるが本タスクで変更しない仕様

- `08-free-database.md`: schema 変更（`deleted_at` 列追加）は D1 一般原則の範囲内のため正本側追記不要
- `13-mvp-auth.md`: admin role 構造に変更なし
- `02-auth.md`: 影響なし

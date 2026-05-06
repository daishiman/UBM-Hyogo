# Phase 6: テスト計画

## 単体テスト

| テストファイル | ケース | AC マッピング |
| --- | --- | --- |
| `apps/api/src/repository/__tests__/auditLog.test.ts` | append → listByTarget('admin_member_note') ラウンドトリップ | AC-1, AC-4 |
| 同上 | listFiltered の複合 filter で targetType='admin_member_note' を分離取得 | AC-3 |
| 同上 | 既存 targetType='member' append が型・ランタイム両方で通る | AC-4 |

## ルートテスト

| テストファイル | ケース | AC マッピング |
| --- | --- | --- |
| `apps/api/src/routes/admin/requests.test.ts` | resolve 後 audit_log 行: targetType='admin_member_note' / targetId=noteId / after_json に memberId | AC-1 |
| `apps/api/src/routes/admin/audit.test.ts` | `?targetType=admin_member_note` で新規行のみ返す | AC-3 |
| 同上 | `?targetType=member` で旧仕様の legacy 行を引き続き返す | AC-2 |
| 同上 | cursor pagination が `targetType=admin_member_note` filter 下で壊れない | AC-3 |

## UI テスト（条件付）

| テストファイル | ケース |
| --- | --- |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | placeholder に新文言が表示されること（`getByPlaceholderText` 利用ケースの場合のみ） |

## 静的検証

| 検証 | コマンド |
| --- | --- |
| 型チェック | `mise exec -- pnpm typecheck` |
| リント | `mise exec -- pnpm lint` |
| 単体テスト（api） | `mise exec -- pnpm --filter @ubm-hyogo/api test` |
| 単体テスト（web） | `mise exec -- pnpm --filter @ubm-hyogo/web test` |

## カバレッジ要件

- `apps/api/src/repository/auditLog.ts` 既存 coverage を下げない
- `apps/api/src/routes/admin/requests.ts` resolve 経路の audit INSERT 分岐は新規テストで実行される
- 全体 coverage gate（80%）を維持

## 完了条件

- 上記すべてのテストが追加・更新済みであること
- `pnpm typecheck` / `pnpm lint` / 該当テストファイルがすべて green

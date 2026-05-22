# Phase 3: 影響範囲・依存マップ

[実装区分: 実装仕様書]

## 1. コード依存ツリー
```
GET /admin/members  (apps/api/src/routes/admin/members.ts)
├── requireAdmin                       (middleware/require-admin.ts)
├── attendanceProviderMiddleware       (middleware/repository-providers.ts)
├── writeTagNoteProviderMiddleware     (middleware/repository-providers.ts)
├── ctx({ DB })                        (repository/_shared/db.ts)
├── parseSearchOrError                 (local)
├── buildSearchSql                     (local)
├── SQL                                (D1: member_identities/member_responses/member_status/identity_aliases)
└── AdminMemberListViewZ               (@ubm-hyogo/shared)
```

## 2. 変更候補ファイル
| パス | 変更種別 | 想定変更 |
|------|---------|---------|
| `apps/api/src/routes/admin/members.ts` | 編集 | 500 直前で structured log (`logWarn`) 追加、view 構築の defensive normalize |
| `apps/api/src/repository/_shared/db.ts` | 編集（候補） | `prepare/.first/.all` の例外 wrap で context 付き再 throw |
| `scripts/smoke/runtime-attendance-provider.sh` | 編集 | non-200 で body を OUT_LOG に追記 |
| `apps/api/wrangler.toml` | 編集（条件付き） | `[env.staging]` の DB binding 確認・修正 |
| `apps/api/migrations/*.sql` | 新規（条件付き） | drift 検知時のみ |
| `apps/api/src/routes/admin/members.contract.spec.ts` | 編集 | 500 シナリオ用 regression test 追加 |

## 3. 影響を受けない範囲（変更禁止）
- Google Form schema 関連（fix MVP 仕様）
- `apps/web/*` 側コード（D1 直接アクセス禁止規約に従い、API 側のみ修正）
- alert-relay 関連（PR #853 で merge 済の本体は触らない）

## 4. Phase 3 DoD
- 依存ツリーが root cause 候補をすべて包含
- 変更候補ファイルと変更禁止範囲が明示
- production 影響無し（staging 環境のみ）であることを確認

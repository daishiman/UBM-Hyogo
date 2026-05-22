# Phase 5: テスト戦略

[実装区分: 実装仕様書]

## 1. 追加するテスト

### 1a. `apps/api/src/routes/admin/members.contract.spec.ts`
| ケース | 入力 | 期待 |
|--------|------|------|
| C1 | `publish_state='draft'`（enum 外）の member 1 件 | 200, `members[0].publishState='member_only'` |
| C2 | `publish_state='published'` / `'private'` | 200, `public` / `hidden` に正規化し `filter=published|hidden` から漏れない |
| C3 | `member_status` 行欠落により `public_consent` / `rules_consent` が LEFT JOIN 上 NULL 相当 | 200, それぞれ `'unknown'` |
| C4 | `public_consent='pending'`, `rules_consent='pending'` | 200, それぞれ `'unknown'` |
| C5 | `c.env.DB` 不在（mock） | 503 / `error="DB binding missing"` |
| C6 | zod safeParse を強制 fail させた場合 | 500 / `error="internal"` / `code="UBM-ADMIN-MEMBERS-500"` |

### 1b. `scripts/smoke/__tests__/runtime-attendance-provider.test.sh`（既存に追記）
- non-200 時 OUT_LOG に redaction 済み `body=...` が含まれること、失敗 route が `admin-list` と分かることを bash test で検証

## 2. 既存テスト不変条件
- `apps/api/src/routes/admin/members.contract.spec.ts` の現行ケースは regression なく PASS
- `pnpm --filter @ubm-hyogo/api test` の全件 PASS

## 3. 実行コマンド
```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- members.contract.spec
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 4. Phase 5 DoD
- 6 シナリオ + smoke 1 シナリオの test 仕様確定
- 既存テストの非破壊が宣言されている

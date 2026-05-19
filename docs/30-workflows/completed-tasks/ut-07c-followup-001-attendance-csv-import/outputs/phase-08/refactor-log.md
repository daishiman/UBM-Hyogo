# Phase 8 — リファクタリング履歴

## 抽出した pure function

| 関数 | 場所 | 抽出理由 |
| --- | --- | --- |
| `normalizeEmail(s)` | `apps/api/src/lib/email.ts` | service / parse-attendance / lookup 構築の 3 箇所で同じ NFKC + trim + lowercase が必要。1 箇所に集約し test 単体化 (F5) を可能にした |
| `classifyImportRow(row, index, lookup, existing)` | `apps/api/src/use-cases/admin/import-attendance-bulk.ts` (export) | 分岐 6 種（ok / duplicate / deleted_member / unknown_member / invalid 2 種）を service の loop 外に切り出し、F11 で単体テスト |
| `pickColumn(record, keys)` | `apps/web/src/lib/csv/parse-attendance.ts` | memberId / member_id / MemberId、email / Email / メール の正規化ロジックを 1 関数に閉じ込め |

## 設計上の不変条件（リファクタ後も維持）

1. service 層に Hono `Context` 型を持ち込まない（route がすべての binding を resolve して引数で渡す）
2. dry-run 時は D1 write 0 / audit_log 0（commit=false 時の早期 return）
3. commit 時は「全行 preflight ok の場合のみ insert」 — 部分コミットを構造的に禁止
4. audit_log は per-success-row append（`action='attendance.import.add'`）

## コード重複削除

| Before | After |
| --- | --- |
| route handler で `import-attendance-bulk` の引数を 4 行で組み立て | resolve 後そのまま渡す（変化なし。簡素な作り） |
| parse-attendance / service / contract で email 正規化を別実装 | `normalizeEmail` 経由に統一 |

## 命名整合

- `ImportRowStatus`: `ok | duplicate | deleted_member | unknown_member | invalid`
- HTTP error code: `payload_too_large` / `session_not_found` / `invalid_json` / `invalid_payload`

## DoD チェック

- [x] 全テスト GREEN（リファクタによる regression なし）
- [x] CLAUDE.md 不変条件 5（apps/web から D1 直アクセスなし）維持
- [x] 不変条件 8（`*.spec.{ts,tsx}` 規約）維持

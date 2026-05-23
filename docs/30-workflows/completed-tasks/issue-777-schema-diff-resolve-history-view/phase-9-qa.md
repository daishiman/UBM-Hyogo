# Phase 9: QA

## 1. 自動 QA チェックリスト

| 項目 | コマンド | 期待 |
|---|---|---|
| 型 | `mise exec -- pnpm typecheck` | exit 0 |
| Lint | `mise exec -- pnpm lint` | exit 0 |
| 対象 component spec | `mise exec -- pnpm --filter @ubm-hyogo/web test -- SchemaDiffHistoryPanel` | 4 観点（filter / pagination / 空状態 / fetch error）PASS |
| admin api helper spec | `mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/admin/__tests__/api.spec.ts` | `fetchSchemaAliasHistory` 関連ケース PASS |
| HEX 直書き grep | `grep -nE "#[0-9a-fA-F]{3,8}\|bg-\[#\|text-\[#" apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | ヒット 0 |
| HEX 直書き grep（route page） | `grep -nE "#[0-9a-fA-F]{3,8}\|bg-\[#\|text-\[#" apps/web/app/\(admin\)/admin/schema/history/page.tsx` | ヒット 0 |
| `.test.tsx` 命名違反 grep | `find apps/web/src/components/admin -name "*.test.tsx"` | ヒット 0（不変条件 #8） |
| data-page 重複 grep | `grep -rn "admin-schema-history" apps/web` | history page と spec の自身参照のみ |
| 直 `<input>` 増加 grep | `grep -nE "<input\\b" apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | ヒット 0（不変条件 #9・FormField 経由） |
| legacy useAdminMutation 参照 grep | `grep -rn "@/lib/useAdminMutation" apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx apps/web/app/\(admin\)/admin/schema/history/` | ヒット 0（不変条件 #10） |

## 2. 設計 QA チェックリスト

- [ ] `SchemaDiffHistoryPanel` は read-only / client helper fetch 経路を持ち、server wrapper からは search params のみ受け取る
- [ ] filter（操作者 email / 期間 from-to / question text 部分一致）が `FormField` 経由で構築されている
- [ ] cursor pagination は opaque string として受け渡され、UI 側で encode / decode を行わない
- [ ] `EmptyState` primitive で 0 件状態を描画している
- [ ] `Breadcrumb` primitive で `admin > schema > history` 階層を提供している
- [ ] 行に `data-audit-id` 属性を保持（followup-004 rollback 起動 anchor）
- [ ] `role="region"` + `aria-label="schema diff resolve 履歴一覧"` 等の landmark / label を持つ
- [ ] fetch エラー時は `role="alert"` で fail-soft 表示し、既存 items を破棄しない

## 3. CI 連動チェック（pre-push / GitHub Actions）

| Gate | 期待 |
|---|---|
| `verify-design-tokens` | PASS（HEX 直書きなし） |
| `verify-test-suffix` | PASS（`.spec.tsx` 命名のみ） |
| `verify-indexes-up-to-date` | drift なし（必要なら `mise exec -- pnpm indexes:rebuild`） |
| `verify-gate-metadata` | PASS（`artifacts.json` zod schema 整合） |
| `verify:phase12-compliance` | PASS（Phase 12 strict 7 outputs canonical heading） |
| `coverage-guard` (`--changed`) | 閾値低下なし |
| `playwright-smoke / smoke` | 既存 PASS 維持 |

## 4. 観測すべき regression 範囲

- 既存 `/admin/schema`（diff 一覧 page）が無影響であること（history route は別 path のため）
- 既存 `/admin/audit`（汎用監査ログ）の表示が無影響であること（案 A 採用時は audit endpoint 共有のため filter param 追加が他経路に副作用しないこと）
- admin 認証ガード（admin role でないと到達不可）が `/admin/schema/history` でも適用されること

## 5. coverage 観点

- `SchemaDiffHistoryPanel.component.spec.tsx` の 4 観点（AC-9）が網羅されているか
- `fetchSchemaAliasHistory` の正常系 / 4xx / 5xx / network error の 4 ケースが api.spec.ts に存在するか
- coverage 全体低下が `coverage-guard` に検知されないか（task-target は新規追加のため上昇方向）

## 6. PR 前最終 verify

```bash
bash scripts/verify-pr-ready.sh
```

`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証する。失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 順で切り分け。

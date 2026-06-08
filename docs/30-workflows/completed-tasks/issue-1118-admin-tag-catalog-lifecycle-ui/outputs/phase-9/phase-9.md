# Phase 9: 品質保証

`[実装区分: 実装仕様書]` / status: `completed`

本 Phase は implemented_local_evidence_captured のため、user-gated runtime/staging cycleで実行する**必須 gate と合格基準**を固定する（実行はuser-gated runtime/staging cycle）。判定は「PASS・実コード検証はuser-gated runtime/staging cycle」。

## 9.1 line budget / link / mirror parity 観点

| 観点 | 基準 | 確認方法（user-gated runtime/staging cycle） |
|------|------|--------------------------|
| line budget | 新規 4 ファイルは単一責務に収め肥大化させない。`tagCatalogLifecycle.ts` は pure helper のみ・`TagCatalogRow` は presentational のみ・`TagCatalogPanel` に state を集約 | 各ファイルの責務が Phase 2 トポロジ表と一致すること（混在なし） |
| link | phase-N.md 内の相対参照・index.md/SCOPE への参照が解決する。doc 間の見出し参照が壊れていない | `verify:phase12-compliance`（Phase 12）で canonical 見出し整合を検証 |
| mirror parity | root（`docs/30-workflows/.../outputs`）と本 outputs に分岐がない。artifacts.json の evidence_path が実在 | `gate-metadata:validate`（root/outputs 双方 scan・approver schema） |

## 9.2 必須 gate チェックリスト

| # | gate | 目的 | 実行コマンド | 合格基準 |
|---|------|------|--------------|----------|
| G1 | `pnpm typecheck` | 型不整合 0（descriptor 型・409 body 型・props 型） | `mise exec -- pnpm typecheck` | exit 0・error 0 |
| G2 | `pnpm lint` | lint 違反 0（unused import / 直書き input 等） | `mise exec -- pnpm lint` | exit 0・error 0（`--fix` 後手修正） |
| G3 | `verify-design-tokens`（AC-9） | OKLch token のみ・HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` reject | `mise exec -- pnpm verify:tokens`（または CI gate `verify-design-tokens`） | 新規 `.admin-tag-catalog-*` に HEX / arbitrary color 0・fail 判定なし |
| G4 | focused web test | 新規 3 spec が green・pure helper 100% | `mise exec -- pnpm --filter web exec vitest run src/components/admin/__tests__/tagCatalogLifecycle.spec.ts src/components/admin/__tests__/TagCatalogPanel.component.spec.tsx src/components/admin/__tests__/TagCatalogRow.component.spec.tsx` | 全 PASS・`tagCatalogLifecycle.ts` line/branch 100% |
| G5 | D1 直アクセス grep 0 件 | apps/web から D1 binding 直アクセス禁止（不変条件 4） | `rg -n "DB\\.|D1Database\\|env\\.DB\\|prepare\\(" apps/web/app/\\(admin\\)/admin/tags/catalog apps/web/src/components/admin/TagCatalog* apps/web/src/components/admin/tagCatalogLifecycle.ts` | 0 hit（新規ファイルに D1 直アクセスなし・API 経由のみ） |
| G6 | FormField 経由（不変条件 9） | admin の form input は直 `<input>` を増やさない | `rg -n "<input" apps/web/src/components/admin/TagCatalog*` | 直書き `<input>` 0（検索/filter が input を要する場合は `FormField` 経由） |
| G7 | useAdminMutation 経由（不変条件 10） | mutation は `@/features/admin/hooks/useAdminMutation` 経由・legacy 参照禁止 | `rg -n "useAdminMutation\\|@/lib/useAdminMutation" apps/web/src/components/admin/TagCatalog*` | import が `@/features/admin/hooks/useAdminMutation` のみ・legacy `@/lib/useAdminMutation` 参照 0 |
| G8 | `*.test.*` 不在（不変条件 8） | 新規 test は `*.spec.{ts,tsx}` のみ・`*.test.*` 禁止 | `rg -l --glob '*.test.ts' --glob '*.test.tsx' apps/web/src/components/admin/__tests__` | 該当ファイル 0（全 `*.spec.*`） |
| G9 | 非退化（AC-5） | 既存 TagQueuePanel / tag picker / 既存 spec を改変しない | `git diff --name-only`（user-gated runtime/staging cycle）で新規 4 + 編集 2（globals.css / nav）のみ・既存 spec 不変 | 変更ファイルが想定 6 ファイルに収まる |

## 9.3 各 gate の合格基準（詳細）

### G3 verify-design-tokens（AC-9・最重要）
- 新規 `.admin-tag-catalog-badge` / `.admin-tag-catalog-op` は `var(--status-success-bg)` / `var(--status-neutral-bg)` / `var(--status-danger-bg)` / `var(--ubm-color-danger)` 等の既存 OKLch token のみを参照する。
- `#xxxxxx` / `rgb(...)` / `oklch(...)` リテラル直書き・Tailwind arbitrary `bg-[#...]` / `text-[#...]` を新規追加しない。
- 合格 = gate が新規行を fail 判定しないこと。

### G4 focused web test
- `tagCatalogLifecycle.spec.ts`: parseTagLifecycleError 3 分岐 / availableOps 2 分岐 / descriptor・statusLabel を全網羅し pure helper **line/branch 100%**（Phase 7 §7.3）。
- `TagCatalogPanel.component.spec.tsx`: AC-1/AC-2/AC-3/AC-6/AC-7 の state 遷移を網羅（confirm なし→未呼出 / 409 referenceCount 表示 / 404 表示 / 冪等 success）。
- `TagCatalogRow.component.spec.tsx`: active=true→[logical,physical] / active=false→[reactivate,physical] の出し分けと文言（AC-4）。

### G5-G8 構造 gate
- user-gated runtime/staging cycleで上記 `rg` を実行し、いずれも期待件数（0 または 1）であること。1 件でも逸脱があれば修正してから次へ。

## 9.4 実行順序（user-gated runtime/staging cycle）

```bash
# 1. 依存
mise exec -- pnpm install
# 2. 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 3. token gate（AC-9）
mise exec -- pnpm verify:tokens
# 4. focused web test（+ coverage は Phase 7 §7.4 コマンド）
mise exec -- pnpm --filter web exec vitest run src/components/admin/__tests__/tagCatalogLifecycle.spec.ts src/components/admin/__tests__/TagCatalogPanel.component.spec.tsx src/components/admin/__tests__/TagCatalogRow.component.spec.tsx
# 5. 構造 gate（G5-G8 の rg）
```

## 9.5 完了条件（Phase 9）

- line budget / link / mirror parity 観点を固定した。
- 必須 gate（G1-G9）のチェックリストと実行コマンド・合格基準を固定した。
- token gate（AC-9）・D1 直アクセス禁止・FormField / useAdminMutation 経由・`*.test.*` 不在を gate 化した（実行はuser-gated runtime/staging cycle）。

# Phase 9: 品質保証

typecheck / lint / test / build を一括 PASS 判定する QA ゲート。各項目の PASS 基準を明示する。

## 1. 一括 PASS 判定（typecheck / lint / test / build）

| # | コマンド | PASS 基準 | 対応 AC/NFR |
|---|---|---|---|
| 1 | `mise exec -- pnpm typecheck` | 0 error | AC-5 / NFR-3 |
| 2 | `mise exec -- pnpm lint` | 0 error / 0 warning（`--fix` 適用後の残違反ゼロ） | AC-5 / NFR-3 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- "src/components/layout/__tests__/AdminTopbar.spec.tsx"` | TC-1〜TC-5 全 PASS | AC-4 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"` | **無修正で全 PASS**（既存契約 regression なし） | AC-3 / NFR-1 |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | `next build --webpack` success | NFR-4 |

## 2. inline JSX 除去確認（FB-UI-02-1 — 「ファイル削除」ではなく inline 除去）

本タスクはファイル削除ではなく **inline JSX の除去 + primitive 経由化**。PASS 基準は「layout.tsx に `data-shell="topbar"` の直書きが残っておらず、primitive 経由でのみ出力されること」とする。

```bash
# (1) layout.tsx 直下に topbar の直書きが残っていないこと（primitive 経由のみ）
grep -rn 'data-shell="topbar"' "apps/web/app"
# → 0 件（layout.tsx に直書きが残らない）であること

# (2) data-shell="topbar" は primitive 側に存在すること（移植先の確認）
grep -rn 'data-shell="topbar"' apps/web/src/components/layout/AdminTopbar.tsx
# → 1 件ヒット（AdminTopbar.tsx 内）

# (3) layout.tsx が AdminTopbar を import して呼び出していること
grep -n "AdminTopbar" "apps/web/app/(admin)/layout.tsx"
# → import 行 + <AdminTopbar /> 呼び出しの 2 件
```

- PASS: (1) が 0 件、(2) が 1 件、(3) が 2 件。
- breadcrumb slot / actions slot の data-component も layout.tsx 直書きから消え、AdminTopbar.tsx 側に存在することを併せて確認:

```bash
grep -rn 'data-component="admin-breadcrumb-slot"\|data-component="admin-topbar-actions"' "apps/web/app"
# → 0 件（layout.tsx に残らない）
```

## 3. OKLch トークン gate（verify-design-tokens 相当 — HEX 直書きゼロ）

色は `var(--ubm-color-*)` 経由のみ（CLAUDE.md UI 不変条件2 / AC-6）。新規 / 修正ファイルに HEX 直書き・任意値 color クラスがないことを grep で確認。

```bash
# 新規 primitive と修正 layout に HEX 直書きがないこと
grep -nE "#[0-9a-fA-F]{3,8}" apps/web/src/components/layout/AdminTopbar.tsx "apps/web/app/(admin)/layout.tsx"
# → 0 件

# bg-[#xxx] / text-[#xxx] の任意値 color クラスがないこと
grep -nE "(bg|text|border)-\[#" apps/web/src/components/layout/AdminTopbar.tsx "apps/web/app/(admin)/layout.tsx"
# → 0 件

# var(--ubm-color-*) 経由のトークン参照が移植されていること
grep -n "var(--ubm-color-border-default)\|var(--ubm-color-text-primary)" apps/web/src/components/layout/AdminTopbar.tsx
# → border-default / text-primary の 2 トークンがヒット
```

- PASS: HEX 0 件 / `*-[#` 0 件 / トークン参照ヒット。CI gate `verify-design-tokens`（task-18）相当の fail 条件に該当しないこと。

## 4. Server Component 境界 / 新規 visual 不導入

```bash
# AdminTopbar に client boundary が無いこと（不変条件5）
grep -n '"use client"' apps/web/src/components/layout/AdminTopbar.tsx
# → 0 件

# onClick / useState 等の client-only API が無いこと
grep -nE "useState|useEffect|onClick" apps/web/src/components/layout/AdminTopbar.tsx
# → 0 件
```

- PASS: いずれも 0 件（AC-7 / NFR-4: client bundle 増加なし）。

## 5. axe アクセシビリティ

- `AdminTopbar.spec.tsx` の TC-5 で既定描画 DOM の axe critical violation 0 を検証（NFR-2）。Step 3（unit test）の結果に含まれる。
- PASS 基準: axe critical violation 0。

## 6. 機能 QA チェックリスト

- [ ] props 省略時、breadcrumb slot にテキスト「管理」、actions placeholder に `aria-hidden="true"` が出る
- [ ] `breadcrumb` 注入時、slot wrapper（`data-component="admin-breadcrumb-slot"`）は維持され中身が差し替わる
- [ ] `actions` 注入時、wrapper から `aria-hidden` が外れ中身が出る
- [ ] `(admin)/layout.spec.tsx` の 5 selector（`data-shell="topbar"` / `data-shell="sidebar"` / `data-route="admin"` / `data-theme="cool"` / `data-route-group="admin"`）が抽出後も同一 DOM に出現
- [ ] grid 配置（`grid-rows-[auto_1fr]` の row1 に topbar）が抽出前と同一

## 7. 非機能 QA チェックリスト

- [ ] §1 の 5 コマンドが全 PASS
- [ ] `[project]/...` 仮想 module specifier が bundle に混入していない（`grep -r "\[project\]" apps/web/.open-next | head` が空）
- [ ] テストは `*.spec.tsx` で配置（不変条件 #8。`*.test.*` を新規追加していない）

## 8. mirror parity 等 — N/A（適用対象外）

本タスクは `apps/web` のソースコードのみを変更し、`.claude/skills/` ↔ `.agents/skills/` の skill mirror parity や D1 / API / Google Form schema には一切触れない。したがって以下は **N/A**:

| 項目 | 判定 | 理由 |
|---|---|---|
| skill mirror parity（`.claude` ↔ `.agents`） | N/A | skill ファイルを変更しない（仕様書 docs のみ） |
| D1 migration / schema | N/A | データアクセスを伴わない（不変条件 #5 / #7 継続） |
| API endpoint surface | N/A | `apps/api` を変更しない（既存 API のみ・新 endpoint 追加なし） |
| Google Form schema | N/A | フォーム仕様に非依存 |

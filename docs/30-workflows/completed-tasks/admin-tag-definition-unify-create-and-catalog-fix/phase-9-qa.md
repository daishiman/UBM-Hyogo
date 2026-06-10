# Phase 9 — 品質保証（QA）

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-8-refactor.md`](./phase-8-refactor.md)。
> line budget / link / 不変条件 gate を一括判定する。apps/web 実装と local verification は本 wave で完了し、browser/staging visual capture・commit・push・PR のみ user-gated。

## 1. Gate 一覧

| Gate | コマンド | 本 wave の状態 |
|------|---------|--------------|
| TypeScript | `mise exec -- pnpm typecheck` | PASS |
| Lint | `mise exec -- pnpm lint` | PASS（stablekey-literal warning 3 件は既存 warning） |
| Focused Vitest | `artifacts.json.metadata.verify_commands` に列挙 | PASS（7 files / 33 tests） |
| Design tokens | `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts` | PASS（91 tracked） |
| apps/api diff 空 | `git -C apps/api diff --stat`（空であること） | PASS |
| 旧 panel live import 0 | §2 の grep 手順 | PASS（旧 imports 0。`TagCatalogRow` の CSS class 名は再利用で許容） |
| describe.skip 旧参照 0 | §3 の grep 手順（FB-TASK-01/02） | PASS |
| `.spec` のみ | §4（`*.test.*` 不在） | PASS |
| Strict Phase 12 | file existence + root/output artifacts parity | spec wave で completed |

## 2. 旧 panel 削除証跡（live import 0）

統合で削除する `TagCatalogPanel` / `TagMasterPanel` が live import されていないことを証跡化する（FB-UI-02-1）。

```bash
# 実コードの参照を全列挙（テスト/コメント/describe.skip を目視除外して live import 0 を確認）
grep -rn "TagCatalogPanel\|TagMasterPanel" apps/web/ | grep -v node_modules
```

PASS 基準:
- `import` 文での参照（live import）が **0 件**。
- hit が残るのは「削除済みファイル自体が消えている」前提で、テストコメント等を除き 0。理想は **完全に 0 hit**（spec / page から旧参照を同 wave で除去するため）。
- 着手前 baseline（実コード裏取り・2026-06-09）では以下が live import:
  - `apps/web/app/(admin)/admin/tag-master/page.tsx:4,26`（`TagMasterPanel`）→ `TagDefinitionPanel` へ差替で消滅
  - `apps/web/app/(admin)/admin/tags/catalog/page.tsx:5,45`（`TagCatalogPanel`）→ redirect 化で消滅
  - `TagMasterPanel.tsx` / `TagCatalogPanel.tsx` 本体 → git delete
  - `*.spec.tsx`（`TagMasterPanel.spec.tsx` / `TagCatalogPanel.component.spec.tsx` / `page.spec.tsx:33`）→ 更新 or 削除
- 上記すべてを same-wave で処理した後、再 grep で 0 hit を証跡として `outputs/phase-9/` に貼る。

## 3. describe.skip 内旧参照 0（FB-TASK-01/02）

旧 component 名を `describe.skip` / `it.skip` 内に温存していないか確認:

```bash
grep -rn "describe.skip\|it.skip\|xdescribe\|xit" apps/web/src/components/admin apps/web/src/features/admin/components/_tags apps/web/app/\(admin\)/admin/tag-master apps/web/app/\(admin\)/admin/tags/catalog | grep -v node_modules
```

PASS 基準: 旧 `TagCatalogPanel` / `TagMasterPanel` を参照する skip ブロックが **0 件**。skip で延命せず、削除 or 内容差替する。

## 4. `.spec` のみ + HEX 0 + apps/api diff 空

```bash
# (a) *.test.* が新規に混入していないこと（不変条件 #7）
git diff --name-only dev...HEAD | grep -E "\.test\.(ts|tsx)$" || echo "OK: no .test files"

# (b) HEX 直書き 0（新規 .tag-definition-* スタイル含む）
mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts
grep -rnE "#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#" apps/web/src/styles/globals.css | grep -i "tag-definition" || echo "OK: no HEX in tag-definition styles"

# (c) apps/api / D1 migrations 無変更（不変条件 #1 / #13）
git -C apps/api diff --stat
git diff --stat -- apps/api migrations | grep -E "apps/api|migrations" || echo "OK: apps/api diff empty"
```

PASS 基準:
- (a) 新規 `.test.*` 0。新規テストは `*.spec.{ts,tsx}` のみ（AC-14）。
- (b) `verify-design-tokens` PASS。`.tag-definition-*` の色はすべて `var(--ubm-*)` 経由・HEX 0（AC-12）。
- (c) `apps/api` / migrations diff 空（AC-13）。GET/POST/PATCH/DELETE `/admin/tags` を読むだけで変更しない。

## 5. 不変条件 gate（一括判定）

| 不変条件 | 確認手段 | PASS 基準 |
|---------|---------|----------|
| #1 既存 API のみ | (c) + コードレビューで新 endpoint / fetch URL 確認 | 新 endpoint 0・fetch 先は既存 6 surface のみ |
| #2 D1 直接禁止 | grep `D1`/binding 参照 | apps/web に D1 binding 不在 |
| #3 OKLch トークン | (b) | HEX 0 |
| #4 primitives 準拠 | grep 新規 primitive | 新規 primitive 0（既存再利用） |
| #5 FormField 経由 | `TagDefinitionCreateForm` の input が FormField | 直接 `<input>` 増設 0 |
| #6 useAdminMutation | grep `@/lib/useAdminMutation`（legacy）新規参照 | legacy 新規参照 0・`@/features/admin/hooks/useAdminMutation` 使用 |
| #7 `.spec` のみ | (a) | `.test.*` 0 |
| #8 adapter で吸収 | `normalizeTagDefinitionList` 経由 | API 非変更で吸収 |
| #9 タグキュー不変 | `git diff -- apps/web/app/\(admin\)/admin/tags/page.tsx` | tags/page.tsx（catalog 以外）diff 空 |
| 型二重定義 | `grep -rn "interface TagDefinitionItem" apps/web/`（Phase 8 §2） | hit 1 件（lifecycle のみ） |

## 6. line budget / link gate

- 各 Phase 仕様書は単一責務・冗長重複なし（Phase 6-10 は本 wave 新規。1 Phase 1 ファイル）。
- 相互リンク: 各 Phase 冒頭の `_shared-context.md` / 前 Phase への相対リンクが解決すること（dangling 0）。
- AC 番号（AC-1〜AC-14）は Phase 1 と一致。Phase 7 §4 / Phase 10 §1 のトレーサビリティで全 AC 被覆。

## 7. Runtime 境界

本ワークフローは `implemented_local_runtime_pending`。§1〜§5 の local gate は本 wave で PASS。screenshot は `VISUAL_ON_EXECUTION` のため browser/staging runtime で取得し、commit / push / PR とともに user-gated として残す。

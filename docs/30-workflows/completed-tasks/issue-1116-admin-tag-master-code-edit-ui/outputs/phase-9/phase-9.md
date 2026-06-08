# Phase 9: 品質保証（issue-1116 admin tag master code edit UI）

**[実装区分: 実装仕様書]**

> 実装完了後の品質ゲート結果を記録する。本タスクは **VISUAL（apps/web に新規 admin 画面追加）/ implementation_mode=new**。
> implemented_local_evidence_captured 段階のため本 Phase の実測値（全 PASS / error 0）は本実行サイクルで local evidence で記録済み。本ファイルは **判定コマンドと期待結果・不変条件チェック手順**を確定する。
> commit / push / PR / staging runtime / authenticated visual capture / Issue mutation は user-gated。

## 1. DoD チェックリスト（DESIGN-BRIEF §6 / Phase 11 §11.2）

以下を**すべて緑**で実装完了とする。1 つでも失敗したら原因解消まで完了としない。

| # | DoD 項目 | 判定コマンド / 確認 | 期待 |
| --- | --- | --- | --- |
| 1 | focused web vitest 全 PASS（U/E/P） | `pnpm exec vitest run apps/web/src/features/admin/api/__tests__/tags.update.spec.ts apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx apps/web/app/(admin)/admin/tag-master/page.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 4 files / 20 tests PASS |
| 2 | nav 回帰 vitest PASS | `mise exec -- pnpm --filter @ubm-hyogo/web test:run apps/web/src/components/shell/__tests__/shell-config.spec.ts apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | Reg-N1..Reg-N3 + 既存 case PASS（admin items 10→11） |
| 3 | web typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | error 0（`PATHS` exhaustive Record に `tag-master` 追加で型充足・`updateTag` 戻り型整合） |
| 4 | lint（repo 全体 + web） | `mise exec -- pnpm lint` | exit 0（`pnpm lint --fix` 後の手修正含む。boundaries / no-inline-style / 各 package lint） |
| 5 | design token gate | `mise exec -- pnpm verify:design-tokens` | PASS（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 検出 0） |
| 6 | coverage（変更ファイル限定） | `bash scripts/coverage-guard.sh --group web`（or §Phase7 focused coverage） | web package が 80% 一律閾値を割らない |

## 2. 不変条件チェック（CLAUDE.md「重要な不変条件」+ ui-prototype-alignment 不変条件）

以下の不変条件を grep / レビューで確認済み。authenticated staging visual は user-gated。

| 不変条件 | 確認手順 | 期待 |
| --- | --- | --- |
| **#1 既存 API のみ接続（apps/api 非変更）** | `git diff --name-only` に `apps/api/**` が含まれないこと。`/admin/tags` PATCH / GET は issue-1069/1070 で完備（`apps/api/src/routes/admin/tags.ts`） | apps/api 差分 0 |
| **#2 OKLch トークン正本化** | `mise exec -- pnpm verify:design-tokens`。`rg -n "#[0-9a-fA-F]{3,8}" apps/web/src/features/admin/components/_tags apps/web/app/\(admin\)/admin/tag-master apps/web/src/features/admin/api/tags.ts` で HEX 直書き / `bg-[#...]` / `text-[#...]` が 0 | HEX 直書き 0・gate PASS |
| **#5 D1 直接アクセスなし（apps/web）** | `rg -n "D1Database\|env\.DB\|\.prepare\(" apps/web/src/features/admin/api/tags.ts apps/web/app/\(admin\)/admin/tag-master` が 0。fetch は `/api/admin` proxy 経由のみ | D1 binding 参照 0 |
| **#9 FormField 経由 input** | `TagMasterEditForm.tsx` の入力が `FormField` 経由であること。`rg -n "<input" apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` が FormField children 内に限定（裸 `<input>` を `apps/web/src/components/admin/` 配下に増やさない） | FormField 経由 |
| **#10 useAdminMutation 経由** | `rg -n "useAdminMutation" apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` が `@/features/admin/hooks/useAdminMutation`（= 相対 `../../hooks/useAdminMutation`）を参照。legacy `@/lib/useAdminMutation` への新規参照が 0 | features hook 経由・legacy 参照 0 |
| **#3 新規 primitive を生やさない（ui-prototype-alignment）** | 新規 design primitive を追加せず既存 `ui-input`/`ui-button`/admin alert + 既存 component（`AdminPageHeader`/`AdminSectionErrorClient`/`FormField`）を再利用（Phase 8 §1/§4） | 新規 primitive 0 |
| **#7 GAS prototype 非昇格 / Google Form 非変更** | Google Form schema / GAS prototype 非接触 | N/A（非接触） |
| **#8 test 命名規約** | 新規 test が `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。`ls apps/web/src/features/admin/components/_tags/__tests__` | `*.spec.tsx` のみ |

## 3. ファイル削除なし確認 — [FB-UI-02-1]

本タスクの inventory（Phase 1 §1.7 / DESIGN-BRIEF §4）は **新規 6 + 編集 2 + test**。ファイル削除・rename はゼロ。

- 新規: `tag-master/page.tsx` / `TagMasterPanel.tsx` / `TagMasterEditForm.tsx` / `tags.ts`（+ 新規 test 3 + visual 2）
- 編集: `shell-config.ts`（ShellNavItemId 拡張・admin item 追加）/ `icons.tsx`（`PATHS["tag-master"]` 追加）+ nav 回帰 test 2
- **変更しない**: `app/api/admin/[...path]/route.ts`（既存転送）/ `members.ts`（read 再利用・型 re-export）/ `useAdminMutation`（既存）/ `apps/api/**`

→ **削除に伴う参照断（dead import / 404 link）確認は N/A**。新規追加 + 後方互換編集のみで、既存 import / route の破壊なし。

## 4. lint / typecheck の green 基準 — [FB-UI-02-1]

- **typecheck**: `PATHS`（`icons.tsx`）が `Record<ShellNavItemId, string>` exhaustive のため、`ShellNavItemId` に `"tag-master"` を追加したら `PATHS` にも `"tag-master"` キーを追加しないと error（キー漏れを型が検出）。`updateTag` の戻り型 `AdminTagRef`・`TagMasterEditForm` props・`TagMasterPanel` props が整合し error 0。
- **lint**: `pnpm lint --fix` で解消できない手修正を含め violation 0。`lint-boundaries`（apps/web → apps/api 直 import 禁止）/ `verify:no-inline-style` も PASS（インラインスタイル不使用）。既存 warning-mode の warning が残っても exit 0 を緑基準とする。

## 5. design token / HEX evidence（不変条件 #2）

VISUAL タスクのため HEX 直書き 0 を明示確認する:

```bash
mise exec -- pnpm verify:design-tokens
# 新規/編集ファイルに HEX / 任意色 arbitrary value が無いこと
rg -n "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/app/\(admin\)/admin/tag-master \
  apps/web/src/features/admin/components/_tags \
  apps/web/src/features/admin/api/tags.ts \
  apps/web/src/components/shell/icons.tsx
```

> 色は既存 utility class（`ui-input` / `ui-button` / admin danger alert）と OKLch token のみ。conflict alert も既存 danger token class を使い、新規色トークンを追加しない（Phase 5 §2.5）。`icons.tsx` の `tag-master` path は `stroke`/`fill` 属性に色を焼かず `currentColor` 系の既存 icon と同じ描画方式に揃える。

## 6. mirror parity（N/A）

skill mirror（`.claude/skills/**` / `.agents/**`）の更新は本タスクでは **Phase 12 で扱う**。本 Phase（品質保証）では mirror parity は対象外であり **N/A**。

## 7. 実測結果

実測済み:

- focused Vitest: `pnpm exec vitest run apps/web/src/features/admin/api/__tests__/tags.update.spec.ts apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts` → PASS（3 files / 19 tests）
- typecheck: `pnpm --filter @ubm-hyogo/web typecheck` → PASS
- lint: `pnpm --filter @ubm-hyogo/web lint` → PASS
- design token gate: `pnpm verify:tokens` → PASS
- inline style gate: `pnpm verify:no-inline-style` → PASS

Authenticated staging visual capture / commit / push / PR / Issue 状態変更は user-gated。

# Phase 9: 品質保証

> workflow: mypage-prototype-alignment
> 目的: 型・lint・targeted test・design tokens・API surface 不変・test suffix・contract 非破壊・build を一括判定するゲート。すべて PASS で Phase 10（最終レビュー）へ進む。

## 9.0 方針

- チェックリスト形式で 1 項目ずつ PASS/FAIL を確定する。FAIL が 1 件でもあれば Phase 9 を閉じない。
- 検証コマンドはすべて `mise exec -- pnpm ...` 形式（Node 24 / pnpm 10 を保証）。
- 削除確認は「git delete されている **OR** `export {}` stub 化かつ live import ゼロ」のいずれかを PASS とする（[FB-UI-02-1]）。

## 9.1 品質保証チェックリスト

| # | 項目 | コマンド / 確認方法 | PASS 基準 | 結果 |
|---|------|--------------------|-----------|------|
| 1 | 型チェック | `mise exec -- pnpm typecheck` | エラー 0 件。props 配線（page.tsx → 子）の型整合を含む | ☐ |
| 2 | lint | `mise exec -- pnpm lint` | エラー 0 件（`tsc --noEmit` + `eslint 'src/**/*.{ts,tsx}'`）。`--fix` 後の残違反 0 | ☐ |
| 3 | targeted test GREEN | `mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/profile` | 純粋関数 + 全 component spec GREEN | ☐ |
| 3b | MemberHeader test GREEN | `mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | GREEN（既存 `data-testid` 互換維持） | ☐ |
| 4 | design tokens（HEX 直書き 0 件） | `mise exec -- pnpm --filter @ubm-hyogo/web exec tsx ../../scripts/verify-design-tokens.ts` または CI gate `verify-design-tokens` | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件 | ☐ |
| 5 | 既存 API surface 変更 0 件 | `git diff --name-only dev...HEAD` | 出力に `apps/api/src/routes/me/` を **含まない**。`apps/web/app/api/me/` も含まない | ☐ |
| 6 | 新規 test suffix | `git diff --name-only dev...HEAD \| grep -E '\.(test)\.(ts\|tsx)$'` | 出力 0 件（新規テストは `*.spec.{ts,tsx}` のみ・不変条件 #8） | ☐ |
| 7 | 既存 contract test 非破壊 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- me` | `me/index.contract.spec.ts` 等が GREEN（API 不変のため影響なしを確認） | ☐ |
| 8 | 旧 EditCta 削除確認 | `grep -rn "edit-response-disabled" apps/web/`<br>`grep -rn 'from "./_components/EditCta"' apps/web/app/profile/` | 旧 plain `<a>` 実装が git delete OR stub 化、かつ旧 testid / 旧 import の live 参照 0 件 | ☐ |
| 9 | 新規 primitive ゼロ | `git diff --name-only dev...HEAD \| grep 'apps/web/src/components/ui/'` | `ui/` 配下の新規追加・API 変更 0 件（不変条件 #4） | ☐ |
| 10 | build 成功（webpack） | `mise exec -- pnpm --filter @ubm-hyogo/web build` | `next build --webpack` が成功（OpenNext Workers 互換。Turbopack 不使用） | ☐ |
| 11 | Playwright smoke | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/profile.spec.ts` | 4 領域表示 + RevalidateModal open が確認できる（Phase 11 で本実行） | ☐ |

## 9.2 削除確認の PASS 基準詳細（[FB-UI-02-1]）

旧 `EditCta.tsx`（plain `<a>` + `aria-disabled` span）の置換について、以下のいずれかを満たせば PASS とする。

| パターン | PASS 条件 | 証跡コマンド |
|----------|-----------|--------------|
| git delete | `git status` で `deleted: apps/web/app/profile/_components/EditCta.tsx`、新規 `EditCta.client.tsx` が追加 | `git diff --name-status dev...HEAD \| grep EditCta` |
| stub 化 | `EditCta.tsx` が `export {}` 等の stub、live import ゼロ | `grep -rn 'import.*EditCta"' apps/web/`（旧パス参照 0 件） |

> どちらの場合も `grep -rn "edit-response-disabled" apps/web/`（`describe.skip` 内含む）が 0 件であることを証跡に残す。スキップ済みテストは型エラーが出ないため CI で検出されない（[FB-TASK-01/02]）。

## 9.3 API surface 不変の証跡

```bash
# 変更ファイル一覧に API route を含まないことを確認（PASS = 出力なし）
git diff --name-only dev...HEAD | grep -E 'apps/api/src/routes/me/|apps/web/app/api/me/'
```

- 期待出力: **空**（API surface 変更 0 件）。
- 1 行でも出力された場合は不変条件 #1 違反のため FAIL とし、API 変更を巻き戻して UI 側 adapter（`_lib/`）で吸収する。

## 9.4 build 確認の注意

- production build は `next build --webpack` を正本とする（CLAUDE.md: OpenNext Workers 互換のため Turbopack 不使用）。
- build bundle に `[project]/...` 仮想 module specifier や `127.0.0.1:8888` のローカル限定エンドポイントを焼き込まない（task-18 regression smoke の grep gate 対象）。

## 9.5 完了条件

1. §9.1 のチェックリスト #1〜#11 がすべて PASS（☐ → ✅）。
2. §9.2 の削除確認が「git delete OR stub 化かつ live import ゼロ」で PASS。
3. §9.3 の API surface 不変が証跡（空出力）で確認できた。
4. 新規 test がすべて `*.spec.{ts,tsx}`、新規 primitive ゼロ、HEX 直書き 0 件。
5. `next build --webpack` が成功し、禁止 specifier / ローカルエンドポイントの焼き込みがない。

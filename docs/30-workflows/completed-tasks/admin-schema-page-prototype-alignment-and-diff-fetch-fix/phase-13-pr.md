# Phase 13: commit-pr-release

[実装区分: 実装仕様書]

## PR メタ

| 項目 | 値 |
|------|---|
| base | `dev` |
| head | `feat/admin-schema-page-prototype-alignment-and-diff-fetch-fix` |
| title 案 | `feat(admin-schema): prototype alignment + diff fetch 404 fix` |

## PR 本文テンプレ

```markdown
## Summary
- Lane A: `/admin/schema/diff` 404 を staging で解消し、unit lane に regression contract spec を追加
- Lane B: `/admin/schema` page を `pages-admin.jsx` `SchemaDiffPage` プロトタイプに整合（page-head / current revision / stats grid-4 / panel / revisions+alias grid-2）
- Lane C: `SchemaDiffPanel` の diff カードを `schema-field-card diff-{type}` + `Chip` primitive に統一、`hideInlineStats` prop を追加
- Lane D: AdminSidebar の "schema" を「スキーマ」に統一
- Lane E: vitest 3 + Playwright 1 + contract 1 の回帰テスト追加

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/web test --run` PASS
- [ ] `pnpm --filter @ubm-hyogo/api test --run` PASS（D1 lane）
- [ ] `pnpm --filter @ubm-hyogo/web verify-design-tokens` PASS
- [ ] `pnpm --filter @ubm-hyogo/web build` PASS
- [ ] Playwright `admin-schema-page.spec.ts` baseline 取得（CI Linux）
- [ ] staging `/admin/schema` で 404 が消失し、UI がプロトタイプ構造で描画
```

## 実行手順

1. `git status` で漏れなし確認
2. `git diff dev...HEAD --name-only` で PR スコープを確定
3. `bash scripts/verify-pr-ready.sh`
4. commit / push / `gh pr create --base dev` — user-gated
5. PR URL を `outputs/phase-13/pr-creation-result.md` に記録

## User-gated boundary

- commit / push / PR 作成 — user 承認後
- staging deploy refresh（Lane A 修復のための redeploy が必要な場合は本 PR merge 前に user が実行）

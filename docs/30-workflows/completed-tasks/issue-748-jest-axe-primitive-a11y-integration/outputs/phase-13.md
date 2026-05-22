# Phase 13 — PR 作成

[実装区分: 実装仕様書]

> **注意**: 本タスク仕様書の作成プロンプトでは PR 作成しない。後続「03.実装.md」プロンプト実行後に本 Phase に従う。

## 13.1 PR メタ情報

| 項目 | 値 |
| --- | --- |
| base | `dev` |
| head | `feat/issue-748-jest-axe-primitive-a11y` |
| title | `test(web): jest-axe 統合で parallel-09 primitive a11y を実検証化 (Refs #748)` |
| labels | `area:web`, `area:testing`, `type:improvement` |

## 13.2 PR 本文テンプレート

```
## Summary
- parallel-09 primitive 5 種（FormField / EmptyState / Pagination / Icon / Breadcrumb）の Vitest spec を jest-axe + axe-core で実 a11y 検証に置換
- 共有 axe runner (`apps/web/src/test/axe.ts`) を新設し、jsdom false positive rule を baseline で disable
- aria 属性 proxy assertion のうち axe で代替可能なものを整理。固有契約値（aria-current 値・id 参照一致・size px 算出）は残置

## Why
issue #748 で指摘された通り、従来の aria 属性 assertion は「属性の存在」しか確認しておらず、role 整合 / name 不在 / aria-* 値違反等の real a11y 違反を検出できなかった。`jest-axe` 依存は既に追加済みだったが parallel-09 focused run では rule baseline 未確定で統合できていなかった。

## Scope
- 含む: spec 編集 + 共有 axe runner 新設
- 含まない: Playwright axe / Lighthouse a11y / parallel-09 範囲外 primitive

## Test plan
- [ ] `pnpm --filter web test -- apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` green
- [ ] `pnpm --filter web test` 全体 green
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] disable rule 3 種（color-contrast / region / landmark-one-main）以外で violation 0

Refs #748
```

## 13.3 PR 作成コマンド

```bash
gh pr create --base dev \
  --title "test(web): jest-axe 統合で parallel-09 primitive a11y を実検証化 (Refs #748)" \
  --body "$(cat <<'EOF'
<上記テンプレート>
EOF
)"
```

## 13.4 PR 作成前チェック

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` に以下のみ含まれる:
  - `apps/web/src/test/axe.ts`（新規）
  - `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx`（編集）
  - `docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/**`（仕様書 + evidence）
- [ ] evidence ログが `outputs/phase-11/` 配下に揃っている
- [ ] スクリーンショット項目は PR 本文に**含めない**（NON_VISUAL）

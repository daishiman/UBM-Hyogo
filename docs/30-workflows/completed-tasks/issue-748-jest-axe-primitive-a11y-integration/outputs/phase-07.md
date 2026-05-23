# Phase 7 — 検証

[実装区分: 実装仕様書]

## 7.1 受入条件マッピング

| AC | 検証方法 | 期待 |
| --- | --- | --- |
| AC-1 | `parallel09-primitives.component.spec.tsx` を実行し、5 primitive / 7 axe scenarios が green | green |
| AC-2 | `apps/web/src/test/axe.ts` を読み、`configureAxe({ rules })` で disable rule がコメント付きで明示されている | 目視確認 |
| AC-3 | 同上、disable 理由（jsdom 制約）が記載されている | 目視確認 |
| AC-4 | aria assertion を proxy assertion と component 固有 contract assertion に再分類し、後者は残す | spec review |
| AC-5 | canonical 置換: `expect.extend` を使わず既存 inline pattern へ統一する | `rg "toHaveNoViolations" apps/web` で 0 件 |
| AC-6 | `pnpm --filter web test` が local green。CI workflow は Phase 13 user-gated PR 作成後に確認する | local green / CI pending user gate |
| AC-7 | `apps/web/src/test/axe.ts` が存在 | ls 確認 |
| AC-8 | `expect.extend` 未使用、`results.violations.toHaveLength(0)` で統一 | grep 確認 |

## 7.2 検証コマンド一式

```bash
# (1) 単体 spec
mise exec -- pnpm --filter web test -- apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx

# (2) apps/web 全体
mise exec -- pnpm --filter web test

# (3) typecheck
mise exec -- pnpm typecheck

# (4) lint
mise exec -- pnpm lint

# (5) 削除確認
rg "screen.getByRole\\(\"navigation\", \\{ name: \"pagination\" \\}\\)" apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx  # 0 件
rg "expect.extend|toHaveNoViolations" apps/web/src vitest.config.ts  # 0 件

# (6) 共有 module 存在確認
ls apps/web/src/test/axe.ts
```

## 7.3 回帰確認

| 観点 | コマンド | 期待 |
| --- | --- | --- |
| 既存 admin a11y spec | `pnpm --filter web test` 全体実行に含める | green |
| design tokens gate | `pnpm --filter web test` 全体実行に含まれる `tokens.runtime.spec.ts` で確認 | green |

## 7.4 NG 時のロールバック判断

- `color-contrast` 等の rule disable で false negative が新規に判明した場合 → Phase 10 を参照
- jsdom 制約以外で fail する場合は primitive のコード修正で対応（本タスクスコープ内で許容）

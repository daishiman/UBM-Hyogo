<!-- workflow: members-list-ux-clarity / task: C / phase: 7 -->

[実装区分: 実装仕様書]

# Phase 7 — カバレッジ (Task C)

## 1. coverage 対象

| ファイル | 既存 coverage | 期待 coverage |
| -------- | ------------- | ------------- |
| `apps/web/app/(public)/members/page.tsx` | 既存 page.spec.tsx で line ≥80% | 件数 prop 注入経路（ok / !ok / 0件）3 分岐をすべてカバー |

## 2. 静的整合ゲート

| gate | 期待 |
| ---- | ---- |
| `pnpm typecheck` | GREEN |
| `pnpm lint` | GREEN |
| `pnpm verify-design-tokens` | GREEN |
| coverage threshold (3 source sync: codecov.yml / vitest.config / CI workflow) | 既存 threshold 維持 (本 task で変更なし) |

## 3. 例外

Playwright spec 自体は coverage 対象外（E2E layer）。

## DoD

- [x] coverage 期待値が AC マッピング付きで記述
- [x] 静的整合ゲート期待値が明示

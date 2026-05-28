<!-- workflow: members-list-ux-clarity / task: B / phase: 9 -->

[実装区分: 実装仕様書]

# Phase 9 — 品質保証 (Task B)

> 前提: Phase 5-8 GREEN

## 1. 一括判定項目

| カテゴリ | 検証 | コマンド / 確認方法 |
| -------- | ---- | ------------------- |
| 型安全 | `typecheck` | `mise exec -- pnpm --filter @ubm/web typecheck` |
| Lint | `eslint` | `mise exec -- pnpm --filter @ubm/web lint` |
| Unit | 全 vitest GREEN | `mise exec -- pnpm --filter @ubm/web vitest run src/components/public/__tests__/` |
| Design tokens | HEX 直書き 0 | `mise exec -- pnpm verify-design-tokens` |
| 既存 spec 互換 | `members-prototype-alignment.spec.ts` selector が引き続き機能 | 既存 Playwright spec ファイルを `git diff` で確認 (selector が `SelectedTagsBar` を直接参照していたら対応要) |
| 後方互換 | `SelectedTagsBar` の旧 API が wrapper で動く | `git grep -n "SelectedTagsBar" apps/` で参照箇所を列挙し、wrapper が呼び出される経路に変わっていることを確認 |
| URL query 不変 | chip × 個別解除で URL key 削除のみ | TC-B-MF-06 で検証済 |
| aria-live 一意性 | `<output aria-live>` は 1 箇所のみ | `git grep -n 'aria-live' apps/web/src/components/public/` で 1 件確認 |
| 新 primitive 追加 0 | `apps/web/src/components/ui/` 配下に新規ファイル無し | `git status apps/web/src/components/ui/` |

## 2. line budget / link / mirror parity

- 推定 LOC 差分 +260 / -60 を実測と突合 (`git diff --stat`)
- `phase-2-design.md` / `phase-5-implementation.md` のリンク先がすべて実在
- `.agents/` mirror は本 task 範囲外 (skill 修正なし)

## 3. CI gate 想定

| gate | 期待 |
| ---- | ---- |
| `verify-design-tokens` | PASS |
| `verify-test-suffix` | PASS (`.spec.tsx` のみ) |
| 既存 Playwright (Task C で再撮影前) | 既存 baseline は selector 不変なら PASS。Drift があれば Task C で再撮影 |

## 4. DoD

- [ ] § 1 の全項目 GREEN
- [ ] LOC 差分が見積範囲内 (大幅超過してないこと)
- [ ] aria-live が 1 箇所だけ
- [ ] `SelectedTagsBar` 旧 API 後方互換維持

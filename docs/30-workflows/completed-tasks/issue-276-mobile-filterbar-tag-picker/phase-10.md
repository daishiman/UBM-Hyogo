# Phase 10: リファクタリング

[実装区分: 実装仕様書]

## メタ情報

| Phase | 10 |
| 前提 | Phase 9 完了 |
| 後続 | Phase 11 |

## 目的

Phase 8 で挙がった課題を対応し、重複・命名・props 過多を是正する。

## 実行タスク

1. Phase 8 review-report の TODO 全件解消
2. `MemberFilters.client.tsx` の責務分離が崩れていないか確認、必要なら sub-component 追加
3. `aggregateTopTags` の SQL を共通 helper に切り出すか検討（過剰なら no-op で OK）
4. 命名整理: `topTags` / `candidates` / `selected` の用語統一を確認

## 制約

- リファクタリングで AC を壊さないこと
- 全 phase 4 のテストが green のまま

## 完了条件

- [ ] Phase 8 課題が全件 close
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green
- [ ] 機能差分なし（AC マトリクス再確認）

## 成果物

- `outputs/phase-10/refactor-summary.md`

## タスク100%実行確認【必須】

- [ ] Phase 8 review-report 全項目に対応状況を追記

## 次Phase

Phase 11 へ。

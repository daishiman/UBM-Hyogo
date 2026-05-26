# Phase 7: 品質ゲート

## Gate-A: 仕様レビュー

| 項目 | 判定基準 |
|------|---------|
| Phase 1-13 が canonical heading で揃っている | `bash scripts/verify-phase12-compliance.sh`（または同等手順）で pass |
| `KIND_ROUTE` の設計が exhaustive である | `satisfies Record<FieldKind, KindRoute>` が含まれる |
| `url` route が data loss しない | `linkSections` が生成され、`MemberDetail` が `MemberLinks` へ渡す |
| docs-only 判定でない | 実装区分が「実装仕様書」になっている |
| スコープが 1 サイクル完結 | Phase 3 タスクリストに先送りタスクが無い |

## Gate-B: 実装レビュー

| 項目 | 判定基準 |
|------|---------|
| `pnpm typecheck` | green |
| `pnpm lint` | green |
| `pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts` | green |
| `pnpm --filter @ubm-hyogo/web build` | green |
| 既存 8 ケース + 新規 6 ケース | 全 green |
| `MemberDetail` が既存 `MemberLinks` を描画する | `linkSections` を `toLegacySections` 経由で渡す |
| `__testInternals` が production code から参照されていない | `rg "__testInternals" apps/web/src -g '!**/__tests__/**' -g '!**/lib/adapters/member-detail.ts'` が空 |
| visual baseline diff | 無 or 意図差分のみ（`outputs/phase-11/visual-diff-rationale.md` に記録） |

## Gate-C: 外部運用（user-gated）

| 項目 | 判定基準 |
|------|---------|
| commit | ユーザー指示後に実施 |
| push | 同上 |
| PR 作成（base: dev） | 同上 |
| visual baseline 更新コミット | 同上 |

## CI gate（自動）

| gate 名 | 期待 |
|--------|------|
| `verify-indexes-up-to-date` | drift なし（本仕様は indexes に影響しない見込みだが pre-push hook で fail したら `pnpm indexes:rebuild` を実行） |
| `verify-test-suffix` | 新規ファイル無し（既存 `.spec.ts` を編集するのみ） |
| `verify-design-tokens` | 本仕様は色変更なしで影響無し |
| `playwright-smoke` / `visual` | baseline 更新時のみ再生成・コミット |
| `verify-phase12-compliance` | `phase-12-documentation.md` の canonical 9 headings を満たす |

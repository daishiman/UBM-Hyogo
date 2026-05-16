# Phase 04: タスク分解 (WBS)

[実装区分: 実装仕様書]

## 目的

Phase 03 の設計を実装ステップに WBS 分解し、Phase 05 の手順入力にする。

## 入力

- `phase-03.md`（テストファイル構成 / 5 describe / assertion 戦略）

## WBS

| # | ステップ | 出力 | 依存 |
| --- | --- | --- | --- |
| W-1 | `packages/shared/src/__tests__/` ディレクトリ存在確認・なければ作成 | dir | なし |
| W-2 | `type-contracts.spec.ts` 新規作成（import header） | header | W-1 |
| W-3 | AC-1 describe 実装（ResponseId / ResponseEmail 相互排他） | block 1 | W-2 |
| W-4 | AC-2 describe 実装（view-model 必須 field 欠落） | block 2 | W-2 |
| W-5 | AC-3 describe 実装（zod input/output parity） | block 3 | W-2 |
| W-6 | AC-4 describe 実装（public/admin schema 排他） | block 4 | W-2 |
| W-7 | AC-5 describe 実装（meta-assertion: 単独実行可能性） | block 5 | W-2 |
| W-8 | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` 実行 | typecheck PASS | W-3..W-7 |
| W-9 | `mise exec -- pnpm --filter @ubm-hyogo/shared test` 実行 | test PASS / 15 件追加 | W-8 |
| W-10 | `mise exec -- pnpm typecheck` 全体実行 | 全体 PASS | W-9 |
| W-11 | `mise exec -- pnpm test` 全体実行（apps/api 442 件含む regression なし確認） | 全体 PASS | W-10 |

## 並列性

W-3..W-7 は同一ファイル内編集のため逐次実行。W-8 以降は前ステップ依存で逐次。

## 出力

- 本 phase 仕様書のみ。

## 完了条件 (DoD)

- [ ] WBS 11 ステップが依存関係付きで列挙されている。
- [ ] 各ステップの出力物が明示されている。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| W-9 で他 spec を巻き込み regression | `--filter @ubm-hyogo/shared` で scope 限定 |
| W-11 で apps/api テストが何らか fail | 本タスクの shared 変更は型 import のみで runtime 影響なしのため、fail した場合は別原因を疑い rollback せず原因切り分け |

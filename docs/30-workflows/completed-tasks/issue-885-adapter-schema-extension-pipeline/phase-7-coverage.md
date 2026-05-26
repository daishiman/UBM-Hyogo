# Phase 7: カバレッジ

## 1. カバレッジ評価方針

本タスクは README + コメントブロック追加のみで、`member-detail.ts` の実装行に変更を加えない。よって c8 / vitest line / branch coverage に対する差分は **0**。

| 指標 | 期待差分 |
|---|---|
| `member-detail.ts` line coverage | ±0% |
| `member-detail.ts` branch coverage | ±0% |
| `apps/web` 全体 coverage | ±0% |

## 2. コマンド

```bash
pnpm --filter @ubm-hyogo/web test:coverage -- member-detail.spec.ts
```

実行結果で `member-detail.ts` の coverage が serial-06 完了時点の値（100% 想定）から下がっていないことを確認する。

## 3. coverage が下がった場合の対応

下がっていれば README / spec template の追加で **意図せず** ロジックが変わった可能性が高い。Phase 5 の変更差分を `git diff apps/web/src/lib/adapters/member-detail.ts` で再確認し、コード本体に手が入っていれば revert する。

> 本タスクの仕様上、`member-detail.ts` 本体には絶対に手を加えない。

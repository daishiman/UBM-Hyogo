# Phase 7: カバレッジ

## 1. 対象

`apps/web/app/profile/loading.tsx` 単一ファイル。条件分岐・hooks・副作用なしの単純な Server Component。

## 2. 期待カバレッジ

| 指標 | 目標 |
|---|---|
| Statements | 100% |
| Branches | N/A（条件分岐なし） |
| Functions | 100%（default export 1 関数） |
| Lines | 100% |

Phase 4 §3 の focused 3 tests を通せば自然に達成する。

## 3. 計測コマンド（任意）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage app/profile/loading.spec.tsx
```

`apps/web/vitest.config.ts` に coverage provider 設定があれば数値が表示される。なければ計測不要（本タスクの coverage は scope size 上 review 不要）。

## 4. 全体テスト再実行（regression 確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
```

profile 配下の他テスト・shared layout テストが壊れていないことを確認。

## 5. coverage-guard pre-push の挙動

- 本タスクは新規 spec 1 件追加・既存テスト削除なしのため、`scripts/coverage-guard.sh` の `--changed` モードでも閾値低下は発生しない見込み。
- もし他タスクの merge 影響で coverage が一時的に下がっても、sync-merge コミットを含む push は自動 skip される（CLAUDE.md の sync-merge ポリシー）。

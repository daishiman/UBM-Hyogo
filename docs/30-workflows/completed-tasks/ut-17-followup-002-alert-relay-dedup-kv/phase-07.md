# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

## 目的

変更ブロック（dedup 部分）の line / branch カバレッジを実測する。Phase 7 では全体ではなく**変更行**にスコープする（[Feedback BEFORE-QUIT-002] / [Feedback 5]）。

## 対象

| ファイル | 対象範囲 |
|---------|---------|
| `apps/api/src/routes/internal/alert-relay.ts` | dedup ブロック（`get` / `put` 周辺）と `dedupeKey` 構築 |

## 実行コマンド

```bash
mise exec -- pnpm --filter @repo/api test alert-relay --coverage
```

## 目標

| 指標 | 目標値 |
|------|--------|
| `alert-relay.ts` の dedup ブロック line coverage | 100% |
| 同 branch coverage | 100%（KV get null / not-null、TTL 経過、`put` 成否） |

## 完了条件

- [ ] 目標値を実測で達成
- [ ] 未達のブランチがあれば Phase 6 へ戻して追加ケースを書く
- [ ] `outputs/phase-07/coverage.md` に実測値を貼る
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 7
- status: completed

## 目的

テストカバレッジと対象範囲を確認する。

## 実行タスク

- focused coverage scope を確認する。

## 参照資料

- `outputs/phase-07/coverage.md`

## 成果物/実行手順

- `outputs/phase-07/coverage.md`

## 完了条件

- [x] coverage 方針が記録されている

## 統合テスト連携

- alert-relay focused test を主要証跡とする。

# Phase 7: Coverage

## 計測コマンド

```bash
mise exec -- pnpm --filter web test -- --coverage \
  TagQueuePanel AdminSectionErrorClient server-fetch
```

## 期待

- 新規 / 変更行に対するライン被覆率 ≥ 90%
- 既存 web 全体の閾値（`vitest.config.ts` / codecov.yml で管理されている値）を下回らないこと

## 退避基準

カバレッジが既存閾値を 1pt 以上下回る場合は、退避せずテスト追加する。閾値を下げる変更は本タスクのスコープ外。

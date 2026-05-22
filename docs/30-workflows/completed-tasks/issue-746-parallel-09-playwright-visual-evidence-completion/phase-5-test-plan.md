# Phase 5: テスト計画

[実装区分: 実装仕様書]

## 1. テスト対象

`apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts`（既存・6 test × 各 1x+2x の合計 12 screenshot 生成）

## 2. 追加テスト

新規テストは追加しない。本タスクは既存 spec を **実行** することが目的。

## 3. 再現性確認

同じコマンドを 2 回実行し、いずれも 0 fail / 12 PNG 生成を確認:

```bash
# Run 1
mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line | tee /tmp/parallel09-run1.log

# 12 PNG 確認後、削除して Run 2
rm docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/*.png

# Run 2
mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line | tee /tmp/parallel09-run2.log
```

両 run で `passed (X)` が同じであることを確認。

## 4. 期待結果

| 観点 | 期待 |
|------|------|
| spec exit code | 0 |
| 失敗 test 数 | 0 |
| flaky test 数 | 0 |
| 生成 PNG 数 | 12 |
| 各 PNG サイズ | ≤ 500KB |
| 各 PNG が空ファイルでない | `[ -s file.png ]` 真 |

## 5. 非機能テスト

- **disk pressure**: Step 6 実行中に `df -h` を別ターミナルで watch し、空き容量が ≥ 2Gi を維持すること
- **dev server stability**: `/tmp/parallel09-dev.log` に fatal error / unhandled rejection が出ていないこと

## 6. テスト失敗時の挙動

| 症状 | 一次対処 |
|------|----------|
| `Target closed` / hydration error | dev server log を確認し再起動 |
| selector not found | harness route が 404 → `apps/web/app/visual-harness/[name]/page.tsx` の name 分岐確認 |
| ENOSPC | phase-10 runbook 適用 |

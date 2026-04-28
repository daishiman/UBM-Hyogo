# Phase 6 — テスト拡充 main

## 拡充サマリー

| 系統 | 件数 | 状態 |
| ---- | ---- | ---- |
| F（Fail path） | 11 件中 9 件をテスト実装、残 2 件は仕様 trace（F-3 / F-4 / F-5 は F-2 と統合検証） | Green |
| R（回帰 guard） | 5 件、CI 必須化方針記録 | spec only |
| S（補助コマンド） | 4 件、動作 evidence あり | Green |

## 実装済テスト（vitest）

```
✓ scripts/skill-logs-append.test.ts (7 tests)
✓ scripts/skill-logs-render.test.ts (9 tests)
Test Files  2 passed (2)
Tests       15 passed (15)
```

## 補助コマンド動作 evidence

- S-1 `pnpm skill:logs:render --skill aiworkflow-requirements` → header + Fragments セクション出力（実装後）
- S-2 `... --include-legacy` → Legacy セクション末尾連結
- S-3 `pnpm skill:logs:append --skill <name> --type log --message "..."` → fragment 1 件生成
- S-4 `pnpm skill:logs:render --since 2026-04-01T00:00:00Z` → since 以降のみ降順出力

スモーク手順:
```bash
mise exec -- pnpm skill:logs:append --skill aiworkflow-requirements --type log --message "smoke"
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements | head -40
```

## CI 必須化方針（R 系統）

- R-1 / R-2: `git grep -n 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` を CI step に追加（writer 経路 0 件期待）
- R-3: `git log --diff-filter=D -- '*_legacy.md'` を週次監視
- R-4: C-6（降順）を CI 必須テストに登録（vitest run）
- R-5: append helper の事前存在チェック分岐を必須テスト化（C-1 / C-3）

CI 設定追加は本タスクスコープ外（後続タスク化）。

## 関連ファイル

- [`failure-cases.md`](./failure-cases.md)
- [`fragment-runbook.md`](./fragment-runbook.md)

# Phase 08 outputs / main

## triage-table.md テンプレ

```markdown
# Upstream triage table — <YYYY-MM-DD>

## 確認範囲
- since: <tag/date>
- until: <tag/date>
- 担当: <name>

## triage 結果
| repo | tag | hit kw | PR/commit | 判定 | メモ |
| --- | --- | --- | --- | --- | --- |
| cloudflare/workers-sdk | | | | あり/なし/保留 | |
| nodejs/undici | | | | | |
| cloudflare/workerd | | | | | |

## 結論
- [ ] 改善なし → maxWorkers=1 維持
- [ ] 改善あり → A/B 評価
- [ ] 保留 → 次サイクル
```

## ab-summary.md テンプレ

```markdown
# A/B summary — <YYYY-MM-DD>

| N | run-1 | run-2 | run-3 | EADDR 合計 | wall-clock(s) | 採用 |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | | | | | | |
| 4 | | | | | | |
| auto | | | | | | |

## 採用値
`--maxWorkers=<N>` または「全候補不採用 → 維持」

## package.json 編集案
\`\`\`diff
- "test:coverage": "vitest run --coverage --maxWorkers=1 --minWorkers=1",
+ "test:coverage": "vitest run --coverage --maxWorkers=<N>",
\`\`\`
```

## DRY 対象外

- vitest コマンド本体（明示性優先）
- evidence ファイル名（命名規則で十分）

## 次フェーズ

Phase 9 品質保証。

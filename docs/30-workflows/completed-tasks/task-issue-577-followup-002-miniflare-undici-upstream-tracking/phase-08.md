# Phase 8: DRY 化

## triage 表テンプレート

`outputs/phase-11/evidence/triage-table.md` の正本フォーマット:

```markdown
# Upstream triage table — <YYYY-MM-DD>

## 確認範囲

- since: <前回 triage tag or 日付>
- until: <今回確認時点 tag or 日付>
- 担当: <name>

## triage 結果

| repo | 確認 release tag | hit キーワード | 該当 PR/commit | 改善判定 | 影響範囲メモ |
| --- | --- | --- | --- | --- | --- |
| cloudflare/workers-sdk | <tag> | <kw,kw> | <#NNNN or sha> | あり/なし/保留 | <要約> |
| nodejs/undici | <tag> | ... | ... | ... | ... |
| cloudflare/workerd | <tag> | ... | ... | ... | ... |

## 結論

- [ ] 改善なし → maxWorkers=1 維持
- [ ] 改善あり → A/B 評価へ進む（採用候補: <N>）
- [ ] 保留 → 次サイクル再評価（今回は維持）
```

## A/B 結果記録テンプレート

`outputs/phase-11/evidence/ab-summary.md` の正本フォーマット:

```markdown
# A/B summary — <YYYY-MM-DD>

## 試行結果

| N | run-1 PASS/FAIL | run-2 | run-3 | EADDRNOTAVAIL 合計 | wall-clock(秒) | 採用判定 |
| --- | --- | --- | --- | --- | --- | --- |
| 2   | <pass/fail> | ... | ... | <0/N> | <s> | 採用/不採用 |
| 4   | ... | ... | ... | ... | ... | ... |
| auto| ... | ... | ... | ... | ... | ... |

## 採用値

`--maxWorkers=<最終採用値>`（または「全候補不採用 → maxWorkers=1 維持」）

## 採用根拠

- 連続 3 回 PASS / 0 EADDRNOTAVAIL を満たした最大値
- coverage 数値: <％>（baseline 維持）

## package.json 編集案

\`\`\`diff
- "test:coverage": "vitest run --coverage --maxWorkers=1 --minWorkers=1",
+ "test:coverage": "vitest run --coverage --maxWorkers=<N>",
\`\`\`
```

## 共通 helper（運用補助）

```bash
# scripts/triage-fetch.sh（仕様書記載のみ、本タスクで作成しない）
# - 3 repo の release を取得
# - キーワード grep を一括実行
# - triage-table.md の skeleton を生成
```

実装は本タスクスコープ外。次サイクル以降に検討。

## DRY 化対象外

- vitest 実行コマンド本体（直接実行が明示性に勝る）
- evidence ファイル名（命名規則で十分）

## 次フェーズへの引き継ぎ事項

Phase 9 で secret hygiene / coverage 閾値の保証手順を整理する。

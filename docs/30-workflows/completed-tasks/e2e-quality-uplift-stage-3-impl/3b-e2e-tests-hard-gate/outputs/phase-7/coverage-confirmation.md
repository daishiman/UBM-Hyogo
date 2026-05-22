# Phase 7 — カバレッジ確認 evidence

`scripts/coverage-gate-e2e.sh` の fixture テストで `total.lines.pct` 解釈ロジック・80% gate を確認:

| fixture | pct | exit | annotation |
|---------|-----|------|------------|
| pass    | 85.0  | 0 | `::notice::line coverage 85.0 >= 80` |
| fail-79 | 79.99 | 1 | `::error::line coverage 79.99 < 80` |
| missing | —     | 1 | `::error::coverage-summary.json not found at …` |

しきい値ハードコード `THRESHOLD=80` のコメントに quality-gates.md §7.5（standard tier / lines）の根拠 path を併記済。

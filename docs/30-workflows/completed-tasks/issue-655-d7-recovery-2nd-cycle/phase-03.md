# Phase 3 — データ / evidence schema 設計

## 目的

recovery aggregation JSON および root cause 分類 Markdown の schema を定義する。

## `hourly-run-7day-summary-recovery.json` schema

```jsonc
{
  "mode": "recovery",                     // 固定 "recovery"
  "since": "2026-05-15T01:00:00Z",        // D'+0 (ISO8601 UTC)
  "until": "2026-05-22T01:00:00Z",        // D'+7
  "expectedSnapshots": 168,
  "actualSnapshots": 168,
  "leakageHourlyClean": true,
  "fallbackRateMean": 0.012,
  "p95LatencyMedianMs": 142,
  "issuesOpenedTotal": 0,
  "runUrls": ["https://github.com/.../runs/..."],
  "compareWith1stCycle": {
    "snapshotsDelta": 168,
    "fallbackRateDelta": -0.003,
    "leakageStatusChange": "stayed-clean"
  },
  "compareWithBaseline": {
    "fallbackRateDelta": 0.001,
    "p95LatencyDeltaMs": 5
  }
}
```

## `recovery-rootcause.md` schema (Markdown front-matter + 表)

```markdown
---
classification: production-code | infrastructure | configuration | unknown
detected_at: 2026-05-14T11:43:52Z
d_prime_zero: 2026-05-15T01:00:00Z
---

## 1 周目 欠損 hour 一覧
| hour (UTC) | run URL | conclusion | root cause 候補 |

## 修正方針 (production-code 分類の場合)
- 対象ファイル:
- 想定 PR: PR-A

## escalation (unknown 分類の場合)
- 連絡先 / Issue 起票先:
```

## `issue-rate-comparison-recovery.md` schema

3 列比較表 (baseline / 1 周目 / 2 周目) で次 metric を並べる:
- `fallbackRateMean`
- `p95LatencyMedianMs`
- `issuesOpenedTotal`
- `leakageHourlyClean`

## 完了条件

- [ ] 3 種の evidence schema が確定
- [ ] schema が phase-05 (実装) と phase-11 (evidence 生成) の双方から参照可能な粒度

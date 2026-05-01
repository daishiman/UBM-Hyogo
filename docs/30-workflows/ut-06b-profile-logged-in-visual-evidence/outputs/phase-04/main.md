# Phase 4 Output: テスト戦略

## Verify 方針

| verify | 対象 | 合格基準 |
| --- | --- | --- |
| 取得 verify | 10 evidence files + Phase 11 補助 metadata | evidence 10 ファイルと metadata 4 ファイルが存在 |
| 内容 verify | 3 DevTools txt | すべて `count: 0` |
| secret hygiene | evidence tree | token / cookie / authorization / bearer / set-cookie が 0 hit |

## 引き継ぎ

チェックリストは `evidence-checklist.md` を正本とし、Phase 5 runbook と Phase 11 observation note が消費する。

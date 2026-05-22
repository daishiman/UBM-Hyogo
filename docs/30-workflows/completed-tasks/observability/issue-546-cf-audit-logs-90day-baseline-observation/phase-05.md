# Phase 5: 集計 SQL / データ構造

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 5 |
| Phase 名 | 集計 SQL / データ構造 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

Gate 判定に使う集計 JSON の構造と SQL を確定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 5-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 5-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 5-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## `d1-cf-audit-90day-summary.json`

```json
{
  "windowDays": 90,
  "totalEvents": 0,
  "firstEventAt": null,
  "lastEventAt": null,
  "severityCounts": { "HIGH": 0, "MEDIUM": 0, "LOW": 0 },
  "classifierCounts": { "threshold": 0, "ml": 0, "unknown": 0 },
  "baseline": {
    "failurePerHourP95": null,
    "offHoursRatio": null,
    "windowDays": null,
    "computedAt": null
  }
}
```

## SQL

```sql
SELECT classifier_used, COUNT(*) AS c
FROM cf_audit_log
WHERE occurred_at_ms >= unixepoch('now','-90 days') * 1000
GROUP BY classifier_used;
```

```sql
SELECT key, value_num, computed_at, window_days
FROM cf_audit_baseline
ORDER BY key;
```

## 入力・出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | D1 `cf_audit_log`, `cf_audit_baseline` |
| 出力 | 集計 JSON |
| 副作用 | なし。`INSERT` / `UPDATE` / `DELETE` / migration apply 禁止 |

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-05.md` | Phase 5 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] 集計 JSON が上記 schema に従う。
- [ ] query log に raw_json が含まれていない。
- [ ] classifier column が存在しない環境では `unknown` として扱い、コード変更で補わない。

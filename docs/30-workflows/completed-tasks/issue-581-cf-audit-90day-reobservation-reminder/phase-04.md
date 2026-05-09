# Phase 4: テスト戦略（read-only verification）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 4 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

本タスクはコード変更を伴わないため unit/integration テストは追加しない。代わりに **evidence schema 適合性検証** と **Gate 判定ロジックの手計算検証** を verification として定義する。

## verification matrix

| 検証項目 | 手段 | 合格基準 |
| --- | --- | --- |
| V-1: monitor JSON が array 形式である | `jq 'type'` が `"array"` | `"array"` |
| V-2: watchdog lifecycle marker が object 形式である | `jq 'type'` が `"object"` | `"object"` |
| V-3: monitor run record が必須フィールドを持つ | `jq 'all(.; has("databaseId") and has("conclusion") and has("createdAt"))'` | `true` |
| V-3b: watchdog marker が Issue #518 HOLD 削除状態を示す | `jq -e '.status == "deleted_by_issue_518_hold" and (.source | length > 0)'` | exit 0 |
| V-4: 90 日 window 内の最古 run が `now - 90d` 以降である | `jq 'min_by(.createdAt) | .createdAt'` | window 開始日以降 |
| V-5: D1 evidence が read-only 結果である | command log に `INSERT/UPDATE/DELETE/CREATE/DROP/ALTER` が含まれない | grep でヒットなし |
| V-6: baseline thresholds が numeric である | `jq '.mean | type'` | `"number"` または `"null"` |
| V-7: cf-audit issue evidence が array で、各要素が `labels` 配列を持つ | `jq 'all(.; .labels | type == "array")'` | `true` |
| V-8: tuning-cost-summary.md に月別 minutes table がある | grep でヘッダ行確認 | ヒット ≥ 1 |
| V-9: redaction-check.md が token / secret 漏洩 0 件と記録している | grep `leak: 0` | ヒット = 1 |
| V-10: gate-decision.md が Gate-A/B/C 全項目を含む | grep `Gate-A` `Gate-B` `Gate-C` | 各 1 件以上 |

## Gate 判定ロジック手計算

```text
success_count_required = floor(90 * 24 * 0.99) = 2138
failure_count_max      = floor(90 * 24 * 0.01) = 21
```

Phase 11 で実 evidence と上記閾値を突き合わせ、PASS / FAIL を `gate-decision.md` に記録する。

## ネガティブテスト

| ケース | 期待挙動 |
| --- | --- |
| D1 unreadiness | Gate-B `PENDING_RUNTIME_EVIDENCE`、PASS としない |
| 0 件の cf-audit alert + D1 readiness 確定 | `false_positive_rate = 0` で Gate-B PASS |
| 0 件の cf-audit alert + D1 readiness 未確定 | Gate-B `PENDING_RUNTIME_EVIDENCE` 固定 |
| watchdog YAML 不在 | watchdog evidence を `null` 扱い、Gate-A は monitor のみで gap 判定 |

## 完了条件

- [ ] V-1〜V-10 が全件記述されている
- [ ] Gate 判定の閾値が数値で固定されている
- [ ] ネガティブテストが網羅されている

## 参照資料

- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-04.md`

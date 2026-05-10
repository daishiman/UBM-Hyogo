# Phase 5: 実行準備（前提条件 gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 5 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

実 observation を開始する前に、開始前提条件（日付・認証・D1 readiness）を verification する。90 日 successful run 不成立は早期終了 blocker ではなく、Phase 11 の Gate-A FAIL evidence として記録する。

## 前提条件 gate

| 条件 | 検証コマンド | 合格 |
| --- | --- | --- |
| P-1: 現在日付 ≥ 2026-08-05 | `date -u +%F` | `>= 2026-08-05` |
| P-2: monitor の run history が取得可能 | `gh api --paginate ... | jq -s 'length'` | JSON array を取得できる |
| P-3: D1 `cf_audit_log` テーブル存在 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json --command "SELECT name FROM sqlite_master WHERE type='table' AND name='cf_audit_log';"` | row 1 件 |
| P-4: D1 `cf_audit_baseline` テーブル存在 | 同上 `name='cf_audit_baseline'` | row 1 件 |
| P-5: GitHub CLI 認証 | `gh auth status` | 認証済み |
| P-6: 1Password CLI 利用可能 | `op whoami` | 認証済み |

## 早期終了パス

### P-1 未充足

```markdown
# outputs/phase-11/precondition-check.md
- P-1 status: FAIL (current_date=YYYY-MM-DD)
- decision: observation_continue（次回再評価日: YYYY-MM-DD）
```

Phase 6 以降を実行せず、Phase 12 で `system-spec-update-summary.md` に再延期を記録、Phase 13 で user approval を求める。

### P-2 未充足 / 90 日 successful run 不成立

P-2 の API 取得が失敗する場合は実行環境 blocker として中断する。API 取得は成功したが 90 日 successful run が不成立の場合は Phase 6/11 に進み、Gate-A FAIL として `observation_continue` を記録する。

### P-3 / P-4 未充足

D1 readiness 不在時は Phase 6 を実行可能だが、Phase 7 の Gate-B は `PENDING_RUNTIME_EVIDENCE` 固定。Phase 11 の `gate-decision.md` で Gate-B pending、`observation_continue` を記録する。

### P-5 / P-6 未充足

実行不可。実行者環境を整備するまで作業を中断し、user に通知する。

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/precondition-check.md` | P-1〜P-6 の判定結果と次回再評価日 |

## 完了条件

- [ ] 全前提条件のチェックコマンドが定義されている
- [ ] 未充足時の取り扱いが Gate ごとに分離されている
- [ ] `precondition-check.md` のフォーマットが固定されている

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-05.md`

# Phase 07 — AC マトリクス (実行結果)

[実装区分: 実装仕様書]

## 状態

`PENDING_RUNTIME_EXECUTION` — マッピング設計は spec_created で確定。各 AC の runtime PASS は
runtime cycle で本ファイルを更新する。

## AC ↔ Phase / evidence マッピング (spec_created)

| AC | 要件 | evidence file | gate Phase | status |
| --- | --- | --- | --- | --- |
| AC-1 | Workers cutover 完了 | `outputs/phase-11/preflight-ac1-ac2.md`, `workers-pre-version-id.md` | Phase 5 Step 1, 2 | COVERED_BY_PLANNED_RUN |
| AC-2 | Pages custom domain 空 | `outputs/phase-11/preflight-ac1-ac2.md` | Phase 5 Step 1 | COVERED_BY_PLANNED_RUN |
| AC-3 | dormant 観察期間 ≥ 2 週間 | `outputs/phase-11/dormant-period-log.md` | Phase 5 Step 3 / Phase 6 E-06 | COVERED_BY_PLANNED_RUN |
| AC-4 | user 明示承認 | `outputs/phase-11/user-approval-record.md` | Phase 5 Step 4 / Phase 6 E-08 | COVERED_BY_PLANNED_GATE |
| AC-5 | redaction 0 件 | `outputs/phase-11/redaction-check.md` | Phase 5 Step 7 / Phase 9 redaction gate | COVERED_BY_PLANNED_GATE |
| AC-6 | aiworkflow-requirements Pages 言及更新 | `.claude/skills/aiworkflow-requirements/references/` 差分 | Phase 5 Step 8 / Phase 9 indexes gate | COVERED_BY_PLANNED_DIFF |

## scope ↔ Phase マッピング (spec_created)

| Scope | Phase |
| --- | --- |
| Workers cutover 確認 | Phase 5 Step 1, 2 / Phase 6 E-01 |
| Pages dormant 確認 | Phase 5 Step 1 / Phase 6 E-02 |
| dormant 観察期間 | Phase 5 Step 3 / Phase 6 E-06 |
| user 承認 | Phase 5 Step 4 / Phase 6 E-08 |
| 削除実行 | Phase 5 Step 5 / Phase 6 E-03, E-04, E-05 |
| post smoke | Phase 5 Step 6 |
| redaction | Phase 5 Step 7 / Phase 6 E-07 / Phase 9 |
| aiworkflow 更新 | Phase 5 Step 8 / Phase 9 |

## runtime PASS 反映欄（runtime cycle で更新）

- AC-1: PENDING
- AC-2: PENDING
- AC-3: PENDING
- AC-4: PENDING
- AC-5: PENDING
- AC-6: PENDING

## 残課題

- runtime cycle 完了時に各 AC の status を `PASSED` / 該当 evidence URL に更新する

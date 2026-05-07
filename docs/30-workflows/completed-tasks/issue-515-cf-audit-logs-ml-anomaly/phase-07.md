# Phase 7: 整合性検証

## 目的

親 Issue #408 / SSOT / 既存 migration 番号 / `analyze.ts` 既存出力との整合性を検証する。

## 検証項目

| # | 項目 | 検証方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 親 Issue #408 GitHub Issue 起票形式互換 | `issue-reporter.ts` の本文生成を threshold で実行し、追加 HTML コメント 1 行以外の差分がないことを diff で確認 | 人間可視部分の差分なし |
| 2 | `analyze.ts` 既存 D1 insert 列との整合 | `0014_create_cf_audit_log.sql` の列と `0015_*.sql` 追加列を結合し、insert 文の列順を確認 | 既存列は insert 順序維持 |
| 3 | migration 番号衝突 | `ls apps/api/migrations/` で 0015 以降の存在確認 | 衝突なし |
| 4 | env 衝突 | `.github/workflows/cf-audit-log-monitor.yml` 既存 env と `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` の重複確認 | 重複なし |
| 5 | watchdog 影響 | `cf-audit-log-monitor-watchdog.yml` が新 env を参照しないこと | 影響なし |
| 6 | SSOT 同期先存在確認 | `observability-monitoring.md` / `deployment-secrets-management.md` / `15-infrastructure-runbook.md` の存在 | 3 ファイル存在 |
| 7 | 不変条件 #5 整合 | classifier 判定根拠が audit 可能（D1 列 + Issue HTML コメント）であることを確認 | 整合 |
| 8 | secret leakage 防御の網羅性 | `extractFeatures` 出力に raw IP / full UA / Token / メール生値が含まれない | 含まれない |
| 9 | 後方互換性 | `CF_AUDIT_CLASSIFIER` 未指定時の動作が threshold と完全一致 | 一致 |
| 10 | rollback 可能性 | `CF_AUDIT_CLASSIFIER=threshold` / migration DOWN で復元可能 | 可能 |

## 出力

`outputs/phase-07/main.md` に各項目の検証結果を記述。NG があれば該当 Phase へ差戻し。

## 完了条件

- [ ] 10 項目すべてが PASS
- [ ] migration 番号が `0015` 以降の最新空き番に確定
- [ ] SSOT 3 ファイル全存在確認
- [ ] 既存 env と新 env の衝突なし

## 出力

- `outputs/phase-07/main.md`

## 参照資料

- `index.md`
- `phase-02.md` ・ `phase-04.md` ・ `phase-05.md`

## 統合テスト連携

- Phase 9 で項目 1 / 8 / 9 を test ケースに昇格

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 07-1 | この Phase の契約を確定する |
| 07-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。

# Phase 12: 実装ガイド・SSOT 同期・未タスク検出

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-515-cf-audit-logs-ml-anomaly |
| state | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実行タスク

| Task | 結果 |
| --- | --- |
| 12-1 実装ガイド | `implementation-guide.md` 作成 |
| 12-2 SSOT 更新 | observability / secrets / runbook / skill logs を同一 wave で更新 |
| 12-3 履歴 | `documentation-changelog.md` 作成 |
| 12-4 未タスク検出 | 外部依存 Gate 4 件を formalize |
| 12-5 skill feedback | `skill-feedback-report.md` 作成 |
| 12-6 compliance | `phase12-task-spec-compliance-check.md` 作成 |

## 成果物/実行手順

strict 7 files は本ディレクトリに実体配置済み。`artifacts.json` は root と `outputs/artifacts.json` の二重 ledger として保持し、両者の state / phase output 参照は同一内容に同期する。

## 完了条件

- [x] Phase 12 strict 7 files を作成
- [x] Gate/state/security/migration の矛盾を仕様へ反映
- [x] 本サイクル内で可能な classifier abstraction / redacted evaluation 基盤を実コードへ反映
- [x] 外部依存 Gate 後の作業を未タスクとして分離

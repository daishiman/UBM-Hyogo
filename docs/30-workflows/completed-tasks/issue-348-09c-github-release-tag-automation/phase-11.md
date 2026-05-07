# Phase 11: 手動テスト検証（NON_VISUAL）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-11/phase-11.md` |
| visualEvidence | NON_VISUAL |

## 目的
`generate-release-notes.sh --dry-run` の markdown dump、既存 tag に対する `gh release create --draft` 1 件の runtime evidence、actionlint / shellcheck / bats 実行ログを取得する。**user gate** が解除されるまでは `blocked_runtime_evidence_pending` 状態を維持する。

## 実行タスク
詳細は `outputs/phase-11/phase-11.md` を正本とする。

## 統合テスト連携
本 Phase が release note 自動生成の NON_VISUAL runtime evidence 統合検証ポイントである。

## 参照資料
- `outputs/phase-11/phase-11.md`

## 成果物
- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/dry-run-release-notes.md`
- `outputs/phase-11/gh-release-view.json`
- `outputs/phase-11/lint-evidence.log`

## 完了条件
- runtime evidence 取得まで `blocked_runtime_evidence_pending` を維持し、取得後は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を解除して PASS 表記する。

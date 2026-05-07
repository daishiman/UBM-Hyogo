# Phase 2: release note template 設計

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-2/phase-2.md` |

## 目的
`scripts/release/release-notes.template.md` の markdown placeholder 仕様 / 各セクションの構成 / 採用根拠（なぜ markdown placeholder か）を確定する。

## 実行タスク
詳細は `outputs/phase-2/phase-2.md` を正本とする。

## 統合テスト連携
Phase 4 の bats シナリオで template 展開の決定論性（同一入力→同一出力）を検証。

## 参照資料
- `outputs/phase-2/phase-2.md`
- `outputs/phase-1/phase-1.md`

## 成果物
- `outputs/phase-2/phase-2.md`

## 完了条件
- placeholder 一覧（`{{TAG}}` / `{{COMMIT}}` / `{{CHANGELOG_URL}}` / `{{RUNTIME_EVIDENCE_URL}}` / `{{ROLLBACK_EVIDENCE_URL}}` / `{{KNOWN_FOLLOW_UP}}` 等）と各セクション要件が記載されている。

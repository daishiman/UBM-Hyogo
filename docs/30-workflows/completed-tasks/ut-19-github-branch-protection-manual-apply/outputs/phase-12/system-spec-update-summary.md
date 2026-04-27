# Phase 12: システム仕様更新サマリ

## 正本仕様への影響

| 仕様ファイル | 影響有無 | 対応 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | あり | UT-19 実適用結果、Required Reviewers 0 名、再検証スクリプトを追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | なし | environments 設計と適用結果が一致 |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | なし | CI/CD 全体方針と整合 |
| `01a/phase-05/repository-settings-runbook.md` | なし（実適用結果と完全一致） | 更新不要 |

## 仕様更新事項

新規インターフェースは追加しない。ただし、runbook 推奨値が GitHub 実設定として確定したため、`deployment-branch-strategy.md` に UT-19 適用済み運用値と証跡リンクを追記した。

## 既存値の確定

| 値 | 状態 |
| --- | --- |
| main protection の運用値 | 確定（runbook = 実適用） |
| dev protection の運用値 | 確定 |
| production env branch policy | 確定（`main` のみ） |
| staging env branch policy | 確定（`dev` のみ） |
| `develop` 旧名称 | 稼働仕様への残存ゼロを確認 |

## same-wave sync

| 対象 | 状態 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | UT-19 close-out エントリ追加 |
| `.claude/skills/task-specification-creator/LOGS.md` | UT-19 Phase 12 hardening エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `deployment-branch-strategy.md` の UT-19 セクション反映 |
| `docs/30-workflows/unassigned-task/UT-19-github-branch-protection-manual-apply.md` | `unassigned` から `spec_created` に更新 |
| `scripts/verify-branch-protection.sh` | 再検証コマンドをコード化 |

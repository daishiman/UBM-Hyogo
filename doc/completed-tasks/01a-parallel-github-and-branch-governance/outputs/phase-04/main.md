# Phase 4: 現状確認結果（AS-IS）

## 確認実施日

2026-04-23

## 確認方法

- gh CLI: `gh api repos/daishiman/UBM-Hyogo/...`
- ファイルシステム確認: `.github/` ディレクトリの存在確認

## Branch Protection 現状

| ブランチ | 設定項目 | 現状値 | 設計値（TO-BE） | 差分 |
| --- | --- | --- | --- | --- |
| main | Required PR reviews | **未設定** | 2 | **差分あり** |
| main | Status checks: ci | **未設定** | 有効 | **差分あり** |
| main | Status checks: Validate Build | **未設定** | 有効 | **差分あり** |
| main | Require up-to-date branches | **未設定** | ON | **差分あり** |
| main | Allow force pushes | **未設定** | OFF | **差分あり** |
| main | Allow deletions | **未設定** | OFF | **差分あり** |
| dev | Required PR reviews | **未設定** | 1 | **差分あり** |
| dev | Status checks: ci | **未設定** | 有効 | **差分あり** |
| dev | Status checks: Validate Build | **未設定** | 有効 | **差分あり** |
| dev | Allow force pushes | **未設定** | OFF | **差分あり** |

確認コマンド結果:
```
gh api repos/daishiman/UBM-Hyogo/branches/main/protection
→ {"message":"Branch not protected","status":"404"}

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection
→ {"message":"Branch not protected","status":"404"}
```

## Environments 現状

| 環境名 | 存在 | Required reviewers | Deployment branches | 差分 |
| --- | --- | --- | --- | --- |
| production | **なし** | — | — | **差分あり** |
| staging | **なし** | — | — | **差分あり** |

確認コマンド結果:
```
gh api repos/daishiman/UBM-Hyogo/environments
→ {"total_count":0,"environments":[]}
```

## PR Template 現状

| 項目 | 現状 | 設計値 | 差分 |
| --- | --- | --- | --- |
| .github/pull_request_template.md の存在 | **存在しない** | あり | **差分あり** |
| True Issue 欄 | — | あり | **差分あり** |
| Dependency 欄 | — | あり | **差分あり** |
| 価値性チェック欄 | — | あり | **差分あり** |
| 実現性チェック欄 | — | あり | **差分あり** |
| 整合性チェック欄 | — | あり | **差分あり** |
| 運用性チェック欄 | — | あり | **差分あり** |

`.github/` ディレクトリ自体が存在しないため、全ファイルが不在。

## CODEOWNERS 現状

| 項目 | 現状 | 設計値 | 差分 |
| --- | --- | --- | --- |
| .github/CODEOWNERS の存在 | **存在しない** | あり | **差分あり** |
| * @daishiman | — | あり | **差分あり** |
| doc/01a-*/ @daishiman | — | あり | **差分あり** |
| doc/01b-*/ @daishiman | — | あり | **差分あり** |
| doc/01c-*/ @daishiman | — | あり | **差分あり** |
| .github/ @daishiman | — | あり | **差分あり** |

## Phase 5 変更対象リスト（全件が新規作成）

| 対象 | 変更種別 | 優先度 |
| --- | --- | --- |
| main branch protection | 新規作成 | 高 |
| dev branch protection | 新規作成 | 高 |
| production environment | 新規作成 | 高 |
| staging environment | 新規作成 | 高 |
| .github/pull_request_template.md | 新規作成 | 高 |
| .github/CODEOWNERS | 新規作成 | 高 |
| outputs/phase-05/repository-settings-runbook.md | 新規作成 | 高 |

**全設定が未設定状態のため、Phase 5 では全て新規作成となる。**

## open questions

- なし（全設定が未設定であるため、差分判定は明確）

## Phase 5 への handoff

- **変更対象**: Branch Protection（main/dev）・Environments（production/staging）・.github/CODEOWNERS・.github/pull_request_template.md の全て新規作成
- **blockers**: なし
- **前提確認**: リポジトリオーナーは `daishiman`、リポジトリ名は `UBM-Hyogo`

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | AS-IS の記録によって Phase 5 での変更漏れリスクを排除できるか | PASS（全 AC 項目の現状を記録） |
| 実現性 | ブラウザと gh CLI のみで確認が完結するか | PASS（追加権限・費用不要） |
| 整合性 | 確認項目が設計書と 1:1 で対応しているか | PASS（設計書の全設定項目を網羅） |
| 運用性 | 確認結果が Phase 5 runbook の入力として直接使用可能か | PASS（差分リストをそのまま Phase 5 変更対象に転用） |

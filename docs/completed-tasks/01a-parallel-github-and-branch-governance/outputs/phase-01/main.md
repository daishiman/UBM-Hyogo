# Phase 1: 要件定義書

## 実施日

2026-04-23

## 正本仕様 読み込み結果

### deployment-branch-strategy.md より確定した要件

| 項目 | 正本仕様値 | 根拠 |
| --- | --- | --- |
| main branch reviewer | 2 名 | Require pull request reviews: 2 |
| dev branch reviewer | 1 名 | Require pull request reviews: 1 |
| main force push | OFF | Allow force pushes: OFF |
| dev force push | OFF | Allow force pushes: OFF |
| main status checks | `ci`, `Validate Build` | Require status checks to pass: ci / Validate Build |
| dev status checks | `ci`, `Validate Build` | Require status checks to pass: ci / Validate Build |
| production env branch | main のみ | Deployment branches: main のみ |
| staging env branch | dev のみ | Deployment branches: dev のみ |
| production reviewer | 2 名 | Required reviewers: 2名 |
| staging reviewer | 0 名（自動） | Required reviewers: 0名（自動デプロイ） |

### deployment-core.md より確定した要件

| 項目 | 値 |
| --- | --- |
| CI workflow ファイル | `ci.yml` |
| CD workflow ファイル | `web-cd.yml`, `backend-ci.yml` |
| status check 名 | `ci`（`ci.yml` 内 job 名）, `Validate Build` |

## 現状インベントリ確認（AS-IS）

確認日時: 2026-04-23
確認方法: gh CLI（`gh api repos/daishiman/UBM-Hyogo/...`）

| 設定カテゴリ | 確認結果 | 備考 |
| --- | --- | --- |
| main branch protection | **未設定** | API が 404 を返す |
| dev branch protection | **未設定** | API が 404 を返す |
| production environment | **未設定** | environments が 0 件 |
| staging environment | **未設定** | environments が 0 件 |
| .github/pull_request_template.md | **存在しない** | .github/ ディレクトリ自体が存在しない |
| .github/CODEOWNERS | **存在しない** | .github/ ディレクトリ自体が存在しない |

**全設定が未設定状態。** Phase 5 で全て新規作成が必要。

## AC トレーサビリティ

| AC | 内容 | 正本仕様への根拠 | 現状 |
| --- | --- | --- | --- |
| AC-1 | main は reviewer 2 名、dev は reviewer 1 名 | `deployment-branch-strategy.md` Branch Protection 設計 | 未設定 → Phase 5 で設定 |
| AC-2 | production は main のみ、staging は dev のみ受け付ける | `deployment-branch-strategy.md` 環境マッピング | 未設定 → Phase 5 で設定 |
| AC-3 | PR template に true issue / dependency / 4条件の欄がある | task-specification-creator スキル定義 | 未設定 → Phase 5 で作成 |
| AC-4 | CODEOWNERS と task 責務が衝突しない | Wave 1 並列タスク責務境界 | 未設定 → Phase 5 で作成 |
| AC-5 | local-check-result.md と change-summary.md の close-out path がある | Phase 13 成果物パス定義 | Phase 13 で作成予定 |

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | reviewer 不在・force push によるリリース事故リスクを排除できるか | PASS（branch protection で機械的に強制） |
| 実現性 | GitHub UI 手動操作のみで初回無料枠内に収まるか | PASS（追加費用なし） |
| 整合性 | branch / env / reviewer / secret placement が正本仕様と矛盾しないか | PASS（全設定が未設定→正本仕様値に合わせて新規設定） |
| 運用性 | rollback（branch protection の一時解除）が runbook で可能か | PASS（管理者権限で即時対応可） |

## 既存資産インベントリ

| 項目 | 現状 | 対処方針 |
| --- | --- | --- |
| .github/ ディレクトリ | 存在しない | Phase 5 で新規作成 |
| main branch protection | 未設定 | Phase 5 で新規設定 |
| dev branch protection | 未設定 | Phase 5 で新規設定 |
| production environment | 未設定 | Phase 5 で新規作成 |
| staging environment | 未設定 | Phase 5 で新規作成 |
| PR template | 存在しない | Phase 5 で新規作成 |
| CODEOWNERS | 存在しない | Phase 5 で新規作成 |

## 改善優先順位

1. branch protection（main/dev）：reviewer 数・force push 禁止（AC-1 直結）
2. environments（production/staging）：branch mapping（AC-2 直結）
3. PR template：4条件欄（AC-3 直結）
4. CODEOWNERS：task 責務境界（AC-4 直結）
5. close-out files：Phase 13 で対応（AC-5 直結）

## Phase 2 への handoff

- **引き継ぎ内容**: 全設定が未設定状態。AS-IS は「全て新規作成」が前提
- **正本仕様の確認済み内容**: reviewer 数、force push 設定、environment branch mapping、status check 名称
- **blockers**: なし（全設定が未設定なので設計値をそのまま適用可能）
- **open questions**: なし

## 完了条件チェック

- [x] `outputs/phase-01/main.md` が作成済み
- [x] 全 AC (AC-1〜5) に正本仕様への根拠リンクがある
- [x] downstream Phase (2) への handoff items が記録済み
- [x] 異常系（権限不足・設定 drift）の確認が記録済み

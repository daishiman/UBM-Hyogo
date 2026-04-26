# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-23 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | pending |

## 目的

GitHub リポジトリの現在の設定（AS-IS）を記録し、Phase 2 の設計書（`outputs/phase-02/github-governance-map.md`）との差分を特定する。差分があれば Phase 5 での変更対象として確定し、Phase 5 の runbook 実行前提条件を整える。

## 実行タスク

### ステップ 1: input と前提の確認

- `outputs/phase-03/main.md`（設計レビュー結果）を読む
- `outputs/phase-02/github-governance-map.md`（設計書）を読む
- 本 Phase での確認対象 AC（AC-1〜5）を再確認する

### ステップ 2: GitHub 現状設定の確認

以下の手順で現在の GitHub リポジトリ設定を確認し、`outputs/phase-04/main.md` の各項目を埋める。

#### 2-A: ブラウザによる確認手順

**Branch Protection（main）**

1. `https://github.com/{owner}/{repo}/settings/branch_protection_rules` にアクセス
2. `main` ブランチのルールを開く
3. 以下の項目を確認して記録する:
   - "Require a pull request before merging" が ON か
   - "Required number of approvals before merging" の値（期待値: 2）
   - "Require status checks to pass before merging" が ON か
   - ステータスチェック名に `ci` / `Validate Build` が含まれるか
   - "Require branches to be up to date before merging" が ON か
   - "Allow force pushes" が OFF か
   - "Allow deletions" が OFF か

**Branch Protection（dev）**

1. 同画面で `dev` ブランチのルールを開く
2. 以下の項目を確認して記録する:
   - "Required number of approvals before merging" の値（期待値: 1）
   - "Require status checks to pass before merging" が ON か
   - ステータスチェック名に `ci` / `Validate Build` が含まれるか
   - "Allow force pushes" が OFF か

**GitHub Environments**

1. `https://github.com/{owner}/{repo}/settings/environments` にアクセス
2. `production` 環境が存在するか確認し、以下を記録する:
   - Required reviewers の人数（期待値: 2 名）
   - Deployment branches の設定（期待値: `main` のみ）
3. `staging` 環境が存在するか確認し、以下を記録する:
   - Required reviewers の人数（期待値: 0 名・自動）
   - Deployment branches の設定（期待値: `dev` のみ）

**PR Template**

1. リポジトリの `.github/pull_request_template.md` が存在するか確認する
2. 存在する場合、以下の欄が含まれているか確認する:
   - True Issue の記載欄
   - Dependency の記載欄
   - 4条件（価値性 / 実現性 / 整合性 / 運用性）のチェック欄

**CODEOWNERS**

1. `.github/CODEOWNERS` または `CODEOWNERS` が存在するか確認する
2. 存在する場合、以下のパターンが含まれているか確認する:
   - `*` → `@daishiman`（global fallback）
   - `doc/01a-*/` → `@daishiman`
   - `doc/01b-*/` → `@daishiman`
   - `doc/01c-*/` → `@daishiman`
   - `.github/` → `@daishiman`

#### 2-B: gh CLI による確認コマンド

ブラウザ確認の補完として、以下の gh CLI コマンドを実行して現状を JSON で取得する。

```bash
# リポジトリ基本情報の確認
gh repo view --json name,defaultBranchRef,url

# main ブランチの branch protection 設定を取得
gh api repos/{owner}/{repo}/branches/main/protection

# dev ブランチの branch protection 設定を取得
gh api repos/{owner}/{repo}/branches/dev/protection

# 全 environments の一覧を取得
gh api repos/{owner}/{repo}/environments

# production environment の詳細を取得
gh api repos/{owner}/{repo}/environments/production

# staging environment の詳細を取得
gh api repos/{owner}/{repo}/environments/staging

# .github/CODEOWNERS の存在確認
gh api repos/{owner}/{repo}/contents/.github/CODEOWNERS

# .github/pull_request_template.md の存在確認
gh api repos/{owner}/{repo}/contents/.github/pull_request_template.md
```

> **注意**: `{owner}` と `{repo}` は実際のリポジトリオーナー名とリポジトリ名に置換すること。API が 404 を返す場合は「未設定」として記録する。

### ステップ 3: 差分の特定と Phase 5 変更対象の確定

以下の判定基準で、Phase 5 での変更が必要な項目を特定する。

| 判定基準 | 変更要否 |
| --- | --- |
| 設計値と現状値が一致する | Phase 5 でのスキップ可（確認のみ） |
| 設計値と現状値が異なる | Phase 5 で変更必要 |
| 設定が未存在（404 / 未設定） | Phase 5 で新規作成必要 |

### ステップ 4: `outputs/phase-04/main.md` への記録

現状確認の結果を以下のテンプレートで `outputs/phase-04/main.md` に記録する。

#### `outputs/phase-04/main.md` テンプレート

```markdown
# Phase 4: 現状確認結果（AS-IS）

## 確認実施日

YYYY-MM-DD

## Branch Protection 現状

| ブランチ | 設定項目 | 現状値 | 設計値（TO-BE） | 差分 |
| --- | --- | --- | --- | --- |
| main | Required PR reviews | TBD | 2 | TBD |
| main | Status checks: ci | TBD | 有効 | TBD |
| main | Status checks: Validate Build | TBD | 有効 | TBD |
| main | Require up-to-date branches | TBD | ON | TBD |
| main | Allow force pushes | TBD | OFF | TBD |
| main | Allow deletions | TBD | OFF | TBD |
| dev | Required PR reviews | TBD | 1 | TBD |
| dev | Status checks: ci | TBD | 有効 | TBD |
| dev | Status checks: Validate Build | TBD | 有効 | TBD |
| dev | Allow force pushes | TBD | OFF | TBD |

## Environments 現状

| 環境名 | 存在 | Required reviewers | Deployment branches | 差分 |
| --- | --- | --- | --- | --- |
| production | TBD | TBD | TBD | TBD |
| staging | TBD | TBD | TBD | TBD |

## PR Template 現状

| 項目 | 現状 | 設計値 | 差分 |
| --- | --- | --- | --- |
| .github/pull_request_template.md の存在 | TBD | あり | TBD |
| True Issue 欄 | TBD | あり | TBD |
| Dependency 欄 | TBD | あり | TBD |
| 価値性チェック欄 | TBD | あり | TBD |
| 実現性チェック欄 | TBD | あり | TBD |
| 整合性チェック欄 | TBD | あり | TBD |
| 運用性チェック欄 | TBD | あり | TBD |

## CODEOWNERS 現状

| 項目 | 現状 | 設計値 | 差分 |
| --- | --- | --- | --- |
| .github/CODEOWNERS の存在 | TBD | あり | TBD |
| * @daishiman | TBD | あり | TBD |
| doc/01a-*/ @daishiman | TBD | あり | TBD |
| doc/01b-*/ @daishiman | TBD | あり | TBD |
| doc/01c-*/ @daishiman | TBD | あり | TBD |
| .github/ @daishiman | TBD | あり | TBD |

## Phase 5 変更対象リスト

| 対象 | 変更種別 | 優先度 |
| --- | --- | --- |
| （差分があった項目を列挙） | 新規作成 / 変更 / 削除 | 高 / 中 / 低 |

## open questions

- （確認中に発見した不明点や要確認事項を記載）

## Phase 5 への handoff

- 変更対象: （上記テーブルのサマリー）
- blockers: （Phase 5 開始前に解決が必要な事項）
```

### ステップ 5: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を本 Phase の作業について確認する
- Phase 5 に渡す blocker と open question を `outputs/phase-04/main.md` に記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-02/github-governance-map.md` | 設計値（TO-BE）の参照元 |
| 必須 | `outputs/phase-03/main.md` | 設計レビュー結果・open questions |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping の正本仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート |
| 参考 | `doc/01a-parallel-github-and-branch-governance/index.md` | タスク全体の受入条件（AC-1〜5） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | `outputs/phase-04/main.md` の差分リストを runbook の変更対象として使用 |
| Phase 7 | AS-IS の記録を AC トレースマトリクスの現状欄に使用 |
| Phase 10 | 最終 gate 判定で AS-IS との差分がゼロかを確認 |
| Phase 12 | close-out の際に本 Phase の確認記録を参照 |

## 多角的チェック観点

- **価値性**: 確認漏れなく全 AC 項目の現状が記録されているか
- **実現性**: ブラウザと gh CLI で確認できる範囲に収まっているか（追加権限不要か）
- **整合性**: AS-IS の記録が正本仕様（deployment-branch-strategy.md）と比較可能な形式になっているか
- **運用性**: 差分リストが Phase 5 の runbook に直接対応可能な形式になっているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認（Phase 2/3 outputs を読む） | 4 | pending | outputs/phase-02, 03 を読む |
| 2 | Branch Protection（main）の現状確認 | 4 | pending | ブラウザ + gh CLI |
| 3 | Branch Protection（dev）の現状確認 | 4 | pending | ブラウザ + gh CLI |
| 4 | Environments（production/staging）の現状確認 | 4 | pending | ブラウザ + gh CLI |
| 5 | PR template の現状確認 | 4 | pending | .github/pull_request_template.md |
| 6 | CODEOWNERS の現状確認 | 4 | pending | .github/CODEOWNERS |
| 7 | 差分特定と Phase 5 変更対象リスト作成 | 4 | pending | outputs/phase-04/main.md |
| 8 | 4条件評価と Phase 5 への handoff 記録 | 4 | pending | blockers と open questions を明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-04/main.md` | AS-IS 確認結果・差分リスト・Phase 5 変更対象・handoff |
| メタ | `artifacts.json` | Phase 4 status を completed に更新 |

## 完了条件

- [ ] `outputs/phase-04/main.md` が作成済み
- [ ] Branch Protection（main / dev）の全確認項目に現状値が記録済み
- [ ] Environments（production / staging）の全確認項目に現状値が記録済み
- [ ] PR template の現状が記録済み（存在有無・欄の有無）
- [ ] CODEOWNERS の現状が記録済み（存在有無・パターンの有無）
- [ ] Phase 5 変更対象リストが確定済み
- [ ] open questions と blockers が記録済み

## タスク 100% 実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック済み
- [ ] 異常系（権限不足・API 404・設定 drift）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の phase 4 を completed に更新済み

## 次Phase

- 次: 5 (セットアップ実行)
- 引き継ぎ事項: `outputs/phase-04/main.md` の差分リストと変更対象リストを Phase 5 の runbook 実行の入力として渡す
- ブロック条件: `outputs/phase-04/main.md` が未作成、または差分特定が未完了の場合は Phase 5 に進まない

## 検証コマンド一覧

| コマンド | 目的 | 期待 |
| --- | --- | --- |
| `gh repo view --json name,defaultBranchRef,url` | リポジトリ基本情報の確認 | name / defaultBranchRef が正しい |
| `gh api repos/{owner}/{repo}/branches/main/protection` | main branch protection の取得 | reviewer 数・status checks が確認できる |
| `gh api repos/{owner}/{repo}/branches/dev/protection` | dev branch protection の取得 | reviewer 数・force push 設定が確認できる |
| `gh api repos/{owner}/{repo}/environments` | environments 一覧の取得 | production / staging の存在確認 |
| `gh api repos/{owner}/{repo}/environments/production` | production 環境の詳細取得 | reviewer 数・branch 制限が確認できる |
| `gh api repos/{owner}/{repo}/environments/staging` | staging 環境の詳細取得 | branch 制限が確認できる |
| `gh api repos/{owner}/{repo}/contents/.github/CODEOWNERS` | CODEOWNERS の存在確認 | 200 OK または 404 |
| `gh api repos/{owner}/{repo}/contents/.github/pull_request_template.md` | PR template の存在確認 | 200 OK または 404 |

## 期待出力表

| 確認項目 | PASS 条件 |
| --- | --- |
| Branch Protection 現状記録 | main / dev の全設定項目に値が記録されている |
| Environments 現状記録 | production / staging の存在有無と設定値が記録されている |
| PR template 現状記録 | 存在有無と必須欄の有無が記録されている |
| CODEOWNERS 現状記録 | 存在有無と全パターンの有無が記録されている |
| 差分特定 | 設計値と現状値の差分が明確になっている |
| Phase 5 変更対象リスト | 差分があった項目が変更対象として列挙されている |

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | AS-IS の記録によって Phase 5 での変更漏れリスクを排除できるか | PASS（全 AC 項目の現状を記録することで漏れを防ぐ） |
| 実現性 | ブラウザと gh CLI のみで確認が完結するか | PASS（追加権限・費用不要） |
| 整合性 | 確認項目が設計書（github-governance-map.md）と 1:1 で対応しているか | PASS（設計書の全設定項目を網羅） |
| 運用性 | 確認結果が Phase 5 runbook の入力として直接使用可能な形式か | PASS（差分リストをそのまま Phase 5 変更対象に転用できる） |

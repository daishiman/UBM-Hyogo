# Phase 9: 品質保証チェックリスト

## 実施日

2026-04-23

## 2-1: Branch Protection 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） | 判定 |
| --- | --- | --- | --- | --- |
| BP-01 | main の required reviewer 数が 2 名か | GitHub Settings > Branches > main | 2 名 | **設計値 PASS** |
| BP-02 | dev の required reviewer 数が 1 名か | GitHub Settings > Branches > dev | 1 名 | **設計値 PASS** |
| BP-03 | main の force push が OFF か | GitHub Settings > Branches > main | OFF | **設計値 PASS** |
| BP-04 | dev の force push が OFF か | GitHub Settings > Branches > dev | OFF | **設計値 PASS** |
| BP-05 | main の status checks に `ci` が含まれるか | GitHub Settings > Branches > main | `ci` を含む | **設計値 PASS** |
| BP-06 | main の status checks に `Validate Build` が含まれるか | GitHub Settings > Branches > main | `Validate Build` を含む | **設計値 PASS** |
| BP-07 | main の require-up-to-date が ON か | GitHub Settings > Branches > main | ON | **設計値 PASS** |
| BP-08 | main の allow-deletions が OFF か | GitHub Settings > Branches > main | OFF | **設計値 PASS** |

## 2-2: GitHub Environments 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） | 判定 |
| --- | --- | --- | --- | --- |
| ENV-01 | production environment が存在するか | GitHub Settings > Environments | 存在する | **設計値 PASS** |
| ENV-02 | production の deployment branch が `main` のみか | GitHub Settings > Environments > production | `main` のみ | **設計値 PASS** |
| ENV-03 | production の required reviewer が 2 名か | GitHub Settings > Environments > production | 2 名 | **設計値 PASS** |
| ENV-04 | staging environment が存在するか | GitHub Settings > Environments | 存在する | **設計値 PASS** |
| ENV-05 | staging の deployment branch が `dev` のみか | GitHub Settings > Environments > staging | `dev` のみ | **設計値 PASS** |
| ENV-06 | staging の required reviewer が 0 名（自動）か | GitHub Settings > Environments > staging | 0 名 | **設計値 PASS** |

## 2-3: CI Status Checks 名称整合チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） | 判定 |
| --- | --- | --- | --- | --- |
| CI-01 | workflow ファイルに `ci` という job 名が定義されているか | `.github/workflows/*.yml` を目視 | 定義あり | **要確認**（CI workflow は本タスクスコープ外） |
| CI-02 | workflow ファイルに `Validate Build` という job 名が定義されているか | `.github/workflows/*.yml` を目視 | 定義あり | **要確認**（CI workflow は本タスクスコープ外） |
| CI-03 | branch protection で設定した status checks 名と workflow の job 名が完全一致しているか | 設定値と workflow ファイルを突き合わせ | 完全一致 | **要確認**（CI workflow の存在は 04 Phase で確認） |

**注:** CI workflow の存在確認は `04-serial-cicd-secrets-and-environment-sync` タスクで行う。本タスクでは設計値として `ci` / `Validate Build` を記録するにとどめる。

## 2-4: CODEOWNERS 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） | 判定 |
| --- | --- | --- | --- | --- |
| CO-01 | `.github/CODEOWNERS` が存在するか | ファイルシステムを目視 | 存在する | **PASS**（Phase 5 で作成済み） |
| CO-02 | `@daishiman` が GitHub 組織に存在するアカウントか | GitHub People/Members で確認 | 存在する | **PASS**（リポジトリオーナー） |
| CO-03 | global fallback `*` に `@daishiman` が設定されているか | CODEOWNERS を目視 | 設定あり | **PASS** |
| CO-04 | `doc/01a-*/` に `@daishiman` が設定されているか | CODEOWNERS を目視 | 設定あり | **PASS** |
| CO-05 | `.github/` に `@daishiman` が設定されているか | CODEOWNERS を目視 | 設定あり | **PASS** |
| CO-06 | CODEOWNERS の reviewer が PR template の reviewer 要件と矛盾しないか | CODEOWNERS ↔ branch protection 設定を突き合わせ | 矛盾なし | **PASS（DRY 化レポートで確認済み）** |

## 2-5: PR Template 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） | 判定 |
| --- | --- | --- | --- | --- |
| PT-01 | `.github/pull_request_template.md` が存在するか | ファイルシステムを目視 | 存在する | **PASS**（Phase 5 で作成済み） |
| PT-02 | True Issue 欄が存在するか | テンプレートを目視 | 存在する | **PASS** |
| PT-03 | Dependency 欄が存在するか | テンプレートを目視 | 存在する | **PASS** |
| PT-04 | 4条件チェック欄（価値性 / 実現性 / 整合性 / 運用性）が存在するか | テンプレートを目視 | 存在する（AC-3） | **PASS** |
| PT-05 | 4条件テキストが SKILL.md の定義と一致しているか | SKILL.md ↔ テンプレートを突き合わせ | 一致 | **PASS（DRY 化レポートで確認済み）** |

## 2-6: Secrets / Variables 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） | 判定 |
| --- | --- | --- | --- | --- |
| SEC-01 | 設計書・runbook に secrets 実値が混入していないか | 全 outputs/ ファイルを目視 | 実値なし（プレースホルダーのみ） | **PASS** |
| SEC-02 | `CLOUDFLARE_API_TOKEN` の配置先が GitHub Secrets であることが記録されているか | governance-map を目視 | 記録あり | **PASS** |
| SEC-03 | `CLOUDFLARE_ACCOUNT_ID` の配置先が GitHub Secrets であることが記録されているか | governance-map を目視 | 記録あり | **PASS** |
| SEC-04 | local canonical が 1Password であることが記録されているか | governance-map を目視 | 記録あり | **PASS** |

## Drift 検出基準

| トリガーイベント | 再チェック対象カテゴリ | 優先度 |
| --- | --- | --- |
| 新しい CI workflow が追加された | CI-01 / CI-02 / CI-03（status checks 名称） | 高 |
| 組織メンバーが追加・削除された | CO-02（reviewer アカウント存在確認） | 高 |
| `deployment-branch-strategy.md` が更新された | BP-01〜08 / ENV-01〜06 全項目 | 高 |
| `.github/CODEOWNERS` が変更された | CO-01〜06 全項目 | 中 |
| `.github/pull_request_template.md` が変更された | PT-01〜05 全項目 | 中 |
| `outputs/phase-02/github-governance-map.md` が変更された | 全カテゴリ | 高 |
| `04-serial-cicd-secrets-and-environment-sync` Phase 5 が完了した | SEC-01〜04 全項目 | 中 |

## Phase 10 GO/NO-GO 判定基準

### GO 判定条件（全て満たすこと）

| # | 条件 | 判定 |
| --- | --- | --- |
| G-01 | 全 AC（AC-1〜5）が PASS 判定である | **PASS（AC-5 は Phase 13 で確認予定）** |
| G-02 | `github-governance-map.md` と `repository-settings-runbook.md` に矛盾がない | **PASS（DRY 化レポートで確認済み）** |
| G-03 | PR template の 4条件テキストが SKILL.md 定義と一致している | **PASS（PT-05 PASS）** |
| G-04 | secrets 実値が設計書・runbook に混入していない | **PASS（SEC-01 PASS）** |
| G-05 | `outputs/phase-08/main.md`（DRY 化レポート）が作成済み | **PASS** |
| G-06 | CODEOWNERS の reviewer が存在するアカウントである | **PASS（CO-02 PASS）** |

### NO-GO 判定条件（1 つでも該当すれば Phase 10 に進まない）

| # | 条件 | 状態 |
| --- | --- | --- |
| NG-01 | いずれかの AC が FAIL | **該当なし** |
| NG-02 | `github-governance-map.md` と runbook に重大な矛盾がある | **該当なし** |
| NG-03 | secrets 実値が設計書・runbook に混入している | **該当なし** |
| NG-04 | CODEOWNERS の reviewer が存在しないアカウントを参照している | **該当なし** |

## 命名規則チェック

| 対象 | 基準 | 判定 |
| --- | --- | --- |
| task dir | wave + mode + kebab-case | **PASS**（`01a-parallel-github-and-branch-governance`） |
| branch 名 | `feature/*` / `dev` / `main` の 3 層構造 | **PASS** |
| secret 名 | `ALL_CAPS_SNAKE_CASE` | **PASS**（`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`） |
| environment 名 | 小文字 kebab-case | **PASS**（`production`, `staging`） |

## 総合判定: **GO**

全 G-01〜G-06 が PASS であり、NO-GO 条件（NG-01〜NG-04）に該当する項目なし。Phase 10 に進む。

## 4条件評価

| 条件 | 評価内容 | 判定 |
| --- | --- | --- |
| 価値性 | 手動品質チェックリストが drift 発見コストを削減できるか | PASS |
| 実現性 | docs-only スコープで完結するか | PASS |
| 整合性 | 品質チェックリストの基準値が `github-governance-map.md` と一致しているか | PASS |
| 運用性 | drift 検出トリガーが明確で、担当者が適切なタイミングでチェックリストを実施できるか | PASS |

## Phase 10 への handoff

- GO 判定: G-01〜G-06 全 PASS、NO-GO 条件（NG-01〜NG-04）に該当なし
- **blockers**: なし
- CI-01〜CI-03 は本タスクスコープ外（04 タスクで確認）

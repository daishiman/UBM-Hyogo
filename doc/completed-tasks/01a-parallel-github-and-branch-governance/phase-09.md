# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 8 (設定 DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |
| タスク種別 | docs-only |

## 目的

設定の品質を保証し、将来の drift（設定の意図せぬ乖離）を防ぐための仕組みを設計する。docs-only タスクのため CI 実行は不要。設計書・runbook の品質チェックのみを行い、Phase 10 最終レビューへの進行可否（GO/NO-GO）を判定する品質保証チェックリストを作成する。

## 実行タスク

### ステップ 1: 上流成果物の読み込み

- `outputs/phase-08/main.md`（DRY 化レポート）を読む
- `outputs/phase-02/github-governance-map.md`（正本設計）を読む
- `outputs/phase-05/repository-settings-runbook.md`（適用 runbook）を読む
- `phase-07.md` の AC マトリクスを読む
- `index.md` の受入条件 AC-1〜5 を再確認する

### ステップ 2: 手動品質チェックリストの作成

以下のカテゴリ別に定期的に実施すべき確認項目を整備し、`outputs/phase-09/main.md` に記録する。

#### 2-1: Branch Protection 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） |
| --- | --- | --- | --- |
| BP-01 | main の required reviewer 数が 2 名か | GitHub Settings > Branches > main | 2 名 |
| BP-02 | dev の required reviewer 数が 1 名か | GitHub Settings > Branches > dev | 1 名 |
| BP-03 | main の force push が OFF か | GitHub Settings > Branches > main | OFF |
| BP-04 | dev の force push が OFF か | GitHub Settings > Branches > dev | OFF |
| BP-05 | main の status checks に `ci` が含まれるか | GitHub Settings > Branches > main | `ci` を含む |
| BP-06 | main の status checks に `Validate Build` が含まれるか | GitHub Settings > Branches > main | `Validate Build` を含む |
| BP-07 | main の require-up-to-date が ON か | GitHub Settings > Branches > main | ON |
| BP-08 | main の allow-deletions が OFF か | GitHub Settings > Branches > main | OFF |

#### 2-2: GitHub Environments 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） |
| --- | --- | --- | --- |
| ENV-01 | production environment が存在するか | GitHub Settings > Environments | 存在する |
| ENV-02 | production の deployment branch が `main` のみか | GitHub Settings > Environments > production | `main` のみ |
| ENV-03 | production の required reviewer が 2 名か | GitHub Settings > Environments > production | 2 名 |
| ENV-04 | staging environment が存在するか | GitHub Settings > Environments | 存在する |
| ENV-05 | staging の deployment branch が `dev` のみか | GitHub Settings > Environments > staging | `dev` のみ |
| ENV-06 | staging の required reviewer が 0 名（自動）か | GitHub Settings > Environments > staging | 0 名 |

#### 2-3: CI Status Checks 名称整合チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） |
| --- | --- | --- | --- |
| CI-01 | workflow ファイルに `ci` という job 名が定義されているか | `.github/workflows/*.yml` を目視 | 定義あり |
| CI-02 | workflow ファイルに `Validate Build` という job 名が定義されているか | `.github/workflows/*.yml` を目視 | 定義あり |
| CI-03 | branch protection で設定した status checks 名と workflow の job 名が完全一致しているか | 設定値と workflow ファイルを突き合わせ | 完全一致 |

#### 2-4: CODEOWNERS 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） |
| --- | --- | --- | --- |
| CO-01 | `.github/CODEOWNERS` が存在するか | ファイルシステムを目視 | 存在する |
| CO-02 | `@daishiman` が GitHub 組織に存在するアカウントか | GitHub People/Members で確認 | 存在する |
| CO-03 | global fallback `*` に `@daishiman` が設定されているか | CODEOWNERS を目視 | 設定あり |
| CO-04 | `doc/01a-*/` に `@daishiman` が設定されているか | CODEOWNERS を目視 | 設定あり |
| CO-05 | `.github/` に `@daishiman` が設定されているか | CODEOWNERS を目視 | 設定あり |
| CO-06 | CODEOWNERS の reviewer が PR template の reviewer 要件と矛盾しないか | CODEOWNERS ↔ branch protection 設定を突き合わせ | 矛盾なし |

#### 2-5: PR Template 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） |
| --- | --- | --- | --- |
| PT-01 | `.github/pull_request_template.md` が存在するか | ファイルシステムを目視 | 存在する |
| PT-02 | True Issue 欄が存在するか | テンプレートを目視 | 存在する |
| PT-03 | Dependency 欄が存在するか | テンプレートを目視 | 存在する |
| PT-04 | 4 条件チェック欄（価値性 / 実現性 / 整合性 / 運用性）が存在するか | テンプレートを目視 | 存在する（AC-3） |
| PT-05 | 4 条件テキストが SKILL.md の定義と一致しているか | SKILL.md ↔ テンプレートを突き合わせ | 一致 |

#### 2-6: Secrets / Variables 品質チェック

| # | チェック項目 | 確認方法 | 正本仕様（期待値） |
| --- | --- | --- | --- |
| SEC-01 | 設計書・runbook に secrets 実値が混入していないか | 全 outputs/ ファイルを目視 | 実値なし（プレースホルダーのみ） |
| SEC-02 | `CLOUDFLARE_API_TOKEN` の配置先が GitHub Secrets であることが記録されているか | governance-map を目視 | 記録あり |
| SEC-03 | `CLOUDFLARE_ACCOUNT_ID` の配置先が GitHub Secrets であることが記録されているか | governance-map を目視 | 記録あり |
| SEC-04 | local canonical が 1Password であることが記録されているか | governance-map を目視 | 記録あり |

### ステップ 3: Drift 検出基準の定義

以下のいずれかが発生した場合、手動品質チェックリストを再実施する。

| トリガーイベント | 再チェック対象カテゴリ | 優先度 |
| --- | --- | --- |
| 新しい CI workflow が追加された | CI-01 / CI-02 / CI-03（status checks 名称） | 高 |
| 組織メンバーが追加・削除された | CO-02（reviewer アカウント存在確認） | 高 |
| `deployment-branch-strategy.md` が更新された | BP-01〜08 / ENV-01〜06 全項目 | 高 |
| `.github/CODEOWNERS` が変更された | CO-01〜06 全項目 | 中 |
| `.github/pull_request_template.md` が変更された | PT-01〜05 全項目 | 中 |
| `outputs/phase-02/github-governance-map.md` が変更された | 全カテゴリ | 高 |
| `04-serial-cicd-secrets-and-environment-sync` Phase 5 が完了した | SEC-01〜04 全項目 | 中 |

### ステップ 4: 品質ゲート判定基準の確立

Phase 10 最終レビューに進む条件（GO 判定基準）を以下のとおり定義する。

#### GO 判定条件（全て満たすこと）

| # | 条件 | 確認方法 |
| --- | --- | --- |
| G-01 | 全 AC（AC-1〜5）が PASS 判定である | Phase 7 AC マトリクス + Phase 9 チェックリスト |
| G-02 | `github-governance-map.md` と `repository-settings-runbook.md` に矛盾がない | DRY 化レポート（Phase 8 成果物）で確認 |
| G-03 | PR template の 4 条件テキストが SKILL.md 定義と一致している | PT-05 のチェック結果 |
| G-04 | secrets 実値が設計書・runbook に混入していない | SEC-01 のチェック結果 |
| G-05 | `outputs/phase-08/main.md`（DRY 化レポート）が作成済み | ファイル存在確認 |
| G-06 | CODEOWNERS の reviewer が存在するアカウントである | CO-02 のチェック結果 |

#### NO-GO 判定条件（1 つでも該当すれば Phase 10 に進まない）

| # | 条件 | 対処方針 |
| --- | --- | --- |
| NG-01 | いずれかの AC が FAIL | 対象 Phase に戻り修正後、Phase 9 を再実施 |
| NG-02 | `github-governance-map.md` と runbook に重大な矛盾がある | Phase 8 に戻り正本を確定後、Phase 9 を再実施 |
| NG-03 | secrets 実値が設計書・runbook に混入している | 即座に削除し、Phase 9 を再実施 |
| NG-04 | CODEOWNERS の reviewer が存在しないアカウントを参照している | CODEOWNERS を修正後、Phase 9 を再実施 |

### ステップ 5: 4 条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する
- Phase 10 に渡す blocker と open question を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-08/main.md` | DRY 化レポート（品質チェックの前提） |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-02/github-governance-map.md` | 設定値の正本（チェック基準値の根拠） |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md` | 適用 runbook（整合チェック対象） |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-05/pull-request-template.md` | PR テンプレート（PT チェック対象） |
| 必須 | `doc/01a-parallel-github-and-branch-governance/phase-07.md` | AC マトリクス（GO/NO-GO 判定の根拠） |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | 4 条件の定義テキスト（PT-05 整合基準） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping（チェック基準値） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート（CI チェック基準値） |
| 参考 | GitHub Repository Settings | branch protection / environments（実設定の確認先） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC マトリクスを GO/NO-GO 判定の根拠として使用 |
| Phase 8 | DRY 化レポートを品質チェックの前提入力として使用 |
| Phase 10 | 本 Phase の品質保証チェックリストと GO/NO-GO 判定を最終レビューの入力として使用 |
| Phase 12 | close-out 時の同期確認項目として品質チェックリストを参照 |

## 多角的チェック観点

- **価値性**: 手動品質チェックリストを整備することで、将来の drift 発見コスト（目視確認の属人性）を削減できるか。drift 検出基準が具体的なトリガーイベントに紐付いているか
- **実現性**: docs-only スコープで完結するか。CI 実行なしで品質保証チェックが完了できるか。GitHub UI の確認手順が無料枠で実施可能か
- **整合性**: 品質チェックリストの基準値が `github-governance-map.md`（正本）と一致しているか。GO/NO-GO 判定基準が AC-1〜5 と矛盾しないか
- **運用性**: drift 検出トリガーが明確で、担当者が適切なタイミングでチェックリストを実施できるか。NO-GO 時の対処フローが明確か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流成果物の読み込み | 9 | pending | phase-08 output / phase-07 AC マトリクス |
| 2 | Branch protection 品質チェック項目の整備（BP-01〜08） | 9 | pending | 8 項目 |
| 3 | Environments 品質チェック項目の整備（ENV-01〜06） | 9 | pending | 6 項目 |
| 4 | CI status checks 整合チェック項目の整備（CI-01〜03） | 9 | pending | 3 項目 |
| 5 | CODEOWNERS 品質チェック項目の整備（CO-01〜06） | 9 | pending | 6 項目 |
| 6 | PR template 品質チェック項目の整備（PT-01〜05） | 9 | pending | 5 項目 |
| 7 | Secrets / Variables 品質チェック項目の整備（SEC-01〜04） | 9 | pending | 4 項目 |
| 8 | Drift 検出基準の定義 | 9 | pending | 7 トリガーイベント |
| 9 | GO/NO-GO 判定基準の確立 | 9 | pending | G-01〜06 / NG-01〜04 |
| 10 | 品質保証チェックリストの作成 | 9 | pending | `outputs/phase-09/main.md` |
| 11 | 4 条件と Phase 10 への handoff 確認 | 9 | pending | blocker と open question を記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `doc/01a-parallel-github-and-branch-governance/outputs/phase-09/main.md` | 品質保証チェックリスト（手動チェック項目・drift 検出基準・GO/NO-GO 判定基準） |
| メタ | `doc/01a-parallel-github-and-branch-governance/artifacts.json` | Phase 9 状態を completed に更新 |

## 完了条件

- [ ] `outputs/phase-09/main.md` が作成済み
- [ ] branch protection の手動品質チェック項目（BP-01〜08）が記録済み
- [ ] environment の手動品質チェック項目（ENV-01〜06）が記録済み
- [ ] CI status checks の整合チェック項目（CI-01〜03）が記録済み
- [ ] CODEOWNERS の品質チェック項目（CO-01〜06）が記録済み
- [ ] PR template の品質チェック項目（PT-01〜05）が記録済み
- [ ] secrets の品質チェック項目（SEC-01〜04）が記録済み
- [ ] drift 検出基準（7 トリガーイベント）が記録済み
- [ ] Phase 10 への GO/NO-GO 判定基準（G-01〜06 / NG-01〜04）が記録済み
- [ ] downstream handoff（Phase 10 への引き継ぎ事項）が明記されている

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（ステップ 1〜5）が completed
- [ ] 全成果物が指定パスに配置済み（`outputs/phase-09/main.md`）
- [ ] 全完了条件にチェック済み
- [ ] 異常系（AC FAIL / 設定矛盾 / secrets 実値混入 / CODEOWNERS 不正）も検証済み
- [ ] 次 Phase（Phase 10）への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の phase-09 を completed に更新済み

## 次Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項:
  - `outputs/phase-09/main.md`（品質保証チェックリスト）を最終レビューの入力として渡す
  - GO/NO-GO 判定結果（G-01〜06 の充足状況）を明記する
  - 未解消の NO-GO 条件があれば blocker として明記する
- ブロック条件: `outputs/phase-09/main.md` が未作成、または NG-01〜04 のいずれかに該当するなら Phase 10 に進まない

## 4 条件評価テーブル

| 条件 | 評価観点 | 判定基準 | 判定 |
| --- | --- | --- | --- |
| 価値性 | 手動品質チェックリストが drift 発見コストを削減できるか。drift 検出基準が具体的なトリガーイベントに紐付いているか | チェックリストに 30 項目以上の具体的確認項目がある。drift トリガーが 5 件以上定義されている | TBD |
| 実現性 | CI 実行なしで品質保証チェックが完了できるか。GitHub UI の確認が無料枠で実施可能か | docs-only スコープで完結し、GitHub 無料枠内で全チェックが実施できる | TBD |
| 整合性 | 品質チェックリストの基準値が `github-governance-map.md`（正本）と一致しているか。GO/NO-GO 判定基準が AC-1〜5 と矛盾しないか | 基準値が governance-map と一致。GO 条件に全 AC PASS が含まれる | TBD |
| 運用性 | drift 検出トリガーが明確で、担当者が適切なタイミングでチェックリストを実施できるか。NO-GO 時の対処フローが明確か | トリガーイベントが具体的で、NO-GO 時の対処方針が各条件に記載されている | TBD |

## 品質ゲート基準（deployment-core.md より）

このタスクは docs-only のため CI 実行は不要。設計書の品質チェックのみを対象とする。

| チェック項目 | 通常基準 | docs-only 適用 |
| --- | --- | --- |
| TypeScript 型チェック | エラーゼロ | 不要（コード実装なし） |
| ESLint | エラーゼロ | 不要（コード実装なし） |
| ビルド | 成功 | 不要（コード実装なし） |
| ユニットテスト | カバレッジ 60% 以上 | 不要（コード実装なし） |
| 設計書整合性 | — | 全チェック項目 PASS 必須 |
| secrets 実値混入なし | — | SEC-01 PASS 必須 |

## 命名規則チェック

| 対象 | 基準 | 判定 |
| --- | --- | --- |
| task dir | wave + mode + kebab-case（例: `01a-parallel-github-and-branch-governance`） | TBD |
| branch 名 | `feature/*` / `dev` / `main` の 3 層構造 | TBD |
| secret 名 | `ALL_CAPS_SNAKE_CASE`（例: `CLOUDFLARE_API_TOKEN`） | TBD |
| environment 名 | 小文字 kebab-case（例: `production`, `staging`） | TBD |

## 参照整合性チェック

- `github-governance-map.md` と `repository-settings-runbook.md` の参照が生きているか
- `outputs/` 配下の全ファイルパスが `artifacts.json` に記録されているか
- Phase 仕様書と outputs の path が一致しているか

## 無料枠遵守チェック

- GitHub Actions の使用量が無料枠（パブリックリポジトリは無制限、プライベートは月 2000 分）を超えないか
- 常設通知（Slack 通知等の有料サービス）を前提にしていないか
- GitHub Environments の reviewer 機能が無料プランで利用可能か確認済みか

## Secrets 漏洩チェック

- `outputs/` 配下に secrets 実値を書いていない（プレースホルダーのみ）
- local canonical（1Password）が平文 `.env` より優先されていることが記録されている
- Cloudflare Secrets と GitHub Secrets の配置先が混線していない（runtime 用 → Cloudflare / CI 用 → GitHub）

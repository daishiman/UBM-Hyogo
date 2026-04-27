# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-27 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

UT-19（GitHub branch protection / Environments 手動適用）の真の論点・スコープ・受入条件を確定し、下流 Phase が `gh api` 適用と証跡取得を迷わず進められる根拠を整える。**個人開発のため PR 承認は不要**、CI チェック (`ci` / `Validate Build`) 通過のみを必須ゲートとする方針を本 Phase で確定する。

## 実行タスク

- branch protection / Environments 適用の真の論点を特定する
- 上流（01a ランブック / UT-05 CI 実行）と下流（UT-05 / UT-06）の責務境界を確定する
- 受入条件 (AC-1〜AC-7) を index.md と一致させて正式定義する
- 4条件評価（価値性 / 実現性 / 整合性 / 運用性）を行う
- 既存資産インベントリ（ランブック・CI ワークフロー・Environments 現状）を洗い出す
- タスク分類（docs-only / operations evidence）と artifact 命名 canonical 一覧を固定する
- 強化ループ / バランスループ、KJ クラスタ、戦略仮説を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 適用コマンド・手順の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略正本（dev / main の役割・命名） |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/index.md | タスク概要・AC |
| 必須 | docs/30-workflows/unassigned-task/UT-19-github-branch-protection-manual-apply.md | unassigned-task 起票時点の元仕様 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Environments 設定方針 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 全体方針 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: input と前提の確認

- index.md・元仕様（unassigned-task）・ランブック（01a Phase 5 成果物）を読む
- UT-05 で `ci` / `Validate Build` の context が GitHub 内部 DB に登録済みかを確認する
- `develop` 残存を `grep -rn "develop" docs/ .github/` で確認する

### ステップ 2: Phase 成果物の作成

- AC-1〜AC-7 を index.md と完全一致で固定する
- 4条件評価を埋め、TBD を残さない
- 既存資産インベントリ（ランブック / CI / Environments / 既存 protection 設定）を表に落とす

### ステップ 3: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を評価する
- 次 Phase（設計）に渡す blocker と open question を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の AC・スコープを設計の入力として使用 |
| Phase 5 | AC-1〜AC-5 の適用・証跡取得の根拠 |
| Phase 6 | 422 / 403 / branch 名揺れの異常系設計の根拠 |
| Phase 7 | AC × Phase トレース表の入力 |

## 多角的チェック観点（AIが判断）

- 価値性: branch protection 適用で CI ゲートが実機能し、PR マージ事故が抑止できるか
- 実現性: `gh api` のみで main / dev / Environments を完結させられるか（UI 操作必要箇所の特定含む）
- 整合性: ランブック・正本仕様（dev / main）と適用 payload に齟齬がないか
- 運用性: `enforce_admins=false` 採用時の admin override 経路と rollback 手順が明確か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点・依存境界の確定 | 1 | pending | index.md / 元仕様を読む |
| 2 | 4条件評価 | 1 | pending | 価値性 / 実現性 / 整合性 / 運用性 |
| 3 | AC 正式定義 | 1 | pending | index.md と完全一致 |
| 4 | 既存資産インベントリ | 1 | pending | runbook・CI・Environments 現状 |
| 5 | 正本仕様参照表の確認 | 1 | pending | deployment-branch-strategy.md 確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 真の論点・依存境界が確定している
- 4条件評価が全て TBD でない
- AC-1〜AC-7 が index.md と一致して定義されている
- 既存資産インベントリが作成されている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（CI 未実行による 422 / branch 名揺れ / enforce_admins 罠）も認識済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC-1〜AC-7・スコープ・4条件評価の結果・既存資産インベントリを設計の入力として渡す
- ブロック条件: 本 Phase の主成果物（requirements.md）が未作成なら次 Phase に進まない

## 真の論点

- `required_status_checks.contexts` の値（`ci` / `Validate Build`）が CI 実行前に GitHub 内部 DB へ登録されていない場合、`gh api PUT .../branches/main/protection` は 422 になる。本タスク着手前に UT-05 の CI を1回以上回しておく必要がある。
- `enforce_admins` を true にすると個人開発の admin（自分）が緊急修正できなくなる。`enforce_admins=false` を本タスクで明示採用する。
- `develop` という旧名称が残っていると意図しないブランチに protection が適用されるリスクがある。適用前に grep で残存を解消する必要がある。
- Environments のブランチポリシーは `gh api` だけでは完結せず UI 操作が必要な箇所がある。UI 操作 + `gh api` 検証の併用ポリシーを Phase 2 で確定する。

## 依存関係・責務境界

| 種別 | 対象 | 内容 |
| --- | --- | --- |
| 上流 | 01a-parallel-github-and-branch-governance | ランブック (`repository-settings-runbook.md`) が作成済み |
| 上流 | UT-05 (CI/CD パイプライン実装) | CI ワークフローが1回以上実行され context 名が登録済み |
| 下流 | UT-05 | branch protection が無いと PR マージ時の CI ゲートが機能しない |
| 下流 | UT-06 (本番デプロイ実行) | branch protection 確定が前提 |
| 下流 | 03/04/05 系タスク | CI ゲートのアンブロック先 |

## 価値とコスト

- 初回価値: PR マージ事故の構造的抑止と、CI 通過のみで auto-deploy できる個人開発最適ゲートの確立
- 初回で払わないコスト: code owners / signed commits / 組織レベルポリシー / Required Reviewers
- コスト: `gh api` 数回の実行と UI 操作のみ。金銭コストはゼロ（GitHub Free for personal）

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | CI ゲートが実機能し、PR マージ事故・誤 push を構造的に抑止できるか | PASS（承認不要の個人開発方針を維持しつつ status check を必須化するため） |
| 実現性 | `gh api` + UI 操作のみで main / dev / Environments を完結させられるか | PASS（branch protection は API、Environment branch policy は UI 併用で実現可能） |
| 整合性 | ランブック・正本仕様（dev / main）と適用 payload に齟齬がないか | PASS（正式ブランチは `dev` / `main`。旧 `develop` は検査対象として扱う） |
| 運用性 | `enforce_admins=false` での admin override 経路と rollback 手順が明確か | PASS（before snapshot と admin override を運用境界として採用） |

## スコープ

### 含む

- `main` branch protection 適用（承認不要・status check 必須・force push 禁止・branch deletion 禁止）
- `dev` branch protection 適用（同上）
- production environment ブランチポリシー（`main` のみ・Required Reviewers 0）
- staging environment ブランチポリシー（`dev` のみ）
- `gh api` での適用前/後 JSON 取得と差分確認
- 適用結果の証跡記録

### 含まない

- ランブックそのものの作成（01a Phase 5 で作成済み）
- GitHub Actions ワークフロー実装（→ UT-05）
- Cloudflare 側のデプロイ設定（→ UT-06）
- 組織レベルポリシー / code owners / signed commits 強制

## 受入条件 (AC)

- AC-1: `main` branch protection が適用され、`required_status_checks.contexts` に `ci` / `Validate Build` が登録され、`required_pull_request_reviews.required_approving_review_count = 0`、`allow_force_pushes = false`、`allow_deletions = false` が `gh api` で確認できる
- AC-2: `dev` branch protection が適用され、`main` と同等の status check 必須・force push 禁止・branch deletion 禁止・承認不要が `gh api` で確認できる
- AC-3: production environment のブランチポリシーが `main` のみに限定され、Required Reviewers が 0 名であることが GitHub UI で確認できる
- AC-4: staging environment のブランチポリシーが `dev` のみに限定されていることが GitHub UI で確認できる
- AC-5: 適用前 / 適用後の `gh api` レスポンス JSON が `outputs/phase-05/` に証跡として保存されている
- AC-6: ランブック（`repository-settings-runbook.md`）の手順と実適用結果が乖離していないことが Phase 7 で確認されている
- AC-7: 既存のドキュメントで `develop` という旧ブランチ名が残存していないことが確認されている

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| ランブック | `repository-settings-runbook.md` の存在と適用コマンド | 要確認（01a Phase 5 成果物） |
| CI ワークフロー | `.github/workflows/` の `ci` / `Validate Build` ジョブ | 要確認（UT-05 成果物） |
| status check context 登録 | GitHub 内部 DB に context 名が登録済みか | 要確認（CI 1 回以上実行が必要） |
| main protection 現状 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` の応答 | 要確認 |
| dev protection 現状 | `gh api .../branches/dev/protection` の応答 | 要確認 |
| Environments | production / staging の存在とポリシー | 要確認 |
| `develop` 残存 | `grep -rn "develop" docs/ .github/` | 要確認 |

## タスク分類と artifact 命名 canonical

| 項目 | 判定 |
| --- | --- |
| タスク分類 | docs-only / operations evidence task（GitHub 設定の手動適用手順と証跡を仕様化する。コード実装は含まない） |
| 状態 | `spec_created`（実適用の PASS/FAIL は Phase 5 以降の成果物で確定） |
| root ledger | `artifacts.json` |
| outputs ledger | `outputs/artifacts.json`（root ledger の同期コピー） |
| Phase 成果物 | `outputs/phase-NN/*.md` または `outputs/phase-NN/*.json` |
| branch protection 証跡 | `outputs/phase-05/gh-api-{before,after}-{main,dev}.json` |

## 因果ループ / KJ クラスタ / 戦略仮説

| 種別 | 内容 |
| --- | --- |
| 強化ループ | branch protection が CI 必須化を固定する → PR マージ前の検証が習慣化する → dev/main の信頼度が上がる → branch protection を維持する価値が増える |
| バランスループ | 保護を強くしすぎると個人開発の復旧速度が落ちる → `enforce_admins=false` と承認不要で運用負荷を下げる → CI ゲートだけを残して安全性と速度を均衡させる |
| KJ クラスタ | A: ブランチ名揺れ、B: CI context 登録、C: GitHub API payload、D: Environment UI 操作、E: 証跡保存、F: Phase 12 同期 |
| 戦略仮説 | 個人開発ではレビュアー承認より CI check と branch deletion / force push 禁止の方が事故削減効果が高い |

## 正本仕様参照表

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 適用コマンド・手順の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略正本 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/index.md | タスク概要・AC の正本 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Environments 設計の背景 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 全体方針 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

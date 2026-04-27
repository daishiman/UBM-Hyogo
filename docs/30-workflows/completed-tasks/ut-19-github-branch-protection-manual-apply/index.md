# ut-19-github-branch-protection-manual-apply - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-19 |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 |
| ディレクトリ | docs/30-workflows/ut-19-github-branch-protection-manual-apply |
| Wave | 1 |
| 優先度 | HIGH |
| 実行種別 | 単独タスク（CI ゲート確定の独立作業） |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | spec_created |
| タスク種別 | docs-only（GitHub 設定の手動適用＋手順記録） |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #26（CLOSED 状態のまま仕様書化） |

## 目的

`01a-parallel-github-and-branch-governance` タスクで作成済みのランブック（`repository-settings-runbook.md`）を実際に GitHub に適用し、`main` / `dev` の branch protection rules と Environments（production / staging）のブランチポリシーを確定する。**個人開発のため PR 承認は不要**とし、CI チェック（`ci` / `Validate Build`）通過のみを必須ゲートとする。

> **着手前提**: `01a-parallel-github-and-branch-governance` 完了 + UT-05（CI/CD パイプライン実装）で CI ワークフローが1度以上実行されていること。先に CI を回さないと `required_status_checks.contexts` の context 名が GitHub 内部 DB に未登録のため `gh api PUT .../branches/main/protection` が 422 エラーになる。

## スコープ

### 含む

- `main` ブランチ保護設定の適用（承認不要・status check 必須・force push 禁止・branch deletion 禁止）
- `dev` ブランチ保護設定の適用（承認不要・status check 必須・force push 禁止・branch deletion 禁止）
- GitHub Environments（production）のブランチポリシー設定（`main` のみ許可、Required Reviewers なし）
- GitHub Environments（staging）のブランチポリシー設定（`dev` のみ許可）
- `gh api` コマンドによる適用後の設定値検証・差分確認
- 適用結果の証跡記録（適用前 / 適用後の API レスポンス比較）

### 含まない

- ランブックそのものの作成（`01a-parallel-github-and-branch-governance` Phase 5 で作成済み）
- GitHub Actions ワークフローの実装（→ UT-05 のスコープ）
- Cloudflare 側のデプロイ設定（→ UT-06 のスコープ）
- 組織レベルのポリシー設定（リポジトリ単位のみが対象）
- Code owners / signed commits の強制（個人開発のため未採用）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01a-parallel-github-and-branch-governance | ランブック（`repository-settings-runbook.md`）が作成済みであること |
| 上流 | UT-05（CI/CD パイプライン実装） | status check context（`ci` / `Validate Build`）が GitHub に登録されるには CI ワークフローを1回以上実行している必要がある |
| 下流 | UT-05（CI/CD パイプライン実装） | branch protection が有効でないと PR マージ時の CI ゲートが機能しない |
| 下流 | UT-06（本番デプロイ実行） | branch protection が確定しないと本番デプロイの CI ゲートが機能しない |
| 下流 | 03/04/05 系タスク | branch protection 確定で CI ゲートがアンブロックされる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 適用コマンド・手順の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略正本（dev / main の役割・命名確認） |
| 必須 | docs/30-workflows/unassigned-task/UT-19-github-branch-protection-manual-apply.md | UT-19 元仕様（unassigned-task 起票時点） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Environments 設定方針・Cloudflare との連携 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 全体方針・ブランチ保護設計の背景 |
| 参考 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-12/unassigned-task-detection.md | UT-19 の検出コンテキスト |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 受入条件 (AC)

- AC-1: `main` branch protection が適用され、`required_status_checks.contexts` に `ci` / `Validate Build` が登録され、`required_pull_request_reviews.required_approving_review_count = 0`、`allow_force_pushes = false`、`allow_deletions = false` が `gh api` で確認できる
- AC-2: `dev` branch protection が適用され、`main` と同等の status check 必須・force push 禁止・branch deletion 禁止・承認不要が `gh api` で確認できる
- AC-3: production environment のブランチポリシーが `main` のみに限定され、Required Reviewers が 0 名であることが GitHub UI で確認できる
- AC-4: staging environment のブランチポリシーが `dev` のみに限定されていることが GitHub UI で確認できる
- AC-5: 適用前 / 適用後の `gh api` レスポンス JSON が `outputs/phase-05/` に証跡として保存されている
- AC-6: ランブック（`repository-settings-runbook.md`）の手順と実適用結果が乖離していないことが Phase 7 で確認されている
- AC-7: 正式ブランチ指定として `develop` という旧ブランチ名が残存していないことが確認されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01 |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | completed | outputs/phase-04 |
| 5 | 適用実行 | phase-05.md | completed | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | completed | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | pending | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| ドキュメント | outputs/phase-02/branch-protection-design.md | branch protection / Environments 設計 |
| ドキュメント | outputs/phase-02/api-payload-matrix.md | `gh api` payload と期待 response のマトリクス |
| ドキュメント | outputs/phase-04/pre-apply-checklist.md | 事前検証チェックリスト |
| 証跡 | outputs/phase-05/gh-api-before-main.json | 適用前の main protection レスポンス |
| 証跡 | outputs/phase-05/gh-api-after-main.json | 適用後の main protection レスポンス |
| 証跡 | outputs/phase-05/gh-api-before-dev.json | 適用前の dev protection レスポンス |
| 証跡 | outputs/phase-05/gh-api-after-dev.json | 適用後の dev protection レスポンス |
| ドキュメント | outputs/phase-05/apply-execution-log.md | 適用コマンド・実行ログ |
| ドキュメント | outputs/phase-06/abnormal-cases-report.md | 422 / 403 / branch名揺れ等の異常系検証 |
| ドキュメント | outputs/phase-07/coverage-matrix.md | AC × Phase トレース表 |
| ドキュメント | outputs/phase-08/runbook-dry-diff.md | runbook と実適用の差分・統合提案 |
| ドキュメント | outputs/phase-09/quality-report.md | 品質ゲート判定 |
| ドキュメント | outputs/phase-10/final-review.md | 最終レビュー |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | 手動 smoke test ログ（非視覚タスク） |
| ドキュメント | outputs/phase-11/main.md | Phase 11 サマリ |
| ドキュメント | outputs/phase-11/link-checklist.md | 関連リンク健全性確認 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（Part 1/2 構成） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | システム仕様更新サマリ |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出レポート |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | スキルフィードバックレポート |
| メタ | artifacts.json | 機械可読サマリー（root） |
| メタ | outputs/artifacts.json | 機械可読サマリー（outputs 同期コピー） |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| GitHub Repository Settings | branch protection / Environments の宛先 | 無料（GitHub Free for personal） |
| GitHub Actions | status check の実体（`ci` / `Validate Build`） | 無料枠（2,000 min/月） |
| `gh` CLI | API 経由での protection 適用・検証 | 無料 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-7 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見

**1. status check context 名が CI 実行前に未登録（最重要）**: `required_status_checks.contexts` に `ci` や `Validate Build` を指定するが、これらの context 名は GitHub Actions ワークフローが1度も実行されていないと GitHub 内部 DB に登録されない。この状態で `gh api PUT .../branches/main/protection` を実行すると `422 Unprocessable Entity` になる。先に UT-05 の CI を1回実行してから本タスクへ着手すること。

**2. production environment Required Reviewers は設定しない（個人開発方針）**: 個人開発のため PR 承認および production Required Reviewers は不要。設定すると自分自身がデプロイをブロックする。0 名のまま CI 通過のみで自動デプロイする。

**3. ブランチ名の揺れ（`develop` → `dev`）**: 正本仕様（`deployment-branch-strategy.md`）では `dev` が正式だが、過去に `develop` で書かれていた箇所がある。protection 適用前に `grep -rn "develop" docs/ .github/` で残存を確認し、揺れを解消してから適用する（揺れがあると意図しないブランチに protection が適用されるリスク）。

**4. Environments のブランチポリシーは `gh api` では完結しない**: Environments のブランチポリシーは `gh api` で部分的に操作可能だが、UI 経由（Settings > Environments）での確認・設定が確実。本タスクでは UI 操作 + `gh api` 検証の併用とする。

**5. branch protection の `enforce_admins` 設定**: 個人開発でも `enforce_admins = true` にすると自分自身が緊急修正できなくなる。本タスクでは `enforce_admins = false` を採用し、緊急時の admin override 経路を残す。

## 関連リンク

- 上位 README: ../README.md
- 元仕様（unassigned-task）: ../../unassigned-task/UT-19-github-branch-protection-manual-apply.md
- ランブック正本: ../../completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/26

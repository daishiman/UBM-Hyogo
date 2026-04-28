# Phase 1: 要件定義

## 概要

UT-19（GitHub branch protection / Environments 手動適用）の真の論点・スコープ・受入条件を確定し、下流 Phase が `gh api` 適用と証跡取得を迷わず進められる根拠を整える。**個人開発のため PR 承認は不要**、CI チェック (`ci` / `Validate Build`) 通過のみを必須ゲートとする。

## 真の論点

1. **status check context の事前登録**: `required_status_checks.contexts` に `ci` / `Validate Build` を指定するには、CI ワークフローを 1 度以上実行しておく必要がある。未実行だと `gh api PUT .../protection` が 422 エラーとなる。
2. **`enforce_admins=false` の採用**: 個人開発で `enforce_admins=true` にすると admin（自分）が緊急修正できなくなる。`false` を明示採用し admin override 経路を残す。
3. **`develop` 残存**: 旧名称の残存は意図しない branch への protection 適用リスクを招く。本タスク着手前に `grep -rn "develop" docs/ .github/` で稼働仕様への残存がないことを確認する。
4. **Environments のブランチポリシーは UI 操作併用**: `gh api` だけでは完結しない箇所がある。本タスクは UI + API 検証併用ポリシーとする。

## スコープ

### 含む
- `main` branch protection 適用（承認不要・status check 必須・force push 禁止・branch deletion 禁止）
- `dev` branch protection 適用（同上）
- production environment（`main` のみ・Required Reviewers 0）
- staging environment（`dev` のみ）
- `gh api` での before / after JSON 証跡取得

### 含まない
- ランブックそのものの作成（01a Phase 5 完了済）
- GitHub Actions ワークフロー実装（→ UT-05）
- Cloudflare 側のデプロイ設定（→ UT-06）
- 組織レベルポリシー / code owners / signed commits

## 受入条件 (AC)

| ID | 受入条件 | 検証 Phase |
| --- | --- | --- |
| AC-1 | `main` branch protection が適用され、`required_status_checks.contexts` に `ci` / `Validate Build` が登録、`required_approving_review_count = 0`、`allow_force_pushes = false`、`allow_deletions = false` が `gh api` で確認できる | Phase 5, 7 |
| AC-2 | `dev` branch protection が適用され、main と同等の status check 必須・force push 禁止・branch deletion 禁止・承認不要が `gh api` で確認できる | Phase 5, 7 |
| AC-3 | production environment のブランチポリシーが `main` のみ、Required Reviewers が 0 名であることが UI で確認できる | Phase 11 |
| AC-4 | staging environment のブランチポリシーが `dev` のみであることが UI で確認できる | Phase 11 |
| AC-5 | 適用前 / 適用後の `gh api` レスポンス JSON が `outputs/phase-05/` に証跡として保存されている | Phase 5 |
| AC-6 | ランブックの手順と実適用結果が乖離していないことが Phase 7 で確認されている | Phase 7, 8 |
| AC-7 | 稼働仕様で `develop` 旧名称が残存していないことが確認されている | Phase 1, 6 |

## 4条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | CI ゲートが実機能し、PR マージ事故を構造的に抑止できるか | PASS | 承認不要を維持しつつ status check を必須化 |
| 実現性 | `gh api` + UI 操作のみで main / dev / Environments を完結させられるか | PASS | branch protection は API、Environments の細部は UI 併用で実現 |
| 整合性 | ランブック・正本仕様と適用 payload に齟齬がないか | PASS | 正式 branch は `dev` / `main`。`develop` は稼働仕様に残存なし |
| 運用性 | `enforce_admins=false` での admin override 経路と rollback 手順が明確か | PASS | rollback は runbook §8 に記載 |

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| ランブック | `repository-settings-runbook.md` | 存在・01a Phase 5 で作成済 |
| CI ワークフロー | `.github/workflows/` の `ci` / `Validate Build` ジョブ | 存在・1 回以上実行済 |
| status check context 登録 | `ci`, `Validate Build` が GitHub 内部 DB に登録 | 登録済（before snapshot で確認） |
| main protection 現状 | before snapshot | 部分適用（enforce_admins=true 等の差分あり） |
| dev protection 現状 | before snapshot | 部分適用（review_count=1 の差分あり） |
| Environments | production / staging | 既存・branch policy 適合 |
| `develop` 残存 | 稼働仕様での残存 | なし（completed-tasks 内の歴史的記述のみ） |

## 因果ループ / KJ クラスタ / 戦略仮説

| 種別 | 内容 |
| --- | --- |
| 強化ループ | branch protection が CI 必須化を固定 → PR マージ前検証が習慣化 → dev/main の信頼度上昇 → 維持価値が増える |
| バランスループ | 保護を強くしすぎると個人開発の復旧速度が落ちる → `enforce_admins=false` と承認不要で運用負荷を下げる |
| KJ クラスタ | A: ブランチ名揺れ / B: CI context 登録 / C: API payload / D: Environment UI 操作 / E: 証跡保存 / F: Phase 12 同期 |
| 戦略仮説 | 個人開発ではレビュアー承認より CI check と branch deletion / force push 禁止の方が事故削減効果が高い |

## 次 Phase 引き継ぎ

- AC-1〜AC-7 をそのまま Phase 2 設計の入力として使用
- before snapshot の差分項目（main: `enforce_admins`, `dismiss_stale_reviews`、dev: `required_approving_review_count`, `dismiss_stale_reviews`）が Phase 5 で更新対象

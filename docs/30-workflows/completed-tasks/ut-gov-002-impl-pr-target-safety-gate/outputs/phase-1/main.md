# Phase 1 — 要件定義（main）

## Status

spec_created

> 本書は `ut-gov-002-impl-pr-target-safety-gate` の要件定義であり、上流 dry-run 仕様（`docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/`）の input を継承しつつ、**実 workflow ファイル編集** と **4 系統 dry-run 実走** を本タスクで完結させるための前提・スコープ・リスクを固定する。

## メタ固定値

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | VISUAL（GitHub Actions UI 実行ログ / branch protection required status checks 画面のスクリーンショット） |
| scope | infrastructure_governance + security |
| GitHub Issue | #204（CLOSED のまま spec_created） |
| 上流 | UT-GOV-002（dry-run 仕様） |

`artifacts.json` の `metadata.task_type` / `metadata.visualEvidence` / `metadata.scope` と本表を一致させる（AC-9）。

## 0. 上位原則

**trusted context（base リポの secrets / write GITHUB_TOKEN を持つ実行コンテキスト）では untrusted PR code を checkout / install / build / eval しない。**

上記原則を実 workflow ファイルへ落とし込むのが本 IMPL タスクの責務である。

## 1. 真の論点（4 つ）

| ID | 論点 | 担当 Phase |
| --- | --- | --- |
| (a) | `pull_request_target` の **triage 専用化** を実 workflow `.github/workflows/pr-target-safety-gate.yml` に適用する。PR head は checkout / install / build / test しない。 | Phase 2 / 5 |
| (b) | untrusted build / lint / test を実 workflow `.github/workflows/pr-build-test.yml`（`pull_request` trigger）へ **実分離** する。`permissions: { contents: read }` のみで動作させる。 | Phase 2 / 5 |
| (c) | fork PR / same-repo PR / labeled trigger / workflow_dispatch audit の 4 系統で dry-run を **実走** し、`gh run view --log` 上で secrets / token 露出ゼロを目視確認する。 | Phase 4 / 11 |
| (d) | GitHub Actions UI の job 実行ログと branch protection の required status checks 画面を **スクリーンショット（VISUAL evidence）** として `outputs/phase-11/screenshots/` に保存する。 | Phase 11 |

## 2. スコープ境界

### 2.1 含む

- `.github/workflows/pr-target-safety-gate.yml` の追加（または既存 triage workflow の境界調整）
- `.github/workflows/pr-build-test.yml` の追加（または既存 build workflow への分離適用）
- workflow デフォルト `permissions: {}` ＋ job 単位の最小昇格
- 全 `actions/checkout` への `persist-credentials: false` 強制（既存 workflow を含めて棚卸し）
- fork PR / same-repo PR / labeled trigger / workflow_dispatch audit の 4 系統 dry-run 実走
- `actionlint` / `yq` / `grep` 静的検査の実走と結果保存
- GitHub Actions UI / branch protection 画面の VISUAL evidence 取得
- 単一 `git revert` コミット粒度のロールバック手順確立

### 2.2 含まない（非スコープ宣言）

| 領域 | 委譲先 | 理由 |
| --- | --- | --- |
| secrets rotate | UT-GOV-002-OBS | 権限境界変更と secret 値変更を同時実施するとレビュー粒度が荒くなる |
| OIDC `id-token: write` 化評価 | UT-GOV-002-EVAL | 認証方式変更は workflow 編集と独立した評価軸 |
| security review 最終署名 | UT-GOV-002-SEC | expert review 署名は本 IMPL の reviewability 担保後に独立で実施 |
| secrets inventory automation | UT-GOV-002-OBS | 観測自動化は別 wave |
| branch protection JSON 本適用 | UT-GOV-001（適用済み） | 前提として参照のみ |
| action pin policy 本適用 | UT-GOV-007（適用済み） | 前提として参照のみ |

## 3. 命名 canonical（上流 dry-run 仕様と同期）

| canonical | 用途 |
| --- | --- |
| `pull_request_target safety gate` | 本タスクが導入する safety gate 全体の呼称 |
| `triage workflow` | `.github/workflows/pr-target-safety-gate.yml` の構造的呼称 |
| `untrusted build workflow` | `.github/workflows/pr-build-test.yml` の構造的呼称 |
| `pwn request pattern` | GitHub Security Lab が定義する典型攻撃パターン |

揺れ表記（"PR target gate" / "untrusted job" / "safety-gate workflow"）は使用しない。Phase 3 の用語整合チェックでも同じ canonical を再検証する。

## 4. 横断依存

| 種別 | 対象 | 役割 |
| --- | --- | --- |
| 上流（必須） | UT-GOV-002（dry-run 仕様） | 設計・runbook・テストマトリクス・"pwn request" 非該当根拠の正本 |
| 前提 | UT-GOV-001（branch protection apply） | dev / main の required status checks が既に設定済み（job 名同期検証の前提） |
| 前提 | UT-GOV-007（action pin policy） | `uses:` が SHA pin 済み（外部 action からの pwn surface が無い前提） |
| 並列 | UT-GOV-002-EVAL / SEC / OBS | 評価・security 署名・観測自動化（互いに独立） |
| 下流 | UT-GOV-004（required status checks 追従） | job 名変更時に追従 |

## 5. リスク（R-1〜R-4）

| ID | リスク | 緩和先 |
| --- | --- | --- |
| R-1 | **pwn request パターン**：`pull_request_target` 下で PR head の checkout / install / build を行うと GITHUB_TOKEN 高権限下で untrusted code が実行される。 | Phase 2 design.md §2.1 / Phase 3 review.md §3 #1 / Phase 5 runbook |
| R-2 | **PR head checkout 混入**：既存 triage workflow に PR head 参照が残ったまま統合される。 | Phase 5 棚卸し（`grep ref:.*head` 実走）／ Phase 9 静的検査 |
| R-3 | **persist-credentials 未指定**：`actions/checkout` で `persist-credentials: false` が抜けるとトークンが残留し副作用が生じる。 | Phase 5 全 workflow 一括修正 / Phase 9 yq 検査 |
| R-4 | **required status checks 名 drift**：本タスクで導入する job 名が branch protection の `required_status_checks.contexts` と非同期化する。 | Phase 5 / Phase 11 で `gh api repos/:owner/:repo/branches/main/protection` 結果を VISUAL evidence と並べて記録 |

## 6. 用語集（初版）

| 用語 | 意味 |
| --- | --- |
| `pull_request_target` | PR の **base** リポジトリの secrets / write GITHUB_TOKEN を持つ context で動作する trigger。fork PR でも secrets が注入される。 |
| `pull_request` | PR の **head** を checkout できるが、fork PR では secrets 非注入・GITHUB_TOKEN は read-only に制限される trigger。 |
| `pwn request` | `pull_request_target` で untrusted PR code を checkout / 実行することで base リポの secrets / write 権限を奪取される攻撃パターン。 |
| `triage` | label 適用 / auto-merge 判定 / コメント投稿等、PR メタデータのみを操作する workflow 責務。 |
| `persist-credentials: false` | `actions/checkout` の `with` パラメータ。job 終了後にローカル `.git` 内へ GITHUB_TOKEN を残さない。 |
| `GITHUB_TOKEN` | GitHub Actions が job ごとに自動発行する短命トークン。`permissions:` で scope を制御する。 |
| `fork PR` | base リポの fork から提出される PR。`pull_request` では secrets 非注入だが、`pull_request_target` では注入される。 |
| `required status checks` | branch protection 設定で「マージ前に成功必須」とする job 名のリスト（`required_status_checks.contexts`）。 |
| `VISUAL evidence` | GitHub Actions UI / branch protection 画面のスクリーンショット。本タスクの visualEvidence 区分。 |

## 7. 統合テスト連携の予告

Phase 11 で実走する 4 系統 dry-run（fork PR / same-repo PR / labeled / workflow_dispatch audit）は、本 Phase で固定したリスク R-1〜R-4 が解消されていることの実走証跡となる。Phase 11 manual smoke の入口条件は以下：

- R-1 解消：triage workflow に PR head checkout step が無い（`grep` で確認）
- R-2 解消：既存 `pull_request_target` workflow の棚卸しが完了している（Phase 5）
- R-3 解消：全 `actions/checkout` に `persist-credentials: false` が付与されている（yq 確認）
- R-4 解消：`gh api .../branches/main/protection` の `contexts` が新 job 名と一致している

## 8. 成果物への相互参照

- `outputs/phase-2/main.md` / `outputs/phase-2/design.md`：本要件を実装設計に展開
- `outputs/phase-3/main.md` / `outputs/phase-3/review.md`：本要件と設計のレビュー署名

## 9. 完了条件チェック

- [x] 真の論点 (a)〜(d) を §1 に明記
- [x] 上流 dry-run 仕様 / UT-GOV-001 / UT-GOV-007 の依存関係を §4 に列挙
- [x] 命名 canonical を §3 に固定（上流と同期）
- [x] 非スコープ宣言を §2.2 に明記
- [x] リスク R-1〜R-4 を §5 に列挙
- [x] 用語集初版を §6 に記載
- [x] タスク種別 / visualEvidence / scope のメタ固定値を冒頭表に記載

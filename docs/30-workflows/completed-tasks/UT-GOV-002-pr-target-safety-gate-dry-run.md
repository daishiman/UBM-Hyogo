# pull_request_target safety gate dry-run（pwn request 対策） - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | UT-GOV-002-pr-target-safety-gate-dry-run                                      |
| タスク名     | `pull_request_target` workflow の安全境界確定と dry-run 検証                   |
| 分類         | 実装 / セキュリティ / GitHub Actions                                          |
| 対象機能     | `.github/workflows/*.yml`（特に `pull_request_target` を使う triage workflow） |
| 優先度       | 高（pwn request 系の供給網リスク対策）                                        |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | task-github-governance-branch-protection                                      |
| 発見元       | `outputs/phase-12/unassigned-task-detection.md` current U-2                   |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`pull_request_target` イベントは fork PR でも **base リポジトリのコンテキスト**で実行されるため、`secrets` と書込権限のある `GITHUB_TOKEN` が露出する強権限イベントである。GitHub Security Lab が "pwn request" として体系化した既知の攻撃面であり、triage（label 付け / metadata 操作）以外の用途で使うとサプライチェーン侵害に直結する。

本リポジトリは branch protection / CODEOWNERS と並行で governance 整備を進めており、`pull_request_target` の安全境界を定めた dry-run 記録を残すことが必須である（親タスク `task-github-governance-branch-protection`）。

### 1.2 問題点・課題

- `pull_request_target` 内で fork PR の head を checkout / install / build / test してしまうと、攻撃者が PR で送り込んだ任意コードが base 権限で実行される
- `actions/checkout` の `ref` を branch 名で動的解決すると、PR 中の force push レースで悪意ある SHA に差し替えられる
- workflow デフォルト `permissions:` を未指定にすると、`GITHUB_TOKEN` がリポジトリ既定（広い）権限で発行されてしまう
- `secrets` を `env:` でグローバル定義すると、triage job からも参照可能になり最小権限原則を破る
- `pull_request_target` と `pull_request` の権限差を取り違えやすい（前者は base、後者は fork コンテキスト）

### 1.3 放置した場合の影響

- 外部 contributor の悪意ある PR から `GITHUB_TOKEN` / Cloudflare secrets が窃取され、本番環境（D1 / Workers / Pages）が侵害される
- 悪意ある post-install スクリプト経由で release / deploy workflow が改ざんされる
- branch protection を回避する経路が残り、governance 仕様の信頼性が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

`pull_request_target` を triage 専用に縛り、untrusted PR コードの build / test は `pull_request` 側に分離する。fork PR シナリオで token / secret が露出しないことを dry-run で証跡化し、pwn request パターン非該当をレビュー記録に残す。

### 2.2 想定 AC

1. `pull_request_target` を使う workflow は **label / metadata 操作のみ** に限定され、PR head の checkout / install / build / test を一切行わない
2. untrusted PR の build / test は `pull_request` workflow（`permissions: contents: read`）に分離され、secrets を参照しない
3. すべての `actions/checkout` で `ref` は SHA か default branch のみを許容し、`persist-credentials: false` を設定
4. すべての workflow で workflow-level `permissions: {}` が設定され、必要 job 単位でのみ権限を昇格
5. `secrets` は job-level `env:` または `with:` でのみ受け渡し、workflow-level `env:` でグローバル定義しない
6. fork PR を模した dry-run（テストブランチ + draft PR）で `GITHUB_TOKEN` 権限・secrets 露出が triage job から見えないことを記録
7. GitHub Security Lab pwn request パターンの各項目に対して非該当チェックリストをレビュー記録として残す

### 2.3 スコープ

#### 含むもの

- `.github/workflows/` 配下の全 workflow の `permissions:` / `on:` / checkout 監査
- `pull_request_target` workflow の triage 限定化リファクタ
- `pull_request` workflow への build / test 分離
- fork PR 想定の dry-run 手順書化と実行ログ保存
- pwn request 非該当チェックリストの作成

#### 含まないもの

- action SHA pinning / allowlist 整備（UT-GOV-007 で扱う）
- branch protection 設定の API 適用（UT-GOV-001 で扱う）
- CODEOWNERS の governance パス追加（UT-GOV-003 で扱う）
- required status checks のコンテキスト同期（UT-GOV-004 で扱う）

### 2.4 成果物

- `.github/workflows/*.yml` の差分（`permissions:` 明示 / triage 分離 / checkout 安全化）
- dry-run ログ（fork 模擬 PR からの token / secret アクセス試行結果）
- pwn request 非該当チェックリスト（レビュー記録として `docs/30-workflows/task-github-governance-branch-protection/outputs/` 配下）
- 運用 Runbook 更新（`pull_request_target` 利用時の必須レビュー観点）

---

## 3. 影響範囲

- `.github/workflows/` 配下すべての workflow ファイル
- 特に triage 系（labeler / size 計測 / welcome 等）と CI 系（typecheck / lint / test / build）
- branch protection の required status checks 名（UT-GOV-004 と同期が必要）
- 外部 contributor 向け CONTRIBUTING / PR テンプレートのレビュー観点
- Cloudflare secrets を参照する deploy workflow（露出経路の遮断確認）

---

## 4. 依存・関連タスク

- 親: `task-github-governance-branch-protection`
- 連携: UT-GOV-007（GitHub Actions の action pin / allowlist 方針）
- 連携: UT-GOV-001（branch protection apply）— required status checks 名の整合
- 連携: UT-GOV-004（required status checks コンテキスト同期）
- 関連: `task-infra-cloudflare-cli-wrapper-001`（secrets 取扱原則）

---

## 5. 推奨タスクタイプ

implementation（セキュリティリファクタ + dry-run 検証）

---

## 6. 参照情報

- 草案: `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-2/design.md` §4
- 実装ガイド: 同 `outputs/phase-12/implementation-guide.md` §4
- 検出ログ: 同 `outputs/phase-12/unassigned-task-detection.md` の current U-2
- GitHub Security Lab: "Keeping your GitHub Actions and workflows secure: Preventing pwn requests"
- GitHub Docs: "Events that trigger workflows / pull_request_target"
- GitHub Docs: "Automatic token authentication / permissions"
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」

---

## 7. 備考

- triage workflow を新規追加する場合も、本タスクで定めたチェックリストの通過を必須レビュー要件にする
- dry-run は private fork または別ブランチからの draft PR で実施し、実 secrets を露出させない手順を確立する
- UT-GOV-007 の action pin と本タスクは **両方揃って初めて pwn request 防御が成立** する点を Runbook に明記する

---

## 8. 苦戦箇所・落とし穴

### 8.1 `pull_request_target` と `pull_request` の権限取り違え

- `pull_request_target` は **base リポジトリ**のコンテキストで走り、`secrets` と書込 `GITHUB_TOKEN` がデフォルトで利用可能
- `pull_request` は fork PR では **read-only** に縮退し、secrets も渡らない
- 「CI を fork PR でも動かしたい」という素朴な動機で `pull_request_target` に切り替えると、untrusted コード実行面に直結する
- 対策: build/test は `pull_request` のまま、triage のみ `pull_request_target` に分離

### 8.2 `actions/checkout` の `ref` 動的解決による force push レース

- `ref: ${{ github.event.pull_request.head.ref }}` のように **ブランチ名**で解決すると、checkout 時点で別 SHA に force push されていれば任意コード実行を許す
- 対策: `pull_request_target` 内では default branch（`ref` 省略）か、検証済み SHA（`github.event.pull_request.head.sha`）のみ許可
- さらに `persist-credentials: false` を必ず指定し、`GITHUB_TOKEN` を作業ツリーに残さない

### 8.3 `permissions:` の workflow-level / job-level 継承順序

- workflow-level `permissions:` を指定すると job-level で省略した job はその値を継承する
- workflow-level を `{}`（空）にしておき、必要 job のみ昇格する方が **デフォルト最小権限**になり安全
- 一部の job だけ `permissions:` を上書きしても、他 job が workflow-level を継承する点に注意（漏れやすい）

### 8.4 `secrets` の `env:` グローバル定義の罠

- workflow-level `env:` で `SECRET: ${{ secrets.X }}` と書くと、`pull_request_target` の triage job からも参照可能になる
- 対策: secrets は **必要 job の steps `env:` または `with:` でのみ**注入する
- triage job は secrets を一切参照しない構成にし、レビューで grep 可能な配置にする

### 8.5 dry-run の secrets 露出事故

- 「fork PR を模す」ために実 fork から PR を出すと、検証中に意図せず本物の secrets が走る経路を作りかねない
- 対策: dry-run は **draft PR** + **手動 dispatch 隔離** で行い、検証完了まで本番 deploy workflow を一時的に `workflow_dispatch` のみに縮退させる選択肢も検討
- environment protection rule（required reviewers）を併用し、誤起動でも secrets 注入前に止める

### 8.6 required status checks 名の同期忘れ

- triage と CI を分離すると job 名が変わり、UT-GOV-001 / UT-GOV-004 で設定した必須チェック名と不整合になる
- 対策: 本タスクでリネームが発生したら、UT-GOV-004 の context 同期タスクに必ず連絡し、PR を分けずに同一 PR / 連続 PR で更新する

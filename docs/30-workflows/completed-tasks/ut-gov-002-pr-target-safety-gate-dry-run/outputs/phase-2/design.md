# Phase 2 — 設計（design）

## Status

spec_created

> 本書は **設計仕様（草案）** であり、ここに掲載する YAML はリポジトリへ投入しない。実 workflow ファイル編集と dry-run 実走は本タスク非対象（AC-8）であり、Phase 5 実装ランブック以降の **別 PR** で行う。

## 0. 上位原則（Phase 1 §0 の再掲）

trusted context（base リポの secrets / write 権限を持つ実行コンテキスト）では untrusted PR code を checkout / install / build / eval しない。

## 1. 入力の継承（AC-6）

本設計は以下の上流成果物を **input として継承** する。

- 親タスク `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/phase-02.md`
- 親タスク `outputs/phase-2/design.md` §6（`pr-target-safety-gate.workflow.yml.draft`）— 構造方針の母本
- 親タスク `outputs/phase-3/review.md` — security 観点の母本
- 本タスク `outputs/phase-1/main.md` — 真の論点 / 命名 canonical / リスク

## 2. 責務分離設計

### 2.1 triage workflow（`pr-target-safety-gate.yml`）— 構造方針

- **trigger**: `pull_request_target`（`types: [opened, synchronize, reopened, labeled]`）
- **用途**: label 適用 / auto-merge 判定 / コメント投稿（PR メタデータ操作のみ）
- **PR head checkout**: **禁止**。`actions/checkout` を使う場合は `ref: ${{ github.event.repository.default_branch }}` または `ref: ${{ github.event.pull_request.base.sha }}` のみ許可
- **workflow デフォルト `permissions: {}`**: ワークフロー全体を no-permissions とし、必要な job のみ最小権限で昇格（例：triage job のみ `pull-requests: write`）
- **`persist-credentials: false`**: 全 `actions/checkout` ステップで強制
- **secrets**: 参照しない（`env:` で `${{ secrets.* }}` を渡さない）
- **script eval 禁止**: `${{ github.event.pull_request.head.* }}` / `${{ github.event.pull_request.title }}` / `${{ github.event.pull_request.body }}` 等の untrusted 文字列を `run:` のシェル展開に直接埋め込まない（環境変数経由で受け取り、quote 必須）

### 2.2 untrusted build workflow（`pr-untrusted-build.yml`）— 構造方針

- **trigger**: `pull_request`（`types: [opened, synchronize, reopened]`）
- **用途**: lint / typecheck / build / unit test（untrusted PR code の検証）
- **workflow デフォルト `permissions: {}`**、build job で `contents: read` のみ昇格
- **`actions/checkout`**: `ref: ${{ github.event.pull_request.head.sha }}` ＋ `persist-credentials: false`
- **secrets 不参照**: fork PR では GitHub が secrets を注入しないが、設計レベルでも `${{ secrets.* }}` を一切参照しない
- **GITHUB_TOKEN**: fork PR では read-only。same-repo PR でも write 昇格しない
- **3rd-party action**: UT-GOV-007 の SHA pin policy に従い、すべて `uses: owner/repo@<sha>` 形式

### 2.3 既存 workflow 棚卸し方針

`.github/workflows/*.yml` を Phase 5 ランブックで棚卸しし、以下の表で design.md 側に列挙する旨を確定する（実走は Phase 5）。

| 区分 | 対象 workflow | 扱い |
| --- | --- | --- |
| `pull_request_target` を使用 | （Phase 5 で列挙） | triage 専用化されているか確認、違反は移行対象 |
| `pull_request` を使用 | （Phase 5 で列挙） | secrets 不参照・`persist-credentials: false` の確認 |
| その他 trigger | （Phase 5 で列挙） | 影響範囲外（記録のみ） |

### 2.4 fork PR の保護方針

- fork PR は `pull_request_target` で **コード実行しない**（label 読み取り / 書き込みのみ）
- fork PR の build/test は `pull_request` workflow で行い、secrets / token を参照しない
- approve-and-run（`authorize-ci` ラベル等）の運用ルールは Phase 4 test-matrix.md で定義する入口のみを設ける（本タスクでは導入を強制しない）

## 3. workflow 草案（構造方針の参照用 YAML）

> 本 YAML は親タスク Phase 2 §6 の継承であり、リポジトリには投入しない。

```yaml
# .github/workflows/pr-target-safety-gate.workflow.yml.draft
name: pr-target-safety-gate
on:
  pull_request_target:
    types: [opened, synchronize, reopened, labeled]

permissions: {}                        # workflow デフォルト no-permissions

jobs:
  triage:
    permissions:
      pull-requests: write             # job 単位の最小昇格
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>   # UT-GOV-007 で SHA pin
        with:
          ref: ${{ github.event.repository.default_branch }}  # PR head は checkout しない
          persist-credentials: false   # job 終了後に GITHUB_TOKEN を残さない
      - name: triage label
        env:
          GH_TOKEN: ${{ github.token }}
          PR_NUMBER: ${{ github.event.pull_request.number }}  # untrusted は env 経由
        run: gh pr edit "$PR_NUMBER" --add-label needs-review
```

```yaml
# .github/workflows/pr-untrusted-build.workflow.yml.draft
name: pr-untrusted-build
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions: {}

jobs:
  build:
    permissions:
      contents: read
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          persist-credentials: false
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env: {}                        # secrets を渡さない
```

## 4. "pwn request" 非該当 5 箇条

| # | 箇条 | 設計上の保証 |
| --- | --- | --- |
| 1 | `pull_request_target` で PR head を checkout しない | §2.1：`ref` を `default_branch` または `base.sha` に固定 |
| 2 | `workflow_run` を介して secrets を fork PR build へ橋渡ししない | 本設計に `workflow_run` トリガを **使用しない**（Phase 3 代替案 D を MAJOR で却下） |
| 3 | `pull_request_target` で `${{ github.event.pull_request.head.* }}` を script に直接 eval しない | §2.1：untrusted 文字列は `env:` 経由で受け取り、シェル展開に直接埋め込まない |
| 4 | `persist-credentials: false` を全 `actions/checkout` に強制 | §2.1 / §2.2 / §3 に明記（AC-5、Phase 5 / Phase 9 でも重複明記） |
| 5 | `permissions:` をワークフロー `{}` ＋ ジョブ単位で最小化 | §2.1 / §2.2：workflow デフォルトを no-permissions にし、job だけ昇格（AC-5） |

## 5. ロールバック設計

### 5.1 単一 revert コミット粒度

- safety gate 適用前の workflow 構成へ戻すため、`.github/workflows/pr-target-safety-gate.yml` と `pr-untrusted-build.yml` の追加・編集を **1 コミットに集約** する。
- ロールバックは `git revert <safety-gate コミット>` の **1 コマンド** で完了する（Phase 5 runbook で具体化）。

### 5.2 required status checks の名称ドリフト防止

- 本タスクで untrusted build job 名（例：`pr-untrusted-build / build`）を **変更しない**。UT-GOV-001 で適用済みの `required_status_checks.contexts` 名と整合を保つ。
- 名称変更が必要な場合は、UT-GOV-001 の branch protection JSON 更新 PR と本タスクのロールバック PR を **同期して** 適用する旨を明記。

### 5.3 ロールバック判断トリガ

- fork PR シナリオで GITHUB_TOKEN / secrets 露出が観測された
- triage job が untrusted code を評価したインシデント
- required status checks 名のドリフトで dev / main がブロックされた

## 6. AC-1〜AC-9 対応マッピング

| AC | 対応箇所（本書） | 補足参照 |
| --- | --- | --- |
| AC-1: `pull_request_target` 内に PR head の checkout / code execution step が **置かれていない** | §2.1 / §3 / §4 #1 | Phase 4 test-matrix.md で再検証 |
| AC-2: untrusted build は `pull_request` に分離、`contents: read` のみ | §2.2 / §3 | Phase 5 runbook で実装手順 |
| AC-3: fork PR シナリオで token / secret が露出しない | §2.4 / §4 全体 | Phase 4 / Phase 9 で証跡化 |
| AC-4: "pwn request" 非該当根拠 | §4 全体 | Phase 3 review.md / Phase 9 quality-gate.md にレビュー記録 |
| AC-5: `permissions: {}` ＋ job 昇格 ＋ 全 checkout `persist-credentials: false` の 3 点 | §2.1 / §2.2 / §3 | Phase 5 / Phase 9 で重複明記 |
| AC-6: 親タスク Phase 2 §6 草案を input として継承 | §1（input 継承）／§3（YAML 母本） | Phase 1 §1 / Phase 3 N-1 と整合 |
| AC-7: docs-only / NON_VISUAL / infrastructure_governance + security 固定 | 冒頭 Status / 注記 | index.md / artifacts.json と一致 |
| AC-8: 実 workflow 編集 / dry-run 実走は本タスク非対象 | 冒頭注記 / §2.3 | Phase 13 でも重複明記 |
| AC-9: ロールバック設計（単一 revert コミット粒度） | §5 | Phase 5 / Phase 10 で重複明記 |

## 7. 次 Phase への引き継ぎ

Phase 3（設計レビュー）は、本 design.md §2〜§5 を入力として、代替案 4 案の PASS/MINOR/MAJOR 評価、NO-GO 条件 N-1〜N-3、"pwn request" 非該当 5 箇条のレビュー記録、security 観点 S-1〜S-5 を `outputs/phase-3/review.md` に確定する。

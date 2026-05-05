# Phase 2 — 設計（design）

## Status

spec_created

> 本書は **実 workflow ファイル投入を前提とした実装設計** である。Phase 5 runbook が本書の YAML 構造・permissions 階層・job 名・ロールバック粒度をそのまま `.github/workflows/pr-target-safety-gate.yml` / `.github/workflows/pr-build-test.yml` の編集差分に落とす。上流 dry-run 仕様（`completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-2/design.md`）を input として継承するが、本書の YAML は **実投入対象** であり draft ではない。

## 0. 上位原則（Phase 1 §0 の再掲）

trusted context（base リポの secrets / write GITHUB_TOKEN を持つ実行コンテキスト）では untrusted PR code を checkout / install / build / eval しない。

## 1. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `outputs/phase-1/main.md` | 真の論点 (a)〜(d) / 命名 canonical / リスク R-1〜R-4 |
| 上流 `phase-2/design.md` §6 | YAML 構造方針の母本（draft → 実投入へ昇格） |
| 上流 `phase-3/review.md` | "pwn request" 非該当 5 箇条 / S-1〜S-5 |
| UT-GOV-001 完了レポート | required status checks の現状 contexts 名 |
| UT-GOV-007 完了レポート | `uses:` SHA pin policy（前提） |

## 2. 責務分離設計（実ファイル）

### 2.1 triage workflow — `.github/workflows/pr-target-safety-gate.yml`

| 項目 | 値 |
| --- | --- |
| trigger | `pull_request_target` |
| types | `[opened, synchronize, labeled, reopened]` |
| 用途 | label 適用 / auto-merge 判定 / コメント投稿（PR メタデータ操作のみ） |
| **PR head checkout** | **禁止**。`actions/checkout` は原則使用しない。必要時のみ `ref: ${{ github.event.pull_request.base.sha }}` または `ref: ${{ github.event.repository.default_branch }}` を許可 |
| workflow デフォルト | `permissions: {}` |
| job 単位 permissions | triage job のみ `pull-requests: write`（label / コメント用） |
| `persist-credentials` | 全 `actions/checkout` で `false` 強制 |
| secrets | `${{ secrets.* }}` を一切参照しない |
| untrusted 文字列の扱い | `${{ github.event.pull_request.head.ref }}` / `.title` / `.body` 等は `env:` 経由で受け取り、`run:` のシェル展開に直接埋め込まない（quote 必須） |
| job 名（required status checks 同期対象） | `triage` |
| `uses:` ピン | UT-GOV-007 に従い全て SHA pin |

### 2.2 untrusted build workflow — `.github/workflows/pr-build-test.yml`

| 項目 | 値 |
| --- | --- |
| trigger | `pull_request` |
| types | `[opened, synchronize, reopened]` |
| 用途 | lint / typecheck / build / unit test（untrusted PR head の検証） |
| workflow デフォルト | `permissions: {}` |
| job 単位 permissions | build-test job のみ `contents: read` |
| `actions/checkout` | `ref: ${{ github.event.pull_request.head.sha }}` ＋ `persist-credentials: false` |
| secrets | `${{ secrets.* }}` を一切参照しない（fork PR では GitHub が secrets を注入しない設計が前提だが、設計レベルでも参照禁止） |
| GITHUB_TOKEN | fork PR では read-only。same-repo PR でも write 昇格しない |
| job 名（required status checks 同期対象） | `build-test` |
| `uses:` ピン | UT-GOV-007 に従い全て SHA pin |

### 2.3 既存 workflow 棚卸し方針

Phase 5 runbook で `.github/workflows/*.yml` を以下の表で棚卸し（実走で埋める）：

| 区分 | 検出コマンド | 扱い |
| --- | --- | --- |
| `pull_request_target` を使用 | `yq '.on.pull_request_target' .github/workflows/*.yml` | triage 専用化されているか確認、違反は本タスク内で移行 |
| `pull_request` を使用 | `yq '.on.pull_request' .github/workflows/*.yml` | secrets 不参照 / `persist-credentials: false` を確認 |
| `actions/checkout` 使用箇所 | `grep -rn 'actions/checkout' .github/workflows/` | `with.persist-credentials: false` を全箇所に強制 |
| `${{ secrets.* }}` 参照 | `grep -rnE '\\$\\{\\{[[:space:]]*secrets\\.' .github/workflows/` | triage / build/test workflow で 0 件であること |
| `head.*` の script eval | `grep -rnE 'github\\.event\\.pull_request\\.head\\.|\\.title|\\.body' .github/workflows/` | `run:` 内の直接展開が無いことを確認 |
| `workflow_run` trigger | `yq '.on.workflow_run' .github/workflows/*.yml` | 0 件であること（代替案 D 却下根拠） |

### 2.4 fork PR 保護方針

- fork PR は triage workflow で **コード実行しない**（label / metadata / コメントのみ）。
- fork PR の build / test は `pull_request` workflow で行い、secrets / 高権限 GITHUB_TOKEN を参照しない（`pull_request` の特性により fork PR では secrets 非注入・read-only token）。
- approve-and-run（`safe-to-test` 等のラベル運用）は MVP では **採用しない**。Phase 4 test-matrix.md に評価入口のみを置き、本タスク内で導入を強制しない。

## 3. workflow 投入 YAML（実ファイル設計）

> Phase 5 runbook はこの YAML をベースとして `.github/workflows/*.yml` に投入する。`<sha>` の箇所は UT-GOV-007 で固定済みの SHA を使用する。

### 3.1 `.github/workflows/pr-target-safety-gate.yml`

```yaml
name: pr-target-safety-gate
on:
  pull_request_target:
    types: [opened, synchronize, labeled, reopened]

permissions: {}                          # workflow デフォルト no-permissions

jobs:
  triage:
    name: triage
    permissions:
      pull-requests: write               # label / コメント用の最小昇格
    runs-on: ubuntu-latest
    steps:
      # 注意: 原則 PR head を checkout しない。
      # workflow のスクリプトを参照する必要がある場合のみ base.sha 固定。
      - uses: actions/checkout@<sha>
        with:
          ref: ${{ github.event.pull_request.base.sha }}
          persist-credentials: false
      - name: apply needs-review label
        env:
          GH_TOKEN: ${{ github.token }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: gh pr edit "$PR_NUMBER" --add-label needs-review
```

### 3.2 `.github/workflows/pr-build-test.yml`

```yaml
name: pr-build-test
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read                         # workflow レベルでも read のみ（job 単位で再宣言）

jobs:
  build-test:
    name: build-test
    permissions:
      contents: read
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          persist-credentials: false
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
        env: {}                          # secrets を一切渡さない
```

> 注: 上流 dry-run 仕様の `pr-untrusted-build.yml` は draft 名であり、本タスクでは既存命名規約に整合する `pr-build-test.yml` を採用する（Phase 1 §3 命名 canonical の `untrusted build workflow` に対応）。

## 4. "pwn request" 非該当 5 箇条 — 実装側検証手段

| # | 箇条 | 設計上の保証 | Phase 5 適用後の検証コマンド | Phase 11 dry-run 目視確認手段 |
| --- | --- | --- | --- | --- |
| 1 | `pull_request_target` で PR head を checkout しない | §2.1：`ref` を `base.sha` / `default_branch` に固定 | `yq '.jobs[].steps[] \| select(.uses \| test("actions/checkout")) \| .with.ref' .github/workflows/pr-target-safety-gate.yml` が `head` を含まないこと | fork PR で trigger 時、`gh run view --log` の checkout step が `base.sha` を表示 |
| 2 | `workflow_run` を介して secrets を fork PR build へ橋渡ししない | 本設計に `workflow_run` を **使用しない** | `grep -rnE '^\s*workflow_run:' .github/workflows/` が 0 件 | `gh workflow list` に `workflow_run` trigger が無い |
| 3 | `${{ github.event.pull_request.head.* / title / body }}` を script に直接 eval しない | §2.1：untrusted 文字列は `env:` 経由 | `grep -rnE 'run:.*\\$\\{\\{[[:space:]]*github\\.event\\.pull_request\\.(head\\.|title\\|body)' .github/workflows/` が 0 件 | workflow_dispatch audit / labeled trigger の dry-run で `run:` 内の echo に user-controlled 文字列が直挿入されていないことを目視 |
| 4 | 全 `actions/checkout` に `persist-credentials: false` | §2.1 / §2.2 / §3 で全 step 強制 | `yq -r '.jobs[].steps[] \| select(.uses \| test("actions/checkout")) \| .with."persist-credentials"' .github/workflows/*.yml \| grep -v '^false$'` が 0 件 | dry-run 後に job 内 `.git/config` の credential 残留が無いこと（`gh run view --log` で確認） |
| 5 | workflow デフォルト `permissions: {}` ＋ job 単位最小昇格 | §2.1 / §2.2 / §3 | `yq '.permissions' .github/workflows/*.yml` が `{}` または `contents: read`、各 job が必要最小権限のみ | GitHub Actions UI の job サマリで `Permissions` セクションが最小であることを目視 |

## 5. ロールバック設計

### 5.1 単一 `git revert` コミット粒度

- safety gate 適用前へ戻すため、`pr-target-safety-gate.yml` 追加 ＋ `pr-build-test.yml` 追加 ＋ 既存 workflow への `persist-credentials: false` 補完を **1 コミットに集約**。
- ロールバックは `git revert <safety-gate コミット>` の 1 コマンドで完了（Phase 5 runbook で具体化）。

### 5.2 required status checks 名 drift 検知

ロールバック後または job 名変更時に以下のコマンドで drift 検知：

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'
```

期待値（本タスク適用後）：

- `triage`（`pr-target-safety-gate.yml` の job 名）
- `build-test`（`pr-build-test.yml` の job 名）
- 既存の必須 contexts（UT-GOV-001 で適用済み）と整合

drift 検知時は UT-GOV-001 の branch protection JSON 更新 PR と本タスクのロールバック PR を **同期して** 適用する。

### 5.3 ロールバック判断トリガ

- fork PR シナリオで GITHUB_TOKEN / secrets 露出が観測された
- triage job が untrusted code を評価したインシデント
- required status checks 名 drift で dev / main がブロックされた

## 6. required status checks の job 名同期方針

| 段階 | アクション |
| --- | --- |
| Phase 5（実装） | 新 job 名（`triage` / `build-test`）を `name:` 行に固定。runbook に `gh api .../branches/main/protection` 取得結果を記録 |
| Phase 9（QA） | actionlint / yq で job 名の整合を再確認 |
| Phase 11（手動テスト） | GitHub Actions UI（job 一覧）と branch protection 画面（required status checks）の screenshot を `outputs/phase-11/screenshots/` に並べて保存（VISUAL evidence） |
| 適用後の運用 | job 名を変更する場合は UT-GOV-001 の branch protection JSON 更新 PR とセットで実施（drift 防止） |

## 7. AC-1〜AC-9 対応マッピング

| AC | 対応箇所（本書） | 備考 |
| --- | --- | --- |
| AC-1：`pull_request_target` 内に PR head checkout / install / build step が無い | §2.1 / §3.1 / §4 #1 | Phase 11 dry-run で再確認 |
| AC-2：untrusted build/test を `pull_request` に分離、`contents: read` のみ | §2.2 / §3.2 | |
| AC-3：`permissions: {}` / job 単位最小昇格 / 全 checkout `persist-credentials: false` の 3 点 | §2 / §3 / §4 #4 #5 | Phase 5 runbook で actionlint / yq / grep 実走 |
| AC-4：4 系統 smoke 実走で secrets / token 露出ゼロ | §2.4 / §6 | Phase 11 で `gh run view --log` 目視 |
| AC-5：GitHub Actions UI / branch protection の VISUAL evidence | §6 | Phase 11 で screenshot 取得 |
| AC-6：単一 `git revert` ロールバック ＋ drift 検知コマンド | §5 | Phase 5 / Phase 10 重複明記 |
| AC-7："pwn request" 非該当 5 箇条 | §4 全体 | Phase 3 review.md / Phase 9 quality-gate.md |
| AC-8：secrets rotate / OIDC 化 / 最終署名は別タスク | Phase 1 §2.2 を参照 | |
| AC-9：implementation / VISUAL / infrastructure_governance + security の固定 | Phase 1 §メタ固定値 | artifacts.json と一致 |

## 8. 次 Phase への引き継ぎ

Phase 3 は本 design.md §2〜§6 を入力として、代替案 A〜D の PASS/MINOR/MAJOR 評価、NO-GO 条件 N-1〜N-4、"pwn request" 非該当 5 箇条のレビュー、security 観点 S-1〜S-6、ロールバック設計レビュー、用語整合チェックを `outputs/phase-3/review.md` に確定する。

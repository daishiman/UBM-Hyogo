# Phase 3 — 設計レビュー（review）

## Status

spec_created

> 本書は Phase 2 成果物（`outputs/phase-2/design.md`）を対象とした設計レビュー記録である。本 IMPL タスク特有の評価軸（実 workflow 差分 / 4 系統 dry-run 実走 / VISUAL evidence）を加味し、上流 dry-run の review.md（`completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-3/review.md`）を入力としつつ再構成している。

## 0. 入力の継承

- `outputs/phase-1/main.md`（要件 / 命名 canonical / リスク R-1〜R-4）
- `outputs/phase-2/design.md`（実装設計の正本：レビュー対象）
- 上流 dry-run review.md（代替案 A〜D / "pwn request" 非該当根拠 / S-1〜S-5 の母本）
- UT-GOV-001 完了レポート（branch protection contexts 現状）
- UT-GOV-007 完了レポート（SHA pin policy）

## 1. 代替案評価（4 案）

| 案 | 概要 | 評価 | 根拠 | 採否 |
| --- | --- | --- | --- | --- |
| **A** | `pull_request_target` を残しつつ PR head を checkout する | **MAJOR** | "pwn request" の典型パターン。base リポの secrets / write GITHUB_TOKEN を持つ context で untrusted code を実行することになり、Phase 1 リスク R-1 / R-2 が直撃する。実 workflow 編集観点でも、checkout ステップを残すと R-3（`persist-credentials`）の影響が増幅する。 | **却下** |
| **B** | `pull_request_target` を完全廃止する | **MINOR** | triage（label 適用 / auto-merge 判定 / コメント投稿）が `pull_request` の read-only GITHUB_TOKEN だけでは成立しない。fork PR でのラベル付与・コメント書き込みに失敗する。実 workflow 編集観点でも、既存 triage 機能の代替実装を別途要するため reviewability が低下する。 | **却下** |
| **C** | `pull_request_target` を triage 専用、build/test を `pull_request` に分離する | **PASS** | Phase 1 真の論点 (a)〜(d) を全て満たす。"pwn request" 非該当 5 箇条が設計レベルで担保される。実 workflow 編集差分が単一 PR / 単一 revert に収まり、required status checks 名同期も明示できる。AC-1〜AC-9 全てに対応。 | **採択（base case）** |
| **D** | C ＋ `workflow_run` 経由で secrets を fork build に橋渡し | **MAJOR** | `workflow_run` が新たな pwn surface になる。fork PR が trigger した workflow の artifact / output を信頼すると、間接的に untrusted 入力が trusted context に流入する。本 IMPL では `grep -rnE '^\s*workflow_run:' .github/workflows/` 0 件を AC-7 検証コマンドとして固定するため、本案は採用しない。 | **却下** |

## 2. NO-GO 条件（base case = C 案）

> 以下のいずれかに該当する場合、Phase 5 実装ランブック以降への進行を **NO-GO** とする。

| ID | 条件 | 検出手段 |
| --- | --- | --- |
| **N-1** | 上流 dry-run 仕様（UT-GOV-002）が完成していない、または design.md / runbook が input として参照不能 | `outputs/phase-2/design.md` §1 の入力継承表で参照欠落、または上流 review.md の "pwn request" 非該当根拠が未署名 |
| **N-2** | UT-GOV-001 未適用で dev / main の branch protection が未設定、required status checks 名同期が検証不能 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` が 404、または `required_status_checks.contexts` が空 |
| **N-3** | UT-GOV-007 未適用で `uses:` が SHA pin されていない（外部 action からの pwn surface が残存） | actionlint / `grep -rnE 'uses: [^@]+@(v[0-9]+\|main\|master)' .github/workflows/` で tag pin が検出される |
| **N-4** | required status checks の job 名 drift が `gh api repos/.../branches/main/protection` 実行で検知済みのまま放置 | `gh api .../branches/main/protection --jq '.required_status_checks.contexts'` の出力に新 job 名（`triage` / `build-test`）と齟齬がある |

### AC 違反による追加 NO-GO

- **AC-1 違反**：`pull_request_target` 内に PR head の checkout / code execution が残存
- **AC-2 違反**：build/test workflow が `contents: read` 以外を要求
- **AC-3 違反**：`permissions: {}` / job 単位昇格 / `persist-credentials: false` のいずれかが欠落
- **AC-4 違反**：4 系統 dry-run 実走で secrets / token 露出が観測
- **AC-5 違反**：VISUAL evidence（GitHub Actions UI / branch protection screenshot）が未取得
- **AC-6 違反**：ロールバック設計が単一 `git revert` 粒度になっていない、または drift 検知コマンドが未記載
- **AC-7 違反**："pwn request" 非該当 5 箇条のいずれかが欠落
- **AC-8 違反**：secrets rotate / OIDC 化 / security 最終署名を本タスク内で実施
- **AC-9 違反**：implementation / VISUAL / infrastructure_governance + security の固定が artifacts.json と不一致

## 3. "pwn request" 非該当 5 箇条のレビュー記録

> Phase 2 design.md §4 と対応。本タスクは実 workflow 編集を含むため、4 列表（現状 / Phase 5 適用後 / Phase 9 静的検査コマンド / Phase 11 dry-run 目視確認手段）で検証手順を確定する。

| # | 箇条 | 現状 | Phase 5 適用後 | Phase 9 静的検査コマンド | Phase 11 dry-run 目視確認手段 |
| --- | --- | --- | --- | --- | --- |
| 1 | `pull_request_target` で PR head を checkout しない | 一部 workflow で `pull_request_target` を使用（Phase 5 棚卸し対象） | triage workflow の `actions/checkout` は `ref: base.sha` または `default_branch` 固定、または checkout 自体を行わない | `yq '.jobs[].steps[] \| select(.uses \| test("actions/checkout")) \| .with.ref' .github/workflows/pr-target-safety-gate.yml` が `head` を含まない | fork PR で trigger 時、`gh run view --log` の checkout step ログに `base.sha` のコミット ID が表示されることを目視 |
| 2 | `workflow_run` を介した secrets 橋渡しをしない | 該当 workflow なし（Phase 5 で再確認） | `workflow_run` トリガを使用しない（代替案 D 却下） | `grep -rnE '^\s*workflow_run:' .github/workflows/` が 0 件 | `gh workflow list --all` の trigger 列に `workflow_run` が無いこと |
| 3 | `${{ github.event.pull_request.head.* / title / body }}` を script に直接 eval しない | 既存 workflow で混在の可能性あり（Phase 5 棚卸し対象） | untrusted 文字列は `env:` 経由で受け取り、quote 必須 | `grep -rnE 'run:.*\\$\\{\\{[[:space:]]*github\\.event\\.pull_request\\.(head\\.\|title\|body)' .github/workflows/` が 0 件 | workflow_dispatch audit / labeled trigger の dry-run で `run:` 内の echo に user-controlled 文字列が直挿入されていないことを log 目視 |
| 4 | 全 `actions/checkout` に `persist-credentials: false` | 既存 workflow に未設定の可能性あり（R-3） | triage / untrusted build / 既存 workflow 全てで `persist-credentials: false` 強制 | `yq -r '.jobs[].steps[] \| select(.uses \| test("actions/checkout")) \| .with."persist-credentials"' .github/workflows/*.yml \| grep -v '^false$'` が 0 件 | dry-run 後に job 内 `.git/config` に `extraheader` などのトークン残留が無いことを `gh run view --log` で確認 |
| 5 | workflow デフォルト `permissions: {}` ＋ job 単位最小昇格 | 既存 workflow にデフォルト未指定の可能性あり | 全 workflow で `permissions: {}`、job だけ最小昇格（triage = `pull-requests: write`、build-test = `contents: read`） | `yq '.permissions' .github/workflows/*.yml` の出力が `{}` または `contents: read`、各 job が必要最小権限のみ | GitHub Actions UI の各 job サマリで `Permissions` セクションが最小であることを目視 ＋ screenshot |

## 4. security expert review 観点（S-1〜S-6）

| ID | 観点 | 担保箇所 / 検証 |
| --- | --- | --- |
| **S-1** | secrets 棚卸し（triage workflow が触る secret の allowlist） | triage workflow は `${{ secrets.* }}` を一切参照しない。Phase 5 runbook で `grep -rnE '\\$\\{\\{[[:space:]]*secrets\\.' .github/workflows/pr-target-safety-gate.yml` が 0 件であることを実走確認 |
| **S-2** | GITHUB_TOKEN scope の最小化（job 単位 `permissions:` 設計レビュー） | workflow デフォルト `permissions: {}`（design.md §2.1 / §2.2 / §3）。triage は `pull-requests: write` のみ、build-test は `contents: read` のみ |
| **S-3** | `actions: write` / `contents: write` 権限の有無監査 | triage / build-test とも `actions: write` / `contents: write` を付与しない（rerun の連鎖 trigger を防ぐ）。Phase 9 で `yq '.jobs[].permissions' .github/workflows/*.yml` を実走し、`write` 値の検出を 0 件にする |
| **S-4** | 外部 Marketplace action の SHA pin 確認（UT-GOV-007 連携） | UT-GOV-007 の policy に従い全 `uses:` を SHA pin。Phase 5 runbook で actionlint + `grep -rnE 'uses: [^@]+@(v[0-9]+\|main\|master)' .github/workflows/` の実走 |
| **S-5** | triage workflow が参照する label / branch / file の allowlist 確認 | triage が触る label は `needs-review` / `auto-merge` 等の限定リスト（design.md §3.1）。branch は `default_branch` / `base.sha` 固定。file は読まない（PR head を checkout しないため） |
| **S-6** | fork PR からの label injection 経路（`labeled` trigger 悪用）の検証観点 | `labeled` trigger は fork PR 投稿者が任意ラベルを付与しても、triage job 内で label 名を `if:` / `env:` 経由で評価する設計（design.md §2.1：untrusted 文字列 env 経由）。Phase 11 dry-run の labeled trigger ケースで、悪意 label 名（`'; rm -rf /` 等）を付与しても shell 展開が起きないことを目視確認 |

## 5. ロールバック設計のレビュー

| 項目 | 確認 | 備考 |
| --- | --- | --- |
| 単一 `git revert` で safety gate 導入前へ戻せるか | **OK** | design.md §5.1：`pr-target-safety-gate.yml` ＋ `pr-build-test.yml` ＋ 既存 workflow への `persist-credentials: false` 補完を 1 コミットに集約 |
| required status checks 名 drift 検知コマンド | **OK** | design.md §5.2：`gh api repos/daishiman/UBM-Hyogo/branches/{main,dev}/protection --jq '.required_status_checks.contexts'` を runbook に固定 |
| ロールバック判断トリガの明文化 | **OK** | design.md §5.3：fork PR token 露出 / triage 内 untrusted code 評価 / status checks 名 drift の 3 件 |
| ロールバック後の復旧手順 | **OK** | required status checks 名 drift が発生した場合、UT-GOV-001 の branch protection JSON 更新 PR と本タスクのロールバック PR を **同期して** 適用する旨を design.md §5.2 に明記 |
| 実 workflow 編集観点の追加レビュー | **OK** | 単一 commit / 単一 PR / 単一 revert の粒度が崩れる兆候（例: 既存 workflow 改変が 10 ファイルを超える）が出た場合、本タスクを分割せず Phase 5 で `persist-credentials: false` 補完だけを別 commit にする運用を許容（ロールバック粒度は維持） |

## 6. 用語整合チェック

Phase 1 §3 で固定した canonical を Phase 2 design.md / 本 review.md / 上流 dry-run 仕様で表記揺れなく使用しているかを確認。

| canonical | Phase 1 | Phase 2 design.md | Phase 3 review.md | 上流 dry-run | 結果 |
| --- | --- | --- | --- | --- | --- |
| `pull_request_target safety gate` | 使用 | 使用（冒頭・§5） | 使用（§1 C 案 / §5） | 使用 | **OK** |
| `triage workflow` | 使用 | 使用（§2.1 / §3.1） | 使用（§3 #1 / §4 S-1 / S-5） | 使用 | **OK** |
| `untrusted build workflow` | 使用 | 使用（§2.2 / §3.2） | 使用（§5） | 使用（draft 名 `pr-untrusted-build` の差分は Phase 2 main.md §3 で吸収） | **OK** |
| `pwn request pattern` | 使用 | 使用（§4） | 使用（§3 全体） | 使用 | **OK** |

> 揺れ表記（"PR target gate" / "untrusted job" / "safety-gate workflow" / "pr untrusted build"）は本 review.md / design.md で不検出。

## 7. レビュー結論

- **C 案**（`pull_request_target` を triage 専用 ＋ build/test を `pull_request` に分離）を **PASS** で採択。
- NO-GO 条件 N-1〜N-4 および AC 違反のいずれも、本 Phase 時点では発生していない（input 継承 / 命名整合 / 5 箇条担保 / S-1〜S-6 列挙 / ロールバック設計 OK）。
- **Phase 4 テスト設計に進行可能**。

## 8. 次 Phase への引き継ぎ

Phase 4 は本 review.md §3（"pwn request" 非該当 5 箇条 4 列表）と §4（S-1〜S-6）を入力として、fork PR / same-repo PR / labeled trigger / workflow_dispatch audit / re-run のテストマトリクス T-1〜T-N を `outputs/phase-4/test-matrix.md` に確定する。Phase 9（QA）は本書の §3 検証コマンド列・§4 担保箇所列を再走させる。Phase 11（手動テスト）は本書の §3 dry-run 目視確認列・§5 ロールバック判断トリガを VISUAL evidence と突合する。

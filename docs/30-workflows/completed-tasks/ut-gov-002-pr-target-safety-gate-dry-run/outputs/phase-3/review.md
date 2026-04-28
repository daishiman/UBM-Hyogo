# Phase 3 — 設計レビュー（review）

## Status

spec_created

> 本書は Phase 2 成果物（`outputs/phase-2/design.md`）を対象とした設計レビュー記録である。実 security review の本適用は Phase 5 実装ランブック以降の **別 PR** で行う（AC-8）。

## 0. 入力の継承（AC-6）

- 親タスク `outputs/phase-2/design.md` §6（`pr-target-safety-gate.workflow.yml.draft`）を input として継承
- 親タスク `outputs/phase-3/review.md` の security 節を継承
- 本タスク `outputs/phase-2/design.md` をレビュー対象とする

## 1. 代替案評価（4 案）

| 案 | 概要 | 評価 | 根拠 | 採否 |
| --- | --- | --- | --- | --- |
| A | `pull_request_target` を残しつつ PR head を checkout する | **MAJOR** | "pwn request" の典型パターン。base リポの secrets / write GITHUB_TOKEN を持つ context で untrusted code を実行することになり、Phase 1 リスク R-2 が直撃する。 | **却下** |
| B | `pull_request_target` を完全廃止する | **MINOR** | triage（label 適用 / auto-merge 判定）が `pull_request` の read-only GITHUB_TOKEN だけでは成立しない。fork PR のラベル付与・コメント書き込みに失敗し、運用負荷が増す。 | **却下** |
| C | `pull_request_target` を triage 専用に限定し、build/test を `pull_request` に分離する | **PASS** | Phase 1 真の論点 (a)(b)(c)(d) を全て満たす。"pwn request" 非該当 5 箇条が設計レベルで担保される。AC-1〜AC-9 全てに対応。 | **採択（base case）** |
| D | C ＋ `workflow_run` 経由で secrets を fork build に橋渡し | **MAJOR** | `workflow_run` が新たな pwn surface になる。fork PR が trigger した workflow の artifact / output を信頼すると、間接的に untrusted 入力が trusted context に流入する。 | **却下** |

## 2. NO-GO 条件（base case = C 案 に対する）

> 以下のいずれかに該当する場合、Phase 5 実装ランブック以降への進行を **NO-GO** とする。

| ID | 条件 | 検出手段 |
| --- | --- | --- |
| N-1 | **親タスク Phase 2 §6 草案を input として継承していない**（AC-6 違反） | `outputs/phase-2/design.md` §1 / §3 から親タスク参照が欠落、もしくは YAML 構造が著しく逸脱 |
| N-2 | UT-GOV-001 未適用で、required status checks 名が job 名と未同期 | dev / main の branch protection 状態確認（Phase 11 manual smoke で再確認） |
| N-3 | UT-GOV-007 未適用で、`uses:` が SHA pin されていない | actionlint / yq による静的検査（Phase 5 runbook） |

### AC 違反による追加 NO-GO

- **AC-1 違反**: `pull_request_target` 内に PR head の checkout / code execution が残存
- **AC-3 違反**: fork PR シナリオで token / secret 露出が観測される（または設計上排除されない）
- **AC-4 違反**: "pwn request" 非該当根拠の 5 箇条のいずれかが欠落
- **AC-5 違反**: `permissions: {}` / job 単位昇格 / `persist-credentials: false` のいずれかが欠落
- **AC-9 違反**: ロールバック設計が単一 revert コミット粒度になっていない

## 3. "pwn request" 非該当 5 箇条のレビュー記録

> Phase 2 design.md §4 と対応。各箇条について「現状」「設計後」「検証手段（Phase 9 再確認）」を 3 列で記録。

| # | 箇条 | 現状 | 設計後 | 検証手段（Phase 9） |
| --- | --- | --- | --- | --- |
| 1 | `pull_request_target` で PR head を checkout しない | 一部 workflow で `pull_request_target` を使用（Phase 5 で棚卸し） | triage workflow の `actions/checkout` は `ref: default_branch` または `base.sha` 固定 | actionlint + yq で `on.pull_request_target` を持つ workflow の checkout `ref` を抽出し、`head.*` を含まないことを確認 |
| 2 | `workflow_run` を介した secrets 橋渡しをしない | 該当 workflow なし（Phase 5 で再確認） | `workflow_run` トリガを **使用しない**（代替案 D を MAJOR で却下） | grep `on:\s*workflow_run` が 0 件 |
| 3 | `${{ github.event.pull_request.head.* / title / body }}` を script に直接 eval しない | 既存 workflow で混在の可能性あり（Phase 5 で棚卸し） | untrusted 文字列は `env:` 経由で受け取り、シェル展開に直接埋め込まない | grep で `run:` 内の `${{ github.event.pull_request.head.` / `.title` / `.body` 直接展開を検出 |
| 4 | 全 `actions/checkout` に `persist-credentials: false` | 既存 workflow に未設定の可能性あり | triage / untrusted build とも `persist-credentials: false` 強制 | yq で全 workflow の `actions/checkout` step の `with.persist-credentials` を抽出し、`false` であることを確認 |
| 5 | workflow デフォルト `permissions: {}` ＋ job 単位最小昇格 | 既存 workflow にデフォルト未指定の可能性あり | 全 workflow で `permissions: {}`、job だけ最小昇格 | yq で workflow root の `permissions` が `{}`、job の `permissions` が必要最小限であることを確認 |

## 4. security review 観点（S-1〜S-5）

| ID | 観点 | 担保箇所 / 検証 |
| --- | --- | --- |
| S-1 | secrets 棚卸し（どの secret を triage が触るか） | triage workflow は secrets を参照しない。Phase 5 runbook で `${{ secrets.* }}` の grep を実施 |
| S-2 | GITHUB_TOKEN scope の最小化 | workflow デフォルト `permissions: {}`、job 単位昇格（design.md §2.1 / §2.2） |
| S-3 | `actions: write` 権限の有無監査 | triage / untrusted build とも `actions: write` を付与しない（rerun の連鎖 trigger を防ぐ） |
| S-4 | 外部 action（Marketplace）の SHA pin | UT-GOV-007 の policy に従い、全 `uses:` を SHA pin。Phase 5 runbook で actionlint 検査 |
| S-5 | `pull_request_target` workflow が触る label / branch / file の allowlist | triage が触る label は `needs-review` / `auto-merge` 等に限定。branch は `default_branch` 固定。file は読まない（PR head を checkout しないため） |

## 5. ロールバック設計のレビュー

| 項目 | 確認 |
| --- | --- |
| 単一 revert コミットで safety gate 導入前へ戻せるか | OK：設計上、`pr-target-safety-gate.yml` と `pr-untrusted-build.yml` の追加・編集を 1 コミットに集約する方針（design.md §5.1）。 |
| required status checks 名の非ドリフト | OK：本タスクで untrusted build job 名を変更しない方針が design.md §5.2 に記述。UT-GOV-001 と同期しないと NO-GO（N-2）。 |
| ロールバック判断トリガの明文化 | OK：fork PR での token 露出 / triage が untrusted code 評価 / status checks 名ドリフト の 3 件が design.md §5.3 に記述。 |

## 6. 用語整合チェック

Phase 1 §3 で固定した canonical を Phase 2 design.md / 本 review.md で表記揺れなく使用していることを確認。

| canonical | Phase 1 | Phase 2 design.md | Phase 3 review.md | 結果 |
| --- | --- | --- | --- | --- |
| `pull_request_target safety gate` | 使用 | 使用（冒頭・§5） | 使用（§1 C 案） | OK |
| `triage workflow` | 使用 | 使用（§2.1） | 使用（§3 #1） | OK |
| `untrusted build workflow` | 使用 | 使用（§2.2） | 使用（§5） | OK |
| `pwn request pattern` | 使用 | 使用（§4） | 使用（§3） | OK |

> 揺れ表記（"PR target gate" / "untrusted job" / "safety-gate workflow" 等）は不検出。

## 7. レビュー結論

- C 案（base case）を **PASS** で採択。
- NO-GO 条件 N-1〜N-3 および AC 違反のいずれも、本 Phase 時点では発生していない（input 継承 / 命名整合 / 5 箇条担保 / S-1〜S-5 列挙が完了）。
- Phase 4 テスト設計に進行可能。

## 8. 次 Phase への引き継ぎ

Phase 4 は本 review.md §3（5 箇条）と §4（S-1〜S-5）を入力として、fork PR / same-repo PR / labeled / scheduled / re-run のテストマトリクスを `outputs/phase-4/test-matrix.md` に確定する。

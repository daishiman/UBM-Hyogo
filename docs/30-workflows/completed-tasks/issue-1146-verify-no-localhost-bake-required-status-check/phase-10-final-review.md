# Phase 10: 最終レビュー

本タスク（issue-1146）の生成パターンは **Closed Issue Canonical Workflow Root Recovery + Governance Mutation** であり、
status=`implemented_local_runtime_pending` / 実装区分=**実装仕様書** / NON_VISUAL / implementation_mode=`new`。
本 Phase では Phase 1-9 で確定した設計・テスト計画・実装計画を受入条件単位で最終判定する。
**実コード編集（`.github/workflows/verify-no-localhost-bake.yml` の paths 除去）は local 実装として完了済み**。branch protection mutation・commit・PR は実行しない（user-gated）。

---

## 1. 受入条件 最終判定表

| AC | 受入条件 | 充足手段（spec） | 判定 | 実行区分 |
| --- | --- | --- | --- | --- |
| AC-1 | `verify-no-localhost-bake.yml` の `on.pull_request.paths` ブロックを除去し常時実行化する（grep LOGIC は不変） | Phase 5 で paths ブロック除去の Before/After diff を確定。`push.branches` / job step は不変 | local 実装済み | `.github/workflows/verify-no-localhost-bake.yml` edited |
| AC-2 | `dev` の `required_status_checks.contexts` に `verify-no-localhost-bake` を追加 | Phase 5 で dev 個別 GET → payload draft → 個別 PUT 手順を確定 | spec として充足 | PUT は **user-gated** |
| AC-3 | `main` の `required_status_checks.contexts` に `verify-no-localhost-bake` を追加 | Phase 5 で main 個別 GET → payload draft → 個別 PUT 手順を確定（dev payload 使い回し禁止） | spec として充足 | PUT は **user-gated** |
| AC-4 | 既存 5 context（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）を全件保持し、末尾に `verify-no-localhost-bake` を追加 | Phase 4 テスト計画で Before/After contexts 配列を固定値で照合 | spec として充足 | PUT は **user-gated** |
| AC-5 | governance drift なし（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution`） | Phase 2 設計で「PUT は required_status_checks のみ変更し他フィールドは GET 値を逐語再投入」を不変条件化 | spec として充足 | PUT は **user-gated** |
| AC-6 | before / after evidence を branch 別に取得（`branch-protection-current-{dev,main}.json` / `branch-protection-after-{dev,main}.json`） | Phase 11 / Phase 13 で evidence path と取得手順を確定。before GET は pre-gate 可 | spec として充足 | after GET は **user-gated** |
| AC-7 | `scripts/verify-no-localhost-bake.sh` の grep LOGIC が不変（gate の判定ロジックに手を入れない） | Phase 5 で変更対象を yml の paths ブロックのみに限定。`.sh` / `.spec.ts` は無変更 | spec として充足 | `.sh` / `.spec.ts` diff なし |
| AC-8 | 実 `gh api -X PUT` は user 明示承認後のみ実行 | Phase 13 governance gate で 3-state（`implemented_local_runtime_pending` → `runtime_pending` → `completed`）と approval marker を規定 | spec として充足 | 実 PUT は **user-gated** |

AC-1 / AC-7 は local 実装と検証で充足。AC-2〜AC-6 / AC-8 の branch protection mutation は user-gated に委譲する。

---

## 2. blocker 判定

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| 設計矛盾（gate LOGIC / workflow trigger / branch protection の責務境界） | blocker なし | 3 責務が独立に閉じている。yml trigger 変更は grep LOGIC を触らず、PUT は required_status_checks のみ変更 |
| 既存 required check 破壊リスク | blocker なし | PUT は GET の他フィールドを逐語再投入し、contexts は既存 5 件保持 + 追加。全体上書き API の risk は Phase 5 手順で封じる |
| paths-filter footgun | 解消済（local 実装） | AC-1 で paths 除去を実施。required 化前提条件として Phase 2-5 に組み込み済み |
| 実 mutation の不可逆性 | user-gated（非 blocker） | spec として blocker ではない。実 PUT のみ user 明示承認後に実行 |

**結論: local 実装として blocker なし。** 実 mutation のみ user-gated。

---

## 3. MINOR 指摘 / 未タスク化検討

本タスクは 1 ファイルの yml trigger 変更 + branch 別 governance PUT に閉じており、今回サイクル（CONST_007）で完結する。
MINOR 指摘は **current として 0 件**。以下は **baseline 候補（起票せず記録のみ）** であり、Phase 12 `unassigned-task-detection.md` と件数・内容を整合させる。

| 候補 | 内容 | 扱い |
| --- | --- | --- |
| B-1 | `lighthouse-ci` が `branches:[dev]` のみ起動だが main の required check にも含まれる既存潜在 gap | baseline 記録のみ（本タスク非スコープ・別途観察） |
| B-2 | `pr-build-test.yml` の `build-test` context が required 未登録の既存差分 | baseline 記録のみ（独立した governance 判断） |
| B-3 | required 化後の CI 実行時間最適化（`dorny/paths-filter` action 内部分岐で grep のみ skip） | YAGNI（baseline 記録のみ） |

いずれも今回サイクルの破綻理由にならないため、`unassigned-task-detection.md` の baseline ブロックに記録するに留める。

---

## 4. 最終判定

| 観点 | 判定 |
| --- | --- |
| 受入条件（AC-1〜AC-8） | AC-1 / AC-7 local 充足、AC-2〜AC-6 / AC-8 は user-gated mutation pending |
| blocker | なし（実 mutation のみ user-gated） |
| MINOR（current） | 0 件 |
| baseline 候補 | B-1 / B-2 / B-3（記録のみ） |
| 総合 | **PASS（implemented_local_runtime_pending）**。local 実装完了、mutation・PR は Phase 13 の user-gated 手順に委譲 |

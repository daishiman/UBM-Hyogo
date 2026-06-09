# Phase 1: 要件定義

| 項目 | 内容 |
| --- | --- |
| タスク | `verify-no-localhost-bake` を `dev` / `main` の required status check に登録する |
| GitHub Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)（[FU-SASR-002]・**CLOSED 維持**・reopen しない・PR/commit は `Refs #1146` のみ） |
| 親 workflow | `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/`（Phase 10 §MINOR M-2 発見元） |
| 消費元 proto-spec | `docs/30-workflows/unassigned-task/staging-api-url-and-session-recovery-followup-002-verify-no-localhost-bake-required-status-check.md`（consumed pointer 追記済・削除禁止） |
| 生成パターン | Closed Issue Canonical Workflow Root Recovery + Governance Mutation（branch protection PUT） |
| 視覚証跡 | NON_VISUAL |

---

## 1. タスク概要

親 workflow `staging-api-url-and-session-recovery` で新設した CI gate `verify-no-localhost-bake`（`apps/web/src` / client bundle への `:8787` / `:8888` / `localhost` 焼き込みを grep 検出する gate）を、`dev` / `main` の GitHub branch protection の `required_status_checks.contexts` に登録し、当 gate が fail する PR を機械的に merge ブロックできるようにする。

workflow は既に `on: pull_request: branches: [main, dev]`（+ `push: branches: [main, dev]`）で**動作する**が、branch protection の必須チェックには**未登録**であり、gate が fail しても merge を止められない governance gap が残っている。

ただし現状のまま required 化すると、`verify-no-localhost-bake.yml` が持つ `on.pull_request.paths` フィルタにより、対象 path を触らない PR では workflow が起動せず、GitHub が `Expected — Waiting for status` で**永久に merge ブロック**する footgun がある。本タスクは required 化と同時に、この paths フィルタを除去して常時実行化する（grep LOGIC は不変）ことで footgun を根本対策する。

## 2. 実装区分の判定

**[実装区分: 実装仕様書]**

### 判定根拠

- 本タスクは branch protection mutation（governance 操作）に加え、`verify-no-localhost-bake.yml` の `on.pull_request.paths` ブロックを**除去**する **yml code 変更**を含む。trigger 構造の変更は workflow ファイルへの実コード編集であり、docs-only では完結しない。
- CONST_004（default は実装仕様書）に整合し、かつ実態（yml への code 変更を含む）を優先して**実装仕様書**とする。
- 消費元 proto-spec は AC-7 で「gate 本体無改修」を掲げ、branch protection 登録のみの docs-only 寄り前提だった。本 spec はこの前提を**実態優先で上書き**する。すなわち「gate の grep LOGIC（`scripts/verify-no-localhost-bake.sh`）は不変」だが、「required-check 化を成立させるために yml の trigger（`on.pull_request.paths`）は除去する」と区別する。この区別が yml への code 変更を生むため、実装区分は実装仕様書となる。

## 3. P50 前提確認チェック

| 前提 | 確認結果 |
| --- | --- |
| current branch に gate 実装が存在する | **存在**。`.github/workflows/verify-no-localhost-bake.yml` / `scripts/verify-no-localhost-bake.sh` / `scripts/verify-no-localhost-bake.spec.ts` は親 workflow（commits `8f7d4faca` / `6aee9fcba`）で landed 済 |
| upstream マージ済 | **済**。gate 実装は `dev` に統合済み（required check 未登録のみが残課題） |
| 依存タスク完了 | **完了**。依存 = 親 `staging-api-url-and-session-recovery`（`implemented_local_evidence_captured`）。本タスクはその Phase 10 §MINOR M-2 を消化する follow-up |
| issue が古い / 別タスクで解決済みか | **未解決**。`dev` / `main` の実測 `required_status_checks.contexts` に `verify-no-localhost-bake` は不在。`git log --all --grep=localhost-bake` は gate 実装 commit のみで、required 登録は未実施 |

### implementation_mode

`implementation_mode = new`。

- branch protection の `verify-no-localhost-bake` 登録は**新規**追加（既存 contexts への足し込み）。
- `verify-no-localhost-bake.yml` の `on.pull_request.paths` 除去も**新規**の trigger 変更（既存挙動の修正）。
- 既存の gate LOGIC（`.sh` の grep）は**変更しない**ため、ここに mode は適用されない。

## 4. proto-spec の stale 前提の是正（Phase 1 で明示是正）

消費元 proto-spec には、実コードと乖離した 2 つの stale 前提があった。本 spec は実測を正本として以下を是正する。

| proto-spec の前提 | 実測（2026-06-08） | 是正方針 |
| --- | --- | --- |
| 登録済み required context = `audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` | `dev` / `main` 共通で `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]`。proto-spec が挙げた 3 context は**いずれも未登録** | 実測の 5 context を正本とし、これらを全件保持したまま `verify-no-localhost-bake` を末尾追加する |
| gate 本体は無改修（yml も触らない docs-only 寄り） | `verify-no-localhost-bake.yml` は `on.pull_request.paths` フィルタを持ち、required 化すると非対象 path の PR が永久 pending block になる。既存 required check の全 workflow（`ci.yml` / `validate-build.yml` / `e2e-tests.yml` / `lighthouse.yml`）は `pull_request.paths` を持たず常時実行 | gate の grep LOGIC は不変としつつ、`on.pull_request.paths` ブロックを**除去**して常時実行化する（yml code 変更を含むため実装仕様書へ昇格） |

## 5. スコープ

### 含むもの

- `verify-no-localhost-bake.yml` の `on.pull_request.paths` ブロック除去（常時実行化）。`push: branches:[main,dev]`（元々 paths なし）と grep step は不変。
- `dev` の branch protection `required_status_checks.contexts` への `verify-no-localhost-bake` 追加（既存 5 context 全件保持）。
- `main` の branch protection `required_status_checks.contexts` への `verify-no-localhost-bake` 追加（既存 5 context 全件保持）。
- dev / main を**個別に** GET / PUT する before/after の read-only JSON evidence 取得。
- CLAUDE.md ブランチ戦略の required status check 列挙（運用参照）と GitHub 実値の整合確認。

### 含まないもの

- `scripts/verify-no-localhost-bake.sh` の grep LOGIC 変更（gate 本体は無改修）。
- `scripts/verify-no-localhost-bake.spec.ts` の挙動変更。
- 他 gate（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）の required check 追加・削除。
- `required_pull_request_reviews` の有効化（solo 運用ポリシーにより `null` 維持）。
- D1 schema / API endpoint / Google Form 仕様 / Cloudflare runtime 設定の変更（親不変条件）。

## 6. 受入条件（AC）

実測 context（5 件）と paths 除去を織り込んで再定義する。

- **AC-1（paths 除去で常時実行化）**: `verify-no-localhost-bake.yml` の `on.pull_request.paths` ブロックが除去され、`pull_request: branches:[main,dev]` のすべての PR で workflow が起動する。既存 required check の no-paths 規約（`ci.yml` / `validate-build.yml` 等）に整合する。
- **AC-2（dev contexts に追加）**: `dev` の `required_status_checks.contexts` に `verify-no-localhost-bake` が追加されている。
- **AC-3（main contexts に追加）**: `main` の `required_status_checks.contexts` に `verify-no-localhost-bake` が追加されている。
- **AC-4（既存 5 context 全件保持）**: dev / main 両方で、追加前に存在した 5 context（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）が削除されず保持されている（before/after diff が `verify-no-localhost-bake` 追加のみ）。
- **AC-5（governance drift なし）**: `required_pull_request_reviews=null`（solo 運用）/ `lock_branch=false` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution` に drift が無い（after JSON が before と当該項目で一致）。
- **AC-6（before/after evidence）**: 操作前後に `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` を個別取得した before/after evidence があり、AC-2〜AC-5 を JSON で確認できる。
- **AC-7（.sh grep LOGIC 不変）**: `scripts/verify-no-localhost-bake.sh` の grep LOGIC は未変更。yml の trigger（`on.pull_request.paths`）除去のみが workflow 側の変更であり、検出ロジックには触れない。
- **AC-8（governance mutation は user-gated）**: yml edit は同 cycle の local 実装として完了する。実 `gh api -X PUT`（dev / main の protection mutation）・commit・push・PR はユーザー明示承認後にのみ実行される。承認前は read-only GET evidence と PUT payload 提示までに限定する。

## 7. 既存命名規則の確認

- required status check の context 名は GitHub Checks 表記と完全一致でなければ強制が効かない（不一致は never run = pending block になる）。
- `verify-no-localhost-bake.yml` の `jobs.verify-no-localhost-bake.name: verify-no-localhost-bake` がそのまま context 名になる。
- 当 workflow は matrix を持たない**単一 job** のため、context は `verify-no-localhost-bake` 単独で、`audit-correlation-verify / verify` のような `<workflow> / <job>` 二段形式にはならない。
- 実登録する文字列は read-only before JSON / 実 run の Checks 表記で確定してから PUT する。

## 8. NON_VISUAL 宣言

本タスクは branch protection（GitHub governance）と workflow yml trigger の変更であり、UI / 画面描画を伴わない。**NON_VISUAL** とし、Phase 11 のスクリーンショット証跡は対象外（手動検証は CLI evidence で代替する）。

## 9. CONST_007 スコープ宣言

本タスクの local 実装作業（yml paths 除去 / local self-test / grep gate / Phase 12 同期）は今回 cycle で完了する。dev・main の個別 `PUT` / after evidence / commit / push / PR は governance mutation または GitHub publish 操作のため user-gated として分離する。

# Phase 8 — リファクタリング（main）

## Status

spec_created

## 1. 目的

Phase 5 で生成した実 workflow ファイル `.github/workflows/pr-target-safety-gate.yml` / `.github/workflows/pr-build-test.yml` を **before / after** で再点検し、責務分離・命名統一・重複 step 整理・コミット粒度設計の 4 観点で実装をリファクタする。本 Phase は「振る舞いを変える変更」を入れず、**構造整理 / 命名整合 / コミット分割計画**のみを確定させる。実走しての差分検証は Phase 9 (静的検査) と Phase 11 (動的検査) が責務。

## 2. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `outputs/phase-2/design.md` §3 / §5 / §6 | 責務分離設計（triage vs build/test）/ ロールバック粒度 / required status checks 同期 |
| `outputs/phase-3/review.md` §6 | 用語整合（4 用語）の canonical |
| `outputs/phase-5/runbook.md` Step 3 / 7 | 実 workflow 編集手順 / 単一 commit 粒度 / 同期手順 |
| `outputs/phase-6/failure-cases.md` 回帰防止チェックリスト | リファクタ後も維持すべき 5 不変条件 |
| `outputs/phase-7/coverage.md` §6 | AC 9/9 = 100% 宣言（リファクタで毀損させない） |
| `.github/workflows/pr-target-safety-gate.yml` | リファクタ対象 1 |
| `.github/workflows/pr-build-test.yml` | リファクタ対象 2 |

## 3. 成果物

- `outputs/phase-8/main.md`（本書）
- `outputs/phase-8/before-after.md`（before/after 差分表 / canonical 命名 / コミット分割計画 / 用語整合 grep 手順）

## 4. リファクタ方針サマリ

| 観点 | 方針 |
| --- | --- |
| 責務分離 | `pull_request_target` = triage / metadata 専用、`pull_request` = untrusted build/test。境界が曖昧な job は本 Phase で剥がす（spec_created 時点では既に分離済み） |
| 命名統一 | canonical 4 用語（`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern`）と canonical job 名（`triage` / `build-test`）を全 phase / 全 yaml コメントに展開 |
| 重複 step 整理 | 全 `actions/checkout` に `persist-credentials: false` を明示。SHA pin（UT-GOV-007）と permissions 最小化を job 単位で一本化 |
| コミット粒度 | 単一 PR 内で (1) safety gate 適用 / (2) 不要 step 除去 / (3) required status checks 名同期 の 3 コミットに分離。`git revert` で各 commit を独立に巻き戻せる |
| 図表の最小化 | Markdown table のみで完結。Mermaid 不使用（VISUAL 証跡は Phase 11 が責務） |

## 5. 振る舞い不変宣言

本 Phase は以下の不変条件を保つ:

- `pr-target-safety-gate.yml` は `actions/checkout` を含まない（Phase 5 確立済み）。
- `pr-build-test.yml` は全 `actions/checkout` step に `persist-credentials: false` を明示。
- 両 workflow ともデフォルト `permissions: {}`、job 単位で必要最小のみ昇格（triage = `pull-requests: write` / build-test = `contents: read`）。
- `secrets.*` 参照は両 workflow で 0 件。
- `workflow_run:` trigger は使用しない。

> 上記いずれかが Phase 8 のリファクタで損なわれた場合、Phase 9 quality-gate G-3 で MAJOR 判定され、本 Phase に差し戻し。

## 6. 完了条件

- [x] before-after.md に実 workflow 2 ファイルの修正前後の差分が表で記録される。
- [x] `pull_request_target` から build / test / install step が剥離されていることを diff で確認する記述が含まれる。
- [x] canonical 命名（`pr-target-safety-gate.yml` / `pr-build-test.yml` / job 名 `triage` / `build-test`）と job 名同期方針が記録される。
- [x] `actions/checkout` への `persist-credentials: false` が全箇所明示されていることが確認される。
- [x] 3 コミット分割計画（safety gate 適用 / 不要 step 除去 / required status checks 名同期）が記述される。
- [x] 用語整合チェック（4 用語）が `grep` 手順とともに記述される。
- [x] artifacts.json の Phase 8 status が `spec_created` で同期される（既同期）。

## 7. 次 Phase への引き継ぎ

- Phase 9 quality-gate G-2（静的検査 PASS）は本 Phase の振る舞い不変宣言を起点に再走される。
- Phase 11 manual smoke は本 Phase の canonical 命名 / 3 コミット分割計画を前提に実走する。
- Phase 12 documentation-changelog は本 Phase の before-after.md を主要根拠として変更履歴を起こす。

# Phase 2 — 設計（main）

## Status

spec_created

## 0. 概要

本 Phase は、Phase 1（`outputs/phase-1/main.md`）で固定した真の論点 4 つ・命名 canonical・リスク R-1〜R-3 を入力として、`pull_request_target` safety gate の **責務分離設計** を `outputs/phase-2/design.md` に確定させる。triage workflow（`pull_request_target`）と untrusted build workflow（`pull_request`）の境界、`permissions: {}` デフォルト、`persist-credentials: false` 強制、ロールバック設計、AC-1〜AC-9 マッピングを含む。

## 1. 入力（前提依存）

> AC-6 の継承を Phase 2 でも明記する。

| 種別 | 入力 | 用途 |
| --- | --- | --- |
| 前 Phase | `outputs/phase-1/main.md` | 真の論点 / 命名 canonical / リスク |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md` §6 | `pr-target-safety-gate.workflow.yml.draft` の継承元 |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-3/review.md` | security 観点 (S-1〜S-5) の入力 |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-5/runbook.md` | actionlint / yq による静的検査コマンドの参照 |
| 仕様 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md` | AC-1〜AC-9 |
| 外部 | GitHub Security Lab "preventing pwn requests" | "pwn request" パターン定義 |

## 2. 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-2/main.md` | 本書（概要・成果物リンク・Phase 1 参照） |
| `outputs/phase-2/design.md` | 責務分離設計の正本（pr-target-safety-gate.workflow.yml.draft 構造方針 / ロールバック / AC マッピング） |

## 3. 責務分離（要約）

詳細は `outputs/phase-2/design.md` を参照。

| Workflow | Trigger | 用途 | permissions（job 最大） | secrets | PR head checkout |
| --- | --- | --- | --- | --- | --- |
| triage workflow（`pr-target-safety-gate.yml`） | `pull_request_target` | label 操作 / auto-merge 判定 / コメント投稿 | `pull-requests: write` 等を **job 単位で** 昇格 | 不可（読まない） | **禁止**（base.sha / default_branch のみ checkout 可） |
| untrusted build workflow（`pr-untrusted-build.yml`） | `pull_request` | lint / typecheck / build / unit test | `contents: read` のみ | 不可 | `head.sha` のみ（`persist-credentials: false`） |

## 4. 完了条件チェック（Phase 2）

- [x] `pull_request_target` と `pull_request` の責務分離設計が design.md §1〜§3 に記述されている。
- [x] workflow デフォルト `permissions: {}` 方針が design.md §2 に記述されている。
- [x] 全 `actions/checkout` への `persist-credentials: false` 強制が design.md §2 / §3 に記述されている。
- [x] "pwn request" 非該当の 5 箇条が design.md §4 に記述されている。
- [x] ロールバック設計（単一 revert コミット粒度）が design.md §5 に記述されている。
- [x] AC-1〜AC-9 マッピングが design.md §6 に記述されている。

## 5. 次 Phase への引き継ぎ

Phase 3 は本 main.md と `outputs/phase-2/design.md` を入力として、代替案 4 案の PASS/MINOR/MAJOR 評価、NO-GO 条件 N-1〜N-3、"pwn request" 非該当の 5 箇条レビュー記録、security 観点 S-1〜S-5 を `outputs/phase-3/review.md` に記録する。

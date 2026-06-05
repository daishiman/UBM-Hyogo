`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 13 — PR 作成フェーズ

**status: `pending_user_approval`**

## 概要

Phase 13 は PR 作成フェーズである。本タスクは `implemented_local_evidence_captured`（仕様書作成・ローカル実装・ローカル検証完了）であり、
commit / push / PR 作成 / staging deploy / Issue mutation は **すべて user-gated で未実行**。
ユーザーの明示承認があるまで以下のいずれも実行しない。

## user-gated（未実行）

| 操作 | 状態 |
| --- | --- |
| `git add` / `git commit` | 未実行（user-gated） |
| `git push` | 未実行（user-gated） |
| `gh pr create --base dev` | 未実行（user-gated） |
| staging deploy（`apps/og`） | 未実行（user-gated） |
| OG render screenshot 取得（staging） | 未実行（user-gated） |
| GitHub GitHub Issue #1076 の状態変更 | 未実行（実態 `CLOSED` 確認・変更しない） |

## PR 作成方針（承認後）

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（既定。production リリースではないため `main` ではない） |
| head ブランチ | `docs/issue-1076-member-og-design-token-alignment-spec` |
| PR 本文の正本 | `outputs/phase-12/implementation-guide.md`（`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照） |
| screenshot | `outputs/phase-11/screenshots/` は pending。実PNGが無いため、PR本文の screenshot セクションは staging capture 後に反映 |

## 前提

- 本 wave は仕様書作成、`apps/og` 実コード差分、focused Vitest、typecheck/lint、dry-run build、size gate まで完了。
- staging screenshot 取得、PR 作成（base `dev`）、Issue mutation は user-gated。

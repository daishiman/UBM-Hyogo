# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending_user_approval |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| 承認 | ユーザー明示承認があるまで実行禁止 |

## 目的

Phase 1〜12 の成果を 1 PR として提出できる状態にまとめる。ただし、ユーザーの明示承認なしに commit / push / PR 作成は実行しない。

## 実行タスク

1. 差分範囲を確認する。
2. PR 本文案を作成する。
3. commit / push / PR 作成はユーザー承認を得てから実行する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | Phase 13 境界 |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | 承認 gate |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-12.md | close-out |

## 実行手順

1. `git diff --stat` と `git status --short` を確認する。
2. PR 本文案に AC-1〜AC-11、検証、残リスクをまとめる。
3. ユーザー承認後にのみ commit / push / PR 作成へ進む。

## 多角的チェック観点（AIが判断）

- Phase 13 が自動実行されていないか。
- Issue #161 を CLOSED のまま扱う方針と矛盾していないか。
- 実 hook 実装 PR と仕様書整備 PR を混同していないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 差分確認 | pending | commit 前 |
| 2 | PR 本文案 | pending | 承認前 |
| 3 | commit / push / PR | pending_user_approval | 自動実行禁止 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR 準備 | outputs/phase-13/main.md | PR 本文案・差分サマリー・承認待ち状態 |

## 完了条件

- [ ] PR 本文案が作成されている
- [ ] ユーザー承認前に commit / push / PR 作成を実行していない
- [ ] Phase 13 の承認待ち状態が明記されている

## タスク100%実行確認【必須】

- [ ] 全実行タスク（3 件）が completed または pending_user_approval
- [ ] 成果物が `outputs/phase-13/main.md` に配置済み

## 次Phase

- なし

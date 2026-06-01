# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-05-31 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending_user_approval |
| 実装区分 | 実装仕様書 |
| タスク種別 | implementation / NON_VISUAL / tooling |
| 承認 | **ユーザー明示承認があるまで commit / push / PR 作成は実行禁止** |

## 目的

Phase 1〜12 の仕様書整備成果と実コード hardening を 1 PR として提出できる状態にまとめる。ただし、**ユーザーの明示承認なしに commit / push / PR 作成は実行しない**。本変更は `implemented_local_evidence_captured` 範囲であり、`generate-index.js` hardening + 新規 spec test は今回の実装サイクルで完了済み。

## 実行タスク

1. 差分範囲を確認する（`git status --short` / `git diff dev...HEAD --name-only`）。
2. PR 本文案を作成する（AC-1〜AC-8 / 検証結果 / 残リスク / user-gated 境界）。
3. commit / push / PR 作成はユーザー承認を得てから実行する（base=dev）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/commands/ai/diff-to-pr.md | PR 本文仕様 |
| 必須 | （本ワークフロー）phase-12.md | close-out / 成果物一覧 |
| 必須 | （本ワークフロー）outputs/phase-12/implementation-guide.md | PR 本文へ反映する実装ガイド |

## 実行手順

1. `git diff --stat` と `git status --short` を確認する。
2. PR 本文案に AC-1〜AC-8、検証計画（typecheck / lint / vitest / byte-identical drift）、残リスクをまとめる。
3. ユーザー承認後にのみ commit / push / PR 作成（`gh pr create --base dev`）へ進む。

## 多角的チェック観点（AIが判断）

- Phase 13 が自動実行されていないか（承認前に commit/push/PR を実行しない）。
- Issue #229 を CLOSED のまま扱う方針と矛盾していないか（reopen しない）。
- 実コード hardening PR と仕様書整備 PR を混同していないか。

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

## 次 Phase への引き渡し

- なし（最終 Phase）
- 残務: ユーザー承認後の commit / push / PR 作成（base=dev）、および今回の実装サイクルでの実コード変更

# Phase 13 — PR 作成 総括

> ステータス: `pending_user_approval` / user_approval_required=`true`。apps/web 実装とローカル検証は完了済み。commit・PR・push は user 明示承認後。

---

## 1. 承認境界（厳守）

| # | ルール |
| --- | --- |
| 1 | **commit / PR / push はユーザーの明示承認後のみ実行**する。 |
| 2 | 承認がない限り本 Phase は **blocked** のまま維持する。 |
| 3 | 実装 diff は存在するが、commit / push / PR は user 承認なしでは実行しない。 |

## 2. PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（開発統合ブランチ） |
| `--base main` | **使用しない**（relatedIssue=null・staging 観察起点・production リリースを伴わない） |
| PR 本文の主ソース | `outputs/phase-12/implementation-guide.md` |
| screenshot 参照 | `outputs/phase-11/screenshots/*`（実 capture がある場合のみ・現状 pending） |
| 想定ブランチ名 | `feat/admin-attendance-dashboard-jp-clarity-and-ux` |

## 3. PR 作成フロー（CLAUDE.md「PR作成の完全自律フロー」準拠）

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期。
2. 作業ブランチに `dev` をマージ（コンフリクトは既定方針で自律解消）。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`（+ focused vitest / `verify:tokens`）。
4. 失敗時は最大 3 回まで自動修復。
5. `git diff dev...HEAD --name-only` で PR 対象ファイル（16）を確認。
6. **ユーザー承認後** `gh pr create --base dev`。

## 4. 成果物

| ファイル | 役割 |
| --- | --- |
| `local-check-result.md` | PR 前ローカル検証結果（typecheck / lint / focused vitest / token gate 等） |
| `change-summary.md` | 変更概要（16 ファイル・文言日本語化の柱） |
| `pr-template.md` | PR 本文テンプレート（base=dev） |

## 5. 現在の状態

- apps/web 実装・focused vitest・typecheck・lint・token gate は本サイクルで完了済み。
- commit・PR・push・Phase 11 staging screenshot は user 明示承認後にのみ実行する。

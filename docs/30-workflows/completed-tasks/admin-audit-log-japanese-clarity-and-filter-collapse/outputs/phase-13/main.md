# Phase 13 — PR 作成 総括

> ステータス: `pending`（user 承認待ち）/ user_approval_required=`true`。本ワークフローは `implemented_local_evidence_captured`。staging capture・commit / push / PR は user 承認後のみ実行する。

---

## 1. 承認境界（厳守）

| # | ルール |
| --- | --- |
| 1 | **commit / push / PR はユーザーの明示承認後のみ実行**する。 |
| 2 | 承認がない限り本 Phase は **blocked** のまま維持する。 |
| 3 | 本ワークフローは `implemented_local_evidence_captured`。staging capture・commit・push・PR は user 承認後にのみ実行可能。 |

## 2. PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（開発統合ブランチ） |
| `--base main` | **使用しない**（relatedIssue=null・production リリースを伴わない） |
| PR 本文の主ソース | `outputs/phase-12/implementation-guide.md` |
| screenshot 参照 | `outputs/phase-11/screenshots/*`（実 capture がある場合のみ） |
| タイトル案 | `feat(admin): /admin/audit 監査ログを非エンジニア向け日本語化 + フィルタ段階開示 + カード整列` |

## 3. PR 作成フロー（CLAUDE.md「PR作成の完全自律フロー」準拠）

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期。
2. 作業ブランチに `dev` をマージ（コンフリクトは既定方針で自律解消）。
3. 品質検証 4 コマンド: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. 失敗時は最大 3 回まで自動修復。
5. `git diff dev...HEAD --name-only` で PR 対象ファイルを確認。
6. **ユーザー承認後** `gh pr create --base dev`。

## 4. 成果物

| ファイル | 役割 |
| --- | --- |
| `local-check-result.md` | PR 前ローカル検証結果（実装後に埋める） |
| `change-summary.md` | 変更概要（実装後に埋める） |
| `pr-template.md` | PR 本文テンプレート |

## 5. 現在の状態

- 本ワークフローは apps/web 表現層実装 + focused Vitest まで完了。
- typecheck / lint / verify:tokens / Phase 11 staging screenshot 取得 / commit / push / PR は user 明示承認後にのみ実行する。

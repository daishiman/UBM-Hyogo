# Phase 13 — PR 作成 総括

> ステータス: `pending`（user 承認待ち）/ user_approval_required=`true`。コード実装・ローカル検証は完了済み。commit / PR / push と staging visual capture は user 承認後のみ行う。

---

## 1. 承認境界（厳守）

| # | ルール |
| --- | --- |
| 1 | **commit / PR / push はユーザーの明示承認後のみ実行**する。 |
| 2 | 承認がない限り本 Phase は **blocked** のまま維持する。 |
| 3 | workflow root は `implemented_local_runtime_pending`。local implementation evidence は Phase 11 / local-check-result に記録済み。 |
| 4 | staging visual capture は未取得として明記し、local PASS と runtime PASS を混同しない。 |

## 2. PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（開発統合ブランチ） |
| `--base main` | **使用しない**（production リリースを伴わない） |
| PR 本文の主ソース | `outputs/phase-12/implementation-guide.md` |
| 起点 Issue | [#1188](https://github.com/daishiman/UBM-Hyogo/issues/1188)（OPEN・据え置き） |
| screenshot 参照 | `outputs/phase-11/screenshots/*`（3 枚・実 capture がある場合のみ） |

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
| `local-check-result.md` | PR 前ローカル検証結果（focused Vitest / typecheck / lint / token / compliance PASS） |
| `change-summary.md` | 変更ファイル一覧と AC / テスト結果 |
| `pr-template.md` | PR 本文テンプレート（base=dev / Issue #1188 参照） |

## 5. 現在の状態

- workflow root は `implemented_local_runtime_pending`。
- Phase 11 staging screenshot 取得、commit、PR、push は user 明示承認後にのみ実行する。

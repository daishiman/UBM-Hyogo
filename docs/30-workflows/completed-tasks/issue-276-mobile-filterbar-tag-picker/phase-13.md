# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| Phase | 13 |
| 前提 | Phase 12 完了 |
| 後続 | なし（ワークフロー終端） |

## 目的

`dev` を base に PR を作成し、CI green を確認する。

## 実行手順（CLAUDE.md PR 作成完全自律フロー準拠）

事前条件: commit / push / PR 作成はユーザーの明示承認後のみ実行する。承認前は `outputs/phase-13/change-summary.md` と `outputs/phase-13/local-check-result.md` までを作成し、mutation は実行しない。

1. `git fetch origin dev` → ローカル `dev` を FF 同期
2. 作業ブランチに `git merge dev`（コンフリクトは CLAUDE.md 既定方針）
3. 品質検証 4 コマンド
   ```bash
   mise exec -- pnpm install --force
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   bash scripts/verify-pr-ready.sh
   ```
4. `outputs/phase-13/local-check-result.md` に検証結果を記録
5. `outputs/phase-13/change-summary.md` に PR 含有予定差分を記録
6. ユーザー承認取得後、`git status --porcelain` 空確認 → 残差分があれば `git add -A` で commit
7. `git diff dev...HEAD --name-only` で PR 含有ファイル確認
8. `gh pr create --base dev` で PR 作成し、結果を `outputs/phase-13/pr-creation-result.md` と `outputs/phase-13/pr-info.md` に記録

## PR タイトル / 本文

- タイトル: `feat(issue-276): mobile FilterBar tag picker + sticky summary (refs #276)`
- 本文は `outputs/phase-12/implementation-guide.md` から転記
- スクリーンショット参照: `outputs/phase-11/evidence/` の 4 画像

## 完了条件

- [ ] PR URL を `outputs/phase-13/pr-info.md` に記録
- [ ] `outputs/phase-13/local-check-result.md` が存在
- [ ] `outputs/phase-13/change-summary.md` が存在
- [ ] `outputs/phase-13/pr-creation-result.md` が存在（PR 作成が承認済みの場合）
- [ ] CI（typecheck / lint / test / coverage / verify-design-tokens 等）全 green
- [ ] PR 本文に Phase 11 スクリーンショットがリンク済み

## タスク100%実行確認【必須】

- [ ] `--base dev` で作成（`main` は production リリース時のみ）
- [ ] Issue #276 を PR 本文で `refs #276` 参照
- [ ] commit / push / PR 作成前のユーザー承認ログを記録

## 次Phase

なし。マージ後 `docs/30-workflows/issue-276-mobile-filterbar-tag-picker` → `completed-tasks/` 配下へ移動する（運用ルール）。

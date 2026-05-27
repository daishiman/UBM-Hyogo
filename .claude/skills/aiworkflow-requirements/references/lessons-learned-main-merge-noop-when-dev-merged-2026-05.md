---
name: lessons-learned-main-merge-noop-when-dev-merged
description: dev を既に merge 済みの feature branch では origin/main の merge は構造的に no-op になる前提と検証手順
type: lessons-learned
date: 2026-05-27
related-task: pr-creation (main 取り込み指示への応答)
---

# main 取り込みが no-op になる構造前提

## 背景

PR 作成フロー実行中、ユーザーから「リモートの main をローカル main にマージし、その後本ブランチにマージしてコンフリクト・CI 失敗を解消」という指示を受けた。
実行結果は以下のとおりすべて no-op だった:

- `git fetch origin main` 後、`git rev-list --left-right --count refs/heads/main...origin/main` = `0 0`（ローカル main は既に同期）
- `git merge-base --is-ancestor origin/main HEAD` = true（main は HEAD の祖先）
- `git merge origin/main --no-edit` = `Already up to date.`
- `gh pr checks <PR>` = SUCCESS:32 / SKIPPED:1 / FAILURE:0
- `git rev-list --count @{u}..HEAD` = 0（未 push なし）

## 結論

`feature/* → dev → main` の単方向 release branch 戦略 (CLAUDE.md「ブランチ戦略」節) のもとでは:

1. feature branch は通常 dev を merge 済みであり、dev は main を含む
2. したがって `origin/main` は HEAD の祖先となり、`git merge origin/main` は必ず `Already up to date.` で終わる
3. main 起源のコンフリクトは構造的に発生し得ない（dev → feature の merge 時点で吸収済み）

## 教訓 (Lesson IDs)

- **L-MAINNOOP-001 (verify-before-merge)**: 「main を merge」指示を受けた場合、まず `git merge-base --is-ancestor origin/main HEAD` を実行する。true なら no-op を確認の上、merge を試行せず「`Already up to date.`」を報告する（不要な merge commit を作らない）。
- **L-MAINNOOP-002 (ci-failure-check-precedence)**: 「CI 失敗解消」指示を受けた場合、`gh pr checks <PR>` で実状を取得してから対処判断する。すべて SUCCESS なら「失敗なし」を一次確認として返し、推測修正に着手しない。
- **L-MAINNOOP-003 (no-op-also-deserves-skill-sync)**: no-op 結果でも、ユーザーがスキル反映を明示指示した場合は本ファイルのように「no-op になる構造前提」を lesson として残す。次回同種指示を受けた AI が `is-ancestor` 確認だけで完結できる。
- **L-MAINNOOP-004 (left-right-count-as-evidence)**: 「同期済み」報告の根拠は `git rev-list --left-right --count refs/heads/main...origin/main = 0 0` と `gh pr checks` の集計を併記すること。print-only の `Already up to date.` 単独では他者検証性が弱い。
- **L-MAINNOOP-005 (dev-divergence-check-required)**: main merge が no-op でも、前回 push 後に他 PR が dev へ merge されると本 branch は `mergeStateStatus=DIRTY / mergeable=CONFLICTING` になる。「main 取り込み」指示でも必ず `gh pr view <PR> --json mergeable,mergeStateStatus` を併走し、`CONFLICTING` の場合は `git fetch origin dev && git merge origin/dev` で再 sync する。CI checks が全 SUCCESS でも mergeable が DIRTY なら未解決状態。
- **L-MAINNOOP-006 (skill-only-push-does-not-retrigger-required-checks)**: `.claude/skills/**` だけを変更した push は path-filter で大半の required workflow が起動せず、`gh pr checks` 上 1 件（triage 等）のみ表示される。「失敗 0」と早合点せず、`mergeStateStatus` で blocking 判定する。実 CI 再走が必要なら code-touching commit か `pnpm sync:resolve` 後の dev merge commit を積む（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC 系参照、空 commit は NG）。

## 関連

- [[lessons-learned-sync-merge-hook-skip]]: sync-merge 時の hook 自動スキップ
- [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]]: dev 取り込みコンフリクト解消の 3 層予防
- CLAUDE.md 「ブランチ戦略」「PR 作成の完全自律フロー」

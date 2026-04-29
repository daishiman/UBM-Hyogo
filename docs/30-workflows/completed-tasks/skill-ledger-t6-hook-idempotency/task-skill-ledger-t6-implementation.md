# task-skill-ledger-t6-implementation — T-6 hook 実装と 4 worktree smoke 実走

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-skill-ledger-t6-implementation |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/skill-ledger-t6-hook-idempotency/ |
| 種別 | implementation / NON_VISUAL / infrastructure_governance |
| 優先度 | HIGH |
| 状態 | unassigned |
| GitHub Issue | #161 は CLOSED のまま参照。新規 Issue 化する場合も reopen しない |

## 背景

`skill-ledger-t6-hook-idempotency` は docs-only の仕様書整備として close-out した。実 hook 差分、部分 JSON リカバリ、2 worktree 事前 smoke、4 worktree full smoke の実走証跡は未実装のため、後続 implementation タスクとして分離する。

## スコープ

### 含む

- `lefthook.yml` / hook 補助スクリプトの副作用検査と必要最小修正
- `git add` / `git stage` / `git update-index --add` の禁止
- 派生物の自動再生成を hook から呼ばないことの確認
- `pnpm indexes:rebuild` 部分失敗時の `jq -e .` 検出と削除 / 再生成手順の実装または runbook 化
- 2 worktree 事前 smoke と 4 worktree full smoke の実走
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-11/` の実値更新

### 含まない

- Issue #161 の reopen
- UI / API / DB / Cloudflare 設定変更
- A-1 / A-2 / B-1 の再設計

## 受入条件

| AC | 内容 |
| --- | --- |
| AC-1 | hook 経路に `git add` 系コマンドがない |
| AC-2 | 派生物存在時も tracked canonical を上書きしない |
| AC-3 | 部分 JSON を `jq -e .` で検出し、削除 / 再生成できる |
| AC-4 | 4 worktree smoke 後の `git ls-files --unmerged \| wc -l` が `0` |
| AC-5 | A-1 / A-2 完了 gate を実装着手前に確認する |
| AC-6 | `wait $PID` ごとの return code を個別集約する |
| AC-7 | 2 worktree PASS 後にのみ 4 worktree full smoke へ進む |
| AC-8 | 1〜2 commit 粒度で rollback できる |

## 参照

- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-10/main.md`
- `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md`

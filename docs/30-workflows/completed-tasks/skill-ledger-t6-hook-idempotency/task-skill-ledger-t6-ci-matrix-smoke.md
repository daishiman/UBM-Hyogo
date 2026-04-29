# task-skill-ledger-t6-ci-matrix-smoke — 4 worktree smoke の CI matrix 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-skill-ledger-t6-ci-matrix-smoke |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-4) |
| 種別 | infra / CI / NON_VISUAL |
| 優先度 | LOW |
| 状態 | unassigned |
| GitHub Issue | 未起票（本タスクで起票予定） |

## 背景

T-6 の 4 worktree smoke はローカルでの I/O 飽和を通じた競合再現が前提だが、CI では完全な再現は不可能。一方で `unmerged=0` を持続的に守る最低限ガードは matrix job 化が現実的で、NON_VISUAL タスクの evidence 自動化にも資する。Phase 11 / D-2 で要件として浮上したが、scope 維持のため今回見送られた。

## スコープ

### 含む

- 2〜4 並列で `pnpm indexes:rebuild` を実行する matrix job の設計
- 各 job 末尾で `git ls-files --unmerged | wc -l` を assert
- 失敗時にどの shard で発生したかを特定できる artifact 出力
- 既存 `verify-indexes` workflow との関係整理（重複 / 統合 / 別 job 化）

### 含まない

- ローカルの 4 worktree 実走（U-1 task で実施済み or 実施予定）
- I/O 飽和の完全再現
- hook 本体の冪等化実装

## 受入条件

- AC-1: matrix job が PR push で起動し、shard 数 ≥ 2 で実行される。
- AC-2: いずれかの shard で `unmerged > 0` を検出した場合、CI が fail する。
- AC-3: 失敗 shard の log / artifact が GitHub Actions UI から取得できる。
- AC-4: `verify-indexes` workflow との責務分離が `references/` にドキュメント化されている。

## 苦戦箇所（記入予定枠）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 実装着手時に記入 |
| 原因 | 実装着手時に記入 |
| 対応 | 実装着手時に記入 |
| 再発防止 | 実装着手時に記入 |

## 参照

- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-11.md`
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md`
- `.github/workflows/verify-indexes.yml`

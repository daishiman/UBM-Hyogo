# Phase 1 Output: 要件定義

## 公式 docs 調査観点

| 対象 | 記録内容 |
| --- | --- |
| Claude Code permissions | `permissions.allow` / `permissions.deny` の評価優先度 |
| Claude Code CLI flags | `--dangerously-skip-permissions` の挙動 |
| Claude Code settings | `defaultMode` / `--permission-mode` の関係 |

公式 docs に明示記述があれば `docs_explicit_yes` または `docs_explicit_no` とする。明示記述がなければ `docs_inconclusive_requires_execution` とし、推測で YES 扱いしない。

## 観測対象 pattern

- P-01: `Bash(git push --force:*)`
- P-02: `Bash(rm -rf /:*)`
- P-03: `Write(/etc/**)`
- P-04: `Bash(git push --force-with-lease:*)`

## スコープ

docs-only / spec_created。実 settings、実 alias、実 remote は変更しない。

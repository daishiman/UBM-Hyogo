# Phase 9: 品質保証

## QA チェックリスト

| 項目 | 判定基準 |
|------|---------|
| line budget | 各 phase-N.md が 200 行以内 |
| link 有効性 | `INVARIANT-AUDIT.md` 内の file:line リンクが現存ファイルを指す |
| read-only 担保 | `git diff apps/ packages/` が空 |
| matrix 完備 | 132 セル全埋め |
| evidence 保存 | `outputs/phase-5/grep-evidence.txt` が存在し空でない |

## mirror parity

`.claude/skills/` 配下は本タスクで触らない（mirror 同期対象外）。

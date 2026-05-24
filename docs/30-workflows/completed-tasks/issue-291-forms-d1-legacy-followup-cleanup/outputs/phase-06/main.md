# Phase 6: 異常系検証 — Summary

## 検出パターン

| パターン | 検出方法 | 結果 |
|---------|---------|------|
| 誤削除（historical lessons-learned 本文削除） | `git diff --stat .claude/skills/aiworkflow-requirements/references/lessons-learned-*.md` | 0 file changed |
| current drift 残存 | Phase 4 scan #1 を実適用後 references に対し実行 | current section に legacy 言及なし。残存 hit はすべて historical 別表内 |
| 逆リンク欠落 | Phase 4 scan #3（3 物理 + 2 ledger fallback） | 3 物理 hit + 2 ledger fallback row hit を確認 |
| backlog supersede 漏れ | Phase 4 scan #6 | `status: superseded` annotation を 2 entry に確認 |
| conflict marker 混入 | Phase 4 scan #2 | 0 hit |
| index drift（意図外） | `git diff --stat .claude/skills/aiworkflow-requirements/indexes` | references 更新由来の差分のみ |

異常系すべて PASS。

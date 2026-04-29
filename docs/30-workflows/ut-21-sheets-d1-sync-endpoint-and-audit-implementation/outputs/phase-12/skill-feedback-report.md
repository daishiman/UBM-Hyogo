# Skill Feedback Report

| Skill | Feedback | 改善提案 |
| --- | --- | --- |
| `task-specification-creator` | Phase 12 の Step 2 が「追加する」前提になりやすく、正本仕様と衝突する場合の block 表現が弱い | Step 2 に `conflict_detected` 分岐を追加し、反映禁止・未タスク化・ledger blocked を標準化する |
| `task-specification-creator` | `NON_VISUAL` なのに screenshot 参照を要求する運用が混ざりやすい | `visualEvidence=NON_VISUAL` の場合は `outputs/phase-11/manual-smoke-log.md` / `link-checklist.md` を証跡として許可する |
| `aiworkflow-requirements` | Forms sync と legacy Sheets sync の境界は存在するが、UT-21 のような後続仕様から参照した時に見落としやすい | `quick-reference.md` に「Sheets direct implementation 禁止 / Forms sync 正本」への導線を強化する |
| `automation-30` | 4条件チェックにより矛盾検出はできた | `反映しない改善` を成果物として扱うパターンを明文化する |

## 改善点なし判定

改善点なしではない。Phase 12 conflict gate と NON_VISUAL evidence のテンプレート改善が必要。

# Lane 依存グラフ（Phase 2）

```
[Lane A: 既存 SKILL.md 是正]      [Lane B: フィクスチャ rename]
   ├─ A-1 aiworkflow                       │
   ├─ A-2 automation-30                    │
   └─ A-3 skill-creator                    ↓
                                  [Lane C: skill-creator 改修]
                                     ├─ utils/validate-skill-md.js
                                     ├─ utils/yaml-escape.js
                                     ├─ generate_skill_md.js (改修)
                                     ├─ init_skill.js (改修)
                                     └─ codex_validation.test.js (新規)
```

## 並列性

- Lane A の 3 サブタスク (A-1/A-2/A-3) は完全並列
- Lane A と Lane B も完全並列
- Lane C は B 完了後に「フィクスチャ出力経路整合確認」のみ直列（実装自体は並列開始可）

## クリティカルパス

Lane B のリネーム → Lane C のフィクスチャ出力先確認 → Phase 5 ゲート

## ロールバック単位

各 Lane は独立 commit 可能だが、本タスクは単一 PR で集約する（AC-8）。

# documentation changelog

| date | change | path |
|------|--------|------|
| 2026-05-17 | task-761 仕様書一式作成 | `docs/30-workflows/task-761-visual-full-required-status-check/**` |
| 2026-05-17 | required check pending 防止 | `.github/workflows/playwright-visual-full.yml` |
| 2026-05-17 | aiworkflow 正本同期 | `.claude/skills/aiworkflow-requirements/{indexes,references,changelog}` |
| 2026-05-17 | source unassigned consumed trace | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |

## 変更履歴詳細

### add: task-761 仕様書

- Phase 1-13 仕様書全成果物
- evidence template 9 件
- root index.md / artifacts.json
- outputs/artifacts.json (parity)

### update: aiworkflow 正本

- task-761 を `implemented / implementation / NON_VISUAL / governance / external_mutation_completed` として登録
- source unassigned task を consumed として canonical workflow root へ接続
- branch protection 正本に実測 visual-full required contexts と external mutation completed evidence を追記

### update: CLAUDE.md

- 更新不要。branch protection 正本は aiworkflow-requirements 側で管理し、commit / push / PR は user-gated のまま。

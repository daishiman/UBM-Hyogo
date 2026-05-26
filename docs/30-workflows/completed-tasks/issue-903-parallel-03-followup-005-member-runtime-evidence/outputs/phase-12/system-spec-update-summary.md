# Phase 12 — system-spec-update-summary

[実装区分: 実装仕様書]

## 影響を受ける system spec / skill

| Target | 影響 |
|--------|------|
| `docs/00-getting-started-manual/specs/` | 影響なし（API endpoint / D1 schema / auth 仕様変更なし） |
| `.claude/skills/aiworkflow-requirements/indexes/` | 本 workflow / artifact inventory を同 wave 同期 |
| `.claude/skills/aiworkflow-requirements/references/` | profile route group 移動後の current implementation target / invariant scan target を `apps/web/app/(member)/profile/**` に同期 |
| `.claude/skills/task-specification-creator/` | Issue #903 lesson を同 wave 反映済み |
| 親 `parallel-03-appshell-layouts/phase-11-evidence-inventory.md` | EV-13 / EV-16 を `present` に昇格済み |

新規 API / D1 / auth 仕様の追加はない。workflow inventory、profile current path、static invariant target、evidence 台帳を同期する。

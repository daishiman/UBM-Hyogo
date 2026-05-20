# Skill Feedback Report

## Feedback

| skill | finding | action |
|-------|---------|--------|
| `task-specification-creator` | sub-workflow Phase 12 が root strict 7 に依存し、単体 strict 7 が欠落していた | applied locally: sub-workflow `outputs/phase-12/` strict 7 を追加。generic rule already exists, promotion不要 |
| `task-specification-creator` | Phase 11 inventory が parser 期待列と異なっていた | applied locally: `Classification / Path / Status` tableへ修正。generic rule already exists, promotion不要 |
| `task-specification-creator` | canonical 9 headings を中学生向け見出しと混同していた | applied locally: required heading namesへ修正。generic rule already exists, promotion不要 |
| `aiworkflow-requirements` | apps/web 実装 hook があるのに `spec_created` 表記が残っていた | owning skill updated in same wave: implementation hook + runtime visual pendingへ再分類 |
| `automation-30` | 破棄ではなく仕様準拠パッチで足りる | applied locally: 既存hookをG3 marker blockへ正規化。generic rule追加不要 |

## Promotion Need

No new generic rule required. Existing Phase 12 / Phase 11 evidence parser guidance already covers the failure; this cycle applies it to `parallel-02`.

# Documentation changelog — 04a

| 日付 | 変更 | パス |
| --- | --- | --- |
| 2026-04-29 | Phase 1〜12 の outputs 配下を新規作成 | `docs/30-workflows/04a-parallel-public-directory-api-endpoints/outputs/phase-{01..12}/` |
| 2026-04-29 | implementation-guide / spec compliance check を追加 | `outputs/phase-12/*` |
| 2026-04-29 | API 実装 + unit tests を追加 | `apps/api/src/{_shared,repository,view-models/public,use-cases/public,routes/public}/` |
| 2026-04-29 | shared view model 契約を 04a API response に同期 | `packages/shared/src/types/viewmodel/index.ts`, `packages/shared/src/zod/viewmodel.ts` |
| 2026-04-29 | 正本仕様へ 04a public API close-out を同期 | `.claude/skills/aiworkflow-requirements/references/{api-endpoints,architecture-monorepo,task-workflow}.md` |
| 2026-04-29 | `zone/status` fallback、`density` 値、stats 年間件数、Phase 台帳 drift を修正 | `apps/api/src/_shared/search-query-parser.ts`, `apps/api/src/repository/meetings.ts`, `apps/api/src/use-cases/public/get-public-stats.ts`, `artifacts.json`, `index.md` |

## 仕様文書への変更

あり（`system-spec-update-summary.md` 参照）。

## 注意

- `docs/30-workflows/04a-.../phase-XX.md`（タスク仕様書本体）は AI Workflow 自動生成物のため、AC 番号ずれは Phase 12 成果物と index 側で再同期した。
- 実装上の決定値は `implementation-guide.md` に集約。仕様文書の変更が必要になった場合は別タスクで起票する。

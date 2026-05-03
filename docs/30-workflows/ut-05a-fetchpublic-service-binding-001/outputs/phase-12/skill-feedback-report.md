# Skill Feedback Report — ut-05a-fetchpublic-service-binding-001

## 改善点なしでも本ファイルは出力必須

spec_created 段階で観測した task-specification-creator skill / aiworkflow-requirements
skill 向けの feedback を記録する。

## Routing

| symptom | cause | recurrence condition | 5-minute resolution | evidence path | promoted-to |
| --- | --- | --- | --- | --- | --- |
| 「実装済 / deploy 待ち」状態の bug-fix タスクは Phase 11 が deploy verification 主体になる | 通常の implementation Phase 11 は smoke 中心の想定で書かれているが、本タスクはコード変更が local 完了済で deploy + curl + tail が verification 主体 | Cloudflare Workers 系の hotfix で local 実装済 → staging/production deploy verification を残すケース | Phase 11 を「code diff / deploy / curl / tail / local fallback / redaction」の 6 セクションで固定するルールを skill 側へ反映 | `phase-11.md`, `outputs/phase-11/` 構成 | promoted: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| service-binding と HTTP fallback の二経路を持つ実装の AC が 1 ファイルに混在しがち | 「local では fallback / staging では service-binding」のような Two-Path 実装は AC が経路ごとに分裂する | Cloudflare service-binding を採用する `apps/web` 系タスクで再発しうる | AC マトリクスを「runtime path × evidence」の 2 軸表で書く規約を skill 側へ反映 | `phase-12.md` AC ↔ evidence path 対応表 | promoted: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| `transport: 'service-binding'` ログの取得は flaky になりやすい | tail のログは request 流量に依存し、1 件だけ確認だと flaky | service-binding 採用の Cloudflare Workers タスク | 「複数件確認すること」を Phase 11 evidence rule として明示する | `phase-11.md` 多角的チェック観点 | no-op: タスク内ルールで十分 |
| `wrangler` 直接呼出の禁止と `wrangler tail` 表記の併存 | CLAUDE.md は `wrangler` 直接禁止 / `bash scripts/cf.sh tail` 経由必須だが、説明文中で `wrangler tail` 表記が混在しやすい | Cloudflare 系仕様書全般 | 説明文の中でも「`bash scripts/cf.sh tail`（内部で wrangler tail を実行）」と書く規約を維持 | `phase-11.md`, `implementation-guide.md` | no-op: 既存 Cloudflare CLI rule で covered |
| Issue CLOSED 状態の bug-fix を spec 化するパターン | Issue #387 は CLOSED のまま spec 化 → user 明示指示後に PR | 既存 Issue を再オープンせず spec/PR で対応するパターン | 「Issue は CLOSED のまま維持 / PR リンクは user 明示指示後にのみ comment」を Phase 13 共通ルールとして再確認 | `phase-13.md` | no-op: ut-09a と同じ pattern を踏襲済 |

## Result

- 新規 promote 候補 2 件は今回サイクル内で task-specification-creator skill へ反映済み
- 反映先: `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
  / `.claude/skills/task-specification-creator/SKILL.md`
  / `.claude/skills/task-specification-creator/SKILL-changelog.md`
- 本タスクの spec_created 段階で未反映の skill 仕様不整合は **0 件**

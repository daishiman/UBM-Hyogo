# Documentation Changelog — coverage-80-enforcement

Step 1-A / 1-B / 1-C / Step 2 を **個別記録** する。

| 日付 | 区分 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- | --- |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/index.md | タスク仕様書 index（Phase 1〜13 / AC-1〜AC-14） |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/artifacts.json | Phase 1〜13 機械可読サマリー |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/phase-{01..13}.md | 各 Phase 仕様書 |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/outputs/phase-{01..13}/main.md | 各 Phase 索引 |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md | Part 1 + Part 2 |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C / Step 2=REQUIRED |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md | U-1〜U-5 |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/outputs/phase-12/skill-feedback-report.md | 3 観点 |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/outputs/phase-12/phase12-task-spec-compliance-check.md | テンプレ準拠チェック |
| 2026-04-29 | 新規 | new | docs/30-workflows/coverage-80-enforcement/outputs/phase-13/{main,pr1-runbook,pr2-runbook,pr3-runbook}.md | PR 段階適用 runbook |
| 2026-04-29 | 同期（Step 1-A） | edit | docs/30-workflows/LOGS.md | coverage-80-enforcement implementation_started 行追加 |
| 2026-04-29 | 同期（Step 1-A） | edit | .claude/skills/task-specification-creator/LOGS/_legacy.md | NON_VISUAL Phase 12 Part 1/2 構成テンプレ適用例ログ |
| 2026-04-29 | 同期（Step 1-A） | pending | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | quality-requirements-advanced.md の coverage 80% 一律切替見出し同期対象（index 再生成は別途） |
| 2026-04-29 | 追記（Step 1-A） | edit | CLAUDE.md | 「solo 運用ポリシー × CI hard gate (coverage-gate) 整合」注記の追記（既存記述変更なし） |
| 2026-04-29 | 同期（Step 1-B） | edit | docs/30-workflows/LOGS.md | coverage governance テーブルで coverage-80-enforcement = implementation_started |
| 2026-04-29 | 同期（Step 1-C） | edit | docs/30-workflows/ut-gov-001-github-branch-protection-apply/index.md | coverage-80-enforcement との双方向リンク追加（PR③ contexts 登録の連携） |
| 2026-04-29 | 同期（Step 1-C） | edit | docs/30-workflows/ut-gov-004-*（存在時） | coverage-gate job 名同期の上流前提として双方向リンク |
| 2026-04-29 | 同期（Step 2） | edit | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | 既存 apps=80% / packages=65% → 全 package 80% 一律へ更新（diff は system-spec-update-summary.md 参照） |
| 2026-04-29 | 同期（Step 2） | edit | .claude/skills/task-specification-creator/references/coverage-standards.md | scripts/coverage-guard.sh 参照を強制経路へ追記 |
| 2026-04-29 | 同期確認のみ | check | codecov.yml | repo に存在しないため PR① Codecov upload step は除外。必要なら別タスクで導入 |

> Step 2 が REQUIRED である理由: 既存 aiworkflow-requirements の package 別差分閾値（apps=80% / packages=65%）が「全 package 一律 80%」とのユーザー決定事項と衝突するため。

## 実 commit / merge / `pnpm indexes:rebuild` のタイミング

| 操作 | タイミング |
| --- | --- |
| LOGS.md 追記 | 本 wave で実施 |
| CLAUDE.md 追記 | 未実施。既存 solo 運用記述で branch protection 方針は足りるため、追加が必要なら別途判断 |
| 双方向リンク（Step 1-C） | Phase 13 PR① commit に同梱 |
| `quality-requirements-advanced.md` 更新（Step 2） | 本 wave で実施 |
| `coverage-standards.md` 更新（Step 2） | 本 wave で実施 |
| `pnpm indexes:rebuild` | Phase 13 PR③ merge 後、user 承認後の別オペレーション |
| branch protection contexts 登録 | Phase 13 PR③ merge 後、user 承認後の別オペレーション（UT-GOV-001 経由） |

> 本 wave では commit / push / PR 作成 / branch protection PUT は一切実行しない。

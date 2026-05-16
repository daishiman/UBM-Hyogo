# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | close-out documentation |

## 目的

fallback 廃止完了後に aiworkflow-requirements 正本、workflow inventory、unassigned task、skill feedback を同期する。

## 実行タスク

作成する必須成果物:

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリー |
| `outputs/phase-12/implementation-guide.md` | 中学生レベル概念説明 + 技術者向け実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | `database-implementation-core.md` 等の正本仕様 diff |
| `outputs/phase-12/documentation-changelog.md` | docs 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 残課題（DEFERRED 時は廃止延期理由と再判定タイミング、もしくは 0 件でも出力） |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback（改善なしでも出力） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | 必須成果物 |
| aiworkflow requirements | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | index 同期 |
| database implementation | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | fallback 記述更新対象 |
| 上流 close-out | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/unassigned-task-detection.md` | 親タスク参照 |

## 実行手順

1. `database-implementation-core.md` の fallback 関連節を「retired at 2026-05-15 by task-issue-299」へ更新（または削除）し、`system-spec-update-summary.md` に diff を記録する。
2. `task-workflow-active.md` / indexes（必要に応じて `pnpm indexes:rebuild` 実行）を同期する。
3. GO 分岐で fallback 削除と検証が完了した場合のみ、`docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` のステータスを「completed by task-issue-299」へ更新する（ファイル削除はしない、追記のみ）。DEFERRED 分岐では open 維持で再判定条件を追記する。
4. `task-issue-191-direct-stable-key-update-guard-001` への参照を `unassigned-task-detection.md` に残す（本タスク scope 外）。
5. DEFERRED の場合は実装変更なしで close-out。`unassigned-task-detection.md` に coverage 結果と再判定タイミング（次回 alias backfill batch 完了後など）を明記する。
6. `artifacts.json` と `outputs/artifacts.json` の整合を `cmp -s` で確認する。
7. `implementation-guide.md` Part 1 は日常例、専門用語セルフチェック 5 語以上、「なぜ必要か」先行を満たす。
8. `rg -n "TODO|TBD|FIXME|planned|予定" outputs/phase-12` で placeholder evidence が残っていないことを確認する。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| 7 files | all exist |
| current facts | evidence-backed only |
| unassigned | DEFERRED 時の再判定条件を明記 / 完了時は 0 件でも出力 |

## 多角的チェック観点（AIが判断）

- docs-only close-out 由来の予定事実を実装済み facts と混ぜていないか。
- Phase 13 承認前に PR 作成を実行していないか。
- Issue #299 の close/reopen 操作を実行していないか（ユーザー指示によりオープン状態維持）。

## サブタスク管理

| サブタスク | 完了条件 |
| --- | --- |
| spec update | 正本更新 |
| changelog | 更新履歴 |
| unassigned | 残課題分類（direct update guard / DEFERRED 時の再判定） |
| skill feedback | 改善点記録 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| Phase 12 bundle | `outputs/phase-12/*` | close-out |

## 完了条件

- [ ] Phase 12 必須 7 ファイルが揃っている
- [ ] root/output `artifacts.json` parity が実測されている
- [ ] Part 1 strict と placeholder grep gate が通っている
- [ ] 正本仕様と実装 facts が一致している
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 13 の承認待ち状態へ進める

## 次Phase

Phase 13: PR作成

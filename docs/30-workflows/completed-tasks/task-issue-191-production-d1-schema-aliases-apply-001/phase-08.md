# Phase 8: DRY / 責務確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

このタスクが他タスクと責務重複していないことを確認し、本タスクが「production D1 への `schema_aliases` apply のみ」に閉じていることを保証する。

## 実行タスク

- 隣接タスクとの責務分担を表に固定する。
- migration / CLI / evidence / SSOT の重複作成を避ける。
- production apply 以外の deploy / fallback retirement / guard 実装をスコープ外に保つ。

## 隣接タスクとの責務分担

| タスク | 責務 | 本タスクとの境界 |
| --- | --- | --- |
| `task-issue-191-schema-aliases-implementation-001` | local migration 作成 / repository / 07b wiring / 03a lookup / contract tests | コード実装は完了済み。本タスクは production apply のみ |
| `task-issue-191-schema-questions-fallback-retirement-001` | `schema_questions.stable_key` fallback 廃止 | 本タスクの apply 完了が前提。fallback 廃止は別タスク |
| `task-issue-191-direct-stable-key-update-guard-001` | `UPDATE schema_questions SET stable_key` の guard | 本タスクの apply 完了後に実装。本タスクには含めない |
| 07b endpoint rename / apps/web 変更 | HTTP path / UI | 本タスクのスコープ外 |
| Worker bundle deploy | apps/api / apps/web の production deploy | 本タスクは D1 schema apply のみ。code deploy は別タスク |

## DRY 観点

| 項目 | 状態 |
| --- | --- |
| migration ファイル | `apps/api/migrations/0008_create_schema_aliases.sql` を SSOT とし、本タスクで複製しない |
| Cloudflare CLI 呼び出し | `scripts/cf.sh` ラッパーを利用し、wrangler 直叩きを増やさない |
| evidence template | `task-issue-191-schema-aliases-implementation-001` の Phase 11 evidence template を踏襲し、production 版として ID プレフィックスのみ差し替える |
| SSOT 更新箇所 | `database-schema.md` の production apply 状態 marker は本タスクのみが更新する |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| parent implementation | `.claude/skills/aiworkflow-requirements/references/workflow-task-issue-191-schema-aliases-implementation-001-artifact-inventory.md` | upstream 完了 / open follow-up |
| lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-191-schema-aliases-2026-04.md` | write target / fallback 境界 |
| database SSOT | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | production apply marker |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| responsibility review | `phase-08.md` | 隣接タスク境界 / DRY 表 |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 9 | scope 外の code / deploy を検証対象に含めない | `outputs/phase-11/static-checks.md` |
| Phase 12 | scope 外候補を unassigned-task detection へ送る | `outputs/phase-12/unassigned-task-detection.md` |

## 完了条件

- [ ] 隣接タスクとの境界表が埋まっている
- [ ] 本タスクが apply 操作 + evidence + SSOT 更新に閉じていることを確認
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 9: 品質保証

# issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring - タスク仕様書 index

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| 状態 | spec_created / docs_only / NON_VISUAL |
| Issue | #191 closed issue closeout |
| Phase 状態 | Phase 1-13 spec outputs completed / implementation deferred |

## 概要

03a は `schema_questions.question_id` を読んで既知 `stable_key` を保持できるが、07b の alias assignment workflow が前提とする専用 `schema_aliases` table が現行 D1 migrations に存在しない。本タスクは CLOSED issue #191 の補完仕様として、`schema_aliases` table 追加、07b alias 解決書き込み先変更、03a alias 優先 lookup / fallback の実装要件を 13 Phase 仕様に固定する。実 DDL 適用・repository 実装・07b/03a 配線は後続実装タスクで扱う。

## Classification Note

この workflow は application implementation scope だが、CLOSED issue の docs-only closeout として `completed-tasks/` 配下に置く。07b の既存 workflow は `docs/30-workflows/02-application-implementation/07b-parallel-schema-diff-alias-assignment-workflow/` に残し、issue-191 はその write target supersession として参照される。

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2 | 設計 | [phase-02.md](phase-02.md) | completed |
| 3 | 設計レビュー | [phase-03.md](phase-03.md) | completed |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | completed |
| 5 | 実装ランブック | [phase-05.md](phase-05.md) | completed |
| 6 | 異常系検証 | [phase-06.md](phase-06.md) | completed |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | completed |
| 8 | DRY 化 | [phase-08.md](phase-08.md) | completed |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | completed |
| 10 | 最終レビュー | [phase-10.md](phase-10.md) | completed |
| 11 | 手動証跡計画 | [phase-11.md](phase-11.md) | completed |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | completed |
| 13 | PR 準備 | [phase-13.md](phase-13.md) | completed |

## Phase 12 成果物

| Artifact | Path |
| --- | --- |
| implementation guide | `outputs/phase-12/implementation-guide.md` |
| system spec summary | `outputs/phase-12/system-spec-update-summary.md` |
| documentation changelog | `outputs/phase-12/documentation-changelog.md` |
| unassigned detection | `outputs/phase-12/unassigned-task-detection.md` |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 後続未タスク

- `docs/30-workflows/unassigned-task/task-issue-191-schema-aliases-implementation-001.md`
- `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md`
- `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md`

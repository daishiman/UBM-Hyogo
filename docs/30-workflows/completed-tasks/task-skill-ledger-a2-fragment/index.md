# task-skill-ledger-a2-fragment — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| ディレクトリ | docs/30-workflows/task-skill-ledger-a2-fragment |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/130 |
| Issue 状態 | CLOSED（Issue #130 の実装差分を本ブランチで保持。再オープン不要） |
| 実行種別 | implementation |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |
| 状態 | implementation-ready（Phase 13 はユーザー承認待ち） |
| 優先度 | high |
| 規模 | medium |
| 発見元 | task-conflict-prevention-skill-state-redesign Phase 12 / 派生実装タスク T-2 (A-2) |

## 目的

`LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` を 1 entry = 1 file の fragment 化（Changesets パターン）し、`pnpm skill:logs:render` を実装することで、複数 worktree 並列追記の同一バイト位置 conflict を構造的に解消する。T-5（render script）と T-7（legacy migration）は本タスクの subtask として包含する。

## 位置付け

- **A-1 / A-3 / B-1 の前提となる先頭タスク**。本タスク完了後に後続が解放される。
- 上流: `task-conflict-prevention-skill-state-redesign` Phase 12 で formalize された A-2 fragment 化の派生タスク。
- 既存仕様書（参照元）: `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md`

## Phase一覧

| Phase | 名称 | ファイル | ステータス | 主要成果物 |
| ----- | ---- | -------- | --------- | ---------- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-1/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-2/main.md, outputs/phase-2/fragment-schema.md, outputs/phase-2/render-api.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-3/main.md, outputs/phase-3/review.md |
| 4 | テスト設計 | phase-04.md | completed | outputs/phase-4/main.md, outputs/phase-4/test-matrix.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-5/main.md, outputs/phase-5/runbook.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-6/main.md, outputs/phase-6/failure-cases.md, outputs/phase-6/fragment-runbook.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-7/main.md, outputs/phase-7/coverage.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-8/main.md, outputs/phase-8/before-after.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-9/main.md, outputs/phase-9/quality-gate.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動テスト | phase-11.md | completed | outputs/phase-11/main.md, outputs/phase-11/manual-smoke-log.md, outputs/phase-11/link-checklist.md, outputs/phase-11/4worktree-smoke-evidence.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md, outputs/phase-12/implementation-guide.md, outputs/phase-12/system-spec-update-summary.md, outputs/phase-12/documentation-changelog.md, outputs/phase-12/unassigned-task-detection.md, outputs/phase-12/skill-feedback-report.md, outputs/phase-12/phase12-task-spec-compliance-check.md, outputs/phase-12/runbook-diff-plan.md |
| 13 | 完了確認 / PR | phase-13.md | pending | outputs/phase-13/main.md, outputs/phase-13/change-summary.md, outputs/phase-13/pr-template.md |

## 横断依存

### 上流（前提）

1. `task-conflict-prevention-skill-state-redesign`（Phase 1〜13 承認済）

### 下流（本タスクに依存）

1. `task-skill-ledger-a1-gitignore`
2. `task-skill-ledger-a3-progressive-disclosure`
3. `task-skill-ledger-b1-gitattributes`

## 主要技術仕様（要約）

| 項目 | 値 |
| ---- | -- |
| fragment 命名 | `(LOGS|changelog|lessons-learned)/<YYYYMMDD>-<HHMMSS>-<escaped-branch>-<nonce>.md` |
| fragment 命名 regex | `^(LOGS|changelog|lessons-learned)/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$` |
| timestamp format | `YYYYMMDD-HHMMSS`（UTC） |
| nonce length | 8 hex（4 byte） |
| escaped-branch 上限 | 64 文字 |
| path 全体上限 | 240 byte（NTFS 互換マージン） |
| legacy include window | 30 日 |
| front matter 必須項目 | `timestamp` / `branch` / `author` / `type` |
| legacy 退避先 | `LOGS/_legacy.md` / `changelog/_legacy.md` / `lessons-learned/_legacy-<base>.md` |
| CLI | `pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]` |

## 完了条件（タスク全体）

- [ ] 13 Phase の仕様書がすべて生成され、artifacts.json と整合する。
- [ ] 各 Phase が単独で実行可能な粒度で記述されている。
- [ ] aiworkflow-requirements / task-specification-creator skill との整合が取れている。
- [ ] Issue #130 の主要技術仕様（fragment 命名 / front matter / CLI / 完了条件）が Phase 仕様書全体で網羅されている。
- [ ] Phase 13 はユーザー承認待ち（commit / PR は実行しない）。

## 注意事項

- 本タスクは **実装差分を含む**。fragment 受け皿作成、legacy 退避、render/append script 実装、writer 切替を同一ブランチ内で扱う。
- Issue #130 は CLOSED のままとする（再オープンしない）。

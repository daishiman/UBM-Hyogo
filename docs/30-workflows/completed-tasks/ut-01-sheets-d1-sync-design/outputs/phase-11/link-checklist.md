# Phase 11 link-checklist.md

> 本ファイルは仕様書 → references / `.claude` ↔ `.agents` mirror / workflow 内リンク の 3 系統 link 死活 checklist。
> 各 link は「参照元 → 参照先 / 状態（OK / Broken）」テーブルで表現する。Broken が 1 件でもあれば Phase 11 FAIL。

## 系統 1: 仕様書 → references

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` / 縮約テンプレ正本リンク | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | OK |
| `index.md` / aiworkflow-requirements 必須 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | OK |
| `index.md` / aiworkflow-requirements 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | OK |
| `index.md` / aiworkflow-requirements 参考 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | OK |
| `phase-11.md` / 縮約テンプレ参照 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | OK |
| `phase-11.md` / NON_VISUAL 代替 evidence | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | OK |
| `phase-11.md` / SKILL.md 判定フロー | `.claude/skills/task-specification-creator/SKILL.md` | OK |

## 系統 2: `.claude` ↔ `.agents` mirror parity

| 対象 skill | 検証コマンド | 期待 | 状態 |
| --- | --- | --- | --- |
| `task-specification-creator` | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` | 出力 0 行 / exit 0 | OK（exit 0 / 出力 0 行を実測） |

> 本タスクは task-specification-creator skill 本体に編集を加えないため、diff 0 が前提。実測値（exit=0）で前提が成立した。1 行でも差分があればスコープ外編集が混入していたことになるが、本タスクでは混入なし。

## 系統 3: workflow 内リンク（双方向）

### 3-A: `index.md` ↔ `phase-NN.md`

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` / Phase 一覧 | `phase-01.md` 〜 `phase-13.md`（13 件） | OK（13 件すべて存在） |
| `phase-NN.md` / 上位リンク | `index.md` / 隣接 Phase | OK（各 phase-NN.md 末尾の「次 Phase」セクションが整合） |

### 3-B: `phase-NN.md` ↔ `outputs/phase-NN/*`

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `phase-01.md` | `outputs/phase-01/main.md` | OK |
| `phase-02.md` | `outputs/phase-02/sync-method-comparison.md` | OK |
| `phase-02.md` | `outputs/phase-02/sync-flow-diagrams.md` | OK |
| `phase-02.md` | `outputs/phase-02/sync-log-schema.md` | OK |
| `phase-03.md` | `outputs/phase-03/main.md` | OK |
| `phase-03.md` | `outputs/phase-03/alternatives.md` | OK |
| `phase-04.md` | `outputs/phase-04/test-strategy.md` | OK |
| `phase-05.md` | `outputs/phase-05/implementation-runbook.md` | OK |
| `phase-06.md` | `outputs/phase-06/failure-cases.md` | OK |
| `phase-07.md` | `outputs/phase-07/ac-matrix.md` | OK |
| `phase-08.md` | `outputs/phase-08/main.md` | OK |
| `phase-09.md` | `outputs/phase-09/main.md` | OK |
| `phase-10.md` | `outputs/phase-10/go-no-go.md` | OK |
| `phase-11.md` | `outputs/phase-11/main.md` | OK |
| `phase-11.md` | `outputs/phase-11/manual-smoke-log.md` | OK |
| `phase-11.md` | `outputs/phase-11/link-checklist.md` | OK |

### 3-C: 上流タスク / 下流タスク / 原典 / GitHub Issue

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` / 原典 | `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md` | OK |
| `index.md` / 上流 | `docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md` | OK |
| `index.md` / 上流 | `docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap/index.md` | OK |
| `index.md` / 上流 | `docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/index.md` | OK |
| `index.md` / 並列・下流 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md` | OK |
| `index.md` / 下流 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | OK |
| `index.md` / フォーマット模倣元 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/index.md` | OK |
| `index.md` / GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/50 | OK（CLOSED 状態として既知 / URL 死活は外部リンクのため運用上 known-good） |

## サマリ

| 項目 | 件数 |
| --- | --- |
| 全 link 件数 | 36 件（系統 1: 7 / 系統 2: 1 / 系統 3-A: 2 / 3-B: 18 / 3-C: 8） |
| OK | 36 件 |
| Broken | 0 件 |

Broken 0 件のため Phase 11 PASS。`manual-smoke-log.md` の苦戦箇所欄に Blocker は記録なし。

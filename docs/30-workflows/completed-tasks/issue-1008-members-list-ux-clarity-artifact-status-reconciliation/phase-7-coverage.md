# Phase 7: カバレッジ（検証カバレッジ）

> docs-only タスクのため「カバレッジ」= コード行カバレッジではなく、**補正対象 status フィールドを
> 検証ケースが網羅したか**を可視化する。対象範囲は `members-list-ux-clarity` 配下のみ。

## 7.1 対象範囲（明示）

- **対象**: `docs/30-workflows/completed-tasks/members-list-ux-clarity/` 配下の 6 ファイル（root / outputs artifacts.json、sub-task A/B/C artifacts.json、Task B phase-10-final-review.md）と、その整合確認先である aiworkflow register / inventory。
- **対象外**: 他 workflow（issue-976 等、ui-prototype-alignment-mvp-recovery 等）の artifacts は本タスクの補正・検証対象に含めない。`gate-metadata:validate` はリポジトリ全体を走査するが、本タスクで status を変更したのは members-list-ux-clarity 配下のみであり、他 workflow の既存 status は触らない。

## 7.2 補正対象 status フィールド × 検証ケース 網羅マトリクス

| # | フィールド | 対象ファイル | 補正後の期待値 | カバー VC |
|---|------------|--------------|----------------|-----------|
| 1 | `.status` | root | `implemented_local_runtime_pending` | VC-1 |
| 2 | `.metadata.workflow_state` | root | `implemented_local_runtime_pending` | VC-1 / VC-R4 |
| 3 | `.metadata.implementation_status` | root | `implemented_local_runtime_pending` | VC-1 |
| 4 | `.phases[1..12].status` | root | `completed` | VC-2 / VC-R5 |
| 5 | `.phases[13].status` | root | `pending` | VC-3 / VC-R4 |
| 6 | `.metadata.gates[Gate-A].status` + `passed_at` | root | `passed` + ISO8601 | VC-5 / VC-R2 |
| 7 | `.metadata.gates[Gate-B].status` + `passed_at` + `evidence_path` | root | `passed` + ISO8601 + `runtime-notes.md` 実在 | VC-5 / VC-7 / VC-R2 / VC-R3 |
| 8 | `.metadata.gates[Gate-C].status` | root | `pending` | VC-6 |
| 9 | root ↔ outputs parity | root / outputs | byte 一致 | VC-4 / VC-R1 |
| 10 | `.status` / `.metadata.workflow_state` / `.metadata.implementation_status` | task-a | `implemented_local_runtime_pending` | VC-8 / VC-R4 |
| 11 | `.phases[1..12].status` / `.phases[13].status` | task-a | `completed` / `pending` | VC-8 / VC-R5 |
| 12 | `.status` / `.metadata.workflow_state` / `.metadata.implementation_status` | task-b | `implemented_local_runtime_pending` | VC-8 / VC-R4 |
| 13 | `.phases[11..12].status` | task-b | `completed` | VC-8 / VC-R5 |
| 14 | `.status` / `.metadata.workflow_state` / `.metadata.implementation_status` | task-c | `implemented_local_runtime_pending` | VC-8 / VC-R4 |
| 15 | `.phases[1..12].status` / `.phases[13].status` | task-c | `completed` / `pending` | VC-8 / VC-R5 |
| 16 | AC checkbox 10 件（☐→☑） | task-b phase-10-final-review.md | `☑ PASS`=10 / `☐ PASS`=0 | VC-9 |
| 17 | register / inventory の status 記述 | aiworkflow-requirements | `implemented_local_runtime_pending` と一致 | VC-11 |

> 補正対象 17 行（status / workflow_state / implementation_status / phases[].status / gates[].status / parity / checkbox / register）が全て 1 つ以上の VC でカバーされている（網羅率 100%）。

## 7.3 status フィールド種別ごとのカバレッジ集計

| status 種別 | 補正対象数 | カバー VC 数 | カバー率 |
|-------------|------------|--------------|----------|
| `status`（top-level） | 4（root + outputs + 3 sub-task = 5 だが root/outputs は parity 1 計上）| VC-1 / VC-8 / VC-R4 | 100% |
| `metadata.workflow_state` | 5 | VC-1 / VC-8 / VC-R4 | 100% |
| `metadata.implementation_status` | 5 | VC-1 / VC-8 | 100% |
| `phases[].status` | 5 ファイル × 13 phase | VC-2/3/8/R5 | 100% |
| `gates[].status` | 3 gate（root）| VC-5/6/7/R2/R3 | 100% |
| markdown checkbox | 10 件 | VC-9 | 100% |
| register 整合 | 2 ファイル | VC-11 | 100% |

## 7.4 カバレッジ閾値の扱い

- 本タスクは `apps/web` の vitest coverage threshold には影響しない（`apps/` 変更ゼロ）。
- docs-only のためカバレッジ指標は「補正対象フィールドの VC 網羅率」で代替し、100% を DoD とする。

## 7.5 CI gate

| gate | 役割 |
|------|------|
| `gate-metadata:validate` | gates[].status / passed_at / evidence_path を CI 検証 |
| `verify:phase12-compliance` | register↔artifacts status consistency を CI 検証 |
| `verify-indexes-up-to-date` | 本タスクは indexes に新規キーワードを生まない見込み（status 値変更のみ）。drift があれば Phase 9 で `indexes:rebuild` を実行 |

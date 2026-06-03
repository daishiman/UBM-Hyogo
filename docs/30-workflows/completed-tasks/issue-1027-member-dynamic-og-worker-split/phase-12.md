# Phase 12: ドキュメント更新

`[実装区分: implementation]`
status: `implemented_local_runtime_pending`

## 目的

本実装サイクル完了時に、Phase 12 の strict 7 成果物を `outputs/phase-12/` に揃え、
正本仕様（aiworkflow-requirements）と index を同期する。

## Phase 12 strict 7 成果物（すべて作成済み）

| # | 成果物 | 役割 |
|---|--------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 統合サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part1（中学生向け）+ Part2（技術詳細） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C + Step 2 判定 |
| 4 | `outputs/phase-12/documentation-changelog.md` | workflow-local + global skill sync |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク 0 件（current）+ baseline + 将来候補 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | FB-I1027-001..003 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 heading compliance evidence |

## 本実装サイクルで追加更新する項目

- `OG_IMAGE_BASE_URL` / OG worker 契約を正本仕様（env アクセス不変条件・API 仕様）へ反映。
- `index.md` / `artifacts.json` / `outputs/artifacts.json` の phase 状態を `implemented_local_*` へ更新。
- `pnpm indexes:rebuild` で topic-map / keywords 再生成。

## 検証

```bash
mise exec -- pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm indexes:rebuild
```

## 完了条件

- strict 7 成果物が存在し、`phase12-task-spec-compliance-check.md` が canonical 9 見出しを含む。
- artifacts parity 一致。
- gate-metadata ERROR 0。

# ドキュメント変更履歴 — issue-1129 単一 tag write batchId 相関キー付与

## Step 1-A: 完了タスク記録

| 項目 | 結果 |
| --- | --- |
| 完了成果物 | 単一 tag write audit payload への request-scoped `batchId` 付与 |
| 実コード変更 | `apps/api/src/routes/admin/members.ts` |
| テスト変更 | `apps/api/src/routes/admin/members.tags.contract.spec.ts`, `apps/api/src/routes/admin/audit.contract.spec.ts` |
| 正本同期 | aiworkflow-requirements の api-endpoints / task workflow / inventory / indexes / changelog |

## Step 1-B: 実装状況

| 項目 | 結果 |
| --- | --- |
| 実装状況 | `implemented_local_evidence_captured` |
| focused Vitest | PASS: 2 files / 31 tests |
| API typecheck | PASS |
| 非変更 | D1 schema / migration / apps/web / endpoint surface |

## Step 1-C: 関連タスク

| Issue | 重複確認結果 |
| --- | --- |
| #1079 | read 側 filter。重複なし |
| #1036 | bulk write payload contract。重複なし |
| #1128 | batchId index optimization。重複なし |

## 変更ファイル一覧

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/routes/admin/members.ts` | 実装 | 単一 assign/unassign audit payload に `batchId` を追加 |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | テスト | payload UUID / noop 非退化を検証 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | テスト | single write batchId の audit filter hit を検証 |
| `docs/30-workflows/completed-tasks/issue-1129-single-write-batchid-correlation/**` | workflow docs | implemented local evidence captured へ同期 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 正本 | single write batchId contract を追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 正本 | issue-1129 row 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1129-single-write-batchid-correlation-artifact-inventory.md` | 正本 | artifact inventory 新規 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `indexes/resource-map.md` | 正本 | lookup 追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260607-issue-1129-single-write-batchid-correlation.md` / `SKILL-changelog.md` | 正本 | changelog 追加 |

## 完了条件

- [x] 実コード・テスト・正本同期の実変更を記録した
- [x] 検証コマンド結果を記録した
- [x] 後続送りは commit / push / PR / Issue mutation のみとした

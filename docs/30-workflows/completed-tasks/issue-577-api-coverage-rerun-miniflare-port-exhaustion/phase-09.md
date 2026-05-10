# Phase 9 — SSOT 反映: Issue #532 完了タスク Phase 11 / 12 への evidence 追記

## 目的

Issue #577 で得られた rerun / triage evidence を、親 Issue #532 のワークフロー Phase 11 / 12 outputs に same-wave sync し、SSOT を一元化する。

## 入力 / 前提

- Phase 11 で得られる `full-coverage-rerun.log` / `triage-summary.md`
- Issue #532 のワークフローディレクトリ path: `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/`

## 想定変更ファイル

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/main.md` | 追記 | rerun evidence の参照と triage 結論を follow-up entry として追記 |
| `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-12/documentation-changelog.md` | 追記 | follow-up changelog entry（日時 / Issue #577 / 決定事項） |
| `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-12/implementation-guide.md` | 追記 | rerun 手順 / triage 採用結果 / 30day-contract への参照 |

## 手順

1. Issue #532 のワークフロー path を `test -d docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers` で再確認する。
2. 既存 Phase 11 / 12 の構造を読み取り、追記スタイル（heading レベル / 参照 anchor）を踏襲する。
3. 本仕様書の canonical evidence path を相対 path で参照する形で追記する（重複 commit を避ける）。
4. 元未タスク `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` へ `consumed_by_current_workflow` trace を追記する。
5. drift gate: aiworkflow-requirements の `quick-reference` / `resource-map` / `task-workflow-active` / `LOGS` に Issue #577 workflow が登録済みであることを確認する。

## 成果物

- `outputs/phase-09/main.md`（追記対象 path 一覧 + diff プレビュー + drift gate 結果）

## 検証コマンド

```bash
test -d docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers
test -f docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/main.md
git diff --stat docs/30-workflows/completed-tasks/
mise exec -- pnpm sync:check 2>&1 | tail -10
rg -n "issue-577-api-coverage-rerun" .claude/skills/aiworkflow-requirements/indexes .claude/skills/aiworkflow-requirements/references/task-workflow-active.md .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
```

## 完了条件（DoD）

- [ ] Issue #532 ワークフロー path が特定されている。
- [ ] Phase 11 / 12 の追記対象ファイル一覧が記録されている。
- [ ] 元未タスクに consumed trace が記録されている。
- [ ] drift gate が green（indexes 再生成不要）。

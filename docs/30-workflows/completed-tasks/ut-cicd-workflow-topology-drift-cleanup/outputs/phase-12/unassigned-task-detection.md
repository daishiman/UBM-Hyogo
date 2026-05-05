# Phase 12 成果物: 未タスク検出 / 派生 impl 起票方針 (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 12 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |

## 派生 impl タスク一覧（7 件）

| # | 派生タスク ID | 優先度 | 起源 drift | 主担当範囲 | 起票先 |
| --- | --- | --- | --- | --- | --- |
| 1 | `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | **HIGH** | DRIFT-03 / DRIFT-10 | `apps/web/wrangler.toml` を Pages 形式 → OpenNext Workers 形式へ cutover するか保留かを ADR で確定 | `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION.md` |
| 2 | `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | **HIGH** | DRIFT-06 | 05a `observability-matrix.md` の workflow 名を実体 5 yaml に同期（`web-cd` / `backend-ci` / `verify-indexes` 反映）| `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC.md` |
| 3 | `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP` | MEDIUM | DRIFT-04(b) | `setup-node` + `pnpm/action-setup` の composite action 化検討 | `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP.md` |
| 4 | `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY` | MEDIUM | DRIFT-04(b) | `typecheck`/`lint`/`coverage` job の reusable workflow 化検討 | `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY.md` |
| 5 | `UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION` | LOW | DRIFT-07 | API `[triggers] crons` の運用棚卸し（3 件中の重複/非重複の検証）| `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION.md` |
| 6 | `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER` | LOW | DRIFT-01 補足 | `verify-indexes.yml` の trigger（PR / push）と `pnpm indexes:rebuild` 失敗時のリカバリ runbook 整備 | `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md` |
| 7 | `UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE` | MEDIUM | Phase 11 / 12 review | `actionlint` / `yamllint` 未導入による workflow 構文検査 N/A を CI gate 化 | `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE.md` |

## 既存タスクへ委譲する差分（2 件）

| # | drift | 委譲先 | 委譲理由 |
| --- | --- | --- | --- |
| 1 | DRIFT-08 (coverage soft→hard) | `task-coverage-soft-to-hard-deadline-reminder-001` | 既存 unassigned-task に同主旨タスクが起票済み |
| 2 | DRIFT-09 (KV binding) | UT-13 (rate limit / KV 系タスク) | KV binding 採用は UT-13 の責務範囲 |

## 命名衝突確認（rg 結果）

```bash
$ ls docs/30-workflows/unassigned-task/ | rg "UT-CICD-DRIFT-IMPL"
# Phase 12 初回起票時は該当 0 件。レビュー改善後は本ファイルの 7 件が同 prefix で存在する。
```

## 起票方針（各派生 task spec の最低必須セクション）

各 `UT-CICD-DRIFT-IMPL-*.md` は以下のセクションを最低限含める:

1. メタ情報（task_id / 親タスク = UT-CICD-DRIFT / 起源 drift / workflow_state = `spec_created` / 優先度）
2. 親タスク背景（UT-CICD-DRIFT で docs-only 範囲に閉じた理由を再掲）
3. 範囲（impl 必要差分の具体記述）
4. 不変条件 reaffirmation（#5 / #6）
5. 受入条件（最低 3 件）
6. 委譲先（既存タスクとの関係）

## 完了条件チェック

- [x] 派生 7 件の優先度 / 起源 drift / 起票先パスを表化
- [x] 既存タスク委譲 2 件を分離記述
- [x] 命名衝突 0 件を確認
- [x] 各起票方針の最低セクションを明示

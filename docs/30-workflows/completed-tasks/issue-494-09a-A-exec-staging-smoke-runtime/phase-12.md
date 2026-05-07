# Phase 12: ドキュメント更新 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: Phase 11 で取得した実測 evidence を、親 spec workflow / 09c blocker / artifacts parity / aiworkflow-requirements skill index / changelog に反映する。複数ファイル更新が repo にコミットされ、後続タスク（09c production deploy）の前提条件を実測結果で更新する波及効果を持つため docs-only ではなく実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task id | UT-09A-A-EXEC-STAGING-SMOKE-001 |
| GitHub Issue | #494 |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 12 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION（Phase 11 で取得した screenshots を参照のみ）|

## 実行タスク

- [ ] Phase 11 runtime evidence の取得状況を Phase 12 strict 7 files に同期する
- [ ] aiworkflow-requirements の current root / evidence root / blocker 状態を更新する
- [ ] 未タスク検出と skill feedback routing を同一 wave で閉じる

## 目的

Phase 11 で取得した 13 evidence を、親 spec `issue-494-09a-A-exec-staging-smoke-runtime/` の 12 系成果物 / 09c blocker / aiworkflow-requirements skill / changelog に反映し、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態から `runtime_evidence_captured` 状態へ昇格させる。

## 中学生レベルの概念説明（Phase 12 必須）

- **runtime status の昇格とは**: 09a-A spec は「設計図はできたが、まだ本番練習サーバー（staging）で動かしていない」状態（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）だった。Phase 11 で実際に動かして証拠を取ったので、設計図に「動作確認済み」のシールを貼り直す作業がここ。
- **artifacts.json parity とは**: タスクごとに「これが成果物の正本リスト」を JSON で持っている。phase ごとの outputs/artifacts.json と root の artifacts.json で同じファイル一覧になっていることを確認する作業。これがズレると「何がコミット済みで何がまだか」がわからなくなる。
- **09c blocker 更新とは**: 「09a-A が staging で動作確認できていない」ことが理由で待っていた次のタスク（09c production deploy）に対し、「待ち事由が解消した」と紙面で伝える作業。これをやらないと 09c が永久に止まる。

## 更新対象ドキュメント一覧

| # | path | 更新内容 | 検証コマンド |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/implementation-guide.md` | runtime status を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から実測結果（`PASS` / `FAIL` 個別）に昇格。Phase 11 で取得した evidence path を該当行へ転記し、`NOT_EXECUTED` 行を全置換 | `grep -c 'PASS_BOUNDARY_SYNCED_RUNTIME_PENDING\|NOT_EXECUTED' docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/implementation-guide.md` が 0 |
| 2 | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/phase12-task-spec-compliance-check.md` | G1-G4 各 gate の compliance 結果を実測値で埋める（合算承認・逆順実行・production 拡張時の追加承認の有無を明示）| `grep 'G[1-4]' docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/phase12-task-spec-compliance-check.md` で 4 行以上 |
| 3 | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/documentation-changelog.md` | 「2026-05-06 (Issue #494): G1-G4 multi-stage approval gate を経て staging runtime evidence 13 件取得。runtime_evidence_captured へ昇格。」を 1 段落追記 | 末尾エントリの日付を grep |
| 4 | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/artifacts.json` | `status: executed` / `evidence` 配列に 13 件の path / hash / size / acquired_at / result を追加 | `jq '.evidence \| length' …/artifacts.json` が 13 / `jq '.status' …` が `"executed"` |
| 5 | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/artifacts.json` | root artifacts.json と同じ evidence 配列に同期（parity 維持）| `diff <(jq -S .evidence root) <(jq -S .evidence outputs)` が空 |
| 6 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 09a-A 行を `runtime_evidence_pending` → `runtime_evidence_captured` に更新。Issue #494 と取得日付を備考列に追記 | `grep '09a-A' …/task-workflow-active.md` で `runtime_evidence_captured` が含まれる |
| 7 | `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md` | blocker セクションを「09a-A 未実測」→「09a-A 完了済（Issue #494 / PR <番号>） / 残課題: <列挙 or なし>」に更新。本タスク Phase 11 evidence へのリンクを追加 | `grep -c '09a-A 未実測' …/task-09c-…001.md` が 0 |
| 8 | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/main.md` | 本タスク側 Phase 12 ログ。更新済 7 ファイルの diff stat / unassigned-task 起票一覧 / skill feedback 反映要否判定結果を記録 | 新規作成 |

> 親 `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` directory が存在しない場合は、親 mirror 更新（親 spec phase-12.md の #4 #5）を本 Phase 完了条件に含めない（既存 `task-09a-canonical-directory-restoration-001.md` を blocking prerequisite として扱う）。

## skill feedback 反映要否判定（aiworkflow-requirements）

`.claude/skills/aiworkflow-requirements/` への反映は次のいずれかに該当する場合のみ実施し、判定結果を `outputs/phase-12/main.md` に 1 行で記録する:

- D1 schema 正本（`docs/00-getting-started-manual/specs/08-free-database.md`）に変更が入った → `references/data-model.md` 系を再生成（`mise exec -- pnpm indexes:rebuild`）
- 新しい approval gate 命名規則・evidence path 命名規則を採用した → `references/task-workflow-active.md` を更新
- staging deploy ランブックに恒常的な手順追加が発生した → `references/runbook.md`（存在する場合）を更新
- 上記いずれにも該当しない場合: `feedback_required: false` を 1 行記録して終了

## unassigned-task 起票判定

| 検出事象 | 起票テンプレ | 起票先 path |
| --- | --- | --- |
| D1 schema parity diffCount > 0 | 「production 側 migration 必要 drift 一覧 / staging vs production 差分 / 期限」 | `docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md` |
| Forms sync 失敗 / quota 枯渇恒常化 | 「失敗 evidence path / 翌日再実行結果 / quota 増枠申請有無」 | `docs/30-workflows/unassigned-task/task-09a-forms-sync-quota-recovery-001.md` |
| wrangler tail 取得不能 | 「token scope 取得手順 / quota 確認手順」 | `docs/30-workflows/unassigned-task/task-09a-wrangler-tail-recovery-001.md` |
| 09c blocker 更新で残った未解消事項 | 「09c 開始前に解決すべき条件 / 関連 evidence path」 | `docs/30-workflows/unassigned-task/task-09c-production-deploy-precondition-XXX.md` |

起票テンプレ最低項目: `# title` / `## 状態` / `## 背景（検出 evidence path）` / `## 完了条件` / `## 関連 task`。

## 検証コマンド

```
git diff --stat docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/ docs/30-workflows/unassigned-task/ .claude/skills/aiworkflow-requirements/

# parity 確認
jq -S '.evidence' docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/artifacts.json > /tmp/root.json
jq -S '.evidence' docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/artifacts.json > /tmp/out.json
diff /tmp/root.json /tmp/out.json

# placeholder 残存チェック
grep -RE 'NOT_EXECUTED|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING' \
  docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/

# lint
mise exec -- pnpm lint
```

## 状態遷移（task-workflow-active.md）

更新行例:

```
| issue-494-09a-A-exec-staging-smoke-runtime | runtime_evidence_captured | 2026-05-06 | Issue #494 / PR <番号> | evidence root: docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/ |
```

## 多角的チェック観点

- 7 ファイルすべての diff が `git diff --stat` で確認できる
- `NOT_EXECUTED` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 文字列が親 spec outputs/ から完全に消えている
- artifacts.json ↔ outputs/artifacts.json の parity が成立
- 09c blocker 文書から「09a-A 未実測」相当の文言が消滅
- 中学生レベル概念説明 3 項目（runtime status 昇格 / artifacts parity / 09c blocker 更新）が含まれている
- skill feedback 反映要否の判定結果が 1 行で記録されている

## サブタスク管理

- [ ] 更新対象 7 ファイル（うち 1 件は本タスク phase-12 main.md 新規作成）に Phase 11 evidence を反映
- [ ] artifacts parity を `diff` で 0 件確認
- [ ] skill feedback 反映要否を判定し記録
- [ ] unassigned-task 起票要否 4 軸を判定
- [ ] 検証コマンド 4 種を実行し全て期待結果

## 成果物

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/main.md`
- 上記更新対象 7 ファイルの diff（親 spec ディレクトリ + unassigned-task + skill index）

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み
- 7 ファイルの更新差分が `git diff --stat` で確認できる
- `NOT_EXECUTED` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` が親 spec outputs/ から消滅
- `artifacts.json` ↔ `outputs/artifacts.json` parity が成立（evidence 配列長 = 13）
- `task-workflow-active.md` の 09a-A 行が `runtime_evidence_captured`

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 中学生レベル概念説明セクションが埋まっている
- [ ] 本 Phase で commit / push / PR を実行していない（Phase 13 で実施）
- [ ] CONST_007 違反（先送り）が発生していない

## 次 Phase への引き渡し

Phase 13 へ:
- 更新済 7 ファイルの一覧と diff stat
- 新規起票した unassigned-task のパス一覧
- skill feedback 反映の有無
- 09c blocker 更新の最終文面（PR 本文に転記）

## 参照資料

- 親 spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-12.md`
- 親 spec `outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- GitHub Issue #494

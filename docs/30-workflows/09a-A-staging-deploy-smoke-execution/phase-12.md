# Phase 12: ドキュメント更新 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 11 で取得した実測 evidence を、正本仕様 / workflow index / artifacts.json / 09c blocker / unassigned-task / skill feedback に反映する。複数ファイルへの更新が repo にコミットされる成果物として残るため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 12 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 で確定した evidence を、関連ドキュメント・正本仕様・親タスク・後続タスクに漏れなく反映し、09c production deploy が「09a-A 完了済」を前提にできる状態を作る。

## 中学生レベルの概念説明（Phase 12 必須）

- **staging 環境とは**: 本番（production）と同じ仕組みで動く「練習用のサーバー」のこと。本番のお客さんには見えない場所で、先に動かして問題がないかを試す。今回の UBM 兵庫支部会では Cloudflare Workers の `ubm-hyogo-{api,web}-staging` と D1 の `ubm-hyogo-db-staging` がそれにあたる。
- **smoke test とは**: 「煙が出ないか（壊れていないか）」を最低限のところだけ素早く確かめるテスト。トップページが開く、ログインできる、管理画面が他人に見えない、Forms とつながっている、といった基本動作だけを 1 周する。本格的な機能テストは別 Phase で済ませてあるので、ここでは「動くか？」だけ見る。
- **なぜ approval gate が必要か**: deploy・D1 の変更・Forms の同期は「実環境にお金や履歴を使う操作」なので、AI が勝手に走ると取り返しがつかない事故になる。だから user に「やっていい？」と確認してから初めて手を動かす。これが G1〜G4 の approval gate。

## 更新対象ドキュメント一覧

| # | path | 更新内容 | 検証コマンド |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md` | `状態` を `implementation-spec / runtime-contract-formalization` に統一し、Phase 11 runtime evidence pending と Phase 12 runtime update pending を分離して記録 | `grep '状態' docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md` |
| 2 | `docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json` | 13 evidence の `path` / `hash` / `size_bytes` / `acquired_at_utc` / `result` を配列で追加。`status` を `executed` に更新 | `jq '.evidence \| length' docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json` が 13 |
| 3 | `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md` | 親 `09a-parallel...` directory が現 worktree に存在しない blocker を参照し、親 mirror 更新を runtime update の blocking 条件にする | `test -f docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md` |
| 4 | 親 `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/main.md` | ディレクトリ復元後のみ、親タスク側の `NOT_EXECUTED` 行を本タスク evidence への相対参照リンクで置換 | `test -d docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation` が true になってから実施 |
| 5 | 親 `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json` | ディレクトリ復元後のみ、親タスク phase-state を runtime evidence result に同期 | `test -d docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation` が true になってから実施 |
| 6 | `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` | blocker 状態を「09a-A 完了済 / 残課題: …」に更新し、本タスク evidence へのリンクを追加 | `grep 'blocker' <09c task md>` |
| 7 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Phase 11 で得たランブック差分（旧 version ID 取得手順 / wrangler tail redact パイプ等）が反映漏れの場合のみ追記 | `git diff docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |
| 8 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 schema parity で drift が検出された場合、staging を正と見なす場合に限り正本側へ追記。drift がない場合は更新なし | `git diff docs/00-getting-started-manual/specs/08-free-database.md` |

> 参照不能ファイル: 本ワークツリーには `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` ディレクトリが存在しない（**ファイルなし**）。そのため親 mirror 更新は本 Phase 12 spec close-out の完了条件に含めず、既存 `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md` を blocking prerequisite として扱う。親ディレクトリ復元前に #4 #5 を PASS 扱いしない。

## skill feedback 反映要否判定基準

`.claude/skills/aiworkflow-requirements/` への反映は次のいずれかに該当する場合のみ実施:

- D1 schema 正本（`08-free-database.md`）に変更が入った → `references/data-model.md` 系を再生成（`pnpm indexes:rebuild`）
- 新しい approval gate 命名規則・evidence path 命名規則を採用した → `references/task-workflow-active.md` を更新
- staging deploy ランブックに恒常的な手順追加が発生した → `references/runbook.md`（存在する場合）を更新

該当しない場合は反映不要。判定結果を `outputs/phase-12/main.md` に 1 行で記録する。

## unassigned-task 起票判定

| 検出事象 | 起票テンプレ | 起票先 path |
| --- | --- | --- |
| D1 schema parity diffCount > 0 | 「production 側に migration を当てる必要がある drift 一覧 / staging vs production 差分 / 期限」 | `docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md` |
| common helper 抽出機会（curl smoke / parity スクリプト共通化） | helper 名 / 配置先 / 利用想定 task | `docs/30-workflows/unassigned-task/task-09a-common-helper-extraction-001.md` |
| 09c blocker 更新で残った未解消事項 | 「09c 開始前に解決すべき条件 / 関連 evidence path」 | `docs/30-workflows/unassigned-task/task-09c-production-deploy-precondition-XXX.md` |
| wrangler tail 取得不能 | 「token scope 取得手順 / quota 確認手順」 | `docs/30-workflows/unassigned-task/task-09a-wrangler-tail-recovery-001.md` |

起票テンプレ最低項目: `# title` / `## 状態` / `## 背景（検出 evidence path）` / `## 完了条件` / `## 関連 task`。

## ドキュメント更新の検証コマンド

```bash
# 差分の総量確認
git diff --stat

# markdown lint（lint script があれば）
mise exec -- pnpm lint

# parent タスク側の placeholder 残存チェック（0 件であること）
test -f docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md
grep -R "NOT_EXECUTED" docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/ | wc -l

# artifacts.json の妥当性
jq '.' docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json
```

## 統合テスト連携

- 上流: Phase 11 で取得した 13 evidence
- 下流: Phase 13 PR / 09c production deploy execution

## 多角的チェック観点

- 親タスク・後続タスク・正本仕様の 3 階層すべてに反映漏れがないこと
- skill feedback / unassigned-task 起票が「先送り」になっていないこと（CONST_007）
- secret / PII を含む文字列を新規ドキュメントに書いていないこと
- 中学生レベル概念説明 3 項目（staging / smoke / approval gate）が必ず含まれていること

## サブタスク管理

- [ ] 更新対象 8 ドキュメントを Phase 11 evidence で書き換え
- [ ] skill feedback 反映要否を判定し記録
- [ ] unassigned-task 起票要否を 4 軸で判定
- [ ] 検証コマンド 4 種を実行し全て期待結果
- [ ] `outputs/phase-12/main.md` を更新

## 成果物

- `outputs/phase-12/main.md`
- 上記更新対象 8 ドキュメントの diff

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 8 ドキュメントの更新差分が `git diff --stat` で確認できる
- `NOT_EXECUTED` が本タスク outputs/ および親タスク outputs/ から消滅
- artifacts.json の `evidence` 配列が 13 要素

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 中学生レベル概念説明セクションが埋まっている
- [ ] 本 Phase で commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ:
- 更新済 8 ドキュメントの一覧と diff
- 新規起票した unassigned-task のパス一覧
- skill feedback 反映の有無

## 実行タスク

- [ ] phase-12 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 参照資料

- docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json

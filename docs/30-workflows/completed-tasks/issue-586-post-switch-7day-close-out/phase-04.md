# Phase 4: 環境準備 / 前提条件確認（着手 Gate と production verify）

## 目的

本タスクの workflow YAML 改修 PR を merge する前に、(1) 親 #549 PR #592 が dev / main にすでに merge 済みであること、(2) GitHub Variables に `CF_AUDIT_CLASSIFIER=ml` を **本タスク Phase 6 ステップ 4 で設定する経路が確保**されていること、(3) production D1 の `0016_cf_audit_log_classification.sql` が apply 済みであることを確認する。Phase 5 以降の実装計画 / 実装手順を着手可能な状態にする。

## 完了条件

- [ ] 親 #549 PR #592 が `dev` / `main` に merge 済みであることを `gh pr view 592 --json mergedAt,baseRefName,mergeCommit` で確認
- [ ] `gh variable list --env production` で `CF_AUDIT_CLASSIFIER` の現状値を確認（実値はマスクして記録）
- [ ] `bash scripts/cf.sh whoami` が production account で 200 を返す
- [ ] `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` で `0016_cf_audit_log_classification.sql` が apply 済みであることを再確認
- [ ] 1Password に `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` が存在し、`op item get`（read-only）で参照できる
- [ ] ローカル環境で Node 24 / pnpm 10 が `mise exec --` 経由で確実に使えることを確認
- [ ] `actions/upload-artifact@v4` / `actions/download-artifact@v4` / `peter-evans/create-pull-request@v6` の最新 stable tag を確認

## 前 Phase 依存

- Phase 1: 4 Gate / 本サイクル scope / 4 観測軸の閾値
- Phase 2: hourly job への step 挿入位置（行番号）/ aggregation 出力 schema 現状
- Phase 3: hourly workflow 改修 / 7day summary workflow / SSOT 4 ファイル / forward-safe rollback

## 4-1. 着手 Gate の evidence 確認手順

| Gate | 必要 evidence | 確認コマンド / 参照先 | NG 時の挙動 |
| --- | --- | --- | --- |
| Gate-PARENT-MERGED | 親 #549 PR #592 merged | `gh pr view 592 --json mergedAt,state` | merge されていない場合は本タスク着手を凍結 |
| Gate-RUNTIME-CLASSIFIER-SET（本タスク後で達成） | production env scope に `CF_AUDIT_CLASSIFIER` が `ml` で設定 | `gh variable list --env production`（実値マスク） | 未設定なら Phase 6 ステップ 4 で設定する（merge 前ではなく workflow YAML PR merge と同じタイミングで） |
| Gate-D1-FORWARD-SAFE | production D1 0016 列 apply 済 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | apply されていなければ本タスク中止（親 #515 まで遡る） |
| Gate-ARTIFACT-PATH-RESOLVED | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 解決可能 | `op item get`（read-only / 値出力禁止） | 解決不能なら 1Password 担当に依頼 |

## 4-2. ローカル開発環境

| 項目 | 確認コマンド | 期待値 |
| --- | --- | --- |
| Node | `mise exec -- node -v` | `v24.15.0` |
| pnpm | `mise exec -- pnpm -v` | `10.33.2` |
| `gh` CLI 認証 | `gh auth status` | login 成功 |
| `op` CLI 認証 | `op whoami` | login 成功 |
| `bash scripts/cf.sh whoami` | 同 | production account `OK` |

## 4-3. GitHub Actions runner 前提

| 項目 | 確認 |
| --- | --- |
| `actions/upload-artifact@v4` | 利用可（v3 は deprecated）|
| `actions/download-artifact@v4` | 利用可 |
| `peter-evans/create-pull-request@v6` | 利用可（base=`dev`、head=`chore/issue-586-7day-evidence-*`）|
| `permissions: pull-requests: write / contents: write` | 7day summary job に必要 |

## 完了条件（再掲）

- [ ] 上記 Gate 4 件 + ローカル 5 項目 + GitHub Actions 前提 4 項目すべて確認済み
- [ ] `outputs/phase-04/main.md` に確認結果を表形式で記録（実値・token・OAuth 値・IP・User-Agent は伏せる）

## 出力

- `outputs/phase-04/main.md`

## 参照資料

- `index.md`
- `phase-01.md`〜`phase-03.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-04.md`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

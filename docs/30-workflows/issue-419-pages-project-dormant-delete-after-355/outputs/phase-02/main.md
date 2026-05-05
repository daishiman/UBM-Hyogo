# Phase 02 Output

state: pending

## 概要

5 レイヤ設計（CLI ラッパー / 観察期間運用 / 削除フロー / evidence schema / aiworkflow-requirements 反映）を確定する。
削除は **revert 不可**のため、観察期間 gate（最低 2 週間）+ user 明示承認 + Workers 前 VERSION_ID 記録（NFR-05 補償）を直列に並べる。

## 設計確定（Phase 02 で決まったこと）

### CLI ラッパー
- `bash scripts/cf.sh pages project list` / `bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects` / `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` を正規経路とする
- pages サブコマンド未実装の場合は Phase 05 で `scripts/cf.sh` に追加実装する

### 観察期間
- 最低 2 週間
- 中間チェック（週次）で Workers 4xx・5xx 推移と Pages dormant 維持を確認

### 削除フロー（直列 6 段階）
1. Preflight (AC-1 / AC-2)
2. Workers 前 VERSION_ID 取得（NFR-05 補償）
3. User Approval (AC-4)
4. Delete (AC-4)
5. Post-deletion smoke (AC-1)
6. Redaction check (AC-5)

### evidence schema
`outputs/phase-11/` 配下に preflight-ac1-ac2.md / dormant-period-log.md / workers-prev-version-id.md / user-approval-record.md / deletion-evidence.md / post-deletion-smoke.md / redaction-check.md を配置

### aiworkflow-requirements
`rg -i "Cloudflare Pages|cloudflare-pages|pages\.dev" .claude/skills/aiworkflow-requirements/references/` でヒットした行を「削除済み（YYYY-MM-DD）」へ書き換える diff 案を Phase 12 で確定

## 残課題

- scripts/cf.sh の pages サブコマンド現状確認（Phase 05）
- aiworkflow-requirements references の Pages 言及候補一覧確定（Phase 05）
- 観察期間中の Workers 4xx・5xx 取得経路の正本確定（Cloudflare ダッシュボード or Logpush）

## 実行記録

- 実行者: -
- 実行日時: -
- 結果: pending

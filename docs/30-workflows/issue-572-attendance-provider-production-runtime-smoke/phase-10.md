# Phase 10: デプロイ前準備（user gate / production 実行 runbook）

[実装区分: 実装仕様書（CONST_004 / CONST_005 準拠）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 / 13 |
| Source | `outputs/phase-10/phase-10.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親 Issue | #572 (CLOSED) |

## 目的

production 環境への read-only GET smoke を 1 回だけ実行するための、user 明示承認 (G1) 取得手順 / production session 値の安全な取得・揮発手順 (`read -s` + `unset`) / wrangler binding diff 確認手順 / production smoke runbook 完成までを確定する。

production 実行は Phase 11 で 1 回だけ走らせる設計のため、本 Phase ですべての前提条件を runbook 化し、Phase 11 では runbook の手順番号通りに実行できる状態を担保する。

## 実行タスク

詳細は `outputs/phase-10/phase-10.md` を正本とする。本 Phase は新規実装ではなく、user-gate 取得文面 / shell オペ手順 / wrangler binding diff コマンド / runbook 章立てを仕様として確定する。

## 統合テスト連携

- Phase 8 リハーサル smoke PASS と Phase 9 gate clean が完了済みであること。
- runbook の手順は staging リハーサル smoke で空回し検証可能であること（production session 値以外の経路を staging で再現）。

## 参照資料

- `outputs/phase-10/phase-10.md`
- `apps/api/wrangler.toml` `[env.production]` / `[env.staging]`（binding 差分確認対象）
- `scripts/cf.sh`（Cloudflare CLI ラッパ — `wrangler` 直接呼び出し禁止）
- 起票元 §「苦戦箇所」 4 項目すべて

## 成果物

- `outputs/phase-10/phase-10.md`
- production smoke runbook（`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` 仕様確定）
- user-gate G1 取得文面テンプレ
- production session 値取得・破棄シーケンス
- wrangler binding diff コマンド

## 完了条件

- user-gate G1 取得文面（user に提示する確認文 + 取得 evidence の保存先）が確定。
- production session 値の取得は `read -s` で stdin から受け取り、利用後に `unset` し、`HISTFILE` / scrollback に値が残らないシーケンスが明記。
- `STAGING_API_URL` / `PRODUCTION_API_URL` 取り違え防止のため、production 実行は **専用 shell session（新規 terminal tab）** で起動する手順が runbook 章として確定。
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run` 等で staging との binding diff を取得する手順が確定。
- production smoke runbook の章構成（前提 / G1 / 値取得 / 実行 / evidence 保存 / 値破棄 / rollback / 後始末）が確定。
- production 実行が CI / hook / cron から起動されない（手動 user gate 経路に閉じる）ことが仕様で明記。

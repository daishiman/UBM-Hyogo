# Skill Feedback Report — issue-917 alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

## テンプレ改善

No change needed. task-specification-creator skill の既存ルール（CONST_009 label-over-reality、CONST_007 1-cycle completion、strict 7 outputs、NON_VISUAL parity、CLOSED issue `Refs #` 扱い）で本 workflow は全てカバー可能。

## ワークフロー改善

Applied **runtime evidence boundary pattern** with local observability hardening: 上流 workflow で「local implementation complete」までを実装し、本サイクルで runtime evidence を観測可能にする最小ログを追加し、user-gated runtime portion は後続化する型を再確認した。

- 上流: issue-857（local implementation 完了 / `implemented_local_evidence_captured`）
- 本サイクル: issue-917（runtime evidence 取得手順 + responseStatus logging / `implemented_local_evidence_captured`）
- 後続: runtime evidence 取得サイクル（user-gated）

この 3 段分離により、「local evidence captured」と「runtime verified」が別ゲートで明示され、PR merge 後の追跡漏れを防げる（元 unassigned-task spec §6.4 教訓）。

## ドキュメント改善

aiworkflow-requirements `lessons-learned/lessons-learned-issue-917-alert-relay-runtime-fire-evidence-2026-05.md` に L-I917RUNTIME-001..004 として以下を同一サイクルで記録済み:

| ID | 教訓 |
| --- | --- |
| L-I917RUNTIME-001 | `wrangler.toml` `[vars]` named env 非継承の罠は config guard test だけでなく runtime tail の no-op reason 消失でも実機証明する。「型は通る・test は通る・runtime だけ沈黙」の最悪 failure mode は runtime evidence でしか検出できない |
| L-I917RUNTIME-002 | issue 原文の secret 投入手順が受信契約と食い違う場合、受信契約を正本に再解釈する。送信側 fallback で整合させ別 secret 投入を避けることで auth surface を縮小する（issue-857 で実装・本サイクルで継承） |
| L-I917RUNTIME-003 | 「送信トリガー経路」（cron→relay）と「受信 endpoint smoke」（curl→relay）は別ファイル別タスクで保管する。混同すると「受信 smoke 済みだから送信も OK」と誤判定する |
| L-I917RUNTIME-004 | runtime evidence は user-gated で deploy ポリシーに律速される。「local evidence captured」と「runtime verified」を別ゲート（本ケースでは別 workflow）として分離し、上流 implementation-guide 側に pending 行を残して二重追跡することで PR merge 後の追跡漏れを防ぐ |

テンプレ自体の変更は不要。知見は将来の cron → internal subrequest 系 runtime evidence タスクのため aiworkflow-requirements skill に保存済み。

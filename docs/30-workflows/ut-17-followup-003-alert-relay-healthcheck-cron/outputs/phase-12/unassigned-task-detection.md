# UT-17-followup-003 Unassigned Task Detection

[実装区分: 実装仕様書]

## Result

本サイクルで**新規に検出された unassigned task は無い**。

## Rationale

本タスク (Issue #635) は、親 workflow `ut-17-cloudflare-analytics-alerts` の Phase 12 で
既に identified 済みの followup である。実装過程で以下を確認したが、いずれも
既存スコープ内の作業であり、新規 unassigned task 化を必要としない:

| 検出項目 | 既存スコープ内処理 |
| --- | --- |
| Workers free plan の cron 3 本上限 | 既存 daily cron 相乗り + Monday gate で本タスクスコープ内に解決 |
| Slack revoke 後の HTTP 200 + `"no_service"` パターン | 親 UT-17 の知見セクション (6.1) で既に既知。本タスクで `status + body` 両面検証を導入 |
| MailChannels の SPF/DKIM 課題 | 親 UT-17 の知見セクション (6.5) で既知。Resend 採用で回避 |
| Channel 分離（noise vs alert 本番） | `SLACK_WEBHOOK_URL_HEALTHCHECK` を optional binding として設計、運用者が後から選択可能 |

## 親 UT-17 / 兄弟 followup との独立性確認

| followup | 領域 | 本タスクとの独立性 |
| --- | --- | --- |
| ut-17-followup-001 | （別軸の親 workflow followup） | コード変更領域 / env binding / 設定値が重複しない。並走可能 |
| ut-17-followup-002 | （別軸の親 workflow followup） | 同上 |
| ut-17-followup-004 | （別軸の親 workflow followup） | 同上 |

各 followup は同じ親 workflow 内で issued されているが、**コード変更領域・env binding・cron schedule
のいずれも本タスクと衝突しない**。並走実装または順次実装どちらも可。

## Issue #635 の扱い

| 項目 | 内容 |
| --- | --- |
| Issue 状態 | 仕様書追記により **closed のままで OK**（仕様 + 実装 + 同期 + PR が完了したらクローズ理由を更新） |
| 仕様書反映 | 本ファイル + `phase-11.md` / `phase-12.md` / `phase-13.md` + Phase 12 strict 7 outputs + artifacts で完結 |
| 完了状態の遷移 | `spec_created` → `implementation_completed_external_ops_pending`（本 Phase 12 完了時点）→ `completed`（Phase 13 PR マージ + external ops 完了後） |

## unassigned-task ファイル移動手順

本タスクの external ops（staging deploy / production deploy / cron 実発火確認）完了かつ Phase 13 PR マージ後:

```bash
# unassigned-task → completed-tasks への移動
mkdir -p docs/30-workflows/completed-tasks/
git mv docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md \
       docs/30-workflows/completed-tasks/

# workflow ディレクトリ自体は docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/ に残置
# （親 UT-17 と同様、completed-tasks への workflow ディレクトリ移動は親 workflow と整合する形で post-merge アクション内で実施）
```

post-merge アクションは Phase 13 `13-4 post-merge アクション` セクションで定義する。

## 次サイクル検討事項（unassigned 化判断保留）

以下は本タスクスコープ外だが、将来「unassigned-task 化が必要か」を再判定する。
**現サイクルでは unassigned-task を作成しない**。

| 項目 | 判断時期 | 判断基準 |
| --- | --- | --- |
| 検知ラグ短縮（週次 → 日次） | 連続 2 回以上 silent failure が発生したとき | 月次 runbook 連続失敗ログを確認、運用ノイズと検知速度のトレードオフを評価 |
| Slack channel 分離 | healthcheck 投稿が本番 alert を埋もれさせ始めたとき | 月次 runbook 担当者の主観で判定。専用 channel + `SLACK_WEBHOOK_URL_HEALTHCHECK` 切替を unassigned task として起票 |
| Resend → 自社ドメイン化 | Resend の無料枠不足 or 送信元ドメインへの統一要求が出たとき | Cloudflare Email Routing or SES への移行可否を評価 |
| `apps/web` への scheduled handler 追加 | web 側で cron が必要になったとき | Workers 個別の cron 3 本上限を再確認 |

## 完了確認

- [x] 本ファイルに新規 unassigned task が無いことを記録
- [x] 親 UT-17 / 兄弟 followup との独立性を確認
- [x] Issue #635 を closed のまま保持する方針を記録
- [x] unassigned-task → completed-tasks 移動手順を記録
- [x] 次サイクル検討事項 4 件を unassigned 化保留として記録

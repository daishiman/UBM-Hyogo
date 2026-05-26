---
phase: 3
title: Task Breakdown
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 3: Task Breakdown — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: step 単位は local observability 実装（responseStatus logging）/ 仕様書作成 / evidence MD 作成 / 逆参照追記 / user-gated runtime 観測の組み合わせ。

## 1. SRP step 分解

| step | 責務（単一） | 対象 | 種別 | 依存 |
| --- | --- | --- | --- | --- |
| step-01 | `CF_WEBHOOK_AUTH_SECRET` の staging / production Secret name presence 確認（値非表示） | Cloudflare Secrets（runtime / user-gated） | 観測 | なし |
| step-02 | staging 配線反映前 tail で `alert_relay_skipped` / `missing API_INTERNAL_BASE_URL or token` の有無を可能な範囲で記録（無ければ「配線後のみ観測」と明記） | Workers tail（runtime / user-gated） | 観測 | step-01 |
| step-03 | staging 再 deploy → deploy 後 tail で no-op reason 消失を確認 | `bash scripts/cf.sh deploy` + tail（runtime / user-gated） | mutation + 観測 | step-02 |
| step-04 | 親 UT-25-DERIV-02 Phase 11 controlled invalidation 手順により Sheets API 401/403 状態を模す | runtime（user-gated） | mutation | step-03 |
| step-05 | dry-run 実行中の tail で `postAlertRelay()` → `/internal/alert-relay` への POST 到達ステータス（200 / 401）を記録 | Workers tail（runtime / user-gated） | 観測 | step-04 |
| step-06 | （任意）通知先設定済みなら Slack / mail 着信を記録。未設定なら到達ステータスまでを evidence 範囲とする | runtime（user-gated） | 観測 | step-05 |
| step-07 | runtime evidence MD 作成: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` | docs | 新規 | step-01..06 |
| step-08 | issue-857 `outputs/phase-12/implementation-guide.md` の「actual alert receipt」行を `verified` または取得済み MD への相対リンクへ更新 | docs | 編集 | step-07 |
| step-09 | 親 UT-25-DERIV-02 close-out チェックから本 evidence MD への逆参照を追加 | docs | 編集 | step-07 |
| step-10 | 元 unassigned-task spec `UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` の consumed 化（runtime 完了サイクルでのみ実施・本サイクルでは skip） | docs（後続サイクル） | 編集 | step-07..09 |

## 2. 実行順序

```
step-01 ──▶ step-02 ──▶ step-03 ──▶ step-04 ──▶ step-05 ──▶ step-06(任意)
                                                                  │
                                                                  ▼
                                                              step-07 (evidence MD)
                                                                  │
                                                  ┌───────────────┴───────────────┐
                                                  ▼                               ▼
                                              step-08 (issue-857 更新)        step-09 (親 逆参照)
                                                                  │
                                                                  ▼
                                                              step-10 (後続サイクル)
```

step-01〜06 は user-gated runtime のため、Claude Code は仕様書側で雛形・コマンド・期待出力を提示するに留め、実行はユーザーが行う。step-07〜09 は runtime evidence が揃った後の docs work。step-10 は本サイクルでは実施せず、runtime 完了サイクルで実施する。

## 3. 単一責務の境界

- **観測**（step-01/02/03/05/06）と **mutation**（step-03 deploy / step-04 invalidation）と **docs**（step-07/08/09）を混在させない。
- evidence MD（step-07）は 1 ファイルに集約。staging と production は同 MD 内で env 別セクションに分け、不在分は「未実施」と明記する。
- 受信側 smoke（`ut-17-followup-001`）と本タスク（送信トリガー経路）は別ファイルで保管し、相互リンクで重複検証を避ける（元 spec セクション 6.3 教訓）。

## 4. 想定変更ファイル俯瞰

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/**` | 新規 | 本サイクルの仕様書一式（Phase 1-13 + outputs/phase-{11,12}） |
| `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` | 新規 | runtime evidence MD（step-07・後続サイクルで作成） |
| `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` | 編集 | 「actual alert receipt」行更新（step-08・後続サイクル） |
| `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` | 編集 | close-out チェックへの逆参照（step-09・後続サイクル） |

本サイクルで実際に作成・変更されるのは 1 段目（本仕様書ディレクトリ）のみ。2〜4 段目は runtime evidence 取得後の後続サイクルでの変更対象。

## 5. user-gated 境界

| 境界 | 内容 |
| --- | --- |
| spec 作成（本サイクル） | Claude Code が完遂可能（commit は user-gated） |
| Secret list / deploy / tail / invalidation | すべて user-gated。実行コマンドは仕様書本文に提示するが、Claude Code は実行しない |
| evidence MD 作成 / 逆参照更新 | runtime evidence が揃った後の後続サイクルで実施。本サイクルは雛形と差分箇所の明示まで |
| commit / push / PR | user-gated（Phase 13 で雛形のみ提示） |

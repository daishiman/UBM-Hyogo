# Phase 9 成果物: staging 受入結果 / AC 突合

[実装区分: 実装仕様書]

UT-17 followup-003 cron 週次自動ヘルスチェックの staging 受入結果と Acceptance Criteria 突合の SSOT。
本ファイルは Phase 9 完了の唯一の根拠 evidence。

---

## 1. Acceptance Criteria

| AC ID | 内容 | 観点 |
| --- | --- | --- |
| AC-1 | 月次手動 runbook 依存の解消 | 週次 cron が定常監視責務を担い、月次 runbook は四半期 deep-dive に降格 |
| AC-2 | 週次自動発火 | Cron Trigger `0 18 * * *` + Monday gate 条件成立時のみ発火 |
| AC-3 | Slack OK 通知到達 | Slack 投稿戻り値検証が `status === 200 && body.trim() === "ok"` の両面で成功 |
| AC-4 | 異常系メールフォールバック | Slack 失敗時に `HEALTHCHECK_FALLBACK_EMAIL` 宛にメール着信 |
| AC-5 | payload 識別可能性 | Slack 投稿に `UT-17 weekly healthcheck` / `severity: info` / healthcheck マーカーが含まれる |
| AC-6 | secrets / URL がログに出力されない | `bash scripts/cf.sh tail` で webhook URL / Resend API key が出力されない |

---

## 2. staging 環境情報

| 項目 | 値 |
| --- | --- |
| Worker 名 | `ubm-hyogo-api-staging` |
| cron schedule | `0 18 * * *`（既存と相乗り）+ scheduled handler 内 Monday gate |
| 実施日 | _Phase 9 実施時に記入_ YYYY-MM-DD |
| 実施担当 | _Phase 9 実施者_ |
| ブランチ | _feat/ut-17-followup-003-..._ |
| commit hash | _実施時の HEAD SHA_ |
| Slack channel | `#ubm-alerts-healthcheck-staging` |
| メール宛先 | `op://Personal/cloudflare-alert-relay/HEALTHCHECK_FALLBACK_EMAIL`（値は記録しない） |

---

## 3. 実施 Step 結果

### Step 1: staging deploy

| サブ手順 | コマンド | 結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | _PASS / FAIL_ |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | _PASS / FAIL_ |
| test (scheduled) | `mise exec -- pnpm --filter @ubm-hyogo/api test -- scheduled` | _PASS / FAIL_ |
| secret put × 3 | `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK / HEALTHCHECK_FALLBACK_EMAIL / RESEND_API_KEY --env staging` | _成功 / 失敗_ |
| secret list 確認 | `bash scripts/cf.sh secret list --env staging` | _5 件以上 / 件数_ |
| deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | _成功 / 失敗_ |
| cron 表示 | deploy 出力ログ | _`0 18 * * *` 表示確認_ |

### Step 2: scheduled trigger 手動発火（正常系）

| 確認項目 | 期待 | 実測 |
| --- | --- | --- |
| Slack 着信件数 | 1 件 | _N_ |
| header 文字列 | `UT-17 weekly healthcheck` を含む | _含む / 含まない_ |
| severity マーカー | `severity: info` 相当 | _含む / 含まない_ |
| healthcheck マーカー | `data.healthcheck: true` 相当 suffix | _含む / 含まない_ |
| tail log: slackStatus | 200 | _N_ |
| tail log: slackBodyOk | true | _true / false_ |
| tail log: fallbackSent | false | _true / false_ |

### Step 3: Monday gate 検証

| シナリオ | 期待 | 実測 |
| --- | --- | --- |
| Monday に send | `Monday gate: pass` 後 Slack 着信 | _PASS / FAIL_ |
| 非 Monday に send | `Monday gate: skip` で早期 return / Slack 着信なし | _PASS / FAIL_ |

### Step 4: 異常系（Slack URL 不正値）

| 確認項目 | 期待 | 実測 |
| --- | --- | --- |
| Slack 着信 | 0 件 | _N_ |
| メール着信 | 1 件 | _N_ |
| メール件名 | `UT-17 healthcheck failed at <ISO>` | _一致 / 不一致_ |
| reason 値 | `slack_status_404` / `slack_status_502` / `slack_body_not_ok` のいずれか | _実測値_ |
| tail log: slackStatus | 200 以外 | _N_ |
| tail log: fallbackSent | true | _true / false_ |
| 復旧後の Slack 着信 | 1 件 | _N_ |
| 復旧後のメール着信 | 0 件 | _N_ |

### Step 5: secrets ログ非流出

| grep 対象 | 期待 | 実測 |
| --- | --- | --- |
| `hooks\.slack\.com/services/[A-Z0-9]+/...` | hit 0 | _N hits_ |
| `re_[A-Za-z0-9]{20,}` (Resend API key prefix) | hit 0 | _N hits_ |
| `HEALTHCHECK_FALLBACK_EMAIL` のメアド値 | hit 0 | _N hits_ |

---

## 4. AC 突合表

| AC ID | 検証 Step | 期待 | 実測サマリ | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 8 runbook §0 反映 + staging で 1 週 cron OK 継続 | runbook 反映 + Slack OK 投稿 1 件以上 | _実測_ | [ ] |
| AC-2 | Step 3 | Monday/non-Monday の挙動差が tail に出る | _実測_ | [ ] |
| AC-3 | Step 2 | Slack 1 件着信 + verifySlackResponse=true | _実測_ | [ ] |
| AC-4 | Step 4 | メール 1 件着信 + reason が human-readable | _実測_ | [ ] |
| AC-5 | Step 2 | Slack 投稿に 3 マーカー全て含む | _実測_ | [ ] |
| AC-6 | Step 5 | tail.log に secrets 流出なし | _実測_ | [ ] |

---

## 5. ロールバック条件

| 段階 | 条件 | 退避 |
| --- | --- | --- |
| 1 | メールフォールバック 1 回着信 | runbook §0 即時実施 + 1Password / Cloudflare Secrets 同期 |
| 2 | メールフォールバック 2 週連続 | `HEALTHCHECK_DISABLED=1` を Cloudflare Secrets に投入 + scheduled handler 冒頭で gate |
| 3 | scheduled handler が throw 連発 | `wrangler.toml` `[triggers]` から `crons` を一時除去 → 再 deploy |
| 4 | 復旧 | `HEALTHCHECK_DISABLED` 削除 + `crons` 復元 + 再 deploy |

---

## 6. DoD（Phase 9 確定）

- [ ] AC-1〜AC-6 が全て PASS
- [ ] Step 4 の不正値差し替え後、復旧が完了し Slack 着信再開を確認
- [ ] `outputs/phase-09/tail.log` が保存（secrets を含まない）
- [ ] ロールバック手順が運用者が実行できる粒度で記述
- [ ] AC 突合表に実測値が転記

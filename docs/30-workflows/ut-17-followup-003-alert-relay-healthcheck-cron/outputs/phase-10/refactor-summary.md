# Phase 10 成果物: 後付けリファクタサマリ

[実装区分: 実装仕様書]

UT-17 followup-003 cron 週次自動ヘルスチェックの最小スコープリファクタ結果。
本ファイルは Phase 10 完了の唯一の根拠 evidence。

---

## 1. リファクタ判定（10-1 マトリクス再掲 + 実測）

| 観点 | 判定基準 | 実測（Phase 9 完了時点） | 対応 |
| --- | --- | --- | --- |
| handler 本体行数 | 80 行超 | _Phase 10 実施時に `wc -l` 実測値を記入_ | 必要に応じ抽出 |
| cyclomatic complexity | 8 超 | _eslint complexity rule で実測_ | 同上 |
| `verifySlackResponse` 重複呼出 | 2 箇所以上 | _実測_ | 1 関数に集約 |
| `slack-sender.ts` body 検証ロジック | 存在しない | **存在しない（確認済み）** | healthcheck 側に閉じる |
| `sendFallbackMail` Resend 呼出 | 同関数 inline | _実測_ | private helper 化 |

---

## 2. before / after サマリ

| 指標 | before（Phase 9 完了時点） | after（Phase 10 完了時点） | 差分 |
| --- | --- | --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` 行数 | _N_ | _M_ | _M - N_ |
| `runAlertRelayHealthcheck` 本体行数 | _N_ | _M_ | _≤ 80_ |
| private helper 数 | _N_ | 4（`verifySlackResponse` / `buildHealthcheckMessage` / `sendFallbackMail` / `chooseWebhookUrl`） | +k |
| `apps/api/src/lib/slack-sender.ts` 行数 | 74 | 74 | **0**（無変更） |
| vitest 件数 | _N_ | _M_ | `runAlertRelayHealthcheck` 経由の境界 case を追加した分のみ増加 |

---

## 3. 抽出した private helper 一覧

| 関数 | 抽出先 | 役割 | テスト |
| --- | --- | --- | --- |
| `verifySlackResponse(status, bodyText): boolean` | `healthcheck.ts` 内 module-local | status === 200 && bodyText.trim() === "ok" の両面検証 | `runAlertRelayHealthcheck` 経由で fetch mock により境界ケース網羅 |
| `buildHealthcheckMessage(): SlackBlockKitMessage` | 同上 | 固定 healthcheck payload 生成（`name: "UT-17 weekly healthcheck"` / `severity: "info"` / `data.healthcheck: true`） | snapshot test（Phase 9 tail.log と一致） |
| `sendFallbackMail(env, reason): Promise<void>` | 同上 | Resend `POST /emails` を 1 回。env 未設定時 no-op。throw を握り潰し handler に re-raise しない | `runAlertRelayHealthcheck` で SLACK 不正値 fixture → Resend fetch が呼ばれることを mock で検証 |
| `chooseWebhookUrl(env): string` | 同上 | `env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL` のフォールバックを 1 箇所に閉じる | unit で 2 ケース（healthcheck set / unset） |

---

## 4. 不採用候補と根拠

| 候補 | 不採用根拠 |
| --- | --- |
| `apps/api/src/lib/slack-response-verifier.ts` への切り出し | 本タスク以外の caller が存在しない。再利用候補が現れた時点で別 followup 起票（YAGNI） |
| `sendSlackMessage` (`slack-sender.ts`) に optional `verifyBody` callback 追加 | 本番 alert-relay 経路シグネチャに影響し、UT-17 本体のテストを巻き込むためスコープ外 |
| healthcheck から `sendSlackMessage` を呼んで OK 後に追加 body fetch | Slack に 2 回 POST する事故になるため不可 |
| `apps/api/src/lib/mail-sender.ts` への切り出し（Resend 用） | 同上 YAGNI。Resend caller は本タスクのみ |

---

## 5. リグレッション防止チェック結果

| チェック | コマンド | 結果 |
| --- | --- | --- |
| `slack-sender.ts` 無変更 | `git diff dev -- apps/api/src/lib/slack-sender.ts` | _empty / non-empty_ |
| Monday gate ロジック保持 | `git diff dev -- apps/api/src/index.ts` の scheduled handler 部 | _gate 行が残存_ |
| Slack 投稿 snapshot 一致 | Phase 9 tail.log の Slack 本文 vs `buildHealthcheckMessage()` JSON | _一致 / 不一致_ |
| vitest 全 PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test` | _PASS / FAIL_ |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | _PASS / FAIL_ |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | _PASS / FAIL_ |

---

## 6. 将来の followup 候補（本タスクスコープ外）

- **fup-A**: `verifySlackResponse` を本番 alert-relay 経路にも適用し、Slack revoke を本番経路でも検知。`apps/api/src/lib/slack-response-verifier.ts` として切り出し
- **fup-B**: Resend 以外のメール送信経路（MailChannels / SES）の差し替え可能性確保。`MailSender` interface 化
- **fup-C**: cron schedule の Monday gate を `wrangler.toml` 側で `0 18 * * 1` に置き換え、handler 内 gate を削除（cron 仕様の変更による検証コストとの天秤）

> いずれも本タスクの範疇外。需要発生時に新規 unassigned-task として起票する。

---

## 7. DoD（Phase 10 確定）

- [ ] 2. before/after 表に実測値が転記
- [ ] 3. 抽出 helper 一覧が確定
- [ ] 4. 不採用候補の根拠が明記
- [ ] 5. リグレッション防止チェック全 PASS
- [ ] `slack-sender.ts` の diff が empty
- [ ] vitest / typecheck / lint 全 PASS

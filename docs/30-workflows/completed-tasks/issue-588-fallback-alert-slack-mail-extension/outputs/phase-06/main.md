# Phase 6 Output — 異常系

仕様書: `../../phase-06.md`

## 異常系のハンドリング

| シナリオ | 振る舞い | 検証 |
| --- | --- | --- |
| Slack webhook 5xx | `defaultSlackDispatcher` が `Slack webhook <status>` を throw、`evaluateAndAlert` が catch し `slackDelivered=false` / `slackError` を返す。Mail / Issue は継続。 | TC-12 / TC-18 |
| Mail webhook 5xx | `defaultMailDispatcher` が throw、`evaluateAndAlert` が catch し `mailDelivered=false` / `mailError`。Slack / Issue は継続。 | unit test 内 mock |
| Slack URL 未設定 | dispatcher 未呼出（`undefined`）。Mail / Issue は通常通り。 | TC-19 |
| Mail env 未設定（webhook / from / to のいずれか欠落） | dispatcher 未呼出（no-op skip）。Slack / Issue は通常通り。 | TC-19 |
| repo / token 未設定 + trigger + 非 dry-run | `evaluateAndAlert` が早期 throw（`repo and token are required`）。 | TC-21 |
| dry-run 時 | HTTP 0 回（fetch mock 未呼出）。stdout に payload 出力のみ。 | TC-14 / TC-17 |
| redaction 漏れ防止 | 全 payload は `buildNotificationPayload` 経由でしか作らず、関数内で必ず `redactForNotification` を通す。 | TC-09 / TC-10 |

best-effort failure isolation 設計により、Slack 障害でも mail / Issue は影響を受けない。Issue 起票のみが必須経路であり、これが失敗した場合は throw 伝播で workflow を fail させる。

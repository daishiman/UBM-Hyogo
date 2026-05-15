# Phase 4: タスク分解（実装サブタスク化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | pending |
| GitHub Issue | #635 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本タスクは `apps/api` Cloudflare Workers の `scheduled` handler に週次 healthcheck 経路を新規追加する。`apps/api/src/scheduled/healthcheck.ts` 新規モジュール、`apps/api/src/env.ts` の Env interface 拡張、`apps/api/src/index.ts` の cron 分岐追加、vitest 新規 3 ケースを **実コードとして実装する**ため。 |

---

## 目的

UT-17 本体で実装した Cloudflare Notifications → alert-relay → Slack の通知経路に対して、
週次自動ヘルスチェック（Cron Triggers）を追加する。
Phase 3 設計レビューの GO 判定（既存 `0 18 * * *` daily cron 相乗り + Monday gate）を入力として、
全実装作業を **単一責務原則（SRP）** に沿った T1〜T9 のサブタスクに分解し、
各サブタスクの依存・所要時間・DoD を Phase 5 へ引き渡せる形で固定する。

UT-17 本体および兄弟 followup (001/002) との責務境界:

| タスク | 責務 |
| --- | --- |
| UT-17 本体 | Cloudflare native usage alerts + Slack 日本語化リレー Worker |
| UT-17-followup-001 / 002 | 同 workflow 内の他改善（本タスク範囲外） |
| **UT-17-followup-003（本タスク）** | **週次 cron による alert-relay → Slack 経路の死活監視 + メールフォールバック** |
| UT-08-IMPL | WAE custom alerts / SLO 監視（本タスク範囲外） |

---

## 実行タスク

- [ ] Phase 02/03 成果物（cron schedule・payload 仕様・Slack 戻り値判定・メールフォールバック方針）が GO であることを確認する
- [ ] T1〜T9 のサブタスクテーブルを `outputs/phase-04/task-breakdown.md` に固定する
- [ ] 各サブタスクの「変更ファイル候補」「上流依存」「所要時間目安」「DoD」を埋める
- [ ] サブタスク実行順序（クリティカルパス）を `outputs/phase-04/critical-path.md` に図示する
- [ ] T6（staging 動作確認）が T7（runbook 更新）より前段に配置されていることを確認する
- [ ] 既存 daily cron (`0 18 * * *`) への相乗り設計が cron 本数（無料枠 3 本上限）を増やさないことを確認する
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## サブタスク分解（T1〜T9）

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | env schema 拡張（zod） | 新規 env 2 種を optional として宣言 | 編集 `apps/api/src/env.ts` | Phase 03 GO | 0.5h | `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` が schema に追加され、`pnpm --filter @ubm/api typecheck` PASS |
| T2 | Secret / Var 投入 | 1Password 登録 + Cloudflare Secrets 投入 | `bash scripts/cf.sh secret put` × 2 環境 × 2-3 secret | T1 完了 | 0.5h | staging / production 両環境で `cf.sh secret list` に `SLACK_WEBHOOK_URL_HEALTHCHECK` / `RESEND_API_KEY`（あるいは `MAIL_PROVIDER_KEY` 流用）/ `HEALTHCHECK_FALLBACK_EMAIL`（Var 可）が表示される |
| T3 | `runAlertRelayHealthcheck` 関数実装 | cron 発火時の healthcheck 主処理（payload 構築 + alert-relay 内部呼び出し + Slack 戻り値判定 + 失敗時 mail fallback） | 新規 `apps/api/src/scheduled/healthcheck.ts` | T1 完了 | 1.5h | `runAlertRelayHealthcheck(env, ctx)` が export され、Slack 200/`"ok"` 成功・Slack 失敗→Resend 成功・Slack 失敗→Resend 失敗の 3 分岐を実装、`pnpm typecheck` PASS |
| T4 | scheduled handler 分岐追加 | 既存 `0 18 * * *` 分岐内で `dayOfWeek === 1`(Monday, UTC) ガード後に `runAlertRelayHealthcheck` を `ctx.waitUntil` で起動 | 編集 `apps/api/src/index.ts` | T3 完了 | 0.5h | 既存 schema sync / retention purge と並列実行、Monday 以外は no-op、`pnpm typecheck` / `pnpm lint` PASS |
| T5 | vitest 新規 3 ケース | Slack OK / Slack fail-mail OK / Slack fail-mail fail の振る舞いを fetch mock で検証 | 新規 `apps/api/src/scheduled/__tests__/healthcheck.test.ts` | T3 完了 | 1.0h | `mise exec -- pnpm --filter @ubm/api test scheduled/healthcheck` で 3 ケース全 PASS、line coverage ≥ 80% |
| T6 | staging 動作確認 | staging deploy + `wrangler --test-scheduled` 風の Dashboard manual trigger + 失敗系 Slack URL 不正化検証 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | T5 完了 | 1.0h | staging healthcheck channel に「UT-17 weekly healthcheck OK」が到達し、Slack URL 不正値時に `HEALTHCHECK_FALLBACK_EMAIL` 宛てに Resend 経由のメールが到達する |
| T7 | wrangler.toml コメント追記（任意） | cron 本数は既存 3 本流用・Monday gate は code 側、を明示するコメント追加 | 編集 `apps/api/wrangler.toml`（コメント追加のみ。`[triggers]` は変更しない） | T6 完了 | 0.25h | `0 18 * * *` 行直上に「daily branch: schema sync / retention purge / weekly healthcheck(Mon)」のコメントが入っている |
| T8 | 月次 runbook 更新 | cron 自動化との役割分担追記・連続 N 回失敗閾値定義 | 編集 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T6 完了 | 0.5h | 冒頭に「定常監視は cron が担当、本 runbook は四半期 deep-dive + cron 連続失敗時の調査用」が追記され、連続 2 回失敗で月次 runbook を即時起動する閾値が記載されている |
| T9 | production デプロイ + Notification 経路確認 | production 環境への deploy + 翌週月曜の本番発火確認 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | T8 完了 | 0.5h | production 投入後、翌月曜 03:00 JST に production healthcheck channel に通知到達、または Cloudflare Dashboard の `Trigger Now` で同等確認 |

> **注記**: T1〜T9 は順序依存があり、T5 の vitest 完了前に T6 staging deploy を行わない。T8 runbook 更新は T6 staging 確認後・T9 production 前に実施する。

---

## クリティカルパス

```
T1 → T2 → T3 → T4
              ↓
              T5 → T6 → T7 → T8 → T9
```

| 区間 | 累積時間 | 備考 |
| --- | --- | --- |
| T1〜T2（前提整備） | 1.0h | env schema + Secret 投入 |
| T3〜T5（実装 + テスト） | 3.0h | コア実装 |
| T6〜T7（staging + wrangler 注記） | 1.25h | staging 検証 |
| T8〜T9（runbook + production） | 1.0h | 本番反映 |
| **合計** | **6.25h** | 半〜1 営業日想定 |

---

## 不変条件チェック（CONST_005 準拠）

- [ ] D1 直接アクセスは `apps/api` に閉じる（本タスクは D1 アクセスなし、`apps/web` 変更なし）
- [ ] Secret は 1Password → Cloudflare Secrets。`.env` には `op://` 参照のみ
- [ ] Cloudflare CLI は `bash scripts/cf.sh` 経由のみ（`wrangler` 直接実行禁止）
- [ ] cron 本数は無料枠 3 本上限を超えない（既存 `0 18 * * *` 相乗り）
- [ ] UT-08-IMPL（WAE custom alerts）と責務重複させない（本タスクは alert-relay 経路の死活監視のみ）
- [ ] CONST_007: 全 T1〜T9 を本サイクル内で完了させる（持ち越し禁止）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 本体（alert-relay Worker） | `runAlertRelayHealthcheck` から alert-relay 処理関数を内部 import して呼び出す | 関数 import を Phase 5 で固定 |
| UT-17-followup-001 / 002 | 同 workflow 兄弟 | 本タスクは独立 PR で完結 |
| UT-08-IMPL | WAE custom alerts | 独立。経路を共有しない |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md | 原典 |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-02.md | 設計仕様 |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-03.md | 設計レビュー GO 判定 |
| 必須 | apps/api/src/index.ts | scheduled handler 既存実装 |
| 必須 | apps/api/wrangler.toml | 既存 cron 設定 |
| 必須 | apps/api/src/lib/slack-sender.ts | Slack 投稿実装（戻り値判定） |
| 必須 | apps/api/src/middleware/verify-cf-webhook-auth.ts | 内部呼び出し時の auth header |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers 公式 |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Incoming Webhook（body=="ok" 規約） |
| 参考 | https://resend.com/docs/api-reference/emails/send-email | Resend send API |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | T1〜T9 サブタスクテーブル |
| ドキュメント | outputs/phase-04/critical-path.md | 実行順序とクリティカルパス図 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] T1〜T9 が単一責務原則で分解され、各サブタスクが「責務」「変更ファイル候補」「上流依存」「所要時間」「DoD」を持っている
- [ ] T6（staging）が T9（production）より前段にあることが確認されている
- [ ] cron 本数増加なし（既存 `0 18 * * *` 相乗り）が確認されている
- [ ] CONST_005 の不変条件チェックが全 PASS
- [ ] outputs/phase-04 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-04 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 5（実装計画）
- 引き継ぎ事項:
  - T1〜T9 の DoD を Phase 5 で関数シグネチャ・型定義レベルまで具体化する
  - 変更ファイル候補（パス）を Phase 5 の「変更対象ファイル一覧」に転記する
  - クリティカルパスを Phase 5 の実装順序の根拠とする
- ブロック条件: T1〜T9 のいずれかが単一責務でない、または cron 本数が増える設計が混入した場合

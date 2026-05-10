# Phase 4: タスク分解（実装サブタスク化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本タスクは Cloudflare Notification Policy 設定（Dashboard 操作）に加え、Webhook を受信して日本語 Slack メッセージへ整形し転送する **Cloudflare Workers の新規ルート / モジュールを実装する**ため。`apps/api` 配下に route handler / formatter / cf-webhook-auth verifier / Slack sender の 4 モジュールを新規追加する設計が Phase 02 で確定している。 |

---

## 目的

UT-17 は **Cloudflare native usage alerts（Pages / Workers / D1 / R2）の Notification Policy 設定** と
**Slack 日本語化リレー Worker の実装** の 2 系統を含む実装タスクである。
Phase 4 では Phase 02 設計成果物を入力として、全実装作業を **単一責務原則（SRP）** に沿った
T1〜T11 のサブタスクに分解し、各サブタスクの依存・所要時間・DoD を Phase 5 へ引き渡せる形で固定する。

UT-08（WAE custom alerts）と UT-17 の責務境界を踏襲する:

| タスク | 責務 |
| --- | --- |
| UT-08-IMPL | WAE 計装、アプリケーションエラー、Sheets→D1 同期失敗、custom alert（実装側） |
| UT-17（本タスク） | **Cloudflare native usage alerts**（Workers Requests / D1 Rows / Pages Builds / R2 Class A）+ **Slack 日本語化リレー Worker** |
| UT-18 | Workers CPU time 確認手順・調査フロー |

---

## 実行タスク

- [ ] Phase 02/03 成果物（Notification Policy 設定値・Slack message blocks 仕様・cf-webhook-auth 鍵長 / アルゴリズム）が GO であることを確認する
- [ ] T1〜T11 のサブタスクテーブルを `outputs/phase-04/task-breakdown.md` に固定する
- [ ] 各サブタスクの「変更ファイル候補」「上流依存」「所要時間目安」「DoD」を埋める
- [ ] サブタスク実行順序（クリティカルパス）を `outputs/phase-04/critical-path.md` に図示する
- [ ] T9（Cloudflare Dashboard 設定）が T10（本番デプロイ）より前段に配置されていることを確認する
- [ ] UT-08-IMPL との責務重複（WAE custom alerts 経路）が混入していないことを確認する
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## サブタスク分解（T1〜T11）

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | Slack Incoming Webhook URL 取得 + 1Password 登録 | Webhook URL を 1Password Vault に保管 | 1Password Environments（コード変更なし） | Phase 03 GO / Slack channel 確定 | 0.5h | 1Password に `op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL` 項目が登録され、`.dev.vars.example` に op:// 参照が記載されている |
| T2 | cf-webhook-auth 共有シークレット生成 + Cloudflare Secrets 投入 | Cloudflare Notification → relay 間の共有 secret を生成・投入 | `bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET` × 2 環境 | T1 完了 | 0.5h | staging / production 両環境で `bash scripts/cf.sh secret list --env <env>` に `CF_WEBHOOK_AUTH_SECRET` が表示される |
| T3 | リレー Worker 雛形作成（Hono route） | 受信エンドポイントの URL surface を確定 | 新規 `apps/api/src/routes/internal/alert-relay.ts`、編集 `apps/api/src/index.ts` | T2 完了 | 1h | `POST /internal/alert-relay` が 200 (空 body 受信) を返し、`pnpm --filter @ubm-hyogo/api typecheck` PASS |
| T4 | cf-webhook-auth 検証ミドルウェア実装 | fixed-secret 検証のみを担う pure function + middleware | 新規 `apps/api/src/lib/cf-webhook-auth.ts`、新規 `apps/api/src/middleware/verify-cf-webhook-auth.ts` | T3 完了 | 1.5h | 不正 header で 401、正規 header で next() に進むユニットテスト PASS |
| T5 | Cloudflare Notification payload → 日本語 Slack message formatter | payload 整形のみを担う pure function | 新規 `apps/api/src/lib/cloudflare-alert-formatter.ts`、新規 `apps/api/src/types/cloudflare-notification.ts` | Phase 02 spec | 2h | Workers / D1 / Pages / R2 / 不明メトリクス の 5 ケースで Slack Block Kit 構造を返す snapshot test PASS |
| T6 | Slack Incoming Webhook 送信 + リトライ | HTTP POST + exponential backoff のみ | 新規 `apps/api/src/lib/slack-sender.ts` | T5 完了 | 1h | 200 OK で 1 回送信 / 429・5xx・network error を retry / その他 4xx で即時失敗のユニットテスト PASS |
| T7 | ローカルユニットテスト整備（vitest） | 上記 T4〜T6 の包括テスト | 新規 `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`、`apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts`、`apps/api/src/lib/__tests__/cf-webhook-auth.test.ts`、`apps/api/src/lib/__tests__/slack-sender.test.ts` | T4〜T6 完了 | 1.5h | focused UT-17 tests PASS、line coverage ≥ 80% |
| T8 | ステージングデプロイ + テスト通知 | staging 環境への deploy + curl 検証 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | T7 完了 | 1h | staging URL に対し cf-webhook-auth fixed-secret header で投入 → Slack staging channel に日本語通知が到達 |
| T9 | Cloudflare Dashboard で Notification Policy 4 種を設定 | Dashboard 上で usage alert 4 種を設定（コード変更なし） | Cloudflare Dashboard（Notifications）操作のみ + 設定値 evidence 記録 | T8 完了 | 1h | Workers Requests 80% / D1 Rows 80% / Pages Builds 80% / R2 Class A 80% の 4 policy が staging 用 destination として relay URL を指している |
| T10 | 本番デプロイ + Notification Policy 切替 + 動作確認 | production 環境への deploy + Dashboard destination 切替 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | T9 完了 | 1h | production relay URL に Notification Policy 4 種が紐付き、Slack 本番 channel にテスト通知が到達 |
| T11 | runbook 追記 + 月次ヘルスチェック手順整備 | 運用ドキュメント反映 | 新規 `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`、新規 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T10 完了 | 1h | 一次対応フロー + 月次 health check 記載 |

> **注記**: T1〜T11 は順序依存があり、T7 の vitest 完了前に T8 staging deploy を行わない。T9 は T8 の relay 接続性確認後に Dashboard 操作を行う。

---

## クリティカルパス

```
T1 → T2 → T3 → T4
              ↓
              T5 → T6 → T7 → T8 → T9 → T10 → T11
```

| 区間 | 累積時間 | 備考 |
| --- | --- | --- |
| T1〜T3（前提整備） | 2.0h | Secret / 雛形が揃う |
| T4〜T7（実装 + テスト） | 6.0h | コア実装 |
| T8〜T10（デプロイ + Dashboard） | 3.0h | staging → production |
| T11（運用ドキュメント） | 1.0h | runbook 反映 |
| **合計** | **12.0h** | 1〜2 営業日想定 |

---

## 不変条件チェック（CONST_005 準拠）

- [ ] D1 直接アクセスは `apps/api` に閉じる（本タスクは D1 アクセスなし、`apps/web` 変更なし）
- [ ] Secret は 1Password → Cloudflare Secrets。`.env` には `op://` 参照のみ
- [ ] Cloudflare CLI は `bash scripts/cf.sh` 経由のみ（`wrangler` 直接実行禁止）
- [ ] UT-08-IMPL（WAE custom alerts）と責務重複させない（本タスクは Cloudflare native usage alerts のみ）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-08-IMPL（WAE custom alerts 実装） | アラート通知チャネルの共有（Slack `#ubm-alerts`） | 通知先 channel を共有するが、relay Worker は本タスクで完結（UT-08 側は別経路で送信） |
| UT-07（通知基盤設計） | Slack channel / メール宛先の正本 | 通知先決定の入力として参照 |
| 05a parallel observability | incident / observability runbook との責務重複確認 | T11 で UT-17 専用 runbook として分離 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-02.md | Notification Policy 設定値の正本 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-03.md | 設計レビュー GO 判定 |
| 必須 | docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md | UT-17 原典 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/ | 責務境界の参考 |
| 参考 | https://developers.cloudflare.com/notifications/ | Cloudflare Notifications 公式 |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Incoming Webhooks |
| 参考 | https://api.slack.com/block-kit | Slack Block Kit |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | T1〜T11 サブタスクテーブル |
| ドキュメント | outputs/phase-04/critical-path.md | 実行順序とクリティカルパス図 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] T1〜T11 が単一責務原則で分解され、各サブタスクが「責務」「変更ファイル候補」「上流依存」「所要時間」「DoD」を持っている
- [ ] T9（Dashboard 設定）が T10（本番）より前段にあることが確認されている
- [ ] UT-08-IMPL との責務重複が混入していない
- [ ] CONST_005 の 4 不変条件チェックが全 PASS
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
  - T1〜T11 の DoD を Phase 5 で関数シグネチャ・型定義レベルまで具体化する
  - 変更ファイル候補（パス）を Phase 5 の「変更対象ファイル一覧」に転記する
  - クリティカルパスを Phase 5 の実装順序の根拠とする
- ブロック条件: T1〜T11 のいずれかが単一責務でない、または UT-08-IMPL と重複がある場合

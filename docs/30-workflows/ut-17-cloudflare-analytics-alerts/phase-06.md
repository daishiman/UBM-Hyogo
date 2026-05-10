# Phase 6: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (セキュリティ・プライバシー) |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | T7（vitest）で実コードを検証する。本 Phase では Phase 5 の関数シグネチャ・エラー条件を入力として、実行可能なテストケースとカバレッジ目標を固定する。 |

---

## 目的

Phase 5 で固定した関数シグネチャ・型・入出力・エラーハンドリングに対して、
ユニット / 統合 / ステージング の 3 層テスト戦略を立案し、
カバレッジ目標とローカル実行コマンドを確定する。

---

## 6-1. テスト層と責務

| 層 | 対象 | 実行環境 | 主な検証観点 |
| --- | --- | --- | --- |
| ユニット | `verifyCfWebhookAuth` / `formatCloudflareAlertToSlack` / `sendSlackMessage` | vitest（Node 24） | 純関数の入出力・エラー条件 |
| 統合（ローカル） | route handler 全体 | `wrangler dev` + curl | cf-webhook-auth 検証 → formatter → sender の連鎖、4xx/5xx ステータス |
| ステージング | staging 環境の実 deploy | Cloudflare Workers (staging) + 実 Slack staging channel | 実 Webhook 到達・実 Cloudflare → relay 経路 |

---

## 6-2. ユニットテストケース

### 6-2-1. `cf-webhook-auth.test.ts`（4 ケース）

| Test ID | 入力 | 期待 |
| --- | --- | --- |
| cf-webhook-auth-01 | 正しい `cf-webhook-auth` header + 正しい secret | `true` |
| cf-webhook-auth-02 | header 値不一致 + 正しい secret | `false` |
| cf-webhook-auth-03 | header `null`（欠落） | `false`（throw しない） |
| cf-webhook-auth-04 | secret 不一致（rotation 前後想定） | `false` |
| cf-webhook-auth-05 | 長さが異なる header 値 | `false` |

### 6-2-2. `cloudflare-alert-formatter.test.ts`（5 ケース、snapshot 中心）

| Test ID | 入力 metric | 期待 |
| --- | --- | --- |
| FMT-01 | `workers_requests` (80% 到達) | header に「Workers リクエスト数 80% 到達」、section に日本語本文、context に `current/quota` |
| FMT-02 | `d1_rows_read` | header に「D1 読み取り行数 80% 到達」 |
| FMT-03 | `pages_builds` | header に「Pages ビルド数 80% 到達」 |
| FMT-04 | `r2_class_a_operations` | header に「R2 Class A 操作数 80% 到達」 |
| FMT-05 | 未知 metric `"unknown_metric_xyz"` | generic テンプレで header / section が生成され throw しない |

> snapshot は作成せず、`apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts` で Block Kit 構造と主要テキストを直接検証する。

### 6-2-3. `slack-sender.test.ts`（4 ケース、`fetch` mock）

| Test ID | mock 応答 | 期待 |
| --- | --- | --- |
| SND-01 | 200 OK（1 回目） | 1 回呼び出しで成功 |
| SND-02 | 500 → 500 → 200 | 3 回目で成功（exponential backoff 経由） |
| SND-03 | 500 × 3 回 | throw（502 を route が返す） |
| SND-04 | 400 Bad Request | 即時 throw（リトライしない） |

### 6-2-4. `alert-relay.test.ts`（route 結合、5 ケース）

| Test ID | シナリオ | 期待 status |
| --- | --- | --- |
| RTE-01 | 正規 cf-webhook-auth + 既知 metric + Slack 200 | 200 |
| RTE-02 | cf-webhook-auth 不一致 | 401 |
| RTE-03 | payload JSON parse 失敗 | 422 |
| RTE-04 | Slack 5xx × 3 | 502 |
| RTE-05 | 未知 metric | 200（generic テンプレで送信） |

---

## 6-3. 統合テスト（ローカル `wrangler dev`）

```bash
# Worker をローカル起動
mise exec -- pnpm --filter @ubm-hyogo/api dev

# 別ターミナルで cf-webhook-auth 固定シークレット付き curl を投入
BODY='{"name":"Workers Requests > 80%","text":"...","data":{"metric":"workers_requests","threshold_pct":80,"current_value":85000,"quota":100000},"ts":1715000000000}'
curl -X POST http://127.0.0.1:8787/internal/alert-relay \
  -H "cf-webhook-auth: $CF_WEBHOOK_AUTH_SECRET" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

| 検証項目 | 期待 |
| --- | --- |
| HTTP 200 が返る | 受信成功 |
| ローカル mock Slack receiver（または `webhook.site`）に日本語本文が届く | formatter / sender 連鎖が機能 |
| header 不一致で 401 | middleware が機能 |

---

## 6-4. ステージングテスト

```bash
# staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# staging URL に curl 投入（cf-webhook-auth は staging 用 secret）
curl -X POST https://api-staging.<domain>/internal/alert-relay \
  -H "cf-webhook-auth: $CF_WEBHOOK_AUTH_SECRET" \
  -d "$BODY"

# Slack staging channel に日本語通知が到達することを確認
```

> staging では Cloudflare Dashboard 側で Notification Policy を staging relay URL に向けて、実際に閾値超過させずに **テスト通知（Send Test Notification）** ボタンで疎通確認する（T9 の事前検証）。

---

## 6-5. ローカル実行コマンドサマリー

```bash
# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# Lint
mise exec -- pnpm --filter @ubm-hyogo/api lint

# ユニットテスト + カバレッジ
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage

# ローカル統合（wrangler dev）
mise exec -- pnpm --filter @ubm-hyogo/api dev

# staging deploy（T8 / T9）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

---

## 6-6. カバレッジ目標

| 対象モジュール | line coverage 目標 | branch coverage 目標 |
| --- | --- | --- |
| `apps/api/src/lib/cf-webhook-auth.ts` | ≥ 90% | ≥ 80% |
| `apps/api/src/lib/cloudflare-alert-formatter.ts` | ≥ 90% | ≥ 85%（メトリクス分岐 5 種を網羅） |
| `apps/api/src/lib/slack-sender.ts` | ≥ 85% | ≥ 80%（リトライ分岐） |
| `apps/api/src/middleware/verify-cf-webhook-auth.ts` | ≥ 85% | ≥ 80% |
| `apps/api/src/routes/internal/alert-relay.ts` | ≥ 80% | ≥ 75% |
| **既存標準** | **line ≥ 80%** | branch ≥ 75% |

> リポジトリ既存標準は line ≥ 80%。本タスクでは pure function 群を上振れ目標とする。

---

## 6-7. 異常系・境界値

| カテゴリ | テスト観点 | 担当 Test ID |
| --- | --- | --- |
| 認証 | cf-webhook-auth 鍵 rotation 前後の不一致 | cf-webhook-auth-04 |
| payload | JSON 不正・必須フィールド欠落 | RTE-03 |
| metric | 未知 metric / metric 欠落 | FMT-05 / RTE-05 |
| Slack | 4xx 即時失敗 / 5xx リトライ枯渇 | SND-04 / SND-03 / RTE-04 |
| ペイロード巨大化 | 1MB 超 body の body parse 挙動 | （統合テストで観察） |
| 連投（DoS） | 同一 alert の連続到達時のレート制限挙動 | Phase 7 セキュリティで方針確定 |

---

## 6-8. テスト用 payload

Payload は focused test 内に inline fixture として保持する。Cloudflare webhook payload は公式の完全固定契約ではないため、独立 JSON fixture を正本化せず、各テストケースで必要な最小フィールドを明示する。

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-08-IMPL | Slack channel 共有 | 通知先 channel 名のみ共通、Webhook URL は別 Secret |
| Phase 11（受入テスト） | 本 Phase の Test ID を AC-1〜AC-9 に紐付け | Test ID 一覧を Phase 11 evidence の入力にする |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-05.md | 関数シグネチャ・エラー条件 |
| 必須 | apps/api/src/**/__tests__/ 既存テスト | テスト記法・mock パターンの参照 |
| 参考 | https://vitest.dev/api/ | vitest API |
| 参考 | https://api.slack.com/block-kit/building | snapshot 期待値 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/test-strategy.md | 3 層戦略・Test ID 一覧・カバレッジ目標 |
| ドキュメント | outputs/phase-06/test-cases.md | cf-webhook-auth-01〜04 / FMT-01〜05 / SND-01〜04 / RTE-01〜05 の詳細 |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 完了条件

- [ ] cf-webhook-auth / formatter / sender / route の Test ID が全て定義されている（最低 18 ケース）
- [ ] formatter の Workers / D1 / Pages / R2 / 未知 metric の 5 ケースが網羅されている
- [ ] カバレッジ目標が既存標準（line ≥ 80%）以上で設定されている
- [ ] ローカル実行コマンドが `mise exec -- pnpm` 経由で記述されている
- [ ] staging deploy コマンドが `bash scripts/cf.sh` 経由で記述されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-06 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（セキュリティ・プライバシー）
- 引き継ぎ事項:
  - 6-7 異常系の「連投（DoS）」観点は Phase 7 でレート制限方針として確定する
  - cf-webhook-auth-04 の rotation テストは Phase 7 の rotation 方針と整合させる
- ブロック条件: 既存標準（line ≥ 80%）を満たさない目標設定がある場合

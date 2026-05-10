# Phase 7: セキュリティ・プライバシー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | セキュリティ・プライバシー |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 6 (テスト戦略) |
| 次 Phase | 8 (デプロイ計画) |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | cf-webhook-auth 検証・Webhook URL 取扱・レート制限・ログ非出力ポリシーは relay Worker のコード実装に直接組み込まれる仕様であるため、本 Phase は実装仕様の一部として固定する。 |

---

## 目的

relay Worker は **未認証 public endpoint（Cloudflare Notifications からの inbound webhook）** であり、
Slack Webhook URL という機密値を扱う。本 Phase で以下を確定する:

1. cf-webhook-auth 共有シークレットの rotation 方針
2. Slack Webhook URL の取扱（PII / Secret 同等の扱い）
3. Cloudflare → Worker 間の TLS 経路前提
4. レート制限（DoS 防止）方針
5. ログ非出力ポリシー（PII / Webhook URL / 署名値）

---

## 7-1. cf-webhook-auth 共有シークレット rotation

| 項目 | 値 |
| --- | --- |
| Secret 名 | `CF_WEBHOOK_AUTH_SECRET` |
| アルゴリズム | cf-webhook-auth 固定シークレット |
| 鍵長 | 32 byte（base64 で 44 文字） |
| 生成方法 | `openssl rand -base64 32` |
| 保管場所 | 1Password Personal Vault `cloudflare-alert-relay/CF_WEBHOOK_AUTH_SECRET` |
| Cloudflare 側配置 | Cloudflare Secrets（staging / production 個別） |
| Cloudflare Notification 側配置 | Notification Policy → Webhook destination → Custom Header `cf-webhook-auth` の cf-webhook-auth 共有 secret として登録 |
| rotation 頻度 | 6 ヶ月 / インシデント発生時即時 |

### rotation 手順（zero-downtime）

| # | 手順 | コマンド / 操作 |
| --- | --- | --- |
| 1 | 新しい secret を生成 | `openssl rand -base64 32` |
| 2 | 1Password に新版を `CF_WEBHOOK_AUTH_SECRET_NEXT` として一時保管 | 1Password 手動 |
| 3 | relay Worker を「旧 secret OR 新 secret のいずれかで verify 通過」モードに一時切替 | コード変更（feature flag）+ deploy |
| 4 | Cloudflare Dashboard で全 Notification Policy の Custom Header secret を新版に切替 | Dashboard 操作 |
| 5 | テスト通知で新版が通ることを確認 | Dashboard「Send Test Notification」 |
| 6 | relay Worker から旧 secret を削除し、`CF_WEBHOOK_AUTH_SECRET` を新版で上書き | `bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --env <env>` |
| 7 | 1Password の旧版を archive に移動 | 1Password 手動 |

> ステップ 3 の dual-secret モードを Phase 5 実装計画に追加することは原則しない（複雑度増のため）。
> 代わりに「短時間ダウン許容（5 分以内）」で旧→新切替を staging で先行実施し、production は次の業務時間外に切替える運用を採用する。

---

## 7-2. Slack Webhook URL の取扱

| 観点 | 方針 |
| --- | --- |
| 保管 | 1Password `cloudflare-alert-relay/SLACK_WEBHOOK_URL` |
| Cloudflare 側 | `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --env <env>`（staging / production 別 URL） |
| ログ非出力 | `console.log(env.SLACK_WEBHOOK_URL)` 禁止。Phase 9 で grep gate を追加 |
| エラー時の表示 | 「Slack 配信に失敗しました」のみ。URL を含むエラーオブジェクトをそのまま投げない |
| PR / Issue / docs への記載禁止 | URL 値は**任意の docs ファイル / PR 本文 / コミットメッセージに含めない** |
| GitHub Secret スキャン | Slack Webhook URL は GitHub のシークレットスキャンで検知対象。CI で検知した場合は即時 rotation |
| rotation 頻度 | 12 ヶ月 / インシデント発生時即時 |

> Slack Incoming Webhook URL は知られた瞬間に**任意の第三者がメッセージ投稿可能**となるため、Cloudflare Secret 同等以上の管理を行う。

---

## 7-3. Cloudflare → Worker 間の TLS 経路

| 観点 | 状態 |
| --- | --- |
| 通信経路 | Cloudflare Notifications → Cloudflare Workers（同一 Cloudflare ネットワーク内） |
| TLS 終端 | Cloudflare 側で TLS 1.3 強制 |
| 認証 | cf-webhook-auth 固定シークレット（本 Phase 7-1） |
| relay → Slack | HTTPS（Slack 側 TLS 1.2+） |
| 追加対策 | なし（cf-webhook-auth + TLS で十分。mTLS は無料枠で利用不可のため不採用） |

---

## 7-4. レート制限（DoS 防止）

relay Worker は public endpoint のため、cf-webhook-auth 認証で守られていても以下の DoS シナリオを想定する。

| シナリオ | 対策 |
| --- | --- |
| Cloudflare Notification の連投（同一 alert の重複） | relay 側で **同一 `(metric, ts 切り捨て分単位)` のメッセージを 5 分間 dedup**（任意：Workers KV を使うなら別 Phase で検討、まず in-memory で良い） |
| 不正リクエスト連投（cf-webhook-auth 不一致） | Cloudflare WAF で `/internal/alert-relay` 経路に **IP ベース 60 req/min レート制限**（UT-14 連携で別途設定。本タスクでは方針記載のみ） |
| Slack 側 rate limit (1 msg/sec per channel) | sender に exponential backoff 実装済（Phase 5）。429 もリトライ対象に含める |

> in-memory dedup は Worker isolate 単位で揮発的だが、「無料枠 80% 到達」アラートが分単位で連投される頻度は低く、MVP 段階では十分。
> 過度にアラート連投が問題化した場合は Phase 12 unassigned-task-detection で UT 起票する。

---

## 7-5. ログ非出力ポリシー

| 出力禁止項目 | 理由 |
| --- | --- |
| `SLACK_WEBHOOK_URL` の値 | 漏洩時のなりすまし投稿リスク |
| `CF_WEBHOOK_AUTH_SECRET` の値 | cf-webhook-auth 偽造リスク |
| `cf-webhook-auth` ヘッダ値 | secret から派生する値、解析の手がかりになる可能性 |
| Cloudflare account_id（payload.data.account_id） | 内部識別子。誤って外部 log sink に流出するリスク |
| エラー stack trace の rawBody 全量 | payload に PII が含まれる場合に備え、エラーログには `metric` / `threshold_pct` のみ |

### ログ出力許可項目

| 出力許可 | 用途 |
| --- | --- |
| `metric` 名 | 障害切り分け |
| `threshold_pct` | 同上 |
| HTTP status（送信結果） | 同上 |
| 失敗時のリトライ回数 | 同上 |
| `ts`（受信時刻） | 同上 |

### grep gate

Phase 9 品質保証で以下を実行:

```bash
grep -nR "console.log" apps/api/src/lib/slack-sender.ts apps/api/src/lib/cf-webhook-auth.ts \
  | grep -E "(SLACK_WEBHOOK_URL|CF_WEBHOOK_AUTH_SECRET|cf-webhook-auth)"
# 期待: 0 件マッチ
```

---

## 7-6. 脅威モデルサマリー

| 脅威 | 実害 | 対策 | 残存リスク |
| --- | --- | --- | --- |
| cf-webhook-auth 鍵漏洩 | 偽 alert の Slack 投稿 | rotation（7-1） | rotation 周期内の窓 |
| Slack Webhook URL 漏洩 | なりすまし投稿 | 1Password / Cloudflare Secrets 管理 + ログ非出力（7-2 / 7-5） | GitHub secret scan 検知前の窓 |
| 平文での経路盗聴 | 不可（TLS 強制） | 7-3 | なし |
| DoS（cf-webhook-auth 不一致連投） | Worker 無料枠消費 | WAF レート制限（7-4） | 設定前の窓 |
| 同一 alert 連投 | Slack 通知ノイズ | in-memory dedup（7-4） | isolate またぎで再発 |

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-14（WAF / Rate Limiting） | `/internal/alert-relay` への IP ベースレート制限 | 方針記載のみ。実装は UT-14 |
| UT-08-IMPL | Secret 管理方針の共有 | 1Password vault 構成を共通化 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-05.md | 関数シグネチャ |
| 必須 | CLAUDE.md「シークレット管理」 | 1Password / Cloudflare Secrets 方針 |
| 必須 | scripts/cf.sh | Secret 投入の唯一の経路 |
| 参考 | https://api.slack.com/messaging/webhooks#posting_with_webhooks | Slack Webhook セキュリティ |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | Cloudflare cf-webhook-auth 仕様 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/security-policy.md | 7-1〜7-5 の方針確定 |
| ドキュメント | outputs/phase-07/threat-model.md | 7-6 脅威モデル |
| ドキュメント | outputs/phase-07/rotation-runbook.md | 7-1 rotation 7 ステップの runbook |
| メタ | artifacts.json | phase-07 を completed に更新 |

---

## 完了条件

- [ ] cf-webhook-auth rotation 手順 7 ステップが zero-downtime（または短時間切替）で記述されている
- [ ] Slack Webhook URL の取扱が docs / PR / log への記載禁止として明記されている
- [ ] レート制限方針（in-memory dedup + WAF 連携）が確定している
- [ ] ログ出力許可 / 禁止項目が明記され、Phase 9 grep gate コマンドが固定されている
- [ ] 脅威モデル 5 項目（鍵漏洩 / URL 漏洩 / 経路盗聴 / DoS / 連投）に対策と残存リスクが記述されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-07 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 8（デプロイ計画）
- 引き継ぎ事項:
  - rotation runbook は Phase 10（運用準備）でオンコール手順に組み込む
  - grep gate コマンドは Phase 9 品質保証で実行
- ブロック条件: Slack Webhook URL ログ出力箇所が実装計画に残っている場合は Phase 5 へ差し戻す

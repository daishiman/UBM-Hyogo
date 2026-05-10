# Phase 8: デプロイ計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | デプロイ計画 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 7 (セキュリティ・プライバシー) |
| 次 Phase | 9 (実装着手) |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | T8 / T10 で実 Cloudflare Workers にデプロイし、Cloudflare Notification Policy（T9）と合わせて本番運用を開始する。本 Phase は staging → production の段階デプロイ手順・Secret 投入順序・ロールバック手順を確定する。 |

---

## 目的

staging → production の段階デプロイを **`bash scripts/cf.sh`** ラッパー経由で行い、
Secret 投入 / Worker deploy / Cloudflare Notification Policy 切替の順序とゲートを確定する。

---

## 8-1. デプロイ全体フロー

```
[ローカル: 実装 + vitest PASS]
        ↓
[T2] Secret 投入 (staging) → [T8] Worker deploy (staging) → [T9] Notification Policy 設定 (staging destination)
        ↓
[ステージング動作確認チェックリスト 全 PASS]
        ↓
[T2] Secret 投入 (production) → [T10] Worker deploy (production) → [T9 続] Notification Policy destination 切替 (production)
        ↓
[本番疎通確認]
        ↓
[T11] runbook 反映
```

---

## 8-2. Secret 投入手順

### staging

```bash
# 1Password の値を Cloudflare Secrets に動的注入（実値はラッパ内で揮発的に渡る）
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --config apps/api/wrangler.toml --env staging

# 投入確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# 期待: SLACK_WEBHOOK_URL / CF_WEBHOOK_AUTH_SECRET の 2 件が一覧に存在
```

### production

```bash
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --config apps/api/wrangler.toml --env production

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

> **禁止**: `wrangler secret put` を直接実行しない（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）。

---

## 8-3. Worker デプロイ手順

### staging（T8）

```bash
# 1. ビルド + deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 2. 出力に表示される Worker URL（例: https://api-staging.<account>.workers.dev/）を控える
# 3. /internal/alert-relay 経路の疎通確認
curl -i https://<staging-worker-url>/internal/alert-relay -X POST \
  -H "cf-webhook-auth: invalid" -d '{}'
# 期待: 401 Unauthorized（cf-webhook-auth 不一致）
```

### production（T10）

```bash
# staging の動作確認チェックリスト（8-4）が全 PASS であることを必ず確認してから実行
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

---

## 8-4. ステージング動作確認チェックリスト（本番昇格ゲート）

| # | 確認項目 | 確認方法 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | Worker が staging にデプロイされている | `bash scripts/cf.sh deployments list --env staging` | 最新 deployment が表示 | [ ] |
| 2 | Secret 2 件が staging に投入済み | `bash scripts/cf.sh secret list --env staging` | 2 件存在 | [ ] |
| 3 | 不正 cf-webhook-auth で 401 が返る | 8-3 staging step 3 の curl | 401 | [ ] |
| 4 | 正規 cf-webhook-auth + Workers metric payload で 200 + Slack 受信 | Phase 6 統合テスト curl | 200 + Slack staging channel に日本語通知 | [ ] |
| 5 | Cloudflare Dashboard で Workers Requests > 80% Notification Policy の destination が staging relay URL を指している | Dashboard 目視 | URL 一致 | [ ] |
| 6 | Cloudflare Dashboard「Send Test Notification」で staging Slack に通知到達 | Dashboard 操作 | Slack staging channel に通知 | [ ] |
| 7 | Worker のログで Webhook URL / cf-webhook-auth secret の値が出力されていない | `bash scripts/cf.sh tail --env staging` で 5 分間観察 | URL/secret 値が出力されない | [ ] |
| 8 | typecheck / lint / test 全 PASS | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck && mise exec -- pnpm --filter @ubm-hyogo/api lint && mise exec -- pnpm --filter @ubm-hyogo/api test` | 全 PASS | [ ] |
| 9 | `/internal/alert-relay` の公開面を WAF / Rate Limiting で保護する運用 DoD を確認 | Cloudflare Dashboard WAF / Rate Limiting rule、または同等の account-level rule を確認 | route path と method が対象に含まれる | [ ] |

> 上記 8 項目が全て [x] になるまで production deploy に進まない。

---

## 8-5. 本番昇格ゲート

| ゲート | 判定者 | 基準 |
| --- | --- | --- |
| ステージング動作確認チェックリスト（8-4） | 実装者 | 全 PASS |
| `outputs/phase-09/notification-policy-config.md`（staging 分） | 実装者 | 4 policy の値が記録され DB-01 staging 確認済 |
| Phase 7 ログ非出力 grep gate | 実装者 | 該当箇所 0 件 |
| solo dev 運用ポリシー | （セルフレビュー） | CLAUDE.md「solo 運用ポリシー」に従い必須レビュアー 0 で本人承認 |

---

## 8-6. ロールバック手順

### Worker のロールバック

```bash
# 直前 deployment の VERSION_ID を取得
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production

# 1 つ前の VERSION_ID にロールバック
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env production
```

### Notification Policy 側のロールバック

| 状況 | 対応 |
| --- | --- |
| relay Worker が落ちている / 不正な日本語通知が届く | Cloudflare Dashboard で各 Notification Policy の Webhook destination を **一時的に削除し、メール通知のみに切替** |
| cf-webhook-auth 鍵漏洩疑い | Phase 7 rotation runbook を即時実行 |
| Slack Webhook URL 漏洩疑い | Slack 側で Webhook を revoke し、新規 Webhook を発行 → 1Password 更新 → `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL` |

### ロールバック判定基準

| トリガー | 判定 |
| --- | --- |
| 本番 deploy 後 5 分以内に Slack に異常な内容のメッセージが流れる | 即時ロールバック |
| cf-webhook-auth 不一致の 401 が想定外に大量発生（誤った secret 配置の疑い） | Secret 再投入 → 再 deploy。改善しなければロールバック |
| Slack channel に 5 分間で 10 件以上のアラートが連投される | Notification Policy 一時無効化（Dashboard）+ 原因調査 |

---

## 8-7. 環境別 Slack channel / Webhook 一覧

| 環境 | Slack channel | Webhook URL 保管場所 | cf-webhook-auth secret 保管場所 |
| --- | --- | --- | --- |
| staging | `#ubm-alerts-staging`（仮） | 1Password `cloudflare-alert-relay/SLACK_WEBHOOK_URL_STAGING` | 1Password `cloudflare-alert-relay/CF_WEBHOOK_AUTH_SECRET_STAGING` |
| production | `#ubm-alerts`（仮） | 1Password `cloudflare-alert-relay/SLACK_WEBHOOK_URL_PRODUCTION` | 1Password `cloudflare-alert-relay/CF_WEBHOOK_AUTH_SECRET_PRODUCTION` |

> channel 名は UT-07（通知基盤設計）で確定。Phase 02 GO 時点の暫定値を Phase 9 着手時に確定する。

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-08-IMPL | 同じ Worker（`apps/api`）への deploy 重複 | 別 PR / 別 commit で順序管理。本タスクと UT-08-IMPL の deploy は同一 Worker への deploy なので **UT-08 PR が先にマージされた場合は本タスクが rebase してから deploy** する |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-05.md | 変更ファイル一覧 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-07.md | rotation / ログ非出力ポリシー |
| 必須 | scripts/cf.sh | Cloudflare CLI ラッパ |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | wrangler 直接実行禁止 |
| 参考 | https://developers.cloudflare.com/workers/configuration/versions-and-deployments/ | rollback 公式 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/deploy-plan.md | 8-1 全体フロー + 8-2〜8-3 手順 |
| ドキュメント | outputs/phase-08/staging-checklist.md | 8-4 動作確認チェックリスト（実施記録欄を含む） |
| ドキュメント | outputs/phase-08/rollback-runbook.md | 8-6 ロールバック手順 |
| メタ | artifacts.json | phase-08 を completed に更新 |

---

## 完了条件

- [ ] Secret 投入が `bash scripts/cf.sh secret put` で記述されている（`wrangler` 直接実行なし）
- [ ] Worker deploy が `bash scripts/cf.sh deploy` で記述されている
- [ ] ステージング動作確認チェックリスト 8 項目が定義されている
- [ ] 本番昇格ゲートが 4 項目で定義されている
- [ ] ロールバック手順（Worker / Notification Policy / Webhook URL）が定義されている
- [ ] 環境別 Slack channel / Webhook 保管場所が 1Password ベースで明示されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-08 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 9（実装着手）
- 引き継ぎ事項:
  - 8-4 staging-checklist.md は Phase 9 / Phase 11 で実施記録として埋める
  - 8-6 rollback-runbook.md は Phase 10 オンコール手順に組み込む
- ブロック条件: `wrangler` 直接実行コマンドが残っている場合は Phase 7 / Phase 5 へ差し戻す

# Phase 9: staging 動作確認 / 受入

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| タスクID | ut-17-followup-003-alert-relay-automated-healthcheck-cron |
| Phase 番号 | 9 / 13 |
| Phase 名称 | staging 動作確認 / 受入 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 8 (ドキュメント反映) |
| 次 Phase | 10 (後付けリファクタ) |
| 状態 | pending |
| GitHub Issue | #635 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `bash scripts/cf.sh deploy` で実 Cloudflare Workers staging 環境に deploy し、scheduled trigger を手動発火させて Slack 着信 / メールフォールバック着信を実機確認する Phase。実環境への副作用を伴う。 |

---

## 目的

Phase 1〜7 で実装した `scheduled` handler / cron schedule / メールフォールバックを staging 環境で
**正常系 + 異常系** の両面で動作確認し、Acceptance Criteria（AC-1〜AC-6）を全て充足することを示す。
本 Phase は production 昇格の唯一のゲート。

---

## 9-1. 受入対象 Acceptance Criteria（AC）

| AC ID | 内容 | 観点 |
| --- | --- | --- |
| AC-1 | 月次手動 runbook 依存の解消 | 週次 cron が定常監視責務を担い、月次 runbook は四半期 deep-dive に降格 |
| AC-2 | 週次自動発火 | Cron Trigger が `0 18 * * *` で Monday gate 条件成立時のみ発火 |
| AC-3 | Slack `OK` 通知到達 | Slack 投稿の戻り値検証が `status === 200 && body.trim() === "ok"` の両面で成功 |
| AC-4 | 異常系メールフォールバック | Slack 失敗時に `HEALTHCHECK_FALLBACK_EMAIL` 宛にメールが届く |
| AC-5 | payload 識別可能性 | Slack 投稿内容に `UT-17 weekly healthcheck` / `severity: info` / `data.healthcheck: true` が含まれ、本物アラートと識別可能 |
| AC-6 | secrets / URL がログに出力されない | `bash scripts/cf.sh tail` で webhook URL / API key が出ない |

---

## 9-2. 着手前提チェックリスト

| # | 確認項目 | 確認方法 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | Phase 1〜7 が全 completed | `artifacts.json` 確認 | phase-01〜07 が completed | [ ] |
| 2 | typecheck / lint PASS | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck && mise exec -- pnpm --filter @ubm-hyogo/api lint` | 全 PASS | [ ] |
| 3 | vitest PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test` | scheduled handler unit 含めて PASS | [ ] |
| 4 | staging 用 1Password Item 存在 | 1Password 手動確認 | `SLACK_WEBHOOK_URL_HEALTHCHECK_STAGING` / `HEALTHCHECK_FALLBACK_EMAIL` / `RESEND_API_KEY` が存在 | [ ] |
| 5 | feature ブランチが dev 起点 | `git log --oneline dev..HEAD` | dev 起点で commit 列が確認可 | [ ] |
| 6 | `apps/api/wrangler.toml` の `[triggers]` に `crons` が定義されている | `grep -n 'crons' apps/api/wrangler.toml` | `crons = ["0 18 * * *"]` 等の行が hit | [ ] |
| 7 | `bash scripts/cf.sh whoami` で account 表示 | コマンド実行 | account 表示 | [ ] |

> 全項目 [x] になるまで staging deploy に進まない。

---

## 9-3. 変更対象ファイル一覧（本 Phase で参照する範囲）

| ファイル | 役割 |
| --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | scheduled handler 本体（Phase 2 実装） |
| `apps/api/src/index.ts` | `export default { fetch, scheduled }` 拡張 |
| `apps/api/wrangler.toml` | `[triggers]` / `crons` 定義 |
| `apps/api/src/env.ts` | optional 3 secrets を Env interface に追加 |
| `apps/api/src/lib/slack-sender.ts` | 既存（呼び出し元）。本 Phase で改変しない |
| `apps/api/src/lib/cloudflare-alert-formatter.ts` | 既存。healthcheck payload 整形に流用 |

---

## 9-4. 主要関数シグネチャ（本 Phase で検証する範囲）

```ts
// apps/api/src/scheduled/healthcheck.ts
export async function runAlertRelayHealthcheck(env: ApiEnv): Promise<HealthcheckMailFallbackResult>;
function verifySlackResponse(status: number, bodyText: string): boolean;
function sendFallbackMail(env: ApiEnv, reason: string): Promise<void>;

export interface HealthcheckMailFallbackResult {
  readonly ok: boolean;
  readonly slackStatus: number;
  readonly slackBodyOk: boolean;
  readonly fallbackSent: boolean;
  readonly reason?: string;
}

// apps/api/src/index.ts
export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: ApiEnv, ctx: ExecutionContext) => {
    // Monday gate (UTC) + runAlertRelayHealthcheck
    if (new Date(event.scheduledTime).getUTCDay() !== 1) return;
    ctx.waitUntil(runAlertRelayHealthcheck(env));
  },
};
```

### 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `runAlertRelayHealthcheck(env)` | `ApiEnv` | `HealthcheckMailFallbackResult` | Slack POST 1 回 + 失敗時のみ Resend mail POST 1 回 |
| `verifySlackResponse(status, body)` | `number`, `string` | `boolean` | なし（pure） |
| `sendFallbackMail(env, reason)` | `ApiEnv`, `string` | `Promise<void>` | Resend API へ POST 1 回。`RESEND_API_KEY` / `HEALTHCHECK_FALLBACK_EMAIL` 未設定時は no-op |

---

## 9-5. staging 受入手順（実機）

### Step 1: staging deploy

```bash
# 1. typecheck / lint / test を最後にもう 1 回実行
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test

# 2. optional secrets を staging に投入（既存 secrets はそのまま）
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env staging

# 3. secret 投入結果確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# 期待: 既存 SLACK_WEBHOOK_URL / CF_WEBHOOK_AUTH_SECRET + 新規 3 件 = 計 5 件以上

# 4. deploy 実行
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# 期待: Deploy 成功 / cron 設定 `0 18 * * *` がデプロイ出力に表示される
```

### Step 2: scheduled trigger 手動発火（正常系 = AC-2 / AC-3 / AC-5）

Cloudflare Dashboard から手動発火する（cron 待機より高速）:

1. Cloudflare Dashboard → Workers & Pages → `ubm-hyogo-api-staging` を選択
2. Triggers タブ → Cron Triggers セクション → `0 18 * * *` の行で **Send scheduled event** を押下
3. 30 秒以内に Slack `#ubm-alerts-healthcheck-staging` を確認

**期待**:
- Slack に「UT-17 weekly healthcheck」ヘッダ + `severity: info` の Block Kit メッセージが 1 件届く
- `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` で `slackStatus=200 slackBodyOk=true fallbackSent=false` が見える
- Slack 投稿内容に `data.healthcheck: true` 相当のマーカー（formatter で末尾に "(healthcheck)" suffix）が含まれる

### Step 3: Monday gate 検証（AC-2）

```bash
# scheduledTime を手動指定して非 Monday の event を送る場合、Cloudflare Dashboard では現在時刻が使われるため
# tail ログで「UTC day」を確認するアプローチを取る
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty &
# 別ターミナルで Dashboard の Send scheduled event を 2 回連打
# 1 回目: Monday の発火（OK 投稿あり）／ 2 回目以降: 同日同時刻なので Monday gate 該当時のみ走る
```

**期待**: tail ログに `Monday gate: pass` / `Monday gate: skip (UTC day = N)` の trace が
（実装上 console.log で出している場合は）目視できる。

> 注意: Cloudflare Dashboard の手動発火は実 `scheduledTime` を使うため、火曜以降の日に行うと
> Monday gate により handler 早期 return する正常動作になる。これも AC-2 充足の証跡として記録する。

### Step 4: 異常系 — Slack URL 不正値差し替え（AC-4）

```bash
# 1. 元の値を必ず控える（後で復旧）
echo "復旧用に 1Password の SLACK_WEBHOOK_URL_HEALTHCHECK_STAGING の値を確認しておく"

# 2. 不正値を投入
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK \
  --config apps/api/wrangler.toml --env staging
# プロンプトで `https://hooks.slack.com/services/INVALID/INVALID/INVALID` を入力

# 3. Dashboard から再度 scheduled event を Send

# 4. 期待:
#    - Slack には何も届かない
#    - HEALTHCHECK_FALLBACK_EMAIL 宛にメール 1 通着信
#    - 件名/本文に "UT-17 healthcheck failed at <ISO timestamp>" + reason="slack_status_404" or "slack_body_not_ok"
#    - tail ログで slackStatus !== 200 / fallbackSent=true が見える

# 5. 復旧
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK \
  --config apps/api/wrangler.toml --env staging
# プロンプトで 1Password から取得した正しい webhook URL を再投入

# 6. 復旧確認: もう 1 回 Send scheduled event → Slack 着信あり / メール無し
```

### Step 5: ログに secrets が出ていないことを確認（AC-6）

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging | tee outputs/phase-09/tail.log &
# 5 分間 tail を保持しつつ Step 2 / Step 4 を実施し、tail.log を grep
grep -E "hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[A-Za-z0-9]+" outputs/phase-09/tail.log \
  && echo "FAIL: webhook URL が tail に流出" || echo "OK: webhook URL 流出なし"
grep -E "re_[A-Za-z0-9]{20,}" outputs/phase-09/tail.log \
  && echo "FAIL: Resend API key が tail に流出" || echo "OK: API key 流出なし"
```

---

## 9-6. AC 突合表（Phase 9 完了時に埋める）

| AC ID | 検証 Step | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 8 で月次 runbook §0 が追記済 / 本 Phase で staging deploy 後 1 週間以内に手動 runbook 不実施でも cron OK 確認 | runbook §0 が反映 + staging に OK 投稿が継続 | _実測転記_ | [ ] |
| AC-2 | Step 3 | Monday gate skip / pass の挙動が tail で確認可 | _実測転記_ | [ ] |
| AC-3 | Step 2 | Slack 到達 + verifySlackResponse が true | _実測転記_ | [ ] |
| AC-4 | Step 4 | メール 1 通着信 + reason 文字列が human-readable | _実測転記_ | [ ] |
| AC-5 | Step 2 | Slack 投稿に healthcheck マーカー含む | _実測転記_ | [ ] |
| AC-6 | Step 5 | tail.log に webhook URL / API key の値が現れない | _実測転記_ | [ ] |

---

## 9-7. ロールバック条件（cron 失敗連発時）

production 投入後に週次 cron が連続失敗した場合の段階的退避:

| 段階 | 条件 | 退避手順 |
| --- | --- | --- |
| 1 | メールフォールバックが 1 回着信 | Phase 8 で追記した runbook §0 のトリガーに従い月次 runbook 即時実施。原因が Slack 側 revoke なら 1Password 更新 → `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env production` |
| 2 | メールフォールバックが 2 週連続着信 | Monday gate を一時無効化して原因調査優先。`apps/api/src/index.ts` の scheduled handler 冒頭に `if (env.HEALTHCHECK_DISABLED === "1") return;` を追加する PR を作成し dev → main で merge。Cloudflare Secrets に `HEALTHCHECK_DISABLED=1` を投入: `bash scripts/cf.sh secret put HEALTHCHECK_DISABLED --config apps/api/wrangler.toml --env production` |
| 3 | scheduled handler 自体が throw を繰り返す | `apps/api/wrangler.toml` の `[triggers]` から `crons` を一時除去 → `bash scripts/cf.sh deploy --env production` で cron 自体を unregister |
| 4 | 復旧 | `HEALTHCHECK_DISABLED` を Cloudflare Secrets から `delete` し、`crons` を `wrangler.toml` に復元、再 deploy |

> 段階 2 以降に進む場合は必ず GitHub Issue（new followup task）を起票し、復旧条件を明文化する。

---

## 9-8. テスト方針 / 検証コマンド

| 種別 | コマンド | 目的 |
| --- | --- | --- |
| 静的検証 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | scheduled handler 型整合 |
| 静的検証 | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | lint PASS |
| ユニット | `mise exec -- pnpm --filter @ubm-hyogo/api test -- scheduled` | `verifySlackResponse` / `runAlertRelayHealthcheck` の正常 / 異常パスを mock fetch で網羅 |
| 実機 | Step 1〜5（本 Phase 9-5） | AC-1〜AC-6 |
| evidence | `outputs/phase-09/tail.log` / `outputs/phase-09/acceptance.md` | 受入結果 SSOT |

---

## 9-9. DoD

- [ ] 9-2 着手前提 7 項目全 [x]
- [ ] 9-5 Step 1〜5 全実施
- [ ] 9-6 AC 突合表が全 [x]（実測値が「期待」と一致）
- [ ] secrets 復旧確認（Step 4 復旧後の Slack 着信再確認）
- [ ] `outputs/phase-09/acceptance.md` に staging 動作結果が記録
- [ ] `outputs/phase-09/tail.log` に 5 分以上の tail が保存
- [ ] 9-7 ロールバック条件が文書化されている

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 8 | runbook §0「Cron 連続失敗閾値」の実機トリガー | Step 4 でメールフォールバック着信 = runbook 即時実施トリガー成立を実演 |
| Phase 10 | `verifySlackResponse` の責務分離判定 | Step 2 / Step 4 の実測ログを Phase 10 リファクタ判定の根拠データとして提供 |
| UT-17 既存月次 runbook | 役割再定義の実機検証 | staging で 1 週間 cron OK が出続けたことを記録（AC-1 evidence） |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-08.md | 前 Phase の runbook 差分 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md | 親タスク指示書 |
| 必須 | apps/api/src/lib/slack-sender.ts | Slack POST 既存実装 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | wrangler 直接実行禁止 |
| 参考 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-08.md | staging deploy / secret put の標準フロー |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/acceptance.md | AC 突合表 + 実測値 + ロールバック条件まとめ |
| evidence | outputs/phase-09/tail.log | `bash scripts/cf.sh tail --env staging` 出力（secrets マスク後） |
| メタ | artifacts.json | phase-09 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（後付けリファクタ）
- 引き継ぎ事項:
  - Step 2 / Step 4 で取得した tail 上の `reason` 値の分布 → Phase 10 の `verifySlackResponse` 抽出判定の根拠
  - 異常系 Step 4 で「Slack URL を不正値に差し替え → 1Password から復旧」した手順は本番運用時の Webhook revoke 対応 SOP として転用する
- ブロック条件: AC-3 / AC-4 のいずれかが FAIL の場合、Phase 10 に進まず Phase 2〜3（実装）へ差し戻す

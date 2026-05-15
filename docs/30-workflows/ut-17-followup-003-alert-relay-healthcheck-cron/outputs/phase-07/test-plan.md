# Phase 7 成果物: テスト計画書

[実装区分: 実装仕様書]

UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) のテスト計画。
ユニット（vitest）と統合（staging）の 2 層で、`runAlertRelayHealthcheck` の全分岐と mail fallback 経路を保証する。

---

## A. テスト対象と検証範囲

### A-1. 対象モジュール

| パス | 検証層 |
| --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | ユニット（vitest） |
| `apps/api/src/index.ts`（Monday gate 分岐） | 統合（staging Dashboard `Trigger Now`） |
| `apps/api/src/env.ts`（optional 3 項目） | typecheck で保証 |

### A-2. 対象関数 / 分岐

- `buildHealthcheckPayload`（pure）
- `isSlackResponseOk`（pure）
- `postSlackHealthcheck`（fetch ラッパ）
- `sendFallbackMail`（fetch ラッパ）
- `runAlertRelayHealthcheck`（エントリポイント・4 分岐）
- `scheduled` handler の `getUTCDay() === 1` ガード（統合のみ）

---

## B. ユニットテスト（vitest）

### B-1. 必須 Test ID（8 ケース）

| Test ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| PURE-01 | `isSlackResponseOk` | (200, "ok") | true |
| PURE-02 | `isSlackResponseOk` | (200, "no_service") | false |
| PURE-03 | `isSlackResponseOk` | (404, "ok") | false |
| PURE-04 | `isSlackResponseOk` | (200, " ok\n") | true（trim） |
| PURE-05 | `buildHealthcheckPayload` | Date(0) | name/severity/ts/data.healthcheck=true 完全一致 |
| HC-01 | `runAlertRelayHealthcheck` | Slack 200/"ok" | mail 未呼出、fetch 1 回 |
| HC-02 | `runAlertRelayHealthcheck` | Slack 200/"no_service" → Resend 200 | mail 呼出、Resend URL 一致、fetch 2 回 |
| HC-03 | `runAlertRelayHealthcheck` | Slack 404 → Resend 500 | throw しない、fetch 2 回 |

### B-2. 推奨 Test ID（カバレッジ補強用 4 ケース）

| Test ID | シナリオ | 期待 |
| --- | --- | --- |
| HC-04 | env.SLACK_WEBHOOK_URL_HEALTHCHECK 未設定 | fetch 0 回、no-op、warn 1 回 |
| HC-05 | Slack fetch が throw（network error）→ Resend 200 | mail fallback に進む、fetch 2 回 |
| HC-06 | Slack body=" ok\n" | mail 未呼出（trim 認識） |
| HC-07 | env.HEALTHCHECK_FALLBACK_EMAIL 欠落 + Slack 失敗 | mail 呼出しない、error log 1 回 |

### B-3. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm/api test scheduled/healthcheck
mise exec -- pnpm --filter @ubm/api test:coverage -- scheduled/healthcheck
```

### B-4. カバレッジ目標

| 対象 | line | branch |
| --- | --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | ≥ 85% | ≥ 80% |

> 既存リポジトリ標準は line ≥ 80%。本タスクは pure 関数比率が高いため上振れ目標。

---

## C. 統合テスト（staging）

### C-1. 前提

- `apps/api` が staging に deploy 済み（`bash scripts/cf.sh deploy ... --env staging`）
- `SLACK_WEBHOOK_URL_HEALTHCHECK` / `HEALTHCHECK_FALLBACK_EMAIL` / Resend 鍵が staging に投入済み

### C-2. 正常系（Slack 到達）

1. Cloudflare Dashboard → Workers → 該当 worker → Triggers → Cron Triggers
2. `0 18 * * *` の `Trigger Now` ボタンを押下
3. 同時並行で `bash scripts/cf.sh tail --env staging`（または Dashboard Logs）を開く

**期待**:
- log に `[alertRelayHealthcheck] slack ok` が出力される
- Slack `#alerts-healthcheck` (staging) に「UT-17 weekly healthcheck OK at <ISO>」到達
- log に Slack Webhook URL の値が出力されていない

### C-3. 異常系（mail fallback）

1. `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging` で意図的に不正な URL を投入
2. `Trigger Now` 再実行

**期待**:
- log に `[alertRelayHealthcheck] slack failed` + `[alertRelayHealthcheck] mail fallback sent` が出力
- `HEALTHCHECK_FALLBACK_EMAIL` 宛てに「[UT-17] healthcheck failed」到達
- log に Resend API key の値が出力されていない

### C-4. 復旧確認

1. `SLACK_WEBHOOK_URL_HEALTHCHECK` を元の有効な URL に再投入
2. `Trigger Now` → 正常系 C-2 を再現

### C-5. Monday gate 検証

- 自然発火を待つ（次週月曜 03:00 JST）
- もしくは: 一時的にコード上の `getUTCDay() === 1` を `=== <今日の UTC 曜日>` に書き換えて再 deploy → `Trigger Now` で発火確認 → **production deploy 前に必ず元に戻す**

---

## D. セキュリティ grep gate

```bash
grep -nRE "console\.(log|info|warn|error).*(SLACK_WEBHOOK_URL_HEALTHCHECK|RESEND_API_KEY|webhookUrl|apiKey)" \
  apps/api/src/scheduled/healthcheck.ts
# 期待: 0 件マッチ

grep -nRE "(hooks\.slack\.com/services|re_[A-Za-z0-9]{8,})" apps/api/src/scheduled/
# 期待: 0 件マッチ（fixture / inline literal なし）
```

---

## E. 実施チェックリスト

### E-1. ユニット
- [ ] PURE-01〜PURE-05 PASS
- [ ] HC-01〜HC-03 PASS（必須）
- [ ] HC-04〜HC-07 PASS（推奨）
- [ ] line coverage ≥ 85%

### E-2. 統合（staging）
- [ ] 正常系: Slack 到達 + log OK
- [ ] 異常系: mail fallback 到達 + log OK
- [ ] 復旧確認: 元の URL で正常系再現
- [ ] Monday gate 検証（自然発火 or コード一時改変）

### E-3. セキュリティ
- [ ] grep gate 0 件
- [ ] PR 本文 / commit message / docs に webhook URL / API key が含まれない

### E-4. 不変条件
- [ ] cron 配列長 3 のまま据置
- [ ] `apps/web/` 変更なし
- [ ] `pnpm-lock.yaml` 差分なし
- [ ] `wrangler` 直接実行なし

---

## F. ローカル実行コマンド集

```bash
mise exec -- pnpm --filter @ubm/api typecheck
mise exec -- pnpm --filter @ubm/api lint
mise exec -- pnpm --filter @ubm/api test scheduled/healthcheck
mise exec -- pnpm --filter @ubm/api test:coverage -- scheduled/healthcheck

bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh tail --env staging

bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --env staging
```

## G. DoD

- [ ] B-1 必須 8 ケース全 PASS
- [ ] C-2 / C-3 / C-4 / C-5 evidence あり
- [ ] D grep gate 0 件
- [ ] カバレッジ目標達成
- [ ] 不変条件 4 項目全 PASS

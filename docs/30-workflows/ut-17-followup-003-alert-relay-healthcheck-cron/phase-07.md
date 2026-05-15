# Phase 7: テスト計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (デプロイ計画) |
| 状態 | pending |
| GitHub Issue | #635 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | T5（vitest）で `apps/api/src/scheduled/__tests__/healthcheck.test.ts` を新規追加し、`runAlertRelayHealthcheck` を含む 5 export を検証する。本 Phase は Phase 5 の関数シグネチャ・エラー条件・Phase 6 の実装手順に基づき、実行可能なテストケース・カバレッジ目標・統合テスト手順を確定する。 |

---

## 目的

Phase 5 で固定した関数シグネチャ・型・入出力・エラーハンドリングと、Phase 6 の S5 vitest 雛形に対して、
**ユニット / 統合（staging） の 2 層テスト戦略** を立案し、カバレッジ目標とローカル実行コマンドを確定する。

---

## 7-1. テスト層と責務

| 層 | 対象 | 実行環境 | 主な検証観点 |
| --- | --- | --- | --- |
| ユニット | `buildHealthcheckPayload` / `isSlackResponseOk` / `postSlackHealthcheck` / `sendFallbackMail` / `runAlertRelayHealthcheck` | vitest（Node 24, fetch mock） | pure 関数の入出力、fetch ラッパの戻り値変換、エントリポイントの分岐 |
| 統合（staging） | scheduled handler 全体 | Cloudflare Workers staging + Dashboard `Trigger Now` | Monday gate、Slack 到達、mail fallback 到達 |

> ローカル `wrangler dev --test-scheduled` は補助的に利用可能（必須ではない）。

---

## 7-2. ユニットテストケース

### 7-2-1. `healthcheck.test.ts`（必須 3 ケース + 推奨 4 ケース）

| Test ID | シナリオ | fetch mock | 期待 |
| --- | --- | --- | --- |
| HC-01 | Slack 200/"ok" | 1 回目: 200 / body="ok" | mail 未呼出。fetch 1 回のみ。`runAlertRelayHealthcheck` resolve undefined |
| HC-02 | Slack 200/"no_service" → Mail OK | 1 回目: 200 / body="no_service"、2 回目: 200 | mail 呼出。2 回目の URL が `https://api.resend.com/emails` |
| HC-03 | Slack 404 → Mail 500 | 1 回目: 404、2 回目: 500 | throw しない。fetch 2 回 |
| HC-04（推奨） | env.SLACK_WEBHOOK_URL_HEALTHCHECK 未設定 | （fetch 呼ばれない） | fetch 0 回、no-op |
| HC-05（推奨） | Slack fetch 自体が throw（network error） | 1 回目: `mockRejectedValue(new Error("network"))`、2 回目: 200 | mail 呼出（catch 経由で fallback に進む） |
| HC-06（推奨） | Slack OK の境界（body=" ok\n" 前後空白） | 200 / " ok\n" | mail 未呼出（`isSlackResponseOk` の trim が機能） |
| HC-07（推奨） | env.HEALTHCHECK_FALLBACK_EMAIL 欠落 + Slack 失敗 | 1 回目: 500 | mail 呼出しない。console.error 1 回 |

### 7-2-2. pure 関数の単体テスト（同ファイル内）

| Test ID | 対象 | 入力 | 期待 |
| --- | --- | --- | --- |
| PURE-01 | `isSlackResponseOk` | (200, "ok") | true |
| PURE-02 | `isSlackResponseOk` | (200, "no_service") | false |
| PURE-03 | `isSlackResponseOk` | (404, "ok") | false |
| PURE-04 | `isSlackResponseOk` | (200, " ok\n") | true（trim 込み） |
| PURE-05 | `buildHealthcheckPayload` | new Date(0) | `{ name: "UT-17 weekly healthcheck", severity: "info", ts: 0, data: { healthcheck: true, triggeredAt: "1970-01-01T00:00:00.000Z" } }` |

> 必須は HC-01〜HC-03 + PURE-01〜PURE-05。推奨は coverage 目標達成のために追加する。

---

## 7-3. 統合テスト（staging）

### 7-3-1. 正常系

```bash
# staging deploy（実装手順 S8）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# Cloudflare Dashboard → Workers → 該当 worker → Triggers → Cron Triggers
# "0 18 * * *" 行の `Trigger Now` ボタンを押下
```

| 検証項目 | 期待 |
| --- | --- |
| Workers Logs (`wrangler tail`) に `[alertRelayHealthcheck] slack ok` | 出力される |
| Slack `#alerts-healthcheck` (staging) | 「UT-17 weekly healthcheck OK at <ISO>」到達 |
| Slack channel に重複投稿なし | 1 回のみ |
| Webhook URL 値が log に出ない | grep で 0 件 |

### 7-3-2. 異常系（Slack URL drift → mail fallback）

```bash
# Slack webhook URL を一時的に無効値へ
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
# → 値の入力プロンプトで明らかに不正な URL（例: https://hooks.slack.com/services/INVALID/INVALID/INVALID）を投入
```

その後 `Trigger Now`:

| 検証項目 | 期待 |
| --- | --- |
| Workers Logs に `[alertRelayHealthcheck] slack failed` | 出力される |
| Workers Logs に `[alertRelayHealthcheck] mail fallback sent` | 出力される |
| `HEALTHCHECK_FALLBACK_EMAIL` の受信箱 | 「[UT-17] healthcheck failed」到達 |
| Resend API key が log に出ない | grep で 0 件 |

### 7-3-3. Monday gate 検証

| 検証項目 | 期待 |
| --- | --- |
| 月曜以外（例: 火曜）の `0 18 * * *` 実発火時 | healthcheck は実行されない（既存 schema sync / retention purge のみ実行） |
| Workers Logs に healthcheck 関連 log なし | 出力されない |

> 自動発火を待たずに検証する場合は、コード上の `getUTCDay() === 1` を一時 `=== <現在曜日>` に書き換えて staging deploy → `Trigger Now` → 元に戻して再 deploy で確認する手順を取る（最終 production deploy 前に必ず元に戻すこと）。

---

## 7-4. ローカル実行コマンドサマリー

```bash
# 型チェック
mise exec -- pnpm --filter @ubm/api typecheck

# Lint
mise exec -- pnpm --filter @ubm/api lint

# ユニットテスト（focused）
mise exec -- pnpm --filter @ubm/api test scheduled/healthcheck

# カバレッジ
mise exec -- pnpm --filter @ubm/api test:coverage -- scheduled/healthcheck

# staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# production deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# secret 操作
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --env staging
```

---

## 7-5. カバレッジ目標

| 対象モジュール | line coverage 目標 | branch coverage 目標 |
| --- | --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | ≥ 85% | ≥ 80%（Slack ok / Slack fail-mail ok / Slack fail-mail fail / env 未設定 の 4 分岐網羅） |
| **既存標準** | line ≥ 80% | branch ≥ 75% |

> pure 関数（`buildHealthcheckPayload` / `isSlackResponseOk`）は PURE-01〜PURE-05 で実質 100%。`runAlertRelayHealthcheck` の env 未設定分岐は HC-04 で網羅する。

---

## 7-6. 異常系・境界値

| カテゴリ | テスト観点 | 担当 Test ID |
| --- | --- | --- |
| env | 必須 secret 欠落（healthcheck URL 未設定） | HC-04 |
| env | mail fallback 用 email 欠落 | HC-07 |
| Slack | 200 だが body != "ok"（revoke 後の典型挙動） | HC-02 / PURE-02 |
| Slack | 非 2xx | HC-03 |
| Slack | network error（fetch throw） | HC-05 |
| 境界 | body 前後空白 | HC-06 / PURE-04 |
| 曜日 | Monday gate（火〜日は no-op） | 統合 7-3-3 |
| ペイロード | payload 識別マーカー（`data.healthcheck: true`） | PURE-05 |

---

## 7-7. セキュリティ・ログ非出力検証

Slack Webhook URL と Resend API key は構造化ログに出力しない。本 Phase で以下の grep gate を test plan に含める:

```bash
# 実装後・staging deploy 前にローカルで実行
grep -nR "SLACK_WEBHOOK_URL_HEALTHCHECK" apps/api/src/scheduled/healthcheck.ts \
  | grep -E "console\.(log|info|warn|error).*SLACK_WEBHOOK_URL_HEALTHCHECK"
# 期待: 0 件マッチ

grep -nR "RESEND_API_KEY" apps/api/src/scheduled/healthcheck.ts \
  | grep -E "console\.(log|info|warn|error).*RESEND_API_KEY"
# 期待: 0 件マッチ
```

> 本 grep は Phase 9 品質保証でも再実行する。

---

## 7-8. テスト用 payload / fixture

Vitest 内で inline 構築する（独立 JSON fixture は持たない）:

```ts
const slackOkResponse = new Response("ok", { status: 200 });
const slackRevokeResponse = new Response("no_service", { status: 200 });
const slack404Response = new Response("not found", { status: 404 });
const resendOk = new Response(JSON.stringify({ id: "rs_test" }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
const resend500 = new Response("error", { status: 500 });
```

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 本体（alert-relay Worker） | Slack 投稿戻り値判定パターンの共有 | 既存 `slack-sender.ts` の判定を本タスクで厳密化（参考） |
| 月次 runbook | Cron 連続 2 回失敗時の deep-dive 起点 | 異常系テストで mail fallback 経路を保証する根拠とする |
| Phase 8（デプロイ計画） | staging / production 切替手順 | 7-3 統合テストを実行手順として転記 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-05.md | 関数シグネチャ・エラー条件 |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-06.md | 実装手順 S5 vitest 雛形 |
| 必須 | apps/api/src/**/__tests__/ 既存テスト | vitest 記法・mock パターン |
| 参考 | https://vitest.dev/api/vi.html#vi-stubglobal | fetch global mock |
| 参考 | https://api.slack.com/messaging/webhooks#handling_errors | Slack 戻り値仕様 |
| 参考 | https://resend.com/docs/api-reference/emails/send-email | Resend send API |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/test-plan.md | 2 層戦略・Test ID 一覧・カバレッジ目標・統合テスト手順 |
| メタ | artifacts.json | phase-07 を completed に更新 |

---

## 完了条件

- [ ] HC-01〜HC-03 + PURE-01〜PURE-05 の必須 Test ID が定義されている
- [ ] Slack 戻り値の `status === 200 && body.trim() === "ok"` が PURE / HC 両層で網羅されている
- [ ] mail fallback の到達確認（staging）の手順が固定されている
- [ ] Monday gate の検証手順が記述されている
- [ ] カバレッジ目標が既存標準（line ≥ 80%）以上で設定されている
- [ ] ローカル実行コマンドが `mise exec -- pnpm` 経由で記述されている
- [ ] staging deploy コマンドが `bash scripts/cf.sh` 経由で記述されている
- [ ] Slack Webhook URL / Resend API key の grep gate が記述されている

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
  - 7-3 統合テスト手順は Phase 8 staging / production 切替の実施手順に転記する
  - 7-7 grep gate は Phase 9 品質保証で再実行する
  - HC-04 / HC-07 の env 欠落分岐は Phase 10（運用準備）の secret 未投入時の挙動として参照
- ブロック条件: HC-01〜HC-03 / PURE-01〜PURE-05 の必須 Test ID に欠落、または mail fallback 経路のテストが欠落する場合は Phase 5 へ差し戻す

# Phase 9 — 品質チェックリスト

## 自動チェック実行結果

| gate | command | 結果 |
|---|---|---|
| typecheck | `mise exec -- pnpm typecheck` | PASS (5 workspace project すべて Done) |
| lint | `mise exec -- pnpm lint` | PASS (boundary lint + tsc -noEmit 全 5 project) |
| test | `mise exec -- pnpm test` | PASS — Test Files **75 passed (75)**, Tests **496 passed (496)**, Duration 38.88s |
| AC-7 fs-check | `bash apps/api/scripts/no-access-fs-check.sh` | PASS |

## secret hygiene H-01〜H-05

| ID | 項目 | 結果 |
|---|---|---|
| H-01 | `.env` に実値を書かない (1Password 参照のみ) | OK (本タスクでは `.env` 未編集) |
| H-02 | MAIL_PROVIDER_KEY / AUTH_SECRET をコードに hard-code しない | OK (`apps/api/src/index.ts` は `env.MAIL_PROVIDER_KEY` 経由でのみ読む) |
| H-03 | log に token / api key / email 全文を出さない | OK (issue/verify は state/reason のみ JSON 化、token は response でのみ返す) |
| H-04 | error response に内部例外 message を含めない | OK (rate-limit は `{error:"RATE_LIMITED"}` のみ、zod 失敗は detail を含めない) |
| H-05 | `wrangler login` ローカル token を使わない | OK (本実装は `scripts/cf.sh` ラッパーに依存しない設計) |

## free-tier 試算 (不変条件 #10)

- D1: magic_tokens テーブルへの insert/select/update/delete のみ。1 人当たり 1 link 平均、月 100 人想定で ~400 row writes/月 → free tier (5M writes/day) 余裕。
- Workers: rate-limit middleware の in-memory bucket は per-isolate のため、追加課金なし。
- Resend: 月 100 通想定 → free tier (3000/月) 内。

## a11y / i18n

- 本タスクは API + proxy 層のみ。UI 表現は別 issue (claude-design-prototype 参照)。
- mail 本文は日本語固定 + plaintext fallback (buildMagicLinkMessage 内)。

## 不変条件 cross-check

| # | 内容 | 検証 |
|---|---|---|
| 2 | publicConsent / rulesConsent | resolveGateState は `getStatus` を経由するため命名遵守 |
| 5 | apps/web から D1 直アクセス禁止 | AC-7 fs-check で機械検証、proxy のみ |
| 7 | memberId と responseId の分離 | SessionUser に両 field を保持、auth-routes.test Z-02 で検証 |
| 9 | /no-access redirect なし | AC-7 fs-check で機械検証。gate 判定は 200/state、verify/session 失敗は 401/reason、mail 失敗は 502/code の JSON で返す |
| 10 | free-tier 維持 | 上記試算 |

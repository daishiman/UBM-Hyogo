# Cloudflare WAF / Rate Limiting Operations Runbook

UT-15: WAF / Rate Limiting ルール設定の運用 runbook。
正本仕様: `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/`

## 1. 概要

`apps/api`（Hono on Workers）と `apps/web`（Next.js on Workers）に対して、
Cloudflare Free プランの範囲で edge security を確立する。

- **WAF Managed Ruleset**: Free Managed Ruleset を Simulate で開始 → 観測 7 日 → Enforce
- **Rate Limiting Rules**: AUTH / ADMIN / ME / PUBLIC の 4 グループ
- **Custom Rules**: HTTPS 強制 / suspicious UA / log 系（無料枠 5 件以内）
- **適用経路**: `bash scripts/cf-waf-apply.sh`（`wrangler` 直叩き禁止）

> Current boundary: this repository wave implements dry-run/config-contract verification only.
> Non-dry-run mutation intentionally exits 13 until Phase 13 G1 approval adds real Cloudflare Rulesets API write support.

## 2. 前提

- `CLOUDFLARE_API_TOKEN` を 1Password に保管（`op://Cloudflare/API Token/credential`）
  - 必要 scope: `Zone.WAF` / `Zone.RateLimit` / `Zone.Read`
- `.env` に `op://...` 参照のみを記載（実値禁止）
- `op` CLI / `jq` がローカルにインストール済み

## 3. 通常オペレーション

### 3.1 Dry-run（差分確認のみ）

```bash
op run --env-file=.env -- bash scripts/cf-waf-apply.sh \
  --mode simulate --dry-run --env staging
```

- exit 0 で標準出力に diff JSON を返す。CI gate 用に `CF_WAF_FORCE_DIFF=1` で exit 14 強制も可能。

### 3.2 Simulate 適用

Current local script guard: the commands below are runtime procedures for the G1 implementation wave.
In the current branch, running without `--dry-run` fails closed with exit 13 to avoid false green.

```bash
op run --env-file=.env -- bash scripts/cf-waf-apply.sh \
  --mode simulate --env staging
op run --env-file=.env -- bash scripts/cf-waf-apply.sh \
  --mode simulate --env production
```

### 3.3 Enforce 移行（gate 通過後のみ）

| gate | 条件 |
| --- | --- |
| 観測期間 | Simulate モードで連続 **7 日間** |
| 誤検知 | Cloudflare Security Events で `action=log` のうち、whitelisted UA / 内部 IP の誤検知が **0 件** |
| 確認 | `--dry-run` で差分 0 |

```bash
op run --env-file=.env -- bash scripts/cf-waf-apply.sh \
  --mode enforce --env production
op run --env-file=.env -- bash scripts/cf-waf-apply.sh \
  --mode enforce --dry-run --env production   # diff = 0 を確認
```

### 3.4 Rollback

Rollback requires the same G1 write implementation as Simulate / Enforce. Before that implementation exists,
rollback remains a runbook contract rather than an executable local operation.

```bash
op run --env-file=.env -- bash scripts/cf-waf-apply.sh \
  --mode simulate --env production
```

`--mode simulate` で即時 Simulate に戻す。Cloudflare ダッシュボードでは
Security Events タブで `action=log` に切り替わったことを確認する。

## 4. 誤検知対応

1. Cloudflare ダッシュボードの **Security Events** で対象リクエストを特定。
2. 該当 rule を `scripts/cf-waf-apply/config.json` で `mode: simulate` に戻す（または expression を絞る）。
3. `--dry-run` で差分確認 → `--mode simulate` で適用。
4. PR としてレビュー（solo 運用でも履歴残し）。

### ホワイトリスト追加手順

`scripts/cf-waf-apply/config.json` の `customRules[*].expression` に
`and (ip.src ne <ALLOW_IP>)` などの除外節を追加する。token 値・実 IP は
PR コメントには貼らず、JSON 側に書く（PII でない範囲で）。

## 5. 監視（Cloudflare Analytics）

- `waf.rateLimitsAdaptiveGroups` で blocked / simulated 件数を確認。
- 急増アラートは UT-16（監視・アラート）で連携予定。

## 6. 既存 app-layer rate limit との責務分離

| 層 | 責務 | 実装 |
| --- | --- | --- |
| edge | bursty IP pattern の即遮断 | Cloudflare Rate Limiting Rules |
| app | 業務固有ロジック（per-email 列挙対策など） | `apps/api/src/middleware/rate-limit-magic-link.ts` 等 |

429 応答の body / header は `apps/api/src/middleware/edge-rate-limit-headers.ts`
の `buildRateLimitedResponse` 経由で同一形式に揃える。

## 7. Pro 移行時 TODO

- OWASP CRS フル Managed Ruleset の有効化
- Bot Management の評価
- 地域ブロック（VPN / CDN 経由の誤ブロックに注意）
- Custom Rules 5 件枠超過時の整理

## 8. 関連リソース

- 正本仕様: `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/`
- 適用スクリプト: `scripts/cf-waf-apply.sh` / `scripts/cf-waf-apply/`
- helper: `apps/api/src/middleware/edge-rate-limit-headers.ts`
- 既存 app rate limit: `apps/api/src/middleware/rate-limit-magic-link.ts` / `rate-limit-self-request.ts`
- Cloudflare CLI ラッパー: `scripts/cf.sh`

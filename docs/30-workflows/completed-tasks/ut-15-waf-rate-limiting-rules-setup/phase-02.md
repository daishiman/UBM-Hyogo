[実装区分: 実装仕様書]

# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_edge_security |
| concern 数 | 3（Rate Limiting Rules / WAF Custom Rules / 責務分離）→ 同一ファイル内 concern セクション分割（lane 数 3） |

## 目的

Phase 1 で固定した想定アーキテクチャを、実装可能な粒度に落とす。具体的には (a) Rate Limiting Rules の path × period × threshold × action マトリクス、(b) WAF カスタムルール仕様（5 件以内）、(c) 既存 app-layer rate limit との責務分離マトリクス、(d) Simulate→Enforce 移行 gate の 4 点を確定する。

## Concern A: Rate Limiting Rules マトリクス

### 対象 path グループ

| グループ | path パターン | 主たる脅威 | 観測元 |
| --- | --- | --- | --- |
| AUTH | `POST /api/auth/magic-link`, `POST /api/auth/*`（callback 系） | email enumeration / magic link bombing | Auth.js + 既存 `rate-limit-magic-link.ts` |
| ADMIN | `*/api/admin/*`（method 全般） | bruteforce / 探索 | `require-admin.ts` middleware |
| ME | `*/api/me/*`（method 全般） | session fixation / 自分情報の高頻度 polling | `me-session-resolver.ts` |
| PUBLIC | `GET /api/public/members*`, `GET /api/public/*` | scraping / 公開 directory への DoS | edge cache + 本ルール |

### 閾値マトリクス（初期値・Simulate 開始）

| グループ | 期間 | threshold（per IP） | action | 備考 |
| --- | --- | --- | --- | --- |
| AUTH | 60 秒 | 10 req | Simulate（→ Enforce: block + retry-after 60） | app-layer の per-email 5/h と独立 |
| ADMIN | 60 秒 | 30 req | Simulate（→ Enforce: managed challenge） | 業務上 burst 可能性低い |
| ME | 60 秒 | 60 req | Simulate（→ Enforce: block + retry-after 30） | 自分の profile 読み出し想定 |
| PUBLIC | 10 秒 | 50 req | Simulate（→ Enforce: block + retry-after 10） | scraping 対策 |

> 上記は Cloudflare Analytics の実トラフィック観測前の保守値。Phase 5 実装前に umbrella spec の運用 gate（観測 7 日 / 誤検知 0）を通して調整する。

### Cloudflare Rulesets API payload 契約

Rate Limiting は zone-level `http_ratelimit` phase entry point ruleset に rule を追加する。各 rule は Cloudflare Rulesets API の通常 rule として、`expression` / `action` / `description` に加え `ratelimit` object を必ず持つ。`ratelimit` には最低限 `characteristics`（例: `ip.src`）, `period`, `requests_per_period`, `mitigation_timeout` を固定し、Enforce 時の response は 429 + JSON body に寄せる。

Custom Rules は `http_request_firewall_custom`、Managed Rules は `http_request_firewall_managed` の entry point ruleset に分離する。実行順は Custom Rules → Rate Limiting Rules → Managed Rules であり、terminal action が出た場合は後続 phase へ進まない。

### Simulate → Enforce 移行条件

| 項目 | 条件 |
| --- | --- |
| 観測期間 | Simulate モードで連続 7 日間 |
| 誤検知件数 | Cloudflare Security Events で `action=log` のうち、whitelisted user-agent / 内部 IP の誤検知が 0 件 |
| Enforce 切替手順 | `bash scripts/cf-waf-apply.sh --mode enforce` を実行し、即時 `bash scripts/cf-waf-apply.sh --dry-run` で差分 0 を確認 |
| ロールバック手順 | `bash scripts/cf-waf-apply.sh --mode simulate` で即時 Simulate に戻す（runbook に明記） |

## Concern B: WAF カスタムルール仕様（5 件以内・無料枠）

| # | 名称 | 条件式 | action | mode |
| --- | --- | --- | --- | --- |
| 1 | block-non-https | `(not ssl)` | block | Enforce（HTTPS 強制） |
| 2 | challenge-suspicious-ua-on-auth | `(http.request.uri.path contains "/api/auth/" and http.user_agent contains "curl")`等 | managed_challenge | Simulate |
| 3 | block-known-bad-asn | `(ip.geoip.asn in {<<TBD>>})` | block | Simulate（観測後決定） |
| 4 | admin-sensitive-path-log | `(http.request.uri.path contains "/api/admin/")` | log | Simulate |
| 5 | 予備枠 | 未使用 | none | 空きとして維持 |

> 5 件枠は無料プラン上限。Rate Limiting は Custom Rules の `rate()` 式ではなく `http_ratelimit` phase の `ratelimit` object で表現する。予備枠は初期導入時に使わず、Pro 移行時に Managed Ruleset OWASP CRS で代替する想定（runbook に TODO 化）。

## Concern C: app-layer rate limit との責務分離

### 既存 app-layer rate limit（変更しない）

| ファイル | 役割 | カウンタ key | window |
| --- | --- | --- | --- |
| `apps/api/src/middleware/rate-limit-magic-link.ts` | Magic Link enumeration 緩和 | per-email + per-IP | 1h |
| `apps/api/src/middleware/rate-limit-self-request.ts` | self request 用 | per-IP | spec 内固定 |

### 責務分離マトリクス

| path | edge: WAF Custom Rule | edge: Rate Limiting Rule | app-layer rate limit | 補足 |
| --- | --- | --- | --- | --- |
| `POST /api/auth/magic-link` | rule#2 (challenge SUS UA) | AUTH 10/60s | per-email 5/h + per-IP 30/h | edge は burst、app は enumeration |
| `GET /api/auth/gate-state` | none | AUTH | per-IP 60/h | 観測のみ |
| `*/api/admin/*` | rule#4 (log) | ADMIN 30/60s | none | 認可は `require-admin.ts` |
| `*/api/me/*` | none | ME 60/60s | none | 自分情報 |
| `GET /api/public/members*` | none | PUBLIC 50/10s | none | scraping 抑制 |
| `apps/web` 全体 | rule#1 (HTTPS) | （任意） burst 100/10s | none | DoS のみ |

### 不変条件

- edge ルールが先に発火しても、app-layer の per-email カウンタは攻撃時のみ加算される設計に変更しない（既存ロジック維持・不変条件 #1）。
- 429 応答の body 形式は `{ "error": "rate_limited", "retryAfterSec": <number> }` に揃える。edge 側はカスタム JSON response、app-layer 側は新規 `edge-rate-limit-headers.ts` helper で揃える。

## Concern D: 設計レイヤーごとの validation matrix

| 検証 | コマンド | gate Phase |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | Phase 6 |
| lint | `mise exec -- pnpm lint` | Phase 6 |
| unit (helper) | `mise exec -- pnpm test --filter @ubm/api edge-rate-limit-headers` | Phase 6 |
| dry-run snapshot | `bash scripts/cf-waf-apply.sh --dry-run > /tmp/out && diff fixtures/cf-waf-apply.snapshot.json /tmp/out` | Phase 6 |
| coverage | `bash scripts/coverage-guard.sh` exit 0 | Phase 6 / 9 / 11 |
| miniflare 429 smoke | `mise exec -- pnpm test apps/api -- --run rate-limit-headers-smoke` | Phase 6 |

## 上流ブロッカー（gate 重複明記の 2 段目）

Phase 1 で挙げたブロッカーは Phase 2 でも依存順序として再掲する。

| ブロッカー | 依存順序 |
| --- | --- |
| Cloudflare zone 確定 | Phase 5 実装前 |
| `CLOUDFLARE_API_TOKEN` のスコープ拡張 | Phase 5 実装前 |
| 本番 Simulate 観測 7 日 | Phase 11 受け入れ前（Enforce 切替時） |

## 参照資料

| 資料 | パス |
| --- | --- |
| `index.md` | 受け入れ基準 |
| `phase-01.md` | 想定アーキテクチャ・実装ターゲット候補 |
| 既存 rate limit | `apps/api/src/middleware/rate-limit-magic-link.ts` / `rate-limit-self-request.ts` |
| Cloudflare CLI ルール | `CLAUDE.md` § シークレット管理 |

## 成果物

| 成果物 | パス |
| --- | --- |
| 設計書（本ファイル） | `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-02.md` |
| Rate Limiting Rules マトリクス | 本ファイル Concern A |
| WAF カスタムルール仕様 | 本ファイル Concern B |
| 責務分離マトリクス | 本ファイル Concern C |

## 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD |
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系 | 80%+ | TBD |

## 完了条件

- [ ] Concern A〜C のマトリクスが固定されている
- [ ] Simulate→Enforce 移行条件が明文化されている
- [ ] WAF カスタムルールが 5 件以内に収まっている（無料枠制約）
- [ ] 既存 app-layer rate limit との二重カウントが起きない設計が示されている
- [ ] validation matrix が実在する script / package 構成と整合（`pnpm typecheck` / `pnpm lint` / `coverage-guard.sh`）
- [ ] coverage 既定閾値（80/80/80/80）が完了条件に明記されている（Phase 6 / 9 / 11）
- [ ] 本 Phase 内のタスクを 100% 実行完了

## 次の Phase

Phase 3: 実装方式レビューと変更対象ファイル群の俯瞰

## 実行タスク

1. Rate Limiting Rules の path / threshold / action matrix を固定する。
2. Cloudflare Rulesets API payload 契約と WAF phase order を固定する。
3. app-layer rate limit との責務分離と validation matrix を確定する。

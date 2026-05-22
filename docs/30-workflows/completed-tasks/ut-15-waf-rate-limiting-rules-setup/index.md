[実装区分: 実装仕様書]

# UT-15: WAF / Rate Limiting ルール設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-15 |
| タスク名 | WAF / Rate Limiting ルール設定 |
| 優先度 | MEDIUM |
| 推奨 Wave | Wave 2+ |
| 状態 | implemented-local-runtime-pending |
| 種別 | implementation（CONST_004 デフォルト適用） |
| visualEvidence | NON_VISUAL（CLI / Cloudflare dashboard ログのため screenshot 取得不可） |
| scope | cloudflare_edge_security |
| 作成日 | 2026-05-09 |
| 関連 Issue | #18（closed のまま umbrella spec から Phase 1-13 化する） |
| 検出元タスク | unassigned-task/UT-15-waf-rate-limiting.md |
| 上流仕様 | docs/30-workflows/unassigned-task/UT-15-waf-rate-limiting.md |
| coverage AC | Statements >=80% / Branches >=80% / Functions >=80% / Lines >=80%（apps/api workspace 既定。スクリプト主体タスクのため Phase 6 で `coverage-guard.sh` を発火させる対象ファイルは `scripts/cf-waf-apply.sh` 周辺の純関数を抽出した TS helper に限定する） |

> **本タスク位置づけ**: GitHub Issue #18 は umbrella spec として close されているが、UT-15 は実運用に必要な edge security 設定である。本 workflow は umbrella の方針を Phase 1-13 の実行可能粒度へ展開し、local implementation artifacts（dry-run wrapper / config / 429 helper / runbook）まで整備する。Cloudflare mutation、7 日観測、production Enforce、commit、push、PR は user approval 後の runtime gate に残る。

## 目的

Cloudflare edge において、`apps/api`（Hono on Workers）と `apps/web`（Next.js on Workers）に対して以下を確立する。

1. WAF Managed Ruleset（Cloudflare Free Managed Ruleset）を Simulate モードで有効化し、誤検知ベースラインを取得した上で Enforce へ移行する経路を確立する。
2. Rate Limiting Rules（Cloudflare Rulesets API の `http_ratelimit` phase / `ratelimit` object、または各 Workers の現行 `[[ratelimits]]` binding）を、認証系・管理系・公開系に分けて宣言的に定義する。
3. 既存の app-layer rate limit（`rate-limit-magic-link.ts` / `rate-limit-self-request.ts`）と edge-layer の責務を分離し、二重カウントによる正常ユーザの誤ブロックを防ぐ。
4. 設定変更を Cloudflare API 経由で再現可能にする `scripts/cf-waf-apply.sh`（IaC スクリプト）を提供し、ダッシュボードでの手作業に依存しない。

## Phase 一覧

| Phase | Link |
| --- | --- |
| 1 | [phase-01.md](phase-01.md) |
| 2 | [phase-02.md](phase-02.md) |
| 3 | [phase-03.md](phase-03.md) |
| 4 | [phase-04.md](phase-04.md) |
| 5 | [phase-05.md](phase-05.md) |
| 6 | [phase-06.md](phase-06.md) |
| 7 | [phase-07.md](phase-07.md) |
| 8 | [phase-08.md](phase-08.md) |
| 9 | [phase-09.md](phase-09.md) |
| 10 | [phase-10.md](phase-10.md) |
| 11 | [phase-11.md](phase-11.md) |
| 12 | [phase-12.md](phase-12.md) |
| 13 | [phase-13.md](phase-13.md) |

## スコープ

### 含む

- Cloudflare WAF Managed Ruleset の Simulate / Enforce 切り替え方針と適用対象 zone / route。
- Rate Limiting Rules の宣言（path × period × threshold × action）。
- `scripts/cf-waf-apply.sh` による Cloudflare API 経由の宣言的適用と `bash scripts/cf.sh` ラッパー前提。
- `docs/runbooks/cloudflare-waf-operations.md`（誤検知対応・ホワイトリスト追加・Simulate→Enforce 切替手順）の整備。
- 429 応答（`retry-after` header 付与）の vitest + miniflare smoke による自動検証（edge ルールに到達しない app-layer fallback 部分のみ）。
- Cloudflare Analytics / Security Events で `waf.rateLimitsAdaptiveGroups` の確認手順をドキュメント化。

### 含まない

- Bot Management（有料）、地域ブロック、mTLS、Cloudflare Pro 専用 Managed Ruleset（OWASP CRS フル）。
- 既存 app-layer rate limit の API 仕様変更。境界整理のみ実施し、互換性は維持する。
- D1 schema 変更、Google Form schema 変更、Auth.js セッション仕様変更（不変条件参照）。
- 本番閾値の最終確定（umbrella spec の通り、本番稼働後 1〜2 週間の Simulate 観測を経て決定。本 task spec は初期閾値と移行 gate のみ確定）。

## 受け入れ基準（AC）

- AC-1: `scripts/cf-waf-apply.sh` を `bash scripts/cf.sh` 互換のラッパー（`op run` で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入）として実装し、`--mode simulate` / `--mode enforce` / `--dry-run` の 3 モードで動作する。
- AC-2: WAF Managed Ruleset（Cloudflare Free Managed Ruleset）が `apps/api` / `apps/web` の両 Worker 配下の zone に Simulate モードで適用されるよう、スクリプトの宣言的構成（JSON / TOML）に固定される。
- AC-3: Rate Limiting Rules が以下 path × threshold で定義される（Phase 2 マトリクス参照）。`/api/auth/magic-link`（POST）/ `/api/admin/*` / `/api/me/*` / `/api/public/members*` の 4 グループを最低限 cover する。
- AC-4: 既存 app-layer rate limit との責務分離が `phase-02.md` の表で明示され、edge ルールが先に発火する path（バーストブロック）と、app-layer のみで処理する path（per-email カウンタ等の業務固有ロジック）が分離される。
- AC-5: 429 応答時の `retry-after` header と JSON エラー body（`{ error: "rate_limited", retryAfterSec }`）が、edge / app-layer 双方で同一形式に揃うことが vitest で検証される。
- AC-6: `docs/runbooks/cloudflare-waf-operations.md` に Simulate→Enforce 移行 gate（観測期間 7 日 / 誤検知 0 件 / Security Events ログ確認）が記述される。
- AC-7: Phase 6 の `bash scripts/coverage-guard.sh` が exit 0（apps/api workspace coverage 既定閾値を満たす）。スクリプト本体（bash）は Phase 11 の NON_VISUAL 代替証跡として `--dry-run` の出力例を記録する。
- AC-8: CI smoke（`.github/workflows/verify-*.yml` の既存 gate に乗せる）で、`apps/api` のローカル dev 環境において 429 が `retry-after` 付きで返ることを miniflare で再現する。
- AC-9: 不変条件（CLAUDE.md）に違反しない。`apps/web` から D1 直接アクセス禁止 / 新 endpoint 追加禁止 / Google Form schema 不変。
- AC-10: 工程内に `wrangler` を直接呼ぶコードを含まず、すべて `bash scripts/cf.sh` 経由で発火する（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）。

## 苦戦箇所・知見（umbrella から継承）

1. **閾値設定の難しさ**: 低すぎると誤ブロック・高すぎると効果なし。Cloudflare Analytics で正常ピークの 3〜5 倍を初期値として固定し、Simulate 1 週間で誤検知 0 を確認後 Enforce 移行する。
2. **WAF → Workers の処理順**: WAF でブロックされたリクエストは Workers に到達しない。app-layer rate limit との責務境界が崩れると業務ロジック由来の特例（admin emergency unblock 等）が edge で先にブロックされる事故が起きるため、Phase 2 で path-level の責務マトリクスを必須化する。
3. **無料枠の制約**: Cloudflare Free は Managed Ruleset の一部のみ・カスタムルール 5 件まで・Rate Limiting Rules も無料枠範囲が限定的。本 task では「無料枠で達成可能な最小集合」を spec の前提に置き、Pro 移行時の差分は `docs/runbooks/cloudflare-waf-operations.md` の TODO に記録する。
4. **地域ブロックの副作用**: 本 task では実施しないが、将来検討時に VPN / CDN 経由アクセスで誤ブロックが起きうる旨を runbook に注記する。
5. **既存 app-layer rate limit との二重カウント**: `rate-limit-magic-link.ts` は per-email + per-IP の業務ロジック付き。edge で per-IP burst を先に弾く場合、app-layer の per-email カウンタはほぼ常に 0 に近づくため、edge と app-layer は「責務が違う層」として共存させる（edge: 攻撃者の bursty pattern / app-layer: enumerate 攻撃の業務ロジック）。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | UT-06 本番デプロイ完了 | 本番トラフィック観察前提 |
| 上流（参考） | カスタムドメイン設定 | zone-level WAF を最終的に独自ドメインで適用する場合 |
| 並走可 | UT-16 監視・アラート | WAF ブロック急増アラートを後続で連携 |

## 関連リソース

- 元仕様: `docs/30-workflows/unassigned-task/UT-15-waf-rate-limiting.md`
- 既存 app-layer rate limit: `apps/api/src/middleware/rate-limit-magic-link.ts` / `apps/api/src/middleware/rate-limit-self-request.ts`
- Cloudflare CLI ラッパー: `scripts/cf.sh`
- WAF 方針の前例: `docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/`
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（Cloudflare / セキュリティ要件起点）

## workflow_state

`implemented-local-runtime-pending`

# UT-25-DERIV-02-FU-01: sheets-auth healthcheck の internal alert binding 配線

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DERIV-02-FU-01 |
| タスク名 | `API_INTERNAL_BASE_URL` の wrangler.toml 配線と `CF_WEBHOOK_AUTH_SECRET` fallback 検証 |
| 優先度 | HIGH |
| 推奨Wave | UT-25-DERIV-02 staging dry-run 直前（同一 wave、ブロッカー） |
| 状態 | consumed |
| 作成日 | 2026-05-22 |
| 既存タスク組み込み | なし（UT-25-DERIV-02 本体は spec / 実装完了済み、本タスクは deploy 配線の構造的欠落を独立切り出し） |
| 親タスク | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` |
| 検出元 | UT-25-DERIV-02 Phase 12 後の独立 review（2026-05-22） |
| canonical workflow | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/` |
| consumed_at | 2026-05-24 |

> 2026-05-24 消化注記: 現コードの受信側 `verify-cf-webhook-auth.ts` は `CF_WEBHOOK_AUTH_SECRET` 単一照合のため、元スコープの「別値 `INTERNAL_ALERT_TOKEN` 投入」は採用しない。`API_INTERNAL_BASE_URL` vars 配線と `CF_WEBHOOK_AUTH_SECRET` fallback 回帰テストで実装完了。

## 目的

`apps/api/src/scheduled/sheets-auth-healthcheck.ts` は `env.API_INTERNAL_BASE_URL` と `env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET` を参照して `/internal/alert-relay` を叩く設計だが、`apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `API_INTERNAL_BASE_URL` が未登録だったため、deploy しても healthcheck は `reason: "missing API_INTERNAL_BASE_URL or token"` で no-op に落ちる。現コードの受信側は `CF_WEBHOOK_AUTH_SECRET` のみ照合するため、別値 `INTERNAL_ALERT_TOKEN` は投入せず、既存 `CF_WEBHOOK_AUTH_SECRET` fallback と base URL 配線で alert が発火できる状態へ直す。

## スコープ

### 含む

- `apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `API_INTERNAL_BASE_URL` を追加（非機密 URL）
- `INTERNAL_ALERT_TOKEN` を新規投入しない方針の明文化（別値投入は relay 401 を誘発）
- `apps/api/src/env.ts` の optional マークを healthcheck 実行 env では required に格上げするか、`required-when-deployed` を明示する spec 文書化
- staging deploy 後の binding 存在確認手順（`bash scripts/cf.sh secret list --env staging` で name presence のみ確認）
- `INTERNAL_ALERT_TOKEN` 不在時の fallback として `CF_WEBHOOK_AUTH_SECRET` を共有する是非の判断（現状コードは fallback 経路あり）

### 含まない

- alert-relay 受信側の token 検証ロジック変更（既存ロジックを再利用）
- SA key 自体のローテーション（UT-25-DERIV-01 のスコープ）
- `runtime-evidence` artifact path 定義（UT-25-DERIV-02 Phase 11 内）
- Slack / mail provider 側の受信先設定（UT-07 / UT-08）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-25-DERIV-02 Phase 12 完了 | healthcheck 実装本体が完了している必要 |
| 上流 | UT-25 Phase 13 完了 | `scripts/cf.sh secret put` の Cloudflare API token 経路が稼働済み |
| 下流 | UT-25-DERIV-02 Phase 11 staging dry-run | 本タスク完了が dry-run の前提（alert 発火に必須） |

## 着手タイミング

UT-25-DERIV-02 Phase 11 の staging secret invalidation dry-run の**直前**。本タスクなしで dry-run しても alert は飛ばない。

## 苦戦箇所・知見

**1. `wrangler.toml` `[vars]` は top-level 継承されない**
`apps/api/wrangler.toml` 冒頭コメントの通り、top-level `[vars]` は named environment へ継承されない仕様。`[env.staging.vars]` と `[env.production.vars]` の**両方**に同名 var を書く必要がある。片方だけだと sibling 環境で healthcheck が no-op になる。

**2. `INTERNAL_ALERT_TOKEN` を投入しない**
token は機密値なので `[vars]` に書かない。さらに現コードでは受信側 `verify-cf-webhook-auth.ts` が `CF_WEBHOOK_AUTH_SECRET` のみ照合するため、別値 `INTERNAL_ALERT_TOKEN` を Cloudflare Secrets に投入すると relay が 401 で drop する。今回の消化では `CF_WEBHOOK_AUTH_SECRET` fallback を正本化し、必要な runtime 確認は `CF_WEBHOOK_AUTH_SECRET` の name presence に限定する。

**3. `env.ts` の optional binding 表現と deploy required 表現の乖離**
`env.ts` で `optional` にしたまま deploy 必須 binding とすると、unit test では env 抜けでも通るが runtime healthcheck が静かに no-op する。spec 上「deploy 時に required」の明示と、healthcheck の log を「no-op vs failure」で区別できる evidence trail を残す。

**4. `CF_WEBHOOK_AUTH_SECRET` との fallback 共有**
現コードは `INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET` で fallback する。同一 token を共有すると key rotation 時の影響範囲が広がる。MVP では fallback 維持で良いが、運用フェーズで分離する判断点を spec に残す。

**5. AUTH_SECRET binding 復旧 #855 の再発防止**
staging で env binding が抜けても Workers tail では readable error が出にくい。新 binding 追加時は wrangler.toml 3 環境（dev/staging/production vars）と secret 両面で parity 確認を spec gate 化する。

## 完了条件

- `apps/api/wrangler.toml` `[env.staging.vars]` / `[env.production.vars]` に `API_INTERNAL_BASE_URL` が登録されている
- `CF_WEBHOOK_AUTH_SECRET` が staging / production Cloudflare Secrets に存在し、`scripts/cf.sh secret list --env staging` / `--env production` で name presence が確認できる
- staging deploy 後の Workers tail で `event: 'sheets.auth.healthcheck'` log が `reason: "missing API_INTERNAL_BASE_URL or token"` ではなくなる
- `apps/api/src/env.ts` の type 表現と spec 文書が「deploy-required」で整合
- `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` 配下の rollback / runbook 経路から本タスクへの逆参照が追加されている

## 関連ファイル

- `apps/api/src/scheduled/sheets-auth-healthcheck.ts:90-102`
- `apps/api/src/env.ts:111-112`
- `apps/api/wrangler.toml:51-63`（`[env.production.vars]`）、`:132-152`（`[env.staging.vars]`）
- `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-12/implementation-guide.md` Part 13
- `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`

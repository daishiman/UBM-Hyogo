# U-FIX-CF-ACCT-01: Cloudflare API Token Scope Audit

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01 |
| タスク名 | Cloudflare API Token のスコープ最小化監査 |
| 優先度 | HIGH |
| 状態 | unassigned |
| 作成日 | 2026-04-30 |
| 由来 | FIX-CF-ACCT-ID-VARS-001 Phase 12 |

## 苦戦箇所【記入必須】

- 対象:
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.github/workflows/backend-ci.yml`
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.github/workflows/web-cd.yml`
  - Cloudflare Dashboard → My Profile → API Tokens
- 症状: `CLOUDFLARE_ACCOUNT_ID` の namespace drift（Secret 参照）が判明した文脈で、`CLOUDFLARE_API_TOKEN` の scope が wrangler-action / D1 migration / Pages deploy の各ステップで最小化されている根拠が無く、token 値はログ出力できないため権限突合が困難だった。
- 参照: `docs/30-workflows/fix-cf-account-id-vars-reference/outputs/phase-12/implementation-guide.md`、`docs/30-workflows/fix-cf-account-id-vars-reference/outputs/phase-12/unassigned-task-detection.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| token 権限が広すぎて漏洩時の影響が大きい | 高 | Workers / Pages / D1 / Account Read に必要な権限だけを表化し、不要権限を削除する |
| 権限を削りすぎて main deploy が失敗する | 高 | staging で D1 migration / Workers deploy / Pages deploy を順に検証してから production token に適用する |
| token 値や account 情報が成果物に混入する | 中 | 値は記録せず、権限名・検証結果・日時だけを Phase 11 evidence に残す |
| staging / production 同一 token を使い続ける | 中 | U-FIX-CF-ACCT-02 と整合させ、token 分離方針を ADR 化 |

## 検証方法

### 単体検証

```bash
# token 値はログに出さず、参照漏れだけを確認
rg -n "CLOUDFLARE_API_TOKEN" .github/workflows
gh api repos/daishiman/UBM-Hyogo/actions/secrets | jq '.secrets[].name' | rg "CLOUDFLARE_API_TOKEN"
```

期待: backend-ci.yml / web-cd.yml で `secrets.CLOUDFLARE_API_TOKEN` のみ参照、Variable には存在しない。

### 統合検証

```bash
# staging 経由で最小権限 token の動作を確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
```

期待: 全コマンドが exit=0、権限不足 (`Authentication error`) が出ないこと。失敗時は Cloudflare Dashboard で token に付与された Resources / Permissions を確認し、不足分を補う。

## スコープ

### 含む

- Cloudflare API Token の必要権限を Workers / Pages / D1 / Account 単位で表化
- staging token を最小権限で再発行し、`gh api` の Secret 値を更新する手順
- production token への適用順序と rollback 手順を Phase 11 evidence に残す

### 含まない

- `CLOUDFLARE_ACCOUNT_ID` の Variable 化（→ FIX-CF-ACCT-ID-VARS-001 で完了済み）
- staging / production token 分離本体・wrangler warning 対応（→ `U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`）
- token 値そのものの記録（記録自体が禁止事項）

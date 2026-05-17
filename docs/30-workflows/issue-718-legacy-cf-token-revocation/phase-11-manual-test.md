# Phase 11: 手動テスト・revocation 実施

## メタ情報

- phase: 11 / manual-test
- prev: phase-10-final-review
- next: phase-12-documentation
- visualEvidence: NON_VISUAL

## 目的

operator-approved 経路で legacy `CLOUDFLARE_API_TOKEN` を Cloudflare dashboard 上で物理失効し、redacted evidence を取得する。

## 前提

- Phase 10 GO 判定済み
- staging/production deploy が新 secret 経路で複数回 green を確認済み

## 実行手順

### Step 11.1: revocation 直前 health check

```bash
bash scripts/cf.sh whoami           > outputs/phase-11/health-before-whoami.log    2>&1
bash scripts/cf.sh d1 list          > outputs/phase-11/health-before-d1-list.log   2>&1
echo "exit=$?" >> outputs/phase-11/health-before-d1-list.log
```

期待: 新 token 経路で exit 0、user 名 / D1 list が取得できる。log 内に token 値・suffix・account id が混入していないことを redaction-check で確認。

### Step 11.2: operator approval 取得

operator に以下を伝え approval を取得:

- 失効対象 token の display name / scope category（token id / suffix / account id / value hash は evidence 非記録。operator が画面上でのみ確認）
- 失効方法（Cloudflare dashboard 手操作 / `bash scripts/cf.sh` API 経路のいずれか）
- 失効実施時刻

approval 内容を `outputs/phase-11/operator-approval-record.md` に記録（display name / scope category / 承認者識別のみ。token id / suffix / account id / token 値 / 1Password URI は記録しない）。

### Step 11.3: revocation 実施

operator が指定した経路で legacy token を revoke する。コマンド名と exit code のみを redacted 形式で記録:

```
# 例（実コマンド・実値は記録しない）
[2026-MM-DDThh:mm:ssZ] revocation_method=cloudflare_dashboard
[2026-MM-DDThh:mm:ssZ] target_token_name=cloudflare-api-token-legacy-account-scoped
[2026-MM-DDThh:mm:ssZ] result=revoked
```

`outputs/phase-11/revocation-evidence.md` に上記形式で記録する。

### Step 11.3b: evidence ledger 分離

`outputs/phase-11/evidence-ledger.md` に read-only evidence と mutation evidence を分離して記録する。

| ledger | file |
| --- | --- |
| read-only | `main.md`, `manual-smoke-log.md`, `link-checklist.md`, `health-before-whoami.log`, `health-before-d1-list.log`, `legacy-token-usage-inventory.md` |
| mutation | `operator-approval-record.md`, `revocation-evidence.md`, `github-secrets-*-after.md`, `onepassword-item-status.md` |

### Step 11.4: revocation 直後 health check

```bash
bash scripts/cf.sh whoami    > outputs/phase-11/health-after-whoami.log   2>&1
bash scripts/cf.sh d1 list   > outputs/phase-11/health-after-d1-list.log  2>&1
```

期待: 新 token 経路で exit 0 を維持。失敗時は即座に operator-approved rotation で rollforward。

### Step 11.5: 旧 token 経路の 401 確認

仮に旧 token を環境変数に再投入した場合、API が `Unauthorized` を返すこと。実 token 値を扱うため operator のみが実施し、結果（success/failure と HTTP status のみ）を redacted で記録:

```
[2026-MM-DDThh:mm:ssZ] legacy_token_smoke_test=expected_unauthorized
[2026-MM-DDThh:mm:ssZ] http_status=401
```

### Step 11.6: GitHub Secrets / 1Password 最終整合

```bash
gh secret list --env staging    | awk '{print $1}' > outputs/phase-11/github-secrets-staging-after.md
gh secret list --env production | awk '{print $1}' > outputs/phase-11/github-secrets-production-after.md
```

期待: `backend-ci.yml` から legacy 無修飾 `CLOUDFLARE_API_TOKEN` の `with.apiToken` 参照が消えていること。`web-cd.yml` の environment-scoped `CLOUDFLARE_API_TOKEN` は current runtime 名として残ってよいが、値が legacy token ではないことを operator-only evidence で確認する。値・URI・hash は記録しない。

1Password item の状態は operator が dashboard 上で確認し、item name と status のみを `outputs/phase-11/onepassword-item-status.md` に記録（vault 名・URI・値は記録しない）。

### Step 11.7: redaction 最終確認

```bash
bash scripts/redaction-check.sh outputs/phase-11/
```

期待: exit 0、検出 0 件。

## 成果物

- `outputs/phase-11/health-before-whoami.log`
- `outputs/phase-11/health-before-d1-list.log`
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/evidence-ledger.md`
- `outputs/phase-11/health-after-whoami.log`
- `outputs/phase-11/health-after-d1-list.log`
- `outputs/phase-11/operator-approval-record.md`
- `outputs/phase-11/revocation-evidence.md`
- `outputs/phase-11/legacy-token-smoke-test.md`
- `outputs/phase-11/github-secrets-staging-after.md`
- `outputs/phase-11/github-secrets-production-after.md`
- `outputs/phase-11/onepassword-item-status.md`
- `outputs/phase-11/redaction-check-result.md`

## 完了条件

- [ ] Cloudflare dashboard 上の legacy token が `revoked`
- [ ] 直前 / 直後 health check 4 ファイルが exit 0
- [ ] 旧 token 経路が 401 を返す（smoke test）
- [ ] GitHub Secrets / 1Password 整合済み
- [ ] redaction check exit 0

## タスク100%実行確認【必須】

- [ ] 成果物 11 ファイルすべて作成
- [ ] evidence に token 値・suffix・account id が混入していない

## 次Phase

phase-12-documentation.md

# Phase 5: 実装ランブック — U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC → Cloudflare short-lived credential 移行

[実装区分: 実装仕様書]

判定根拠: 本タスクは `.github/workflows/deploy-*.yml` と `scripts/cf.sh` のコード変更を伴い、intermediate IdP（AWS STS / 1Password Connect 等）の trust policy 構成、Cloudflare API Token 取得経路の置換、production への 24h 並行運用 / 長命 Token 失効までを含む。CI / Cloudflare アカウントへの副作用が確実に発生するため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 5 / 13 |
| wave | u-fix-cf-acct-01-deriv |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 実測オペレーターが本ファイルだけを上から順になぞれば、(a) intermediate IdP の trust policy 構成、(b) `scripts/cf.sh` の OIDC 経路実装、(c) `.github/workflows/deploy-*.yml` の置換、(d) staging-first 7 日 green、(e) production cutover、(f) 24h 並行運用、(g) 長命 Token 失効、(h) rollback runbook 整備、までを漏れなく完了できる runbook を提供する。各ステップに (1) コマンドまたは編集差分、(2) 期待出力、(3) 失敗時の戻し方、(4) Phase 6 異常系への分岐条件、(5) approval gate G1〜G4 を併記する。

## 前提チェックリスト

- [ ] U-FIX-CF-ACCT-01 が Phase 11 verified（最小 4 scope: `Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read` が staging / production 双方で実測確定済）
- [ ] intermediate IdP の選定が確定済（一次候補は `AWS STS`。`1Password Connect` / `Cloudflare 直接短命 Token API` は PoC 成立時のみ差替）
- [ ] GitHub Environments `staging` / `production` の required reviewers / branch protection が UT-GOV-001 ベースラインで設定済
- [ ] AWS STS trust policy と job-scoped retrieval の PoC 方針が承認済み。1Password はローカル legacy / rollback 保管の正本であり、CI OIDC 主経路では直接使わない
- [ ] 作業端末で `mise install` 完了（Node 24.15.0 / pnpm 10.33.2）
- [ ] rollback を実行する場合のみ 1Password CLI (`op`) サインイン済み
- [ ] 本タスクの worktree 内で実行（`pwd` が `.worktrees/...u-fix-cf-acct-01-deriv-01...`）

```bash
export EVID=docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-11/evidence
mkdir -p "$EVID"/{idp,cf-script,workflow,verify-token,parallel-run,revoke,runbook}
```

## 採用 IdP（Phase 2 で確定したものを記録）

本 runbook は **AWS STS 経路** を主シナリオとして記述する。1Password Connect 経路は lifetime ≤ 1h の実測保証が弱いため appendix 扱いにし、採用する場合は Phase 2 / Phase 7 / Phase 11 の evidence contract を同時に更新する。

## ステップバイステップ実行手順

### Step 0: 上流確認と現状 inventory

```bash
# U-FIX-CF-ACCT-01 verified 確認
gh pr list --state merged --search "U-FIX-CF-ACCT-01 in:title" --limit 5 \
  | tee "$EVID/idp/upstream-prs.log"

# 既存 deploy workflow の長命 Token 参照を全件抽出
grep -RnE 'CLOUDFLARE_API_TOKEN|secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/ \
  | tee "$EVID/workflow/legacy-token-references-before.log"

# scripts/cf.sh の現状取得
cp scripts/cf.sh "$EVID/cf-script/cf.sh.before"
```

期待: 上流 PR が merged 済。長命 Token 参照箇所が `.github/workflows/web-cd.yml` / `backend-ci.yml` / `d1-migration-verify.yml` 等に列挙される。
失敗時: 上流未完なら本 Phase は着手禁止。`docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/` の Phase 11 verified を待つ。
分岐: legacy 参照が想定外の workflow にも存在 → Phase 6 シナリオ A03（漏れ workflow）。

### Step 1: intermediate IdP（AWS STS）trust policy 構成

GitHub OIDC を AWS IAM の OIDC provider として登録し、IAM Role の trust relationship を GitHub repo / branch / workflow に限定する。

#### 1-1. AWS IAM OIDC provider 登録（手動 or IaC、1 回のみ）

```bash
# 既登録確認（既に他タスクで登録済の可能性あり）
aws iam list-open-id-connect-providers \
  | tee "$EVID/idp/oidc-providers.json"
```

未登録時の登録（手動 console もしくは IaC）:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`
- Thumbprint: GitHub 公式ドキュメント記載値（自動取得設定推奨）

#### 1-2. IAM Role 作成 — `github-actions-cloudflare-deploy`

trust policy（`trust-policy.json`）:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:daishiman/UBM-Hyogo:ref:refs/heads/dev",
            "repo:daishiman/UBM-Hyogo:ref:refs/heads/main",
            "repo:daishiman/UBM-Hyogo:environment:staging",
            "repo:daishiman/UBM-Hyogo:environment:production"
          ]
        }
      }
    }
  ]
}
```

権限ポリシー（最小権限）: `secretsmanager:GetSecretValue` を `arn:aws:secretsmanager:<region>:<acct>:secret:cloudflare/api-token-*` のみに限定。

```bash
aws iam create-role \
  --role-name github-actions-cloudflare-deploy \
  --assume-role-policy-document file://trust-policy.json \
  | tee "$EVID/idp/iam-role-create.json"
```

期待: Role ARN が返る。
失敗時: trust policy JSON の `sub` claim を緩めない。`pull_request` / fork PR を絶対に含めない（Phase 6 シナリオ A01 の対象）。

#### 1-3. AWS Secrets Manager に長命 Token 保管

> 「短命化」の意味: GitHub Actions が直接 IAM Role に AssumeRoleWithWebIdentity → 一時 STS credential（最大 1h）→ Secrets Manager から Cloudflare API Token を取得 → job 終了で破棄。長命 Token 自体は AWS 側に隔離され、GitHub Secrets からは消える。

```bash
op read "op://Cloudflare/CF_API_TOKEN/credential" \
  | aws secretsmanager create-secret \
      --name cloudflare/api-token-deploy \
      --secret-string file:///dev/stdin \
  > "$EVID/idp/secretsmanager-create.json"
```

期待: secret ARN が返る。実値は `evidence` に絶対に保存しない（`--secret-string file:///dev/stdin` 経由で stdin 渡し）。
失敗時: 既存 secret あれば `put-secret-value` で更新。

[1Password Connect の場合]: 上記 1-1〜1-3 を、1Password Connect Server の Service Account JWT 発行 + scope 設定に置き換える。`op connect` で短命 token を取得し、その scope で Cloudflare API Token を pull する設計とする。

> **G1 ゲート（IdP 構成完了承認）**: ここまでの構成を user に提示し、staging 試験投入の承認を得る。

### Step 2: `scripts/cf.sh` 改修 — `CF_AUTH_MODE` 環境変数で切替

OIDC 経路と legacy（長命 Token 直接）経路を `CF_AUTH_MODE` で切替する。OIDC 経路では AWS STS の一時 credential が AWS CLI に既に注入されている前提（GitHub Actions の `aws-actions/configure-aws-credentials` step が事前実行済）。

`scripts/cf.sh` への追記イメージ:

```bash
# scripts/cf.sh 冒頭の env 注入直前に挿入
: "${CF_AUTH_MODE:=legacy}"  # legacy | oidc

resolve_cf_token() {
  case "$CF_AUTH_MODE" in
    oidc)
      # AWS STS の一時 credential が AWS CLI に注入済である前提
      # Secrets Manager から Cloudflare API Token を取得し env に注入
      local token
      token="$(aws secretsmanager get-secret-value \
        --secret-id cloudflare/api-token-deploy \
        --query SecretString --output text)" || {
          echo "[cf.sh] OIDC token resolve failed" >&2
          return 1
        }
      export CLOUDFLARE_API_TOKEN="$token"
      unset token
      ;;
    legacy)
      # 既存経路: op run --env-file=.env または GitHub Secrets が CLOUDFLARE_API_TOKEN を提供
      : "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN not set in legacy mode}"
      ;;
    *)
      echo "[cf.sh] unknown CF_AUTH_MODE: $CF_AUTH_MODE" >&2
      return 1
      ;;
  esac
}

resolve_cf_token || exit 1
```

セキュリティ要件:

- `set +x` の範囲を関数内で厳守し、token 値が log に出ない。
- 関数内 local 変数 `token` は使用後 `unset` する。
- 標準出力には ARN / scope の確認結果のみ出して、token 値は決して echo しない。
- `CLOUDFLARE_API_TOKEN` を `env | grep` 等で吐き出すデバッグコードを書かない。

```bash
# diff 保存
diff -u "$EVID/cf-script/cf.sh.before" scripts/cf.sh \
  > "$EVID/cf-script/cf.sh.diff"
```

DoD:
- `bash -n scripts/cf.sh` が syntax OK
- `shellcheck scripts/cf.sh` が新規警告ゼロ
- `CF_AUTH_MODE=legacy` で従来挙動が変わらない（既存タスクの smoke で確認）

失敗時: shellcheck 警告は即修正。CONST_007 に従い「後の Phase で修正」と先送りしない。
分岐: token 値が log に漏れる経路が見つかる → Phase 6 シナリオ A05（secret leak）。

### Step 3: `.github/workflows/web-cd.yml` / `backend-ci.yml` 編集

#### 3-1. permissions 設計

deploy job に **`id-token: write` + `contents: read` のみ** を job スコープで付与。`pull_request` event の job には絶対に付与しない（fork PR 漏洩防止 / Phase 6 シナリオ A01）。

#### 3-2. YAML 抜粋（backend-ci.yml / web-cd.yml の deploy job）

```yaml
name: deploy-api

on:
  push:
    branches: [dev, main]
  workflow_dispatch:

permissions:
  contents: read
  # id-token は job スコープで限定付与する（top-level では付与しない）

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    permissions:
      id-token: write
      contents: read
    env:
      CF_AUTH_MODE: oidc
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/github-actions-cloudflare-deploy
          aws-region: ap-northeast-1
          role-session-name: gha-cf-deploy-${{ github.run_id }}
          role-duration-seconds: 3600  # 1h cap（短命要件）

      - uses: jdx/mise-action@v2

      - run: mise exec -- pnpm install --frozen-lockfile

      - name: deploy api
        run: bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
```

`web-cd.yml` も同様の構造で `apps/web/wrangler.toml` を指定。

#### 3-3. legacy 参照の削除

```bash
# secrets.CLOUDFLARE_API_TOKEN 参照が残っていないことを確認
! grep -RnE 'secrets\.CLOUDFLARE_API_TOKEN(_STAGING)?' .github/workflows/backend-ci.yml \
                                                       .github/workflows/web-cd.yml \
                                                       .github/workflows/d1-migration-verify.yml \
  | tee "$EVID/workflow/legacy-token-references-after.log"
```

期待: hit 0。
失敗時: 残存箇所を削除。CONST_007 に従い別 Phase へ送らない。
分岐: 他 workflow（CI / preview など）にも legacy 参照あり → Phase 6 シナリオ A03。

#### 3-4. `pull_request_target` 不採用の再確認

```bash
grep -RnE 'pull_request_target' .github/workflows/ \
  | tee "$EVID/workflow/pr-target-scan.log"
```

期待: hit 0。
失敗時: `pull_request_target` を即削除。fork PR からの secret 露出経路を作らない。

> **G2 ゲート（workflow 編集レビュー承認）**: 3-1〜3-4 の編集差分を user に提示し、staging branch (`dev`) への push 承認を得る。

### Step 4: staging branch 投入と short-lived token 検証

```bash
# dev ブランチで commit / push（本 runbook はあくまで Phase 11 オペレーター向けで、commit/push は Phase 13 で実施）
# 以下は Phase 11 実測時のコマンド例
git checkout dev
git pull origin dev
# Phase 13 commit を取り込んだ後の動作確認
gh workflow run backend-ci.yml --ref dev | tee "$EVID/workflow/run-deploy-api-staging.log"
gh workflow run web-cd.yml --ref dev | tee "$EVID/workflow/run-deploy-web-staging.log"

# run id 抽出
RUN_ID_API=$(gh run list --workflow backend-ci.yml --branch dev --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID_API" --exit-status \
  | tee "$EVID/workflow/run-watch-deploy-api-staging.log"
```

#### 4-1. 取得 token の verify

deploy job 実行中に Cloudflare API で token の lifetime / scope を検証する step を workflow に組み込み、log を artifact に出さず Cloudflare 側 audit と突合できるよう `created_on` のタイムスタンプのみ取得:

```yaml
      - name: verify token scope
        run: |
          curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            https://api.cloudflare.com/client/v4/user/tokens/verify \
            | jq '{success, result: {id: .result.id, status: .result.status, not_before: .result.not_before, expires_on: .result.expires_on}}'
```

> 注意: token 値そのものは絶対に log / artifact / stdout に出さない。`jq` で id / status / not_before / expires_on のみ抽出。

期待: `success: true`、`status: "active"`、scope に最小 4 scope のみが含まれる。Cloudflare Token object の `expires_on` が存在しない、または 1h を超える場合は、AWS STS session (`role-duration-seconds: 3600`) と job-scoped retrieval が短命境界であることを evidence に明記し、Cloudflare Token 自体を「短命」と表現しない。
失敗時: scope 過剰なら IAM Role / broker の参照先 secret を再確認。AWS STS session が 1h を超えるなら IAM Role の `MaxSessionDuration` を 3600 にキャップ。
分岐: `success: false` → Phase 6 シナリオ A02（OIDC token 検証失敗）。

#### 4-2. 7 日連続 green 観測

```bash
# 毎日 1 回（cron / 手動）
gh run list --workflow backend-ci.yml --branch dev --limit 10 --json status,conclusion,createdAt \
  | tee -a "$EVID/parallel-run/staging-7day-green.jsonl"
```

DoD: 7 日間で `conclusion="success"` のみ、`failure` 発生時は当該 run を Phase 6 シナリオ A02/A04 に分岐し起票。

### Step 5: fork PR 漏洩防止の pen test 準備（Phase 6 で実行）

本 Step では「pen test の前提（`pull_request` event の job に `id-token: write` が付与されないこと）」のみ workflow grep で確認する。実際の pen test シナリオは Phase 6 で実行。

```bash
# pull_request event を持つ job に id-token: write が付いていないことを scan
yq '.. | select(has("on")) | .on' .github/workflows/*.yml > /tmp/workflow-events.yml
grep -A 50 'pull_request' .github/workflows/*.yml \
  | grep -E 'id-token:\s*write' \
  && { echo "DANGER: pull_request job has id-token:write"; exit 1; } \
  || echo "fork-PR id-token isolation: OK"
```

期待: `OK`。
失敗時: 即停止。該当 job から `id-token: write` を削除し再 push。

### Step 6: 24h 並行運用（staging 7 日 green 後）

GitHub Secrets に長命 `CLOUDFLARE_API_TOKEN` を**残置したまま**、`CF_AUTH_MODE=oidc` で OIDC 経路を主、`CF_AUTH_MODE=legacy` でいつでも切戻し可能な状態を 24h 維持する。

```bash
# legacy 切戻し試験（Phase 6 で 1 回実施）
gh workflow run backend-ci.yml --ref dev -f auth_mode=legacy \
  | tee "$EVID/parallel-run/legacy-fallback-trial.log"
```

> 切戻し用 input は `workflow_dispatch.inputs.auth_mode` で受け、env 上書きする実装を workflow に入れておく。

DoD: 24h 期間中、staging deploy が `oidc` 経路で連続 green、かつ `legacy` 切戻しが 1 回成功すること。

### Step 7: production cutover（main branch）

> **G3 ゲート（production cutover 承認）**: staging 7 日 green + 24h 並行成功を user に提示し、production 投入の承認を得る。

```bash
# main へ merge は Phase 13 で実施。本 Step は Phase 11 で main 投入後の観測
gh run watch <main run id> --exit-status \
  | tee "$EVID/workflow/run-watch-deploy-api-production.log"

# verify token scope（4-1 と同手順）の production 版 evidence
# → workflow 内 step の log artifact ではなく、Cloudflare audit 側で突合する（Phase 9 で詳述）
```

production 24h 観測:

```bash
# 24h 経過後、Cloudflare audit log で旧長命 Token の last_used_on を確認
curl -s -H "Authorization: Bearer $(op read 'op://Cloudflare/CF_API_TOKEN/credential')" \
  "https://api.cloudflare.com/client/v4/user/tokens/<LEGACY_TOKEN_ID>" \
  | jq '{id: .result.id, last_used_on: .result.last_used_on, status: .result.status}' \
  | tee "$EVID/parallel-run/legacy-token-last-used.json"
```

期待: `last_used_on` が 24h 観測開始時刻より古いまま更新されない（OIDC 経路が実際に主経路として動いている証跡）。
失敗時: `last_used_on` が更新されている → 旧 token を呼ぶ workflow が残存。Phase 6 シナリオ A03 へ分岐。

### Step 8: 長命 Token 失効

> **G4 ゲート（長命 Token 失効承認）**: production 24h 観測完了 + `last_used_on` 不更新を user に提示し、失効を承認得る。

```bash
# 1. Cloudflare Dashboard で revoke、または API
curl -s -X DELETE \
  -H "Authorization: Bearer $(op read 'op://Cloudflare/CF_ROOT_TOKEN/credential')" \
  "https://api.cloudflare.com/client/v4/user/tokens/<LEGACY_TOKEN_ID>" \
  | tee "$EVID/revoke/cf-token-revoke.json"

# 2. GitHub Secrets から削除
gh secret remove CLOUDFLARE_API_TOKEN --env staging
gh secret remove CLOUDFLARE_API_TOKEN --env production
gh secret list --env staging | tee "$EVID/revoke/gh-secrets-staging-after.txt"
gh secret list --env production | tee "$EVID/revoke/gh-secrets-production-after.txt"

# 3. 1Password 側の旧 token entry を archive（削除はしない・監査用に保管）
# 手動操作。実行記録のみ evidence に残す
```

期待: Cloudflare 側 `result.status="disabled"`、GitHub Secrets 一覧に `CLOUDFLARE_API_TOKEN` が無い。
失敗時: revoke 失敗時は即停止し、GitHub Secrets を**削除しない**。先に Cloudflare 側 revoke が成功してから GitHub Secrets を消す順序を厳守（誤って Secrets だけ消すと rollback 不能になる）。

### Step 9: rollback runbook 整備

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に「OIDC 失敗時の長命 Token 24h 一時再注入」セクションを追加する。

セクション内容（編集差分の構造）:

1. 発動条件: OIDC 経路で 30 分連続 deploy 失敗、または production health 5xx 連続発生
2. 手順:
   - 1Password の archive から `CF_API_TOKEN` 旧エントリを復活（または新規発行）
   - `gh secret set CLOUDFLARE_API_TOKEN --env <staging|production>` で再注入（op:// 参照は使わず stdin 渡し）
   - 当該 deploy workflow を `workflow_dispatch` の `auth_mode=legacy` で再実行
3. revert 期限: **再注入から 24h 以内** に必ず Cloudflare Dashboard で revoke + GitHub Secrets 削除
4. 並行 incident: revert 期限超過は CONST_007 違反として `unassigned-task/` に起票（`task-deriv-01-rollback-overrun-XXX.md`）

```bash
diff -u docs/00-getting-started-manual/specs/15-infrastructure-runbook.md.before \
        docs/00-getting-started-manual/specs/15-infrastructure-runbook.md \
  > "$EVID/runbook/runbook-update.diff"
```

DoD: diff が evidence に保存され、上記 4 項目を網羅。

### Step 10: aiworkflow-requirements 反映準備

`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` および `deployment-secrets-management.md` に以下を反映する編集ドラフトを作成（実 commit は Phase 13）:

- `secrets.CLOUDFLARE_API_TOKEN` 直接参照を削除し、OIDC + intermediate IdP 経路を正本とする記述
- `CF_AUTH_MODE` env contract（`oidc` / `legacy`）の追記
- 緊急 rollback 手順（24h 期限付き）の参照リンク

```bash
# ドラフトを evidence に保存（Phase 13 で apply）
cp .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
   "$EVID/runbook/deployment-gha.md.before"
cp .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
   "$EVID/runbook/deployment-secrets-management.md.before"
```

## Approval gate 一覧

| Gate | 位置 | 判定者 | 承認条件 |
| --- | --- | --- | --- |
| G1 | Step 1 完了直後 | user | IAM Role / Secrets Manager / OIDC provider 構成が完了し evidence 保存済 |
| G2 | Step 3 完了直後 | user | workflow YAML 編集差分レビュー OK / fork PR 隔離 OK |
| G3 | Step 6 完了直後（staging 7d green + 24h 並行成功） | user | production cutover 開始の妥当性確認 |
| G4 | Step 7 完了直後（production 24h 観測 + `last_used_on` 不更新） | user | 長命 Token 失効の妥当性確認 |

## 想定エラーと対処

| エラー | 原因 | 対処 |
| --- | --- | --- |
| `An error occurred (AccessDenied) when calling the AssumeRoleWithWebIdentity` | trust policy の `sub` claim が一致しない | claim を repo / branch / environment 単位で精査。fork PR を含めない |
| `Token validation failed` (Cloudflare `/user/tokens/verify`) | Secrets Manager の値が古い / scope 不足 | 1Password から再 pull / scope を最小 4 scope に再構成 |
| `expires_on - not_before > 3600` | IAM Role の `MaxSessionDuration` が 1h 超 | Role 設定で 3600 秒以下にキャップ |
| `last_used_on` が並行運用中も更新される | 漏れ workflow が legacy 経路を呼んでいる | `grep -RnE 'CLOUDFLARE_API_TOKEN' .github/workflows/` で全件再走査 |
| revoke API が 404 | token id 取得ミス | `/user/tokens` 一覧で正しい id を再取得し再実行 |

## secret 露出禁止ルール

- workflow log で `CLOUDFLARE_API_TOKEN` / `aws_*_key` / `oidc_token` を含む行を `::add-mask::` 登録（`echo "::add-mask::$VALUE"` を使うときは `set +x` 範囲内）
- `actions/upload-artifact` の対象に **`.env`、`/tmp/cred*`、`*token*.json`、`secretsmanager-*.json` を含めない**（`.gitignore` 相当の deny list を artifact 設定で明示）
- `wrangler` / `aws` の verbose log（`--debug` / `AWS_DEBUG=1`）は CI で禁止
- evidence 保存時、token 値を一切ファイルに書き出さない。verify 結果は `id` / `status` / `not_before` / `expires_on` のみに限定

## Rollback 早見表

| 事象 | コマンド |
| --- | --- |
| OIDC 経路 deploy 失敗 1 回 | `workflow_dispatch.inputs.auth_mode=legacy` で当該 workflow を再実行（Step 6 の手順） |
| OIDC 経路 30 分連続失敗 | Step 9 runbook に従い長命 Token を 24h 一時再注入 |
| production health 5xx | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env production` |
| 長命 Token 失効後の緊急復旧 | 1Password archive から復活 → GitHub Secrets stdin 再注入 → revert 期限を `outputs/phase-11/main.md` に明記 |

## 異常系への分岐条件サマリ

| Step | 失敗時 | Phase 6 シナリオ |
| --- | --- | --- |
| Step 1 | trust policy 不適切 | A01 fork PR / pull_request_target 経由漏洩 |
| Step 4-1 | `success: false` / scope 過剰 | A02 OIDC token 検証失敗 |
| Step 0 / Step 3-3 | 漏れ workflow に legacy 残存 | A03 漏れ workflow |
| Step 4-1 | `expires_on - not_before > 3600` | A04 lifetime 超過 |
| Step 2 / 任意 | log に token 値混入 | A05 secret leak |
| Step 7 | `last_used_on` 更新 | A03 |
| Step 8 | revoke 失敗 / Secrets 先行削除 | A06 失効順序違反 |
| Step 9 | rollback 24h 期限超過 | A07 rollback overrun |

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/index.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-03.md`（Option D）
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `scripts/cf.sh` / `scripts/with-env.sh`
- GitHub OIDC ハードニング: <https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect>
- Cloudflare API Token: <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01（最小 4 scope の確定）、UT-25-DERIV-04（OIDC + secret 配置基盤の共有）
- 下流: U-FIX-CF-ACCT-01-DERIV-03（rotation runbook が「Trust Policy 更新」概念に置換される）

## 多角的チェック観点

- 不変条件継承: 最小 4 scope（Workers Scripts:Edit / D1:Edit / Cloudflare Pages:Edit / Account Settings:Read）が OIDC 後 credential にも保持されている
- fork PR / `pull_request_target` 経路の id-token 露出が遮断されている（Step 5 grep + Phase 6 pen test）
- short-lived 要件: lifetime ≤ 1h（Step 4-1 verify と IAM Role MaxSessionDuration の二重制約）
- staging-first: production cutover は staging 7 日 green + 24h 並行成功を必須前提とする
- rollback の物理経路（24h 限定の長命 Token 一時再注入）が runbook 化されている

## サブタスク管理

- [ ] Step 0〜10 と G1〜G4 approval gate の対応を確定
- [ ] Step 2 の `scripts/cf.sh` 改修案を shellcheck pass まで持ち込む
- [ ] Step 3 の `.github/workflows/deploy-*.yml` 編集差分を全 deploy workflow にわたって確定
- [ ] Step 9 の `15-infrastructure-runbook.md` 追記セクションを Phase 13 commit 用にドラフト
- [ ] Step 10 の aiworkflow-requirements 反映ドラフトを evidence に保存
- [ ] `outputs/phase-05/main.md` を作成

## 成果物

- `outputs/phase-05/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。
- 10 ステップが番号順に実行可能なコマンド or 編集差分として定義されている
- 4 approval gate（G1〜G4）が runbook の停止位置として明示されている
- 各 Step に「失敗時の戻し方」と「Phase 6 への分岐条件」が併記されている
- secret 露出禁止ルールが Step 横断で適用されている
- rollback コマンドと 24h 期限が runbook に明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] CONST_007 に従い、未確定事項を Phase 6 / Phase 11 への明示分岐として記録している
- [ ] secret 値が evidence / log / artifact のいずれにも残らない設計になっている

## 次 Phase への引き渡し

Phase 6 へ:

- Step 1〜10 の各 Step で発生し得る異常事象 7 種（A01〜A07）
- fork PR pen test シナリオ（id-token 非発行の確認）
- 漏れ workflow 全件 grep の検証コマンド
- short-lived lifetime 超過時の re-issue 経路
- Cloudflare 障害時のフェイルオーバー基準
- audit ログ突合手順（`created_on` / `expires_on` / `last_used_on`）

## 実行タスク

- [ ] phase-05 の既存セクションに記載した手順・検証・成果物作成を実行する。

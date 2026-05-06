# Phase 8: DRY 化 — U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC → Cloudflare short-lived credential 移行

[実装区分: 実装仕様書]

判定根拠: 本 Phase は `.github/workflows/web-cd.yml` / `backend-ci.yml` および `scripts/cf.sh` における OIDC 認証経路の重複を、(a) reusable workflow / composite action、(b) `scripts/cf.sh` 内の単一関数 `resolve_cf_token`、(c) aiworkflow-requirements の single source of truth、の 3 軸で整理する設計仕様を定義する。仕様自体は markdown だが、後続 Phase の実コード変更（Phase 11 実測時に Phase 5 ランブックから直接呼び出される）に依存するため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 8 / 13 |
| wave | u-fix-cf-acct-01-deriv |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_OFF |

## 目的

Phase 5 ランブックで定義した OIDC 認証経路の実装が、`web-cd.yml` / `backend-ci.yml` および将来の deploy 系 workflow で重複しないよう、以下の 3 軸で DRY 化する設計を確定する。

1. GitHub Actions の federate step（`aws-actions/configure-aws-credentials` ＋ verify token）を **composite action または reusable workflow** に抽出する。
2. `scripts/cf.sh` の OIDC 経路ロジックを **単一関数 `resolve_cf_token`** に集約し、deploy / d1 / tail 等のサブコマンドが共通利用する。
3. aiworkflow-requirements 正本（`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / `deployment-secrets-management.md`）に **OIDC 経路の single source of truth** を反映し、本タスク完了後の他タスクが workflow / cf.sh の実装ではなく仕様書を参照するようにする。

## 重複検出対象

| # | 断片 | 推定発生箇所 | 推定回数 |
| --- | --- | --- | --- |
| W1 | `aws-actions/configure-aws-credentials@v4` step（role-to-assume / region / role-session-name / role-duration-seconds） | `web-cd.yml`、`backend-ci.yml`、将来追加される deploy 系（cron / migration / preview など） | 2〜N |
| W2 | verify token step（`/user/tokens/verify` を呼び lifetime / scope を check） | 上記同箇所 | 2〜N |
| W3 | `permissions: id-token: write` の job スコープ宣言 | 上記同箇所 | 2〜N |
| W4 | `CF_AUTH_MODE: oidc` env 設定 | 上記同箇所 | 2〜N |
| S1 | `scripts/cf.sh` 内の token 取得ロジック（`aws secretsmanager get-secret-value` → `export CLOUDFLARE_API_TOKEN`） | `cf.sh` 内のサブコマンド `deploy` / `d1` / `tail` / `rollback` / `deployments` で都度実行されないよう先頭で 1 回だけ走る | 1（関数化により集約） |
| D1 | deployment-gha.md の OIDC セクション、deployment-secrets-management.md の `CF_AUTH_MODE` セクション | aiworkflow-requirements 内で複数 reference から参照 | 2〜3 |

## DRY 化方針

### 方針 1: composite action 採用（reusable workflow ではなく）

理由:

- deploy job 全体を呼び出す reusable workflow にすると、`environment: ${{ ... }}` の動的解決が重複する複雑性が出る
- 認証 step だけを抽出する composite action のほうが「`uses:` 1 行で取り込み、deploy step 自体は呼び出し側で記述」という読みやすさを保てる
- 本タスク完了後の他タスク（cron / migration / preview）が deploy 構造を自由に変えつつ認証だけ統一できる

配置先（予約のみ・本タスクでは作成しない）: `.github/actions/cf-oidc-auth/action.yml`

#### composite action インターフェース（予約）

```yaml
# .github/actions/cf-oidc-auth/action.yml （Phase 11 で実装、本 Phase は予約）
name: cf-oidc-auth
description: GitHub OIDC を起点に AWS STS 経由で Cloudflare deploy credential を job 環境に注入する
inputs:
  aws-role-arn:
    required: true
    description: AssumeRoleWithWebIdentity 対象の IAM Role ARN
  aws-region:
    required: false
    default: ap-northeast-1
  cf-secret-id:
    required: false
    default: cloudflare/api-token-deploy
    description: broker / AWS Secrets Manager で解決する Cloudflare deploy credential の secret id
  expected-scope-set:
    required: false
    default: "Account Settings:Read,Cloudflare Pages:Edit,D1:Edit,Workers Scripts:Edit"
    description: verify-token で確認する最小 scope
runs:
  using: composite
  steps:
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ inputs.aws-role-arn }}
        aws-region: ${{ inputs.aws-region }}
        role-session-name: gha-cf-${{ github.run_id }}
        role-duration-seconds: 3600
    - name: resolve cloudflare deploy credential
      shell: bash
      run: |
        echo "::add-mask::$(aws secretsmanager get-secret-value --secret-id "${{ inputs.cf-secret-id }}" --query SecretString --output text)"
        # 本体の export は scripts/cf.sh の resolve_cf_token に集約するため、
        # composite action では env 注入のみを行う（scripts/cf.sh が CF_AUTH_MODE=oidc を読み取る）
        echo "CF_AUTH_MODE=oidc" >> "$GITHUB_ENV"
    - name: verify token (no value logging)
      shell: bash
      run: |
        # CF_AUTH_MODE=oidc 状態で scripts/cf.sh の resolve_cf_token を呼ぶラッパで token verify を実施
        bash scripts/cf.sh token verify --expected-scope "${{ inputs.expected-scope-set }}"
```

> 上記は **インターフェース予約のみ**。本 Phase ではファイルを作成しない。Phase 11 実測の準備時に Phase 5 ランブック Step 3 と本予約をベースに実体を作成する。

#### 呼び出し側の DRY 化（backend-ci.yml / web-cd.yml の置換イメージ）

Phase 5 で示した YAML 抜粋から、認証 3 step（configure-aws-credentials / resolve / verify）を 1 行に集約:

```yaml
jobs:
  deploy:
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/cf-oidc-auth
        with:
          aws-role-arn: arn:aws:iam::<ACCOUNT_ID>:role/github-actions-cloudflare-deploy
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - run: bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
```

`web-cd.yml` も同じ `uses: ./.github/actions/cf-oidc-auth` で再利用。

### 方針 2: `scripts/cf.sh` の `resolve_cf_token` 単一関数化

Phase 5 Step 2 で示した実装を、サブコマンド毎に呼び出すのではなく **`cf.sh` の最上位で 1 回だけ呼び出す** 構造を確定する。

```bash
# scripts/cf.sh 構造（Phase 5 で実装する内容を Phase 8 で構造化）

#!/usr/bin/env bash
set -euo pipefail

: "${CF_AUTH_MODE:=legacy}"

resolve_cf_token() {
  case "$CF_AUTH_MODE" in
    oidc)
      local token
      token="$(aws secretsmanager get-secret-value \
        --secret-id "${CF_SECRET_ID:-cloudflare/api-token-deploy}" \
        --query SecretString --output text)" || return 1
      export CLOUDFLARE_API_TOKEN="$token"
      unset token
      ;;
    legacy)
      : "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN not set in legacy mode}"
      ;;
    *)
      echo "[cf.sh] unknown CF_AUTH_MODE: $CF_AUTH_MODE" >&2
      return 1
      ;;
  esac
}

# サブコマンド分岐より前に必ず 1 回だけ呼ぶ
resolve_cf_token

# 既存サブコマンド（deploy / d1 / tail / rollback / deployments / token verify ...）
case "${1:-}" in
  deploy)         shift; exec mise exec -- npx wrangler deploy "$@" ;;
  d1)             shift; exec mise exec -- npx wrangler d1 "$@" ;;
  tail)           shift; exec mise exec -- npx wrangler tail "$@" ;;
  rollback)       shift; exec mise exec -- npx wrangler rollback "$@" ;;
  deployments)    shift; exec mise exec -- npx wrangler deployments "$@" ;;
  whoami)         exec mise exec -- npx wrangler whoami ;;
  token)          shift; cmd_token "$@" ;;
  *) echo "usage: cf.sh <deploy|d1|tail|rollback|deployments|whoami|token verify>"; exit 2 ;;
esac
```

`cmd_token verify` は composite action の verify step から呼ばれる薄いラッパ:

```bash
cmd_token() {
  case "${1:-}" in
    verify)
      shift
      local expected_scope=""
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --expected-scope) expected_scope="$2"; shift 2 ;;
          *) shift ;;
        esac
      done
      curl -sfL -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        https://api.cloudflare.com/client/v4/user/tokens/verify \
        | jq --arg expected "$expected_scope" '
            if .success != true then error("token verify failed") else
              {success, id: .result.id, status: .result.status,
               not_before: .result.not_before, expires_on: .result.expires_on}
            end'
      ;;
    *) echo "usage: cf.sh token verify [--expected-scope ...]"; return 2 ;;
  esac
}
```

設計上の制約:

- `resolve_cf_token` は idempotent。複数回呼んでも副作用が `CLOUDFLARE_API_TOKEN` env の上書きのみ
- `set +x` の範囲を関数内に閉じ込め、token 値が log に出ない
- `CLOUDFLARE_API_TOKEN` を export する以外の経路（ファイル書き出し / stdout echo）を作らない
- legacy 経路では既存の `op run --env-file=.env` 経由 GitHub Secrets が `CLOUDFLARE_API_TOKEN` を提供する前提に変更なし（後方互換）

### 方針 3: aiworkflow-requirements の single source of truth

`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` および `deployment-secrets-management.md` を **OIDC 経路の正本** に再構成し、本タスク完了後の他タスク（CI / cron / preview / migration）は仕様書だけを参照すれば deploy workflow を実装できる状態にする。

反映項目（Phase 5 Step 10 でドラフト化、Phase 13 で commit）:

- `secrets.CLOUDFLARE_API_TOKEN` 直接参照の禁止（legacy 残置は緊急 rollback の 24h 限定経路のみ）
- composite action `cf-oidc-auth` のインターフェース契約（inputs / outputs / 呼び出し例）
- `CF_AUTH_MODE` env contract（`oidc` / `legacy`）
- IAM Role の trust policy ベースライン（`sub` claim の許容パターンと禁止パターン）
- AWS Secrets Manager の secret id 命名規約（`cloudflare/api-token-deploy` 等）
- 緊急 rollback 24h 期限の参照リンク（`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`）
- 1Password Connect 経路を採用した場合の差分（参考付録）

## 共通化判断基準

| 再利用回数 | 扱い |
| --- | --- |
| ≥ 2 | composite action / `resolve_cf_token` 関数として共通化（本 Phase は予約のみ、Phase 11 実装時に作成） |
| = 1 | inline のまま（過剰抽象化を避ける） |

OIDC 認証経路は最低 backend-ci / web-cd の 2 箇所で発生するため W1〜W4 はすべて共通化対象。

## リファクタ抑制ルール（CONST_007 と整合）

1. **本タスク内では `.github/actions/cf-oidc-auth/` 配下を新規作成しない**。Phase 11 実測準備時に Phase 5 / Phase 8 の予約を統合して 1 度で実装する。
2. composite action の作成と `scripts/cf.sh` の関数化は 1 つの PR（Phase 13）にまとめる。分割すると workflow が成立しない期間が発生する。
3. inline と共通化どちらの場合も「実行コマンド・保存先・期待出力」は Phase 5 で確定したものから一意でなければならない（インターフェース契約を変えない）。

## 既存共通モジュールの再利用箇所マトリクス

| 既存モジュール | 用途 | 本タスクでの呼出箇所 |
| --- | --- | --- |
| `scripts/cf.sh` | wrangler 直接呼び出し禁止のラッパ | `resolve_cf_token` を最上位で呼び、全サブコマンドで `CLOUDFLARE_API_TOKEN` 環境を共通利用 |
| `scripts/with-env.sh` | `op run --env-file=.env` で 1Password 参照を実値展開 | legacy 経路（CI 外 / ローカル）でのみ使用。OIDC 経路は CI のみで AWS STS が代替 |
| `mise exec --` | Node 24 / pnpm 10 の固定 | `cf.sh` 内、composite action `mise-action` |
| `op` CLI | 1Password 参照解決 | legacy 経路時のみ。OIDC 経路では使用しない |

## 09c production smoke タスクとの共有候補

| 共有候補 | 本タスクでの扱い | 09c での想定 |
| --- | --- | --- |
| composite action `cf-oidc-auth` | 本タスクで予約・実装 | 09c production deploy execution でも `uses: ./.github/actions/cf-oidc-auth` で再利用（重複コードなし） |
| `cf.sh token verify` サブコマンド | 本タスクで実装 | 09c の verify step が同じコマンドを呼ぶ |
| trust policy ベースライン | 本タスクで確定 | 09c の trust policy は本タスクで作成した IAM Role を再利用 |

## 起票テンプレ（共通化が困難と判定された場合）

`docs/30-workflows/unassigned-task/task-deriv-01-cf-oidc-auth-helpers-001.md` を以下のテンプレで起票する:

```md
# task-deriv-01-cf-oidc-auth-helpers-001

## title
GitHub Actions composite action `cf-oidc-auth` の実装と `scripts/cf.sh` の `resolve_cf_token` 関数化

## scope
- `.github/actions/cf-oidc-auth/action.yml`
- `scripts/cf.sh` の `resolve_cf_token` / `cmd_token verify` 関数化
- aiworkflow-requirements への single source of truth 反映

## motivation
backend-ci / web-cd / 将来の deploy 系 workflow で OIDC 認証 step が重複しないよう、composite action と shared shell function に集約する。

## refs
- docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-05.md
- docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-08.md
- scripts/cf.sh
- .claude/skills/aiworkflow-requirements/references/deployment-gha.md

## DoD
- composite action の inputs / outputs が phase-08.md の予約に一致する
- `scripts/cf.sh` の `resolve_cf_token` が CF_AUTH_MODE=legacy で後方互換
- aiworkflow-requirements に composite action の呼び出し例が記載されている
```

> 本タスクでは原則「共通化を実装し PR に含める」方針。本テンプレは Phase 5 / Phase 13 で実装が分離せざるを得なくなった例外時のみ起票する。

## 実行手順（本 Phase の作業）

1. 重複検出対象 W1〜W4 / S1 / D1 を Phase 5 ランブック草案に対して再カウントし、回数 ≥ 2 の断片を確定する。
2. ≥ 2 の断片について「Phase 13 PR で実装する（既定）」or「`task-deriv-01-cf-oidc-auth-helpers-001.md` 起票（例外）」を判定する。
3. 既存共通モジュール（`scripts/cf.sh` / `scripts/with-env.sh` / `mise exec`）の呼出箇所マトリクスを Phase 5 ランブックの該当 step に紐付けて記録する。
4. composite action のインターフェース予約と `resolve_cf_token` 関数の関数シグネチャを `outputs/phase-08/main.md` に記録する。
5. 本 Phase ではコマンドを実行せず、判定結果と起票有無のみを記録する。

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-01.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-02.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-03.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-05.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `scripts/cf.sh` / `scripts/with-env.sh`
- `CLAUDE.md`（Cloudflare 系 CLI 実行ルール）

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01（最小 4 scope）、UT-25-DERIV-04（OIDC 基盤共有）
- 下流: 09c production deploy execution（composite action / `cf.sh token verify` を再利用）

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 を侵さない（共通化のためにロジックを apps/web へ移さない）
- production への副作用が混入しない（共通化候補も `--env staging` 既定）
- secret / token 値が共通化スクリプト経由でも漏れない（`add-mask` / 関数 local + `unset` を必須化）
- 過剰抽象化を避ける（再利用回数 = 1 は inline のまま）
- CONST_007: 「Phase XX で共通化」と先送りしない。Phase 13 PR で実装または起票のどちらかで完結

## サブタスク管理

- [ ] W1〜W4 / S1 / D1 の重複回数を Phase 5 ランブック草案に対して数える
- [ ] 共通化対象を「Phase 13 PR で実装」/「起票」のいずれかに振り分ける
- [ ] composite action のインターフェース予約（inputs / outputs / 呼び出し例）を確定
- [ ] `scripts/cf.sh` の `resolve_cf_token` / `cmd_token verify` の関数シグネチャを確定
- [ ] aiworkflow-requirements 反映項目リストを確定
- [ ] `outputs/phase-08/main.md` を作成し、判定結果と起票有無を記録

## 成果物

- `outputs/phase-08/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。
- 重複検出対象 W1〜W4 / S1 / D1 の回数判定が記録されている
- 共通化対象について Phase 13 実装 / 起票 の判定が確定している
- composite action のインターフェース予約が inputs / outputs / 呼び出し例で揃っている
- `scripts/cf.sh` の `resolve_cf_token` / `cmd_token verify` の関数シグネチャが確定している
- aiworkflow-requirements 反映項目リストが揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で実装、deploy、commit、push、PR を実行していない
- [ ] CONST_007 違反（「Phase XX で共通化」型の先送り）が無い
- [ ] composite action / `resolve_cf_token` / aiworkflow-requirements の 3 軸が single source of truth として整合している

## 次 Phase への引き渡し

Phase 9 へ:

- 重複検出結果（W1〜W4 / S1 / D1）と Phase 13 実装 / 起票判定
- composite action のインターフェース予約
- `resolve_cf_token` / `cmd_token verify` の関数シグネチャ
- aiworkflow-requirements 反映項目リスト
- 既存共通モジュール再利用箇所マトリクス

## 実行タスク

- [ ] phase-08 の既存セクションに記載した手順・検証・成果物作成を実行する。

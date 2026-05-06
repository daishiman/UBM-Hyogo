# Phase 2: 設計 — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: Phase 1 の DoD（AC1〜AC9）を実環境で達成するための (a) intermediate IdP 選定、(b) workflow YAML 構造、(c) trust policy 設計、(d) `scripts/cf.sh` 改修方針、(e) staging-first 段階展開計画、(f) rollback 設計、(g) 監査突合設計を確定する。設計対象に CI 認証経路の置換と Cloudflare 上の credential 操作という副作用が含まれるため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 2 / 13 |
| wave | post-u-fix-cf-acct-01 |
| mode | parallel |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で固定した 13 evidence と 4 approval gate を、実装可能な設計に落とす。

## intermediate IdP 選択肢比較

Cloudflare API は GitHub OIDC を IAM に直接統合しないため（苦戦箇所 #1）、以下 3 経路を比較する。

| # | 経路 | 仕組み | 長所 | 短所 | 推奨 |
| --- | --- | --- | --- | --- | --- |
| A | **AWS STS（OIDC federation） + Secrets Manager / broker で job-scoped CF credential を解決** | GitHub OIDC → IAM Role AssumeRoleWithWebIdentity → STS credential（max 3600s）→ broker が Cloudflare deploy credential を job に注入 | OIDC federation がネイティブ。AWS 監査ログが詳細。subject claim 最小化が宣言的。lifetime ≤ 1h を STS 側で検証できる | AWS アカウント運用が増える。Cloudflare API Token 自体の短命発行可否は PoC で確認し、不可なら GitHub Secrets 排除 + STS lifetime 短命化として扱う | ◯（一次候補） |
| B | **1Password Connect / Service Account JWT** | GitHub OIDC → 1Password Service Account 経由で `op://` から Token を pull | 既存の 1Password 運用と整合。`scripts/cf.sh` の `op run` パターンを CI でも踏襲しやすい | 「短命」は 1Password 側 Token rotation で実現する間接設計になりやすく、lifetime ≤ 1h の実測保証が弱い | △（代替） |
| C | **Cloudflare 直接の短命 Token API** | Cloudflare が公式提供する場合のみ利用可能 | 中継不要 | 2026-05 時点で公式の OIDC ネイティブ短命 Token 発行 API は限定的。要再調査 | △（要 PoC） |

**MVP 推奨**: A（AWS STS）を一次候補とする。B（1Password Connect / Service Account JWT）と C（Cloudflare 直接の短命 Token API）は PoC 成立時のみ差替候補とし、差し替える場合は Phase 1-13 / aiworkflow-requirements / evidence contract を同一 wave で更新する。

> 採用判定の最終決定は Phase 5 PoC ランブックで行う。本 Phase ではアーキテクチャの抽象を固定する。

## 実行アーキテクチャ

```
[GitHub Actions (deploy job)]
   │ permissions:
   │   id-token: write
   │   contents: read
   │   (他 job は id-token: none で固定)
   │
   │ ① OIDC token request
   ▼
[GitHub OIDC Issuer]
   │   sub: repo:daishiman/UBM-Hyogo:ref:refs/heads/{dev,main}
   │        environment:{staging,production}
   │
   │ ② JWT exchange
   ▼
[intermediate IdP (primary: AWS STS)]
   │
   │ ③ job-scoped credential を解決
   ▼
[GitHub Actions runner 環境変数 CLOUDFLARE_API_TOKEN]
   │
   │ ④ bash scripts/cf.sh deploy (CI モード) で deploy
   ▼
[Cloudflare staging/production]
```

ローカル端末は従来通り `op run --env-file=.env` で 1Password から Token を揮発注入する。CI では AWS STS を一次候補とする OIDC 経路でのみ Token を受領する。Cloudflare API Token 自体の per-job 短命発行が PoC 不成立の場合、短命性は AWS STS session (`<= 3600s`) と job-scoped retrieval で保証し、Cloudflare Token object が 1 時間で失効すると断言しない。

## workflow YAML 設計

### canonical workflow inventory

| 実在 workflow | 用途 | DERIV-01 での扱い |
| --- | --- | --- |
| `.github/workflows/web-cd.yml` | Web deploy | OIDC 経路への置換対象 |
| `.github/workflows/backend-ci.yml` | API deploy + D1 migrations | OIDC 経路への置換対象 |
| `.github/workflows/d1-migration-verify.yml` | D1 migration verification | staging token 参照があるため影響確認対象 |

旧ドラフトの deploy 専用ファイル名は現行 repository に存在しないため、本仕様では上記 3 workflow 名へ正規化する。

### 想定パス

実存ファイル名は Phase 5 でリポジトリ実態を確認するが、設計上の想定パスを以下とする:
- `.github/workflows/web-cd.yml`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/d1-migration-verify.yml`

リポジトリ実態が単一 workflow に統合されている場合、job matrix で同等の構造を成立させる。

### deploy job 構造（before / after）

**before（長命 Token 経路）:**
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

**after（OIDC 短命 credential 経路）:**
```yaml
permissions:
  contents: read
  id-token: none   # workflow 全体は none、deploy job だけ write に上書き

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - name: Federate to intermediate IdP and acquire short-lived CF Token
        id: cf_token
        uses: <intermediate-idp-action>@<pinned-sha>
        with:
          subject: ${{ github.repository }}:ref:${{ github.ref }}
          environment: ${{ github.event.deployment.environment || 'staging' }}
      - name: Deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ steps.cf_token.outputs.token }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          CF_AUTH_MODE: oidc-short-lived
        run: bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

ポイント:
- `permissions: id-token: write` は **deploy job のみ** に付与。workflow 全体や他 job では `id-token: none`
- 短命 Token は `steps.cf_token.outputs.token` 経由で env 注入し、後続 step 完了で破棄
- `CF_AUTH_MODE` フラグで `scripts/cf.sh` が CI モード / ローカルモードを切り替える
- `CLOUDFLARE_ACCOUNT_ID` は GitHub Variables（非機密）から取得（CLAUDE.md 既定）

## trust policy 設計

intermediate IdP（経路 B 採用時）の trust policy で許容する subject claim:

| environment | branch | 許容 subject pattern | 用途 |
| --- | --- | --- | --- |
| staging | `dev` | `repo:daishiman/UBM-Hyogo:ref:refs/heads/dev` + `environment:staging` | dev push deploy |
| staging | (any) | `repo:daishiman/UBM-Hyogo:environment:staging` | `workflow_dispatch` での staging deploy |
| production | `main` | `repo:daishiman/UBM-Hyogo:ref:refs/heads/main` + `environment:production` | main push deploy |
| production | (any) | `repo:daishiman/UBM-Hyogo:environment:production` | `workflow_dispatch` での production deploy（required reviewers が前提） |

禁止 subject:
- `*` ワイルドカード
- `repo:daishiman/UBM-Hyogo:pull_request`（fork PR 漏洩防止 / 苦戦箇所 #3）
- `repo:daishiman/UBM-Hyogo:ref:refs/pull/**`

trust policy は staging / production で **物理的に分離**（IdP 側の Service Account / Role を分ける）し、staging 側 credential が production scope を取得できないようにする（AC3）。

## secret 経路の置換

| 旧経路 | 新経路 |
| --- | --- |
| `secrets.CLOUDFLARE_API_TOKEN`（長命、GitHub Secrets） | `steps.cf_token.outputs.token`（短命、OIDC issued、env 経由のみ） |
| repo-level Secret として永続 | job 完了で破棄。GitHub Actions ログにマスキング |
| rotation = Token 再発行 + Secrets 更新 | rotation = trust policy 更新（subject 追加 / 削除） |

長命 Token は 1Password に**緊急 rollback 用**として保管継続（24h 限定再注入のため）。30 日 green 達成後に 1Password から削除し完全廃止。

## fork PR / `pull_request_target` 漏洩防止設計

- `pull_request_target` イベントを使う workflow は本タスクの scope では追加しない
- deploy workflow は `push`（protected branch）と `workflow_dispatch` のみで発火
- fork PR が deploy workflow を発火させない（GitHub の既定挙動 + branch protection）
- `id-token: write` を持つ job が再利用 workflow（reusable workflow）として外部から呼ばれないことを Phase 11 で grep 検証

## `scripts/cf.sh` 改修方針

改修ポイント（実コード差分は Phase 5 ランブックで詳述）:

1. 環境変数 `CF_AUTH_MODE` を読み取り、以下のいずれかで動作:
   - `oidc-short-lived`: 既に環境に注入された `CLOUDFLARE_API_TOKEN` をそのまま使用（`op run` を skip）
   - `local-1password`（既定）: `op run --env-file=.env` で 1Password から注入
2. `CF_AUTH_MODE=oidc-short-lived` のとき、token lifetime を Cloudflare API（`GET /user/tokens/verify` 等）で確認し 1h を超えていれば fail-fast
3. esbuild バージョン整合の自動解決と `mise exec` 経由の Node 24 / pnpm 10 保証は既存挙動を維持

## staging-first 段階展開計画

| 段階 | 期間 | 内容 | 進行ゲート |
| --- | --- | --- | --- |
| S1: trust policy 反映 | 0.5 日 | intermediate IdP の trust policy を staging environment に反映 | G1 |
| S2: staging cutover | 0.5 日 | `deploy-*-staging.yml` を OIDC 経路に切替コミット & PR | G2 |
| S3: staging 7 日 green | 7 日 | 平日の dev push deploy / 週末 `workflow_dispatch` で計 7 日連続 green を `staging-7day.md` に記録 | - |
| S4: production cutover | 0.5 日 | `deploy-*-production.yml` を OIDC 経路に切替 | G3 |
| S5: 24h 並行運用 | 1 日 | 旧長命 Token を失効せず併存。新経路で 24h 連続成功を記録 | - |
| S6: 旧 Token 失効 | 0.5 日 | Cloudflare API / Dashboard で旧 Token 失効、evidence 取得 | G4 |
| S7: 30 日 green 監視 | 30 日 | OIDC 経路単独で 30 日連続 green を確認後、1Password から旧 Token を完全削除 | - |

## rollback 設計

長命 Token を 1Password Vault `Cloudflare/UBM-Hyogo-Emergency-Rollback` に保管継続（鍵は admin のみアクセス可）。

| 事象 | rollback 手順 |
| --- | --- |
| OIDC 経路で deploy が連続失敗（30 分以上停止） | 1. user 承認 取得 → 2. 1Password から op:// 参照を一時的に GitHub Secrets `CLOUDFLARE_API_TOKEN_EMERGENCY` に入力 → 3. workflow を「emergency mode」（別ブランチの commit）で `secrets.CLOUDFLARE_API_TOKEN_EMERGENCY` 参照に切替 → 4. deploy を実行 → 5. 24h 以内に Secrets を削除し emergency commit を revert |
| intermediate IdP（1Password Connect 等）の障害 | 同上。1Password Connect 障害は 1Password ステータス確認後に判断 |
| 旧 Token を既に失効済みの場合 | Cloudflare で新規長命 Token を 4 scope で 1 度だけ発行（admin 操作）→ 1Password 退避 → 上記手順を実施 → 24h 以内に再失効 |

完全廃止条件: OIDC 経路で **30 日連続 green** を `staging-7day.md` に続く `green-streak/30day-monitoring.md` で記録した後。

## 監査: OIDC subject ログと Cloudflare audit ログの突合

evidence: `outputs/phase-11/evidence/audit/oidc-cf-audit-correlation.json`

| 突合キー | GitHub 側 | Cloudflare 側 |
| --- | --- | --- |
| 時刻 | `github.event.run_id` の started_at | audit log の `when` |
| 主体 | OIDC sub claim（`repo:.../environment:...`） | API token id（intermediate IdP が発行した短命 Token） |
| job 識別 | `github.run_id` + `github.job` | API token の short-lived id（IdP 側 mapping table で対応） |
| 操作 | workflow log（deploy step） | audit log の `action`（`workers.script.put` 等） |

突合スクリプトは Phase 5 で `jq` ベースで実装し、evidence JSON に書き出す。

## 入出力データ構造

### `cf-token-lifetime.json`

```jsonc
{
  "measuredAt": "2026-05-XXTHH:MM:SSZ",
  "tokenIdHashed": "sha256:...",
  "issuedAt": "...",
  "expiresAt": "...",
  "lifetimeSeconds": 3600,
  "passLifetimeUnder3600s": true
}
```

### `cf-token-scope.json`

```jsonc
{
  "measuredAt": "...",
  "tokenIdHashed": "sha256:...",
  "scopes": ["Workers Scripts:Edit", "D1:Edit", "Cloudflare Pages:Edit", "Account Settings:Read"],
  "passExactly4ScopeMatch": true
}
```

### `oidc-cf-audit-correlation.json`

```jsonc
{
  "samples": [
    {
      "githubRunId": "...",
      "githubJob": "deploy",
      "oidcSub": "repo:daishiman/UBM-Hyogo:environment:staging",
      "cfAuditWhen": "...",
      "cfAuditAction": "workers.script.put",
      "cfTokenIdHashed": "sha256:..."
    }
  ],
  "passAllCorrelated": true
}
```

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-01.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `scripts/cf.sh`
- `CLAUDE.md`

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 Phase 11 verified（最小 4 scope の実測）
- 下流: DERIV-03（rotation runbook 改訂）
- 並走: DERIV-02（scope split）/ DERIV-04（audit logs monitoring）

## 多角的チェック観点

- 苦戦箇所 #1〜#5 のすべてに設計上の打ち手が紐付いている
- subject claim 最小化が宣言的に検証可能（trust policy 文字列の grep で `*` がヒットしない）
- 24h 並行運用 / 30 日 green / rollback の 3 つの可逆性ゲートが揃う
- workflow YAML レベルで `id-token: write` が deploy job に限定されている
- ローカル端末（`op run`）と CI（OIDC）の両モードが `scripts/cf.sh` で切り替えられる

## サブタスク管理

- [ ] intermediate IdP 候補 3 経路を比較し A を一次候補に確定（B / C は Phase 5 PoC で再評価）
- [ ] workflow YAML before/after の構造を確定
- [ ] trust policy 許容 subject 表を確定
- [ ] `scripts/cf.sh` 改修ポイントを 3 項目で確定（実コード差分は Phase 5）
- [ ] staging-first 段階展開計画 7 段階を確定
- [ ] rollback 経路 3 ケースを runbook 化方針として確定
- [ ] 監査突合スキーマを確定
- [ ] `outputs/phase-02/main.md` を作成

## 成果物

- `outputs/phase-02/main.md`
- `outputs/phase-02/trust-policy-design.md`（trust policy 設計図の単体ファイル）

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- intermediate IdP の一次候補が確定し、PoC で覆る場合の再評価ポイントが Phase 5 へ引き渡されている
- workflow YAML before/after が deploy job 単位で書ける粒度になっている
- trust policy の許容 / 禁止 subject が表で揃っている
- `scripts/cf.sh` の切替フラグ仕様が確定している
- staging-first 段階展開 7 段階が approval gate と紐付いている
- rollback 経路が 3 ケース文書化されている
- OIDC × Cloudflare audit 突合の JSON スキーマが確定している

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] アプリケーションコード変更・実 deploy・commit・push・PR を本 Phase で実行していない
- [ ] CONST_007 に従い、未確定事項は Phase 3 / Phase 5 への引き渡し条件として明示している

## 次 Phase への引き渡し

Phase 3 へ:
- 設計案（IdP 選定、workflow YAML、trust policy、`scripts/cf.sh` 切替、段階展開、rollback、監査突合）
- リスク候補（Phase 3 でマトリクス化する元ネタ）: trust policy 過剰許容 / lifetime 1h 超過 / fork PR 漏洩 / IdP 障害 / 24h 並行運用中の二重 deploy / 30 日 green 監視忘れ / esbuild 整合崩れ / 旧 Token 失効後の rollback 不能
- 代替案: A（AWS STS）/ C（Cloudflare 直接）の不採用条件と再評価トリガー

## 実行タスク

- [ ] phase-02 の既存セクションに記載した手順・検証・成果物作成を実行する。

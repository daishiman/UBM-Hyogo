# spec-01: 即時 recovery（staging + production の AUTH_SECRET 再投入）

[実装区分: 実装仕様書]

## 1. 目的

`ubm-hyogo-api-staging` worker の `c.env.AUTH_SECRET` を再投入し、`/admin/members` が 200 + `{members:[...]}` を返す状態を回復する。production 側も同事象を verify し、必要時は同手順で recovery する。

## 2. 変更対象ファイル

| 種別 | path | 備考 |
|------|------|------|
| 仕様書 / runbook | 本ファイル | コード変更なし |

コード変更は spec-02/03/04 が担当。spec-01 は **運用作業 + runbook 明文化**のみ。

## 3. 実行手順（user 明示承認必須）

### Step 1: staging recovery

```bash
# 認証確認
bash scripts/cf.sh whoami

# 再投入（実値は表示しない。op read の出力を stdin で cf.sh に渡す）
op read "<USER_APPROVED_AUTH_SECRET_OP_URI>" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging

# name 登録確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

### Step 2: staging verify

```bash
# auth-free endpoint（存在する場合）
curl -i $STAGING_API_BASE/admin/healthz

# auth 必須 endpoint
curl -sS -i -H "Authorization: Bearer $STAGING_ADMIN_BEARER" $STAGING_API_BASE/admin/members \
  | tee outputs/phase-08/curl-staging-admin-members.txt
```

期待:
- status=200
- body に `"members":[`

### Step 3: production verify

```bash
curl -sS -i -H "Authorization: Bearer $PROD_ADMIN_BEARER" $PROD_API_BASE/admin/members \
  | tee outputs/phase-08/curl-production-admin-members.txt
```

500 + `auth misconfigured` が返る場合のみ:

```bash
op read "<USER_APPROVED_AUTH_SECRET_OP_URI>" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env production
```

### Step 4: backend-ci 再実行

```bash
gh workflow run backend-ci.yml --ref dev
gh run watch
```

## 4. 入出力・副作用

- 入力: ユーザー承認済みの 1Password `op://...` URI（実値は表示しない）
- 副作用: Cloudflare Secrets が更新される（**実値はログ・コミット・ドキュメントに転記しない**）
- エラー時:
  - 1Password CLI 未認証 → `op signin` 実行
  - stdin が空 → spec-04 の guard が exit 78 で abort

## 5. テスト方針

spec-01 自体は運用手順のため自動テストはなし。Phase 8 で curl による smoke 検証を行う。

## 6. ローカル実行コマンド

```bash
# dry-run（実投入なし）で wrapper 動作確認
bash scripts/cf.sh whoami
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

## 7. DoD

- staging worker の AUTH_SECRET が**ランタイムで非空**となり、`/admin/members` が 200 を返す
- production 側も同 verify 完了
- backend-ci runtime smoke staging が green
- 実値は転記されていない（git diff で grep 0 件）

## 8. [OPEN-QUESTION]

- [OPEN-QUESTION-02] 1Password vault の正確な item path（`UBM-Hyogo-Staging` か `UBM-Hyogo` か）はユーザー確認後に runbook を確定する
- [OPEN-QUESTION-05] `/admin/healthz` 相当の auth-free endpoint が存在するか。なければ spec-03 で追加するか、`/api/healthz` 等で代替するか決定する

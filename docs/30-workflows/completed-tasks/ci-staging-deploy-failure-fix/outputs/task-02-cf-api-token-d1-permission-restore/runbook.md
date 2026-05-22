# runbook — Cloudflare API Token rotation / incident response

`backend-ci / deploy-staging` および `backend-ci / deploy-production` の Cloudflare 認証が失敗した場合の調査・復旧フロー。本 runbook は task-02 仕様書（[`./spec.md`](./spec.md)）とペアで運用する。

---

## 1. 標準 rotation フロー（90 日サイクル）

### 1.1 タイミング

`.github/workflows/cf-token-rotation-reminder.yml` が `Token X is N days old` を issue 化したタイミング、または手動で 90 日経過に気付いたタイミング。

### 1.2 手順

1. Cloudflare Dashboard `My Profile → API Tokens` を開く
2. 旧 staging token を選び `Roll`（同 scope で値だけ再発行）か `Create Token`（新規）を選ぶ
   - **Roll**: 旧値が即時失効。GitHub Secret 更新までの間に CI が動くと fail する
   - **Create Token + 後で Delete**: 二重化期間を作れる。本 runbook は **Create Token 推奨**
3. token 値をコピー（**この画面を閉じると再表示不可**）
4. 1Password `Employee / ubm-hyogo-env` の該当 field（`CLOUDFLARE_API_TOKEN_STAGING` または `CLOUDFLARE_API_TOKEN_PRODUCTION`）を新値で上書き
5. GitHub Secret を更新:
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --env staging    --repo daishiman/UBM-Hyogo
   # → 「Paste your secret:」プロンプトに新 token をペースト
   ```
6. `bash scripts/cf.sh whoami` でローカル動作確認
7. ユーザー承認後に限り `git commit --allow-empty -m "chore(ci): verify cf token rotation" && git push origin dev` で CI 動作確認
8. CI 成功確認後、Cloudflare Dashboard で旧 token を `Delete`
9. production 側も同じ手順を踏む

### 1.3 1Password の field 分離（staging / production 別 token 運用）

正本構造（2026-05-20 実機確認済み）:

| Vault | Item | field | 用途 |
|-------|------|-------|------|
| `Employee` | `ubm-hyogo-env` | `CLOUDFLARE_API_TOKEN_STAGING` | staging 用 token（ローカル `scripts/cf.sh` default はこちら） |
| `Employee` | `ubm-hyogo-env` | `CLOUDFLARE_API_TOKEN_PRODUCTION` | production 用 token |
| `Employee` | `ubm-hyogo-env` | メモ欄 | rotation 履歴（発行日 / TTL / 命名）|

op 参照 path:

```
op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING
op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_PRODUCTION
```

`.env` の正本行（2026-05-20 以降）:

```
CLOUDFLARE_API_TOKEN="op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING"
```

production を直接叩く場合のみ `op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_PRODUCTION'` で別 field を取得する。

> **過去の落とし穴**: かつて `.env` は `op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN`（サフィックス無し）を参照しており、その field には旧形式 `cfk_` token が残っていた。`_STAGING` field を新値で更新しても `.env` 経由では古い token が引かれ続け、`wrangler whoami` が永続的に 9109 を返す症状を引き起こした。rotation 作業の前に必ず `.env` の op 参照 path が `_STAGING` サフィックス付きであることを確認する。

---

## 2. 認証エラー発生時の調査フロー

### 2.1 症状分類

| ログ | 真因候補 | 次に見る場所 |
|------|---------|-------------|
| `CLOUDFLARE_API_TOKEN` env が空 / preflight が fail | Secret 未登録 | §2.2 |
| `Authentication error [code: 10000] / Invalid access token [code: 9109]` | token 失効 / scope 不足 / account 不整合 / **`.env` の op 参照不整合** | §2.3 |
| `Authentication error [code: 10001]` | token に当該 resource への access なし | §2.3（Account Resources 確認） |
| `Failed to fetch ... 403` | scope 不足 | §2.3 |
| ローカル `bash scripts/cf.sh whoami` のみ 9109、`curl /user/tokens/verify` は success | `.env` の `CLOUDFLARE_API_TOKEN` op 参照 path と、更新した 1Password field の name がズレている | §2.6 |

### 2.2 Secret 未登録の切り分け

```bash
gh secret list --env staging --repo daishiman/UBM-Hyogo
gh secret list --env production --repo daishiman/UBM-Hyogo
```

`CLOUDFLARE_API_TOKEN` が出力に含まれない場合は §1.2 step 5 の `gh secret set` で登録する。

### 2.3 token 失効 / scope 不足の切り分け

```bash
# (a) ローカル 1Password 値が API で通るか
bash scripts/cf.sh whoami
```

| 出力 | 解釈 |
|------|------|
| `Authentication error [code: 9109]` | 1Password の値も失効。dashboard で新規発行が必要 |
| `Account ID` が `b3dde7be1cd856788fc47595ac455475` と不一致 | token と account の組み合わせ不整合（**RC-C**）。token を当該 account 配下で再発行 |
| 正常出力だが CI で fail | ローカル token と GitHub Secret 値が乖離。§1.2 step 5 で同期 |

```bash
# (b) D1:Edit scope が付いているか
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging \
  --config apps/api/wrangler.toml --env staging --remote
```

> `--config` / `--remote` 必須。`--config` を省略するとワークツリー root cwd で `No configuration file found`、`--remote` を省略すると `Resource location: local` になり scope 検証として機能しない。

403 / Invalid access token が出た場合は dashboard で token Permissions を確認し、`Account → D1 → Edit` の有無を見る。不足なら token を Edit して scope を追加（即時反映）するか、再発行する。

```bash
# (c) Workers Scripts:Edit scope
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run --outdir=/tmp/cf-dryrun
```

### 2.4 Cloudflare Dashboard 側の確認ポイント

`My Profile → API Tokens → <該当 token>`:

- **Status**: Active であること。Expired なら新規発行
- **Permissions**: spec.md §5.1 の 3 項目があること
- **Account Resources**: `Include → 当該 account` のみ
- **Last used**: 期待時刻に近い使用記録があるか（CI が値を渡せているかの傍証）
- **IP Address Filtering**: 設定されていれば外す（GitHub Actions runner IP は不定）

### 2.5 account ID 突合

| 取得元 | 期待値 |
|--------|--------|
| `bash scripts/cf.sh whoami` の `Account ID` | `b3dde7be1cd856788fc47595ac455475` |
| GitHub Variables `CLOUDFLARE_ACCOUNT_ID` | 同上（`gh variable list --env staging` で確認） |

いずれかが乖離する場合、乖離している側を修正する。

### 2.6 `.env` op 参照と 1Password field の整合性チェック

`/user/tokens/verify` が success でも wrangler 経由で 9109 になる場合、`.env` が wrangler に渡す値と、`op read` で直接取れる値がズレている。次の 3 つを比較して一致しない経路を特定する:

```bash
# (a) シェル env 汚染チェック（0 であること）
echo "shell env len=${#CLOUDFLARE_API_TOKEN}"

# (b) with-env 経由で wrangler が受け取る値
bash scripts/with-env.sh bash -c 'echo "head=${CLOUDFLARE_API_TOKEN:0:6} len=${#CLOUDFLARE_API_TOKEN}"'

# (c) 1Password の _STAGING field 直読み
echo "op read head=$(op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING' | head -c 6)"
```

(b) と (c) の `head` が一致しない場合、`.env` の `CLOUDFLARE_API_TOKEN` 行が `_STAGING` サフィックス付き field 以外を参照している:

```bash
grep -n CLOUDFLARE_API_TOKEN .env
# 期待: CLOUDFLARE_API_TOKEN="op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING"
```

ズレていれば `.env` を上記の正本行に修正してから再検証。なお 1Password に `CLOUDFLARE_API_TOKEN`（サフィックス無し）field が残っているとここに古い `cfk_` 形式 token が滞留している可能性が高いため、**`.env` 修正完了かつ 4 検証 pass を確認後に削除** する（混乱防止）。

---

## 3. rollback / 事故時の復旧

### 3.1 旧 token を意図せず Delete してしまった場合

旧 token の値復元は **不可能**（Cloudflare 側は再表示できない）。復旧経路は新規発行のみ:

1. Dashboard で新 token を発行（spec.md §5 の scope 設計に従う）
2. 1Password を更新
3. GitHub Secret を更新（§1.2 step 5）
4. `dev` empty commit push で CI が通ることを確認

CI 失敗中の間 `runtime-smoke-staging` も連鎖 fail する点を留意する。staging Worker 自体は前回 deploy 状態が維持されているため、ユーザー影響は新規 deploy 不可のみ。

### 3.2 production token を staging Secret に設定してしまった場合

1. 即座に Cloudflare Dashboard で当該 token を Delete（blast radius 縮小）
2. spec.md §5 / 命名規約 §5.6 に従って staging 用を再発行
3. 1Password + GitHub Secret を更新
4. production 用 token も念のため Roll して旧値を無効化（staging CI ログ経由で漏れた可能性を排除）

### 3.3 token 値が CI ログに平文出力された疑いがある場合

1. 即座に該当 token を Cloudflare Dashboard で Delete
2. `scripts/redaction-check.sh` を `gh run view <RUN_ID> --log` 出力に対して再実行し、漏洩範囲を特定
3. spec.md §5 に従い新 token を発行 → 1Password + GitHub Secret 更新
4. `cf-token-rotation-reminder.yml` の閾値を一時短縮（90 日 → 30 日）して暫定運用

---

## 4. 連絡フロー（solo dev 自己メモ）

solo 運用のため外部連絡先はないが、以下を本人メモとして残す:

- rotation 実施日と新 token 発行日を 1Password Item `Employee / ubm-hyogo-env` のメモ欄に追記
- インシデント発生時は `docs/30-workflows/` 配下に新規 workflow ディレクトリを切らず、本 runbook の §2 / §3 に追記して履歴を集約する
- `cf-token-rotation-reminder.yml` 自体が fail し始めた場合は別 workflow 化を検討（本 runbook では扱わない）

---

## 5. 関連リンク

- spec.md: [`./spec.md`](./spec.md)
- implementation guide: [`./phase-12/implementation-guide.md`](./phase-12/implementation-guide.md)
- 先行 task: `docs/30-workflows/task-cf-token-staging-injection-fix-001/index.md`
- workflow: `.github/workflows/backend-ci.yml` / `.github/workflows/cf-token-rotation-reminder.yml`
- CLI ラッパー: `scripts/cf.sh`
- CLAUDE.md §Cloudflare 系 CLI 実行ルール / §シークレット管理
- Cloudflare API Token docs: <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>

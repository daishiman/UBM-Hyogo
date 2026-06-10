# task-03: 診断スクリプト `scripts/diagnose-profile-session.sh`（read-only・冪等）

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

> 判定根拠: CONST_004 に従う。本タスクは `scripts/diagnose-profile-session.sh`（新規）を追加し、staging `/me` の status 確認・env/secret parity・deploy 版数を 1 本で再現できる read-only 診断スクリプトを提供する。コード（shell script）追加を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-session-fetch-failure-investigation` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T03 |
| ブランチ | `feat/profile-session-fetch-failure-investigation` |
| 起点 | `origin/dev` (b59a9b450) |
| visualEvidence | NON_VISUAL（HTTP status / parity 出力で判定） |
| 想定 PR base | `dev` |
| 並列性 | T01 / T02 と相互非依存（並列実装可） |
| 紐づく AC | AC-5（診断スクリプト read-only・冪等・1 本で再現）/ AC-1（status 確定の手段）/ D3 |

## 背景

現状、`/profile` のセッション取得失敗（H3 410 / H4 5xx / H5 transport）を staging 実機で切り分けるには、(1) `/me` の HTTP status を直接叩いて確認、(2) `AUTH_SECRET` 等の web/api parity 確認、(3) staging deploy 版数（旧 bundle 残存 = H1/H5）の確認、を **個別の手順・別スクリプト**で行う必要がある。既存資産として `scripts/smoke-staging-me.sh`（認証付き `/me` 200 確認）/ `scripts/diagnose-auth-secret-parity.sh`（secret presence）があるが、本症状（**非200 = 410/5xx/transport のどれか**を切り分けたい）には、認証**有無両方**の `/me` status を取り、parity と deploy 版数を 1 本に束ねた診断口が無い。これが診断不能（H6）の運用側の欠如。

不変条件: `wrangler` 直叩き禁止（`bash scripts/cf.sh` 経由）。secret 実値・cookie・token を出力しない。read-only（D1 書込み・deploy・secret 投入を一切しない）。冪等（何度実行しても副作用なし）。

## 目的

新規 `scripts/diagnose-profile-session.sh`（read-only・冪等）を追加し、次の 3 点を 1 本のコマンドで再現可能にする:

1. **`/me` status 確認**: staging `/api/me` を https 直で叩き HTTP status を取得（認証なし = 401 期待 / 認証あり = 200 期待。非401・非200 が出れば H3/H4/H5 の切り分けに直結）。
2. **env / secret parity 確認**: 既存 `diagnose-auth-secret-parity.sh` を内部呼び出しし `AUTH_SECRET` の web/api presence と base URL の localhost 焼込み有無を集約（presence のみ・実値非出力）。
3. **deploy 版数確認**: `bash scripts/cf.sh deployments list`（または `versions list`）相当で web/api worker の最新デプロイ版数を取得し、旧 bundle 残存（H1/H5）を切り分ける手掛かりにする。

出力は status / parity / 版数の要約のみ。secret 実値・cookie・token・memberId は一切出力しない。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `scripts/diagnose-profile-session.sh` | 新規 | read-only・冪等の診断スクリプト本体（下記 §2 構造） |

それ以外のファイルは無編集。既存 `smoke-staging-me.sh` / `diagnose-auth-secret-parity.sh` / `cf.sh` は**再利用**し改変しない。

> テスト方針: shell script のため vitest 対象外。検証は `--help` / `--json`（認証なし status 取得）の exit code と出力キーで行う（§5）。新規 `*.spec.*` は作らない（不変条件 #8 は ts/tsx 対象。shell は CI の `workflow-shell-lint` / 手動 smoke で担保）。

## 2. 主要な構造・I/O（CONST_005 必須）

### 2.1 引数・オプション

```
usage: bash scripts/diagnose-profile-session.sh [--json] [--with-auth]

  --json       機械可読 JSON サマリで出力（既定は人間可読テキスト）
  --with-auth  smoke-staging-me.sh と同じ認証ソース（STAGING_ME_BEARER /
               STAGING_SESSION_COOKIE / STAGING_STORAGE_STATE 等）で認証付き
               /me status も取得（200 期待）。未指定時は認証なし status のみ
  -h|--help    使い方を表示
```

### 2.2 構造（read-only ステップ）

| ステップ | 内容 | 実装手段（read-only） | 出力キー |
| --- | --- | --- | --- |
| S1 `/me` status（認証なし） | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/me` を `curl -s -o /dev/null -w '%{http_code}'` で叩く。401 期待（session 未解決）。**404/410/5xx が出れば route/410/サーバ異常の手掛かり** | `curl`（read-only GET。body は破棄。Set-Cookie 等は出力しない） | `me_status_unauth` |
| S2 `/me` status（認証あり・`--with-auth` 時のみ） | 既存 `smoke-staging-me.sh staging` を内部呼び出し（PASS/FAIL と `/me` status をサマリに取り込む） | `bash scripts/smoke-staging-me.sh staging --out-dir <tmp> --ci-summary` | `me_status_auth` / `smoke_result` |
| S3 secret / base parity | 既存 `diagnose-auth-secret-parity.sh --json` を内部呼び出し（presence のみ） | `bash scripts/diagnose-auth-secret-parity.sh --json` | `web_auth_secret` / `api_auth_secret` / `web_base_url` |
| S4 deploy 版数 | web / api worker の最新デプロイ版数 ID を取得（旧 bundle 残存 = H1/H5 切り分け） | `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging`（同 api）から先頭の version/created を抽出 | `web_deploy_version` / `api_deploy_version` |

### 2.3 出力例（テキスト）

```
profile-session diagnose (staging, read-only)
  /me status (unauth):   401   # 期待 401。404/410/5xx は要調査
  /me status (auth):     200   # --with-auth 時のみ。非200 は H3/H4/H5
  web AUTH_SECRET:       present
  api AUTH_SECRET:       present
  web base url:          ok      # localhost 焼込み無し
  web deploy version:    <version-id> (<created-at>)
  api deploy version:    <version-id> (<created-at>)
note: presence/status only. no secret value, cookie, or memberId is printed.
```

`--json` 時:

```json
{"environment":"staging","meStatusUnauth":401,"meStatusAuth":200,"webAuthSecret":"present","apiAuthSecret":"present","webBaseUrl":"ok","webDeployVersion":"<id>","apiDeployVersion":"<id>"}
```

### 2.4 exit code 規約

| exit | 条件 |
| --- | --- |
| 0 | S1 が到達でき status を取得（status 値の良否によらず診断成功 = 観測できた） |
| 1 | `/me` への到達自体が失敗（DNS / network。transport 切り分けの一次情報） |
| 2 | 引数誤り / `--with-auth` で認証ソース未設定（usage 表示） |

> 診断スクリプトは「status の良否」で fail しない（観測が目的）。401 や 5xx が返っても exit 0（観測成功）。到達不能（curl 自体の失敗）のみ exit 1。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
| --- | --- |
| 入力 | 環境変数（`STAGING_WEB_BASE` 既定 = staging URL、`--with-auth` 時の認証ソースは `smoke-staging-me.sh` と同名）。引数 `--json` / `--with-auth` |
| 出力 | status（数値）/ parity（presence）/ deploy 版数（id・created）の要約。テキスト or JSON |
| 副作用 | **なし（read-only・冪等）**。GET のみ。D1 書込み・deploy・secret 投入・ファイル生成（`--out-dir` 明示時の tmp を除く）を行わない |
| 非出力（厳守） | secret 実値 / cookie / token / Set-Cookie / memberId / `/me` レスポンス body を一切出力しない（既存 `smoke-staging-me.sh` の規約「No bearer, cookie, or Set-Cookie values are written to output」を踏襲） |
| 禁止事項 | `wrangler` 直叩き禁止（`bash scripts/cf.sh` 経由）。`.env` を cat / 表示しない |

## 4. 実装スケルトン（抜粋）

```bash
#!/usr/bin/env bash
set -euo pipefail

JSON=0
WITH_AUTH=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=1; shift ;;
    --with-auth) WITH_AUTH=1; shift ;;
    -h|--help)
      echo "usage: bash scripts/diagnose-profile-session.sh [--json] [--with-auth]"
      exit 0 ;;
    *) echo "diagnose-profile-session: unknown argument: $1" >&2; exit 2 ;;
  esac
done

WEB_BASE="${STAGING_WEB_BASE:-https://ubm-hyogo-web-staging.daishimanju.workers.dev}"

# S1: /me status (unauth) — body 破棄・status のみ
me_status_unauth="$(curl -s -o /dev/null -w '%{http_code}' "${WEB_BASE%/}/api/me" || echo "000")"
[[ "$me_status_unauth" == "000" ]] && { echo "diagnose: /me unreachable" >&2; exit 1; }

# S3: parity（presence のみ・実値非出力）
parity_json="$(bash scripts/diagnose-auth-secret-parity.sh --json || true)"

# S4: deploy 版数（cf.sh ラッパー経由・read-only list）
web_ver="$(bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging 2>/dev/null | head -n 1 || true)"
api_ver="$(bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging 2>/dev/null | head -n 1 || true)"

# S2: auth status（--with-auth 時のみ・smoke 再利用）
me_status_auth="skipped"
if [[ "$WITH_AUTH" -eq 1 ]]; then
  tmp="$(mktemp -d)"
  if bash scripts/smoke-staging-me.sh staging --out-dir "$tmp" --ci-summary >/dev/null 2>&1; then
    me_status_auth="$(grep -oE '"apiMeStatus":[0-9]+' "$tmp/summary.json" | grep -oE '[0-9]+' || echo unknown)"
  else
    me_status_auth="fail"
  fi
  rm -rf "$tmp"
fi

# 出力（テキスト / JSON）。secret 実値・cookie は一切出さない
# ... §2.3 の形式で整形 ...
```

> 上記は構造の骨格。`cf.sh deployments list` の出力フォーマット（version-id / created）は実装時に `bash scripts/cf.sh deployments list --help` で確認し、`versions list` が正なら読み替える。いずれも read-only list サブコマンドのみ使用。

## 5. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. 構文チェック（read-only。shellcheck があれば併用）
bash -n scripts/diagnose-profile-session.sh
shellcheck scripts/diagnose-profile-session.sh || true

# 2. usage（認証・network 不要）
bash scripts/diagnose-profile-session.sh --help

# 3. 認証なし診断（staging /me unauth status + parity + 版数）— read-only
bash scripts/diagnose-profile-session.sh
bash scripts/diagnose-profile-session.sh --json

# 4. 認証あり診断（staging cookie / bearer を 1Password 等から渡す。user-gated）
#    STAGING_STORAGE_STATE=... bash scripts/diagnose-profile-session.sh --with-auth
```

## 6. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T03-1 | `scripts/diagnose-profile-session.sh` が新規追加され `--help` / `--json` / `--with-auth` を受理 | §5 手順 2 |
| DoD-T03-2 | `bash -n`（構文）が exit 0、`set -euo pipefail` 採用 | §5 手順 1 |
| DoD-T03-3 | 認証なし実行で `/me` unauth status / parity / deploy 版数の要約を出力（read-only） | §5 手順 3 |
| DoD-T03-4 | secret 実値 / cookie / token / memberId / `/me` body を出力しない | 出力 grep で非露出確認 |
| DoD-T03-5 | `wrangler` を直接呼ばず `bash scripts/cf.sh` 経由のみ使用 | `grep -n wrangler scripts/diagnose-profile-session.sh` が 0 件 |
| DoD-T03-6 | D1 書込み・deploy・secret 投入を一切行わない（read-only・冪等） | スクリプト内に書込み系コマンドが無いこと |
| DoD-T03-7 | 既存 `smoke-staging-me.sh` / `diagnose-auth-secret-parity.sh` / `cf.sh` を改変せず再利用 | `git diff` が新規 1 ファイルのみ |

## 7. ロールバック手順

本タスクは新規 1 ファイルのみ。問題が出た場合は削除で完全復旧:

```bash
git rm scripts/diagnose-profile-session.sh
```

既存スクリプトは無改変のため他経路への影響は無い。

## 8. 後続タスク・先送り項目

CONST_007 に違反する先送りは **無し**。本タスクのスコープ（診断口の集約）は本サイクルで完結する。診断で得た status を根拠に着手する本格修正（410 復帰 / 5xx 根治 / transport 運用是正 = 旧 bundle 再 deploy）は **真因確定（Phase 11）後でないと方針を決められず、deploy 操作自体が user-gated** のため Phase 12 で未タスク化する（CONST_007 例外①・SSOT §3 OUT）。

## 9. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。T01 / T02 と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。

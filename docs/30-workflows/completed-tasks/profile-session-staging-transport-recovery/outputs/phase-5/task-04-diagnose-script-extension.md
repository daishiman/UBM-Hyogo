# task-04: 診断スクリプト拡張（probe 2 系統化 + data-cause 抽出 + deploy 版数手順）

`[実装区分: 実装仕様書]`

> 判定根拠: CONST_004 に従う。本タスクは `scripts/diagnose-profile-session.sh`（編集）を変更し、現行 probe の誤誘導欠陥（web ホストの `/me` を叩いており route 不在で常に route miss 系 status になる）を是正して S1〜S4 切り分けの外形診断精度を上げるコード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-session-staging-transport-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T04 |
| ブランチ | `fix/profile-session-staging-transport-recovery` |
| visualEvidence | NON_VISUAL（`bash -n` + 出力 key 検査で判定。実 probe は user-gated） |
| 想定 PR base | `dev` |
| 並列性 | T01〜T03 とコード非依存・**独立並列**（同一ファイルに T01 の tail_hint 1 行が入るため、実装順は T01 後を推奨） |
| 紐づく AC | AC-6（2 系統 probe + data-cause 抽出 + 版数手順・read-only・冪等・`bash -n` PASS）/ MINOR-2（Phase 3 追跡） |

## 背景

現行 `scripts/diagnose-profile-session.sh` は `${BASE_URL%/}/me` = **web ホストの `/me`** を叩いている。web（Next.js）に `/me` route は存在しない（`/me` は API worker の path、web 側の proxy は `/api/me/*`）ため、この probe は実際の `/profile` server fetch 経路を一切通らず、route 不在由来の status を返して**誤誘導**になる（MINOR-2）。また cookie を持っていても `/profile` の実際の失敗クラス（`data-cause`）を読まず、deploy 版数の確認手段も出力されない。

## 目的

probe を (a) **web `/api/me`（proxy 実経路）** と (b) **API direct `https://ubm-hyogo-api-staging.daishimanju.workers.dev/me`** の 2 系統に拡張し、web 側 transport 問題（S1/S3）と API 到達性問題（S4）を外形から切り分け可能にする。さらに (c) cookie 提供時（user-gated）に web `/profile` HTML から `data-cause` 値を抽出して失敗クラスを外形判定し、(d) `bash scripts/cf.sh` 経由の staging deploy 版数確認**手順**を出力に含める。read-only・冪等・secret/cookie/memberId 非出力は維持する。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `scripts/diagnose-profile-session.sh` | 編集 | probe 2 系統化 / `data-cause` 抽出 / deployments_hint 出力 / candidate 判定表の S1〜S4 対応化。既存の cookie 排他検査・`set +e` curl パターン・tail_hint（T01 取込分）・非出力規約は維持 |

それ以外は無編集（新規ファイル・削除なし。`scripts/cf.sh` / 既存診断スクリプト群は非接触）。

## 2. 主要な構造（CONST_005 必須）

shell スクリプトのため関数シグネチャの代わりに **入出力 key 構造**を契約とする（Phase 4 §4.5 と 1:1）。

### 入力（env 変数）

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `PROFILE_SESSION_BASE_URL` | `https://ubm-hyogo-web-staging.daishimanju.workers.dev` | web ホスト（probe 1 / data-cause 抽出先） |
| `PROFILE_SESSION_API_BASE_URL` | `https://ubm-hyogo-api-staging.daishimanju.workers.dev` | API direct ホスト（probe 2） |
| `PROFILE_SESSION_COOKIE` / `PROFILE_SESSION_COOKIE_FILE` | （空・排他） | user-gated。提供時のみ認証付き probe + `/profile` data-cause 抽出 |
| `PROFILE_SESSION_CF_ENV` | `staging` | cf.sh hint 用 env 名 |

### 出力（stdout・key=value・1 行 1 key）

| key | 値 | 意味 |
| --- | --- | --- |
| `profile_session.web_api_me_status` | 3 桁 status or `000` | probe 1: web `/api/me`（proxy 実経路）。cookie 無し時は 401（proxy の `requireSession`）が健全値 |
| `profile_session.api_me_status` | 3 桁 status or `000` | probe 2: API direct `${API_BASE%/}/me`。cookie 無し時は 401（API `sessionGuard`）が健全値。`000`/5xx は API 到達性問題（S4 系） |
| `profile_session.profile_data_cause` | `data-cause` 属性値 or `absent` | cookie 提供時のみ。web `/profile` HTML から `data-cause="<value>"` を抽出（`session-failed` 等の失敗クラス）。cookie 未提供時は `skipped` |
| `profile_session.web_base_url` / `profile_session.api_base_url` | URL | probe 先（ホスト名のみで PII でない） |
| `profile_session.cookie_source` | `file` / `env` / `none` | 既存維持 |
| `profile_session.curl_exit_web` / `profile_session.curl_exit_api` | exit code | 既存 curl_exit の 2 系統化 |
| `profile_session.deployments_hint` | コマンド文字列 | `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env ${CF_ENV}`（web）と `--config apps/api/wrangler.toml`（api）の 2 行。**手順を出力するのみで実行しない**（read-only 維持・`wrangler` 直叩き禁止規約） |
| `profile_session.tail_hint` | コマンド文字列 | 既存維持（T01 取込分。`server_fetch_failed|transportKind|baseHost` の rg） |
| `profile_session.candidate` | 判定値 | 下表の status 組合せ → サブ原因候補 |

### candidate 判定表（S1〜S4 対応・cookie 提供時）

| `web_api_me_status` | `api_me_status` | candidate | 解釈 |
| --- | --- | --- | --- |
| 200 | 200 | `recovered_or_no_failure` | 復旧済み（chain 導入後の期待値） |
| 500 / 000 | 200 / 401 | `web_transport_failure_S1_or_S3` | API は健在・web→API の transport 層が問題（S1: 解決不能 / S3: binding throw。確定は staging ログの transportKind/baseHost） |
| any | 000 / 5xx | `api_unreachable_S4` | API direct が落ちている（S4 系・API worker 側） |
| 404 | — | `web_proxy_route_miss` | proxy route 不一致（probe path 要調整。下記「実装注意」参照） |
| 401 | 401 | `unauthenticated_probe`（cookie 無し時の健全値） | 経路は生きている（transport 断ではない） |

> **実装注意（probe path）**: web proxy は `apps/web/app/api/me/[...path]/route.ts` の catch-all。Next.js の `[...path]` は tail 無し `/api/me` に match しない可能性があるため、実装時に `/api/me` が常に 404 を返す場合は probe path を同一 proxy 配下の GET `/api/me/profile`（read-only・同じ transport 経路）へ調整してよい。判定意味（proxy 実経路の transport を通すこと）は同一。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
| --- | --- |
| 入力 | §2 の env 変数のみ（引数なし。secret を引数で受けない） |
| 出力 | stdout への key=value のみ。exit code: `0`（全 probe 完了。probe 先が 4xx/5xx/000 でも診断成功）/ `2`（usage 違反: cookie 二重指定） |
| 副作用 | なし（GET のみ・read-only・冪等。書込・deploy・wrangler 実行なし。deployments_hint は文字列出力のみ） |
| 非出力（厳守） | secret 実値・cookie 値・token・memberId・HTML 本文全文を出力しない。`data-cause` は**属性値のみ**を抽出して出す（属性値は `session-failed` 等の失敗クラス識別子で PII を含まない設計 = 前身 WF task-01 の契約） |
| 冪等性 | 複数回実行で同一の観測動作（状態を持たない） |

## 4. 編集差分の要点（Before → After）

| 箇所 | Before | After |
| --- | --- | --- |
| probe 先 | `${BASE_URL%/}/me`（web ホスト・route 不在で誤誘導） | probe 1: `${BASE_URL%/}/api/me`（proxy 実経路）/ probe 2: `${API_BASE_URL%/}/me`（API direct）の 2 系統 |
| status 出力 | `profile_session.me_status` 1 本 | `web_api_me_status` / `api_me_status` の 2 本（curl_exit も 2 系統化） |
| data-cause | なし | cookie 提供時のみ `curl -sS ${BASE_URL%/}/profile` の HTML から `grep -o 'data-cause="[^"]*"'` 相当で先頭 1 件を抽出（無ければ `absent`、cookie 無しは `skipped`） |
| 版数確認 | なし | `deployments_hint`（web/api の 2 行・cf.sh 経由コマンド文字列） |
| candidate | H2〜H5 ベースの単一 status 判定 | §2 判定表（S1〜S4 ベースの 2 status 組合せ判定）へ更新 |
| 維持 | cookie 排他検査 / `set +e` + `000` 正規化 / 非出力規約 / tail_hint / `cf_wrapper` presence | そのまま |

## 5. テスト方針（CONST_005 必須）

shell のため vitest 対象外（前身 WF と同方針）。検証は静的検査 + 出力 key 検査で行う。

| TC-ID | 検証 | 期待 |
| --- | --- | --- |
| DG-1 | `bash -n scripts/diagnose-profile-session.sh` | exit 0（構文 PASS・AC-6） |
| DG-2 | cookie 二重指定（`PROFILE_SESSION_COOKIE` + `PROFILE_SESSION_COOKIE_FILE`） | exit 2 + usage 出力（既存挙動維持） |
| DG-3 | 到達不能ホスト指定（`PROFILE_SESSION_BASE_URL=https://127.0.0.1:1 PROFILE_SESSION_API_BASE_URL=https://127.0.0.1:1` 等のローカル安全値）で実行 | exit 0・`web_api_me_status=000` / `api_me_status=000`・`profile_data_cause=skipped`・`deployments_hint` 2 行が出力される（ネットワーク非依存の冪等確認） |
| DG-4 | 出力全文の secret 非含有 | 出力に cookie 値・`AUTH_SECRET` 等の実値が現れない（grep） |
| DG-5（user-gated） | staging 実機での 2 系統 probe + cookie 付き data-cause 抽出 | Phase 11 の復旧検証手順で実施 |

## 6. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. 構文
bash -n scripts/diagnose-profile-session.sh

# 2. usage 違反（exit 2）
PROFILE_SESSION_COOKIE=x PROFILE_SESSION_COOKIE_FILE=y bash scripts/diagnose-profile-session.sh; echo "exit=$?"

# 3. ネットワーク非依存の出力 key 検査（到達不能ホストで 000 正規化を確認）
PROFILE_SESSION_BASE_URL="https://127.0.0.1:1" \
PROFILE_SESSION_API_BASE_URL="https://127.0.0.1:1" \
bash scripts/diagnose-profile-session.sh

# 4. staging 実機 probe（user-gated・Phase 11）
bash scripts/diagnose-profile-session.sh
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T04-1 | probe が web `/api/me` と API direct `/me` の 2 系統になり、`web_api_me_status` / `api_me_status` が出力される（AC-6） | §6 手順 3 |
| DoD-T04-2 | cookie 提供時のみ `/profile` HTML から `data-cause` を抽出し `profile_data_cause` に出す（未提供時 `skipped`） | §6 手順 3（skipped 側）+ Phase 11（実値側） |
| DoD-T04-3 | `deployments_hint` に `bash scripts/cf.sh` 経由の版数確認コマンド（web/api）が出力され、スクリプト自身は wrangler を実行しない | §6 手順 3 + コードレビュー |
| DoD-T04-4 | candidate 判定が S1〜S4 ベースの組合せ判定になっている | コードレビュー |
| DoD-T04-5 | `bash -n` PASS・exit code 規約（0/2）維持・read-only/冪等維持（AC-6） | §6 手順 1・2 |
| DoD-T04-6 | secret 実値・cookie・token・memberId が出力に現れない | §6 手順 3 出力の grep |
| DoD-T04-7 | 変更が `scripts/diagnose-profile-session.sh` 1 ファイルに閉じている | `git diff --stat` |

## 8. ロールバック手順

```bash
git checkout -- scripts/diagnose-profile-session.sh
```

revert 後は旧 probe（web `/me`・誤誘導あり）に戻るのみで、apps/web のコード・他タスクの成果に影響しない。

## 9. 後続タスク・先送り項目

CONST_007 に違反する先送りは無し。API worker 側の根治（S3 確定時のみ必要）は SSOT §3 OUT のとおり `unassigned-task/task-api-worker-hard-error-root-fix.md` として Phase 12 で formalize する（本タスクの診断出力がその要否判定の入力になる）。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。T01〜T04 を 1 本の PR（base=`dev`）に束ねる（Phase 13）。

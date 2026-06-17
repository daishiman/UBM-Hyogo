# task-04: 診断スクリプトに route 存在差分 + deploy parity を追加

`[実装区分: 実装仕様書]`

> 判定根拠（CONST_004）: 本タスクは `scripts/diagnose-profile-session.sh` を編集する**コード（shell）変更**を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-me-404-authenticated-admin-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T04 |
| ブランチ | `fix/profile-me-404-authenticated-admin-recovery`（起点 `origin/dev`） |
| visualEvidence | NON_VISUAL（`bash -n` + 出力 key 検査 + redaction grep で判定） |
| 並列性 | **独立並列**（T01〜T03 とコード非依存・いつでも可） |
| 紐づく AC / F / S | AC-5（route 存在 + parity・secret 非出力）/ AC-9（cookie/memberId 非出力）/ F-6・F-7（healthz 健全 vs /me route miss）/ S1（route ドリフト検知） |

## 概要 / 対象タスク（T04）

`scripts/diagnose-profile-session.sh` は既に web `/api/me/profile` proxy probe（`web_api_me_status`）・API direct `/me` probe（`api_me_status`）・cookie 提供時の `profile_data_cause` 抽出・`deployments_hint` / `tail_hint` を出力する。しかし **`/me/healthz`（route 生存）と `/me`（route 未マッチ）の対比**が無く、`api_me_status=404` が「route 未マッチ（S1）」か「認証層の応答」かを単体で切り分けられない（`/me` は無認証でも 401 を返すべきで 404 は異常）。本タスクは (a) `/me/healthz` probe と route 差分判定、(b) web↔api deploy parity の確認手順 hint を追加する。read-only・冪等・secret 非出力を厳守。

## 1. 変更対象ファイル一覧（パス・変更種別）

| パス | 変更種別 | 要点 |
| --- | --- | --- |
| `scripts/diagnose-profile-session.sh` | 編集 | `api_me_healthz_status` probe + `api_route_diff` 判定 + `parity_hint` 出力を追加 |

> 新規・削除ファイルなし。`wrangler` 直叩きしない（version 確認は `bash scripts/cf.sh` 経由の手順文字列を**出力するのみ**・実行しない）。

## 2. 主要な構造（実コードに即した差分方針）

現状（`diagnose-profile-session.sh:50-51`）は web/api 2 probe:

```bash
read -r web_api_me_status web_api_me_curl_exit < <(curl_status "${BASE_URL%/}/api/me/profile")
read -r api_me_status api_me_curl_exit < <(curl_status "${API_BASE_URL%/}/me")
```

追加方針（既存 `curl_status` helper を再利用し healthz probe を 1 本追加。出力は status と判定ラベルのみ）:

```bash
# 既存 2 probe の直後に healthz probe を追加（無認証で叩く）
read -r api_me_healthz_status api_me_healthz_curl_exit < <(curl_status "${API_BASE_URL%/}/me/healthz")

# route 差分判定（healthz=200 かつ /me=404 → route 設定異常の sign）
case "${api_me_healthz_status}:${api_me_status}" in
  200:404) api_route_diff="healthz_alive_me_miss" ;;   # S1 強シグナル
  200:401) api_route_diff="both_alive" ;;              # route 健全・認証層到達
  200:2*)  api_route_diff="both_alive" ;;
  200:410) api_route_diff="both_alive" ;;
  404:*|000:*) api_route_diff="healthz_miss" ;;        # api worker 自体が未到達/未デプロイ
  *)       api_route_diff="indeterminate" ;;
esac
```

出力追加（既存 `printf 'profile_session.*' ...` 群へ追記）:

```bash
printf 'profile_session.api_me_healthz_status=%s\n' "${api_me_healthz_status}"
printf 'profile_session.api_route_diff=%s\n' "${api_route_diff}"
printf 'profile_session.parity_hint=%s\n' "compare web and api worker versions: bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env ${CF_ENV} ; bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env ${CF_ENV} (run after user approval; read-only)"
```

> `parity_hint` は **手順文字列のみ**を出力し、`scripts/cf.sh` を実行しない（read-only 維持）。実際の version 確認は user 承認後に手動実行する。`deployments list` の正確なサブコマンド名は実装着手時に `bash scripts/cf.sh --help` で確認し、未対応なら「Cloudflare dashboard で web/api worker の最新 version を目視比較」の文言へ調整する。

## 3. 入力・出力・副作用の定義

| 区分 | 内容 |
| --- | --- |
| 入力（env 変数） | `PROFILE_SESSION_BASE_URL`（web）/ `PROFILE_SESSION_API_BASE_URL`（API direct）/ `PROFILE_SESSION_COOKIE` ⊻ `PROFILE_SESSION_COOKIE_FILE`（排他・任意）/ `PROFILE_SESSION_CF_ENV`（既定 `staging`） |
| 出力（既存・不変） | `web_api_me_status` / `api_me_status` / `profile_data_cause` / `cookie_source` / `candidate` / `deployments_hint` / `tail_hint` |
| 出力（T04 追加） | `api_me_healthz_status=<3桁 or 000>` / `api_route_diff=<healthz_alive_me_miss\|both_alive\|healthz_miss\|indeterminate>` / `parity_hint=<bash scripts/cf.sh 経由の version 確認手順文字列>` |
| exit code | `0`: 全 probe 実行完了（4xx/5xx/000 でも診断成功）/ `2`: cookie 二重指定の usage 違反（既存維持） |
| 副作用 | なし（read-only・curl GET のみ・書込/deploy なし・冪等） |
| 不変 | secret/cookie/token/memberId を出力しない。`wrangler` 直叩きしない |

## 4. テスト方針（`bash -n` + 出力 key 検査 + redaction grep）

新規 vitest は追加しない（shell スクリプトは構文・出力 key・非漏洩で検証）。

| TC-ID | 検証 | 期待値 |
| --- | --- | --- |
| DG-1 | `bash -n scripts/diagnose-profile-session.sh` | 構文 valid |
| DG-2 | 出力 key 検査（モック URL or 実行ログ）| `profile_session.api_me_healthz_status` / `.api_route_diff` / `.parity_hint` の行が出る |
| DG-3 | route 差分判定（healthz=200 / me=404 を擬似入力） | `api_route_diff=healthz_alive_me_miss` |
| DG-4（redaction） | 出力全体を grep | `Cookie:` / `authorization` / `Bearer` / `__Secure-authjs.session-token=` / memberId（UUID）が**一切現れない** |
| DG-5（冪等） | 2 回連続実行 | 出力構造が同一・副作用（ファイル生成/書込）なし |

> DG-3 の擬似入力は curl をスタブ可能なら関数差し替え、不可なら判定 `case` 文のロジックを単体抽出して bash 単体テスト（既存 `scripts/__tests__` の shell test 流儀があれば踏襲）で確認する。最低限 DG-1/DG-2/DG-4 を必須とする。

## 5. ローカル実行・検証コマンド

```bash
# 構文
bash -n scripts/diagnose-profile-session.sh

# 出力 key 検査（実 staging に対し read-only 実行・cookie 無し）
bash scripts/diagnose-profile-session.sh | grep -E 'api_me_healthz_status|api_route_diff|parity_hint'

# redaction grep（出力に secret/cookie/memberId が無いこと）
bash scripts/diagnose-profile-session.sh \
  | grep -Ei 'cookie:|authorization|bearer|__Secure-authjs\.session-token=|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}' \
  && echo "LEAK DETECTED" || echo "no leak"
```

## 6. 完了条件（DoD）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T04-1 | `api_me_healthz_status` / `api_route_diff` / `parity_hint` が出力される | DG-2 |
| DoD-T04-2 | healthz=200 かつ /me=404 で `api_route_diff=healthz_alive_me_miss`（S1 シグナル） | DG-3 |
| DoD-T04-3 | 出力に secret/cookie/token/memberId が一切現れない | DG-4 |
| DoD-T04-4 | `bash -n` PASS・2 回実行で副作用なし（冪等） | DG-1 / DG-5 |
| DoD-T04-5 | `wrangler` 直叩きが無い（version 確認は手順文字列のみ） | `grep -n 'wrangler ' scripts/diagnose-profile-session.sh` が 0 件 |

## 7. 不変条件

- read-only・冪等。書込・deploy をしない。
- secret 実値・cookie 値・token・memberId を出力しない（AC-9）。
- `wrangler` 直叩きしない。version 確認は `bash scripts/cf.sh` 経由の**手順文字列出力のみ**（CLAUDE.md / AC-7）。
- `/me` の path/shape を前提とした probe のみ（既存 endpoint surface を変更しない・AC-6）。
- commit/PR/push は user-gated（CONST_002）。

## 8. ロールバック手順

```bash
git checkout origin/dev -- scripts/diagnose-profile-session.sh
```
healthz probe / route 差分 / parity hint を除去し既存 2 probe 構成へ戻す。T01〜T03 とはコード非依存のため単独 revert 可能。

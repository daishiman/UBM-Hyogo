# Phase 6: 異常系検証 — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 6 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

real Workers + D1 smoke 実行時に発生し得る代表的異常系 8 ケースを定義し、各ケースの **シグナル / 原因 / 切り分け / 復旧 / AC trace** を整理する。Phase 5 ランブック実行中に該当事象が出た場合、本ファイルが分岐先となる。

## 異常系一覧

### Case A: esbuild Host/Binary version mismatch

- **シグナル**: `apps/api` または `apps/web` 起動時に `Expected "0.21.x" but got "0.27.x"` 等の version mismatch ログ
- **原因**: グローバル `esbuild` と wrangler 内蔵 `esbuild` の不整合
- **切り分け**: 起動コマンドが `bash scripts/cf.sh` 経由か確認（`ESBUILD_BINARY_PATH` 注入有無）
- **復旧**: `bash scripts/cf.sh dev ...` 経由起動に統一。直接 `wrangler` を呼んでいたら本タスクの仕様違反として中止
- **AC trace**: AC-1（local smoke curl log 取得）fail
- **evidence**: `outputs/phase-11/evidence/local-curl.log` 冒頭にエラーログ snippet を記録

### Case B: D1 binding 未バインド / 誤バインド

- **シグナル**: `apps/api` の `/public/members` が `Cannot read properties of undefined (reading 'prepare')` 等を返す / 500 を返す
- **原因**: `apps/api/wrangler.toml` の `[[d1_databases]]` または `[[env.<env>.d1_databases]]` が欠落 / `binding = "DB"` の typo / 別環境の database_id 混入
- **切り分け**:
  ```bash
  grep -A3 'd1_databases' apps/api/wrangler.toml
  bash scripts/cf.sh d1 list
  ```
- **復旧**: 該当環境の `[[env.<env>.d1_databases]]` で `binding = "DB"` / `database_name` / `database_id` を再確認。誤りなら修正後 `bash scripts/cf.sh deploy`
- **AC trace**: AC-1 / AC-2（staging smoke）/ AC-4（real D1 経路明記）すべて fail
- **scope**: 本タスク内では wrangler.toml の誤りを **検出のみ**、修正コミットは別 PR

### Case C: D1 migration 未 apply

- **シグナル**: `apps/api` が `/public/members` で `no such table: members` を返す
- **原因**: 当該環境（dev / staging）に migration が未 apply
- **切り分け**:
  ```bash
  bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
  ```
- **復旧**:
  ```bash
  bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
  ```
- **AC trace**: AC-1 / AC-2 fail

### Case D: `PUBLIC_API_BASE_URL` 不一致 / 未設定

- **シグナル**:
  - staging で `apps/web` が `/members` をレンダリングした際 fetch が失敗 / `[]` が返る
  - response の Network log で API host が `localhost` を指している（staging URL ではない）
- **原因**: `apps/web/wrangler.toml` の `[env.staging.vars] PUBLIC_API_BASE_URL` が古い preview URL や localhost を指している、または未設定
- **切り分け**:
  ```bash
  grep -A2 'env.staging.vars' apps/web/wrangler.toml
  # 期待: PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
  ```
- **復旧**: `wrangler.toml` の `[env.staging.vars]` を正しい staging API URL に更新 → `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
- **AC trace**: AC-2 / AC-4 fail
- **検査ヒント**: `staging-curl.log` 中に `localhost` 文字列が混入していないことを `grep -v 'localhost'` で確認

### Case E: Workers cold start タイムアウト

- **シグナル**: 初回 curl が 30 秒以上応答せず / 503 / 522 を返し、再実行で 200 になる
- **原因**: Worker の cold start で初期化処理（D1 prepared statement / OpenNext bundle 読み込み）が CPU time 上限に当たる
- **切り分け**:
  ```bash
  curl -s -o /dev/null -w "first: %{http_code} time: %{time_total}\n" "${BASE}/members"
  sleep 2
  curl -s -o /dev/null -w "warm:  %{http_code} time: %{time_total}\n" "${BASE}/members"
  ```
- **復旧**: 2 回目以降が 200 ならフレーキー扱い（`local-curl.log` / `staging-curl.log` に retry note を追記）。3 回連続失敗なら Phase 5 STEP 6 に戻り deploy bundle size を点検
- **AC trace**: AC-1 / AC-2 fail（再現性無しの場合は flaky note）

### Case F: CORS preflight 失敗

- **シグナル**: ブラウザコンソールに `Access to fetch at 'https://...api.../public/members' from origin 'https://...web...' has been blocked by CORS policy` / OPTIONS リクエストが 4xx
- **原因**: `apps/api` の Hono CORS middleware で `apps/web` の origin が許可されていない
- **切り分け**:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS \
    -H "Origin: https://ubm-hyogo-web-staging.daishimanju.workers.dev" \
    -H "Access-Control-Request-Method: GET" \
    https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/members
  # 期待: 204 / 200
  ```
- **復旧**: `apps/api/src/index.ts` の CORS allowed origin に staging web URL 追加（**コード変更を伴うため別 PR**）
- **AC trace**: AC-2 fail
- **scope**: 本タスクは検出のみ。修正は別 followup task

### Case G: Service binding（API_SERVICE）未到達

- **シグナル**: staging で `/members` が空 / 5xx を返し、Network 上 `apps/api` への外部 fetch が起きていない
- **原因**: `apps/web/wrangler.toml` の `[[env.staging.services]] binding = "API_SERVICE"` が `apps/api` の deployed name と一致しない / `apps/api` が staging に未 deploy
- **切り分け**:
  ```bash
  grep -A3 'services' apps/web/wrangler.toml
  # 期待: service = "ubm-hyogo-api-staging"
  curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/members
  ```
- **復旧**: `apps/api` を先に deploy → `apps/web` を後から deploy
- **AC trace**: AC-2 / AC-4 fail

### Case H: stale cache / pre-deploy cache hit

- **シグナル**: `apps/web` deploy 直後の curl が更新前の内容を返す / `/members` の seed 件数が古い
- **原因**: Cloudflare edge cache や `next/cache` の stale entry
- **切り分け**:
  ```bash
  curl -sI "${BASE}/members" | grep -iE 'cf-cache-status|cache-control|age'
  curl -s "${BASE}/members?_cb=$(date +%s)" -o /dev/null -w "bust: %{http_code}\n"
  ```
- **復旧**: query string で cache busting して再確認 / Cloudflare dashboard から該当 zone の cache purge（dashboard 操作は user 承認 gate）
- **AC trace**: AC-2 fail（一時的）

### Case I（補助）: member seed 0 件

- **シグナル**: `/public/members` が `200` だが `items: []`
- **原因**: 当該環境に seed 未投入、または migration 後に seed 実行漏れ
- **切り分け**:
  ```bash
  bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT COUNT(*) FROM members;"
  ```
- **復旧**: 02b / 04a の seed 手順に従い投入。本タスク内で seed 追加は scope out
- **AC trace**: AC-3（real D1 経路 evidence）fail

## 検出方針サマリ

| Case | 1次検出 | 2次検出 |
| --- | --- | --- |
| A | wrangler 起動 stdout | `bash scripts/cf.sh whoami` 成否 |
| B | api `/public/members` 500 | `cf.sh d1 list` |
| C | API レスポンスの SQL error | `d1 migrations list` |
| D | staging /members 空 / network log | `wrangler.toml` grep |
| E | curl `time_total` > 30s | retry 結果 |
| F | ブラウザコンソール CORS | `curl -X OPTIONS` |
| G | apps/api 直叩きとの差分 | services binding の grep |
| H | `cf-cache-status: HIT` | cache busting curl |
| I | `items.length == 0` | `d1 execute SELECT COUNT` |

## 共通原則

- **wrangler 直接実行禁止**: 切り分け中も `bash scripts/cf.sh` 経由のみ
- **secret hygiene**: API token / D1 ID 実値 / OAuth token は log を含め一切記録しない
- **再現性**: 異常時は最低 1 回は再実行し、フレーキー由来か恒常障害かを切り分け
- **scope 越境禁止**: 04a API 実装変更 / 02b migration 新規追加 / CORS middleware 修正 は本タスクで実施しない（別 followup へ送る）

## コード変更の取り扱い

| Case | コード変更要否 | scope |
| --- | --- | --- |
| A | なし（運用ポリシー違反の検出） | in |
| B | wrangler.toml 修正の可能性 | **in（検出のみ・修正は別 PR）** |
| C | migration apply のみ | in |
| D | wrangler.toml 修正 | **in（検出のみ・修正は別 PR）** |
| E | bundle size 削減等 | out |
| F | apps/api CORS middleware | **out** |
| G | wrangler.toml services binding | **in（検出のみ・修正は別 PR）** |
| H | cache 戦略変更 | out |
| I | seed 投入 | out（02b / 04a） |

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 異常検出はすべて `outputs/phase-11/evidence/` 内に追記する（別ファイル新設しない）

## サブタスク管理

- [ ] Case A〜I の検出コマンドが Phase 5 STEP に対応している
- [ ] 各 Case の AC trace が Phase 7 ac-matrix の戻し先列と整合
- [ ] 共通原則（wrangler 直接禁止 / secret hygiene / scope 越境禁止）が明記
- [ ] outputs/phase-06/main.md を作成

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `outputs/phase-06/main.md`

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 統合テスト連携

この workflow は実行仕様作成 wave のため、新規テストコードは追加しない。Phase 11 実行時に curl / screenshot / D1 evidence を保存する。

## 完了条件

- [ ] 8+1 Case それぞれにシグナル / 原因 / 切り分け / 復旧 / AC trace が揃っている
- [ ] wrangler 直接実行を伴うコマンドが含まれていない
- [ ] secret を log に出さない原則が明記されている
- [ ] AC matrix（Phase 7）への戻し先と一致

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様であり既存タスクの復活でない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、各 AC 失敗時の戻し先（Case A〜I のいずれか）と evidence ファイル名（`outputs/phase-11/evidence/{local,staging}-curl.log` / `outputs/phase-11/evidence/{local,staging}-*.png`）の対応を渡す。

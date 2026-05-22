[実装区分: 実装仕様書]

# Phase 11: 手動 smoke / NON_VISUAL alternative evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| 前 Phase | 10（ロールアウト/ロールバック方針 — 別 task で確定済前提） |
| 次 Phase | 12（ドキュメント更新） |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL（CLI / Cloudflare dashboard / curl / GraphQL Analytics のため screenshot 取得不可） |
| scope | cloudflare_edge_security |
| workflow_state | implemented-local-runtime-pending |
| user_approval_required | true（実 apply / Enforce 切替 / production curl 連打は Phase 13 の三役ゲート / G1-G4 multi-stage approval gate を経由） |
| 実行ステータス | **NOT EXECUTED — awaiting Phase 13 user approval** |

> **本 Phase の責務**: smoke 項目 S-01..S-05 のコマンド系列・期待値・evidence 保管先を「仕様レベル」で固定する。実走（staging への apply / curl 連打 / GraphQL 取得 / Simulate→Enforce 切替）は Phase 13 ユーザー明示承認後の別オペレーションで行う。本 Phase では `outputs/phase-11/` 配下のサブ evidence ファイルは生成しない（NOT EXECUTED が正）。

## 目的

NON_VISUAL evidence の root files と runtime-pending smoke matrix を固定し、spec evidence と Cloudflare runtime PASS を分離する。

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由: 本タスクは Cloudflare edge の WAF / Rate Limiting Rules 設定であり、UI / Renderer / 画面遷移は一切発生しない。evidence は CLI 出力（`scripts/cf-waf-apply.sh --dry-run` の stdout）/ curl `-i` 応答 / Cloudflare GraphQL Analytics API レスポンス / dashboard snapshot ID で構成される。
- screenshot は不要（生成禁止: false green 防止）。`outputs/phase-11/screenshots/` は作成しない。
- 代替 evidence は `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` の 4 階層（L1: コマンド出力 / L2: ログ / L3: 応答 JSON / L4: dashboard snapshot ID）に準拠する。

## 適用テンプレ（NON_VISUAL 縮約 + 4 階層代替 evidence）

| 区分 | 採用テンプレ | 根拠 |
| --- | --- | --- |
| 必須 outputs 構成 | `phase-template-phase11.md` §「docs-only / NON_VISUAL 縮約テンプレ」 | `visualEvidence == NON_VISUAL` 自動分岐 |
| 4 階層代替 evidence | `phase-11-non-visual-alternative-evidence.md` §「代替 evidence の 4 階層」 | runtime 振る舞い検証が一部必要なため L3 / L4 を併用 |
| 状態語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | 仕様書 contract は完了 / runtime evidence は Phase 13 G1-G4 承認後 |

## smoke 仕様（S-01 .. S-05）

> **共通**: 全 5 件は Phase 13 ユーザー承認後に実走する。本 Phase ではコマンド系列・期待 stdout・失敗時切り分け・evidence 保管先の「仕様レベル固定」のみ。実 evidence ファイルは Phase 13 実走時に生成する。

### S-01: `scripts/cf-waf-apply.sh --dry-run` の JSON 出力検証

| 項目 | 内容 |
| --- | --- |
| 観点 | `scripts/cf-waf-apply.sh --dry-run` が `scripts/cf-waf-apply/config.json` を読み込み、Cloudflare API へ送信予定の payload を JSON 出力する。冪等性（同じ config を 2 回 apply しても差分 0）が確認できる |
| 前提 | `scripts/cf-waf-apply.sh` 実装済（Phase 5）/ `scripts/cf-waf-apply/config.json` 存在 / `op run` 経由で `CLOUDFLARE_API_TOKEN` 注入可能 |
| コマンド系列 | `bash scripts/cf-waf-apply.sh --dry-run --mode simulate \| jq .` |
| 期待 stdout | JSON 出力に `zones[]` / `managedRulesets[]` / `customRules[]`（5 件以内）/ `rateLimitRules[]`（AUTH/ADMIN/ME/PUBLIC 4 グループ）が含まれる。`mode == "simulate"` で全ルールが simulate 設定 |
| 期待 exit code | `0`（差分なし冪等性確認時）/ `3`（dry-run で差分あり = CI gate 用） |
| 失敗時切り分け | (a) exit 1 → `op run` 失敗 / token missing / config json invalid → `bash scripts/cf.sh whoami` で auth 確認 / (b) exit 2 → Cloudflare API error → token scope（`Zone.WAF` / `Zone.RateLimit`）確認 / (c) JSON shape 不一致 → 実装 drift（Phase 5 PR 差し戻し） |
| AC マッピング | AC-1 / AC-2 / AC-10（wrangler 直接呼び出し 0 件） / NFR-2（冪等性） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-01 区画 + `outputs/phase-11/cf-waf-apply-dry-run.json`（L1 + L3） |

### S-02: staging 適用後、curl 連打で 429 応答取得（path / 閾値 / retry-after header 検証）

| 項目 | 内容 |
| --- | --- |
| 観点 | staging zone に Simulate→Enforce 切替後、Phase 2 マトリクスの 4 グループ（AUTH / ADMIN / ME / PUBLIC）について閾値超過時に 429 + `retry-after` ヘッダが返ることを確認する |
| 前提 | S-01 PASS / staging zone に `--mode simulate` で apply 済 / 観測 7 日後の Enforce 切替済（Phase 13 G3 相当） / app-layer rate limit middleware（`rate-limit-magic-link.ts` / `rate-limit-self-request.ts`）が edge と二重カウントしない設計が Phase 6 で test 済 |
| コマンド系列（AUTH 例） | `for i in $(seq 1 15); do curl -sS -o /dev/null -w "%{http_code} retry-after=%{header_retry_after}\n" -X POST "https://<staging-api-host>/api/auth/magic-link" -H 'Content-Type: application/json' -d '{"email":"smoke@example.test"}'; done` |
| 期待 stdout（AUTH） | 1〜10 件目: `200`（または 4xx の業務エラー）/ 11 件目以降: `429 retry-after=60`（Phase 2 §Concern A: AUTH 60s/10req） |
| 期待 stdout（ADMIN） | 1〜30 件目: 200/4xx / 31 件目以降: `429 retry-after=<managed_challenge>`（managed challenge action のため retry-after 値は dashboard で確認） |
| 期待 stdout（ME） | 1〜60 件目: 200 / 61 件目以降: `429 retry-after=30` |
| 期待 stdout（PUBLIC） | 10 秒以内に 51 件目以降: `429 retry-after=10` |
| 期待 body 形式 | edge / app-layer 双方で `{ "error": "rate_limited", "retryAfterSec": <number> }`（AC-5 / Phase 3 §3 helper 仕様） |
| 失敗時切り分け | (a) 429 にならない → 閾値設定 drift（config json 確認）/ (b) 429 だが retry-after 欠落 → Cloudflare ルール定義 drift / (c) 429 body が edge と app-layer で形式違い → `edge-rate-limit-headers.ts` helper 適用漏れ → Phase 5 PR 差し戻し / (d) 業務影響（正常ユーザの誤ブロック）→ 閾値を一段緩和して再 Simulate |
| AC マッピング | AC-3（4 グループ閾値）/ AC-5（429 wire format 統一）/ AC-8（CI smoke で miniflare 再現）/ NFR-4（既存 app-layer 互換維持） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-02 区画 + `outputs/phase-11/curl-429-{auth,admin,me,public}.log`（L1）+ `outputs/phase-11/response-429-headers.txt`（L3） |
| 注意 | staging への curl 連打のみ。production への curl 連打は Phase 13 G1-prod / G3-prod 追加承認後にのみ実行 |

### S-03: Cloudflare GraphQL Analytics API で block / throttle カウント取得

| 項目 | 内容 |
| --- | --- |
| 観点 | Simulate モード期間中の `waf.rateLimitsAdaptiveGroups` / `firewallEventsAdaptiveGroups` に S-02 で発火させた件数がカウントされており、kind=`rateLimit` / `managed` / `customRule` で分類できる |
| 前提 | S-02 実行済 / Cloudflare Account Analytics API token 取得済（key 名のみ確認・値は転記禁止） |
| コマンド系列 | `op run --env-file=.env -- curl -sS -X POST "https://api.cloudflare.com/client/v4/graphql" -H "Authorization: Bearer ${CLOUDFLARE_ANALYTICS_TOKEN}" -H "Content-Type: application/json" --data @scripts/cf-waf-apply.analytics-query.graphql \| jq .` |
| 期待 stdout | `data.viewer.zones[].rateLimitsAdaptiveGroups[]` に `dimensions.action == "log"`（Simulate）または `"block"`（Enforce）/ `count > 0` / 期間内の `kind` 別 breakdown |
| 失敗時切り分け | (a) `count == 0` → S-02 で 429 を発火させる前にクエリ実行（時刻整合確認）/ (b) 401/403 → token scope 不足（`Account Analytics:Read`）/ (c) GraphQL schema error → Cloudflare 側 API 仕様変更 → runbook 更新 |
| AC マッピング | AC-6（Simulate→Enforce 移行 gate の観測根拠）/ NFR-1（無料枠 GraphQL API 範囲内） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-03 区画 + `outputs/phase-11/graphql-analytics-{simulate,enforce}.json`（L3） |

### S-04: Simulate モード 7 日間の false positive 率 < 0.1%

| 項目 | 内容 |
| --- | --- |
| 観点 | Simulate モードで 7 日間連続観測し、`action=log` のうち whitelisted user-agent / 内部 IP / 通常会員 access からの誤検知が 0 件、または false positive 率が 0.1% 未満であることを GraphQL Analytics 結果から確定する |
| 前提 | S-03 で取得経路が PASS / 観測 7 日間継続 / Cloudflare Security Events で対象期間のログを GraphQL で集計可能 |
| コマンド系列 | `op run --env-file=.env -- curl -sS -X POST "https://api.cloudflare.com/client/v4/graphql" --data @scripts/cf-waf-apply.fp-rate-query.graphql \| jq '.data.viewer.zones[].firewallEventsAdaptiveGroups[] \| select(.dimensions.action == "log") \| {clientIP: .dimensions.clientIPClass, ua: .dimensions.userAgent, count: .count}'` |
| 期待 stdout | 期間 7 日 / 総 log 件数 N / うち noise（既知の admin emergency / 内部 monitoring user-agent）を除いた誤検知件数 M / `M / total_legit_traffic < 0.001` |
| 失敗時切り分け | (a) FP 率 ≥ 0.1% → Phase 2 マトリクス閾値再調整 → 一段緩めて Simulate 7 日延長（Phase 12 lessons-learned に記録）/ (b) 観測期間内に traffic spike（外部要因）発生 → 期間延長 / (c) whitelisted user-agent が allowlist に未登録 → runbook の allowlist セクション更新 |
| AC マッピング | AC-6（観測 7 日 / 誤検知 0）/ Phase 1 苦戦箇所 #1（閾値設定の難しさ） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-04 区画 + `outputs/phase-11/false-positive-rate-7days.md`（L1 集計表 + L4 dashboard URL + capture timestamp + snapshot ID） |
| 注意 | 本 smoke は **観測ベース**。実走には連続 7 日のカレンダー時間が必要。Phase 13 G1 staging deploy 完了後すぐに開始し、G3-prod（Enforce 切替）の前提条件として完了させる |

### S-05: production enforce 移行後、誤検知 0 を 24h 観測

| 項目 | 内容 |
| --- | --- |
| 観点 | S-04 PASS 後、production zone を `--mode enforce` へ切り替え、24 時間連続観測で誤検知（正常会員 access の 429 ブロック）が 0 件であることを確定する |
| 前提 | S-04 PASS / Phase 13 G3-prod 追加承認取得 / `bash scripts/cf-waf-apply.sh --mode enforce --zone <PROD_ZONE>` 実行済 / rollback 手順（`bash scripts/cf-waf-apply.sh --mode simulate --zone <PROD_ZONE>` で即時 simulate 復帰）が runbook に明記済 |
| コマンド系列 | (1) Enforce 切替直後の sanity: `curl -i https://<production-api-host>/api/auth/magic-link` 数回 → 通常時 200/4xx / (2) 24h 後集計: GraphQL Analytics で `action=block` の件数を `clientIPClass=normal` 等の noise filter 後に算出 |
| 期待 stdout | 24h 集計結果 / `block 件数 - 既知 attacker pattern == 0` / customer support / Slack で誤ブロック報告が 0 件 |
| 失敗時切り分け | (a) 誤ブロック報告 1 件以上 → 即時 `bash scripts/cf-waf-apply.sh --mode simulate --zone <PROD_ZONE>` で rollback / Phase 2 マトリクス閾値再調整 / Phase 12 lessons-learned に記録 / (b) Enforce 切替直後にレイテンシ悪化 → Cloudflare 側 incident の可能性 → status page 確認 / (c) app-layer rate limit との二重カウント疑い → `edge-rate-limit-headers.ts` helper の `reason` フィールドで edge / app の分類を確認 |
| AC マッピング | AC-6（Enforce 移行 gate）/ Phase 3 §6 NO-GO 条件「Simulate 観測未完了で Enforce 切替」の逆条件確認 |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-05 区画 + `outputs/phase-11/enforce-24h-observation.md`（L1 + L4 dashboard snapshot ID） |
| 注意 | **production への mutation**。Phase 13 で **G3-prod 追加承認**（staging 用 G3 approve とは別の明示文言）が必要。rollback は逆順（enforce → simulate）で即時可能 |

## 4 階層代替 evidence 設計

| 階層 | 種別 | 保管先（予定） | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- | --- |
| **L1** | コマンド出力（`bash scripts/cf-waf-apply.sh --dry-run` / curl `-i` の stdout / GraphQL レスポンス jq 抽出） | `outputs/phase-11/manual-smoke-log.md` の S-01..S-05 各区画 | 実行コマンドと応答ボディの再現性 | network 障害時の振る舞い / 並列性 |
| **L2** | ログ（`bash scripts/cf.sh tail --config apps/api/wrangler.toml --env <env>` の 5 分間 tail / Workers 例外ログ） | `outputs/phase-11/wrangler-tail-{staging,production}.log` | edge ルールが先に発火し apps/api に到達しないことの runtime 確認（特に S-02 の AUTH path） | 長期間の drift |
| **L3** | 応答 JSON / headers raw（curl `-D` で headers + body 保存） | `outputs/phase-11/response-429-headers.txt` + `outputs/phase-11/curl-429-{auth,admin,me,public}.log` + `outputs/phase-11/graphql-analytics-{simulate,enforce}.json` + `outputs/phase-11/cf-waf-apply-dry-run.json` | レスポンス schema（`{ error, retryAfterSec }`）/ `retry-after` header の wire format 一致 | 内部閾値カウンタの実装詳細 |
| **L4** | Cloudflare Analytics dashboard snapshot ID / GraphQL クエリ ID（dashboard URL + capture timestamp + snapshot ID 文字列のみ。スクショ画像は保管しない） | `outputs/phase-11/cf-analytics-snapshot-ids.md` + `outputs/phase-11/false-positive-rate-7days.md` + `outputs/phase-11/enforce-24h-observation.md` | block 件数 / 5xx rate / 7 日 baseline / 24h 観測の時系列 evidence | 観測対象外の zone / route |

> **値の転記禁止**: API token / 1Password URI / OAuth token / 実 IP / customer email を evidence に転記しない。L3 の curl 出力では request body の email を `<redacted>` に置換、L4 の dashboard では snapshot ID 文字列のみ記録（CLAUDE.md §シークレット管理）。

## 代替 evidence 差分表（保証範囲 / 保証できない範囲）

| smoke | 元前提（理想 evidence） | 採用代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-01 | Cloudflare API 直叩き本番 apply の差分検証 | dry-run + JSON snapshot diff（fixture 比較）| script の冪等性 / payload shape | Phase 13 G1（staging apply）/ G3-prod（production apply） |
| S-02 | production 連打での 429 観測 | staging への curl 連打 + miniflare 再現テスト（CI smoke / AC-8） | 4 グループ閾値 / retry-after wire format | Phase 13 G3-prod（production curl 連打追加承認）|
| S-03 | dashboard 直接 screenshot | GraphQL Analytics API + jq 抽出 | block / throttle カウント分類 | Cloudflare Pro 移行時の Bot Management 集計（runbook TODO） |
| S-04 | 7 日連続自動監視 | 手動週次クエリ + lessons-learned 記録 | FP 率 < 0.1% の確証 | UT-16 監視・アラートで自動化（並走 task）|
| S-05 | production 24h 自動誤検知検出 | GraphQL 24h 集計 + customer support チャネル監視 | enforce 後の業務影響 0 件 | UT-16 監視・アラートに enforcement 後の継続監視を引き継ぐ |

## 期待値テンプレ更新方針（drift 防止）

- 本 Phase で固定する 4 グループ閾値（AUTH 10/60s / ADMIN 30/60s / ME 60/60s / PUBLIC 50/10s）と `{ error, retryAfterSec }` body 形式が、`scripts/cf-waf-apply/config.json` / `apps/api/src/middleware/edge-rate-limit-headers.ts` の実装値と drift しないことを Phase 13 実走前に jq で突合する。
- drift 検知手順: `bash scripts/cf-waf-apply.sh --dry-run --mode simulate \| jq '.rateLimitRules[] \| {group, period, threshold}'` の出力と、本 Phase 11 §smoke 仕様の閾値表を diff する。
- 本 Phase の扱い: **実ファイル更新は実施しない**。Phase 13 実走時に drift 検知 → 不一致なら Phase 5 / 9 へ差し戻し。

## 実行タスク

1. S-01..S-05 の 5 件すべてが 8 軸（観点 / 前提 / コマンド系列 / 期待 stdout / 期待 status / 失敗時切り分け / AC マッピング / evidence 出力先）で記述されている（完了条件: 各 smoke に 8 軸が揃う）
2. 4 階層代替 evidence（L1〜L4）の保管先・保証範囲・secret 混入防止ルールを表化（完了条件: L1〜L4 の保存先がある）
3. `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止を全コマンド例で確認（完了条件: 文中に `wrangler` 直接実行が現れない）
4. `outputs/phase-11/screenshots/` を作成しない方針を明記（完了条件: NON_VISUAL と矛盾しない）
5. 期待値テンプレ drift 防止方針を固定（完了条件: 実ファイル更新は Phase 13 実走時のみ）
6. 「実走 / 実 evidence ファイル生成は Phase 13 ユーザー承認後」を冒頭・成果物・完了条件で 3 重明記（完了条件: 自動実行禁止が明記される）
7. Phase 12 documentation に渡す smoke evidence 項目を固定（完了条件: implementation-guide / changelog への転記対象がある）

## 実行手順

### ステップ 1: S 系列 smoke 5 件の仕様確定

各 S-XX について 8 軸を埋め、AC マッピングを `index.md` AC-1..AC-10 と double-check する。

### ステップ 2: 4 階層代替 evidence 設計の固定

L1〜L4 の保管先・保証範囲・secret 混入防止ルールを表化する。

### ステップ 3: `scripts/cf.sh` 徹底の確認

本 Phase の全コマンド例が `bash scripts/cf.sh ...` または `bash scripts/cf-waf-apply.sh ...`（内部で `op run` + `cf.sh` を呼ぶ）経由で記述され、`wrangler` 直接実行が一切現れないことを grep で確認する。

### ステップ 4: 「実走 / 実ファイル更新は Phase 13 ユーザー承認後」の明示

本 Phase が仕様レベル定義のみであることを冒頭・成果物・完了条件で 3 重に明記する。

### ステップ 5: Phase 13 G1-G4 multi-stage approval gate との接続

| smoke | 連動 gate | 承認文言 |
| --- | --- | --- |
| S-01 | （事前検証）| Phase 13 G1 approve 前に dry-run 実施可能（mutation 無し） |
| S-02 staging | G1 staging deploy approve 後 | curl 連打は staging のみ |
| S-02 production | G1-prod approve 後 | production curl 連打は別承認必須 |
| S-03 / S-04 | G1 後の継続観測 | mutation 無し（read-only GraphQL） |
| S-05 | G3-prod approve 後（Enforce 切替） | 切替自体が production mutation のため明示文言「G3-prod approve」必須 |

## 必須 outputs（NON_VISUAL 縮約 3 点 + 4 階層 sub-evidence）

| ファイル | 役割 | 最小フォーマット | 生成タイミング |
| --- | --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL）/ 状態語彙（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）/ 必須 outputs 一覧 / 4 階層 evidence 表 / 申し送り先 | Phase 13 実走時 |
| `outputs/phase-11/manual-smoke-log.md` | S-01..S-05 実行記録 | 「smoke ID / 実行コマンド / 期待結果 / 実測 / PASS or FAIL / NOT EXECUTED」テーブル | Phase 13 実走時（本 Phase では NOT EXECUTED） |
| `outputs/phase-11/link-checklist.md` | 仕様書 → 実装ファイル / config / runbook / fixture への参照リンク有効性 | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル | Phase 13 実走時 |
| `outputs/phase-11/cf-waf-apply-dry-run.json` | S-01 L3 evidence | dry-run JSON 出力（secret redact） | Phase 13 実走時 |
| `outputs/phase-11/curl-429-{auth,admin,me,public}.log` | S-02 L1 evidence | curl 連打の status / retry-after / body | Phase 13 実走時 |
| `outputs/phase-11/response-429-headers.txt` | S-02 L3 evidence | headers raw（PII redact） | Phase 13 実走時 |
| `outputs/phase-11/graphql-analytics-{simulate,enforce}.json` | S-03 L3 evidence | GraphQL response（token redact） | Phase 13 実走時 |
| `outputs/phase-11/false-positive-rate-7days.md` | S-04 L1+L4 evidence | 7 日集計表 + dashboard snapshot ID | Phase 13 実走時 |
| `outputs/phase-11/enforce-24h-observation.md` | S-05 L1+L4 evidence | 24h 集計 + dashboard snapshot ID | Phase 13 実走時 |
| `outputs/phase-11/wrangler-tail-{staging,production}.log` | L2 evidence | `bash scripts/cf.sh tail` 出力（PII redact） | Phase 13 実走時 |
| `outputs/phase-11/cf-analytics-snapshot-ids.md` | L4 evidence index | dashboard URL + capture timestamp + snapshot ID 文字列のみ | Phase 13 実走時 |

> 本 Phase 11 仕様書では上記 sub-evidence ファイルの **実体は生成しない**。Phase 13 実走時に NOT EXECUTED → EXECUTED へ移行する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6（test 実行）| miniflare 429 smoke（AC-8 / `rate-limit-headers-smoke`）が CI で PASS していることを S-02 の前提とする |
| Phase 9（コード品質）| `coverage-guard.sh` exit 0 が Phase 11 実走前提 |
| Phase 12（documentation）| smoke 結果 → implementation-guide.md Part 2 / system-spec-update-summary（runbook 反映）/ documentation-changelog（実走日 / FP 率 / Enforce 切替日） |
| Phase 13（PR 作成）| G1-G4 multi-stage approval gate に S-01..S-05 を 1:1 で割当（承認文言を gate ごとに別取得）|
| UT-16 監視・アラート（並走）| S-04 / S-05 の継続監視を UT-16 へ引き継ぎ（waf.rateLimitsAdaptiveGroups の baseline / アラート閾値）|

## 多角的チェック観点

- **不変条件 #5 違反**: smoke が `apps/web` から D1 を直接叩く構造を前提にしていないか。すべて `apps/api` の HTTP endpoint 経由で実行される
- **smoke drift**: 本 Phase の閾値（AUTH 10/60s 等）と `scripts/cf-waf-apply/config.json` 実装値が drift していないか。Phase 13 実走時に jq 突合
- **retry-after wire format**: edge / app-layer 双方で `{ error: "rate_limited", retryAfterSec }` body と `retry-after` header が一致するか（AC-5）
- **二重カウント**: 既存 `rate-limit-magic-link.ts`（per-email + per-IP / 1h）と edge AUTH（per-IP / 60s）が独立して機能し、正常ユーザの誤ブロックを起こさないか（Phase 1 苦戦箇所 #5）
- **`scripts/cf.sh` 徹底**: deploy / tail / d1 / API 呼び出しがすべて wrapper 経由か。文中に `wrangler` 直接実行 0 件
- **secret 混入防止**: L1〜L4 evidence に API token / 1Password URI / customer email / 実 IP が転記されていないか
- **無料枠制約**: customRules が 5 件以内（Cloudflare Free）/ Rate Limiting Rules が無料枠範囲内であることを S-01 dry-run JSON で確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | S-01（dry-run JSON 検証）仕様確定 | 11 | spec_created | AC-1 / AC-2 / AC-10 / NFR-2 |
| 2 | S-02（429 + retry-after）仕様確定 | 11 | spec_created | AC-3 / AC-5 / AC-8 |
| 3 | S-03（GraphQL Analytics）仕様確定 | 11 | spec_created | AC-6 / NFR-1 |
| 4 | S-04（FP 率 7 日 < 0.1%）仕様確定 | 11 | spec_created | AC-6 / 苦戦箇所 #1 |
| 5 | S-05（production 24h 観測）仕様確定 | 11 | spec_created | AC-6 / NO-GO 逆条件 |
| 6 | 4 階層代替 evidence 設計確定 | 11 | spec_created | L1〜L4 |
| 7 | `scripts/cf.sh` 徹底確認 | 11 | spec_created | wrangler 直接実行 0 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-11.md | 本ファイル（S-01..S-05 仕様 / 4 階層 evidence / drift 防止方針） |

> 本 Phase の主成果物は `phase-11.md` 単独。`outputs/phase-11/` 配下のサブ成果物は **Phase 13 実走時にのみ生成** する。`screenshots/` ディレクトリは作成しない（NON_VISUAL 整合）。

## 完了条件

- [ ] S-01..S-05 の 5 件すべてが 8 軸（観点 / 前提 / コマンド系列 / 期待 stdout / 期待 status / 失敗時切り分け / AC マッピング / evidence 出力先）で記述されている
- [ ] 4 階層代替 evidence（L1: コマンド出力 / L2: ログ / L3: 応答 JSON / L4: dashboard snapshot ID）の保管先と保証範囲が表化されている
- [ ] 代替 evidence 差分表で「保証範囲 / 保証できない範囲 / 申し送り先」が明示されている
- [ ] 本 Phase 内の全コマンド例が `bash scripts/cf.sh` または `bash scripts/cf-waf-apply.sh` 経由で記述され、`wrangler` 直接実行が一切現れない
- [ ] `outputs/phase-11/screenshots/` を作成しない方針が明記されている
- [ ] 「実走 / 実 evidence ファイル生成は Phase 13 ユーザー承認後」が冒頭・成果物・完了条件で 3 重明記されている
- [ ] Phase 13 G1-G4 multi-stage approval gate と smoke S-01..S-05 の対応表が含まれる
- [ ] 不変条件 #5 / smoke drift / retry-after wire format / 二重カウント / scripts/cf.sh 徹底 / secret 混入防止 / 無料枠制約 の 7 観点が多角的チェックに含まれる
- [ ] 本 Phase の status が `spec_created` で artifacts.json と整合する

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- `phase-11.md` 配置済み
- `wrangler` 直接実行が文中に存在しない
- 不変条件 #5 / `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止 が明記されている
- artifacts.json の `phases[10].status` が `spec_created`
- 状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` が main.md 仕様に予約されている

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する
2. **「実走した」と書かない**: 本 Phase は仕様レベル定義のみ。manual-smoke-log.md は Phase 13 実走時に NOT EXECUTED → EXECUTED へ移行
3. **production curl 連打を staging と同じ承認で実行しない**: G1-prod / G3-prod の追加承認文言を別途取得（合算承認禁止）
4. **GraphQL Analytics token を evidence に転記しない**: response JSON 保存時に `Authorization` header を redact、token 値は dump しない
5. **Simulate 観測 7 日を短縮しない**: 苦戦箇所 #1 の通り閾値設定の難しさは観測期間でしか解消できない。観測短縮は誤検知見落としの直接原因
6. **二重カウント判定**: edge と app-layer の 429 を区別できるよう `edge-rate-limit-headers.ts` の `reason: "edge" | "app"` を必ず付与し、L3 evidence で確認

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - S-01..S-05 のコマンド系列（implementation-guide.md / runbook 化候補）
  - 4 階層代替 evidence（L1〜L4）の保管先テンプレ
  - `scripts/cf-waf-apply/config.json` の閾値と本 Phase 期待値の drift 検知手順を Phase 13 実走前チェックリストへ

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-template-phase11.md` | NON_VISUAL evidence template |
| `phase-13.md` | G1-G4 approval mapping |
  - UT-16 監視・アラート並走 task への S-04 / S-05 継続監視引き継ぎ事項
- ブロック条件:
  - `wrangler` 直接実行が記述に残っている
  - S 系列 5 件のいずれかが 8 軸を満たしていない
  - 4 階層 evidence のいずれかの保管先が未確定
  - `outputs/phase-11/screenshots/` を作成している
  - 不変条件 #5 違反の smoke 経路（apps/web から D1 直接アクセス）が混入
  - secret / 1Password URI / customer email / 実 IP が evidence 仕様に転記されている

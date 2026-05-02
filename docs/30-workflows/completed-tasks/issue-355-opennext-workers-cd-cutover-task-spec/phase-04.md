# Phase 4: テスト仕様化（実行可能テスト spec）

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 3 で採番したテスト計画 T-01〜T-42 を、実行コマンド・given/when/then・期待値・対応 AC まで明示した「実行可能テスト仕様」に展開する |
| 入力 | Phase 1 AC-1〜AC-6 / RISK-1〜RISK-5、Phase 2 wrangler.toml 最終形 / web-cd.yml 差分 / runbook 設計骨子、Phase 3 T-01〜T-42 / NO-GO 条件 / evidence 取得計画 |
| 出力 | `outputs/phase-04/test-spec.md`、`outputs/phase-04/no-go-thresholds.md`、`outputs/phase-04/contract-test-spec.md`、`outputs/phase-04/rollback-drill-spec.md` |
| 完了条件 | T-01〜T-42 全件に given/when/then と実行コマンドが付与 / 各テストが AC へトレース / NO-GO 閾値が数値化 / contract test（workflow grep）が CI 投入可能形で書ける状態 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト仕様化 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 3（テスト計画） |
| 次 Phase | 5（実装テンプレ / handoff） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 設計方針

1. 本 Phase ではテスト「仕様」を確定する。実テストコードや実行は Phase 5 以降で実装担当が行う。
2. テストは 4 層（L1 単体 build smoke / L2 統合 deploy + Web→API / L3 公開ルート smoke / L4 rollback drill）で構成。Phase 3 の T-01〜T-42 をそのまま採番継承する。
3. NO-GO 条件は数値閾値に変換し、`outputs/phase-04/no-go-thresholds.md` に集約する。
4. contract test は GitHub Actions workflow ファイルと `apps/web/wrangler.toml` の静的検査として、pre-merge CI で実行可能な grep / yq ベースで仕様化する。
5. 全コマンド例は `bash scripts/cf.sh` 経由（CLAUDE.md 規約）。`wrangler` 直叩きは仕様内に書かない。

## L1: 単体（OpenNext build smoke）

### T-01: `build:cloudflare` exit 0

| 項目 | 内容 |
| --- | --- |
| AC | AC-1 |
| given | クリーン worktree（`apps/web/.open-next/` 不在） |
| when | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` を実行 |
| then | exit code = 0 / stderr に `Error` を含まない |
| evidence | `outputs/phase-11/web-cd-deploy-log.md` |

### T-02: OpenNext entrypoint 生成

| 項目 | 内容 |
| --- | --- |
| AC | AC-1 |
| given | T-01 完了後 |
| when | `ls apps/web/.open-next/worker.js` |
| then | ファイル存在 / size > 0 |
| evidence | `outputs/phase-11/wrangler-deploy-output.md` |

### T-03: 静的アセット生成

| 項目 | 内容 |
| --- | --- |
| AC | AC-1 |
| given | T-01 完了後 |
| when | `ls apps/web/.open-next/assets/ \| wc -l` |
| then | 1 以上（非空） |
| evidence | T-02 と同 evidence |

### T-04: wrangler.toml 整合（contract）

| 項目 | 内容 |
| --- | --- |
| AC | AC-5 |
| given | 改修後ブランチ HEAD |
| when | `grep -nE '^pages_build_output_dir' apps/web/wrangler.toml` / `grep -nE '^main\s*=\s*"\.open-next/worker\.js"' apps/web/wrangler.toml` |
| then | 前者 0 件 / 後者 1 件 |
| evidence | grep 結果を CI ログへ |

### T-05: next.config.ts 非互換 key 不在

| 項目 | 内容 |
| --- | --- |
| AC | AC-1 / AC-2 |
| given | 改修後ブランチ HEAD |
| when | `grep -nE 'output:\s*"export"' apps/web/next.config.ts` |
| then | 0 件 |
| evidence | CI ログ |

## L2: 統合（staging deploy + Web→API）

### T-10: web-cd.yml 静的検証 — pages deploy 排除（contract）

| 項目 | 内容 |
| --- | --- |
| AC | AC-2 |
| given | 改修後 `.github/workflows/web-cd.yml` |
| when | `grep -nE 'pages\s+deploy' .github/workflows/web-cd.yml` |
| then | 0 件 |
| evidence | CI ログ |

### T-11: web-cd.yml deploy command（contract）

| 項目 | 内容 |
| --- | --- |
| AC | AC-2 |
| given | 改修後 `.github/workflows/web-cd.yml` |
| when | `grep -nE 'deploy --env staging' .github/workflows/web-cd.yml` および `--env production` |
| then | 各 1 件以上 |
| evidence | CI ログ |

### T-12: dev branch merge → CD 起動

| 項目 | 内容 |
| --- | --- |
| AC | AC-2 |
| given | 改修 PR が `dev` に merge 済 |
| when | GitHub Actions `web-cd / deploy-staging` を観測 |
| then | conclusion = `success` |
| evidence | `outputs/phase-11/wrangler-deploy-output.md` |

### T-13: staging URL 疎通

| 項目 | 内容 |
| --- | --- |
| AC | AC-4 |
| given | T-12 後 |
| when | `curl -sS -o /dev/null -w '%{http_code}' https://ubm-hyogo-web-staging.<account>.workers.dev/` |
| then | 200 もしくは 3xx（home redirect） |
| evidence | `outputs/phase-11/staging-smoke-results.md` |

### T-14: Web→API 連携（service binding）

| 項目 | 内容 |
| --- | --- |
| AC | AC-4 |
| given | staging 稼働 |
| when | API 経由 page を curl（例: 公開ディレクトリの SSR ルート）し、`API_SERVICE` binding 経由で apps/api-staging 応答が反映されるか確認 |
| then | HTTP 200 + body が API 由来データを含む |
| evidence | curl 出力（token 含まないこと） |

### T-15: observability 有効

| 項目 | 内容 |
| --- | --- |
| AC | AC-2 補強 |
| given | staging 稼働 |
| when | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging`（短時間） |
| then | ログストリームが取得可能 / 接続成功 |
| evidence | tail サンプル（30 秒分）／token 含まないこと |

## L3: 公開ルート smoke（UT-06 Phase 11 流用）

T-20〜T-29 は UT-06 Phase 11 S-01〜S-10 を staging URL に対して再実行する。各テストの given/when/then は UT-06 Phase 11 仕様をそのまま継承し、置換するのは「対象 URL を staging Workers URL にする」のみ。

| ID | UT-06 流用元 | 対応 AC |
| --- | --- | --- |
| T-20 | S-01 トップページ | AC-3 |
| T-21 | S-02 公開ディレクトリ | AC-3 |
| T-22 | S-03 認証導線 | AC-3 |
| T-23 | S-04 マイページ | AC-3 |
| T-24 | S-05 管理 BO | AC-3 |
| T-25 | S-06 静的アセット | AC-1 / AC-3 |
| T-26 | S-07 404 ハンドリング（`not_found_handling = "single-page-application"`） | AC-3 |
| T-27 | S-08 robots / sitemap | AC-3 |
| T-28 | S-09 OAuth callback | AC-3 |
| T-29 | S-10 Magic Link redirect | AC-3 |
| T-30 | T-20〜T-29 を集約 | AC-3 |

実行コマンド共通: 各 S ケースの curl / browser 手順を `outputs/phase-11/staging-smoke-results.md` に PASS/FAIL で記録する。

## L4: rollback drill

### T-40: wrangler rollback 実証（staging）

| 項目 | 内容 |
| --- | --- |
| AC | AC-6 / RISK-4 |
| given | staging に 2 つ以上の VERSION_ID が存在 |
| when | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env staging` 実行 → 直後に再 deploy |
| then | rollback 完了 / staging URL 200 / 再 deploy 後も 200 |
| evidence | `outputs/phase-11/rollback-readiness.md` |

### T-41: Pages dormant resume の存在確認

| 項目 | 内容 |
| --- | --- |
| AC | AC-6 / RISK-4 |
| given | 旧 staging Pages project が dormant 状態 |
| when | Cloudflare Dashboard の Pages project 設定画面を確認（実 resume はしない） |
| then | `Resume Deployments` ボタンが活性 |
| evidence | runbook S6 への参照記載 |

### T-42: runbook 6 セクション存在（contract）

| 項目 | 内容 |
| --- | --- |
| AC | AC-6 |
| given | Phase 5 で `outputs/phase-05/cutover-runbook.md` が作成された後 |
| when | `grep -cE '^## S[1-6]\.' outputs/phase-05/cutover-runbook.md` |
| then | 結果 = 6 |
| evidence | CI ログ |

## NO-GO 閾値（数値化）

| ID | 条件 | 数値閾値 | 即時対応 |
| --- | --- | --- | --- |
| NG-1 | smoke FAIL 件数 | T-20〜T-29 のうち FAIL >= 1 | production cutover 保留 / 原因切分 |
| NG-2 | OpenNext build artefact 欠損 | `.open-next/worker.js` size = 0 もしくは不在 | CD 改修 PR を merge しない |
| NG-3 | service binding 解決失敗 | `wrangler deploy` log に `service binding` / `not found` を含む | staging cutover 中止 |
| NG-4 | staging 5xx 率 | T-13 / T-14 5 分 window で 5xx >= 1 件 | 一次 rollback 即時 |
| NG-5 | rollback drill 失敗 | T-40 が exit 非 0 もしくは復旧後 200 取得失敗 | runbook S5 再設計、production cutover 保留 |
| NG-6 | contract test 違反 | T-04 / T-05 / T-10 / T-11 / T-42 のいずれかが期待件数未達 | PR を merge しない |

## AC ↔ テスト 対応表

| AC | 主検証 | 補助 |
| --- | --- | --- |
| AC-1 | T-01 / T-02 / T-03 | T-05 / T-25 |
| AC-2 | T-10 / T-11 / T-12 | T-15 |
| AC-3 | T-20〜T-30 | — |
| AC-4 | T-13 / T-14 | T-15 |
| AC-5 | T-04 | — |
| AC-6 | T-42 | T-40 / T-41 |

## evidence 整合（Phase 11 連携）

Phase 3 の evidence 計画 6 種をそのまま継承し、各テストが何を残すかを上記各テスト表の `evidence` 行に明記済み。screenshot は取得しない（NON_VISUAL）。

## 多角的チェック

- 不変条件 #5: T-14 が D1 直アクセス不在を間接 gate（service binding 経由のみ）
- secret hygiene: evidence ログに API Token / OAuth が含まれないこと（curl `-I` のみ・wrangler log は token mask 後）
- ラッパー強制: 全コマンド例が `bash scripts/cf.sh` 経由
- contract test の CI 投入可能性: T-04 / T-05 / T-10 / T-11 / T-42 はすべて grep 1 行で表現可能

## 完了条件

- [ ] T-01〜T-42 全件に given/when/then と実行コマンドが付与
- [ ] AC-1〜AC-6 すべてに主検証テスト ID が紐づく
- [ ] NO-GO 閾値 6 件が数値表現で確定
- [ ] contract test 5 件（T-04 / T-05 / T-10 / T-11 / T-42）が grep 1 行で記述可能
- [ ] `outputs/phase-04/test-spec.md` に本仕様が転記される

## 成果物

- `outputs/phase-04/test-spec.md`
- `outputs/phase-04/no-go-thresholds.md`
- `outputs/phase-04/contract-test-spec.md`
- `outputs/phase-04/rollback-drill-spec.md`

## 次の Phase

Phase 5: 実装テンプレ化（web-cd.yml patch / wrangler.toml 確認手順 / runbook 本文 / handoff 定義）

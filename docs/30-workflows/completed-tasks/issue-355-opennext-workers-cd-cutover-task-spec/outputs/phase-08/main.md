# Phase 8 main — NON_VISUAL smoke 計画（staging Workers 配信検証）

> 本ファイルは `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/phase-08.md` の outputs 受け皿である。
> CI/CD 品質ゲート（production manual approval / required status checks）と staging cutover 直後の NON_VISUAL smoke 設計を 1 ファイルに集約し、`artifacts.json` の `outputs/phase-08/main.md` 要求を充足する。

---

## 1. Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | staging cutover 完了直後に実施する NON_VISUAL smoke の検証項目・実行コマンド・evidence 取得経路を確定し、Phase 3 の T-13〜T-30 を staging 実環境（OpenNext on Workers）に対し再実行可能な runbook 化する。UT-06 Phase 11 S-01〜S-10 への mapping 表で網羅性を保証する |
| 入力 | Phase 1 AC-1〜AC-6、Phase 2 wrangler.toml 最終形 / web-cd.yml 差分、Phase 3 T-13〜T-30 / NG-1〜NG-5、UT-06 Phase 11 S-01〜S-10 |
| 完了条件 | staging URL 疎通検証コマンド確定 / Web→API service binding 経由疎通検証手順確定 / UT-06 mapping 表確定 / `wrangler` 直接実行は `wrangler tail` 例外のみ |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #355（CLOSED、`Refs #355`） |

## 2. NON_VISUAL である根拠

| 観点 | 内容 |
| --- | --- |
| UI 不在 | 配信形態（Pages → Workers）の差し替えのみ。画面構成・スタイル・コンポーネントに変更なし |
| 操作主体 | CD パイプラインによる自動 deploy。手動再現は `bash scripts/cf.sh deploy` のワンショット |
| 視覚的副作用 | Next.js 出力 HTML が同一であるため、screenshot 比較で得られる情報は実質ゼロ |
| Playwright 適用可否 | 不適用。UT-06 Phase 11 既存 smoke の URL 差替再実行に閉じる |

## 3. CI/CD 品質ゲート

### 3.1 required status checks（GitHub branch protection）

| ブランチ | required check | 役割 |
| --- | --- | --- |
| `dev` | `web-cd / build-staging` | OpenNext build 成功（`.open-next/worker.js` 生成）|
| `dev` | `web-cd / deploy-staging` | `wrangler deploy --env staging` exit 0 |
| `main` | `web-cd / build-production` | production 用 OpenNext build 成功 |
| `main` | `web-cd / deploy-production` | production deploy（manual approval gate 通過後）|
| 共通 | `verify-indexes-up-to-date` | skill indexes drift gate |
| 共通 | typecheck / lint（既存）| 既存 CI の pass を維持 |

### 3.2 production manual approval rule

| 項目 | 値 |
| --- | --- |
| GitHub Environment 名 | `production` |
| protection rule | Required reviewers: solo dev policy のため reviewers は配置しない代わりに、`web-cd.yml` の `deploy-production` job に `environment: production` + `wait-timer: 0` + 手動 trigger 必須化（`workflow_dispatch` または `dev → main` PR merge 後の job pause）|
| 補足 | solo 運用ポリシーで `required_pull_request_reviews=null` を維持しつつ、production への deploy のみ environment protection でユーザー承認を gate 化（Phase 10 R-12 / Phase 13 ユーザー承認ゲートと連動）|

### 3.3 concurrency 制御

`web-cd.yml` の `concurrency.group` は ref 単位で維持し、同一 ref への並列 deploy を抑止する（Phase 10 R-12 と整合）。

## 4. smoke 検証項目（staging）

Phase 3 で確定した T-13〜T-30 を staging URL に対する具体コマンドへ落とし込む。

### グループ 1: HTTP 応答 / Next.js 出力検証

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC / T |
| --- | --- | --- | --- | --- |
| SM-01 | top route HTTP status | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/` | `200` または `3xx` | AC-4 / T-13 |
| SM-02 | HTML レスポンスに Next.js 出力が含まれる | `curl -s https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -E '__next\|_next/static\|next/script'` | 1 件以上ヒット | AC-1 / AC-2 |
| SM-03 | `Content-Type` が `text/html` | `curl -sI https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -i '^content-type:'` | `text/html; charset=utf-8` 相当 | AC-2 |
| SM-04 | `Cache-Control` ヘッダ存在 | `curl -sI https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -i '^cache-control:'` | `Cache-Control` ヘッダが返る | AC-2 |
| SM-05 | 404 ハンドリング | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/__nonexistent__` | `404` | T-26 |

### グループ 2: 静的アセット配信（OpenNext `[assets]` binding）

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC / T |
| --- | --- | --- | --- | --- |
| SM-10 | `_next/static/` 配下 asset の取得 | `ASSET=$(curl -s https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -oE '/_next/static/[^"]+\.(js\|css)' \| head -1); curl -s -o /dev/null -w "%{http_code}\n" "https://ubm-hyogo-web-staging.<account>.workers.dev${ASSET}"` | `200` | AC-1 / T-25 |
| SM-11 | asset の `Cache-Control: immutable` | `curl -sI "https://ubm-hyogo-web-staging.<account>.workers.dev${ASSET}" \| grep -i '^cache-control:'` | `immutable` を含む | T-25 |
| SM-12 | favicon / public 配下 | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/favicon.ico` | `200` または `204` | T-25 |

### グループ 3: Web → API（service binding 経由）

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC / T |
| --- | --- | --- | --- | --- |
| SM-20 | `/api/health` 相当の Web 経由 health route | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/api/health` | `200` | AC-4 / T-14 |
| SM-21 | レスポンスボディに API 応答が含まれる | `curl -s https://ubm-hyogo-web-staging.<account>.workers.dev/api/health \| head -c 200` | apps/api 由来の JSON / テキスト | AC-4 / T-14 |
| SM-22 | service binding 経由の確認 | `wrangler tail ubm-hyogo-web-staging --format=pretty`（別端末）+ SM-20 再叩き | log に `API_SERVICE` 経由の subrequest が記録 | RISK-3 / T-14 |

### グループ 4: middleware / OpenNext 前提機能

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC |
| --- | --- | --- | --- | --- |
| SM-30 | middleware が動作（headers 付与等） | `curl -sI https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -iE '^x-' \| head` | apps/web `middleware.ts` で付与する custom header が返る（無い場合は無検出で OK）| AC-1 |
| SM-31 | `nodejs_compat` flag 有効性 | `wrangler tail` の error level ログ件数 | 0 件 | AC-1 / AC-2 |

## 5. UT-06 Phase 11 S-01〜S-10 mapping

| UT-06 ID | 検証主旨 | 本タスク mapping | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| S-01 | トップページ 200 | SM-01 + SM-02 | PASS | `outputs/phase-11/staging-smoke-results.md` 行 S-01 |
| S-02 | 公開ディレクトリ route 200 | `/members` 等を SM-01 形式で curl | PASS | 同上 行 S-02 |
| S-03 | 認証導線 entry 200 | `/auth/signin` 等の HTTP 200 | PASS | 同上 行 S-03 |
| S-04 | マイページ未認証時 redirect | `/me` への curl が `3xx` | PASS | 同上 行 S-04 |
| S-05 | 管理 BO 未認証 redirect | `/admin` への curl が `3xx` | PASS | 同上 行 S-05 |
| S-06 | 静的アセット配信 | SM-10 / SM-11 / SM-12 | PASS | 同上 行 S-06 |
| S-07 | 404 ハンドリング | SM-05 | PASS | 同上 行 S-07 |
| S-08 | robots.txt / sitemap.xml | `/robots.txt` `/sitemap.xml` の 200 | PASS | 同上 行 S-08 |
| S-09 | OAuth callback route 200 | `/api/auth/callback/google` の HEAD | PASS | 同上 行 S-09 |
| S-10 | Magic Link redirect | `/api/auth/verify-request` 等が 200 | PASS | 同上 行 S-10 |

> UT-06 仕様の正本: `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/phase-11.md`。本タスクは仕様変更を行わず、staging URL 差し替えのみで再実行する。

## 6. 実行 runbook（6 ステップ）

### ステップ 1: 認証 / 前提確認

```bash
bash scripts/cf.sh whoami
# 期待: 認証済み account 情報。token 値そのものは出力されない
```

### ステップ 2: staging deploy 完了確認

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
# 期待: dry-run で deploy 構成が解決可能
```

### ステップ 3: HTTP / asset / API smoke 実行

`SM-01〜SM-31` を順に実行し、各コマンドの stdout を `outputs/phase-08/curl-results.md` に転記する。

```bash
URL=https://ubm-hyogo-web-staging.<account>.workers.dev
for path in / /__nonexistent__; do
  echo "[$path] $(curl -s -o /dev/null -w '%{http_code}' "${URL}${path}")"
done
```

### ステップ 4: UT-06 S-01〜S-10 適用

UT-06 Phase 11 の各 smoke コマンドを staging URL に対して順次実行し、結果を `outputs/phase-11/staging-smoke-results.md` に PASS/FAIL 形式で記録する。

### ステップ 5: `wrangler tail` ログ取得

```bash
wrangler tail ubm-hyogo-web-staging --format=pretty > outputs/phase-08/tail-log.txt
```

> 本コマンドのみ `wrangler` 直呼びを runbook 内で許容する例外（`bash scripts/cf.sh tail` のラッパー未整備のため）。

### ステップ 6: secret 漏洩 grep gate

```bash
grep -E 'Bearer\s+[A-Za-z0-9._-]+' outputs/phase-08/curl-results.md outputs/phase-08/tail-log.txt
grep -E 'CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+' outputs/phase-08/*.md outputs/phase-08/*.txt
grep -E 'ya29\.|ghp_|gho_' outputs/phase-08/*.md outputs/phase-08/*.txt
# 期待: 全 0 件
```

## 7. evidence 取得計画

| evidence ID | 内容 | 取得方法 | 保存先 |
| --- | --- | --- | --- |
| E-08-1 | curl 応答一覧（SM-01〜SM-31）| ステップ 3 stdout 転記 | `outputs/phase-08/curl-results.md` |
| E-08-2 | UT-06 S-01〜S-10 結果 | ステップ 4 結果集約 | `outputs/phase-08/staging-smoke.md` および `outputs/phase-11/staging-smoke-results.md` |
| E-08-3 | Web→API 連携ログ | ステップ 5 `wrangler tail` 抜粋 | `outputs/phase-08/web-api-bridge.md` |
| E-08-4 | UT-06 mapping 表 | 本ファイル §5 をファイル化 | `outputs/phase-08/ut06-smoke-mapping.md` |
| E-08-5 | secret grep gate 結果 | ステップ 6 stdout（0 件）| `outputs/phase-08/secret-grep.txt` |

## 8. production mutation 非実行境界

| 操作 | 本 Phase での扱い |
| --- | --- |
| `bash scripts/cf.sh deploy --env production` | 非実行 |
| production custom domain の Workers script 移譲 | 非実行 |
| 旧 Pages project の Pause / Delete | 非実行 |
| DNS record 編集 | 非実行 |
| 任意の `POST` / `PUT` / `DELETE` API 呼び出し | 非実行 |

## 9. NO-GO 連動

| NG | smoke 上の検出箇所 | 行動 |
| --- | --- | --- |
| NG-1（smoke FAIL 1 件以上） | UT-06 mapping 表のいずれかが FAIL | production cutover 保留、Phase 9 へ差戻し |
| NG-2（`.open-next/` 未生成） | ステップ 2 dry-run 失敗 | CD build job 改修 PR を再投入 |
| NG-3（service binding resolve 失敗） | SM-20〜SM-22 が 5xx / tail に bind error | apps/api-staging 整合再確認 |
| NG-4（5xx 連発） | SM-01〜SM-05 のいずれかが 5xx | `bash scripts/cf.sh rollback` 即実行 |
| NG-5（rollback 経路不通） | T-40 別途実行で確認 | runbook S5 再設計 |

## 10. 完了条件チェックリスト

- [x] SM-01〜SM-31 の全行が「実行コマンド + 期待結果」付で定義
- [x] UT-06 S-01〜S-10 mapping 表が 10 行ですべて埋まる
- [x] 6 ステップ runbook が順序付きで定義
- [x] secret 漏洩 grep gate が 3 種以上の正規表現で再掲
- [x] evidence path 5 種（E-08-1〜E-08-5）が確定
- [x] production mutation 非実行境界が 5 操作で表化
- [x] `wrangler` 直接実行は `wrangler tail` 例外 1 箇所のみ

# Phase 8: NON_VISUAL smoke 計画（staging Workers 配信検証）

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | staging cutover 完了直後に実施する NON_VISUAL smoke の検証項目・実行コマンド・evidence 取得経路を確定する。Phase 3 の T-13〜T-30 を staging 実環境（OpenNext on Workers）に対し再実行可能な形に runbook 化し、UT-06 Phase 11 S-01〜S-10 への mapping 表で網羅性を保証する |
| 入力 | Phase 1 AC-1〜AC-6、Phase 2 wrangler.toml 最終形 / web-cd.yml 差分、Phase 3 T-13〜T-30 / NG-1〜NG-5、UT-06 Phase 11 smoke S-01〜S-10 仕様 |
| 出力 | `outputs/phase-08/staging-smoke.md`、`outputs/phase-08/curl-results.md`、`outputs/phase-08/web-api-bridge.md`、`outputs/phase-08/ut06-smoke-mapping.md` |
| 完了条件 | staging URL 疎通検証コマンド確定 / Web→API service binding 経由疎通検証手順確定 / UT-06 S-01〜S-10 mapping 表確定 / Phase 11 evidence path との対応確定 / `wrangler` 直接実行ゼロ |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| タスク ID | task-impl-opennext-workers-migration-001 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | NON_VISUAL smoke 計画 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 7（テスト実装） |
| 次 Phase | 9（ステージング検証 / QA） |
| 状態 | spec_created |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #355 |

## 目的

`apps/web` を Cloudflare Pages から OpenNext on Workers 配信へ切替えた直後、`https://ubm-hyogo-web-staging.<account>.workers.dev` が機能するかを「UI を介さない HTTP 観測」で確認する。本タスクは UI 視覚変化ゼロ（NON_VISUAL）を前提とするため、Playwright 等の E2E スクリーンショットは取得せず、`curl` ベースの HTTP 応答 / HTML レスポンスボディ抜粋 / `wrangler tail` ログ / observability メトリクスを evidence として保存する。

## NON_VISUAL である根拠

| 観点 | 内容 |
| --- | --- |
| UI 不在 | 本タスクは配信形態（Pages → Workers）の差し替えのみ。画面構成・スタイル・コンポーネントに変更なし |
| 操作主体 | CD パイプラインによる自動 deploy が主、手動再現は `bash scripts/cf.sh deploy` のワンショット |
| 視覚的副作用 | Next.js 出力 HTML が同一であるため、screenshot 比較で得られる情報は実質ゼロ |
| Playwright 適用可否 | 不適用。Phase 3 T-20〜T-30 は UT-06 Phase 11 既存仕様の再実行であり、新規 E2E 追加は scope 外 |

## smoke 検証項目（staging）

Phase 3 で確定した T-13〜T-30 を staging URL に対する具体コマンドへ落とし込む。

### グループ 1: HTTP 応答 / Next.js 出力検証

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC / T |
| --- | --- | --- | --- | --- |
| SM-01 | top route HTTP status | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/` | `200` または `3xx` | AC-4 / T-13 |
| SM-02 | HTML レスポンスに Next.js 出力が含まれる | `curl -s https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -E '__next\|_next/static\|next/script'` | 1 件以上ヒット（`__next` / `_next/static` 等の Next.js 生成 marker） | AC-1 / AC-2 |
| SM-03 | `Content-Type` が `text/html` | `curl -sI https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -i '^content-type:'` | `text/html; charset=utf-8` 相当 | AC-2 |
| SM-04 | `Cache-Control` ヘッダ存在 | `curl -sI https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -i '^cache-control:'` | `Cache-Control` ヘッダが返る（値は OpenNext 既定） | AC-2 |
| SM-05 | 404 ハンドリング | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/__nonexistent__` | `404`（`not_found_handling = "single-page-application"` の既定挙動） | T-26 |

### グループ 2: 静的アセット配信（OpenNext `[assets]` binding）

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC / T |
| --- | --- | --- | --- | --- |
| SM-10 | `_next/static/` 配下 asset の取得 | `ASSET=$(curl -s https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -oE '/_next/static/[^"]+\.(js\|css)' \| head -1); curl -s -o /dev/null -w "%{http_code}\n" "https://ubm-hyogo-web-staging.<account>.workers.dev${ASSET}"` | `200` | AC-1 / T-25 |
| SM-11 | asset の `Cache-Control: immutable` | `curl -sI "https://ubm-hyogo-web-staging.<account>.workers.dev${ASSET}" \| grep -i '^cache-control:'` | `immutable` を含む | T-25 |
| SM-12 | favicon / public 配下 | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/favicon.ico` | `200` または `204` | T-25 |

### グループ 3: Web → API（service binding 経由）

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC / T |
| --- | --- | --- | --- | --- |
| SM-20 | `/api/health` 相当の Web 経由 health route | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.<account>.workers.dev/api/health` | `200`（apps/api-staging の health 応答が web Worker 経由で返る） | AC-4 / T-14 |
| SM-21 | レスポンスボディに API 応答が含まれる | `curl -s https://ubm-hyogo-web-staging.<account>.workers.dev/api/health \| head -c 200` | apps/api 由来の JSON / テキストが返る | AC-4 / T-14 |
| SM-22 | service binding 経由の確認 | `wrangler tail ubm-hyogo-web-staging --format=pretty`（別端末で実行しつつ SM-20 を再叩き） | log に `API_SERVICE` 経由の subrequest が記録される | RISK-3 / T-14 |

### グループ 4: middleware / OpenNext 前提機能

| ID | 検証対象 | 実行コマンド | 期待結果 | 関連 AC |
| --- | --- | --- | --- | --- |
| SM-30 | middleware が動作（headers 付与等） | `curl -sI https://ubm-hyogo-web-staging.<account>.workers.dev/ \| grep -iE '^x-' \| head` | apps/web `middleware.ts` で付与する custom header が返る（無い場合は無検出で OK） | AC-1 |
| SM-31 | `nodejs_compat` flag 有効性 | OpenNext 出力 `worker.js` がランタイムで起動しエラーログを出さないこと（SM-22 の `wrangler tail` で error なし） | error level ログ 0 件 | AC-1 / AC-2 |

## UT-06 Phase 11 S-01〜S-10 mapping

UT-06 既存 smoke を staging URL に再適用する際の対応関係を明示する。Phase 3 T-20〜T-30 と整合。

| UT-06 ID | 検証主旨（UT-06 由来） | 本タスク mapping | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| S-01 | トップページ 200 | SM-01 + SM-02 | PASS | `outputs/phase-11/staging-smoke-results.md` 行 S-01 |
| S-02 | 公開ディレクトリ route 200 | `curl` で `/members` 等公開 route を SM-01 と同様に検証 | PASS | 同上 行 S-02 |
| S-03 | 認証導線 entry 200 | `/auth/signin` 等の HTTP 200 | PASS | 同上 行 S-03 |
| S-04 | マイページ未認証時 redirect | `/me` への curl が `3xx` redirect を返す | PASS | 同上 行 S-04 |
| S-05 | 管理 BO 未認証 redirect | `/admin` への curl が `3xx` redirect を返す | PASS | 同上 行 S-05 |
| S-06 | 静的アセット配信 | SM-10 / SM-11 / SM-12 | PASS | 同上 行 S-06 |
| S-07 | 404 ハンドリング | SM-05 | PASS | 同上 行 S-07 |
| S-08 | robots.txt / sitemap.xml | `curl` で `/robots.txt` `/sitemap.xml` の 200 | PASS | 同上 行 S-08 |
| S-09 | OAuth callback route 200 | `/api/auth/callback/google` の HEAD で 200 / 4xx（GET 単独で 5xx を返さない） | PASS | 同上 行 S-09 |
| S-10 | Magic Link redirect | `/api/auth/verify-request` 等が 200 | PASS | 同上 行 S-10 |

> UT-06 仕様の正本は `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/phase-11.md` を参照（既存）。本タスクは仕様変更を行わず、staging URL 差し替えのみで再実行する。

## 実行 runbook（staging smoke）

### ステップ 1: 認証 / 前提確認

```bash
bash scripts/cf.sh whoami
# 期待: 認証済み account 情報。token 値そのものは出力されない。
```

### ステップ 2: staging deploy 完了確認

```bash
# CD（dev branch merge）が成功し最新 VERSION_ID が取得できていること
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
# 期待: dry-run で deploy 構成（main = .open-next/worker.js / [assets]）が解決可能
```

### ステップ 3: HTTP / asset / API smoke 実行

`SM-01〜SM-31` を順に実行し、各コマンドの stdout を `outputs/phase-08/curl-results.md` に転記する。

```bash
# 例: SM-01〜SM-05 をワンライナーで束ねる
URL=https://ubm-hyogo-web-staging.<account>.workers.dev
for path in / /__nonexistent__; do
  echo "[$path] $(curl -s -o /dev/null -w '%{http_code}' "${URL}${path}")"
done
```

### ステップ 4: UT-06 S-01〜S-10 適用

UT-06 Phase 11 の各 smoke コマンドを staging URL（`ubm-hyogo-web-staging.<account>.workers.dev`）に対して順次実行し、結果を `outputs/phase-11/staging-smoke-results.md` の表に PASS/FAIL 形式で記録する。

### ステップ 5: `wrangler tail` ログ取得

```bash
# 別端末で 5〜10 分間 tail を継続し SM-20〜SM-22 と並走
wrangler tail ubm-hyogo-web-staging --format=pretty > outputs/phase-08/tail-log.txt
# ※ ログには secret 値が含まれないことを Phase 9 で grep gate 確認
```

> 注: 本コマンドのみ `wrangler` 直呼びを runbook 内で許容する例外（`bash scripts/cf.sh tail` のラッパー未整備のため）。整備され次第 `bash scripts/cf.sh` 経由に統一すること（Phase 9 で開放可否を判断）。

### ステップ 6: secret 漏洩 grep gate

```bash
grep -E 'Bearer\s+[A-Za-z0-9._-]+' outputs/phase-08/curl-results.md outputs/phase-08/tail-log.txt
grep -E 'CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+' outputs/phase-08/*.md outputs/phase-08/*.txt
grep -E 'ya29\.|ghp_|gho_' outputs/phase-08/*.md outputs/phase-08/*.txt
# 期待: 全 0 件
```

## evidence 取得計画（Phase 11 連携）

| evidence ID | 内容 | 取得方法 | 保存先 |
| --- | --- | --- | --- |
| E-08-1 | curl 応答一覧（SM-01〜SM-31） | ステップ 3 stdout 転記 | `outputs/phase-08/curl-results.md` |
| E-08-2 | UT-06 S-01〜S-10 結果 | ステップ 4 結果集約 | `outputs/phase-08/staging-smoke.md` および `outputs/phase-11/staging-smoke-results.md` |
| E-08-3 | Web→API 連携ログ | ステップ 5 `wrangler tail` 抜粋 | `outputs/phase-08/web-api-bridge.md` |
| E-08-4 | UT-06 mapping 表 | 本 Phase 内表をファイル化 | `outputs/phase-08/ut06-smoke-mapping.md` |
| E-08-5 | secret grep gate 結果 | ステップ 6 stdout（0 件） | `outputs/phase-08/secret-grep.txt` |

## production mutation 非実行境界

本 Phase は staging に対する read-mostly（HTTP GET / HEAD のみ）と、CD が起動済みの staging deploy の確認に閉じる。**production 配信 / DNS / route / Pages project への変更は本 Phase で実行しない**（Phase 9 で計画、Phase 13 deploy 実測で実施）。

| 操作 | 本 Phase での扱い |
| --- | --- |
| `bash scripts/cf.sh deploy --env production` | 非実行 |
| production custom domain の Workers script 移譲 | 非実行 |
| 旧 Pages project の Pause / Delete | 非実行 |
| DNS record 編集 | 非実行 |
| 任意の `POST` / `PUT` / `DELETE` API 呼び出し | 非実行 |

## NO-GO 連動

Phase 3 NG-1〜NG-5 と本 Phase smoke の対応:

| NG | smoke 上の検出箇所 | 行動 |
| --- | --- | --- |
| NG-1（smoke FAIL 1 件以上） | UT-06 mapping 表のいずれかが FAIL | production cutover 保留、Phase 9 へ差戻し |
| NG-2（`.open-next/` 未生成） | ステップ 2 dry-run 失敗 | CD build job 改修 PR を再投入 |
| NG-3（service binding resolve 失敗） | SM-20〜SM-22 が 5xx / tail に bind error | apps/api-staging 整合再確認 |
| NG-4（5xx 連発） | SM-01〜SM-05 のいずれかが 5xx | `bash scripts/cf.sh rollback` 即実行（Phase 9 runbook） |
| NG-5（rollback 経路不通） | T-40 別途実行で確認 | runbook S5 再設計 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | T-13〜T-30 の具体コマンド化と evidence path 確定 |
| Phase 9 | staging 検証で本 Phase smoke 全件 PASS を gate に |
| Phase 10 | smoke 全件 PASS を Design GO 根拠の 1 つに使用 |
| Phase 11 | E-08-1〜E-08-5 を NON_VISUAL evidence として保存 |
| Phase 13 | production deploy 直後にも本 Phase 同型 smoke を再実行（URL を production に差替） |

## 多角的チェック観点

- 価値性: HTTP 観測のみで Workers 配信切替の妥当性を low-cost に検証
- 実現性: `curl` / `wrangler tail` / `bash scripts/cf.sh` の既存ツールで完結
- 整合性: UT-06 既存 smoke を再利用し仕様乖離を発生させない
- 運用性: 6 ステップ runbook が 30 分以内で完走可能
- セキュリティ: ステップ 6 で secret grep gate を必須化、evidence に token 値を残さない
- 認可境界: production mutation を本 Phase で 0 件に固定

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | NON_VISUAL である根拠明文化 | spec_created |
| 2 | SM-01〜SM-31 検証項目確定 | spec_created |
| 3 | UT-06 S-01〜S-10 mapping 表作成 | spec_created |
| 4 | 6 ステップ runbook 作成 | spec_created |
| 5 | secret 漏洩 grep gate 設計 | spec_created |
| 6 | evidence 取得計画 5 種確定 | spec_created |
| 7 | production mutation 非実行境界再掲 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-08/staging-smoke.md` | smoke 計画概要 / SM-01〜SM-31 / runbook 6 ステップ |
| ドキュメント | `outputs/phase-08/curl-results.md` | 実行時に curl stdout を転記する受け皿（spec 段階では template） |
| ドキュメント | `outputs/phase-08/web-api-bridge.md` | service binding 経由 Web→API 連携の検証手順と tail log 抜粋受け皿 |
| ドキュメント | `outputs/phase-08/ut06-smoke-mapping.md` | UT-06 S-01〜S-10 と SM-XX の対応表 |
| メタ | `artifacts.json` | Phase 8 状態更新（`spec_created`） |

## 完了条件

- [ ] SM-01〜SM-31 の全行が「実行コマンド + 期待結果」付で定義
- [ ] UT-06 S-01〜S-10 mapping 表が 10 行ですべて埋まる
- [ ] 6 ステップ runbook（whoami → deploy 確認 → smoke → UT-06 → tail → grep）が順序付きで定義
- [ ] secret 漏洩 grep gate が 3 種以上の正規表現で再掲
- [ ] evidence path 5 種（E-08-1〜E-08-5）が確定
- [ ] production mutation 非実行境界が 5 操作以上で表化
- [ ] `wrangler` 直接実行は `wrangler tail` の例外 1 箇所のみで他はゼロ

## タスク100%実行確認【必須】

- 実行タスク 7 件すべてが `spec_created`
- 成果物 4 ファイルが `outputs/phase-08/` 配下に配置予定
- NON_VISUAL である根拠が観点表で 4 行
- secret 値の記述例にも実トークンが登場しない（key 名のみ）
- `wrangler` 直叩きは `wrangler tail` 例外のみ、`wrangler deploy` 直叩きはゼロ件

## 次の Phase

Phase 9: ステージング検証 / QA 計画（staging full QA + 24h 観測 + production rollout / rollback runbook）

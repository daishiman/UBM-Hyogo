# Phase 9: ステージング検証 / QA 計画（24h 観測 / production rollout / rollback）

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 8 で確定した staging smoke を実行し、deploy ログ / `wrangler tail` / observability / 環境変数 binding を 24 時間観測する QA フローを確定する。staging→production promotion 判定基準と、production rollout / rollback の段取りを runbook 形式で固定する |
| 入力 | Phase 1 AC-1〜AC-6、Phase 2 cutover-runbook 設計骨子（S1〜S6）、Phase 3 NG-1〜NG-5、Phase 8 SM-01〜SM-31 / UT-06 mapping、`apps/web/wrangler.toml` の `[env.staging]` / `[env.production]` 構成、`scripts/cf.sh` ラッパー仕様 |
| 出力 | `outputs/phase-09/staging-validation.md`、`outputs/phase-09/promotion-decision.md`、`outputs/phase-09/rollback-runbook.md`、`outputs/phase-09/binding-check.md` |
| 完了条件 | staging full QA チェックリスト確定 / 24h 観測項目確定 / promotion 判定基準（GO/NO-GO）確定 / production rollout 5 ステップ確定 / rollback 二段戦略 runbook 確定 / 環境変数 / secret binding 検証手順確定 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 9 / 13 |
| Phase 名称 | ステージング検証 / QA |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 8（NON_VISUAL smoke 計画） |
| 次 Phase | 10（セキュリティレビュー / Design GO） |
| 状態 | spec_created |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #355 |

## 目的

staging cutover を「deploy → smoke → 24 時間観測 → promotion 判定 → production rollout → rollback 即応」のひとつのオペレーション単位として整理する。本 Phase は仕様確定に閉じ、実打ちは Phase 13（deploy 実測）で行う。Pages との同時稼働期間（DNS 切替前）におけるトラフィック分離方針、observability エラー閾値、staging→production 昇格 gate、二段 rollback の判断基準を runbook として固定する。

## staging full QA チェックリスト

Phase 8 SM smoke の上位レイヤーとして、deploy / log / binding / 観測の 4 領域を順序付きで検証する。

### 領域 A: deploy ログ review

| ID | チェック項目 | 検証方法 | 期待結果 |
| --- | --- | --- | --- |
| QA-A1 | `web-cd / deploy-staging` job が exit 0 | GitHub Actions UI で job ステータス確認 | success |
| QA-A2 | build step が `build:cloudflare` を呼んでいる | job log に `opennextjs-cloudflare build` 行 | 1 件以上 |
| QA-A3 | deploy step が `wrangler deploy --env staging` | job log に該当コマンド行 | 1 件以上 |
| QA-A4 | `pages deploy` 文字列が log に含まれない | job log を grep | 0 件 |
| QA-A5 | VERSION_ID 取得 | deploy log 末尾の `Current Version ID:` を抽出 | UUID 形式 1 件 |

### 領域 B: `wrangler tail` で error 監視

| ID | チェック項目 | 検証方法 | 閾値 |
| --- | --- | --- | --- |
| QA-B1 | error level ログ件数 | `wrangler tail ubm-hyogo-web-staging --format=json` を 10 分間 capture し `level=error` を集計 | 0 件 |
| QA-B2 | warn level ログ件数 | 同上 `level=warn` 集計 | 5 件以下 |
| QA-B3 | service binding error（`API_SERVICE` resolve 失敗） | grep `API_SERVICE` + `error` | 0 件 |
| QA-B4 | nodejs_compat 起因のランタイム error | grep `Cannot resolve module` / `is not defined` 等 | 0 件 |

### 領域 C: 環境変数 / secret binding 検証

`apps/web/wrangler.toml` の `[env.staging]` で定義された binding が runtime で解決していることを間接的に確認する。

| binding 種別 | 確認対象 | 検証方法 | 期待結果 |
| --- | --- | --- | --- |
| `[env.staging.vars]` `ENVIRONMENT` | runtime env value | staging 上の任意 health route が `ENVIRONMENT=staging` を返す経路があれば確認、無ければ tail log で値を間接観測 | `staging` |
| `[env.staging.vars]` `PUBLIC_API_BASE_URL` | クライアント側参照 URL | curl で `/` 取得 → HTML 内 inline script に値が反映 | staging API URL を含む |
| `[env.staging.vars]` `INTERNAL_API_BASE_URL` | サーバ側参照 URL | tail log の subrequest 先 URL を観測 | staging API URL を含む |
| `[[env.staging.services]]` `API_SERVICE` | service binding | SM-20〜SM-22（Phase 8）が PASS | PASS |
| Auth.js secret（D1 / KV / R2 binding は apps/web に持たない設計） | apps/web は service binding 経由のみで apps/api を呼ぶ（不変条件 #5） | `wrangler.toml` に D1/KV/R2 binding が **存在しない** ことを grep | 0 件（apps/web に直 binding 不在） |

> 重要: `apps/web/wrangler.toml` に D1 / KV / R2 binding を **追加しない**。これは CLAUDE.md 不変条件 #5（D1 への直接アクセスは apps/api に閉じる）の gate である。Phase 9 で staging deploy 後に `grep -E '\[\[d1_databases\]\]|\[\[kv_namespaces\]\]|\[\[r2_buckets\]\]' apps/web/wrangler.toml` を実行し 0 件を再確認する。

### 領域 D: Pages 同時稼働下のトラフィック分離

DNS / custom domain 切替前は staging Pages と staging Workers が同時稼働するため、検証経路を URL ホスト名で明示分離する。

| 経路 | URL ホスト | 役割 | 本 Phase での扱い |
| --- | --- | --- | --- |
| 旧 staging Pages | `<pages-project>-staging.<account>.pages.dev`（または旧 custom domain） | レガシー稼働、参照のみ | 検証対象外（mutation 非実行） |
| 新 staging Workers | `ubm-hyogo-web-staging.<account>.workers.dev` | 本タスク検証対象 | Phase 8 smoke / 本 Phase QA の唯一の検証 URL |
| custom domain | staging は `*.workers.dev` 完結のため対象外 | — | — |

> Pages dormant 化は Phase 2 runbook S6 / 本 Phase の rollout / rollback runbook で扱う（本 Phase 内で `Pause Deployments` UI 操作は実行しないが、手順は明示する）。

## 24 時間観測項目

staging cutover 完了から 24 時間、以下を観測する。

| 観測項目 | 取得方法 | 閾値 / 判定 |
| --- | --- | --- |
| HTTP 5xx 率 | Cloudflare Workers Analytics（Dashboard）または observability メトリクス | 0.5% 未満 |
| p95 レイテンシ | 同上 | Pages 配信時の baseline ±20% 以内 |
| CPU 時間 / req | observability | 50ms 未満（OpenNext SSR 既定範囲） |
| `wrangler tail` error 累計 | tail capture を 6 時間ごとにスナップショット | 24h 累計で 5 件以下 |
| service binding 失敗率（API_SERVICE） | tail log の subrequest error rate | 0.1% 未満 |
| smoke 再実行（6 時間後 / 24 時間後） | Phase 8 SM-01〜SM-22 を 2 回再実行 | いずれも全件 PASS |

> 観測 evidence は `outputs/phase-09/staging-validation.md` の「24h 観測ログ」表に時刻 / 値 / 判定 を行追加する形で蓄積する。

## staging→production promotion 判定基準

以下 GO 条件をすべて満たした場合のみ production rollout を実行する。1 つでも未充足なら NO-GO。

| GO 条件 | 充足判定 |
| --- | --- |
| Phase 8 smoke（SM-01〜SM-31）全件 PASS | curl-results / tail-log で確認 |
| UT-06 S-01〜S-10 全件 PASS | `outputs/phase-11/staging-smoke-results.md` で 10/10 |
| QA-A1〜A5 全件成功 | GitHub Actions log で確認 |
| QA-B1〜B4 閾値内 | tail capture で確認 |
| 領域 C binding 検証全件成功 | binding-check.md で確認 |
| 24 時間観測閾値全件 PASS | staging-validation.md 観測ログ |
| AC-5 確認（wrangler.toml に `pages_build_output_dir` 不在）| `grep -n "pages_build_output_dir" apps/web/wrangler.toml` で 0 件 |
| 不変条件 #5 確認（apps/web に D1/KV/R2 binding 不在）| 領域 C 末尾 grep |

判定結果は `outputs/phase-09/promotion-decision.md` に GO / NO-GO と根拠を 1 表で記録する。

## production rollout 手順（DNS / route 切替段取り）

Phase 2 runbook S3 / S4 を実装可能粒度に展開。本 Phase で確定し、Phase 13 で実行する。

### ステップ 1: 事前確認

```bash
bash scripts/cf.sh whoami
# 期待: production 権限を持つ token で認証済み
git rev-parse origin/main
# 期待: 本タスクの改修 commit が main にマージ済
```

### ステップ 2: production deploy（自動 CD）

- `main` ブランチへ merge → `web-cd / deploy-production` job が自動起動
- job log で `wrangler deploy --env production` が exit 0 完了を確認
- 取得した VERSION_ID を `outputs/phase-09/promotion-decision.md` の「production VERSION_ID」欄に記録（rollback 用）

### ステップ 3: production smoke（DNS 切替前）

- `https://ubm-hyogo-web-production.<account>.workers.dev/` に対し Phase 8 SM-01〜SM-22 を再実行
- 全件 PASS が次ステップの前提

### ステップ 4: custom domain 移譲（Cloudflare Dashboard）

| 操作 | 場所 | 担当 |
| --- | --- | --- |
| Workers script `ubm-hyogo-web-production` の Custom Domains に target domain を Add | Cloudflare Dashboard → Workers & Pages → ubm-hyogo-web-production → Custom Domains | 運用者（手動） |
| SSL 証明書発行待ち（5 分目安） | 同上 | 自動 |
| 旧 Pages project Custom Domains から target domain を Remove | Cloudflare Dashboard → 旧 Pages project → Custom Domains | 運用者（手動） |
| `dig +short <domain>` / `curl -sI https://<domain>` で TLS 経路確認 | ローカル端末 | 運用者 |

> 移譲は **Workers 側 Add → Pages 側 Remove の順** を厳守。逆順だと SSL 失効ウィンドウが発生する。

### ステップ 5: production smoke（custom domain 経由）

- `https://<production-custom-domain>/` に対し Phase 8 SM-01〜SM-22 を再実行
- 全件 PASS で rollout 完了

## production rollback 手順（二段戦略）

### 一次手段: `wrangler rollback`（推奨 / 5 分以内復旧）

```bash
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env production
# 期待: 直前 deploy へ即時切戻し、custom domain は同 Workers script を指したまま
```

判断基準:
- production smoke で 1 件でも 5xx / FAIL → 即実行
- error log が QA-B1 閾値を 10 倍以上超過 → 即実行

### 二次手段: 旧 Pages project への切戻し（cutover 直後 dormant 期間内のみ）

```text
1. Cloudflare Dashboard → 旧 Pages project → Settings → Resume Deployments
2. 旧 Pages project の Custom Domains に target domain を再 Add
3. Workers script `ubm-hyogo-web-production` の Custom Domains から target domain を Remove
4. dig / curl で SSL が Pages 経由に戻ったことを確認
5. apps/web 側 PR を revert（main を一段戻す）
```

判断基準:
- 一次手段でも復旧不能（OpenNext build 自体が壊れている等）
- cutover 完了から 14 日以内（Pages dormant 期間内）であること

### 通知 / 記録テンプレ

```text
[ROLLBACK] apps/web production
- trigger: <smoke FAIL ID / error log 抜粋>
- decision time: <ISO8601>
- method: 一次（wrangler rollback）/ 二次（Pages resume）
- previous VERSION_ID: <UUID>
- recovered VERSION_ID: <UUID>
- evidence: outputs/phase-11/rollback-readiness.md
```

GitHub Issue #355（または fork issue）に上記テンプレで実行記録をコメント。

## NO-GO 連動 / Phase 3 NG マトリクス再掲

| NG | 検出 Phase | 本 Phase での扱い |
| --- | --- | --- |
| NG-1（smoke FAIL） | Phase 8 / 24h 観測 | promotion NO-GO、staging 修正後再実行 |
| NG-2（`.open-next/` 未生成） | QA-A2 失敗 | CD build job 再点検、merge 取消 |
| NG-3（service binding 失敗） | QA-B3 / SM-20〜22 失敗 | apps/api-staging 整合再確認、必要なら staging Workers script を一次 rollback |
| NG-4（5xx 連発） | 24h 観測 5xx 率超過 | 一次 rollback 即実行 |
| NG-5（rollback 不通） | 二段戦略がいずれも復旧不能 | RISK-4 エスカレーション、上流 ADR-0001 再評価 |

## production mutation 境界（本 Phase 範囲）

本 Phase は仕様確定であり mutation を実行しない。Phase 13 deploy 実測で初めて以下が許容される。

| 操作 | 本 Phase | Phase 13 |
| --- | --- | --- |
| `bash scripts/cf.sh deploy --env production` | 非実行 | 実行（CD 経由） |
| custom domain 移譲（Add/Remove） | 非実行 | 実行（手動 UI） |
| 旧 Pages `Pause Deployments` | 非実行 | 実行（手動 UI、cutover 翌日） |
| 旧 Pages `Resume Deployments` | 非実行 | rollback 二次手段としてのみ実行可 |
| DNS record 直接編集 | 非実行 | 非実行（custom domain 移譲のみで完結） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | SM-01〜SM-31 を本 Phase QA-D / 24h 観測 / production smoke で再利用 |
| Phase 10 | promotion 判定基準が満たせる設計であることを Design GO 根拠に |
| Phase 11 | staging-validation / promotion-decision / rollback-runbook を NON_VISUAL evidence として保存 |
| Phase 13 | production rollout 5 ステップを実行手順としてそのまま流用 |

## 多角的チェック観点

- 価値性: 24h 観測と二段 rollback で本番影響を最小化
- 実現性: 既存 `scripts/cf.sh` / Cloudflare Dashboard / GitHub Actions のみで完結
- 整合性: 不変条件 #5（D1 直アクセス禁止）を領域 C grep で gate 化
- 運用性: rollout / rollback の意思決定基準が GO 条件 8 件 / rollback 判断基準 2 件で明示
- セキュリティ: tail log / curl 結果に secret 値が含まれないことを Phase 8 grep gate で再確認
- 認可境界: 本 Phase mutation 非実行、Phase 13 のみ mutation 許容

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | staging full QA 領域 A〜D 確定 | spec_created |
| 2 | 24h 観測項目 6 件確定 | spec_created |
| 3 | promotion 判定基準（GO 条件 8 件）確定 | spec_created |
| 4 | production rollout 5 ステップ確定 | spec_created |
| 5 | rollback 二段戦略 runbook 確定 | spec_created |
| 6 | 環境変数 / binding 検証手順確定 | spec_created |
| 7 | 不変条件 #5 grep gate 設計 | spec_created |
| 8 | NG-1〜NG-5 連動表確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-09/staging-validation.md` | staging full QA チェックリスト + 24h 観測ログ受け皿 |
| ドキュメント | `outputs/phase-09/promotion-decision.md` | GO/NO-GO 判定表（GO 条件 8 件 + 充足記録欄） |
| ドキュメント | `outputs/phase-09/rollback-runbook.md` | 一次（wrangler rollback）/ 二次（Pages resume）の二段 runbook |
| ドキュメント | `outputs/phase-09/binding-check.md` | 領域 C binding 検証結果 + 不変条件 #5 grep 結果 |
| メタ | `artifacts.json` | Phase 9 状態更新 |

## 完了条件

- [ ] staging full QA 4 領域（A/B/C/D）すべてにチェック項目が定義
- [ ] 24h 観測項目 6 件が閾値付きで定義
- [ ] promotion 判定基準が GO 条件 8 件で定義
- [ ] production rollout が 5 ステップで順序付け
- [ ] rollback 二段戦略（一次 / 二次）が判断基準付きで定義
- [ ] 不変条件 #5 grep gate が領域 C に組込み
- [ ] NG-1〜NG-5 連動表が再掲
- [ ] `wrangler` 直接実行は `wrangler tail` を除き 0 件、deploy / rollback は `bash scripts/cf.sh` 経由
- [ ] 成果物 4 ファイルが `outputs/phase-09/` 配下に配置予定

## タスク100%実行確認【必須】

- 実行タスク 8 件すべてが `spec_created`
- 成果物 4 ファイルが配置予定
- production mutation が本 Phase で 0 件、Phase 13 のみで許容と明記
- secret 値の記述例にも実トークンが登場しない
- rollback 通知テンプレに API token / OAuth token プレースホルダが含まれない

## 次の Phase

Phase 10: セキュリティレビュー / Design GO 判定（Phase 1〜9 横断レビュー、token scope / 攻撃面 / ADR 整合確認、Design GO 確定）

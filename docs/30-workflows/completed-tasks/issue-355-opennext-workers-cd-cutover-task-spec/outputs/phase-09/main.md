# Phase 9 main — ステージング検証 / QA 計画（24h 観測 / production rollout / rollback）

> 本ファイルは `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/phase-09.md` の outputs 受け皿である。
> staging cutover の QA 手順 / smoke 実施計画 / 24h 観測 / promotion 判定 / production rollout / rollback runbook を 1 ファイルに集約し、`artifacts.json` の `outputs/phase-09/main.md` 要求を充足する。

---

## 1. Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 8 で確定した staging smoke を実行し、deploy ログ / `wrangler tail` / observability / 環境変数 binding を 24 時間観測する QA フローを確定する。staging→production promotion 判定基準と production rollout / rollback の段取りを runbook 形式で固定する |
| 入力 | Phase 1 AC-1〜AC-6、Phase 2 cutover-runbook 設計骨子（S1〜S6）、Phase 3 NG-1〜NG-5、Phase 8 SM-01〜SM-31 / UT-06 mapping、`apps/web/wrangler.toml` の `[env.staging]` / `[env.production]` 構成、`scripts/cf.sh` ラッパー仕様 |
| 完了条件 | staging full QA チェックリスト確定 / 24h 観測項目確定 / promotion 判定基準（GO/NO-GO）確定 / production rollout 5 ステップ確定 / rollback 二段戦略 runbook 確定 / 環境変数 / secret binding 検証手順確定 |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #355（CLOSED、`Refs #355`） |

## 2. staging full QA チェックリスト

### 2.1 領域 A: deploy ログ review

| ID | チェック項目 | 検証方法 | 期待結果 |
| --- | --- | --- | --- |
| QA-A1 | `web-cd / deploy-staging` job が exit 0 | GitHub Actions UI | success |
| QA-A2 | build step が `build:cloudflare` を呼んでいる | job log に `opennextjs-cloudflare build` 行 | 1 件以上 |
| QA-A3 | deploy step が `wrangler deploy --env staging` | job log に該当コマンド行 | 1 件以上 |
| QA-A4 | `pages deploy` 文字列が log に含まれない | job log を grep | 0 件 |
| QA-A5 | VERSION_ID 取得 | deploy log 末尾の `Current Version ID:` を抽出 | UUID 形式 1 件 |

### 2.2 領域 B: `wrangler tail` で error 監視

| ID | チェック項目 | 検証方法 | 閾値 |
| --- | --- | --- | --- |
| QA-B1 | error level ログ件数 | `wrangler tail ubm-hyogo-web-staging --format=json` 10 分 capture、`level=error` 集計 | 0 件 |
| QA-B2 | warn level ログ件数 | 同上 `level=warn` | 5 件以下 |
| QA-B3 | service binding error（`API_SERVICE` resolve 失敗） | grep `API_SERVICE` + `error` | 0 件 |
| QA-B4 | nodejs_compat 起因のランタイム error | grep `Cannot resolve module` / `is not defined` | 0 件 |

### 2.3 領域 C: 環境変数 / secret binding 検証

| binding 種別 | 確認対象 | 検証方法 | 期待結果 |
| --- | --- | --- | --- |
| `[env.staging.vars]` `ENVIRONMENT` | runtime env value | health route または tail log で間接観測 | `staging` |
| `[env.staging.vars]` `PUBLIC_API_BASE_URL` | クライアント側参照 URL | curl で `/` 取得 → HTML 内 inline script | staging API URL を含む |
| `[env.staging.vars]` `INTERNAL_API_BASE_URL` | サーバ側参照 URL | tail log の subrequest 先 URL | staging API URL を含む |
| `[[env.staging.services]]` `API_SERVICE` | service binding | Phase 8 SM-20〜SM-22 PASS | PASS |
| D1 / KV / R2 binding（apps/web） | 不変条件 #5 | `grep -E '\[\[d1_databases\]\]\|\[\[kv_namespaces\]\]\|\[\[r2_buckets\]\]' apps/web/wrangler.toml` | 0 件 |

> 重要: `apps/web/wrangler.toml` に D1 / KV / R2 binding を追加しない（CLAUDE.md 不変条件 #5）。Phase 9 staging deploy 後に上記 grep を実行し 0 件を再確認する。

### 2.4 領域 D: Pages 同時稼働下のトラフィック分離

| 経路 | URL ホスト | 役割 | 本 Phase での扱い |
| --- | --- | --- | --- |
| 旧 staging Pages | `<pages-project>-staging.<account>.pages.dev` | レガシー稼働、参照のみ | 検証対象外（mutation 非実行）|
| 新 staging Workers | `ubm-hyogo-web-staging.<account>.workers.dev` | 本タスク検証対象 | Phase 8 smoke / 本 Phase QA の唯一の検証 URL |
| custom domain | staging は `*.workers.dev` 完結のため対象外 | — | — |

## 3. 24 時間観測項目

| 観測項目 | 取得方法 | 閾値 / 判定 |
| --- | --- | --- |
| HTTP 5xx 率 | Cloudflare Workers Analytics | 0.5% 未満 |
| p95 レイテンシ | 同上 | Pages 配信時の baseline ±20% 以内 |
| CPU 時間 / req | observability | 50ms 未満 |
| `wrangler tail` error 累計 | tail capture を 6 時間ごとにスナップショット | 24h 累計で 5 件以下 |
| service binding 失敗率（API_SERVICE）| tail log の subrequest error rate | 0.1% 未満 |
| smoke 再実行（6h 後 / 24h 後）| Phase 8 SM-01〜SM-22 を 2 回再実行 | いずれも全件 PASS |

## 4. staging→production promotion 判定基準（GO 条件 8 件）

| GO 条件 | 充足判定 |
| --- | --- |
| Phase 8 smoke（SM-01〜SM-31）全件 PASS | curl-results / tail-log で確認 |
| UT-06 S-01〜S-10 全件 PASS | `outputs/phase-11/staging-smoke-results.md` 10/10 |
| QA-A1〜A5 全件成功 | GitHub Actions log |
| QA-B1〜B4 閾値内 | tail capture |
| 領域 C binding 検証全件成功 | binding-check 確認 |
| 24 時間観測閾値全件 PASS | staging-validation 観測ログ |
| AC-5 確認（wrangler.toml に `pages_build_output_dir` 不在）| `grep -n "pages_build_output_dir" apps/web/wrangler.toml` で 0 件 |
| 不変条件 #5 確認（apps/web に D1/KV/R2 binding 不在）| 領域 C 末尾 grep |

判定結果は GO / NO-GO と根拠を 1 表で記録する。

## 5. production rollout 手順（5 ステップ）

### ステップ 1: 事前確認

```bash
bash scripts/cf.sh whoami
git rev-parse origin/main
```

### ステップ 2: production deploy（自動 CD）

- `main` ブランチへ merge → `web-cd / deploy-production` job が自動起動
- job log で `wrangler deploy --env production` が exit 0 完了を確認
- VERSION_ID を「production VERSION_ID」欄に記録（rollback 用）

### ステップ 3: production smoke（DNS 切替前）

- `https://ubm-hyogo-web-production.<account>.workers.dev/` に対し Phase 8 SM-01〜SM-22 を再実行
- 全件 PASS が次ステップの前提

### ステップ 4: custom domain 移譲（Cloudflare Dashboard）

| 操作 | 場所 | 担当 |
| --- | --- | --- |
| Workers script `ubm-hyogo-web-production` の Custom Domains に target domain を Add | Cloudflare Dashboard → Workers & Pages → ubm-hyogo-web-production → Custom Domains | 運用者（手動）|
| SSL 証明書発行待ち（5 分目安）| 同上 | 自動 |
| 旧 Pages project Custom Domains から target domain を Remove | Cloudflare Dashboard → 旧 Pages project → Custom Domains | 運用者（手動）|
| `dig +short <domain>` / `curl -sI https://<domain>` で TLS 経路確認 | ローカル端末 | 運用者 |

> 移譲は **Workers 側 Add → Pages 側 Remove の順** を厳守。逆順だと SSL 失効ウィンドウが発生する。

### ステップ 5: production smoke（custom domain 経由）

- `https://<production-custom-domain>/` に対し Phase 8 SM-01〜SM-22 を再実行
- 全件 PASS で rollout 完了

## 6. production rollback 手順（二段戦略）

### 6.1 一次手段: `wrangler rollback`（推奨 / 5 分以内復旧）

```bash
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env production
```

判断基準:
- production smoke で 1 件でも 5xx / FAIL → 即実行
- error log が QA-B1 閾値を 10 倍以上超過 → 即実行

### 6.2 二次手段: 旧 Pages project への切戻し（cutover 直後 dormant 期間内のみ）

```text
1. Cloudflare Dashboard → 旧 Pages project → Settings → Resume Deployments
2. 旧 Pages project の Custom Domains に target domain を再 Add
3. Workers script `ubm-hyogo-web-production` の Custom Domains から target domain を Remove
4. dig / curl で SSL が Pages 経由に戻ったことを確認
5. apps/web 側 PR を revert（main を一段戻す）
```

判断基準:
- 一次手段でも復旧不能（OpenNext build 自体が壊れている等）
- cutover 完了から 14 日以内（Pages dormant 期間内）

### 6.3 通知 / 記録テンプレ

```text
[ROLLBACK] apps/web production
- trigger: <smoke FAIL ID / error log 抜粋>
- decision time: <ISO8601>
- method: 一次（wrangler rollback）/ 二次（Pages resume）
- previous VERSION_ID: <UUID>
- recovered VERSION_ID: <UUID>
- evidence: outputs/phase-11/rollback-readiness.md
```

## 7. NO-GO 連動 / Phase 3 NG マトリクス

| NG | 検出 Phase | 本 Phase での扱い |
| --- | --- | --- |
| NG-1（smoke FAIL）| Phase 8 / 24h 観測 | promotion NO-GO、staging 修正後再実行 |
| NG-2（`.open-next/` 未生成）| QA-A2 失敗 | CD build job 再点検、merge 取消 |
| NG-3（service binding 失敗）| QA-B3 / SM-20〜22 失敗 | apps/api-staging 整合再確認、必要なら staging Workers script を一次 rollback |
| NG-4（5xx 連発）| 24h 観測 5xx 率超過 | 一次 rollback 即実行 |
| NG-5（rollback 不通）| 二段戦略がいずれも復旧不能 | RISK-4 エスカレーション、上流 ADR-0001 再評価 |

## 8. production mutation 境界（本 Phase 範囲）

| 操作 | 本 Phase | Phase 13 |
| --- | --- | --- |
| `bash scripts/cf.sh deploy --env production` | 非実行 | 実行（CD 経由）|
| custom domain 移譲（Add/Remove）| 非実行 | 実行（手動 UI）|
| 旧 Pages `Pause Deployments` | 非実行 | 実行（手動 UI、cutover 翌日）|
| 旧 Pages `Resume Deployments` | 非実行 | rollback 二次手段としてのみ実行可 |
| DNS record 直接編集 | 非実行 | 非実行（custom domain 移譲のみで完結）|

## 9. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | SM-01〜SM-31 を本 Phase QA-D / 24h 観測 / production smoke で再利用 |
| Phase 10 | promotion 判定基準が満たせる設計であることを Design GO 根拠に |
| Phase 11 | staging-validation / promotion-decision / rollback-runbook を NON_VISUAL evidence として保存 |
| Phase 13 | production rollout 5 ステップを実行手順としてそのまま流用 |

## 10. 完了条件チェックリスト

- [x] staging full QA 4 領域（A/B/C/D）すべてにチェック項目が定義
- [x] 24h 観測項目 6 件が閾値付きで定義
- [x] promotion 判定基準が GO 条件 8 件で定義
- [x] production rollout が 5 ステップで順序付け
- [x] rollback 二段戦略（一次 / 二次）が判断基準付きで定義
- [x] 不変条件 #5 grep gate が領域 C に組込み
- [x] NG-1〜NG-5 連動表が再掲
- [x] `wrangler` 直接実行は `wrangler tail` を除き 0 件、deploy / rollback は `bash scripts/cf.sh` 経由

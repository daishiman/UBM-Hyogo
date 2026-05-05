# Phase 4 — タスク分解 outputs/main.md

## 目的

Phase 3 までで確定した AC-1〜AC-6 / RISK-1〜RISK-5 / wrangler.toml 最終形 / web-cd.yml 差分 / cutover runbook 6 セクション骨子 / テスト計画 T-01〜T-42 / NO-GO 条件を、実装担当が「直ちに着手できるサブタスク」へ分解する。本 Phase は設計 close-out であり、実コード改修・実 deploy は伴わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 3（テスト計画） |
| 次 Phase | 5（実装テンプレ / runbook 本文執筆） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 分解サブタスク一覧（4 トラック）

| ST | トラック | 主担当成果物 | AC 紐付け | 関連テスト |
| --- | --- | --- | --- | --- |
| ST-1 | workflow 改修 | `.github/workflows/web-cd.yml` の build / deploy step 差替え | AC-2 | T-10 / T-11 / T-12 / T-15 |
| ST-2 | runbook 執筆 | `outputs/phase-05/cutover-runbook.md`（S1〜S6 本文） | AC-6 | T-42 |
| ST-3 | smoke 再実行 | UT-06 Phase 11 S-01〜S-10 を staging URL に対し再実行 / `outputs/phase-11/staging-smoke-results.md` | AC-3 / AC-4 | T-13 / T-14 / T-20〜T-30 |
| ST-4 | next.config 確認 | `apps/web/next.config.ts` の OpenNext 非互換 key 棚卸し / `outputs/phase-02/next-config-compat.md` | AC-1 / AC-5 | T-04 / T-05 |

## ST-1: workflow 改修

### 目的

`.github/workflows/web-cd.yml` の `pages deploy` 経路を、`build:cloudflare` + `wrangler-action deploy --env <stage>` 経路へ差し替える。

### サブタスク

| 番号 | 内容 | 期待結果 |
| --- | --- | --- |
| ST-1-a | deploy-staging job の Build step `run` を `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` へ差替 | OpenNext 出力（`.open-next/`）が CD 内で生成される |
| ST-1-b | deploy-staging job の Deploy step `command` を `deploy --env staging` へ差替 | `wrangler-action` 経由で Workers deploy が成功 |
| ST-1-c | deploy-production job も同様に差替（`--env production`） | production も Workers 配信に統一 |
| ST-1-d | `vars.CLOUDFLARE_PAGES_PROJECT` 参照を完全削除 | grep 結果 0 件 |
| ST-1-e | `concurrency.group` / `environment.name` / `permissions` / `secrets.CLOUDFLARE_API_TOKEN` / `vars.CLOUDFLARE_ACCOUNT_ID` / `wranglerVersion: '4.85.0'` を維持 | 既存 gate を破壊しない |

### contract 検証（CI 投入想定）

- `grep -nE 'pages\s+deploy' .github/workflows/web-cd.yml` → 0 件（T-10）
- `grep -nE 'deploy --env staging' .github/workflows/web-cd.yml` → 1 件以上（T-11）
- `grep -nE 'deploy --env production' .github/workflows/web-cd.yml` → 1 件以上（T-11）
- `grep -nE 'CLOUDFLARE_PAGES_PROJECT' .github/workflows/web-cd.yml` → 0 件

### 受け入れ条件

- ST-1-a〜e がすべて完了し、`dev` への merge 後に `web-cd / deploy-staging` job conclusion = `success`（T-12）。

## ST-2: runbook 執筆

### 目的

Phase 2 で確定した cutover runbook 6 セクション骨子を、Phase 5 で実行可能な手順書本文に展開する。

### サブタスク

| 番号 | 内容 | 期待結果 |
| --- | --- | --- |
| ST-2-a | S1 前提（環境一覧 / API Token scope / `bash scripts/cf.sh whoami`）を執筆 | 事前確認手順が確定 |
| ST-2-b | S2 staging cutover 操作 1〜5 を執筆（旧 Pages staging の Pause Deployments を含む） | staging 切替手順が確定 |
| ST-2-c | S3 production cutover 操作 1〜5 を執筆（VERSION_ID 記録手順を含む） | production 切替手順が確定 |
| ST-2-d | S4 custom domain 移譲手順 1〜4（Add → SSL 待機 → Remove → 検証）を執筆 / staging 適用外明記 | 一回限りの移譲手順が確定 |
| ST-2-e | S5 rollback 一次（`bash scripts/cf.sh rollback`）/ 二次（Pages resume）/ 通知テンプレを執筆 | rollback 手順が確定 |
| ST-2-f | S6 dormant（2 週間 / 3 週目以降に手動 delete / 本タスクでは delete を実行しない旨）を執筆 | 廃止手順が確定 |

### contract 検証

- `grep -cE '^## S[1-6]\.' outputs/phase-05/cutover-runbook.md` → 6（T-42）
- `grep -nE 'wrangler\s+(deploy|publish|rollback|tail)' outputs/phase-05/cutover-runbook.md` → 0 件（`bash scripts/cf.sh` 経由のみ）

### 受け入れ条件

- 6 セクションすべての本文が `outputs/phase-05/cutover-runbook.md` に揃い、T-42 / wrangler 直叩き grep を満たす。

## ST-3: smoke 再実行

### 目的

UT-06 Phase 11 で確定済みの S-01〜S-10 smoke を staging Workers URL に対し再実行し、AC-3 / AC-4 gate を確定する。

### サブタスク

| 番号 | 内容 | 期待結果 |
| --- | --- | --- |
| ST-3-a | staging URL `https://ubm-hyogo-web-staging.<account>.workers.dev/` で疎通確認 | HTTP 200 もしくは 3xx（home redirect） |
| ST-3-b | T-20〜T-29（S-01 トップ / S-02 公開ディレクトリ / S-03 認証導線 / S-04 マイページ / S-05 管理 BO / S-06 静的アセット / S-07 404 / S-08 robots / S-09 OAuth callback / S-10 Magic Link）を再実行 | 全件 PASS |
| ST-3-c | T-14（Web→API service binding 経由）を curl で確認 | API 由来データが body に反映 |
| ST-3-d | 結果を `outputs/phase-11/staging-smoke-results.md` に PASS/FAIL 表形式で記録 | 10/10 PASS |

### evidence

- `outputs/phase-11/staging-smoke-results.md`（HTTP status 行のみ）
- `outputs/phase-11/staging-smoke-results.md`（T-20〜T-30 PASS 一覧）
- 必要に応じて `outputs/phase-11/wrangler-deploy-output.md`（API Token mask 済）

### 受け入れ条件

- T-20〜T-29 全 PASS（NG-1 不適用）／ T-13 5 分 window で 5xx = 0 件（NG-4 不適用）。

## ST-4: next.config 確認

### 目的

`apps/web/next.config.ts` に OpenNext 非互換 key（`output: "export"` / 固定 `assetPrefix` / `images.unoptimized` 不整合 等）が含まれていないことを確認し、Phase 2 で予備した `outputs/phase-02/next-config-compat.md` に結果を記録する。

### サブタスク

| 番号 | 内容 | 期待結果 |
| --- | --- | --- |
| ST-4-a | `grep -nE 'output:\s*"export"' apps/web/next.config.ts` 実行 | 0 件（T-05） |
| ST-4-b | `assetPrefix` / `images` / `experimental.runtime` / `basePath` を目視棚卸し | 全て OpenNext 互換 |
| ST-4-c | 非互換 key が見つかった場合は最小修正を Phase 6 で異常系として再評価 | 異常系 A-1（build 失敗系）に統合 |

### 受け入れ条件

- ST-4-a が 0 件、ST-4-b で互換性 NG が無い、または NG が見つかった場合のみ Phase 6 経由で別 PR で対応。

## サブタスク間依存

```text
ST-4 (next.config 確認) ─┐
                          ├─→ ST-1 (workflow 改修) ─→ ST-3 (staging smoke) ─→ AC-3 gate ─→ production cutover
ST-2 (runbook 執筆) ──────┘                                                      │
                                                                                  └─→ ST-2 S5 rollback drill (T-40)
```

- ST-4 が NG なら ST-1 を着手しない（next.config 改修を先行）
- ST-1 / ST-2 は並列着手可
- ST-3 は ST-1 完了 + dev merge 後にのみ実行
- production cutover は ST-3 全 PASS の AC-3 gate 通過後にのみ実行（runbook S3 操作 1）

## NO-GO 紐付け

| ST | 触発する NO-GO | 措置 |
| --- | --- | --- |
| ST-1 | NG-2（OpenNext build artefact 欠損）/ NG-6（contract test 違反） | PR を merge しない |
| ST-2 | NG-6（T-42 期待件数未達） | runbook 加筆まで PR を merge しない |
| ST-3 | NG-1（smoke FAIL）/ NG-3（service binding 解決失敗）/ NG-4（5xx） | production cutover 保留 / 一次 rollback |
| ST-4 | （該当 NG 直結なし、ただし NG-2 触発の前段検査） | 非互換 key を改修してから ST-1 着手 |

## 完了条件

- [ ] ST-1〜ST-4 のサブタスク内容と期待結果が表で確定
- [ ] 各サブタスクが AC-1〜AC-6 と T-01〜T-42 の少なくとも 1 件にトレース
- [ ] サブタスク間の依存関係が図で確定
- [ ] NO-GO 紐付け表が完備

## 成果物

- `outputs/phase-04/main.md`（本ファイル）

## 次の Phase

Phase 5: 実装テンプレート / cutover runbook 本文執筆。

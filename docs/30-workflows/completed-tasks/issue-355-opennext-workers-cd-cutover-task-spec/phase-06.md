# Phase 6: レビューチェックリスト / 異常系

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | 実装担当成果物（PR diff + smoke evidence + runbook）を、AC / セキュリティ / 異常系の 3 観点で検証可能なセルフレビュー仕様に確定する |
| 入力 | Phase 1 AC-1〜AC-6 / RISK-1〜RISK-5、Phase 4 テスト仕様 / NO-GO 閾値、Phase 5 ファイル別変更指示 / runbook 本文 |
| 出力 | `outputs/phase-06/main.md`、`outputs/phase-06/review-checklist.md`、`outputs/phase-06/anomaly-handling.md` |
| 完了条件 | セルフレビュー項目が AC ごとに明示 / セキュリティ観点 5 件以上 / 異常系 7 件以上に検出方法・1次対処・エスカレーションが揃う |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 6 / 13 |
| Phase 名称 | レビューチェックリスト / 異常系 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 5（実装テンプレート） |
| 次 Phase | 7（統合戦略） |
| 状態 | spec_created |
| taskType | implementation |

## セルフレビュー — AC 充足

| AC | 確認項目 | 検証方法 |
| --- | --- | --- |
| AC-1 | OpenNext build artefact 一式 | `ls apps/web/.open-next/worker.js apps/web/.open-next/assets/` がすべて存在し、worker.js size > 0 |
| AC-2 | `web-cd.yml` から `pages deploy` 文字列が消去 | `grep -nE 'pages\s+deploy' .github/workflows/web-cd.yml` が 0 件 / `--env staging` / `--env production` が各 1 件以上 |
| AC-3 | smoke S-01〜S-10 全 PASS | `outputs/phase-11/staging-smoke-results.md` の集計が 10/10 |
| AC-4 | staging URL 200 / Web→API 連携 | `outputs/phase-11/staging-smoke-results.md` の status 200 / T-14 の応答に API 由来データ |
| AC-5 | wrangler.toml 整合 | `grep -nE '^pages_build_output_dir' apps/web/wrangler.toml` が 0 件 / `main = ".open-next/worker.js"` が 1 件 |
| AC-6 | runbook 6 セクション | `grep -cE '^## S[1-6]\.' outputs/phase-05/cutover-runbook.md` が 6 |

## セルフレビュー — 設定ファイル不整合

| 項目 | 検証 |
| --- | --- |
| `pages_build_output_dir` 不在 | wrangler.toml grep |
| `[assets].directory` が `.open-next/assets` | wrangler.toml grep |
| `[env.<stage>.services]` の `API_SERVICE` 維持 | wrangler.toml 目視 |
| `concurrency` 維持 | web-cd.yml 目視 |
| `vars.CLOUDFLARE_PAGES_PROJECT` 参照削除 | web-cd.yml grep が 0 件 |

## セキュリティ観点

1. **secret reference 維持**: `secrets.CLOUDFLARE_API_TOKEN` / `vars.CLOUDFLARE_ACCOUNT_ID` のみ参照、実値の埋込みなし。PR diff を grep でレビュー。
2. **API Token scope**: 使用する `CLOUDFLARE_API_TOKEN` は `Workers Scripts:Edit` / `Workers Routes:Edit` / `Zone:Read`（Pages:Edit は dormant 操作用の別承認 token のみ）を含むこと。Pages scope は dormant 期間終了後に削除可。
3. **OAuth トークン保持禁止**: `wrangler login` を CD / 手動オペレーションで実行しない（CLAUDE.md 規約）。
4. **evidence ファイル sanitize**: `wrangler deploy` ログ・`curl` 出力・smoke ログに API Token / OAuth / Authorization ヘッダ値が混入していないことを確認（grep `(?i)(authorization|bearer|api[_-]?token)`）。
5. **`.env` 値の log 混入禁止**: deploy log に `op://` 参照が解決された値が残っていないこと。`scripts/cf.sh` の挙動として揮発注入のため OK だが、PR レビューで再確認。
6. **service binding 経由の維持**: D1 binding が `apps/web/wrangler.toml` に追加されていないこと（不変条件 #5）。

## 異常系（検出・1次対処・エスカレーション）

### A-1: `pnpm --filter @ubm-hyogo/web build:cloudflare` 失敗

| 項目 | 内容 |
| --- | --- |
| 検出 | T-01 で exit 非 0 / stderr に `Error` |
| 1次対処 | エラー message の最上位スタックトレースを確認。`@opennextjs/cloudflare 1.19.4` の整合と `next.config.ts` 互換 key を確認 |
| エスカレーション | OpenNext upstream issue / Next.js minor version drift の可能性を Phase 1 RISK-5 にフィードバック、Phase 4 テスト計画再評価 |

### A-2: `wrangler deploy` 失敗（authentication）

| 項目 | 内容 |
| --- | --- |
| 検出 | CD log に `Authentication error` / `10000` 系 Cloudflare API error |
| 1次対処 | `secrets.CLOUDFLARE_API_TOKEN` が GitHub Secrets に存在し有効か確認、token scope（上記セキュリティ観点 2）を再確認 |
| エスカレーション | Token rotate を 1Password から実行、CI を rerun |

### A-3: `wrangler deploy` 失敗（service binding 解決失敗）

| 項目 | 内容 |
| --- | --- |
| 検出 | log に `service binding` / `not found` / `API_SERVICE` |
| 1次対処 | `apps/api-staging` / `apps/api-production` Worker の存在を `bash scripts/cf.sh` で確認、wrangler.toml `[[env.<stage>.services]]` の整合を再確認 |
| エスカレーション | API 側 CD（`apps/api`）が未 deploy の可能性。UT-29 連携を確認、staging cutover を中止して NG-3 適用 |

### A-4: staging URL 5xx

| 項目 | 内容 |
| --- | --- |
| 検出 | T-13 で 5xx / smoke FAIL / observability tail に critical error |
| 1次対処 | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` で error message 確認、直前 deploy の VERSION_ID へ rollback |
| エスカレーション | NG-4 適用、production cutover 保留、原因が next.config / OpenNext patch script のいずれにあるか切分 |

### A-5: production custom domain 未付替（traffic split）

| 項目 | 内容 |
| --- | --- |
| 検出 | dig / curl で TLS 証明書が Pages 経由のまま / production smoke 一部 FAIL |
| 1次対処 | runbook S4 手順 1〜4 を再実行、Pages の Custom Domain Remove を実施 |
| エスカレーション | RISK-2 顕在化。trafic split 解消まで announcement・rollback 検討 |

### A-6: Workers route 衝突

| 項目 | 内容 |
| --- | --- |
| 検出 | deploy log に `route conflict` / `already attached to another script` |
| 1次対処 | `bash scripts/cf.sh` で route 一覧を確認、旧 Pages project の route attachment を Dashboard で外す |
| エスカレーション | UT-28 配信形態決定との整合を再確認、衝突解消後再 deploy |

### A-7: Pages 配信残存

| 項目 | 内容 |
| --- | --- |
| 検出 | 旧 Pages URL がまだ index されている / 旧 deploy が active |
| 1次対処 | runbook S2 操作 5 / S6 に従い `Pause Deployments` 確認、Custom Domain unbind 確認 |
| エスカレーション | dormant 期間終了後の delete 計画を再確認 |

### A-8: rollback 不能

| 項目 | 内容 |
| --- | --- |
| 検出 | `wrangler rollback <VERSION_ID>` が exit 非 0 / Pages resume も応答しない |
| 1次対処 | wrangler 4.85.0 と Cloudflare API status を確認、二次手段（Pages resume）に移行 |
| エスカレーション | RISK-4 顕在化、incident チャネル化（CLAUDE.md 規約に従い記録） |

### A-9: contract test 違反（CI gate）

| 項目 | 内容 |
| --- | --- |
| 検出 | T-04 / T-05 / T-10 / T-11 / T-42 のいずれかが期待件数未達 |
| 1次対処 | grep 結果と Phase 5 pseudo-diff を再突合、PR を更新 |
| エスカレーション | Phase 8 の CI gate 強化対象として追記 |

## レビュー観点 — runbook 本体

| 項目 | 確認 |
| --- | --- |
| S1 前提 | API Token scope が記載 / `bash scripts/cf.sh whoami` が示されている |
| S2 staging cutover | 操作 1〜5 が順序付きで明記 / 旧 staging Pages の `Pause Deployments` 操作を含む |
| S3 production cutover | AC-3 gate 通過後にのみ実施する旨が明記 / VERSION_ID 記録手順あり |
| S4 custom domain 移譲 | Add → SSL 待機 → Remove → 検証 の 4 手順 / staging 適用外の明記 |
| S5 rollback | 一次手段が `bash scripts/cf.sh rollback` で記述 / 二次手段の dormant 前提 / 通知テンプレ |
| S6 dormant | 期間 2 週間 / 3 週目以降に delete / 削除手順は本タスクで実行しない旨明記 |

## レビュー観点 — `wrangler` 直叩き禁止

`grep -nE 'wrangler\s+(deploy\|publish\|rollback\|tail)' docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/` を実行し、本仕様書群に直叩きが残存していないことを確認する。`cloudflare/wrangler-action@v3` の `command` 引数（`deploy --env <stage>`）は wrangler-action 経由のため許容。

## 多角的チェック

- 価値性: AC 全件のセルフレビューが実装担当だけで完結する粒度
- 実現性: grep / curl / log 確認のみで判定可能
- 整合性: Phase 4 NO-GO 閾値 NG-1〜NG-6 と本 Phase 異常系 A-1〜A-9 が対応関係（NG-1↔A-4 / NG-3↔A-3 / NG-5↔A-8 / NG-6↔A-9 等）
- 運用性: 各異常系に 1次対処とエスカレーション方針が揃っており、incident 時にそのまま参照可能
- セキュリティ: secret hygiene 6 項目を独立節として分離

## 完了条件

- [ ] AC-1〜AC-6 のセルフレビュー項目が確定
- [ ] セキュリティ観点 6 件が列挙
- [ ] 異常系 9 件が「検出 / 1次対処 / エスカレーション」3 列で記述
- [ ] runbook 6 セクションそれぞれにレビュー観点
- [ ] `wrangler` 直叩き grep の確認手順が明記

## 成果物

- `outputs/phase-06/main.md`
- `outputs/phase-06/review-checklist.md`
- `outputs/phase-06/anomaly-handling.md`

## 次の Phase

Phase 7: 統合戦略（既存 API CD / UT-06 smoke / UT-28 / UT-29 / ADR-0001 / CLAUDE.md スタック表との整合）

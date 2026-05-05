# Phase 3: 設計レビュー — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 2 で設計した実 staging 環境への副作用を伴う実行計画について、不変条件 / リスク / 代替案 / 整合性を検証して GO/NO-GO を決める。設計対象が docs-only ではないため本 Phase も実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 3 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 の設計が (a) 不変条件・aiworkflow-requirements と整合し、(b) リスクが識別・軽減されており、(c) 代替案より優位であり、(d) Phase 4 以降に渡せる粒度であることをレビューし GO/NO-GO を判定する。

## 不変条件チェック

| 条件 | チェック内容 | 判定 |
| --- | --- | --- |
| #5 public/member/admin boundary | curl smoke で 401/403 を取得し、Playwright で role 別画面を確認する設計になっている | GO |
| #6 apps/web は D1 直アクセス禁止 | smoke は `apps/api` 経由のみ。Playwright で web→api 経由のレスポンスを観測する | GO |
| #14 Cloudflare free-tier | deploy / D1 read / Forms sync / wrangler tail の総量が free-tier 内。Forms quota 観測を Phase 11 で記録 | GO |
| 09a-A 固有 #1 | 実測 evidence と placeholder が物理パス（`outputs/phase-11/evidence/`）で分離 | GO |
| 09a-A 固有 #2 | `NOT_EXECUTED` を PASS として扱わない（Phase 7 AC マトリクスで評価） | GO |
| 09a-A 固有 #3 | production への副作用は read-only `PRAGMA` / `SELECT` のみ | GO |
| 09a-A 固有 #4 | secret / PII が evidence に混入しない（redact + op 参照） | GO |

## リスクマトリクス

| # | リスク | likelihood | impact | mitigation |
| --- | --- | --- | --- | --- |
| R1 | secret 値（CLOUDFLARE_API_TOKEN / OAuth refresh / D1 PII）が log / artifact / コミットに混入 | 中 | 致命 | `op://` 参照のみ、`scripts/lib/redact.sh`（または inline sed）で Authorization / Cookie / email / token / IP を redact、commit 前 `git diff` レビューを Phase 13 で必須化 |
| R2 | D1 schema drift（staging vs production）が見つかった際に放置 | 中 | 高 | `d1-schema-parity.json` の `diffCount > 0` で必ず `unassigned-task/task-09a-d1-schema-parity-followup-001.md` を起票。本タスクの DoD に「差分時の TODO 起票」を含めて先送り禁止 |
| R3 | staging 環境（Workers / D1）リソース枯渇 | 低 | 中 | Phase 11 実行前に `cf.sh whoami` と Cloudflare ダッシュボード（手動）で free-tier 残量を確認、deploy 失敗時は rollback で旧 version に戻す |
| R4 | `wrangler tail` 取得不能（token scope 不足 / quota） | 中 | 中 | 不能理由を `wrangler-tail.log` に明記することを AC で許容。代替として `analytics_engine_datasets` の query を Phase 11 で試行 |
| R5 | Forms quota 枯渇（schema fetch / responses fetch の 429） | 中 | 中 | sync 1 サイクルに限定、429 取得時は翌日リトライ TODO を `outputs/phase-11/main.md` に記録、本 Phase だけで完了させない |
| R6 | production D1 への read-only 範囲を超えて mutation を発行する誤操作 | 低 | 致命 | 全 D1 コマンドは `--env staging` を明記、production への発行は `PRAGMA` / `SELECT` のみと Phase 5 runbook で固定、`d1 migrations apply` を `--env production` で発行禁止と明記 |
| R7 | screenshot / D1 dump に PII（実会員氏名・メール）が混入 | 中 | 高 | テスト fixture アカウント（`manjumoto.daishi@senpai-lab.com` / `manju.manju.03.28@gmail.com`）に限定、実会員データが映る場合は blur or 列除外 |
| R8 | placeholder（`NOT_EXECUTED`）と実測 evidence の混在で Phase 完了を誤判定 | 中 | 高 | Phase 7 AC マトリクスで grep `NOT_EXECUTED` を 0 件と確認するゲートを設置 |

## 代替案検討

| 代替案 | 内容 | 採否 | 根拠 |
| --- | --- | --- | --- |
| A1: ローカル端末 + user approval（採用） | operator 端末から `bash scripts/cf.sh` を G1〜G4 で停止しつつ実行 | 採用 | 1Password CLI / op 認証がローカルで完結。approval gate が CLI 出力で目視確認可能。secret 値が GitHub Actions ログに残らない |
| A2: GitHub Actions ワークフロー | `workflow_dispatch` で deploy / smoke を CI 実行 | 不採用 | (a) Cloudflare token を GitHub Secrets にミラーする必要があり secret 拡散面が増える、(b) Forms OAuth refresh token を CI に置く必要がある、(c) approval gate を CI step 単位で挟むと再開が不便、(d) wrangler tail の手動観測が困難 |
| A3: 手動コマンド + Claude Code 不介在 | operator が単独で全 evidence を取得 | 不採用 | evidence 命名規則 / placeholder 置換 / parity 比較スクリプトの自動化メリットを失う |
| A4: production への直接 deploy で staging skip | production 1 段で検証 | 不採用 | 不変条件 #14・本タスク scope（staging gate を 09c の前提にする）に反する |

採用案 A1 は CLAUDE.md の「Cloudflare 系 CLI 実行ルール」「ローカル `.env` 運用ルール」と整合する唯一の選択肢。

## aiworkflow-requirements との整合確認

- 不変条件 #5 / #6 / #14: 上記不変条件チェック表で GO 判定済み
- `sync_jobs`: Phase 2 で D1 query による dump を evidence #9 に組み込み済み
- `audit_log`: evidence #10 として append-only 性を観測対象に組み込み済み
- `task-workflow-active`: Phase 11 実行後に `references/task-workflow-active.md` を実行済み状態へ更新する指示を Phase 12 へ引き渡す
- `aiworkflow-requirements/indexes`: 本タスクは仕様書追加のみで indexes 再生成は不要だが、Phase 13 PR 作成時に `pnpm indexes:rebuild` 実行可否を最終チェックする

## 設計の盲点レビュー（Phase 2 への補強指示）

| 観点 | 指摘 | Phase 5/11 への反映指示 |
| --- | --- | --- |
| deploy 前の旧 version ID 取得 | rollback の前提となる旧 version ID を deploy 前に控える手順が runbook に明示必要 | Phase 5 runbook に `cf.sh deployments list` を deploy 直前 step に追加 |
| Playwright staging config | `playwright.staging.config.ts` の存在を Phase 11 で確認、なければ作成は scope 外として `unassigned-task/` 起票 | Phase 5 で fallback 手順を明記 |
| `scripts/lib/redact.sh` の有無 | 未存在の場合は inline `sed -E 's/(Authorization: )[^ ]+/\1[REDACTED]/g'` を runbook に書く | Phase 5 でフォールバック明記 |
| production 側 D1 への parity クエリの token scope | `D1:Read` 相当が必要。`cf.sh whoami` で確認 | Phase 5 の事前確認 step に追加 |
| `member_responses` の hot column と member_responses 旧名（`task-ut-09-member-responses-table-name-drift.md`）の影響 | parity 検証で table 名 drift を検出した場合は drift 対応 task に紐付ける | Phase 11 evidence で別 unassigned-task と関連付け |

## GO/NO-GO 判定

- 全不変条件: GO
- リスク R1〜R8: 全て mitigation 設定済み
- 代替案: A1 採用妥当
- aiworkflow-requirements 整合: 確認済み
- 設計盲点: Phase 5 runbook への補強指示として渡せる粒度で確定

判定: **GO**（Phase 4 テスト戦略へ進む）

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-01.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-02.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`
- `docs/30-workflows/unassigned-task/task-ut-09-member-responses-table-name-drift.md`
- `.claude/skills/aiworkflow-requirements/`（resource-map / topic-map / task-workflow-active）

## 統合テスト連携

- 上流: 08a / 08a-B / 08b 完了 evidence
- 下流: 09c production deploy execution（本 Phase の GO 判定が 09c の前提を構成）

## 多角的チェック観点

- リスク mitigation が「先送り」になっていない（CONST_007）
- 代替案の不採用理由が CLAUDE.md ルールと整合
- production への mutation 経路が一切残っていない
- evidence と placeholder が物理パス分離されている
- GO 判定の根拠が不変条件・リスク・代替案・整合の 4 軸で揃っている

## サブタスク管理

- [ ] 不変条件 7 項目を判定
- [ ] リスク 8 件にすべて mitigation を割当
- [ ] 代替案 4 件を比較し A1 採用を確定
- [ ] aiworkflow-requirements 整合確認
- [ ] 設計盲点 5 項目を Phase 5 / 11 へ引き渡し条件として記録
- [ ] `outputs/phase-03/main.md` を作成

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 不変条件チェック・リスクマトリクス・代替案・aiworkflow-requirements 整合のすべてに判定が記載されている
- GO/NO-GO 判定の根拠が明文化されている
- Phase 4 以降への引き渡し項目が evidence path / approval gate / blocker 更新先の 3 種で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 設計レビューで NO-GO 要素が残っていない（残っている場合は Phase 2 に差し戻し）
- [ ] 本 Phase で deploy / commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 4（テスト戦略）以降に渡す:
- evidence path 一覧（13 件 / `outputs/phase-11/evidence/` 配下）と命名規則
- approval gate 4 件（G1: api deploy / G2: D1 migration apply / G3: Forms sync / G4: blocker 更新コミット）
- blocker 更新先: `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`、親 09a 親タスクの `artifacts.json` / `outputs/phase-11/*` / `outputs/phase-12/main.md`
- 設計盲点 5 項目（旧 version ID 取得 / Playwright staging config 確認 / redact 手段フォールバック / production D1 read scope 確認 / `member_responses` table 名 drift との関連付け）
- リスク mitigation のうち Phase 11 実行時に再確認が必要な項目（R1 redact, R5 Forms quota, R7 PII, R8 NOT_EXECUTED grep ゲート）

## 実行タスク

- [ ] phase-03 の既存セクションに記載した手順・検証・成果物作成を実行する。

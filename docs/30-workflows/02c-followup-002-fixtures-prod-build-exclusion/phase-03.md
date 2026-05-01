# Phase 3: 設計レビュー — 02c-followup-002-fixtures-prod-build-exclusion

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 02c-followup-002-fixtures-prod-build-exclusion |
| phase | 3 / 13 |
| wave | 02c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

設計の不変条件・依存・例外境界を検証する。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 未反映の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md
- docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md
- apps/api/tsconfig.json
- apps/api/wrangler.toml
- apps/api/src/repository/__fixtures__/admin.fixture.ts
- apps/api/src/repository/__tests__/_setup.ts
- .dependency-cruiser.cjs

## 実行手順

- 対象 directory: docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 02c admin notes audit / sync jobs / data-access boundary（本体タスク）, aiworkflow-requirements 不変条件 #6
- 下流: 03a 以降の fixture 追加タスク, production deploy readiness, Cloudflare Workers bundle size 監査

## 多角的チェック観点

- #6 dev fixture を production seed として扱わない
- production runtime に test 専用依存（miniflare 等）を流入させない
- Cloudflare Workers free-tier bundle size 上限を遵守する
- 未実装 / 未実測を PASS と扱わない。
- 02c で固定した dev fixture / test loader 契約を勝手に変更しない（本タスクは build 構成と境界 lint のみで防御する）。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- apps/api build 成果物に `__fixtures__/**` / `__tests__/**` ファイルが含まれない（成果物 ls 確認）
- `pnpm test` が引き続き通る（fixture loader / 02a / 02b の test 影響なし）
- production code (`src/**` で `__tests__` / `__fixtures__` 配下以外) から `__fixtures__` への import が `.dependency-cruiser.cjs` で error になる
- `pnpm build` または `wrangler deploy --dry-run` の bundle サイズ縮小が記録される
- 02c implementation-guide.md 不変条件 #6 節への補強が反映される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、AC、blocker、evidence path、approval gate を渡す。

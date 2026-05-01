# 02c-followup-002-fixtures-prod-build-exclusion

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 02c-fu |
| mode | parallel |
| owner | - |
| 状態 | implemented-local / Phase 1-12 completed / Phase 13 pending_user_approval |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/113 |

## purpose

`apps/api` の build 成果物から `__fixtures__/**` / `__tests__/**` を構成上強制的に除外し、
production runtime に dev-only コード（miniflare 等の test 専用依存・dev fixture seed）が
流入しない状態を foundation として固定する。

## why this is not a restored old task

このタスクは 02c 本体タスクの復活ではなく、02c Phase 12 の `unassigned-task-detection.md` #6 で
発見された未タスクの formalize である。02c は `__fixtures__/admin.fixture.ts` と
`__tests__/_setup.ts` を dev fixture / test loader として実装した（不変条件 #6: production seed
として扱わない）。しかし `apps/api/tsconfig.json` は build / test 共用の単一構成で、
production bundle に dev-only コードが流入するリスクが構成上残っている。本タスクは
その build / boundary 構成だけを対象とし、02c が固定した fixture / loader 契約自体は
変更しない。

## scope in / out

### Scope In

- `apps/api/tsconfig.build.json` 分割 または `tsconfig.json` への `exclude` 追加
- `apps/api` 配下 vitest 設定の include / exclude 整合
- `.dependency-cruiser.cjs` への production import 禁止 rule 追加
  （`src/**` の production path から `__fixtures__` / `__tests__` への import を error 化）
- 02c implementation-guide.md 不変条件 #6 節への補強（三重防御の適用範囲拡張）
- `pnpm build` / `wrangler deploy --dry-run` での bundle 内訳と size 縮小の evidence 定義

### Scope Out

- 02a / 02b の test refactor（fixture 共有契約は 02c 正本のまま）
- production fixture / seed の新規実装
- monorepo 全体の tsconfig 構成見直し
- deploy、commit、push、PR 作成

## dependencies

### Depends On

- 02c admin notes audit / sync jobs / data-access boundary（本体タスク・完了済）
- aiworkflow-requirements 不変条件 #6（dev fixture を production seed として扱わない）

### Blocks

- 03a 以降で新規 fixture を追加するタスク（同じ判断を再現性なく毎回することを防ぐ）
- production deploy readiness（bundle size / 攻撃面の確定）
- Cloudflare Workers bundle size 監査

## refs

- docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md
- docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md
- apps/api/tsconfig.json
- apps/api/wrangler.toml
- apps/api/src/repository/__fixtures__/admin.fixture.ts
- apps/api/src/repository/__tests__/_setup.ts
- .dependency-cruiser.cjs

## AC

- AC-1（PASS）: apps/api production bundle 相当の成果物に `__fixtures__/**` / `__tests__/**` / `miniflare` が含まれない（esbuild bundle grep で確認。`pnpm build` は `tsc --noEmit` のためファイル成果物を生成しない）
- AC-2（PARTIAL）: 本 diff 起因の `pnpm test` regression はなし（`pnpm typecheck` / `pnpm build` exit 0）。ただし全体 `pnpm test` は pre-existing failure（`sync-forms-responses.test.ts` 等 4 件）により FAIL のため未達。追跡先: `docs/30-workflows/unassigned-task/task-02c-followup-002-sync-forms-responses-test-baseline-001.md`。compliance-check の AC-2 status と一致する。
- AC-3（PASS）: production code（`src/**` で `__tests__` / `__fixtures__` 配下以外）から `__fixtures__` への import が `.dependency-cruiser.cjs` で error になる
- AC-4（PARTIAL）: esbuild substitute で production bundle 相当 792.9 KB / 除外対象 344,831 B (47.7%) / 90 ファイルを記録。`wrangler deploy --dry-run` 実測は環境要因で未取得のため follow-up に分離（compliance-check の AC-4 status と一致）。
- AC-5（PASS）: 02c implementation-guide.md 不変条件 #6 節への補強差分が反映される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #6 dev fixture を production seed として扱わない
- production runtime に test 専用依存（miniflare 等）を流入させない
- Cloudflare Workers free-tier bundle size 上限を遵守する

## completion definition

全 phase 仕様書と Phase 12 close-out 成果物が揃い、build 構成・boundary lint・evidence path・
user approval gate が明確であること。ローカル実装は `apps/api/tsconfig.build.json` /
`apps/api/package.json` / `.dependency-cruiser.cjs` に反映済み。deploy、commit、push、PR 作成は
ユーザー明示指示まで実行しない。

# タスク仕様書: Issue #617 — CI test time reduction / D1 利用テスト grouping + apps/web 並列化

[実装区分: 実装仕様書]

## 判定根拠 (CONST_004 / CONST_005)

ユーザー要望に基づき、本タスクは原 Issue #617（軸 E: apps/api の D1 grouping refactor）を**拡張**して、`apps/api` の D1 group / unit group 分離に加えて **`apps/web` の test split** と **CI coverage shard の並列化（matrix 化）** までを 1 サイクル内で実施する。コード変更（root `vitest.config.ts` 分割または vitest projects 化、`apps/api/package.json` / `apps/web/package.json` script 追加、`scripts/coverage-guard.sh` の group 受け取り、`.github/workflows/ci.yml` の `coverage-gate-shard` matrix 化 + aggregate `coverage-gate` 維持）を必須で伴うため、CONST_004 デフォルトに従い **実装仕様書**として作成する。

原 Issue #617 は **CLOSED (2026-05-11T13:15:42Z)** のまま維持し、本仕様書は `Refs #617` として参照する。`Closes` / `Fixes` / `Resolves` は使わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-617-ci-test-time-reduction-split |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/617 (CLOSED 維持) |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/task-issue-577-followup-003-test-grouping-by-d1-usage.md` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-577-api-coverage-rerun-miniflare-port-exhaustion/`（軸 B 採用済み） |
| 配置先 | `docs/30-workflows/issue-617-ci-test-time-reduction-split/` |
| 作成日 | 2026-05-11 |
| 状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_runtime_pending |
| evidence_state | LOCAL_EVIDENCE_PARTIAL_CI_RUNTIME_PENDING |
| 優先度 | MEDIUM（ユーザー要望で原 LOW から繰上げ） |
| Wave | follow-up（Issue #577 派生・軸 E + apps/web 拡張） |
| 想定 PR 数 | 1（本サイクル: vitest config 分割 + npm scripts + coverage-guard 対応 + CI matrix 化 + evidence） |
| coverage AC | 既存閾値（lines/branches/functions/statements 80%）を維持・低下不可 |

## スコープ拡張の理由

ユーザー要望: 「バックエンドやフロントエンドなどのテストもちょっと時間がかかりすぎてしまっているので分離するようにしてほしい（ciのこと）」

これにより本タスクは原 #617 の「apps/api 内部での D1 grouping」だけでなく、**CI レベルで `apps/web` / `apps/api` / `packages/*` の coverage 実行を並列化**して wall-clock を短縮する責務まで含む。

### スコープに含むもの

1. `apps/api` の test ファイルを D1 binding 利用有無で論理分離（`include` / `exclude` ベース、物理移動は最小化）
2. root `vitest.config.ts` を `vitest.config.ts`（既定 / unit）と `vitest.d1.config.ts`（serial / D1）に分割、または vitest `projects` 機能で論理分割
3. `apps/api/package.json` に `test:coverage:unit` / `test:coverage:d1` / `test:coverage`（既存互換: 両方実行 + merge）を整備
4. `apps/web/package.json` の `test:coverage` を維持しつつ、CI 上は `apps/api` と並列実行できる構造にする
5. `scripts/coverage-guard.sh` に `--group <unit|d1|web|packages>` または `--package <name>` を活用した並列起動手段を整備
6. `.github/workflows/ci.yml` に `coverage-gate-shard` matrix（`apps/web` / `apps/api/unit` / `apps/api/d1` / `packages` の 4 並列）と、既存 required context 名を維持する集約 job `coverage-gate` を追加
7. `coverage-guard` の合否判定が並列実行後の merge 済 coverage に対しても従来通り動作することを保証
8. before/after wall-clock evidence を `outputs/phase-11/` に記録

### スコープに含まないもの

- `apps/api` / `apps/web` の実装ロジック変更
- D1 schema / migration 変更
- coverage 閾値変更（80% 維持）
- 既存 test の assertion 内容変更
- Vitest version up（既存 `^2.1.9` 維持）
- E2E (Playwright) workflow 構成変更（`e2e-tests.yml` は別系統）
- commit / push / PR 作成（実装・検証後も Phase 13 でユーザー承認を得るまで実行しない）

## 不変条件（CONST_005 必須項目: 変更対象ファイル一覧）

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `vitest.config.ts` (root) | 編集 | unit 既定 config（`include` から D1 binding 利用 test を `exclude`、または `projects` 化） |
| `vitest.d1.config.ts` (root, 新規) | 新規 | D1 binding 利用 test 専用。`pool: 'forks'` / `poolOptions.forks.singleFork: true` または `maxWorkers=1 --minWorkers=1`、`include` を D1 group のみに限定 |
| `apps/api/package.json` | 編集 | `test:coverage:unit` / `test:coverage:d1` / `test:coverage`（両者実行 + merge wrapper）を追加 |
| `apps/web/package.json` | 編集 | `test:coverage:web`（既存 `test:coverage` の別名 alias、CI matrix から呼ぶ用）を追加。既存 `test:coverage` は後方互換で残す |
| `scripts/coverage-guard.sh` | 編集 | `--group <name>` 受け取り。`--no-run` モードと組み合わせて per-group artifact を集約 |
| `scripts/coverage-merge.mjs` (新規) | 新規 | `apps/api/coverage/unit/coverage-final.json` と `apps/api/coverage/d1/coverage-final.json` を `apps/api/coverage/coverage-final.json` に merge し `coverage-summary.json` を再生成 |
| `.github/workflows/ci.yml` | 編集 | `coverage-gate-shard` を matrix 化（`web` / `api-unit` / `api-d1` / `packages`）。後段の `coverage-gate` job が artifact を download → merge → `coverage-guard.sh --no-run` で判定し、既存 required context を維持 |
| `docs/30-workflows/issue-617-ci-test-time-reduction-split/outputs/phase-11/before-after.md` | 新規 | wall-clock evidence |
| `docs/30-workflows/issue-617-ci-test-time-reduction-split/outputs/phase-12/implementation-guide.md` | 新規 | PR 本文の base となる実装ガイド |
| `docs/30-workflows/unassigned-task/task-issue-577-followup-003-test-grouping-by-d1-usage.md` | 編集 | 本仕様書に昇格した旨の status 追記、または削除 |

## 主要関数・モジュールシグネチャ

### `scripts/coverage-merge.mjs`

```ts
// 入力: --inputs=<glob>,<glob>... --output=<dir>
// 例: node scripts/coverage-merge.mjs \
//       --inputs="apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json" \
//       --output="apps/api/coverage"
// 効果: Istanbul coverage-final.json と coverage-summary.json を出力
```

### `scripts/coverage-guard.sh` 拡張

```sh
bash scripts/coverage-guard.sh --group web        # apps/web のみ
bash scripts/coverage-guard.sh --group api-unit   # apps/api unit のみ (vitest.config.ts)
bash scripts/coverage-guard.sh --group api-d1     # apps/api d1 のみ (vitest.d1.config.ts)
bash scripts/coverage-guard.sh --group packages   # packages/* のみ
bash scripts/coverage-guard.sh --no-run           # 集約モード (CI aggregate job 用)
```

### `vitest.d1.config.ts` 概要

```ts
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

const baseCoverage = ((baseConfig as { test?: { coverage?: Record<string, unknown> } }).test?.coverage ?? {});

export default defineConfig({
  test: {
    include: [
      // Phase 4 で確定した D1 依存 test glob のみ
    ],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    coverage: {
      ...baseCoverage,
      reportsDirectory: "apps/api/coverage/d1",
    },
  },
});
```

## 入力・出力・副作用

| 観点 | 内容 |
| --- | --- |
| 入力 | 既存 test ファイル一式、既存 `vitest.config.ts` |
| 出力 | 新 config 群、merged coverage、CI 並列実行 |
| 副作用 | per-group coverage artifact が CI で生成される。集約 job 完了まで coverage-gate 判定は確定しない |

## テスト方針（CONST_005）

| 項目 | 内容 |
| --- | --- |
| 機械判定スクリプト test | `scripts/coverage-merge.mjs` に node 標準 `node --test` ベースの fixture test を追加（`scripts/__tests__/coverage-merge.test.mjs`） |
| coverage-guard test | 既存 `bats` or `node --test` パターンに合わせ、`--group` モードが想定 package を絞り込むことを fixture で確認 |
| CI 動作確認 | feature branch push で `coverage-gate-shard` matrix が 4 job 並列で起動し、aggregate `coverage-gate` job が成功することを `gh run view` で確認 |
| 既存 assertion | 変更しない（grep で diff にテスト assertion 変更が含まれないことを確認） |

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# group ごとの個別実行
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage   # merge までやる
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# coverage-guard の group モード
bash scripts/coverage-guard.sh --group api-unit
bash scripts/coverage-guard.sh --group api-d1
bash scripts/coverage-guard.sh --group web
bash scripts/coverage-guard.sh --group packages

# 集約モード (CI aggregate と同等)
bash scripts/coverage-guard.sh --no-run
```

## DoD (Definition of Done) — CONST_005

- [ ] `vitest.d1.config.ts` 新規作成、`vitest.config.ts` から D1 依存 test が exclude されている
- [ ] `apps/api/package.json` に `test:coverage:unit` / `test:coverage:d1` / `test:coverage`（両者 + merge）が存在
- [ ] `apps/web/package.json` に `test:coverage:web` alias が存在（既存 `test:coverage` 後方互換も維持）
- [ ] `scripts/coverage-merge.mjs` が unit + d1 の per-group coverage を merge し `coverage-summary.json` を再生成
- [ ] `scripts/coverage-guard.sh --group <name>` が想定 package のみを実行
- [ ] `.github/workflows/ci.yml` の `coverage-gate-shard` が 4 matrix で並列起動し、後段 `coverage-gate` job が artifact merge して既存 required context 名のまま判定
- [ ] CI wall-clock が現行 single-job 構成より短縮されていることが evidence で示される（before/after を `outputs/phase-11/before-after.md` に記録）
- [ ] coverage 閾値 80% を維持（aggregate 後の `coverage-summary.json` で判定）
- [ ] port exhaustion 非再発（CI で `EADDRNOTAVAIL` / `EADDRINUSE` が出ないこと）
- [ ] `pnpm typecheck` / `pnpm lint` がローカルで PASS
- [ ] commit / push / PR は本サイクルでは行わない

## リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 誤分類で D1 依存 test が unit group に残り port exhaustion 再発 | 高 | 中 | grep + AST + 命名規約（`*.d1.test.ts`）の三段で機械判定。初回は保守的に D1 group 寄せ。CI で `EADDRNOTAVAIL` 検出を fail gate にする |
| coverage merge 失敗で閾値判定崩壊 | 高 | 中 | per-group artifact を保持。merge 失敗時は `coverage-gate` 集約 job を fail-closed にし、single-config fallback は人間が明示実行する |
| matrix 化で CI fan-out コスト増 | 中 | 中 | shard job は fail-fast false で全 group evidence を残し、最終判定は `coverage-gate` 1 context に集約 |
| `apps/web` Tailwind build 依存が group 跨ぎで二重実行 | 中 | 高 | `web` shard のみ build し、aggregate は coverage 判定だけを行う |
| Vitest projects と coverage v8 merge の相性問題 | 中 | 中 | projects 採用は Phase 2 で判断。互換性に不安あれば 2 config 物理分割を採用 |

## 関連ドキュメント

- `docs/30-workflows/unassigned-task/task-issue-577-followup-003-test-grouping-by-d1-usage.md`（起票元）
- `docs/30-workflows/completed-tasks/issue-577-api-coverage-rerun-miniflare-port-exhaustion/`（軸 B 採用済み）
- `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md`（coverage gate 仕様正本）
- `scripts/coverage-guard.sh`（既存実装）
- `.github/workflows/ci.yml` の `coverage-gate` job（既存実装）
- `apps/api/package.json` / `apps/web/package.json` / root `vitest.config.ts`
- aiworkflow-requirements: 不変条件 5（D1 直接アクセスは apps/api 経由のみ）

## Phase 一覧

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | `phase-01.md` | 要件定義 / Gate 整理 / 真の論点 |
| 2 | `phase-02.md` | アーキテクチャ設計（vitest config 分割 vs projects 機能の選択） |
| 3 | `phase-03.md` | 詳細設計（include/exclude 規則、merge 戦略、CI matrix 設計） |
| 4 | `phase-04.md` | D1 依存 test の機械判定と分類 |
| 5 | `phase-05.md` | `vitest.d1.config.ts` 新規作成と root config 更新 |
| 6 | `phase-06.md` | `package.json` scripts 整備 |
| 7 | `phase-07.md` | `scripts/coverage-merge.mjs` 実装 |
| 8 | `phase-08.md` | `scripts/coverage-guard.sh` の `--group` 対応 |
| 9 | `phase-09.md` | `.github/workflows/ci.yml` の shard matrix 化 + required context 維持 |
| 10 | `phase-10.md` | ローカル検証（unit / d1 / web / packages 個別 + 集約） |
| 11 | `phase-11.md` | before/after wall-clock evidence 取得 |
| 12 | `phase-12.md` | strict 7 outputs 作成 + task-spec compliance check |
| 13 | `phase-13.md` | PR 化準備（spec_created → implemented_local_evidence_captured までの確認事項） |

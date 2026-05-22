# Stage 3 / Subtask 3b — `e2e-tests.yml` hard gate 化（実装仕様書）

| 項目 | 値 |
|------|----|
| workflow id | `e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate` |
| 親ワークフロー | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`（spec / 設計の正本） |
| 実装区分 | **実装仕様書** |
| base branch | `dev` |
| feature branch（想定） | `feat/e2e-coverage-gate` |
| 起票日 | 2026-05-09 |
| CONST_007 | single cycle |
| 適用 tier | standard（lines >= 80%） |
| 正本 | 本ディレクトリ + 親 `e2e-quality-uplift-stage-3/phase-{1..13}.md` |

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| coverage_threshold_source | `.claude/skills/task-specification-creator/references/quality-gates.md` §7.5 |
| workflow_state | implemented-local |
| evidence_state | IMPLEMENTED_LOCAL_RUNTIME_PENDING |
| implementation_mode | new（既存 file 全面書換） |

---

## 目的（3b スコープ）

`.github/workflows/e2e-tests.yml` を **PR ブロッキング可能な hard CI gate** に昇格させる。`workflow_dispatch` 単独運用から `pull_request: { branches: [dev, main] }` トリガへ書き換え、Playwright e2e 全件実行 + line coverage 80% gate + critical-route smoke fail-fast を 1 job (`e2e-tests-coverage-gate`) に集約する。`apps/web/playwright.config.ts` の reporter 配列末尾に `monocart-reporter` を追加して coverage artifact を生成する。

3a (Lighthouse CI) / 3c (branch protection) は **本仕様書のスコープ外**。順序依存のみ言及する。

---

## スコープ境界

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/e2e-tests.yml` を PR トリガ + coverage gate に書き換え（major rewrite） | 3a Lighthouse CI 実装（別 spec：`../3a-lighthouse-ci/`） |
| `apps/web/playwright.config.ts` reporter 配列末尾に `monocart-reporter` 追加 | reporter `html` / `json` / `list` の削除・順序変更 |
| `apps/web/package.json` devDep に `monocart-reporter` / `c8` 追加 | unit coverage gate（既存 `coverage.yml`）の変更 |
| `scripts/coverage-gate-e2e.sh` 新規作成（line coverage 80% 判定） | branch / function / statement coverage gate（standard tier は line のみ） |
| 失敗時の HTML report artifact upload | trace viewer ホスティング |
| `pnpm-lock.yaml` 更新 | `wrangler` deploy preview 連携 |
| critical-route smoke の fail-fast 先行 step | `@critical-route` tag 付与（Stage 2 で完了済前提） |

---

## 受入基準（3b 抜粋・親 index.md AC-02..AC-04 由来）

| # | 受入基準 | 検証方法 |
|---|----------|----------|
| AC-02 | `e2e-tests.yml` が `pnpm e2e` を CI で実行し、line coverage < 80% で fail / `@critical-route` smoke 失敗で fail | dummy PR で coverage 79% を再現し fail を観測（Phase 11） |
| AC-03 | `apps/web/playwright.config.ts` reporter に `monocart-reporter` が追加され、coverage artifact が生成される | CI ログ + artifact 一覧で確認（既存 `html`/`json`/`list` も維持） |
| AC-04 | coverage artifact / 失敗時 HTML report が `actions/upload-artifact@v4` 経由で取得可能 | `gh run download <run-id> --name e2e-coverage-<sha>` |

### 3b 固有の補助基準

| # | 内容 |
|---|------|
| AC-3b-1 | PR to `dev` / `main` で `e2e-tests-coverage-gate` job が起動 |
| AC-3b-4 | `coverage-summary.json` artifact が retention 14 日でアップロード |
| AC-3b-5 | failure 時のみ `e2e-html-report-${{ github.sha }}` artifact が retention 7 日でアップロード |
| AC-3b-6 | reporter list に `monocart-reporter` が含まれ、既存 `html`/`json`/`list` も維持される |

---

## 変更対象ファイル（CONST_005 inventory）

| path | 種別 | 役割 |
|------|------|------|
| `.github/workflows/e2e-tests.yml` | edit（major rewrite） | PR トリガ + coverage gate job |
| `apps/web/playwright.config.ts` | edit（行 15-19 reporter 配列に monocart 追加） | coverage 計測 hook |
| `apps/web/src/lib/fetch/public.ts` | edit | local / CI E2E で `PUBLIC_API_BASE_URL` 差し替えを service binding より優先 |
| `apps/web/package.json` | edit（`monocart-reporter` / `c8` を devDependencies） | 依存追加 |
| `scripts/coverage-gate-e2e.sh` | new | line coverage 80% 判定スクリプト |
| `scripts/e2e-mock-api.mjs` | new | Server Component fetch 用 deterministic mock API |
| `pnpm-lock.yaml` | regenerate | lockfile 更新 |

---

## 依存関係

| 種別 | 内容 | 状態 |
|------|------|------|
| depends-on | Stage 2 完了（coverage 80% 達成 + `@critical-route` tag 付与） | 完了 |
| depends-on | `apps/web/playwright.config.ts:15-19` の reporter 構成（現状 `html` / `json` / `list`） | 確認済 |
| 順序依存 | 3a Lighthouse CI と独立 PR で並走可。3c branch protection は 3b merge 後に context が GitHub に登録されてから実施（BLK-03） | 順序のみ依存 |
| blocks | 3c branch protection（`e2e-tests-coverage-gate` context 登録後） | — |

---

## 不変条件（3b 固有）

1. solo dev policy: `required_pull_request_reviews=null` を保持する（3c で payload PUT 時の維持。3b 単体では変更なし）。
2. coverage threshold は `.claude/skills/task-specification-creator/references/quality-gates.md` §7.5（standard tier = 80%）を正本参照。**ハードコード時は const コメントで根拠 path を併記**する。3b 内で独自しきい値を持たない。
3. 既存 reporter（`html` / `json` / `list`）は維持し、`monocart-reporter` を **配列末尾に追加** する。順序変更・削除は禁止。
4. `wrangler` 直叩きを CI 内で行わない（3b は wrangler 不使用）。
5. workflow `name:` および `jobs.<id>.name:` は branch protection context 名 `e2e-tests-coverage-gate` と **完全一致** させる（タイポは PR 永久 pending を招く）。
6. `pnpm/action-setup@v4` の `version` は `10.33.2` / `actions/setup-node@v4` の `node-version` は `24.15.0`（CLAUDE.md / `.mise.toml` 正本）。
7. `actions/checkout@v4` / `actions/setup-node@v4` / `actions/upload-artifact@v4` / `pnpm/action-setup@v4` は **major version 固定**。
8. CONST_007 single cycle: Phase 1→13 一直線。戻りループなし。

---

## Phase 1-13 状態表

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | spec | `phase-1.md` |
| 2 | 設計 | spec | `phase-2.md` |
| 3 | 設計レビュー | spec | `phase-3.md` |
| 4 | テスト作成 | spec | `phase-4.md` |
| 5 | 実装 | spec | `phase-5.md` |
| 6 | テスト拡充 | spec | `phase-6.md` |
| 7 | カバレッジ確認 | spec | `phase-7.md` |
| 8 | リファクタリング | spec | `phase-8.md` |
| 9 | 品質保証 | spec | `phase-9.md` |
| 10 | 最終レビュー | spec | `phase-10.md` |
| 11 | 手動テスト / Evidence | spec | `phase-11.md` |
| 12 | ドキュメント更新 | spec | `phase-12.md` |
| 13 | PR 作成 | spec | `phase-13.md` |

---

## 親ワークフローからの抽出ルール

本仕様書は親 `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-{1..13}.md` から **3b 関連箇所のみ** を抽出して構成する。

| 抽出元 | 抽出先 |
|--------|--------|
| 親 phase-1.md §3「サブタスク 3b」 | 本 phase-1.md |
| 親 phase-2.md §2 | 本 phase-2.md |
| 親 phase-3.md（3b 関連 BLK / Q のみ） | 本 phase-3.md |
| 親 phase-4.md §2 / §3.2 (T-3c-4) | 本 phase-4.md |
| 親 phase-5.md §2 / §4 / §5 PR-B | 本 phase-5.md |
| 親 phase-6.md §1.1 / §2 | 本 phase-6.md |
| 親 phase-7.md §2 | 本 phase-7.md |
| 親 phase-8.md §4 / §5 | 本 phase-8.md |
| 親 phase-9.md §1 / §2 / §3 | 本 phase-9.md |
| 親 phase-10.md §1 / §2（AC-02..AC-04） | 本 phase-10.md |
| 親 phase-11.md §3 / §6（PR-B 行のみ） | 本 phase-11.md |
| 親 phase-12.md §1.2 / §2 / §3（3b 関連 entry） | 本 phase-12.md |
| 親 phase-13.md PR-B スコープ | 本 phase-13.md |

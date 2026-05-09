# Phase 5: 実装（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` |
| 出力 | reporter swap diff / `scripts/coverage-gate-e2e.sh` 全文 / `.github/workflows/e2e-tests.yml` 全文 / 依存追加コマンド |
| implementation_mode | `new`（既存 file 全面書換 + 新規 script + reporter 末尾追加） |

---

## 0. 実装サマリ

| ID | mode | 影響ファイル | コミット粒度 |
|----|------|--------------|-------------|
| 3b | `new`（major edit） | `.github/workflows/e2e-tests.yml` / `apps/web/playwright.config.ts` / `apps/web/package.json` / `scripts/coverage-gate-e2e.sh` / `pnpm-lock.yaml` | 1 PR（PR-B） |

---

## 1. 編集: `apps/web/playwright.config.ts`（reporter swap）

### 1.1 適用範囲

`apps/web/playwright.config.ts:15-19` の reporter 配列に対し、**末尾に `monocart-reporter` を追加**する。既存 3 件は維持。

### 1.2 適用後の reporter 配列（phase-2 §1.2 を参照）

```ts
reporter: [
  ['html', { outputFolder: `${EVIDENCE_DIR}/playwright-report/html`, open: 'never' }],
  ['json', { outputFile: `${EVIDENCE_DIR}/playwright-report/results.json` }],
  ['list'],
  ['monocart-reporter', {
    name: 'UBM-Hyogo E2E',
    outputFile: `${EVIDENCE_DIR}/monocart/index.html`,
    coverage: {
      entryFilter: (entry: { url: string }) => entry.url.includes('/_next/static/'),
      sourceFilter: (sourcePath: string) => sourcePath.includes('apps/web/src/'),
      reports: [
        ['v8', { outputDir: 'coverage/v8' }],
        ['lcovonly', { outputFile: 'coverage/lcov.info' }],
      ],
    },
  }],
],
```

### 1.3 step 列挙

| # | 操作 | 確認 |
|---|------|------|
| I-01 | エディタで `apps/web/playwright.config.ts` を開く | — |
| I-02 | 行 18 の `['list'],` 直後に monocart entry を追記 | `git diff` で末尾追加のみ |
| I-03 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |

---

## 2. 編集: `apps/web/package.json`（devDependencies 追加）

### 2.1 diff

```diff
"devDependencies": {
+   "monocart-reporter": "^2.9.0",
+   "c8": "^10.1.0",
    ...
}
```

### 2.2 依存追加コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web add -D monocart-reporter@^2.9.0 c8@^10.1.0
```

### 2.3 step 列挙

| # | 操作 | 確認 |
|---|------|------|
| I-04 | 上記 `pnpm add -D` を実行 | `apps/web/package.json` に 2 件追加 |
| I-05 | `pnpm-lock.yaml` 更新を確認 | `git diff pnpm-lock.yaml` non-empty |
| I-06 | `git add apps/web/package.json pnpm-lock.yaml` | — |

---

## 3. 新規: `scripts/coverage-gate-e2e.sh`（全文）

```bash
#!/usr/bin/env bash
# scripts/coverage-gate-e2e.sh
#
# E2E line coverage 70% gate.
# - Reads v8 coverage from monocart-reporter (apps/web/coverage/v8/)
# - Generates json-summary via c8
# - Fails (exit 1) when total.lines.pct < 70
#
# coverage threshold = 70%
# source: .claude/skills/task-specification-creator/references/quality-gates.md §7.5
# tier: standard / metric: lines
#
# requires: pnpm, c8 (apps/web devDependency), jq, awk
# usage:
#   bash scripts/coverage-gate-e2e.sh
#
# fixture override (used by Phase 4 tests):
#   THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/pass \
#     bash scripts/coverage-gate-e2e.sh
#
# Outputs GitHub Actions-style annotations:
#   ::notice::line coverage <pct> >= 70
#   ::error::line coverage <pct> < 70

set -euo pipefail

THRESHOLD=70
TEMP_DIR="apps/web/coverage/v8"
REPORT_DIR="apps/web/coverage/summary"
SUMMARY="${REPORT_DIR}/coverage-summary.json"

# Fixture mode: override SUMMARY to a fixed path for unit tests.
if [[ -n "${THRESHOLD_FIXTURE:-}" ]]; then
  SUMMARY="${THRESHOLD_FIXTURE}/coverage-summary.json"
else
  # Generate json-summary from v8 coverage (production path).
  pnpm --filter @ubm-hyogo/web exec c8 report \
    --reporter=json-summary \
    --temp-directory="${TEMP_DIR}" \
    --report-dir="${REPORT_DIR}"
fi

if [[ ! -f "${SUMMARY}" ]]; then
  echo "::error::coverage-summary.json not found at ${SUMMARY}"
  exit 1
fi

PCT="$(jq -r '.total.lines.pct' "${SUMMARY}")"

if [[ -z "${PCT}" || "${PCT}" == "null" ]]; then
  echo "::error::failed to read total.lines.pct from ${SUMMARY}"
  exit 1
fi

# awk handles floating-point comparison portably.
if awk "BEGIN { exit !(${PCT} >= ${THRESHOLD}) }"; then
  echo "::notice::line coverage ${PCT} >= ${THRESHOLD}"
  exit 0
else
  echo "::error::line coverage ${PCT} < ${THRESHOLD}"
  exit 1
fi
```

### 3.1 step 列挙

| # | 操作 | 確認 |
|---|------|------|
| I-07 | `scripts/coverage-gate-e2e.sh` を作成し上記内容を貼付 | — |
| I-08 | `chmod +x scripts/coverage-gate-e2e.sh` | `ls -l` で実行権限 |
| I-09 | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |
| I-10 | fixture pass / fail / missing をローカル実行（phase-4 T-3b-5..7） | 期待通り |

---

## 4. 編集: `.github/workflows/e2e-tests.yml`（major rewrite — 全文）

```yaml
name: e2e-tests

on:
  pull_request:
    branches: [dev]
  workflow_dispatch:

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    name: e2e-tests-coverage-gate
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24.15.0
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright (chromium)
        run: pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium

      - name: Critical-route smoke (fail-fast)
        run: pnpm --filter @ubm-hyogo/web e2e --grep @critical-route

      - name: Run e2e (full)
        if: success()
        run: pnpm --filter @ubm-hyogo/web e2e

      - name: Coverage gate (line >= 70%)
        if: success()
        run: bash scripts/coverage-gate-e2e.sh

      - name: Upload coverage artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-coverage-${{ github.sha }}
          path: apps/web/coverage/
          retention-days: 14

      - name: Upload monocart artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-monocart-${{ github.sha }}
          path: apps/web/playwright/evidence/monocart/
          retention-days: 7

      - name: Upload Playwright HTML report (failure only)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-html-report-${{ github.sha }}
          path: apps/web/playwright/evidence/playwright-report/html/
          retention-days: 7
```

### 4.1 step 列挙

| # | 操作 | 確認 |
|---|------|------|
| I-11 | `.github/workflows/e2e-tests.yml` を上記全文で書き換え | `git diff` で全面書換 |
| I-12 | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` | violation 0 |
| I-13 | `name:` / `jobs.e2e.name:` が `e2e-tests` / `e2e-tests-coverage-gate` で一致 | grep |
| I-14 | `pnpm/action-setup@v4` の version=10.33.2 / setup-node の node-version=24.15.0 | 目視 |

> 既存 workflow が `EVIDENCE_DIR` の値を Stage 0/1 で別 path に解決している場合、step 10/11 の `path:` は実 path に揃える（Phase 11 の draft run で実体観測してから fix-up commit）。

---

## 5. 入出力（CONST_005）

| ファイル | 入力 | 出力 |
|---------|------|------|
| `scripts/coverage-gate-e2e.sh` | `apps/web/coverage/v8/`（v8 coverage tmp） | `apps/web/coverage/summary/coverage-summary.json` / stdout `::notice::` or `::error::` / exit code 0 or 1 |
| `apps/web/playwright.config.ts` | playwright runtime | `${EVIDENCE_DIR}/monocart/index.html` / `apps/web/coverage/v8/*` / `apps/web/coverage/lcov.info` |
| `.github/workflows/e2e-tests.yml` | PR to `dev` | 3 種 artifact + check-run `e2e-tests-coverage-gate` |

---

## 6. 関数シグネチャ（CONST_005）

`scripts/coverage-gate-e2e.sh` は単一スクリプト構成のため明示関数は持たない。代わりに **環境変数契約**を以下とする:

| name | 型 | 既定 | 用途 |
|------|----|------|------|
| `THRESHOLD_FIXTURE` | string (path) | unset | fixture mode で `coverage-summary.json` の親ディレクトリを上書き（phase-4 単体テスト用） |
| `THRESHOLD` | int (内部定数) | `70` | しきい値。コード内で固定（quality-gates.md §7.5 正本） |
| `TEMP_DIR` | string (内部定数) | `apps/web/coverage/v8` | c8 が読む v8 coverage tmp |
| `REPORT_DIR` | string (内部定数) | `apps/web/coverage/summary` | c8 出力先 |

---

## 7. 依存追加コマンド（実行集約）

```bash
# 1. devDep 追加
mise exec -- pnpm --filter @ubm-hyogo/web add -D monocart-reporter@^2.9.0 c8@^10.1.0

# 2. lockfile を commit
git add apps/web/package.json pnpm-lock.yaml

# 3. reporter swap
$EDITOR apps/web/playwright.config.ts   # phase-5 §1.2 の差分を適用
git add apps/web/playwright.config.ts

# 4. coverage gate script
$EDITOR scripts/coverage-gate-e2e.sh    # phase-5 §3 の全文を投入
chmod +x scripts/coverage-gate-e2e.sh
git add scripts/coverage-gate-e2e.sh

# 5. workflow YAML 全面書換
$EDITOR .github/workflows/e2e-tests.yml # phase-5 §4 の全文を投入
git add .github/workflows/e2e-tests.yml
```

---

## 8. PR 分割方針（PR-B）

| PR | 含むファイル |
|----|-------------|
| PR-B（3b） | `.github/workflows/e2e-tests.yml` / `apps/web/playwright.config.ts` / `apps/web/package.json` (`monocart-reporter` + `c8`) / `scripts/coverage-gate-e2e.sh` / `pnpm-lock.yaml` |

> 3a (PR-A) と独立 PR。3c は本 PR merge 後に context 登録を観測してから実施（別 spec）。

---

## 9. ローカル実行コマンド（CONST_005）

| 用途 | コマンド |
|------|----------|
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| smoke 単独 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e --grep @critical-route` |
| 全件 + coverage | `mise exec -- pnpm --filter @ubm-hyogo/web e2e && bash scripts/coverage-gate-e2e.sh` |
| coverage gate fixture | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/pass bash scripts/coverage-gate-e2e.sh` |
| YAML lint | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` |
| shell lint | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` |

---

## 10. DoD（CONST_005）

| # | 条件 |
|---|------|
| D-01 | reporter 配列に monocart が末尾追加され、既存 3 件が維持されている |
| D-02 | `apps/web/package.json` devDep に `monocart-reporter@^2.9.0` / `c8@^10.1.0` が追加 |
| D-03 | `scripts/coverage-gate-e2e.sh` が phase-5 §3 全文と一致し、shellcheck violation 0 |
| D-04 | `.github/workflows/e2e-tests.yml` が phase-5 §4 全文と一致し、actionlint violation 0 |
| D-05 | `name: e2e-tests-coverage-gate` が job 名として完全一致 |
| D-06 | しきい値 70 のハードコードに quality-gates.md §7.5 の根拠 path コメントが付与されている |
| D-07 | `pnpm-lock.yaml` が `pnpm install --frozen-lockfile` で再現可能 |

---

## 11. 引き継ぎ（Phase 6 へ）

| 項目 | 内容 |
|------|------|
| 自己テスト対象 | phase-4 §1〜§5 のローカル run |
| CI minute 制約 | phase-6 で 1 PR あたりの実 run 時間目安を確定 |
| coverage flakiness | phase-6 で `apps/web/playwright/tests/critical/**` の retry 設定を確認 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 5
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3b の reporter swap / coverage gate script / workflow YAML / 依存追加 を確定差分として明示し、Phase 6 以降の検証を再現可能にする。

## 実行タスク

- 親 phase-5.md §2 / §4 / §5 PR-B から 3b 関連箇所を抽出。
- shellscript 全文・workflow YAML 全文を本 phase に明記。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-5.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / scripts / .github 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

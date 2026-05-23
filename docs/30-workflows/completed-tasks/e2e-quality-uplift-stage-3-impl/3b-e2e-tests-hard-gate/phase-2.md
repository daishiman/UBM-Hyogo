# Phase 2: 設計（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` |
| 出力 | reporter swap diff / coverage gate script 責務分解 / workflow YAML 構造 / artifact 設計 |

---

## 1. `apps/web/playwright.config.ts` reporter swap

### 1.1 既存（行 15-19）

```ts
reporter: [
  ['html', { outputFolder: `${EVIDENCE_DIR}/playwright-report/html`, open: 'never' }],
  ['json', { outputFile: `${EVIDENCE_DIR}/playwright-report/results.json` }],
  ['list'],
],
```

### 1.2 変更後（reporter 配列末尾に `monocart-reporter` を追加。既存 3 件は維持）

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

### 1.3 設計理由

| # | 理由 |
|---|------|
| D-01 | 既存 `html`/`json`/`list` は Stage 0/1 evidence 互換のため維持。破壊的変更なし。 |
| D-02 | `entryFilter` で `/_next/static/` のみ集計し、`page.goto` race で揺らぐ entry を排除（flaky F-01 対策）。 |
| D-03 | `sourceFilter` で `apps/web/src/` 限定。source map 解決誤差で他パスを巻き込まない（F-04 対策）。 |
| D-04 | `reports` に `v8` と `lcovonly` を併記。`v8` 形式は `c8 report` の入力、`lcovonly` は将来の codecov 連携余地。 |
| D-05 | `outputFile` を `${EVIDENCE_DIR}/monocart/index.html` に置き、既存 `EVIDENCE_DIR` 規約と整合（既存 evidence path 互換）。 |

---

## 2. `scripts/coverage-gate-e2e.sh` の責務分解

### 2.1 入出力（CONST_005）

| 項目 | 値 |
|------|----|
| 入力 | `apps/web/coverage/v8/`（monocart-reporter が生成する v8 coverage tmp） |
| 中間出力 | `apps/web/coverage/summary/coverage-summary.json` |
| 標準出力 | `::notice::line coverage <pct> >= 80` または `::error::line coverage <pct> < 80` |
| exit code | 80% 以上 = 0 / 未満 = 1 / 入力ファイル不在 = 1 |

### 2.2 処理ステップ（責務）

| # | 処理 | 採用理由 |
|---|------|---------|
| S-01 | `set -euo pipefail` | 失敗時即時終了。未定義変数捕捉。 |
| S-02 | `pnpm --filter @ubm-hyogo/web exec c8 report --reporter=json-summary --temp-directory=apps/web/coverage/v8 --report-dir=apps/web/coverage/summary` | v8 coverage を json-summary に変換 |
| S-03 | `summary=apps/web/coverage/summary/coverage-summary.json` | 既知の出力 path を変数化 |
| S-04 | `[ -f "$summary" ]` で存在確認、不在時 `::error::` で fail | gate の前提失敗を明示 |
| S-05 | `pct=$(jq -r '.total.lines.pct' "$summary")` | `jq` で line.pct のみ抽出 |
| S-06 | `awk "BEGIN { exit !($pct >= 80) }"` で閾値判定 | bash の浮動小数比較を `awk` に委譲 |
| S-07 | success 時 `::notice::line coverage $pct >= 80` | GitHub Actions UI に明示 |
| S-08 | fail 時 `::error::line coverage $pct < 80` + `exit 1` | job を fail にする |

### 2.3 しきい値の正本

`.claude/skills/task-specification-creator/references/quality-gates.md` §7.5（standard tier = line >= 80%）。スクリプト内ハードコード時は **コメントで根拠 path を併記**（phase-1 §8 参照）。

### 2.4 依存ツール

| ツール | 用途 | 提供元 |
|--------|------|-------|
| `pnpm` | workspace exec | mise / `.mise.toml` |
| `c8` | json-summary 変換 | `apps/web` devDependencies |
| `jq` | JSON 抽出 | ubuntu-latest 標準同梱 |
| `awk` | 浮動小数比較 | ubuntu-latest 標準同梱 |

---

## 3. `.github/workflows/e2e-tests.yml` 構造（major rewrite）

### 3.1 メタ section

| section | 値 |
|---------|----|
| `name` | `e2e-tests-coverage-gate` |
| `on` | `pull_request: { branches: [dev, main] }`（既存 `workflow_dispatch` も保持） |
| `concurrency.group` | `e2e-${{ github.ref }}` |
| `concurrency.cancel-in-progress` | `true` |

### 3.2 jobs.e2e

| section | 値 |
|---------|----|
| `name` | `e2e-tests-coverage-gate`（**branch protection context と完全一致**） |
| `runs-on` | `ubuntu-latest` |
| `timeout-minutes` | `30` |

### 3.3 step 列挙

| # | step | `if` | 補足 |
|---|------|------|------|
| 1 | `actions/checkout@v4` | — | — |
| 2 | `pnpm/action-setup@v4`（`version: 10.33.2`） | — | CLAUDE.md / `.mise.toml` 一致 |
| 3 | `actions/setup-node@v4`（`node-version: 24.15.0` / `cache: pnpm`） | — | mise 一致 |
| 4 | `run: pnpm install --frozen-lockfile` | — | — |
| 5 | `run: pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium firefox webkit` | — | full e2e の 3 browser project と一致 |
| 6 | `run: node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api.log 2>&1 &` | — | Server Component fetch 用 deterministic API |
| 7 | `run: pnpm --filter @ubm-hyogo/web e2e --grep @critical-route` | — | **fail-fast 先行 smoke**（AC-3b-3） |
| 8 | `run: pnpm --filter @ubm-hyogo/web e2e` | `if: success()` | 全件実行 |
| 9 | `run: bash scripts/coverage-gate-e2e.sh` | `if: success()` | 80% gate（AC-3b-2） |
| 10 | `actions/upload-artifact@v4`（coverage） | `if: always()` | AC-3b-4 |
| 11 | `actions/upload-artifact@v4`（monocart） | `if: always()` | AC-3b-6 補強 |
| 12 | `actions/upload-artifact@v4`（HTML report） | `if: failure()` | AC-3b-5 |

---

## 4. Server Component fetch 経路の CI 設計

Playwright の `page.route()` は Next Server Component の server-side `fetch()` を捕捉しない。Stage 3 3b の E2E hard gate は、Stage 1/2 で導入済みの server fetch 用 mock API / seed / `INTERNAL_API_BASE_URL` 差し替えを CI 環境変数として明示し、ブラウザ側 route mock だけに依存しない。

| # | 設計 | 期待 |
|---|------|------|
| SF-01 | `INTERNAL_API_BASE_URL` を CI の mock API endpoint に向ける | Server Component の `fetchAuthed()` が deterministic fixture を読む |
| SF-02 | `scripts/e2e-mock-api.mjs` を tracked fixture として起動する | untracked `.log` や手元状態を PASS 根拠にしない |
| SF-03 | `page.route()` は client-side network 補助に限定する | server fetch 経路の検証責務と混同しない |

---

## 5. artifact 設計（AC-04 / AC-3b-4..5）

| name | path | retention | condition |
|------|------|-----------|-----------|
| `e2e-coverage-${{ github.sha }}` | `apps/web/coverage/` | 14 日 | `if: always()` |
| `e2e-monocart-${{ github.sha }}` | `apps/web/playwright/evidence/monocart/`（CI は `PLAYWRIGHT_EVIDENCE_DIR=playwright/evidence`） | 7 日 | `if: always()` |
| `e2e-html-report-${{ github.sha }}` | `apps/web/playwright/evidence/playwright-report/html/`（CI は `PLAYWRIGHT_EVIDENCE_DIR=playwright/evidence`） | 7 日 | `if: failure()` |

> CI path は workflow job env `PLAYWRIGHT_EVIDENCE_DIR=playwright/evidence` で固定する。既存タスク別 evidence path は env 未指定時のみ維持する。

---

## 6. `apps/web/package.json` 編集

```diff
"devDependencies": {
+   "monocart-reporter": "^2.9.0",
+   "c8": "^10.1.0",
    ...
}
```

> `apps/web` workspace 配下に置く理由: Playwright と coverage 集計が同 workspace 内で完結し、`pnpm --filter @ubm-hyogo/web exec c8` で安定して呼び出せるため。

---

## 7. secret / token 要件

| 名前 | 用途 | scope | 設定先 |
|------|------|-------|--------|
| `GITHUB_TOKEN` | workflow 標準（auto） | repo | actions 自動付与 |
| 追加 secret | 不要 | — | — |

---

## 8. risk 分析（3b 固有）

| risk | 影響 | 緩和策 |
|------|------|--------|
| coverage flakiness（async path） | PR が散発的に 80% を割る | (a) `coverage-summary.json` を毎 run artifact 化 (b) 80% は **line のみ** (c) Stage 2 で flaky test quarantine 済前提 |
| reporter 追加で既存 evidence path 破損 | Stage 0/1 evidence 互換性喪失 | `html`/`json`/`list` は維持し monocart は **末尾追加** のみ |
| context 名タイポで gate が永久 pending | PR ブロック | workflow `name:` / job `name:` を context と完全一致。1 PR で実 run 観測してから 3c API 適用 |
| critical-route smoke の retry 過多で CI minute 圧迫 | 月次 budget 圧迫 | `apps/web/playwright.config.ts:retries` を `process.env.CI ? 2 : 0` に維持（Stage 2 設定） |
| monocart-reporter の v8 hook が source map 解決失敗 | coverage 0% で gate 誤 fail | `sourceFilter` で `apps/web/src/` 限定。source map 設定不備時は `entryFilter` 緩和で再現確認 |
| Server Component fetch が `page.route()` を迂回 | CI green でも server-side data path が未検証になる | mock API / seed / `INTERNAL_API_BASE_URL` 差し替えを Phase 4/11 evidence に固定 |

---

## 9. ローカル実行コマンド（CONST_005）

| 用途 | コマンド |
|------|----------|
| 依存追加 | `pnpm --filter @ubm-hyogo/web add -D monocart-reporter@^2.9.0 c8@^10.1.0` |
| Playwright install | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium firefox webkit` |
| smoke 単独 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e --grep @critical-route` |
| 全件 e2e | `mise exec -- pnpm --filter @ubm-hyogo/web e2e` |
| coverage gate（local） | `bash scripts/coverage-gate-e2e.sh` |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| lint | `mise exec -- pnpm lint` |
| actionlint | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` |
| shellcheck | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` |

---

## 10. DoD（Definition of Done — Phase 2 完了条件）

| # | 条件 |
|---|------|
| D-01 | reporter swap diff が「末尾追加のみ」で確定 |
| D-02 | `scripts/coverage-gate-e2e.sh` の責務 8 ステップが列挙され、しきい値正本 path が明示 |
| D-03 | workflow YAML 構造（meta + jobs + steps）が確定 |
| D-04 | artifact 3 種の name / path / retention / condition が確定 |
| D-05 | risk 6 件全てに緩和策が紐付く |
| D-06 | Server Component fetch 経路の mock API / seed / `INTERNAL_API_BASE_URL` 差し替えが設計に含まれる |

---

## 11. 引き継ぎ（Phase 3 へ）

| 項目 | 内容 |
|------|------|
| 設計レビュー観点 | solo policy 整合 / 既存 reporter 互換性 / 依存関係（3a / 3c との順序） |
| 4-condition gate 入力 | 本 phase §1〜§7 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 2
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented-local

## 目的

3b の reporter swap / coverage gate script / workflow YAML / artifact 設計を確定し、Phase 5 実装の入力として完備させる。

## 実行タスク

- 親 phase-2.md §2 を抽出し、本仕様書スコープに整合。
- 設計差分・処理ステップ・依存ツールを明示。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-2.md

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
- [x] coverage AC 適用: E2E tier-aware standard lines >=80%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

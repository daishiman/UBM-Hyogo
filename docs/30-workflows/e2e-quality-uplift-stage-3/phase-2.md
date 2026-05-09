# Phase 2: 設計（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` |
| 出力 | workflow file 構造 / reporter swap / lighthouserc / branch protection payload |

---

## 1. サブタスク 3a — Lighthouse CI

### 1.1 `.github/workflows/lighthouse.yml` 構造

| section | 値 |
|---------|----|
| `name` | `lighthouse-ci` |
| `on` | `pull_request: { branches: [dev] }` |
| `concurrency` | `group: lighthouse-${{ github.ref }}` / `cancel-in-progress: true` |
| `jobs.lighthouse.runs-on` | `ubuntu-latest` |
| `timeout-minutes` | `15` |
| step 順 | (1) checkout (2) pnpm setup (3) node 24.15.0 setup (4) `pnpm install --frozen-lockfile` (5) `pnpm --filter @ubm-hyogo/web build` (6) `pnpm --filter @ubm-hyogo/web start &`（background） (7) `wait-on http://localhost:3000` (8) `pnpm dlx @lhci/cli@0.14 autorun --config=./lighthouserc.json` (9) `actions/upload-artifact@v4`（`name: lhci-report-${{ github.sha }}` / `path: .lighthouseci/` / `retention-days: 7`） |

### 1.2 `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/members",
        "http://localhost:3000/profile",
        "http://localhost:3000/login"
      ],
      "numberOfRuns": 1,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance":   ["error", { "minScore": 0.80 }],
        "categories:accessibility": ["error", { "minScore": 0.90 }],
        "categories:best-practices":["error", { "minScore": 0.90 }],
        "categories:seo":           ["error", { "minScore": 0.80 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

> `/(public)/members` の URL は Next.js App Router の route group のため、ブラウザからは `/members` でアクセスする。

### 1.3 token / secret 要件

| 名前 | 用途 | 取得元 |
|------|------|--------|
| なし | filesystem upload なので不要 | — |
| `LHCI_GITHUB_APP_TOKEN`（**任意**） | GitHub Check 連携 | 採用しない（`assert` の job 失敗で十分） |

---

## 2. サブタスク 3b — `e2e-tests.yml` hard gate

### 2.1 reporter swap 戦略（`apps/web/playwright.config.ts:15-19`）

**変更前**:

```ts
reporter: [
  ['html', { outputFolder: `${EVIDENCE_DIR}/playwright-report/html`, open: 'never' }],
  ['json', { outputFile: `${EVIDENCE_DIR}/playwright-report/results.json` }],
  ['list'],
],
```

**変更後**:

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
      reports: [['v8', { outputDir: 'coverage/v8' }], ['lcovonly', { outputFile: 'coverage/lcov.info' }]],
    },
  }],
],
```

> 既存 `html`/`json`/`list` は Stage 0/1 evidence 互換のため維持。`monocart-reporter` を **追加** する形を取る（破壊的変更なし）。

### 2.2 c8 setup 戦略

| 項目 | 値 |
|------|----|
| 計測方式 | Playwright `monocart-reporter` の v8 coverage hook（`page.coverage.startJSCoverage()` 内蔵）→ lcov 出力 |
| c8 単独運用 | 採用しない（Playwright と二重計測になるため） |
| しきい値判定 | `c8 check-coverage --lines 70 --reporter text` を `monocart-reporter` 出力 lcov に対して実行 |
| script | `scripts/coverage-gate-e2e.sh` |

`scripts/coverage-gate-e2e.sh` の責務:

1. `pnpm --filter @ubm-hyogo/web exec c8 report --reporter=json-summary --temp-directory=apps/web/coverage/v8 --report-dir=apps/web/coverage/summary`
2. `coverage-summary.json` の `total.lines.pct` を読み、< 70 で `exit 1`
3. しきい値値は `.claude/skills/task-specification-creator/references/quality-gates.md §7.5` を参照（standard tier = 70）

### 2.3 `.github/workflows/e2e-tests.yml` 構造（major rewrite）

| section | 値 |
|---------|----|
| `name` | `e2e-tests` |
| `on` | `pull_request: { branches: [dev] }`（既存 `workflow_dispatch` も保持） |
| `concurrency` | `group: e2e-${{ github.ref }}` / `cancel-in-progress: true` |
| `jobs.e2e.runs-on` | `ubuntu-latest` |
| `timeout-minutes` | `30` |
| `jobs.e2e.name` | `e2e-tests-coverage-gate`（branch protection context と一致） |
| step 順 | (1) checkout (2) pnpm/setup-node (3) install (4) playwright install (5) `pnpm --filter @ubm-hyogo/web e2e --grep @critical-route`（critical 先行 fail-fast） (6) `pnpm --filter @ubm-hyogo/web e2e`（全件） (7) `bash scripts/coverage-gate-e2e.sh` (8) upload coverage artifact `if: always()` (9) upload html report artifact `if: failure()` |

### 2.4 artifact 設計

| name | path | retention | condition |
|------|------|-----------|-----------|
| `e2e-coverage-${{ github.sha }}` | `apps/web/coverage/` | 14 日 | `if: always()` |
| `e2e-html-report-${{ github.sha }}` | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence/playwright-report/html/` | 7 日 | `if: failure()` |
| `e2e-monocart-${{ github.sha }}` | `.../evidence/monocart/` | 7 日 | `if: always()` |

---

## 3. サブタスク 3c — Branch protection payload

### 3.1 現状（2026-05-08 取得）

```text
dev: contexts = ["ci","Validate Build","coverage-gate"]
     required_pull_request_reviews = null
     lock_branch = false
     enforce_admins = false  # CLAUDE.md 期待値=true と drift（Stage 3 スコープ外）
     required_linear_history = false
     required_conversation_resolution = true
     allow_force_pushes = false
     allow_deletions = false
```

### 3.2 適用コマンド（`dev`）

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": false,
    "contexts": [
      "ci",
      "Validate Build",
      "coverage-gate",
      "lighthouse-ci",
      "e2e-tests-coverage-gate"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON
```

### 3.3 `main` への適用

`dev` と同一 payload を `repos/daishiman/UBM-Hyogo/branches/main/protection` に PUT する。`main` 固有の追加保護が現存する場合は事前に `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で取得し、payload に統合する（Phase 5 で実測してから決定）。

### 3.4 検証コマンド（適用後）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  | jq '.required_status_checks.contexts, .required_pull_request_reviews, .lock_branch, .enforce_admins'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts, .required_pull_request_reviews, .lock_branch, .enforce_admins'
```

期待値:

| key | dev | main |
|-----|-----|------|
| `required_status_checks.contexts` | 5 件全て含有 | 5 件全て含有 |
| `required_pull_request_reviews` | `null` | `null` |
| `lock_branch.enabled` | `false` | `false` |
| `enforce_admins.enabled` | `false`（既存維持） | `false`（既存維持） |

---

## 4. secret / token 要件

| 名前 | 用途 | scope | 設定先 |
|------|------|-------|--------|
| `GITHUB_TOKEN` | workflow 標準 | repo | actions 自動付与 |
| `LHCI_GITHUB_APP_TOKEN` | （任意・採用しない） | — | — |
| 追加 secret | 不要 | — | — |

> `gh api` での branch protection 更新は **ローカル実行**（PAT が必要）。CI 内で自動化する場合は `repo` スコープ PAT を `BRANCH_PROTECTION_TOKEN` として GitHub Secret に格納する設計余地があるが、Stage 3 では**手動実行**に閉じる（solo dev / レアイベント）。

---

## 5. risk 分析

| risk | 影響 | 緩和策 |
|------|------|--------|
| CI minute budget 超過 | 月次 GitHub Actions 無料枠の圧迫 | (a) `concurrency.cancel-in-progress=true` で同 PR の旧 run をキャンセル (b) Lighthouse `numberOfRuns: 1`（3→1） (c) e2e job の workers=2 維持 |
| coverage flakiness（特に async path） | PR が散発的に 70% を割る | (a) `coverage-summary.json` を毎 run artifact 化し回帰調査可能に (b) 70% は **line のみ**（branch/function は対象外） (c) Stage 2 で flaky test を quarantine 済み前提 |
| Lighthouse perf スコアの環境依存ぶれ | localhost run でも CI ランナー負荷で perf 80 を割る | (a) `preset: desktop` 固定 (b) `pnpm start`（production build）で計測 (c) しきい値割れ頻発時は Phase 11 で perf>=75 へ緩和提案 |
| `/profile` 未認証 redirect で a11y 計測が `/login` に偏る | a11y スコア重複 | (a) `/profile` を skip-on-redirect 設定 (b) 必要なら lighthouserc から外し 3 routes に縮退 |
| reporter 追加で既存 evidence path 破損 | Stage 0/1 evidence 互換性喪失 | (a) `html`/`json`/`list` は維持し monocart は **追加** のみ (b) `EVIDENCE_DIR` 配下にサブディレクトリで隔離 |
| branch protection 更新ミスで `required_pull_request_reviews` が `{}`（empty object）になり solo policy 崩壊 | merge ブロック | (a) payload で必ず `null` を明示 (b) 適用後 `jq` 検証を必須化 (c) drift 検知時は即時 rollback |
| context 名のタイポで gate が永久に pending | PR がブロックされて進行不能 | (a) workflow `name:` / job `name:` を context と完全一致 (b) 1 PR で実 run を観測してから API 適用 |

---

## 6. dependency / 完了順序

```
Stage 2 done
   ↓
3a Lighthouse CI 導入（PR-A：merge to dev）
   ↓
3b e2e-tests hard gate 化（PR-B：merge to dev）
   ↓ 両方の context が GitHub に登録済みであることを 1 PR で観測
3c branch protection 更新（gh api PUT を dev → main の順）
```

3a / 3b は独立 PR とし、context が GitHub に登録された後に 3c を実行する（context 未登録のまま required にすると PR が永久 pending になるため）。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 2
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 3 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

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
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。


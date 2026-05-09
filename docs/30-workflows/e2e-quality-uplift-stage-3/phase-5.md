# Phase 5: 実装（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` |
| 出力 | 新規/編集ファイル一覧 / `gh api` payload / 依存追加コマンド |
| implementation_mode | 3a=`new` / 3b=`new`（既存 file 全面書換） / 3c=`verify_existing` |

---

## 0. 実装サマリ

| ID | mode | 影響ファイル | コミット粒度 |
|----|------|--------------|-------------|
| 3a | `new` | `lighthouserc.json` / `.github/workflows/lighthouse.yml` / `apps/web/package.json` / `pnpm-lock.yaml` | 1 PR（PR-A） |
| 3b | `new`（major edit） | `.github/workflows/e2e-tests.yml` / `apps/web/playwright.config.ts` / `apps/web/package.json` / `scripts/coverage-gate-e2e.sh` / `pnpm-lock.yaml` | 1 PR（PR-B） |
| 3c | `verify_existing` | （リポジトリ内ファイル変更なし） | 手動 `gh api` 実行 |

---

## 1. サブタスク 3a — Lighthouse CI 実装

### 1.1 新規ファイル: `lighthouserc.json`（プロジェクトルート）

phase-2.md §1.2 の JSON をそのまま採用。Q-03 で `/profile` 縮退判定が出た場合は `ci.collect.url` 配列から該当行のみ削除する（他フィールド変更なし）。

### 1.2 新規ファイル: `.github/workflows/lighthouse.yml`

| section | 値 |
|---------|----|
| `name` | `lighthouse-ci`（**branch protection context と完全一致**） |
| `on` | `pull_request: { branches: [dev] }` |
| `concurrency.group` | `lighthouse-${{ github.ref }}` |
| `concurrency.cancel-in-progress` | `true` |
| `jobs.lighthouse.name` | `lighthouse-ci` |
| `jobs.lighthouse.runs-on` | `ubuntu-latest` |
| `jobs.lighthouse.timeout-minutes` | `15` |

step 列挙:

| # | uses / run | 補足 |
|---|------------|------|
| 1 | `actions/checkout@v4` | — |
| 2 | `pnpm/action-setup@v4` (`version: 10.33.2`) | CLAUDE.md と一致 |
| 3 | `actions/setup-node@v4` (`node-version: 24.15.0` / `cache: pnpm`) | mise と一致 |
| 4 | `run: pnpm install --frozen-lockfile` | — |
| 5 | `run: pnpm --filter @ubm-hyogo/web build` | production build |
| 6 | `run: pnpm --filter @ubm-hyogo/web start &` 後 `npx wait-on http://localhost:3000 --timeout 60000` | — |
| 7 | `run: pnpm dlx @lhci/cli@0.14 autorun --config=./lighthouserc.json` | assertion 実行 |
| 8 | `actions/upload-artifact@v4`（`if: always()` / `name: lhci-report-${{ github.sha }}` / `path: .lighthouseci/` / `retention-days: 7`） | — |

### 1.3 `apps/web/package.json` 編集

```diff
"devDependencies": {
+   "@lhci/cli": "^0.14.0",
    ...
}
```

> ルートに置かず `apps/web` 配下とする理由: build/start 操作と同じ workspace 内で完結させるため。`pnpm dlx` 経由でも動くが lockfile ピン化のため devDep に追加する。

### 1.4 secret/token

不要（filesystem upload のみ・`LHCI_GITHUB_APP_TOKEN` 不採用）。

---

## 2. サブタスク 3b — `e2e-tests.yml` hard gate 実装

### 2.1 編集: `apps/web/playwright.config.ts`（reporter swap）

phase-2.md §2.1 の差分を `apps/web/playwright.config.ts:15-19` に適用。**既存 reporter は維持** し、配列末尾に `monocart-reporter` を追加するのみ。

### 2.2 編集: `apps/web/package.json`

```diff
"devDependencies": {
+   "monocart-reporter": "^2.9.0",
+   "c8": "^10.1.0",
    ...
}
```

### 2.3 新規ファイル: `scripts/coverage-gate-e2e.sh`

責務（phase-2.md §2.2 と整合）:

| # | 処理 |
|---|------|
| 1 | `set -euo pipefail` |
| 2 | `pnpm --filter @ubm-hyogo/web exec c8 report --reporter=json-summary --temp-directory=apps/web/coverage/v8 --report-dir=apps/web/coverage/summary` |
| 3 | `summary=apps/web/coverage/summary/coverage-summary.json` |
| 4 | `[ -f "$summary" ] \|\| { echo "::error::coverage-summary.json not found"; exit 1; }` |
| 5 | `pct=$(jq -r '.total.lines.pct' "$summary")` |
| 6 | `awk "BEGIN { exit !($pct >= 70) }"` で fail 時 `::error::line coverage $pct < 70` |
| 7 | success 時 `::notice::line coverage $pct >= 70` |

> しきい値 70 は `.claude/skills/task-specification-creator/references/quality-gates.md §7.5`（standard tier）を正本参照。スクリプト内ハードコードは const コメントで根拠 path を併記する。

### 2.4 編集: `.github/workflows/e2e-tests.yml`（major rewrite）

| section | 値 |
|---------|----|
| `name` | `e2e-tests` |
| `on` | `pull_request: { branches: [dev] }` + 既存 `workflow_dispatch` |
| `concurrency.group` | `e2e-${{ github.ref }}` / `cancel-in-progress: true` |
| `jobs.e2e.name` | `e2e-tests-coverage-gate`（**branch protection context と完全一致**） |
| `jobs.e2e.runs-on` | `ubuntu-latest` |
| `jobs.e2e.timeout-minutes` | `30` |

step 列挙:

| # | 内容 | `if` |
|---|------|------|
| 1 | checkout / pnpm setup / node setup / `pnpm install --frozen-lockfile` | — |
| 2 | `pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium` | — |
| 3 | `pnpm --filter @ubm-hyogo/web e2e --grep @critical-route`（fail-fast 先行 smoke） | — |
| 4 | `pnpm --filter @ubm-hyogo/web e2e`（全件） | `if: success()` |
| 5 | `bash scripts/coverage-gate-e2e.sh` | `if: success()` |
| 6 | upload `e2e-coverage-${{ github.sha }}`（path `apps/web/coverage/`、retention 14） | `if: always()` |
| 7 | upload `e2e-monocart-${{ github.sha }}`（path `.../evidence/monocart/`、retention 7） | `if: always()` |
| 8 | upload `e2e-html-report-${{ github.sha }}`（path `.../evidence/playwright-report/html/`、retention 7） | `if: failure()` |

### 2.5 secret/token

`GITHUB_TOKEN`（auto） のみ。追加 secret なし。

---

## 3. サブタスク 3c — Branch protection 適用（手動 `gh api`）

### 3.1 順序厳守

```
3a PR-A merge to dev → 3a workflow 1 run 成功（context 登録）
3b PR-B merge to dev → 3b workflow 1 run 成功（context 登録）
   ↓ T-3c-3 / T-3c-4 で context 登録確認
3c gh api PUT（dev → main）
```

### 3.2 適用 payload — `dev`

phase-2.md §3.2 の payload をそのまま使用。

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]
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

### 3.3 適用 payload — `main`

事前に `gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-pre.json` を取得し、`required_status_checks.contexts` のみ 5 件に置換した payload を PUT する。`enforce_admins` / `required_pull_request_reviews` / `lock_branch` / `required_linear_history` は **取得値をそのまま再 PUT**（現状維持）。

### 3.4 evidence 保存

| 保存先 | 内容 |
|--------|------|
| `outputs/phase-11/branch-protection-dev-pre.json` | 適用前 snapshot（dev） |
| `outputs/phase-11/branch-protection-dev-post.json` | 適用後（dev） |
| `outputs/phase-11/branch-protection-main-pre.json` | 適用前 snapshot（main） |
| `outputs/phase-11/branch-protection-main-post.json` | 適用後（main） |
| `outputs/phase-11/branch-protection-evidence.md` | `jq` 検証ログ集約 |

---

## 4. 依存追加コマンド（実行集約）

```bash
# 3a
pnpm --filter @ubm-hyogo/web add -D @lhci/cli@^0.14.0
# 3b
pnpm --filter @ubm-hyogo/web add -D monocart-reporter@^2.9.0 c8@^10.1.0
# lockfile を commit
git add apps/web/package.json pnpm-lock.yaml
```

---

## 5. PR 分割方針

| PR | 含むファイル |
|----|-------------|
| PR-A（3a） | `lighthouserc.json` / `.github/workflows/lighthouse.yml` / `apps/web/package.json` (`@lhci/cli`) / `pnpm-lock.yaml` |
| PR-B（3b） | `.github/workflows/e2e-tests.yml` / `apps/web/playwright.config.ts` / `apps/web/package.json` (`monocart-reporter` + `c8`) / `scripts/coverage-gate-e2e.sh` / `pnpm-lock.yaml` |
| 3c | PR なし（手動 `gh api` 実行 + evidence commit のみ） |

> Phase 13 の最終 PR には 3a + 3b + 3c evidence + spec 群を統合した PR を作る（branch `feat/e2e-quality-uplift`）。Stage 3 内では PR-A / PR-B を独立 merge してから最終 PR に統合する形を取る。

---

## 6. 引き継ぎ（Phase 6 へ）

| 項目 | 内容 |
|------|------|
| 自己テスト対象 | phase-4 §1.2 / §2.2 のローカル run |
| CI minute 制約 | phase-6 で 1 PR あたりの実 run 時間目安を確定 |
| coverage flakiness | phase-6 で `apps/web/playwright/tests/critical/**` の retry 設定を確認 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 5
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


# Phase 2 — 設計

`[実装区分: 実装仕様書]`

## 1. 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│ scripts/measure-coverage-exclude-ratio.ts                    │
│  - vitest.config.ts から coverage.exclude を AST 抽出 (or    │
│    require の text parse)                                    │
│  - apps/web/app 配下の .ts/.tsx を node:fs recursive scan       │
│  - *.spec.* / *.test.* は production-like denominator から除外 │
│  - excluded / total / ratio を計算                           │
│  - 出力: JSON (stdout) + markdown (--out)                    │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ .github/workflows/verify-coverage-exclude-ratio.yml          │
│  - pull_request で実行 (paths: vitest.config.ts / apps/web/app/** /
│    package.json / measurement script + tests)               │
│  - 30% 超過時に PR コメント (soft warn, exit 0)              │
│  - artifact: coverage-exclude-ratio.json                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ docs/30-workflows/runbooks/                                  │
│  - e2e-coverage-fallback-metric.md (代替指標)                │
│  - playwright-smoke-19-route-sla.md (SLA 文書)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ vitest.config.ts (exclude 縮小)                              │
│  - loading.tsx / not-found.tsx を exclude から削除             │
│  - 既存 error.component.spec.tsx で回帰確認                   │
└─────────────────────────────────────────────────────────────┘
```

## 2. ファイル別設計

### 2.1 `scripts/measure-coverage-exclude-ratio.ts` (新規)

#### シグネチャ

```typescript
// 主要関数
export interface ExcludeRatioResult {
  measured_at: string; // ISO8601
  vitest_config_path: string;
  target_root: string; // "apps/web/app"
  total_files: number;
  excluded_files: string[];
  excluded_count: number;
  ratio: number; // 0.0 - 1.0
  threshold: number; // 0.30
  status: 'ok' | 'warn';
}

export async function measureCoverageExcludeRatio(opts: {
  vitestConfigPath: string;
  targetGlob: string;
  threshold?: number;
}): Promise<ExcludeRatioResult>;

// CLI entrypoint
// pnpm tsx scripts/measure-coverage-exclude-ratio.ts \
//   --vitest-config vitest.config.ts \
//   --target "apps/web/app/**/*.tsx" \
//   --threshold 0.30 \
//   --out outputs/coverage-exclude-ratio.json
```

#### ロジック

1. `vitest.config.ts` を text parse して `coverage.exclude: [...]` 配列を抽出 (regex で十分: `/coverage:\s*\{[\s\S]*?exclude:\s*\[([\s\S]*?)\]/`)
2. `node:fs recursive scan` で `targetGlob` にマッチする実ファイル一覧取得 (リポジトリ root から)
3. 各ファイルに対し exclude pattern を `local glob matcher` でマッチ
4. `excluded_count / total_files` を `ratio` に
5. `threshold` 超過時 `status: 'warn'`、それ以下 `ok`
6. JSON を stdout (or `--out` で書き出し)、markdown サマリも生成

#### 副作用

- ファイルシステム読み取りのみ。書き込みは `--out` 指定時のみ。

### 2.2 `.github/workflows/verify-coverage-exclude-ratio.yml` (新規)

```yaml
name: verify-coverage-exclude-ratio
on:
  pull_request:
    branches: [dev, main]
    paths:
      - 'vitest.config.ts'
      - 'apps/web/app/**'
      - 'scripts/measure-coverage-exclude-ratio.ts'
      - '.github/workflows/verify-coverage-exclude-ratio.yml'
jobs:
  measure:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - id: measure
        run: |
          mise exec -- pnpm tsx scripts/measure-coverage-exclude-ratio.ts \
            --out coverage-exclude-ratio.json
          echo "ratio=$(jq -r .ratio coverage-exclude-ratio.json)" >> $GITHUB_OUTPUT
          echo "status=$(jq -r .status coverage-exclude-ratio.json)" >> $GITHUB_OUTPUT
      - if: steps.measure.outputs.status == 'warn'
        uses: actions/github-script@v7
        with:
          script: |
            const ratio = parseFloat('${{ steps.measure.outputs.ratio }}');
            const pct = (ratio * 100).toFixed(1);
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `⚠️ \`apps/web/app/**\` の coverage.exclude 比率が ${pct}% (>= 30%) です。代替指標 runbook (docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md) を確認してください。`
            });
      - uses: actions/upload-artifact@v4
        with: { name: coverage-exclude-ratio, path: coverage-exclude-ratio.json }
```

initial release では required check 登録なし (soft warn のみ)。

### 2.3 `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` (新規)

内容:
- 30% 超過時に参照する補完指標
  - smoke pass rate (`playwright-smoke / smoke (chromium)` の最新 30 日 success rate >= 95%)
  - 19-route hit (全 17 routes の HTTP < 400)
  - a11y serious/critical violations = 0
  - staging smoke green
- どの数値を満たせば「実体カバレッジ確保」とみなすか
- 30% を下げるための short / long term action 表

### 2.4 `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` (新規)

内容:
- 17 routes 一覧 (auth 別)、慣用名 "19-route smoke" との対応
- SLA: 全 routes pass = required check
- 新規 route 追加手順
- 失敗時の triage flow
- staging smoke との分担

### 2.5 `vitest.config.ts` 変更

```diff
       exclude: [
         "**/*.spec.{ts,tsx}",
         "**/node_modules/**",
         "**/.next/**",
         "**/.open-next/**",
         "**/.wrangler/**",
         "apps/web/app/**/page.tsx",
         "apps/web/app/**/layout.tsx",
-        "apps/web/app/**/loading.tsx",
         "apps/web/app/**/error.tsx",
-        "apps/web/app/**/not-found.tsx",
         "apps/web/next.config.*",
         ...
```

(error.tsx は Phase 3 レビューで再判定。getEnv throw 統合経路があるため scope out 可能性あり)

### 2.6 unit test 追加

- `scripts/__tests__/measure-coverage-exclude-ratio.spec.ts`
- 既存 `apps/web/app/__tests__/error.component.spec.tsx` の `Loading` / `NotFound` regression を継続利用

## 3. 設計判断

| 論点 | 決定 | 根拠 |
|------|------|------|
| exclude parse 方法 | regex (text parse) | vitest.config.ts は 100 行未満で AST 不要、簡素優先 |
| threshold | 0.30 (issue #256 AC3 と一致) | issue 本文 "30% 以下" を canonical に |
| gate 種別 | soft warn (PR comment) | initial release は noise 抑止、後続タスクで required 化検討 |
| error.tsx 解除 | Phase 3 で再判定 | getEnv throw boundary 兼任、unit test 困難の可能性 |

## 4. 出力

- [outputs/phase-2/design-decisions.md](outputs/phase-2/design-decisions.md)

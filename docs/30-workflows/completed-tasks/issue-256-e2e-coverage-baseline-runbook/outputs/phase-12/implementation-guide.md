# Implementation Guide

## Part 1: 中学生レベル

なぜこの仕組みが必要かというと、テストの点数だけを見ても「どこを見ていなかったか」が分からず、本当は危ない場所に気づかないまま安心してしまうからです。これは、学校のテストで「出題されなかった範囲」が多いのに、出た問題だけで高得点に見える状態に似ています。

今回の変更は、見ていない範囲を数えて、30% を超えたら注意を出す仕組みです。注意が出てもすぐ失敗にはせず、別の確認表を見て、実際に大事な画面が守られているかを判断します。

専門用語の言い換え:

| 用語 | 言い換え |
| --- | --- |
| coverage | テストで確認できた範囲 |
| exclude | 数えない範囲 |
| runbook | 困った時に見る手順書 |
| soft warn | 失敗にはしない注意 |
| smoke test | まず大事な場所だけを短く見る確認 |

## Part 2: 技術者レベル

Implemented files:

| Path | Role |
| --- | --- |
| `scripts/measure-coverage-exclude-ratio.ts` | `vitest.config.ts` の `coverage.exclude` と `apps/web/app` 配下の `.ts/.tsx` を照合し、ratio JSON / markdown を出力 |
| `scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | parser / ratio / empty target / markdown の unit test |
| `.github/workflows/verify-coverage-exclude-ratio.yml` | PR 時に ratio を測定し、30% 以上なら重複抑止付きコメントを更新 |
| `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` | ratio warn 時の代替指標 |
| `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` | 慣用名 19-route smoke / 実体 17 route entries の SLA |
| `vitest.config.ts` | coverage include/exclude を現行 `apps/web/app` topology に同期 |

The script intentionally uses `node:fs` recursion and a local glob matcher to avoid adding direct dependencies for `fast-glob` or `picomatch`.

### Type definitions

```ts
export interface ExcludeRatioResult {
  measured_at: string;          // ISO 8601 UTC
  vitest_config_path: string;
  target_root: string;
  target_extensions: string[];  // 例: [".ts", ".tsx"]
  total_files: number;          // test spec を除外した分母
  excluded_files: string[];     // sort 済み相対 path
  excluded_count: number;
  ratio: number;                // 0..1
  threshold: number;            // 既定 0.3
  status: "ok" | "warn";        // ratio >= threshold で warn
}

interface MeasureOptions {
  vitestConfigPath: string;
  targetRoot: string;
  targetExtensions?: string[];  // 既定 [".ts", ".tsx"]
  threshold?: number;           // 既定 0.3
}
```

### API シグネチャと使用例

```ts
export function extractCoverageExcludePatterns(vitestConfigText: string): string[];
export function measureCoverageExcludeRatio(opts: MeasureOptions): Promise<ExcludeRatioResult>;
export function toMarkdown(result: ExcludeRatioResult): string;

// 使用例
import { measureCoverageExcludeRatio, toMarkdown } from "./scripts/measure-coverage-exclude-ratio";

const result = await measureCoverageExcludeRatio({
  vitestConfigPath: "vitest.config.ts",
  targetRoot: "apps/web/app",
  threshold: 0.3,
});
// result.status === "warn" の場合は fallback runbook を参照
process.stdout.write(toMarkdown(result));
```

CLI 起動:

```bash
mise exec -- pnpm tsx scripts/measure-coverage-exclude-ratio.ts \
  --vitest-config vitest.config.ts \
  --target-root apps/web/app \
  --threshold 0.30 \
  --out artifacts/coverage-exclude-ratio.md
```

### 設定

| 設定項目 | 既定値 | 役割 |
| --- | --- | --- |
| `--vitest-config` | `vitest.config.ts` | `coverage.exclude` パターンを抽出する設定ファイル |
| `--target-root` | `apps/web/app` | production-like source root（test spec は分母から除外） |
| `--threshold` | `0.30` | warn 判定境界。`ratio >= threshold` で `status = "warn"` |
| `--out` | なし | 出力 path。`.md` 拡張子で markdown / それ以外は JSON |

### エッジケース

- **empty target**: `target_root` 配下に対象拡張子のファイルが 0 件の場合、`ratio = 0` / `status = "ok"` を返す（ゼロ除算回避）。
- **target_root が directory でない**: `throw new Error("target root is not a directory: ...")` を送出。CI gate では non-zero exit となる。
- **test spec の二重カウント**: `.spec.ts(x)` / `.test.ts(x)` は `isTestLikeFile` で分母から除外。これにより exclude ratio が test ファイル数に引っ張られず、production source の真の見落とし率を反映する。
- **glob `**/` 解釈**: `**/` は `(?:.*/)?` に展開し、ディレクトリ深度に依存せずマッチさせる。
- **CI 重複コメント抑止**: `.github/workflows/verify-coverage-exclude-ratio.yml` は `<!-- coverage-exclude-ratio -->` マーカー付きコメントを upsert する。

### エラーハンドリング

- script 例外は CLI で `console.error` + `process.exit(1)`。CI workflow 側は exit code を見て status check を fail させる。
- `status === "warn"` は **soft warn**（CI を即 fail させない）。代わりに `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` の手順で fallback metric を解釈し、Playwright smoke 19-route SLA で実質保護を担保する。

### Baseline

Current baseline: `37 / 80 = 46.3%` after excluding test spec files from the denominator, so status is `warn`; the fallback runbook is the required interpretation path.

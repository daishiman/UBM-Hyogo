# Phase 7: カバレッジ判定（threshold 80% を fetcher / analyzer に限定適用）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Phase 6 で取得した coverage を threshold と突合し GO / NO-GO を判定する。**判定対象は `scripts/cf-audit-log/**` のみ**で、apps/api / apps/web の既存 coverage gate には一切影響させない。

## スコープ境界（重要）

| 区分 | 対象 | 判定対象? |
| --- | --- | --- |
| 本タスク | `scripts/cf-audit-log/**.ts`（fetcher / analyzer / classifier / reporter / baseline / d1-client） | YES |
| 本タスク | `scripts/cf-audit-log/__tests__/**` | NO（除外） |
| 本タスク | `scripts/cf-audit-log/__fixtures__/**` | NO（除外） |
| 既存 | `apps/api/**`, `apps/web/**`, `packages/**` | NO（既存 gate を継続、本タスクで触らない） |
| 既存 | `scripts/cf.sh` | NO（bash のため vitest 対象外） |
| 既存 | `.github/workflows/*.yml` | NO（yml は coverage 対象外） |

## threshold matrix

| ファイル / 集合 | lines | branches | functions | statements |
| --- | --- | --- | --- | --- |
| `scripts/cf-audit-log/severity-classifier.ts` | ≥ 95% | ≥ 95% | 100% | ≥ 95% |
| `scripts/cf-audit-log/cloudflare-client.ts` | ≥ 80% | ≥ 75% | ≥ 80% | ≥ 80% |
| `scripts/cf-audit-log/issue-reporter.ts` | ≥ 80% | ≥ 75% | ≥ 80% | ≥ 80% |
| `scripts/cf-audit-log/fetch.ts` | ≥ 80% | ≥ 70% | ≥ 80% | ≥ 80% |
| `scripts/cf-audit-log/analyze.ts` | ≥ 80% | ≥ 70% | ≥ 80% | ≥ 80% |
| `scripts/cf-audit-log/baseline.ts` | ≥ 80% | ≥ 70% | ≥ 80% | ≥ 80% |
| `scripts/cf-audit-log/d1-client.ts` | ≥ 80% | ≥ 70% | ≥ 80% | ≥ 80% |
| `scripts/cf-audit-log/types.ts` | 適用外（型のみ） | - | - | - |
| **集合 total** | **≥ 85%** | **≥ 78%** | **≥ 85%** | **≥ 85%** |

## vitest config

**変更対象**: `vitest.config.ts`（既存）に **本タスク専用の test project** として追加するか、`scripts/cf-audit-log/vitest.config.ts` を新設する。

### 案: scripts/cf-audit-log/vitest.config.ts（新設）

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['scripts/cf-audit-log/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/cf-audit-log',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      include: ['scripts/cf-audit-log/**/*.ts'],
      exclude: [
        'scripts/cf-audit-log/__tests__/**',
        'scripts/cf-audit-log/__fixtures__/**',
        'scripts/cf-audit-log/types.ts',
      ],
      thresholds: {
        lines: 85,
        branches: 78,
        functions: 85,
        statements: 85,
        // ファイル別上書き（v8 + vitest >=1.0）
        'scripts/cf-audit-log/severity-classifier.ts': {
          lines: 95, branches: 95, functions: 100, statements: 95,
        },
      },
    },
  },
});
```

### 実行コマンド

```bash
mise exec -- pnpm vitest run \
  --config scripts/cf-audit-log/vitest.config.ts \
  --coverage \
  | tee outputs/phase-7/vitest-coverage.log
```

## GO / NO-GO 判定フロー

```
[vitest run --coverage]
        ↓
   threshold 全件 PASS?
   ├── YES → GO（Phase 8 統合テストへ）
   └── NO  → 不足ファイル一覧 + 不足 % を judgment-result.md に記載
              ↓
         追加テスト戻り作業（Phase 6 へ戻る）
```

### 不足時の対応マトリクス

| 不足モジュール | 追加すべきテスト |
| --- | --- |
| severity-classifier branch < 95% | 境界値（業務時間 09:00/22:00）/ rotation 期間境界 / IP CIDR エッジ |
| cloudflare-client branch < 75% | 401 / 5xx / 空 result / 多 page |
| issue-reporter branch < 75% | dryRun true/false × deduped true/false の 4 象限 |
| fetch.ts < 80% | 引数 parse 失敗 / D1 insert 失敗の error path |
| analyze.ts < 80% | baseline=null path / rotation window path / fixture mode |
| baseline.ts < 80% | events=0 / 全 outlier / 業務時間 0% |
| d1-client.ts < 80% | INSERT OR IGNORE / purge boundary / dedupe table |

## judgment-result.md テンプレート

```markdown
# Phase 7 判定結果

| 集合 | lines | branches | functions | statements | 判定 |
| --- | --- | --- | --- | --- | --- |
| total      | __% | __% | __% | __% | __ |
| classifier | __% | __% | __% | __% | __ |
| client     | __% | __% | __% | __% | __ |
| reporter   | __% | __% | __% | __% | __ |
| fetch      | __% | __% | __% | __% | __ |
| analyze    | __% | __% | __% | __% | __ |
| baseline   | __% | __% | __% | __% | __ |
| d1-client  | __% | __% | __% | __% | __ |

最終判定: **GO** / **NO-GO**
不足ファイル:
- (なし / list)

次のアクション:
- GO 時: Phase 8 統合テストへ
- NO-GO 時: 上記不足ファイルにテスト追加して Phase 6 再実行
```

## 既存 coverage gate との分離保証

- 既存 `coverage-gate` job（Issue #475 由来）は `apps/**` / `packages/**` のみを対象としており、`scripts/cf-audit-log/**` を include しない。本 Phase の vitest config は **独立 config ファイル** で動かすため、既存 gate の閾値計算には混入しない。
- CI 上では本タスクの coverage を required status check に**昇格させない**（MVP）。ローカル + PR レビュー時の参考値扱い。将来昇格する場合は `.github/workflows/cf-audit-log-coverage.yml` を別途作成。

## 成果物

- `outputs/phase-7/phase-7.md`（本ファイル）
- `outputs/phase-7/coverage-gate-config.md`（vitest config 抜粋 + threshold matrix 確定版）
- `outputs/phase-7/vitest-coverage.log`（実行ログ）
- `outputs/phase-7/judgment-result.md`（GO/NO-GO 判定）
- `coverage/cf-audit-log/coverage-summary.json`（数値根拠）

## DoD（完了条件）

- [ ] `scripts/cf-audit-log/vitest.config.ts` が存在し独立で実行可能
- [ ] `pnpm vitest run --config scripts/cf-audit-log/vitest.config.ts --coverage` が threshold pass で exit 0
- [ ] severity-classifier の lines / branches / functions / statements が表の値を満たす
- [ ] 集合 total が lines ≥ 85%, branches ≥ 78%, functions ≥ 85%, statements ≥ 85%
- [ ] `coverage/cf-audit-log/coverage-summary.json` が生成され judgment-result.md に転記済み
- [ ] 既存 apps/** packages/** の coverage gate に変動がないこと（PR diff で `vitest.config.ts` ルート変更 0 件）
- [ ] 判定 GO（NO-GO 時は Phase 6 にループバック）

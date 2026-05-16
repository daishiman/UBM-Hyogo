# Phase 5: - 実装（TDD Green）

[実装区分: 実装仕様書 / Phase 05]

## 目的

Phase 04 の Red を Green に転じさせる最小実装を行う。同一 PR 内 commit 順序を厳守する（unassigned-task 9 項の「mini-PR 相当として処理」要件）。

## 変更対象ファイル一覧

| # | パス | 種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `.github/workflows/cf-audit-log-7day-summary.yml` | 編集 | 出力 JSON に `week_starting` (`YYYY-Www`) と `schema_version: "1.0.0"` を追加 |
| 2 | `scripts/cf-audit-log/dashboard/types.ts` | 新規 | `SummaryV1` / `WeeklyTrend` / `BaselineSnapshot` 型定義 |
| 3 | `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` | 新規 | aggregator 本体 |
| 4 | `scripts/cf-audit-log/dashboard/__tests__/aggregate-weekly.spec.ts` | （Phase 04 で新規） | unit test |
| 5 | `scripts/cf-audit-log/dashboard/__tests__/fixtures/*.json` | （Phase 04 で新規） | fixture |
| 6 | `docs/dashboards/cf-audit-log-7day-trend/index.html` | 新規（Phase 03 で採択済み） | 静的 HTML dashboard |
| 7 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集（Phase 12 で実施） | dashboard URL/path 追記 |

## コミット順序（mini-PR 分離）

PR 内で以下の順序で commit を切る:

1. **commit 1 (mini-PR 相当)**: `chore(cf-audit-log): add week_starting and schema_version to 7day summary YAML`
   - `.github/workflows/cf-audit-log-7day-summary.yml` のみ
   - 単独で merge 可能・後方互換性は aggregator 側で吸収するため安全
2. **commit 2**: `feat(cf-audit-log/dashboard): add aggregate-weekly script with unit tests`
   - `scripts/cf-audit-log/dashboard/**` 一式
3. **commit 3**: `feat(cf-audit-log/dashboard): add static visualization layer`
   - Phase 03 確定方針に従い静的 HTML のみ
4. **commit 4**: `docs(observability): add 7day trend dashboard reference to SSOT`（Phase 12 で実行）

## 関数シグネチャ

```ts
// scripts/cf-audit-log/dashboard/aggregate-weekly.ts
export interface AggregateOptions {
  inputDir: string;
  outFile: string;
  weeks?: number;
  baselineFile?: string;
}

export async function aggregateWeekly(opts: AggregateOptions): Promise<void>;

export function readSummary(filePath: string): SummaryV1 | null; // null = skip
export function groupByWeek(summaries: SummaryV1[]): Map<string, SummaryV1[]>;
export function computeWeeklyTrend(weekKey: string, items: SummaryV1[]): WeeklyTrend;
export function deriveISOWeek(generatedAtISO: string): string; // "YYYY-Www"
```

## ローカル実行コマンド

```bash
# Red を Green に転じる
mise exec -- pnpm vitest run scripts/cf-audit-log/dashboard/__tests__/aggregate-weekly.spec.ts

# 実データで dry-run（親 #586 の evidence dir を input に）
mise exec -- pnpm tsx scripts/cf-audit-log/dashboard/aggregate-weekly.ts \
  --input docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence \
  --out /tmp/trend-weekly.json \
  --weeks 12
```

## 静的 HTML 実装メモ

- `docs/dashboards/cf-audit-log-7day-trend/index.html` を作成
- inline `<style>` で OKLch トークン値を踏襲
- inline `<svg>` で 4 指標プロット
- `apps/web` のビルド対象から除外確認（`docs/**` は元々 build 対象外のはず）

## 出力

- `outputs/phase-05/main.md` — 実装記録
- `outputs/phase-05/file-changes.md` — ファイル変更一覧 + commit 順序

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 状態 | spec_created |

## 実行タスク

- 本文の目的・手順・出力に従う。

## 参照資料

- `index.md`
- `artifacts.json`

## 成果物

- `outputs/phase-*` に定義された成果物。

## 完了条件

- [ ] 本 Phase の出力仕様が `artifacts.json` と一致している。

## 統合テスト連携

- 実装 Phase で指定された focused command と Phase 09 品質ゲートに接続する。

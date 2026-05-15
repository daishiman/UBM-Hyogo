# Phase 4: - テスト作成（TDD Red）

[実装区分: 実装仕様書 / Phase 04]

## 目的

aggregator script の unit test を**先に**作成し、Vitest で fail を確認する（TDD Red）。テストファイル名は `.spec.ts` 規約（CLAUDE.md 不変条件 #8 / `verify-test-suffix` gate）。

## 作成ファイル

`scripts/cf-audit-log/dashboard/__tests__/aggregate-weekly.spec.ts`（新規）

## テストケース列挙

| # | ケース名 | 入力 | 期待出力 |
| --- | --- | --- | --- |
| 1 | 4 週分集約 | 4 週分の `hourly-run-7day-summary.json` (`schema_version: "1.0.0"` 付き) | `weeks.length === 4`、各 metric が正しく集約 |
| 2 | 欠損週 | 3 週分のうち中央 1 週欠落 | 出力 `weeks.length === 2`、欠損 week は warning ログ |
| 3 | unsupported explicit version | `schema_version: "2.0.0"` の JSON | aggregator が throw（明示エラーメッセージ） |
| 4 | 古い JSON (version 未指定) | `schema_version` field 無し | warn + skip（throw しない）、出力 `weeks` に含まれない |
| 5 | threshold vs ML 期分岐 | 各 JSON に `phase: "threshold" | "ml"` 含む | 出力 weeks の `phase` field が原値踏襲、baseline と区別可能 |
| 6 | ISO week 計算境界 (年跨ぎ) | `schema_version: "1.0.0"` かつ `week_starting` 欠落、`generated_at: "2026-01-01T00:00:00Z"` | native ISO 8601 規則に従って補完される |
| 7 | ISO week 計算境界 (53 週年) | `generated_at: "2026-12-31T00:00:00Z"` (2026 は 53 週年でない場合 fixture 調整) | 正しい ISO week が算出される |
| 8 | 出力 directory 非存在 | `--out /nonexistent/foo.json` | throw（ENOENT 親 dir） |
| 9 | baseline JSON 適用 | `--baseline threshold-baseline.json` 指定 | 出力に `baseline` field が含まれる |
| 10 | `--weeks N` 絞り込み | 8 週分入力 + `--weeks 4` | 直近 4 週のみ抽出 |

## fixture 配置

`scripts/cf-audit-log/dashboard/__tests__/fixtures/` に以下を配置:

- `summary-2026-W18.json` 〜 `summary-2026-W21.json`（4 週分・正常系）
- `summary-version-mismatch.json`
- `summary-no-version.json`
- `threshold-baseline.json`
- `summary-year-boundary-2026-01-01.json`

## 実行コマンド（Red 確認）

```bash
mise exec -- pnpm vitest run scripts/cf-audit-log/dashboard/__tests__/aggregate-weekly.spec.ts
# 期待: 全ケース fail（実装が無いため）
```

## 出力

- `outputs/phase-04/main.md` — TDD Red 実施記録
- `outputs/phase-04/test-cases.md` — 上記テーブル + fixture 一覧

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
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

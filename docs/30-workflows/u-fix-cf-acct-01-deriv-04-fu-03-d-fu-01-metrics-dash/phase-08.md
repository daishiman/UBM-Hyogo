# Phase 8: - リファクタリング

[実装区分: 実装仕様書 / Phase 08]

## 目的

Phase 05-07 の実装に対して重複削除 / 命名整合 / 責務分離を行う。テスト pass を保ったまま実施する。

## refactor-table（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `aggregate-weekly.ts` 内 ISO week 算出 | inline | `deriveISOWeek()` 関数に切り出し | 単体テスト容易化 / Phase 04 ケース 6,7 直接対象化 |
| summary 型定義 | `aggregate-weekly.ts` 内 | `scripts/cf-audit-log/dashboard/types.ts` | 型のみの module 化 / 将来 `packages/shared/` 移管準備 |
| version validation | inline `if (s !== "1.0.0")` | `assertSchemaVersion(value)` ヘルパ | 重複削除（fixture validator と共有） |
| dashboard page tokens 参照（候補 A） | HEX べた書き残存があれば修正 | `var(--token-*)` 経由 | OKLch 不変条件 / `verify-design-tokens` gate 通過 |
| 静的 HTML inline color（候補 B） | HEX 直書き | OKLch + `--token-*` CSS variable inline | デザイン正本順位の踏襲 |
| log 出力 | `console.warn` 直 | `logger.warn` (既存 logger reuse 検討) | observation script 群と整合 |

## 命名整合

- 関数名: `aggregate*` / `compute*` / `derive*` / `read*` を動詞分離
- ファイル名: `aggregate-weekly.ts`（動詞-名詞 kebab-case、CLAUDE.md 既存命名に整合）
- 型名: `SummaryV1` / `WeeklyTrend` / `BaselineSnapshot`（PascalCase + version suffix）

## 実行コマンド（リグレッション確認）

```bash
mise exec -- pnpm vitest run scripts/cf-audit-log/dashboard/
mise exec -- pnpm typecheck
mise exec -- pnpm lint scripts/cf-audit-log/dashboard/
```

## 出力

- `outputs/phase-08/main.md` — refactor 実施記録
- `outputs/phase-08/refactor-table.md` — 上記テーブル

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
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

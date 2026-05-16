# Phase 6: - テスト拡充

[実装区分: 実装仕様書 / Phase 06]

## 目的

Phase 04 / 05 で確立した base に対して fail path / 回帰 guard を追加する。

## 追加テストケース

| # | 種別 | 内容 |
| --- | --- | --- |
| 11 | fail path | `schema_version` が文字列でなく数値（`1.0`）→ throw 検知 |
| 12 | fail path | `week_starting` が ISO 8601 week 形式でない（例: `"2026-05-14"`）→ throw |
| 13 | fail path | `--weeks` に負数 / 0 / 非数値 → CLI parse error |
| 14 | 回帰 guard | 空 input dir → 空 `weeks: []` 出力 + warning（throw しない） |
| 15 | 回帰 guard | 過去 N 週欠落（連続）→ 欠損週リストを stderr に出力 |
| 16 | 回帰 guard | 同一 `week_starting` の重複 JSON → 後勝ち（最新 `generated_at`）を採用 |
| 17 | dashboard 表示 | trend JSON の 4 指標がすべて 0 のときも軸ラベルが表示される（静的 HTML の visual diff） |
| 18 | dashboard 表示 | threshold/ML 期 phase 切替境界が線スタイル変更で識別できる |

## 静的 HTML 追加

- 静的 HTML には component unit test は適用困難なため、Phase 11 visual screenshot で代替
- ただし aggregator 出力 JSON の schema 妥当性は unit test で保証

## 実行コマンド

```bash
mise exec -- pnpm vitest run scripts/cf-audit-log/dashboard/
```

## 出力

- `outputs/phase-06/main.md` — 追加ケース実施記録 + 全 case pass のログ抜粋

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
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

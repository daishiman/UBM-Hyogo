# Phase 4: D1 依存 test の機械判定と分類

## 目的

`apps/api` 配下の test ファイルを「D1 binding を使う」「使わない」に機械判定で分類する。

## 判定ルール（三段）

| 段 | ルール | 検出方法 |
| --- | --- | --- |
| 1 | ファイル名規約 `*.d1.test.ts` / `*.d1.spec.ts` / TSX variants | `find apps/api -type f \\( -name "*.d1.test.ts" -o -name "*.d1.spec.ts" -o -name "*.d1.test.tsx" -o -name "*.d1.spec.tsx" \\)` |
| 2 | source 内に `D1Database` / `env.DB` / `c.env.DB` を参照 | `rg -l "D1Database|env\\.DB|c\\.env\\.DB" apps/api -g "*.{test,spec}.{ts,tsx}"` |
| 3 | `setupD1` / Miniflare D1 setup を import | `rg -l "setupD1|getMiniflareBindings|miniflare.*D1" apps/api -g "*.{test,spec}.{ts,tsx}"` |

いずれかに該当 → D1 group。該当なし → unit group。

## 手順

1. 三段 grep を実行し、分類結果を一覧化する
2. 一覧を `outputs/phase-04/classification.md` に記録（test path → group / 判定根拠 / 実行日時 / exit code）
3. 境界ケース（D1 を mock しているだけで実 binding を使わない test）は手動レビューで unit 寄せ
4. 分類結果を Phase 5 の `vitest.config.ts` exclude / `vitest.d1.config.ts` include に反映

## 出力ファイル

- `outputs/phase-04/classification.md` — 表形式で `path | group | rule_hit`

## 完了条件

- 全 test ファイルが分類済み
- 境界ケースの判断根拠が記録されている
- 分類結果が Phase 5 の config 設定に反映できる形になっている

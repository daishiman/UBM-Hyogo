# Phase 6 Main

Status: `COMPLETED`

Phase 5 の coverage JSON を file path で layer 分類し、layer × {files, line%, branch%, function%, uncovered, wave-2 touched?} を `layer-aggregation.md` に集計。
`gap-mapping.md` で line / branch / function いずれかが 80% 未満の file を 30 件まで列挙（最少カバー率昇順）。

## 集計スクリプト

`/tmp/aggregate.js`（一時）で `coverage-summary-web.json` / `coverage-summary-api.json` を読み込み、`classifyLayer` で path → layer を判定。

## 主要観察

- **public component**: 6 ファイル全件 100% (wave-2 ut-web-cov-02 完走の効果)。
- **admin component**: function% 76.14 が最低。`IdentityConflictRow.tsx` 完全空、`MembersClient.tsx` / `RequestQueuePanel.tsx` の function 数が伸びていない。
- **other (api 内部)**: 35 ファイルが under-tested。`sync/**` `repository/**` `jobs/**` が中心で integration 寄り gap も多い。
- **lib / use-case**: line% は高いが branch% で 80% 割れする gap が散発。
- **shared module**: shared 95.51 / 86.00 / 95.45。branch% のみ 86% で wave-2 touch なしでも合格水準。

# Phase 3 — 設計レビュー（Phase 4 進行可否判定）

> **実装区分: 実装仕様書**。Phase 2 設計の 4 条件評価と blocker 確認。

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ✅ | admin/将来公開の avatar 配信 bytes を fullsize(≤256KB)→thumb(≤64KB) へ削減。list 行数 × 削減幅で帯域コストが線形に下がる |
| 実現性 | ✅ | 既存 #983 surface への差分拡張。Canvas API は標準・無料。1 サイクルで完了可能（migration 1 / api 3 / shared 1 / web 3 + tests） |
| 整合性 | ✅ | invariant #4/#5/無料枠と矛盾なし。後方互換（既存 key 維持・新列 nullable・旧 client 受理）で破壊なし |
| 運用性 | ✅ | サーバ処理ゼロで運用負荷増なし。migration 0023 apply のみ user-gated。fallback 3 段で degrade 安全 |

## 2. 因果ループ

- 強化ループ: variant 配信 → 表示 bytes ↓ → 公開ディレクトリ表示速度 ↑ → 写真登録の価値 ↑。
- バランスループ: client Canvas 処理失敗 → original_fallback（display=原 File）→ bytes 削減なしだが破壊なし（安全側）。

## 3. 責務境界レビュー

- 生成（client）/ 保存（api）/ 選択（UI）が分離。Facade 混在なし。
- variant key は `avatar`(display) と `thumb` の兄弟セグメントで取り違えリスク回避（issue 苦戦箇所①への対処）。
- migration と route response の後方互換を同時設計（issue 苦戦箇所②への対処）。

## 4. MINOR 指摘（未タスク化候補・本サイクル外）

| # | 指摘 | 判定 |
|---|------|------|
| M-1 | `content_hash` による R2 dedup / 既存同一画像の put skip | 本タスクは hash 記録のみ。dedup 最適化は将来候補（Phase 12 未タスク検出で評価） |
| M-2 | 公開メンバー表示での thumb 露出 | #1029 の責務。本タスクは admin 経路のみ（scope 外明記済） |
| M-3 | 複数解像度（2x retina）variant | over-scope。96/512 の 2 variant に限定 |

> M-1〜M-3 は CONST_007 の「将来送り」ではなく **責務分離による別レーン**。M-1 のみ Phase 12 で未タスク化要否を判定する。

## 5. 判定

**Phase 4 へ進行可（GO）。** blocker なし。

## 完了条件（Phase 3）

- [x] 4 条件評価（全 ✅）
- [x] 責務境界・後方互換レビュー
- [x] MINOR 指摘の仕分け
- [x] 出力: [outputs/phase-3/design-review-result.md](outputs/phase-3/design-review-result.md)

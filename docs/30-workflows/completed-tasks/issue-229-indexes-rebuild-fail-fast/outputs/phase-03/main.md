# Phase 3 成果物: 設計レビュー

## 代替案比較

| 案 | 概要 | 判定 | 理由 |
| --- | --- | --- | --- |
| A（base case） | generate-index.js 単体に atomic write + decisive log + silent catch 分離 + CLI ガード + export 化、byte-identical 維持 | **PASS** | AC-1〜AC-8 を最小差分で満たす。既存 CI/hook 無影響 |
| B | 複数 skill 横断 rebuild orchestrator 新設 | MAJOR 却下 | 現状単一経路で over-scope。byte-identical 維持が複雑化 |
| C | index を完全静的化し rebuild 廃止 | MAJOR 却下 | CI drift 検出の前提崩壊。運用全体の再設計が必要 |
| D | throw せず警告のみで best-effort 継続 | MAJOR 却下 | AC-1（非ゼロ exit）/ AC-2（部分書き込み防止）と正面衝突 |

## レビュー指摘

| 項目 | 判定 | 対応 |
| --- | --- | --- |
| atomic 境界の所有権 | PASS | writeAllIndexesAtomic が唯一の所有者 |
| byte-identical 維持 | PASS | 出力文字列不変・書き込み経路のみ変更。Phase 4/11 で git diff 0 回帰 |
| rename EXDEV リスク | MINOR | tmp を同一 indexes/ dir に配置で回避 |
| import 副作用 | PASS | CLI ガードで排除（TC-06） |
| silent catch 過剰 throw | MINOR | ENOENT のみ空継続・その他 throw（TC-04/TC-05） |
| テスト配置 | PASS | scripts/__tests__/ で root vitest glob に乗る |
| task-spec-creator 除外 | PASS | 未配線で scope 外（Phase 12 未タスク候補） |

## 着手可否ゲート

base case 案 A = **PASS（with notes: tmp 同一 dir / silent catch は ENOENT のみ空継続）**。MAJOR 残なし。→ Phase 4 進行可。

## 4 条件再評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 実在 3 穴を塞ぐ |
| 実現性 | PASS | 最小差分・先例あり |
| 整合性 | PASS | byte-identical で既存整合・#5/#8 遵守 |
| 運用性 | PASS | revert 容易・hook/CI 回帰維持 |

# スキルフィードバックレポート — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## テンプレート改善
- **[FB-I991-001] closed-issue を現状コードに最適化する仕様書パターン**: CLOSED な follow-up Issue の記述が現状コードと乖離（message format / 二重read 回避策）しているケースで、「Issue 記述 vs 現状コード」差分表を index.md 冒頭に置き、現状コードを正本として AC を再定義する手順が有効だった。task-specification-creator の P50 チェックに「Issue/spec 記述と現状コードの drift 確認」行を追加する余地がある。

## ワークフロー改善
- **[FB-I991-002] byte-identical 維持 AC の検証マトリクス**: 既存テストが message 文字列を逐語 assert している場合、「既存 message の各ケース（body あり/なし/256超/空/読取失敗）× 新実装の出力」を表で突合する設計（Phase 2 §3.3）が回帰防止に有効。message format を変える/維持する判断を AC レベルで固定できた。

## ドキュメント改善
- **[FB-I991-003] 共通層の責務境界（admin 非依存）**: 元 follow-up 仕様は共通 `safe-fetch.ts` に admin 固有 `instanceof AdminFetchError` を提案していたが、public/admin 共通層に admin import を入れると責務境界が壊れる。duck typing（`"status" in err`）に最適化した。「共通層は下位ドメインを import しない」を横断ガイドライン化する候補。

## 改善不要と判断した点
- Phase 6/7 の軽量化（EMB-005-FB）は小規模 NON_VISUAL に適切に機能した。テンプレート変更不要。

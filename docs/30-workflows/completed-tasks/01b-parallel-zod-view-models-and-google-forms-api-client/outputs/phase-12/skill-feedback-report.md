# Skill Feedback Report

このタスクで使用した skill / テンプレートに対するフィードバック。

## 対象 skill

- `task-specification-creator`（13 phase 仕様書を生成）
- `int-test-skill`（Vitest 統合テスト設計の指針）

## 良かった点

### task-specification-creator

- **境界 4 点アプローチが有効**: 「schema 入力 / response 入力 / DB 入力 / 画面出力」の 4 境界に zod を当てる分類が、後続 Wave の実装指針として極めて分かりやすかった。`FieldByStableKeyZ` と `VIEWMODEL_PARSER_LIST` の 2 集約に zod を集めることで Wave 4 / 6 での import が 1 行に収まる。
- **AC マトリクスの定型化**: AC × test ID × evidence × 不変条件の 4 列マトリクスは、Phase 10 の GO 判定根拠として直接転用でき、ノイズが少ない。
- **不変条件番号の踏襲**: CLAUDE.md の不変条件 #1〜#7 をそのまま全 phase で参照する設計が、レビュー時の verification を高速化した。

### int-test-skill

- branded 型の distinct test、consent normalize の網羅 test の例示パターンが、本タスクの `ids.test.ts` / `consent.test.ts` に直接転用できた。
- Mock を使わずに pure な変換関数（`mapAnswer`, `withBackoff`）を契約テストとして書けた。

## 改善要望

### task-specification-creator

1. **Phase 12 の二段構成（Part 1 中学生 / Part 2 開発者）の例示拡充**
   - 現在のテンプレは Part 1 を「困りごと → 解決後の状態」の 2 段ステップで書く例示があるが、実装系タスク（型 + SDK ラッパ）ではアナロジー（「みんなが使う窓口」など）が重要なので、ジャンル別の Part 1 サンプルがあると初稿の出戻りが減る。
2. **evidence パスの命名規約**
   - 現状 `outputs/phase-11/typecheck.log` のように Phase 11 にログを集約しているが、Phase 6（異常系）で発見された再現ログの置き場が暗黙だった。`outputs/phase-XX/<test-name>.log` という命名規約をテンプレ側で示すと迷いが減る。
3. **DRY 化サブタスクの強化**
   - Phase 8 で「重複候補 4 件抽出 → DRY 化」の流れは強力だが、4 件のうち何を helper / factory / wrapper にするかのカテゴリ分けがテンプレに無いため、初学者には判断が難しい。`factory / helper / mapper / wrapper` の 4 カテゴリを Phase 8 テンプレに追加するとよい。

### int-test-skill

1. Cloudflare Workers 環境の crypto（service account JWT 署名）を Vitest で test する際の MSW / mock 設計例があるとよい（今回は `crypto.subtle` の mock を独自に書いた）。

## skill 適用結果

- `task-specification-creator` の Phase 1〜13 雛形は **そのままで** 100 % 利用できた（追加セクションなし）。
- `int-test-skill` の Mock パターンは `auth.test.ts` / `client.test.ts` に部分採用、残りは pure function test として実装。

## 結論

両 skill は本タスクで有効に機能した。task-specification-creator の Phase 12 二段構成テンプレに対して、ジャンル別の Part 1 サンプル追加を提案する。

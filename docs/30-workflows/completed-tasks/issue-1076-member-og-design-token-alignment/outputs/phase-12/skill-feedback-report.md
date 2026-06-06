`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 12 — スキルフィードバックレポート（skill-feedback-report）

本レポートは改善点がない場合も出力必須。本 wave では横断ガイドライン候補として 2 件の知見を記録する。

## 知見 1 — 独立 Worker の「正本実行時 import 不可」整合パターン

| 項目 | 内容 |
| --- | --- |
| 観点 | テンプレート / 横断ガイドライン候補 |
| 背景 | `apps/og` は独立デプロイ Worker で `apps/web` のデザイン正本（`tokens.css`）を実行時 import できない。さらに Satori は `oklch()` / `var()` を解釈しないため、CSS 変数の動的解決も不可 |
| パターン | 「正本 hex を派生コピー（出典コメント付き定数）として複製し、その一致を fs-read 回帰テストでガードする」ことで、独立性（実行時依存なし）と正本整合（test で継続検証）を両立する。正本変更 → 派生コピーの spec fail → 追従を CI で強制する強化ループを設計に組み込む |
| ガイドライン候補 | task-specification-creator のテンプレートに「デザイン/設定の正本を実行時 import できない別 deploy 境界（独立 Worker / 別 bundle）では、派生コピー + fs-read ドリフトガード test を標準整合パターンとして提示する」を追記する候補 |

## 知見 2 — Workers runtime 限定描画タスクの Phase 11 evidence 扱い

| 項目 | 内容 |
| --- | --- |
| 観点 | VISUAL タスク / Phase 11 evidence の present/pending 区別 |
| 背景 | OG 画像は Cloudflare Workers ランタイムの Satori（`workers-og` の `ImageResponse`）でのみ実描画され、Node/jsdom テスト環境では `HTMLRewriter` 不在で 1×1 PNG fallback に分岐する。VISUAL タスクだが、設計サイクル（implemented_local_evidence_captured）で実描画 screenshot を取得できない |
| パターン | Phase 11 evidence を 2 層で扱う: 設計証跡（manual-test-result.md / screenshot-plan.json / capture-metadata.json）= **present**、実描画 screenshot（PNG）= **pending**（実装後 staging Worker で取得）。compliance-check §4 でも present/pending を行単位で区別して計上する |
| ガイドライン候補 | 「runtime（Workers / 実機）限定描画で Node/jsdom screenshot 不可な VISUAL タスクは `VISUAL_ON_EXECUTION` を採用し、設計証跡 present / 実描画 pending を Phase 11 inventory で明示分離する」をテンプレートの VISUAL 分類ガイドに追記する候補 |

## まとめ

| 項目 | 結果 |
| --- | --- |
| テンプレート改善候補 | 2 件（上記） |
| 本 wave での skill 本体反映 | なし（implemented_local_evidence_captured のため候補記録に留め、staging runtime cycleで lessons / changelog 反映を判断） |

# UI Sanity / Visual Review — admin-dashboard-jp-clarity-and-card-ux

workflow_state: `implemented_local_runtime_pending` / VISUAL

## VISUAL 宣言

- タスク種別: UI task（VISUAL）。画面の文言・レイアウト・視覚情報設計を変更する。
- implemented_local_runtime_pending 段階のため実スクリーンショットは未取得（`staging_visual_pending_user_gate`）。実装後に staging（user-gated）で取得する。

## Apple HIG / UI 観点レビュー計画（実装後）

| 観点 | 確認内容 |
| --- | --- |
| 明瞭性（Clarity） | 全ラベルが日本語。技術用語が運用者向けに言い換えられている |
| 情報階層 | 直近のアクションが「何をしたか→誰が・いつ→対象」の 3 段で読める |
| 余白・密度 | 公開ステータスがコンパクト横バーで余白過多が解消 |
| 一貫性 | 横バー表現がダッシュボード内（ZoneDistribution と StatusDistribution）で統一 |
| 収まり | 対象 ID が truncation でカード内に収まり、横スクロール/はみ出しが無い |
| アクセシビリティ | aria-label「公開ステータス分布: …」維持、axe violations 0、`/admin/audit` リンク維持 |

## 結論

spec 段階のレビューは設計（Phase 2）と既存テスト契約維持で担保。最終的な視覚確認は実装後の staging screenshot（Phase 11 / user-gated）で実施する。

# スキルフィードバックレポート — admin-schema-page-purpose-clarity-ux

## テンプレート改善

- **並列 SubAgent 間の配置矛盾**: Lane A（Phase 4/5）と Lane B（Phase 6/9）が同一要素（`SchemaPurposeExplainer` の配置）について逆の結論（常時表示 vs エラー時非表示）を独立に出した。SSOT に「explainer は三項の外＝常時表示（AskUser 確定）」を**配置レベルで明記**していたが、Lane B が fail-path DoD から逆算して独自に上書きした。
  - 改善案: SSOT の「ユーザー確定方針」項目に **`[CONFIRMED-IMMUTABLE]` マーカー**を付け、SubAgent が上書き禁止と判別できるようにする。または並列 lane が同一ファイル（page.tsx）の同一論点に触れる場合、orchestrator が「配置決定は lane を跨ぐ共有決定」として事前固定する手順をテンプレ化する。
  - 同サイクル反映: `apps/web/app/(admin)/admin/schema/page.tsx` と `page.spec.tsx` を修正し、explainer を `result.ok` 三項の外へ移動。`task-specification-creator` の `references/phase12-skill-feedback-promotion.md` に `[CONFIRMED-IMMUTABLE]` marker rule を追記。

## ワークフロー改善

- spec_created VISUAL の Phase 11 で「screenshots/ ディレクトリを作らない（PNG 0 で validator error 回避）」が暗黙知。compliance check の Phase 11 evidence inventory では screenshot 行を `n/a` で列挙しつつ物理ファイルは作らない、という運用が `verify-phase11-evidence-existence`（present のみ存在検査）と整合することを skill 側に明文化すると、毎回の判断コストが下がる。
  - 同サイクル反映: `task-specification-creator` の `references/phase11-evidence-two-tier-status.md` に、`n/a` screenshot は物理 PNG / 空ディレクトリを作らない rule を追記。

## ドキュメント改善

- `verify-phase12-compliance` の見出し #3 `` `workflow_state` and phase status consistency `` はバッククォート込みで逐語一致が必要（normalizeHeading は lowercase/backtick 除去しない）。この「バッククォートも逐語」点を phase12-compliance-check-template.md の冒頭注意に1行追記すると、独自命名以外の地味な fail（バッククォート落ち）を防げる。
  - 同サイクル反映: `task-specification-creator` の `references/phase12-compliance-check-template.md` に、見出し内バッククォートも逐語一致対象であることを追記。

> 本レポートの改善案は同サイクルで実コード・実 skill reference へ反映済み。未タスク化なし。

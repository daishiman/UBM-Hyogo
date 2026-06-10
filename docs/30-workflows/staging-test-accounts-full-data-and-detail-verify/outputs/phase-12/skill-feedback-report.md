# Skill Feedback Report

`task-specification-creator` skill へのフィードバックを 3 観点で記す。本タスク（implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION・seed データ拡充 + 公開詳細表示検証型）で観測した摩擦点を改善候補として挙げる。各 item は promotion target / no-op reason / evidence path を明示する。

## テンプレート改善

候補: **VISUAL_ON_EXECUTION × implemented_local_evidence_captured のとき Phase 11 evidence を「pending」で分類する明文ガイド**。

- 観測: 本タスクは VISUAL だが implemented_local_evidence_captured のため実スクリーンショットが pending（PNG 0）。compliance-check の Phase 11 evidence inventory は Status を厳密に `present / pending / n/a` のみとし注釈を Status 列へ混ぜてはならない（既存 validator の制約）。一方で VISUAL タスクでは「pending である理由」「代替証跡（adapter/contract spec）」を別途明記したい。現テンプレートは NON_VISUAL の n/a 宣言ガイドは厚いが、**VISUAL_ON_EXECUTION × implemented_local_evidence_captured（撮影が user-gated で未取得）** の標準文面が薄く、毎回手書きで補っている。
- promotion target: `task-specification-creator`（`assets/phase12-task-spec-compliance-template.md` の Phase 11 セクションに「VISUAL × implemented_local_evidence_captured = Status:pending、理由と代替証跡は別記述」の 1 節）。
- no-op reason: 該当なし（実promotion候補）。
- evidence path: 本 workflow `outputs/phase-11/manual-test-result.md`（pending 分類 + 代替証跡）、`outputs/phase-12/phase12-task-spec-compliance-check.md` §4。

## ワークフロー改善

候補: **seed データ拡充タスクで「データ（Lane A）と表示検証（Lane B）の疎結合」を fixture 駆動代替証跡として明文化**。

- 観測: 本タスクの正しさは、staging スクリーンショット（user-gated・pending）取得前でも、fixture 駆動の adapter/contract spec で大部分が保証される（full/all-fields/edge fixture が staging データに依存しない）。この「視覚証跡は pending でも自動 spec が代替証跡として成立する」構造は seed/fixture 拡充タスクで再現するが、現状は毎回個別記述している。
- promotion target: `aiworkflow-requirements`（`references/lessons-learned*.md` に「seed/fixture 拡充タスクの Phase 11 代替証跡 = fixture 駆動 adapter/contract spec」の 5 分解決カード）。
- no-op reason: 該当なし（実promotion候補・ただし今回のlocal実装着手時の同 wave 同期で確定）。
- evidence path: 本 workflow `outputs/phase-11/manual-test-result.md`「現時点の代替証跡」節、`outputs/phase-2/phase-2.md` §2.4。

## ドキュメント改善

特記なし（no-op）。

- 観測: index.md（設計 SSOT）/ _shared-context.md（SubAgent SSOT）/ artifacts.json parity / strict 7 の各要件は既存テンプレートで過不足なく表現できた。表示バリエーション・マトリクスや Google Form 33 列マッピング表も既存の表形式で十分に表現できた。
- no-op reason: ドキュメント構造そのものの欠陥ではなく、上記 2 候補はいずれも「VISUAL × implemented_local_evidence_captured」「seed/fixture 拡充型」という特定タスク類型に対する読み替えガイドの不足。ドキュメント構造変更は不要。
- evidence path: 本 workflow `index.md` / `_shared-context.md`（既存テンプレートで完結）。

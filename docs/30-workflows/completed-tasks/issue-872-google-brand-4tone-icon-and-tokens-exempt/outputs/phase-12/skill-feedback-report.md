**[実装区分: 実装仕様書 / 状態: spec_created]**

# Skill feedback report

issue #872 [FU-LOGIN-001] 仕様書作成サイクルで判明した task-specification-creator skill / aiworkflow-requirements skill への feedback。改善点なしでも本ファイル出力必須。

## 確認済み skill 規約 (本仕様書で適用したもの)

- Phase 1-13 outputs ディレクトリ構造 (`outputs/phase-N/phase-N.md`)
- Phase 12 strict 7 outputs (`main.md` + 6 ファイル) を workflow root に集約
- Phase 12 canonical 9 headings (SSOT) を `phase12-task-spec-compliance-check.md` で逐語使用
- Phase 11 evidence file inventory 表 (status は present / pending / n/a の lowercase)
- 状態語彙: `spec_created` → 実装後 `implemented_local_visual_evidence_captured` → user-gated 後 `implementation_completed`
- `*.spec.{ts,tsx}` 命名規約 (CLAUDE.md 不変条件 #8)
- CONST_004 (実装区分明記) / CONST_005 (実装仕様書必須項目) / CONST_007 (1サイクル完結)
- consumed trace (親 workflow `completed-tasks/` 配下の unassigned-task-detection.md への in-line 更新は live ledger 扱いで許可)

## 本サイクルで確定した項目

| 項目 | 状況 | 後段で確定する場所 |
|------|------|---------------------|
| `verify-design-tokens` script の exempt 拡張点 | `DEFAULTS.brandIconExemptPaths` を新設、`scanForbiddenColorLiterals` で path-glob filter | Phase 4 / Phase 8 |
| `GoogleBrandIcon` component の API surface | `className?` / `size?: "sm" \| "md" \| "lg"` (default `"md"`) / `aria-hidden="true"` + `alt=""` 固定 / TSX 内 HEX 0 件 | Phase 4 |
| Google brand 4 色 HEX 値 | `#4285F4` / `#34A853` / `#FBBC05` / `#EA4335` (Google brand guideline) | Phase 4 §6 表 |
| 親 workflow FU-LOGIN-001 の consumed 表記 | `consumed (issue-872)` を inline 追記 | Phase 12 system-spec-update-summary §Step 1-C |
| issue 状態 | issue #872 CLOSED 維持、PR では `Refs #872` | Phase 13 |

## skill feedback (改善候補)

### 候補 1: brand-asset exempt rule の 2 層設計を reference 化

- **観察**: 本 task で「path-glob exempt」 + 「token-name prefix exempt (reserved)」の 2 層設計を採用。今後他ブランド (GitHub / X / Apple / UBM 公式ロゴ) を追加する際、同パターンを再利用する公算大
- **提案**: `.claude/skills/task-specification-creator/references/brand-asset-exempt-2-layer-pattern.md` を新設し、design-token policy への例外導入時の標準パターンとして reference 化
- **重要度**: 中

### 候補 2: VISUAL task で外部 brand asset を扱う場合の Phase 2 設計テンプレ

- **観察**: 本 task のように「外部ブランドガイドラインに従う必要があり、site の token policy の例外を作る」ケースは Phase 2 (設計) の構造が独特 (ガイドライン参照 / 色値固定 / 例外スコープ限定 / SVG 化方針)。テンプレ化されていないため毎回ゼロから書く
- **提案**: `.claude/skills/task-specification-creator/references/phase2-external-brand-asset-design-template.md` を新設し、外部 brand asset を扱う Phase 2 の章立て (ガイドライン source / 色値表 / 例外スコープ定義 / a11y 配慮) を提供
- **重要度**: 中

### 候補 3: VISUAL task の screenshot-plan.json schema 明文化

- **観察**: `outputs/phase-11/screenshot-plan.json` の schema (mode / shots[].id / viewport / project / selector_focus / heuristics) は本 task で踏襲したが、skill reference に schema 定義が未掲載。各 task で揺れる可能性あり
- **提案**: `.claude/skills/task-specification-creator/references/screenshot-plan-json-schema.md` を新設し、`mode` enum (`VISUAL` / `NON_VISUAL`) / 必須 / 任意フィールドを zod-like で記述
- **重要度**: 低 (本 task 内では問題なし)

## aiworkflow-requirements skill への feedback

- 本 workflow root の `indexes:rebuild` drift 発生時、`topic-map.md` の rebuild 範囲は同期するが `quick-reference.md` / `resource-map.md` は手動 ledger のため、本 task のような consumed 系では親 workflow と本 workflow 両方の参照を同 wave 更新する必要がある。skill の README に「consumed task は親 + 子両方の indexes 更新」を明記すると忘れにくい

## 次 Phase への引き継ぎ

上記 candidate 1-3 は本 task の PR とは独立した skill 反映 task として、merge 後に検討 (本 task の wave に含めるかは user 判断)。

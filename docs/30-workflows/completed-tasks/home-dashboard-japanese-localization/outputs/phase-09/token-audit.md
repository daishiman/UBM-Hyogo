# Phase 9 — トークン監査（CSS 削除のみ・色追加 0・HEX 0）

> SSOT: `../../_shared-context.md` §2-4。UI prototype alignment 不変条件 #2（OKLch トークン正本）に整合。

## 監査結論

本タスクの CSS 変更（F6）は次に限定され、デザイントークンの不変条件を満たす。

- **dead eyebrow ルール 4 件の削除**（既存ルールの除去のみ）。
- **CTA heading の `margin-top: var(--ubm-space-2)` → `margin-top: 0`**（spacing 値の変更のみ・色は不変）。

## トークン監査項目

| 項目 | 結果 | 根拠 |
| --- | --- | --- |
| 色の追加 | **0** | 新規 `var(--ubm-color-*)` 参照を導入しない。削除した 4 ルールは既存の `var(--ubm-color-text-muted)` / `color-mix(...)` を参照していたが、いずれも削除であり追加ではない |
| HEX 直書き | **0** | `#xxx` / `bg-[#xxx]` / `text-[#xxx]` の新規導入なし |
| OKLch トークン正本変更 | **なし** | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md` は不変 |
| spacing トークン | 値変更のみ | CTA heading の margin-top を `var(--ubm-space-2)` から `0` に変更（新規 spacing トークン導入なし） |
| `verify-design-tokens` | 緑維持 | CSS は削除と margin-top=0 のみで HEX 0 を維持 |

## 変更しないファイル（トークン正本）

- `apps/web/src/styles/tokens.css`（OKLch トークン定義の正本）— **変更なし**。
- `docs/00-getting-started-manual/specs/design-tokens.md`（トークン仕様の正本）— **変更なし**。

## jsdom 制約の注記

- jsdom は CSS を評価しないため、`verify-design-tokens`（トークン参照・HEX 検出の静的 gate）と
  Phase 11 視覚証跡（user-gated）の二段で CSS の妥当性を担保する。
- 本監査は静的（トークン参照レベル）の確認であり、実レンダリングの色再現は Phase 11 で確認する。

## 保証

`verify-design-tokens` が緑であること（HEX 直書き 0・色追加 0）を本タスクの DoD（SSOT §4）に含める。
implemented_local_evidence_captured のため実 gate 実行は実装 → PR 承認後（user-gated）。

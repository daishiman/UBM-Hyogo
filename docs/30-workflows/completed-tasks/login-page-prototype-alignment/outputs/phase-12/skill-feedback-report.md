# Skill feedback report

仕様書作成・実装サイクルで判明した task-specification-creator skill への feedback。

## 確認済み skill 規約 (本仕様書で適用したもの)

- Phase 1-13 の outputs ディレクトリ構造 (`outputs/phase-N/phase-N.md`)
- Phase 12 strict 7 outputs を parent root に集約
- Phase 12 canonical 9 headings
- Phase 11 evidence file inventory 表 (`## 4.` 番号付き見出し、status は present / pending / n/a の lowercase)
- 状態語彙: `spec_created` → 実装後 `implementation_completed` (PASS 単独表記禁止)
- `*.spec.{ts,tsx}` 命名規約 (CLAUDE.md 不変条件 #8)
- existing-route-alignment 実装モード (task-17 stale-topology gate)
- CONST_004 (実装区分明記) / CONST_005 (実装仕様書 5 必須項目) / CONST_007 (1 サイクル完了スコープ)

## 実装サイクルで確定した項目

| 項目 | 状況 | 後段で確定する場所 |
|------|------|---------------------|
| `verify-design-tokens` script の実在 | `@ubm-hyogo/web verify-design-tokens` 実行済み。9 tests PASS | Phase 11 local summary |
| `Button` primitive の `variant` / `block` / `leftIcon` | 既存 Button primitive で対応済み | code diff |
| OKLch token / HEX gate | `auth.css` と login TSX に HEX 直書きなし | Phase 11 local summary |
| Google brand icon の最終方針 (1-tone vs 4-tone) | 1-tone `currentColor` を MVP 採用。4-tone は brand guideline 依存の独立候補 | unassigned-task-detection |

## skill feedback

- Playwright screenshot evidence は `PLAYWRIGHT_EVIDENCE_DIR` だけでは `page.screenshot({ path })` の保存先を変えない。spec 内の evidence path を workflow root に合わせる必要がある。
- local dev screenshot には Next dev tools overlay が写り込むため、証跡撮影 spec では `nextjs-portal` / dev tools selector を非表示にする。
- visual state smoke は `waitUntil: 'domcontentloaded'` で UI 存在確認に必要な安定性を満たせる。`load` 待ちは不要な network/error overlay 要因で遅くなる。

<!-- workflow: members-list-ux-clarity / task: C / phase: 3 -->

[実装区分: 実装仕様書]

# Phase 3 — 設計レビュー (Task C: page-integration-and-visual-baseline)

> 前提: [phase-1-requirements.md](./phase-1-requirements.md), [phase-2-design.md](./phase-2-design.md)

## 1. 真の論点

1. page.tsx を Server Component のまま薄く保ち、件数 prop を渡すだけで Task B の `<output>` が完全に機能するか
2. `<p data-role="pagination-meta">` の扱い（aria-hidden 化 vs 削除 vs 縮退）
3. Playwright visual baseline の軸設計（24 snapshot = 4 viewport × 3 density × 2 state）が CI で安定か

## 2. 代替案比較

### 2.1 `pagination-meta` 扱い: `aria-hidden="true"` (採用) vs 削除 vs visually-hidden

| 観点 | A: aria-hidden 付与 (採用) | B: 完全削除 | C: visually-hidden 化 |
| ---- | -------------------------- | ----------- | --------------------- |
| 視認構造の変化 | 最小 (DOM 維持) | 視認上の余白が変化 | 視認上消える |
| 既存 spec 影響 | 既存 `data-role="pagination-meta"` 参照を維持 | 既存 spec 全件改修 | spec 影響軽微だが CSS 1 行追加必要 |
| SR 影響 | `aria-hidden=true` で SR から非表示。MemberFilters 側の `<output>` のみ読み上げ | 同等 | 同等 |
| プロトタイプ整合 | プロトタイプには `pagination-meta` 規定なし → どれでも可 | 同 | 同 |

**採用根拠**: A 採用。既存 spec / observability 互換と視認 DOM 維持を両立。CSS 改修コスト 0。

### 2.2 Playwright spec 軸: 4×3×2 = 24 snapshot (採用) vs 縮小軸

| 観点 | A: 4×3×2 (採用) | B: 4 viewport × 1 density × 1 state |
| ---- | --------------- | ------------------------------------ |
| 検知力 | density 切替差・state 差を視認できる | UI 退行検知力が低い |
| CI コスト | 24 snapshot 撮影 (約 30-60 秒) | 4 snapshot (約 10 秒) |
| 親 AC-8 充足 | ◎ (4 viewport × 3 density × 2 state を明文化) | × (AC-8 不一致) |

**採用根拠**: A 採用。親 AC-8 を直接満たす。

### 2.3 visual project: 既存 `visual-chromium` (採用) vs 新 `public-visual` project

| 観点 | A: visual-chromium 既存 (採用) | B: 新規 public-visual project 追加 |
| ---- | ----------------------------- | ----------------------------------- |
| playwright.config.ts 改修 | 不要 | 4 project 追加 (mobile/tablet/desktop/wide) |
| storageState | public route のため不要 | 同左 |
| snapshotPathTemplate 衝突 | 既存 default で `members-ux-clarity-*` prefix にて分離 | 新 project ごとに分離 |
| baseline 名前空間 | spec ファイル名で十分分離 | 過剰設計 |
| admin-staging-visual-* との整合 | 影響なし | viewport 軸ごとに project を分ける構造を踏襲することになる |

**採用根拠**: A 採用。public ルートは認証境界がないため、admin-staging-visual のような複数 project 構造は不要。spec 内で `setViewportSize` を切り替える方式が最小コスト。

### 2.4 `result-count` を mask するか

| 観点 | A: mask しない (採用候補) | B: mask する |
| ---- | ------------------------- | ------------ |
| baseline での値検証 | "X 件中 Y 件" を baseline で凍結できる | 件数文言の visual 検証はできない |
| seed 揺れ耐性 | seed が決定論的なら問題なし | seed が揺れても baseline 維持 |
| 重複検出 | `pagination-meta` と二重 baseline 化のリスクあり | 安全 |

**採用根拠**: 暫定 A (mask しない)。seed が決定論的であることを Phase 4 で確認し、揺れが観察されれば B に切り替える。

## 3. 価値とコスト

| 項目 | 値 |
| ---- | -- |
| 期待効果 | (1) Task A/B 成果物の page 統合完了、(2) visual baseline で UI 退行を CI で検知、(3) a11y live region の page-level 動作確認 |
| 推定 LOC | +200 / -11 |
| 推定工数 | 半日 (Task A/B 完了後) |
| 影響範囲 | `/members` route のみ |
| API/Schema/Token 変更 | 0 |
| 新 primitive | 0 |
| playwright.config.ts 改修 | 0 (既存 `visual-chromium` project 流用) |

## 4. 4 条件評価

| 条件 | 評価 |
| ---- | ---- |
| 整合 (CLAUDE.md / プロトタイプ / 既存 API / tokens) | ◎ |
| 価値 (UX 課題解消の最終ピース) | ◎ |
| コスト (LOC / primitive / API 変更) | ◎ 新 primitive 0、新 project 0 |
| 副作用 | ○ `members-prototype-alignment.spec.ts` の selector 追従のみ要警戒 |

## 5. risks (Phase 4 へ持ち越し)

| ID | リスク | 監視 |
| -- | ------ | ---- |
| C-R-1 | Task A/B prop API 未確定で着手 → 統合不能 | Phase 5 冒頭で Task A/B の phase-5 を確認、`MemberFilters` 型定義を grep で実物確認 |
| C-R-2 | 24 snapshot の CI 時間増 | `visual-chromium` project 内で 24 test 並列実行可能。CI 全体時間への影響は数十秒オーダー |
| C-R-3 | seed 非決定論で snapshot flaky | Phase 4 で seed 内容を確認し、必要ならば `result-count` を mask 対象に追加 |
| C-R-4 | both-or-none preflight 違反（spec 追加だけで baseline 未撮影） | Gate-C で user-gated に Linux baseline 撮影、同 PR 内で commit |
| C-R-5 | `SelectedTagsBar` rename 追従漏れ | `git grep` を Phase 5 冒頭で実行 |

## 6. open questions の解消 (phase-2 § 8)

| Q | A |
| - | - |
| `result-count` を mask するか | 暫定 mask しない。Phase 4 で seed 決定論性確認後に最終判断 |
| `pagination-meta` を完全削除すべきか | 残す (`aria-hidden="true"` 付与)。既存 spec/observability 互換のため |
| empty state URL クエリ | `?q=__none__` で固定。seed に依存しない確実な「該当者なし」状態 |

## 7. 改善優先順位

1. page.tsx 差分 + page.spec.tsx 更新 (Task A/B 完了確認後すぐ)
2. `members-ux-clarity.spec.ts` 新規追加 + local 1 viewport で smoke 確認
3. `members-prototype-alignment.spec.ts` selector 追従（rename あれば）
4. Linux runner で baseline 撮影 (user-gated, Gate-C)

## 8. 承認可否

| 項目 | 結果 |
| ---- | ---- |
| Phase 1 AC との整合 | ○ |
| 不変条件 (INV-1..6) との整合 | ○ |
| プロトタイプ正本順位 | ○ (本 task は構造変更なし) |
| 1 サイクル完了スコープ (CONST_007) | ○ |
| 新 primitive 追加 | 0 |
| API / Schema / Token 変更 | 0 |
| playwright.config.ts 改修 | 0 |

**結論**: Phase 4 (テスト計画) へ進行可。

## DoD

- [x] 代替案比較が論点ごとに記録されている
- [x] 採用根拠が明示されている
- [x] risks が ID 付きで列挙されている
- [x] open questions に解答が付されている
- [x] 4 条件評価が表で示されている
- [x] 改善優先順位が明示されている

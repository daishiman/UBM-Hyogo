**[実装区分: 実装仕様書 / 状態: spec_created]**

# Unassigned task detection

issue #872 [FU-LOGIN-001] サイクル内で完了させず、follow-up unassigned-task として後段に切り出すべき項目の確認結果。

結論: 本 task のスコープ (Google brand 4-tone icon + verify-design-tokens exempt) は 1 サイクル完結 (CONST_007)。下表 3 件は本 task の漏れを先送りしたものではなく、独立スコープでの分離。

## Current (本サイクルで新たに検出した候補)

| ID | 内容 | 種別 | scope-out 理由 (CONST_007 例外) |
|----|------|------|--------------------------------|
| FU-872-001 | 他 OAuth provider (GitHub / X / Apple) brand-icon の追加 | post-MVP candidate | 現状 OAuth provider は Google のみ active。他 provider 採用判断は別議論 (auth strategy) で、brand-asset 追加の前に provider 採用が確定する必要あり。技術的には同 `brand-icons/` 配下に `*.svg` + `*BrandIcon.tsx` を追加するだけで本 exempt 設計に乗る (拡張性は確保済) |
| FU-872-002 | UBM brand-mark の画像アセット差し替え (FU-LOGIN-002 残) | post-MVP candidate | UBM 公式ロゴ画像アセット入稿待ち。"兵" 文字暫定。本 task のスコープ (Google brand) と独立 |
| FU-872-003 | staging visual smoke gate for `/login` (FU-LOGIN-003 残) | infrastructure | staging deploy 後の user-gated runtime evidence。local visual baseline は本 task で完結。staging gate は dev-deploy パイプラインの拡張議論を要する |

## Baseline (親 workflow から継承し、本 task では未対応のまま残る候補)

| ID | 内容 | 状態 | 本 task との関係 |
|----|------|------|------------------|
| FU-LOGIN-002 | brand-mark を UBM 公式ロゴアセット化 | open (親 unassigned-task として継続) | 本 task の Google brand とは独立 |
| FU-LOGIN-003 | staging visual smoke 統合 | open | 本 task の local visual evidence は完結。staging gate は別 task |
| FU-LOGIN-004 | i18n (英語ロケール) | open | future-scope。本 task と無関係 |
| FU-LOGIN-001 | Google brand 4-tone icon 導入 | **consumed (issue-872 / 本 task)** | 本 task が consumed する recipient |

## CONST_007 例外条件適合性

- FU-872-001: 別議論 (provider 採用) 前提のため技術的に同サイクル完結不可
- FU-872-002 / FU-LOGIN-002: 外部入稿待ち
- FU-872-003 / FU-LOGIN-003: staging deploy gate 後の user-approval 必須
- FU-LOGIN-004: スコープ宣言上 MVP 外

「分量が多い」「念のため」での先送りは 0 件。すべて独立スコープでの分離。

## ユーザーへのエスカレーション (CONST_007 後段要件)

- FU-872-001 はリリース前に他 OAuth 採用方針を user 判断
- FU-872-002 / FU-LOGIN-002 は UBM ロゴアセット入稿スケジュール確認が必要
- FU-872-003 / FU-LOGIN-003 は staging deploy パイプライン拡張の優先度確認
- FU-LOGIN-004 は後続バックログ

## 次 Phase への引き継ぎ

Phase 13 PR merge 後、FU-872-001..003 を `docs/30-workflows/unassigned-task/` 配下に YAML frontmatter 付きで切り出すか、GitHub Issue として open する。

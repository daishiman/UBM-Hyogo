# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 で設計したコード変更（`AdminSidebar.tsx` / `MemberDrawer.tsx` 編集・Vitest spec 2 件新規・Playwright smoke 更新）の GO/NO-GO 判定を行うレビュー Phase。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin ナビゲーション動線改善 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | pending |
| visualEvidence | VISUAL |

## 目的

Phase 2 設計成果物 3 件（`admin-sidebar-logo-design.md` / `member-drawer-tag-link-design.md` / `test-strategy.md`）に対し、以下 7 軸で GO / NO-GO 判定を行い、`outputs/phase-03/design-review.md` に判定根拠を記録する（AC-6）。

## レビュー観点

| # | 観点 | 判定基準 |
| --- | --- | --- |
| R-1 | プロトタイプ整合 | `docs/00-getting-started-manual/claude-design-prototype/` の primitives / tokens / rhythm に整合している。新規 primitive を生やしていない |
| R-2 | OKLch token 整合 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を含まず、`var(--ubm-color-*)` のみで色を表現している。CI gate `verify-design-tokens` を pass する設計 |
| R-3 | 既存 API endpoint 不変 | `/admin/tags` page の `focusMemberId` searchParam 既実装を改修していない。新規 API endpoint を追加していない |
| R-4 | accessibility | `aria-label`, `focus-visible` outline, keyboard Tab→Enter 操作が両 link で担保されている |
| R-5 | encodeURIComponent 徹底 | `memberId` の URL embed 全てで `encodeURIComponent()` を通している。特殊文字 test case が test-strategy.md に含まれる |
| R-6 | test suffix 不変条件 | 新規 test ファイル名が `*.spec.{ts,tsx}` のみ。`*.test.*` を含まない |
| R-7 | 既存 admin smoke 回帰 | admin 9 routes が全 open 可能であり、新 link assertion が既存 smoke を破壊しない設計になっている |

## 主要レビュー項目（変更対象ファイル別）

### `apps/web/src/components/layout/AdminSidebar.tsx`

- [ ] `<nav>` 直下に `<Link href="/" aria-label="ホームに戻る">` が追加されている
- [ ] className は OKLch CSS var (`--ubm-color-accent`, `--ubm-color-accent`) のみ使用
- [ ] HEX / arbitrary color 値を含まない
- [ ] 既存 nav items の構造を破壊しない（ul / li の order と styling を維持）
- [ ] focus-visible outline が token 経由で設定されている
- [ ] aria-label が日本語で意図明確（「ホームに戻る」）

### `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`

- [ ] drawer content 最下部に `border-t border-[var(--ubm-color-border-default)] pt-4 mt-4` section が追加されている
- [ ] section 内に `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>` が配置されている
- [ ] link text は「タグ管理へ」固定
- [ ] `MemberDrawerProps` 型シグネチャは不変
- [ ] 明示的 `onClose()` 呼び出しを link に紐付けない（page transition で自動 unmount）
- [ ] HEX / arbitrary color 値を含まない

### `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx`（既存編集）

- [ ] ファイル名が `.spec.tsx` suffix
- [ ] T-A1〜T-A5 の 5 ケースが網羅されている
- [ ] focus-visible class assertion が含まれる
- [ ] snapshot test を含む

### `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx`（新規）

- [ ] ファイル名が `.spec.tsx` suffix
- [ ] T-D1〜T-D6 の 6 ケースが網羅されている
- [ ] 特殊文字 memberId (`abc@example/test 01`) の encode case が必須含まれる
- [ ] expected encoded href が `abc%40example%2Ftest%2001` で assertion

### `apps/web/playwright/tests/admin-pages.spec.ts`（編集）

- [ ] admin 9 routes 全 open assertion が回帰している
- [ ] members → drawer → tags link 動線が T-S2〜T-S4 で assertion 追加
- [ ] sidebar logo クリック → `/` 遷移が T-S5 で assertion 追加
- [ ] 既存 smoke assertion を破壊しない（追加のみ）

### `apps/web/app/(admin)/admin/tags/page.tsx`

- [ ] 改修なし（参照のみ）
- [ ] `focusMemberId = sp["memberId"]` 既実装を Phase 2 で確認済み

## レビュー実行手順

1. Phase 2 で作成された `outputs/phase-02/` 配下 3 ファイル全てを読み込む
2. 各観点 R-1〜R-7 に対し PASS / FAIL / CONDITIONAL を判定
3. 変更対象ファイル別レビュー項目を全てチェック
4. `outputs/phase-03/design-review.md` に判定結果を以下構造で記録:
   - 観点別判定表（R-1〜R-7）
   - ファイル別チェック結果
   - CONDITIONAL の解消条件 / NO-GO の場合の差し戻し事項
   - 最終 GO / NO-GO 判定
5. NO-GO 時は Phase 2 へ差し戻し、解消後再レビュー

## DoD（Phase 3 完了条件）

- [ ] `outputs/phase-03/design-review.md` が作成されている
- [ ] R-1〜R-7 観点別判定が全て記録されている
- [ ] 変更対象ファイル別レビュー項目に対する判定根拠が記載されている
- [ ] 最終 GO / NO-GO 判定が結論として明示されている
- [ ] AC-6（設計レビュー結果記録）が満たされている

## ローカル実行・検証コマンド

```bash
# Phase 02 成果物の存在確認
ls docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-02/

# 参照整合性チェック（手動）
grep -r "parallel-01-navigation" docs/30-workflows/parallel-01-navigation-admin-wayfinding/

# 設計時点での token 整合 dry-run（grep gate イメージ）
grep -rE "(bg|text|border)-\[#[0-9a-fA-F]" docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-02/ || echo "PASS: no HEX literal in design docs"
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | レビュー対象 Phase |
| 必須 | outputs/phase-02/admin-sidebar-logo-design.md | R-1, R-2, R-4 評価対象 |
| 必須 | outputs/phase-02/member-drawer-tag-link-design.md | R-1, R-2, R-3, R-4, R-5 評価対象 |
| 必須 | outputs/phase-02/test-strategy.md | R-5, R-6, R-7 評価対象 |
| 必須 | index.md | AC-6 紐付け |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/ | プロトタイプ正本（R-1） |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | token 正本（R-2） |
| 必須 | CLAUDE.md | test suffix 不変条件（R-6） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー結果（AC-6） |

## 次 Phase

- 次: 4 (タスク分解)
- 引き継ぎ事項: GO 判定の場合は Phase 4 タスク分解着手可。NO-GO の場合は差し戻し事項を Phase 2 に返却
- ブロック条件: `outputs/phase-03/design-review.md` 未作成、または GO/NO-GO 判定未記載の場合は Phase 4 へ進まない

---

**作成日**: 2026-05-15

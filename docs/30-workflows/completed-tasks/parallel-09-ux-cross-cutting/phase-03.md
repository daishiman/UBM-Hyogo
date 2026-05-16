# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 で設計したコード変更 (新規 primitive 4 + 編集 3) の GO/NO-GO 判定を行うレビュー Phase。判定結果は後続 Phase 4 以降の実装着手条件となる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解 / 後続サイクル) |
| 状態 | pending |

## 目的

Phase 2 設計成果物 9 件 (`g9-1-form-validation-design.md` 〜 `g9-9-form-state-preserve-design.md`) に対し、以下 9 軸で GO / NO-GO 判定を行い、`outputs/phase-03/design-review.md` に判定根拠を記録する (AC-10)。

## レビュー観点

| # | 観点 | 判定基準 |
| --- | --- | --- |
| R-1 | OKLch token 正本遵守 | 全 9 設計が `apps/web/src/styles/tokens.css` 既存 token のみ参照し、HEX 直書き / `bg-[#xxx]` 等が一切含まれない |
| R-2 | 既存 EmptyState 後方互換 | g9-2 設計が既存 caller (`<EmptyState>テキスト</EmptyState>` 形式) を破壊しない |
| R-3 | parallel-03 との `@layer components` 共存 | g9-1 / g9-6 / g9-7 全てが section コメント (`/* === parallel-09 G9-x === */`) で規則を分離し、parallel-03 と物理的行範囲を分けている |
| R-4 | a11y 要件 | FormField の `aria-invalid` / `aria-describedby`、Breadcrumb の `nav[aria-label="breadcrumb"]` + `aria-current="page"`、Icon の装飾用途 `aria-hidden`、Pagination の `nav[aria-label="pagination"]` が全て設計に含まれる |
| R-5 | concurrent mutation guard の妥当性 | g9-8 が同一 hook instance 内 ongoing mutation 中のみ 2nd call を拒否し、user の意図的再送信 (例: error 後の再 submit) を阻害しない設計になっている |
| R-6 | form state preserve の妥当性 | g9-9 が hook 側で form state に触れず、caller side で `form.reset()` 制御権を保持する設計になっている |
| R-7 | API 不変条件 | 全 9 設計が `apps/api/src/routes/` 配下に変更を加えず、D1 直接アクセスを行わない |
| R-8 | 新規 test 命名規約 | 全テストファイルが `*.spec.{ts,tsx}` 命名 (`*.test.{ts,tsx}` 不使用) |
| R-9 | 後続 spec への primitive 提供完備 | parallel-01〜08 の各 spec が必要とする primitive (FormField / Pagination / Breadcrumb / Icon / EmptyState / useAdminMutation) が全て本 task の Phase 02 で設計されている |

## 主要レビュー項目（変更対象ファイル別）

### `apps/web/src/components/ui/FormField.tsx` (G9-1)

- [ ] `FormFieldProps` の 4 props (name/label/error/children) が必須/optional 区分付きで明確
- [ ] `React.cloneElement` による children への aria 属性注入が記載されている
- [ ] error helper text が `<span id="{name}-error" role="alert">` で render される
- [ ] CSS は OKLch token 経由 (`var(--ubm-color-danger)` 等)
- [ ] jest-axe による違反 0 確認テストが含まれる

### `apps/web/src/components/ui/EmptyState.tsx` (G9-2)

- [ ] 既存 props が破壊されていない (children only 形式の後方互換)
- [ ] 拡張 props 4 件 (icon/title/description/action) が全て optional
- [ ] 後方互換テスト (既存 caller 形式) が `__tests__/EmptyState.spec.tsx` に明記
- [ ] 既存 caller の grep 結果が Phase 02 設計に転記されている

### `apps/web/src/components/ui/Pagination.tsx` (G9-3)

- [ ] `PaginationProps` の 7 props (current/total?/pageSize?/hasNext/hasPrev/onNext/onPrev) が確定
- [ ] `total` 未提供時の cursor-only 挙動 (meta 省略) が明示されている
- [ ] `<nav aria-label="pagination">` で wrap
- [ ] disabled button の visual 仕様 (opacity 0.5) が CSS or className で定義

### `apps/web/src/components/ui/Icon.tsx` (G9-4)

- [ ] `IconSize` 4 値 (sm/md/lg/xl) と px マッピング (12/16/20/24) が確定
- [ ] `aria-label` 未指定時の `aria-hidden="true"` 自動付与ロジックが記載
- [ ] 既存 `icons.ts` (もしくは相当ファイル) との責務分離が明確 (Icon.tsx は size wrapper のみ)
- [ ] サイズ規約 (sm: button inline / md: nav / lg: stat card / xl: hero) が記載

### `apps/web/src/components/admin/Breadcrumb.tsx` (G9-5)

- [ ] `nav[aria-label="breadcrumb"]` + `<ol>` 構造が確定
- [ ] 最終項目 (href なし) に `aria-current="page"` 付与
- [ ] separator "/" は `aria-hidden="true"` で render
- [ ] CSS は OKLch token (`var(--ubm-color-accent)` / `var(--ubm-color-text-secondary)`) を使用

### `apps/web/src/styles/globals.css` (G9-1/6/7)

- [ ] `@layer components` 内に section コメント (`/* === parallel-09 G9-1 === */` 等) で分離
- [ ] `:focus-visible` 規則は既存定義との重複時に上書きしない方針が明示
- [ ] `@media (prefers-reduced-motion: reduce)` 規則が追加されている
- [ ] G9-6 mobile responsive は Tailwind utility で吸収する原則が示されている

### `apps/web/src/lib/useAdminMutation.ts` (G9-8/9)

- [ ] 既存シグネチャ互換が確認されている (Phase 01 grep 結果との照合)
- [ ] `isLoading` ガードによる 2nd call 拒否ロジックが明示
- [ ] 2nd call 時の戻り値が `Promise<undefined>` で caller が判別可能
- [ ] form state は hook 側で触らず onError callback のみ invoke する規約
- [ ] toast (`既に保存中です`) 出力が含まれる

### テストファイル群

- [ ] 全 6 ファイル (`*.spec.{ts,tsx}`) が `__tests__/` 配下に配置されている
- [ ] `*.test.{ts,tsx}` 命名が含まれていない (CLAUDE.md 不変条件 8 遵守)
- [ ] jest-axe テストが FormField / Breadcrumb / Pagination / Icon の 4 primitive で実施される

## レビュー実行手順

1. Phase 2 で作成された `outputs/phase-02/` 配下 9 ファイル全てを読み込む
2. 各観点 R-1〜R-9 に対し PASS / FAIL / CONDITIONAL を判定
3. 変更対象ファイル別レビュー項目を全てチェック
4. parallel-03 (`@layer components` 同時編集 spec) の現状仕様を読み込み、共存可能か確認
5. `outputs/phase-03/design-review.md` に判定結果を以下構造で記録:
   - 観点別判定表 (R-1〜R-9)
   - ファイル別チェック結果
   - parallel-03 との競合解消方針確定
   - CONDITIONAL の解消条件 / NO-GO の場合の差し戻し事項
   - 最終 GO / NO-GO 判定
6. NO-GO 時は Phase 2 へ差し戻し、解消後再レビュー
7. GO 時は parallel-01〜08 各 spec へ「primitive 利用可能」のシグナルを出す (Phase 12 で `unassigned-task-detection.md` に記録)

## DoD (Phase 3 完了条件)

- [ ] `outputs/phase-03/design-review.md` が作成されている
- [ ] R-1〜R-9 観点別判定が全て記録されている
- [ ] 変更対象ファイル別レビュー項目に対する判定根拠が記載されている
- [ ] parallel-03 との `@layer components` 共存可否が明確に判定されている
- [ ] 最終 GO / NO-GO 判定が結論として明示されている
- [ ] AC-10 (設計レビュー結果記録) が満たされている
- [ ] GO 判定の場合、Phase 4 以降 (タスク分解 / 実装計画 / 実装) への引き継ぎ事項が明記

## ローカル実行・検証コマンド

```bash
# Phase 02 成果物の存在確認 (9 ファイル)
ls docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-02/ | wc -l    # 期待値: 9

# parallel-03 spec の現状確認 (`@layer components` 編集箇所)
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/ | grep parallel-03

# 既存 token の存在確認 (Phase 02 設計が依存する token がすべて tokens.css にあるか)
grep -E '^\s*--ubm-(color|spacing|text|ease)-' apps/web/src/styles/tokens.css

# 既存 EmptyState caller 数 (G9-2 後方互換 影響範囲)
grep -rn 'from .*EmptyState\|import.*EmptyState' apps/web/src

# 既存 useAdminMutation caller 数 (G9-8/9 影響範囲)
grep -rn 'useAdminMutation' apps/web/src

# 参照整合性
grep -rn "parallel-09-ux-cross-cutting" docs/30-workflows/parallel-09-ux-cross-cutting/

# 型 / lint で本 Phase 設計の構造的不整合がないか先行確認 (実装は Phase 4 以降)
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | レビュー対象 Phase |
| 必須 | outputs/phase-02/g9-1-form-validation-design.md | R-1, R-3, R-4 評価対象 |
| 必須 | outputs/phase-02/g9-2-empty-state-design.md | R-2 評価対象 |
| 必須 | outputs/phase-02/g9-3-pagination-design.md | R-1, R-4 評価対象 |
| 必須 | outputs/phase-02/g9-4-icon-size-design.md | R-1, R-4 評価対象 |
| 必須 | outputs/phase-02/g9-5-breadcrumb-design.md | R-1, R-4 評価対象 |
| 必須 | outputs/phase-02/g9-6-mobile-responsive-design.md | R-3 評価対象 |
| 必須 | outputs/phase-02/g9-7-focus-visible-design.md | R-3, R-4 評価対象 |
| 必須 | outputs/phase-02/g9-8-mutation-guard-design.md | R-5, R-7 評価対象 |
| 必須 | outputs/phase-02/g9-9-form-state-preserve-design.md | R-6, R-7 評価対象 |
| 必須 | index.md | AC-10 紐付け |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-* | `@layer components` 同時編集 spec |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー結果 (AC-10) |

## 次 Phase

- 次: 4 (タスク分解 / 後続実装サイクル)
- 引き継ぎ事項:
  - GO 判定の場合: Phase 4 以降の実装着手可。primitive 利用可能のシグナルを parallel-01〜08 各 spec へ通知 (Phase 12 で `unassigned-task-detection.md` に記録)
  - NO-GO の場合: 差し戻し事項を Phase 2 に返却し、該当 g9-* design を再設計
  - CONDITIONAL の場合: 解消条件をリスト化し、Phase 4 タスク分解の入力に含める
- ブロック条件: `outputs/phase-03/design-review.md` 未作成、または GO/NO-GO 判定未記載の場合は Phase 4 へ進まない

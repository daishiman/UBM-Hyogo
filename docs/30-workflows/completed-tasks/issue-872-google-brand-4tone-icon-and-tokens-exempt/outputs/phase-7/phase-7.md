**[実装区分: 実装仕様書]**

# Phase 7: カバレッジ確認 / 変更行の保護

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 6 テスト拡充 |
| 出力 | 本ファイル |

## 1. カバレッジ対象範囲（局所限定）

本タスクは小規模実装のため、coverage 目標を **「変更行に限定」** する（広域指定は意図がぼやけるため不採用 / [Feedback BEFORE-QUIT-002] 対応）。

| 対象 | 範囲 |
|---|---|
| `scripts/verify-design-tokens.ts` | `DEFAULTS.brandIconExemptPaths` 定義行 + `scanForbiddenColorLiterals()` 内 exempt 判定追加行 |
| `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` | `GoogleBrandIcon` function 全体（size 分岐 / SVG asset wrapper） |

対象外:

- `apps/web/src/components/ui/Icon.tsx`（`case "google":` 削除のみ。削除行は coverage 計測対象でない）
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx`（既存 component test または Playwright で間接検証）

## 2. カバレッジ目標

| 対象 | line | branch |
|---|---|---|
| `scripts/verify-design-tokens.ts` 変更行 | 100% | 100%（exempt true / false の両分岐） |
| `GoogleBrandIcon.tsx` | 100% | size 3 値のうち少なくとも `md`（default）と `sm`（非 default）の 2 経路 |

## 3. カバレッジ実測コマンド

```bash
# scripts/verify-design-tokens.ts の局所カバレッジ
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts --coverage

# GoogleBrandIcon component test（存在する場合）
mise exec -- pnpm vitest run apps/web/src/components/ui/brand-icons --coverage
```

## 4. カバレッジ証跡記録

実装フェーズ完了時に以下の項目を記録:

| 観点 | 実測値（実装時記入） |
|---|---|
| `brandIconExemptPaths` 定義行の line coverage | 100%（期待） |
| exempt 判定の `if (isBrandIconExempt) continue;` 分岐 | true 経路 / false 経路ともに到達 |
| `GoogleBrandIcon` の `SIZE_PX[size]` lookup | `md`（default）+ 少なくとも 1 つの非 default |

## 5. exclusion 設定確認

`apps/web/src/components/ui/brand-icons/google.svg` は coverage 計測対象外（SVG asset / 非 JS）。

## 6. Phase 7 完了条件

- [x] カバレッジ対象を変更行に局所化
- [x] 目標 line / branch を定義
- [x] 実測コマンドを提示
- [x] 証跡記録テンプレートを提示

## 7. 次 Phase への引き継ぎ

Phase 8 では `Icon.tsx` から `case "google":` を削除した後の switch 構造を整理し、`IconName` union のソート / dead code 残存確認を行う。

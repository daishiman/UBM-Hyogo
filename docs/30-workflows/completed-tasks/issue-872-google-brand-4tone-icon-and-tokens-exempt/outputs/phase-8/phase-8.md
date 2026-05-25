**[実装区分: 実装仕様書]**

# Phase 8: リファクタリング / dead code 確認 / 構造整理

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 5 実装 / Phase 6-7 テスト |
| 出力 | 本ファイル |

## 1. リファクタリング項目

| 対象 | Before | After | 理由 |
|---|---|---|---|
| `apps/web/src/components/ui/Icon.tsx` switch | `case "google":` ブロック L113-121 が存在 | 該当 case を削除し switch を圧縮 | `IconName` union から `"google"` を削除したため switch case は dead code |
| `apps/web/src/components/ui/icons.ts` の `IconName` union | `\| "google"` を含む 12 件 | 11 件 + アルファベット順整列確認 | union の語彙整理 |
| `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` の import | `import { Icon } from ...` が残存 | 不要 import を削除 | dead import |
| `apps/web/src/components/ui/Icon.tsx` の import / helper | `case "google":` 専用 helper があれば削除 | – | dead helper（Phase 5 で `case "google":` を削除した時点で同時に整理） |

## 2. dead code / dead import 確認コマンド

```bash
# Icon "google" の残存参照
grep -rn 'name="google"' apps/web                                     # 期待: 0
grep -rn "name='google'" apps/web                                     # 期待: 0
grep -n '"google"' apps/web/src/components/ui/icons.ts                # 期待: 0
grep -n 'case "google"' apps/web/src/components/ui/Icon.tsx           # 期待: 0

# GoogleOAuthButton の dead import
grep -n 'from "@/components/ui/Icon"' apps/web/app/login/_components/GoogleOAuthButton.client.tsx  # 期待: 0
```

## 3. switch 構造の整理基準

`Icon.tsx` の `iconGlyph(name)` switch は **`IconName` union と 1:1 対応** を維持する。

| union | switch case | 整合 |
|---|---|---|
| 11 件（`"google"` 削除後） | 11 case + default | ✅ |

整合が崩れた場合は typecheck が `Switch is not exhaustive` で fail する設計を維持する。

## 4. `IconName` union のソート

可読性のためアルファベット順で確認:

```ts
export type IconName =
  | "arrow-left"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "external-link"
  | "inbox"
  | "menu"
  | "search"
  | "send"
  | "x";
```

> 上記は親 workflow `login-page-prototype-alignment` 完了後の想定。実コードの現状（12 件）から `"google"` を削除し、残り 11 件を維持する。

## 5. 重複 / navigation drift の削減

| 項目 | 確認 |
|---|---|
| Google アイコンの定義箇所 | `apps/web/src/components/ui/brand-icons/google.svg` と `GoogleBrandIcon.tsx` の 2 箇所のみ。`Icon.tsx` には残さない |
| icon import の経路 | login の `GoogleOAuthButton` のみが `GoogleBrandIcon` を import。他経路ゼロ |
| brand 色 HEX | `google.svg` の 1 箇所のみ。`GoogleBrandIcon.tsx` を含む `.tsx` / `.ts` / `.css` / nested SVG は禁止（verify gate で検出） |

## 6. Phase 8 完了条件

- [x] リファクタ対象を Before / After / 理由テーブルで明示
- [x] dead code / dead import 確認コマンドを提示
- [x] switch 構造の整合基準を確定
- [x] `IconName` union のソート確認手順を提示

## 7. 次 Phase への引き継ぎ

Phase 9 では typecheck / lint / build / verify-design-tokens / vitest / Playwright visual を順に実行し、すべて PASS することを Gate-B 判定の根拠とする。

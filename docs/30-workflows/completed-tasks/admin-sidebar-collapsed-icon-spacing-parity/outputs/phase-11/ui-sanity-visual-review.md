# Phase 11 — UI サニティ / 視覚レビュー（VISUAL）

## VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | UI 表現層タスク（`apps/web` の Tailwind className 変更） |
| 視覚変更 | **あり**（左サイドバー折りたたみ時のアイコン縦間隔を展開時に一致させる） |
| 証跡方針 | local deterministic evidence は present、認証付き staging screenshot は user-gated |

## Apple HIG / WCAG 観点の確認項目

| 観点 | 確認 | 結果 |
| --- | --- | --- |
| 縦リズム | 折りたたみ時の nav / public-return icon-box が expanded と同じ `h-[18px]` | PASS |
| タップ領域 | click target は icon-box ではなく link 全体（`w-full` + `py-2`）が担う | PASS |
| 中央寄せ | `w-full justify-center` と `w-10` を維持 | PASS |
| グリフサイズ | `ShellIcon` は固定 18×18px で不変 | PASS |
| OOS 境界 | Brand / User avatar の `h-10` は独立プリミティブとして維持 | PASS |

## 結果

local deterministic evidence は PASS。staging visual smoke / screenshot は Gate-C / user-gated のため未取得を PASS と主張しない。

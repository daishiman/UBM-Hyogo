# Phase 11 — 手動テストレポート（受入条件 AC-1〜AC-7）

本タスクは VISUAL（視覚変更あり）。local deterministic evidence は PASS、認証付き staging screenshot は user-gated。

| AC | 内容 | 確認方法 | 結果 |
| --- | --- | --- | --- |
| AC-1 | 折りたたみピッチ == 展開ピッチ | nav icon-box が collapsed / expanded とも `h-[18px]` | PASS |
| AC-2 | グリフサイズ不変 | `ShellIcon` SVG 固定 18×18px、container 高さのみ変更 | PASS |
| AC-3 | 中央寄せ維持 | collapsed link の `w-full justify-center` + icon-box `w-10` | PASS |
| AC-4 | a11y・DOM 構造不変 | `SidebarNavItem.spec.tsx` / `SidebarShell.spec.tsx` | PASS |
| AC-5 | 公開サイトに戻るリンク統一 | public-return icon-box `h-[18px] w-10` | PASS |
| AC-6 | apps/api 差分 0 | `git diff --stat -- apps/api` | PASS |
| AC-7 | web vitest 回帰なし + 追加テスト PASS | focused Vitest 2 files / 20 tests | PASS |

staging screenshot 取得後は capture metadata の `status` を `local_pass_staging_visual_captured`、
`captured` フラグを `true` に更新する。

# 受入基準

正本は [SSOT §5](../shared-context.md)。

| ID | 受入条件 | 検証方法 |
| -- | -------- | -------- |
| AC-1 | 375/414/640px でカード表示・横はみ出しゼロ | Playwright `scrollWidth <= clientWidth + 1` |
| AC-2 | カードに全項目ラベル付き可視 | `data-label` の `::before` 表示 / 視覚確認 |
| AC-3 | モバイルで公開トグル・編集ボタン操作可能 | 視覚確認 / Playwright |
| AC-4 | デスクトップ（≥641px）現行テーブル完全維持 | 1280px 視覚確認 + DOM diff |
| AC-5 | MembersTable.tsx は属性追加のみ・機械可読id/順序不変 | `git diff` |
| AC-6 | globals.css は OKLch トークン経由のみ | design-token gate |
| AC-7 | 既存 TC-MT-01〜20 緑 + 追加 TC-MT-21〜24 緑 | vitest |
| AC-8 | apps/api / migration / Form 差分ゼロ | `git diff dev...HEAD -- apps/api` |
| AC-9 | typecheck / lint / vitest 緑 | コマンド実行 |

# Phase 8: リファクタリング

## メタ情報

| 項目   | 値                              |
| ------ | ------------------------------- |
| Phase  | 8 / 13（リファクタリング）      |
| 依存   | Phase 7                         |
| 成果物 | outputs/phase-8/phase-8.md      |

## 目的

実装で生じた差分を整理し、重複 / navigation drift がないこと、責務分離が明確であることを記録する。

## 実行タスク

- [x] Before/After を対象ごとに表で記述する
- [x] 重複 / drift がないことを確認する

## Before/After 一覧

| 対象                                 | Before                                                | After                                                | 理由                                                              |
| ------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `PublicHeader.tsx` auth CTA          | `<a href="/login" data-role="auth-cta">`              | 三項で `/profile` (auth) / `/login` (anon) + `data-state`  | session 認識を CSS / 観測可能にする                              |
| `PublicHeader.tsx` nav               | 固定 3 リンク                                         | ログイン中のみ 4 リンク目（マイページ）を追加        | プロトタイプ動線と一致                                            |
| `(public)/layout.tsx`                | `<PublicHeader />` 直呼び                             | `<SessionAwarePublicHeader />`                       | session 解決責務を wrapper に分離                                 |
| `app/page.tsx`                       | `<PublicHeader />` 直呼び                             | `<SessionAwarePublicHeader />`                       | HomePage は `(public)` group 外。個別配線が必要                   |
| `(public)/layout.spec.tsx`           | 直 render                                             | `vi.mock` で async wrapper を sync 化                | RTL が async server component を扱えない問題への対処              |

## drift / 重複

なし。新規 1 ファイル + 既存差分のみ。

## 参照資料

- `outputs/phase-5/phase-5.md`

## 成果物

- `outputs/phase-8/phase-8.md`（本書）

## 完了条件

- [x] Before/After 5 件を明示
- [x] drift / 重複なしを確認

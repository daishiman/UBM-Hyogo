# Visual Snapshot Status — issue-883 adapter-dev-warn-unknown-kind

## 判定

PASS / NON_VISUAL。

## 根拠

- 実装差分は `toMemberDetailProps` の callback propagation、page.tsx の development-only `console.warn` 注入、adapter spec 追加に限定。
- JSX render tree / CSS / visual baseline は変更していない。
- スクリーンショット撮影は NON_VISUAL のため不要。

## 実行コマンド

```bash
git status --short -- apps/web/playwright/tests/visual-full 'apps/web/app/(public)/members/[id]' apps/web/src/components/public
```

## 実測結果

実行日時: 2026-05-25

```text
 M apps/web/app/(public)/members/[id]/page.tsx
```

`apps/web/playwright/tests/visual-full/` と `apps/web/src/components/public/` には差分なし。page.tsx の差分は dev-only warning callback wiring であり、rendered UI を変更しない。

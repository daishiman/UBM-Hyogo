# Phase 1: 要件定義

## 結論
`apps/web` に Tailwind v4 build pipeline と OKLch tokens bridge を新設する。
- 正本仕様: `docs/00-getting-started-manual/specs/09b-design-tokens.md` §9 JSON
- AC-1〜AC-12 を index.md から継承
- 実装区分: 実装仕様書（コード変更を伴う）

## OKLch tokens inventory（必須 60+）
- surface 4 / text 3 / border 2（= 9）
- accent 3
- status 8（ok/warn/danger/info × base/-soft）
- zone 5（a..e）
- radius 5（sm/md/lg/xl/2xl）
- shadow 4（xs/sm/md/lg）
- font-family 5 / font-size 8
- spacing 10（0/1/2/3/4/6/8/12/16/24）
- duration 3 / easing 4

合計: 9 + 3 + 8 + 5 + 5 + 4 + 5 + 8 + 10 + 3 + 4 = **64 tokens**（>= 60、AC-3 充足）

## スコープ確認
- 含む: tokens.css / globals.css / postcss.config.mjs / tailwind.config.ts 新設、styles.css 撤去、layout.tsx 切替、tokens.test.ts、HEX grep gate
- 含まない: dark mode 値確定、primitives.tsx 化、apps/api 変更、CI gate 本体（task-18）

# Phase 01: 要件定義

state: COMPLETED

## 要件サマリ

- 主成果物: `docs/00-getting-started-manual/specs/09b-design-tokens.md` 新規作成
- 値の出典: `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70
- 命名規則: `--ubm-*` prefix 統一
- 章立て: §1〜§12（位置づけ/命名/color/radius/shadow/typography/spacing/motion/JSON/@theme/dark/履歴）
- 3 テーマ（stone / warm / cool）の全 token 値転記
- Tailwind v4 `@theme inline` 直結テンプレート
- sRGB fallback (`@supports not (color: oklch(...))`) 正本化
- dark mode placeholder（structure のみ）
- zone tokens (a..e) を status tokens の alias として正本化

## 不変条件

- 値はプロトタイプ `styles.css` から literal 転記。決定権は本ファイルに閉じる
- `apps/*` / `packages/*` のコード変更は含まない（task-09 が後続で担当）
- 正本同期成果物（`00-overview.md` link / aiworkflow-requirements indexes / changelog）は同 wave に含める

## AC

phase-01.md と index.md の AC-1〜AC-12 をそのまま受領。

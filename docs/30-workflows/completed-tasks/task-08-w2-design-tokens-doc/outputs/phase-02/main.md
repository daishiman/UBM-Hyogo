# Phase 02: 設計（章立て / 命名規則 / token 集合）

state: COMPLETED

## 章立て設計（§1〜§12）

| § | タイトル | 主要内容 |
| --- | --- | --- |
| 1 | 位置づけ | SSOT 宣言、下流（task-09/10/18）契約 |
| 2 | 命名規則 | `--ubm-*` prefix、theme スコープ（stone/warm/cool）、status/zone alias |
| 3 | Color | OKLch 値表、3 テーマ、status (info/success/warning/danger)、zone (a..e) |
| 4 | Radius | `--ubm-radius-{xs,sm,md,lg,xl,2xl,full}` |
| 5 | Shadow | OKLch 透明度ベース、card/sticky/raised |
| 6 | Typography | font-family / size / weight / line-height / letter-spacing |
| 7 | Spacing | 4px scale、gap/inset/section |
| 8 | Motion | duration / easing |
| 9 | JSON 正本 | Style Dictionary 互換 inline JSON |
| 10 | Tailwind v4 `@theme inline` テンプレート | tokens.css → globals.css 直結手順 |
| 11 | Dark mode placeholder | `[data-theme="dark"]` selector のみ、値未定 |
| 12 | 改訂履歴 | 2026-05-07 初版 |

## token 集合（最低数の見積）

- color: 3 themes × ~20 tokens = 60+
- radius/shadow/typography/spacing/motion: ~25
- 合計 ≥ 60（AC-4 充足）

## 命名規則

- prefix: `--ubm-`（他システムとの衝突回避）
- theme スコープ: `:root[data-theme="stone|warm|cool"]`
- status alias: `--ubm-status-{info,success,warning,danger}-{bg,fg,border}`
- zone alias: `--ubm-zone-{a,b,c,d,e}-*` → status tokens を参照

## 出力契約

- task-09 用: §10 に `tokens.css` / `globals.css` 雛形
- task-10 用: §3.4/§4-§8 が CVA variant の参照源
- task-18 用: §6.2/§6.3 が CI gate の input 契約

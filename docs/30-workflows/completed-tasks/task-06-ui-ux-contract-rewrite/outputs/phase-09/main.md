# Phase 09: 品質保証

## サマリ

a11y 章独立 / OKLch 規則 / 最終 verify の 3 観点で品質を担保。すべて Phase 11 evidence で PASS 確認済み。

## a11y 章独立（§5）

### §5.1 全画面共通

- landmark `<main>` / `<nav>` / `<footer>` 必須
- `<h1>` 1 個原則
- focus-visible 必須
- カラーコントラスト WCAG 2.2 AA 以上（値の正本は 09b）

### §5.2 dialog / drawer

- `role="dialog"` + `aria-modal="true"` 必須
- focus trap（open 時に最初の focusable へ移動 / Tab で内部循環）
- Esc close 必須
- scrim click close 必須
- `aria-labelledby` / `aria-describedby` で title / body を関連付け

### §5.3 form / input

- `<label htmlFor>` ↔ `<input id>` 必須
- hint / error は `aria-describedby` で連携
- `aria-invalid` / `aria-required` を状態に応じて設定
- 必須項目は label に `*` または `(必須)` を視覚的に提示（視覚詳細は 09a）

### §5.4 live region

- `role="status"`（assertive でない通知）
- `role="alert"`（即時通知 / エラー）
- Toast Provider 経由で配信
- 連続発火時は queue で順次提示

## OKLch 規則（§6）

### §6.1 視覚値の決定権は 09b にある

09-ui-ux.md は token 名 prefix のみ参照する。値（HEX / oklch / px）は `09b-design-tokens.md`（task-08）が正本。

### §6.2 OKLch tokens を CSS 変数経由でのみ参照

- HEX 直書き禁止
- `bg-[#xxx]` / `text-[#xxx]` 禁止
- `oklch(...)` 値直書き禁止
- px 値直書き禁止
- CI gate `verify-design-tokens`（task-18）で fail 判定

### §6.3 token prefix 規則（8 種）

| prefix | 用途 |
| --- | --- |
| `--ubm-color-*` | 色 |
| `--ubm-radius-*` | 角丸 |
| `--ubm-shadow-*` | 影 |
| `--ubm-space-*` | 余白 |
| `--ubm-text-*` | typography |
| `--ubm-font-*` | font |
| `--ubm-dur-*` | duration |
| `--ubm-ease-*` | easing |

## 最終 verify 結果

| Suite | 結果 | evidence |
| --- | :---: | --- |
| grep gate（HEX/oklch/px/`bg-[`/`text-[`） | PASS（0 件） | `outputs/phase-11/evidence/grep-gate.log` |
| structure check（H2=10 / `### 2.`=20 / `### 3.1.`=13） | PASS | `outputs/phase-11/evidence/structure-check.log` |
| markdown lint | PASS（exit 0） | `outputs/phase-11/evidence/markdown-lint.log` |
| trace check（routes / primitives / a11y / token / 不採用） | PASS | `outputs/phase-11/evidence/trace-check.log` |

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | a11y 章独立確認（§5.1〜§5.4） | completed |
| 2 | OKLch 規則記述（§6.1〜§6.3） | completed |
| 3 | grep gate 最終確認 | completed |
| 4 | structure / lint / trace 最終確認 | completed |

## 次 Phase

Phase 10（最終レビュー / GO 判定）へ。

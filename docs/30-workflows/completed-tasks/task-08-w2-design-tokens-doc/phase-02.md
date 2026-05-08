# Phase 2: 設計

実装区分: ドキュメントのみ仕様書

## 成果物の構造設計

`docs/00-getting-started-manual/specs/09b-design-tokens.md` の章立てを以下に確定する（目標 380〜540 行）。

```
1. 位置づけ
   1.1 本ファイルが正本である範囲（色 / 余白 / radius / shadow / typography / motion）
   1.2 「契約」は 09-ui-ux.md、「mapping」は 09a。本ファイルは「値」のみ。
2. 命名規則
   2.1 prefix `--ubm-*`
   2.2 階層 (semantic / role / state)
   2.3 dark mode placeholder 規約
3. color tokens (OKLch)
   3.1 surface (bg / panel / border / text)
   3.2 accent / ok / warn / danger / info（テキスト用 -ink variant 規範）
   3.3 zone tokens (a..e) — MVP は status alias
   3.4 3 テーマ (stone / warm / cool) 値表
       3.4.1 stone（既定）
       3.4.2 warm
       3.4.3 cool
   3.5 sRGB fallback 戦略
4. radius tokens
5. shadow tokens
6. typography tokens (font-family / size / weight / line-height / letter-spacing)
7. spacing tokens (4px base, 0..24)
8. motion tokens (duration / easing)
9. JSON 表現 (design-tokens.json) — Style Dictionary 互換 flat 構造
10. Tailwind v4 `@theme inline` 直結ガイド
11. dark mode 拡張余地（placeholder のみ）
12. 改訂履歴
```

## 命名規則表（§2 確定版）

| 種別 | prefix | 例 |
| --- | --- | --- |
| 色（surface） | `--ubm-color-surface-*` | `--ubm-color-surface-bg` / `--ubm-color-surface-panel` |
| 色（text） | `--ubm-color-text-*` | `--ubm-color-text-primary` / `--ubm-color-text-muted` |
| 色（border） | `--ubm-color-border-*` | `--ubm-color-border-default` / `--ubm-color-border-strong` |
| 色（accent / status） | `--ubm-color-{accent\|ok\|warn\|danger\|info}[-soft\|-ink]` | `--ubm-color-accent-soft` |
| 色（zone） | `--ubm-color-zone-{a\|b\|c\|d\|e}` | `--ubm-color-zone-a` |
| radius | `--ubm-radius-{sm\|md\|lg\|xl\|2xl}` | `--ubm-radius-md` |
| shadow | `--ubm-shadow-{xs\|sm\|md\|lg}` | `--ubm-shadow-md` |
| font-family | `--ubm-font-{jp\|en\|serif\|mono\|body}` | `--ubm-font-body` |
| font-size | `--ubm-text-{xs\|sm\|base\|md\|lg\|xl\|2xl\|3xl}` | `--ubm-text-base` |
| spacing | `--ubm-space-{0\|1\|2\|3\|4\|6\|8\|12\|16\|24}` | `--ubm-space-4` |
| duration | `--ubm-dur-{fast\|base\|slow}` | `--ubm-dur-base` |
| easing | `--ubm-ease-{standard\|emphasized\|decelerate\|accelerate}` | `--ubm-ease-standard` |

## 旧 token 互換 mapping（09c 接続）

既存 `09c-primitives.md` には `--ubm-bg` / `--ubm-text-2` / `--ubm-accent` などの短縮 token が残る。`09b-design-tokens.md` には以下の互換 mapping を必須掲載し、task-10 実装時は短縮名を正本名へ置換する。

| 旧 token | 正本 token |
| --- | --- |
| `--ubm-bg` / `--ubm-color-bg` | `--ubm-color-surface-bg` |
| `--ubm-bg-2` / `--ubm-color-surface-2` | `--ubm-color-surface-bg-2` |
| `--ubm-text` / `--ubm-color-ink` | `--ubm-color-text-primary` |
| `--ubm-text-2` / `--ubm-color-muted` | `--ubm-color-text-secondary` |
| `--ubm-text-3` / `--ubm-color-fg-muted` | `--ubm-color-text-muted` |
| `--ubm-border` | `--ubm-color-border-default` |
| `--ubm-border-2` | `--ubm-color-border-strong` |
| `--ubm-accent` | `--ubm-color-accent` |
| `--ubm-accent-soft` | `--ubm-color-accent-soft` |
| `--ubm-accent-ink` | `--ubm-color-accent-ink` |

## 必須 token 集合（最小 60 個 / 目標 65 個）

| カテゴリ | 個数 | 詳細 |
| --- | --- | --- |
| color: surface | 4 | bg / bg-2 / panel / panel-2 |
| color: text | 3 | primary / secondary / muted |
| color: border | 2 | default / strong |
| color: accent | 3 | base / soft / ink |
| color: status | 8 | ok, ok-soft, warn, warn-soft, danger, danger-soft, info, info-soft |
| color: zone | 5 | a, b, c, d, e |
| color: stone overrides | 0 | （既定値が `:root`） |
| color: warm overrides | 約 12 | surface 6 + text 3 + accent 3 |
| color: cool overrides | 約 12 | 同上 |
| radius | 5 | sm, md, lg, xl, 2xl |
| shadow | 4 | xs, sm, md, lg |
| font-family | 5 | jp, en, serif, body, mono |
| font-size | 8 | xs, sm, base, md, lg, xl, 2xl, 3xl |
| spacing | 10 | 0, 1, 2, 3, 4, 6, 8, 12, 16, 24 |
| duration | 3 | fast, base, slow |
| easing | 4 | standard, emphasized, decelerate, accelerate |
| **`:root` での宣言数（warm / cool 上書きを除く）** | **65** | 60+ 保証 |

## 出典マッピング表（§3.4 値の出典）

`styles.css` 行番号を §3.4.1〜§3.4.3 に転記する際の出典 column として併記する（元仕様 §4.3 の表をそのまま採用）。

## 値の凍結対象（プロトタイプ転記）

元仕様 §4.3〜§4.10 の全値を凍結対象とする。Phase 5 執筆時点で値の改変は禁止。

## 完了条件

- [ ] 章立て §1〜§12 が確定
- [ ] 命名規則表が 12 種以上のカテゴリを網羅
- [ ] 必須 token 集合 60+ 個が表で確認可能
- [ ] 出典マッピング（`styles.css` L番号）が §3.4 全行で識別可能な状態

# Phase 7: AC マトリクス

実装区分: ドキュメントのみ仕様書

## AC × 検証手段マトリクス

| AC | 内容 | 検証手段 | Phase | 期待 |
| --- | --- | --- | --- | --- |
| AC-1 | `09b-design-tokens.md` が 380 行以上で新規作成 | `wc -l` | 9 | `≥ 380` |
| AC-2 | 章立て 12 章 | `grep -c '^## '` | 9 | `= 12` |
| AC-3 | 3 テーマ全 token 値が転記（§3.4.1 / §3.4.2 / §3.4.3） | `grep -E '^### 3\.4\.[123]' \| wc -l` | 9 | `= 3` |
| AC-4 | `--ubm-*` token 数 60+ | `grep -oE '\`--ubm-[a-z0-9-]+\`' \| sort -u \| wc -l` | 9 | `≥ 60` |
| AC-5 | inline JSON が valid | `awk … \| jq .` | 9 | exit 0 |
| AC-6 | sRGB fallback が `@supports not (color: oklch(...))` で記述 | `grep '@supports not (color: oklch'` | 9 | `≥ 1` |
| AC-7 | Tailwind v4 `@theme inline` テンプレート提示 | `grep '@theme inline'` | 9 | `≥ 1` |
| AC-8 | dark mode placeholder 記述 | `grep 'data-theme="dark"'` | 9 | `≥ 1` |
| AC-9 | zone tokens (a..e) が status alias として正本化 | `grep -E '^\| \`--ubm-color-zone-[abcde]\`'` | 9 | `= 5` |
| AC-10 | OKLch 値 cross-check（`styles.css` ↔ 09b 欠落 0） | `cross-check.sh` | 9 | exit 0 |
| AC-11 | markdown lint error 0 | `pnpm lint:md` | 9 | exit 0 |
| AC-12 | diff scope が本タスク範囲のみ | `git diff --name-only main...HEAD` | 13 | 2 patterns のみ |

## 補助 AC（DoD 補足）

| ID | 内容 | 検証 |
| --- | --- | --- |
| AC-D1 | accent / status はテキスト用ではなく面積要素用、テキストは `-ink` variant の規範が §3.2 に記述 | grep |
| AC-D2 | warm/cool で `ok/warn/danger/info` は stone と共通の旨が §3.4 末尾に注記 | grep |
| AC-D3 | §9 / §3.4 / §10 の値乖離 0 | Phase 9 自己 cross-check |
| AC-D4 | HEX 直書きが surface / text / border のみ（accent / status は OKLch / `var()` 参照） | regex grep |
| AC-D5 | `09-ui-ux.md`（task-06 出力予定）/ `09a-prototype-map.md`（task-07 出力予定）と prefix 一致 | task-06 / 07 完成後 cross-check |

## トレーサビリティ（要求 → 章 → 検証）

| 要求 | 章 | 検証 AC |
| --- | --- | --- |
| token 値の凍結 | §3〜§8 | AC-3, AC-10 |
| 命名統一 | §2 | AC-4 |
| Tailwind v4 接続 | §10 | AC-7 |
| 旧ブラウザ対応 | §3.5 | AC-6 |
| dark mode 拡張余地 | §11 | AC-8 |
| 機械可読 JSON | §9 | AC-5 |
| zone 拡張余地 | §3.3 / §4.4 | AC-9 |
| 親 workflow scope 規律 | — | AC-12 |

## 完了条件

- [ ] AC-1〜AC-12 / AC-D1〜AC-D5 の検証手段が確定
- [ ] 各 AC が Phase 9 / Phase 13 のどちらで検証されるか確定
- [ ] トレーサビリティ表で要求漏れがない

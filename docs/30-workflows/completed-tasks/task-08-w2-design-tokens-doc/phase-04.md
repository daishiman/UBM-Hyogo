# Phase 4: 検証戦略

実装区分: ドキュメントのみ仕様書（テスト戦略は markdown 構造検証 + JSON parse + cross-check スクリプトに置換）

## 検証レイヤ

NON_VISUAL かつ docs-only のため、ユニットテスト / 統合テスト / E2E は適用外。代わりに以下 4 レイヤで検証する。

### Layer 1: markdown 構造検証

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 章立て 12 章 | `grep -c '^## ' docs/00-getting-started-manual/specs/09b-design-tokens.md` | `12` |
| 行数 | `wc -l docs/00-getting-started-manual/specs/09b-design-tokens.md` | `≥ 380` |
| 3 テーマ表存在 | `grep -E '^### 3\.4\.[123]' docs/00-getting-started-manual/specs/09b-design-tokens.md \| wc -l` | `3` |
| `--ubm-*` token 数 | `grep -oE '\`--ubm-[a-z0-9-]+\`' docs/00-getting-started-manual/specs/09b-design-tokens.md \| sort -u \| wc -l` | `≥ 60` |
| sRGB fallback 記述 | `grep -c '@supports not (color: oklch' docs/00-getting-started-manual/specs/09b-design-tokens.md` | `≥ 1` |
| `@theme inline` 記述 | `grep -c '@theme inline' docs/00-getting-started-manual/specs/09b-design-tokens.md` | `≥ 1` |
| dark placeholder | `grep -c 'data-theme="dark"' docs/00-getting-started-manual/specs/09b-design-tokens.md` | `≥ 1` |
| markdown lint | `mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09b-design-tokens.md` | exit 0 |

### Layer 2: JSON 健全性

```bash
awk '/^```json$/,/^```$/' docs/00-getting-started-manual/specs/09b-design-tokens.md \
  | sed '1d;$d' \
  | jq . > /dev/null
```

期待: exit 0。`design-tokens.json` inline ブロックが完全な valid JSON。

### Layer 3: 値の出典 cross-check（`styles.css` ↔ 09b）

`outputs/phase-09/cross-check.sh`（Phase 9 で実行）として以下を流す:

```bash
#!/usr/bin/env bash
set -euo pipefail
SRC=docs/00-getting-started-manual/claude-design-prototype/styles.css
DST=docs/00-getting-started-manual/specs/09b-design-tokens.md

# 1. OKLch 値（styles.css L1-L70 の全 OKLch literal）
for v in "0.58 0.10 55" "0.95 0.03 65" "0.38 0.10 55" \
         "0.55 0.10 155" "0.95 0.04 155" \
         "0.62 0.12 75" "0.96 0.05 80" \
         "0.55 0.15 25" "0.95 0.04 30" \
         "0.55 0.09 230" "0.96 0.025 230" \
         "0.62 0.14 50" "0.94 0.05 60" "0.40 0.13 50" \
         "0.52 0.11 240" "0.95 0.03 235" "0.36 0.12 240"; do
  grep -q "oklch($v)" "$SRC" || { echo "MISSING in styles.css: oklch($v)"; exit 1; }
  grep -q "oklch($v)" "$DST" || { echo "MISSING in 09b: oklch($v)"; exit 1; }
done

# 2. HEX 値（styles.css L1-L70 の全 HEX literal）
for h in "#f5f4f1" "#ebe9e3" "#ffffff" "#fafaf8" "#e7e5df" "#d6d3cc" \
         "#1a1917" "#57554e" "#8a877e" \
         "#f7f2ea" "#eee5d5" "#fffcf6" "#fbf6ec" "#ece2d1" "#d8c9b0" \
         "#22180a" "#6b5a42" "#9a8a6e" \
         "#f1f3f5" "#e4e8ec" "#f8fafc" "#e2e5ea" "#cfd5dc" \
         "#0f1720" "#4a5563" "#7c8693"; do
  grep -q "$h" "$SRC" || { echo "MISSING in styles.css: $h"; exit 1; }
  grep -q "$h" "$DST" || { echo "MISSING in 09b: $h"; exit 1; }
done

echo "cross-check OK"
```

### Layer 4: 下流契約 dry-check

task-18 で実装される `verify-design-tokens.ts` の input 契約を §6.3 で文書化し、task-18 仕様書側の依存条件として扱う:

| input | 期待 |
| --- | --- |
| `apps/web/src/**/*.{ts,tsx,css}` | `#[0-9a-fA-F]{3,8}` 直書き 0 件、`bg-[#...]` / `text-[#...]` 直書き 0 件 |
| `apps/web/src/styles/tokens.css` | 09b §10 のテンプレートと完全一致（diff 0） |
| 09b 自体の token 名 | `--ubm-*` prefix で 60+ 個 |

> 本 Phase では Layer 4 は **契約宣言のみ**。実行は task-18 の責務。

## エビデンス保存

NON_VISUAL のため screenshot は適用外。代わりに以下を `outputs/phase-11/evidence/` に保存:

- `markdown-structure.log` （Layer 1 全コマンド出力）
- `json-parse.log` （Layer 2 jq 出力）
- `cross-check.log` （Layer 3 出力）
- `lint-md.log` （markdown lint 出力）

## 完了条件

- [ ] Layer 1〜4 の検証コマンドが定義済み
- [ ] cross-check.sh の値リストが §3.4 全テーマを網羅
- [ ] エビデンス保存先パスが確定

# Phase 9: 品質保証

実装区分: ドキュメントのみ仕様書

## 検証コマンド一括実行

Phase 5 執筆完了後、以下を順次実行する。**全コマンド exit 0 が完了条件**。

```bash
SPEC=docs/00-getting-started-manual/specs/09b-design-tokens.md
SRC=docs/00-getting-started-manual/claude-design-prototype/styles.css
EVIDENCE_DIR=docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-11/evidence
mkdir -p "$EVIDENCE_DIR"

# === Layer 1: markdown 構造 ===
echo "[1] line count" | tee "$EVIDENCE_DIR/markdown-structure.log"
LINES=$(wc -l < "$SPEC"); echo "lines=$LINES" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
[ "$LINES" -ge 380 ] || { echo "FAIL: lines<380"; exit 1; }

echo "[2] chapter count" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
CH=$(grep -c '^## ' "$SPEC"); echo "chapters=$CH" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
[ "$CH" -eq 12 ] || { echo "FAIL: chapters!=12"; exit 1; }

echo "[3] theme tables" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
TH=$(grep -cE '^### 3\.4\.[123]' "$SPEC"); echo "themes=$TH" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
[ "$TH" -eq 3 ] || { echo "FAIL: themes!=3"; exit 1; }

echo "[4] --ubm-* token count" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
TOK=$(grep -oE '`--ubm-[a-z0-9-]+`' "$SPEC" | sort -u | wc -l); echo "tokens=$TOK" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
[ "$TOK" -ge 60 ] || { echo "FAIL: tokens<60"; exit 1; }

echo "[5] @supports not / @theme inline / dark placeholder" | tee -a "$EVIDENCE_DIR/markdown-structure.log"
grep -q '@supports not (color: oklch' "$SPEC" || { echo "FAIL: no @supports not"; exit 1; }
grep -q '@theme inline' "$SPEC" || { echo "FAIL: no @theme inline"; exit 1; }
grep -q 'data-theme="dark"' "$SPEC" || { echo "FAIL: no dark placeholder"; exit 1; }

# === Layer 2: JSON 健全性 ===
awk '/^```json$/,/^```$/' "$SPEC" | sed '1d;$d' | jq . > "$EVIDENCE_DIR/json-parse.log" \
  || { echo "FAIL: invalid JSON"; exit 1; }
echo "JSON parse OK" | tee -a "$EVIDENCE_DIR/json-parse.log"

# === Layer 3: cross-check (styles.css ↔ 09b) ===
{
  for v in "0.58 0.10 55" "0.95 0.03 65" "0.38 0.10 55" \
           "0.55 0.10 155" "0.95 0.04 155" \
           "0.62 0.12 75" "0.96 0.05 80" \
           "0.55 0.15 25" "0.95 0.04 30" \
           "0.55 0.09 230" "0.96 0.025 230" \
           "0.62 0.14 50" "0.94 0.05 60" "0.40 0.13 50" \
           "0.52 0.11 240" "0.95 0.03 235" "0.36 0.12 240"; do
    grep -q "oklch($v)" "$SRC" || { echo "MISSING in styles.css: oklch($v)"; exit 1; }
    grep -q "oklch($v)" "$SPEC" || { echo "MISSING in 09b: oklch($v)"; exit 1; }
  done
  for h in "#f5f4f1" "#ebe9e3" "#ffffff" "#fafaf8" "#e7e5df" "#d6d3cc" \
           "#1a1917" "#57554e" "#8a877e" \
           "#f7f2ea" "#eee5d5" "#fffcf6" "#fbf6ec" "#ece2d1" "#d8c9b0" \
           "#22180a" "#6b5a42" "#9a8a6e" \
           "#f1f3f5" "#e4e8ec" "#f8fafc" "#e2e5ea" "#cfd5dc" \
           "#0f1720" "#4a5563" "#7c8693"; do
    grep -q "$h" "$SRC" || { echo "MISSING in styles.css: $h"; exit 1; }
    grep -q "$h" "$SPEC" || { echo "MISSING in 09b: $h"; exit 1; }
  done
  echo "cross-check OK"
} | tee "$EVIDENCE_DIR/cross-check.log"

# === Layer 4: markdown lint ===
mise exec -- pnpm lint:md "$SPEC" 2>&1 | tee "$EVIDENCE_DIR/lint-md.log" || true
# lint:md が project に未配備の場合は warning に留め、Phase 12 で正本化

echo "Phase 9 PASS"
```

## ゲート判定

| ゲート | 判定 |
| --- | --- |
| Layer 1 全コマンド | exit 0 必須 |
| Layer 2 jq parse | exit 0 必須 |
| Layer 3 cross-check | exit 0 必須 |
| Layer 4 lint:md | command 存在時は exit 0 必須、未配備時は warning OK |

## エビデンス

`outputs/phase-11/evidence/` 配下に以下を保存（Phase 11 で参照）:

- `markdown-structure.log`
- `json-parse.log`
- `cross-check.log`
- `lint-md.log`（条件付き）

## 完了条件

- [ ] Layer 1〜3 全 PASS
- [ ] エビデンス 4 ファイルが `outputs/phase-11/evidence/` に出力
- [ ] AC-1〜AC-11 すべてが PASS

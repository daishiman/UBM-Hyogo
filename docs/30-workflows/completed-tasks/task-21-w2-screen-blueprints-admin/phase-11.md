# Phase 11: 検証（NON_VISUAL evidence）

[実装区分: ドキュメントのみ]
判定根拠: evidence ファイル出力のみ。コード変更なし。`visualEvidence: NON_VISUAL`。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 検証（NON_VISUAL evidence） |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 10（段階的有効化） |
| 次 Phase | 12（ドキュメント整備） |
| 状態 | completed |

## 目的

Phase 10 で pass した 3 gate（lint / 視覚値 / API trace）に加え、AC-1〜9 全件の最終 evidence を `outputs/phase-11/evidence/` に保存する。
本 Phase は NON_VISUAL（スクリーンショット不要）であるため、evidence は全て log ファイル / 構造化 JSON / 行 diff 結果で構成する。

## 主要意思決定

- **決定 1**: evidence は grouped 7 files + `main.md` に集約する。AC-1〜9 は `main.md` の trace table で全件対応付ける。
- **決定 2**: 視覚値 0 件は `visual-grep.log`、API trace は `api-parity.diff`、structure check は `structure.json` に格納。
- **決定 3**: NON_VISUAL である旨を main.md 冒頭に明記し、screenshot 欠落をレビュー時の懸念にしない。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 10 | gate pass 状態 / 4 ログ | evidence base |
| 下流 | Phase 12 | evidence 一式 | implementation-guide で参照 |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| C | `outputs/phase-11/main.md` | NON_VISUAL evidence summary |
| C | `outputs/phase-11/evidence/structure.json` | AC-1/2/3/4/9 件数 |
| C | `outputs/phase-11/evidence/visual-grep.log` | AC-5 視覚値 0 件 |
| C | `outputs/phase-11/evidence/api-parity.diff` | AC-6 API trace |
| C | `outputs/phase-11/evidence/a11y-strings.log` | AC-7 a11y 4 文字列カウント |
| C | `outputs/phase-11/evidence/schema-two-stage.log` | AC-8 二段確認キーワード |
| C | `outputs/phase-11/evidence/lint.log` | markdown lint 結果（再掲） |

## 実行タスク

- 本 Phase の目的に対応する文書作成・検証・記録を実行する。
- 実行結果は `outputs/phase-N/` 配下へ保存し、root `artifacts.json` の該当 Phase status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- 本 Phase の `outputs/phase-N/main.md` または同等の phase evidence。
- 必要に応じた補助ログ・差分・チェック結果。
- root `artifacts.json` の phase status 更新。

## 入力 / 出力

- 入力: refactor 済 09g、Phase 10 ログ
- 出力: 7 evidence ファイル + main.md

## テスト方針

### 11.1 structure.json 出力

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
OUT=docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-11/evidence
mkdir -p "$OUT"
{
  echo "{"
  echo "  \"line_count\": $(wc -l < "$F"),"
  echo "  \"top_sections\": $(grep -cE '^## [0-9]+\. ' "$F"),"
  echo "  \"sidebar_count\": $(grep -c '^## 1\. AdminSidebar' "$F"),"
  echo "  \"sub_sections_2_to_9\": $(grep -cE '^### [2-9]\.[1-8] ' "$F"),"
  echo "  \"derive_notes\": $(grep -c '^> 派生元: phase-3' "$F"),"
  echo "  \"sidebar_refs\": $(grep -c 'Sidebar は §1 を参照' "$F"),"
  echo "  \"mermaid_blocks\": $(grep -c '^\`\`\`mermaid$' "$F"),"
  echo "  \"unadopted_count\": $(awk '/^## 99\. / {flag=1; next} /^## / {flag=0} flag' "$F" | grep -cE 'TweaksPanel|theme switcher|data-theme')"
  echo "}"
} > "$OUT/structure.json"
```

期待値: `line_count` 700-1200 / `top_sections` 10 / `sidebar_count` 1 / `sub_sections_2_to_9` 64 / `derive_notes` 4 / `sidebar_refs` 8 / `mermaid_blocks` >= 8 / `unadopted_count` 3。

### 11.2 visual-grep.log

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
{
  for pat in '#[0-9a-fA-F]{3,8}\b' 'oklch\(' '\b[0-9]+px\b' '\bbg-\['; do
    echo "=== pattern: $pat ==="
    grep -nE "$pat" "$F" || echo "0 hits"
  done
} > "$OUT/visual-grep.log"
```

期待: 4 パターン全て "0 hits"。

### 11.3 api-parity.diff

```bash
P3=docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md
awk '/^### 2\.3 管理層/{flag=1; next} /^### 3\./{if(flag) exit} flag' "$P3" \
  | awk -F'|' '$0 ~ /^\|/ && $4 ~ /(GET|POST|PATCH|DELETE)/ {gsub(/`| /,"",$3); gsub(/ /,"",$4); print $4" "$3}' \
  | sort -u > /tmp/p3-admin.txt
awk '/^### [2-9]\.4 /{flag=1; next} /^### [2-9]\.5 /{flag=0} flag' "$F" \
  | awk -F'|' '$0 ~ /^\|/ && $4 ~ /(GET|POST|PATCH|DELETE)/ {gsub(/`| /,"",$3); gsub(/ /,"",$4); print $4" "$3}' \
  | sort -u > /tmp/09g-admin.txt
diff /tmp/p3-admin.txt /tmp/09g-admin.txt > "$OUT/api-parity.diff" || true
```

期待: 空ファイル（diff 0 行）。

### 11.4 a11y-strings.log

```bash
{
  echo "role=\"dialog\": $(grep -c 'role="dialog"' "$F")"
  echo "aria-modal=\"true\": $(grep -c 'aria-modal="true"' "$F")"
  echo "focus trap: $(grep -c 'focus trap' "$F")"
  echo "Esc close: $(grep -c 'Esc close' "$F")"
} > "$OUT/a11y-strings.log"
```

期待: 各 >= 6（confirm Modal を持つ §3 §4 §5 §6 §7 §8）。

### 11.5 schema-two-stage.log

```bash
awk '/^### 6\.3 / {flag=1; next} /^### 6\.4 / {flag=0} flag' "$F" \
  | grep -E '(diff|confirming|applied)' > "$OUT/schema-two-stage.log"
wc -l "$OUT/schema-two-stage.log"
```

期待: >= 3 行。

### 11.6 lint.log

```bash
if node -e "process.exit(require('./package.json').scripts?.['lint:md'] ? 0 : 1)"; then
  mise exec -- pnpm lint:md "$F" > "$OUT/lint.log" 2>&1 || true
else
  echo "NO_LINT_MD_SCRIPT: fallback to structure/visual/API/a11y gates" > "$OUT/lint.log"
fi
grep -cE 'error' "$OUT/lint.log"  # 期待: 0
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-11/evidence
# 11.1〜11.6 を順次実行（上記 bash blocks）
```

## DoD

- [ ] evidence/structure.json で AC-1/2/3/4/9 が期待値一致
- [ ] evidence/visual-grep.log で AC-5（4 パターン 0 hits）pass
- [ ] evidence/api-parity.diff で AC-6（空）pass
- [ ] evidence/a11y-strings.log で AC-7（各 >= 6）pass
- [ ] evidence/schema-two-stage.log で AC-8（>= 3）pass
- [ ] evidence/lint.log で error 0
- [ ] main.md に AC-1〜9 トレース表（AC / 期待値 / 実測 / 判定）

## 完了条件チェック

- [ ] outputs/phase-11/main.md / evidence/* 7 ファイル配置
- [ ] artifacts.json の phase 11 を completed
- [ ] AC-1〜9 全件 PASS
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- Phase 3 check-commands.md
- Phase 10 ログ
- task-21 §8 DoD

## 実行手順

### ステップ 1: evidence dir 作成
`mkdir -p outputs/phase-11/evidence`

### ステップ 2: 11.1〜11.6 実行
各 evidence を出力。

### ステップ 3: AC-1〜9 トレース表作成
main.md に表形式で全 AC を集約。

### ステップ 4: NON_VISUAL 明記
冒頭に「visualEvidence: NON_VISUAL — 仕様書 markdown のため screenshot 不要」と記述。

## 次 Phase

- 次: Phase 12（ドキュメント整備）
- 引き継ぎ: evidence 一式 / AC トレース表
- ブロック条件: AC-1〜9 のいずれか fail なら Phase 12 不可（Phase 7〜9 のいずれかへ戻る）。

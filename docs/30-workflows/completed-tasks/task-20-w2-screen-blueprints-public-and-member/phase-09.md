# Phase 09 — 品質保証

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 目的

09e / 09f に対する全 grep gate / markdown validation / link check / 行数 inventory を実行し、AC-1〜13 と Phase 6 異常系の block 条件をクリアする。

## 1. gate 一覧

| # | gate | コマンド | block 判定 | 関連 AC |
|---|------|---------|-----------|--------|
| G1 | 行数 inventory | `wc -l` | 実体欠落で warn | AC-1 / AC-2 |
| G2 | 章立て | `grep -cE '^## [0-9]+\. '` | 不一致で block | AC-3 / AC-4 |
| G3 | sub-section | X.1〜X.7 grep | 全 8 画面で 7 節 / 不足で block | AC-5 |
| G4 | 視覚値 | `grep -nE '#[0-9a-fA-F]{3,8}\b\|oklch\(\|\b[0-9]+px\b\|\bbg-\['` | hit で block | AC-9 |
| G5 | API trace | 現行 API 正本と §X.4 集合一致 | diff で block | AC-10 |
| G6 | コピー原文 | login 5+1 状態 / profile 4 領域 grep | miss で block | AC-6 / AC-7 |
| G7 | mermaid block 数 | `grep -c '^```mermaid$'` | 不足で block | AC-5 |
| G8 | placeholder | `! grep -nE '§TBD'` | 残存で block | AC-13 |
| G9 | markdown validation | lint script 未定義時は JSON parse + grep gates で代替 | validation error で block | AC-12 |
| G10 | 不変条件 | consent / responseEmail / D1 grep | 違反で block | AC-11 |
| G11 | 不採用要素混入 | 本編に `TweaksPanel` 等が出現していないか | 出現で warn | §99 |

## 2. 実行コマンド

```bash
F1=docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md
F2=docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md
EV=docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-09
mkdir -p "$EV"

# G1 行数
wc -l "$F1" "$F2" | tee "$EV/wc-lines.log"

# G2 章立て
echo "09e sections: $(grep -cE '^## [0-9]+\. ' "$F1")" | tee -a "$EV/section-count.log"
echo "09f sections: $(grep -cE '^## [0-9]+\. ' "$F2")" | tee -a "$EV/section-count.log"

# G4 視覚値（4 種）
{
  grep -nE '#[0-9a-fA-F]{3,8}\b' "$F1" "$F2" || true
  grep -nE 'oklch\(' "$F1" "$F2" || true
  grep -nE '\b[0-9]+px\b' "$F1" "$F2" || true
  grep -nE '\bbg-\[' "$F1" "$F2" || true
} | tee "$EV/grep-visual-values.log"
test ! -s "$EV/grep-visual-values.log" || (echo "VISUAL_VALUES_FOUND" && exit 1)
echo "GREP_ZERO_HITS" >> "$EV/grep-visual-values.log"

# G5 API trace
rg -n '/public/stats|/public/members|/public/form-preview|/api/auth/magic-link|/api/auth/gate-state|/api/me/profile|/api/me/visibility-request|/api/me/delete-request' "$F1" "$F2" > "$EV/grep-api-trace.log"

# G6 コピー原文（login 5+1 状態 + profile 4 領域）
{
  for S in input sent unregistered deleted rules_declined error; do
    grep -E "$S" "$F2" > /dev/null && echo "OK: login state $S" || echo "MISS: login state $S"
  done
  for R in banner summary request delete; do
    grep -E "$R" "$F2" > /dev/null && echo "OK: profile area $R" || echo "MISS: profile area $R"
  done
} | tee "$EV/grep-copy-text.log"

# G7 mermaid block
echo "09e mermaid blocks: $(grep -c '^```mermaid$' "$F1")" | tee -a "$EV/mermaid-count.log"
echo "09f mermaid blocks: $(grep -c '^```mermaid$' "$F2")" | tee -a "$EV/mermaid-count.log"

# G8 placeholder
grep -nE '§TBD' "$F1" "$F2" | tee "$EV/placeholder.log" || echo "PLACEHOLDER_ZERO_HITS" >> "$EV/placeholder.log"

# G9 markdown validation
node -e 'JSON.parse(require("fs").readFileSync("docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/artifacts.json","utf8")); console.log("PASS_WITH_SUBSTITUTION: lint:md not configured; artifacts JSON parse + grep gates used")' > "$EV/markdown-lint.log"

# G10 不変条件
{
  echo "=== consent ==="
  grep -nE 'consent' "$F1" "$F2" | grep -vE 'publicConsent|rulesConsent' || echo "OK"
  echo "=== responseEmail (system field 注記必須) ==="
  grep -nE 'responseEmail' "$F1" "$F2" || echo "(no occurrence)"
  echo "=== D1 binding 混入禁止 ==="
  grep -niE '\bD1\b|d1_databases' "$F1" "$F2" || echo "OK"
} | tee "$EV/grep-invariants.log"
```

## 3. gate 集計（PASS / FAIL）

`outputs/phase-09/grep-gate-result.md` に以下を記録:

```markdown
| gate | 結果 |
|------|------|
| G1 行数 inventory | PASS / FAIL（wc 結果） |
| G2 章立て | PASS / FAIL（09e=7, 09f=3） |
| G3 sub-section | PASS / FAIL |
| G4 視覚値 | PASS（GREP_ZERO_HITS）/ FAIL |
| G5 API trace | PASS / FAIL |
| G6 コピー原文 | PASS / FAIL |
| G7 mermaid | PASS / FAIL |
| G8 placeholder | PASS / FAIL |
| G9 markdown validation | PASS / PASS_WITH_SUBSTITUTION / FAIL |
| G10 不変条件 | PASS / FAIL |
| G11 不採用要素混入 | PASS / WARN |
```

## 4. block 時の対応

| gate | block 時の対応 |
|------|---------------|
| G2 章立て | Phase 5 ランブック §2 / §3 を再走 |
| G4 視覚値 | token 名置換 / Phase 6 §1.3 復旧手順 |
| G5 API trace | 現行 API 正本を base に §X.4 を再生成 / Phase 6 §1.2 |
| G6 コピー原文 | prototype 該当行を再読込 / Phase 6 §1.1 / §1.4 |
| G7 mermaid | phase-02 §3.1 / §3.2 テンプレ再投入 / Phase 6 §1.6 |
| G8 placeholder | 並列タスクの §番号確定値で置換 / Phase 6 §1.7 |
| G9 markdown validation | lint 出力または代替証跡に従い修正 |
| G10 不変条件 | Phase 6 §1.9 復旧 |

## 5. 完了条件

- [ ] G1〜G10 全 PASS（G11 は WARN 許容）
- [ ] `outputs/phase-09/grep-gate-result.md` 作成済
- [ ] block 違反 0
- [ ] evidence ファイルが Phase 11 で参照可能な path に配置済

## 6. 次フェーズへの引き渡し

phase-10（最終レビュー）に渡す:

- G1〜G11 集計結果
- block 違反の有無
- evidence path 一覧

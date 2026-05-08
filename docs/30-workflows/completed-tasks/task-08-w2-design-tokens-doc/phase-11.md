# Phase 11: 実装 smoke / evidence（NON_VISUAL 縮約テンプレ）

実装区分: ドキュメントのみ仕様書 / NON_VISUAL

> `artifacts.json.metadata.taskType=docs-only` / `visualEvidence=NON_VISUAL` のため、`references/phase-template-phase11.md` の **NON_VISUAL 縮約テンプレ**を適用する。screenshot / playwright / runtime curl は不要。

## NON_VISUAL evidence canonical paths

`outputs/phase-11/evidence/` 配下に以下を必ず実体保存する（Phase 9 で生成済みを Phase 11 で再確認）:

| ファイル | 内容 | 期待 |
| --- | --- | --- |
| `markdown-structure.log` | 行数 / 章数 / 3 テーマ表数 / token 数 / `@supports not` / `@theme inline` / dark placeholder | 全項目 PASS |
| `json-parse.log` | inline JSON の jq parse 結果 | `JSON parse OK` 行 |
| `cross-check.log` | `styles.css` ↔ 09b の OKLch / HEX 値の双方向 grep | `cross-check OK` 行 |
| `lint-md.log` | markdown lint 出力 | 条件付き（lint:md 未配備時は warning 許容） |

> 5 点セット相当として **markdown-structure / json-parse / cross-check / lint-md / scope-diff** を本タスクの local PASS evidence とする（一般 NON_VISUAL の typecheck/lint/test/build/grep-gate に相当）。

## 状態語彙

| 状態 | 意味 |
| --- | --- |
| `spec_created` | 本タスクの基本状態。仕様書作成済 / 実装着手前 |
| `PASS_BOUNDARY_SYNCED_LOCAL` | 5 点 evidence 取得済 / runtime PASS は本タスク無関係 |

`PASS` 単独表記禁止（`references/phase-template-phase11.md` 規約準拠）。

## 実行手順

```bash
WORKFLOW_DIR=docs/30-workflows/task-08-w2-design-tokens-doc
EVIDENCE_DIR="$WORKFLOW_DIR/outputs/phase-11/evidence"

# Phase 9 で生成済みの evidence を実体確認
ls -la "$EVIDENCE_DIR"
test -s "$EVIDENCE_DIR/markdown-structure.log"
test -s "$EVIDENCE_DIR/json-parse.log"
test -s "$EVIDENCE_DIR/cross-check.log"

# scope diff log を追加で取得（tracked / untracked の双方を残す）
{
  echo "[git status --short --untracked-files=all]"
  git status --short --untracked-files=all
  echo
  echo "[git diff --name-only]"
  git diff --name-only
  echo
  echo "[git ls-files --others --exclude-standard]"
  git ls-files --others --exclude-standard
} | tee "$EVIDENCE_DIR/scope-diff.log"

# main.md（Phase 11 サマリ）を生成
cat > "$WORKFLOW_DIR/outputs/phase-11/main.md" <<'EOF'
# Phase 11 NON_VISUAL evidence summary

| 検証 | 状態 | 根拠 |
| --- | --- | --- |
| markdown 構造 (行数/章数/テーマ表/token 数) | PASS_BOUNDARY_SYNCED_LOCAL | evidence/markdown-structure.log |
| JSON 健全性 | PASS_BOUNDARY_SYNCED_LOCAL | evidence/json-parse.log |
| OKLch / HEX cross-check | PASS_BOUNDARY_SYNCED_LOCAL | evidence/cross-check.log |
| markdown lint | PASS_BOUNDARY_SYNCED_LOCAL（or warning） | evidence/lint-md.log |
| diff scope 規律 | PASS_BOUNDARY_SYNCED_LOCAL | evidence/scope-diff.log |

state: PASS_BOUNDARY_SYNCED_LOCAL
EOF
```

## ゲート判定

| ゲート | 判定 |
| --- | --- |
| 5 点 evidence 全て実体存在 | 必須 |
| `main.md` で `PASS_BOUNDARY_SYNCED_LOCAL` 明記 | 必須 |
| scope-diff.log の行が `docs/00-getting-started-manual/specs/09b-design-tokens.md` + `00-overview.md` + `09-ui-ux.md` + `09c-primitives.md` + `09f-screen-blueprints-member.md` + 親 workflow / task-09 / task-18 の旧 token contract 補正 + `docs/30-workflows/task-08-w2-design-tokens-doc/**` + `.claude/skills/aiworkflow-requirements/**` の本 task 同期差分のみ | 必須 |

## 適用しない項目（NON_VISUAL 縮約）

- screenshot 撮影
- playwright runtime
- curl smoke
- D1 schema parity verification
- multi-stage approval gate (G1-G4)

## 完了条件

- [ ] 5 点 evidence が `outputs/phase-11/evidence/` に実体存在
- [ ] `outputs/phase-11/main.md` が PASS_BOUNDARY_SYNCED_LOCAL で締め
- [ ] scope-diff が範囲外 0 件

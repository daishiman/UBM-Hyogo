# AC × Verify Suite マトリクス

| AC | 内容 | Suite | コマンド | 期待値 | evidence |
| --- | --- | --- | --- | --- | --- |
| AC-1 | H2 = 10 | structure | `grep -c '^## ' 09-ui-ux.md` | 10 | structure-check.log |
| AC-2 | `### 2.` = 20 | structure | `grep -c '^### 2\.' 09-ui-ux.md` | 20 | structure-check.log |
| AC-3 | HEX 0 件 | grep gate | `grep -nE '#[0-9a-fA-F]{3,8}\b' 09-ui-ux.md` | 0 | grep-gate.log |
| AC-4 | oklch() 値 0 件 | grep gate | `grep -nE 'oklch\(' 09-ui-ux.md` | 0 | grep-gate.log |
| AC-5 | px 値 0 件 | grep gate | `grep -nE '\b[0-9]+px\b' 09-ui-ux.md` | 0 | grep-gate.log |
| AC-6 | `bg-[#`/`text-[#` 0 件 | grep gate | `grep -nE 'bg-\[#\|text-\[#' 09-ui-ux.md` | 0 | grep-gate.log |
| AC-7 | 19 routes + fallback = 20 | trace + structure | `grep -c '^### 2\.' 09-ui-ux.md` | 20 | trace-check.log |
| AC-8 | primitives 13 | structure | `grep -c '^#### 3\.1\.' 09-ui-ux.md` | 13 | structure-check.log |
| AC-9 | login 5 状態 §4.2 | trace | `grep -n '^### 4\.2' 09-ui-ux.md` | 1 | trace-check.log |
| AC-10 | dialog aria-modal §5.2 | trace | `grep -n 'aria-modal' 09-ui-ux.md` | ≥1 | trace-check.log |
| AC-11 | token prefix 8 種 | trace | `grep -E '\-\-ubm-(color\|radius\|shadow\|space\|text\|font\|dur\|ease)-' 09-ui-ux.md` | 8 種すべて | trace-check.log |
| AC-12 | apps/web → D1 0 件 | trace | `grep -rn 'D1Database\|d1Binding' apps/web/src` | 0 | trace-check.log |
| AC-13 | gas-prototype 不採用 4 行 | trace | `grep -n 'gas-prototype\|tweaks\|theme switcher\|data-theme' 09-ui-ux.md` | ≥4 | trace-check.log |
| AC-14 | markdown lint exit 0 | lint | `markdownlint 09-ui-ux.md && echo $?` | 0 | markdown-lint.log |

## 検証結果サマリ

すべての AC が **PASS**（証跡は `outputs/phase-11/evidence/` 配下を参照）。

# entry 残置要素チェックリスト テンプレート (V5)

skill 名: `<skill-name>`
SKILL.md パス: `.claude/skills/<skill-name>/SKILL.md`
検査日: `YYYY-MM-DD`
検査者: `<reviewer>`

| # | 要素 | 検出方法 | 必須 | 結果 (OK/FAIL/N/A) | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1 | front matter (`---` 〜 `---`) | `head -n 20 SKILL.md` で `---` ブロック存在 | yes | | |
| 2 | 概要 5〜10 行 | front matter 直後の段落が 5〜10 行 | yes | | |
| 3 | trigger | `rg -n '(^trigger:\|TRIGGER when)' SKILL.md` | yes | | |
| 4 | allowed-tools | `rg -n '^allowed-tools:' SKILL.md` または front matter 内 | yes | | |
| 5 | Anchors セクション | `rg -n '^##.*Anchors' SKILL.md` | yes | | |
| 6 | クイックスタート | `rg -n '^##.*(クイックスタート\|Quick Start)' SKILL.md` | yes | | |
| 7 | モード一覧 | `rg -n '^##.*モード' SKILL.md` | yes | | |
| 8 | agent 導線 | `rg -n '^##.*(エージェント\|agent)' SKILL.md` | yes | | |
| 9 | references リンク表 | `rg -n 'references/.*\.md' SKILL.md` | yes | | |
| 10 | 最小 workflow | `rg -n '^##.*(workflow\|ワークフロー)' SKILL.md` | yes | | |

PASS 条件: 必須 10 要素がすべて OK。

備考欄:
- N/A は「対象 skill がそもそも該当要素を持たない設計」と判断した場合のみ使用し、Phase 2 split-design に根拠を残す。
- FAIL の場合は Phase 5 ランブックの Step 4（入口リライト）で再修正。

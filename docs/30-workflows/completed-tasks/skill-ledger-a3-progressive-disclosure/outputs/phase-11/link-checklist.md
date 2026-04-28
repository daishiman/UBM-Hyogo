# Phase 11 link-checklist — task-specification-creator

SKILL.md（115 行）の **References 表** に登録された 7 件の references について、
(1) ファイル実在 (2) SKILL.md からの forward 参照 (3) references → SKILL.md への戻り参照（=循環）の有無 を目視確認した。

確認コマンド:

```bash
# 実在 + forward 参照
ls .claude/skills/task-specification-creator/references/<topic>.md
rg -n 'references/<topic>.md' .claude/skills/task-specification-creator/SKILL.md

# 循環確認（references から SKILL.md への path リンクが無いこと）
rg -n '\]\(.*SKILL\.md\)' .claude/skills/task-specification-creator/references/<topic>.md
```

## チェックリスト

| # | skill | references path | 実在 | SKILL.md からの参照 | 循環参照（path link） |
| --- | --- | --- | --- | --- | --- |
| 1 | task-specification-creator | references/requirements-review.md | [x] | [x] | [x] なし |
| 2 | task-specification-creator | references/task-type-decision.md | [x] | [x] | [x] なし |
| 3 | task-specification-creator | references/phase-templates.md | [x] | [x] | [x] なし |
| 4 | task-specification-creator | references/phase-12-spec.md | [x] | [x] | [x] なし（"SKILL.md" 文字列言及のみ・path link なし） |
| 5 | task-specification-creator | references/phase-12-pitfalls.md | [x] | [x] | [x] なし（"SKILL.md" 文字列言及のみ・path link なし） |
| 6 | task-specification-creator | references/quality-gates.md | [x] | [x] | [x] なし |
| 7 | task-specification-creator | references/orchestration.md | [x] | [x] | [x] なし（"SKILL.md" 文字列言及のみ・path link なし） |

> 注: `phase-12-spec.md` / `phase-12-pitfalls.md` / `orchestration.md` には "SKILL.md" という文字列がドキュメント本文中に出現するが、いずれも markdown link `[...](...SKILL.md)` 形式ではなく**単なる単語としての言及**であるため、Progressive Disclosure における**片方向参照**は維持されている（循環なし）。

## 補助 References（本文中で参照される追加 4 件）も実在確認

SKILL.md の本文（クイックスタート表 / Phase 12 セクション / 末尾フッター）では References 表外の追加 4 references も参照される。これらも **forward リンク健全** であることを line-integrity.sh `OK:` 行で確認済み。

| # | references path | 実在 | SKILL.md からの参照 |
| --- | --- | --- | --- |
| 8 | references/create-workflow.md | [x] | [x] (クイックスタート表) |
| 9 | references/execute-workflow.md | [x] | [x] (クイックスタート表) |
| 10 | references/phase-12-documentation-guide.md | [x] | [x] (クイックスタート表) |
| 11 | references/logs-archive-index.md | [x] | [x] (フッター) |

## 結論

- 主 7 references は **forward link OK / 循環 0 / 実在 OK**
- AC-7（リンク切れ 0）/ AC-8（未参照 0）を **task-specification-creator 単体で** 満たす
- 残 4 skill 分の reference 整備は次 per-skill PR で実施

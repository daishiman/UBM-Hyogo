# Phase 10 — ドキュメント反映

**[実装区分: 実装仕様書]**

## 1. ドキュメント更新対象

| パス | 変更内容 |
| --- | --- |
| `docs/runbooks/post-release-long-term-observation.md` | 新規（Phase 5 §4 構成 / Phase 7 §6 で実装） |
| `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | 新規（Phase 5 §5 / Phase 7 §7） |
| `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map}.md`, `keywords.json` | 編集 / 生成（Phase 7 §8） |
| `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` | trace 書換（Phase 7 §9） |
| `docs/30-workflows/issue-350-long-term-production-observation/outputs/phase-12/*.md` | Phase 12 で生成 |

## 2. 09c Phase 12 unassigned 行の書換ルール

**削除しないこと**（履歴保持）。該当行末尾に下記 1 行を追記:

```
→ consumed by issue-350-long-term-production-observation (2026-05-06) — D+7/D+30 観測仕様化済
```

複数記録になっても trace は前から順に残す。

## 3. SSOT 検索性確認

```sh
mise exec -- pnpm indexes:rebuild
rg -n "post-release-long-term-observation" .claude/skills/aiworkflow-requirements/indexes/
rg -n "D\+7|長期観測" .claude/skills/aiworkflow-requirements/indexes/keywords.json
```

期待: 全コマンドが 1 件以上ヒット。

## 4. 関連 docs への導線追加

- `docs/runbooks/` に index ファイルがある場合のみエントリ追加（無ければ skip）
- 09c index.md の Phase 12 セクションに「→ followup: issue-350-...」リンクを 1 行追記（**任意**）

検証:
```sh
test -f docs/runbooks/post-release-long-term-observation.md
rg -n "post-release-long-term-observation" docs/runbooks/ | head
```

## 5. 完了条件

- [ ] runbook / SSOT / indexes / 09c trace が全て更新済
- [ ] `pnpm indexes:rebuild` 成功
- [ ] `rg` 検索が想定通りヒット

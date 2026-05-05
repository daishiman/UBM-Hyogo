# task-09a-canonical-directory-restoration-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09a-canonical-directory-restoration-001 |
| タスク名 | 09a canonical workflow directory restoration |
| 分類 | docs / governance |
| 対象機能 | 09a staging smoke canonical workflow |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md` |
| 発見日 | 2026-05-02 |
| 親タスク | `docs/30-workflows/ut-09a-exec-staging-smoke-001/` |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 1. なぜこのタスクが必要か（Why）

`ut-09a-exec-staging-smoke-001` の AC-1 は、親 09a workflow の
`outputs/phase-11/*` に残る `NOT_EXECUTED` placeholder を実測 evidence path に置換することを
要求している。しかし現 worktree には
`docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` が存在せず、
Cloudflare 認証を復旧しても AC-1 は実行できない。

## 2. 何を達成するか（What）

09a canonical workflow directory を現在の正本索引と一致する場所へ復元し、
`ut-09a-exec-staging-smoke-001` が親 09a placeholder 置換を実行できる状態にする。

## 3. どのように実行するか（How）

main / 正本履歴 / legacy register を確認し、既存の canonical root を復元する。別名 root を新設せず、
`.claude/skills/aiworkflow-requirements/indexes/resource-map.md` と
`references/task-workflow-active.md` の current canonical path と一致させる。

## 4. 実行手順

1. `references/task-workflow-active.md` と `indexes/resource-map.md` の 09a canonical path を確認する。
2. git history / main から 09a directory を復元する。
3. root `artifacts.json` と `outputs/artifacts.json` parity を確認する。
4. `outputs/phase-11/*` の `NOT_EXECUTED` placeholder 置換対象を確認する。
5. 復元 evidence を `ut-09a-exec-staging-smoke-001` Phase 11 再実行へ引き渡す。

## 5. 完了条件チェックリスト

- [ ] `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` が存在する
- [ ] root / outputs `artifacts.json` parity が確認済み
- [ ] `NOT_EXECUTED` placeholder 置換対象ファイルが列挙済み
- [ ] 正本索引の canonical path と実体 path が一致している

## 6. 検証方法

```bash
test -d docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation
find docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11 -type f | sort
```

期待: 09a canonical directory と Phase 11 evidence files が存在する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| legacy alias を canonical と誤認する | `resource-map.md` と `task-workflow-active.md` の current canonical path を優先する |
| 復元時に別作業差分を巻き戻す | 対象 directory のみを復元し、無関係差分は触らない |
| placeholder を PASS と誤認する | 置換前は `NOT_EXECUTED` / blocked のまま扱う |

## 8. 苦戦箇所（将来の課題解決のための知見）

| 苦戦箇所 | 詳細 | 将来への示唆 |
| --- | --- | --- |
| canonical path の正本特定 | `task-workflow-active.md` 上は 09a が `spec_created` だが、実 directory が当該 worktree に存在しないため、canonical path が「文書上は存在」「実体は不在」というズレが起きていた | `references/task-workflow-active.md` と `indexes/resource-map.md` の current canonical path が一致していることを spec 採用前に検証する gate を整備する |
| legacy alias と canonical の混同 | `09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` は legacy 名残かもしれず、別名で root を新設すれば AC-1 が誤って PASS する事故が起きうる | 別名 root を新設するのではなく、必ず正本索引が指す path 一本に restore する。restoration 後も `ut09-references-stale-audit-001` 等で stale alias を継続点検する |
| 当該 worktree で完結できない作業 | restoration は当該 worktree 内の `git diff` だけでは不可能で、main / 履歴を辿る必要がある | unassigned task として切り出し、本 workflow の Phase 11 再実行は restoration 完了後に限定する gate を明示する |
| AC-1 の PASS 判定境界 | `NOT_EXECUTED` placeholder が残っている状態を「未着手」と読むか「placeholder PASS」と読むかで判定が割れる | restoration 直後は AC-1 を `blocked` のまま据え置き、実測 evidence path が `outputs/phase-11/*` 内で参照解決できた時点で PASS に上げるルールを明文化する |

## 9. 参照情報

- `docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`


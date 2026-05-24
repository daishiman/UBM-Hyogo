# Classification Policy

## 区分基準

| 区分 | 判定基準 | 編集方針 |
|------|---------|---------|
| current drift | references 配下の "current guidance" として書かれた行のうち、legacy umbrella `task-sync-forms-d1-legacy-umbrella-001` で legacy 化された言及（単一 `/admin/sync` / `sync_audit` / Google Sheets API）を含むもの | 該当行を Forms API split endpoint（`/admin/sync/schema` + `/admin/sync/responses`）+ `sync_jobs` ledger に書き換え、legacy 表記は historical 別表へ移送 |
| historical | lessons-learned / completed task 記録 / artifact inventory に含まれる歴史記述 | 削除禁止。前後文脈で legacy 文脈であることが既に明示されている場合は変更不要 |
| superseded backlog | `task-workflow-backlog.md` の active entry のうち、legacy umbrella で集約済みのもの（UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001） | `~~strikethrough~~` + `**status: superseded（2026-04-30 / issue-291）**` annotation を追加し、supersede 理由を本文に併記 |

## 逆リンク戦略

| タスク | 物理 root 有無 | 追記先 |
|--------|---------------|--------|
| 03a | あり | `docs/30-workflows/completed-tasks/03a-.../index.md` 末尾 |
| 03b | あり | `docs/30-workflows/completed-tasks/03b-.../index.md` 末尾 |
| 02c | あり | `docs/30-workflows/completed-tasks/02c-.../index.md` 末尾 |
| 04c | 物理 root 不在（現 worktree） | `task-workflow-active.md` の 04c row に 1 文 fallback |
| 09b | 物理 root 不在（現 worktree） | `task-workflow-active.md` の 09b row に 1 文 fallback |

ledger fallback は `legacy umbrella: task-sync-forms-d1-legacy-umbrella-001 / cleanup: issue-291-forms-d1-legacy-followup-cleanup` を 1 文で挿入。

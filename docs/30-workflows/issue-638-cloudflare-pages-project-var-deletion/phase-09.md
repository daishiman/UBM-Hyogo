# Phase 9: ドキュメント更新・旧 spec retirement

## 9.1 旧 unassigned-task の supersede 処理

**対象**: `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md`

**処理**: 物理削除はせず、冒頭（タイトル直下）に以下の SUPERSEDED block を追記する。

```markdown
> [SUPERSEDED] by `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/`
> Date: 2026-05-14
> Refs: GitHub Issue #638 (CLOSED)
>
> 本 unassigned-task spec は Phase 1-13 仕様書フォーマットに昇格された置換 spec に統合された。
> 履歴保全のため本ファイルは削除せず残置するが、新規参照は置換先を使うこと。
```

理由:
- 履歴文書の物理削除は audit trail を断つ
- supersede marker により「どこが正本か」を冒頭 5 行以内で判別可能にする
- 旧パスへの外部参照（過去 PR 等）が壊れない

## 9.2 関連 unassigned-task との関係性 (現状維持)

以下のファイルは **本タスク scope 外** のため変更しない:

| ファイル | 関係 | 維持理由 |
| --- | --- | --- |
| `unassigned-task/issue-331-followup-002-cloudflare-pages-project-physical-deletion.md` | Cloudflare 側 Pages project 削除 | 別作業（外部 Cloudflare API） |
| `unassigned-task/issue-331-followup-003-oidc-step-scoped-cf-token-cutover.md` | OIDC cutover | 別作業（独立 epic） |

## 9.3 CLAUDE.md / specs 系の更新有無

| ドキュメント | 更新要否 | 理由 |
| --- | --- | --- |
| `CLAUDE.md` | 不要 | repository variable 個別運用は CLAUDE.md の管轄外 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 不要 | history 文書、現状維持 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 必要 | `CLOUDFLARE_PAGES_PROJECT` を削除候補から Issue #638 user-gated deletion contract へ昇格 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 必要 | Web CD では未参照、削除は Issue #638 の承認付き operation と明記 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 必要 | repository variable の現在状態を pending deletion として同期 |
| `.claude/skills/aiworkflow-requirements/indexes/*` / `references/task-workflow-active.md` | 必要 | 新 workflow root を current canonical set に登録 |

## 9.4 historical references の扱い

`docs/30-workflows/completed-tasks/` 配下の `CLOUDFLARE_PAGES_PROJECT` 言及は完了タスクの history 文書のため **改変しない**。

## 9.5 ドキュメント整合性 verify

```bash
# 本仕様作成後に追加されたファイルが正しい配置か確認
find docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion -type f | sort

# supersede marker の存在確認
grep -c "SUPERSEDED" docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md
# → 1 を期待
```

# Phase 13: PR 作成（user 承認必須）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | umbrella close-out |
| Mode | docs-only / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |
| user_approval_required | **true** |

## 目的

Phase 12 までの成果物を `feat/wt-8` ブランチにまとめ、`main` 向け（または `dev` 向け、CLAUDE.md branch 戦略に従う）の PR を作成する。**user の明示的承認なしに commit / push / PR 作成を実行しない**（CLAUDE.md および元仕様 §5「Phase 13 相当の commit / PR はユーザー承認まで実行しない」に準拠）。

## 実行タスク

1. local check（docs-only のため `pnpm` 系は impactless / `audit-unassigned-tasks.js` が主証跡）
2. change-summary（影響範囲の確認）
3. PR body 作成
4. **approval gate（blocked: user 承認なしで以降に進まない）**
5. `gh pr create`（承認後のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `CLAUDE.md` § ブランチ戦略 | base branch 判定 |
| 必須 | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-12.md` | 7 ファイル + sync 結果 |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` § 5 | Phase 13 user 承認必須の正本根拠 |
| 必須 | GitHub Issue #95 | Related issue link |

## 実行手順

### ステップ 1: local check

docs-only タスクのため `pnpm` 系コマンドは impactless だが、念のため実行記録を残す。`audit-unassigned-tasks.js` が主証跡。

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm lint
mise exec -- pnpm typecheck
mise exec -- pnpm build

# 主証跡（必須）
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
```

#### local-check-result template

```text
$ mise exec -- pnpm lint        → exit 0（impactless: docs-only）
$ mise exec -- pnpm typecheck   → exit 0（impactless: docs-only）
$ mise exec -- pnpm build       → exit 0（impactless: docs-only）
$ audit-unassigned-tasks.js     → current violations: 0  ★主証跡
$ rg "ut-09-sheets-to-d1-cron-sync-job" → 0 hit（新規導線参照なし）
$ rg "^(<<<<<<<|=======|>>>>>>>)" → 0 hit（conflict marker なし）
```

### ステップ 2: change-summary

```bash
git diff --stat origin/main...HEAD -- \
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/ \
  docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
```

#### change-summary template

```text
追加（task spec ツリー全体）:
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/index.md
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/artifacts.json
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-01.md ... phase-13.md
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-{01..13}/*

更新（既存ファイルへの「legacy umbrella as canonical entry」明記）:
  docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md

削除: なし（stale `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` は最初から作らない）

参照影響範囲（PR では書き換えないが本タスク仕様書から参照する）:
  docs/00-getting-started-manual/specs/00-overview.md
  docs/00-getting-started-manual/specs/01-api-schema.md
  docs/00-getting-started-manual/specs/03-data-fetching.md
  docs/00-getting-started-manual/specs/08-free-database.md
  docs/00-getting-started-manual/specs/13-mvp-auth.md
  docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
  docs/00-getting-started-manual/claude-design-prototype/data.jsx

実装コード変更: なし（docs-only タスク）
```

### ステップ 3: PR body 作成

`outputs/phase-13/pr-body.md` に下記 PR template の内容を配置する。

### ステップ 4: approval gate（blocked）

```text
[ APPROVAL REQUIRED ]
PR タイトル案: docs(30-workflows): close UT-09 as legacy umbrella (issue #95)
base: main（CLAUDE.md branch 戦略に従う / dev 経由が必要なら base: dev へ変更）
head: feat/wt-8
変更行数: TBD（git diff --stat の結果を提示）
不変条件 compliance: #1 / #5 / #6 / #10 を本タスクで担保
AC matrix: AC-1 〜 AC-14 全件 GREEN（Phase 10 結果）
Phase 12 7 ファイル: 配置済み
audit current violations: 0
stale path 参照: 0 hit
conflict marker: 0 hit
workflow_state: spec_created（completed に書き換えていない）

承認しますか？ [y/N]
```

**user の明示的承認 (`y`) なしに以降のステップへ進まない**。承認なしで `git commit` / `git push` / `gh pr create` を実行することは元仕様 §5 違反。

### ステップ 5: PR 作成（**承認後のみ**）

```bash
gh pr create \
  --base main \
  --head feat/wt-8 \
  --title "docs(30-workflows): close UT-09 as legacy umbrella (issue #95)" \
  --body-file docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-13/pr-body.md
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 並列 03a/03b/04c/09b | PR merge 後に関連タスクテーブルの最新化を確認 |
| GitHub Issue #95 | PR URL を Issue にリンクして close-out 履歴を残す |

## 多角的チェック観点（不変条件）

- PR body に **#5 / #6 / #1 / #10** への compliance を明記
- branch 戦略遵守（`feat/*` → `main`、または `dev` 経由）
- user 承認なしで destructive な git 操作を実行しない（force push / reset --hard 禁止）
- secret 平文を PR body に含めない（`GOOGLE_*` 系は変数名言及のみ）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check（impactless 記録 + audit 主証跡） | 13 | pending | audit が主 |
| 2 | change-summary | 13 | pending | git diff --stat |
| 3 | PR body 作成 | 13 | pending | template 適用 |
| 4 | approval gate | 13 | blocked | **user 承認必須** |
| 5 | gh pr create | 13 | blocked | 承認後のみ。承認前は本 Phase 全体を completed にしない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/main.md` | local-check / change-summary / approval log |
| ドキュメント | `outputs/phase-13/pr-body.md` | PR 本文 |
| ドキュメント | `outputs/phase-13/local-check-result.md` | local check 実行記録 |
| ドキュメント | `outputs/phase-13/approval-log.md` | user 承認 yes/no と日時 |
| メタ | `artifacts.json` | `phases[13].status = completed`（PR URL を含む）。`metadata.workflow_state` は `spec_created` のまま据え置き |

## 完了条件

- [ ] local check 4 種 + audit 主証跡が記録されている
- [ ] change-summary 完成
- [ ] PR body 完成
- [ ] **user 承認取得**（`approval-log.md` に yes/日時/承認者を記録）
- [ ] user の明示承認後にのみ `gh pr create` を実行し、PR URL を `artifacts.json` に記録
- [ ] `metadata.workflow_state` が `spec_created` のままである（誤って `completed` に書き換えていない）

## タスク100%実行確認【必須】

- 承認前: local check / change-summary / PR body まで completed、approval gate は blocked として記録
- 承認後: 全実行タスク（5 件）completed
- PR URL が `artifacts.json` に記録される
- `phases[13].status` が completed
- `metadata.workflow_state` は `spec_created` 据え置き

## 次 Phase への引き渡し

- 次: なし（最終 Phase）
- 引き継ぎ事項: PR URL を 03a / 03b / 04c / 09b の `関連タスク` テーブル + GitHub Issue #95 にリンク
- ブロック条件: **user 承認なしで commit / push / PR 作成しない**

## PR template

```markdown
## Summary

- 旧 UT-09（Sheets→D1 sync ジョブ）を **legacy umbrella** として閉じる docs-only タスク
- 実装責務は既に **03a / 03b / 04c / 09b** に分散済みであることを正式に記録
- 旧 UT-09 の有効な耐障害要件（`SQLITE_BUSY` retry/backoff、短い transaction、batch-size 制限、`sync_jobs` 同種 job 排他）を 03a / 03b / 09b の品質ゲートへ移植する指針を残す
- stale path `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` は新設しない（legacy 名で参照する文書は legacy umbrella を案内）

## 責務移管マッピング

| 旧 UT-09 の責務 | canonical 移管先 | 実体 |
| --- | --- | --- |
| schema 取得 / `schema_questions` upsert | 03a | `forms.get` / `POST /admin/sync/schema` |
| response 取得 / cursor pagination / current response / consent snapshot | 03b | `forms.responses.list` / `member_responses` / `member_identities` / `member_status` |
| 手動同期 endpoint | 04c | `/admin/sync/schema` / `/admin/sync/responses`（admin gate 経由） |
| cron schedule / pause / resume / runbook | 09b | Workers Cron Triggers / release runbook / incident response |
| sync 監査 | 02c | `sync_jobs`（旧 `sync_audit` ではない） |

## 検証コマンド結果

```bash
$ node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
    --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
=> current violations: 0

$ rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" \
    docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references
=> 0 hit（新規導線参照なし）

$ rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references
=> 0 hit
```

## Test plan

- [ ] `mise exec -- pnpm lint` exit 0（docs-only impactless）
- [ ] `mise exec -- pnpm typecheck` exit 0（docs-only impactless）
- [ ] `mise exec -- pnpm build` exit 0（docs-only impactless）
- [ ] `audit-unassigned-tasks.js` current violations: 0
- [ ] stale path scan 0 hit
- [ ] conflict marker scan 0 hit
- [ ] Phase 12 7 ファイル配置確認
- [ ] `metadata.workflow_state == "spec_created"` 確認

## Invariants compliance

- **#1**（schema 固定しすぎない）: Sheets 列固定アサーションを 03a/03b に持ち込ませない gate を提供
- **#5**（apps/web → D1 直接禁止）: 本タスクで web 経路を一切追加しない
- **#6**（GAS prototype 昇格しない）: cron は Workers Cron Triggers のみ（GAS apps script trigger 不採用）
- **#10**（Cloudflare 無料枠）: 本タスク増分 req/day = 0

## Affected files

- `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/**`（新規）
- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md`（「legacy umbrella as canonical entry」明記）

### 参照影響範囲（specs / prototype は本 PR で書き換えないが、整合性検証対象として記載）

- `docs/00-getting-started-manual/specs/00-overview.md`（公開 / 会員 / 管理 3 層構成）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（Forms schema / `responseId` / `publicConsent` / `rulesConsent`）
- `docs/00-getting-started-manual/specs/03-data-fetching.md`（sync_jobs / cursor pagination / current response / consent snapshot）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 WAL 非対応 / PRAGMA 制約）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`（admin gate）
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`（admin sync 操作 UI 想定）
- `docs/00-getting-started-manual/claude-design-prototype/data.jsx`（sample 同期データ構造）

実装コード変更: なし（docs-only / spec_created）

## Related

- Issue: #95（task-sync-forms-d1-legacy-umbrella-001）
- supersedes: 旧 UT-09（Sheets→D1 sync ジョブ）
- canonical entries: 03a / 03b / 04c / 09b
- depends_on: なし
- blocks: なし

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

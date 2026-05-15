# Phase 2: 現状調査・依存確認

## 2.1 Variable の現状（2026-05-14 時点 evidence）

```bash
$ gh api repos/daishiman/UBM-Hyogo/actions/variables
{
  "variables": [
    {"name": "CLOUDFLARE_ACCOUNT_ID", "value": "b3dde7be1cd856788fc47595ac455475", ...},
    {"name": "CLOUDFLARE_PAGES_PROJECT", "value": "ubm-hyogo-web", "created_at": "2026-04-26T14:14:21Z", "updated_at": "2026-04-29T08:13:29Z"},
    {"name": "FORM_ID", "value": "119ec539...", ...},
    {"name": "SHEET_ID", "value": "10XQqUko...", ...}
  ],
  "total_count": 4
}
```

→ `CLOUDFLARE_PAGES_PROJECT` は **repo scope に存在**。削除対象として確定。

## 2.2 参照箇所調査結果

### 2.2.1 ソースコード (削除安全性の根拠)

| 範囲 | 結果 |
| --- | --- |
| `apps/` 配下 | hit 0 |
| `packages/` 配下 | hit 0 |
| `scripts/` 配下 | hit 0 |
| `.github/` 配下 | hit 0 |

→ **ソースコード・workflow 参照ゼロ**。削除しても CI / アプリは壊れない。

### 2.2.2 ドキュメント参照（削除しても削除作業に影響しない）

以下は historical 記録 / 完了タスク履歴であり、削除作業に影響しない:

- `docs/00-getting-started-manual/specs/08-free-database.md` (free tier 設計の history)
- `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md` (本仕様で supersede)
- `docs/30-workflows/unassigned-task/issue-331-followup-002-cloudflare-pages-project-physical-deletion.md` (別タスク・Pages project 本体削除)
- `docs/30-workflows/unassigned-task/UT-29-cd-post-deploy-smoke-healthcheck.md` (参照のみ)
- `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/` (完了 history)
- `docs/30-workflows/completed-tasks/UT-28-cloudflare-pages-projects-creation.md` (完了 history)
- `docs/30-workflows/completed-tasks/ci-pipeline-recovery-web-cd-and-runtime-smoke/` (完了 history)
- `docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment/` (完了 history)

→ historical 記録は **変更しない**（過去の文書を改ざんしない原則）。

### 2.2.3 environment scope の存在確認

```bash
$ gh api repos/daishiman/UBM-Hyogo/environments/staging/variables 2>&1
$ gh api repos/daishiman/UBM-Hyogo/environments/production/variables 2>&1
```

→ Phase 7 Step 1 で実行し、`CLOUDFLARE_PAGES_PROJECT` が environment scope に **存在しないこと** を確認。存在した場合は本タスク scope 外として別 issue 採番（誤削除しない）。

## 2.3 依存タスクの状態確認

| 依存元 | 状態 | 影響 |
| --- | --- | --- |
| Issue #331 (`web-cd.yml` の Workers cutover) | MERGED to dev / main | 前提充足 |
| Issue #419 (Pages dormant cleanup) | CLOSED | fold 先消失 → 本タスクが canonical owner |
| Issue #638 (本タスク) | CLOSED | ユーザー指示により reopen しない |
| `issue-331-followup-002` (Pages project 物理削除) | unassigned-task に存在 | 本タスクと独立、後続作業 |
| `issue-331-followup-003` (OIDC cutover) | unassigned-task に存在 | 本タスクと独立 |

## 2.4 認証要件

- `gh auth status` で `daishiman/UBM-Hyogo` への `repo` + `admin:repo_hook` scope を持つトークンが有効であること
- variable delete には `Variables: Write` 権限が必要（classic PAT の `repo` scope または fine-grained PAT の対応スコープ）

## 2.5 リスク再評価

Phase 1 で識別した「`.github/` 以外で参照されている」リスクは、本 Phase で `apps/` / `packages/` / `scripts/` 全件 hit 0 を確認したため **解消**。

# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| destructiveOperation | true |

## 目的

GitHub Issue #419 (Refs #355) の AC-1〜AC-6 を満たすために、Cloudflare Pages dormant プロジェクト物理削除に関わる機能要件・非機能要件を確定する。

## 入力

- Issue #419 本文（タイトル: `[ops] Cloudflare Pages プロジェクト dormant 経過後の物理削除 (Refs #355)`）
- 起票元 unassigned: `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`
- 親仕様（CLOSED）: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`
- `CLAUDE.md`（`bash scripts/cf.sh` 経由必須 / `wrangler` 直接呼び出し禁止 / `.env` op:// 参照のみ）

## 要件

### 機能要件（FR）

| ID | 要件 | 対応 AC |
| --- | --- | --- |
| FR-01 | Workers cutover 完了の preflight evidence（Workers production route 200 OK / staging・production smoke）を取得して記録できること | AC-1 |
| FR-02 | Pages プロジェクトに active な custom domain attachment が存在しないことを `bash scripts/cf.sh` 経由で確認・evidence 化できること | AC-2 |
| FR-03 | dormant 観察期間（開始日 / 終了日 / 期間中の Workers 4xx・5xx 推移 / dormant 維持確認）を append-only で記録できること（最低 2 週間） | AC-3 |
| FR-04 | 削除実行前に user 明示承認（PR description / Issue comment / outputs/phase-11/user-approval-record.md）を記録できること | AC-4 |
| FR-05 | `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` 経由で Pages プロジェクトを削除できること。`scripts/cf.sh` は wrangler passthrough のため helper 追加は不要 | AC-4 |
| FR-06 | 削除後の Workers production smoke 200 OK を evidence 化できること | AC-1 / AC-4 |
| FR-07 | `aiworkflow-requirements` references 内の Pages 言及箇所を「削除済み（YYYY-MM-DD）」ステータスへ更新できること | AC-6 |

### 非機能要件（NFR）

| ID | 要件 | 対応 AC |
| --- | --- | --- |
| NFR-01 | evidence に Cloudflare API token / Bearer / Logpush sink URL query / OAuth value / Authorization ヘッダ値が含まれないこと（grep gate で検証） | AC-5 |
| NFR-02 | Cloudflare CLI 操作はすべて `bash scripts/cf.sh` 経由（`wrangler` 直接実行禁止） | CLAUDE.md |
| NFR-03 | `.env` の値は cat / Read / grep で読み取らない（op:// 参照のみ） | CLAUDE.md |
| NFR-04 | destructive operation のため `bypassPermissions` モードでも単独実行せず、user 明示承認を gate 化する | AC-4 |
| NFR-05 | rollback 不可性に対する補償として、削除実行前に Workers の前 VERSION_ID を取得・記録する（万一の Workers 側 rollback 経路確保） | AC-1 / AC-4 |
| NFR-06 | 親 Issue #355 は CLOSED のため、本タスク・PR では `Refs #355` のみ使用し `Closes #355` を書かない | 親仕様運用ルール |

## artifacts.json metadata（確定値）

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created",
  "destructiveOperation": true,
  "parentIssue": 355,
  "parentIssueRefRule": "Refs #355 only; Closes #355 forbidden"
}
```

## 完了条件（DoD）

- [ ] FR-01〜FR-07 / NFR-01〜NFR-06 が `outputs/phase-01/main.md` に記録されていること
- [ ] `artifacts.json.metadata.visualEvidence = "NON_VISUAL"` / `destructiveOperation = true` が確定していること
- [ ] AC-1〜AC-6 と FR / NFR の対応関係が漏れなくマッピングされていること

## 実行タスク

- Issue #419 本文と起票元 unassigned task の AC を再確認する
- 親仕様 issue-355 の `outputs/phase-12/implementation-guide.md`（rollback / Phase 11 evidence 境界）を確認する
- 本仕様書サイクルの責務外（runtime 実走 / commit / push / PR / aiworkflow-requirements 実書き換え）の境界を明文化する

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- 起票元: `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`
- 親仕様: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

- 本タスクは destructive ops のため自動テスト最小構成。redaction grep / preflight script の dry-run を Phase 04 で定義する。

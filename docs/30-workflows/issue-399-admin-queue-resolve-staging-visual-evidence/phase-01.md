# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## 目的

GitHub Issue #399 の AC を満たすために、staging で `/admin/requests` の実 screenshot 取得に必要な要件を確定する。

## 入力

- Issue #399 本文
- 親 unassigned source: `docs/30-workflows/completed-tasks/task-04b-admin-queue-resolve-staging-visual-evidence-001.md`
- 親 workflow: `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/`

## 要件

### 機能要件

| ID | 要件 |
| --- | --- |
| FR-01 | staging 専用の reversible D1 seed を投入できること（synthetic ID prefix `ISSUE399-` で識別し、D1 schema 変更を行わない） |
| FR-02 | seed 撤去スクリプトで全 seed 行が削除できること（DoD: `SELECT count(*) WHERE id LIKE 'ISSUE399-%'` = 0） |
| FR-03 | 7 状態（pending visibility list / pending delete list / detail panel / approve modal / reject modal / empty state / 409 toast）の UI を staging で再現できること |
| FR-04 | 各状態の screenshot を `outputs/phase-11/screenshots/{state-name}.png` 形式で保存する contract を定義 |
| FR-05 | 親 workflow `implementation-guide.md` に evidence link を追記する diff 案を提示 |

### 非機能要件

| ID | 要件 |
| --- | --- |
| NFR-01 | admin email / セッション token / 実会員 PII を screenshot に映さない（黒塗り or synthetic） |
| NFR-02 | seed は staging のみで実行（production binding は禁止）。`wrangler.toml` 環境チェック必須 |
| NFR-03 | 認証情報は `.env` の op:// 参照経由のみで取得し、コミット・ログ・docs に残さない |
| NFR-04 | screenshot は PII redaction 済の状態でのみコミット可能（Phase 11 redaction-check で検証） |

## artifacts.json metadata（確定値）

```json
{
  "taskType": "implementation",
  "visualEvidence": "VISUAL_ON_EXECUTION",
  "workflow_state": "implementation-prepared"
}
```

## 完了条件

- [ ] - 上記 FR / NFR が `outputs/phase-01/main.md` に記録されていること
- `artifacts.json.metadata.visualEvidence = "VISUAL_ON_EXECUTION"` が確定していること

## 実行タスク

- Phase 01 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。

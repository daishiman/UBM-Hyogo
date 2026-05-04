# Implementation Guide

[実装区分: docs-only / canonical alias]

## Part 1: 中学生レベル

なぜ必要か: 同じ人が別のメールアドレスで申し込むと、学校の名簿に同じ人が二回書かれるような状態になる。このままだと人数を数えるときや連絡するときに困る。

何をするか: この task では、新しい名簿直し係をもう一人増やすのではなく、すでに決まっている名簿直し係の場所を案内する。

### 今回作ったもの

正式な実装場所を指す案内メモを作った。料理でいうと、同じレシピを二冊作るのではなく、正式なレシピ本のページ番号をメモしておく。

専門用語の言い換え:

| 用語 | 言い換え |
| --- | --- |
| canonical | 正式な置き場所 |
| alias | 案内メモ |
| identity | 会員を表す名札 |
| merge | 同じ人の名札を一つにまとめること |
| audit | あとで確認できる記録 |

## Part 2: 技術者レベル

### Type / Interface

```ts
type CanonicalWorkflowPath =
  "docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge";

interface AliasWorkflowResolution {
  taskName: "04c-followup-001-email-conflict-merge-api-and-ui";
  taskType: "docs-only";
  visualEvidence: "NON_VISUAL";
  canonicalWorkflow: CanonicalWorkflowPath;
  implementationStatus: "covered_by_issue_194_implemented_local";
}
```

### APIシグネチャ

This alias root introduces no new runtime API. Runtime API signatures are inherited from the canonical workflow:

- `GET /admin/identity-conflicts`
- `POST /admin/identity-conflicts/:id/merge`
- `POST /admin/identity-conflicts/:id/dismiss`

### 使用例

When Issue #432 appears in planning, route implementation and verification work to:

```bash
CANONICAL_WORKFLOW=docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge
test -d "$CANONICAL_WORKFLOW"
```

Use this root only to confirm that the 04c follow-up name is consumed by the canonical implementation.

### エラーハンドリング

| Case | Handling |
| --- | --- |
| A change tries to add another `/admin/identity-conflicts` workflow here | Reject and update issue-194 canonical workflow instead |
| Runtime screenshot is requested from this alias | Redirect to issue-194 Phase 11 boundary |
| Table names differ from canonical names | Treat as drift and restore `identity_merge_audit`, `identity_aliases`, `identity_conflict_dismissals`, `audit_log` |

### エッジケース

- Issue #432 and Issue #194 both reference identity conflict merge. Issue #194 remains canonical because it already carries implementation files and Phase 12 strict evidence.
- This alias has NON_VISUAL evidence even though the runtime feature is visual. The visual runtime evidence is not waived; it belongs to issue-194.

### 設定項目と定数一覧

| Name | Value |
| --- | --- |
| `taskType` | `docs-only` |
| `visualEvidence` | `NON_VISUAL` |
| `workflow_state` | `completed_alias` |
| `canonical_workflow` | `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge` |

### テスト構成

| Test | Responsibility |
| --- | --- |
| `validate-phase-output.js` | artifacts parity / Phase 11 / Phase 12 output structure |
| `verify-all-specs.js` | phase file structure |
| `validate-phase12-implementation-guide.js` | Part 1 / Part 2 guide requirements |

# Phase 13: PR 作成（承認ゲート後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-400-admin-request-audit-target-taxonomy |
| phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #400 の admin request audit target taxonomy を実装・検証・正本同期する。

## 実行タスク

- Phase 本文の内容を実行し、成果物と検証証跡を同期する。

## 参照資料

- `docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

## 成果物

- root Phase 仕様書と `outputs/phase-*/main.md`


> **重要**: 本仕様書作成プロンプトは PR 作成を行わない。実装プロンプト（`/ai/diff-to-pr` 等）が承認ゲートを通過した後にこの Phase を実行する。

## 事前条件

- Phase 1-12 の全成果物が完成
- Phase 11 evidence ファイルがすべて exit 0
- ユーザーから明示的な PR 作成許可が出ている

## ブランチ命名

`feat/issue-400-admin-request-audit-target-taxonomy`

## コミット分割案

| # | コミットメッセージ | 含むファイル |
| --- | --- | --- |
| 1 | `feat(api): add admin_member_note to AuditTargetType` | `apps/api/src/repository/auditLog.ts` |
| 2 | `feat(api): emit admin_member_note audit on admin request resolve` | `apps/api/src/routes/admin/requests.ts` |
| 3 | `test(api): cover admin_member_note audit append/filter/route paths` | `apps/api/src/repository/__tests__/auditLog.test.ts`, `apps/api/src/routes/admin/{requests,audit}.test.ts` |
| 4 | `chore(shared,web): align audit targetType comment and UI placeholder` | `packages/shared/src/zod/viewmodel.ts`, `apps/web/src/components/admin/AuditLogPanel.tsx`(+test) |
| 5 | `docs: workflow + audit taxonomy sync for issue #400` | `docs/30-workflows/issue-400-...`、`.claude/skills/aiworkflow-requirements/...`（更新時） |

> 上記は推奨分割。実装プロンプトの自律フロー上では単一コミットでも可。

## PR 本文テンプレ

```markdown
## Summary
- admin request resolution audit を first-class `admin_member_note` で識別可能に
- 既存 `member` 行を migration せず後方互換維持
- `/admin/audit?targetType=admin_member_note` で filter 精度を確保

## AC
- [ ] AC-1 新規行が target_type='admin_member_note'
- [ ] AC-2 既存 'member' 行が読み取り可能
- [ ] AC-3 filter 分離
- [ ] AC-4 既存型互換
- [ ] AC-5 shared zod コメント同期
- [ ] AC-6 UI placeholder 更新

## Test plan
- [ ] pnpm typecheck
- [ ] pnpm lint
- [ ] pnpm --filter @ubm-hyogo/api test
- [ ] pnpm --filter @ubm-hyogo/web test
- [ ] coverage-gate (80%) PASS

Refs #400 (already CLOSED — reopen / close automation は行わない)
```

## 完了条件

- PR が gh CLI で作成され URL を取得
- すべての CI gate が PASS

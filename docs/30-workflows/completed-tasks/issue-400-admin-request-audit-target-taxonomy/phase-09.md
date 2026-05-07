# Phase 9: 静的検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-400-admin-request-audit-target-taxonomy |
| phase | 09 |
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


## 検証コマンド（順序実行）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck                  # AC-4: 型整合
mise exec -- pnpm lint                       # 既存コーディング規約遵守
mise exec -- pnpm --filter @ubm-hyogo/api test     # AC-1, AC-2, AC-3, AC-4
mise exec -- pnpm --filter @ubm-hyogo/web test     # AC-6（条件付）
mise exec -- pnpm build                      # 全体ビルド整合
```

## grep ベース静的確認

```bash
# 旧 'member' リテラルが resolve INSERT に残っていないこと
grep -n "'member'" apps/api/src/routes/admin/requests.ts
# → audit INSERT 行に 'member' は無く 'admin_member_note' であること

# AuditTargetType に新値が含まれること
grep -n "admin_member_note" apps/api/src/repository/auditLog.ts
```

## 検証結果保存

各コマンドの stdout を `outputs/phase-9/<command>.log` に保存。エラーがあれば修正→再実行。

## 完了条件

- 全コマンドが exit 0
- grep 確認が期待通り

## 統合テスト連携

- focused unit / route tests と validator を Phase 11 で接続する。

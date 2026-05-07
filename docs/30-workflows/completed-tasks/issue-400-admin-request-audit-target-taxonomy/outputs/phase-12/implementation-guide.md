# 実装ガイド

## Part 1: 中学生レベル

学校の職員室に「だれのことを、何の理由で記録したか」を書くノートがあるとします。今までは、会員本人の情報を変えた記録も、会員からのお願いを先生が確認した記録も、どちらも「会員」という同じ札でまとめていました。そのため、あとから「お願いを確認した記録だけ見たい」と思っても探しにくい状態でした。

今回の変更では、管理者が公開停止や退会のお願いを承認・却下した記録だけに `admin_member_note` という別の札を付けます。昔の記録はそのまま残し、新しく作る記録だけを分けるので、過去の読み取りを壊さずに探しやすくできます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| audit log | 出来事をあとで確認するための記録ノート |
| target type | 記録に付ける分類札 |
| admin_member_note | 管理者が会員のお願いを確認した記録用の札 |
| target id | どの記録を指すかを示す番号 |
| migration | 昔の記録をまとめて書き換える作業 |

## Part 2: 技術者レベル

### 契約

`AuditTargetType` は append 側で `admin_member_note` を受け付ける。read 側の `/admin/audit` と shared view model は legacy 値も読み続けるため `targetType: string` を維持する。

```ts
type AuditTargetType =
  | "member"
  | "admin_member_note"
  | "tag_queue"
  | "schema_diff"
  | "meeting"
  | "system";
```

### 変更点

| 領域 | ファイル | 内容 |
| --- | --- | --- |
| Repository | `apps/api/src/repository/auditLog.ts` | append/listByTarget 用 union に `admin_member_note` 追加 |
| Route | `apps/api/src/routes/admin/requests.ts` | request resolve audit の `target_type` を `admin_member_note`、`target_id` を `note_id` に変更 |
| Route | `apps/api/src/routes/admin/audit.ts` | `targetType` filter は string のまま。新 type は filter 値として自然に通る |
| Shared | `packages/shared/src/zod/viewmodel.ts` | read side は string 維持、append side canonical 値をコメントで明示 |
| Web | `apps/web/src/components/admin/AuditLogPanel.tsx` | placeholder を `admin_member_note` に更新 |

### エッジケース

- 既存 `target_type='member'` 行は migration しない。
- request audit の `memberId` は `after_json.memberId` に残す。
- `target_id` は request note を直接追えるよう `note_id` にする。
- PII masking は既存 `/admin/audit` projection のまま維持する。

### 検証コマンド

- `pnpm --filter @ubm-hyogo/api test -- apps/api/src/repository/__tests__/auditLog.test.ts apps/api/src/routes/admin/requests.test.ts apps/api/src/routes/admin/audit.test.ts`
- `pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/web typecheck`

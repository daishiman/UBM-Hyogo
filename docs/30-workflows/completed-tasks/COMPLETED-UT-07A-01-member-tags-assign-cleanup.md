# COMPLETED: UT-07A-01 memberTags.assignTagsToMember cleanup

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07A-01 |
| タスク名 | memberTags.assignTagsToMember cleanup |
| 分類 | リファクタリング |
| 対象機能 | `apps/api/src/repository/memberTags.ts` / tag queue invariant |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | completed / consumed（`docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/` に昇格済み） |
| 発見元 | 07a Phase 12 unassigned-task-detection |
| 発見日 | 2026-04-30 |
| issue_number | 294 |

## 概要

07a で tag 確定経路を `tagQueueResolve` workflow に集約したため、`apps/api/src/repository/memberTags.ts` の `assignTagsToMember` は production caller がなくなった、という前提で起票された。
2026-05-15 の current topology では `apps/api/src/workflows/tagQueueResolve.ts` が唯一の production caller として存在するため、削除ではなく `tagQueueResolve` workflow 専用 helper として JSDoc / コメントで直接利用禁止を明示する方針へ再解釈した。

## Consumed trace

- 後継 workflow: `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/`
- 状態: `implemented_local_evidence_captured / implementation / NON_VISUAL`
- 実装: `apps/api/src/repository/memberTags.ts` のファイル冒頭コメント、`assignTagsToMember` 関数 JSDoc、`MemberTagsProvider.assignTagsToMember` JSDoc
- テスト補強: `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` の `assign*` 派生禁止 gate、`apps/api/src/repository/__tests__/memberTags.repository.spec.ts` の production caller boundary gate
- Issue #294 は CLOSED 維持。PR 文脈では `Refs #294` のみを使う。

## 背景

不変条件 #13 は「tag 書き込みは queue resolve 経由のみ」。旧 04c 実装の補助関数が残ると、後続実装者が直接書き込み経路を再利用する余地が残る。

## 受入条件（2026-05-15 superseded / completed）

- superseded: 旧受入条件「production code から `assignTagsToMember` が参照されていないことを確認する」は current topology と矛盾するため撤回する
- completed: current topology では production caller が `apps/api/src/workflows/tagQueueResolve.ts` のみであることを確認する
- completed: 残す方針として helper 名・コメントで直接利用禁止を明示する
- completed: `rg "assignTagsToMember"` の結果を Phase 11 evidence として記録する
- completed: `memberTags.readonly.test-d.ts` で `assignTagsToMember` 以外の `assign*` 派生 export を禁止する
- completed: `memberTags.repository.spec.ts` で production caller を `repository/memberTags.ts` と `workflows/tagQueueResolve.ts` に限定する

## 関連

- 07a Phase 12: `outputs/phase-12/unassigned-task-detection.md`
- 不変条件 #13: tag 書き込みは queue resolve 経由のみ

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-090915-wt-3/apps/api/src/repository/memberTags.ts`
- 症状: 07a で `member_tags` への正式書き込みを `tagQueueResolve` に寄せた後も旧 helper が残り、不変条件 #13 を読む後続実装者に「直接書き込みしてよい経路」と誤解される余地が残った。
- 参照: `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| helper を削除して test fixture が壊れる | `rg "assignTagsToMember"` で production / test caller を分け、test helper 化する場合は命名とコメントで直接利用禁止を明示する |
| 旧 helper 経由の直接 `member_tags` INSERT が復活する | 不変条件 #13 を Phase 1 完了条件に入れ、`tagQueueResolve` 以外の INSERT 経路をレビュー対象にする |

## 検証方法

### 静的検証

```bash
rg "assignTagsToMember|member_tags" apps/api/src packages/shared/src
```

期待: production のタグ確定経路が `apps/api/src/workflows/tagQueueResolve.ts` に集約されている。

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- tagQueue
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.readonly
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.repository
```

期待: tag queue repository / route tests が全 PASS。

## スコープ

### 含む

- `assignTagsToMember` の `tagQueueResolve` workflow 専用 helper 化
- 直接利用禁止のコメント・命名整理
- 関連テストの更新（`assign*` 派生禁止 / production caller boundary）

### 含まない

- `tagQueueResolve` workflow の仕様変更
- `member_tags` schema 変更（UT-07A-04 で判断）

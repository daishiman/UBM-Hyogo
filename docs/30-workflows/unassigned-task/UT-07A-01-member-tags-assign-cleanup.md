# UT-07A-01: memberTags.assignTagsToMember cleanup

## メタ情報

```yaml
issue_number: 294
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07A-01 |
| タスク名 | memberTags.assignTagsToMember cleanup |
| 分類 | リファクタリング |
| 対象機能 | `apps/api/src/repository/memberTags.ts` / tag queue invariant |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | 07a Phase 12 unassigned-task-detection |
| 発見日 | 2026-04-30 |

## 概要

07a で tag 確定経路を `tagQueueResolve` workflow に集約したため、`apps/api/src/repository/memberTags.ts` の `assignTagsToMember` は production caller がなくなった。削除、または test/helper 限定 API への縮小を検討する。

## 背景

不変条件 #13 は「tag 書き込みは queue resolve 経由のみ」。旧 04c 実装の補助関数が残ると、後続実装者が直接書き込み経路を再利用する余地が残る。

## 受入条件

- production code から `assignTagsToMember` が参照されていないことを確認する
- 削除する場合は関連 test を更新する
- 残す場合は helper 名・コメントで直接利用禁止を明示する
- `rg "assignTagsToMember"` の結果が意図通りであることを記録する

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
mise exec -- pnpm --filter @repo/api test -- tagQueue
```

期待: tag queue repository / route tests が全 PASS。

## スコープ

### 含む

- `assignTagsToMember` の削除、または test/helper 限定化
- 直接利用禁止のコメント・命名整理
- 関連テストの更新

### 含まない

- `tagQueueResolve` workflow の仕様変更
- `member_tags` schema 変更（UT-07A-04 で判断）

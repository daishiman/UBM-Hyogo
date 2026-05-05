# UT-07A-03: tag queue resolve race smoke

## メタ情報

```yaml
issue_number: 295
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07A-03 |
| タスク名 | tag queue resolve race smoke |
| 分類 | 改善 |
| 対象機能 | staging tag queue resolve race / Phase 11 evidence |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | 07a Phase 12 unassigned-task-detection |
| 発見日 | 2026-04-30 |

## 概要

in-memory D1 では再現しにくい tag queue resolve の同時 POST race を staging smoke として検証する。08b または 09a の smoke に組み込む。

## 背景

07a 実装は `UPDATE ... WHERE status IN ('queued','reviewing')` の guarded update 成功後だけ後続書き込みを行う。実 D1 上でも 1 件のみ成功し、敗者が 409 `race_lost` になり、副作用が残らないことを確認する。

## 受入条件

- 同一 `queueId` に対する並行 confirmed/rejected POST を staging で実行する
- 成功は 1 件のみ、敗者は 409 である
- `member_tags` と `audit_log` が成功 payload 分だけ増える
- 結果を Phase 11 または 08b/09a evidence に保存する

## 関連

- `apps/api/src/workflows/tagQueueResolve.ts`
- 07a Phase 11 API smoke

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-090915-wt-3/apps/api/src/workflows/tagQueueResolve.ts`
- 症状: in-memory D1 / local test では同一 `queueId` への真の同時 POST 競合を再現しにくく、`UPDATE changes=0` の `race_lost` 分岐は unit test だけでは実 D1 の排他挙動まで保証できなかった。
- 参照: `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-11/main.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| staging smoke が副作用データを残す | 専用 fixture queue を作成し、member / tag / audit の期待差分を smoke 後に記録する |
| 並行実行の timing が安定せず flaky になる | 2 リクエスト以上を同時起動する小さな script にし、成功 1 件 / 409 以上 1 件の結果だけを判定条件にする |

## 検証方法

### staging smoke

```bash
# 例: 後続タスクで専用 script 化
node scripts/smoke/tag-queue-race.mjs --env staging --queue-id <fixture-queue-id>
```

期待: 同一 queue に対する並行 confirmed/rejected のうち成功は 1 件のみ、敗者は 409 `race_lost`。

### 副作用確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "select count(*) from member_tags where member_id='<fixture-member-id>';"
```

期待: `member_tags` と `audit_log` は成功 payload 分だけ増える。

## スコープ

### 含む

- staging 専用の並行 POST smoke 手順または script
- `race_lost` と副作用 1 回限りの evidence 保存
- 08b または 09a Phase 11 証跡への組み込み

### 含まない

- queue resolve SQL の再設計
- member_tags schema 変更（UT-07A-04 で判断）

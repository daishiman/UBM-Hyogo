# task-issue-109-dlq-requeue-api-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-109-dlq-requeue-api-001 |
| 分類 | implementation / admin operation |
| 優先度 | 中 |
| ステータス | unassigned |
| 発見元 | issue-109 UT-02A Phase 12 unassigned-task-detection |

## 概要

`tag_assignment_queue.status='dlq'` に隔離された行を、管理者判断で `queued` へ戻す API / repository 関数を設計・実装する。

## 苦戦箇所【記入必須】

UT-02A では fail-closed を優先し、DLQ 行の自動再投入を実装しなかった。現状は `listDlq` と admin filter で確認できるが、復旧操作は未提供である。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 誤 requeue で poison message が再発する | reason / actor / attempt reset policy を必須入力にする |
| terminal status の逆走が不透明になる | `dlq -> queued` のみ専用 API と audit action で許可する |

## 検証方法

- `dlq` 行のみ requeue 可能で、`resolved` / `rejected` は 409 になることを unit test で確認する。
- `admin.tag.queue_requeued` audit が 1 件記録されることを route test で確認する。

## スコープ

含む: repository `requeueFromDlq`、admin API、audit、unit / route test。
含まない: retry tick 自動実行、DLQ 自動再投入。

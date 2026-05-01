# task-issue-109-tag-queue-pause-flag-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-109-tag-queue-pause-flag-001 |
| 分類 | implementation / operations guard |
| 優先度 | 低 |
| ステータス | unassigned |
| 発見元 | issue-109 UT-02A Phase 12 / Phase 13 rollback notes |

## 概要

`TAG_QUEUE_PAUSED` 等の緊急停止 flag を導入し、Forms sync からの candidate enqueue を一時停止できるようにする。

## 苦戦箇所【記入必須】

Phase 12/13 では rollback 操作として pause flag を想定したが、現行実装には env flag がない。運用方針だけが残ると、障害時に停止手段を誤認する。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| flag の未設定時に enqueue が止まる | default は enabled とする |
| 停止中の理由が追跡できない | skip reason `paused` と structured log を追加する |

## 検証方法

- flag 未設定 / false では enqueue される。
- flag true では INSERT 0 件、result reason `paused` になる。

## スコープ

含む: env binding、enqueue guard、test、runbook 更新。
含まない: admin UI toggle。

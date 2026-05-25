# [#837] serial-05-step-03 followup-006: schema alias 複数一括 rollback

## メタ情報

```yaml
issue_number: 837
title: serial-05-step-03 followup-006: schema alias 複数一括 rollback
state: OPEN
priority: 低
scale: 大規模
category: followup
status: -
created_date: 2026-05-19
updated_date: 2026-05-19
url: https://github.com/daishiman/UBM-Hyogo/issues/837
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 大規模 |
| ステータス | - |

---

## 概要

Issue #778 で実装した単一 alias rollback / undo に対し、複数 alias を一括で rollback する機能を追加する。

部分成功、version mismatch、並列 resolve、audit log 粒度、UI confirmation の設計が単体 rollback より複雑なため、単体 rollback の運用が安定したあと独立設計する。

## 仕様書

`docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md`

## スコープ

### 含む
- 複数 alias rollback request / response contract
- per-alias 楽観ロックと部分失敗時の表示
- audit log の per-alias 記録または batch parent-child 記録方式
- admin UI の bulk selection / confirm modal

### 含まない
- 単体 rollback / undo 本体（Issue #778）
- 集計再実行（followup-005）
- notification（followup-007）

## 受入条件

- 1 件でも version mismatch がある場合の transaction 方針が明示されている
- audit log から各 alias の rollback 結果を追跡できる
- UI が部分成功 / 全失敗 / 全成功を区別して表示する

## 発見元

`docs/30-workflows/issue-778-schema-alias-rollback-undo/` Phase 12

# [#235] [task-ut21-sync-audit-tables-necessity-judgement-001] sync_audit_logs / sync_audit_outbox の必要性判定（sync_jobs ledger 不足分析）

## メタ情報

```yaml
issue_number: 235
title: [task-ut21-sync-audit-tables-necessity-judgement-001] sync_audit_logs / sync_audit_outbox の必要性判定（sync_jobs ledger 不足分析）
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/235
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 目的

UT-21 が要求していた `sync_audit_logs`（毎実行の詳細監査）と `sync_audit_outbox`（audit 書き込み失敗時の retry 用 best-effort バッファ）を新規テーブルとして導入すべきか、現行 `sync_jobs` ledger の拡張で十分かを判定する。

判定結果に応じて:
- 不足が証明できない場合: 新規テーブル追加なし。本ファイルを判定証跡として残す
- 不足が証明できる場合: 02c-parallel タスクへ schema 拡張（追加カラム or 追加テーブル）の受入条件として移植

## スコープ

### 含むもの
- `sync_jobs` ledger が現状提供する情報の棚卸し
- UT-21 が要求する audit 観点（実行ごと詳細・best-effort 失敗バッファ・後追い清書）の列挙
- ギャップ分析と判定（テーブル新設要 / `sync_jobs` 拡張で吸収 / 既存で十分）
- 判定結果の closeout-001 への反映

### 含まないもの
- 新テーブルのマイグレーション SQL 作成
- `apps/api` 側 audit writer の実装
- commit / PR 作成

## 依存関係

| 種別 | 対象 |
| --- | --- |
| 上流 | task-ut21-forms-sync-conflict-closeout-001（親 close-out） |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary（`sync_jobs` repository 正本） |
| 横 | 03a / 03b（ledger の使用者） |

## 判定基準

以下のいずれかが該当する場合のみ新設を検討:
1. 行単位の差分追跡が運用上の必須要件
2. `sync_jobs` テーブル自体への書き込み失敗を別経路で記録する必要がある
3. 監査要件（外部監査・コンプラ）で「実行履歴を別テーブルに分離する」要請がある

## 苦戦箇所

- **症状**: UT-21 仕様が `sync_audit_logs` + `sync_audit_outbox` を前提にしているが、現行は `sync_jobs` ledger のみ。
- **原因**: UT-21 は Sheets sync の best-effort モデル（行単位 audit + 失敗時 outbox 退避）前提で書かれていた。Forms sync では `forms.responses.list` 自体が冪等なので、行単位 audit よりも job 単位の `metrics_json` で十分なケースが多い。
- **判定の難しさ**: 「将来の監査要件」を理由に新設すると過剰実装。逆に「現状不要」で却下すると、後で実需が出たときに schema migration が必要になる。判定基準を事前明文化することが重要。
- **再発防止**: 監査テーブル新設の判定は (a) 既存 ledger の不足を行単位 / job 単位 / 失敗リカバリの 3 軸で示す、(b) 運用イベント（外部監査 / コンプラ）の有無を確認、の 2 段階で行う。

---

Task spec: [docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md](https://github.com/daishiman/UBM-Hyogo/blob/main/docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md)

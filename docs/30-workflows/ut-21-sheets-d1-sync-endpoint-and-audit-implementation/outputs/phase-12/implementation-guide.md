# UT-21 Phase 12 Implementation Guide

## Part 1: 中学生向け

このタスクは、Google スプレッドシートに集まった会員フォームの回答を、私たちの自前のノート（D1 データベース）に毎時間まとめて写す仕組みとして作られた仕様です。

ただし、今の正本仕様では「スプレッドシートを読む」のではなく「Google Forms の回答を読む」方式に変わっています。つまり、古い地図を見ながら新しい道を作ろうとしている状態です。

- 同期の例え: クラスのアンケート用紙（Google Sheets）と、先生がまとめる名簿（D1）を、係の人（Cron Trigger）が毎時間見比べて、新しい回答だけを写す想定でした。
- 冪等の例え: 同じ人が 2 回書いていても、合言葉（SHA-256 で作った response_id）が同じなら、名簿にダブって載りません。
- audit + outbox の例え: 写した記録は別ノート（audit）に毎回つけます。万一そのノートをなくしても、メモ用紙（outbox）に貼っておいて後で清書するので、本体の名簿は消しません。
- admin 権限の例え: 手動再実行ボタンは先生だけが押せます。`SYNC_ADMIN_TOKEN` は「先生だけが持つ合言葉」です。

今回のレビュー結論は、この古い想定をそのまま正本仕様へ混ぜないことです。混ぜると、Forms 方式と Sheets 方式の 2 つが同時に正しいように見えて、次の実装者が間違った API やテーブルを追加する危険があります。

## Part 2: 技術者向け

### 現行正本との差分

| 観点 | UT-21 仕様 | 現行正本 |
| --- | --- | --- |
| 同期元 | Google Sheets API v4 | Google Forms API (`forms.get`, `forms.responses.list`) |
| 手動 API | `POST /admin/sync`, `POST /admin/sync/responses`, `GET /admin/sync/audit` | `POST /admin/sync/schema`, `POST /admin/sync/responses` |
| 認可 | `Authorization: Bearer <SYNC_ADMIN_TOKEN>` | `Authorization: Bearer <SYNC_ADMIN_TOKEN>` |
| 監査 | `sync_audit_logs`, `sync_audit_outbox` | `sync_jobs` ledger |
| 実装モジュール | `apps/api/src/sync/*` 想定 | `apps/api/src/sync/schema/*`, `apps/api/src/jobs/sync-forms-responses.ts` |

### API 境界

`POST /admin/sync/responses` は現行正本に存在するため、維持対象です。一方で `POST /admin/sync` と `GET /admin/sync/audit` を UT-21 のまま追加すると、`task-sync-forms-d1-legacy-umbrella-001` の「単一 `/admin/sync` を新設しない」方針と衝突します。

### 型・実装メモ

UT-21 が要求する `Env` / `SheetRow` / `SyncResult` / `AuditLog` / `BackfillOptions` は、Sheets 前提の型として扱います。現行 Forms 実装へ取り込む場合は、`SheetRow` ではなく Forms response DTO と `sync_jobs.metrics_json` の契約へ再設計する必要があります。

### 認可境界

| 状況 | 期待 | 実装位置 |
| --- | --- | --- |
| Bearer token valid | 200 | Hono route / middleware |
| Authorization header なし | 401 | bearer guard |
| Bearer token 不一致 | 403 | bearer guard |
| 既存ジョブ実行中 | 409 | `sync_jobs` 同種 job ledger |

### Phase 12 判定

本 Phase では、UT-21 の Sheets/audit-outbox 仕様を正本仕様へ直接反映しません。正本仕様と矛盾するため、改善方針は「現行 Forms sync へ吸収する差分だけを別タスクで扱う」です。

### Screenshot

`visualEvidence=NON_VISUAL` で UI 変更はありません。`outputs/phase-11/` には smoke/log 系の証跡を置き、スクリーンショット参照は不要です。

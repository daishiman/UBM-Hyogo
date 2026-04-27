# Phase 1: 要件定義

## 目的
`apps/api/src/repository/` に 7 ファイル（meetings / attendance / tagDefinitions / tagQueue / schemaVersions / schemaQuestions / schemaDiffQueue）を提供し、開催 / queue / schema 系 D1 テーブルへの単一窓口を構築する。

## 機能要件
| ID | 要件 | 関連 AC |
| --- | --- | --- |
| FR-1 | meeting_sessions の CRUD（read 中心、admin 経路 insert） | AC-1 |
| FR-2 | member_attendance の重複登録を D1 PRIMARY KEY 制約で阻止 | AC-2 |
| FR-3 | listAttendableMembers が `member_status.is_deleted=1` を除外 | AC-7 |
| FR-4 | tag_assignment_queue の `queued → reviewing → resolved` のみ許可、逆遷移は throw | AC-4 |
| FR-5 | tag_definitions に write API を提供しない（不変条件 #13） | AC-1 |
| FR-6 | schemaVersions.getLatestVersion が `state='active'` を 1 件返す | AC-3 |
| FR-7 | schemaDiffQueue.list が `status='queued'` を `created_at ASC` で返す | AC-5 |
| FR-8 | tagDefinitions.listByCategory が 6 カテゴリすべてに値を返す | AC-6 |
| FR-9 | dependency-cruiser で 02a / 02c との相互 import を 0 にする | AC-9 |
| FR-10 | D1 read query は index 利用 + LIMIT で N+1 を防ぐ | AC-8 |

## 非機能要件
- 配置: `apps/api/src/repository/` のみ（不変条件 #5）
- 共有: `_shared/db.ts` `_shared/brand.ts` を 02a が初出 source として再利用
- テスト: vitest unit + 偽 D1 fake で制約系を検証
- 無料枠: D1 5GB / 500k reads/day を逸脱しない設計

## 触れる不変条件
- #5 D1 直接アクセスは apps/api 内 repository に閉じる
- #13 tag は admin queue → resolve 経由（直接編集禁止）
- #14 schema 変更は `/admin/schema` に集約
- #15 attendance 重複登録不可・削除済み会員は除外

## 受入条件 (AC-1〜AC-9)
index.md の AC をそのまま継承。

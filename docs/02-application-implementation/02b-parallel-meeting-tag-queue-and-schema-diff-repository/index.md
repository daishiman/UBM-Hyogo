# 02b-parallel-meeting-tag-queue-and-schema-diff-repository — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| ディレクトリ | doc/02-application-implementation/02b-parallel-meeting-tag-queue-and-schema-diff-repository |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | data / api |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

開催 / queue / schema 系の D1 repository（`meeting_sessions` / `member_attendance` / `tag_definitions` / `tag_assignment_queue` / `schema_versions` / `schema_questions` / `schema_diff_queue`）を `apps/api/src/repository/` 配下に実装する。`member_attendance` の重複制約と「削除済み会員除外」、`tag_assignment_queue` の状態遷移、`schema_diff_queue` の latest version 解決を構造で守る。

## スコープ

### 含む

- `apps/api/src/repository/meetings.ts` — meeting_sessions CRUD（read 中心）
- `apps/api/src/repository/attendance.ts` — member_attendance CRUD、重複防止 / 削除済み除外 helper
- `apps/api/src/repository/tagDefinitions.ts` — tag 辞書の read（write は seed 起源、本タスクで write API は提供しない）
- `apps/api/src/repository/tagQueue.ts` — tag_assignment_queue の queued/reviewing/resolved 状態管理
- `apps/api/src/repository/schemaVersions.ts` — form_manifests / schema 版管理、`getLatestVersion()` 等
- `apps/api/src/repository/schemaQuestions.ts` — form_fields / schema の field レベル
- `apps/api/src/repository/schemaDiffQueue.ts` — schema_diff_queue（added/changed/removed/unresolved）
- attendance 重複制約 fixture / test
- 02a の `_shared/db.ts` / `_shared/brand.ts` を再利用（02a が初出 source）

### 含まない

- members / identities / status / responses / tags（02a）
- admin_users / admin_member_notes / audit_log / sync_jobs / magic_tokens（02c）
- queue resolve workflow ロジック（07a / 07b）
- attendance 削除済み除外の API 層実装（07c）
- `apps/web` → D1 直接禁止 ESLint rule（02c）
- Forms 同期実体（03a）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01a-parallel-d1-database-schema-migrations-and-tag-seed | D1 schema / migration |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | view model / branded type |
| 下流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | schema_versions / schema_questions / schema_diff_queue へ書込み |
| 下流 | 04c-parallel-admin-backoffice-api-endpoints | `/admin/tags/queue`, `/admin/schema/diff`, `/admin/meetings` の repository |
| 下流 | 07a-parallel-tag-assignment-queue-resolve-workflow | tagQueue の状態遷移実装 |
| 下流 | 07b-parallel-schema-diff-alias-assignment-workflow | schemaDiffQueue の resolve |
| 下流 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | attendance の API 層、削除済み除外 |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | repository contract test |
| 並列 | 02a / 02c | 同 Wave、互いの table 群は独立 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | DDL / index / 整合ルール |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | tag queue / schema diff / meeting 仕様 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag 辞書 6 カテゴリ / 30 タグ |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | TagAssignmentQueueItem / SchemaDiffReviewView / MeetingWithAttendance |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | data flow / queue 発生条件 |
| 参考 | doc/02-application-implementation/_design/phase-2-design.md | Wave 2b 詳細 |
| 参考 | doc/02-application-implementation/02a-... | `_shared/` 共有点 |

## 受入条件 (AC)

- AC-1: `apps/api/src/repository/{meetings,attendance,tagDefinitions,tagQueue,schemaVersions,schemaQuestions,schemaDiffQueue}.ts` 7 ファイルが存在し unit test pass
- AC-2: `member_attendance` の同一 `(member_id, session_id)` 重複登録が **D1 の PRIMARY KEY 制約で阻止** される test green（INSERT 失敗）
- AC-3: `schemaVersions.getLatestVersion()` が `state='active'` の form_manifest を 1 件返す test pass
- AC-4: `tagQueue.transitionStatus()` が `queued → reviewing → resolved` の **unidirectional** 遷移のみ許可（逆方向は throw）
- AC-5: `schemaDiffQueue.list()` が `unresolved` items を `created_at` 昇順で返す
- AC-6: `tagDefinitions.listByCategory()` が 6 カテゴリ全てに対し空配列ではなく値を返す（01a の seed 完了前提）
- AC-7: `attendance.listAttendableMembers(sessionId)` が `member_status.is_deleted = 1` の member を必ず除外（削除済み除外、不変条件 #15）
- AC-8: D1 read query が無料枠（500k reads/day）を意識した N+1 防止設計
- AC-9: 02a / 02c と相互 import がゼロ（dependency-cruiser）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/{main,module-map,dependency-matrix}.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/{main,verify-suite}.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/{main,runbook}.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/{main,failure-cases}.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/{main,ac-matrix}.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/{main,free-tier,secret-hygiene}.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/{main,manual-evidence}.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/* 6 種 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/* 4 種 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | phase-01.md 〜 phase-13.md | 13 phase 別仕様 |
| メタ | artifacts.json | 機械可読サマリー |
| ドキュメント | outputs/phase-02/module-map.md | 7 repo + helper の関係 |
| ドキュメント | outputs/phase-04/verify-suite.md | unit + DB constraint test |
| ドキュメント | outputs/phase-05/runbook.md | 実装 step + placeholder |
| ドキュメント | outputs/phase-12/implementation-guide.md | 03a / 04c / 07a/b/c / 08a 向け guide |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare D1 | repository アクセス先 | 5GB / 500k reads/day |
| vitest | unit test runner | OSS |
| miniflare D1 | in-memory test | OSS |
| dependency-cruiser | 02a / 02c との相互 import 検出 | OSS |

## Secrets 一覧（このタスクで導入）

なし。

## 触れる不変条件

| # | 不変条件 | このタスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | repository は `apps/api/src/repository/` のみ |
| 13 | tag は admin queue → resolve 経由（直接編集禁止） | `tagDefinitions.ts` / `memberTags`（02a の write 不在）と組み合わせ、tagQueue の状態遷移で resolve 経路を強制 |
| 14 | schema 変更は `/admin/schema` に集約 | `schemaDiffQueue.ts` を repository として用意、04c の `/admin/schema/*` がここを呼ぶ |
| 15 | meeting attendance は重複登録不可、削除済み会員は除外 | `member_attendance` の PK 制約 + `listAttendableMembers` の filter |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-9 が Phase 7 / 10 で完全トレースされる
- 4 条件 PASS
- Phase 12 implementation-guide が 03a / 04c / 07a/b/c の入り口になっている
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- 並列タスク: ../02a-... , ../02c-...

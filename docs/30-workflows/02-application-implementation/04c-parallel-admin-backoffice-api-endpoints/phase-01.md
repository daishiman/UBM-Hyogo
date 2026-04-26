# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`/admin/*` 18 endpoints の責務と認可境界・上流引き渡しを Phase 1 で確定する。本人プロフィール本文の直接編集禁止（不変条件 #4, #11）、admin_member_notes の公開非露出（#12）、tag は queue → resolve 経由のみ（#13）、schema 変更は `/admin/schema` 集約（#14）、attendance 重複 / 削除済み除外（#15）を要件として固定する。

## 真の論点 (true issue)

- admin gate を route mount 単位（`app.use('/admin/*', adminGate)`）か handler 単位かのどちらで強制するか → mount 単位で強制し、誤解放を構造的に防ぐ
- sync trigger（schema / responses）が長時間 job となるため、Cloudflare Workers の execution time（CPU 50ms / wall 30s 制限）に対し queue で非同期化が必要か → 02c の `sync_jobs` テーブルでステータス管理し、トリガーは 202 + jobId 返却 + 実行は cron / queued worker（09b 担当）
- meetings 作成時の `sessionId` 命名（uuid vs slug）→ uuid に統一（02b の AC と整合）
- admin_member_notes の note 編集 API（PATCH）で過去履歴を保持するか → audit_log で履歴を持ち、notes 本文は最新のみ保持

## 依存境界

| 種別 | 対象 | 引き渡し内容 |
| --- | --- | --- |
| 上流 | 02a memberRepository | members / status / responses 取得 |
| 上流 | 02b meetingRepository / attendanceRepository / tagQueueRepository / schemaDiffQueueRepository | meetings / attendance / queue 系 CRUD |
| 上流 | 02c adminUsersRepository / adminMemberNotesRepository / auditLogRepository / syncJobsRepository | 管理操作の永続化 |
| 上流 | 03a schemaSyncJob | `POST /admin/sync/schema` の起動 |
| 上流 | 03b responseSyncJob | `POST /admin/sync/responses` の起動 |
| 上流 | 01b view models | AdminDashboardView / AdminMemberListView / AdminMemberDetailView / AdminTagQueueView / AdminSchemaDiffView / AdminMeetingListView |
| 下流 | 05a admin gate middleware | `admin_users` を確認する middleware を本タスクが consume |
| 下流 | 05b magic link | login 後の admin gate 通過 |
| 下流 | 06c admin pages | 18 endpoint を SSR/CSR で消費 |
| 下流 | 07a / 07b / 07c | resolve / alias / attendance workflow が本 endpoint を入口とする |
| 下流 | 08a contract / authz tests | 全 endpoint の verify suite を網羅 |

## 価値とコスト

- 初回価値: 管理者が「会員状態管理 / タグ割当 / schema 差分対応 / 開催日と参加履歴 / 同期 trigger」を 1 系統 API で実行できる。
- 初回で払わないコスト: 他人プロフィール本文編集 UI / admin user 管理 UI / 物理削除 / タグ辞書編集 UI（spec 11, 12 で不採用）。
- 撤退コスト: workflow（07a/b/c）が変わってもエンドポイント名は維持し、handler 内部のみ差し替え可能。

## 4 条件

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | spec 11 が要求する 5 画面（dashboard / members / tags / schema / meetings）を成立させるか | PASS | 18 endpoint で 5 画面 + sync trigger を網羅 |
| 実現性 | 02a / 02b / 02c / 03a / 03b の repository が揃った状態で 1 wave 内に書けるか | PASS | 上流 5 タスクの AC 満了が前提 |
| 整合性 | admin gate / 不変条件 #4 / #11 / #12 / #13 / #14 / #15 が構造で保証できるか | PASS | endpoint 構造と zod schema で保証 |
| 運用性 | sync trigger が Workers 制限内で完結し audit_log で追跡できるか | PASS | 202 + jobId + cron 実行 |

## スコープ

### 含む

- 18 endpoint
- admin gate middleware の consumer 実装
- 全 admin 操作の audit_log 記録
- sync trigger の job ID 返却 + 重複防止

### 含まない

- 他人プロフィール本文編集 endpoint（不変条件 #11）
- 物理削除（不変条件 #15 と spec 07）
- `/admin/users` 管理者管理 endpoint（spec 11 で不採用）
- タグ辞書編集 endpoint（spec 12 で不採用）
- workflow 内部ロジック（07a/b/c）
- Auth.js provider 設定（05a）

## 実行タスク

1. 18 endpoint の入出力 contract を箇条書きで確定
2. admin gate middleware の責務（apps/api router mount 時に install）を index.md と整合
3. 不変条件 #11, #12, #13, #14, #15 を「endpoint 構造での保証」として表に落とす
4. sync trigger の job ID 仕様（uuid + 状態 queued/running/done/failed）確定
5. AC × 不変条件 mapping の下書き

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 管理者責務 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag queue |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 公開状態 / 削除 / 復元 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | admin 判定 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | 管理ページ認証 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model 型 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | テーブル定義 |
| 参考 | doc/00-getting-started-manual/specs/01-api-schema.md | schema |

## 実行手順

### ステップ 1: input 確認

- index.md の AC-1〜AC-11 を各 endpoint × 不変条件で説明
- 上流 02a/b/c, 03a/b の AC を読み、提供される helper シグネチャを書き出す

### ステップ 2: 主成果物作成

- `outputs/phase-01/main.md` に「18 endpoint 仕様 + 引き渡し + AC マッピング」を記述

### ステップ 3: 4 条件 + handoff

- Phase 2 で「Mermaid + module 設計 + dependency matrix + env」へ展開する点を明示

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | endpoint contract と handler module 配置 |
| Phase 4 | unit / contract / authz テストへ AC を引き渡し |
| Phase 7 | AC matrix の row として全 18 endpoint × 11 AC を保持 |
| Phase 10 | GO/NO-GO 判定の根拠 |
| Phase 12 | spec sync 判断 |

## 多角的チェック観点（不変条件マッピング）

- #1 schema 固定しすぎない: schema diff endpoint で stableKey alias を後付け可能（理由: spec 03 と整合）
- #4 本文 D1 編集禁止: PATCH /admin/members/:memberId/profile 等を作らない（理由: spec 07）
- #5 apps/web → D1 禁止: 本タスクは apps/api 側で完結（理由: 境界遵守）
- #7 responseId vs memberId: AdminMemberDetailView で別フィールド（理由: 型安全）
- #11 他人プロフィール本文の直接編集禁止: PATCH 系の対象は status / notes / tag queue / schema alias / meeting / attendance のみ（理由: spec 11）
- #12 admin_member_notes 公開非露出: notes は AdminMemberDetailView にのみ含める。AdminMemberListView / public / member view model に含めない（理由: spec 11）
- #13 tag は queue 経由: PATCH /admin/members/:memberId/tags 不在、`POST /admin/tags/queue/:queueId/resolve` のみ（理由: spec 12）
- #14 schema は /admin/schema 集約: schema 変更は `/admin/schema/diff` と `/admin/schema/aliases` のみ（理由: spec 11）
- #15 attendance 重複禁止 / 削除済み除外: POST attendance で 409 + 422、tag/schema/dashboard で削除済みを集計外（理由: spec 11）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 18 endpoint contract 下書き | 1 | pending | outputs/phase-01/main.md |
| 2 | 上流 repository 引き渡し定義 | 1 | pending | 02a / 02b / 02c / 03a / 03b と整合 |
| 3 | 不変条件 → AC mapping | 1 | pending | Phase 7 への伏線 |
| 4 | sync trigger 仕様確定 | 1 | pending | job ID + 状態 |
| 5 | 4 条件評価 | 1 | pending | 全 PASS 想定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] 18 endpoint の input / output と認可境界が確定している
- [ ] 上流 5 タスクへの要求が記述されている
- [ ] AC-1〜AC-11 と不変条件 #4 / #11 / #12 / #13 / #14 / #15 の対応が下書きされている
- [ ] 4 条件が全 PASS で記録されている

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- artifacts.json の Phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 18 endpoint contract、上流引き渡し、AC × 不変条件 mapping を Phase 2 の Mermaid / module 設計 / env / dependency matrix に展開
- ブロック条件: 上流 5 タスクの AC が未記述なら次 Phase 開始しない

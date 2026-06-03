# Phase 1: 要件定義

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。「404 を直す = 動かす」ためコード変更必須。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 1 / 要件定義 |
| 分類 | implementation / bugfix / NON_VISUAL |
| implementation_mode | new |
| 依存 Phase | なし（起点） |
| 後続 Phase | Phase 2（設計） |

## 目的

admin 会員管理の `GET /admin/members/:memberId` / `PATCH /admin/members/:memberId/status` が staging で 404 になる問題のスコープ・受け入れ条件・変更 inventory を固定する。真因はデータ整合性（`member_status` 欠落）であり、`apps/api` のみで耐性化＋予防＋backfill により是正する。

## 実行タスク

### 1.1 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | No | 通常の実装 Phase（`implementation_mode: "new"`） |
| upstream（main/dev）にマージ済み | No（HEAD は `origin/dev` と一致するが本修正は未実装） | 未マージとして扱う |
| 前提タスク（依存）完了済み | 依存なし | 依存チェック省略 |

→ `implementation_mode: "new"`。既存 endpoint surface は変更せず、内部ロジックの耐性化と新規 helper / migration を追加する。

### 1.2 タスク分類

- **NON_VISUAL**。変更は `apps/api`（+ D1 migration）に閉じ、`apps/web` は無変更。UI は 200 を受信すれば既存描画で会員詳細を表示する。
- Phase 11 は NON_VISUAL（自動テスト証跡 + staging admin 画面はユーザーゲート）。`screenshots/.gitkeep` は作らない。

### 1.3 受け入れ基準（index.md §3 と同一・測定可能化）

| # | 受け入れ基準 | 測定方法 |
|---|-------------|---------|
| AC-1 | `member_status` 欠落会員でも `GET /admin/members/:memberId` が 200（既定 status 適用） | api contract test |
| AC-2 | `current_response` 欠落会員でも詳細は劣化 view で 200（summary 空 / sections []） | builder.repository.spec |
| AC-3 | `PATCH .../status` が `member_status` 欠落でも成功し行を生成して反映 | member-status route spec |
| AC-4 | `member_identities` 不存在の memberId は引き続き 404 | route spec（unknown id）|
| AC-5 | ingest 新規 identity で `member_status` 既定行が必ず生成される | sync-forms-responses spec |
| AC-6 | migration 0024 で orphan 全件に `member_status` 行（冪等） | migration D1 config test |
| AC-7 | 正常会員の詳細/status/一覧は非回帰 | 既存 spec 全 PASS |
| AC-8 | `apps/web` diff 0 | `git diff --name-only` |

### 1.4 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 領域 | 既存規則 | 本タスクの新規命名（一貫性担保） |
|------|---------|------|
| repo 関数 | `getStatus` / `setPublishState` / `setConsentSnapshot` / `setDeleted`（camelCase, `status.ts`） | `ensureMemberStatusRow`（camelCase・動詞 + 対象） |
| repo SQL | `INSERT ... ON CONFLICT(member_id) DO UPDATE`（status.ts 既存） | `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)`（冪等・既定行生成） |
| migration | `NNNN_snake_case.sql`（4 桁連番） | `0025_backfill_member_status.sql` |
| builder | `buildAdminMemberDetailView`（PascalView, `_shared/builder.ts`） | 既存関数を拡張（新規関数を増やさない） |
| 既存判定関数 | `findMemberById`（`members.ts:29`） | 詳細/status の存在判定に再利用（新規 exists 関数は最小限） |

### 1.5 inventory（変更対象ファイル俯瞰）

#### apps/api（実装本体）

| ファイル | 種別 | 概要 |
|---------|------|------|
| `apps/api/src/repository/status.ts` | 編集 | `ensureMemberStatusRow(c, mid)` 新設（`INSERT OR IGNORE`）。`DEFAULT_MEMBER_STATUS`（既定 status オブジェクト）を export |
| `apps/api/src/repository/_shared/builder.ts` | 編集 | `buildAdminMemberDetailView`: `if (!identity) return null` のみ残し、status 欠落→既定値、response 欠落→劣化 view |
| `apps/api/src/routes/admin/member-status.ts` | 編集 | 404 判定を `member_identities` 存在へ変更。mutation 前に `ensureMemberStatusRow` |
| `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | 新規 identity 作成直後に `ensureMemberStatusRow` を呼ぶ（予防） |
| `apps/api/migrations/0025_backfill_member_status.sql` | 新規 | orphan `member_identities` に既定 `member_status` 行を `INSERT OR IGNORE` |

#### tests（回帰）

| ファイル | 種別 | 概要 |
|---------|------|------|
| `apps/api/src/repository/__tests__/status.repository.spec.ts`（または既存 status spec） | 新規/編集 | `ensureMemberStatusRow` 冪等・既定値（D1 config）|
| `apps/api/src/repository/__tests__/builder.repository.spec.ts` | 編集 | status 欠落 / response 欠落で 200 劣化 view（null でない） |
| `apps/api/src/routes/admin/__tests__/member-status.*.spec.ts` | 編集/新規 | status 欠落で PATCH 成功・行生成 / identity 不存在で 404 |
| `apps/api/src/jobs/__tests__/sync-forms-responses.*.spec.ts` | 編集/新規 | 新規 identity で member_status 生成 |
| `apps/api/migrations/__tests__/0025_backfill_member_status.spec.ts`（または migration test 慣例に従う） | 新規 | backfill が orphan を埋め冪等 |

> **[FB-MSO-002]** repository / migration テストは D1 binding が必要（`vitest.d1.config.ts`）。unit config（`vitest.config.ts`）は repository spec を exclude する慣例のため、対象 spec の config を Phase 4 で明示する。

### 1.6 carry-over 確認

直前コミット（`git log --oneline -5`）は #1031 member self photo / #1029 public photo / #1084 OG worker 等で本件と無関係。本 workflow は新規ブランチ `fix/admin-member-detail-status-404`（`origin/dev` = `bd0393a29` 起点）で開始。

## 参照資料

- `apps/api/src/repository/_shared/builder.ts:372-447`（`buildAdminMemberDetailView`）
- `apps/api/src/routes/admin/member-status.ts:37-79`（PATCH handler）
- `apps/api/src/routes/admin/members.ts:329-494`（list + detail handler）
- `apps/api/src/repository/status.ts:31-139`（`getStatus` / `setPublishState` / `setConsentSnapshot`）
- `apps/api/src/jobs/sync-forms-responses.ts:303-391`（ingest）
- `apps/api/migrations/0002_admin_managed.sql:5-15`（member_status DDL）
- `apps/web/app/api/admin/[...path]/route.ts`（プロキシ・無変更の確認）

## 成果物

- 本ファイル（Phase 1 要件定義）
- index.md §1 根本原因 / §2 採用方針 / §3 AC との整合

## 統合テスト連携

- AC-1〜AC-7 は Phase 4 で RED テストへ写像し、Phase 5 実装で GREEN 化する。
- AC-8（apps/web diff 0）は Phase 9 / Phase 10 で `git diff --name-only` により検証する。

## 完了条件

- [x] P50 チェックを記録した（implementation_mode = new）
- [x] タスク分類を NON_VISUAL と確定した
- [x] AC-1〜AC-8 を測定可能な形で固定した
- [x] 命名規則分析（`ensureMemberStatusRow` 等）を記録した
- [x] 変更対象ファイル inventory を apps/api に限定して列挙した

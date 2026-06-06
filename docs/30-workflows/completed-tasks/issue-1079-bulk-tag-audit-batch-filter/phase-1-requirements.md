# Phase 1: 要件定義

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| task_id | `task-issue-1036-followup-003-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| related_issue | #1079（CLOSED） |
| parent_workflow | `issue-1036-bulk-member-tag-assign`（完了済み・landed） |
| taskType | implementation（改善） |
| visualEvidence | VISUAL_ON_EXECUTION |
| implementation_mode | new |

> 本ファイルはタスク仕様書（design 文書）であり、コード実装は含まない。runtime 完了は記載しない。

---

## 目的

親 #1036（bulk member tag assign/unassign）は、実 mutation した member×tag 単位で `audit_log` に
`batchId` を埋め込み、1 回の一括操作を相関できるようにした。しかし `/admin/audit` 画面・audit API には
batchId で一括操作単位を検索・表示する導線が無い。運用者は audit JSON を手作業で目視（JSON inspection）して
batchId を突き合わせるしかなく、追跡コストが高い。

本タスクは **audit API の query filter / repository の JSON 検索 / 管理画面 UI の filter・row 表示・copy 導線** を
追加し、bulk tag 操作の追跡性を高める。schema 変更は伴わない（AC-5 参照）。

---

## P50 前提確認チェック（実装前提の現状把握）

| 確認 | 結果 |
| --- | --- |
| current branch に実装が既にあるか | **なし**。`apps/api/src/routes/admin/audit.ts` の `ListAuditQueryZ` に `batchId` は不在。`apps/api/src/repository/auditLog.ts` の `AuditLogListFilters` / `listFiltered` に batchId 検索なし。`apps/web/src/components/admin/AuditLogPanel.tsx` の `AuditSearchValues` / FilterForm / AuditRow に batchId 不在。`apps/web/app/(admin)/admin/audit/page.tsx` の `buildAuditApiPath` に batchId 不在。 |
| 依存（#1036）の状態 | **landed・完了済み**。`apps/api/src/repository/memberTags.ts` `bulkApplyMemberTagsByAdmin` が `crypto.randomUUID()` で batchId 生成し `{ batchId, results }` を返す。`apps/api/src/routes/admin/members.ts` `POST /members/tags/bulk` が assign 時 `after: { tagId, source: "manual", batchId }` / unassign 時 `before: { tagId, batchId }` を audit 記録する（実 mutation のみ。noop/skip は記録しない）。 |
| 既存 endpoint surface | `GET /admin/audit` が既に存在。本タスクは **既存 endpoint の query 拡張**であり、新 endpoint 追加ではない（下記スコープ参照）。 |
| schema 変更要否 | **不要**。`audit_log` に `correlation_id` 列は無く（DDL: `audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at`）、batchId は `before_json` / `after_json` の JSON 内にのみ存在する。index は `idx_audit_log_target (target_type, target_id, created_at)` のみ。 |

**結論**: `implementation_mode = new`（current branch に該当実装なし）。

---

## タスク分類

- **実装区分**: 実装仕様書（CONST_004 デフォルト・実態優先）。目的達成には API query filter / repository SQL / 管理画面 UI のコード変更が必須。
- **visualEvidence**: VISUAL_ON_EXECUTION。UI（batchId filter input / row 表示 / copy ボタン）を変更するため、実装実行時に手動スクリーンショットを取得する（Phase 11）。仕様書段階ではスクリーンショットを持たない。
- **category**: 改善（運用 UX / 追跡性向上）。

---

## 既存コードの命名規則分析（FB-01 / 整合維持）

実コードを Read で確認した命名規則。新規・拡張は本規則に整合させる。

| 種別 | 規則 | 実例 |
| --- | --- | --- |
| 関数 | camelCase | `listFiltered`, `buildAuditHref`, `buildAuditApiPath`, `bulkApplyMemberTagsByAdmin`, `jstInputToUtcIso` |
| zod schema | `*Z` suffix・PascalCase | `ListAuditQueryZ`, `AdminAuditListResponseZ`, `AdminAuditListItemZ` |
| 型 / interface | PascalCase | `AuditLogListFilters`, `AdminAuditListItem`, `AdminAuditFilters`, `AuditSearchValues` |
| React component | PascalCase（ファイル名も同じ） | `AuditLogPanel.tsx`, `AuditRow`, `JsonDisclosure` |
| package 名 | `@ubm-hyogo/api` / `@ubm-hyogo/web`（issue 記載の `@repo/api` は誤り。本仕様書は実 package 名を正本とする） |
| 新規 helper（本タスク） | `extractBatchId`（camelCase・pure function） |
| 新規 client component（本タスク） | `BatchIdCopyButton`（PascalCase・既存 `*Button` 慣習に整合） |

---

## 不変条件チェック（CLAUDE.md）

| # | 不変条件 | 本タスクでの遵守 |
| --- | --- | --- |
| #5 | D1 直接アクセスは `apps/api` に閉じる | batchId の JSON 検索 SQL（`json_extract`）は `apps/api/src/repository/auditLog.ts` にのみ置く。`apps/web` は API レスポンスのみを扱う。 |
| #9 | admin form input は `FormField` 経由 | batchId filter input は `<FormField name="batchId">` + `<Input>` で実装。直接 `<input>` を増やさない。 |
| 不変2 | OKLch トークン正本・HEX 直書き / `bg-[#xxx]` 禁止 | 新規 UI（filter / batchId 表示 / copy ボタン）は既存 primitives（`Input` / `FormField` / `Button` / `<code>`）を再利用し、色は token のみ。HEX / `bg-[#...]` / `text-[#...]` を書かない（CI gate `verify-design-tokens`）。 |
| 不変1（API 利用） | 既存 API endpoint surface のみ利用 | `GET /admin/audit` の query を拡張するのみ。新 endpoint / D1 schema / Google Form 仕様の変更はしない。 |

---

## 受入条件 (AC)（issue #1079 由来・index.md と整合）

| ID | 受入条件 | 検証可能な記述 | 担当 |
| --- | --- | --- | --- |
| AC-1 | `/admin/audit` で batchId を入力して bulk tag audit rows を絞り込める | batchId filter input に bulk 操作の UUID を入力 → 検索 → その batchId を持つ row のみ返る。API contract test で `?batchId=<uuid>` 指定時に該当 row のみ返却を assert。 | Task A + Task B |
| AC-2 | audit row detail に batchId が表示され、copy できる | batchId を含む audit row に `<code>{batchId}</code>` と copy ボタンが描画される。copy ボタン押下で `navigator.clipboard.writeText(batchId)` が呼ばれ copied フィードバックが出る。component test で抽出 helper・描画・copy 呼び出しを assert。 | Task C |
| AC-3 | action filter（`admin.member.tag_assigned` / `admin.member.tag_unassigned`）と batchId filter を併用できる | `?action=admin.member.tag_assigned&batchId=<uuid>` で両条件 AND 絞り込み。repository test で WHERE 句に両条件が含まれることを assert。 | Task A + Task B |
| AC-4 | cursor pagination の next URL が batchId query を保持する | `nextHref` が `buildAuditHref(values, nextCursor)` で batchId を含む。component / unit test で next URL の `batchId` query 残存を assert。 | Task B |
| AC-5 | JSON body filter が D1 full scan になりすぎる場合の制限または index 方針が明記される | Phase 2 の「AC-5 index 方針」セクションに full scan semantics と緩和策（keyset cursor + LIMIT による行数 bound / batchId UUID の sparse 性 / from·to·action 併用推奨）と schema 変更を別タスク化する旨を記述。 | Task A（Phase 2 設計） |

---

## Inventory（現行コード — 変更対象の起点）

### apps/api

| パス | 現状 | 本タスクでの扱い |
| --- | --- | --- |
| `src/routes/admin/audit.ts` | `ListAuditQueryZ`（batchId なし）/ `AdminAuditListResponseZ.appliedFilters`（batchId なし）/ `listFiltered` 呼び出し / `appliedFilters` 返却 | 編集（batchId 追加） |
| `src/repository/auditLog.ts` | `AuditLogListFilters`（batchId なし）/ `listFiltered`（列 plain 比較のみ・JSON 検索なし）/ `add()` helper（単一 `?` を `?N` に置換）/ keyset cursor | 編集（batchId の json_extract 検索追加） |
| `src/repository/memberTags.ts` | `bulkApplyMemberTagsByAdmin`（batchId 生成元） | 参照のみ（非変更） |
| `src/routes/admin/members.ts` | `POST /members/tags/bulk`（batchId 埋め込み元） | 参照のみ（非変更） |

### apps/web

| パス | 現状 | 本タスクでの扱い |
| --- | --- | --- |
| `src/components/admin/AuditLogPanel.tsx` | server-renderable（"use client" なし）。`AuditSearchValues` / `buildAuditHref` / FilterForm / `AuditRow` / `JsonDisclosure` | 編集（Task B: filter 領域 / Task C: row 領域） |
| `app/(admin)/admin/audit/page.tsx` | SSR `force-dynamic`。`buildAuditApiPath` で searchParams → API path | 編集（batchId plumbing） |
| `src/lib/admin/types.ts` | `AdminAuditFilters` / `AdminAuditListItem` / `AdminAuditListResponse` | 編集（`AdminAuditFilters` に batchId 追加） |
| `src/components/admin/BatchIdCopyButton.tsx` | 不在 | **新規**（"use client" copy ボタン） |

---

## スコープ（1 サイクル完了原則 / CONST_007）

### 含む（今回サイクルで完了）

- audit API（`GET /admin/audit`）への `batchId` query filter 追加（既存 endpoint の query 拡張・新 endpoint ではない）
- repository `listFiltered` の `json_extract` による batchId 検索（`after_json` / `before_json` 両方）
- `/admin/audit` UI の batchId filter input（FormField）と URL / cursor 保持
- audit row detail の batchId 抽出（`extractBatchId`）・表示・copy ボタン（新規 client component）
- contract / repository / component テスト

### 含まない（明示的スコープ外・先送りではなく別関心）

- `audit_log` schema 変更（`correlation_id` 列 / generated column / JSON index migration）。AC-5 は「制限または index 方針の**明記**」のみを要求し、schema 変更自体は要求しない。親 #1036 が「軽量 batchId 方針（schema 変更なし）」を採択済み。将来 index 最適化が必要になった場合の別タスク化方針を Phase 2 に記録する。
- bulk tag write 実装（`memberTags.ts` の mutation ロジック）の変更
- 単一 endpoint（`POST /:memberId/tags` 等）への batchId 付与（現状 `after: { tagId, source }` で batchId 無し。bulk のみが batchId を持つ）
- production deploy / commit / push / PR 作成（すべて user-gated）

---

## 依存

- #1036 `issue-1036-bulk-member-tag-assign`: 完了済み・landed。batchId 生成・埋め込みは本タスクの前提として既存。本タスクは write 側を変更しない。

---

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/`（親ワークフロー）
- `apps/api/src/routes/admin/audit.ts` / `apps/api/src/repository/auditLog.ts`
- `apps/api/src/routes/admin/members.ts` / `apps/api/src/repository/memberTags.ts`
- `apps/web/src/components/admin/AuditLogPanel.tsx` / `apps/web/app/(admin)/admin/audit/page.tsx` / `apps/web/src/lib/admin/types.ts`

---

## 実行タスク（並列レーン）

| Task | 責務 | 主対象 | 並列性 |
| --- | --- | --- | --- |
| Task A | audit API の batchId query filter + repository の JSON 検索 + API テスト | `apps/api` | 独立（apps/web と非干渉） |
| Task B | audit UI の batchId filter form + page wiring + URL builder + 型 + テスト | `apps/web`（filter 領域 / page.tsx / types） | Task C と同一ファイル別領域 |
| Task C | audit row detail の batchId 抽出・表示・copy 導線 + client component + テスト | `apps/web`（row 領域 / 新規 BatchIdCopyButton） | Task B と同一ファイル別領域 |

---

## 成果物

- 編集: `audit.ts`, `auditLog.ts`（apps/api）/ `AuditLogPanel.tsx`, `page.tsx`, `types.ts`（apps/web）
- 新規: `apps/web/src/components/admin/BatchIdCopyButton.tsx`
- テスト: API contract / repository / component spec（`*.spec.ts(x)`）

---

## 完了条件 (DoD)

- AC-1..5 が Task A/B/C にマップされ、各 AC に検証可能な記述がある。
- 既存命名規則・不変条件（#5 / #9 / OKLch / 既存 API surface）に整合する設計であることが記録されている。
- 新 endpoint 追加・schema 変更・write 側変更が無いことが明記されている。
- Phase 2 へ進める前提（実装前現状把握）が確定している。

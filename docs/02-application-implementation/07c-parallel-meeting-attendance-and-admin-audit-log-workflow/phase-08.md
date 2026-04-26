# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

audit hook / action enum / payload 形 / endpoint path / repository 命名 を統一し、Wave 7a (tag queue) / 7b (schema alias) と整合させる。Before / After 表で命名差分を確定する。

## 実行タスク

- [ ] 命名差分（hook / action / payload / repository / endpoint）を Before / After で表化
- [ ] 共通化対象を `packages/shared` への昇格候補と `apps/api/src/middleware` への中央化に分類
- [ ] 07a / 07b との naming alignment を確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/main.md | 擬似コード |
| 必須 | outputs/phase-07/main.md | AC matrix |
| 必須 | doc/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/index.md | 並列の hook 利用形 |
| 必須 | doc/02-application-implementation/07b-parallel-schema-diff-alias-assignment-workflow/index.md | 並列の hook 利用形 |

## Before / After

### audit hook 関数名

| Before（暫定）| After（採用）| 理由 |
| --- | --- | --- |
| `withAudit('attendance.add')` | `auditHook('attendance.add')` | Hono middleware factory 命名規則 (`*Hook`) に統一 |
| `auditMiddleware(...)` | `auditHook(...)` | 同上、middleware は冗長 |

### action enum

| Before | After | 理由 |
| --- | --- | --- |
| `ATTENDANCE_ADD` | `attendance.add` | dot notation で targetType.action を表現 |
| `meetingAttendanceAdded` | `attendance.add` | 動詞時制を排除、targetType.verb |
| `tagQueueResolved` | `tag.queue.resolve` | 07a と統一 |
| `schemaAliasAssigned` | `schema.alias.assign` | 07b と統一 |
| `syncSchemaRun` | `sync.schema.run` | 既存 sync endpoint 命名 |

### payload キー

| Before | After | 理由 |
| --- | --- | --- |
| `{ prevValue, nextValue }` | `{ before, after, request }` | 直感的、payload diff として標準的 |
| `{ delta }` | `{ before, after }` | diff 算出は consumer 側で |

### endpoint path

| Before | After | 理由 |
| --- | --- | --- |
| `/admin/sessions/:id/attendance` | `/admin/meetings/:sessionId/attendance` | UI 用語 `meeting` と統一（spec 11） |
| `/admin/attendance/:id` | `/admin/meetings/:sessionId/attendance/:memberId` | 階層で意図を明示 |
| `/admin/audit/logs` | (本タスクでは作らない) | 閲覧 UI は scope out |

### repository 命名

| Before | After | 理由 |
| --- | --- | --- |
| `attendanceRepo` / `attendance_repo` | `attendance.ts` / `c.var.repo.attendance` | 02b に整合 |
| `auditRepo` | `auditLog.ts` / `c.var.repo.auditLog` | 02c の export 名と一致 |

## 共通化対象

| 対象 | 配置 | 理由 |
| --- | --- | --- |
| `AdminAuditAction` enum | `packages/shared/src/audit/actions.ts` | apps/web (型 import) と apps/api 双方で使用 |
| `AdminAuditPayload` 型 | `packages/shared/src/audit/payload.ts` | before / after / request の汎用 |
| `auditHook` middleware | `apps/api/src/middleware/auditHook.ts` | 07a / 07b / 07c 全てが import |
| `isUniqueViolation` helper | `apps/api/src/lib/d1Errors.ts` | 07a の queue / 07c attendance で重複 |
| `attendanceCandidates` resolver | `apps/api/src/services/attendanceCandidates.ts` | 07c 専用、共通化不要 |

## 07a / 07b との alignment

| 観点 | 07a tag queue | 07b schema alias | 07c attendance |
| --- | --- | --- | --- |
| audit action | `tag.queue.resolve` | `schema.alias.assign` | `attendance.add` / `attendance.remove` |
| hook 関数 | `auditHook('tag.queue.resolve')` | `auditHook('schema.alias.assign')` | `auditHook('attendance.add')` |
| repo path | `c.var.repo.tagQueue` | `c.var.repo.schemaAlias` | `c.var.repo.attendance` |
| 共通基盤 | hook + enum + payload 型 | 同 | 同 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 命名 DRY 化後の lint rule（命名規約）を品質チェック |
| Phase 12 | implementation-guide に共通化方針を反映 |
| 下流 08a | contract test の name も After 名で統一 |

## 多角的チェック観点

- 不変条件 **#5** hook を全 admin 操作 endpoint に共通付与（理由: 認可 + 監査の一貫性）
- 不変条件 **#11** profile 編集系 endpoint は After 名にも含めない（理由: 命名段階で誤実装防止）
- 不変条件 **#15** UNIQUE 違反検知 helper を共通化（理由: 07a queue でも同パターン）
- a11y / 無料枠: 共通化により bundle size 微減、CDN cost 影響なし

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After table | 8 | pending | hook / action / payload / endpoint / repo |
| 2 | 共通化対象列挙 | 8 | pending | packages/shared 昇格 + middleware 中央化 |
| 3 | 07a / 07b との alignment | 8 | pending | 同 hook / 同 enum |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] Before / After 表が hook / action / payload / endpoint / repo の 5 軸で記述
- [ ] 共通化対象が `packages/shared` か `apps/api/src/middleware` に分類
- [ ] 07a / 07b と命名整合

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ: 共通化対象と命名規約
- ブロック条件: Before / After 未完なら Phase 9 不可

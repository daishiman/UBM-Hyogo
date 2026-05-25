# Phase 1: 要件定義

**[実装区分: 実装仕様書（`implementation_mode: verify_existing`）]**

> **実装区分の判定根拠**
> 元 spec（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-08-audit-filter-paging/spec.md`）は **「監査結果: ✅ OK - 改善不要」** と結論し、`/(admin)/admin/audit` の filter / cursor paging / PII masking が既に網羅実装済みである旨を記録している。
> 本タスクは「既存実装が監査結論どおり正しく動作することをコード変更なしで回帰検証し、回帰保証を成果物として固定する」ことを目的とする。
> このため `implementation_mode: verify_existing`（既実装の差分確認・回帰確認）を採用する。CONST_004 の判定基準「コード変更なしで達成不可能な目的」に該当しないため、新規実装は行わない。`taskType: implementation` / `visualEvidence: NON_VISUAL`（UI/UX 変更なし。既存 visual snapshot を流用）。
> bonus 機能（CSV export / Saved filters / Real-time update）は元 spec が「core 要件ではなく admin UX 向上の bonus」と明示しており、本タスクのスコープ外。Phase 12 で `unassigned-task-detection.md` に core 外 bonus として理由付きで記録する（未タスク新規作成ではなく、監査結論を超える別スコープとして正式記録）。

## 1. 背景

- `/(admin)/admin/audit` route は serial-05-admin-mutation-ui の step-08 として整備された read-only 監査ログ閲覧 UI。step-08 は mutation を持たず `useAdminMutation` 非依存（serial-05 `index.md` §4 / §7 step-08）。
- 後続再監査（step-08 `spec.md`）で、filter form（7 項目）/ cursor-based paging / PII masking / semantic HTML / error・empty state が既に揃っており「改善不要」と判定された。
- 一方で、この監査結論は「現時点のコードに対する人手レビュー」であり、**回帰テストによる継続的保証**（CI 上で動作が壊れたことを検知できる状態）として固定されていない。本タスクは監査結論を回帰検証で裏付け、`verify_existing` 仕様書として確定する。

## 2. 監査スコープ・inventory（対象ファイル群）

### 2-1. 検証対象（current code anchor）

| 区分 | パス | 役割 | 変更 |
|------|------|------|------|
| Web route | `apps/web/app/(admin)/admin/audit/page.tsx` | Server Component。`force-dynamic` / searchParams → `buildAuditApiPath` → `fetchAdmin` | 検証のみ（無変更） |
| Web query util | `apps/web/app/(admin)/admin/audit/audit-query.ts` | `jstLocalToUtcIso`（JST `datetime-local` → UTC ISO 変換） | 検証のみ（無変更） |
| Web loading | `apps/web/app/(admin)/admin/audit/loading.tsx` | `AdminAuditLoading`（Suspense fallback） | 検証のみ（無変更） |
| Web component | `apps/web/src/components/admin/AuditLogPanel.tsx` | `AuditLogPanel` / `maskAuditJson` / `maskAuditText` / `summarizeAuditJson` / `formatJst` / `buildAuditHref` / `JsonDisclosure` / `AuditRow` / `AuditSearchValues` | 検証のみ（無変更） |
| Web types | `apps/web/src/lib/admin/types.ts` | `AdminAuditListItem` / `AdminAuditListResponse` / `AdminAuditFilters` | 検証のみ（無変更） |
| Web UI primitives | `FormField` / `Input` / `EmptyState` / `Pagination`（`apps/web/src/components/ui/`） | 再利用 primitive | 検証のみ（無変更） |
| API route | `apps/api/src/routes/admin/audit.ts` | `createAdminAuditRoute` / `ListAuditQueryZ` / `AdminAuditListItemZ` / `AdminAuditListResponseZ` / `encodeAuditCursor` / `decodeAuditCursor` / `jstInputToUtcIso` / `parseAndMask` / `toAdminMaskedValue` / `toResponseItem` | 検証のみ（無変更） |
| API repository | `apps/api/src/repository/auditLog.ts` | `listFiltered`（cursor + filter クエリ） | 検証のみ（無変更） |
| API redact | `apps/api/src/lib/audit/redact.ts` | `redactAuditPayload` / `redactString` | 検証のみ（無変更） |
| API middleware | `require-admin` / `repository-providers` | 認可・provider 注入 | 検証のみ（無変更） |

### 2-2. 既存テスト inventory（回帰の正本）

| テスト | パス | 行数 | カバー範囲 |
|--------|------|------|-----------|
| Web component | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 423 | masking / paging href / JST format / empty・error・render 分岐・branch coverage 補強 |
| Web page | `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 14 | page module の smoke |
| API contract | `apps/api/src/routes/admin/audit.contract.spec.ts` | 303 | query validation / cursor encode-decode / date range / masking / nextCursor |
| E2E | `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` | 151 | admin audit route の操作系 smoke |
| Visual | `apps/web/playwright/tests/visual-full/full-visual.spec.ts`（snapshot: `admin-audit-{desktop,tablet,mobile}`） | — | 既存 baseline（流用・新規撮影なし） |

## 3. 命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 観点 | 既存パターン（正本） | 本タスクでの扱い |
|------|---------------------|-----------------|
| Web component 関数 | PascalCase（`AuditLogPanel`） + helper は camelCase（`maskAuditJson`） | 既存に一致。新規追加なし |
| API factory | `create{Resource}Route`（`createAdminAuditRoute`） | 既存に一致 |
| zod schema | `{Name}Z` suffix（`ListAuditQueryZ`） | 既存に一致 |
| test ファイル | `*.component.spec.tsx` / `*.contract.spec.ts` / `*.page.spec.ts`（`*.spec.*` のみ。`*.test.*` 禁止 = 不変条件8） | 新規テストを追加する場合も `*.spec.*` 限定 |
| cursor 形式 | base64url（`encodeAuditCursor`） | 既存に一致 |

> 本タスクは新規実装ゼロのため命名ドリフトは発生しない。上表は Phase 4 で targeted regression test を**追加する場合**に既存命名へ整合させるための基準として記録する。

## 4. 機能要件（回帰検証で保証すべき既存挙動）

| ID | 要件（既存挙動の継続保証） |
|----|---------------------------|
| FR-1 | filter form の 7 項目（action / actorEmail / targetType / targetId / from / to / limit）が `defaultValue` に既存値を反映し、`action="/admin/audit"` の GET submit で URL に同期される |
| FR-2 | cursor-based paging：`buildAuditHref` が filter を保持したまま `nextCursor` を URL に付与し、`nextCursor=null` 時は「次のページはありません」を表示する |
| FR-3 | PII masking：`maskAuditJson` が key パターン（email/phone/name 等）と value パターン（email/phone regex）の両方で再帰的にマスクし、raw PII を可視 DOM に出さない |
| FR-4 | API：`ListAuditQueryZ` が不正 query（不正 email / limit 範囲外 / 不正 cursor / 不正 date range / from>=to）を 400 で弾き、正常時は `AdminAuditListResponseZ` 準拠の応答（`nextCursor` + `appliedFilters`）を返す |
| FR-5 | JST 変換：UI 側 `jstLocalToUtcIso` と API 側 `jstInputToUtcIso` が `datetime-local`（JST）→ UTC ISO を一貫変換し、`from` は start、`to` は end-exclusive として扱う |
| FR-6 | 認可：`/audit` は `requireAdmin` middleware 経由でのみアクセス可能（read-only、mutation surface なし） |

## 5. 非機能要件

| ID | 要件 |
|----|------|
| NFR-1 | 不変条件5（`apps/web` から D1 直接アクセス禁止）を維持：page.tsx は `fetchAdmin` 経由で `/admin/audit` API を呼ぶのみ |
| NFR-2 | 不変条件9（admin の form input は `FormField` 経由）を維持：AuditLogPanel は `FormField` + `Input` を使用済み |
| NFR-3 | 不変条件2（OKLch トークン正本化、HEX 直書き禁止）：`verify-design-tokens` gate を通過すること（audit UI に HEX 直書きがないこと） |
| NFR-4 | 不変条件8（test suffix は `*.spec.*` のみ）を維持 |
| NFR-5 | コード変更ゼロ：`git diff dev...HEAD -- apps/` が空であること（仕様書・outputs のみの差分） |

## 6. 受け入れ基準（AC）

- **AC-1**: `mise exec -- pnpm --filter @ubm-hyogo/web test` で `AuditLogPanel.component.spec.tsx`（423 行）と `page.page.spec.ts` が全 PASS する。
- **AC-2**: `mise exec -- pnpm --filter @ubm-hyogo/api test` で `audit.contract.spec.ts`（303 行）が全 PASS する。
- **AC-3**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が PASS する。
- **AC-4**: `git status --short -- apps packages` と `git diff -- apps packages` が空で、全体差分が `docs/30-workflows/completed-tasks/step-08-audit-filter-paging-verify/` と `.claude/skills/aiworkflow-requirements/` 同一wave同期に限定されることを確認できる（NFR-5）。
- **AC-5**: Phase 9 で FR-1〜FR-6 と既存テストケースの 1:1 対応表（coverage map）が作成され、未カバーの監査主張がゼロであることが示される。
- **AC-6**: Phase 12 で bonus 3 機能（CSV export / Saved filters / Real-time）が `unassigned-task-detection.md` に core 外スコープとして理由付きで記録され、未タスク新規作成は行わない。

## 7. スコープ確定

- **含む**: 既存 audit UI/API の回帰検証（既存テスト実行＋結果記録）、FR↔テストの coverage map 作成、監査結論の再現コマンド検証、コード変更ゼロの証跡固定、Phase 12 close-out（bonus のscope-out記録を含む）。
- **含まない**: 新規コード実装、既存コードの変更、新規 API endpoint・D1 schema・Google Form 仕様変更（不変条件）、bonus 機能（CSV export / Saved filters / Real-time update）の実装。

## 8. carry-over 確認

- 直近コミット（`git log --oneline -5`）に step-07 requests approve/reject（#865）が含まれる。step-08 は step-07 完了後の read-only 監査タスクで、step-07 とコードを共有しない（`useAdminMutation` 非依存）。
- 本タスクの新規作業は「step-08 監査結論の回帰検証仕様書化」であり、step-01..07 の mutation 実装とは独立。

## 9. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
|----------|------|------|
| セキュリティ | `.claude/skills/aiworkflow-requirements/references/security-*.md` | PII masking / 監査ログの取り扱い |
| API/IPC | `.claude/skills/aiworkflow-requirements/references/api-*.md` | admin endpoint surface |
| データ整合性 | `.claude/skills/aiworkflow-requirements/references/database-*.md` | audit_log テーブル / cursor paging |

### 元仕様・プロジェクト規約

| 参照資料 | パス | 内容 |
|----------|------|------|
| 元監査 spec | `docs/.../serial-05-admin-mutation-ui/step-08-audit-filter-paging/spec.md` | 監査 OK 結論（本タスクの正本） |
| serial-05 全体 | `docs/.../serial-05-admin-mutation-ui/index.md` | step-08 の位置づけ（read-only） |
| 不変条件 | `CLAUDE.md` | D1 直アクセス禁止 / FormField / test suffix / OKLch |

## 10. 完了条件（Phase 1 DoD）

- [ ] `taskType: implementation` / `implementation_mode: verify_existing` / `visualEvidence: NON_VISUAL` を meta に明記した（artifacts.json と整合）。
- [ ] 監査スコープ（§2 inventory）を current code anchor として列挙した。
- [ ] FR-1〜FR-6 と AC-1〜AC-6 を明示列挙した（予告で終わらせない）。
- [ ] bonus 機能を scope out として §1 / §7 / AC-6 に記録した。
- [ ] 命名規則（§3）を分析・記録した。

# Phase 2: 設計（監査 lane / 検証 topology）

**[実装区分: 実装仕様書（`verify_existing`）]**

> 本 Phase は実装タスクの「target topology 設計」を、監査タスク用テンプレ（`phase-template-audit-task.md`）に従い「**検証 lane / 対象 root の設計**」として再解釈する。新規コードの設計は行わず、既存実装の検証経路を topology として固定する。

## 1. 検証 topology（データフロー俯瞰）

```
[Browser] GET /admin/audit?action=...&from=...&limit=...&cursor=...
   │
   ▼
apps/web/app/(admin)/admin/audit/page.tsx  (Server Component, force-dynamic)
   │  searchParams → rawValues(AuditSearchValues)
   │  buildAuditApiPath(values):
   │    - actorEmail.toLowerCase()
   │    - jstLocalToUtcIso(fromLocal/toLocal)  ← audit-query.ts
   ▼
fetchAdmin<AdminAuditListResponse>("/admin/audit?...")  (server-fetch)
   │   ※ 不変条件5: D1 直アクセスなし。API 経由のみ
   ▼
apps/api/src/routes/admin/audit.ts  createAdminAuditRoute()
   │  requireAdmin → writeTagNoteProviderMiddleware
   │  ListAuditQueryZ.safeParse → 400 (invalid query)
   │  jstInputToUtcIso(from,false)/(to,true) → 400 (invalid date range / from>=to)
   │  decodeAuditCursor(cursor) → 400 (invalid cursor)
   │  auditLogProvider.listFiltered({...filters, limit:limit+1})
   │  pageRows = rows.slice(0,limit); nextCursor = rows.length>limit ? encode(last) : null
   │  toResponseItem: parseAndMask(before/after) → redactAuditPayload/redactString
   ▼
{ ok:true, items:[{maskedBefore,maskedAfter,parseError,...}], nextCursor, appliedFilters }
   │
   ▼
apps/web/src/components/admin/AuditLogPanel.tsx
   │  maskAuditJson(二重マスク: API 側 redact + UI 側 mask)
   │  JsonDisclosure(<details>) / AuditRow(<table>)
   │  Pagination(buildAuditHref(values, nextCursor))
   ▼
[semantic HTML: <section>/<form>/<table>/<details>/<nav(Pagination)>]
```

## 2. 検証 lane 設計（3 lane 以下・validation lane は直列締め）

| lane | 対象 | 検証手段 | 並列可否 |
|------|------|---------|---------|
| Lane A（Web unit/component） | `AuditLogPanel.tsx` / `audit-query.ts` / `page.tsx` | vitest（既存 `*.spec.{ts,tsx}`） | 並列可 |
| Lane B（API contract） | `audit.ts` / `auditLog.ts` / `redact.ts` | vitest（既存 `audit.contract.spec.ts`） | 並列可 |
| Lane C（再現コマンド・静的監査） | `git diff`（コード変更ゼロ）/ design-token grep / D1 直アクセス grep | bash（再現コマンド） | 並列可 |
| Validation lane（直列締め） | typecheck / lint / coverage map 突合 | `pnpm typecheck` / `pnpm lint` | 直列（最後） |

## 3. PII masking 二段防御設計（既存）

| 層 | 実装 | 役割 |
|----|------|------|
| API 層 | `redactAuditPayload` / `redactString`（`apps/api/src/lib/audit/redact.ts`）→ `toAdminMaskedValue`（`{redacted:true,kind}` → `"[masked]"`） | DB の生 before/after JSON を応答前にマスク |
| UI 層 | `maskAuditJson`（key/value 両パターン）/ `maskAuditText`（actorEmail） | API 応答を可視 DOM へ出す直前に再マスク（多層防御） |

> 設計判断: UI 層マスクは「API がマスク漏れしても可視 DOM に PII を出さない」二重防御。検証では API 単独・UI 単独の双方でマスクが効くことを確認する（既存テスト `audit.contract.spec.ts` + `AuditLogPanel.component.spec.tsx` がそれぞれ担保）。

## 4. cursor paging 契約（既存）

| 項目 | 仕様 |
|------|------|
| エンコード | `encodeAuditCursor({createdAt,auditId})` = base64url(JSON) |
| デコード | `decodeAuditCursor`：JSON parse 失敗・型不一致は `null` → route で 400 |
| 次ページ判定 | `listFiltered({limit: limit+1})` で 1 件多く取得 → `rows.length > limit` なら `nextCursor` 生成、`pageRows = rows.slice(0,limit)` |
| filter 保持 | `buildAuditHref(values, nextCursor)`：action/actorEmail/targetType/targetId/from/to/limit/cursor を URLSearchParams へ（空文字 trim でスキップ） |

## 5. 状態所有権（責務境界）

| 状態 | owner | 備考 |
|------|-------|------|
| filter 値 | URL searchParams（page.tsx が読む） | client state を持たない（form action GET で URL に同期） |
| paging 位置 | URL の `cursor` | Pagination は href 生成のみ。client paging state なし |
| masking | API（一次）+ UI（二次） | §3 の二段防御 |
| 認可 | `requireAdmin` middleware（API） | UI は認可判断を持たない |

> read-only のため `useAdminMutation` / client mutation state を一切持たない。これが step-08 が「mutation 非依存」である根拠（serial-05 index.md §7）。

## 6. dual root（`.claude` / `.agents`）の扱い

- 本タスクは `apps/` のコード検証であり、skill 正本（`.claude/skills/`）の変更を伴わない。
- ただし Phase 12 で skill ログ（task-specification-creator / aiworkflow-requirements の LOGS.md）を更新するため、`.claude` 正本を先に更新し `.agents` mirror を `diff -qr` で parity 確認する（`phase-template-audit-task.md` §dual root）。

## 7. ライブラリ選定

- 新規ライブラリ採用なし（verify_existing）。既存依存（Hono / zod / @testing-library / vitest / Playwright）のみを検証に使用。

## 8. 完了条件（Phase 2 DoD）

- [ ] 検証 topology（§1）を current code anchor で図示した。
- [ ] 検証 lane（§2、3 lane + 直列 validation）を設計した。
- [ ] PII 二段防御（§3）と cursor 契約（§4）と状態所有権（§5）を明記した。
- [ ] dual root の扱い（§6）を宣言した。

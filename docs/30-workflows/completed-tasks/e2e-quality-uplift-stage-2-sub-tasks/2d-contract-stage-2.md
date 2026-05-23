# Sub-task 2d: contract-stage-2 実装仕様書

> **[実装区分: 実装仕様書]** — CONST_004 適用。
> 本仕様書の成果物は Vitest contract test (`apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`) という実コード成果物であり、対応する Phase 11/12 evidence は実テストの green ログを正本とする。
> 判断根拠: Stage 2 phase-5 §1 で `implementation_mode: "new"` かつ「新規 Vitest spec ファイル 1 件追加」と確定済み。研究/調査タスクではなく、コード差分を生成する直接的な実装タスクのため。

---

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| workflow | e2e-quality-uplift-stage-2 |
| sub-task id | 2d |
| 種別 | 実装仕様書 (Vitest contract test 新規) |
| classification | NON_VISUAL / contract / type-level + zod parse |
| coverageTier | standard（contract test 単体は coverage 加点対象外、green の有無のみ判定） |
| implementation_mode | new |
| 起点日 | 2026-05-09 |
| 依存 | なし（2a/2b/2c の fixture object 形と整合する必要あり、ただし import 依存はなし） |
| ブロッカー | なし |
| 想定行数 | 200-260 行（phase-5 §1 確定値） |
| 出力ファイル | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |

---

## 2. 目的（Why / What）

| 軸 | 内容 |
|----|------|
| Why | 2a/2b/2c の Playwright spec が `page.route()` で返す **UI fixture object** と、`apps/api` 側の **route 実装が parse する zod schema** が同型であることを CI で機械検証することで、UI mock と API contract の drift を防ぐ。drift があれば mock が通る環境で本番 API が 422/400 を返す事故が発生し、E2E green が production 信頼性を担保しなくなる。 |
| What | 2a/2b/2c が叩く 7 endpoint × （query / request body / response shape）について、UI fixture object（または同形の inline literal）を `schema.parse()` に通し、`expect(() => ...).not.toThrow()` / `expect(parsed).toMatchObject(...)` で同型性を断言する Vitest テストを 1 ファイルで提供する。 |
| Out of scope | (a) E2E spec 本体の green 化（2a/2b/2c の責務）、(b) 新 endpoint・新 schema 追加（不変条件で禁止）、(c) cascade preview API（Stage 3 持越し）、(d) DB I/O を伴う integration test（本 spec は pure unit）。 |

---

## 3. 変更対象ファイル一覧

| # | path | 種別 | 変更概要 | 行数目安 |
|---|------|------|---------|---------|
| 1 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 新規 | 7 describe ブロック × 上記 contract assertion を含む Vitest spec | 200-260 |
| 2 | `apps/api/src/routes/admin/member-delete.ts` | **既存・微修正** | `DeleteBodyZ` を `export const DeleteBodyZ = ...` に変更（route 内 inline → 同モジュールから named export として 2d test が import）。スキーマ定義の重複は禁止のため、shared 昇格ではなく route からの再 export とする（phase-4 §1 Q6 結論）。 | +1 行（`const` → `export const`） |
| 3 | `apps/api/src/routes/admin/requests.ts` | **既存・微修正** | `ListQueryZ` および `adminRequestResolveBodySchema` 由来の resolve body を 2d で参照するため、`ListQueryZ` を `export const ListRequestsQueryZ` として再 export（既存 const は import 名の衝突回避のため別名で再 export）。`adminRequestResolveBodySchema` は既に `@ubm-hyogo/shared` からの import なので 2d 側で同 import を使う。 | +1 行（`const ListQueryZ` の export 化、または末尾に `export { ListQueryZ as ListRequestsQueryZ }`） |
| 4 | `apps/api/src/routes/admin/audit.ts` | **既存・微修正** | `QueryZ` を `export const ListAuditQueryZ` として再 export。 | +1 行 |
| 5 | `apps/api/src/routes/admin/identity-conflicts.ts` | 既存・修正なし | `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` / `ListIdentityConflictsResponseZ` / `IdentityConflictRowZ` / `MergeIdentityResponseZ` / `DismissIdentityConflictResponseZ` は **既に `packages/shared/src/schemas/identity-conflict.ts` に存在**（phase-4 §1 Q6 確認済）。2d は shared から直接 import する。 | 0 |

> **不変条件（CONST_007: スキーマ重複定義禁止）**: 2d test 側で `z.object({...})` を新規定義しない。route または shared から import のみで構成する。
> **shared 昇格判断**: `DeleteBodyZ` を `packages/shared/src/schemas/` に移すのは別 PR の責務とし、Stage 2 では route からの named export に留める（phase-4 §1 Q6 「`DeleteBodyZ` のみ route 内 inline のため、必要なら 2d 内で route から再 export して share」に整合）。

---

## 4. import / re-export マップ

| symbol | 実体所在 | 2d test の import 文 |
|--------|---------|-------------------|
| `MergeIdentityRequestZ` | `packages/shared/src/schemas/identity-conflict.ts:28` | `import { MergeIdentityRequestZ } from '@ubm-hyogo/shared'`（barrel export 経由） |
| `DismissIdentityConflictRequestZ` | 同上 :42 | 同上 |
| `MergeIdentityResponseZ` | 同上 :34 | 同上（response shape `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` を parse） |
| `DismissIdentityConflictResponseZ` | 同上 :47 | 同上 |
| `IdentityConflictRowZ` / `ListIdentityConflictsResponseZ` | 同上 :11 / :22 | 同上 |
| `adminRequestResolveBodySchema` | `@ubm-hyogo/shared`（既存 export） | `import { adminRequestResolveBodySchema } from '@ubm-hyogo/shared'` |
| `ListRequestsQueryZ` | `apps/api/src/routes/admin/requests.ts`（本 PR で named export 化） | `import { ListRequestsQueryZ } from '../requests'` |
| `ListAuditQueryZ` | `apps/api/src/routes/admin/audit.ts`（本 PR で named export 化） | `import { ListAuditQueryZ } from '../audit'` |
| `DeleteBodyZ` | `apps/api/src/routes/admin/member-delete.ts:10`（本 PR で `export` 付与） | `import { DeleteBodyZ } from '../member-delete'` |

> **fixture object の所在**: phase-5 §4 の標準形に従い、**2d test 内 inline** で定義する。別ファイル化（`fixtures/admin-stage-2.ts` 等）は Phase 8 リファクタの責務とし、Stage 2 では inline で重複許容（phase-5 §2.2 と整合）。2a/2b/2c の Playwright spec も同じ shape を inline で持つため、CI で 2d が green であれば 4 spec の fixture 整合性が担保される。

---

## 5. fixture object 標準形（phase-5 §4 と完全一致）

| 名前 | shape（zod parse 対象） | 用途 |
|------|----------------------|------|
| `adminRequestItem` | `{ noteId: string, memberId: string, status: 'pending', type: 'visibility_request' \| 'delete_request', createdAt: string }` | `GET /admin/requests` response items[] |
| `requestResolveApproveBody` | `{ resolution: 'approve' }` | `POST /admin/requests/:noteId/resolve` body |
| `requestResolveRejectBody` | `{ resolution: 'reject', resolutionNote: string }` | 同上 |
| `identityConflictItem` | `IdentityConflictRowZ` 同型 (`{ conflictId, sourceMemberId, candidateTargetMemberId, matchedFields, detectedAt, responseEmailMasked, syncJobId }`) | `GET /admin/identity-conflicts` response items[] |
| `mergeRequestBody` | `{ targetMemberId, reason }` | `POST /admin/identity-conflicts/:id/merge` request |
| `mergeResponseBody` | `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` | 同上 response |
| `dismissRequestBody` | `{ reason }` | `POST /admin/identity-conflicts/:id/dismiss` request |
| `dismissResponseBody` | `{ dismissedAt }` | 同上 response |
| `memberDeleteBody` | `{ reason: string }` | `POST /admin/members/:memberId/delete` request |
| `memberDeleteResponse` | `{ id, isDeleted: true, deletedAt }` | 同上 response |
| `auditEntry` | `{ auditId, actorId, action: 'admin.member.deleted', targetId, createdAt }` | `GET /admin/audit` response items[] |

> **重要なズレ補正**: phase-4 §1 Q2 では merge response shape を `{ targetMemberId, sourceMemberId, mergedAt }` と記載していたが、`packages/shared` の `MergeIdentityResponseZ` 実体は `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` であるため、**正本は shared schema** とする。2a/2b/2c の Playwright fixture も `archivedSourceMemberId` を含む形で揃える必要がある。本仕様書はこの差を明示し、2b spec 設計時に揃える前提を共有する（phase-5 §4 の表現も `mergeResponseBody` を shared schema 準拠に揃える）。

---

## 6. describe / test 構造表（phase-5 §3.4 拡張）

| # | describe | test 名 | schema source | 主 assertion |
|---|---------|---------|---------------|-------------|
| 1 | `GET /admin/requests` | `query schema が UI fixture を parse できる` | `ListRequestsQueryZ` | `parse({ status:'pending', type:'visibility_request' })` not throw |
| 1 | 同上 | `response items[] shape が UI fixture と同型` | inline `z.object` 不可 → route 側 response 型から `satisfies` 表現で型一致確認（zod 未エクスポートのため `expectTypeOf<typeof adminRequestItem>().toMatchTypeOf<{ noteId:string; memberId:string; status:'pending' \| 'resolved' \| 'rejected'; type:'visibility_request' \| 'delete_request'; createdAt:string }>()`） | type-level 同型 |
| 2 | `POST /admin/requests/:noteId/resolve` | `approve body parse` | `adminRequestResolveBodySchema` | `parse({ resolution:'approve' })` not throw |
| 2 | 同上 | `reject + note body parse` | 同上 | `parse({ resolution:'reject', resolutionNote:'duplicate' })` not throw |
| 2 | 同上 | `失敗系: 不正 resolution は throw` | 同上 | `parse({ resolution:'unknown' })` throws |
| 3 | `GET /admin/identity-conflicts` | `items[] が IdentityConflictRowZ と同型` | `IdentityConflictRowZ` | `IdentityConflictRowZ.parse(identityConflictItem)` not throw |
| 3 | 同上 | `list response 全体が ListIdentityConflictsResponseZ と同型` | `ListIdentityConflictsResponseZ` | parse not throw |
| 4 | `POST /admin/identity-conflicts/:id/merge` | `request body parse` | `MergeIdentityRequestZ` | `parse({ targetMemberId:'m_001', reason:'同一人物確定' })` not throw |
| 4 | 同上 | `失敗系: reason 空は throw` | 同上 | `parse({ targetMemberId:'m_001', reason:'' })` throws |
| 4 | 同上 | `response body parse` | `MergeIdentityResponseZ` | `parse({ mergedAt, targetMemberId, archivedSourceMemberId, auditId })` not throw |
| 5 | `POST /admin/identity-conflicts/:id/dismiss` | `request body parse` | `DismissIdentityConflictRequestZ` | `parse({ reason:'別人と判明' })` not throw |
| 5 | 同上 | `失敗系: reason 空は throw` | 同上 | parse throws |
| 5 | 同上 | `response body parse` | `DismissIdentityConflictResponseZ` | `parse({ dismissedAt })` not throw |
| 6 | `POST /admin/members/:memberId/delete` | `request body parse` | `DeleteBodyZ` | `parse({ reason:'退会希望' })` not throw |
| 6 | 同上 | `失敗系: reason 空は throw` | 同上 | `parse({ reason:'' })` throws（min(1) 違反） |
| 6 | 同上 | `失敗系: reason 欠落は throw` | 同上 | `parse({})` throws |
| 6 | 同上 | `失敗系: reason 501 文字は throw` | 同上 | parse throws（max(500) 違反） |
| 6 | 同上 | `response shape が UI fixture と同型` | type-level | `expectTypeOf<typeof memberDeleteResponse>().toMatchTypeOf<{ id:string; isDeleted:true; deletedAt:string }>()` |
| 7 | `GET /admin/audit` | `query schema が UI fixture を parse できる` | `ListAuditQueryZ` | `parse({ action:'admin.member.deleted', limit:50 })` not throw |
| 7 | 同上 | `失敗系: actorEmail が email 形式でない場合 throw` | 同上 | `parse({ actorEmail:'not-email' })` throws |
| 7 | 同上 | `audit entry 同型（type-level）` | type-level | `expectTypeOf<typeof auditEntry>().toMatchTypeOf<...>()` |

> **describe 数**: 7（phase-5 §3.4 完全一致）。
> **skip**: 0（phase-5 受け入れ基準 #4 — cascade preview skip は 2c 側であり 2d は影響を受けない）。

---

## 7. 入出力・副作用

| 項目 | 値 |
|------|-----|
| 入力 | なし（pure unit、stdin/argv/env 一切参照しない） |
| 出力 | Vitest reporter への pass/fail 通知のみ |
| 副作用 | なし（DB / Network / FS / Cloudflare binding に一切触れない） |
| ランタイム依存 | `vitest`、`zod`、`@ubm-hyogo/shared`、`apps/api/src/routes/admin/{requests,audit,member-delete}.ts` |
| Cloudflare binding | 不要（D1 / KV / R2 binding を mock すらしない） |

---

## 8. テスト方針（self-test）

| 軸 | 方針 |
|----|------|
| 検証粒度 | (a) zod runtime parse、(b) `expectTypeOf` による type-level 同型（zod export がない response shape 用） |
| skip 禁止 | `test.skip` / `it.skip` / `describe.skip` を使わない（phase-5 受け入れ基準 #4 は 2c 側のみ） |
| timeout | デフォルト（5s）。pure unit のため十分 |
| import 重複定義禁止 | CONST_007: 2d 内で `z.object` で route の schema を再定義しない。必ず route または shared から import |
| `MergeIdentityResponseZ` の正本 | shared schema が正本。phase-4 §1 Q2 の手書き shape は shared 実体に合わせて補正する |
| `DeleteBodyZ` shared 昇格 | 本 PR では行わない。route から named export のみ。shared 昇格は別 PR で扱う（CONST_007 + phase-4 §1 Q6） |
| fixture object | inline literal で `as const` 固定し、`expectTypeOf<typeof fixture>` で型抽出 |

---

## 9. ローカル実行コマンド

| # | command | 期待結果 |
|---|---------|---------|
| 1 | `mise exec -- pnpm install` | 既存依存のみで完了。新規 dependency 追加なし |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` | 全 describe pass、fail 0 / skip 0 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 |
| 4 | `mise exec -- pnpm lint` | exit 0（unused import 0、型不整合 0） |

> ローカル開発は必ず `mise exec --` 経由で Node 24.15.0 を使う（`CLAUDE.md` 開発環境セットアップ規約）。
> CI では既存 `apps/api` test job が自動的に拾う（命名規則 `*.test.ts` 適合）。

---

## 10. DoD（受け入れ条件）

| # | 条件 | 検証方法 |
|---|------|---------|
| 1 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` が存在する | `ls` |
| 2 | 同ファイルが 200-260 行に収まる | `wc -l` |
| 3 | 7 describe ブロックが存在し、すべて green | vitest reporter |
| 4 | `test.skip` / `it.skip` / `describe.skip` が 0 件 | `grep -E '\b(test\|it\|describe)\.skip' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` が 0 件 |
| 5 | `MergeIdentityRequestZ.parse` が成功系で throw しない | test pass |
| 6 | `DismissIdentityConflictRequestZ.parse` が成功系で throw しない | test pass |
| 7 | `DeleteBodyZ.parse({ reason:'' })` が throw する（失敗系） | test pass |
| 8 | `DeleteBodyZ.parse({})` が throw する（失敗系） | test pass |
| 9 | `pnpm --filter @ubm-hyogo/api typecheck` が exit 0 | CI log |
| 10 | `pnpm lint` が exit 0 | CI log |
| 11 | 2d test 内に `z.object(` が **0 件**（schema 再定義禁止） | grep |
| 12 | route 側の `DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` が named export として参照可能 | TypeScript compile |
| 13 | shared `MergeIdentityResponseZ` の `archivedSourceMemberId` を含む shape を fixture が満たす | parse pass |

---

## 11. 不変条件チェック

| # | 不変条件 | 適合確認 |
|---|---------|---------|
| 1 | 既存 API endpoint surface のみ参照（新 endpoint 追加禁止） | 7 endpoint すべて `apps/api/src/routes/admin/` 既存 route。新規追加 0 |
| 2 | D1 schema 変更禁止 | 本仕様書は schema/migration を扱わない |
| 3 | Google Form 仕様変更禁止 | 該当なし |
| 4 | `apps/web` から D1 直接アクセス禁止 | 本 spec は `apps/api` 内で完結。`apps/web` を import しない |
| 5 | OKLch トークン正本化 | 該当なし（contract test は色を扱わない） |
| 6 | スキーマ重複定義禁止（CONST_007） | 2d test 内 `z.object(` 0 件、すべて route/shared import |
| 7 | shared 昇格は別 PR | `DeleteBodyZ` は route から named export のみ。`packages/shared` への移動は本 PR で行わない |
| 8 | skip 禁止 | 0 件（phase-5 §6） |

---

## 12. 依存・ブロッカー

| 項目 | 値 |
|------|-----|
| 依存 sub-task | なし（2a/2b/2c とは並列、import 依存なし） |
| 依存 schema | `packages/shared/src/schemas/identity-conflict.ts`（既存・変更なし）、`@ubm-hyogo/shared` barrel（既存） |
| ブロッカー | なし |
| fixture 整合の責務 | 2a/2b/2c 仕様書側で「fixture shape は 2d contract test の `parse()` を通る形にする」と明記する必要がある（本 spec の fixture 標準形 §5 を参照点とする） |

> **CI 整合性**: 4 sub-task の fixture object 形が drift した場合、最初に失敗するのは 2d の zod parse である。2a/2b/2c の Playwright spec が green でも 2d が red なら統合 PR を block する設計。

---

## 13. 未解決事項 / 補正メモ

| # | 内容 | 扱い |
|---|------|------|
| A | phase-4 §1 Q2 の merge response shape `{ targetMemberId, sourceMemberId, mergedAt }` は shared schema 実体（`archivedSourceMemberId` + `auditId` 含む）と相違する。**正本は shared schema**。phase-4 / phase-5 の表現は本仕様書 §5 で補正済 | 補正済 |
| B | `requests.ts` の `adminRequestResolveBodySchema` import 先（`@ubm-hyogo/shared` のどの module）の確認は実装時に `packages/shared/src/index.ts` の barrel export を見て決める | 実装時確認 |
| C | `DeleteBodyZ` を将来 `packages/shared` に昇格する場合は別 PR | 別 PR / 別 task |
| D | 2a/2b/2c 仕様書の fixture object shape を本 spec §5 に合わせて揃える | 各 sub-task spec で対応 |

---

## Template Compliance Appendix

### メタ情報

- workflow: e2e-quality-uplift-stage-2
- sub-task: 2d
- phase coverage: 4 / 5（spec generation 段階）
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

### 目的

Stage 2 の E2E mock fixture と API zod schema の同型性を機械検証する Vitest contract test を新規追加し、4 sub-task 並列開発の drift を CI で検知可能にする。

### 実行タスク

- 上記 §3 / §6 / §10 を満たす Vitest spec を新規作成する。
- route 側 3 ファイルに対し named export 微修正を加える（CONST_007 重複禁止のため）。
- `pnpm --filter @ubm-hyogo/api test contract-stage-2` / typecheck / lint を pass させる。

### 参照資料

- `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md`
- 同 `phase-2.md` / `phase-4.md` §1 Q6 / §3.4 / `phase-5.md` §3.4 / §4
- `apps/api/src/routes/admin/{requests,identity-conflicts,member-delete,audit}.ts`
- `packages/shared/src/schemas/identity-conflict.ts`
- `apps/api/src/audit-correlation/__tests__/contract.test.ts`（既存 contract test の命名・構造参照）

### 統合テスト連携

- 本 spec は pure unit（DB 不要）。Cloudflare binding mock も不要。
- 2a/2b/2c の Playwright E2E と並列に CI で実行される。drift 検知は 2d が最初に失敗する設計。

### 成果物

- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（新規、200-260 行）
- `apps/api/src/routes/admin/{requests,audit,member-delete}.ts` の named export 微修正（各 +1 行）

### 完了条件

- [ ] §10 DoD 全 13 件を満たす。
- [ ] §11 不変条件 8 件すべてに適合する。
- [ ] 2a/2b/2c の fixture object と 2d の parse が CI 上で整合する。

### タスク100%実行確認【必須】

- [ ] phase-4 / phase-5 の 2d 関連項目をすべて棚卸しした。
- [ ] 未実行項目を PASS として扱っていない。
- [ ] phase-4 §1 Q2 の shape ズレを §5 / §13 で明示補正した。

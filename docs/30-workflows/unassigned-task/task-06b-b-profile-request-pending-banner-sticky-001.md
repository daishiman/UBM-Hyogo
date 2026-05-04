# task-06b-b-profile-request-pending-banner-sticky-001

## Metadata

| Item | Value |
| --- | --- |
| source workflow | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` |
| status | formalized |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| priority | medium |

## Purpose

Make `/profile` self-service request pending state durable across reloads after the initial 06b-B UI is implemented.

## Formalization

This unassigned task has been formalized by `docs/30-workflows/06b-b-profile-request-pending-banner-sticky/` on 2026-05-04. Keep this file as the historical source from 06b-B Phase 12; use the workflow root for execution.

## Scope In

- Read pending `visibility_request` / `delete_request` state from the member profile view model or a dedicated `/me` read endpoint.
- Show `RequestPendingBanner` after reload when a pending request exists.
- Disable duplicate request actions based on server state, not only local submit state.
- Add unit / integration / E2E coverage for reload persistence.

## Scope Out

- Admin request queue redesign.
- Immediate approval / rejection workflow changes.
- Profile body edit UI.

## スコープ（含む/含まない）

含む:
- `GET /me/profile` レスポンスへの `pendingRequests` 追加（`admin_member_notes.note_type IN ('visibility_request','delete_request')` かつ `request_status='pending'` を読む）
- `apps/web/src/lib/api/me-types.ts` の `PendingRequests` mirror 型と `MeProfileResponse.pendingRequests` 追加
- `/profile` Server Component から `RequestActionPanel` への server pending state 引き渡し（reload 後 banner 持続・duplicate ボタン disabled）
- API unit / route integration / web unit / Playwright reload-sticky E2E の追加

含まない:
- 管理画面の申請キュー UI 再設計
- 承認・却下フローの即時化等の挙動変更
- profile 本文編集 UI
- 新規 error code 追加（既存 `DUPLICATE_PENDING_REQUEST` を再利用）
- `:memberId` を path に持つ web → API ルート追加（不変条件 #11）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| client local optimistic state が server pending と乖離し reload 時に banner が消える | `/me/profile.pendingRequests` を single source of truth とし、local state は submit-in-flight のみに限定（implementation-guide.md Part 2）|
| `apps/web` から D1 への直接アクセスが混入し不変条件 #5 に違反する | `apps/web/app/api/me/[...path]/route.ts` の BFF passthrough のみで API へ到達し、grep gate で web 側 SQL/D1 import を検出する |
| `:memberId` を web→API path に出して不変条件 #11 違反 | backend session resolve（06b-A）で memberId を解決し、web 側 path には載せない |
| 別 tab / stale UI 起因の重複申請が増える | API は既存 `request_status='pending'` lookup と 409 + `DUPLICATE_PENDING_REQUEST` 契約を再利用し、UI は server state 優先で disabled / 文言を出す |
| Phase 11 logged-in screenshot が未取得のまま PASS と誤記される | Phase 11 は `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` / `blocked_runtime_evidence` 固定とし、authenticated capture cycle を別 wave に委譲する |
| `admin_member_notes` 上に新しい resolved 行が積まれた後も古い pending 行が残るケースで読み取りがずれる | `request_status='pending'` 述語で pending 行のみを抽出し、`apps/api/src/routes/me/index.test.ts` に「新しい resolved + 古い pending」エッジケースを追加する |

## 検証方法

- `mise exec -- pnpm --filter @ubm-hyogo/api test -- src/routes/me/index.test.ts`（pending なし / visibility pending / delete pending / duplicate 409 ケース）
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- RequestActionPanel`（banner + disabled state）
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- me-types.test-d.ts`（web mirror 型）
- `mise exec -- pnpm typecheck && mise exec -- pnpm lint`
- Playwright: `apps/web/playwright/tests/profile-pending-sticky.spec.ts`（authenticated runtime capture cycle で reload-sticky banner / disabled button screenshot を取得）
- grep gate: `apps/web` から D1 直接アクセス・`:memberId` 付き API 呼び出しが無いこと、profile 本文編集 UI 追加が無いこと
- AC-Runtime path 対応は `outputs/phase-12/implementation-guide.md` の AC table を一次ソースとする

## Acceptance Criteria

- Reloading `/profile` after a pending request still shows the pending banner.
- Duplicate action buttons are disabled when the server reports a pending request.
- 409 handling remains user-visible even if stale UI state exists.
- The implementation keeps `/me/*` member self-service boundaries and does not add `:memberId` to web API calls.

## 苦戦箇所（Struggle Points / 5分解決カード）

> 親タスク 06b-B で記録した lessons-learned から本タスク継続実装に直結する論点を抜粋。詳細は
> `.claude/skills/aiworkflow-requirements/references/lessons-learned-06b-b-profile-self-service-request-ui-2026-05.md` を参照。

### S1: pending state の正本は server side に置く（client local state を信用しない）

- **苦戦**: 06b-B 実装では submit 直後の local optimistic state で banner を出していた。reload で消えるため、本タスクで server-side pending を読み出し直す必要がある。local state と server state の二重管理にすると 409 と銀行残高的に競合する。
- **5分解決**: `/me` 系 read endpoint に `pendingRequests: { visibility?: {...}, delete?: {...} }` を含め、UI は **server state を single source of truth** として描画する。local submit state は「submit-in-flight」のみ使う。

### S2: `authGateState !== 'active'` での disabled 判定は 06b-B と同じ語彙で再宣言しない

- **苦戦**: UI で独自 enum を作ると 05b の 5 状態モデル（`active` / `pending_consent` / `rules_declined` / `delete_requested` / `deleted`）と語彙が割れる。再申請可否判定がずれる。
- **5分解決**: `/me` レスポンスの `authGateState` をそのまま読む。pending request 有無 × `authGateState` の組合せで disabled / tooltip 文言を決め、enum 正本は 05b 側に残す。

### S3: BFF proxy で `:memberId` を path に出さない（不変条件 #11）

- **苦戦**: pending state を読むエンドポイントを `/api/me/:memberId/pending` 形式で書きたくなるが、不変条件 #11 と #5 に同時に違反する。
- **5分解決**: `apps/web/app/api/me/[...path]/route.ts` の passthrough に新 endpoint を相乗りさせ、memberId は backend session resolve（06b-A）で解決する。

### S4: Phase 11 を `PASS` と書かない（runtime evidence boundary）

- **苦戦**: 06b-B と同様、本タスクも logged-in visual evidence は 06b-C / 08b / 09a 側に委譲される可能性が高い。Phase 11 を `PASS` 表現すると evidence boundary が崩れる。
- **5分解決**: Phase 11 ステータスは `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` または `blocked_runtime_evidence` で固定。logged-in capture は別 wave に委譲リンクする。

### S5: 重複申請語彙は 409 + `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` を再利用

- **苦戦**: server-side pending を UI から見える形にした途端、「stale UI state からの 2 度押し」「server 側で別 tab から先に投入された」など、複数経路で重複申請が発生する。422 / 401 / 403 と区別する必要がある。
- **5分解決**: 06b-B で確立した 409 + `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` 契約をそのまま再利用し、UI は「もう申請を受け付け中です」文言で reflect。新たな error code を増やさない。

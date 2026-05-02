# task-06b-b-profile-request-pending-banner-sticky-001

## Metadata

| Item | Value |
| --- | --- |
| source workflow | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` |
| status | unassigned |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| priority | medium |

## Purpose

Make `/profile` self-service request pending state durable across reloads after the initial 06b-B UI is implemented.

## Scope In

- Read pending `visibility_request` / `delete_request` state from the member profile view model or a dedicated `/me` read endpoint.
- Show `RequestPendingBanner` after reload when a pending request exists.
- Disable duplicate request actions based on server state, not only local submit state.
- Add unit / integration / E2E coverage for reload persistence.

## Scope Out

- Admin request queue redesign.
- Immediate approval / rejection workflow changes.
- Profile body edit UI.

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

### S5: 重複申請語彙は 409 + `SelfRequestError(code:'duplicate-pending')` を再利用

- **苦戦**: server-side pending を UI から見える形にした途端、「stale UI state からの 2 度押し」「server 側で別 tab から先に投入された」など、複数経路で重複申請が発生する。422 / 401 / 403 と区別する必要がある。
- **5分解決**: 06b-B で確立した 409 + `SelfRequestError(code:'duplicate-pending')` 契約をそのまま再利用し、UI は「もう申請を受け付け中です」文言で reflect。新たな error code を増やさない。

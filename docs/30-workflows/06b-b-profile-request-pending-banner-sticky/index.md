# 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-B-pending-banner-sticky → 06b-C） |
| owner | - |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| priority | medium |
| 作成日 | 2026-05-04 |
| GitHub Issue | #428 |
| dependency order | 06b-A → 06b-B → **06b-B-pending-banner-sticky (本タスク)** → 06b-C |
| invariants touched | #4, #5, #11 |
| artifact ledger | root `artifacts.json` + `outputs/artifacts.json` parity |

## purpose

`/profile` の self-service 申請（visibility / delete）の **pending state を reload しても消えない durable な banner として表示する**。
現状の 06b-B 実装では `RequestPendingBanner` は client local state ベースで、ページ reload すると pending が消えてしまい、ユーザーが二重申請してしまうリスクがある。本タスクは server-side pending state を read する API 拡張と、その state を server component で fetch して `RequestActionPanel` に渡し、reload 後も banner が永続表示されるよう sticky 化する。

## why this is not a restored old task

このタスクは 06b-B 完了後に「reload で banner が消える」という UX 課題を解消するための follow-up（GitHub Issue #428）であり、新規スペックである。06b-B は client local state ベースの banner を実装したが、durable 化は scope out としていた。本タスクで初めて server-side pending state を取り扱う。

## scope in / out

### Scope In
- server-side pending request 取得（`/me/profile` 拡張 or 新規 `/me/pending-requests` endpoint）
- `MeProfileResponseZ` に `pendingRequests` フィールド追加（型: `{ visibility?: {...}, delete?: {...} }`）
- `apps/api/src/routes/me/services.ts` に「現在 pending な request を取得する」関数を追加
- `apps/web/app/profile/page.tsx`（Server Component）で server fetch した pending を `RequestActionPanel` に渡す
- `RequestActionPanel` の disabled 判定を server pending ベースに書き換え
- `RequestPendingBanner` が reload 後も表示される
- unit / integration / E2E カバレッジに reload 永続性ケースを追加
- BFF passthrough（`apps/web/app/api/me/[...path]/route.ts`）に相乗り（`:memberId` を web API path に出さない）

### Scope Out
- admin queue 再設計
- 即時 approve / reject の挙動変更
- profile body 編集 UI 追加（不変条件 #4）
- `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` 以外の新 error code 追加（S5）
- `authGateState` enum の再宣言（05b 側を正本とする・S2）

## dependencies

### Depends On
- 06b-A-me-api-authjs-session-resolver（session.user.memberId 解決）
- 06b-B-profile-self-service-request-ui（client local 版 banner 実装済み）

### Blocks
- 06b-C-profile-logged-in-visual-evidence（reload 永続性の visual evidence を取得する）

## refs

- GitHub Issue: #428
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- apps/web/app/profile/page.tsx
- apps/web/app/profile/_components/RequestActionPanel.tsx
- apps/web/app/profile/_components/RequestPendingBanner.tsx
- apps/web/app/profile/_components/VisibilityRequest.client.tsx
- apps/web/app/profile/_components/DeleteRequest.client.tsx
- apps/web/app/api/me/[...path]/route.ts
- apps/api/src/routes/me/index.ts
- apps/api/src/routes/me/schemas.ts
- apps/api/src/routes/me/services.ts

## AC（受入条件サマリ）

- AC-1: reload 後も pending banner が表示される（server-side state ベース）
- AC-2: server が pending を返したら重複アクションボタンが disabled
- AC-3: 409 ハンドリングは stale UI でも user-visible（既存 SelfRequestError 再利用）
- AC-4: `/me/*` 境界を保つ（`:memberId` を web API path に出さない・不変条件 #11 / #5）
- AC-5: profile body 編集 UI を追加しない（不変条件 #4）
- AC-6: client から D1 を直接叩かない（不変条件 #5）
- AC-7: unit / integration / E2E に reload 永続性テストが追加される

## 苦戦箇所（仕様書全 phase に転記）

- **S1**: pending state の正本は server-side。local state は submit-in-flight のみ。
- **S2**: `authGateState` enum は 05b 側を正本とし UI で再宣言しない。
- **S3**: BFF proxy で `:memberId` を path に出さない（不変条件 #11 / #5）。`apps/web/app/api/me/[...path]/route.ts` の passthrough に相乗り。
- **S4**: Phase 11 status は `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` または `blocked_runtime_evidence`。logged-in capture は別 wave に委譲。
- **S5**: 重複申請語彙は 409 + `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` を再利用。新 error code を増やさない。

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/artifacts.json
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## invariants touched

- #4 profile body edit forbidden
- #5 apps/web D1 direct access forbidden
- #11 member self-service boundary

## completion definition

全 phase 仕様書が揃い、`apps/api` と `apps/web` の実装差分・型契約・evidence path・user approval gate が明確であること。実装本体・deploy・commit・push・PR 作成は本仕様書作成タスクでは実行しない。

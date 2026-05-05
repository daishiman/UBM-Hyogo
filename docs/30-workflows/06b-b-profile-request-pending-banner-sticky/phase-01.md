# Phase 1: 要件定義 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 1 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 本タスク → 06b-C） |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| GitHub Issue | #428 |

## 目的

`/profile` の self-service 申請（visibility / delete）の pending state を **reload しても消えない durable な banner として表示する** ための要件、受入条件、API 契約、現行差分、approval gate を確定する。
06b-B では client local state ベースの banner を実装したが、reload で pending 状態が失われ二重申請リスクがある。本タスクは server-side を正本（S1）として pending を読み出し、UI を sticky 化する。

## 実行タスク

1. 既存実装（06b-B 産物）を読み、pending state の現状管理位置を確定する。完了条件: `RequestPendingBanner` が local state 由来であること、reload で消えることを根拠付き列挙する。
2. server-side pending state の read 経路を確定する（`/me/profile` 拡張 vs 新規 `/me/pending-requests`）。完了条件: 採用案と理由が記載される。
3. AC-1..AC-7 を evidence path と 1:1 で定義する。完了条件: AC が test ID と紐付く。
4. API 契約（request/response 型・status code）と BFF passthrough（`apps/web/app/api/me/[...path]/route.ts`）の相乗り方針（S3）を確定する。完了条件: 202/409/422/401/5xx すべての UI 挙動が定義される。
5. 苦戦箇所 S1-S5 を本仕様書全 phase に転記する受け渡し責務を明示する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| pages 仕様 | `docs/00-getting-started-manual/specs/05-pages.md` | `/profile` 構成 |
| 編集/削除仕様 | `docs/00-getting-started-manual/specs/07-edit-delete.md` | 公開停止 / 退会フロー |
| UI/UX 仕様 | `docs/00-getting-started-manual/specs/09-ui-ux.md` | banner / dialog の a11y |
| profile page | `apps/web/app/profile/page.tsx` | Server Component |
| RequestPendingBanner | `apps/web/app/profile/_components/RequestPendingBanner.tsx` | 既存 banner（local state 版） |
| RequestActionPanel | `apps/web/app/profile/_components/RequestActionPanel.tsx` | pending を local props で受領 |
| VisibilityRequest client | `apps/web/app/profile/_components/VisibilityRequest.client.tsx` | submit handler |
| DeleteRequest client | `apps/web/app/profile/_components/DeleteRequest.client.tsx` | submit handler |
| BFF passthrough | `apps/web/app/api/me/[...path]/route.ts` | `:memberId` を path に出さない proxy |
| /me API ルータ | `apps/api/src/routes/me/index.ts` | `GET /me/profile` 等 |
| /me schemas | `apps/api/src/routes/me/schemas.ts` | `MeProfileResponseZ` |
| /me services | `apps/api/src/routes/me/services.ts` | `memberSelfRequestQueue` |

## 実行手順

### 0. 既実装状態の調査

```bash
rg -n "RequestPendingBanner|pendingType|pendingRequests" apps/web/
rg -n "MeProfileResponseZ|MeQueueAcceptedResponseZ" apps/api/src/routes/me/
rg -n "memberSelfRequestQueue|SelfRequestError" apps/api/src/routes/me/
```

- `RequestPendingBanner` が `RequestActionPanel` 内 local state で管理されていること
- reload で pending が失われ二重申請可能になること
- `MeProfileResponseZ` に `pendingRequests` 相当のフィールドが**まだ存在しないこと**

### 1. ユーザーシナリオ（S1..S6）

- **U1**: pending 申請成立後、ページ reload しても banner が表示されたまま。
- **U2**: pending 申請成立後、ボタンが server state ベースで disabled。
- **U3**: 別タブで pending を作った後、本タブを reload すると pending が反映される。
- **U4**: 申請が admin により処理（approve/reject）されると、reload 後 banner が消える。
- **U5**: stale UI（古いタブ）で重複 submit → 409 + `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` を user-visible に表示（S5）。
- **U6**: API 5xx / network 失敗時は banner 表示を諦め、エラー UI を出す（pending を仮表示しない）。

### 2. 受入条件（AC）

| ID | 条件 | evidence |
| --- | --- | --- |
| AC-1 | reload 後も pending banner が表示される | E2E `profile-pending-sticky.spec.ts` reload step |
| AC-2 | server pending を返したら重複アクションボタンが disabled | unit + E2E |
| AC-3 | 409 ハンドリングが stale UI でも user-visible（既存 SelfRequestError 再利用） | unit + E2E |
| AC-4 | `/me/*` 境界を保つ（web API path に `:memberId` を出さない） | grep + integration |
| AC-5 | profile body 編集 UI を追加しない | grep |
| AC-6 | client から D1 を直接叩かない | grep `cloudflare:d1` 0 hit |
| AC-7 | unit / integration / E2E に reload 永続性ケースが追加される | Phase 4 で TC 採番 |

### 3. API 契約の固定

採用案: **`GET /me/profile` 拡張**（新規 endpoint を増やさず、profile 取得と同時に pending を返す。Phase 2 で詳細化）。

| field | 型 | 説明 |
| --- | --- | --- |
| `pendingRequests.visibility` | `{ queueId, status: "pending", createdAt, desiredState: "hidden" \| "public" } \| undefined` | visibility 申請の pending |
| `pendingRequests.delete` | `{ queueId, status: "pending", createdAt } \| undefined` | delete 申請の pending |

POST 系（`POST /me/visibility-request` / `POST /me/delete-request`）の契約は変更しない。重複時 409 + `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')`（S5）。

### 4. 現行 UI / API 差分

| 層 | 現状 | 本タスクで変更 |
| --- | --- | --- |
| `apps/api/src/routes/me/schemas.ts` | `MeProfileResponseZ` に pending なし | `pendingRequests` フィールド追加 |
| `apps/api/src/routes/me/services.ts` | `memberSelfRequestQueue` に submit 系のみ | `getPendingRequestsForMember(memberId)` 追加 |
| `apps/api/src/routes/me/index.ts` | `GET /me/profile` で pending 未返却 | pending を含めて返却 |
| `apps/web/app/api/me/[...path]/route.ts` | passthrough（変更なし） | 変更なし（S3: 相乗り） |
| `apps/web/app/profile/page.tsx` | pending 取得していない | server fetch した pending を `RequestActionPanel` に渡す |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | local state ベースで pending 表示 | server pending を初期値として受領、submit-in-flight のみ local（S1） |
| `apps/web/app/profile/_components/RequestPendingBanner.tsx` | props のみ | 変更なし（props 経由で server pending 反映） |

### 5. approval gate / 自走禁止操作

- 06b-A、06b-B が完了済みであることを前提とする（前者は session 解決、後者は client local 版 banner / submit 経路）。
- 本タスク仕様書段階では実装コード作成・deploy・commit・push・PR 作成を行わない。Phase 13 で user 明示承認後に限り実行する。

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニット Line | 80%+ | Phase 9 |
| ユニット Branch | 60%+ | Phase 9 |
| 結合（API） | 100% | Phase 9（既存 /me/* suite + 拡張 case） |
| E2E 正常系（reload 永続性） | 100% | Phase 11 |
| E2E 異常系（409 stale） | 80%+ | Phase 11 |

## 多角的チェック観点

- 不変条件 #4: pending 取得・表示は body 編集 UI を追加しない。
- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる。
- 不変条件 #11: web API path に `:memberId` を出さない（S3）。
- S1: pending state 正本は server。client local は submit-in-flight のみ。
- S2: `authGateState` enum を再宣言しない。
- S5: 新 error code を追加せず `DUPLICATE_PENDING_REQUEST` を再利用。

## サブタスク管理

- [ ] 既実装 anchor を確認（grep 結果）
- [ ] AC-1..AC-7 を evidence と 1:1 に紐付け
- [ ] API 契約（pending field）を確定
- [ ] 苦戦箇所 S1-S5 を全 phase 引き渡し対象として明記
- [ ] `outputs/phase-01/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 要件定義書 | `outputs/phase-01/main.md` | ユーザーシナリオ / AC / API 契約 / 差分 / gate |

## 完了条件

- [ ] U1..U6 が記載されている
- [ ] AC-1..AC-7 が evidence path と対応
- [ ] API 契約（202/409/422/401）と pending field 仕様が記載
- [ ] 不変条件 #4 / #5 / #11 への遵守方針記載
- [ ] 06b-A / 06b-B 完了が前提として明記
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] メタ情報 9 行が埋まっている
- [ ] 06b-B の復活ではなく follow-up（durable 化）であることが明記
- [ ] 本文編集 UI 追加が scope out として明記
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC-1..AC-7、API 契約（pending field）、現行差分テーブル、approval gate（06b-A / 06b-B）、苦戦箇所 S1-S5 を渡す。

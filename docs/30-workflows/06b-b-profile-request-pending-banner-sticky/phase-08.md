# Phase 8: DRY 化 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 8 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

既存 helper / type / component / error class を再利用し、重複コードや並行宣言を作らない。

## DRY 観点と方針

| 観点 | 重複候補 | 方針 |
| --- | --- | --- |
| zod 型 | `MeQueueAcceptedResponseZ` の `queueId / status / createdAt` | `PendingVisibilityRequestZ` / `PendingDeleteRequestZ` で共通項を pick / extend する形を検討（過剰抽象化は避ける） |
| services | submit 系（`memberSelfRequestQueue`）と read 系（新 `getPendingRequestsForMember`） | services.ts 内に並列で配置。共通の型 import を統一 |
| error class | `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` | 既存を再利用（S5）。新規 error class を作らない |
| UI 文言 | `RequestPendingBanner` 文言 | 06b-B 既存のまま。文言の重複ファイル化は不要 |
| client helper | `fetchAuthed` | 06b-B で実装済を再利用。新規 helper を増やさない |
| auth gate | `authGateState` enum | 05b 側を正本。本タスクで再宣言しない（S2） |

## 重複検出 grep（CI gate 候補）

```bash
# enum 再宣言（S2）
rg -n "type\s+AuthGateState|enum\s+AuthGateState" apps/web/app/profile/  # 0 hit

# 同名関数の重複
rg -n "function getPendingRequestsForMember|const getPendingRequestsForMember" apps/  # apps/api 内 1 hit のみ

# error code 追加（S5）
rg -n "DUPLICATE_PENDING_REQUEST" apps/api/src/routes/me/  # 既存数のみ
```

## 既存資産の再利用一覧

| 既存資産 | パス | 再利用方法 |
| --- | --- | --- |
| `fetchAuthed` | `apps/web/src/lib/fetch/authed.ts` | client helper の通信層に流用（変更なし） |
| `SelfRequestError` | `apps/api/src/routes/me/services.ts` | 409 で再 throw（変更なし・S5） |
| `RequestPendingBanner` | `apps/web/app/profile/_components/RequestPendingBanner.tsx` | props 経由で server pending 表示。実装変更最小 |
| `MeProfileResponseZ` | `apps/api/src/routes/me/schemas.ts` | 既存 schema を拡張（fork ではない） |
| BFF `[...path]/route.ts` | `apps/web/app/api/me/[...path]/route.ts` | passthrough を流用（S3） |
| Playwright auth fixture | `apps/web/playwright/fixtures/auth.ts` | E2E 認証で再利用 |

## 過剰抽象化の禁止

- `PendingRequest` を共通 base type にして visibility/delete を派生させる、という大規模 refactor は本タスクでは行わない（YAGNI）
- 文言の i18n 化や error mapping の generic 化も本タスクでは scope out

## サブタスク管理

- [ ] DRY 観点で重複候補を列挙
- [ ] 既存資産再利用一覧確定
- [ ] grep gate 記載
- [ ] `outputs/phase-08/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| DRY レビュー | `outputs/phase-08/main.md` |

## 完了条件

- [ ] 既存資産再利用が一覧化されている
- [ ] 新規 error code / enum / helper が増えていない（S2 / S5）
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、DRY レビュー結果と grep gate を渡す。

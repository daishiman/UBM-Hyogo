# Phase 1 成果物: 要件定義 — 06b-B-profile-self-service-request-ui

## 1. メタ確定値

| 項目 | 値 |
| --- | --- |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |
| scope | `/profile` の公開停止/再公開申請 UI、退会申請 UI、client helper、申請結果 UI 状態 |
| workflow_state | implemented-local |

## 2. 現行コード anchor（P50 チェック結果）

| 項目 | 確認結果 |
| --- | --- |
| `apps/web/app/profile/page.tsx` | `StatusSummary` / `ProfileFields` / `EditCta` / `AttendanceList` の 4 component。申請 UI なし。 |
| `apps/web/app/profile/_components/EditCta.tsx` | 外部 Google Form リンクのみ。本文編集 form なし（不変条件 #4 維持）。 |
| `apps/api/src/routes/me/index.ts` | `POST /me/visibility-request`（202/409/422）、`POST /me/delete-request`（202/409/422）実装済み。`sessionGuard` + `requireRulesConsent` + `rateLimitSelfRequest` 経由。 |
| `apps/api/src/routes/me/schemas.ts` | `MeVisibilityRequestBodyZ` `MeDeleteRequestBodyZ` `MeQueueAcceptedResponseZ` 定義済み。 |
| `apps/web/src/lib/api/me-requests.ts` | **未存在**（本タスクで新設）。 |

旧候補名と現行 owner の一致を確認済み。新設対象は client UI と client helper のみ。

## 3. ユーザーシナリオ

- **S1**: `publishState=public` の本人が「公開を停止する」 → 確認ダイアログ → API 202 → pending バナー。
- **S2**: `publishState=hidden` の本人が「再公開を申請する」 → 確認ダイアログ → API 202 → pending バナー。
- **S3**: 本人が「退会を申請する」 → 二段確認ダイアログ（不可逆性表示）→ API 202 → pending バナー。
- **S4**: 同種 pending あり状態で再 submit → 409 → 「既に申請を受け付けています」表示・ボタン disabled。
- **S5**: 422 / 5xx / network 失敗 → エラーメッセージ + リトライ導線。
- **S6**: `rulesConsent !== 'consented'` → panel 自体非表示（API 側 `requireRulesConsent` と整合）。

## 4. 受入条件

| ID | 条件 | evidence |
| --- | --- | --- |
| AC-1 | `/profile` から公開停止申請が送信でき、202 後に pending UI が表示される | E2E `profile.visibility-request.spec.ts` + SS |
| AC-2 | `publishState=hidden` のときのみ再公開申請ボタンが描画される | E2E + visual diff |
| AC-3 | 退会申請は二段確認後にのみ submit される | E2E + visual diff |
| AC-4 | 二重 pending 時の再 submit は 409 表示・ボタン disabled になる | API mock 409 visual SS |
| AC-5 | プロフィール本文編集 UI を追加しない | grep + visual diff |
| AC-6 | apps/web から D1 を直接叩く実装が無い | `rg cloudflare:d1 apps/web` → 0 hit |
| AC-7 | エラー UI が `role=alert` で読み上げ可能 | axe scan |

## 5. API 契約

| endpoint | request | success | 4xx |
| --- | --- | --- | --- |
| `POST /me/visibility-request` | `{ desiredState: "hidden" \| "public", reason?: string<=500 }` | `202 MeQueueAcceptedResponse` | `409 DUPLICATE_PENDING_REQUEST` / `422 INVALID_REQUEST` / `401` / `403 RULES_CONSENT_REQUIRED` / `429` |
| `POST /me/delete-request` | `{ reason?: string<=500 }`（空 body 許容） | `202 MeQueueAcceptedResponse` | 同上 |

`MeQueueAcceptedResponse = { queueId, type:"visibility_request"|"delete_request", status:"pending", createdAt }`。

## 6. 現行 UI 構成と差分

| セクション | 現状 | 本タスクで追加 |
| --- | --- | --- |
| StatusSummary / ProfileFields / EditCta / AttendanceList | 既存維持 | 変更なし |
| RequestActionPanel / VisibilityRequestDialog / DeleteRequestDialog / RequestPendingBanner / RequestErrorMessage | — | 新規 |
| `apps/web/src/lib/api/me-requests.ts` | — | 新規 client helper |

## 7. 非機能要件

- a11y: WCAG 2.1 AA 相当。`role=dialog` + focus trap + esc close。エラーは `role=alert`。
- i18n: 日本語固定。文言テーブルは Phase 2 で 1:1 確定。
- security: reason 最大 500 文字を client zod でも検証。React text node のみで描画し XSS 抑止。
- performance: Server Component fetch は既存 `/me` `/me/profile` のみ。新規 fetch は client helper の submit 時のみ。

## 8. Approval Gate / 自走禁止操作

| ゲート | 内容 |
| --- | --- |
| GATE-1 | 06b-A（Auth.js session resolver follow-up）が `completed` であること。未完了時は smoke 不可なので Phase 11 を停止する。 |
| GATE-2 | API `/me/visibility-request` `/me/delete-request` の staging 動作確認。 |
| GATE-3 | 不変条件 #4 / #5 / #11 のいずれかで MAJOR が出た場合は Phase 2 へ差戻し。 |

自走禁止: アプリケーションコード実装 / deploy / `git commit` / `git push` / PR 作成。本仕様書整備フェーズではこれらを行わない。

## 9. 不変条件適合方針

| 不変条件 | 守り方 |
| --- | --- |
| #4 本文編集禁止 | dialog の form field を `desiredState`/`reason`/確認チェックのみに限定 |
| #5 D1 直接禁止 | client helper は `fetchAuthed` のみ経由 |
| #11 self-service 境界 | URL に `:memberId` を含めない |

## 10. 次 Phase への handoff

Phase 2 へ：AC-1..AC-7、API 契約表、現行 UI 差分、approval gate、不変条件適合方針。

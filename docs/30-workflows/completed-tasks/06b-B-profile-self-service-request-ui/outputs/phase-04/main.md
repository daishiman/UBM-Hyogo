# Output Phase 4: テスト戦略 — 06b-B-profile-self-service-request-ui

## status

SPEC_FINALIZED（テスト戦略本体）。実装・実測は Phase 5 / Phase 11 で別途実行する。

## 1. テストピラミッド

| 層 | ツール | 対象 | 主担当責務 |
| --- | --- | --- | --- |
| Unit | vitest + @testing-library/react + user-event + vitest-axe | 5 component / 2 helper | フォーム state、送信ガード、文言、a11y、kbd |
| Contract | vitest + zod `expectTypeOf` | helper input/output 型 ↔ `apps/api/src/routes/me/schemas.ts` | API/UI drift 検出 |
| Integration | vitest + `vi.spyOn(globalThis, "fetch")` | helper × `fetchAuthed` | HTTP code → result code 変換、cookie 透過 |
| E2E | Playwright（route stubbing） | profile 申請動線 | navigation / visual diff / kbd 操作 |
| a11y | vitest-axe + @axe-core/playwright | dialog open/close、error 表示 | WCAG 2.1 AA 違反 0 |
| Visual | Playwright screenshot / trace | open / pending / 409 / network error | Phase 11 evidence |

## 2. ユニットテストケース（TC-U-XX）

ファイル配置:
- `apps/web/app/profile/_components/__tests__/RequestActionPanel.test.tsx`
- `apps/web/app/profile/_components/__tests__/VisibilityRequestDialog.test.tsx`
- `apps/web/app/profile/_components/__tests__/DeleteRequestDialog.test.tsx`
- `apps/web/app/profile/_components/__tests__/RequestPendingBanner.test.tsx`
- `apps/web/app/profile/_components/__tests__/RequestErrorMessage.test.tsx`
- `apps/web/src/lib/api/__tests__/me-requests.test.ts`

| TC ID | テスト名（it） | 対象 | 紐付き AC |
| --- | --- | --- | --- |
| TC-U-01 | renders 公開停止 button when publishState=public | RequestActionPanel | AC-1 |
| TC-U-02 | renders 再公開 button when publishState=hidden | RequestActionPanel | AC-2 |
| TC-U-03 | renders 退会 button when consent=consented | RequestActionPanel | AC-3 |
| TC-U-04 | hides panel when rulesConsent !== consented | RequestActionPanel | S6 |
| TC-U-05 | opens visibility dialog with focus on heading | RequestActionPanel | AC-7 |
| TC-U-06 | esc / overlay click closes dialog | dialogs | AC-7 |
| TC-U-07 | reason 入力 500 文字超で submit 不可 | VisibilityRequestDialog | security |
| TC-U-08 | submit 中は二重クリック不可 | dialogs | AC-4 派生 |
| TC-U-09 | 退会 dialog はチェック未入力で submit 不可 | DeleteRequestDialog | AC-3 |
| TC-U-10 | 退会 dialog の不可逆性文言表示 | DeleteRequestDialog | AC-3 |
| TC-U-11 | error code → 文言マッピング全 7 種 | RequestErrorMessage | AC-7 / Phase 6 |
| TC-U-12 | banner は type 別に文言切替 | RequestPendingBanner | AC-1 / AC-3 |
| TC-U-13 | helper: 202 → ok=true | requestVisibilityChange | AC-1 |
| TC-U-14 | helper: 409 → DUPLICATE_PENDING_REQUEST | both | AC-4 |
| TC-U-15 | helper: 422 → INVALID_REQUEST | both | Phase 6 AB-02 |
| TC-U-16 | helper: 401 → AuthRequiredError throw | both | Phase 6 AB-03 |
| TC-U-17 | helper: 429 → RATE_LIMITED | both | Phase 6 AB-05 |
| TC-U-18 | helper: 5xx → SERVER | both | Phase 6 AB-06 |
| TC-U-19 | helper: network → NETWORK | both | Phase 6 AB-07 |
| TC-U-20 | helper: URL は `/me/visibility-request` / `/me/delete-request` 固定 | both | 不変条件 #11 |
| TC-U-21 | axe: dialog open 時 violations 0 | dialogs | AC-7 |

## 3. Contract / Integration ケース（TC-I-XX）

| TC ID | 検証 |
| --- | --- |
| TC-I-01 | `VisibilityRequestInput` ↔ `MeVisibilityRequestBodyZ` 型一致（`expectTypeOf`） |
| TC-I-02 | `DeleteRequestInput` ↔ `MeDeleteRequestBodyZ` 型一致 / `QueueAccepted` ↔ response zod |
| TC-I-03 | `fetchAuthed` 経由で cookie 透過（`credentials: "include"` 等の規約遵守） |
| TC-I-04 | request method=POST、Content-Type=application/json、URL 固定 |
| TC-I-05 | `requestDelete({})` で 202 が返る（空 body 許容） |

## 4. E2E ケース（TC-E-XX, Playwright）

ファイル: `apps/web/playwright/tests/profile-visibility-request.spec.ts` / `delete-request.spec.ts`。
fixture: 既存 authedSession（06b-A 完了後）+ `page.route("**/me/*-request", ...)` で API stub。

| TC ID | シナリオ | 期待 | evidence |
| --- | --- | --- | --- |
| TC-E-01 | S1 公開停止 | 202 → banner | phase-11/visibility-pending.png |
| TC-E-02 | S2 再公開 | 202 → banner | phase-11/republish-pending.png |
| TC-E-03 | S3 退会（二段確認） | チェック後 submit → banner | phase-11/delete-pending.png |
| TC-E-04 | S4 二重申請 409 | banner + button disabled | phase-11/visibility-409.png |
| TC-E-05 | S5 422 reason 過長 | dialog inline error | phase-11/visibility-422.png |
| TC-E-06 | S5 network failure | retry CTA + role=alert | phase-11/network-error.png |
| TC-E-07 | S6 unconsented | panel 非表示 | phase-11/no-consent.png |
| TC-E-08 | 401 → /login | URL=/login?redirect=/profile | trace |
| TC-E-09 | kbd のみで visibility 完走 | tab/enter のみで成功 | a11y trace |

## 5. a11y ケース（TC-A-XX）

| TC ID | 検証 | 手段 |
| --- | --- | --- |
| TC-A-01 | dialog open axe scan violations=0 | vitest-axe + @axe-core/playwright |
| TC-A-02 | focus trap | userEvent.tab 循環 |
| TC-A-03 | esc close + focus restore | userEvent.keyboard |
| TC-A-04 | error が role="alert" | RTL getByRole |
| TC-A-05 | banner が aria-live="polite" | RTL |
| TC-A-06 | 退会 submit に aria-describedby 関連付け | RTL |

## 6. mock 戦略（7 系統網羅）

| 系統 | Unit/Helper | E2E |
| --- | --- | --- |
| 202 | `vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(json, { status: 202 }))` | `route.fulfill({ status: 202, body: ... })` |
| 409 DUPLICATE_PENDING_REQUEST | 同上 status=409 | 同上 |
| 422 INVALID_REQUEST | status=422 | 同上 |
| 401 UNAUTHORIZED | `fetchAuthed` の `AuthRequiredError` を投げる差替え | `page.context().clearCookies()` + 401 fulfill |
| 429 RATE_LIMITED | status=429 + Retry-After header | 同上 |
| 5xx SERVER | status=503 | 同上 |
| network | `fetch.mockRejectedValueOnce(new TypeError("Network error"))` | `route.abort("failed")` |

レスポンス fixture は `apps/api/src/routes/me/schemas.ts` の zod から派生（ハードコード文字列禁止、Phase 9 grep）。

## 7. coverage 目標

| 指標 | 目標 | 評価 phase | 免除条件 |
| --- | --- | --- | --- |
| Line | 80%+ | Phase 9 | helper 内 `fetchAuthed` 経由分岐は除外 |
| Branch | 60%+ | Phase 9 | 環境分岐のみ |
| Function | 80%+ | Phase 9 | type-only export 除外 |
| E2E 正常系 | 100% | Phase 11 | 0 件免除 |
| E2E 異常系 | 80%+ | Phase 11 | network failure flaky 1 回再試行可 |

## 8. AC × TC マトリクス（Phase 7 引き継ぎ）

| AC | 紐付き TC |
| --- | --- |
| AC-1 公開停止 | TC-U-01, TC-U-13, TC-E-01 |
| AC-2 再公開 | TC-U-02, TC-U-13, TC-E-02 |
| AC-3 退会 | TC-U-03, TC-U-09, TC-U-10, TC-E-03 |
| AC-4 二重申請 409 | TC-U-08, TC-U-14, TC-E-04 |
| AC-5 本文編集 UI 無 | grep lint（ステップ8）+ TC-U-07（form field 限定） |
| AC-6 D1 直接禁止 | grep lint + TC-U-20 |
| AC-7 a11y | TC-U-05, TC-U-06, TC-U-11, TC-U-21, TC-A-01..06 |

## 9. 既存 utility 重複検出（事前 baseline）

```bash
rg -n "export (async )?function (request|requestVisibility|requestDelete)" apps/web/src/lib/   # 期待 0 hit
rg -n "VisibilityRequest|DeleteRequest" apps/web/src/lib/api/                                  # 期待 0 hit
rg -n "RequestActionPanel|RequestPendingBanner|RequestErrorMessage" apps/web/app/              # 期待 0 hit
```

1 件以上 hit した場合は Phase 2 設計に差し戻す。

## 10. 未実装/未実測の扱い

本 Phase は戦略策定のみ。実 vitest/playwright 実行は Phase 9 / Phase 11 で評価する。
評価まで「PASS」扱いしない。

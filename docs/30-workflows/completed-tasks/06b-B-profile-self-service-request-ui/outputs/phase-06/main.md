# Output Phase 6: 異常系シナリオ集 — 06b-B-profile-self-service-request-ui

## status

SPEC_FINALIZED（異常系シナリオ集本体）。実 vitest/playwright 実行は Phase 9 / Phase 11 で別途実施。

## 1. 異常系一覧（AB-XX）

| AB ID | 系統 | HTTP | UI 表示 | retry | a11y |
| --- | --- | --- | --- | --- | --- |
| AB-01 | DUPLICATE_PENDING_REQUEST | 409 | dialog 内 alert + banner 表示 + trigger button disabled | 不可 | role=alert |
| AB-02 | INVALID_REQUEST | 422 | dialog 内 inline error（reason 過長） | 入力修正後 | role=alert + aria-invalid + aria-describedby |
| AB-03 | UNAUTHORIZED | 401 | 表示せず `/login?redirect=/profile` リダイレクト | — | — |
| AB-04 | RULES_CONSENT_REQUIRED | 403 | profile 上部静的バナー + panel 非表示 | profile から再同意 | role=alert |
| AB-05 | RATE_LIMITED | 429 | dialog 内 alert + cool-down 表示 | 自動 retry なし | role=alert |
| AB-06 | SERVER | 5xx | dialog 内 alert + retry CTA | 同一 input 再送 | role=alert |
| AB-07 | NETWORK | fetch reject | dialog 内 alert + retry CTA + idempotency なし注記 | 同一 input 再送 | role=alert |
| AB-08 | RULES_CONSENT_UNCONSENTED | 静的 | panel 自体を render しない（client 側） | — | — |

## 2. 系統別 詳細

### AB-01 二重申請 409

API:
```json
{ "code": "DUPLICATE_PENDING_REQUEST", "message": "既に同種の申請が処理待ちです" }
```
status=409。

UI:
1. `<RequestErrorMessage code="DUPLICATE_PENDING_REQUEST" />` を dialog 内に投入（`role="alert"`）。
2. submit ボタンを永続 disabled、文言を「申請受付済み」に切替。
3. dialog close 後 profile 画面の `<RequestPendingBanner type=... />` を表示し続ける。
4. 該当 type の trigger button（公開停止 or 退会）を `disabled` + `aria-disabled="true"`。

再操作ブロック:
- 同一 session: client local state（`pendingType`）で trigger を抑止。
- reload 後: サーバ側 409 で再ブロック → AB-01 同経路で UI 表示。

### AB-02 422 INVALID_REQUEST

発生条件:
- client zod (`reason.length <= 500`) を bypass / 将来の field 互換破壊。

UI:
1. `INVALID_REQUEST` を `<RequestErrorMessage>` で表示。
2. dialog は閉じず、入力内容を保持。
3. textarea に `aria-invalid="true"` + `aria-describedby` でエラーと関連付け。

### AB-03 401 UNAUTHORIZED

挙動:
- helper が `AuthRequiredError` を再 throw → component の `try/catch` が `router.replace("/login?redirect=/profile")`。
- dialog は閉じる、banner は出さない。

### AB-04 / AB-08 403 / consent unconsented

- profile Server Component で `statusSummary.rulesConsent !== "consented"` の場合、`<RequestActionPanel>` 内で early return + 案内文のみ表示（AB-08）。
- helper が `RULES_CONSENT_REQUIRED` を返した場合は profile 上部の静的バナー「会則同意の更新が必要です」へ誘導（AB-04）。

### AB-05 429 RATE_LIMITED

- `Retry-After` header があれば「あと NN 秒で再申請可能です」を表示、無ければ汎用文言。
- 自動 retry は行わない（ユーザー操作のみ）。

### AB-06 5xx SERVER

- retry ボタン表示。retry は同一 input で helper を再呼び出し。
- 連続 5xx 時の自動 cool-down は本仕様では未実装（Phase 12 follow-up 候補）。

### AB-07 NETWORK

- `TypeError` / `fetch failed` を helper が `NETWORK` に変換。
- 文言: 「通信に失敗しました。再試行してください。重複申請が記録された場合は、再度開いた際に「受付済み」と表示されます。」
- retry は同一 input をもう一度送るのみ。サーバ側 UNIQUE 違反時は AB-01 にフォールバック。

## 3. 退会 不可逆動線（AB-D1..D6）

| ID | ステップ | UI |
| --- | --- | --- |
| AB-D1 | 退会 trigger 押下 | dialog open、heading「退会の申請」 |
| AB-D2 | 不可逆性提示 | 強調文「退会申請は管理者承認後に取り消せません」+ `aria-describedby` で submit に関連付け |
| AB-D3 | チェック未入力 | submit `disabled` + `aria-disabled="true"` |
| AB-D4 | チェック後 submit | `useTransition` で pending、`aria-busy="true"` + spinner |
| AB-D5 | 成功 (202) | dialog close → `<RequestPendingBanner type="delete_request" />` 表示 |
| AB-D6 | esc / overlay click | `onClose` 呼出、checkbox/reason reset |

## 4. screen reader / a11y 通知

| 通知 | 実装 | 発火タイミング |
| --- | --- | --- |
| `role="alert"` | `<RequestErrorMessage>` | error 発生時（DOM 投入で即時読み上げ） |
| `aria-live="polite"` | `<RequestPendingBanner>` | 受付確認 |
| `aria-modal="true"` | dialog root | open 時 |
| focus restore | trigger button へ focus 戻し | dialog close 時 |
| `aria-busy` | submit button | submitting 中 |
| `aria-describedby` | 退会 submit ↔ 不可逆性文言 | 常時（dialog open 中） |

## 5. 文言テーブル（最終版）

| code | 表示文言 | 配置 |
| --- | --- | --- |
| ACCEPTED (202) | 「申請を受け付けました。管理者の対応をお待ちください。」 | banner（aria-live=polite） |
| DUPLICATE_PENDING_REQUEST | 「既に申請を受け付けています。管理者の対応をお待ちください。」 | banner / dialog alert |
| INVALID_REQUEST | 「入力内容を確認してください（理由は 500 文字以内）。」 | dialog inline alert |
| RULES_CONSENT_REQUIRED | 「会則同意の更新が必要です。プロフィールから再同意してください。」 | profile 上部静的バナー |
| RATE_LIMITED | 「短時間に申請が集中しています。しばらく経ってから再度お試しください。」 | dialog alert |
| UNAUTHORIZED | （表示せず /login にリダイレクト） | — |
| NETWORK | 「通信に失敗しました。再試行してください。重複申請が記録された場合は、再度開いた際に「受付済み」と表示されます。」 | dialog alert |
| SERVER | 「サーバーで問題が発生しました。時間を置いて再度お試しください。」 | dialog alert |

## 6. idempotency 保証なしの明示

- helper は idempotency-key を送らない（API 側未対応）。
- network failure → retry → 二重申請の race は AB-01 で吸収される設計。
- 上記注記を helper docstring（Phase 5 ステップ2）と AB-07 文言に必ず含める。

## 7. AB ↔ TC ↔ evidence マトリクス

| AB ID | Phase 4 TC | Phase 11 evidence |
| --- | --- | --- |
| AB-01 | TC-U-14 / TC-E-04 | `outputs/phase-11/visibility-409.png` |
| AB-02 | TC-U-15 / TC-E-05 | `outputs/phase-11/visibility-422.png` |
| AB-03 | TC-U-16 / TC-E-08 | trace（リダイレクトのため SS なし） |
| AB-04 | TC-E-07 | `outputs/phase-11/no-consent-403.png`（profile 上部バナー） |
| AB-05 | TC-U-17 | `outputs/phase-11/rate-limited.png`（mock） |
| AB-06 | TC-U-18 | `outputs/phase-11/server-error.png`（mock） |
| AB-07 | TC-U-19 / TC-E-06 | `outputs/phase-11/network-error.png` |
| AB-08 | TC-U-04 / TC-E-07 | `outputs/phase-11/no-consent-panel-hidden.png` |
| AB-D1..D6 | TC-U-09 / TC-U-10 / TC-E-03 | `outputs/phase-11/delete-confirm.png` / `delete-pending.png` |

## 8. 検証コマンド（Phase 9 で再実行）

```bash
mise exec -- pnpm --filter @ubm/web test --run -- src/lib/api/__tests__/me-requests.test.ts
mise exec -- pnpm --filter @ubm/web test --run -- app/profile/_components/__tests__/
mise exec -- pnpm --filter @ubm/web exec playwright test e2e/profile/
```

PASS 条件: TC-U-11..19、TC-E-04..08、TC-A-01..06 全 PASS、axe violations 0。

## 9. 未実装/未実測の扱い

本 Phase は異常系仕様策定のみ。実 PASS は Phase 9 / Phase 11 評価まで「PASS」扱いしない。

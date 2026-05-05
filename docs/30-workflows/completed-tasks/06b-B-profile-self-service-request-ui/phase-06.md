# Phase 6: 異常系検証 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 6 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

申請 UI の失敗系（API 4xx/5xx・ネットワーク切断・権限不足・rate limit・rules consent 欠落）に対する UI 挙動を一意に定義し、Phase 4 のテストケース ID（TC-U-XX / TC-E-XX / TC-A-XX）と相互参照可能な異常系シナリオ集を確定する。

## 実行タスク

1. 異常系を 8 系統（409 / 422 / 401 / 403 / 429 / 5xx / network failure / rules consent unconsented）に分類し、API レスポンス例・UI 表示・retry 動線・a11y 通知をすべて定義する。完了条件: 各系統に AB-xx の ID と TC 対応が紐付く。
2. 不可逆操作（退会）の確認動線が、誤申請を構造的に防げているかを再確認する。完了条件: 二段確認の各ステップが AB-xx として記録される。
3. screen reader 通知（`role=alert` / `aria-live`）の発火タイミングを系統ごとに定義する。完了条件: 全異常系で読み上げ単位が確定する。
4. idempotency 保証なし（network failure 時の再 submit が DUPLICATE_PENDING_REQUEST に化ける可能性）に対する UI 文言を確定する。完了条件: ユーザーへの注意喚起が文言テーブルに含まれる。
5. Phase 4 の TC-* と Phase 11 の evidence path に 1:1 対応する形で AB-* を採番する。完了条件: 異常系 ID が他 Phase からそのまま参照可能。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 成果物 | `outputs/phase-01/main.md` |
| Phase 2 設計（error mapping 表） | `outputs/phase-02/main.md` |
| Phase 4 テスト戦略 | `outputs/phase-04/main.md` |
| Phase 5 実装ランブック | `outputs/phase-05/main.md` |
| API ルータ | `apps/api/src/routes/me/index.ts` |
| API zod schemas | `apps/api/src/routes/me/schemas.ts` |
| 既存 fetch helper | `apps/web/src/lib/fetch/authed.ts` |
| UI/UX 仕様 | `docs/00-getting-started-manual/specs/09-ui-ux.md` |

## 実行手順

### ステップ1: 異常系分類

| AB ID | 系統 | HTTP | 発生原因 | 対応 TC | 想定文言 / UI |
| --- | --- | --- | --- | --- | --- |
| AB-01 | DUPLICATE_PENDING_REQUEST | 409 | 既に同種 pending 申請が存在 | TC-U-14 / TC-E-04 | 「既に申請を受け付けています。管理者の対応をお待ちください。」+ banner + 該当ボタン disabled |
| AB-02 | INVALID_REQUEST (reason 過長) | 422 | client zod を bypass された body / 長さ違反 | TC-U-15 / TC-E-05 | dialog 内 inline error「入力内容を確認してください（理由は 500 文字以内）」 |
| AB-03 | UNAUTHORIZED | 401 | session 失効（cookie expire） | TC-U-16 / TC-E-08 | 表示せず `router.replace("/login?redirect=/profile")` |
| AB-04 | RULES_CONSENT_REQUIRED | 403 | middleware `requireRulesConsent` 不通過 | 静的（panel 非表示） / TC-E-07 | panel 非表示 + 「会則に同意すると申請できます」案内 |
| AB-05 | RATE_LIMITED | 429 | `rateLimitSelfRequest` 超過 | TC-U-17 | dialog 内 alert「短時間に申請が集中しています。しばらく経ってから再度お試しください。」+ retry ボタンは表示しない（cool-down 表示のみ） |
| AB-06 | SERVER | 5xx | API 障害 | TC-U-18 | dialog 内 alert「サーバーで問題が発生しました。」+ retry ボタン |
| AB-07 | NETWORK | fetch reject | オフライン / TLS / DNS 失敗 | TC-U-19 / TC-E-06 | dialog 内 alert「通信に失敗しました。再試行してください。」+ retry ボタン + 「重複申請が記録される可能性があります」注記 |
| AB-08 | RULES_CONSENT_UNCONSENTED（panel 非表示） | — | profile レスポンスの `rulesConsent !== "consented"` | TC-U-04 / TC-E-07 | panel 自体を render しない |

### ステップ2: 各系統の詳細仕様

#### AB-01 二重申請 409

- API レスポンス例: `{ "code": "DUPLICATE_PENDING_REQUEST", "message": "..." }` / status=409
- UI 動作:
  1. dialog 内に `<RequestErrorMessage code="DUPLICATE_PENDING_REQUEST" />` を表示（`role="alert"`）。
  2. submit ボタンを永続 disabled にし、文言を「申請受付済み」へ切替。
  3. dialog close 後、profile 画面の `<RequestPendingBanner type=... />` を表示し続ける。
  4. 該当 type の trigger button（公開停止 or 退会）を `disabled` + `aria-disabled="true"`。
- 再操作ブロック: 同一 session 中は banner 表示で trigger を抑止。reload 後はサーバ側 409 で再ブロック。

#### AB-02 422 validation

- 発生条件: client zod (`reason.length <= 500`) を回避された場合、もしくは将来的な field 拡張時の互換破壊。
- UI 動作:
  1. `INVALID_REQUEST` を `<RequestErrorMessage>` で表示。
  2. dialog は閉じず、入力内容を保持。
  3. textarea の `aria-invalid="true"` + `aria-describedby` でエラーと関連付ける。

#### AB-03 401 unauthenticated

- helper が `AuthRequiredError` を再 throw → component 側の `try/catch` で受け、`router.replace("/login?redirect=/profile")`。
- dialog は閉じる。banner は出さない（session が無いため）。

#### AB-04 / AB-08 403 / consent unconsented

- profile Server Component 段階で `statusSummary.rulesConsent !== "consented"` の場合、`<RequestActionPanel>` に props として渡し panel 内で early return。
- 万一 client 側を bypass されても API 側 403 で防がれるため、helper が `RULES_CONSENT_REQUIRED` を返した場合は静的バナー（profile 上部）「会則同意の更新が必要です」を表示し、申請 UI は閉じる。

#### AB-05 429 rate limit

- cool-down 表示: `Retry-After` header があれば「あと NN 秒で再申請可能です」を表示（無ければ汎用文言）。
- 自動 retry は行わない（ユーザー操作のみ）。

#### AB-06 5xx server

- retry ボタン表示。retry は同一 input でもう一度 helper を呼ぶだけ（idempotency token は持たない）。
- 連続 5xx 時はユーザーに「時間を置いてください」と案内（3 連続で disabled、本仕様では未実装：Phase 12 follow-up 候補）。

#### AB-07 network failure

- fetch reject（`TypeError: NetworkError` 等）を helper が `NETWORK` に変換。
- UI に「通信に失敗しました。再試行してください。」+ retry CTA。
- **重要**: idempotency 保証がないため「重複申請が記録された場合は、再表示時に申請受付済みと表示されます」と注記する（misclick 不安の払拭）。
- retry は同一 input をもう一度送るのみ。サーバ側で UNIQUE 違反の場合は AB-01 にフォールバックする（自然な防衛）。

### ステップ3: 不可逆操作（退会）の確認動線

| AB ID | ステップ | UI |
| --- | --- | --- |
| AB-D1 | 退会 trigger 押下 | dialog open、heading「退会の申請」 |
| AB-D2 | 不可逆性文言の提示 | 強調文「退会申請は管理者承認後に取り消せません」+ `aria-describedby` で submit と関連付け |
| AB-D3 | チェックボックス未入力時 | submit `disabled` + `aria-disabled="true"` |
| AB-D4 | チェック後 submit | `useTransition` で pending、ボタンは spinner 化 |
| AB-D5 | 成功 (202) | dialog close、`<RequestPendingBanner type="delete_request" />` 表示 |
| AB-D6 | esc / overlay click | `onClose` を呼び、checkbox / reason を reset |

### ステップ4: screen reader / a11y 通知

| 通知単位 | 実装 | 発火タイミング |
| --- | --- | --- |
| `role="alert"`（即時読み上げ） | `<RequestErrorMessage>` | error 発生時に DOM 投入 |
| `aria-live="polite"` | `<RequestPendingBanner>` | 202 受付後の状態変化通知 |
| `aria-modal="true"` | dialog root | open 時 |
| focus restore | trigger button への focus 戻し | dialog close 時 |
| `aria-busy` | submit button | submitting 中 |

### ステップ5: 文言テーブル（最終版）

| code | 表示文言 | 配置 |
| --- | --- | --- |
| ACCEPTED (202) | 「申請を受け付けました。管理者の対応をお待ちください。」 | banner（`aria-live=polite`） |
| DUPLICATE_PENDING_REQUEST | 「既に申請を受け付けています。管理者の対応をお待ちください。」 | banner / dialog alert |
| INVALID_REQUEST | 「入力内容を確認してください（理由は 500 文字以内）。」 | dialog inline alert |
| RULES_CONSENT_REQUIRED | 「会則同意の更新が必要です。プロフィールから再同意してください。」 | profile 上部静的バナー |
| RATE_LIMITED | 「短時間に申請が集中しています。しばらく経ってから再度お試しください。」 | dialog alert |
| UNAUTHORIZED | （表示せず /login にリダイレクト） | — |
| NETWORK | 「通信に失敗しました。再試行してください。重複申請が記録された場合は、再度開いた際に「受付済み」と表示されます。」 | dialog alert |
| SERVER | 「サーバーで問題が発生しました。時間を置いて再度お試しください。」 | dialog alert |

### ステップ6: idempotency 保証なしの明示

- helper は idempotency-key を送らない（API 側未対応）。
- network failure → retry → 二重申請の race は AB-01 で吸収される設計。
- 上記注記を Phase 5 ステップ2 の helper docstring と AB-07 文言に明記する。

### ステップ7: AB ↔ TC ↔ evidence 相互参照

| AB ID | TC ID | evidence (Phase 11) |
| --- | --- | --- |
| AB-01 | TC-U-14 / TC-E-04 | `outputs/phase-11/visibility-409.png` |
| AB-02 | TC-U-15 / TC-E-05 | `outputs/phase-11/visibility-422.png` |
| AB-03 | TC-U-16 / TC-E-08 | trace のみ（リダイレクトのため SS なし） |
| AB-04 / AB-08 | TC-U-04 / TC-E-07 | `outputs/phase-11/no-consent.png` |
| AB-05 | TC-U-17 | `outputs/phase-11/rate-limited.png`（mock のみ） |
| AB-06 | TC-U-18 | `outputs/phase-11/server-error.png`（mock のみ） |
| AB-07 | TC-U-19 / TC-E-06 | `outputs/phase-11/network-error.png` |
| AB-D1..D6 | TC-U-09 / TC-U-10 / TC-E-03 | `outputs/phase-11/delete-confirm.png` / `delete-pending.png` |

## 統合テスト連携

| 判定 | Phase | 内容 |
| --- | --- | --- |
| Unit 異常系 | Phase 9 | TC-U-11..19 全 PASS |
| E2E 異常系 | Phase 11 | TC-E-04..08 で AB-* が visual に再現される |
| a11y | Phase 9 | axe violations 0、TC-A-04 が role=alert を確認 |

## 多角的チェック観点（AIが判断）

- AB-01..AB-08 が Phase 2 error mapping 表と矛盾していないか
- 不可逆操作の AB-D1..D6 が二段確認を構造で守っているか
- network failure 時の idempotency なしが UI 文言で明示されているか
- screen reader 通知が role/aria-live で網羅されているか
- AB-* と TC-* と evidence の 3 軸が相互参照可能か
- 未実装/未実測を PASS と扱っていないか
- 楽観的更新を導入していないか（不採用が正解）

## サブタスク管理

- [ ] AB-01..AB-08 を採番
- [ ] AB-D1..D6（退会動線）を採番
- [ ] 文言テーブル最終版を確定
- [ ] AB ↔ TC ↔ evidence 相互参照表を作成
- [ ] idempotency なしの注記を helper docstring 計画に反映
- [ ] `outputs/phase-06/main.md` を作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 異常系シナリオ集 | `outputs/phase-06/main.md` | AB-* / 文言 / a11y / 相互参照 |

## 完了条件

- [ ] 8 系統 + 退会動線の異常系が AB-* で採番されている
- [ ] 各 AB-* に HTTP / UI / a11y / retry 動線が定義されている
- [ ] 文言テーブルが Phase 2 error mapping と一致している
- [ ] AB-* と Phase 4 TC-*、Phase 11 evidence path が相互参照可能
- [ ] idempotency 保証なしの旨が UI 文言に含まれている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク100%実行確認【必須】

- [ ] 必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく未反映 UI の異常系仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、AB-* 異常系一覧、AB ↔ TC ↔ evidence マトリクス、文言テーブル、idempotency なし注記を渡す。

# Phase 4: テスト戦略 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 4 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜3 で確定した AC・設計・NO-GO 条件に対し、ユニット / 結合 / E2E / a11y / visual の各層を貫くテスト戦略を確定する。
各テストケースに ID を採番し、Phase 6 異常系・Phase 9 品質保証・Phase 11 実測 evidence と双方向参照可能な状態に揃える。

## 実行タスク

1. 5 component（`RequestActionPanel` / `VisibilityRequestDialog` / `DeleteRequestDialog` / `RequestPendingBanner` / `RequestErrorMessage`）と 2 client helper（`requestVisibilityChange` / `requestDelete`）に対し、テストピラミッドを定義する。完了条件: 各責務に Unit / Integration / E2E のいずれが主担当かが表で確定する。
2. テストケース表（TC-U-XX / TC-I-XX / TC-E-XX / TC-A-XX）を採番し、AC-1..AC-7 と Phase 6 異常系シナリオに 1:1 対応させる。完了条件: Phase 7 AC マトリクスにそのまま転記できる粒度。
3. mock 戦略（fetch mock / MSW / Playwright route interception）を選定し、API 契約と実装の drift を防ぐ contract test を含める。完了条件: 202/409/422/401/429/5xx/network の 7 系統が単一の mock 表で網羅される。
4. coverage 目標（Line 80% / Branch 60%）と未到達時の判定基準（Phase 9 で評価）を明記する。完了条件: 閾値と免除条件が記録される。
5. a11y / kbd 操作 / focus trap / ARIA live region の自動検証手段を定義する。完了条件: axe + RTL kbd の組合せが全 dialog に適用される。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 成果物 | `outputs/phase-01/main.md` |
| Phase 2 成果物 | `outputs/phase-02/main.md` |
| Phase 3 成果物 | `outputs/phase-03/main.md` |
| 既存 fetch helper | `apps/web/src/lib/fetch/authed.ts`（`fetchAuthed` / `AuthRequiredError` / `FetchAuthedError`） |
| /me schemas（API 正本） | `apps/api/src/routes/me/schemas.ts` |
| /me ルータ | `apps/api/src/routes/me/index.ts` |
| profile page | `apps/web/app/profile/page.tsx` |
| 既存 unit test 配置 | `apps/web/src/lib/__tests__/`、`apps/web/app/**/__tests__/`（命名は kebab-case `*.test.ts(x)`） |
| Playwright 設定 | `apps/web/playwright.config.ts`（既存）と `apps/web/playwright/tests/`（新規 spec 投入先） |
| testing patterns | `.claude/skills/task-specification-creator/references/patterns-testing.md`（ARIA 優先 / E2E 安定性 3 層 / queryFn DI 等） |

## 実行手順

### ステップ1: テストピラミッド定義

| 層 | ツール | 対象 | カバー責務 |
| --- | --- | --- | --- |
| Unit (vitest + RTL) | `vitest`, `@testing-library/react`, `@testing-library/user-event`, `axe-core` | dialog 単体、panel 単体、helper 単体 | フォーム state / 送信ガード / 文言 / a11y 属性 / kbd 操作 |
| Contract (vitest + zod) | `expectTypeOf` + shared zod | helper の input/output 型と `apps/api/src/routes/me/schemas.ts` の zod スキーマの一致 | 型 drift 検出 |
| Integration (vitest, fetch mock) | `vi.spyOn(globalThis, "fetch")` または `msw/node` | helper × `fetchAuthed` × `AuthRequiredError`/`FetchAuthedError` | HTTP code → result code 変換、cookie 透過 |
| E2E (Playwright) | `@playwright/test` | profile 画面の正常系 / 二重申請 / 退会二段確認 | ブラウザ動作・navigation・visual diff |
| a11y (axe in RTL + Playwright axe) | `vitest-axe` / `@axe-core/playwright` | dialog open/close、error表示時 | WCAG 2.1 AA 違反 0 |
| Visual (Playwright trace + screenshot) | Playwright | open dialog / pending banner / 409 banner | Phase 11 evidence |

レイヤー方針:
- helper の **正常系** は Integration で担保し、Unit ではエラーマッピング分岐のみを fetch mock で検証する。
- dialog の **送信成功時の遷移** は E2E で確認、Unit では「submit が helper を 1 回だけ呼ぶ」点に絞る。
- 楽観的更新は不採用のため、E2E では 202 後に `RequestPendingBanner` が出現することを assert する（reload 不要）。

### ステップ2: ユニットテストケース表（TC-U-XX）

ファイル配置: `apps/web/app/profile/_components/__tests__/*.test.tsx`、`apps/web/src/lib/api/__tests__/me-requests.test.ts`。

| TC ID | テスト名（it 文字列） | 対象 | 検証 | 紐付き AC |
| --- | --- | --- | --- | --- |
| TC-U-01 | renders 公開停止 button when publishState=public | `RequestActionPanel` | publish button 表示 / hidden button 非表示 | AC-1 |
| TC-U-02 | renders 再公開 button when publishState=hidden | `RequestActionPanel` | hide button 非表示 / republish button 表示 | AC-2 |
| TC-U-03 | renders 退会 button always when consent=consented | `RequestActionPanel` | delete button 表示 | AC-3 |
| TC-U-04 | hides panel when rulesConsent !== consented | `RequestActionPanel` | panel 非表示・案内文表示 | S6 |
| TC-U-05 | opens visibility dialog with focus on heading | `RequestActionPanel` | `role=dialog` 出現 + heading focus | AC-7 |
| TC-U-06 | esc / overlay click closes dialog | dialogs 共通 | `onClose` 1 回呼ばれる | AC-7 |
| TC-U-07 | reason 入力 500 文字超で submit 不可 | `VisibilityRequestDialog` | client zod 検証 | security |
| TC-U-08 | submit 中は二重クリック不可（disabled + spinner） | dialogs 共通 | helper 呼び出し 1 回 | AC-4 派生 |
| TC-U-09 | 退会 dialog はチェック未入力で submit 不可 | `DeleteRequestDialog` | submit button disabled | AC-3 |
| TC-U-10 | 退会 dialog の不可逆性文言 | `DeleteRequestDialog` | 規定文言の存在 | AC-3 |
| TC-U-11 | error code → 文言マッピング全 7 種 | `RequestErrorMessage` | code 別表示 / `role=alert` | AC-7 / Phase 6 |
| TC-U-12 | banner は type 別に表示文言を切替 | `RequestPendingBanner` | visibility / delete 文言 | AC-1 / AC-3 |
| TC-U-13 | helper: 202 → `{ ok: true, accepted }` | `requestVisibilityChange` | 正常変換 | AC-1 |
| TC-U-14 | helper: 409 → `{ ok: false, code: DUPLICATE_PENDING_REQUEST }` | both helpers | mapping | AC-4 |
| TC-U-15 | helper: 422 → `INVALID_REQUEST` | both | mapping | Phase 6 |
| TC-U-16 | helper: 401 → throw `AuthRequiredError`（再 throw） | both | 例外伝播 | Phase 6 401 |
| TC-U-17 | helper: 429 → `RATE_LIMITED` | both | mapping | Phase 6 |
| TC-U-18 | helper: 5xx → `SERVER` | both | mapping | Phase 6 |
| TC-U-19 | helper: network failure → `NETWORK` | both | fetch reject mock | Phase 6 |
| TC-U-20 | helper: URL は `/me/visibility-request` / `/me/delete-request` 固定 | both | path に `:memberId` 含めない | 不変条件 #11 |
| TC-U-21 | axe: dialog open 時 violations 0 | `vitest-axe` | a11y | AC-7 |

### ステップ3: 結合テスト（TC-I-XX, contract）

| TC ID | テスト名 | 対象 | 検証 |
| --- | --- | --- | --- |
| TC-I-01 | helper input 型 ↔ shared zod parse 整合 | `MeVisibilityRequestBodyZ` / `MeDeleteRequestBodyZ` | `expectTypeOf<VisibilityRequestInput>().toEqualTypeOf<z.infer<typeof MeVisibilityRequestBodyZ>>()` |
| TC-I-02 | helper output 型 ↔ shared response zod | `MeQueueAcceptedZ` 相当 | 型一致 |
| TC-I-03 | `fetchAuthed` 経由で cookie が透過する | `requestVisibilityChange` | `credentials: "include"` 等を spy で検証 |
| TC-I-04 | API path が `/me/visibility-request`、method=POST、Content-Type=application/json | both | request 検証 |
| TC-I-05 | 退会 helper の空 body 許容 | `requestDelete` | `{}` を送信しても 202 |

### ステップ4: E2E ケース表（TC-E-XX, Playwright）

ファイル配置: `apps/web/playwright/tests/profile-visibility-request.spec.ts`、`delete-request.spec.ts`。
test fixture: `apps/web/playwright/fixtures/auth.ts`（06b-A 完了後に利用可能）と Playwright `route.fulfill` で API レスポンスを stubbing。

| TC ID | シナリオ | 期待結果 | evidence |
| --- | --- | --- | --- |
| TC-E-01 | S1: public → 公開停止申請 | 202 mock → dialog close → pending banner 表示 | screenshot `phase-11/visibility-pending.png` |
| TC-E-02 | S2: hidden → 再公開申請 | 202 mock → banner 表示 | `phase-11/republish-pending.png` |
| TC-E-03 | S3: 退会申請 二段確認 | チェック未入力で disabled、checked 後 submit → 202 → banner | `phase-11/delete-pending.png` |
| TC-E-04 | S4: 二重申請 → 409 | 409 mock → banner + button disabled | `phase-11/visibility-409.png` |
| TC-E-05 | S5: 422 reason 過長 | 422 mock → dialog 内 inline error | `phase-11/visibility-422.png` |
| TC-E-06 | S5: network failure | `route.abort()` → retry CTA + `role=alert` | `phase-11/network-error.png` |
| TC-E-07 | S6: rulesConsent unconsented | panel 非表示 + 案内文 | `phase-11/no-consent.png` |
| TC-E-08 | 401 → /login redirect | session expired mock → URL が `/login?redirect=/profile` | trace |
| TC-E-09 | kbd 操作のみで visibility 申請完走 | tab/enter のみで submit 成功 | a11y trace |

### ステップ5: a11y テスト（TC-A-XX）

| TC ID | 対象 | 手段 |
| --- | --- | --- |
| TC-A-01 | dialog open 時の axe scan | `vitest-axe` + `@axe-core/playwright` |
| TC-A-02 | focus trap（tab 一巡が dialog 内に閉じる） | `userEvent.tab()` で循環確認 |
| TC-A-03 | esc で close、close 後に trigger button へ focus 戻る | `userEvent.keyboard("{Escape}")` |
| TC-A-04 | error 表示が `role=alert` で読み上げ可能 | RTL `getByRole("alert")` |
| TC-A-05 | banner が `role=status` または `aria-live=polite` を持つ | RTL |
| TC-A-06 | 退会の不可逆性が `aria-describedby` で submit と関連付く | RTL |

### ステップ6: mock 戦略

| 層 | 採用 | 理由 |
| --- | --- | --- |
| Unit / helper | `vi.spyOn(globalThis, "fetch")` をテストごとに mock | 軽量・並列実行で副作用なし。`fetchAuthed` の cookie 付与は別途 contract で検証 |
| Component | helper を `vi.mock("../../src/lib/api/me-requests")` で差し替え | dialog のロジックに集中 |
| E2E | Playwright `page.route("**/api/me/*-request", route => route.fulfill(...))` | 実 API を呼ばず CI 安定。ステージングへの実弾は Phase 11 で別途 |
| contract | shared zod を直接 import し `expectTypeOf` で型一致を確認 | API/UI の drift を CI gate で検出 |

API レスポンス fixture（mock）の正本はすべて `apps/api/src/routes/me/schemas.ts` から派生させ、ハードコード文字列を avoid する（Phase 9 で grep）。

### ステップ7: coverage 目標

| 指標 | 目標 | 評価 phase | 免除条件 |
| --- | --- | --- | --- |
| Line | 80%+ | Phase 9 | helper の `fetchAuthed` 内部分岐は除外（既存 helper 側で計測済み） |
| Branch | 60%+ | Phase 9 | `if (process.env...)` のような環境分岐のみ |
| Function | 80%+ | Phase 9 | type-only export は除外 |
| E2E AC 正常系 | 100% | Phase 11 | 0 件免除 |
| E2E 異常系 | 80%+ | Phase 11 | network failure は flaky が許容範囲（再試行 1 回） |

### ステップ8: 既存 utility 重複検出（Phase 4 必須事前確認）

```bash
rg -n "export (async )?function (request|requestVisibility|requestDelete)" apps/web/src/lib/
rg -n "VisibilityRequest|DeleteRequest" apps/web/src/lib/api/
rg -n "RequestActionPanel|RequestPendingBanner|RequestErrorMessage" apps/web/app/
```

すべて 0 hit を期待する（既実装なし）。1 件以上 hit した場合は Phase 2 設計に差し戻す。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| Unit 全件 PASS | 100% |
| Integration（contract） | 100% |
| E2E 正常系 | 100%（TC-E-01..03） |
| E2E 異常系 | 80%+（TC-E-04..09） |
| a11y violations | 0（TC-A-01..06） |
| Line / Branch / Function | 80% / 60% / 80% |

- 上流: 04b /me self-service API（実装済み）、06b profile page（実装済み）、06b-A Auth.js session resolver（先行必須）。
- 下流: 06b-C profile logged-in visual evidence、08b profile E2E full execution。

## 多角的チェック観点（AIが判断）

- AC-1..AC-7 と TC-* の相互参照に欠落がないか
- 不変条件 #4（本文編集禁止）の grep lint がテスト suite に含まれているか
- 不変条件 #5（D1 直接禁止）の grep が CI で発火するか
- 不変条件 #11（self-service 境界）が helper TC-U-20 で固定されているか
- 楽観的更新を導入する誘惑に乗っていないか（不採用が正解）
- 未実装/未実測を PASS と扱っていないか
- E2E が実 API ではなく route stubbing で分離できているか（Phase 11 の実弾は別レーン）

## サブタスク管理

- [ ] テストピラミッド表を確定
- [ ] TC-U-XX / TC-I-XX / TC-E-XX / TC-A-XX 採番完了
- [ ] mock 戦略表を確定
- [ ] coverage 目標と免除条件を確定
- [ ] AC-1..AC-7 と TC マトリクス相互参照表を作成
- [ ] `outputs/phase-04/main.md` を作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| テスト戦略書 | `outputs/phase-04/main.md` | ピラミッド / TC 表 / mock / coverage / a11y |

## 完了条件

- [ ] Unit / Integration / E2E / a11y の各層に責務が割り当てられている
- [ ] TC-U-01..21 / TC-I-01..05 / TC-E-01..09 / TC-A-01..06 が AC と相互参照されている
- [ ] mock 戦略が 7 系統（202/409/422/401/429/5xx/network）を網羅している
- [ ] coverage 目標と免除条件が明記されている
- [ ] 不変条件 #4 / #5 / #11 の静的検出コマンドが test suite に含まれている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク100%実行確認【必須】

- [ ] 必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく未反映 UI のテスト戦略になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、TC-* テストケース ID 一覧、mock 戦略、coverage 目標、ファイル配置を渡す。

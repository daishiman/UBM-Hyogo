# Phase 4: テスト戦略 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 5 で着手する Vitest テストファイル 13 件分のケース表 / coverage 計測方法 / AC 達成根拠を確定する仕様書であり、後続フェーズで実テストコードを追加するため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 4 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Phase 2-3 で確定した 13 モジュールのテスト設計に対し、CONST_005 必須項目（it() タイトル / 期待値 / カバー branch・function 名 / 実行コマンド / DoD）を埋める test 戦略フェーズ。 |

## 目的

13 対象モジュールについて、Phase 2 で設計したケースを **テストケース定義表（ファイルパス / it() タイトル / 期待値 / カバー branch・function 名）** に固定し、Stmts/Lines/Funcs ≥85% / Branches ≥80% を達成するための coverage 計測方法・AC 対応・実行コマンドを Phase 5 ランブックの直接入力として確定する。

## 実行タスク

1. 13 対象に対する `it()` レベルケース表を確定する。完了条件: 各 case が「ファイル / it() タイトル / 期待値 / カバー branch or function」を持つ。
2. coverage 計測コマンド・閾値判定方法を確定する。完了条件: 実行コマンドと AC 対応が明記される。
3. AC（Stmts/Lines/Funcs ≥85% / Branches ≥80%）への各 case 寄与を分類する。完了条件: 下記 AC マッピング表が成立する。
4. test pyramid 上の位置づけ（Unit / Contract / Integration）と禁止事項（D1 import / coverage exclude 改変）を確定する。完了条件: 不変条件 #5/#6 を侵さない方針が明文化される。

## 参照資料

- 起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`（apps/web lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/claude-design-prototype/`（UI primitives 視覚仕様）
- `apps/web/vitest.config.ts`（coverage provider=v8 / environment=jsdom / include パス）
- 既存テスト: `apps/web/src/components/ui/__tests__/primitives.test.tsx` / `apps/web/src/lib/admin/__tests__/api.test.ts` / `apps/web/src/lib/url/login-state.test.ts`

## テストケース定義表

> 全 case は `apps/web/src/**/__tests__/*.test.{ts,tsx}` 配下に配置する。Vitest + React Testing Library + `@testing-library/user-event` を採用。`environment: jsdom`、`coverage.provider: v8`。

### admin lib (contract test)

| # | テストファイル | it() タイトル | 期待値 | カバー branch / function |
| --- | --- | --- | --- | --- |
| C1 | `apps/web/src/lib/admin/__tests__/server-fetch.test.ts` | `builds GET request with x-internal-auth and cookie headers` | `fetch` が `accept: application/json` / `x-internal-auth: <secret>` / `cookie: session=abc` 付きで 1 回呼ばれる | `fetchAdmin` happy path |
| C2 | 同上 | `serializes JSON body and sets content-type on POST` | body 引数が `JSON.stringify` され `content-type: application/json` が付く | body 分岐 (truthy) |
| C3 | 同上 | `strips trailing slash from INTERNAL_API_BASE_URL` | URL に `//` が含まれない | base URL normalize 分岐 |
| C4 | 同上 | `falls back to http://127.0.0.1:8787 when env unset` | URL prefix が fallback と一致 | env 未設定分岐 |
| C5 | 同上 | `omits cookie header when cookies().toString() is empty` | request init.headers に `cookie` キーが存在しない | cookie 空文字分岐 |
| C6 | 同上 | `throws Error("admin api ... failed: 500") on res.ok=false` | rejects with `Error` matching `/failed: 500/` | error mapping 分岐 |
| C7 | 同上 | `resolves deserialized JSON when res.ok=true` | resolved value が mock JSON と deepEqual | resolve path |
| A1 | `apps/web/src/lib/admin/__tests__/api.test.ts` (拡張) | `patchMemberStatus calls PATCH /api/admin/members/:id/status with body` | URL / method / body / headers が一致 | `patchMemberStatus` |
| A2 | 同上 | `encodes memberId and noteId in note endpoints` | `:` 等が encode された URL になる | URL encode 分岐 |
| A3 | 同上 | `dispatches deleteMember/restoreMember/resolveTagQueue/postSchemaAlias/resolveAdminRequest/createMeeting/addAttendance/removeAttendance with correct path+method` | 各 mutation の URL/method がテーブル駆動で一致 | 8 mutation function |
| A4 | 同上 | `maps res.ok=false JSON {error} into AdminMutationErr.error` | `{ ok:false, status, error: "..." }` | error JSON 分岐 |
| A5 | 同上 | `falls back to "HTTP <status>" when error body is non-JSON` | `error: "HTTP 500"` | non-JSON 分岐 |
| A6 | 同上 | `returns {ok:false,status:0,error} on fetch network throw` | network catch 分岐 | catch path |
| A7 | 同上 | `returns data when content-type=application/json` | data が JSON.parse 結果 | content-type true 分岐 |
| A8 | 同上 | `returns data=null when content-type lacks application/json` | `data` が `null` | content-type false 分岐 |
| T1 | `apps/web/src/lib/admin/__tests__/types.test.ts` | `AdminAuditFilters/AdminAuditListItem/AdminAuditListResponse import smoke` | 値 expression を `satisfies` 経由で評価し `void _` で参照 | types.ts ファイル全体 (import 行 statement) |

### UI primitives

| # | テストファイル | it() タイトル | 期待値 | カバー branch / function |
| --- | --- | --- | --- | --- |
| TO1 | `apps/web/src/components/ui/__tests__/Toast.test.tsx` | `useToast outside ToastProvider throws` | `renderHook(useToast)` が throw | useToast guard 分岐 |
| TO2 | 同上 | `toast(message) renders role=status node` | `getByRole('status')` で文字一致 | `toast` function |
| TO3 | 同上 | `auto-dismiss after 3000ms` | `advanceTimersByTime(3000)` 後に `queryByRole('status')` が null | setTimeout 分岐 |
| TO4 | 同上 | `multiple toasts stack in aria-live=polite region` | region 内 child が 2 件 | reducer add 分岐 |
| MO1 | `apps/web/src/components/ui/__tests__/Modal.test.tsx` | `renders nothing when open=false` | `container.firstChild === null` | open=false 分岐 |
| MO2 | 同上 | `renders dialog with aria-modal and aria-labelledby when open` | `role=dialog` / `aria-modal=true` / `aria-labelledby=modal-title` | open=true 分岐 |
| MO3 | 同上 | `Escape key invokes onClose` | `onClose` が 1 回呼ばれる | keydown Escape 分岐 |
| MO4 | 同上 | `forward Tab traps focus from last to first` | activeElement が first focusable | Tab forward 分岐 |
| MO5 | 同上 | `Shift+Tab traps focus from first to last` | activeElement が last focusable | Tab backward 分岐 |
| MO6 | 同上 | `prevents default Tab when no focusable inside` | `preventDefault` が呼ばれる | focusable 0 分岐 |
| MO7 | 同上 | `restores previousFocus on close` | unmount 後 `document.activeElement === previousButton` | previousFocus 復元分岐 |
| DR1-7 | `apps/web/src/components/ui/__tests__/Drawer.test.tsx` | Modal と同形 7 ケース（`drawer-title` を assert） | 各 expectation は Modal と対応 | Drawer の同等 branch |
| FI1 | `apps/web/src/components/ui/__tests__/Field.test.tsx` | `label htmlFor matches input id` | `label.htmlFor === input.id` | label/id 関連付け |
| FI2 | 同上 | `renders hint paragraph when hint provided` | `getByText(hint)` が存在し id=`${id}-hint` | hint truthy 分岐 |
| FI3 | 同上 | `omits hint paragraph when hint absent` | `queryByText(hint)` が null | hint falsy 分岐 |
| SE1 | `apps/web/src/components/ui/__tests__/Segmented.test.tsx` | `renders radiogroup with radio options` | `role=radiogroup` / 各 option `role=radio` | render path |
| SE2 | 同上 | `marks selected option aria-checked=true` | 選択 1 件のみ `aria-checked=true` | value 一致分岐 |
| SE3 | 同上 | `click invokes onChange with option value` | `onChange("b")` 1 回 | onClick callback |
| SW1 | `apps/web/src/components/ui/__tests__/Switch.test.tsx` | `renders switch role with aria-checked reflecting checked` | `aria-checked` が `checked` 反映 | render path |
| SW2 | 同上 | `click invokes onChange(!checked)` | toggle 値で 1 回呼ばれる | onClick callback |
| SW3 | 同上 | `disabled prevents callback` | disabled 属性付与 + click でも `onChange` 0 回 | disabled 分岐 |
| SR1 | `apps/web/src/components/ui/__tests__/Search.test.tsx` | `reflects value and placeholder` | input.value / input.placeholder 一致 | render path |
| SR2 | 同上 | `typing invokes onChange with new value` | `userEvent.type` 後 callback 受信値一致 | input onChange |
| SR3 | 同上 | `omits clear button when value is empty` | `queryByRole('button',{name:/clear/i})` が null | value 空分岐 |
| SR4 | 同上 | `clear button invokes onChange("")` | callback 引数 `""` | clear button click 分岐 |

### barrel / 型ファイル

| # | テストファイル | it() タイトル | 期待値 | カバー |
| --- | --- | --- | --- | --- |
| IC1 | `apps/web/src/components/ui/__tests__/icons.test.ts` | `IconName list satisfies readonly IconName[]` | `satisfies` 評価 OK + 配列長 > 0 | icons.ts 全 statement |
| IX1 | `apps/web/src/components/ui/__tests__/index.test.ts` | `barrel re-exports primitive components` | 15 export が `function` または `object` | index.ts 全 re-export |

### url helper

| # | テストファイル | it() タイトル | 期待値 | カバー |
| --- | --- | --- | --- | --- |
| LS1 | `apps/web/src/lib/url/login-state.test.ts` (拡張) | `appends error query when opts.error provided` | URL に `error=...` | error 分岐 |
| LS2 | 同上 | `appends gate query when opts.gate provided` | URL に `gate=...` | gate 分岐 |
| LS3 | 同上 | `is no-op when window undefined and historyImpl absent` | history 関数が呼ばれず例外も出ない | SSR 分岐 |
| LS4 | 同上 | `prefers historyImpl over window.history when both present` | inject impl が呼ばれ window.history は呼ばれない | impl 優先分岐 |

## coverage 計測方法と AC 対応

### 計測コマンド

```bash
# 全体（apps/web スコープ）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# 単一ファイル局所確認（速い反復用）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage src/lib/admin/__tests__/server-fetch.test.ts
```

- coverage provider: `v8`（`apps/web/vitest.config.ts`）
- 出力: `apps/web/coverage/coverage-summary.json` / `coverage/lcov.info`
- AC 判定は `coverage-summary.json` の対象 path 要素（13 件）から `statements.pct / branches.pct / functions.pct / lines.pct` を抽出して閾値判定。

### AC マッピング

| AC | 達成方法 | 該当 case |
| --- | --- | --- |
| Stmts ≥85% (admin lib) | C1-C7 + A1-A8 + T1 import smoke で `server-fetch.ts` / `api.ts` / `types.ts` の statement 全実行 | C1-C7, A1-A8, T1 |
| Branches ≥80% (admin lib) | error mapping / cookie 空 / content-type 分岐を網羅 | C3, C5, C6, A4, A5, A6, A7, A8 |
| Funcs ≥85% (admin lib) | api.ts は 8 mutation + getter を export しすべて 1 回以上呼ぶ | A1, A3 (table-driven 8 件) |
| Stmts/Lines ≥85% (UI primitives) | 各 primitive の最低 3 ケースで render path 通過 | TO1-4, MO1-7, DR1-7, FI1-3, SE1-3, SW1-3, SR1-4 |
| Branches ≥80% (UI primitives) | open/close, hint truthy/falsy, value 空/非空, disabled, focus trap forward/backward, focusable 0 | MO1, MO4, MO5, MO6, FI2, FI3, SR3, SR4, SW3 |
| Funcs ≥85% (UI primitives) | 各コンポーネント関数 + callback 経路を呼ぶ | TO2, TO3, MO3, MO7, SE3, SW2, SR2, SR4 |
| Stmts ≥85% (barrel/types) | 値 import + satisfies で statement を実行 | T1, IC1, IX1 |
| Branches ≥80% (login-state) | error / gate / SSR / impl 注入の 4 分岐 | LS1-LS4 |

### 除外境界 decision log

- `vitest.config.ts` の `coverage.exclude` を **追加・変更しない**（数値合わせを避ける）。
- 型 only ファイル (`types.ts`, `icons.ts`) は除外せず、import smoke + `satisfies` で実 statement を踏ませて AC を満たす。
- `apps/web/src/components/ui/index.ts` も barrel として除外せず import smoke で計上。

## test pyramid 上の位置づけ

| layer | 該当 | 備考 |
| --- | --- | --- |
| Unit | UI primitives (Toast/Modal/Drawer/Field/Segmented/Switch/Search) / login-state | RTL + jsdom |
| Contract | admin lib (server-fetch / api) | `globalThis.fetch` mock を契約境界として固定 |
| Smoke | barrel / types | import smoke + satisfies |

## 実行手順

- 本フェーズではテストファイル作成は行わない。Phase 5 ランブック向けにケース表のみを確定する。
- ケース表に変更が生じた場合は本ファイルを source of truth として更新し、Phase 5 / Phase 6 / Phase 7 へ伝播する。
- 実測は Phase 11 で実施する。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`（admin lib 利用元）
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`（release runbook gate）

## 多角的チェック観点

- 不変条件 #5 / #6: admin lib テストで D1 / Hono backend を import しない。`fetch` mock のみ。
- 不変条件 #11 / #13: 既存 api.test.ts の保護ケースを維持し、`profileBody` / 直接 tag 更新 mutation を新規追加しない。
- AC 数値合わせのために `coverage.exclude` を編集しない。
- React act() warning を出さないよう `await user.click(...)` / `await user.type(...)` を採用。
- 未実装/未実測を PASS と扱わない（Phase 11 で coverage-summary.json 抜粋を evidence 化）。

## サブタスク管理

- [ ] テストケース定義表（38 ケース以上）を確定する
- [ ] coverage 計測コマンド + AC マッピングを確定する
- [ ] 除外境界 decision log を残す
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- `outputs/phase-04/main.md`: ケース表 / AC マッピング / 計測コマンドのサマリ

## 完了条件

- 全対象 13 モジュールに対し it() タイトル / 期待値 / カバー branch・function が表で確定している
- 実行コマンド (`pnpm --filter @ubm-hyogo/web test`, `pnpm --filter @ubm-hyogo/web test:coverage`, `pnpm typecheck`, `pnpm lint`) が明記されている
- AC（Stmts/Lines/Funcs ≥85%, Branches ≥80%）への寄与が case 単位で対応付いている
- coverage exclude 改変計画が無い

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] CONST_005 必須項目（変更対象 / it()・期待値 / 実行コマンド / DoD）を満たす
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ次を渡す: 38 件超の it() ケース表、ファイル単位の coverage AC マッピング、計測コマンド、除外境界 decision log（exclude 不変更）、test pyramid layer 分類。

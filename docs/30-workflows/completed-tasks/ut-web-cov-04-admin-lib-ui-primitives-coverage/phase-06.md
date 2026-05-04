# Phase 6: 異常系検証 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 4-5 で確定した正常系ケースに対し、admin lib の HTTP error / network 失敗、UI primitives の prop 欠落・unmount during async・keyboard edge・login-state の不正入力を異常系テストとして固定し、Branches ≥80% を確実に満たすため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 6 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Branches ≥80% AC 達成のため、各モジュールの error path / edge case を test 化する仕様。 |

## 目的

13 対象に対し、AC のうち **Branches ≥80%** を保証する異常系テストを確定する。admin lib の 401/403/404/500 / network error / JSON parse error / timeout、UI primitives の必須 prop 欠落 / callback throw / unmount during async / Escape / overlay click outside、login-state の不正 query / decode 失敗 / overflow を「期待挙動 / AC 寄与（branch 名） / rollback 手順」で表化する。

## 実行タスク

1. admin lib の HTTP / network / parse 異常系を確定する。完了条件: 下記 admin lib 異常系表が網羅。
2. UI primitives の prop 欠落 / async unmount / keyboard / overlay 異常系を確定する。完了条件: 下記 UI 異常系表が網羅。
3. login-state の不正入力 / decode 失敗 / overflow を確定する。完了条件: 下記 login-state 異常系表が網羅。
4. 各異常系の AC 寄与（どの branch がカバーされるか）を Phase 4 ケース表と整合させる。完了条件: 重複 case ID は無し、追加 ID 採番済み。
5. 想定外失敗時の rollback / debug 手順を記載する。完了条件: 下記 rollback 表が成立。

## 参照資料

- Phase 4 ケース表
- Phase 5 ランブック
- `apps/web/src/lib/admin/server-fetch.ts` / `api.ts` のエラー分岐
- `apps/web/src/components/ui/{Modal,Drawer}.tsx` の keydown handler / focus trap
- `apps/web/src/lib/url/login-state.ts` の query 構築

## admin lib 異常系

### `server-fetch.ts`

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 (branch / function) | rollback / debug |
| --- | --- | --- | --- | --- | --- |
| EC1 | `throws on 401 with status code in message` | mock fetch returns `Response("", { status: 401 })` | `Error` matching `/failed: 401/` | `res.ok=false` 分岐 | mock fetch 引数を console 出力で確認 |
| EC2 | `throws on 403` | status=403 | message に 403 含む | error mapping 同一 branch（status 値による分岐は無いため case として記録のみ） | 同上 |
| EC3 | `throws on 404` | status=404 | message に 404 含む | 同上 | 同上 |
| EC4 | `throws on 500` | status=500 | message に 500 含む | 同上 | 同上 |
| EC5 | `propagates network error from fetch` | `fetch.mockRejectedValue(new TypeError("fetch failed"))` | rejects with same error | catch path（server-fetch では throw が外に伝播） | mock 確認 |
| EC6 | `rejects when JSON parse fails on success body` | `Response("not json", { status: 200, headers: { "content-type": "application/json" } })` | rejects（`res.json()` が throw） | JSON parse 異常 branch | response body 確認 |
| EC7 | `aborts on timeout via AbortController` | `signal` を渡し `controller.abort()` を呼ぶ | rejects with `AbortError` | abort 分岐（server-fetch が `signal` を pass-through する場合のみ。未対応なら skip + decision log） |

### `api.ts`

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 |
| --- | --- | --- | --- | --- |
| EA1 | `maps 401 JSON body into AdminMutationErr` | `{ status:401, body: { error: "unauthorized" } }` | `{ ok:false, status:401, error:"unauthorized" }` | error JSON 分岐 + status pass-through |
| EA2 | `maps 403/404/500 generically` | each status with `{ error }` | error 文字列展開 | 同上 (table-driven) |
| EA3 | `falls back to "HTTP <status>" on 4xx with non-JSON body` | `Response("oops", { status: 502 })` | `error: "HTTP 502"` | non-JSON 分岐 |
| EA4 | `returns status=0 on fetch network throw` | `fetch.mockRejectedValue(new TypeError())` | `{ ok:false, status:0, error: <TypeError message> }` | catch path |
| EA5 | `returns status=0 on JSON parse throw inside ok branch` | `res.ok=true` だが `res.json()` が throw | `{ ok:false, status:0, error }` または rejects | parse 失敗 branch（実装挙動に合わせて assert 分岐） |
| EA6 | `does not retry on 4xx (non-retryable)` | mock fetch を 1 回呼ぶ | `fetch` 呼び出し回数 1 | retry 戦略がある場合のみ。無ければ contract として「1 回のみ」を assert |

### `types.ts`

- 異常系該当なし（型 only）。`satisfies` 違反は TS コンパイル段階で型エラーとなり test runtime には到達しないため、Phase 6 では追加 case 不要。

## UI primitives 異常系

### `Toast.tsx`

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 |
| --- | --- | --- | --- | --- |
| ETO1 | `useToast outside provider throws` | hook を Provider 無しで呼ぶ | `renderHook` が throw（`Error`）| useToast guard 分岐（Phase 4 の TO1 を異常系として再分類） |
| ETO2 | `dispatch after unmount does not throw` | toast 後に Provider unmount → timer 進行 | エラーが thrown されない | unmount during async (setTimeout cleanup) 分岐 |
| ETO3 | `crypto.randomUUID undefined fallback` | `vi.stubGlobal("crypto", { randomUUID: undefined })` | runtime で crash しない（uuid なしでも動く実装か、必須なら throw を assert） | uuid 分岐（実装に合わせて挙動 fix） |

### `Modal.tsx` / `Drawer.tsx`

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 |
| --- | --- | --- | --- | --- |
| EMO1 | `Escape with no onClose does not throw` | `onClose` 未指定 | エラー無し | optional callback 分岐 |
| EMO2 | `overlay click invokes onClose when closeOnOverlayClick=true` | overlay 要素を click | `onClose` 1 回 | overlay click 分岐 |
| EMO3 | `overlay click does NOT invoke onClose when closeOnOverlayClick=false` | overlay click | `onClose` 0 回 | 否定分岐 |
| EMO4 | `keydown on non-Escape key is ignored` | `userEvent.keyboard("{a}")` | `onClose` 0 回 | key === "Escape" 否定分岐 |
| EMO5 | `unmount removes keydown listener` | open=true → unmount → keydown | `onClose` 0 回 | useEffect cleanup 分岐 |
| EMO6 | `focusable=0 Tab preventDefault` | 子要素なし状態で Tab | `preventDefault` 呼ばれる | focusable 0 分岐（Phase 4 MO6 を異常系扱いに再採番） |
| EDR1-5 | Drawer 同形 | Modal と対応 | 同上 | Drawer 同等 branch |

### `Field.tsx`

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 |
| --- | --- | --- | --- | --- |
| EFI1 | `renders without label gracefully` | `label` 省略 | crash しない（型上必須なら test omit） | optional 分岐 |
| EFI2 | `hint=""` (empty string) | `hint=""` | hint paragraph をレンダリングしない（空文字 falsy 分岐） | hint truthy 否定 |

### `Segmented.tsx` / `Switch.tsx`

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 |
| --- | --- | --- | --- | --- |
| ESE1 | `onChange throw is propagated` | `onChange = vi.fn(() => { throw new Error("x") })` を click | error が thrown される or RTL が catch（実装に合わせて assert） | callback throw |
| ESE2 | `value not in options renders no aria-checked=true` | `value="z"` で options に z 不在 | `queryByRole("radio", { checked: true })` が null | value 不一致分岐 |
| ESW1 | `disabled + click does not invoke onChange` | `disabled, onChange = vi.fn()` | callback 0 回 | disabled 分岐（Phase 4 SW3 と同一 branch、再採番せず ref のみ） |

### `Search.tsx`

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 |
| --- | --- | --- | --- | --- |
| ESR1 | `clear button absent when value is undefined` | `value={undefined}` | clear button が無い | undefined 扱い分岐 |
| ESR2 | `onChange not invoked when input disabled` | `disabled` prop 対応時のみ | callback 0 回 | disabled 分岐（実装に存在する場合） |

### `icons.ts` / `index.ts`

- 異常系なし（barrel / type list は failure surface が無い）。

## login-state 異常系

| ID | it() タイトル | 入力 | 期待挙動 | AC 寄与 |
| --- | --- | --- | --- | --- |
| ELS1 | `does not throw on malformed query` | URL に `%` 単体など decode 失敗値を含む既存 query | 例外を呑むか throw 仕様を assert（実装に合わせる） | decode 異常分岐 |
| ELS2 | `clamps overflow values gracefully` | 仕様上 length 制限がある場合の超過入力 | truncate or reject の挙動を assert（実装次第） | overflow 分岐（仕様無ければ skip + decision log） |
| ELS3 | `is no-op when window undefined and historyImpl absent` | `vi.stubGlobal("window", undefined)` + `historyImpl` 省略 | 例外なし、history 関数も呼ばれない | SSR no-op 分岐（Phase 4 LS3 を異常系扱いに再分類） |
| ELS4 | `prefers historyImpl when both window and impl exist` | inject impl 優先 | window.history.replaceState 0 回 / impl 1 回 | impl 優先分岐（Phase 4 LS4 と同一） |

## 期待挙動と AC への寄与（Branches サマリ）

| 対象 | 異常系で踏む追加 branch | 想定 Branches pct delta |
| --- | --- | --- |
| `server-fetch.ts` | error mapping / network error / parse error / cookie 空 | n/a → ≥80 |
| `api.ts` | error JSON / non-JSON / catch / content-type / status pass-through | n/a → ≥80 |
| `Modal.tsx` / `Drawer.tsx` | overlay click on/off / non-Escape key / focusable=0 / cleanup | 46.15→≥80 / 64.7→≥80 |
| `Field.tsx` | hint truthy/falsy | 50→≥80 |
| `Search.tsx` | value 空 / 非空 / clear button 押下 | 寄与済（Phase 4） |
| `Switch.tsx` | disabled true / false | 寄与済（Phase 4） |
| `login-state.ts` | error/gate/SSR/impl 4 分岐 | 33.33→≥80 |

## 想定外失敗時の rollback / debug 手順

| 症状 | debug 手順 | rollback |
| --- | --- | --- |
| `crypto.randomUUID` 未定義で Toast テスト失敗 | `vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" })` を `beforeEach` 配置に変更 | 該当テストを `it.skip` で一時無効化 + decision log 記録 |
| `next/headers` の `cookies()` server-only ガードで `import` 失敗 | `vi.mock("next/headers", () => ({ cookies: vi.fn() }))` を test top-level に置く | mock 不発時は test を skip し AC 未達分は別 case で補完 |
| focus trap テスト flaky | `act` ラップ / `userEvent.setup({ delay: null })` を使う / `previousButton` を `document.body` に append してから `focus()` | flaky 続く場合 retry 設定でなく case を縮退（forward only に） |
| barrel `ui/index.ts` の coverage が 0 のまま | `import * as UI` を試したか確認 / `vitest.config.ts` の `coverage.include` に `apps/web/src/components/ui/index.ts` が含まれるか確認 | include 不足が判明したら別タスクで config 改修（本タスク scope out） |
| `INTERNAL_AUTH_SECRET` の値漏れ | `vi.stubEnv("INTERNAL_AUTH_SECRET", "test-secret")` のみ使用、実値を import しないことを `git grep` で確認 | 漏れ発覚時 commit 前に履歴除去 |
| 既存 `primitives.test.tsx` 縮小で他テスト失敗 | 縮小を revert | 個別ファイル追加だけに留め `primitives.test.tsx` は触らない（regression 回避優先） |
| coverage 計測値が CI と local で乖離 | Node 24 / pnpm 10 / `vitest.config.ts` 同一を確認 | `mise exec --` 経由で再計測 |

## 実行・検証コマンド

```bash
# 異常系を含む全テスト
mise exec -- pnpm --filter @ubm-hyogo/web test

# 異常系 case の coverage 寄与確認
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 実行手順

- 本フェーズでは仕様書のみ。実テストコードの追加は Phase 5 ランブックに沿って実施する。
- 異常系 case ID は Phase 4 の正常系 ID と重複しないよう `E*` プレフィクスで採番済み。Phase 7 AC マトリクスはこの両方を統合する。
- 仕様上対応していない異常系（例: `server-fetch.ts` が `signal` を pass-through していない場合の EC7）は decision log として明示し、当該 case を skip 扱いにする。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6 を異常系テストでも侵さない（D1 / Hono import 禁止）
- error message に実 secret / PII を含めない（mock dummy `test-secret` のみ）
- skip 採用は decision log 必須（未実装/未実測を PASS と扱わない）
- act() warning 抑止 / cleanup 漏れ無し
- AC（Branches ≥80%）への寄与が異常系 case ごとに対応している

## サブタスク管理

- [ ] admin lib 異常系（EC1-EC7, EA1-EA6）を確定する
- [ ] UI primitives 異常系（ETO/EMO/EDR/EFI/ESE/ESW/ESR）を確定する
- [ ] login-state 異常系（ELS1-ELS4）を確定する
- [ ] rollback / debug 手順表を確定する
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- `outputs/phase-06/main.md`: 異常系ケース表 / AC 寄与 / rollback 手順のサマリ

## 完了条件

- 全対象 13 モジュールの異常系 case が「it() タイトル / 入力 / 期待挙動 / AC 寄与 / rollback」を伴って表化されている
- Branches ≥80% を満たすに十分な分岐網羅が AC マッピングで示されている
- skip 案件には decision log がある
- 実行コマンドが明記されている

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] CONST_005 必須項目を埋めている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ次を渡す: 正常系 38 件超 + 異常系 30 件超の case ID 一覧、AC マトリクス入力（Stmts/Lines/Funcs/Branches それぞれを満たす case ID 集合）、skip 採用 case の decision log、rollback / debug 手順。

# Phase 2: 設計 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 5 で着手するテストコード（13 モジュール分）の構造・mock 戦略・ケース表を確定する設計フェーズであり、production code 改変を伴わないテスト実装が後続するため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 2 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Vitest テストファイル新規追加・既存 primitives テスト拡張の test 設計を確定するため。 |

## 目的

13 モジュールに対するテスト戦略・追加テストファイルパス・ケース表・mock 戦略・既存テストとの重複排除方針を確定する。Phase 4-7 が CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 入出力 / 実行コマンド / DoD）を埋められる粒度まで具体化する。

## テスト戦略総論

- admin lib (`server-fetch.ts`, `api.ts`, `types.ts`)
  - **contract test**: `vi.fn()` で `globalThis.fetch` を差し替え、authed fetch（header / body / cookie 経由）/ error mapping / type guard / network failure 各ケースを契約として固定する。
  - `next/headers` の `cookies()` は `vi.mock("next/headers", ...)` で stub。実 cookie store には触れない。
  - D1 / Hono backend は import しない（不変条件 #6）。
- UI primitives (`Toast / Modal / Drawer / Field / Segmented / Switch / Search`)
  - React Testing Library + `@testing-library/user-event` を用いる（`fireEvent` は既存テスト互換用にのみ残す）。
  - 各コンポーネントで最低 3 ケース: `open/close（または mount/unmount）`, `prop variant`, `callback invocation`。
- barrel / 型ファイル (`icons.ts`, `index.ts`, `types.ts`)
  - import smoke で export 集合を `Object.keys` / 直接 named import で存在 assert。型 only ファイルは `expectTypeOf` でも可だが、coverage 計上目的で値 import の試行を最低 1 行入れる。
- url helper (`login-state.ts`)
  - 既存テスト 2 ケースに加え、`opts.error` / `opts.gate` / `historyImpl` 未指定（SSR no-op）/ `window` 未定義の 4 ケースを追加し branch coverage を底上げする。

## 追加テストファイルと主要ケース

### 1. `apps/web/src/lib/admin/__tests__/server-fetch.test.ts`（新規）

- 対象: `fetchAdmin<T>(path, opts)`
- mock:
  - `vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => "session=abc" }) }))`
  - `globalThis.fetch = vi.fn()` を `beforeEach` で初期化
  - `process.env.INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` は `vi.stubEnv` で操作
- ケース:
  1. happy: GET 時に `accept: application/json` / `x-internal-auth` / `cookie` ヘッダが組み立てられる
  2. POST + body 時に `content-type: application/json` と `JSON.stringify(body)` が送られる
  3. `INTERNAL_API_BASE_URL` 末尾スラッシュが除去される
  4. `INTERNAL_API_BASE_URL` 未設定時に fallback `http://127.0.0.1:8787` が使われる
  5. `cookies().toString()` が空文字の場合 `cookie` header を付けない
  6. `res.ok=false` で `Error("admin api ${path} failed: ${status}")` を throw する
  7. response が JSON deserialize された値で resolve する

### 2. `apps/web/src/lib/admin/__tests__/api.test.ts`（既存拡張）

- 既存 3 ケース（不変条件 #11 / #13 / 関数 export 一覧）を維持。
- `globalThis.fetch` を mock し、各 mutation の URL / method / body / 成功 / 失敗 / network 例外を網羅:
  1. `patchMemberStatus` → PATCH `/api/admin/members/:id/status` + body
  2. `postMemberNote` / `patchMemberNote` の URL encode（`memberId`/`noteId` に `:`含む値）
  3. `deleteMember`, `restoreMember`, `resolveTagQueue`, `postSchemaAlias`, `resolveAdminRequest`, `createMeeting`, `addAttendance`, `removeAttendance` の path / method を 1 ケースずつ
  4. `res.ok=false` + JSON body `{ error: "..." }` で `AdminMutationErr.error` が文字列展開される
  5. `res.ok=false` + 非 JSON body で `HTTP ${status}` が返る
  6. `fetch` が throw（network error）した時に `{ ok:false, status:0, error }` が返る
  7. `res.ok=true` + JSON body の `data` が型 `T` として resolve する
  8. `content-type` に `application/json` を含まないとき `data=null` で resolve

### 3. `apps/web/src/lib/admin/__tests__/types.test.ts`（新規）

- import smoke。`AdminAuditFilters` / `AdminAuditListItem` / `AdminAuditListResponse` を値として `satisfies` で空 literal を assert（型 only でも v8 coverage 計上のため一度 import 行を実行する）。

### 4. `apps/web/src/components/ui/__tests__/Toast.test.tsx`（新規。primitives.test.tsx の `Toast` describe を移譲）

- mock: `vi.useFakeTimers()`, `crypto.randomUUID` は `vi.spyOn`。
- ケース:
  1. `useToast` を `ToastProvider` 外で呼ぶと throw する
  2. `toast(message)` 呼び出し後 `role=status` の DOM が現れる
  3. 3000ms 経過後に DOM から消える（`vi.advanceTimersByTime(3000)`）
  4. 連続 toast で `aria-live="polite"` 領域に複数要素が積まれる

### 5. `apps/web/src/components/ui/__tests__/Modal.test.tsx`（新規。既存 describe を移譲・拡張）

- ケース:
  1. `open=false` で何もレンダリングされない（`container.firstChild === null`）
  2. `open=true` で `role=dialog` / `aria-modal="true"` / `aria-labelledby="modal-title"`
  3. Escape で `onClose` が呼ばれる
  4. Tab で末尾→先頭に focus 遷移（focus trap forward）
  5. Shift+Tab で先頭→末尾に focus 遷移（focus trap backward）
  6. focusable 要素 0 件で Tab 押下時 `preventDefault` が呼ばれる
  7. close 時 `previousFocus` に focus が戻る

### 6. `apps/web/src/components/ui/__tests__/Drawer.test.tsx`（新規。既存 describe を移譲・拡張）

- Modal と同等の 7 ケース。`aria-labelledby="drawer-title"` を assert。

### 7. `apps/web/src/components/ui/__tests__/Field.test.tsx`（新規。既存 describe を移譲・拡張）

- ケース:
  1. `label[htmlFor]` と `id` が一致する
  2. `hint` 指定時 `<p id="${id}-hint">` がレンダーされる
  3. `hint` 未指定時 `<p>` が出ない（branch carve-out）

### 8. `apps/web/src/components/ui/__tests__/Segmented.test.tsx`（新規）

- ケース:
  1. `role=radiogroup` / 各 option が `role=radio`
  2. `value` と一致する option のみ `aria-checked="true"`
  3. クリックで `onChange(opt.value)` が呼ばれる

### 9. `apps/web/src/components/ui/__tests__/Switch.test.tsx`（新規）

- ケース:
  1. `role=switch` / `aria-checked` が `checked` を反映
  2. クリックで `onChange(!checked)`
  3. `disabled=true` で `disabled` 属性が付き click しても callback が呼ばれない

### 10. `apps/web/src/components/ui/__tests__/Search.test.tsx`（新規。既存 describe を移譲・拡張）

- ケース:
  1. `value` 反映 / `placeholder` 反映
  2. 入力で `onChange(e.target.value)`
  3. `value=""` の時クリアボタンが描画されない（branch）
  4. `value` が非空のときクリアボタン押下で `onChange("")`

### 11. `apps/web/src/components/ui/__tests__/icons.test.ts`（新規）

- import smoke + `IconName` 型の値 list を `satisfies readonly IconName[]` で assert。

### 12. `apps/web/src/components/ui/__tests__/index.test.ts`（新規）

- barrel import smoke: `import * as UI from "../index"` で `Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills` の 15 export が `typeof === "function" | "object"` であることを assert。

### 13. `apps/web/src/lib/url/login-state.test.ts`（既存拡張）

- 既存 2 ケースを維持し追加:
  1. `opts.error` 指定時に `error` query が URL に含まれる
  2. `opts.gate` 指定時に `gate` query が URL に含まれる
  3. `historyImpl` 省略時 `typeof window === "undefined"` 経路で no-op（`vi.stubGlobal("window", undefined)`）
  4. `historyImpl` を渡したケースは `window` の値に関わらず inject impl が優先される

## mock 戦略まとめ

| 依存 | mock 方法 |
| --- | --- |
| `next/headers` `cookies()` | `vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({ toString: () => "..." }) }))` |
| `next/navigation` | 本タスク対象には未使用（必要時 `vi.mock("next/navigation")`） |
| `globalThis.fetch` | `vi.fn()` を `beforeEach` で代入、`afterEach` で復元 |
| `process.env.INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` | `vi.stubEnv` / `vi.unstubAllEnvs` |
| `crypto.randomUUID` | `vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid-1")` |
| `setTimeout` / Toast 3 秒タイマー | `vi.useFakeTimers()` + `vi.advanceTimersByTime(3000)` |
| `document.activeElement` / `keydown` | RTL の `screen.getByRole` + `fireEvent.keyDown(document, ...)` |
| `window.history.replaceState` | `vi.fn()` を `historyImpl` 経由で注入 |
| `window` 未定義 | `vi.stubGlobal("window", undefined)` |

## 既存テストとの重複排除方針

- 既存 `apps/web/src/components/ui/__tests__/primitives.test.tsx` のうち、本タスクで個別ファイルに分離する `Toast / Modal / Drawer / Field / Segmented / Switch / Search` の describe block は、Phase 5 で個別ファイル新設後に primitives.test.tsx 側から削除する。
- 既存 `apps/web/src/lib/admin/__tests__/api.test.ts` の 3 ケースは保持し、新規 mutation 検証ケースを追記する形で同一ファイルを拡張する（重複 describe を作らない）。
- 既存 `apps/web/src/lib/url/login-state.test.ts` は同一ファイルにケースを追記する。

## 実行手順

- 本フェーズではファイル作成は行わない（仕様書のみ）。
- Phase 5 で `apps/web/src/...` 配下に上記 13 (新規 11 + 既存拡張 2) ファイルを作成または編集する。
- coverage 実測は Phase 11 で `mise exec -- pnpm vitest run --coverage` 実行し、`apps/web/src/{lib/admin,components/ui,lib/url}` 配下の対象パスについて `coverage-summary.json` から AC 達成を確認する。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6 違反のない mock surface（D1 / Hono を import しない）。
- coverage exclude による数値合わせをしない。
- React act() warning が出ない非同期コード（`await user.click(...)` を使う）。
- 既存テストへ regression を入れない（既存 describe を削除する場合は同等以上のケースを新規ファイルに移植する）。

## サブタスク管理

- [ ] 13 モジュール × ケース表を Phase 5 ランブック向けに固定する
- [ ] mock 戦略表を Phase 4 / Phase 6 の異常系入力として渡す
- [ ] 重複排除（primitives.test.tsx 縮小）方針を確定する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- `outputs/phase-02/main.md`: ケース表 / mock 戦略 / 重複排除方針サマリ

## 完了条件

- 13 件全てに対する追加 / 拡張テストファイルパスとケースが明示されている
- mock 戦略が依存ごとに表で確定している
- AC（≥85% / ≥80%）を満たすに十分なケース数になっている
- 既存テストとの重複排除方針が明文化されている

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] 13 モジュール全てに追加ファイルパスとケースが対応している
- [ ] mock 戦略表が網羅的である
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ次を渡す: 設計レビュー観点（mock surface の不変条件適合 / 既存テスト regression / coverage exclude 不使用 / barrel smoke の妥当性 / focus trap ケースの網羅）と、Phase 4-7 が CONST_005 を埋めるための変更対象ファイルリスト（11 新規 + 2 既存拡張）。

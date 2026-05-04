# Phase 5: 実装ランブック — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 4 で確定した 38 ケース超を 13 ファイル（新規 11 + 既存拡張 2）に落とし込む着手手順を確定するため、後続フェーズで実テストコードを追加する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 5 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | テストファイル新規追加・既存拡張のステップバイステップ手順を確定する実装ランブック。 |

## 目的

13 対象モジュールに対し、依存少 → 依存多 / 単純 → 複雑 の順で着手するステップバイステップ手順を確定する。各ステップで「対象ファイル / 新規 or 既存拡張 / 追加テストファイル絶対パス / 主要 import / mock setup 雛形（疑似コード） / 期待される coverage 変化」を明示し、Phase 11 実測時の reproducibility を担保する。

## 実行タスク

1. 着手順序を確定する（admin lib → UI primitives → barrel → login-state）。完了条件: 13 ステップが Sequential / Parallel 可否含めて確定。
2. 共通 helper 配置先 (`apps/web/src/test/helpers/`) を確定する。完了条件: factory / 雛形が表で固定。
3. 各ステップに mock setup 雛形（疑似コード）を添える。完了条件: 実コードを書かずに contract が判別可能。
4. 期待される coverage 変化を file 単位で記録する。完了条件: 13 ステップ全てで baseline → 目標の delta が記載。
5. 実行・検証コマンドを確定する。完了条件: 単体・全体・typecheck・lint が並ぶ。

## 参照資料

- Phase 4 ケース表（38 件超の it() タイトル）
- 起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`
- `apps/web/vitest.config.ts`
- 既存テスト: `apps/web/src/components/ui/__tests__/primitives.test.tsx` / `apps/web/src/lib/admin/__tests__/api.test.ts` / `apps/web/src/lib/url/login-state.test.ts`

## 着手順序（13 ステップ）

> 各ステップは互いに **独立してマージ可能** な粒度。並列着手も可だが、共通 helper を導入する Step 0 は最初に実施する。

### Step 0 — 共通 helper 配置（任意・推奨）

- 配置先: `apps/web/src/test/helpers/`
- 想定 helper:
  - `mock-fetch.ts`: `installFetchMock()` / `restoreFetch()` / `mockJsonResponse(status, body, contentType?)` の factory（疑似コード）
  - `mock-cookies.ts`: `mockNextHeadersCookies(value: string)` で `vi.mock("next/headers", ...)` をラップ
  - `mock-crypto-uuid.ts`: `stubRandomUUID(value)` / `restoreRandomUUID()`
- 採用判断: 同 mock surface を 3 箇所以上で再利用する場合のみ helper 化する。1 箇所利用なら inline で残す（YAGNI）。

### Step 1 — `lib/admin/server-fetch.ts` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/lib/admin/server-fetch.ts` |
| 追加テスト (新規) | `apps/web/src/lib/admin/__tests__/server-fetch.test.ts` |
| カバー case | C1-C7 |
| 主要 import | `vitest` / `next/headers` (mocked) / `../server-fetch` |
| mock setup 雛形（疑似） | `vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({ toString: () => "session=abc" }) }))` / `beforeEach: globalThis.fetch = vi.fn(); vi.stubEnv("INTERNAL_API_BASE_URL", "http://api/"); vi.stubEnv("INTERNAL_AUTH_SECRET", "test-secret")` / `afterEach: vi.unstubAllEnvs(); vi.restoreAllMocks()` |
| coverage 変化 | server-fetch.ts: Stmts 12.5 → ≥85, Funcs 0 → ≥85, Lines 12.5 → ≥85 |

### Step 2 — `lib/admin/api.ts` (既存拡張)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/lib/admin/api.ts` |
| 既存テスト拡張 | `apps/web/src/lib/admin/__tests__/api.test.ts` |
| カバー case | A1-A8（既存 3 ケースは保持） |
| mock setup 雛形（疑似） | `beforeEach: globalThis.fetch = vi.fn()` / table-driven: `[[fn, expectedPath, expectedMethod, body?]]` を `it.each([...])` で展開 / response factory: `new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })` |
| coverage 変化 | api.ts: Stmts 17.24 → ≥85, Funcs 0 → ≥85, Lines 17.24 → ≥85 |

### Step 3 — `lib/admin/types.ts` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/lib/admin/types.ts` |
| 追加テスト (新規) | `apps/web/src/lib/admin/__tests__/types.test.ts` |
| カバー case | T1 |
| 主要 import | `import type { AdminAuditFilters, AdminAuditListItem, AdminAuditListResponse } from "../types"` + 値参照のため `import * as Types from "../types"` |
| mock setup 雛形（疑似） | mock 不要。`const _f = {} satisfies Partial<AdminAuditFilters>; void _f;` で statement を踏む |
| coverage 変化 | types.ts: 全 metric 0 → 100（型 only でも import 実行で計上） |

### Step 4 — `components/ui/Toast.tsx` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/Toast.tsx` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/Toast.test.tsx` |
| カバー case | TO1-TO4 |
| mock setup 雛形（疑似） | `beforeEach: vi.useFakeTimers(); vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("uuid-1")` / `afterEach: vi.useRealTimers(); vi.restoreAllMocks()` / `<ToastProvider><Consumer/></ToastProvider>` で render |
| coverage 変化 | Toast.tsx: Stmts 61.53 → ≥85, Funcs 50 → ≥85, Lines 61.53 → ≥85 |

### Step 5 — `components/ui/Modal.tsx` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/Modal.tsx` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/Modal.test.tsx` |
| カバー case | MO1-MO7 |
| mock setup 雛形（疑似） | `previousButton = document.createElement("button"); document.body.appendChild(previousButton); previousButton.focus()` 後に `<Modal open onClose={fn}>...</Modal>` を render / Tab 検証は `userEvent.tab()` / Escape は `userEvent.keyboard("{Escape}")` |
| coverage 変化 | Modal.tsx: Branches 46.15 → ≥80, 他 metric ≥85 |

### Step 6 — `components/ui/Drawer.tsx` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/Drawer.tsx` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/Drawer.test.tsx` |
| カバー case | DR1-DR7 |
| mock setup 雛形（疑似） | Modal と同形。`aria-labelledby="drawer-title"` を assert |
| coverage 変化 | Drawer.tsx: Branches 64.7 → ≥80, 他 ≥85 |

### Step 7 — `components/ui/Field.tsx` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/Field.tsx` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/Field.test.tsx` |
| カバー case | FI1-FI3 |
| mock setup 雛形（疑似） | mock 不要。`<Field id="x" label="L" hint="H"><input id="x" /></Field>` と `hint` 省略版を別 it() で render |
| coverage 変化 | Field.tsx: Branches 50 → ≥80 |

### Step 8 — `components/ui/Segmented.tsx` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/Segmented.tsx` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/Segmented.test.tsx` |
| カバー case | SE1-SE3 |
| mock setup 雛形（疑似） | mock 不要。`onChange = vi.fn()` を渡し `userEvent.click(option)` |
| coverage 変化 | Segmented.tsx: Funcs 50 → ≥85 |

### Step 9 — `components/ui/Switch.tsx` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/Switch.tsx` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/Switch.test.tsx` |
| カバー case | SW1-SW3 |
| mock setup 雛形（疑似） | mock 不要。`onChange = vi.fn()` / `disabled` 版を別 it() で確認 |
| coverage 変化 | Switch.tsx: Funcs 50 → ≥85 |

### Step 10 — `components/ui/Search.tsx` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/Search.tsx` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/Search.test.tsx` |
| カバー case | SR1-SR4 |
| mock setup 雛形（疑似） | `value=""` と `value="abc"` を別 it() で render し clear button の有無を assert / `userEvent.type` で onChange 受信 |
| coverage 変化 | Search.tsx: Funcs 66.66 → ≥85 |

### Step 11 — `components/ui/icons.ts` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/icons.ts` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/icons.test.ts` |
| カバー case | IC1 |
| mock setup 雛形（疑似） | mock 不要。`import { type IconName } from "../icons"; const list = ["chevron-right", ...] as const satisfies readonly IconName[]; expect(list.length).toBeGreaterThan(0)` |
| coverage 変化 | icons.ts: 0 → ≥85（import smoke で計上） |

### Step 12 — `components/ui/index.ts` (新規)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/components/ui/index.ts` |
| 追加テスト (新規) | `apps/web/src/components/ui/__tests__/index.test.ts` |
| カバー case | IX1 |
| mock setup 雛形（疑似） | `import * as UI from "../index"; for (const k of ["Chip","Avatar","Button","Switch","Segmented","Field","Input","Textarea","Select","Search","Drawer","Modal","Toast","KVList","LinkPills"]) expect(UI[k]).toBeDefined()` |
| coverage 変化 | index.ts: 0 → ≥85 |

### Step 13 — `lib/url/login-state.ts` (既存拡張)

| 項目 | 値 |
| --- | --- |
| 対象 production | `apps/web/src/lib/url/login-state.ts` |
| 既存テスト拡張 | `apps/web/src/lib/url/login-state.test.ts` |
| カバー case | LS1-LS4（既存 2 ケース保持） |
| mock setup 雛形（疑似） | `historyImpl = { replaceState: vi.fn() }` を渡すケース / `vi.stubGlobal("window", undefined)` で SSR ケース |
| coverage 変化 | login-state.ts: Branches 33.33 → ≥80 |

### Step 14（任意） — `primitives.test.tsx` の重複削除

- 個別ファイル化した describe (`Toast / Modal / Drawer / Field / Segmented / Switch / Search`) を `apps/web/src/components/ui/__tests__/primitives.test.tsx` から削除する。
- `Chip / Avatar / Button / Input / Textarea / Select / KVList / LinkPills` の describe は保持。
- 全 vitest が PASS することを確認するまで削除を保留可（regression 回避優先）。

## 共通 helper 配置先

| ファイル（任意導入） | 役割 |
| --- | --- |
| `apps/web/src/test/helpers/mock-fetch.ts` | `globalThis.fetch` の vi.fn() 化と `Response` factory |
| `apps/web/src/test/helpers/mock-cookies.ts` | `next/headers` の `cookies()` mock |
| `apps/web/src/test/helpers/mock-crypto-uuid.ts` | `crypto.randomUUID` stub |
| `apps/web/src/test/helpers/render-ui.tsx` | RTL `render` + `userEvent.setup()` の thin wrapper |

> 既存 `apps/web/src/test/` 配下に類似 helper があれば再利用優先。新設は YAGNI に従い 3 箇所以上で重複した時のみ。

## 実行・検証コマンド

```bash
# 1. 単一テスト反復
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/lib/admin/__tests__/server-fetch.test.ts

# 2. apps/web 全テスト
mise exec -- pnpm --filter @ubm-hyogo/web test

# 3. coverage 計測（Phase 11 で evidence 採取）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# 4. 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 実行手順

- Phase 5 では仕様書のみ。Step 1-13 のコードはこの仕様書では書かない。
- 着手は別タスク（または同タスクの別フェーズ）で行う。CONST_007 単サイクル完了原則に従い、本仕様書セット完成 → 着手 → 実測 → PR を 1 サイクルで通す。
- production code 改変・`vitest.config.ts` 改変・commit/push/PR は本フェーズで実行しない。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6: `server-fetch.test.ts` で D1 / Hono を import しない。`fetch` mock のみ。
- 不変条件 #11 / #13: 既存 `api.test.ts` の保護ケースを移植先で保持。
- act() warning 抑止: `await user.click` / `await user.type` を採用。
- coverage exclude を編集しない。
- 共通 helper は 3 箇所以上の重複が確認できた時のみ導入する（YAGNI）。

## サブタスク管理

- [ ] 13 ステップの runbook を確定する
- [ ] 共通 helper 配置方針を確定する
- [ ] 実行・検証コマンドを確定する
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- `outputs/phase-05/main.md`: 着手順序 / helper 配置 / コマンドのサマリ

## 完了条件

- 13 ステップ全てに「対象ファイル / 新規 or 既存拡張 / 追加テスト絶対パス / mock 雛形 / coverage 変化」が揃う
- 共通 helper 配置先と採用基準が明示される
- 実行コマンド (`pnpm --filter @ubm-hyogo/web test`, `pnpm --filter @ubm-hyogo/web test:coverage`, `pnpm typecheck`, `pnpm lint`) が並ぶ
- production code 改変・coverage exclude 改変計画が無い

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] CONST_005 必須項目を埋めている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ次を渡す: 13 ステップの runbook、helper 配置先、実行コマンド、各ステップで網羅すべき正常系ケース ID 一覧（Phase 6 はこれの異常系補完を担当）。

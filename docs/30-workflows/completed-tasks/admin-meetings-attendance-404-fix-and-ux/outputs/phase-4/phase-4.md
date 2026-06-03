**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 4: テスト作成 / TDD RED

Task A（admin API proxy の transport 統一）と Task B（出席管理 UI/UX 改善）の TDD RED フェーズ。
Phase 4 は当初、Phase 5 の実装が満たすべきテストケースを先に追加して「失敗する状態（RED）」を作る仕様を確定する段階だった。automation-30 改善サイクル後は local 実装と focused Vitest PASS まで完了済み。

確定設計は Phase 1（§1.4 AC / §1.8 IA）・Phase 2（§2.2 transport / §2.3 UI）・Phase 3（PASS）に従う。再調査でこれを覆さない。

- 対象 vitest（Task A）: `apps/web/app/api/admin/[...path]/route.spec.ts`（**既存・編集**）
- 対象 vitest（Task B1）: `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx`（**新規**）
- 対象 vitest（Task B2/B3）: `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx`（**既存・編集**）
- 対象 vitest（Task B4）: `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx`（**新規・任意**）
- 実装対象（Phase 5 で着手・本 Phase では変更しない）:
  - `apps/web/app/api/admin/[...path]/route.ts`
  - `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`
  - `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`
  - `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx`

---

## 4.1 既存 spec / test ファイルの実在確認（ls 済み）

`ls` で確認した実在状況（新規/編集の分岐根拠）:

| パス | 実在 | 本 Phase での扱い |
|---|---|---|
| `apps/web/app/api/admin/[...path]/route.spec.ts` | **あり**（120 行・proxy fail-fast / 403 / sync token を既存検証） | **編集**（service binding 分岐ケースを追加。`*.spec.ts` のため不変条件 #8 充足） |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | **あり**（34 行・empty / onSelect / testid を検証） | **編集**（人数バッジ・aria-label ケースを追加） |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | **なし** | **新規**（`*.spec.tsx`・不変条件 #8 充足。`*.test.tsx` 禁止） |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx` | **なし** | **新規（任意）**（B4 導線テキスト検証。最小限で追加） |
| `apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts` | あり | **変更しない**（純関数 `computeMeetingStats` は本タスクで不変） |

> 新規テストは `*.spec.{ts,tsx}` のみ（不変条件 #8）。`*.test.*` は lefthook `block-test-suffix` / CI `verify-test-suffix` が reject するため作らない。

---

## 4.2 RED の前提（Phase 1-3 確定設計の再掲）

### Task A — proxy transport 統一

| 項目 | 確定内容 |
|---|---|
| transport 選択 | `route.ts` の `proxy()` 内で、`getAuthEnv().API_SERVICE`（service binding）があれば `binding.fetch("https://service-binding.local/admin/" + path.join("/") + url.search, init)` を使う |
| HTTP fallback | binding が無く `INTERNAL_API_BASE_URL`（= `apiBase()` が非 null）があれば従来どおり `fetch(target, init)`（local dev fallback） |
| fail-fast | binding も URL も無い場合のみ従来どおり 500 `internal_api_base_url_missing` |
| 不変 | `requireAdmin()`（403）・`needsSyncAdminBearer()`・ヘッダ中継（`x-internal-auth` / cookie / authorization / content-type）・body 中継（GET/DELETE 除外）・GET=POST=PATCH=DELETE export・upstream status / content-type の返却は一切変えない |
| observability | `logAdminTransport("service-binding" \| "http-fallback")` を `server-fetch.ts:100-108,558,561` と同一形式で出力する |

> 状態所有権: transport 選択ロジックは route handler に閉じる。`env.ts` には新アクセサを足さない（`getAuthEnv().API_SERVICE` は既に公開済み・`env.ts:136-141`）。

### Task B — 出席管理 UI/UX

| 項目 | 確定内容 |
|---|---|
| B1 氏名表示 | `MeetingAttendanceDrawer` で `candidates` から `nameOf = useMemo(() => new Map(candidates.map((c) => [c.memberId, c.fullName])), [candidates])` を構築し、出席者を `nameOf.get(mid) ?? mid` で表示。解決不能時のみ memberId |
| B2 人数バッジ | `MeetingTimeline` の見出し button 内に `<span data-testid={`meeting-attendance-count-${m.sessionId}`}>` を追加し、`count > 0 ? `${count} 名出席` : "出席 未登録"` を表示 |
| B2 カウント源 | カウントは新 prop（`attendedCounts?: Record<string, number>` または `attendedCountOf?: (sessionId: string) => number`）で `MeetingsClientShell` の `attended` state 由来を受け取る。`MeetingItem.attendance` には依存しない（stale 回避） |
| B3 aria | 見出し button に `aria-label`（出席を記録・編集する導線である旨）を付与。`aria-expanded` は既存維持 |
| B4 導線 | `MeetingsClientShell` で timeline へ `attendedCounts` を配線し、「各開催日を選択すると出席を記録・編集できます」導線テキストを追加 |
| 不変 | OKLch トークン正本（HEX 直書き禁止・#2）/ 既存 primitive のみ（#9）/ 既存 API のみ（#1）/ legacy useAdminMutation 不使用（#10） |

---

## 4.3 命名規則整合チェック（RED を書く前に必ず実施）

Phase 1.3 で現行命名を踏襲することを確定済み。RED を書く前に下記を確認する。

1. transport ログ文字列は `"service-binding"` / `"http-fallback"`（`server-fetch.ts` と逐語一致）。`"binding"` / `"fallback"` 等の独自略称を使わない。
2. service binding fetch の仮想ホストは `https://service-binding.local`（`server-fetch.ts:557` と一致）。
3. 新 prop 名は `attendedCounts`（`Record<string, number>`）または `attendedCountOf`（`(sessionId: string) => number`）のいずれか。実装（Phase 5）で 1 つに確定し、テストはその名で書く。本仕様書は **`attendedCounts: Record<string, number>`** を第一候補として記述する（最小・シリアライズ可能・テスト容易）。
4. 出席者バッジ testid は `meeting-attendance-count-${sessionId}`（camelCase 混入なし・kebab + sessionId）。
5. 既存 testid（`attendance-list-session-${id}` / `meeting-row-${id}` / `attendance-attendee-${id}` / `attendance-select-${id}` / `add-attendance-${id}` / `remove-attendance-${id}`）は**変更しない**（回帰 guard）。

---

## 4.4 mock 方針

### Task A（route.spec.ts）の mock

既存 spec は次の 2 つを使う（踏襲する）:

- `vi.mock("../../../../src/lib/auth", () => ({ getAuth: async () => ({ auth: authMock }) }))` — admin gate を制御。
- `vi.stubGlobal("fetch", fetchMock)` — HTTP fallback 経路の検証。**`fetch` の stub は許可**（禁止対象は `vi.stubGlobal("window", ...)` のみ）。

新たに service binding 分岐を検証するため、**`env.ts` を mock** する。`getAuthEnv()` は `readRawEnv()`（vitest 環境では `process.env`）を読むが、service binding は object であり `process.env` に載らないため、env モジュール mock で `API_SERVICE` を注入する。

```ts
// route.spec.ts 冒頭の mock 群に追加
const getAuthEnvMock = vi.fn();
vi.mock("../../../../src/lib/env", () => ({
  getAuthEnv: () => getAuthEnvMock(),
}));
```

| 分岐 | mock 設定 |
|---|---|
| binding あり | `const bindingFetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "content-type": "application/json" } })); getAuthEnvMock.mockReturnValue({ INTERNAL_AUTH_SECRET: "s", API_SERVICE: { fetch: bindingFetch } });`（global `fetch` も `vi.fn()` で stub し「呼ばれないこと」を assert） |
| binding 無し + URL あり | `getAuthEnvMock.mockReturnValue({ INTERNAL_AUTH_SECRET: "s", INTERNAL_API_BASE_URL: "https://api.example.test" });`（`API_SERVICE` 未設定）→ HTTP fallback（`vi.stubGlobal("fetch", fetchMock)`） |
| binding 無し + URL 無し（staging） | `getAuthEnvMock.mockReturnValue({ INTERNAL_AUTH_SECRET: "s" });` + `process.env["ENVIRONMENT"]="staging"` / `NODE_ENV="production"` → 500 |

> **注記（既存ケースとの両立）**: 既存 5 ケースは `getAuthEnv` を real のまま `process.env` で制御している。env を mock 化すると既存ケースが mock 値を読むため、**既存ケースの env 制御も `getAuthEnvMock.mockReturnValue(...)` に置き換える**（§4.5 TC-A4/TC-A5 で明示）。`process.env` の `NODE_ENV` / `ENVIRONMENT` 直読み（`route.ts:22` の fallback 判定）は env mock の対象外なので従来どおり `process.env` で設定する。
>
> **mock パス整合**: `route.ts` の import は `getAuthEnv` を `"../../../../src/lib/env"` から行う（実コード `route.ts:8`）。`vi.mock` のパスはこれと逐語一致させる。

### Task B の mock

- `@testing-library/react` の `render` / `screen` / `fireEvent` / `cleanup` を使う（既存 `MeetingTimeline.spec.tsx` と同一）。`afterEach(() => cleanup())`。
- `MeetingAttendanceDrawer` は presentational に近い（state は edit form / picked のみ）。props（`meeting` / `candidates` / `attended` / 各 callback）を直接渡す。callback は `vi.fn()`。
- `MeetingsClientShell` は `useAdminMutation` / `useRouter` / `api.ts` に依存する。B4 導線テキスト検証のみであれば、これらを mock して render するか、`MeetingTimeline` 単体テスト（B2/B3）+ Drawer 単体テスト（B1）で AC を満たし、Shell テストは導線テキスト 1 ケースに絞る。**`vi.stubGlobal("window", ...)` は使わない**。

---

## 4.5 追加する RED テストケース

### Task A — `route.spec.ts`（編集）

#### TC-A1: service binding がある場合は binding.fetch を使う（AC-A1）

| 項目 | 内容 |
|---|---|
| テスト名 | `service binding がある場合は binding.fetch 経由で /admin/<path> を転送する` |
| mock | binding あり（`bindingFetch` が 201 を返す）。global `fetch` は `vi.fn()` で stub |
| 操作 | `GET(makeRequest("https://web.test/api/admin/meetings"))` |
| 期待値 | `bindingFetch` が 1 回呼ばれ、第 1 引数が `"https://service-binding.local/admin/meetings"`。global `fetch` は呼ばれない（`expect(fetchMock).not.toHaveBeenCalled()`）。レスポンス status が 201 |
| 検証趣旨 | staging/production の正経路が binding に統一されること（404 の根本修正） |

#### TC-A2: search / body / header が binding.fetch に中継される（AC-A3）

| 項目 | 内容 |
|---|---|
| テスト名 | `binding 経路でも search・cookie・authorization・content-type を中継する` |
| mock | binding あり。`makeRequest` を POST 化（または GET で search 付き）して `cookie` / `authorization` / `content-type` を付与 |
| 操作 | POST 相当のリクエスト（`makeRequest` を method=POST・body 付きへ拡張）を proxy へ渡す（`POST` export を import して使用） |
| 期待値 | `bindingFetch.mock.calls[0][0]` が `"https://service-binding.local/admin/meetings?x=1"`（search 含む）、`calls[0][1].headers.cookie` / `.authorization` / `.["content-type"]` が中継値、`calls[0][1].method === "POST"`、`calls[0][1].body` が `await req.text()` 相当 |
| 検証趣旨 | transport 切替後も既存のヘッダ・body 中継規約が不変であること |

#### TC-A3: binding が無く URL がある場合は HTTP fetch に fallback する（AC-A2）

| 項目 | 内容 |
|---|---|
| テスト名 | `service binding が無く INTERNAL_API_BASE_URL がある場合は HTTP fetch に fallback する` |
| mock | `getAuthEnvMock` を `{ INTERNAL_AUTH_SECRET, INTERNAL_API_BASE_URL: "https://api.example.test" }`（`API_SERVICE` 無し）。`vi.stubGlobal("fetch", fetchMock)`（200 を返す） |
| 操作 | `GET(makeRequest("https://web.test/api/admin/members"))` |
| 期待値 | `fetchMock` が呼ばれ、第 1 引数が `"https://api.example.test/admin/members"`。status 200 |
| 検証趣旨 | local dev（binding 不在）互換を保持すること |

#### TC-A4: binding も URL も無い場合は 500 internal_api_base_url_missing（AC-A2）

| 項目 | 内容 |
|---|---|
| テスト名 | `binding も INTERNAL_API_BASE_URL も無い staging では 500 internal_api_base_url_missing を返す` |
| mock | `getAuthEnvMock` を `{ INTERNAL_AUTH_SECRET }`（binding / URL 無し）。`process.env["ENVIRONMENT"]="staging"`・`NODE_ENV="production"`。global `fetch` を `vi.fn()` で stub |
| 操作 | `GET(makeRequest("https://web.test/api/admin/members"))` |
| 期待値 | status 500、body の `error` が `"internal_api_base_url_missing"`、`fetch` も `bindingFetch` も呼ばれない |
| 検証趣旨 | 従来の fail-fast を transport 統一後も維持すること（既存ケースの意味を保つ） |

#### TC-A5: 既存ケースの mock 移行（403 / sync token / authorization 中継の不変・AC-A3 / AC-A5）

| 項目 | 内容 |
|---|---|
| テスト名 | 既存 5 ケース（500-staging / authorization 中継 / SYNC_ADMIN_TOKEN 注入 / sync token 欠落 500 / 403）を維持 |
| 変更 | env mock 導入に伴い、各既存ケースの env 設定を `process.env[...]=...` から `getAuthEnvMock.mockReturnValue({...})` へ移行。HTTP fallback を使うケースは `INTERNAL_API_BASE_URL` を mock 値に含める。`SYNC_ADMIN_TOKEN` 注入ケースは mock 値に `SYNC_ADMIN_TOKEN` を含める |
| 期待値 | 各既存 assertion（403 / 401 propagate / `authorization: Bearer sync-secret` 注入 / `sync_admin_token_missing` 500）が**そのまま PASS**。binding を mock に含めない限り従来の HTTP 経路を通る |
| 検証趣旨 | transport 統一が既存の gate / sync / header 中継を壊さないこと（AC-A5 回帰の単体保証） |

> `makeRequest` ヘルパは現状 GET 固定（`method: "GET"`）。TC-A2 の POST 検証のため、`method` / `body` を引数化する小改修を `route.spec.ts` 内で行う（実装コードは変更しない）。

### Task B1 — `MeetingAttendanceDrawer.spec.tsx`（新規）

#### TC-B1-1: 出席者が氏名で表示される（AC-B1）

| 項目 | 内容 |
|---|---|
| テスト名 | `出席者一覧は candidates から氏名で表示する` |
| props | `candidates=[{memberId:"m_1",fullName:"山田太郎"},{memberId:"m_2",fullName:"鈴木花子"}]`、`attended=new Set(["m_1"])`、`meeting=item`、callback は `vi.fn()` |
| 操作 | `render(<MeetingAttendanceDrawer .../>)` |
| 期待値 | `screen.getByTestId("attendance-attendee-<sessionId>")` 配下に `"山田太郎"` が表示される（`screen.getByText("山田太郎")` が truthy） |
| 検証趣旨 | memberId ではなく氏名表示（実用性向上） |

#### TC-B1-2: 解決不能時は memberId に fallback（AC-B1）

| 項目 | 内容 |
|---|---|
| テスト名 | `candidates に無い memberId は memberId をそのまま表示する` |
| props | `candidates=[{memberId:"m_1",fullName:"山田太郎"}]`、`attended=new Set(["m_unknown"])` |
| 操作 | render |
| 期待値 | `screen.getByText("m_unknown")` が truthy（fallback） |
| 検証趣旨 | 氏名解決不能でも出席行が消えず memberId で表示されること |

#### TC-B1-3: 既存 testid / 出席追加 UI が不変（回帰 guard）

| 項目 | 内容 |
|---|---|
| テスト名 | `出席追加 select / ボタン / 削除ボタンの testid は不変` |
| 期待値 | `attendance-select-<id>` / `add-attendance-<id>` / `remove-attendance-<id>` / `attendance-attendee-<id>` が引き続き取得できる |
| 検証趣旨 | 氏名表示追加が既存 UI を壊さないこと |

### Task B2 / B3 — `MeetingTimeline.spec.tsx`（編集）

#### TC-B2-1: 出席人数バッジを表示する（AC-B2）

| 項目 | 内容 |
|---|---|
| テスト名 | `attendedCounts > 0 のとき "N 名出席" バッジを表示する` |
| props | `items=[item]`（sessionId=`sess-1`）、`attendedCounts={ "sess-1": 3 }`、`selectedId=null`、`onSelect=vi.fn()` |
| 操作 | render |
| 期待値 | `screen.getByTestId("meeting-attendance-count-sess-1").textContent` が `"3 名出席"` を含む |
| 検証趣旨 | カードに出席人数が表示されること |

#### TC-B2-2: 0 名は「出席 未登録」表示（AC-B2）

| 項目 | 内容 |
|---|---|
| テスト名 | `attendedCounts が 0 / 未定義のとき "出席 未登録" を表示する` |
| props | `attendedCounts={ "sess-1": 0 }`（および `attendedCounts={}` の両ケース） |
| 期待値 | `screen.getByTestId("meeting-attendance-count-sess-1").textContent` が `"出席 未登録"` を含む |
| 検証趣旨 | 0 名でもバッジが消えず未登録と明示されること（prop 未指定でも安全） |

#### TC-B3-1: 見出し button に aria-label がある（AC-B3）

| 項目 | 内容 |
|---|---|
| テスト名 | `見出し button に出席記録導線の aria-label を付与する` |
| 操作 | render → 見出し button を取得 |
| 期待値 | `screen.getByTestId("meeting-row-sess-1").querySelector("button")?.getAttribute("aria-label")` が「出席を記録」または「出席を編集」を含む文字列。`aria-expanded` 属性が引き続き存在する |
| 検証趣旨 | 展開操作が出席記録導線として識別可能であること |

#### TC-B3-2: 既存ケース不変（回帰 guard）

| 項目 | 内容 |
|---|---|
| 内容 | 既存 3 ケース（empty / onSelect / `attendance-list-session-<id>` testid）を**変更せず維持**。`attendedCounts` は optional prop のため未指定の既存ケースも壊れない |
| 期待値 | 既存 3 ケース PASS のまま |

### Task B4 — `MeetingsClientShell.spec.tsx`（新規・任意）

#### TC-B4-1: 運用導線テキストを表示する（AC-B4）

| 項目 | 内容 |
|---|---|
| テスト名 | `開催日が 1 件以上あるとき出席記録の導線テキストを表示する` |
| mock | `useAdminMutation` / `useRouter` / `api.ts` を mock（最小 stub）。`initial.items=[item]`、`candidates=[]` |
| 操作 | render |
| 期待値 | `screen.getByText(/各開催日を選択すると出席を記録・編集できます/)` が truthy |
| 検証趣旨 | 導線テキストが描画されること（B4） |

> Shell の依存 mock が重い場合、B4 はテキスト存在の 1 ケースに限定し、人数バッジ配線（`attendedCounts`）の正しさは TC-B2-1/2（Timeline 単体）で担保する（責務分離）。

---

## 4.6 RED 実行と期待される失敗

### 実行コマンド（targeted run / メモリ制約対策・本リポジトリ正経路）

ルートから config を明示する（`apps/web/vitest.config.ts` は不在）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/api/admin/[...path]/route.spec.ts" \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx
```

> 全件 `pnpm test` は回さない（SIGKILL 回避）。パスに `[...path]` を含むため引用符で囲む。

### 期待される失敗（RED 確認）

| ケース | Phase 5 実装前の挙動 | RED の意味 |
|---|---|---|
| TC-A1 | 実装前 `route.ts` は binding を見ず HTTP fetch のみ → `bindingFetch` が呼ばれず FAIL | RED 確認 |
| TC-A2 | 同上（binding 経路が無いため search/header 中継の binding 検証が FAIL） | RED 確認 |
| TC-A3 | 実装前でも HTTP fallback は動くが、env mock 導入後の値経路で PASS する可能性あり（fallback は元から実装済み）。RED の主眼は TC-A1/A2 | 既存挙動の固定（GREEN でも可） |
| TC-A4 | 実装前から 500 を返す → PASS（fail-fast の不変保証ケース） | 回帰 guard（GREEN 維持） |
| TC-A5 | 実装前から PASS（既存挙動）。env mock 移行後も PASS を維持 | 回帰 guard |
| TC-B1-1 | 実装前 drawer は `<span>{mid}</span>` で memberId 表示 → `"山田太郎"` が無く FAIL | RED 確認 |
| TC-B1-2 | 実装前は memberId 表示なので偶然 PASS する場合あり（fallback と区別不能）。実装後は明示的に fallback で PASS | 補助 |
| TC-B2-1 / B2-2 | 実装前 timeline にバッジ無し → `meeting-attendance-count-*` testid が無く FAIL | RED 確認 |
| TC-B3-1 | 実装前 button に aria-label 無し → FAIL | RED 確認 |
| TC-B4-1 | 実装前 Shell に導線テキスト無し → FAIL | RED 確認 |
| 既存 timeline 3 ケース / 既存 route 5 ケース | 不変で PASS（回帰 guard） | 変更しない |

RED が想定どおり FAIL することを確認したら Phase 5 へ進む。

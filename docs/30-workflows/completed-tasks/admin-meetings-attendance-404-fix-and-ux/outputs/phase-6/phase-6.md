**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 6: テスト拡充

Phase 5 実装後に、(a) Task A の **全 admin mutation 回帰 guard**（transport 統一が単一経路の全 mutation を壊さないこと）、
(b) fail path / 補助ケース、(c) Task B の 0 名 / 解決不能 fallback / 出席追加後のバッジ更新、を追加する。
**本仕様書のコードは実装仕様例であり、実際の編集は後続 03.実装.md が行う**。

- 対象 vitest（Task A）: `apps/web/app/api/admin/[...path]/route.spec.ts`（編集）
- 対象 vitest（Task B1）: `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx`（編集）
- 対象 vitest（Task B2/B4）: `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx`（編集）

---

## 6.1 Task A — 全 admin mutation 回帰 guard（AC-A5）

proxy は **全 admin client mutation の単一経路**（tags / member-status / requests / meetings / sync …）。transport 切替がこれらを一斉に壊すリスク（Phase 3 §3.2 強化ループ）を unit test で固定する。

### RG-A1: tags / member-status / requests が binding 経路で同様に転送される（AC-A5）

| 項目 | 内容 |
|---|---|
| テスト名 | `binding 経路で tags / members status / requests の各 path を /admin/<path> へ転送する` |
| mock | binding あり（`bindingFetch` が 200）。global `fetch` を `vi.fn()` で stub |
| 操作 | `POST(makeRequest("https://web.test/api/admin/tags/t_1/resolve", ...))` / `PATCH(.../api/admin/members/m_1/status)` / `POST(.../api/admin/requests/r_1/resolve)` を順に呼ぶ（`it.each` で列挙） |
| 期待値 | 各呼び出しで `bindingFetch` の第 1 引数が `"https://service-binding.local/admin/tags/t_1/resolve"` 等、path が正しく合成される。`fetch`（HTTP）は呼ばれない。method が POST / PATCH と一致 |
| 検証趣旨 | 単一経路の transport 統一が meetings 以外の admin mutation も同様に binding 経由へ載せること（回帰 = 一斉故障の防止） |

### RG-A2: needsSyncAdminBearer が binding 経路でも維持される（AC-A3 / AC-A5）

| 項目 | 内容 |
|---|---|
| テスト名 | `binding 経路でも sync/responses に SYNC_ADMIN_TOKEN を Bearer 注入する` |
| mock | binding あり。`getAuthEnvMock` に `SYNC_ADMIN_TOKEN: "sync-secret"` を含める |
| 操作 | `GET(makeRequest("https://web.test/api/admin/sync/responses?fullSync=true", { authorization: "Bearer browser-token" }))` |
| 期待値 | `bindingFetch.mock.calls[0][1].headers.authorization === "Bearer sync-secret"`（ブラウザ token ではなく sync token へ差し替え）、第 1 引数 path に `?fullSync=true` が含まれる |
| 検証趣旨 | sync bearer 注入が HTTP 経路（既存 TC）だけでなく binding 経路でも不変であること |

### RG-A3: binding 経路で upstream 非 2xx を素通しする（AC-A3）

| 項目 | 内容 |
|---|---|
| テスト名 | `binding 経路で upstream 409 / 422 を status・content-type そのまま返す` |
| mock | `bindingFetch` を `409`（`{ message: "conflict" }`）/ `422` を返すよう設定（`it.each`） |
| 操作 | proxy 呼び出し |
| 期待値 | レスポンス status が 409 / 422、content-type が upstream のものを踏襲。body が素通し |
| 検証趣旨 | 404 マスクや status 改変を新経路で起こさないこと（既存 `route.spec.ts` の 401 propagate と対称） |

### RG-A4: GET / DELETE は body を中継しない（AC-A3 回帰）

| 項目 | 内容 |
|---|---|
| テスト名 | `binding 経路でも GET / DELETE は body を送らない` |
| mock | binding あり。`makeRequest` の `text()` が空文字を返す |
| 操作 | `GET(...)` / `DELETE(...)`（DELETE export を import） |
| 期待値 | `bindingFetch.mock.calls[0][1].body` が undefined（`init.body` 未設定）。POST / PATCH 時は `body` が設定される（RG-A1 と対比） |
| 検証趣旨 | `req.method !== "GET" && req.method !== "DELETE"` の body 中継条件（`route.ts:97`）が transport 統一後も不変 |

---

## 6.2 Task A — fail path 補助（AC-A2）

### FP-A1: local dev（binding なし・URL なし・非 staging）は HTTP fallback 値で動く

| 項目 | 内容 |
|---|---|
| テスト名 | `binding も INTERNAL_API_BASE_URL も無い local dev では 127.0.0.1 fallback で HTTP fetch する` |
| mock | `getAuthEnvMock` に binding / `INTERNAL_API_BASE_URL` 無し。`process.env["NODE_ENV"]` を非 production・`ENVIRONMENT` 非 staging（`apiBase()` の `LOCAL_DEV_FALLBACK` 経路）。`vi.stubGlobal("fetch", fetchMock)` |
| 操作 | `GET(makeRequest("https://web.test/api/admin/members"))` |
| 期待値 | `fetchMock` 第 1 引数が `"http://127.0.0.1:8787/admin/members"`（`apiBase()` の `LOCAL_DEV_FALLBACK`） |
| 検証趣旨 | `apiBase()` 内の local dev fallback（`route.ts:14,22-24`）が transport 統一後も生きること。staging のみ 500（TC-A4）との分岐を固定 |

---

## 6.3 Task B1 — 氏名解決の補助 / 回帰（AC-B1）

### RG-B1-1: 一部のみ解決可能な混在ケース

| 項目 | 内容 |
|---|---|
| テスト名 | `candidates に存在する memberId は氏名、存在しないものは memberId を同時表示する` |
| props | `candidates=[{memberId:"m_1",fullName:"山田太郎"}]`、`attended=new Set(["m_1","m_x"])` |
| 期待値 | `screen.getByText("山田太郎")` と `screen.getByText("m_x")` の両方が truthy。出席行（`attendance-attendee-<id>`）が 2 件 |
| 検証趣旨 | 部分解決でも全出席者が表示され欠落しないこと |

### RG-B1-2: candidates が空でも crash しない

| 項目 | 内容 |
|---|---|
| テスト名 | `candidates が空配列でも出席者を memberId で表示する` |
| props | `candidates=[]`、`attended=new Set(["m_1"])` |
| 期待値 | `screen.getByText("m_1")` が truthy。例外なく render される（`nameOf` Map が空でも `?? mid` で安全） |
| 検証趣旨 | `nameOf.get` の undefined fallback 境界 |

### RG-B1-3: select option の氏名表記が不変（既存挙動 guard）

| 項目 | 内容 |
|---|---|
| テスト名 | `出席追加 select の option は従来どおり "氏名 (memberId)" 表記を維持する` |
| 期待値 | `attendance-select-<id>` 内 option が `"山田太郎 (m_1)"` を含む（`MeetingAttendanceDrawer.tsx:91-94` の表記不変） |
| 検証趣旨 | 出席者一覧の氏名化が select の既存表記を巻き込んで変えていないこと |

---

## 6.4 Task B2 / B4 — バッジ更新と導線（AC-B2 / AC-B4）

### RG-B2-1: 出席追加後に人数バッジが更新される（state 由来カウントの整合）

| 項目 | 内容 |
|---|---|
| テスト名 | `出席を追加するとカード見出しの人数バッジが N→N+1 に更新される` |
| mock | `MeetingsClientShell` を render。`useAdminMutation` を mock し `addAttendance` trigger を resolve（`MeetingAttendanceDrawer.spec` ではなく Shell 結合）。`useRouter` mock |
| 操作 | `initial.items=[item]`・`candidates=[{memberId:"m_1",fullName:"山田太郎"}]` で render → 見出し click（展開）→ select で `m_1` → `add-attendance-<id>` click → resolve 待ち |
| 期待値 | 追加前 `meeting-attendance-count-<id>` が `"出席 未登録"`、追加後（`waitFor`）に `"1 名出席"`。`attendedCounts` が `attended` state 由来で再 render される（`MeetingItem.attendance` 非依存・stale しない） |
| 検証趣旨 | Phase 2 §2.3 の「最新 attended state 由来カウント」設計が実挙動で成立すること |

### RG-B2-2: 削除後にバッジが減る（補助）

| 項目 | 内容 |
|---|---|
| テスト名 | `出席を削除すると人数バッジが減る` |
| 操作 | 1 名出席状態から `remove-attendance-<id>` → confirm → resolve |
| 期待値 | バッジが `"1 名出席"` → `"出席 未登録"` に戻る |
| 検証趣旨 | 双方向の state 反映。0 名表示の境界 |

### RG-B4-1: 開催 0 件のとき導線テキストを出さない（AC-B4 境界）

| 項目 | 内容 |
|---|---|
| テスト名 | `開催日が 0 件のとき出席記録の導線テキストを表示しない` |
| props | `initial.items=[]` |
| 期待値 | `screen.queryByText(/各開催日を選択すると出席を記録・編集できます/)` が `null`。代わりに `AdminEmptyState`（timeline 内）が表示される |
| 検証趣旨 | 導線テキストは「1 件以上」のときのみ（AC-B4）。空状態は EmptyState に委譲 |

---

## 6.5 OKLch トークン回帰（AC-B5）

### RG-TOKEN-1: 追加 class が HEX 直書きを含まない

| 項目 | 内容 |
|---|---|
| 方針 | `verify-design-tokens` gate（Phase 8/9 で実行）に委譲。本 Phase では grep 確認手順を明示する |
| 確認 | `MeetingTimeline.tsx` / `MeetingsClientShell.tsx` / `MeetingAttendanceDrawer.tsx` に `#[0-9a-fA-F]{3,6}` / `bg-\[#` / `text-\[#` が含まれないこと（追加した `admin-timeline__count` / `admin-section__hint` は token 変数経由） |
| コマンド | `grep -nE '#[0-9a-fA-F]{3,6}\|bg-\[#\|text-\[#' apps/web/src/features/admin/components/_meetings/*.tsx`（0 件期待） |

---

## 6.6 実行コマンド

```bash
# vitest（targeted・ルートから config 明示）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/api/admin/[...path]/route.spec.ts" \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx

# HEX 直書き grep（token 回帰）
grep -nE '#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#' apps/web/src/features/admin/components/_meetings/*.tsx || echo "no hex (ok)"
```

> 全件 `pnpm test` は回さない（SIGKILL 回避）。`[...path]` を含むパスは引用符で囲む。

---

## 6.7 完了条件

| AC | 確認 |
|---|---|
| AC-A1 | TC-A1 + RG-A1（binding 経路で各 path 転送） green |
| AC-A2 | TC-A3 / TC-A4 + FP-A1（fallback / fail-fast / local dev）green |
| AC-A3 | TC-A2 + RG-A2/A3/A4（header / body / status 中継・sync bearer）green |
| AC-A5 | RG-A1/A2 で tags / member-status / requests / sync の回帰なし（単体保証）。staging 実測は Phase 11 / DoD |
| AC-B1 | TC-B1-1/2 + RG-B1-1/2/3（氏名 / fallback / 混在 / select 不変）green |
| AC-B2 | TC-B2-1/2 + RG-B2-1/2（バッジ表示 / 追加・削除で更新）green |
| AC-B3 | TC-B3-1（aria-label）green |
| AC-B4 | TC-B4-1 + RG-B4-1（導線テキスト / 0 件非表示）green |
| AC-B5 | RG-TOKEN-1（HEX なし）+ `verify-design-tokens`（Phase 8/9）green |

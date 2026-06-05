# Phase 2: 設計

**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

## メタ情報

| key | value |
|---|---|
| 前提 Phase | Phase 1（要件定義・AC・IA 境界） |
| 本 Phase の責務 | topology / 変更箇所の確定 / transport 設計 / state 引き渡し設計 / runtime 境界 |

## 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

| 必要機能 | 既存資産 | 新規実装 | 判定 |
|---|---|---|---|
| proxy transport（binding 優先） | `server-fetch.ts` の `getAdminServiceBinding()` / `binding.fetch` / `logAdminTransport` | 不要（同パターンを route.ts へ移植） | **再利用** |
| service binding 取得 | `getAuthEnv().API_SERVICE`（env.ts:136-141） | 不要 | **再利用** |
| 出席人数 | `MeetingsClientShell` の `attended: Record<string, Set<string>>` | 不要（`.size` 算出） | **再利用** |
| 氏名解決 | `candidates: ReadonlyArray<MemberCandidate{memberId,fullName}>` | 不要（Map 構築のみ） | **再利用** |
| バッジ UI | `AdminStat` / 既存 timeline class（`admin-timeline__*`） | 不要（既存 class + token） | **再利用** |
| 空状態 | `AdminEmptyState` | 不要 | **再利用** |

→ 新規コンポーネント・新規 primitive・新規 API・新規 hook はゼロ。すべて既存資産の編集で完結（不変条件 #1/#9）。

## 2.2 Task A — proxy transport 統一の設計

### 現状（404 の構造）

```
[GET 初期表示]  page.tsx → safeServerFetch → fetchAdmin
                  → getAdminServiceBinding() あり → binding.fetch(api)   ✅ 200
[POST 開催日追加] MeetingCreateForm → createMeeting → fetch("/api/admin/meetings")
                  → route.ts(proxy) → fetch(INTERNAL_API_BASE_URL + "/admin/meetings")  ❌ 404
```

非対称: GET は service binding（最新 api worker に直結）、POST は HTTP URL（古い/到達不可な値で 404）。

### 修正後（transport 統一）

```
[全 method]  route.ts(proxy)
              → API_SERVICE binding あり → binding.fetch("https://service-binding.local/admin/<path>")  ✅
              → binding 無し → fetch(INTERNAL_API_BASE_URL + "/admin/<path>")  （local dev fallback）
              → どちらも無し → 500 internal_api_base_url_missing（従来どおり）
```

### transport 選択ロジック（`server-fetch.ts:81-85,554-562` を模範に移植）

| 条件 | transport | 備考 |
|---|---|---|
| `getAuthEnv().API_SERVICE` が存在 | `binding.fetch(`https://service-binding.local/admin/${path}${search}`, init)` | staging/production の正経路 |
| binding 無し かつ `INTERNAL_API_BASE_URL` あり | `fetch(`${base}/admin/${path}${search}`, init)` | local dev (`pnpm dev`) 互換 |
| binding 無し かつ URL 無し かつ非 local | `500 internal_api_base_url_missing` | 従来の fail-fast 維持 |
| `logAdminTransport` | `"service-binding"` / `"http-fallback"` を console 出力 | server-fetch と同一の observability |

> **状態所有権**: transport 選択は route handler（Facade 的境界）に閉じる。env アクセサ（`getAuthEnv`）は値提供のみ。binding/URL の優先順位ロジックを env.ts に漏らさない。

### 不変に保つ振る舞い（回帰防止の境界）

- `requireAdmin()`（403）・`needsSyncAdminBearer()`・`x-internal-auth` / cookie / authorization / content-type 中継・`init.body = await req.text()`（GET/DELETE 除外）・`GET=POST=PATCH=DELETE=proxy` の export。
- レスポンスは upstream の status / content-type をそのまま返す（binding/HTTP で同一の戻し方）。

## 2.3 Task B — UI/UX 改善の設計

### ステップ間 state 引き渡しテーブル（W1-02b-2）

| 値 | 所有者 | 引き渡し先 | タイミング |
|---|---|---|---|
| `attended: Record<sessionId, Set<memberId>>` | `MeetingsClientShell`（既存） | `MeetingTimeline`（新 prop `attendedCounts` or `attendedCountOf`）+ `MeetingAttendanceDrawer`（既存 `attended`） | render 毎（出席追加/削除で更新済み） |
| `candidates: MemberCandidate[]` | `MeetingsClientShell`（page から） | `MeetingAttendanceDrawer`（既存 prop）。氏名解決用 Map をここで構築 or drawer 内構築 | render 毎 |
| 氏名 Map `memberId→fullName` | 構築場所は `MeetingAttendanceDrawer` 内（candidates から `useMemo`） | drawer の出席者一覧 | 表示時 |

> **設計判断**: 出席人数バッジのために `MeetingTimeline` に「session ごとの出席数」を渡す必要がある。`MeetingItem.attendance` は初期値で stale になり得る（出席追加後の最新は `attended` state 側）。よって **`MeetingsClientShell` から最新 `attended` 由来のカウントを `MeetingTimeline` に prop で渡す**（`attendedCountOf?: (sessionId: string) => number` または `attendedCounts?: Record<string, number>`）。`MeetingItem.attendance` には依存しない。

### B1 出席者氏名表示（`MeetingAttendanceDrawer.tsx:112-138`）

- `candidates` から `const nameOf = useMemo(() => new Map(candidates.map(c => [c.memberId, c.fullName])), [candidates])`。
- 出席者 `<span>{mid}</span>` → `<span>{nameOf.get(mid) ?? mid}</span>` + 補助に memberId（`<span className="...muted">{mid}</span>` をトークン色で）。
- HEX 直書きせず既存トークン class（例 `text-[color] 禁止` → 既存の muted 用 utility / トークン変数）を使用。

### B2 出席人数バッジ（`MeetingTimeline.tsx:39-47`）

- 見出し button 内に `<span className="admin-timeline__count" data-testid={`meeting-attendance-count-${m.sessionId}`}>` を追加。
- 表示: `count > 0 ? `${count} 名出席` : "出席 未登録"`。
- バッジの色は OKLch トークン（既存 `admin-*` class / token 変数）。`tokens.css` に新 class が要る場合は token 変数経由で追加（HEX 禁止・#2）。

### B3 展開導線（`MeetingTimeline.tsx:39-44`）

- 見出し button に `aria-label={`${m.title}（${m.heldOn}）の出席を記録・編集`}` を付与。`aria-expanded` は既存維持。
- 視覚的な「出席を記録」ヒント（chevron / ラベル）を token で追加。

### B4 運用導線テキスト（`MeetingsClientShell.tsx:251` 付近 / page 説明）

- 開催日一覧カードの説明に「各開催日を選択すると出席を記録・編集できます」を 1 行追加（`AdminSectionCard` の説明 slot or 補助 `<p>`）。
- 既存の `AdminEmptyState`（開催日 0 件時）は文言維持。

## 2.4 runtime 境界（Cloudflare Workers / Next.js）

| 境界 | 扱い |
|---|---|
| route handler（`app/api/admin/[...path]/route.ts`） | Cloudflare Workers 上で実行。`API_SERVICE` は wrangler service binding。`getAuthEnv()` 経由のみ参照（`process.env` 直参照禁止・CLAUDE.md env 不変条件） |
| Server Component（`page.tsx`） | 変更なし。service binding 経由の GET を維持 |
| Client Component（`_meetings/*`） | `"use client"`。D1 直接アクセスなし（#5）。mutation は `/api/admin/*` proxy 経由のみ |
| service binding fetch URL | `https://service-binding.local/...`（server-fetch.ts と同一の仮想ホスト規約） |

## 2.5 SubAgent lane（仕様書作成の並列設計）

| lane | 対象 Phase | 依存 |
|---|---|---|
| backbone（本体・直列） | index / artifacts / Phase 1-3 | なし（最初） |
| lane-1 | Phase 4-6（テスト・実装・テスト拡充） | Phase 1-3 |
| lane-2 | Phase 7-10（カバレッジ・リファクタ・QA・最終レビュー） | Phase 1-3 |
| lane-3 | Phase 11-13（手動テスト・ドキュメント strict7・PR） | Phase 1-3 |

validation lane（verify）は直列で最後に締める。

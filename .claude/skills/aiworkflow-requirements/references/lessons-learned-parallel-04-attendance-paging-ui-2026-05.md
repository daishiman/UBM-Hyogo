# Lessons Learned — parallel-04 AttendanceList cursor paging UI (2026-05)

Issue #372 / G4-1 の cursor paging API（`GET /api/me/attendance?cursor=<opaque>`、default 50 件）に対応する profile 画面 UI を実装した parallel-04 で得られた、Web UI 層（Server Component / Client Component / Playwright evidence）固有の知見。根拠は `apps/web/app/profile/_components/AttendanceList.tsx` / `apps/web/app/profile/_components/AttendanceList.spec.tsx` / `apps/web/app/profile/page.tsx` / `apps/web/playwright/tests/attendance-paging-ui-evidence.spec.ts` / `apps/web/playwright/fixtures/auth.ts` / `docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/outputs/phase-12/implementation-guide.md`。

API / Repository 層の cursor pagination 知見は [[lessons-learned-issue-372-attendance-pagination-2026-05]] にあり、本ファイルは重複を避け Web UI 層に閉じる。

---

## L-P04-001: Server Component が initial page を seed し、Client Component が以降を CSR で append する seed-only state pattern

### 現象
Server Component で fetch した attendance を Client Component が `useState(initial)` の初期値として受け取り、以降の追加 page は CSR fetch で append する境界が非自明。

### 原因分析
Next.js App Router の Server / Client 境界では、Server Component が再 render すると Client Component の props は更新されるが、`useState(props)` は初期 render でしか props を seed しない。これを「正しい挙動」として明示しないと、Server の attendance 変更が UI に反映されないバグとして報告されやすい。

### 採用解決策
- `useState(() => [...attendance])` で props を一度だけ初期値として消費する seed-only パターンを採用。
- 以降の追加 page は client-side `fetch('/api/me/attendance?cursor=...')` で取得し、`setItems(prev => [...prev, ...records])` で append。
- Server-side の initial fetch（`page.tsx`）は SEO / first paint 速度を狙う purpose と明示し、CSR append は a11y / cursor 整合を狙う purpose と分離。

### 再利用ガイド
SSR + CSR append の paging UI を実装する際は、`useState(() => initial)` で seed-only を明示し、Server props の再渡しで再 hydrate しない設計を採る。Server / Client 境界の責務分離は phase-12 `implementation-guide.md` に必ず明記する。

---

## L-P04-002: cursor を UI 側で opaque string として扱い、parse / decode せず `encodeURIComponent` で URL に流す

### 現象
cursor は `(heldOn, sessionId)` の tuple を base64url encode した opaque string。フロントで decode しようとすると tuple 構造に依存し、API 側で encoding を変えた瞬間に UI 全体が壊れる。

### 原因分析
HTTP 境界の cursor は「中身を覗かない契約」が SSOT（`docs/00-getting-started-manual/specs/01-api-schema.md` §Attendance pagination、API 側 helper `encodeAttendanceCursor` / `decodeAttendanceCursor`）。UI が parse すると API/UI で encoding 仕様が二重定義になる。

### 採用解決策
- フロントは cursor を `string | null` として保持し、内部構造を解釈しない。
- 次ページ取得は `encodeURIComponent(cursor)` を必ず通し、`?` `&` `=` を含む opaque を安全に URL に渡す。
- `AttendanceList.spec.tsx` の fixture では `cursor?x=1&y=2` のような疑似 URL を意図的に投入し、`encodeURIComponent` 経由で `cursor%3Fx%3D1%26y%3D2` に変換されることを観測する。

### 再利用ガイド
opaque cursor を扱うフロントでは、cursor 文字列を一切 parse / split / regex しないことをコード comment に残し、focused spec で encode round-trip を検証する。将来 brand 型化（`type OpaqueCursor = string & { __brand }`）すれば誤 parse をコンパイル時に防げる。

---

## L-P04-003: Playwright fixture は `/me/profile` と `/me/attendance` の dual-endpoint を 1 メソッドで同期 seed する

### 現象
Server Component の initial render は `/me/profile`（attendance + attendanceMeta 付き）を読み、Client の追加 page は `/me/attendance` を読む。テストで片方だけ mock すると、初期 50 件と追加 page の整合が崩れて screenshot evidence が不安定になる。

### 原因分析
Playwright の `page.route()` は browser 経由のリクエストしか intercept できないため、Server Component の SSR fetch には別経路の fixture が必要。さらに Client の追加 fetch も同オリジン経路で別途 intercept が必要。

### 採用解決策
- `apps/web/playwright/fixtures/auth.ts` に `mockApi.setAttendancePage({ profile, page })` を追加し、`/me/profile` の `attendance / attendanceMeta` と `/me/attendance` の `records / nextCursor / hasMore` を 1 呼び出しで同期 seed。
- `setAttendancePage` 内で同一 cursor 値を両 endpoint に伝播することで、UI 状態と API 状態の drift を構造的に防ぐ。

### 再利用ガイド
SSR + CSR 混在の paging UI に Playwright evidence を付ける際は、SSR endpoint と CSR endpoint を 1 fixture method で seed する設計を最初から組み込む。fixture method 名は `set<Feature>Page` のように intent 明示。

---

## L-P04-004: `hasMore` / `nextCursor` の論理整合は UI で二重ガードし、将来 API contract で discriminated union 化する

### 現象
型上は `hasMore: boolean` と `nextCursor: string | null` が独立しているため、`hasMore=true && nextCursor=null` という到達不能状態を許す。`loadMore` が `null` cursor を URL に流すと API 側で 400 が返るリスクがある。

### 原因分析
01-api-schema.md と `apps/api/src/routes/me/schemas.ts` で hasMore と nextCursor が独立 field として宣言されており、論理整合は runtime invariant に依存している。

### 採用解決策
- UI 側 `loadMore` で `if (!hasMore || !cursor) return;` の二重ガード。
- 期待形式は discriminated union（`{ hasMore: true; nextCursor: string } | { hasMore: false; nextCursor: null }`）であることを `lessons-learned` に記録し、API spec 改訂時に統合する候補として残す。

### 再利用ガイド
独立 boolean + nullable string で cursor paging を表す場合、UI 側で論理整合を runtime ガードしつつ、後続タスクで discriminated union 化を提案する（本タスクからの follow-up unassigned 起票を推奨）。

---

## L-P04-005: `role="alert"` 採用と無限スクロール不採用の a11y / 契約整合判断

### 現象
無限スクロール（IntersectionObserver）を採用すると、スクリーンリーダーで「いつ追加されたか」が announce されず、cursor が API レート制限に当たった場合も検知が遅れる。

### 原因分析
- a11y: 無限スクロールは「終端到達」のフィードバックが弱く、キーボード/SR 利用者の体験が劣化。
- 契約: cursor 整合性は明示的なユーザー操作（ボタン click）で取得した方が、テストと evidence で再現しやすい。

### 採用解決策
- 「もっと見る」ボタンで明示的に load。
- error 文言は `role="alert"`（即時 announce）で表示し、`aria-live="polite"` ではなく `role="alert"` を選んだ理由はコード comment と phase-12 `implementation-guide.md` に明記。
- loading / error state を独立管理し、error 後もボタンは再押下可能（loading 中のみ disabled）。

### 再利用ガイド
paging UI の追加読込トリガーは「ユーザー明示操作 + role=alert error」を default とし、無限スクロールは a11y 検証 evidence が揃ってから採用する。

---

## L-P04-006: 親 spec の supersession note による旧仕様の inline 撤回パターン

### 現象
親 spec（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-04-attendance-paging/spec.md`）は当初「20 件 POST」と書かれていたが、Issue #372 の API 正本同期後に default 50 件 GET に変わった。旧 spec を全削除すると履歴が消え、新仕様だけ追記すると本文と矛盾する。

### 原因分析
spec の本文は実装着手時の判断根拠であり、後から覆っても履歴として残す価値がある。一方で「現行契約」と「旧契約」が並ぶと読者を混乱させる。

### 採用解決策
- spec.md 冒頭に `> **2026-05-15 supersession note**: ...` の inline note を 1 行追加し、新 phase-1-13 workflow を Phase 1-13 形式の実装 close-out 正本として指定。
- 旧本文は削除せず、note で「旧記述の『20 件』および `POST` は撤回」と明示。

### 再利用ガイド
親 spec の SSOT 逆転（後発 close-out workflow に正本性を委譲）は、spec.md 冒頭の supersession note で 1 行 inline 撤回する。task root rename で path drift が発生した場合は `grep -RIn` で全 .md を一括更新し、生成物 JSON（playwright-report / monocart）は除外する。

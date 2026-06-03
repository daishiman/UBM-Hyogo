**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 8: リファクタリング

`taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 8.1 リファクタ方針

本タスクの実装差分は 4 ファイル（`route.ts` の transport 統一 + `_meetings/` 3 component の UI 改善）に限定される。
観点は **duplicate（重複ロジック）削減 / navigation drift（責務の漏れ・分散）削減** の 2 軸に絞り、過剰な抽象化は行わない（YAGNI）。

| 観点 | 本タスクでの判定 | 根拠 |
| --- | --- | --- |
| duplicate（重複ロジック） | transport 選択ロジックが `server-fetch.ts` と `route.ts` で構造的に類似するが**共有化しない**（§8.3 判断） | 共有化のコストが削減量を上回る。同 transport 規約を「踏襲」することで命名一貫性は確保（Phase 1.3） |
| navigation drift（責務分散） | transport 選択を route handler に閉じ env.ts に漏らさない / 出席人数の所有を `attended` state に閉じる | Phase 2.2 / 2.3 で確定。drift を構造的に発生させない |

---

## 8.2 変更内容（対象 / Before / After / 理由）

> Feedback RT-03 準拠。Before/After をテーブルで明示し、実装者が差分意図を 1 行で追えるようにする。

### Task A — `apps/web/app/api/admin/[...path]/route.ts`

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| transport 選択 | `proxy` 末尾で `fetch(target, init)`（HTTP のみ・binding 不参照） | `getAuthEnv().API_SERVICE` あれば `binding.fetch("https://service-binding.local/admin/${path}${search}", init)`、無ければ既存 HTTP fetch、両方無ければ既存 500 | GET（server-fetch）が binding 経由で成功する一方 POST が HTTP で 404 になる非対称を解消（404 の根本原因） |
| binding 取得 helper | なし | `server-fetch.ts:getAdminServiceBinding()` と同等の局所 helper（test/playwright かつ `INTERNAL_API_BASE_URL` あり時は binding を返さず HTTP へ隔離） | server-fetch と同じ test 隔離規約を踏襲し、unit test が HTTP mock で安定する |
| observability | （なし or 既存ログ） | `logAdminTransport("service-binding"|"http-fallback", ...)` 相当の transport ログを出力 | server-fetch と同一の観測性。transport 切替の検証可能性を確保 |
| `apiBase()` / `internalSecret()` / `syncAdminToken()` / `needsSyncAdminBearer()` / `requireAdmin()` | 既存のまま | **変更なし**（HTTP fallback と 500 で `apiBase()` を継続利用） | local dev fallback と fail-fast を維持（AC-A2/A3）。admin gate・sync bearer は不変 |
| header 中継・body 中継・method 振り分け・upstream status/content-type 戻し | 既存のまま | **変更なし**（binding/HTTP どちらも同じ `init` と戻し方） | AC-A3 で「中継挙動は不変」が要件。binding 経路でも同一の `init` を渡す |
| `GET/POST/PATCH/DELETE = proxy` export | 既存のまま | **変更なし** | 全 method が同一 transport を共有する設計 |

### Task B — `_meetings/` 3 component

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `MeetingAttendanceDrawer.tsx` 出席者行（L123） | `<span>{mid}</span>`（memberId のみ） | `nameOf = useMemo(new Map(candidates.map(c => [c.memberId, c.fullName])))` を作り `<span>{nameOf.get(mid) ?? mid}</span>` + 補助 memberId をトークン色 muted で併記 | 氏名がないと実用性が低い（真因 B）。fallback で解決不能時は memberId 維持（AC-B1） |
| `MeetingTimeline.tsx` 見出し button | 日付 + タイトルのみ | 出席人数バッジ（`count > 0 ? "${count} 名出席" : "出席 未登録"`）を追加 + `aria-label="${title}（${heldOn}）の出席を記録・編集"` | カードに出席情報・記録導線がなく発見性が低い（真因 B / AC-B2/B3） |
| `MeetingTimeline.tsx` Props | `items / selectedId / onSelect / renderRowExtra` | `attendedCountOf?: (sessionId) => number`（または `attendedCounts?: Record<string, number>`）を追加 | バッジ値は `MeetingItem.attendance`（stale 化し得る）でなく最新 `attended` state 由来にするため（Phase 2.3 設計判断） |
| `MeetingsClientShell.tsx` timeline 配線（L252） | `attendedCountOf` 未配線 | `attended[sessionId].size` 由来のカウントを `MeetingTimeline` に prop で渡す | 出席追加/削除後も最新人数を反映（stale 防止） |
| `MeetingsClientShell.tsx` 一覧説明（L251 付近） | `開催日一覧 (N 件)` のみ | 「各開催日を選択すると出席を記録・編集できます」運用導線を 1 行追加 | 運用導線の明示（AC-B4） |
| `MeetingAttendanceDrawer` 既存編集/追加/削除 UI・`AdminEmptyState`（0 件文言） | 既存のまま | **変更なし** | スコープ外。新規 primitive を増やさない（#9） |

---

## 8.3 transport 選択ロジックを `server-fetch.ts` と共有化しない判断（YAGNI）

`route.ts` と `server-fetch.ts` はともに「binding あれば `binding.fetch`、無ければ HTTP fetch」という対称構造になる。
リファクタの誘惑として「共通 `selectAdminTransport()` util へ括り出す」案が浮かぶが、本タスクでは **共有化しない**。

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `route.ts` に server-fetch と同パターンを**踏襲移植**（局所 helper・確定案） | **採用** | 2 箇所で構造が似るだけで、入力（route は `NextRequest` の生 header/body 中継、server-fetch は `AdminFetchOptions` の JSON body）と env アクセサ（`getAuthEnv` vs `getAdminFetchEnv`）が異なる。命名規約のみ揃えれば一貫性は十分（Phase 1.3） |
| 共通 util（`selectAdminTransport(env)` 等）へ抽出し両者から呼ぶ | **却下** | 抽象 1 個に対し呼び出し 2 箇所。route と server-fetch は header 構築・body 形態・accept・cache 方針が別で、引数で差を吸収するほど分岐が増え読みにくくなる。`server-fetch.ts` は不変条件（参照元・変更しない）であり、そこへ手を入れると回帰面が広がる |
| `server-fetch.ts` の `getAdminServiceBinding` を export して route から import | **却下** | server-fetch は変更しない方針（Phase 1.5 inventory）。export 追加は server-fetch の差分化を招き、単一経路（proxy）の修正に他ファイルを巻き込む |

> **判断原則**: 「構造が似ている」は共通化の十分条件ではない。入力形態・env アクセサ・回帰面が異なる 2 箇所は、共通規約（命名・仮想ホスト `https://service-binding.local`・transport ログ）を踏襲するに留め、実体は各 facade に閉じる。共通化は transport が 3 箇所目に増えた時点で再検討する。

---

## 8.4 navigation drift（責務分散）が発生しないことの確認

| 確認 | 結果 |
| --- | --- |
| transport 選択は route handler 内に閉じる（env.ts へ優先順位ロジックを漏らさない） | `getAuthEnv()` は値提供のみ。binding/URL の優先順位は route handler が判断（Phase 2.2） |
| 出席人数の所有が一元化（`attended` state のみが正） | バッジ値は `MeetingsClientShell` の `attended` state 由来で `MeetingTimeline` に渡す。`MeetingItem.attendance` を二重の真実源にしない（Phase 2.3） |
| 氏名解決の所有が drawer 内に閉じる | `candidates → fullName` の Map は `MeetingAttendanceDrawer` 内 `useMemo`。新規 fetch・新規 state を増やさない |
| 画面間の責務境界不変 | `/admin/dashboard/attendance`（read 分析）/ `/admin/members`（参照のみ）は触らない。IA 分離維持（Phase 1.8） |

---

## 8.5 リファクタ後の不変条件再確認

| 不変条件 | 維持確認 |
| --- | --- |
| #1 既存 API のみ | apps/web の 4 ファイルのみ編集。endpoint / payload / D1 schema 不変。`api.ts` attendance パス不変 |
| #2 OKLch トークン正本 | バッジ・muted memberId・導線テキストの色は既存 token / `admin-*` class 経由。HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` ゼロ（Phase 9 で gate 確認） |
| #5 D1 直接アクセス禁止 | proxy は binding/HTTP で api Worker 経由のみ。client は `/api/admin/*` proxy 経由のみ。D1 非接触 |
| #9 FormField / primitive 経由 | drawer の入力は既存 `FormField`/`Input`/`Button`。バッジ・導線は span/p のみで新規 `<input>` を足さない |
| #10 legacy useAdminMutation 不使用 | `MeetingsClientShell` は `@/features/admin/hooks/useAdminMutation` 経由のまま。`@/lib/useAdminMutation` 参照を増やさない |

---

## 8.6 リファクタ判定

**GATE: PASS 条件** — 変更は 4 ファイルに限定。transport 共有化は YAGNI で見送り（命名規約のみ踏襲）、navigation drift の新規発生なし、不変条件を全維持。条件を満たせば品質保証（Phase 9）へ進行可。

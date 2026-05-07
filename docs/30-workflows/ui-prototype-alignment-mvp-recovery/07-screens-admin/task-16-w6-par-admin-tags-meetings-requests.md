# task-16: admin-tags-meetings-requests

> 責務 dir: `07-screens-admin`
> 担当画面: `/admin/tags`（タグキュー）, `/admin/meetings`（開催日 CRUD）, `/admin/requests`（依頼キュー）
> 依存: task-09 (`tailwind-v4-setup`), task-10 (`ui-primitives`)
> 並列: task-15 / task-17 と完全並列可（`(admin)/layout.tsx` は task-15 で先行確定済み前提）
> 改訂日: 2026-05-07

---

## §0. 自己完結コンテキスト

> 本セクションは task-16 を **単独で読み解くために必要な情報** をすべて inline で展開する自己完結ブロック。`outputs/phase-1..3` や `CLAUDE.md`、`task-08/10/15` を都度開かなくても、ここを読めば実装着手できる。150〜250 行を厚めに使い、admin 8 画面のうち本 task が担当する 3 画面（`/admin/tags` / `/admin/meetings` / `/admin/requests`）を完全に閉じる。

### §0.1 上位ゴール（why this task exists）

UBM 兵庫支部会 admin の **キュー / CRUD 系 3 画面** を、`claude-design-prototype/pages-admin.jsx` の `AdminTagsPage`（部分掲載）+ admin sidebar 派生パターン（meetings / requests は未掲載）で再構築する。tags は採用/却下キュー、meetings は開催日 CRUD、requests は visibility / delete 申請の統合キュー。`apps/api/src/routes/admin/{tags-queue, meetings, attendance, requests, responses-sync}.ts` の既存 endpoint を adapter で接続するのみで、新規 endpoint は追加しない（phase-1 §1.2）。phase-2 §5.2 で 1.25 人日。task-15 の `(admin)/layout.tsx` 確定後にしか着手できない（§0.10）。

### §0.2 DAG 座標

```
task-09 (tailwind v4 + tokens) ─┐
task-10 (ui primitives 11) ─────┼──► task-15 ── (layout merge) ──► task-16 (本タスク) ─► task-18
                                 └────────────────────────────► task-17 (並列)
```

- 直接依存元: task-09 / task-10 / **task-15（`(admin)/layout.tsx` 確定後）**。
- 並列可: task-17（schema / conflicts / audit）— `apps/web/src/lib/api/admin.ts` の object key 追記が衝突しないよう注意。
- 直接依存先: task-18（Playwright smoke / `verify-design-tokens` / a11y regression）。
- task-15 layout 完成前着手は禁止。詳細 §0.10。

### §0.3 触れるファイル群（M=Modify / C=Create / R=Read-only）

| 区分 | path | 役割 |
|------|------|------|
| C | `apps/web/src/app/(admin)/admin/tags/page.tsx` | server component, `/admin/tags/queue` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/meetings/page.tsx` | server component, `/admin/meetings` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/requests/page.tsx` | server component, `/admin/requests` 初期フェッチ |
| C | `apps/web/src/features/admin/components/_tags/*.tsx` | TagsQueueList / TagsQueueItem / TagsResolveForm |
| C | `apps/web/src/features/admin/components/_meetings/*.tsx` | MeetingsTable / MeetingFormModal / MeetingsClientShell |
| C | `apps/web/src/features/admin/components/_requests/*.tsx` | RequestsQueueList / RequestDetailPanel / RequestActionBar |
| M | `apps/web/src/lib/api/admin.ts` | `tags` / `meetings` / `requests` namespace を追記（既存 key 編集禁止） |
| M | `apps/web/src/features/admin/components/index.ts` | barrel export 追記 |
| R | `apps/web/src/app/(admin)/layout.tsx` | task-15 確定済み。**編集禁止** |
| R | `apps/web/src/components/ui/*` | task-10 完成 primitive を import のみ |
| R | `apps/api/src/routes/admin/{tags-queue,meetings,attendance,requests,responses-sync}.ts` | endpoint 仕様正本（変更禁止） |

### §0.4 既存 API（不変 surface — `apps/api/src/routes/admin/` を変更しない）

- `GET /admin/tags/queue` (`tags-queue.ts:36`) — status filter（queued/reviewing/resolved/rejected/dlq）対応キュー一覧。
- `POST /admin/tags/queue/:queueId/resolve` (`tags-queue.ts:47`) — 採否確定。body: `{ decision: 'accept'|'reject', reason }`。
- `GET /admin/meetings` (`meetings.ts:62`) — 開催日一覧（昇順 / 降順 query）。
- `POST /admin/meetings` (`meetings.ts:86`) — 新規開催日作成。body: `{ heldOn, title, location, capacity?, notes? }`。
- `PATCH /admin/meetings/:id` (`meetings.ts:117`) — 既存編集（同 body 部分更新）。
- `POST /admin/meetings/:id/attendances` (`meetings.ts:148`) — 出席登録（read-only display 補助・任意）。
- `GET /admin/meetings/:id/export.csv` (`meetings.ts:200`) — 出席 CSV（download link のみ・本 task では call 不要）。
- `GET /admin/meetings/:sessionId/attendance/candidates` (`attendance.ts:31`) — 出席候補（meetings 詳細での参照のみ）。
- `GET /admin/requests` (`requests.ts:199`) — visibility / delete 申請を統合した queue。query: `kind? / status? / cursor?`。
- `POST /admin/requests/:noteId/resolve` (`requests.ts:257`) — 採否確定。body: `{ decision: 'accept'|'reject', reason }`。
- `POST /admin/sync/responses` (`responses-sync.ts:27`) — Google Form responses pull の手動キック（dashboard 派生・本 task の Header に "再同期" 押下で発火する CTA）。

### §0.5 不変条件（CLAUDE.md + phase-1 整合）

1. **D1 直アクセス禁止**: web → api 経由のみ。`adminClient.tags / meetings / requests` は `fetch` ラッパに限定。
2. **OKLch tokens 専用**: HEX 直書き 0 件。`Badge` の tone マッピング（queued=info / reviewing=warning / resolved=success / rejected=danger / dlq=danger outline）も token 経由。
3. **GAS prototype 非昇格**: `gas-prototype/` は参考のみ。プロトタイプ未掲載の meetings / requests は **admin sidebar の DataTable+Modal / Queue+Detail パターン派生** で構成（§0.9）。
4. **Form 再回答が本人更新の正経路**: requests の delete 申請は member 側 self-service で発生する想定。承認フローは admin → API のみ。
5. **新 endpoint 禁止**: 既存 `apps/api/src/routes/admin/` の app.\* 行を増やさない。
6. **MVP では bulk 採否を作らない**: requests / tags ともに行単位の action のみ。
7. **カレンダー UI 不採用**: `react-big-calendar` 等の外部 lib を入れない。meetings は table + 開催日昇順表示。

### §0.6 上流シグネチャ（本 task が呼び出す API — 1 行サマリ）

| method | path | request | response | source |
|--------|------|---------|----------|--------|
| GET | `/admin/tags/queue` | query: `status? / cursor? / pageSize?` | `{ items: TagQueueItem[], nextCursor }` | `tags-queue.ts:36` |
| POST | `/admin/tags/queue/:queueId/resolve` | body: `{ decision, reason }` | `{ ok, queueId, status }` | `tags-queue.ts:47` |
| GET | `/admin/meetings` | query: `order=asc\|desc` | `{ items: Meeting[] }` | `meetings.ts:62` |
| POST | `/admin/meetings` | body: `{ heldOn, title, location, capacity?, notes? }` | `{ ok, meetingId }` | `meetings.ts:86` |
| PATCH | `/admin/meetings/:id` | body: `Partial<MeetingForm>` | `{ ok, meetingId }` | `meetings.ts:117` |
| GET | `/admin/meetings/:sessionId/attendance/candidates` | path: `sessionId` | `{ candidates: Candidate[] }` | `attendance.ts:31` |
| GET | `/admin/requests` | query: `kind? / status? / cursor?` | `{ items: RequestQueueItem[], nextCursor }` | `requests.ts:199` |
| POST | `/admin/requests/:noteId/resolve` | body: `{ decision, reason }` | `{ ok, noteId, status }` | `requests.ts:257` |
| POST | `/admin/sync/responses` | （body 任意） | `{ ok, fetched, updated }` | `responses-sync.ts:27` |

### §0.7 下流シグネチャ（task-16 が後続に提供する surface）

- `apps/web/src/lib/api/admin.ts` に `adminClient.tags = { listQueue, resolve }`、`adminClient.meetings = { list, create, update, candidates }`、`adminClient.requests = { list, resolve }`、`adminClient.sync = { responses }` を追加。
- `apps/web/src/features/admin/components/index.ts` に `TagsQueueList` / `MeetingsTable` / `MeetingFormModal` / `RequestsQueueList` 等を追記 export。
- task-18 の Playwright smoke は `/admin/tags` `/admin/meetings` `/admin/requests` に対して `getByRole('main')` 200 + 主要 button 1 つの click までを検証する想定。
- `(admin)/layout.tsx` には **書き込まない**（task-15 確定済み・read-only）。

### §0.8 用語（admin 文脈で頻出）

| 用語 | 定義 |
|------|------|
| Tag Queue | フォーム回答から派生したタグ候補のレビュー待ち列。status: `queued` → `reviewing` → `resolved` / `rejected` / `dlq` |
| DLQ (Dead Letter Queue) | 自動処理が再試行上限に達したアイテム。手動確認 + manual resolve 必須 |
| Meeting | 月次会等の開催日エンティティ。`heldOn` 日付 + `title` + `location` + `capacity?` |
| Attendance | meeting に紐づく出席記録（read-only 表示。MVP では CSV upload なし） |
| Request | visibility 変更 / 削除申請の統合キュー（`/admin/requests`）。kind: `visibility` / `delete` |
| Decision | resolve action の引数（`accept` / `reject`）。reason は **必須** （phase-3 §3.2） |

### §0.9 画面の概念（layout pattern）

- **`/admin/tags`（タグキュー）**: pattern = **Split Layout（左 List + 右 Detail/Form）**。左カラムに `TagsQueueList`（status filter chips + 仮想スクロール無しの通常 list）、右カラムに選択中アイテムの `TagsResolveForm`（confirm/reject Radio + reason textarea + submit Button）。プロトタイプ `AdminTagsPage` の構成を踏襲しつつ reason 必須化（仕様 11-admin §タグ運用）。
- **`/admin/meetings`（開催日 CRUD）**: pattern = **DataTable + Modal Form（admin sidebar 派生）**。上部に "新規開催日" Button + sort toggle、中央に `MeetingsTable`（heldOn / title / location / capacity / 出席数 / actions）、行クリックまたは "編集" で `MeetingFormModal` が開く。プロトタイプ未掲載のため admin sidebar の DataTable+Modal パターンを派生適用（phase-3 §3.1）。カレンダー UI は採用しない。
- **`/admin/requests`（依頼キュー）**: pattern = **Queue + Detail Panel + Action Bar**。左に kind/status filter 付き `RequestsQueueList`、右に選択 request の `RequestDetailPanel`（identity / 申請理由 / 関連 audit 抜粋）+ 下固定の `RequestActionBar`（accept / reject + reason textarea）。プロトタイプ未掲載のため admin sidebar の Queue+Detail+ActionBar パターンを派生適用。bulk 採否は **作らない**。

### §0.10 競合回避（共通 layout 確定担当 = task-15）

> **task-15 が `(admin)/layout.tsx` を main にマージするまで本 task は着手しない**。layout の `requireAdmin` server guard と `AdminSidebar` aria-current 判定が確定していないと、本 task の sub-route page.tsx 群が SSR で破綻する。

| ファイル | task-15 | task-16（本 task） | task-17 | 解決方針 |
|---------|--------|---------|---------|---------|
| `apps/web/src/app/(admin)/layout.tsx` | M（確定担当） | **R（編集禁止）** | R | task-15 の merge 後に rebase。conflict 出たら task-15 側を正とする |
| `apps/web/src/lib/api/admin.ts` | C（base + admin） | M（`tags / meetings / requests / sync` key 追記） | M（`schema / identityConflicts / audit` 追記） | object key の **追加のみ**。再ソート禁止 |
| `apps/web/src/features/admin/components/index.ts` | M | M（追記） | M（追記） | 行追記のみ。task-17 と alphabetical sort で衝突しないよう **末尾追記** に統一 |
| OKLch tokens（`@theme`） | R | R | R | task-09 確定。本 task で編集しない |

警告: task-15 W5 完了前に着手すると、`(admin)/layout.tsx` 不在で page.tsx の routing が 404 化する。`adminClient` の base 雛形が無い状態で関数追記すると import 解決に失敗する。**task-15 完了確認後に着手** すること。

### §0.11 W（Wave）分割

| Wave | 内容 | gate |
|------|------|------|
| W1 | task-15 W5 通過確認（`(admin)/layout.tsx` + `adminClient` base が main にあること） | これが green でなければ着手しない |
| W2 | `_tags/*` 実装 + `adminClient.tags.\*` 接続 + `/admin/tags/page.tsx` | tags SSR 200 |
| W3 | `_meetings/*` + `adminClient.meetings.\*` + `MeetingFormModal` 双方向 + `/admin/meetings/page.tsx` | meetings CRUD 動作 |
| W4 | `_requests/*` + `adminClient.requests.\*` + `RequestActionBar` + `/admin/requests/page.tsx` | requests resolve 動作 |
| W5 | jest-axe / vitest / 手動 smoke 通過 | task-18 引き渡し |

### §0.12 a11y / i18n / token の現場ルール

- **List + Detail split**: list は `role="list"`、各行は `role="listitem"` + `<button>` 化、選択中は `aria-selected="true"`。Detail panel は `aria-live="polite"`。
- **Modal Form**: `MeetingFormModal` は Radix Dialog 風 primitive を採用（task-10）。`aria-labelledby` + 初期 focus は `title` input + `Esc` 閉じ。
- **Required textarea**: `<label>` + `aria-required="true"` + `aria-describedby` でエラー文を関連付け。submit Button は `disabled` 属性で blur しない（focus 維持）。
- **チップ tone**: queued=info / reviewing=warning / resolved=success / rejected=danger / dlq=danger（outline）。色だけで判別させない（テキスト併記）。
- **JST 表示**: meetings の `heldOn` は `Asia/Tokyo` で `YYYY-MM-DD (E)` 形式。
- **token**: `Banner` `Badge` の tone は token 直結（`bg-info-soft text-info` 等）。HEX 0 件。

### §0.13 想定エラーパターン

| 症状 | 想定原因 | 対処 |
|------|---------|------|
| tags resolve が 400 | reason 空 | submit-disable + textarea required |
| meeting create が 409 | 同日同時刻重複 | API 側で 409 を返す前提、UI は banner で reason 表示 |
| request resolve が 401 | session 切れ | layout の `requireAdmin` に re-login redirect 任せ |
| meetings export.csv 押下で破壊 | 本 task 範囲外の機能呼び出し | meetings page では export Button を表示しない（task-15 / phase-3 整合） |
| `adminClient.tags` 不在 | task-15 W1 未完 | task-15 base client 雛形が main にあることを `git log` で確認してから着手 |
| `responses-sync` 多重押下 | "再同期" Button の連打 | `useTransition` + pending で disable、tooltip "同期中…" |
| meetings 詳細遷移が未定義 | 本 task は table のみ | drawer / detail page は MVP 範囲外。row click は編集 modal を直接開く |

### §0.14 phase-1..3 / CLAUDE.md からの根拠引用

- phase-1 §3.3: `/admin/tags` `/admin/meetings` `/admin/requests` の endpoint は tags-queue.ts / meetings.ts / requests.ts / responses-sync.ts に閉じる。
- phase-2 §5.2: 工数 1.25 人日。task-15 layout merge 後に task-17 と並列実行可能。
- phase-3 §3.1: meetings / requests はプロトタイプ未掲載。admin sidebar の DataTable+Modal / Queue+Detail+ActionBar パターンを派生適用。
- phase-3 §3.2: tags resolve / requests resolve の reason は MVP で必須化（仕様 11-admin §タグ運用 / §依頼処理）。
- CLAUDE.md「重要な不変条件」§5: D1 直アクセス禁止。`adminClient` 経由のみ。
- CLAUDE.md「重要な不変条件」§7: MVP では Google Form 再回答が本人更新の正規経路。requests delete 申請は admin 側で承認するのみ。

### §0.15 セキュリティ前提

- **`requireAdmin` server guard**: layout 任せ。本 task の page.tsx 群は別 guard を持たない。
- **resolve action の audit**: tags / requests の resolve 時、API 側で `actorId / decision / reason` が audit log に書かれる前提。client は OK レスポンス受領後に list を再フェッチする。
- **PII 表示**: requests の identity ブロックでも `responseEmail` は masked（`a***@example.com`）。
- **CSRF**: state-changing 全 endpoint で `credentials: 'include'`、Origin は API 側で検査済み。

---

## 0. ヘッダー

| 項目 | 値 |
|------|-----|
| task ID | task-16 |
| task name | admin-tags-meetings-requests |
| 責務 dir | `07-screens-admin` |
| 工数見積 | 1.25 人日（phase-2 §5.2） |
| 主担当 | Frontend |
| 主要 deliverable | `/admin/tags` + `/admin/meetings` + `/admin/requests` の 3 画面（queue + CRUD + 採否 action） |
| 直接依存 | task-09, task-10, task-15（`(admin)/layout.tsx` 確定） |
| 並列可 | task-15, task-17 |
| 後続 | task-18（regression / Playwright smoke） |
| 関連 spec | `docs/00-getting-started-manual/specs/11-admin-management.md` §タグ運用 / §依頼処理 |

### 0.1 画面とプロトタイプ掲載状況

| 画面 | プロトタイプ jsx 掲載 | 設計指針 |
|------|---------------------|---------|
| `/admin/tags` | 部分掲載（`AdminTagsPage` の queue list + accept/reject） | プロトタイプ忠実、ただし採否 reason 入力を MVP で必須化（仕様 11-admin §タグ運用） |
| `/admin/meetings` | 未掲載 | admin sidebar の DataTable + Modal Form の派生パターンで再構成 |
| `/admin/requests` | 未掲載 | admin sidebar の Queue + Detail panel + Action bar の派生パターンで再構成 |

### 0.2 並列実行時の競合対策

| ファイル | task-15 | task-16 | task-17 | 解決方針 |
|---------|--------|---------|---------|---------|
| `apps/web/src/lib/api/admin.ts` | C（base + admin） | M（add tags/meetings/requests fns） | M | `adminClient` object に key を追加するだけ、競合しても merge 容易 |
| `apps/web/src/features/admin/components/index.ts` | M | M | M | 追記方式 |

---

## 1. ゴール / 非ゴール

### 1.1 ゴール

| ID | 条件 | 検証方法 |
|----|------|---------|
| G-01 | `/admin/tags` が SSR 200。queue 一覧（status: queued/reviewing/resolved/rejected/dlq でフィルタ可） + 採否 action が動作 | Playwright + vitest |
| G-02 | `/admin/meetings` が SSR 200。一覧テーブル + Modal Form（新規作成 / 既存編集）が動作 | Playwright + vitest |
| G-03 | `/admin/requests` が SSR 200。visibility / delete 申請を統合キューで表示 + 採否 action 動作 | Playwright + vitest |
| G-04 | `apps/api` の `/admin/tags/queue`, `/admin/tags/queue/:id/resolve`, `/admin/meetings`, `/admin/meetings/:id`, `/admin/requests`, `/admin/requests/:id/decision` を adapter 経由で接続 | client mock test |
| G-05 | OKLch tokens のみ使用、HEX 直書き 0 件 | `pnpm verify-design-tokens` |
| G-06 | jest-axe critical 0 件 | a11y test |
| G-07 | reason / note 入力 textarea が必須項目に応じて submit-disable される | vitest |
| G-08 | `pnpm typecheck` / `pnpm lint` が green | CI |

### 1.2 非ゴール

- 新 admin endpoint の追加（`apps/api` を変更しない）
- meetings の出席者 CSV upload 機能（既存 `apps/api/src/routes/admin/attendance.ts` は read のみ表示）
- tags 採用後の自動 backfill 機能（`apps/api` 側 workflow 任せ）
- requests の bulk 採否（行単位 action のみ。bulk action bar は **作らない**）
- カレンダー UI（`react-big-calendar` 等の外部 lib 不採用。table + 開催日昇順表示で十分）

---

## 2. 変更対象ファイル表

| 区分 | path | 役割 |
|------|------|------|
| C | `apps/web/src/app/(admin)/admin/tags/page.tsx` | server component, `/admin/tags/queue` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/meetings/page.tsx` | server component, `/admin/meetings` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/requests/page.tsx` | server component, `/admin/requests` 初期フェッチ |
| C | `apps/web/src/features/admin/components/_tags/TagsQueueList.tsx` | 左 list + 右 detail panel（split layout） |
| C | `apps/web/src/features/admin/components/_tags/TagsQueueItem.tsx` | list の 1 行 |
| C | `apps/web/src/features/admin/components/_tags/TagsResolveForm.tsx` | confirm/reject の form |
| C | `apps/web/src/features/admin/components/_meetings/MeetingsTable.tsx` | DataTable |
| C | `apps/web/src/features/admin/components/_meetings/MeetingFormModal.tsx` | 新規 / 編集 modal |
| C | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | client state container |
| C | `apps/web/src/features/admin/components/_requests/RequestsQueueList.tsx` | 統合 queue（visibility/delete） |
| C | `apps/web/src/features/admin/components/_requests/RequestDetailPanel.tsx` | 採否 form + 申請 diff |
| C | `apps/web/src/lib/api/admin-tags.ts` | tags 関連 client fns |
| C | `apps/web/src/lib/api/admin-meetings.ts` | meetings 関連 client fns |
| C | `apps/web/src/lib/api/admin-requests.ts` | requests 関連 client fns |
| C | `apps/web/src/features/admin/components/__tests__/TagsQueueList.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/TagsResolveForm.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/MeetingsTable.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/MeetingFormModal.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/RequestsQueueList.test.tsx` | vitest |
| R | `apps/api/src/routes/admin/tags-queue.ts` | response shape 正本 |
| R | `apps/api/src/routes/admin/meetings.ts` | response shape 正本 |
| R | `apps/api/src/routes/admin/requests.ts` | response shape 正本 |

---

## 3. 共通レイアウトとプロトタイプ未掲載画面の派生ルール

`(admin)/layout.tsx` は task-15 で確定済み（`AdminSidebar` + content 2 カラム grid）。本 task の 3 画面は次のパターンに従って組み立てる:

| 画面 | パターン | 構成 primitive |
|------|---------|---------------|
| `/admin/tags` | Queue split layout | `AdminPageHeader` + `Tabs`（status filter）+ `TagsQueueList`（左 list / 右 detail）+ `TagsResolveForm` |
| `/admin/meetings` | Table + Modal Form | `AdminPageHeader` + `Button`（新規）+ `MeetingsTable` + `MeetingFormModal` |
| `/admin/requests` | Queue + Detail panel | `AdminPageHeader` + `Tabs`（種別 filter）+ `RequestsQueueList`（左 list / 右 detail）+ action bar |

OKLch / typography / spacing は phase-3 §3.3 のルールを継承:

- 状態色: `--ubm-color-info` / `-success` / `-warning` / `-danger`
- queue badge: status に応じた tone（queued=info / reviewing=warning / resolved=success / rejected=neutral / dlq=danger）
- HEX 直書き禁止
- 余白: 4px base、section gap=24px (`gap-6`)、card padding=20px (`p-5`)
- table thead: `text-xs uppercase tracking-wider text-[var(--ubm-color-text-3)]`

---

## 4. 画面 1: `/admin/tags`

### 4.1 構成

```
[AdminPageHeader: "ADMIN / TAGS" / "タグキュー"]
[Tabs: queued | reviewing | resolved | rejected | dlq]
[TagsQueueList]
  ├ 左: 候補一覧（list）
  └ 右: 詳細 + TagsResolveForm（confirm / reject）
```

### 4.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/tags/page.tsx
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { TagsQueueShell } from "@/features/admin/components/_tags/TagsQueueShell";
import { fetchAdminTagsQueue } from "@/lib/api/admin-tags";

export const dynamic = "force-dynamic";

export interface AdminTagsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminTagsPage({ searchParams }: AdminTagsPageProps) {
  const sp = await searchParams;
  const status = (sp.status ?? "queued") as "queued" | "reviewing" | "resolved" | "rejected" | "dlq";
  const initial = await fetchAdminTagsQueue(status);

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN / TAGS"
        title="タグキュー"
        description="未承認のタグ候補をレビューし、採用または却下します。"
      />
      <div className="flex flex-col gap-4 px-8 py-6">
        <TagsQueueShell initial={initial} initialStatus={status} />
      </div>
    </div>
  );
}
```

### 4.3 TagsQueueShell（client）

```tsx
// apps/web/src/features/admin/components/_tags/TagsQueueShell.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { TagsQueueList } from "./TagsQueueList";
import { TagsResolveForm } from "./TagsResolveForm";
import type { AdminTagQueueListResponse, AdminTagQueueItem } from "@/lib/api/admin-tags";

const STATUSES = [
  { value: "queued",    label: "未対応" },
  { value: "reviewing", label: "確認中" },
  { value: "resolved",  label: "採用済" },
  { value: "rejected",  label: "却下" },
  { value: "dlq",       label: "DLQ" },
] as const;

export interface TagsQueueShellProps {
  initial: AdminTagQueueListResponse;
  initialStatus: (typeof STATUSES)[number]["value"];
}

export function TagsQueueShell({ initial, initialStatus }: TagsQueueShellProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<AdminTagQueueItem | null>(initial.items[0] ?? null);

  const switchStatus = (v: string) => {
    const next = new URLSearchParams(sp);
    next.set("status", v);
    startTransition(() => router.replace(`/admin/tags?${next.toString()}`));
  };

  return (
    <>
      <Tabs
        items={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        value={initialStatus}
        onChange={switchStatus}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <TagsQueueList items={initial.items} selectedId={selected?.queueId ?? null} onSelect={setSelected} />
        {selected ? (
          <TagsResolveForm
            item={selected}
            onResolved={() => {
              setSelected(null);
              router.refresh();
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--ubm-color-border)] p-10 text-center text-sm text-[var(--ubm-color-text-2)]">
            左の一覧から候補を選択してください。
          </div>
        )}
      </div>
    </>
  );
}
```

### 4.4 TagsQueueList / TagsQueueItem

```tsx
// apps/web/src/features/admin/components/_tags/TagsQueueList.tsx
"use client";
import { TagsQueueItem } from "./TagsQueueItem";
import type { AdminTagQueueItem } from "@/lib/api/admin-tags";

export interface TagsQueueListProps {
  items: AdminTagQueueItem[];
  selectedId: string | null;
  onSelect: (item: AdminTagQueueItem) => void;
}

export function TagsQueueList({ items, selectedId, onSelect }: TagsQueueListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6 text-sm text-[var(--ubm-color-text-2)]">
        該当する候補はありません。
      </div>
    );
  }

  return (
    <ul
      role="listbox"
      aria-label="タグ候補一覧"
      className="flex max-h-[640px] flex-col gap-2 overflow-y-auto rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-2"
    >
      {items.map((it) => (
        <TagsQueueItem
          key={it.queueId}
          item={it}
          selected={it.queueId === selectedId}
          onClick={() => onSelect(it)}
        />
      ))}
    </ul>
  );
}
```

```tsx
// apps/web/src/features/admin/components/_tags/TagsQueueItem.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import type { AdminTagQueueItem } from "@/lib/api/admin-tags";

const statusTone = {
  queued:    "info",
  reviewing: "warning",
  resolved:  "success",
  rejected:  "neutral",
  dlq:       "danger",
} as const;

export interface TagsQueueItemProps {
  item: AdminTagQueueItem;
  selected: boolean;
  onClick: () => void;
}

export function TagsQueueItem({ item, selected, onClick }: TagsQueueItemProps) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition ${
          selected
            ? "bg-[var(--ubm-color-primary-soft)] text-[var(--ubm-color-primary-strong)]"
            : "hover:bg-[var(--ubm-color-bg)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{item.candidateLabel}</span>
          <Badge tone={statusTone[item.status]}>{item.status}</Badge>
        </div>
        <span className="text-xs text-[var(--ubm-color-text-2)]">
          target: {item.targetMemberId.slice(0, 8)} / by {item.proposedByEmail ?? "system"}
        </span>
      </button>
    </li>
  );
}
```

### 4.5 TagsResolveForm

```tsx
// apps/web/src/features/admin/components/_tags/TagsResolveForm.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resolveTagQueue } from "@/lib/api/admin-tags";
import type { AdminTagQueueItem } from "@/lib/api/admin-tags";

export interface TagsResolveFormProps {
  item: AdminTagQueueItem;
  onResolved: () => void;
}

export function TagsResolveForm({ item, onResolved }: TagsResolveFormProps) {
  const [tagCodes, setTagCodes] = useState(item.candidateLabel);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"confirmed" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (action: "confirmed" | "rejected") => {
    setBusy(action);
    setError(null);
    try {
      if (action === "confirmed") {
        const codes = tagCodes.split(/[,\s]+/).filter(Boolean);
        if (codes.length === 0) {
          setError("採用するタグコードを 1 件以上入力してください。");
          return;
        }
        await resolveTagQueue(item.queueId, { action: "confirmed", tagCodes: codes });
      } else {
        if (!reason.trim()) {
          setError("却下理由を入力してください。");
          return;
        }
        await resolveTagQueue(item.queueId, { action: "rejected", reason: reason.trim() });
      }
      onResolved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold">候補の詳細</h2>
        <p className="mt-1 text-sm text-[var(--ubm-color-text-2)]">
          target memberId: <span className="font-mono">{item.targetMemberId}</span>
        </p>
      </header>

      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
        <dt>候補ラベル</dt><dd className="font-mono">{item.candidateLabel}</dd>
        <dt>提案者</dt><dd>{item.proposedByEmail ?? "system"}</dd>
        <dt>status</dt><dd>{item.status}</dd>
      </dl>

      {item.status === "queued" || item.status === "reviewing" ? (
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">採用するタグコード（カンマ / 空白区切り）</span>
            <input
              type="text"
              value={tagCodes}
              onChange={(e) => setTagCodes(e.target.value)}
              className="rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">却下理由（却下時のみ必須）</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-3 py-2 text-sm"
            />
          </label>
          {error ? <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="primary" disabled={busy !== null} onClick={() => submit("confirmed")}>
              {busy === "confirmed" ? "採用中…" : "採用"}
            </Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => submit("rejected")}>
              {busy === "rejected" ? "却下中…" : "却下"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--ubm-color-text-2)]">この候補は完了済みです。</p>
      )}
    </section>
  );
}
```

---

## 5. 画面 2: `/admin/meetings`

### 5.1 構成（プロトタイプ未掲載 → 派生ルール）

`/admin/meetings` は prototype 未掲載のため、admin sidebar の **Table + Modal Form パターン**で構成する:

```
[AdminPageHeader: "ADMIN / MEETINGS" / "開催日"]  [Button: 新規]
[MeetingsTable]
[MeetingFormModal]                 ← row click または「新規」で開く
```

`MeetingsTable` の列: 開催日 / ラベル / メモ / 出席者数（attendance 連携）/ 操作。

### 5.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/meetings/page.tsx
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { MeetingsClientShell } from "@/features/admin/components/_meetings/MeetingsClientShell";
import { fetchAdminMeetings } from "@/lib/api/admin-meetings";

export const dynamic = "force-dynamic";

export default async function AdminMeetingsPage() {
  const initial = await fetchAdminMeetings();
  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN / MEETINGS"
        title="開催日"
        description="支部会の開催日と参加者を管理します。"
      />
      <div className="flex flex-col gap-4 px-8 py-6">
        <MeetingsClientShell initial={initial} />
      </div>
    </div>
  );
}
```

### 5.3 MeetingsClientShell

```tsx
// apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MeetingsTable } from "./MeetingsTable";
import { MeetingFormModal } from "./MeetingFormModal";
import type { AdminMeeting, AdminMeetingListResponse } from "@/lib/api/admin-meetings";

export interface MeetingsClientShellProps {
  initial: AdminMeetingListResponse;
}

export function MeetingsClientShell({ initial }: MeetingsClientShellProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminMeeting | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end">
        <Button variant="primary" onClick={() => setCreating(true)}>
          新規作成
        </Button>
      </div>

      <MeetingsTable items={initial.items} onEdit={(m) => setEditing(m)} />

      {creating ? (
        <MeetingFormModal
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      ) : null}

      {editing ? (
        <MeetingFormModal
          mode="edit"
          meeting={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
```

### 5.4 MeetingsTable

```tsx
// apps/web/src/features/admin/components/_meetings/MeetingsTable.tsx
"use client";
import type { AdminMeeting } from "@/lib/api/admin-meetings";

export interface MeetingsTableProps {
  items: AdminMeeting[];
  onEdit: (m: AdminMeeting) => void;
}

export function MeetingsTable({ items, onEdit }: MeetingsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-8 text-center text-sm text-[var(--ubm-color-text-2)]">
        登録されている開催日はありません。
      </div>
    );
  }
  return (
    <table className="w-full overflow-hidden rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] text-sm">
      <thead className="border-b border-[var(--ubm-color-border)] text-xs uppercase tracking-wider text-[var(--ubm-color-text-3)]">
        <tr>
          <th className="p-3 text-left">開催日</th>
          <th className="p-3 text-left">ラベル</th>
          <th className="p-3 text-left">メモ</th>
          <th className="p-3 text-right">出席者</th>
          <th className="w-24 p-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr key={m.meetingId} className="border-t border-[var(--ubm-color-border)] last:border-b-0">
            <td className="p-3 font-mono text-xs">{m.heldOn}</td>
            <td className="p-3">{m.label}</td>
            <td className="p-3 text-[var(--ubm-color-text-2)]">{m.note ?? "—"}</td>
            <td className="p-3 text-right font-mono text-xs">{m.attendeesCount ?? 0}</td>
            <td className="p-3 text-right">
              <button
                type="button"
                className="text-xs font-medium text-[var(--ubm-color-primary)] hover:underline"
                onClick={() => onEdit(m)}
              >
                編集
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 5.5 MeetingFormModal

```tsx
// apps/web/src/features/admin/components/_meetings/MeetingFormModal.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createMeeting, updateMeeting } from "@/lib/api/admin-meetings";
import type { AdminMeeting } from "@/lib/api/admin-meetings";

export type MeetingFormModalProps =
  | { mode: "create"; meeting?: undefined; onClose: () => void; onSaved: () => void }
  | { mode: "edit";   meeting: AdminMeeting; onClose: () => void; onSaved: () => void };

export function MeetingFormModal(props: MeetingFormModalProps) {
  const init = props.mode === "edit" ? props.meeting : { heldOn: "", label: "", note: "" };
  const [heldOn, setHeldOn] = useState(init.heldOn);
  const [label, setLabel] = useState(init.label);
  const [note, setNote] = useState(init.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(heldOn) && label.trim().length > 0;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      if (props.mode === "create") {
        await createMeeting({ heldOn, label: label.trim(), note: note.trim() || null });
      } else {
        await updateMeeting(props.meeting.meetingId, { heldOn, label: label.trim(), note: note.trim() || null });
      }
      props.onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={props.onClose} ariaLabel={props.mode === "create" ? "開催日の新規作成" : "開催日の編集"}>
      <header className="border-b border-[var(--ubm-color-border)] px-6 py-4">
        <h2 className="text-base font-semibold">
          {props.mode === "create" ? "開催日を追加" : "開催日を編集"}
        </h2>
      </header>
      <form
        className="flex flex-col gap-4 px-6 py-5"
        onSubmit={(e) => { e.preventDefault(); void submit(); }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">開催日（YYYY-MM-DD）</span>
          <input
            type="date"
            required
            value={heldOn}
            onChange={(e) => setHeldOn(e.target.value)}
            className="rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">ラベル</span>
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">メモ</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-3 py-2 text-sm"
          />
        </label>
        {error ? <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">{error}</p> : null}
        <footer className="flex justify-end gap-2 border-t border-[var(--ubm-color-border)] pt-4">
          <Button variant="ghost" type="button" onClick={props.onClose} disabled={busy}>キャンセル</Button>
          <Button variant="primary" type="submit" disabled={!valid || busy}>
            {busy ? "保存中…" : "保存"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
```

---

## 6. 画面 3: `/admin/requests`

### 6.1 構成（プロトタイプ未掲載 → 派生ルール）

申請の種類は `visibility-change` と `delete` の 2 種。`apps/api/src/routes/admin/requests.ts` の response shape に従って統合 queue を構成する:

```
[AdminPageHeader: "ADMIN / REQUESTS" / "依頼キュー"]
[Tabs: pending | approved | rejected]
[grid 2col]
  ├ 左: RequestsQueueList（種別・申請者・受付日）
  └ 右: RequestDetailPanel（変更内容 diff + 採否 form）
```

### 6.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/requests/page.tsx
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { RequestsQueueShell } from "@/features/admin/components/_requests/RequestsQueueShell";
import { fetchAdminRequests } from "@/lib/api/admin-requests";

export const dynamic = "force-dynamic";

export interface AdminRequestsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const sp = await searchParams;
  const status = (sp.status ?? "pending") as "pending" | "approved" | "rejected";
  const initial = await fetchAdminRequests(status);

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN / REQUESTS"
        title="依頼キュー"
        description="会員からの公開範囲変更・削除依頼を裁定します。"
      />
      <div className="flex flex-col gap-4 px-8 py-6">
        <RequestsQueueShell initial={initial} initialStatus={status} />
      </div>
    </div>
  );
}
```

### 6.3 RequestsQueueShell（client）

```tsx
// apps/web/src/features/admin/components/_requests/RequestsQueueShell.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { RequestsQueueList } from "./RequestsQueueList";
import { RequestDetailPanel } from "./RequestDetailPanel";
import type { AdminRequest, AdminRequestListResponse } from "@/lib/api/admin-requests";

const STATUSES = [
  { value: "pending",  label: "未対応" },
  { value: "approved", label: "承認済" },
  { value: "rejected", label: "却下" },
] as const;

export interface RequestsQueueShellProps {
  initial: AdminRequestListResponse;
  initialStatus: (typeof STATUSES)[number]["value"];
}

export function RequestsQueueShell({ initial, initialStatus }: RequestsQueueShellProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [selected, setSelected] = useState<AdminRequest | null>(initial.items[0] ?? null);

  const switchStatus = (v: string) => {
    const next = new URLSearchParams(sp);
    next.set("status", v);
    router.replace(`/admin/requests?${next.toString()}`);
  };

  return (
    <>
      <Tabs
        items={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        value={initialStatus}
        onChange={switchStatus}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
        <RequestsQueueList
          items={initial.items}
          selectedId={selected?.requestId ?? null}
          onSelect={setSelected}
        />
        {selected ? (
          <RequestDetailPanel
            request={selected}
            onResolved={() => {
              setSelected(null);
              router.refresh();
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--ubm-color-border)] p-10 text-center text-sm text-[var(--ubm-color-text-2)]">
            左の一覧から申請を選択してください。
          </div>
        )}
      </div>
    </>
  );
}
```

### 6.4 RequestsQueueList

```tsx
// apps/web/src/features/admin/components/_requests/RequestsQueueList.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import type { AdminRequest } from "@/lib/api/admin-requests";

export interface RequestsQueueListProps {
  items: AdminRequest[];
  selectedId: string | null;
  onSelect: (r: AdminRequest) => void;
}

const kindLabel: Record<AdminRequest["kind"], string> = {
  "visibility-change": "公開範囲変更",
  "delete":            "削除依頼",
};

export function RequestsQueueList({ items, selectedId, onSelect }: RequestsQueueListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6 text-sm text-[var(--ubm-color-text-2)]">
        対象の申請はありません。
      </div>
    );
  }
  return (
    <ul
      role="listbox"
      aria-label="依頼一覧"
      className="flex max-h-[640px] flex-col gap-2 overflow-y-auto rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-2"
    >
      {items.map((r) => (
        <li key={r.requestId} role="option" aria-selected={r.requestId === selectedId}>
          <button
            type="button"
            onClick={() => onSelect(r)}
            className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition ${
              r.requestId === selectedId
                ? "bg-[var(--ubm-color-primary-soft)] text-[var(--ubm-color-primary-strong)]"
                : "hover:bg-[var(--ubm-color-bg)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{kindLabel[r.kind]}</span>
              <Badge tone={r.kind === "delete" ? "danger" : "info"}>{r.kind}</Badge>
            </div>
            <span className="text-xs text-[var(--ubm-color-text-2)]">
              {r.requesterEmail} / {r.createdAt}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### 6.5 RequestDetailPanel

```tsx
// apps/web/src/features/admin/components/_requests/RequestDetailPanel.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { decideRequest } from "@/lib/api/admin-requests";
import type { AdminRequest } from "@/lib/api/admin-requests";

export interface RequestDetailPanelProps {
  request: AdminRequest;
  onResolved: () => void;
}

export function RequestDetailPanel({ request, onResolved }: RequestDetailPanelProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !reason.trim()) {
      setError("却下理由を入力してください。");
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      await decideRequest(request.requestId, { decision, reason: reason.trim() || null });
      onResolved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const editable = request.status === "pending";

  return (
    <section className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold">申請の詳細</h2>
        <p className="mt-1 text-sm text-[var(--ubm-color-text-2)]">
          requestId: <span className="font-mono">{request.requestId}</span>
        </p>
      </header>

      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
        <dt>種別</dt><dd>{request.kind}</dd>
        <dt>申請者</dt><dd>{request.requesterEmail}</dd>
        <dt>受付日時</dt><dd className="font-mono text-xs">{request.createdAt}</dd>
        <dt>status</dt><dd>{request.status}</dd>
      </dl>

      {request.payload ? (
        <details className="mt-4 rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] p-3 text-xs">
          <summary className="cursor-pointer font-medium">payload</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all font-mono">
            {JSON.stringify(request.payload, null, 2)}
          </pre>
        </details>
      ) : null}

      {editable ? (
        <div className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">却下理由（却下時のみ必須）</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-3 py-2 text-sm"
            />
          </label>
          {error ? <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="primary" disabled={busy !== null} onClick={() => submit("approved")}>
              {busy === "approved" ? "承認中…" : "承認"}
            </Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => submit("rejected")}>
              {busy === "rejected" ? "却下中…" : "却下"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--ubm-color-text-2)]">この申請は完了済みです。</p>
      )}
    </section>
  );
}
```

---

## 7. データフロー

### 7.1 admin-tags.ts

```ts
// apps/web/src/lib/api/admin-tags.ts
import { z } from "zod";
import { authedFetch } from "./_authed-fetch";
import { env } from "@/lib/env";

const apiBase = () => env.API_BASE_URL;

export const AdminTagQueueItemZ = z.object({
  queueId: z.string(),
  targetMemberId: z.string(),
  candidateLabel: z.string(),
  proposedByEmail: z.string().nullable(),
  status: z.enum(["queued", "reviewing", "resolved", "rejected", "dlq"]),
  createdAt: z.string(),
});
export const AdminTagQueueListZ = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(AdminTagQueueItemZ),
});
export type AdminTagQueueItem = z.infer<typeof AdminTagQueueItemZ>;
export type AdminTagQueueListResponse = z.infer<typeof AdminTagQueueListZ>;

export async function fetchAdminTagsQueue(status: AdminTagQueueItem["status"]) {
  const res = await authedFetch(`${apiBase()}/admin/tags/queue?status=${status}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`tags/queue ${res.status}`);
  return AdminTagQueueListZ.parse(await res.json());
}

export type ResolveBody =
  | { action: "confirmed"; tagCodes: string[] }
  | { action: "rejected"; reason: string };

export async function resolveTagQueue(queueId: string, body: ResolveBody) {
  const res = await authedFetch(`${apiBase()}/admin/tags/queue/${encodeURIComponent(queueId)}/resolve`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) throw new Error(`tags/queue resolve ${res.status}`);
  return z.object({ ok: z.literal(true), result: z.unknown() }).parse(await res.json());
}
```

### 7.2 admin-meetings.ts

```ts
// apps/web/src/lib/api/admin-meetings.ts
import { z } from "zod";
import { authedFetch } from "./_authed-fetch";
import { env } from "@/lib/env";
const apiBase = () => env.API_BASE_URL;

export const AdminMeetingZ = z.object({
  meetingId: z.string(),
  heldOn: z.string(),
  label: z.string(),
  note: z.string().nullable(),
  attendeesCount: z.number().int().nonnegative().optional(),
});
export const AdminMeetingListZ = z.object({ items: z.array(AdminMeetingZ) });
export type AdminMeeting = z.infer<typeof AdminMeetingZ>;
export type AdminMeetingListResponse = z.infer<typeof AdminMeetingListZ>;

export async function fetchAdminMeetings() {
  const res = await authedFetch(`${apiBase()}/admin/meetings`, { cache: "no-store" });
  if (!res.ok) throw new Error(`meetings ${res.status}`);
  return AdminMeetingListZ.parse(await res.json());
}

export async function createMeeting(body: { heldOn: string; label: string; note: string | null }) {
  const res = await authedFetch(`${apiBase()}/admin/meetings`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) throw new Error(`meetings create ${res.status}`);
  return z.object({ id: z.string() }).parse(await res.json());
}

export async function updateMeeting(meetingId: string, body: { heldOn: string; label: string; note: string | null }) {
  const res = await authedFetch(`${apiBase()}/admin/meetings/${encodeURIComponent(meetingId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) throw new Error(`meetings update ${res.status}`);
  return z.object({ ok: z.literal(true) }).parse(await res.json());
}
```

### 7.3 admin-requests.ts

```ts
// apps/web/src/lib/api/admin-requests.ts
import { z } from "zod";
import { authedFetch } from "./_authed-fetch";
import { env } from "@/lib/env";
const apiBase = () => env.API_BASE_URL;

export const AdminRequestZ = z.object({
  requestId: z.string(),
  kind: z.enum(["visibility-change", "delete"]),
  status: z.enum(["pending", "approved", "rejected"]),
  requesterEmail: z.string(),
  createdAt: z.string(),
  payload: z.unknown().nullable(),
});
export const AdminRequestListZ = z.object({ items: z.array(AdminRequestZ) });
export type AdminRequest = z.infer<typeof AdminRequestZ>;
export type AdminRequestListResponse = z.infer<typeof AdminRequestListZ>;

export async function fetchAdminRequests(status: AdminRequest["status"]) {
  const res = await authedFetch(`${apiBase()}/admin/requests?status=${status}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`requests ${res.status}`);
  return AdminRequestListZ.parse(await res.json());
}

export async function decideRequest(
  requestId: string,
  body: { decision: "approved" | "rejected"; reason: string | null },
) {
  const res = await authedFetch(`${apiBase()}/admin/requests/${encodeURIComponent(requestId)}/decision`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) throw new Error(`requests decision ${res.status}`);
  return z.object({ ok: z.literal(true) }).parse(await res.json());
}
```

> 上記 `AdminTagQueueItemZ` / `AdminMeetingZ` / `AdminRequestZ` は UI 側 adapter 用 schema。`apps/api` 側の正本 Z は最小限の必須フィールドのみ含む可能性があるため、UI 側 schema は **safeParse → 失敗時は最低限のフィールドだけ抜き出して `console.warn`** という防御的取り扱いを `_authed-fetch.ts` の共通レスポンスハンドラに任せる（任意）。

---

## 8. テスト方針

### 8.1 vitest

| ファイル | 検証内容 |
|---------|---------|
| `TagsQueueList.test.tsx` | items=[] で empty 表示 / item クリックで `onSelect` 発火 / 選択行に `aria-selected="true"` |
| `TagsResolveForm.test.tsx` | 採用時 tagCodes 空 → submit-disable / 却下時 reason 空 → エラー表示 / 成功時 `onResolved` |
| `MeetingsTable.test.tsx` | items=[] で empty / 編集ボタンで `onEdit` 発火 / heldOn が `font-mono` |
| `MeetingFormModal.test.tsx` | heldOn 不正 / label 空 で submit-disable / create 成功で `onSaved` / API mock |
| `RequestsQueueList.test.tsx` | kind が `delete` の行に danger badge / 0 件で empty |
| `RequestDetailPanel.test.tsx` | pending → form 編集可 / 完了済 → 「完了済みです」 / 却下 reason 空でエラー |

### 8.2 Playwright（task-18 で実装、観点）

| ID | ステップ | 期待 |
|----|---------|------|
| P-16-01 | admin ログイン → `/admin/tags` | 200、Tabs 5 件、リスト表示 |
| P-16-02 | `/admin/meetings` | 200、新規ボタン、テーブル |
| P-16-03 | meetings 新規ボタン → modal 開 | role="dialog" 取得、入力 → 保存 |
| P-16-04 | `/admin/requests` | 200、Tabs 3 件、左 list / 右 detail |
| P-16-05 | requests 1 件選択 → 承認 | 反映後 list が再取得 |

### 8.3 a11y（jest-axe）

- 6 component すべてで violations.length=0
- `Tabs` は `role="tablist" / "tab" / "tabpanel"` をプリミティブ側で保証（task-10 で確定）
- modal は `role="dialog"` + focus trap（`Modal` primitive で保証）
- Form の label は input と関連付け（`htmlFor` または wrap）

---

## 9. ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/web lint
mise exec -- pnpm -F @ubm-hyogo/web build

# 単体テスト
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/features/admin/components/__tests__/TagsQueueList.test.tsx \
  src/features/admin/components/__tests__/TagsResolveForm.test.tsx \
  src/features/admin/components/__tests__/MeetingsTable.test.tsx \
  src/features/admin/components/__tests__/MeetingFormModal.test.tsx \
  src/features/admin/components/__tests__/RequestsQueueList.test.tsx

# dev server
mise exec -- pnpm -F @ubm-hyogo/web dev
# -> http://localhost:3000/admin/tags
# -> http://localhost:3000/admin/meetings
# -> http://localhost:3000/admin/requests

mise exec -- pnpm verify-design-tokens
mise exec -- pnpm -F @ubm-hyogo/web e2e -- --grep "P-16"
```

---

## 10. Definition of Done

- [ ] D-01: `/admin/tags` が SSR 200。queue list + Tabs（5 status）+ resolve form が機能
- [ ] D-02: `/admin/meetings` が SSR 200。CRUD modal + table が機能
- [ ] D-03: `/admin/requests` が SSR 200。統合 queue + Tabs（3 status）+ decision form が機能
- [ ] D-04: `/admin/tags/queue`（resolve 含む）/ `/admin/meetings`（CRUD）/ `/admin/requests`（decision 含む）を adapter 経由で接続
- [ ] D-05: `verify-design-tokens` green
- [ ] D-06: jest-axe critical violations 0
- [ ] D-07: vitest テスト（§8.1 の 6 ファイル）green
- [ ] D-08: AdminSidebar の active 表示が `/admin/tags` `/admin/meetings` `/admin/requests` で当たる
- [ ] D-09: 派生ルール（meetings: Table+Modal、requests: Queue+Detail）が phase-3 §3.1 の構成パターンに整合
- [ ] D-10: `apps/api` 側変更 0 行
- [ ] D-11: `pnpm typecheck` / `pnpm lint` green
- [ ] D-12: 8 admin 画面のうち task-16 担当 3 画面が auth gate 越え → 200 を Playwright で確認

---

## 11. 参考資料

- phase-1 §3.3 / phase-2 §1, §5.2 / phase-3 §1.2, §2.3, §3.1, §3.2
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `apps/api/src/routes/admin/tags-queue.ts` / `meetings.ts` / `requests.ts` / `responses-sync.ts` / `attendance.ts`
- `apps/api/src/routes/admin/tags-queue.test.ts` / `meetings.test.ts` / `requests.test.ts`
- `apps/web/src/components/layout/AdminSidebar.tsx`（task-09/10 確定済み）
- task-15（layout 確定 + dashboard / members）

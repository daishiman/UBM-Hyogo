---
name: ui-ux-admin-dashboard
description: UBM 兵庫支部会 admin 5 画面（dashboard / members / tags / schema / meetings）の UI/UX 仕様。役割・コンポーネント階層・state 管理・props contract・不変条件・Server/Client 境界を定義する。
slug: ui-ux-admin-dashboard
---

# UI/UX — Admin Dashboard 5 画面

> 本ドキュメントは UBM 兵庫支部会システム設計仕様の admin 配下 UI 仕様を定義する。
> 実装は Cloudflare Workers 上の Next.js App Router (`apps/web`)。
> 詳細出典: `docs/30-workflows/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/outputs/phase-02/admin-pages-design.md`, `phase-07/ac-matrix.md`, `phase-12/implementation-guide.md`

---

## 1. 全体構成

### 1.1 ルーティング

| パス | ファイル | 種別 |
| --- | --- | --- |
| `/admin` | `apps/web/app/(admin)/admin/page.tsx` | Server Component |
| `/admin/members` | `apps/web/app/(admin)/admin/members/page.tsx` | Server Component（list） + `MembersClient` |
| `/admin/tags` | `apps/web/app/(admin)/admin/tags/page.tsx` | Server Component + `TagQueuePanel` (Client) |
| `/admin/schema` | `apps/web/app/(admin)/admin/schema/page.tsx` | Server Component + `SchemaDiffPanel` (Client) |
| `/admin/meetings` | `apps/web/app/(admin)/admin/meetings/page.tsx` | Server Component + `MeetingPanel` (Client) |

すべて `export const dynamic = "force-dynamic"`（admin データはキャッシュしない）。

### 1.2 admin gate（共通レイアウト）

`apps/web/app/(admin)/layout.tsx`:

- `getSession()` が null → `redirect("/login?next=/admin")`
- `session.isAdmin !== true` → `redirect("/login?gate=forbidden")`
- 通過時のみ `AdminSidebar` + `<main class="admin-main">{children}</main>` を返す
- middleware.ts は配置しない（layout 内 auth() で完結、Edge cost 削減）

### 1.3 Server / Client 境界

| 役割 | 配置 |
| --- | --- |
| 初期 fetch | Server Component（`fetchAdmin()` を `cache: "no-store"` で呼ぶ） |
| mutation（PATCH/POST/DELETE） | Client Component（`apps/web/src/lib/admin/api.ts` の wrapper 経由） |
| 成功後の再取得 | `router.refresh()`（Next.js が Server Component を再実行） |

D1 や apps/api の repository を web 側で直接 import することは禁止（不変条件 #5）。すべて `/admin/*` API（または `/api/admin/*` proxy）経由。

---

## 2. AdminSidebar

実装: `apps/web/src/components/layout/AdminSidebar.tsx`

### 2.1 構造

- `<nav aria-label="管理メニュー" className="admin-sidebar">`
- `<ul>` 配下に `<li><Link href={href}>{label}</Link></li>` を 5 件

### 2.2 リンク

| href | label |
| --- | --- |
| `/admin` | ダッシュボード |
| `/admin/members` | 会員管理 |
| `/admin/tags` | タグキュー |
| `/admin/schema` | schema |
| `/admin/meetings` | 開催日 |

### 2.3 不変条件

- 上記 5 リンクは固定。順序も固定。
- アクティブ状態のスタイル属性は実装上 CSS 側で管理（コンポーネントは `aria-current` を出さない）。

---

## 3. /admin（Dashboard）

実装: `apps/web/app/(admin)/admin/page.tsx`（Server Component）

### 3.1 データ取得

- 単一 fetch: `fetchAdmin<AdminDashboardView>("/admin/dashboard")`（AC-8）
- 型は `@ubm-hyogo/shared` の `AdminDashboardView`

### 3.2 表示要素

| 要素 | 内容 |
| --- | --- |
| `<h1 id="admin-dashboard-h">ダッシュボード</h1>` | 見出し |
| KPI grid (`role="group"`) | `KpiCard` × 4: 総会員 / 同意保留 / 削除済み / 未タグ件数 |
| schema 状態 | `<strong data-testid="schema-state">{view.schemaState}</strong>` |
| 最近の提出 table | `view.recentSubmissions` を `responseId` key で行展開（提出日時 / 氏名 / memberId） |
| 生成日時 | `<p class="meta">{view.generatedAt}</p>` |

### 3.3 KpiCard props

```ts
{ readonly label: string; readonly value: number }
```

### 3.4 不変条件

- AC-8: dashboard は 1 fetch に集約する（複数 endpoint を並列で叩かない）。
- mutation は持たない（読み取り専用）。

---

## 4. /admin/members

### 4.1 page.tsx（Server）

実装: `apps/web/app/(admin)/admin/members/page.tsx`

- searchParams `filter` を `"published" | "hidden" | "deleted"` に narrow（type guard `isFilter`）
- `fetchAdmin<AdminMemberListView>("/admin/members${qs}")` で初期取得
- `<MembersClient initial={...} filter={filter} />` を返す

### 4.2 MembersClient（Client）

実装: `apps/web/src/components/admin/MembersClient.tsx`

#### Props

```ts
{
  readonly initial: AdminMemberListView;
  readonly filter: "published" | "hidden" | "deleted" | undefined;
}
```

#### state

| state | 型 | 用途 |
| --- | --- | --- |
| `selectedId` | `string \| null` | ドロワー対象 memberId |

#### 主要 UI

- フィルタトグル（"" / published / hidden / deleted）— `aria-pressed` で active 表現、`router.push()` で URL 更新
- `<p>{initial.total} 件</p>`
- table: 氏名 / email / publish / 削除 / 最終提出 / 操作列
- 操作列に「詳細」ボタン（`setSelectedId`）と `<Link href="/admin/tags?memberId=...">タグキューで編集</Link>`
- `selectedId` がある場合 `<MemberDrawer memberId onClose onMutated={() => router.refresh()} />`

#### 不変条件

- AC-1: 一覧 row には profile 本文の input/textarea を出さない。
- AC-2: タグ編集ボタンは存在せず、必ず `/admin/tags?memberId=...` への `<Link>`。

### 4.3 MemberDrawer（Client）

実装: `apps/web/src/components/admin/MemberDrawer.tsx`

#### Props

```ts
{
  readonly memberId: string;
  readonly onClose: () => void;
  readonly onMutated: () => void;
}
```

#### state

| state | 型 | 用途 |
| --- | --- | --- |
| `view` | `AdminMemberDetailView \| null` | drawer 内の詳細データ |
| `error` | `string \| null` | role="alert" 表示 |
| `pendingPublish` | `PublishState \| null` | publish 変更の確認 dialog |
| `noteBody` | `string` | 管理メモ textarea |
| `confirmDelete` | `boolean` | 削除確認 dialog 開閉 |
| `deleteReason` | `string` | 削除理由（必須） |

#### 取得

- `useEffect` で `/api/admin/members/{memberId}` を `cache: "no-store"` で fetch（drawer open 時）
- AbortController 相当の `alive` フラグで stale set 抑止

#### セクション一覧（`<aside role="dialog" aria-modal="true">`）

| セクション | 内容 |
| --- | --- |
| 基本情報 | identityEmail / publishState / publicConsent / rulesConsent / 削除フラグ |
| 公開状態の変更 | radio (`public` / `member_only` / `hidden`) → 確認 dialog → `patchMemberStatus` |
| 管理メモ | `<textarea aria-label="管理メモ本文">` + `postMemberNote`。"本人には表示されません" 注記 |
| タグ編集導線 | `<Link href="/admin/tags?memberId=...">` のみ |
| 本人更新導線 | `view.profile.editResponseUrl` がある場合 `<a target="_blank" rel="noreferrer">Google Form 編集を開く</a>` |
| 監査ログ | `view.audit` 直近 50 件を `<ul><li>{occurredAt} — {action} ({actor})</li></ul>` |
| 削除操作 | 論理削除（理由必須）/ 復元 |

#### 不変条件

- 不変条件 #4 / #11 / AC-1: profile 本文（businessOverview / selfIntroduction 等）の input/textarea は **持たない**。テキスト入力は管理メモ `body` と削除理由のみ。
- 不変条件 #12 / AC-9: 管理メモ UI はこの drawer 内のみに置く（一覧画面には表示しない）。
- 不変条件 #13 / AC-2: タグ更新は drawer から行わない。`<Link>` のみ。
- AC-10: `editResponseUrl` 表示は `<a target="_blank">` で本人更新を促す導線とする。

---

## 5. /admin/tags

### 5.1 page.tsx（Server）

実装: `apps/web/app/(admin)/admin/tags/page.tsx`

- searchParams: `status` (`"queued" | "reviewing" | "resolved" | "rejected"`) / `memberId`
- `fetchAdmin<QueueListView>("/admin/tags/queue${qs}")`
- `<TagQueuePanel initial filter focusMemberId />` を返す

### 5.2 TagQueuePanel（Client）

実装: `apps/web/src/components/admin/TagQueuePanel.tsx`

#### Props

```ts
{
  readonly initial: TagQueueListView;
  readonly filter: TagQueueStatus | undefined;
  readonly focusMemberId: string | null;
}
```

#### state

| state | 型 | 用途 |
| --- | --- | --- |
| `selected` | `string \| null` | 選択中 queueId（初期は items[0]?.queueId） |
| `busy` | `boolean` | resolve 実行中 |
| `toast` | `string \| null` | `role="status"` |

#### 並べ替え

`focusMemberId` 指定時、その memberId のキューを先頭に移動（`useMemo`）。

#### レイアウト

`grid-template-columns: 1fr 2fr`:

- 左: ステータス絞込ボタン群 + キュー一覧（`<button aria-pressed>` で行選択）
- 右: レビューパネル（`memberId` / `responseId` / `status` / 提案タグ list / `reason` / resolve ボタン）

#### mutation

`resolveTagQueue(queueId, body)` 成功時に Toast + `router.refresh()`。`body` は `{ action: "confirmed", tagCodes: string[] }` または `{ action: "rejected", reason: string }`。

#### 不変条件

- 不変条件 #13: tag 直接更新 endpoint なし。**queue resolve のみ**で `member_tags` を反映。
- AC-2: members 画面からの遷移時に `?memberId=...` を保持し、対象 memberId のキューを先頭に並べる。
- `current.status === "resolved"` のときは resolve ボタンを disabled。

---

## 6. /admin/schema

### 6.1 page.tsx（Server）

実装: `apps/web/app/(admin)/admin/schema/page.tsx`

- `fetchAdmin<SchemaDiffListView>("/admin/schema/diff")`
- `<SchemaDiffPanel initial />` を返す
- `SchemaDiffItem` / `SchemaDiffListView` 型は `SchemaDiffPanel` から re-export

### 6.2 SchemaDiffPanel（Client）

実装: `apps/web/src/components/admin/SchemaDiffPanel.tsx`

#### Props

```ts
{ readonly initial: SchemaDiffListView }
```

#### DiffType

`"added" | "changed" | "removed" | "unresolved"` の 4 種。

#### state

| state | 型 | 用途 |
| --- | --- | --- |
| `active` | `SchemaDiffItem \| null` | 編集中 diff |
| `stableKey` | `string` | alias form 入力 |
| `busy` | `boolean` | 送信中 |
| `toast` | `string \| null` | `role="status"` |

#### レイアウト

- 4 ペイン grid（`grid-template-columns: repeat(4, 1fr)`）に added / changed / removed / unresolved を分類表示
- 各項目を `<button aria-pressed>` で選択 → `active` 設定
- `active.questionId` がある場合: stableKey 編集 form
- `active.questionId` が null の場合: `<p role="alert">この diff には questionId がないため alias 割当はできません。</p>`

#### 初期 stableKey

`active.suggestedStableKey ?? active.stableKey ?? ""` を初期値にセット。

#### mutation

`postSchemaAlias({ diffId, questionId, stableKey })` 成功時に Toast + `router.refresh()`。

#### 不変条件

- 不変条件 #14 / AC-3: `SchemaDiffPanel` は `app/(admin)/admin/schema/page.tsx` **以外で import しない**（schema 解消画面はここに集中）。

---

## 7. /admin/meetings

### 7.1 page.tsx（Server）

実装: `apps/web/app/(admin)/admin/meetings/page.tsx`

- 2 並列 fetch:
  - `fetchAdmin<MeetingsListView>("/admin/meetings")`
  - `fetchAdmin<AdminMemberListView>("/admin/members")`
- members から `!m.isDeleted` を server で filter し `candidates: { memberId, fullName }[]` を生成
- `<MeetingPanel meetings candidates />`

### 7.2 MeetingPanel（Client）

実装: `apps/web/src/components/admin/MeetingPanel.tsx`

#### Props

```ts
{
  readonly meetings: MeetingsListView;
  readonly candidates: MemberCandidate[]; // { memberId, fullName }[]
}
```

#### state

| state | 型 | 用途 |
| --- | --- | --- |
| `title` / `heldOn` / `note` | `string` | 開催追加 form |
| `toast` | `string \| null` | `role="status"` |
| `busy` | `boolean` | 開催追加中 |
| `attended` | `Record<sessionId, Set<memberId>>` | 楽観 UI（初期値は API 返却の attendance） |
| `pickedMember` | `Record<sessionId, memberId>` | 各 session の出席追加用 select 値 |

#### 開催日追加 form

- title 必須 / heldOn は `^\d{4}-\d{2}-\d{2}$` 検証 / note 任意
- `createMeeting` 成功時に `router.refresh()`

#### 出席追加（onAdd）

1. 既出席なら "この会員は既に出席登録されています" を Toast にして return
2. `addAttendance(sessionId, memberId)` 実行
3. status 422 → "削除済み会員は登録できません"
4. status 409 → "この会員は既に出席登録されています"
5. その他 → `登録に失敗: ${error}`
6. 成功 → `attended` set に追加 + Toast

#### 出席削除（onRemove）

`removeAttendance(sessionId, memberId)` → set から delete + Toast。

#### 出席候補 select

各 candidate `<option disabled={here.has(memberId)}>` で既出席を disabled。出席済表記（"— 出席済"）を label 末尾に追加。

#### 補助関数

- `filterCandidates<T extends { isDeleted?: boolean }>(members: T[]): T[]`（`isDeleted !== true` のみを返す UI 側二重防御 / unit test される）

#### 不変条件

- 不変条件 #15 / AC-4: attendance 候補は `!isDeleted` のみ。server 側 filter + UI `filterCandidates` の **二重防御**。
- AC-5: 既出席の重複 POST は select option の disabled で防ぐ + 422 / 409 受信時に Toast。
- 削除済み会員 POST 時は API が 422 を返す（apps/api 側）。

---

## 8. 共通の Server/Client 契約

### 8.1 mutation 後の再取得

すべての Client mutation は成功時に `useRouter().refresh()` を呼び、Server Component を再実行することで状態を最新化する（手動 state merge は最低限の楽観 UI に留める）。

### 8.2 Toast / エラー表示

- 通常通知: `<p role="status">{toast}</p>`
- エラー: `<p role="alert">{error}</p>`
- 表示位置はセクション直下。専用 Toast ライブラリは導入しない。

### 8.3 admin-only mutation

すべての PATCH/POST/DELETE は `apps/web/src/lib/admin/api.ts` 経由でのみ発火し、`/api/admin/*` BFF proxy が session.isAdmin を再検証する。詳細は `architecture-admin-api-client.md` を参照。

---

## 9. 不変条件サマリ（admin UI）

| ID | 内容 | 適用箇所 |
| --- | --- | --- |
| #4 | profile schema 外データは admin-managed として分離 | MemberDrawer の管理メモ／監査ログのみ |
| #5 | apps/web から D1 直接アクセス禁止 | すべての fetch は `/admin/*` API 経由 |
| #11 | profile 本文の管理者編集 mutation を提供しない | MemberDrawer / api.ts に該当関数なし |
| #12 | 管理メモは MemberDrawer 内のみ | api.ts の note 関数は drawer のみで参照 |
| #13 | tag 直接更新なし、queue resolve のみ | TagQueuePanel + api.ts.resolveTagQueue |
| #14 | schema 差分解消は `/admin/schema` のみ | SchemaDiffPanel は単一 page.tsx で import |
| #15 | attendance は `!isDeleted` のみ、重複は disabled / 409 / 422 | MeetingPanel + page.tsx |

---

Last reviewed: 2026-04-29 / source: 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages

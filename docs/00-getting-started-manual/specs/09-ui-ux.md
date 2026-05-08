# UI/UX Contract

## 1. 位置づけと正本主義

- 正式な UI 方針は `claude-design-prototype/` に合わせる
- 色 / radius / shadow / typography / spacing / motion token の値正本は `09b-design-tokens.md` とし、本ファイルには値を重複定義しない
- prototype の行範囲から本番実装先を逆引きする場合は [`09a-prototype-map.md`](./09a-prototype-map.md) を正本にする
- `gas-prototype/` は画面叩き台として参照するが、認証・保存・同期の振る舞いは正本にしない
- 目的は、公開ユーザーには「誰がいるか」が分かり、会員には「自分の掲載状態」が分かり、管理者には「何を処理すべきか」が分かること
- 実装先は `apps/web` の画面群で、`apps/api` は状態更新と同期の裏側を担う
この文書は UBM 兵庫支部会メンバーサイトの UI 契約を定義する。
扱う範囲は routes、component props、state、a11y、API 接続、token 参照名に限定する。
視覚値、余白値、フォント値、prototype の行範囲、画面 blueprints は別正本へ委譲する。

### 1.1 契約のみスコープ

| 扱う | 扱わない |
|------|----------|
| route と layout の対応 | 色や余白の実値 |
| 主 component と主 props | prototype の行範囲 |
| API endpoint と method | screenshot の正解画像 |
| page state と申請 state | Storybook 実装 |
| a11y の最低契約 | Tailwind class の詳細 |
| token の参照 prefix | token の値 |

### 1.2 link 先 index

| spec | 担当 task | 役割 |
|------|----------|------|
| `09a-prototype-map.md` | task-07 | prototype source と本番 component の対応 |
| `09b-design-tokens.md` | task-08 | color、radius、shadow、typography、spacing の token 値 |
| `09c-primitives.md` | task-19 | primitive component の完全仕様 |
| `09d-icons.md` | task-22 | icon カタログ |
| `09e-screen-blueprints-public.md` | task-20 | 公開層画面の blueprint |
| `09f-screen-blueprints-member.md` | task-20 | 会員層画面の blueprint |
| `09g-screen-blueprints-admin.md` | task-21 | 管理層画面の blueprint |
| `09h-shell-and-fixtures.md` | task-22 | app shell と fixture data |
| Storybook | task-10 以降 | component の正解 screenshot と VRT |

## 2. 19 routes 全画面の契約一覧

全 route の API 列は `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` の route、endpoint、method を正本にする。
`apps/web` は D1 に直接触れず、API Worker または静的文書だけを参照する。

### 2.1.1 `/` (Public Top)

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| public | root public shell | Hero, Stats, ZoneGuide, Timeline | GET `/public/stats`; GET `/public/members?limit=6&order=recent`; GET `/public/form-preview` | page standard | title, subtitle, stats, members, sections | h1 は 1 個、stats は label 関連付け | color, space, radius, shadow, text | 09a, 09e | theme switcher |

### 2.1.2 `/(public)/members`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| public | public layout | FilterBar, DensityToggle, MemberList, MemberCard | GET `/public/members?zone=&status=&q=&page=&pageSize=` | page standard | q, zone, status, tag, sort, density, items, total | filter は label 必須、結果更新は live region | color, space, radius, text | 09a, 09e | status を公開状態 filter にしない |

### 2.1.3 `/(public)/members/[id]`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| public | public layout | MemberDetail, VisibilityBanner | GET `/public/member-profile/:id` | page standard | memberId, summary, publicFields, tags | profile section は heading 階層を保つ | color, space, radius, text | 09a, 09e | 非公開 field の表示 |

### 2.1.4 `/(public)/register`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| public | public layout | Hero, Card, Button | API call なし。外部 `responderUrl` へ遷移 | idle, error | title, responderUrl, publicConsent, rulesConsent | 外部遷移を link 名で説明 | color, space, radius, shadow | 09e | embedded form |

### 2.1.5 `/privacy`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| public | public layout | LegalProse | API call なし | success | title, sections | 文書 heading と landmark | color, space, text | 09e | interactive consent |

### 2.1.6 `/terms`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| public | public layout | LegalProse | API call なし | success | title, sections | 文書 heading と landmark | color, space, text | 09e | interactive consent |

### 2.2.1 `/login`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| guest | auth layout | LoginInput, LoginSent, LoginUnregistered, LoginDeleted, LoginError | POST `/auth/magic-link`; GET `/auth/gate-state?email=`; GET `/auth/session-resolve` | login state | email, redirectTo, gateState, error | form label、error は alert | color, space, radius, text, duration | 09f | email の画面再表示 |

### 2.2.2 `/profile`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| member | member layout | VisibilityBanner, VisibilitySummary, RequestPanel, DeleteRequestPanel | GET `/me`; GET `/auth/schemas`; POST `/me/visibility-request`; POST `/me/delete-request` | page standard, server-pending | profile, pendingRequests, schemaSnapshot | dialog 契約と status live region | color, space, radius, shadow, text | 09f | 本文直接編集 |

### 2.3.1 `/(admin)/admin`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | KpiGrid, ZoneChart, StatusChart, RecentActions | GET `/admin/dashboard` | page standard | kpis, byZone, byStatus, recentActions | chart は text summary を持つ | color, space, radius, shadow | 09g | client-only KPI |

### 2.3.2 `/(admin)/admin/members`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | MembersTable, MemberDrawer | GET `/admin/members?...`; POST `/admin/member-status`; POST `/admin/member-delete`; GET `/admin/member-notes/:id` | page standard, drawer-open | query, items, selectedMember, notes | table header と drawer dialog | color, space, radius, shadow | 09g | profile body edit |

### 2.3.3 `/(admin)/admin/tags`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | TagsQueue, MemberDetail | GET `/admin/tags-queue`; POST `/admin/tags-queue/:id/decision` | page standard, reviewing | queueItems, selectedCandidate, decision | queue item は button semantics | color, space, radius, text | 09g | tag dictionary editor |

### 2.3.4 `/(admin)/admin/meetings`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | MeetingsCalendar, MeetingForm | GET `/admin/meetings`; POST `/admin/meetings`; PATCH `/admin/meetings/:id`; GET `/admin/attendance` | page standard, form-open | meetings, formState, attendance | form label と validation alert | color, space, radius, text | 09g | attendance bulk edit |

### 2.3.5 `/(admin)/admin/schema`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | SchemaDiff | GET `/admin/schema`; POST `/admin/sync-schema`; POST `/admin/sync`; POST `/admin/responses-sync` | page standard, applying | current, latest, diff, applyState | diff group は heading と status | color, space, radius, shadow | 09g | unsafe direct D1 apply |

### 2.3.6 `/(admin)/admin/requests`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | RequestsQueue, RequestDetail | GET `/admin/requests`; POST `/admin/requests/:id/decision` | page standard, reviewing | items, selectedRequest, decision | approval action は確認文を持つ | color, space, radius, text | 09g | hidden approval |

### 2.3.7 `/(admin)/admin/identity-conflicts`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | ConflictPair | GET `/admin/identity-conflicts`; POST `/admin/identity-conflicts/:id/resolve` | page standard, resolving | conflictPairs, selectedPair, resolution | compare pane は label を持つ | color, space, radius, shadow | 09g | automatic merge |

### 2.3.8 `/(admin)/admin/audit`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| admin | admin layout | AuditFilterBar, AuditTimeline | GET `/admin/audit?actor=&action=&from=&to=&page=` | page standard | filters, items, total | timeline は chronological label | color, space, text | 09g | audit mutation |

### 2.4.1 `app/error.tsx`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| any | current segment | ErrorState | Sentry capture only | error | message, reset | alert と retry button | color, space, radius | 09h | raw stack display |

Task-04 runtime guard / logger contract: production code must route browser-only globals through `apps/web/src/lib/is-browser.ts` (`isBrowser()`, `whenBrowser()`, `browserHistory()`, `browserDocument()`) and structured error reporting through `apps/web/src/lib/logger.ts`. Error boundaries should call `logger.error({ event, error, digest })`; the logger emits one-line JSON, redacts sensitive keys, and bridges to task-03 `captureException` / `captureMessage`.

ESLint `no-restricted-globals` の allow-list は以下4経路を正本とする: `apps/web/src/lib/is-browser.ts` / `apps/web/src/instrumentation-client.ts` / `apps/web/src/lib/sentry/**` / `apps/web/src/**/__tests__/**`。それ以外で `window` / `document` / `history` / `navigator` を直接参照することを禁止し、`whenBrowser()` / `browserHistory()` / `browserDocument()` / `browserNavigator()` を経由する。

### 2.4.2 `app/global-error.tsx`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| any | document fallback | ErrorState | Sentry capture only | error | message, reset | alert と main landmark | color, space, radius | 09h | raw stack display |

### 2.4.3 `app/not-found.tsx`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| any | current shell | EmptyState | API call なし | empty | title, description, cta | h1 と戻る link | color, space, radius | 09h | silent redirect |

### 2.4.4 `app/loading.tsx`

| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
|------|--------|---------------|-----|------|----------|------|-------|----------------|--------|
| any | current shell | Skeleton | API call なし | loading | label, regions | `aria-busy` と status | color, space, radius | 09h | layout shift |

## 3. component 契約一覧

### 3.1 primitives

#### 3.1.1 Button

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| primary, secondary, danger, ghost | sm, md, lg | children, disabled, loading, icon, onClick, href | native button or link、icon-only は aria-label | idle, hover, focus, disabled, loading | color, space, radius, duration, ease | 09c | ui-button |

#### 3.1.2 Card

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| surface, outline, interactive | md | header, children, footer, as | heading 関連付け | idle, hover, selected | color, space, radius, shadow | 09c | ui-card |

#### 3.1.3 Badge

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| neutral, info, success, warning, danger, zone | sm, md | children, tone | text label 必須 | idle | color, radius, text | 09c | ui-badge |

#### 3.1.4 Input

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| text, email, search | md | id, label, value, error, hint, required | label と describedby | idle, focus, invalid, disabled | color, space, radius, text | 09c | ui-input |

#### 3.1.5 Select

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| native, multi | md | id, label, options, value, error | label と option text | idle, focus, invalid, disabled | color, space, radius, text | 09c | ui-select |

#### 3.1.6 Table

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| simple, dense | md | columns, rows, caption, rowKey | caption または aria-label | loading, empty, success | color, space, text | 09c | ui-table |

#### 3.1.7 Tabs

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| underline, pills | md | tabs, activeId, onChange | tablist, tab, tabpanel | idle, active, disabled | color, space, radius | 09c | ui-tabs |

#### 3.1.8 Sidebar

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| admin | md | items, currentPath, userMenu | nav landmark | expanded, collapsed, active | color, space, shadow | 09c | ui-sidebar |

#### 3.1.9 Toast

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| info, success, warning, danger | md | title, description, action, onDismiss | status または alert | entering, visible, leaving | color, space, radius, shadow, duration, ease | 09c | ui-toast |

#### 3.1.10 Skeleton

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| text, card, table | sm, md, lg | label, rows | aria-busy と status | loading | color, radius, duration, ease | 09c | ui-skeleton |

#### 3.1.11 DataTable

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| admin, public | md | columns, rows, sort, pagination, selectedId | table caption と sort state | loading, empty, success, error | color, space, text | 09c | ui-data-table |

#### 3.1.12 EmptyState

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| default, search, notFound | md | title, description, action | h1 or h2 と action label | empty | color, space, radius | 09c | ui-empty-state |

#### 3.1.13 ErrorState

| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
|----------|-------|-------|------|-------|-------|----------------|-----------|
| inline, page, fatal | md | title, description, retry, supportLink | role alert、retry button | error | color, space, radius | 09c | ui-error-state |

### 3.2 feature components

| component | props | a11y | state | token | 視覚詳細 link | Storybook |
|-----------|-------|------|-------|-------|----------------|-----------|
| Hero | title, subtitle, primaryCta, secondaryCta | h1 は 1 個 | idle | color, space, text | 09e | feature-hero |
| Stats | stats | figure label | loading, success, error | color, space, radius | 09e | feature-stats |
| ZoneGuide | zones | heading list | success | color, space | 09e | feature-zone-guide |
| Timeline | meetings | chronological label | loading, empty, success | color, space | 09e | feature-timeline |
| MemberCard | member, density | card link label | idle, hover | color, space, radius | 09e | feature-member-card |
| MemberList | items, total, density | result count live region | loading, empty, success | color, space | 09e | feature-member-list |
| FilterBar | query, options, onChange | label for every control | idle, dirty | color, space, radius | 09e | feature-filter-bar |
| DensityToggle | value, onChange | segmented control label | idle, active | color, radius | 09e | feature-density-toggle |
| MemberDetail | member | heading hierarchy | loading, success, error | color, space, text | 09e | feature-member-detail |
| VisibilityBanner | state, pendingRequests | status live region | success, server-pending | color, space, radius | 09f | feature-visibility-banner |
| VisibilitySummary | counts | section labels | success | color, space, radius | 09f | feature-visibility-summary |
| RequestPanel | pendingRequests, onSubmit | dialog trigger | idle, submitting, server-pending | color, space, radius | 09f | feature-request-panel |
| DeleteRequestPanel | pendingRequests, onSubmit | danger confirmation dialog | idle, submitting, server-pending | color, space, radius | 09f | feature-delete-request-panel |
| KpiGrid | kpis | figure label | loading, success, error | color, space, radius | 09g | feature-kpi-grid |
| ZoneChart | byZone | text summary | loading, success | color, space | 09g | feature-zone-chart |
| StatusChart | byStatus | text summary | loading, success | color, space | 09g | feature-status-chart |
| RecentActions | actions | list semantics | loading, empty, success | color, space | 09g | feature-recent-actions |
| MembersTable | items, total, query | table caption | loading, empty, success | color, space, text | 09g | feature-members-table |
| MemberDrawer | member, notes | dialog contract | closed, open, submitting | color, space, shadow | 09g | feature-member-drawer |
| TagsQueue | items, selectedId | queue item buttons | loading, empty, reviewing | color, space | 09g | feature-tags-queue |
| MeetingsCalendar | meetings | grouped list label | loading, empty, success | color, space | 09g | feature-meetings-calendar |
| MeetingForm | value, onSubmit | label and validation alert | idle, invalid, submitting | color, space, radius | 09g | feature-meeting-form |
| RequestsQueue | items, selectedId | queue item buttons | loading, empty, reviewing | color, space | 09g | feature-requests-queue |
| RequestDetail | request, onDecision | confirmation action label | reviewing, submitting | color, space, radius | 09g | feature-request-detail |
| SchemaDiff | current, latest, diff | diff group labels | loading, empty, applying | color, space, radius | 09g | feature-schema-diff |
| ConflictPair | pair, onResolve | compare pane labels | reviewing, submitting | color, space, radius | 09g | feature-conflict-pair |
| AuditTimeline | items | chronological list | loading, empty, success | color, space | 09g | feature-audit-timeline |
| AuditFilterBar | filters, onChange | label for every control | idle, dirty | color, space, radius | 09g | feature-audit-filter-bar |
| LegalProse | title, sections | document outline | success | color, space, text | 09e | feature-legal-prose |

## 4. 状態列挙の規範

### 4.1 ページ標準 5 値

| state | 意味 | UI 契約 |
|-------|------|---------|
| idle | 初期表示または入力待ち | 操作可能な初期状態 |
| loading | data fetch 中 | Skeleton と aria-busy |
| empty | 0 件または該当なし | EmptyState と解除 CTA |
| error | 復旧可能な失敗 | ErrorState と retry |
| success | 表示成功 | 主 content を表示 |

### 4.2 login 5 状態

`/login` は input、sent、unregistered、deleted、error の 5 状態を単一正本とする。
input は email 入力と送信を扱う。
sent は magic link 送信済みの案内だけを扱う。
unregistered は登録導線へ案内する。
deleted は管理者に問い合わせる導線へ案内する。
error は再試行可能な失敗を alert で示す。

### 4.3 申請 pending state

visibility request と delete request は server-pending を正本にする。
client local state は submit-in-flight の表示に限定し、`GET /me` の pendingRequests を上書きしない。
server-pending がある申請種別の button は disabled にする。
reload 後も pending banner を表示し、status live region で状態を伝える。

## 5. アクセシビリティ契約

### 5.1 全画面共通

- 各画面は main landmark を 1 個持つ。
- h1 は route ごとに 1 個に限定する。
- click target は button または anchor の native semantics を使う。
- icon-only button は aria-label を持つ。
- async 結果は status または alert の live region に接続する。

### 5.2 dialog / drawer

dialog と drawer は `role="dialog"`、`aria-modal="true"`、focus trap、Esc close を必須にする。
dialog title は labelledby、補足説明は describedby で接続する。
close button は視覚名だけに依存せず accessible name を持つ。
destructive action は確認文と取り消し導線を持つ。

### 5.3 form / input

input、select、textarea は label と関連付く。
error text は describedby に接続する。
required は視覚表現だけでなく属性または説明で示す。
validation は submit 前後で同じ message key を使う。

### 5.4 live region

検索件数や申請 pending は polite status を使う。
送信失敗や権限エラーは alert を使う。
toast は status または alert のどちらかを variant で固定する。
loading 中の領域は aria-busy を付ける。

## 6. token 参照規則

### 6.1 視覚値の決定権

視覚値の決定権は `09b-design-tokens.md` にある。
この文書は token 名と prefix だけを参照し、値を記述しない。
画面固有の構図や余白判断は `09e`、`09f`、`09g`、`09h` に委譲する。

### 6.2 CSS 変数経由の参照

UI 実装は UBM token を CSS 変数経由で参照する。
直接の色値、Tailwind arbitrary color utilities、固定寸法値をこの文書に持ち込まない。
contract 表の token 列は prefix family だけを列挙する。

### 6.3 token 名 prefix 規則

| prefix | 用途 |
|--------|------|
| `--ubm-color-*` | color family |
| `--ubm-radius-*` | radius family |
| `--ubm-shadow-*` | shadow family |
| `--ubm-space-*` | spacing family |
| `--ubm-text-*` | text size family |
| `--ubm-font-*` | font family |
| `--ubm-dur-*` | duration family |
| `--ubm-ease-*` | easing family |

## 7. Storybook 正本主義

component の正解 screenshot は Storybook の VRT 画像を正本にする。
この文書は Storybook story 名を参照するだけで、見た目の正解画像を持たない。
props、state、a11y、token prefix がこの文書と Storybook で矛盾した場合は、本契約を先に更新し、同じ wave で story を追従させる。

## 8. 不採用画面・不採用パターン

| 対象 | 判定 | 理由 |
|------|------|------|
| Tweaks panel | 不採用 | prototype edit mode 専用 |
| theme switcher | 不採用 | MVP では theme 切替を提供しない |
| AvatarStoreProvider localStorage | 不採用 | 本番 persistence 正本ではない |
| `data-theme` warm/cool | 不採用 | design token 正本に一本化する |
| gas-prototype 由来の保存挙動 | 不採用 | 認証、保存、同期は本番 API 正本に従う |
| `/profile/edit` | 不採用 | 本人本文編集は Google Form 再回答に寄せる |
| `/no-access` 独立画面 | 不採用 | auth gate state と ErrorState で扱う |

## 9. 用語集

| 用語 | 意味 |
|------|------|
| contract | props、state、a11y、token prefix、API 接続 |
| visual detail | 色、余白、構図、font value、prototype 行範囲 |
| page standard | idle、loading、empty、error、success |
| login state | input、sent、unregistered、deleted、error |
| server-pending | サーバーが持つ申請 pending 状態 |
| visibility request | 公開停止または再公開の申請 |
| identity conflict | 同一人物候補の統合判断対象 |
| Storybook VRT | component 正解 screenshot の正本 |

## 10. 改訂履歴

| Date | Change |
|------|--------|
| 2026-05-07 | task-06 ui-ux-contract-rewrite により、UI/UX 文書を契約のみへ再構成 |

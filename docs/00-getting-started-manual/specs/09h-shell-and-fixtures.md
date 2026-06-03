# 09h. シェル構造とデータ fixtures

prototype の `app.jsx` と `data.jsx` を統合し、本番 shell / fixtures の正本を一本化したリファレンス。
出典: `docs/00-getting-started-manual/claude-design-prototype/app.jsx`（251 行） / `docs/00-getting-started-manual/claude-design-prototype/data.jsx`（339 行）。

prototype は `localStorage` / `window.parent.postMessage` 等を直接操作する SPA だが、本番では Next.js App Router / Auth.js / Hono に置き換える。本書は **UI 構造と fixture shape** の正本としてのみ参照し、実装方針 (auth / fetcher) は `02-auth.md` / `03-data-fetching.md` を優先する。

---

## 1. アプリケーションシェル（unified SidebarShell）

> **実装更新（2026-05）**: prototype（app.jsx）は `Sidebar` / `Topbar` / `MinimalBar` を `tweaks.nav` で切替える設計、
> 初期 spec は route prefix で `PublicShell` / `MemberShell` / `AdminShell` の 3 layer 独立 shell に分割する案だった。
> **実装では公開 / 会員 / 管理の 3 層を 1 つの共通 collapsible Sidebar Shell（`SidebarShell`）へ統合した。**
> 本 §1 は統合後の実装（`apps/web/src/components/shell/`）を正本とする。旧 3 shell 分割案は §1.7 に履歴として残す。

### 1.1 全体方針

- 3 層すべてが同一の `SidebarShell`（左 collapsible サイドバー + main + mobile drawer）を共有する。
- 表示差分は **role**（`viewer` / `member` / `admin`）で決まり、サーバ側 `SidebarShellServer` が `getSession()` の `isAdmin` から role を判定する（`getSession()` throw 時は shell 表示として `viewer` に fail-open。admin / profile の認可境界は middleware + layout の二段防御で fail-closed、`02-auth.md` 不変条件 #11）。
- 各 route group layout（`app/(public|member|admin)/layout.tsx`）は async server component で、`SidebarShellServer` に children と mobile trigger slot を渡すだけ。旧 per-layer header / sidebar（`PublicHeader` / `MemberHeader` / `AdminSidebar`）は撤去・削除済み。

| role | session | 適用 route group | nav グループ | nav item 総数 |
|------|---------|-----------------|------------|--------------|
| `viewer` | 未ログイン | `(public)` | PUBLIC | 3 |
| `member` | `isAdmin=false` | `(public)` / `(member)` | PUBLIC + MEMBERS | 4 |
| `admin`  | `isAdmin=true`  | `(public)` / `(member)` / `(admin)` | PUBLIC + MEMBERS + ADMIN | 14 |

> `/login` は認証専用ページのため shell 配下に置かず bare（シェルを被せると認証導線が二重になる）。

### 1.2 role → nav 構成（`buildNavForRole`）

nav は `apps/web/src/components/shell/shell-config.ts` の純関数 `buildNavForRole(role, { schemaDiffCount })` で構築する。

| group | item | path | role 可視性 |
|-------|------|------|-----------|
| PUBLIC | ホーム | `/` | 全 role |
| PUBLIC | 会員ディレクトリ | `/members` | 全 role |
| PUBLIC | 入会登録 | `/register` | 全 role |
| MEMBERS | マイページ | `/profile` | member / admin |
| ADMIN | ダッシュボード | `/admin` | admin |
| ADMIN | 出席分析 | `/admin/dashboard/attendance` | admin |
| ADMIN | メンバー管理 | `/admin/members` | admin |
| ADMIN | タグキュー | `/admin/tags` | admin |
| ADMIN | スキーマ | `/admin/schema` | admin（warn badge = `GET /admin/schema/diff` の queued 件数） |
| ADMIN | 開催日 | `/admin/meetings` | admin |
| ADMIN | 申請 | `/admin/requests` | admin |
| ADMIN | 名寄せ | `/admin/identity-conflicts` | admin |
| ADMIN | 監査ログ | `/admin/audit` | admin |
| ADMIN | Form回答 | `FORM_RESPONSES_EDIT_URL`（Google Form edit URL） | admin（外部リンク） |

> ADMIN グループは上表のうち admin 専用 10 item（ダッシュボード〜監査ログ + Form回答）。viewer=PUBLIC 3 / member=PUBLIC+MEMBERS 4 / admin=PUBLIC+MEMBERS+ADMIN 14。

- active 判定は client の `usePathname()`（`SidebarNavItem`）+ `isNavItemActive(href, pathname)`（`/` と `/admin` は完全一致、他は prefix 一致）を主とし、SSR 初期表示では middleware が注入する `x-pathname` を layout から `activePath` として渡す。
- admin の schema nav には未解決スキーマ差分件数を warn tone badge で表示する（`SidebarShellServer` が admin 時のみ `GET /admin/schema/diff` を await し queued 件数を算出）。
- 外部 nav 項目は `ShellNavItem.external?` で判定する。`external: true` の項目は `<a target="_blank" rel="noopener noreferrer">` で描画し、`↗`（`aria-hidden`）+ sr-only「（外部リンク）」を付与する。外部項目は app 内 current route ではないため `aria-current` / `data-active` を付けない。href は `apps/web/src/lib/constants/form.ts` の `FORM_RESPONSES_EDIT_URL` を参照し、URL を nav config / component に直書きしない。

### 1.3 SidebarShell レイアウト構造

```
+-- app-shell (data-testid="app-shell", data-role, data-collapsed) ----+
|  aside shell-sidebar (md+, persistent)   |  main column              |
|    SidebarBrand + CollapseToggle         |   mobile strip (< md):    |
|    SidebarNav (shell-nav)                |     SidebarMobileTrigger  |
|    SidebarUserMenu (shell-user-menu)     |     + SidebarBrand        |
|                                          |   main (children)         |
+-- SidebarDrawer (shell-drawer, < md, role="dialog", overlay) --------+
```

| data-testid | 要素 |
|-------------|------|
| `app-shell` | shell root（`data-role` / `data-collapsed` 属性） |
| `shell-sidebar` | persistent サイドバー（md+ 表示） |
| `shell-nav` | nav 本体（role 別件数: viewer 3 / member 4 / admin 14） |
| `shell-user-menu` | 左下ユーザーメニュー（viewer=直リンク / member・admin=`<details>` popover） |
| `shell-drawer-toggle` | hamburger（< md, mobile strip 内） |
| `shell-drawer` | mobile overlay drawer（`role="dialog"`, Esc / backdrop close, body scroll-lock） |
| `shell-collapse-toggle` | collapse / expand トグル（md+） |

### 1.4 collapse / drawer / responsive

| 状態 | 幅 | 表示 |
|------|------|------|
| expanded（default） | `--shell-bar-w` | brand + nav（icon + label）+ user menu |
| collapsed | `--shell-bar-w-collapsed` | icon のみ（label は sr-only）、`data-collapsed="true"` |
| drawer（< md） | overlay | sidebar 内容を drawer に複製表示。route 遷移で auto-close |

- collapse 状態は `useSidebarState`（`apps/web/src/components/shell/useSidebarState.ts`）が `localStorage["ubm:shell:collapsed"]`（JSON boolean）へ永続化。SSR 安全のため初期 false → mount で hydrate。`isBrowser()` guard 付き。
- mobile drawer は hamburger（`SidebarMobileTrigger`）で開き、Esc / backdrop / nav リンク click（`setDrawerOpen(false)`）/ route 変化（`usePathname` 依存）で閉じる。
- 色・幅は `apps/web/src/styles/tokens.css` の OKLch トークン（`--shell-bar-bg` / `--shell-bar-border` / `--shell-bar-w` / `--shell-bar-w-collapsed` / `--shell-active-bg`）のみを使用し、HEX 直書き / `bg-[#xxx]` はしない（`verify-design-tokens` gate）。

### 1.5 UserMenu（role 別）

左下 `SidebarUserMenu`（`user-menu-config.ts` の `buildUserMenuActions`）は role で内容が変わる。

| role | 表示 | action |
|------|------|--------|
| viewer | 「ゲスト」+「未ログイン」表記、強調された「ログイン」CTA | `/login` |
| member | `<details>` popover（avatar + 名前） | プロフィール / プロフィール編集申請 / ログアウト（3） |
| admin | `<details>` popover（avatar + admin badge dot） | 管理者ダッシュボード / プロフィール / プロフィール編集申請 / ログアウト（4） |

`SidebarUserAvatar` は initials + admin 時 badge dot。ログアウトは `SignOutButton`（Auth.js `signOut`）を embed。popover は native `<details>` 契約（`summary` click で開閉、route 変化で auto-close）。

### 1.6 route → shell マッピング

| route group | route | shell | role 要件 |
|-------------|-------|-------|----------|
| `(public)` | `/`・`/members`・`/members/[id]`・`/register`・`/privacy`・`/terms` | SidebarShell | 不要（role で nav 変化） |
| `(member)` | `/profile` | SidebarShell | session 必須（middleware guard） |
| `(admin)` | `/admin`・`/admin/{meetings,members,tags,schema,requests,identity-conflicts,audit}` | SidebarShell | `isAdmin=true`（middleware + layout 二段防御） |
| `(auth)` | `/login` | bare | — |

- `/`・`/privacy`・`/terms` は旧 `app/` 直下から `(public)` route group へ移動し、シェル layout 配下に収めた。
- admin layout は `getSession()` で `!session → /login?next=/admin`、`!isAdmin → /login?gate=forbidden` の guard 後に `SidebarShellServer` を呼ぶ。

### 1.7 実装出典と旧設計履歴

統合シェルの実装正本:

| 役割 | ファイル |
|------|---------|
| role / nav 純関数 | `apps/web/src/components/shell/shell-config.ts`（`buildNavForRole` / `isNavItemActive`） |
| server boundary | `SidebarShell.server.tsx`（`getSession` → role → `buildNavForRole` → admin 時 schemaDiff await） |
| client shell | `SidebarShell.tsx` / `SidebarNav` / `SidebarNavGroup` / `SidebarNavItem` / `SidebarBrand` / `SidebarCollapseToggle` |
| state | `useSidebarState.ts`（collapse 永続化 / drawer auto-close）/ `SidebarShellContext.tsx` |
| user menu | `SidebarUserMenu.tsx` / `SidebarUserAvatar.tsx` / `user-menu-config.ts` |
| mobile | `SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` |
| layout | `app/(public|member|admin)/layout.tsx`（async server, `SidebarShellServer` 委譲） |

> **旧設計履歴（参考）**: prototype（app.jsx）の `Sidebar` / `Topbar` / `MinimalBar` 切替と、初期 spec の
> `PublicShell` / `MemberShell` / `AdminShell` 3 layer 独立 shell 分割案は、`unified-sidebar-shell-public-and-admin`
> ワークフロー（Task A-F）で共通 SidebarShell へ統合された。prototype の `TweaksPanel` / `MinimalBar` は本番非移植。
> 旧 `localStorage["ubm-admin-sidebar"]` キーは統合後 `ubm:shell:collapsed` に一本化。Playwright の visual baseline /
> smoke は `sidebar-shell-visual-baseline-smoke-task-f`（Task F）が捕捉する。

---

## 2. データ fixtures（data.jsx）

### 2.1 ドメインモデル

zod 風記法で各 entity の field と型を列挙する。`*` は optional、`<>` は enum、`[]` は array。

#### Member

```ts
Member = {
  id: string,                       // "m1"
  responseId: string,               // "resp-001"
  email: string,
  submittedAt: string,              // "YYYY-MM-DD HH:mm"
  fullName: string,
  nickname?: string,
  location: string,
  birthDate?: string,               // "YYYY-MM-DD"
  hometown?: string,
  occupation: string,
  ubmZone: <"0→1" | "1→10" | "10→100">,
  ubmMembershipType: <"会員" | "非会員" | "アカデミー生">,
  ubmJoinDate?: string,
  businessOverview: string,
  skills?: string,
  challenges?: string,
  canProvide?: string,
  hobbies?: string,
  recentInterest?: string,
  motto?: string,
  otherActivities?: string,
  urlWebsite?: string, urlX?: string, urlInstagram?: string,
  urlFacebook?: string, urlLinkedin?: string, urlNote?: string,
  urlYoutube?: string, urlThreads?: string, urlTiktok?: string,
  selfIntroduction?: string,
  publicConsent: <"同意する" | "同意しない">,
  ruleConsent:   <"同意する" | "同意しない">,
  tags: string[],                   // ALL_TAGS のいずれか
  isPublic: boolean,
  isDeleted: boolean,
  attendance: string[],             // meetings.id 参照
  updatedAt: string,
  hue: number,                      // 0..7 アバター色
  deletedAt?: string,
  deletedReason?: string,
};
```

#### Tag

```ts
TagCategory = { category: string, tags: string[] };
Tag = string;
```

#### Meeting

```ts
Meeting = {
  id: string,                       // "meet-2026-04"
  date: string,                     // "YYYY-MM-DD"
  label: string,
  note: string,
  attendees: number,
};
```

#### Request（メンバーからの修正依頼）

prototype 直接定義はないが、admin pages から参照される shape として規定。

```ts
Request = {
  id: string,
  memberId: string,
  type: <"profile-update" | "withdrawal" | "tag-change" | "other">,
  status: <"pending" | "approved" | "rejected" | "in_progress">,
  payload: Record<string, unknown>,
  submittedAt: string,
  resolvedAt?: string,
  resolvedBy?: string,
  reason?: string,
};
```

#### SchemaDiff

```ts
SchemaDiff = {
  type: <"added" | "changed" | "removed" | "unresolved">,
  stableKey: string | null,
  questionId: string,
  itemId?: string,
  label: string,
  note: string,
};

SchemaVersion = {
  revisionId: string,
  schemaHash: string,
  date: string,
  state: <"active" | "superseded">,
  fieldCount: number,
  unknownCount: number,
};

AliasHistory = {
  stableKey: string,
  oldQuestionId: string,
  newQuestionId: string,
  resolvedAt: string,
  resolvedBy: string,
};
```

#### IdentityConflict

prototype 直接定義はないが `01-api-schema.md` §admin identity conflict merge API と整合する shape。

```ts
IdentityConflict = {
  id: string,                       // "<sourceMemberId>__<targetMemberId>"
  sourceMemberId: string,
  targetMemberId: string,
  fullName: string,
  occupation: string,
  matchedFields: string[],
  detectedAt: string,
  status: <"open" | "merged" | "dismissed">,
  resolvedAt?: string,
  resolvedBy?: string,
  reason?: string,
};
```

#### AuditEvent

```ts
AuditEvent = {
  id: string,
  action: string,                   // e.g. "schema_diff.alias_assigned"
  actor: string,                    // email or "system"
  targetId?: string,
  payload: Record<string, unknown>,
  occurredAt: string,
};
```

### 2.2 fixture サンプル

prototype data.jsx の seed をそのまま JSON 形式で inline する。

#### members[]（13 件）

```json
[
  {
    "id": "m1", "responseId": "resp-001", "email": "taro@example.com",
    "submittedAt": "2026-03-28 09:12", "fullName": "山田 太郎", "nickname": "タロー",
    "location": "兵庫県神戸市", "birthDate": "1987-02-14", "hometown": "兵庫県明石市",
    "occupation": "生成AIコンサルタント", "ubmZone": "1→10", "ubmMembershipType": "会員",
    "ubmJoinDate": "2024年10月",
    "businessOverview": "中小企業向けに生成AIの導入と業務改善の伴走支援を提供。社内データを活用した業務自動化の設計から、現場への定着まで一貫して支援します。",
    "skills": "プロンプト設計 / 業務整理 / AI研修", "challenges": "継続案件化と採用広報",
    "canProvide": "AI活用設計、生成AI研修、社内導入支援", "hobbies": "珈琲, カメラ, 旅行",
    "recentInterest": "音声AIと業務自動化", "motto": "まず試してから整える",
    "otherActivities": "地元の創業支援イベントでAI勉強会を企画。",
    "urlWebsite": "https://example.com/taro", "urlX": "https://x.com/example_taro",
    "urlNote": "https://note.com/example_taro", "urlLinkedin": "https://linkedin.com/in/exampletaro",
    "urlInstagram": "https://instagram.com/example.taro",
    "selfIntroduction": "兵庫の事業者同士が自然につながる場づくりに関心があります。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["AI・データ", "DX推進", "経営者・代表"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-02", "meet-2026-03", "meet-2026-04"],
    "updatedAt": "2026-04-09 09:30", "hue": 0
  },
  {
    "id": "m2", "responseId": "resp-002", "email": "hana@example.com",
    "submittedAt": "2026-03-29 11:40", "fullName": "鈴木 花子", "nickname": "ハナ",
    "location": "兵庫県西宮市", "birthDate": "1990-09-03", "hometown": "大阪府堺市",
    "occupation": "ブランドデザイナー", "ubmZone": "0→1", "ubmMembershipType": "アカデミー生",
    "ubmJoinDate": "2025年7月",
    "businessOverview": "中小企業やスモールブランドのトーン設計からLP改善まで一気通貫で支援するデザイナーです。",
    "skills": "UIデザイン / ブランディング / 写真ディレクション", "challenges": "案件単価の再設計",
    "canProvide": "デザインレビュー、写真ディレクション、LP改善", "hobbies": "読書, 展示会, ランニング",
    "recentInterest": "商品撮影のライティング", "motto": "伝わるまで整える",
    "otherActivities": "地域のアートイベント運営に参加。",
    "urlWebsite": "https://example.com/hanako", "urlInstagram": "https://instagram.com/example.hanako",
    "urlNote": "https://note.com/example_hanako", "urlThreads": "https://threads.net/@example.hanako",
    "selfIntroduction": "視覚整理で、伝わりにくい価値を伝わる形に変えるのが得意です。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["デザイン", "ブランディング", "UI/UX"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-03", "meet-2026-04"],
    "updatedAt": "2026-04-08 20:10", "hue": 1
  },
  {
    "id": "m3", "responseId": "resp-003", "email": "koichi@example.com",
    "submittedAt": "2026-03-27 15:05", "fullName": "中村 恒一", "nickname": "コウイチ",
    "location": "兵庫県姫路市", "birthDate": "1980-11-21", "hometown": "岡山県倉敷市",
    "occupation": "司法書士", "ubmZone": "10→100", "ubmMembershipType": "会員",
    "ubmJoinDate": "2023年4月",
    "businessOverview": "事業再編や契約実務を中心に、経営者向けに法務相談を提供しています。M&Aや事業承継の実績多数。",
    "skills": "契約実務 / 事業承継 / 法務相談", "challenges": "オンライン発信の強化",
    "canProvide": "契約レビュー、事業相談、法務セミナー", "hobbies": "庭仕事, 将棋",
    "recentInterest": "事業承継の相談対応", "motto": "誠実さは最強の営業",
    "otherActivities": "学校でのキャリア授業に協力。",
    "urlWebsite": "https://example.com/nakamura", "urlX": "https://x.com/example_nakamura",
    "urlLinkedin": "https://linkedin.com/in/example-nakamura",
    "selfIntroduction": "安心してつながれる場づくりを重視しています。",
    "publicConsent": "同意しない", "ruleConsent": "同意する",
    "tags": ["士業", "経営戦略"], "isPublic": false, "isDeleted": false,
    "attendance": ["meet-2026-02", "meet-2026-03"],
    "updatedAt": "2026-04-01 11:45", "hue": 2
  },
  {
    "id": "m4", "responseId": "resp-004", "email": "aya@example.com",
    "submittedAt": "2026-03-30 08:22", "fullName": "佐藤 彩", "nickname": "あや",
    "location": "兵庫県芦屋市", "birthDate": "1985-06-18", "hometown": "京都府京都市",
    "occupation": "SaaSプロダクトマネージャー", "ubmZone": "1→10", "ubmMembershipType": "会員",
    "ubmJoinDate": "2024年2月",
    "businessOverview": "BtoB SaaS のプロダクト企画と顧客成功を横断的に担当。小さなチームでの機能企画からリリース運用まで。",
    "skills": "プロダクト設計 / ユーザーインタビュー / ロードマップ策定",
    "challenges": "営業組織とのハンドオフ設計",
    "canProvide": "プロダクト壁打ち、ユーザーインタビュー設計",
    "hobbies": "ヨガ, 陶芸", "recentInterest": "オンボーディング設計", "motto": "小さく出して早く直す",
    "urlWebsite": "https://example.com/aya", "urlX": "https://x.com/example_aya",
    "urlLinkedin": "https://linkedin.com/in/example-aya",
    "selfIntroduction": "仕組みづくりと実験を行き来するのが好きです。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["Web・IT", "UI/UX", "事業開発"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-03", "meet-2026-04"],
    "updatedAt": "2026-04-07 18:22", "hue": 3
  },
  {
    "id": "m5", "responseId": "resp-005", "email": "kenji@example.com",
    "submittedAt": "2026-03-31 19:40", "fullName": "井上 健司", "nickname": "ケン",
    "location": "兵庫県尼崎市", "birthDate": "1978-03-30", "hometown": "兵庫県尼崎市",
    "occupation": "町工場3代目・製造業", "ubmZone": "10→100", "ubmMembershipType": "会員",
    "ubmJoinDate": "2022年9月",
    "businessOverview": "精密板金加工を手がける町工場の3代目として、既存事業のデジタル化と新規市場開拓を推進。",
    "skills": "製造業DX / 生産管理 / 取引先開拓",
    "challenges": "若手採用と技能継承",
    "canProvide": "工場見学、製造案件の相談対応",
    "hobbies": "釣り, 野球観戦", "recentInterest": "IoT導入", "motto": "現場に答えがある",
    "urlWebsite": "https://example.com/inoue-factory",
    "selfIntroduction": "ものづくりの現場から地域経済を見ています。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["製造業", "DX推進", "経営者・代表"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-02", "meet-2026-03", "meet-2026-04", "meet-2026-01"],
    "updatedAt": "2026-04-09 10:02", "hue": 4
  },
  {
    "id": "m6", "responseId": "resp-006", "email": "misaki@example.com",
    "submittedAt": "2026-04-01 07:15", "fullName": "川島 美咲", "nickname": "ミサキ",
    "location": "兵庫県神戸市", "birthDate": "1993-12-05", "hometown": "兵庫県宝塚市",
    "occupation": "フリーランスライター", "ubmZone": "0→1", "ubmMembershipType": "非会員",
    "ubmJoinDate": "2025年12月",
    "businessOverview": "ビジネス系オウンドメディアの編集と取材記事の執筆が中心。経営者インタビューを得意としています。",
    "skills": "編集 / 取材 / 構成設計",
    "canProvide": "記事企画、インタビュー代行",
    "challenges": "継続案件の確保",
    "hobbies": "読書, 映画", "recentInterest": "地方取材", "motto": "書く前に聴く",
    "urlX": "https://x.com/example_misaki", "urlNote": "https://note.com/example_misaki",
    "urlWebsite": "https://example.com/kawashima",
    "selfIntroduction": "人の物語を残す仕事をしています。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["ライター・編集", "コンテンツ制作"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-04"], "updatedAt": "2026-04-05 12:12", "hue": 5
  },
  {
    "id": "m7", "responseId": "resp-007", "email": "yuta@example.com",
    "submittedAt": "2026-03-25 22:50", "fullName": "藤田 悠太", "nickname": "ユウタ",
    "location": "兵庫県神戸市", "birthDate": "1992-07-07", "hometown": "徳島県徳島市",
    "occupation": "Webエンジニア", "ubmZone": "1→10", "ubmMembershipType": "会員",
    "ubmJoinDate": "2024年5月",
    "businessOverview": "受託開発と自社SaaSの二本立てで運営。Next.js と Cloudflare Workers が主戦場。",
    "skills": "TypeScript / React / Cloudflare Workers",
    "canProvide": "技術レビュー、アーキテクチャ相談",
    "challenges": "営業の仕組み化",
    "hobbies": "自作キーボード, ボルダリング", "recentInterest": "エッジ AI", "motto": "動くものが最強",
    "urlWebsite": "https://example.com/fujita", "urlX": "https://x.com/example_fujita",
    "urlLinkedin": "https://linkedin.com/in/example-fujita",
    "selfIntroduction": "作りたい人と作れる人をつなげたいです。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["エンジニア", "Web・IT", "AI・データ"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-03", "meet-2026-04"], "updatedAt": "2026-04-08 22:30", "hue": 6
  },
  {
    "id": "m8", "responseId": "resp-008", "email": "riko@example.com",
    "submittedAt": "2026-03-28 14:00", "fullName": "小林 璃子", "nickname": "リコ",
    "location": "兵庫県西宮市", "birthDate": "1988-04-22", "hometown": "神奈川県横浜市",
    "occupation": "コーチング・人材育成", "ubmZone": "1→10", "ubmMembershipType": "会員",
    "ubmJoinDate": "2023年11月",
    "businessOverview": "中小企業の管理職育成を中心にコーチング・研修を提供。対話型の人材開発が専門。",
    "skills": "コーチング / 研修設計 / 1on1",
    "canProvide": "管理職向け1on1研修、組織開発の相談",
    "challenges": "法人営業の開拓",
    "hobbies": "ピアノ, 散歩", "recentInterest": "組織心理学", "motto": "聴くは力なり",
    "urlWebsite": "https://example.com/kobayashi", "urlLinkedin": "https://linkedin.com/in/example-riko",
    "urlInstagram": "https://instagram.com/example.riko",
    "selfIntroduction": "安心して話せる場を、人にも組織にも作っていきたいです。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["教育・コーチング", "人事・採用"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-01", "meet-2026-02", "meet-2026-04"],
    "updatedAt": "2026-04-06 09:00", "hue": 7
  },
  {
    "id": "m9", "responseId": "resp-009", "email": "daichi@example.com",
    "submittedAt": "2026-03-26 10:33", "fullName": "渡辺 大地", "nickname": "ダイチ",
    "location": "兵庫県加古川市", "birthDate": "1983-10-14", "hometown": "広島県広島市",
    "occupation": "地域金融機関 事業支援担当", "ubmZone": "10→100", "ubmMembershipType": "会員",
    "ubmJoinDate": "2023年6月",
    "businessOverview": "地域金融機関で法人融資と事業再生を担当。創業期から事業承継まで幅広く伴走。",
    "skills": "事業再生 / 補助金 / 資金調達",
    "canProvide": "資金繰り相談、補助金申請のアドバイス",
    "challenges": "若手経営者とのネットワーク拡大",
    "hobbies": "トレイルラン, 史跡巡り", "recentInterest": "地域商社", "motto": "数字より先に現場",
    "urlLinkedin": "https://linkedin.com/in/example-daichi",
    "selfIntroduction": "お金の話を、経営者の言葉で翻訳する人でありたいです。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["金融・保険", "経営戦略", "財務・会計"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-02", "meet-2026-03"], "updatedAt": "2026-04-03 14:12", "hue": 2
  },
  {
    "id": "m10", "responseId": "resp-010", "email": "nao@example.com",
    "submittedAt": "2026-04-02 16:50", "fullName": "坂本 奈央", "nickname": "なお",
    "location": "兵庫県三田市", "birthDate": "1995-01-28", "hometown": "兵庫県三田市",
    "occupation": "動画クリエイター", "ubmZone": "0→1", "ubmMembershipType": "アカデミー生",
    "ubmJoinDate": "2025年9月",
    "businessOverview": "中小事業者向けにショート動画とYouTube運用を提供。撮影から編集・運用まで一人で完結。",
    "skills": "映像編集 / SNS運用 / 企画",
    "canProvide": "動画企画、ショート動画の制作",
    "challenges": "単価交渉と案件の標準化",
    "hobbies": "カフェ巡り, 写真", "recentInterest": "縦型動画の構成", "motto": "尺より密度",
    "urlInstagram": "https://instagram.com/example.nao", "urlYoutube": "https://youtube.com/@example_nao",
    "urlTiktok": "https://tiktok.com/@example_nao",
    "selfIntroduction": "小さな事業の魅力を動画で引き出したいです。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["動画・映像", "SNS運用", "コンテンツ制作"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-04"], "updatedAt": "2026-04-06 20:15", "hue": 3
  },
  {
    "id": "m11", "responseId": "resp-011", "email": "ryo@example.com",
    "submittedAt": "2026-03-20 12:00", "fullName": "長谷川 遼", "nickname": "リョウ",
    "location": "兵庫県神戸市", "birthDate": "1975-08-08", "hometown": "兵庫県神戸市",
    "occupation": "不動産仲介・管理", "ubmZone": "10→100", "ubmMembershipType": "会員",
    "ubmJoinDate": "2022年4月",
    "businessOverview": "神戸市内を中心に中小事業者向けの物件仲介と管理。創業支援や店舗立ち上げもサポート。",
    "skills": "店舗物件 / テナント仲介 / 管理運営",
    "canProvide": "物件相談、創業時の立地アドバイス",
    "challenges": "次世代への事業承継",
    "hobbies": "ゴルフ, 食べ歩き", "recentInterest": "空き家活用", "motto": "縁はご縁",
    "urlWebsite": "https://example.com/hasegawa",
    "selfIntroduction": "地域に根ざした不動産の仕事をしています。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["不動産", "営業・販売"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-01", "meet-2026-02", "meet-2026-03"],
    "updatedAt": "2026-04-02 15:30", "hue": 4
  },
  {
    "id": "m12", "responseId": "resp-012", "email": "yui@example.com",
    "submittedAt": "2026-04-03 09:45", "fullName": "森 結衣", "nickname": "ゆい",
    "location": "兵庫県豊岡市", "birthDate": "1991-05-11", "hometown": "兵庫県豊岡市",
    "occupation": "ゲストハウス運営", "ubmZone": "1→10", "ubmMembershipType": "会員",
    "ubmJoinDate": "2024年8月",
    "businessOverview": "但馬地域でゲストハウスと地域体験プログラムを運営。インバウンド誘客と地域内経済循環の接続。",
    "skills": "観光企画 / SNSマーケ / 多言語接客",
    "canProvide": "地域体験プログラムの設計、合宿誘致",
    "challenges": "オフシーズンの稼働率",
    "hobbies": "登山, 発酵食", "recentInterest": "地域通貨", "motto": "泊まるは関わる入り口",
    "urlInstagram": "https://instagram.com/example.yui", "urlWebsite": "https://example.com/mori-guesthouse",
    "selfIntroduction": "旅から始まる関係人口作りを目指しています。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": ["旅行・観光", "マーケティング", "事業開発"], "isPublic": true, "isDeleted": false,
    "attendance": ["meet-2026-03"], "updatedAt": "2026-04-06 16:12", "hue": 5
  },
  {
    "id": "m13", "responseId": "resp-013", "email": "former@example.com",
    "submittedAt": "2025-11-10 08:00", "fullName": "高橋 拓也", "nickname": "タクヤ",
    "location": "兵庫県加西市", "birthDate": "1986-02-03", "hometown": "兵庫県加西市",
    "occupation": "（退会）", "ubmZone": "1→10", "ubmMembershipType": "非会員",
    "ubmJoinDate": "2023年3月",
    "businessOverview": "事業形態の変更に伴い退会。",
    "publicConsent": "同意する", "ruleConsent": "同意する",
    "tags": [], "isPublic": false, "isDeleted": true,
    "attendance": ["meet-2025-12"], "updatedAt": "2025-11-20 10:15", "hue": 0,
    "deletedAt": "2025-11-20", "deletedReason": "本人希望"
  }
]
```

#### tags[]（30 件、6 カテゴリ）

```json
[
  { "category": "ビジネス・経営", "tags": ["経営者・代表", "事業開発", "経営戦略", "人事・採用", "財務・会計"] },
  { "category": "IT・テクノロジー", "tags": ["エンジニア", "Web・IT", "DX推進", "AI・データ", "UI/UX"] },
  { "category": "クリエイティブ", "tags": ["デザイン", "動画・映像", "写真", "コンテンツ制作", "ライター・編集"] },
  { "category": "マーケティング", "tags": ["マーケティング", "SNS運用", "ブランディング", "営業・販売", "広告運用"] },
  { "category": "専門職", "tags": ["士業", "医療・福祉", "教育・コーチング", "金融・保険", "研究・学術"] },
  { "category": "ライフスタイル", "tags": ["飲食・食品", "美容・健康", "不動産", "旅行・観光", "製造業"] }
]
```

#### meetings[]（5 件）

```json
[
  { "id": "meet-2026-04", "date": "2026-04-09", "label": "2026年4月支部会", "note": "プロフィール共有会", "attendees": 28 },
  { "id": "meet-2026-03", "date": "2026-03-12", "label": "2026年3月支部会", "note": "AI活用の事例共有", "attendees": 24 },
  { "id": "meet-2026-02", "date": "2026-02-15", "label": "2026年2月定例会", "note": "新年度キックオフ", "attendees": 31 },
  { "id": "meet-2026-01", "date": "2026-01-16", "label": "2026年1月新年会", "note": "懇親会中心", "attendees": 26 },
  { "id": "meet-2025-12", "date": "2025-12-11", "label": "2025年12月支部会", "note": "1年振り返り", "attendees": 22 }
]
```

#### schemaDiff[]（5 件）

```json
[
  { "type": "added",      "stableKey": null,                "questionId": "q_2026apr_01",   "itemId": "i_891", "label": "会社紹介文",      "note": "2026-04-08 のフォーム編集で追加" },
  { "type": "changed",    "stableKey": "businessOverview",  "questionId": "q_1f3d21",       "label": "ビジネス概要",   "note": "プレースホルダー文言が更新 (位置は変わらず)" },
  { "type": "changed",    "stableKey": "urlX",              "questionId": "q_x901",         "label": "X（Twitter）URL", "note": "「Twitter」→「X」に表記変更" },
  { "type": "removed",    "stableKey": "urlThreads",        "questionId": "q_8ea1",         "label": "Threads URL",   "note": "旧回答は保持。UIからは非表示扱いに" },
  { "type": "unresolved", "stableKey": null,                "questionId": "q_unmapped_7711","label": "名刺配布OK？",   "note": "新規追加 — stableKey 未割当" }
]
```

#### schemaVersions[]（3 件）

```json
[
  { "revisionId": "rev-20260408-1", "schemaHash": "a3f9b2d1", "date": "2026-04-08 16:20", "state": "active",     "fieldCount": 31, "unknownCount": 1 },
  { "revisionId": "rev-20260312-1", "schemaHash": "7e21c8a4", "date": "2026-03-12 10:05", "state": "superseded", "fieldCount": 30, "unknownCount": 0 },
  { "revisionId": "rev-20260215-1", "schemaHash": "c991f2d8", "date": "2026-02-15 09:30", "state": "superseded", "fieldCount": 30, "unknownCount": 0 }
]
```

#### aliasHistory[]（2 件）

```json
[
  { "stableKey": "urlX",             "oldQuestionId": "q_twitter_771", "newQuestionId": "q_x901",   "resolvedAt": "2026-04-08 16:22", "resolvedBy": "admin@example.com" },
  { "stableKey": "businessOverview", "oldQuestionId": "q_1f3c",        "newQuestionId": "q_1f3d21", "resolvedAt": "2026-03-12 10:08", "resolvedBy": "system" }
]
```

#### requests[]（fixture サンプル、prototype 拡張）

```json
[
  { "id": "req-001", "memberId": "m1", "type": "profile-update", "status": "pending",     "payload": { "field": "occupation", "next": "AI事業開発リード" }, "submittedAt": "2026-04-08 11:00" },
  { "id": "req-002", "memberId": "m4", "type": "tag-change",     "status": "approved",    "payload": { "add": ["AI・データ"], "remove": [] }, "submittedAt": "2026-04-05 09:20", "resolvedAt": "2026-04-06 10:00", "resolvedBy": "admin@example.com" },
  { "id": "req-003", "memberId": "m6", "type": "withdrawal",     "status": "in_progress", "payload": { "reason": "事業形態の変更" }, "submittedAt": "2026-04-07 08:00" },
  { "id": "req-004", "memberId": "m8", "type": "profile-update", "status": "rejected",    "payload": { "field": "urlWebsite", "next": "invalid-url" }, "submittedAt": "2026-04-04 19:00", "resolvedAt": "2026-04-05 09:00", "resolvedBy": "admin@example.com", "reason": "URL 形式不正" },
  { "id": "req-005", "memberId": "m9", "type": "other",          "status": "pending",     "payload": { "note": "プロフィール画像差し替え依頼" }, "submittedAt": "2026-04-09 07:45" }
]
```

#### identityConflicts[]（fixture サンプル、prototype 拡張）

```json
[
  { "id": "m6__m1", "sourceMemberId": "m6", "targetMemberId": "m1", "fullName": "山田 太郎", "occupation": "生成AIコンサルタント", "matchedFields": ["fullName", "occupation"], "detectedAt": "2026-04-08 02:00", "status": "open" },
  { "id": "m13__m11", "sourceMemberId": "m13", "targetMemberId": "m11", "fullName": "長谷川 遼", "occupation": "不動産仲介・管理", "matchedFields": ["fullName"], "detectedAt": "2026-04-07 02:00", "status": "dismissed", "resolvedAt": "2026-04-07 10:00", "resolvedBy": "admin@example.com", "reason": "別人と確認済み" }
]
```

#### auditEvents[]（fixture サンプル、prototype 拡張）

```json
[
  { "id": "audit-001", "action": "schema_diff.alias_assigned", "actor": "admin@example.com", "targetId": "urlX",           "payload": { "oldQuestionId": "q_twitter_771", "newQuestionId": "q_x901" }, "occurredAt": "2026-04-08 16:22" },
  { "id": "audit-002", "action": "member.profile_updated",    "actor": "taro@example.com",   "targetId": "m1",            "payload": { "field": "occupation" }, "occurredAt": "2026-04-09 09:30" },
  { "id": "audit-003", "action": "admin.member_unpublished",  "actor": "admin@example.com", "targetId": "m3",             "payload": { "reason": "publicConsent=同意しない" }, "occurredAt": "2026-04-01 11:45" },
  { "id": "audit-004", "action": "request.approved",          "actor": "admin@example.com", "targetId": "req-002",        "payload": { "memberId": "m4" }, "occurredAt": "2026-04-06 10:00" },
  { "id": "audit-005", "action": "identity_conflict.dismissed","actor": "admin@example.com","targetId": "m13__m11",       "payload": { "reason": "別人と確認済み" }, "occurredAt": "2026-04-07 10:00" }
]
```

### 2.3 stableKey 一覧

prototype data に登場する stableKey（`SURVEY_SECTIONS[*].fields[*].key`）の全列挙。

| stableKey | section | 用途 | 期待値（型） |
|-----------|---------|------|------------|
| `fullName` | basic_profile | 表示名 / 検索キー | string（必須） |
| `nickname` | basic_profile | 親称表示 | string |
| `location` | basic_profile | 居住地 / 地域フィルタ | string（必須） |
| `birthDate` | basic_profile | 年齢計算（member 限定） | `YYYY-MM-DD` |
| `occupation` | basic_profile | 職業表示 / identity 候補 | string（必須） |
| `hometown` | basic_profile | 出身地 | string |
| `ubmZone` | ubm_profile | フィルタ tag | enum `0→1` / `1→10` / `10→100` |
| `ubmMembershipType` | ubm_profile | 参加ステータス | enum `会員` / `非会員` / `アカデミー生` |
| `ubmJoinDate` | ubm_profile | 加入時期表示（member 限定） | string |
| `businessOverview` | ubm_profile | プロフィール本文 | string（必須） |
| `skills` | ubm_profile | 強み一覧 | string |
| `challenges` | ubm_profile | 現在の課題（member 限定） | string |
| `canProvide` | ubm_profile | 提供可能なこと | string |
| `hobbies` | personal_profile | 趣味 | string |
| `recentInterest` | personal_profile | 最近関心 | string |
| `motto` | personal_profile | 座右の銘 | string |
| `otherActivities` | personal_profile | 仕事以外の活動 | string |
| `urlWebsite` | social_links | 公式サイト | URL |
| `urlX` | social_links | X（旧 Twitter） | URL |
| `urlInstagram` | social_links | Instagram | URL |
| `urlFacebook` | social_links | Facebook | URL |
| `urlLinkedin` | social_links | LinkedIn | URL |
| `urlNote` | social_links | note | URL |
| `urlYoutube` | social_links | YouTube | URL |
| `urlThreads` | social_links | Threads | URL |
| `urlTiktok` | social_links | TikTok | URL |
| `selfIntroduction` | message | 一言自己紹介 | string |
| `publicConsent` | consent | 公開可否 | enum `同意する` / `同意しない`（必須） |
| `ruleConsent` | consent | 利用規約同意（※ schema 上は `ruleConsent`、不変条件では `rulesConsent`） | enum `同意する` / `同意しない`（必須） |

> **注意 — consent key の正本**: CLAUDE.md 不変条件 §2 では `publicConsent` / `rulesConsent` に統一すると規定。prototype data.jsx は歴史的経緯で `ruleConsent`（単数形）を採用しているため、本番実装では `rulesConsent` に rename する。schema diff API も alias 経由で吸収する。

### 2.4 状態列挙

#### publishState

メンバーの公開状態。`Member.isPublic` + `Member.isDeleted` + `publicConsent` から導出。

| 値 | 条件 | 表示 |
|----|------|------|
| `published` | `isPublic=true` AND `isDeleted=false` AND `publicConsent="同意する"` | 公開ディレクトリに表示 |
| `unpublished` | `isPublic=false` AND `isDeleted=false` | 公開ディレクトリ非表示・admin で参照可 |
| `withheld` | `publicConsent="同意しない"` | 強制 unpublish（admin もマスキング表示） |
| `deleted` | `isDeleted=true` | tombstone のみ admin に表示 |

#### memberStatus

| 値 | 由来 | 説明 |
|----|------|------|
| `active` | `isDeleted=false` | 通常会員 |
| `inactive` | `ubmMembershipType="非会員"` AND `isDeleted=false` | 非会員フラグだが record は残存 |
| `withdrawn` | `isDeleted=true` | 退会済（`deletedAt` / `deletedReason` 必須） |

#### requestStatus

| 値 | 説明 |
|----|------|
| `pending` | 未処理（admin 確認待ち） |
| `in_progress` | 対応中 |
| `approved` | 承認済（差分反映済） |
| `rejected` | 却下（`reason` 必須） |

#### schemaDiffStatus

`SchemaDiff.type` に対応。

| 値 | 説明 |
|----|------|
| `added` | フォームに新規項目追加。`stableKey=null` で `recommendedStableKeys` 候補が API から提示される |
| `changed` | 既存 stableKey の label / placeholder 等変更（位置不変） |
| `removed` | フォームから削除。旧回答は `__removed__:<stableKey>` として保持 |
| `unresolved` | stableKey 未割当のまま admin が放置している状態 |

#### schemaVersionState

| 値 | 説明 |
|----|------|
| `active` | 現行版 |
| `superseded` | 過去版（参照のみ） |

#### identityConflictStatus

| 値 | 説明 |
|----|------|
| `open` | admin が判断未着手 |
| `merged` | 同一人物として merge 済 |
| `dismissed` | 別人と確認済（`identity_conflict_dismissals` に記録） |

#### tweaks 値（prototype のみ。本番には移植しない）

| key | 値 | 出典 |
|-----|------|------|
| `theme` | `stone` / `warm` / `cool` | app.jsx:226 |
| `nav` | `sidebar` / `topbar` / `minimal` | app.jsx:232 |
| `density` | `comfy` / `dense` / `list` | app.jsx:238 |
| `detailLayout` | `hero` / `vertical` / `split2` | app.jsx:244 |
| `editMode` | boolean | app.jsx:8 |

### 2.5 prototype 出典

| 項目 | prototype 出典 | 行 |
|------|---------------|-----|
| SURVEY_SECTIONS | data.jsx | 3–75 |
| TAG_CATALOG | data.jsx | 77–84 |
| ALL_TAGS | data.jsx | 86 |
| MEETINGS | data.jsx | 88–94 |
| MEMBERS | data.jsx | 96–315 |
| SCHEMA_DIFF | data.jsx | 317–323 |
| SCHEMA_VERSIONS | data.jsx | 325–329 |
| ALIAS_HISTORY | data.jsx | 331–334 |
| `window.UBM` export | data.jsx | 336–339 |

---

## 3. 既存 API surface との対応

prototype fixture を本番 API endpoint の response shape にマッピングする。adapter が必要な箇所は明示する。

| fixture | 対応 endpoint | 対応 spec | adapter 方針 |
|---------|--------------|----------|-------------|
| `MEMBERS[*]`（公開） | `GET /public/members` | `01-api-schema.md` §Public members API | `isPublic && !isDeleted && publicConsent="同意する"` で filter。response item は `MemberSummary`（`id` / `fullName` / `location` / `occupation` / `tags` / `hue`）に縮約 |
| `MEMBERS[*]`（詳細・公開） | `GET /public/members/:id` | `01-api-schema.md` §Public members API + `04-types.md` §stable member 型 | visibility=public のフィールドのみ返す。`birthDate` / `challenges` / `ubmJoinDate` 等 visibility=member は除外 |
| `MEMBERS[*]`（自分） | `GET /me/profile` | `01-api-schema.md` §`MemberProfile.attendance` / `04-types.md` §response 型 | full record + `attendance` を `AttendanceRecord[]`（`sessionId` / `title` / `heldOn`）に展開 |
| `MEMBERS[*]`（管理） | `GET /admin/members` / `GET /admin/members/:id` | `11-admin-management.md` | tombstone `isDeleted=true` も含めて返す。`responseEmail` を system field として merge |
| `TAG_CATALOG` | `GET /tags` | `12-search-tags.md` | shape は同一。本番ではカテゴリ並び順の `order` field を追加可能 |
| `ALL_TAGS` | derived | – | `TAG_CATALOG.flatMap(g => g.tags)` で導出。endpoint 化しない |
| `MEETINGS[*]` | `GET /meetings` / `GET /me/profile.attendance` builder の lookup table | `01-api-schema.md` §`MemberProfile.attendance` | `meeting_sessions` table と 1:1。`attendees` は集計列で derive |
| `SCHEMA_DIFF[*]` | `GET /admin/schema/diff` | `01-api-schema.md` §schema sync metadata / §schema alias assignment API（07b） | response に `recommendedStableKeys: string[]` を同梱。fixture には未記載 → adapter で `[]` を default 値として注入 |
| `SCHEMA_VERSIONS[*]` | `GET /admin/schema/versions` | `01-api-schema.md` §保存ルール | shape ほぼ同一 |
| `ALIAS_HISTORY[*]` | `GET /admin/schema/aliases` | `01-api-schema.md` §schema alias assignment API（07b） | fixture と同一 |
| `requests[*]`（拡張） | `GET /admin/requests` / `GET /me/requests` | `07-edit-delete.md` | prototype data.jsx に直接定義なし → 本書 §2.2 の shape を正本化 |
| `identityConflicts[*]`（拡張） | `GET /admin/identity-conflicts` / `POST /admin/identity-conflicts/:id/(merge|dismiss)` | `01-api-schema.md` §admin identity conflict merge API（Issue #194） | fixture id は `<source>__<target>` で endpoint param と整合 |
| `auditEvents[*]`（拡張） | `GET /admin/audit` | `11-admin-management.md` | `action` 文字列は dot-separated で固定。`actor` は email or `system` |

### gap がある場合の adapter 方針

- prototype に存在しない field（`recommendedStableKeys` / `responseEmail` / `attendance` の展開等）は **API builder 層で injection** し、prototype を変更しない。
- prototype 側の `ruleConsent`（単数形）は API レイヤで **`rulesConsent`（複数形）に rename**。schema diff の alias 機構（`POST /admin/schema/aliases`）で吸収する。
- `Member.attendance: string[]`（meeting id）は API では `AttendanceRecord[]`（INNER JOIN 結果）に変換する。fixture 利用テストでは `createAttendanceProvider(ctx)` を test double に差し替える。
- `Member.hue: 0..7` は UI 専用の avatar 色 index。本番 DB には保持せず、`hash(memberId) % 8` で deterministic に算出する。

---

## 4. 一覧用語集

prototype と本番で表記が揺れる用語を統一する。

| 用語 | 出典 | 公式英訳 | 表記統一 |
|------|------|---------|---------|
| 支部会 | data.jsx MEETINGS.label | chapter meeting | 「支部会」/「定例会」を区別せず、UI 表示は実体名（例: 2026年4月支部会）で揃える |
| 区画 | data.jsx ubmZone | UBM zone | コード上 `ubmZone`、UI 表示は「UBM区画」 |
| 参加ステータス | data.jsx ubmMembershipType | UBM membership type | コード `ubmMembershipType`、UI 表示「UBM参加ステータス」 |
| プロフィール公開 | data.jsx publicConsent | public consent | UI「ホームページ掲載に同意」、コード `publicConsent` |
| 利用規約同意 | data.jsx ruleConsent | rules consent | UI「勧誘ルール・免責事項への同意」、コード `rulesConsent`（複数形に統一） |
| メンバー一覧 | app.jsx ROUTES.members | member list / public directory | UI 表示「メンバー一覧」、内部用語「公開ディレクトリ」 |
| マイページ | app.jsx ROUTES.my | my page / member profile | UI「マイページ」、route `/my` |
| ダッシュボード | app.jsx ROUTES.admin-dashboard | admin dashboard | UI「ダッシュボード」、route `/admin/dashboard` |
| スキーマ差分 | app.jsx ROUTES.schema-diff | schema diff | UI「スキーマ差分」、内部用語 `SchemaDiff` |
| stableKey | data.jsx SURVEY_SECTIONS.fields.key | stable key | コード `stableKey` 統一。Google Form の `questionId` とは別概念 |
| revisionId | data.jsx SCHEMA_VERSIONS.revisionId | schema revision id | `rev-YYYYMMDD-N` 形式 |
| schemaHash | data.jsx SCHEMA_VERSIONS.schemaHash | schema hash | 8 hex の short hash |
| 退会 | data.jsx isDeleted=true | withdrawn | UI「退会」、enum `memberStatus="withdrawn"` |
| 同意する / 同意しない | data.jsx consent fields | accepted / declined | UI は日本語ラベル、API は enum 文字列をそのまま流通 |
| メンバー登録 | app.jsx ROUTES.member-form | member registration | UI「メンバー登録」、route `/member-form` |
| タグ割当 | app.jsx ROUTES.admin-tags | tag assignment | UI「タグ割当」、route `/admin/tags` |
| アバター hue | data.jsx Member.hue | avatar hue index | 0..7 の整数。`hash(id) % 8` で deterministic |
| brand-mark | app.jsx Sidebar | brand mark | UI 表示「兵」1 文字（兵庫の頭文字） |

---

## 関連 spec

- `00-overview.md` — システム全体概要
- `01-api-schema.md` — フォーム schema / API contract（§3 マッピング表の正本）
- `04-types.md` — `Member` / `PublishState` / `MemberProfile` 型定義の正本
- `05-pages.md` — page 別レイアウト
- `09-ui-ux.md` — UI/UX 全体ガイドライン
- `11-admin-management.md` — admin pages / audit
- `12-search-tags.md` — tags / search
- `docs/00-getting-started-manual/claude-design-prototype/app.jsx` — shell prototype 出典
- `docs/00-getting-started-manual/claude-design-prototype/data.jsx` — fixtures prototype 出典

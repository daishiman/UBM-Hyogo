# task-06 ui-ux-contract-rewrite

> **責務再定義 (2026-05-07)**: 09-ui-ux.md は契約のみ。詳細仕様は task-19..22 が新設する 09c..09h に分離。本タスクは 09-ui-ux.md にこれら新ファイルへの index 表（"視覚詳細は 09c 参照" 等）を含める。
>
> 追加 index 表（§1 末尾もしくは §6 直前に配置）:
>
> | spec | 担当 task | 役割 |
> |------|----------|------|
> | `09a-prototype-map.md` | task-07 | prototype source ↔ 本番 component の行範囲 mapping |
> | `09b-design-tokens.md` | task-08 | OKLch / radius / shadow / typography / spacing token 値 |
> | `09c-primitives.md` | task-19 | primitive component の完全仕様（JSX inline + a11y） |
> | `09d-icons.md` | task-22 | icon カタログ（icons.jsx 由来） |
> | `09e-screen-blueprints-public.md` | task-20 | 公開層全画面の完全 blueprint |
> | `09f-screen-blueprints-member.md` | task-20 | 会員層全画面の完全 blueprint |
> | `09g-screen-blueprints-admin.md` | task-21 | 管理層全画面の完全 blueprint（未掲載派生ルール含む） |
> | `09h-shell-and-fixtures.md` | task-22 | app shell + fixture data (app.jsx + data.jsx) |
>
> 本契約 §2 routes 表の「視覚詳細」列リンク先は、視覚 mapping は 09a、画面 blueprint は 09e/09f/09g、shell は 09h、icon は 09d、primitive は 09c を参照する形に整理する。

## §0. 自己完結コンテキスト

このタスクを単独で着手する担当者が、外部資料に遡らずとも実装判断できるよう、必須前提を本節に閉じ込める。

### 0.1 上位ゴール

UBM 兵庫支部会メンバーサイトの UI 仕様書 `09-ui-ux.md` を「契約のみ」（props / state / a11y / token 参照名）に再構成し、視覚詳細・色値・余白値・フォント値・行範囲を一切残さない。視覚詳細は task-07 (`09a-prototype-map.md`) と task-08 (`09b-design-tokens.md`) に分離委譲し、Storybook story を component の正解スクリーンショットの正本とする位置付けに揃える。これにより 19 routes × 13 primitives + feature components の契約が単一ファイルから grep 可能となり、後続 task-09 / task-10 / task-11..17 が「contract 表 1 行 → 実装 1 ファイル」の決定論的対応で進められる状態を作る。

### 0.2 DAG 座標

- 依存元: なし（task-01 scope-gate-all-screens 完了のみ前提）
- 依存先: task-09（tailwind-v4-setup）/ task-10（ui-primitives）/ task-11..17（各画面実装）
- 並列性: **task-07（prototype mapping）/ task-08（design tokens）と並列実行可**。三者は責務が相互排他（契約 / mapping / 値）であり、相互参照は link 経由のみ。

### 0.3 触れるファイル群

- M（書き換え）: `docs/00-getting-started-manual/specs/09-ui-ux.md`（現行 160 行 → 契約のみ 300〜420 行）
- R（参照のみ）: `docs/00-getting-started-manual/claude-design-prototype/{primitives,pages-public,pages-member,pages-admin,app}.jsx`、`docs/00-getting-started-manual/claude-design-prototype/styles.css`、`outputs/phase-1/phase-1.md`、`outputs/phase-2/phase-2.md`、`outputs/phase-3/phase-3.md`
- 新規作成・削除: なし（task-07 / task-08 が新規ファイルを担当）

### 0.4 既存 API（不変）

API 契約は `outputs/phase-3/phase-3.md` §2 を **正本**として転記する。route × endpoint × method の 3 タプルを 1 字も改変しない。

- `GET /public/stats` / `GET /public/members` / `GET /public/members/:id` / `GET /public/form-preview` / `GET /public/meetings`
- `POST /auth/magic-link/request` / `POST /auth/magic-link/verify` / `POST /auth/logout`
- `GET /me/profile` / `PATCH /me/visibility` / `POST /me/visibility-requests` / `POST /me/delete-requests`
- `GET /admin/kpi` / `GET /admin/members` / `PATCH /admin/members/:id` / `GET /admin/tags` / `POST /admin/tags/:id/{approve,reject}` / `GET /admin/schema/diff` / `POST /admin/schema/apply` / `GET /admin/requests` / `POST /admin/requests/:id/{approve,reject}` / `GET /admin/identity-conflicts` / `POST /admin/identity-conflicts/:id/resolve` / `GET /admin/audit` / `GET /admin/meetings` / `POST /admin/meetings`

これらの schema・status code・error envelope は本タスクで新規定義しない（phase-3 が正本）。

### 0.5 不変条件

1. `apps/web` から D1 への直接アクセス禁止（CLAUDE.md 不変条件 5）。契約上も `apps/api` 経由の API 接続のみ記述する。
2. consent キーは `publicConsent` / `rulesConsent` の 2 種に統一（CLAUDE.md 不変条件 2）。
3. `responseEmail` は Google Form 項目ではなく system field として扱う（CLAUDE.md 不変条件 3）。
4. 視覚詳細値（HEX / oklch / px / `bg-[#...]`）を `09-ui-ux.md` に **0 件** とする（§6.2 grep gate）。
5. プロトタイプ EDITMODE 専用要素（TweaksPanel / data-theme switcher / AvatarStoreProvider の localStorage 部分）は不採用として明記する（CLAUDE.md 不変条件 6）。
6. login 5 状態（input / sent / unregistered / deleted / error）は新 §4.2 で正本化し、`pages-member.jsx` L4-L67 の構造に従う。
7. dialog / drawer は WAI-ARIA Authoring Practices に従い `role="dialog" + aria-modal="true" + focus trap + Esc close` を §5.2 に必ず記述する。

### 0.6 上流から受け取るシグネチャ

本タスクは依存元なし（task-01 scope-gate のみ）。受け取り情報は以下:

- phase-1 §3 の 19 routes 一覧（公開 6 / 会員 2 / 管理 8 / 共通 3）
- phase-2 §4 の primitives 列挙（13 primitives + feature components）
- phase-3 §2 の API 接続表（routes × endpoint × method）
- phase-3 §3 の未掲載画面派生ルール（§5 法務 / §5.2 register / §5.3 admin queue / §5.4 admin CRUD / §5.5 admin diff / §5.6 admin compare / §5.7 admin timeline / §5.8 共通 error/404/loading）

### 0.7 下流へ渡すシグネチャ

新 `09-ui-ux.md` は以下の **grep 可能な見出し**を必ず提供する。後続 task はこれらの見出し直下のテーブルを契約として参照する:

- `## 1. 位置づけと正本主義`
- `## 2. 19 routes 全画面の契約一覧`
  - `### 2.1.1 \`/\` (Public Top)` 〜 `### 2.4.4 \`app/loading.tsx\`` まで 19 個（小数点付き連番）
- `## 3. component 契約一覧`
  - `### 3.1 primitives` 配下に `#### 3.1.1 Button` / `#### 3.1.2 Card` / ... の連番
  - `### 3.2 feature components` 配下に `#### 3.2.1 Hero` / `#### 3.2.2 Stats` / ... の連番
- `## 4. 状態列挙の規範`（`### 4.1 ページ標準 5 値` / `### 4.2 login 5 状態` / `### 4.3 申請 pending state`）
- `## 5. アクセシビリティ契約`（`### 5.1 全画面共通` / `### 5.2 dialog / drawer` / `### 5.3 form / input` / `### 5.4 live region`）
- `## 6. token 参照規則`（`### 6.1 視覚値の決定権は 09b にある` / `### 6.2 OKLch tokens を CSS 変数経由でのみ参照` / `### 6.3 token 名 prefix 規則`）
- `## 7. Storybook 正本主義`
- `## 8. 不採用画面・不採用パターン`
- `## 9. 用語集`
- `## 10. 改訂履歴`

各 §2.x.y / §3.x.y は **同じ列構成のテーブル**で記述する:
- §2 routes: `| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |`
- §3 primitives: `| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |`

token 参照名（§3 の `token` 列）は task-08 が確定する `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-space-*` / `--ubm-text-*` / `--ubm-font-*` / `--ubm-dur-*` / `--ubm-ease-*` の **正規 prefix** を grep 一致で参照する（値は記述しない）。

### 0.8 用語

- **契約**: props / state / a11y 仕様 / token 参照名（値ではなく名前）/ API 接続。本ファイルが正本。
- **視覚詳細**: HEX / oklch / px / 余白 / フォント値 / Hero 構成順序など。task-07（mapping）/ task-08（token 値）/ Storybook（VRT）が正本。
- **routes 19**: 公開 6（`/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）+ 会員 2（`/login`, `/profile`）+ 管理 8（`/(admin)/admin{,/members,/tags,/meetings,/schema,/requests,/identity-conflicts,/audit}`）+ 共通 3（`error.tsx`, `not-found.tsx`, `loading.tsx`）+ `global-error.tsx` の 19+1。
- **primitives 13**: Button / Card / Badge / Input / Select / Table / Tabs / Sidebar / Toast / Skeleton / DataTable / EmptyState / ErrorState。
- **feature components**: Hero / Stats / ZoneGuide / Timeline / MemberCard / MemberList / FilterBar / DensityToggle / MemberDetail / VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel / KpiGrid / ZoneChart / StatusChart / RecentActions / MembersTable / MemberDrawer / TagsQueue / MeetingsCalendar / MeetingForm / RequestsQueue / RequestDetail / SchemaDiff / ConflictPair / AuditTimeline / AuditFilterBar / LegalProse。
- **gate-state**: ページ標準 5 値（idle / loading / empty / error / success）。
- **server-pending**: visibility-request / delete-request の申請後サーバ側 pending 状態。クライアントから上書き禁止。

---

> 責務 dir: `03-spec-source`
> 想定工数: 1.0 人日
> 主担当: Tech Writer
> 依存: task-01（scope-gate-all-screens）完了
> 後続: task-09 / task-10（contract に従って primitives を実装）

---

## 1. ヘッダー

| 項目 | 値 |
|------|---|
| task id | 06 |
| task name | ui-ux-contract-rewrite |
| const ref | CONST_005（仕様書必須項目）/ CONST_007（単一サイクル） |
| 入力 | `docs/00-getting-started-manual/specs/09-ui-ux.md`（現行版・160 行）<br>`docs/00-getting-started-manual/claude-design-prototype/{primitives.jsx, pages-*.jsx, styles.css}`<br>phase-1..3 の outputs 全文 |
| 出力 | `docs/00-getting-started-manual/specs/09-ui-ux.md`（**全面書き換え**・契約のみ）<br>※ 視覚詳細は task-07 (`09a-prototype-map.md`) と task-08 (`09b-design-tokens.md`) に分離 |
| 主成果物の DoD | §8 参照 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. 既存 `09-ui-ux.md` を「契約のみ」に再構成し、視覚詳細・色値・余白値・フォント値を一切残さない。
2. 19 routes 全画面について、**props・state・a11y・トークン参照名**だけを正本化する。
3. 視覚詳細は `09a-prototype-map.md` (task-07) / `09b-design-tokens.md` (task-08) に **link で委譲**する。
4. Storybook + デザイントークン正本主義に整合させる（component の正解値は token と Storybook story、ドキュメントは契約）。
5. component の API（props 名、状態列挙、aria-* 仕様）が phase-1 §8 / phase-3 §3 と齟齬なく書かれている。

### 2.2 非ゴール

- 実装コード変更（task-09, 10, 11..17 で行う）
- token 値の決定（task-08）
- prototype mapping 表の作成（task-07）
- 新 component の追加・廃止判定（contract 上の列挙のみ。実装は task-10）
- Storybook 環境構築（後続 workflow。本タスクは「契約上 Storybook を正本扱いする」と明記するのみ）

---

## 3. 変更対象ファイル表

| 区分 | path | 概要 |
|------|------|------|
| M（書き換え） | `docs/00-getting-started-manual/specs/09-ui-ux.md` | 契約のみ版に全面書き換え |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | 契約抽出元 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` | 公開層画面の状態列挙抽出 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` | 会員層画面の状態列挙抽出 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | 管理層画面の状態列挙抽出 |
| R（参照） | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` | API 接続の正本（§2 マッピング） |
| R（link 先・新規） | `docs/00-getting-started-manual/specs/09a-prototype-map.md` | task-07 で作成 |
| R（link 先・新規） | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | task-08 で作成 |

新規作成・削除は無し。書き換え 1 ファイルのみ（task-07, 08 は別 task で新規作成）。

---

## 4. 詳細差分（章立て差分）

### 4.1 旧 `09-ui-ux.md` の章立て（160 行・現行版）

```
1. 位置づけ
2. 情報設計の基本原則
3. レイヤ別 UX (公開 / 会員 / 管理)
4. 一覧 UX (検索 / カード / 空状態)
5. 詳細 UX (公開詳細 / マイページ)
6. 管理 UX (ダッシュボード / メンバー管理 / タグ / スキーマ / 開催日)
7. コンポーネント方針
   - 7.1 06a 公開層コンポーネント契約
8. 不採用と注意事項
```

問題: 視覚詳細（Hero 構成順序、密度切替の値、KPI 文言など）と契約（props / state / a11y）が混在している。

### 4.2 新 `09-ui-ux.md` の章立て（契約のみ・目標 320〜420 行）

```
1. 位置づけと正本主義
   1.1 「契約のみ」スコープ（このファイルが扱うこと / 扱わないこと）
   1.2 link 先（09a / 09b / Storybook）
2. 19 routes 全画面の契約一覧（必ず網羅）
   2.1 公開層 (6 routes)
   2.2 会員層 (2 routes)
   2.3 管理層 (8 routes)
   2.4 共通 (3 routes: error / not-found / loading)
3. component 契約一覧（13 primitives + feature components）
   3.1 primitives (Button / Card / Badge / Input / Select / Table / Tabs / Sidebar / Toast / Skeleton / DataTable / EmptyState / ErrorState)
   3.2 feature components (Hero / Stats / ZoneGuide / Timeline / MemberCard / MemberList / FilterBar / DensityToggle / MemberDetail / VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel / KpiGrid / ZoneChart / StatusChart / RecentActions / MembersTable / MemberDrawer / TagsQueue / MeetingsCalendar / MeetingForm / RequestsQueue / RequestDetail / SchemaDiff / ConflictPair / AuditTimeline / AuditFilterBar / LegalProse)
4. 状態列挙の規範
   4.1 ページ状態の標準 5 値 (idle / loading / empty / error / success)
   4.2 login 5 状態 (input / sent / unregistered / deleted / error)
   4.3 申請 pending state の正本 (server-pending を上書き禁止)
5. アクセシビリティ契約
   5.1 全画面共通
   5.2 dialog / drawer
   5.3 form / input
   5.4 live region (status / alert)
6. token 参照規則
   6.1 視覚値の決定権は 09b にある
   6.2 OKLch tokens を CSS 変数経由でのみ参照（HEX / `bg-[#...]` 直書き禁止）
   6.3 token 名 prefix 規則（`--ubm-color-*`, `--ubm-space-*`, `--ubm-radius-*`, `--ubm-shadow-*`）
7. Storybook 正本主義
   7.1 contract と Storybook story の責務分担
   7.2 component の「正解スクリーンショット」は Storybook の VRT 画像が正本
8. 不採用画面・不採用パターン
9. 用語集（zone / gate-state / visibility-request / identity-conflict / pending banner）
10. 改訂履歴
```

差分の核心:

- 旧 §3〜§6（レイヤ別 UX / 一覧 UX / 詳細 UX / 管理 UX）の **視覚詳細記述を削除**し、新 §2 で routes 軸の契約表に統合
- 旧 §7「コンポーネント方針」を新 §3 に移し、props 一覧表に統一
- 新 §6 で「視覚値の決定権は 09b にある」と明文化
- 新 §7 で Storybook 正本主義を導入

### 4.3 新 §2 routes 契約サンプル文面（公開トップを正本例として明示）

```markdown
### 2.1.1 `/` (Public Top)

| 項目 | 内容 |
|------|------|
| 認可 | unauthenticated 可 / authenticated 可 |
| layout | `(public)/layout.tsx`（Header + Footer） |
| 主 component | `Hero`, `Stats`, `ZoneGuide`, `Timeline` |
| API | `GET /public/stats`, `GET /public/members?limit=6&order=recent`, `GET /public/form-preview`（並列） |
| 状態 | idle → loading → (success \| error \| empty) |
| 主 props | `Hero { title, subtitle, primaryCta, secondaryCta }` / `Stats { stats: PublicStatsView }` / `Timeline { meetings: TimelineItem[] }` |
| a11y | landmark `<main>` / `<nav>` / `<footer>` 必須。`Hero` の見出しは `<h1>` 1 個。`Stats` 各 card は `role="figure"` + `aria-labelledby` |
| token | `--ubm-color-bg`, `--ubm-color-panel`, `--ubm-color-accent`, `--ubm-radius-lg`, `--ubm-shadow-md` |
| 視覚詳細 | → `09a-prototype-map.md` §1.1（`pages-public.jsx` L4-L154 由来） |
| 不採用 | `theme switcher` UI（プロトタイプ EDITMODE 専用） |
```

19 routes 全てを上記表形式で **同じ列構成**で書き切る（contract 表が 19 個並ぶ章）。

### 4.4 新 §3 component 契約サンプル文面（Button を例に）

```markdown
#### 3.1.1 Button

| 項目 | 内容 |
|------|------|
| variants | `primary` \| `accent` \| `ghost` \| `soft` \| `danger` |
| sizes | `sm` \| `md`（既定）\| `lg` |
| props | `children`, `variant`, `size`, `icon`, `iconRight`, `block`, `disabled`, `type`, `title`, `onClick` |
| a11y | `<button type="...">` native semantics 必須。icon-only の場合は `aria-label` 必須 |
| state | `default` / `hover` / `focus-visible` / `active` / `disabled` |
| token | `--ubm-color-accent`, `--ubm-color-text`, `--ubm-radius-md`, `--ubm-shadow-xs` |
| 視覚詳細 | → `09a-prototype-map.md` §2.1（`primitives.jsx` L92-L110 由来） |
| Storybook | `apps/web/src/components/ui/button.stories.tsx`（task-10 で作成） |
```

### 4.5 移植する prototype 由来の契約一覧（コア）

| prototype 由来 | 契約に取り込む情報 | 取り込み先 |
|--------------|------------------|-----------|
| `primitives.jsx` Chip (L6-L14) | tone (`default`/`accent`/`ok`/`warn`/`danger`/`info`), `outline`, `dot`, `size: sm` | §3.1 Badge |
| `primitives.jsx` Button (L92-L110) | variants, sizes, icon/iconRight/block | §3.1 Button |
| `primitives.jsx` Switch (L113-L115) | `aria-pressed` の使用 | §3.1 Switch |
| `primitives.jsx` Segmented (L118-L126) | options[].value/label, 単一選択 | §3.1 Segmented |
| `primitives.jsx` Field (L129-L143) | `label`, `required`, `optional`, `hint`, `error` | §3.1 Field |
| `primitives.jsx` Drawer (L158-L174) | `role="dialog"`, Esc close, focus trap | §3.1 Drawer + §5.2 |
| `primitives.jsx` Modal (L177-L195) | scrim click close, Esc close | §3.1 Modal + §5.2 |
| `primitives.jsx` Toast (L198-L223) | tone (`default`/`ok`/`warn`/`danger`), 3.2s 自動消滅 | §3.1 Toast + §5.4 |
| `primitives.jsx` KVList (L226-L235) | `rows: { k, v }[]`, 空値 `—` 表示 | §3.1 KVList |
| `primitives.jsx` LinkPills (L248-L262) | `LINK_LABELS` map, external new tab | §3.2 LinkPills |
| `primitives.jsx` zoneTone/statusTone (L265-L266) | zone → info/accent/ok の写像規則 | §6.3 token mapping |
| `pages-public.jsx` LandingPage (L4-L154) | Hero / Stats / ZoneGuide / Timeline の構成順序 | §2.1.1 `/` |
| `pages-public.jsx` MemberListPage (L208-L338) | filter `q/zone/status/sort/density`, density 3 値 | §2.1.2 `/(public)/members` |
| `pages-public.jsx` MemberDetailPage (L339-L472) | summary / overview / skill / offer / personality / contact 順 | §2.1.3 `/(public)/members/[id]` |
| `pages-member.jsx` LoginPage (L4-L67) | 5 状態 (input/sent/unregistered/deleted/error) | §4.2 |
| `pages-member.jsx` MyProfilePage (L220-L373) | 4 領域 (banner/summary/request/delete) | §2.2.2 `/profile` |
| `pages-admin.jsx` AdminDashboardPage (L4-L161) | KpiGrid + ZoneChart + StatusChart + RecentActions | §2.3.1 `/(admin)/admin` |
| `pages-admin.jsx` AdminMembersPage (L162-L368) | DataTable + Drawer | §2.3.2 `/(admin)/admin/members` |
| `pages-admin.jsx` AdminTagsPage (L369-L507) | TagsQueue (左 list + 右 detail) | §2.3.3 `/(admin)/admin/tags` |
| `pages-admin.jsx` SchemaDiffPage (L508-L657) | SchemaDiff (2 column) + apply confirm | §2.3.5 `/(admin)/admin/schema` |

### 4.6 移植「しない」もの（明示削除）

| 項目 | 理由 |
|------|------|
| プロトタイプ `tweaks` パネル / `theme switcher` (`app.jsx` L213-L251) | EDITMODE 専用、本番 UI 要件外 |
| `localStorage` ベースの photo store (`primitives.jsx` AvatarStoreProvider L20-L28) | 本番は API 経由（task-14 で別途設計） |
| `data-theme="warm" / "cool"` 切替 (`styles.css` L42-L70) | dark mode 含め MVP 非対応（token 拡張余地のみ確保） |
| `gas-prototype/` 由来の振る舞い | 認証・保存仕様の正本に昇格させない |

---

## 5. 入力・出力

### 5.1 入力

- 既存 `09-ui-ux.md`（160 行）
- `claude-design-prototype/{primitives,pages-public,pages-member,pages-admin,app}.jsx` 計約 2,000 行
- `claude-design-prototype/styles.css` 1,012 行（参照のみ・値転記禁止）
- `phase-1.md`（routes 19 と API map）
- `phase-3.md` §2（API 接続表）と §3（未掲載画面パターン）

### 5.2 出力

- 全面書き換え後の `09-ui-ux.md`（300〜420 行）
- 章立て: §1〜§10（§4.2 のとおり）
- 視覚詳細記述 0 行（grep で検出されないこと）

---

## 6. テスト方針

### 6.1 markdown 構造検証

| 検証 | 方法 |
|------|------|
| 章立て一致 | `grep -c "^## " specs/09-ui-ux.md` → 10 を期待 |
| 19 routes 網羅 | `grep -c "^### 2\\." specs/09-ui-ux.md` → 19+ を期待（routes section heading） |
| link 健全性 | `09a-prototype-map.md` / `09b-design-tokens.md` への相対 link が解決可能（task-07/08 完了後の検証） |

### 6.2 視覚詳細混入禁止スクリプト案

```bash
# 09-ui-ux.md に視覚詳細値が残っていないことの ad-hoc gate
F=docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && { echo "HEX 検出"; exit 1; } || true
grep -nE 'oklch\(' "$F" && { echo "oklch 値直書き検出"; exit 1; } || true
grep -nE '\b[0-9]+px\b' "$F" && { echo "px 値直書き検出"; exit 1; } || true
grep -nE '\bbg-\[' "$F" && { echo "Tailwind arbitrary 値検出"; exit 1; } || true
echo OK
```

CI への組み込みは task-18 で `verify-design-tokens.ts` の規範範囲を `apps/web/src` に限定するため、本タスクは **手動 / pre-commit で実行**する位置付け。

### 6.3 a11y 契約整合

- WAI-ARIA Authoring Practices の dialog / tabs / table パターンに合致する記述になっているか目視レビュー
- `role="dialog" + aria-modal="true" + focus trap` の記述が §5.2 にあること

### 6.4 trace check

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §2 の API 接続表と、新 §2 routes 契約の API 列が **行レベルで完全一致**することを目視（routes × endpoint × method の 3 タプル比較）。

---

## 7. 実行コマンド

```bash
# 1. 既存 09-ui-ux.md を読む（参考のみ）
cat docs/00-getting-started-manual/specs/09-ui-ux.md

# 2. prototype を読む（契約抽出元）
cat docs/00-getting-started-manual/claude-design-prototype/primitives.jsx
cat docs/00-getting-started-manual/claude-design-prototype/pages-{public,member,admin}.jsx

# 3. 書き換え（直接編集）
$EDITOR docs/00-getting-started-manual/specs/09-ui-ux.md

# 4. 構造検証
grep -c '^## ' docs/00-getting-started-manual/specs/09-ui-ux.md   # → 10 期待
grep -c '^### 2\.' docs/00-getting-started-manual/specs/09-ui-ux.md  # → 19+ 期待

# 5. 視覚詳細混入チェック (§6.2)
bash scripts/verify-09-ui-ux-contract-only.sh   # ※ 任意で本 task 内に script 化

# 6. lint / link チェック（既存 markdown lint があれば）
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09-ui-ux.md || true
```

---

## 8. DoD（Definition of Done）

- [ ] `09-ui-ux.md` が §4.2 章立てに従って 300〜420 行で書き直されている
- [ ] §2 で 19 routes すべてに contract 表が存在し、列構成が統一されている（認可 / layout / 主 component / API / 状態 / 主 props / a11y / token / 視覚詳細 link / 不採用）
- [ ] §3 で 13 primitives + feature components の props 表が存在
- [ ] §4.2 で login 5 状態が列挙されている
- [ ] §5 a11y 契約が dialog / drawer / form / live region すべてカバー
- [ ] §6 で「視覚値の決定権は 09b にある」「HEX 直書き禁止」が明記されている
- [ ] §7 Storybook 正本主義の段落が存在
- [ ] §6.2 の grep で視覚詳細値が 0 件
- [ ] §4.5 の 19 行の prototype 由来契約が漏れなく取り込まれている
- [ ] §4.6 の 4 項目（tweaks / photo store / data-theme / gas-prototype）が「不採用」明記
- [ ] phase-3.md §2 と新 §2 の API 列が完全一致
- [ ] markdown lint で error 0
- [ ] `09a-prototype-map.md` / `09b-design-tokens.md` への link が contract 表内に書かれている（リンク先のファイルが空でも path が確定していれば OK。task-07/08 完了で link 解決）

---

## 9. 影響範囲・リスク

| リスク | 緩和策 |
|--------|--------|
| 視覚詳細削除で「正解スクリーン」が失われたと感じるレビュアー反発 | §7 で Storybook と 09a を正本と明記。本ファイルは「契約」であることを §1 冒頭で強調 |
| 19 routes contract 表のフォーマット揺れ | §4.3 のサンプル表を template として使い、19 個全てを copy-paste で展開 |
| primitives 列挙漏れ | §4.5 の表を checklist として全件確認 |
| API 接続表との trace 漏れ | §6.4 で phase-3 §2 と diff チェック |

---

## 10. 関連 task / link 先

- task-07 prototype-mapping-table → `09a-prototype-map.md`
- task-08 design-tokens-doc → `09b-design-tokens.md`
- task-10 ui-primitives → 本契約に従って primitive を実装
- task-11..17 各画面 task → 本契約の §2 routes 表が実装の正本
- phase-1 §3 / phase-3 §2 → API 接続の正本


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する

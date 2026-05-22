# task-07 prototype-mapping-table

> **責務再定義 (2026-05-07)**: mapping table は引き続き 09a。新規 09c..09h ファイルへの mapping 行も追加すること（prototype file ↔ 09c..09h spec ファイルの対応）。
>
> 追加 mapping 対象（既存 §3 routes mapping / §2 primitives mapping に加えて新セクション §4 として下記を追加する想定）:
>
> | prototype source | 行範囲 | mapping 先 spec |
> |------------------|-------|----------------|
> | `primitives.jsx` 全体 | L1-L272 | `09c-primitives.md` 各 §1.x |
> | `icons.jsx` 全体 | L1-L79 | `09d-icons.md` icon カタログ |
> | `pages-public.jsx` 全体 | L1-L472 | `09e-screen-blueprints-public.md` 各 §X |
> | `pages-member.jsx` 全体 | L1-L373 | `09f-screen-blueprints-member.md` 各 §X |
> | `pages-admin.jsx` 全体 | L1-L658 | `09g-screen-blueprints-admin.md` 各 §X |
> | `app.jsx` 全体 | L1-L251 | `09h-shell-and-fixtures.md` shell §1 |
> | `data.jsx` 全体 | L1-L339 | `09h-shell-and-fixtures.md` fixtures §2 |
>
> 各 mapping 行は「行範囲 → spec の見出し ID」を 1:1 で書き、後続 task-19..22 が逆引きで参照行を確定できるようにする。

## §0. 自己完結コンテキスト

このタスクを単独で着手する担当者が、外部資料に遡らずとも実装判断できるよう、必須前提を本節に閉じ込める。

### 0.1 上位ゴール

`docs/00-getting-started-manual/claude-design-prototype/{app,primitives,pages-public,pages-member,pages-admin}.jsx` 計約 2,026 行を **凍結正本**として、本番実装ターゲット component への 1:1 mapping 表 `09a-prototype-map.md` を新規作成する。各 mapping は `prototype source path + L<start>-L<end>` の行範囲を保持し、後続 task-10（primitives 実装）と task-11..17（各画面実装）が「自分が担当する component / route の参考行範囲」を 1 ファイルから引ける状態を作る。プロトタイプ未掲載画面（法務 / register / admin queue / admin CRUD / admin diff / admin compare / admin timeline / 共通 error/404/loading）には phase-3 §3 の派生ルールを正本化して取り込み、独自 primitive の生成を禁止する。

### 0.2 DAG 座標

- 依存元: なし（task-01 scope-gate-all-screens 完了のみ前提）
- 依存先: task-10（ui-primitives）/ task-11..17（各画面実装）/ task-06（contract が link 先として参照）
- 並列性: **task-06（ui-ux 契約書き換え）/ task-08（design tokens）と並列実行可**。視覚的ソース・オブ・トゥルース（mapping）の責務は本ファイルに閉じる。

### 0.3 触れるファイル群

- C（新規作成）: `docs/00-getting-started-manual/specs/09a-prototype-map.md`（360〜500 行）
- R（参照のみ）: `docs/00-getting-started-manual/claude-design-prototype/app.jsx`（251 行）/ `primitives.jsx`（272 行）/ `pages-public.jsx`（472 行）/ `pages-member.jsx`（373 行）/ `pages-admin.jsx`（658 行）/ `styles.css`（1,012 行・class 名出典のみ）/ `outputs/phase-3/phase-3.md` §3
- M / 削除: なし

### 0.4 既存 API（不変）

本タスクは API 接続を新規定義しない。`outputs/phase-3/phase-3.md` §2 の routes × endpoint × method 表が正本。§3 routes mapping 表に API 列を載せる場合は phase-3 §2 から 1 字も改変せず転記する。

### 0.5 不変条件

1. プロトタイプ jsx 5 ファイルは **凍結正本**として扱う。本タスクで改変しない。プロトタイプ更新時は本 mapping ファイルとセット PR で改訂する。
2. プロトタイプ未掲載画面に対して **新規 primitive を生やさない**。task-10 で確定した 13 primitive と feature components の組合せのみで構成する。逸脱が必要な場合は task-10 へ ECR を上げ、本ファイルと `09-ui-ux.md` §3 を同時改訂する。
3. プロトタイプ EDITMODE 専用要素（`app.jsx` L213-L251 の TweaksPanel / `primitives.jsx` L20-L28 の AvatarStoreProvider localStorage 部分 / `styles.css` L42-L70 の data-theme="warm" / "cool" 切替）は **不採用** と明記する。
4. token 値の決定はしない（task-08 の責務）。本ファイルでは token 名のみ参照。
5. props / state の正本化はしない（task-06 の責務）。本ファイルでは行範囲と prototype-name → 本番-name の対応のみ。
6. 行範囲は `L<start>-L<end>` 形式で grep 一意検索可能にする。

### 0.6 上流から受け取るシグネチャ

本タスクは依存元なし。受け取り情報は以下:

- prototype jsx 5 ファイルの全 component 開始行（`grep -nE '^const [A-Z]' prototype.jsx` で機械抽出）
- phase-1 §3 の 19 routes 一覧
- phase-3 §3 の未掲載画面派生ルール 8 パターン（5.1 法務 / 5.2 register / 5.3 admin queue / 5.4 admin CRUD / 5.5 admin diff / 5.6 admin compare / 5.7 admin timeline / 5.8 共通 error/404/loading）

### 0.7 下流へ渡すシグネチャ

新 `09a-prototype-map.md` の §3 routes mapping 表は **以下の列名で固定**する。後続 task は列名を grep キーとして使う:

```
| route | prototype-file | line-range | 主 component | derivation-rule | 備考 |
```

- `route`: Next.js App Router パス（例: `/(public)/members/[id]`）。バッククォート囲み。
- `prototype-file`: prototype jsx の相対パス（例: `pages-public.jsx`）。プロトタイプ未掲載の場合は `（未掲載）`。
- `line-range`: `L<start>-L<end>` 形式（例: `L4-L154`）。未掲載は `—`。
- `主 component`: 本ファイル §2 primitives mapping または feature components の名前を `/` 区切りで列挙。
- `derivation-rule`: プロトタイプ忠実なら空欄、未掲載画面なら `§5.1` 〜 `§5.8` の派生ルール参照。
- `備考`: density 値 / 5 状態 / external new tab などの構造特記事項。

§2 primitives mapping 表の列名は `| prototype component | source | 本番実装 path（task-10） | RSC-safe | 備考 |` で統一。`source` 列は `<file>.jsx L<start>-L<end>` 形式。

§6 行範囲台帳の列名は `| 用途 | path | line range |` で統一し、§2 / §3 / §4 で参照された全 line range を 1 表に集約する（重複 OK・25 行以上）。

### 0.8 用語

- **mapping**: prototype component → 本番実装 component / route の対応関係。1:1 が原則。
- **行範囲（line range）**: prototype jsx の `L<start>-L<end>`。プロトタイプ凍結により変動しない前提。
- **プロトタイプ忠実**: §3 表の `derivation-rule` 列が空欄の行。行範囲が正本。
- **未掲載画面**: prototype jsx に該当 component が存在しない画面。§5 派生ルールに従い primitives の組合せで構成。
- **派生ルール**: phase-3 §3 で定義された 8 パターンの「未掲載画面を既存 primitives でどう構成するか」のルール。
- **shell / chrome**: `app.jsx` の Sidebar / Topbar / MinimalBar など、route 横断の枠組み要素。
- **RSC-safe**: React Server Component で使用可能（`'use client'` 不要）であること。

---

> 責務 dir: `03-spec-source`
> 想定工数: 0.5 人日
> 主担当: Tech Writer
> 依存: task-01（scope-gate-all-screens）完了
> 後続: task-10（primitive 実装で行範囲を参照）/ task-11..17（各画面実装で行範囲を参照）

---

## 1. ヘッダー

| 項目 | 値 |
|------|---|
| task id | 07 |
| task name | prototype-mapping-table |
| const ref | CONST_005 |
| 入力 | `docs/00-getting-started-manual/claude-design-prototype/{app,primitives,pages-public,pages-member,pages-admin}.jsx` |
| 出力 | `docs/00-getting-started-manual/specs/09a-prototype-map.md`（**新規作成**） |
| 主成果物の DoD | §8 参照 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. プロトタイプ jsx の各 component を、本番実装ターゲット component に **1:1 mapping**する表を作成する。
2. 全 19 routes に対し、prototype 由来の参考行範囲（line range）を提示する。
3. 未掲載画面（プロトタイプに mock が存在しない画面）には、phase-3 §3 の派生ルールへの参照を記載し、独自設計の禁止を明記する。
4. 本ファイルが「contract（09-ui-ux.md）と Storybook（task-10）以外で、視覚的なソース・オブ・トゥルースを担う」ことを明文化する。
5. 大量の派生 spec を生やさず、**1 mapping = 1 行**の整列度で網羅する。

### 2.2 非ゴール

- token 値の決定（task-08 / `09b-design-tokens.md`）
- props / state の正本化（task-06 / `09-ui-ux.md`）
- 実装コード変更（task-10..17）
- prototype の改変（プロトタイプは凍結正本）

---

## 3. 変更対象ファイル表

| 区分 | path | 概要 |
|------|------|------|
| C（新規作成） | `docs/00-getting-started-manual/specs/09a-prototype-map.md` | mapping 表 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/app.jsx` | 全 251 行・shell / nav |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | 全 272 行・UI primitives |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` | 全 472 行・3 画面 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` | 全 373 行・3 画面（login / member-form / my-profile） |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | 全 658 行・4 画面（dashboard / members / tags / schema） |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/styles.css` | 1,012 行・CSS class 名の出典（値は参照しない） |
| R（参照） | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §3 | 未掲載画面派生ルール |

---

## 4. 詳細差分

### 4.1 章立て案（目標 360〜500 行）

```
1. 位置づけ
   1.1 本ファイルの責務（視覚的ソース・オブ・トゥルース）
   1.2 行範囲の読み方（パス + L<start>-L<end>）
   1.3 prototype に存在「しない」画面の扱い
2. UI primitives × 本番 component mapping (13+)
3. 全 19 routes mapping
   3.1 公開層 (6 routes)
   3.2 会員層 (2 routes)
   3.3 管理層 (8 routes)
   3.4 共通 (3 routes)
4. shell / chrome mapping (Sidebar / Topbar / MinimalBar)
5. 派生ルール（プロトタイプ未掲載画面）
   5.1 法務ページ
   5.2 register
   5.3 admin queue 系 (tags / requests)
   5.4 admin CRUD (meetings)
   5.5 admin diff (schema)
   5.6 admin compare (identity-conflicts)
   5.7 admin timeline (audit)
   5.8 共通 error / not-found / loading
6. 行範囲台帳（全 mapping の line range 一覧）
7. 改訂履歴
```

### 4.2 §2 primitives mapping 表（row 例 5 件以上）

| prototype component | source | 本番実装 path（task-10） | RSC-safe | 備考 |
|-------------------|--------|----------------------|----------|------|
| `Chip` | `primitives.jsx` L6-L14 | `apps/web/src/components/ui/badge.tsx` | yes | name は `Badge` に統一。`tone` → `variant` |
| `Avatar` + `AvatarStoreProvider` | `primitives.jsx` L17-L89 | `apps/web/src/components/ui/avatar.tsx`（store 部分は不採用） | yes | `localStorage` 依存の photo store は MVP 不採用 |
| `Button` | `primitives.jsx` L92-L110 | `apps/web/src/components/ui/button.tsx` | yes | variants: primary/accent/ghost/soft/danger |
| `Switch` | `primitives.jsx` L113-L115 | `apps/web/src/components/ui/switch.tsx` | yes | `aria-pressed` 必須 |
| `Segmented` | `primitives.jsx` L118-L126 | `apps/web/src/components/ui/tabs.tsx` の variant か別 primitive | client | `DensityToggle` で再利用 |
| `Field` + `Input` + `Textarea` + `Select` | `primitives.jsx` L129-L147 | `apps/web/src/components/ui/{input,select}.tsx` + form helper | yes | `label/required/optional/hint/error` を field-group として継承 |
| `Search` | `primitives.jsx` L150-L155 | `apps/web/src/components/ui/input.tsx` の variant | client | `FilterBar` で利用 |
| `Drawer` | `primitives.jsx` L158-L174 | `apps/web/src/components/ui/drawer.tsx` | client | `'use client'` 必須 |
| `Modal` | `primitives.jsx` L177-L195 | `apps/web/src/components/ui/modal.tsx` | client | `'use client'` 必須 |
| `Toast` + `ToastProvider` + `useToast` | `primitives.jsx` L198-L223 | `apps/web/src/components/ui/toast.tsx` | client | App layout で provider 配置 |
| `KVList` | `primitives.jsx` L226-L235 | `apps/web/src/components/ui/kv-list.tsx` | yes | profile 表示で再利用 |
| `LinkPills` | `primitives.jsx` L248-L262 | `apps/web/src/components/ui/link-pills.tsx` | yes | `LINK_LABELS` map を保持 |
| zone/status tone helpers | `primitives.jsx` L265-L266 | `apps/web/src/lib/tone.ts` | yes | mapping 関数のみ |

### 4.3 §3 routes mapping 表（row 例・10 件）

| route | prototype 該当 | line range | 主 component | 派生ルール参照 | 備考 |
|-------|--------------|-----------|------------|---------------|------|
| `/` | `LandingPage` | `pages-public.jsx` L4-L154 | Hero / Stats / ZoneGuide / Timeline | — | プロトタイプ忠実 |
| `/(public)/members` | `MemberListPage` | `pages-public.jsx` L208-L338 | FilterBar / MemberCard / MemberList / DensityToggle | — | density 3 値 (comfy/dense/list) |
| `/(public)/members/[id]` | `MemberDetailPage` | `pages-public.jsx` L339-L472 | ProfileHero / KVList / LinkPills | — | 公開項目のみ |
| `/(public)/register` | （未掲載） | — | Hero + Card + Button (CTA) | §5.2 | `responderUrl` への 302 |
| `/privacy` | （未掲載） | — | LegalProse | §5.1 | MD インポート |
| `/terms` | （未掲載） | — | LegalProse | §5.1 | MD インポート |
| `/login` | `LoginPage` | `pages-member.jsx` L4-L67 | LoginInput / LoginSent / LoginUnregistered / LoginDeleted / LoginError | — | 5 状態を component 分離 |
| `/profile` | `MyProfilePage` | `pages-member.jsx` L220-L373 | VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel | — | 4 領域を縦配置 |
| `/(admin)/admin` | `AdminDashboardPage` | `pages-admin.jsx` L4-L161 | KpiGrid / ZoneChart / StatusChart / RecentActions | — | KPI 4 + chart 2 + actions |
| `/(admin)/admin/members` | `AdminMembersPage` | `pages-admin.jsx` L162-L368 | MembersTable / MemberDrawer | — | DataTable + Drawer |
| `/(admin)/admin/tags` | `AdminTagsPage` | `pages-admin.jsx` L369-L507 | TagsQueue (左 list + 右 detail) | §5.3 | キュー型 |
| `/(admin)/admin/meetings` | （未掲載） | — | DataTable + MeetingForm Modal | §5.4 | CRUD |
| `/(admin)/admin/schema` | `SchemaDiffPage` | `pages-admin.jsx` L508-L657 | SchemaDiff (2col) + apply confirm | — | プロトタイプ忠実 |
| `/(admin)/admin/requests` | （未掲載） | — | RequestsQueue + RequestDetail | §5.3 | tags と同パターン |
| `/(admin)/admin/identity-conflicts` | （未掲載） | — | ConflictPair (side-by-side) | §5.6 | Card × 2 + Badge + Button |
| `/(admin)/admin/audit` | （未掲載） | — | AuditFilterBar + AuditTimeline | §5.7 | filter + Card timeline |
| `app/error.tsx` | （未掲載） | — | ErrorState primitive | §5.8 | Sentry capture + reset |
| `app/global-error.tsx` | （未掲載） | — | ErrorState (root) | §5.8 | `<html><body>` 含む fallback |
| `app/not-found.tsx` | （未掲載） | — | EmptyState primitive | §5.8 | 静的 |
| `app/loading.tsx` | （未掲載） | — | Skeleton primitive | §5.8 | Suspense fallback |

> 表の右端「派生ルール参照」が空欄の行は **プロトタイプ忠実**（行範囲が正本）。
> 「§5.x」記載のある行は **未掲載画面**で、§5 の派生ルールに従い primitives の組合せで構成する。

### 4.4 §4 shell / chrome mapping

| 要素 | source | 本番実装 |
|------|--------|---------|
| `App` shell + theme dispatch | `app.jsx` L24-L117 | `apps/web/src/app/layout.tsx`（theme 切替は MVP 不採用） |
| `ROUTES` map | `app.jsx` L11-L22 | Next.js route 構造で代替（map は持たない） |
| `Sidebar` | `app.jsx` L119-L164 | `apps/web/src/app/(admin)/layout.tsx` の Sidebar 部分（admin 専用に限定） |
| `Topbar` | `app.jsx` L166-L191 | `apps/web/src/app/(public)/layout.tsx` の Header 部分 |
| `MinimalBar` | `app.jsx` L193-L211 | `apps/web/src/app/login/layout.tsx` 等の minimal layout |
| `TweaksPanel` | `app.jsx` L213-L251 | **不採用**（EDITMODE 専用） |

### 4.5 §5 派生ルール（未掲載画面）— phase-3 §3 を本ファイルに正本化

| パターン | 構成 primitives | 該当 routes |
|---------|---------------|-----------|
| 法務ページ (§5.1) | `Container` + `LegalProse`（`Card` variant） | `/privacy`, `/terms` |
| register (§5.2) | `Container` + `Hero` + `Card` + `Button` | `/(public)/register` |
| admin queue 系 (§5.3) | `Sidebar` + `PageHeader` + `Tabs` + `DataTable` + `Drawer` | `/(admin)/admin/tags`, `/(admin)/admin/requests` |
| admin CRUD (§5.4) | `Sidebar` + `PageHeader` + `DataTable` + `Modal Form` (`Card` + `Input` + `Select`) | `/(admin)/admin/meetings` |
| admin diff (§5.5) | `Sidebar` + `PageHeader` + `DiffView`（`Card` 2 col）+ `Button` (apply) | `/(admin)/admin/schema`（プロトタイプ部分掲載あり） |
| admin compare (§5.6) | `Sidebar` + `PageHeader` + `SideBySideCompare`（`Card` × 2 + `Badge`）+ `Button` (resolve) | `/(admin)/admin/identity-conflicts` |
| admin timeline (§5.7) | `Sidebar` + `PageHeader` + `FilterBar` + `Timeline`（`Card` 縦並び + 日付 group） | `/(admin)/admin/audit` |
| 共通 error / 404 / loading (§5.8) | `EmptyState` / `ErrorState` / `Skeleton` | `error.tsx` / `not-found.tsx` / `loading.tsx` / `global-error.tsx` |

各派生ルールの末尾には次の文言を必ず付記:

> **新規 primitive を生やさない。** task-10 で確定した 13 primitive と feature components の組合せのみで構成する。逸脱が必要な場合は task-10 へ ECR を上げ、本ファイルと `09-ui-ux.md` §3 を同時改訂する。

### 4.6 §6 行範囲台帳（全 mapping の line range 一覧）

`§2`/`§3`/`§4` で参照された全 line range を 1 つの表にまとめ、grep で一意検索できる形にする（重複 OK）。本台帳は task-10..17 の各 task が「自分が担当する画面の行範囲」を **1 ファイルで引ける**ようにする目的。

| 用途 | path | line range |
|------|------|-----------|
| LandingPage | `pages-public.jsx` | L4-L154 |
| MemberCardPublic | `pages-public.jsx` | L155-L207 |
| MemberListPage | `pages-public.jsx` | L208-L338 |
| MemberDetailPage | `pages-public.jsx` | L339-L472 |
| LoginPage | `pages-member.jsx` | L4-L67 |
| MemberFormPage | `pages-member.jsx` | L68-L219 |
| MyProfilePage | `pages-member.jsx` | L220-L373 |
| AdminDashboardPage | `pages-admin.jsx` | L4-L161 |
| AdminMembersPage | `pages-admin.jsx` | L162-L368 |
| AdminTagsPage | `pages-admin.jsx` | L369-L507 |
| SchemaDiffPage | `pages-admin.jsx` | L508-L657 |
| Sidebar | `app.jsx` | L119-L164 |
| Topbar | `app.jsx` | L166-L191 |
| MinimalBar | `app.jsx` | L193-L211 |
| TweaksPanel（不採用） | `app.jsx` | L213-L251 |
| Chip | `primitives.jsx` | L6-L14 |
| Avatar | `primitives.jsx` | L17-L89 |
| Button | `primitives.jsx` | L92-L110 |
| Switch | `primitives.jsx` | L113-L115 |
| Segmented | `primitives.jsx` | L118-L126 |
| Field/Input/Textarea/Select | `primitives.jsx` | L129-L147 |
| Search | `primitives.jsx` | L150-L155 |
| Drawer | `primitives.jsx` | L158-L174 |
| Modal | `primitives.jsx` | L177-L195 |
| Toast | `primitives.jsx` | L198-L223 |
| KVList | `primitives.jsx` | L226-L235 |
| LinkPills | `primitives.jsx` | L248-L262 |
| zone/statusTone | `primitives.jsx` | L265-L266 |

---

## 5. 入力・出力

### 5.1 入力

- prototype jsx 5 ファイル（`app.jsx` 251行 / `primitives.jsx` 272行 / `pages-public.jsx` 472行 / `pages-member.jsx` 373行 / `pages-admin.jsx` 658行）= 計 2,026 行
- `styles.css`（class 名出典の参照のみ。値の取り込みは task-08 の責務）
- `phase-3.md` §3 派生ルール

### 5.2 出力

- 新規 `09a-prototype-map.md`（360〜500 行）
- §2/§3/§4 の各表が prototype の **行範囲**で参照可能になっている

---

## 6. テスト方針

### 6.1 markdown 構造検証

| 検証 | 方法 |
|------|------|
| §3 routes 行が 19 行以上 | `grep -cE "^\| \`/.*\` " specs/09a-prototype-map.md` → 19+ |
| §6 行範囲台帳が 25 行以上 | `grep -cE "^\| .* \| .*\\.jsx \| L[0-9]" specs/09a-prototype-map.md` → 25+ |
| 各 jsx ファイル名が出現 | `grep -c "pages-public.jsx" specs/09a-prototype-map.md` → 5+（複数 mapping で参照されるため） |

### 6.2 行範囲整合スクリプト案

```bash
# 09a に書かれた line range が prototype 実体と矛盾しないことを ad-hoc で確認
F=docs/00-getting-started-manual/specs/09a-prototype-map.md
PROTO=docs/00-getting-started-manual/claude-design-prototype

# 例: LandingPage L4-L154
sed -n '4p;154p' "$PROTO/pages-public.jsx"   # 4 行目に const LandingPage、154 付近に閉じ } が見えること

# bulk check 用 (jq + 自前 parser):
grep -oE '\| (`[^`]+\.jsx`|`[^`]+/[^`]+\.jsx`) \| L[0-9]+-L[0-9]+' "$F" | wc -l
```

### 6.3 派生ルール網羅

`§5` の各サブセクションが 8 パターン（5.1〜5.8）すべて存在し、phase-3 §3 の表と 1:1 対応していることを目視。

### 6.4 不採用記述

`TweaksPanel` / `AvatarStoreProvider` / `data-theme="warm"` / `data-theme="cool"` が「不採用」と明記されていることを `grep -c "不採用" specs/09a-prototype-map.md` で 4+ 確認。

---

## 7. 実行コマンド

```bash
# 1. prototype の行数把握
wc -l docs/00-getting-started-manual/claude-design-prototype/{app,primitives,pages-public,pages-member,pages-admin}.jsx

# 2. component 開始行を機械抽出
grep -nE '^const [A-Z]' docs/00-getting-started-manual/claude-design-prototype/pages-*.jsx \
  docs/00-getting-started-manual/claude-design-prototype/app.jsx \
  docs/00-getting-started-manual/claude-design-prototype/primitives.jsx

# 3. 09a-prototype-map.md を新規作成
$EDITOR docs/00-getting-started-manual/specs/09a-prototype-map.md

# 4. 構造 / 整合検証
grep -cE "^### 3\." docs/00-getting-started-manual/specs/09a-prototype-map.md   # → 4 (§3.1〜§3.4)
grep -cE "^\| \`/.*\` " docs/00-getting-started-manual/specs/09a-prototype-map.md  # → 19+

# 5. 行範囲健全性 (§6.2)
bash scripts/verify-09a-prototype-line-ranges.sh || true

# 6. lint
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09a-prototype-map.md || true
```

---

## 8. DoD

- [ ] `09a-prototype-map.md` が 360 行以上で新規作成されている
- [ ] §2 で 13+ primitives が mapping されている
- [ ] §3 で 19 routes すべてが行されている（プロトタイプ忠実 9 + 未掲載 10）
- [ ] §4 で shell（Sidebar / Topbar / MinimalBar）の本番先が明示
- [ ] §5 で派生ルール 8 パターン（5.1〜5.8）が phase-3 §3 と完全一致
- [ ] §5 末尾に「新規 primitive を生やさない」段落が存在
- [ ] §6 行範囲台帳が 25 行以上、`primitives.jsx` / `pages-*.jsx` / `app.jsx` の全主要 component を網羅
- [ ] 不採用記述（TweaksPanel / AvatarStoreProvider / data-theme warm/cool）が「不採用」と明記
- [ ] §3 表の API 列が phase-3 §2 と齟齬なし（route × component が一致）
- [ ] markdown lint error 0
- [ ] 行範囲が実体 jsx と矛盾なし（§6.2 の sed/grep 確認）
- [ ] `09-ui-ux.md`（task-06 出力）からの link target として参照されている

---

## 9. 影響範囲・リスク

| リスク | 緩和策 |
|--------|--------|
| prototype 行範囲のずれ（プロトタイプ更新時） | プロトタイプを **凍結正本**として扱い、改訂 PR は本 mapping ファイルとセット化を必須とする |
| 19 routes 行漏れ | §3 の表 row 数を `grep -c` で 19 と一致確認（§6.1） |
| 派生ルール解釈ぶれ | §5 末尾段落で「新規 primitive 禁止」を明文化 |
| primitives 列挙漏れ | §2 と §6 の二重持ちで相互チェック |
| `09a` だけ独立改訂で `09-ui-ux.md` と乖離 | DoD で「09-ui-ux.md からの link target」を必須化 |

---

## 10. 関連 task / link 先

- task-06 ui-ux-contract-rewrite → 本ファイルへ link する
- task-08 design-tokens-doc → token 値の決定権、本ファイルでは値を扱わない
- task-10 ui-primitives → §2 と §6 を実装行範囲の参照元に使う
- task-11..17 各画面 task → §3 と §6 を実装行範囲の参照元に使う
- phase-3 §3 → §5 派生ルールの出所


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する

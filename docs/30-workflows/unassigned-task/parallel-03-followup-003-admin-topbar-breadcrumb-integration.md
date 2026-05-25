# AdminTopbar breadcrumb 実データ統合 - タスク指示書

## メタ情報

```yaml
issue_number: 894
```


## メタ情報

| 項目         | 内容                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| タスクID     | parallel-03-followup-003-admin-topbar-breadcrumb-integration                                        |
| タスク名     | AdminTopbar の `breadcrumb` slot（固定「管理」）と AdminPageHeader の動的 breadcrumb の二重構造を解消し、breadcrumb 責務の所有権を確定して配線する |
| 分類         | 改善                                                                                                |
| 対象機能     | admin AppShell topbar breadcrumb slot / admin page header breadcrumb                                 |
| 優先度       | 中                                                                                                  |
| 見積もり規模 | 小規模                                                                                              |
| ステータス   | unassigned（canonical workflow 未作成・未着手）                                                     |
| 発見元       | parallel-03-followup-001 Phase 12（スコープ外として明示 deferred された breadcrumb 実データ統合）    |
| 発見日       | 2026-05-23                                                                                          |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/`
- canonical workflow: 未作成（本指示書は unassigned 段階）
- deferred 宣言: parallel-03-followup-001 の §2.3「含まないもの」line 78「breadcrumb 実データ統合（slot は placeholder / children pattern のまま）」。followup-001 は AdminTopbar primitive の抽出までを完了形とし、breadcrumb の実データ配線は本タスクへ繰り延べた。
- 現状実装:
  - `apps/web/src/components/layout/AdminTopbar.tsx` は `breadcrumb?: ReactNode` slot を持つが、`(admin)/layout.tsx` では `<AdminTopbar />`（props なし）で呼ばれ、slot は既定の固定テキスト「管理」のまま。
  - 各 admin page（`apps/web/app/(admin)/admin/page.tsx` ほか 8 ページ）が `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`（task-15 由来）経由で page-level の動的 breadcrumb を描画している。
  - 汎用 breadcrumb primitive は `apps/web/src/components/admin/Breadcrumb.tsx` に既存（`items: ReadonlyArray<{label, href?}>` / `data-component="breadcrumb"` / `ui-breadcrumb` class / `aria-current="page"` 対応、CSS は `apps/web/src/styles/globals.css` の `ui-breadcrumb`）。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-03-followup-001 で admin topbar が primitive 化され、`AdminTopbar` は `breadcrumb?: ReactNode` / `actions?: ReactNode` の 2 slot を持つ設計になった。しかし followup-001 のスコープ判定で「breadcrumb 実データ統合」は明示的に deferred され、`(admin)/layout.tsx` は `<AdminTopbar />`（props なし）で呼ぶに留まり、topbar の breadcrumb slot は既定の固定テキスト「管理」を出し続けている。

一方、task-15 で導入された `AdminPageHeader` が各 admin page で page-level の breadcrumb（例: 「管理 / ダッシュボード」「管理 / 会員管理」）を描画しており、汎用 `Breadcrumb` primitive を使った動的パンくずが既に各ページ単位で表示されている。

### 1.2 問題点・課題

- **breadcrumb の二重構造**: AppShell topbar の breadcrumb slot（固定「管理」）と AdminPageHeader の breadcrumb（動的・ページ単位）が同じ画面に共存し、責務の所有権が未定義。ユーザーから見ても「管理」という同一ラベルが topbar とページ見出しの双方に出る重複が生じうる。
- **正本の不在**: breadcrumb の SSOT（どこが現在地ナビゲーションを所有するか）が決まっておらず、後続が新ページを追加するたびに「topbar slot に出すのか / AdminPageHeader に出すのか」を都度判断せねばならない。
- **primitive の再利用が分断**: `Breadcrumb.tsx` primitive は AdminPageHeader だけが利用し、topbar slot は素の固定テキストで primitive を経由していない。design token / a11y 監査を「primitive を grep」で網羅する運用と整合しない。

### 1.3 放置した場合の影響

- admin 画面ごとに breadcrumb の表示位置・粒度がブレ、UI の一貫性が崩れる
- 後続タスク（admin 機能追加）で「どちらに breadcrumb を足すか」の判断コストが累積し、二重表示バグの温床になる
- `Breadcrumb` primitive を経由しない固定テキストが topbar に残り続け、CLAUDE.md 不変条件3「プロトタイプ正本順位（新規 primitive を生やさない＝既存 primitive を使う）」の趣旨から外れる

---

## 2. 何を達成するか（What）

### 2.1 目的

breadcrumb の責務所有権を 1 箇所に確定し、二重構造を解消する。既存 `Breadcrumb` primitive を再利用しつつ、AppShell topbar slot と AdminPageHeader の役割分担を定義して配線する。新規 primitive・新規 API・D1 変更は一切行わない、純粋な UI 配線タスク。

### 2.2 最終ゴール

- breadcrumb の正本所有者が明文化され、二重描画（同一ラベルの重複表示）が解消される
- topbar の breadcrumb slot が固定「管理」のままではなく、確定した責務に沿った内容（または意図的な静的ラベル）になる
- breadcrumb 表示は既存 `apps/web/src/components/admin/Breadcrumb.tsx` primitive 経由に統一される
- `(admin)/layout.spec.tsx` の data-* 契約（`data-shell="topbar"` / `data-component="admin-breadcrumb-slot"`）が無修正で pass
- axe critical violation 0 を維持

### 2.3 スコープ

#### 含むもの

- breadcrumb 責務所有権の設計判断（§3.1）と、その判断に沿った `(admin)/layout.tsx` / `AdminPageHeader` / 各 admin page の配線修正
- topbar breadcrumb slot への実データまたは確定静的ラベルの注入
- 既存 `Breadcrumb` primitive 経由への統一
- 関連 spec の追従修正（data-* 契約は維持）

#### 含まないもの

- API endpoint 追加・変更（既存 endpoint surface のみ。本タスクは UI 配線のみで **API 変更不要**）
- D1 schema 変更 / D1 直接アクセス（`apps/web` から D1 binding 禁止を継続）
- Google Form 仕様変更
- 新規 primitive の追加（`Breadcrumb.tsx` を再利用。CLAUDE.md 不変条件3）
- design token の改変（OKLch トークンは `tokens.css` 正本のまま）
- topbar actions slot の具体ボタン実装（別タスク）

### 2.4 成果物

- `apps/web/app/(admin)/layout.tsx` の差分（breadcrumb slot 配線 / 責務確定に伴う変更）
- `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` の差分（責務分担に伴う breadcrumb 描画調整、必要時）
- 各 admin page（`apps/web/app/(admin)/admin/{members,page}.tsx` ほか）の breadcrumb props 調整（責務分担方針に依存）
- 関連 spec の差分

---

## 3. どのように実装するか（How）

### 3.1 設計方針（最重要: breadcrumb 正本の決定）

本タスクの主問題は「breadcrumb の責務所有権を決めて配線する」こと。以下 2 案のいずれかを採る。**推奨は案 B**（RSC 境界・既存 spec 契約・実装コストの観点から最小リスク）。

#### 案 A: topbar slot を breadcrumb の正本にする（グローバル集約）

- `(admin)/layout.tsx`（server component）で現在 path を解決し、`<AdminTopbar breadcrumb={<Breadcrumb items={...} />} />` として topbar に動的パンくずを集約する。
- AdminPageHeader からは breadcrumb 描画を外し、title / actions 専任にする。
- **難点**: layout.tsx は子セグメントの path を直接知らない。`usePathname()` は client API のため RSC のまま使えない（§4.1 参照）。layout の `params` は静的セグメント名しか持たず、人間可読ラベル（「会員管理」等）への変換テーブルを別途持つ必要がある。配線が広く波及する。

#### 案 B: 役割分担で二重を解消する（推奨）

- **topbar slot = グローバル固定ラベル**、**AdminPageHeader = ページ内 breadcrumb** と役割を明確に分離する。
- topbar の breadcrumb slot は「管理（admin ルートのトップ識別ラベル）」を意図的な静的ラベルとして所有する（`<AdminTopbar breadcrumb={<Breadcrumb items={[{ label: "管理", href: "/admin" }]} />} />` 形に統一し、固定テキストではなく primitive 経由にする）。
- AdminPageHeader は **ページ内の現在地**のみを breadcrumb として表示する。topbar が既にルートトップ「管理」を所有するため、各 page の `breadcrumbs` 先頭の `{ label: "管理", href: "/admin" }` を除去し、現在ページのラベルのみ（例: `[{ label: "会員管理" }]`）に変更する。これで「管理」ラベルの重複を解消する。
- いずれの slot も既存 `Breadcrumb` primitive 経由に統一し、固定テキストや新規 DOM を増やさない。

> 採用案は実装着手時に確定し、canonical workflow の Phase 文書に記録すること。本指示書の DoD（§6）は案に依存しない不変条件のみを規定する。

### 3.2 変更ファイル一覧（案 B 採用時の想定）

| ファイル                                                                       | 種別     | 内容                                                                                  |
| ------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------- |
| `apps/web/app/(admin)/layout.tsx`                                              | 既存変更 | `<AdminTopbar breadcrumb={<Breadcrumb items={[{ label: "管理", href: "/admin" }]} />} />` に配線（primitive 経由） |
| `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`           | 既存変更 | breadcrumb 描画を「ページ内現在地のみ」前提に整理（必要時のコメント/既定挙動調整）    |
| `apps/web/app/(admin)/admin/page.tsx`                                          | 既存変更 | `breadcrumbs` 先頭の `{ label: "管理", href: "/admin" }` を除去                        |
| `apps/web/app/(admin)/admin/members/page.tsx`                                  | 既存変更 | 同上                                                                                  |
| `apps/web/app/(admin)/admin/{tags,meetings,schema,requests,identity-conflicts,audit}/page.tsx` | 既存変更 | AdminPageHeader を使う各ページで breadcrumbs を現在地のみへ統一（利用箇所を grep で確定） |
| `apps/web/app/(admin)/layout.spec.tsx`                                         | 既存変更 | breadcrumb slot が primitive 経由になっても data-* 契約 pass を維持（必要時 assert 追記） |

> 各 admin page の AdminPageHeader 利用箇所は `grep -rln "AdminPageHeader" "apps/web/app/(admin)/"` で確定する（現状 8 ページが利用）。

### 3.3 実装イメージ（案 B）

`(admin)/layout.tsx`（before）:

```tsx
<AdminTopbar />
```

`(admin)/layout.tsx`（after）:

```tsx
<AdminTopbar
  breadcrumb={<Breadcrumb items={[{ label: "管理", href: "/admin" }]} />}
/>
```

各 admin page（before / `members/page.tsx`）:

```tsx
<AdminPageHeader
  title="会員管理"
  breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "会員管理" }]}
/>
```

各 admin page（after）:

```tsx
<AdminPageHeader
  title="会員管理"
  breadcrumbs={[{ label: "会員管理" }]}
/>
```

---

## 4. 苦戦箇所・将来の留意点（重要）

後続が即解決できる粒度で残す。followup-001 の §4 を踏襲しつつ、本タスク固有の論点を具体化する。

### 4.1 RSC 境界での current path 取得方法（最重要）

- `(admin)/layout.tsx` は `async` server component で `getSession()` を呼ぶ（`export const dynamic = "force-dynamic"`）。
- **`usePathname()` は client API**。AdminTopbar や layout に持ち込むと `"use client"` 境界が必要になり、layout 全体が client 化するリスクがある（followup-001 §4.4 の踏襲: server component に client-only API を混ぜない）。
- したがって案 A（topbar に動的パンくずを集約）を採るなら、current path の取得は以下のいずれかで RSC のまま実現すること:
  1. layout の `params` / segment 情報を使う（ただし静的セグメント名のみ・人間可読ラベル変換テーブルが別途必要）
  2. 各 page から layout へ props 注入はできない（layout は children を受けるが page から layout への upward props は不可）→ Next.js App Router では子から親 layout への直接データ受け渡しは不可なので、parallel route / template / context のいずれかを検討（client 化リスクと天秤）
  3. **現実解は案 B**: topbar は静的ラベル所有・page header はページ内現在地、と役割分担して RSC のまま完結させる（client 境界不要）
- AdminTopbar に client button（actions）を将来入れる場合は呼び出し側で `"use client"` ラッパーを作る（followup-001 §4.4 と同方針）。

### 4.2 AdminPageHeader との責務重複の解消方針

- 二重描画の本質は「topbar slot」と「AdminPageHeader breadcrumb」が同じ現在地情報を別々に持つこと。
- 解消の決め手は **どちらか一方に breadcrumb を寄せる**か、**役割分担**（topbar=ルートトップ固定ラベル「管理」/ AdminPageHeader=ページ内現在地）のいずれか。案 B は後者。
- 役割分担を採る場合、各 page の `breadcrumbs` 先頭にある `{ label: "管理", href: "/admin" }` を必ず除去し、「管理」ラベルが topbar と page header で二重に出ないことを目視・spec で確認する。
- `Breadcrumb.tsx` は `items.length === 0` のとき `null` を返す。AdminPageHeader 側で breadcrumbs を空配列にすると breadcrumb 自体が消える挙動になる点に注意（意図せぬ非表示を避ける）。

### 4.3 既存 data-* 契約を壊さない

- `(admin)/layout.spec.tsx` は `data-shell="topbar"`（AdminTopbar の root `<header>`）の存在を assert する。breadcrumb slot 内に primitive を入れても、AdminTopbar 内部の `data-component="admin-breadcrumb-slot"` を持つ `<div>` 構造は維持すること（slot の子に `<Breadcrumb>` が入るだけ）。
- `Breadcrumb` primitive は `data-component="breadcrumb"` を `<nav>` に付与する。`admin-breadcrumb-slot` の内側に `breadcrumb` が入れ子になるので、両 selector が共存することを確認する（どちらの契約も壊さない）。
- AppShell wrapper 側の `data-route-group="admin"` / `data-theme="cool"` / `data-route="admin"` / `data-testid="admin-shell"` は layout 責務なので一切触らない。

### 4.4 OKLch トークン正本化（CLAUDE.md 不変条件2）

- `Breadcrumb` の見た目は `ui-breadcrumb` class（`apps/web/src/styles/globals.css`）と `var(--ubm-color-*)` で決まる。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入しないこと。
- AdminTopbar 既存の `text-[var(--ubm-color-text-primary)]` 等のトークン参照を踏襲し、新規 visual 仕様を持ち込まない（CI gate `verify-design-tokens` で fail 判定）。

### 4.5 プロトタイプ正本順位（CLAUDE.md 不変条件3）

- breadcrumb は既存 `apps/web/src/components/admin/Breadcrumb.tsx` を再利用する。**新規 primitive を生やさない**。
- `docs/00-getting-started-manual/claude-design-prototype/` の primitives + tokens + rhythm を参照し、新規 visual 仕様を持ち込まない。

---

## 5. テスト戦略

### 5.1 Unit (primitive / page header)

- `apps/web/src/components/admin/Breadcrumb.tsx` の既存 spec があれば無修正 pass を確認（`items` の `aria-current="page"` / 空配列で `null` の契約）。
- AdminPageHeader を変更する場合、breadcrumbs を「現在地のみ」へ変えた後も title / actions / description の描画契約が維持されることを spec で確認。

### 5.2 Integration (layout)

- `apps/web/app/(admin)/layout.spec.tsx` を pass させる。breadcrumb slot を primitive 経由にしても:
  - `data-shell="topbar"` が引き続き検出可能
  - `data-component="admin-breadcrumb-slot"` が引き続き検出可能
  - 新たに `data-component="breadcrumb"`（Breadcrumb primitive）が slot 内に出現することを assert 追記してもよい
- 「管理」ラベルが topbar と page header で重複しないこと（案 B では各 page の先頭 breadcrumb 除去後）を、代表 page の統合描画で確認。

### 5.3 a11y

- `axe` critical violation 0 を維持（layout.spec.tsx の既存 axe assertion を流用）。
- `Breadcrumb` の `<nav aria-label="breadcrumb">` / `aria-current="page"` のランドマーク・現在地表現が壊れないこと。

### 5.4 検証コマンド

```bash
mise exec -- pnpm --dir apps/web exec vitest run app/\(admin\)/layout.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run src/components/admin/Breadcrumb.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 6. 受け入れ条件（DoD）

- **AC-1**: breadcrumb の責務所有権が確定し、canonical workflow の Phase 文書に「topbar slot と AdminPageHeader の役割分担（または一方への集約）」が明記されている
- **AC-2**: topbar の breadcrumb slot が固定テキスト「管理」直書きではなく、既存 `Breadcrumb` primitive 経由（または確定した責務に沿った内容）になっている
- **AC-3**: 同一 breadcrumb ラベル（「管理」）が topbar と AdminPageHeader で二重表示されない
- **AC-4**: breadcrumb 表示が既存 `apps/web/src/components/admin/Breadcrumb.tsx` 経由に統一され、**新規 primitive を追加していない**（不変条件3）
- **AC-5**: `(admin)/layout.spec.tsx` の data-* 契約（`data-shell="topbar"` / `data-component="admin-breadcrumb-slot"`）が pass
- **AC-6**: `(admin)/layout.tsx` に `usePathname` 等の client-only API を持ち込んでおらず、layout が server component のまま（`"use client"` 化していない）
- **AC-7**: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- **AC-8**: axe critical violation 0 を維持
- **AC-9**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（不変条件2 OKLch トークン正本化）
- **AC-10**: API endpoint・D1 schema・Google Form 仕様を変更していない（UI 配線のみ。`apps/web` から D1 直接アクセスなし）

---

## 7. 関連 path / refs

- 親 workflow: `docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/`
- deferred 根拠: `docs/30-workflows/unassigned-task/parallel-03-followup-001-admin-topbar-primitive-extraction.md` §2.3「含まないもの」line 78
- topbar primitive: `apps/web/src/components/layout/AdminTopbar.tsx`（`breadcrumb?: ReactNode` / `actions?: ReactNode` slot）
- AppShell layout: `apps/web/app/(admin)/layout.tsx`（async server component / `getSession()` / `<AdminTopbar />` props なし呼び出し）
- layout spec: `apps/web/app/(admin)/layout.spec.tsx`（data-* 契約 + axe）
- breadcrumb primitive: `apps/web/src/components/admin/Breadcrumb.tsx`（`items` / `data-component="breadcrumb"` / `ui-breadcrumb` / `aria-current="page"`）
- page header: `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`（task-15 由来 / breadcrumbs + title + actions）
- breadcrumb CSS: `apps/web/src/styles/globals.css`（`ui-breadcrumb`）
- 利用箇所: `apps/web/app/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}/page.tsx` + `apps/web/app/(admin)/admin/page.tsx`（AdminPageHeader を利用する 8 ページ）
- design token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1「既存 API のみ接続」/ §不変条件 2「OKLch トークン正本化」/ §不変条件 3「プロトタイプ正本順位（新規 primitive 禁止）」/ §不変条件 4「D1 直接アクセス禁止」

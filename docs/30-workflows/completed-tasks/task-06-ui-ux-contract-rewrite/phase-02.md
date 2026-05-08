# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 2 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 1 (要件定義) |
| 下流 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 の真の論点 4 件を満たす `09-ui-ux.md` 新章立て（§1〜§10）と、§2 / §3 の統一テーブル列構成、§4.5 prototype 由来契約 19 行の取り込み先 mapping、§4.6 不採用 4 項目の明示削除リスト、09a..09h index 表配置を確定する。後続 Phase 4（テスト戦略）/ Phase 5（実装ランブック）が参照する「書き換え対象の構造」を Phase 2 で固定する。

## 実行タスク

1. 旧章立て（160 行）と新章立て（300〜420 行）の差分を表で確定
2. §2 routes 契約表の列構成（10 列）を確定し、サンプル文面（`/` Public Top）を template 化
3. §3 primitives / feature components 表の列構成（8 列）を確定し、サンプル文面（Button）を template 化
4. §4.5 prototype 由来契約 19 行を「prototype 由来 / 契約に取り込む情報 / 取り込み先」の 3 列表で確定
5. §4.6 不採用 4 項目（tweaks / photo store / data-theme / gas-prototype）を「項目 / 理由」の 2 列表で確定
6. login 5 状態 / 申請 server-pending state / a11y 契約（dialog / drawer / form / live region）の正本見出し位置を確定
7. token prefix 規則（8 種 prefix）と「視覚値の決定権は 09b にある」明文化文面を確定
8. 09a..09h index 表の配置位置（§1.2 もしくは §6 直前）を確定
9. outputs/phase-02/chapter-skeleton.md に章スケルトン（§1〜§10 の見出しのみ）を配置

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md | 元仕様書 §4 詳細差分 |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md（現行） | 旧章立て |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | API 接続表 §2 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | 契約抽出元 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/pages-{public,member,admin}.jsx | 状態列挙抽出元 |

## 章立て差分

### 旧章立て（現行 160 行）

```
1. 位置づけ
2. 情報設計の基本原則
3. レイヤ別 UX (公開 / 会員 / 管理)
4. 一覧 UX (検索 / カード / 空状態)
5. 詳細 UX (公開詳細 / マイページ)
6. 管理 UX (ダッシュボード / メンバー管理 / タグ / スキーマ / 開催日)
7. コンポーネント方針 (7.1 06a 公開層コンポーネント契約)
8. 不採用と注意事項
```

問題: 視覚詳細（Hero 構成順序 / 密度切替値 / KPI 文言）と契約（props / state / a11y）が混在。

### 新章立て（契約のみ・目標 300〜420 行）

```
1. 位置づけと正本主義
   1.1 「契約のみ」スコープ
   1.2 link 先（09a / 09b / 09c..09h / Storybook）index 表
2. 19 routes 全画面の契約一覧
   2.1 公開層 (6 routes)
     2.1.1 `/` (Public Top)
     2.1.2 `/(public)/members`
     2.1.3 `/(public)/members/[id]`
     2.1.4 `/(public)/register`
     2.1.5 `/privacy`
     2.1.6 `/terms`
   2.2 会員層 (2 routes)
     2.2.1 `/login`
     2.2.2 `/profile`
   2.3 管理層 (8 routes)
     2.3.1 `/(admin)/admin`
     2.3.2 `/(admin)/admin/members`
     2.3.3 `/(admin)/admin/tags`
     2.3.4 `/(admin)/admin/meetings`
     2.3.5 `/(admin)/admin/schema`
     2.3.6 `/(admin)/admin/requests`
     2.3.7 `/(admin)/admin/identity-conflicts`
     2.3.8 `/(admin)/admin/audit`
   2.4 共通 (3 routes + global fallback)
     2.4.1 `app/error.tsx`
     2.4.2 `app/global-error.tsx`
     2.4.3 `app/not-found.tsx`
     2.4.4 `app/loading.tsx`
3. component 契約一覧
   3.1 primitives (13 種)
     3.1.1 Button / 3.1.2 Card / 3.1.3 Badge / 3.1.4 Input / 3.1.5 Select / 3.1.6 Table / 3.1.7 Tabs / 3.1.8 Sidebar / 3.1.9 Toast / 3.1.10 Skeleton / 3.1.11 DataTable / 3.1.12 EmptyState / 3.1.13 ErrorState
   3.2 feature components (29 種)
     Hero / Stats / ZoneGuide / Timeline / MemberCard / MemberList / FilterBar / DensityToggle / MemberDetail / VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel / KpiGrid / ZoneChart / StatusChart / RecentActions / MembersTable / MemberDrawer / TagsQueue / MeetingsCalendar / MeetingForm / RequestsQueue / RequestDetail / SchemaDiff / ConflictPair / AuditTimeline / AuditFilterBar / LegalProse
4. 状態列挙の規範
   4.1 ページ標準 5 値 (idle / loading / empty / error / success)
   4.2 login 5 状態 (input / sent / unregistered / deleted / error)
   4.3 申請 pending state (server-pending を上書き禁止)
   4.4 [移植元] §4.5 prototype 由来契約 19 行マッピング表
   4.5 [移植元] §4.6 不採用 4 項目
5. アクセシビリティ契約
   5.1 全画面共通
   5.2 dialog / drawer (role="dialog" + aria-modal="true" + focus trap + Esc close)
   5.3 form / input
   5.4 live region (status / alert)
6. token 参照規則
   6.1 視覚値の決定権は 09b にある
   6.2 OKLch tokens を CSS 変数経由でのみ参照（HEX / `bg-[#...]` 直書き禁止）
   6.3 token 名 prefix 規則（8 種 prefix）
7. Storybook 正本主義
   7.1 contract と Storybook story の責務分担
   7.2 component の正解スクリーンショットは Storybook の VRT 画像が正本
8. 不採用画面・不採用パターン
9. 用語集（zone / gate-state / visibility-request / identity-conflict / pending banner）
10. 改訂履歴
```

差分の核心:

- 旧 §3〜§6（レイヤ別 UX / 一覧 UX / 詳細 UX / 管理 UX）の **視覚詳細記述を削除**し、新 §2 で routes 軸の契約表に統合
- 旧 §7「コンポーネント方針」を新 §3 に移し、props 一覧表に統一
- 新 §6 で「視覚値の決定権は 09b にある」と明文化
- 新 §7 で Storybook 正本主義を導入

## §2 routes 契約表 列構成（統一）

```
| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
```

### サンプル文面（§2.1.1 `/` Public Top）

```markdown
### 2.1.1 `/` (Public Top)

| 項目 | 内容 |
|------|------|
| 認可 | unauthenticated 可 / authenticated 可 |
| layout | `(public)/layout.tsx`（Header + Footer） |
| 主 component | `Hero`, `Stats`, `ZoneGuide`, `Timeline` |
| API | `GET /public/stats`, `GET /public/members?limit=6&order=recent`, `GET /public/form-preview`（並列） |
| 状態 | idle → loading → (success | error | empty) |
| 主 props | `Hero { title, subtitle, primaryCta, secondaryCta }` / `Stats { stats: PublicStatsView }` / `Timeline { meetings: TimelineItem[] }` |
| a11y | landmark `<main>` / `<nav>` / `<footer>` 必須。`Hero` の見出しは `<h1>` 1 個。`Stats` 各 card は `role="figure"` + `aria-labelledby` |
| token | `--ubm-color-bg`, `--ubm-color-panel`, `--ubm-color-accent`, `--ubm-radius-lg`, `--ubm-shadow-md` |
| 視覚詳細 | → `09a-prototype-map.md` §1.1（公開トップ blueprint は `09e-screen-blueprints-public.md`） |
| 不採用 | `theme switcher` UI（プロトタイプ EDITMODE 専用） |
```

19 routes + `global-error.tsx` fallback を上記表形式で **同じ列構成**で書き切る（§2.1.1 〜 §2.4.4 の 19+1 個小数点付き連番）。

## §3 component 契約表 列構成（統一）

```
| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
```

### サンプル文面（§3.1.1 Button）

```markdown
#### 3.1.1 Button

| 項目 | 内容 |
|------|------|
| variants | `primary` | `accent` | `ghost` | `soft` | `danger` |
| sizes | `sm` | `md`（既定）| `lg` |
| props | `children`, `variant`, `size`, `icon`, `iconRight`, `block`, `disabled`, `type`, `title`, `onClick` |
| a11y | `<button type="...">` native semantics 必須。icon-only の場合は `aria-label` 必須 |
| state | `default` / `hover` / `focus-visible` / `active` / `disabled` |
| token | `--ubm-color-accent`, `--ubm-color-text`, `--ubm-radius-md`, `--ubm-shadow-xs` |
| 視覚詳細 | → `09a-prototype-map.md` §2.1（完全仕様は `09c-primitives.md`） |
| Storybook | `apps/web/src/components/ui/button.stories.tsx`（task-10 で作成） |
```

## §4.5 prototype 由来契約 19 行（取り込み先 mapping）

| prototype 由来 | 契約に取り込む情報 | 取り込み先 |
|--------------|------------------|-----------|
| `primitives.jsx` Chip | tone (`default`/`accent`/`ok`/`warn`/`danger`/`info`), `outline`, `dot`, `size: sm` | §3.1 Badge |
| `primitives.jsx` Button | variants, sizes, icon/iconRight/block | §3.1 Button |
| `primitives.jsx` Switch | `aria-pressed` の使用 | §3.1 Switch |
| `primitives.jsx` Segmented | options[].value/label, 単一選択 | §3.1 Segmented |
| `primitives.jsx` Field | `label`, `required`, `optional`, `hint`, `error` | §3.1 Field |
| `primitives.jsx` Drawer | `role="dialog"`, Esc close, focus trap | §3.1 Drawer + §5.2 |
| `primitives.jsx` Modal | scrim click close, Esc close | §3.1 Modal + §5.2 |
| `primitives.jsx` Toast | tone (`default`/`ok`/`warn`/`danger`), 自動消滅 | §3.1 Toast + §5.4 |
| `primitives.jsx` KVList | `rows: { k, v }[]`, 空値プレースホルダ表示 | §3.1 KVList |
| `primitives.jsx` LinkPills | `LINK_LABELS` map, external new tab | §3.2 LinkPills |
| `primitives.jsx` zoneTone/statusTone | zone → info/accent/ok の写像規則 | §6.3 token mapping |
| `pages-public.jsx` LandingPage | Hero / Stats / ZoneGuide / Timeline の構成順序 | §2.1.1 `/` |
| `pages-public.jsx` MemberListPage | filter `q/zone/status/sort/density`, density 3 値 | §2.1.2 `/(public)/members` |
| `pages-public.jsx` MemberDetailPage | summary / overview / skill / offer / personality / contact 順 | §2.1.3 `/(public)/members/[id]` |
| `pages-member.jsx` LoginPage | 5 状態 (input/sent/unregistered/deleted/error) | §4.2 |
| `pages-member.jsx` MyProfilePage | 4 領域 (banner/summary/request/delete) | §2.2.2 `/profile` |
| `pages-admin.jsx` AdminDashboardPage | KpiGrid + ZoneChart + StatusChart + RecentActions | §2.3.1 `/(admin)/admin` |
| `pages-admin.jsx` AdminMembersPage | DataTable + Drawer | §2.3.2 `/(admin)/admin/members` |
| `pages-admin.jsx` AdminTagsPage / SchemaDiffPage | TagsQueue（左 list + 右 detail）/ SchemaDiff（2 column）+ apply confirm | §2.3.3 / §2.3.5 |

> 上記表は元仕様書 §4.5 を完全転記。19 行を漏れなく §3 / §2 / §4.2 / §5.2 / §6.3 にマッピングする。

## §4.6 不採用 4 項目（明示削除）

| 項目 | 理由 |
|------|------|
| プロトタイプ `tweaks` パネル / `theme switcher`（`app.jsx`） | EDITMODE 専用、本番 UI 要件外 |
| `localStorage` ベースの photo store（`primitives.jsx` AvatarStoreProvider） | 本番は API 経由（task-14 で別途設計） |
| `data-theme="warm" / "cool"` 切替（`styles.css`） | dark mode 含め MVP 非対応（token 拡張余地のみ確保） |
| `gas-prototype/` 由来の振る舞い | 認証・保存仕様の正本に昇格させない（不変条件 #6） |

## §6 token 参照規則

### §6.1 視覚値の決定権は 09b にある

「09-ui-ux.md は token 名 prefix のみ参照する。値（HEX / oklch / px）は `09b-design-tokens.md`（task-08）が正本。」を冒頭で明文化する。

### §6.2 OKLch tokens を CSS 変数経由でのみ参照

「HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` / oklch() 値 / px 値直書き禁止」を明記。CI gate `verify-design-tokens`（task-18）で fail 判定。

### §6.3 token 名 prefix 規則（8 種）

| prefix | 用途 |
|--------|------|
| `--ubm-color-*` | 色（surface / panel / accent / text / status） |
| `--ubm-radius-*` | 角丸 |
| `--ubm-shadow-*` | 影 |
| `--ubm-space-*` | 余白 / gap |
| `--ubm-text-*` | typography size / line-height |
| `--ubm-font-*` | font-family / weight |
| `--ubm-dur-*` | アニメ duration |
| `--ubm-ease-*` | アニメ easing |

## §5 a11y 契約（正本見出し位置）

- §5.1 全画面共通: landmark `<main>` / `<nav>` / `<footer>`、`<h1>` 1 個原則、focus-visible 必須
- §5.2 dialog / drawer: `role="dialog"` + `aria-modal="true"` + focus trap + Esc close + scrim click close
- §5.3 form / input: `<label htmlFor>` ↔ `<input id>` / `aria-describedby` で hint/error 連携 / `aria-invalid` / `aria-required`
- §5.4 live region: `role="status"`（assertive でない通知）/ `role="alert"`（即時通知）/ Toast Provider 経由

## 09a..09h index 表（§1.2 配置）

index.md「主要構造」セクションの index 表をそのまま §1.2 に転記。8 ファイル全ての link path を確定（task-19..22 完了で link 解決）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビューで alternative 案と比較（章立て案 A / B / C） |
| Phase 4 | verify suite（grep gate / markdown lint / trace check）の入力 |
| Phase 5 | runbook に書き換え順序として渡す |
| Phase 7 | AC マトリクスで設計と検証を一対一対応 |

## 多角的チェック観点（不変条件参照）

- **#2**: §2.1.4 register / §2.2.2 profile 表で `publicConsent` / `rulesConsent` を主 props として明示
- **#3**: §2.2.2 profile / §2.3.2 admin members 表で `responseEmail` を system field として注記
- **#5**: §2 全 routes の API 列で `apps/api` 経由のみ記述、D1 binding 直接参照を 0 件に
- **#6**: §4.6 / §8 で gas-prototype 由来挙動を不採用明示
- **a11y**: §5.2 で WAI-ARIA Authoring Practices 準拠（dialog / tabs / table パターン）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 章立て差分表 | 2 | completed | 旧 8 章 → 新 10 章 |
| 2 | §2 表列構成 + サンプル | 2 | completed | 10 列 / Public Top template |
| 3 | §3 表列構成 + サンプル | 2 | completed | 8 列 / Button template |
| 4 | §4.5 19 行 mapping 表 | 2 | completed | prototype 由来 → 取り込み先 |
| 5 | §4.6 不採用 4 項目 | 2 | completed | tweaks / photo store / data-theme / gas |
| 6 | login 5 状態 / a11y 正本見出し | 2 | completed | §4.2 / §5.2 |
| 7 | §6 token prefix 規則 | 2 | completed | 8 種 prefix |
| 8 | 09a..09h index 表配置位置 | 2 | completed | §1.2 配置 |
| 9 | chapter-skeleton.md 作成 | 2 | completed | outputs/phase-02/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計総合（章立て差分 / 列構成 / mapping / 不採用） |
| ドキュメント | outputs/phase-02/chapter-skeleton.md | §1〜§10 見出しスケルトン（書き換え用 template） |
| メタ | artifacts.json | Phase 2 を completed に更新 |

## 完了条件

- [ ] 旧章立て（8 章） → 新章立て（10 章）の差分表が確定
- [ ] §2 routes 表 10 列、§3 component 表 8 列の列構成が確定
- [ ] §2.1.1 Public Top と §3.1.1 Button の template が記述済み
- [ ] §4.5 prototype 由来契約 19 行が「prototype 由来 / 契約 / 取り込み先」3 列で確定
- [ ] §4.6 不採用 4 項目が「項目 / 理由」2 列で確定
- [ ] login 5 状態（§4.2）、申請 pending（§4.3）、a11y dialog/drawer（§5.2）の正本見出し位置が確定
- [ ] §6 token prefix 8 種が確定
- [ ] 09a..09h index 表の §1.2 配置が確定

## タスク 100% 実行確認【必須】

- [ ] 全 9 サブタスクが completed
- [ ] outputs/phase-02/main.md と chapter-skeleton.md が配置済み
- [ ] artifacts.json の phase 2 を completed に更新

## 次 Phase

- 次: Phase 3（設計レビュー）
- 引き継ぎ事項: alternative 案の比較対象（旧章立て維持 vs 完全書き換え vs 部分書き換え）
- ブロック条件: outputs/phase-02/main.md が未作成

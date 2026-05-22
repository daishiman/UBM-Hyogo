# Phase 1: 要件定義

[実装区分: 実装仕様書]

> 目的: scope / 受入条件 / inventory / 命名規則を固定し、Phase 2 設計が迷わずに進められる前提を整える。

---

## 1. P50 前提確認チェック

| 項目 | 結果 | 対応 |
|------|------|------|
| current branch に該当実装が存在するか | **Partial baseline**（`apps/web/app/(admin)/admin/page.tsx` / `apps/web/app/(admin)/admin/members/page.tsx` / `apps/web/src/components/admin/*` は既存。task-15 は既存 baseline の再構成・強化） | 通常実装 Phase として扱う（implementation_mode: `new`、workflow_state は実装前 `spec_created`） |
| upstream (dev/main) にマージ済みか | No | 該当なし |
| 前提タスク（task-09 / task-10）完了済みか | **要確認**（Phase 1 着手時に `apps/web/src/components/ui/` の primitive 群と Tailwind v4 tokens 配備を grep で確認） | 未完了の場合は依存解消を Phase 1 に追加 |

### 1.1 前提確認コマンド

```bash
# task-09 完了確認: Tailwind v4 + OKLch tokens
test -f apps/web/src/styles/tokens.css && grep -c '@theme' apps/web/src/styles/tokens.css
# task-10 完了確認: UI primitives 11 種
ls apps/web/src/components/ui/{button,card,badge,input,select,sidebar,stat,empty-state,avatar,field,banner,drawer,skeleton}.tsx 2>&1 | grep -c .tsx
# Admin layout の server guard baseline（現行コードは getSession + redirect）
test -f 'apps/web/app/(admin)/layout.tsx' && rg -n 'getSession|redirect' 'apps/web/app/(admin)/layout.tsx'
# admin API proxy / server fetch helper（現行 canonical）
test -f 'apps/web/app/api/admin/[...path]/route.ts' && test -f apps/web/src/lib/admin/server-fetch.ts && echo "admin proxy/server-fetch: present"
```

依存欠落時は Phase 2 進行不可。本仕様書ではこれらは整っている前提で記述する。

---

## 2. スコープ

### 2.1 含むもの（in-scope）

1. `apps/web/app/(admin)/layout.tsx` の **確定担当**（task-15 で先行して `dev` へ反映）
2. `/admin`（管理ダッシュボード）の SSR ページ + KPI / Zone 分布 / Status 分布 / Recent Actions / SchemaAlert
3. `/admin/members`（会員管理テーブル）の SSR ページ + Filters / BulkActionBar / Table / Drawer
4. `apps/web/src/lib/admin/{api,server-fetch,types}.ts` の **admin client surface 強化**（task-16/17 が関数追加するための土台）
5. vitest コンポーネントテスト 5 ファイル（KpiGrid / MembersFilters / MembersTable / RecentActionsTable / BulkActionBar）

### 2.2 含まないもの（out-of-scope / 非ゴール）

| 項目 | 理由 | 取扱 |
|------|------|------|
| 新 admin endpoint の追加 | 元仕様 §1.2 / CLAUDE.md §7「新 endpoint 追加禁止」 | `apps/api` の `git diff main -- apps/api` が空であること |
| D1 schema 変更 | 元仕様 §1.2 | 一切なし |
| virtual scroll 化 | 元仕様 §1.2（pageSize=50 固定） | 通常 pagination のみ |
| CSV export 実装 | 元仕様 §1.2 | button は `disabled + title="MVP 範囲外"` |
| task-17 audit 画面のフィルタ反映 | task-17 担当 | dashboard RecentActions の row click は単純遷移のみ |
| task-16 / task-17 の admin sub-route 実装 | 各 task が責務 | layout merge 後に並列着手 |

### 2.3 未タスク化候補（CONST_007 例外）

以下は **本サイクル内では実装不要** とユーザー確認の上、Phase 12 で `unassigned-task-detection.md` に登録する候補:

1. `/admin/dashboard` API への `byZone` / `byStatus` 集計フィールド追加（本タスクは UI 側 optional schema + placeholder で吸収）。理由: `apps/api` 変更禁止が元仕様 §1.2 不変条件のため、API 拡張は別タスクで扱う。
2. CSV export 実装（プロトタイプにはボタンがあるが MVP 範囲外と元仕様で明示）。

---

## 3. 受入条件（Definition of Done — Phase 10 で一括判定）

| ID | 条件 | 検証方法 | 元仕様 |
|----|------|---------|-------|
| G-01 | `/admin` SSR 200、KPI 4 / Zone / Status / RecentActions が描画 | Playwright smoke (P-15-01) | §1.1 |
| G-02 | `/admin/members` SSR 200、テーブル + フィルタ + bulk + drawer 動作 | Playwright smoke (P-15-02) | §1.1 |
| G-03 | `(admin)/layout.tsx` に AdminSidebar 8 nav + AdminPageHeader + 2 カラム grid | 目視 + scrollshot | §1.1 |
| G-04 | 既存 admin endpoint 6 操作を adapter 経由接続（dashboard / members list / detail / status / delete / restore、新 endpoint なし） | unit test + manual smoke | §1.1 |
| G-05 | OKLch tokens のみ、HEX 直書き 0 件 | `pnpm verify-design-tokens` | §1.1 |
| G-06 | jest-axe critical 0 件 | jest-axe テスト | §1.1 |
| G-07 | sort / filter が client state で動作 | vitest | §1.1 |
| G-08 | bulk action（公開 / 非公開 / 論理削除）が起動可能 | vitest + manual | §1.1 |
| G-09 | drawer で 1 会員詳細（identity / answers / audit / notes）確認 | vitest | §1.1 |
| G-10 | `verify-design-tokens` / `pnpm typecheck` / `pnpm lint` green | CI | §1.1 |
| G-11 | `apps/api` 差分 0 行 | `git diff main -- apps/api` が空 | §10 D-11 |
| G-12 | 旧 `apps/web/src/components/admin/` 残骸の orphan 警告 0 | task-18 verify-no-orphan | §10 D-10 |

---

## 4. インベントリ（変更対象ファイル一覧）

元仕様 §2 を Phase 1 で固定。命名は **kebab-case ディレクトリ + PascalCase コンポーネント** に統一（既存コードベースと整合）。

### 4.1 新規作成 (Create) — 20 ファイル

| path | 役割 |
|------|------|
| `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | breadcrumb + title + action slot |
| `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` | KPI セル 1 枚 |
| `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | KPI 4 枚を grid-4 で配置 |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | Zone 分布バーチャート |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | Status 分布チップ群 |
| `apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx` | recentActions の DataTable |
| `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | unresolvedSchema > 0 アラート |
| `apps/web/src/features/admin/components/_members/MembersClientShell.tsx` | URLSearchParams 同期 client container |
| `apps/web/src/features/admin/components/_members/MembersFilters.tsx` | zone / status / publishState / q の Filter Bar |
| `apps/web/src/features/admin/components/_members/MembersTable.tsx` | テーブル本体（sort / select / row action） |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | 一括 action |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | row 詳細 drawer |
| `apps/web/src/features/admin/components/index.ts` | barrel export |
| `apps/web/src/lib/admin/admin-dashboard-ui.ts` | dashboard UI optional mapper（`byZone` / `byStatus` placeholder 判定を web 内に閉じる） |
| `apps/web/src/lib/admin/dashboard-ui.test.ts` | dashboard UI mapper の unit test |
| `apps/web/src/features/admin/components/__tests__/KpiGrid.test.tsx` | vitest |
| `apps/web/src/features/admin/components/__tests__/MembersTable.test.tsx` | vitest |
| `apps/web/src/features/admin/components/__tests__/MembersFilters.test.tsx` | vitest |
| `apps/web/src/features/admin/components/__tests__/RecentActionsTable.test.tsx` | vitest |
| `apps/web/src/features/admin/components/__tests__/BulkActionBar.test.tsx` | vitest |

### 4.2 修正 (Modify) — 3 ファイル

| path | 修正内容 |
|------|---------|
| `apps/web/app/(admin)/layout.tsx` | getSession server guard + 2 カラム grid + AdminSidebar / 既存実装の置換 |
| `apps/web/app/(admin)/admin/page.tsx` | dashboard SSR + Section 構成への書換 |
| `apps/web/app/(admin)/admin/members/page.tsx` | members SSR + MembersClientShell 受け渡しへの書換 |
| `apps/web/src/lib/admin/api.ts` | client mutation helper に status/delete/restore surface を維持・テスト補強 |
| `apps/web/src/lib/admin/server-fetch.ts` | server component 用 `fetchAdmin<T>()` の error handling / cookie forwarding 確認 |
| `apps/web/src/lib/admin/types.ts` | admin UI local 型の再 export / helper 型整備 |

### 4.3 参照のみ (Read-only) — 編集禁止

- `apps/web/src/components/layout/AdminSidebar.tsx`（既存 8 nav 構成）
- `apps/web/src/components/ui/*`（task-10 完成 primitive）
- `apps/web/src/lib/session.ts` / `apps/web/app/api/admin/[...path]/route.ts` / `apps/web/src/lib/admin/server-fetch.ts`
- `apps/api/src/routes/admin/{dashboard,members,member-status,member-delete}.ts`
- `packages/shared/src/zod/viewmodel.ts`

---

## 5. 不変条件（Phase 5 実装時の遵守事項）

1. **D1 直アクセス禁止**: `apps/web` は `apps/api` 経由のみ。Server Component は `fetchAdmin<T>()`、Client mutation は `/api/admin/*` proxy helper に限定し、D1 binding を import しない。
2. **OKLch tokens 専用**: `bg-[var(--ubm-color-*)]` 形式または Tailwind utility 経由のみ。`bg-[#xxx]` `text-[#xxx]` は `verify-design-tokens` が fail。
3. **consent キー固定**: `publicConsent` / `rulesConsent`（admin 表示でも別名禁止）。
4. **`responseEmail` は system field**: form 項目として並べない。drawer の identity ブロックで明示分離。
5. **GAS prototype は本番仕様に昇格させない**: `gas-prototype/` を import 禁止。
6. **Google Form 再回答が本人更新の正式経路**: members detail drawer の answers ブロックは read-only。
7. **新 endpoint 追加禁止**: `apps/api/src/routes/admin/` の `app.*` 行を増やさない。
8. **PII 表示**: drawer の `responseEmail` / 電話番号は masked 表示（`a***@example.com` / `090-****-1234`）。
9. **JST 表示**: dashboard の Recent Actions 時刻は `Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' })`。

---

## 6. 命名規則記録（Phase 4 TDD Red の前提固定）

| 対象 | 規則 | 例 |
|------|------|------|
| ディレクトリ | kebab-case + 下線プレフィックス（features 配下のサブグループ） | `_dashboard/`, `_members/`, `_layout/` |
| コンポーネントファイル | PascalCase.tsx | `KpiGrid.tsx`, `MembersTable.tsx` |
| テストファイル | `<Component>.test.tsx` | `KpiGrid.test.tsx` |
| API client export | 既存 `src/lib/admin` helper を拡張 | `fetchAdmin<AdminDashboardView>()`, `patchMemberStatus()`, `deleteMember()`, `restoreMember()` |
| zod schema | PascalCase + `Z` 接尾 | `AdminDashboardUiViewZ` |
| 型 alias | PascalCase | `AdminDashboardView`, `AdminMemberListItem` |
| CSS クラス | Tailwind utility + CSS 変数 | `bg-[var(--ubm-color-surface)]` |
| testid（追加する場合） | `admin-<area>-<role>` | `admin-kpi-card-total`, `admin-members-row-<id>` |

---

## 7. carry-over 確認

```bash
git log --oneline -10 -- docs/30-workflows/ui-prototype-alignment-mvp-recovery/
```

直前 task-13 (login-rebuild) の close-out が進行中（`docs/30-workflows/task-13-login-rebuild/` 削除 + `completed-tasks/` への移管 wave 中）。本タスクは task-13 と独立で並走可能。

---

## 8. リスクと対応

| リスク | 影響 | 対応 |
|-------|------|------|
| task-09 / task-10 未完了 | Phase 5 着手不可 | Phase 1 §1.1 確認コマンド失敗時は依存解消を別タスクで先行 |
| `(admin)/layout.tsx` を task-16/17 が並行編集 | merge conflict | 元仕様 §0.10 の通り task-15 W5（layout merge）まで task-16/17 着手不可と明示 |
| `/admin/dashboard` API が `byZone`/`byStatus` を返さない | dashboard chart が情報不足 | UI 側 optional + placeholder で吸収（API 拡張は未タスク化候補） |
| OpenNext Workers bundle が `[project]/...` 仮想 specifier を含む | production deploy 失敗 | `next build --webpack` を本タスクの build 検証コマンドとして使う（Turbopack は dev のみ） |
| renderer から node-only パッケージ import | Vite browser bundle runtime error | チャートは軽量 SVG または `recharts`（browser-safe）に限定 |

---

## 9. 完了条件

- [ ] §1.1 前提確認コマンドがすべて成功
- [ ] §3 DoD G-01〜G-12 が確定
- [ ] §4 インベントリが Phase 2 設計の入力として確定
- [ ] §6 命名規則が Phase 4 テスト命名の入力として確定
- [ ] `outputs/phase-01/requirements.md` を生成し、本仕様の §2-§8 を要約

## 成果物

- `outputs/phase-01/requirements.md`（scope / DoD / inventory / 命名規則の要約）
- 実行後に `artifacts.json` の `phase01.status` を `completed` へ更新（仕様書作成時点は `spec_created`）

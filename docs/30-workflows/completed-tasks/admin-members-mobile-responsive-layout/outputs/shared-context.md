# SSOT — admin-members-mobile-responsive-layout 共有コンテキスト

> 全 Phase / 全 SubAgent が参照する単一の正本（Single Source of Truth）。
> ここに書かれた事実・命名・不変条件・受入条件と矛盾する記述を各 phase ファイルに書いてはならない。

---

## 0. タスク要旨

staging `/admin/members`（会員管理ページ）が携帯（≤640px）でテーブルが横にはみ出し、列（特に「公開」列）が見切れて操作不能になっている。
モバイル（≤640px）では会員一覧を**カードレイアウト**へ切り替え、デスクトップ（≥641px）は**現行テーブルを維持**する。

- **真因**: `apps/web` 表現層のレスポンシブCSS欠如のみ。API（`/admin/members` endpoint）/ D1 / Google Form schema は無罪・不変。
- **実装区分**: `[実装区分: 実装仕様書]`（CONST_004）。コード変更（TSX 属性追加 + CSS追加 + テスト追加）を伴う VISUAL UI task。
- **relatedIssue**: null（staging 目視観察起点）。
- **visual_category**: VISUAL。
- **implementation_mode**: new（カード化レスポンシブCSSは未実装＝新規）。
- **スコープ**: `/admin/members` のテーブルのみ。他 admin 一覧テーブル（`/admin/tags` queue、`/admin/tags/catalog` catalog、meetings/requests/audit 等）は baseline follow-up として Phase 12 で記録（今回スコープ外）。

---

## 1. ユーザー意思決定（AskUserQuestion 確定事項）

| 設問 | 確定回答 | 影響 |
| ---- | -------- | ---- |
| Q1: モバイル表示方式 | **カード化**（≤640px は各会員を1枚の縦積みカード、デスクトップは現行テーブル維持） | AC-1 / Lane B 設計の正本 |
| Q2: スコープ範囲 | **会員管理ページのみ** | 他 admin 一覧テーブルは Phase 12 未タスク候補（OOS-1）に記録 |

カードに縦積みする項目順（モバイル）: ①チェックボックス＋アバター＋氏名（＋occupation） ②メール ③区画/ステータス（Chip群） ④タグ ⑤最終更新 ⑥公開トグル＋編集ボタン。

---

## 2. 対象ファイル（変更対象一覧 / 変更種別）

| # | パス | 種別 | 変更概要 |
| - | ---- | ---- | -------- |
| F1 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集 | ラッパー `<div>` に `data-component="admin-members-table"`、`<table>` に `data-testid="admin-members-table"`、各データ `<td>` に `data-cell` / `data-mobile-label` 属性付与。**ロジック・props・行/セルの順序・機械可読id は不変。属性追加のみ** |
| F2 | `apps/web/src/styles/globals.css` | 編集 | 既存 admin CSS と同一 `@layer` 内に `@media (max-width: 640px)` のカード化ブロックを追加。色・寸法は design token（`var(--ubm-*)`）経由。HEX 直書き / `bg-[#xxx]` 禁止 |
| F3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | 編集 | カード化属性の存在検証テスト（TC-MT-21〜TC-MT-24）を追加。既存 TC-MT-01〜20（axe a11y 含む）は不変で緑維持 |
| F4 | `apps/web/playwright/tests/admin-members-mobile.spec.ts` | 新規 | 375px / 640px viewport でカードレイアウト表示／横はみ出しゼロ／公開トグル可視を検証する mobile visual smoke。1280px との比較で desktop はテーブル維持を確認 |

> F4（Playwright）は VISUAL 証跡の補助。worktree / CI で Playwright が起動不可の場合は Phase 11 で CAPTURE_BLOCKED を記録し、unit test PASS + 手動 375/640/1280 スクリーンショットを代替証跡にする（ダミーPNG禁止）。

### 正確な現状アンカー（git で確認済み・2026-06-10 時点）

- `MembersTable.tsx:80` — ラッパー `<div className="ui-card overflow-hidden rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)]">`
- `MembersTable.tsx:81` — `<table className="w-full text-left text-sm">`
- `MembersTable.tsx:83-101` — `<thead>` 8列（チェック/メンバー/メール/区画ステータス/タグ/最終更新/公開/操作[sr-only]）
- `MembersTable.tsx:104-108` — 行 `<tr ... data-testid={`admin-members-row-${m.memberId}`}>`
- `MembersTable.tsx:109-183` — 8つの `<td className="px-3 py-2 ...">`
- `globals.css:2559-2576` — 既存 issue-276 mobile filterbar の `@media (max-width: 640px)` ＋ `data-component="member-filters"` パターン（**この直後・同一 `@layer` 内に F2 を追加する**）
- `globals.css` 総行数: 2608

---

## 3. 実装パターン（CSS駆動 responsive table → card）

### 3.1 設計の核心（なぜこの方式か）

DOMを二重描画（テーブル用＋カード用）すると `data-testid="admin-members-row-*"` が重複し、既存テスト・Playwright selector が壊れる。
そこで **DOM構造は単一の `<table>` のまま維持**し、CSS の `@media (max-width: 640px)` で `display: block` 化してカード見た目へ変換する。
これにより:
- 機械可読id（`data-testid` / `aria-label` / `chip-dot` / `member-state-chip-row`）が完全不変。
- jsdom は CSS `@media` を適用しないため、既存 unit test（axe a11y 含む TC-MT-18〜20）は computed display に影響されず緑のまま。
- 列ラベルは `<td data-mobile-label="...">` の `::before { content: attr(data-mobile-label); }` でカード内に表示。

### 3.2 F1 MembersTable.tsx 属性追加マップ（td → data-cell / data-mobile-label）

| td（行内の位置 / 内容） | 付与する属性 | カード時の見え方 |
| ----------------------- | ------------ | ---------------- |
| 1: チェックボックス | `data-cell="select" data-mobile-label="選択"` | カード上部にチェック＋名前と同行 |
| 2: メンバー（アバター＋氏名） | `data-cell="member" data-mobile-label="メンバー"` | カード見出し |
| 3: メール | `data-cell="email" data-mobile-label="メール"` | ラベル＋値 |
| 4: 区画 / ステータス | `data-cell="status" data-mobile-label="区画 / ステータス"` | ラベル＋Chip群 |
| 5: タグ | `data-cell="tags" data-mobile-label="タグ"` | ラベル＋タグChip群 |
| 6: 最終更新 | `data-cell="updated" data-mobile-label="最終更新"` | ラベル＋値 |
| 7: 公開 | `data-cell="publish" data-mobile-label="公開"` | ラベル＋トグル |
| 8: 操作（編集） | `data-cell="actions" data-mobile-label="操作"` | 公開トグルと同行右寄せ |

- ラッパー `<div>`: `data-component="admin-members-table"` を追加。
- `<thead>`: 既存 DOM を維持し、カード時に CSS で視覚的に隠す。a11y role は jsdom テストで保持。

### 3.3 F2 globals.css カード化CSS（雛型・最終形は実装者が token で確定）

`globals.css:2576` の issue-276 ブロック直後、**同一 `@layer` ネスト内**に追加する:

```css
/* === admin-members-mobile-responsive-layout: テーブル→カード化 (<=640px) === */
@media (max-width: 640px) {
  [data-component="admin-members-table"] thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  [data-component="admin-members-table"] table,
  [data-component="admin-members-table"] tbody,
  [data-component="admin-members-table"] td {
    display: block;
    width: 100%;
  }
  [data-component="admin-members-table"] tr {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-md);
    margin: var(--ubm-space-2) var(--ubm-space-2) 0;
    padding: var(--ubm-space-2);
    background: var(--ubm-color-surface-panel);
  }
  [data-component="admin-members-table"] td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ubm-space-3);
    padding: var(--ubm-space-1) 0;
    border: 0;
  }
  [data-component="admin-members-table"] td[data-mobile-label]::before {
    content: attr(data-mobile-label);
    font-weight: 600;
    font-size: var(--ubm-text-xs);
    color: var(--ubm-color-text-muted);
    flex: 0 0 auto;
  }
}
```

> 上記は**雛型**。`--ubm-space-*` / `--ubm-text-xs` / `--ubm-radius-md` 等の実トークン名は実装時に `tokens.css` / `globals.css` で実在を確認して使用する（HEX/任意値直書き禁止）。`@layer` のネスト深さは既存 issue-276 ブロックと厳密に揃える。

---

## 4. 不変条件（I-1 〜 I-8）

- **I-1**: `/admin/members` API endpoint・D1 schema・Google Form schema・auth middleware は不変（プロジェクト不変条件 #5・UI不変条件 #1）。
- **I-2**: 機械可読id を破壊しない。`data-testid="admin-members-row-{memberId}"` / 各 `aria-label`（`{fullName} を選択` / `{fullName} を編集` / `全選択` / `ページネーション` / `前へ` / `次へ`）/ `data-testid="chip-dot"` / `data-testid="member-state-chip-row"` は逐語不変。
- **I-3**: テーブルの行・セルの **DOM 順序と個数を変えない**。追加するのは `data-component` / `data-testid` / `data-mobile-label` / `data-cell` 属性のみ。JSX のロジック・props・条件分岐は不変。
- **I-4**: 色・寸法は design token（`var(--ubm-*)`）経由。HEX 直書き・`bg-[#xxx]`・`text-[#xxx]`・任意値カラーは禁止（CI gate `verify-design-tokens` で fail）。
- **I-5**: breakpoint は CSS（`@media (max-width: 640px)`）を正本とする。JS / `matchMedia` でレイアウト分岐を作らない。
- **I-6**: デスクトップ（≥641px）のユーザー可視レイアウト・行/セル構造・機械可読id は現行維持。許容差分はモバイル用の追加 data 属性のみ。
- **I-7**: D1 直接アクセス禁止（`apps/web` から D1 binding 禁止）を継続。本タスクは `apps/web` 表現層のみ変更。
- **I-8**: 既存 unit test（`MembersTable.spec.tsx` TC-MT-01〜20）は1件も壊さない。追加分のみ。

---

## 5. 受入条件（AC-1 〜 AC-9）

- **AC-1**: 375px / 414px / 640px viewport で会員一覧が**カードレイアウト**（縦積み）で表示され、横スクロールによる列の見切れが発生しない。
- **AC-2**: モバイルカードに「メール / 区画・ステータス / タグ / 最終更新 / 公開」の各項目がラベル付きで全て可視（`data-label` の `::before` 表示）。
- **AC-3**: モバイルで「公開」トグル（`MemberPublishSwitch`）と「編集」ボタンが画面内に収まり操作可能。
- **AC-4**: デスクトップ（≥641px、例 1280px）は現行テーブル表示・行/セル構造・機械可読id が維持され、追加 data 属性以外の挙動差分がない（I-6）。
- **AC-5**: `MembersTable.tsx` の変更は属性追加のみ。`git diff` 上、機械可読id（I-2）・行/セル順序（I-3）に変更がない。
- **AC-6**: `globals.css` の追加は design token 経由のみ。HEX / 任意値カラーの新規混入ゼロ（`verify-design-tokens` 緑）。
- **AC-7**: 既存 `MembersTable.spec.tsx` TC-MT-01〜20 が全て緑、追加 TC-MT-21〜24 が緑（`data-component` / `data-label` 属性の存在・カード化マークアップ検証）。
- **AC-8**: `apps/api` / D1 migration / Google Form 関連ファイルへの差分ゼロ（`git diff dev...HEAD -- apps/api packages/*/migrations` が空）。
- **AC-9**: `pnpm typecheck` / `pnpm lint` / 対象 vitest が緑。

---

## 6. テスト方針（Phase 4 / 6）

### 追加 unit test（`MembersTable.spec.tsx`）

| TC | 観点 | 期待 |
| -- | ---- | ---- |
| TC-MT-21 | ラッパーに `data-component="admin-members-table"` が存在 | `container.querySelector('[data-component="admin-members-table"]')` が truthy |
| TC-MT-22 | 単一 table / 行 / セル数 / row testid 不変 | 1 table、2 rows、8 cells、既存 row testid 解決 |
| TC-MT-23 | 公開セル click の伝播停止 | `onOpenRow` が呼ばれない |
| TC-MT-24 | モバイル属性追加後も axe violations 0 | a11y 維持 |

- 既存 axe テスト（TC-MT-18〜20）は jsdom で `@media` 非適用のため緑を維持。再掲して回帰ガードとする。

### Playwright（`admin-members-mobile.spec.ts`、F4）

| 観点 | 期待 |
| ---- | ---- |
| 375px でカード表示 | 各行が縦積み・`scrollWidth <= clientWidth + 許容誤差`（横はみ出しゼロ） |
| 375px で公開トグル可視 | publish switch が viewport 内 |
| 1280px でテーブル維持 | `<thead>` が可視・カードCSS非適用 |

---

## 7. 検証コマンド（ローカル）

```bash
# 型・lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 対象 unit test（targeted）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx

# design token gate（HEX/任意値カラー混入チェック）
mise exec -- pnpm verify:design-tokens   # または該当 script。tokens.css 正本に対する HEX 直書き検査

# API 非接触確認（AC-8）
git diff dev...HEAD --name-only -- apps/api 'packages/**/migrations/**'  # 空であること

# Playwright mobile（環境が許せば）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-mobile
```

> 実行は `mise exec --` 経由（Node 24 保証）。filter 名は `apps/web/package.json` の `name` を実装時に確認（`@ubm-hyogo/web` 想定。異なれば実値に合わせる）。

---

## 8. DoD（Definition of Done）

- [ ] F1〜F3 の変更が landed し、F4（環境が許せば）も追加。
- [ ] AC-1〜AC-9 を全て満たす。
- [ ] `pnpm typecheck` / `pnpm lint` / targeted vitest が緑。
- [ ] `verify-design-tokens` 相当が緑（HEX/任意値カラー混入ゼロ）。
- [ ] 375 / 640 / 1280px の手動確認（またはPlaywright）でカード/テーブル切替が意図通り。
- [ ] `apps/api` / migration / Form への差分ゼロ。

---

## 9. ディレクトリ命名・メタ

- workflow dir: `docs/30-workflows/completed-tasks/admin-members-mobile-responsive-layout/`
- branch: `feat/admin-members-mobile-responsive-layout`
- task_id: `admin-members-mobile-responsive-layout`
- created_at: `2026-06-10`
- 機械可読 id 命名規約: kebab-case（`data-component` / `data-role` / `data-label` / `data-cell`）。既存 `member-filters` / `member-state-chip-row` と整合。

---

## 10. CONST_007 スコープ宣言

本タスクは F1〜F4 を**今回の実装サイクル1回で完了**できる単一責務スコープ。先送り・別PR分割はしない。
他 admin 一覧テーブル（tags/meetings/requests/audit）への横展開は、独立した別画面・別コンポーネントであり今回スコープ外。Phase 12 `unassigned-task-detection.md` に OOS-1 として理由付きで記録する（「分量」ではなく「別画面・別責務」が分離理由）。

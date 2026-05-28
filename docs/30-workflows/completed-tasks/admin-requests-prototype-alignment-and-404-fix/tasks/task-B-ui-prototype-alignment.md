# Task B — `/admin/requests` UI プロトタイプ整合 + Playwright visual baseline

> CONST_004: 実装仕様書 / CONST_005 必須項目を全て満たす。

| 項目 | 値 |
|------|-----|
| Lane | Lane-B1 / Lane-B2 / Lane-B3 |
| 区分 | UI（apps/web） |
| visual_mode | VISUAL |
| 想定差分行数 | ~200 行 |

---

## 1. Lane-B1 — `page.tsx` + `RequestQueuePanel.tsx`

### 1.1 変更対象

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/app/(admin)/admin/requests/page.tsx` | 修正 | wrapper を `<div className="page-enter stack-lg">` + `<header className="page-head">` で包む |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 修正 | `card / card-pad-lg / h-section / btn-row` 適用、h1 → h2 降格、`admin-requests-grid` は温存（既存 CSS） |

### 1.2 関数シグネチャ（変更なし）

```ts
// page.tsx
export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; cursor?: string }>;
}): Promise<JSX.Element>;

// RequestQueuePanel.tsx
export function RequestQueuePanel(props: {
  initial: RequestQueueListView;
  type: RequestNoteType;
}): JSX.Element;
```

### 1.3 入出力（DOM 契約）

**page.tsx 出力 DOM**:
```html
<div class="page-enter stack-lg">
  <nav aria-label="breadcrumb">...</nav>
  <header class="page-head">
    <p class="eyebrow">ADMIN / REQUESTS</p>
    <h1>依頼キュー</h1>
    <p class="lede">公開状態の変更依頼・退会依頼を確認・承認します。</p>
  </header>
  <section class="stack-lg" aria-labelledby="admin-requests-h">...</section>
</div>
```

**RequestQueuePanel.tsx 出力 DOM 主要点**:
```html
<section class="stack-lg" aria-labelledby="admin-requests-h">
  <div class="card card-pad">
    <h2 class="h-section visually-hidden" id="admin-requests-h">依頼種別</h2>
    <div class="btn-row" role="group" aria-label="依頼種別">
      <button type="button" aria-pressed="true|false">公開停止/再公開</button>
      <button type="button" aria-pressed="true|false">退会</button>
    </div>
  </div>
  <div class="admin-requests-grid">
    <div class="card card-pad-lg">
      <h3 class="h-card">依頼一覧</h3>
      <ul aria-label="依頼一覧">...</ul>
    </div>
    <!-- RequestQueueDetail がもう一方を担う -->
  </div>
  <!-- Pagination + Toast + RequestConfirmDialog -->
</section>
```

### 1.4 実装ガイダンス（diff のコア）

`page.tsx`:
```tsx
return (
  <div className="page-enter stack-lg">
    <Breadcrumb items={[{ label: "依頼キュー" }]} />
    <header className="page-head">
      <p className="eyebrow">ADMIN / REQUESTS</p>
      <h1>依頼キュー</h1>
      <p className="lede">公開状態の変更依頼・退会依頼を確認・承認します。</p>
    </header>
    <RequestQueuePanel initial={data} type={type} />
  </div>
);
```

`RequestQueuePanel.tsx`:
- 既存 `<h1 id="admin-requests-h">依頼キュー</h1>` を `<h2 className="h-section visually-hidden" id="admin-requests-h">依頼種別</h2>` に書き換え（aria 紐付けは温存）。
- `<div role="group" aria-label="依頼種別">` 直下のボタン列を `<div className="card card-pad">` でラップし、その内側に `<div className="btn-row">` を入れる。
- list 領域 `<ul aria-label="依頼一覧">` を `<div className="card card-pad-lg"><h3 className="h-card">依頼一覧</h3><ul>...</ul></div>` でラップ。

---

## 2. Lane-B2 — `RequestQueueDetail.tsx` + `RequestConfirmDialog.tsx`

### 2.1 変更対象

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | 修正 | 外側を `<aside className="card card-pad-lg">`、見出し `h-card`、actions `btn-row`、空状態 `card-flat` |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 修正 | dialog 内ボタン列を `btn-row` 化、destructive message を `lede` 風 token に揃える |

### 2.2 関数シグネチャ（変更なし）

既存 props を温存。新 prop 追加禁止（不変条件 #3 — primitive 適用のみ）。

### 2.3 出力 DOM 契約

**RequestQueueDetail.tsx 主要点**:
```html
<aside class="card card-pad-lg" aria-label="依頼詳細">
  <h3 class="h-card">依頼詳細</h3>
  <!-- detail fields -->
  <div class="btn-row">
    <button type="button">承認</button>
    <button type="button">却下</button>
  </div>
</aside>
<!-- 空状態 -->
<aside class="card-flat" aria-label="依頼詳細">
  <EmptyState title="依頼を選択してください" />
</aside>
```

---

## 3. Lane-B3 — Playwright admin-staging-visual

### 3.1 変更対象

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/playwright/tests/visual/admin-staging.spec.ts` | 追記 | TC-B-01〜03 を test として追加 |

### 3.2 test 関数シグネチャ

既存 `test(...)` パターンに従う。新規 helper / config 変更なし（不変条件 #3）。

### 3.3 baseline 取得手順

```bash
# Step 1: local で structure + selector test を green に
EVIDENCE_DIR=.tmp/evidence/admin-requests \
  mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual tests/visual/admin-staging.spec.ts

# Step 2: CI で baseline 採取（PR とは別の baseline-capture flow / user 明示承認後）
mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual tests/visual/admin-staging.spec.ts \
  --update-snapshots

# Step 3: bot push の retrigger 用 empty commit（feedback_visual_baseline_github_token_retrigger）
git commit --allow-empty -m "chore: retrigger visual checks after baseline update"
```

baseline 正本: `*-linux.png`（macOS 取得は EVIDENCE_DIR に退避）。

### 3.4 snapshot ファイル名（セマンティック canonical — FB-LLM-MOD-05-001）

| ファイル名 | 状態 |
|-----------|------|
| `admin-requests-visibility-empty-linux.png` | type=visibility_request, items=0 |
| `admin-requests-delete-empty-linux.png` | type=delete_request, items=0 |

---

## 4. ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web build
mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual tests/visual/admin-staging.spec.ts
```

---

## 5. DoD

- [ ] page.tsx に `page-enter stack-lg` / `page-head` が適用済み。
- [ ] RequestQueuePanel / RequestQueueDetail / RequestConfirmDialog が指定 primitive のみで構成。
- [ ] `h1` 二重化なし（page.tsx のみ h1 担当）。
- [ ] TC-B-01〜03 green。
- [ ] baseline `-linux.png` 2 枚を local CI shadow で確認、本番 baseline は user 承認後採取。
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm --filter web build` green。
- [ ] 新 token / 新 primitive 追加なし（grep 確認）。
- [ ] CONST_002: commit / push / PR は user 明示承認後。

---

## 6. 想定リスクと縮約

| リスク | 縮約 |
|--------|------|
| `visually-hidden` token がプロジェクトに無い | 既存 `tokens.css` を grep で確認、無ければ `RequestQueuePanel` 内 h2 をそのまま表示する（プロトタイプにも h2 のものあり） |
| `admin-requests-grid` の CSS 変数が他箇所と不整合 | 既存定義を温存し変更しない |
| Playwright snapshot diff > 0.02 | `maxDiffPixelRatio` ではなく `maxDiffPixels` で吸収を検討、ただし baseline 採取で 0 から始める |
| h1→h2 降格で a11y test が回帰 | jest-axe / `aria-labelledby` の id 維持で耐性確保 |

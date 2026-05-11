# Phase 11: 手動テスト (3 層評価)

[実装区分: 実装仕様書]

## タスク種別

- **VISUAL_ON_EXECUTION** (UI task) — 実装実行時に screenshot 必須
- `screenshot-plan.json` の `mode` は **`VISUAL_ON_EXECUTION`** をデフォルトにする (FB-W1-02b-1)

## 3 層評価

### 1. Semantic (a11y / role / aria)

| 観点 | 確認方法 |
|------|--------|
| heading 階層 (h1>h2>h3) | DevTools accessibility tree |
| role / aria-label | `SchemaDiffPanel` status/alert / `IdentityConflictRow` actions / `AuditLogPanel` form+table |
| focus trap | 現行実装は inline form / inline confirmation のため対象外 |
| keyboard 操作 | `IdentityConflictRow` actions / `AuditLogPanel` filter を Tab で移動できるか |
| jest-axe | critical violations 0 |

### 2. Visual (Apple HIG / OKLch tokens)

| screenshot 名 (canonical) | 状態 |
|------------------------|------|
| `admin-schema-default.png` | `/admin/schema` 初期表示 (diff list あり) |
| `admin-schema-empty.png` | diff=[] empty state |
| `admin-schema-apply-modal.png` | inline stableKey assignment form 表示 |
| `admin-schema-assign-error.png` | stableKey 形式 error 表示 |
| `admin-identity-conflicts-default.png` | list + compare + resolve bar |
| `admin-identity-conflicts-empty.png` | items=[] empty |
| `admin-identity-conflicts-merge-modal.png` | inline merge final confirmation |
| `admin-audit-default.png` | filter+table+pager |
| `admin-audit-filtered.png` | `?actorEmail=...` 適用後 |
| `admin-audit-empty.png` | filter で 0 件 |

> ファイル名は **phase spec / capture script / `phase11-capture-metadata.json` / Phase 12 implementation-guide の 4 か所で一致** させる (FB-LLM-MOD-05-001)。

### 3. AI UX (会話的 UX feedback)

| 観点 | 期待 |
|------|------|
| 確認 UI の文言 | inline confirmation の重大度が Phase 3 §3.2 reason 必須に整合 |
| エラー表示 | 「保存中…」「適用中…」など pending 文言が ja で適切 |
| 不在 endpoint | tooltip "API 未提供" がユーザー視点で理解可能 |

## 操作手順

```bash
# dev server 起動
mise exec -- pnpm -F @ubm-hyogo/web dev

PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit \
  pnpm -F @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-schema-conflicts-audit.spec.ts \
  --project=desktop-chromium
```

## screenshot capture

`phase11-capture-metadata.json` には `taskId: "task-17-admin-schema-conflicts-audit"` を入れ、各 screenshot に `tc` field (TC-01..TC-10) を付与。

> screenshot capture 後 `try { ... } finally { browser.close(); server.close(); }` でポート解放を確実に (FB-MSO-003)。

## NON_VISUAL 分岐

本タスクは VISUAL のため NON_VISUAL 分岐は適用されない。万一 dev server 起動が環境ブロッカーで不可の場合のみ:

- `manual-test-result.md` に `BLOCKER 種別: 環境` と明記し source-level PASS を別カテゴリで記録 (WEEKGRD-01)
- `screenshots/.gitkeep` を残さず、再実行可能日時を明記

## 成果物

- `outputs/phase-11/screenshots/admin-schema-*.png` (4)
- `outputs/phase-11/screenshots/admin-identity-conflicts-*.png` (3)
- `outputs/phase-11/screenshots/admin-audit-*.png` (3)
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/screenshot-plan.json` (`mode: "VISUAL_ON_EXECUTION"`)
- `outputs/phase-11/manual-test-result.md` — 3 層評価結果
- `outputs/phase-11/ui-sanity-visual-review.md` — Apple HIG / OKLch 視覚 review

## DoD

- [ ] 10 screenshot がすべて取得され metadata と name parity が一致
- [ ] manual-test-result.md に Semantic / Visual / AI UX 3 層が記録
- [ ] HIGH 重大度の問題があれば `unassigned-task/` に自動生成タスクとして起票候補

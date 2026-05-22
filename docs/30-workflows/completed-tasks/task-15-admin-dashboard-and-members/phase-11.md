# Phase 11: 手動テスト（VISUAL）

[実装区分: 実装仕様書]

> 目的: 3 層評価（Semantic / Visual / AI UX）を実行し、screenshot を **canonical 命名** で取得する。FB-VISUAL-CAP-001 / FB-LLM-MOD-05-001 に従い、ファイル名を 4 か所で一致させる。
> taskType: `implementation`
> visualEvidence: `VISUAL`（admin 2 画面の UI 構築）
> screenshot mode: `VISUAL`（FB-W1-02b-1）

---

## 1. screenshot canonical 命名（4 か所一致）

| # | screenshot | canonical filename | 取得ルート |
|---|-----------|------------------|-----------|
| S-01 | admin dashboard 通常状態（KPI 4 / chart / RecentActions） | `admin-dashboard-default.png` | `/admin` |
| S-02 | admin dashboard schema alert 表示 | `admin-dashboard-schema-alert.png` | `/admin`（unresolvedSchema=5 fixture） |
| S-03 | admin dashboard zone 分布 placeholder（byZone 未提供時） | `admin-dashboard-zone-placeholder.png` | `/admin`（byZone=undefined fixture） |
| S-04 | admin members テーブル初期 | `admin-members-default.png` | `/admin/members` |
| S-05 | admin members フィルタ適用後 | `admin-members-filter-published.png` | `/admin/members?filter=published` |
| S-06 | admin members row 選択 + BulkActionBar | `admin-members-bulk-selected.png` | row 1-3 をチェック |
| S-07 | admin members drawer 開いた状態 | `admin-members-drawer-open.png` | row 氏名クリック |
| S-08 | admin members empty | `admin-members-empty.png` | `/admin/members?q=zzzzz` |
| S-09 | admin layout sidebar nav active 状態 | `admin-layout-sidebar-active.png` | layout 全体 |

これらの canonical 名を **以下 4 か所で完全一致** させる:
1. 実画像ファイル名（`outputs/phase-11/<filename>`）
2. `outputs/phase-11/phase11-capture-metadata.json`
3. `outputs/phase-11/manual-test-result.md`
4. `outputs/phase-12/implementation-guide.md`

---

## 2. capture metadata（`phase11-capture-metadata.json`）

```json
{
  "taskId": "task-15-admin-dashboard-and-members",
  "mode": "VISUAL",
  "captureDate": "2026-05-10",
  "screenshots": [
    { "id": "S-01", "tc": "TC-VIS-01", "file": "admin-dashboard-default.png", "route": "/admin", "viewport": "1440x900" },
    { "id": "S-02", "tc": "TC-VIS-02", "file": "admin-dashboard-schema-alert.png", "route": "/admin", "viewport": "1440x900" },
    { "id": "S-03", "tc": "TC-VIS-03", "file": "admin-dashboard-zone-placeholder.png", "route": "/admin", "viewport": "1440x900" },
    { "id": "S-04", "tc": "TC-VIS-04", "file": "admin-members-default.png", "route": "/admin/members", "viewport": "1440x900" },
    { "id": "S-05", "tc": "TC-VIS-05", "file": "admin-members-filter-published.png", "route": "/admin/members?filter=published", "viewport": "1440x900" },
    { "id": "S-06", "tc": "TC-VIS-06", "file": "admin-members-bulk-selected.png", "route": "/admin/members", "viewport": "1440x900" },
    { "id": "S-07", "tc": "TC-VIS-07", "file": "admin-members-drawer-open.png", "route": "/admin/members", "viewport": "1440x900" },
    { "id": "S-08", "tc": "TC-VIS-08", "file": "admin-members-empty.png", "route": "/admin/members?q=zzzzz", "viewport": "1440x900" },
    { "id": "S-09", "tc": "TC-VIS-09", "file": "admin-layout-sidebar-active.png", "route": "/admin", "viewport": "1440x900" }
  ]
}
```

---

## 3. 取得手順（FB-MSO-003: ポート解放）

```bash
# dev server 起動（テストデータの seed が必要なら別途）
mise exec -- pnpm -F @ubm-hyogo/web dev &
DEV_PID=$!
trap "kill $DEV_PID 2>/dev/null" EXIT

# Playwright で screenshot を取得
mise exec -- pnpm -F @ubm-hyogo/web exec playwright test \
  apps/web/tests/screenshots/admin.spec.ts --update-snapshots
```

`admin.spec.ts` の各 test ブロックは `try { ... } finally { await browser.close(); }` パターンで書く（FB-MSO-003）。

ファイル配置:
```
docs/30-workflows/task-15-admin-dashboard-and-members/outputs/phase-11/
  ├── admin-dashboard-default.png
  ├── admin-dashboard-schema-alert.png
  ├── ...（計 9 枚）
  ├── phase11-capture-metadata.json
  ├── manual-test-result.md
  └── ui-sanity-visual-review.md
```

---

## 4. 3 層評価

### 4.1 Semantic（意味的検証）

| 観点 | 確認内容 |
|------|---------|
| 役割の明示 | `<table caption>`, `role="dialog"`, `role="region"`, `role="img"` |
| ラベル | `aria-label`, `<th scope="col">` |
| 階層 | `<h1>` 1 つ / `<h2>` 適切配置 |

### 4.2 Visual（視覚検証 / Apple HIG 準拠）

| 観点 | 確認内容 |
|------|---------|
| OKLch token 使用 | HEX 直書き 0 件 |
| 階調 | text strong / 2 / 3 の対比比 ≥ AA |
| 余白 | プロトタイプの spacing 踏襲 |
| z-index | banner < bulkbar < drawer < modal |
| chart の summary | `aria-label` で数値要約 |

### 4.3 AI UX（操作性検証）

| シナリオ | 期待 |
|---------|------|
| dashboard を開く → 重要 KPI が一目で読める | KPI 4 枚が視線の流れの最初 |
| members で公開中だけ絞る | filter select 1 操作で完結 |
| 3 件まとめて非公開 | チェック → BulkActionBar → "非公開" 1 クリック |
| 1 名の詳細を確認 | row click → drawer slide-in、ESC で閉じる |
| schema alert が出る | dashboard 上部に視認性高く表示 |

---

## 5. manual-test-result.md（テンプレート）

```markdown
# Phase 11 手動テスト結果

## メタ情報
- task: task-15-admin-dashboard-and-members
- 実施日: 2026-05-10
- 実施者: <name>
- 環境: macOS / Chrome <version>, viewport 1440x900
- 証跡の主ソース: 上記 9 screenshot + 下記操作ログ
- taskType: implementation
- visualEvidence: VISUAL（NON_VISUAL ではない理由: admin 2 画面の UI 新規構築のため）

## TC-VIS-01〜09: screenshot 取得結果
| TC | screenshot | route | 結果 |
|----|-----------|-------|------|
| TC-VIS-01 | admin-dashboard-default.png | /admin | PASS |
| ...（9 件） |

## 3 層評価結果
- Semantic: PASS / FAIL（詳細）
- Visual: PASS / FAIL
- AI UX: PASS / FAIL

## 既知の制限
- byZone / byStatus は API 未提供のため placeholder 表示（仕様通り）
- CSV エクスポート button は disabled（MVP 範囲外）

## HIGH 問題（あれば自動的に unassigned-task 起票）
- なし
```

---

## 6. 完了条件（DoD）

- [ ] §1 9 screenshot を canonical 命名で取得
- [ ] §2 `phase11-capture-metadata.json` 生成、taskId が現行と一致（`jq '.taskId'` 確認）
- [ ] §3 取得手順に従いポート解放確認
- [ ] §4 3 層評価すべて PASS
- [ ] §5 `manual-test-result.md` 完成
- [ ] HIGH 問題があれば `unassigned-task/` へ自動起票

## 成果物

- `outputs/phase-11/admin-*.png`（9 枚）
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/ui-sanity-visual-review.md`
- 実行後に `artifacts.json` の `phase11.status` を `completed` へ更新（仕様書作成時点は `spec_created`）

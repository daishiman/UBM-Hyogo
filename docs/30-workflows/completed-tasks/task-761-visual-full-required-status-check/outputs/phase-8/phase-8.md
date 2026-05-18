[実装区分: 実装仕様書]

# Phase 8 — リファクタリング

| 項目 | 値 |
|------|------|
| phase | 8 |
| 名称 | リファクタリング |
| status | completed |
| 完了条件 | 命名統一の確認（NON_VISUAL のため最小） |

## 1. 対象

本タスクはコード変更を伴わないため、リファクタリング対象は **仕様書内の命名統一のみ**。

## 2. 命名統一チェック

| 項目 | 統一値 |
|------|--------|
| workflow 名 | `playwright-visual-full` |
| viewport 表記 | `desktop` / `tablet` / `mobile`（小文字） |
| browser | `chromium`（小文字） |
| branch | `dev` / `main`（小文字） |
| context 名 | `visual-full (desktop)` / `visual-full (tablet)` / `visual-full (mobile)` |

## 3. 確認手順

```bash
cd docs/30-workflows/task-761-visual-full-required-status-check
grep -rn "visual-full" outputs/ | grep -v "evidence/" | sort -u
grep -rn "viewport" outputs/ | sort -u
```

→ 実測値確定後、表記揺れがあれば全 phase で `sed` 不可避（手動置換）。

## 4. コード変更

なし。

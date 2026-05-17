[実装区分: 実装仕様書]

# Phase 8: リファクタリング

## 目的

本タスクで触れる範囲のコード/設定が「重複・無駄・命名乖離」を持っていないか確認する。

## 1. リファクタ候補とその判定

| 候補 | 判定 | 理由 |
|------|------|------|
| `VISUAL_ROUTES` を `full-smoke.spec.ts` と統合 | **見送り** | `full-smoke.spec.ts` は a11y + status 観点、`full-visual.spec.ts` は VISUAL 観点で関心が異なる。task-18-fu Phase 8 で同様の判定済み |
| viewport 定数の集約 | 既に `apps/web/playwright/fixtures/viewports.ts` で集約済み | 追加リファクタ不要 |
| MVP-PAUSE コメント削除 | Phase 5 Step 1 で実施 | YAML が clean になる |
| Future Candidates 表の整理 | Phase 5 Step 6 で実施 | matrix と整合 |
| `playwright-visual-full.yml` の baseline 存在チェック step 削除 | **見送り** | safety net として残す。削除すると baseline 紛失時に PR が即 fail する |

## 2. リファクタ実施なし

新規追加コードがないため、本 Phase は判定記録のみで no-op。

## 3. 検証

```bash
git diff --stat origin/dev...HEAD -- apps/web/playwright/ .github/workflows/
# 期待: workflow 1 件編集、PNG 51 件新規のみ
```

## 4. 成果物

- 本ファイル `phase-8-refactor.md`

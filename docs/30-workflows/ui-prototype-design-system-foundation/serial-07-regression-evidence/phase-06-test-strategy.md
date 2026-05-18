---
phase: 6
title: テスト方針 — Playwright spec 自体がテスト・flake 防止
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. 本 SW におけるテストの位置づけ

本サブワークフローの **「実装」は Playwright spec ファイル自体**。spec が prod コードの regression を検出する役割を担うため、追加の unit / integration test を新規作成しない。

| 種別 | 本 SW での扱い |
|------|--------------|
| Unit test | 追加なし（既存維持） |
| Integration test | 追加なし |
| E2E (non-visual) | 追加なし（既存 `full-smoke.spec.ts` 等は serial-06 までで実装済） |
| Visual regression | **本 SW の中核**。4 spec を新規 |
| A11y / Lighthouse | 範囲外（既存 a11y.spec.ts / Lighthouse CI 経路で別途運用） |

## 2. flake 防止戦略

### 2.1 必須対策（4 spec すべてに適用）

| # | 対策 | 実装 |
|---|------|------|
| 1 | animation / transition / caret 表示の停止 | `page.addStyleTag` で `animation: none / transition: none / caret-color: transparent`（既存 spec パターン） |
| 2 | DOM ready の明示 wait | `page.locator(<selector>).waitFor({ state: 'visible' })` |
| 3 | mock API による外部依存排除 | `mockApi` fixture を必ず `void mockApi` で初期化 |
| 4 | font rendering 統一 | CI runner を `ubuntu-latest` に固定、baseline は `-chromium-linux.png` を正本 |
| 5 | timezone / locale 固定 | `Asia/Tokyo` / `ja-JP`（既存 config 継承） |

### 2.2 maxDiffPixelRatio

`0.02`（2%）で固定。既存 `public-top.spec.ts` / `admin-dashboard.spec.ts` と揃える。

### 2.3 fullPage: true

4 spec すべて `fullPage: true`。スクロール領域を含めた page-level rhythm を担保するため。

## 3. test 実行モード

### 3.1 ローカル（macOS）

```bash
# 既存 baseline で diff fail 検出
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual

# baseline 更新（macOS 上では原則実行しない — CI 上で生成する）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual --update-snapshots
```

### 3.2 CI（ubuntu-latest）

既存 `playwright-smoke.yml` / `playwright-visual-full.yml` で実行される。spec が visual グループに属していれば自動カバーされる。

## 4. 期待される test 結果

| 段階 | 期待挙動 |
|------|---------|
| 初回 PR push（baseline 不在） | CI で baseline 生成 fail → `-chromium-linux.png` を artifact から取得してコミット |
| 2 回目 push（baseline コミット済） | 全 spec pass / snapshot diff 0% |
| serial-00..06 のいずれかに regression | spec が diff fail を出す → 修正前は本 SW gate 突破不可 |
| 意図したデザイン更新 | serial-00..06 の該当 SW で `--update-snapshots` 実施し、本 SW 着手前に baseline 安定化 |

## 5. test を増やさない判断

| 検討案 | 不採用理由 |
|--------|----------|
| profile / login / register / privacy / terms の visual 追加 | 「最小 4 screens」スコープ外。必要時は別 SW で拡張 |
| viewport × 3（desktop/tablet/mobile）展開 | `playwright-visual-full.yml` の `visual-full/` で既存 |
| 各 admin sub-route の visual 追加 | admin-dashboard で代表させる |
| component-level visual regression（Storybook 等） | 既存基盤に Storybook がない。スコープ外 |

## 6. test 失敗時の対応フロー

1. CI で diff fail
2. PR コメントから diff artifact を取得
3. 期待した変更か / 退行か を判別
4. **退行**: serial-00..06 の該当 PR にバックポート修正 → 本 SW を再実行
5. **期待した変更**: 該当 SW で `--update-snapshots` → 新 baseline をコミット → 本 SW でも green になる

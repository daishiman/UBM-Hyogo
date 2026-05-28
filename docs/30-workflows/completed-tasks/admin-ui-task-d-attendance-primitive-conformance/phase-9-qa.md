---
実装区分: 実装仕様書
Phase: 9
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-8-refactor.md](./phase-8-refactor.md)
次: [phase-10-final-review.md](./phase-10-final-review.md)
---

# Phase 9: QA

## 9.1 自動 QA コマンド一式

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- attendance-page
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

すべて green になること。

## 9.2 手動 QA（dev server）

`mise exec -- pnpm --filter @ubm-hyogo/web dev` で `/admin/dashboard/attendance` を開き、以下 3 状態を確認:

| 状態 | 確認内容 |
|------|---------|
| 全 endpoint ok | KpiCard 3 枚 / by-session table / ranking table が描画。再取得 CTA が click 可能 |
| overview err（API を一時停止して再現可） | overview region のみ AdminSectionErrorClient、他は描画継続 |
| by-session 空（fixture を空配列にする dev branch を一時作成して再現可） | AdminEmptyState（"セッション別出席データがありません"）表示 |

## 9.3 ブラウザ a11y チェック

- Chrome DevTools Lighthouse → Accessibility ≥ 90
- 主要 landmark: `region`（attendance summary）× 1、`heading level=1` × 1

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 9 |
| 対象 | QA |

## 目的

自動 QA と手動 QA の実行手順を固定する。

## 実行タスク

- typecheck / lint / focused test / token gate を実行する。
- dev server で 3 状態を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 11 | `phase-11-manual-test.md` | visual evidence |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| QA log | `outputs/phase-9/qa.md` | 実装時に記録 |

## 完了条件

- [ ] QA コマンドが green である。

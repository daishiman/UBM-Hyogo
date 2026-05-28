---
実装区分: 実装仕様書
Phase: 11
状態: evidence_captured
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-10-final-review.md](./phase-10-final-review.md)
次: [phase-12-documentation.md](./phase-12-documentation.md)
---

# Phase 11: 手動テスト証跡

## 11.1 取得対象

ローカル `mise exec -- pnpm --filter @ubm-hyogo/web dev` で `/admin/dashboard/attendance` を開き、以下 3 ショットを `outputs/phase-11/` 配下に保存:

| ファイル名 | 内容 |
|-----------|------|
| `attendance-all-ok.png` | KpiCard 3 枚 + by-session AdminTable + ranking AdminTable |
| `attendance-overview-error.png` | overview のみ AdminSectionErrorClient |
| `attendance-by-session-empty.png` | AdminEmptyState（"セッション別出席データがありません"）|

## テストケース

| TC-ID | 観点 | 期待 |
|-------|------|------|
| TC-01 | all OK | AdminPageHeader、KpiCard 3 枚、by-session AdminTable、ranking AdminTable が表示される |
| TC-02 | overview fail-soft | overview のみ AdminSectionErrorClient になり、by-session / ranking は継続表示される |
| TC-03 | by-session empty | by-session は AdminEmptyState になり、ranking は継続表示される |

## 画面カバレッジマトリクス

| TC-ID | 画面状態 | スクリーンショット |
|-------|----------|------------------|
| TC-01 | all OK | `screenshots/attendance-all-ok.png` |
| TC-02 | overview fail-soft | `screenshots/attendance-overview-error.png` |
| TC-03 | by-session empty | `screenshots/attendance-by-session-empty.png` |

## 11.2 evidence ファイル

`outputs/phase-11/manual-test-result.md` に以下を記載:

- 撮影日時 / dev server バージョン
- 各ショットへの相対 path
- 確認した primitive 採用状況（AdminPageHeader / KpiCard / AdminTable）
- localhost URL（`http://localhost:3000/admin/dashboard/attendance`）

## 11.4 evidence inventory

| Path | Status | 用途 |
|------|--------|------|
| `outputs/phase-11/screenshot-plan.json` | present | 3 screenshot の撮影計画 |
| `outputs/phase-11/phase11-capture-metadata.json` | present | `status=implemented_local_evidence_captured` / runtime captured |
| `outputs/phase-11/manual-test-result.md` | present | 実測結果へ更新済み |
| `outputs/phase-11/ui-sanity-visual-review.md` | present | VISUAL_ON_EXECUTION の確認観点 PASS |
| `outputs/phase-11/screenshots/*.png` | present | 3 状態を取得済み。Task E の staging baseline とは別 |

## 11.3 staging visual baseline

**本タスクでは取得しない**。staging visual baseline 撮影は親 workflow の Task E 側で実施する。本タスクの Phase 11 は localhost evidence のみ。

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 11 |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

localhost visual evidence の取得計画と inventory を固定する。

## 実行タスク

- screenshot plan / capture metadata / manual result を更新する。
- 3 状態の PNG を取得する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | 撮影計画 |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| manual result | `outputs/phase-11/manual-test-result.md` | 手動確認 |

## 完了条件

- [ ] Phase 11 evidence inventory が present / pending / n/a で整理されている。

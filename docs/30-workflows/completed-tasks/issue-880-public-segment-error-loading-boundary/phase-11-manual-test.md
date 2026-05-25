---
phase: 11
title: 手動テスト / Evidence Inventory
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 11 — 手動テスト / Evidence Inventory

[実装区分: 実装仕様書]

## VISUAL カテゴリ判定

`VISUAL_ON_EXECUTION` — Playwright force-throw により boundary が描画されるため、screenshot を必須 evidence とする。

## 1. 必須成果物

| ID | ファイル | 種別 |
|----|---------|------|
| E-01 | `outputs/phase-11/manual-test-checklist.md` | 手動テスト計画 |
| E-02 | `outputs/phase-11/manual-test-result.md` | TC-01 / TC-02 実測結果 |
| E-03 | `outputs/phase-11/screenshots/public-error-boundary.png` | TC-01 screenshot |
| E-04 | `outputs/phase-11/screenshots/public-loading.png` (任意) | loading skeleton |
| E-05 | `outputs/phase-11/discovered-issues.md` | 発見事項 |
| E-06 | `outputs/phase-11/grep-evidence.md` | `apps/web/app/(public)/error.tsx` 存在 grep + serial-06 precondition grep |
| E-07 | `outputs/phase-11/screenshot-plan.json` | screenshot 取得計画 |

## 2. 手動テストチェックリスト（E-01 雛形）

```markdown
# manual-test-checklist

## TC-01 `(public)/error.tsx` force-throw 発火
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web dev` 起動
- [ ] ブラウザで `http://localhost:3000/error-boundary-smoke` を開く
- [ ] エラー画面が表示される
- [ ] AppShell（warm theme / `data-route-group="public"`）配下で描画
- [ ] 「会員一覧へ戻る」「トップへ戻る」「再試行する」が動作
- [ ] reset() ボタンで再発火することを確認

## TC-02 `(public)/loading.tsx` 描画
- [ ] dev tools Network throttling で `/members` 遷移を遅延させる
- [ ] loading skeleton が `(public)` AppShell 配下で描画

## TC-03 production ガード
- [ ] `NODE_ENV=production mise exec -- pnpm --filter @ubm-hyogo/web build`
- [ ] grep `error-boundary-smoke` で worker bundle に router 登録があれば、`notFound()` 経路のみ通ることを確認
```

## 3. screenshot 計画（E-07 雛形）

```json
{
  "screenshots": [
    {
      "id": "S-01",
      "path": "outputs/phase-11/screenshots/public-error-boundary.png",
      "url": "/error-boundary-smoke",
      "viewport": { "width": 1280, "height": 800 },
      "fullPage": true,
      "tc_id": "TC-01"
    },
    {
      "id": "S-02",
      "path": "outputs/phase-11/screenshots/public-loading.png",
      "url": "/members",
      "viewport": { "width": 1280, "height": 800 },
      "fullPage": true,
      "tc_id": "TC-03",
      "optional": true
    }
  ]
}
```

## 4. Evidence sync ルール

- placeholder-only screenshot（黒画像・空画像）は PASS 扱いにしない
- screenshot は `outputs/phase-11/screenshots/` 配下に格納（path traversal 不可）
- `manual-test-result.md` に `TC-ID ↔ PNG path` の表を必ず記載

## 5. discovered-issues 雛形（E-05）

```markdown
# discovered-issues

## 親 `apps/web/app/error.tsx` の二重 useAutoFocusOnMount 呼び出し
- 場所: L13, L32
- 影響: 動作上問題なし（同じ ref で 2 回呼ばれるだけ）
- 対応: 別 followup issue 候補（本 task 対象外）

## （実装中に追加発見した課題はここに追記）
```

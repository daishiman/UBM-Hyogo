# Phase 11 — 手動テスト（VISUAL）

**mode: VISUAL**

## 1. タスク種別判定

UI task / VISUAL（PublicHeader の描画 DOM が auth state により変化するため）。

## 2. 取得 screenshot 一覧

| canonical 名 | 状態 | 経路 |
|--------------|------|------|
| `public-header-guest.png` | guest（未ログイン） | `/` を未ログイン browser で開く |
| `public-header-member.png` | member（一般会員） | `/profile` cookie 保持済 browser で `/` |
| `public-header-admin.png` | admin（管理者） | admin session 保持済 browser で `/` |

出力先: `outputs/phase-11/screenshots/`

## 3. capture metadata

`outputs/phase-11/phase11-capture-metadata.json`:

```json
{
  "taskId": "TASK-PUBHDR-SESSION-AWARE-AUTHVIEW-BASE-001",
  "mode": "VISUAL",
  "screenshots": [
    { "name": "public-header-guest.png", "state": "guest", "tc": "TC-PH-VISUAL-01" },
    { "name": "public-header-member.png", "state": "member", "tc": "TC-PH-VISUAL-02" },
    { "name": "public-header-admin.png", "state": "admin", "tc": "TC-PH-VISUAL-03" }
  ]
}
```

## 4. 取得手順（Playwright / browser）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec next dev &
# guest
curl -I http://localhost:3000/
# member / admin は親 workflow の playwright auth-slot-coverage spec を流用予定（次タスク Task B 以降）
```

> 本タスクスコープでは Playwright cross-route spec は含まない。screenshot は手動 capture を許容。

## 5. 3 層評価

| 層 | 観点 | 期待 |
|----|------|------|
| Semantic | `<header data-auth-state>` 値 | guest/member/admin リテラル |
| Visual | guest: 「ログイン」 / member: 「マイページ」+「ログアウト」 / admin: +「管理」 | screenshot で目視確認 |
| AI UX | CTA ラベルが日本語 / aria-label 整合 | reviewer 確認 |

## 6. 出力ファイル

- `outputs/phase-11/manual-test-result.md`（実行記録 + screenshot 参照）
- `outputs/phase-11/screenshots/public-header-{guest,member,admin}.png`
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/ui-sanity-visual-review.md`

## 7. 完了条件

- [ ] 3 screenshot 取得済
- [ ] manual-test-result.md に 3 状態の DOM 観測結果記録
- [ ] HIGH 問題発見時は `unassigned-task/` へ自動生成

## 8. ブロッカー時の代替

ローカル auth セットアップ未整備時は `manual-test-result.md` に「環境ブロッカー」として記録し、staging 環境での後続検証へ移管（WEEKGRD-01 に従い source-level PASS と環境ブロッカーを分離記録）。

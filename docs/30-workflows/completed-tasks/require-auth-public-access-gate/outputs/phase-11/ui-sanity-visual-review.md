# Phase 11 UI sanity / visual review（VISUAL）

| 項目 | 値 |
|------|-----|
| taskId | require-auth-public-access-gate |
| mode | **VISUAL**（新規 UI 画面 `LoginRequiredNotice` を追加） |
| 実施状態 | local evidence captured / runtime screenshot pending（user-gated） |

## VISUAL 判定根拠

- 本タスクは未認証時に表示する新規画面（`LoginRequiredNotice`）を追加するため UI task（VISUAL）と判定する。
- screenshot canonical 名: `login-required-notice-unauthenticated.png` / `public-members-authenticated.png`。

## チェック観点（実施予定）

| 観点 | 確認内容 | 判定 |
|------|---------|------|
| デザイントークン | OKLch トークンのみ使用・HEX 直書き 0 件（`verify-design-tokens` gate） | PASS |
| primitive 再利用 | 既存 Card / Button を再利用し新規 primitive を増やしていない | PASS |
| レイアウト | 案内画面が中央寄せで崩れがない・モバイル幅でも可読 | local PASS / staging screenshot pending |
| 導線 | 「ログインする」CTA が視認しやすく `/login?redirect=` へ正しく遷移 | PASS |

> 実 screenshot は staging 認証経路で取得する（user-gated）。本 workflow では component/layout specs と lint gate を一次証跡とする。

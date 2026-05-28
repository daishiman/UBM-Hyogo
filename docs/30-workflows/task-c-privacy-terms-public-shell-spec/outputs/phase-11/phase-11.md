# Phase 11 — 手動テスト

## 1. 区分

visualEvidence: **VISUAL_ON_EXECUTION**（`/privacy`, `/terms` の shell 実装後、ローカル Playwright でスクリーンショット evidence 6 件を取得済み）

## 2. 実施環境

- ローカル: `AUTH_SECRET=playwright-e2e-auth-secret-32-bytes mise exec -- pnpm --filter @ubm-hyogo/web exec next dev --hostname 127.0.0.1 --port 3010`
- staging: `https://ubm-hyogo-web-staging.daishimanju.workers.dev`（Task A + Task C デプロイ後）

## 3. 手動テストケース

| ID | 操作 | 期待 |
|----|------|------|
| M1 | guest で `/privacy` を開く | ヘッダにホーム / メンバー / 登録 / ログイン CTA、フッタ表示、本文の全 h2 セクション保持 |
| M2 | member で `/privacy` を開く | ヘッダに「マイページ」CTA + ログアウト、フッタ表示 |
| M3 | admin で `/privacy` を開く | M2 に加え「管理」CTA |
| M4 | guest/member/admin で `/terms` を開く | M1-M3 と同等（タイトル「利用規約」、本文 terms 内容） |
| M5 | `/privacy` → ヘッダの「ホーム」クリック | `/` に遷移 |
| M6 | `/terms` → フッタの「プライバシーポリシー」等内部リンク（あれば）クリック | 想定先に遷移 |
| M7 | `/privacy` 本文末尾「トップに戻る」クリック | `/` に遷移 |
| M8 | DevTools で `<head>` の `<title>` を確認 | `プライバシーポリシー | UBM 兵庫支部会` / `利用規約 | UBM 兵庫支部会` |
| M9 | DevTools で root `<div>` を確認 | `data-testid="public-shell"` / `data-route-group="public"` / `data-theme="warm"` 存在 |

## 4. 取得 evidence

| ID | ファイル | 内容 |
|----|---------|------|
| EV-01 | `outputs/phase-11/evidence/privacy-guest.png` | M1 のフル画面 |
| EV-02 | `outputs/phase-11/evidence/privacy-member.png` | M2 |
| EV-03 | `outputs/phase-11/evidence/privacy-admin.png` | M3 |
| EV-04 | `outputs/phase-11/evidence/terms-guest.png` | M4 (guest) |
| EV-05 | `outputs/phase-11/evidence/terms-member.png` | M4 (member) |
| EV-06 | `outputs/phase-11/evidence/terms-admin.png` | M4 (admin) |
| EV-07 | `outputs/phase-11/manual-test-result.md` | M1-M9 の合否を記録 |

## 5. 完了条件

- M1-M4 / M8-M9 pass。M5-M7 は visual shell contract 外の navigation spot check として未実施（対象リンク有無が現行 footer/content に依存するため）
- evidence 6 件取得
- dev server log に `/privacy` / `/terms` 由来 500 はなし

# Phase 11 手動テスト結果 — admin-members-mobile-responsive-layout

- task_id: `admin-members-mobile-responsive-layout`
- route: `/admin/members`

## テスト方式

- 本タスクは **VISUAL UI task**（SSOT: visual_category=VISUAL / W1-02b-1）。
- screenshot mode: **VISUAL**。canonical 3 点を取得する（命名は `<component>-<state>.png`）。
- 段階: **implemented_local_evidence_captured**。local focused test と CSS-contract browser screenshot は完了。authenticated `/admin/members` route screenshot は user-gated。
- **ダミーPNG の作成は禁止**（false green 防止）。撮れない場合は pending のまま記録する。

## 1. viewport 別 手動確認チェックリスト

| viewport | 期待 | チェック項目 | 結果 |
| -------- | ---- | ------------ | ---- |
| 375px | カード（縦積み） | 縦積みカード表示 / 横はみ出しゼロ / メール・区画ステータス・タグ・最終更新・公開のラベル付き全可視 / 公開トグル viewport 内・操作可 / 編集ボタン viewport 内 | CSS-contract screenshot PASS（overflowPass=true） |
| 414px | カード（縦積み） | 375px と同様・レイアウト崩れなし・はみ出しなし | Playwright CSS contract の mobile coverage で代替。canonical PNG は 375/640/1280 |
| 640px | カード（境界値） | `@media (max-width:640px)` 上限でカード維持・横はみ出しゼロ | CSS-contract screenshot PASS（overflowPass=true） |
| 1280px | テーブル維持 | `<thead>` 可視・現行テーブルレイアウト・カードCSS非適用（AC-4 / I-6 リグレッションゼロ） | CSS-contract screenshot PASS（overflowPass=true） |

## 2. screenshot 参照（canonical 3 点・captured）

| # | canonical 名 | viewport | route | 状態 | capture |
| - | ------------ | -------- | ----- | ---- | ------- |
| 1 | `admin-members-table-mobile-card-375.png` | 375px | `synthetic:/admin/members-css-contract` | モバイルカード（縦積み・はみ出しゼロ・公開トグル可視） | captured: `outputs/phase-11/screenshots/admin-members-table-mobile-card-375.png` |
| 2 | `admin-members-table-mobile-card-640.png` | 640px | `synthetic:/admin/members-css-contract` | モバイルカード（境界値） | captured: `outputs/phase-11/screenshots/admin-members-table-mobile-card-640.png` |
| 3 | `admin-members-table-desktop-table-1280.png` | 1280px | `synthetic:/admin/members-css-contract` | デスクトップテーブル維持（thead 可視） | captured: `outputs/phase-11/screenshots/admin-members-table-desktop-table-1280.png` |

計測結果: `outputs/phase-11/screenshots/screenshot-metrics.json`。375 / 640 / 1280 すべて `overflowPass=true`。

> 上記 3 名は `screenshot-plan.json` / `phase11-capture-metadata.json` と完全一致（drift 厳禁）。

## 3. 環境ブロッカー（CAPTURE_BLOCKED）判定

- worktree / CI で Playwright / Electron 相当が起動不可の場合は **CAPTURE_BLOCKED** と記録する。
- 代替証跡: ① unit test PASS（TC-MT-21〜24 + 既存 TC-MT-01〜20 緑）② 実ブラウザ devtools での手動スクショ（canonical 名で配置）。
- 現段階の判定: local focused test は PASS。CSS-contract screenshot は PASS。authenticated route screenshot は user-gated。
- ダミーPNG は作成しない。

## 4. Apple HIG 視覚観点（簡易チェック）

| 観点 | 基準 | 結果 |
| ---- | ---- | ---- |
| タップターゲット | 公開トグル / 編集ボタン / チェックボックスが最小 44×44px 相当 | CSS-contract screenshot で viewport 内可視 |
| カード余白 | カード padding / カード間 margin が token 一定・窮屈でない | PASS（`var(--ubm-space-*)` 使用） |
| 可読性 | ラベル（`::before`）と値のコントラスト・文字サイズが読める | PASS（`var(--ubm-text-xs)` + text token） |
| はみ出し | テキスト / Chip 群が画面右端で見切れない | PASS（overflowPass=true） |

## 5. まとめ

- local implementation 段階: focused component test PASS、Playwright CSS contract PASS、canonical 3 CSS-contract screenshot 取得済み。authenticated `/admin/members` route screenshot は user-gated。
- false green 防止のためダミーPNG は禁止。

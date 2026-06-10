# Phase 11 — 手動テスト / 視覚証跡 総括（VISUAL）

> ステータス: `pending_visual_capture` / visualScope=`VISUAL` / visualEvidence=`VISUAL_CAPTURE_PENDING`。実装とローカル機械検証は完了。VISUAL 証跡の 8 PNG は staging 認証済み admin capture が未取得。

---

## 1. VISUAL 宣言

- 対象 route: `/admin/dashboard/attendance`（admin 認証必須）。
- UI 変更（3 層レイアウト・PRIMARY ヒーロー・Segmented タブ統合・要フォロートーン強調）を含むため **VISUAL**。screenshot 必須。
- capture runtime: staging 認証済み admin 画面の Playwright。**user-gated**（staging deploy + admin bearer mint が前提）。

## 2. 3 層評価構造

| 層 | 観点 | 確認内容 |
| --- | --- | --- |
| Semantic | 構造・機能 | h1>h2>h3 階層、PRIMARY/TREND/DETAIL DOM 分割、Segmented `role="radiogroup"`/`role="radio"`、`data-attendance-follow`（none/warn）、SafeResult ゾーン単位 degrade |
| Visual | 見た目・token | 出席率特大タイポ `--ubm-text-3xl`、ゾーン余白リズム `--ubm-space-*`、card/border/shadow サーフェス区別、要フォロー `warning` Badge、OKLch トークンのみ、mobile 1 / desktop 2 カラム grid |
| AI UX | ユーザー体験 | 出席率の健全性と要フォロー有無が一目で判断可能、初期スクロール量の削減、DETAIL タブ切替の段階的開示の自然さ |

## 3. capture 対象 8 screenshot（canonical 名）

| # | canonical 名 | tc | viewport | 検証 AC |
| --- | --- | --- | --- | --- |
| ① | `attendance-dashboard-full.png` | TC-V-01 | desktop | AC-2 / AC-3 / AC-8 |
| ② | `attendance-primary-hero-followup-ok.png` | TC-V-02 | desktop | AC-1 / AC-4 |
| ③ | `attendance-primary-hero-followup-warn.png` | TC-V-03 | desktop | AC-1 / AC-4 |
| ④ | `attendance-trend-zone.png` | TC-V-04 | desktop | AC-2 / AC-8 |
| ⑤ | `attendance-detail-tabs-session.png` | TC-V-05 | desktop | AC-3 |
| ⑥ | `attendance-detail-tabs-member.png` | TC-V-06 | desktop | AC-3 |
| ⑦ | `attendance-detail-tabs-top10.png` | TC-V-07 | desktop | AC-3 |
| ⑧ | `attendance-dashboard-mobile.png` | TC-V-08 | mobile | AC-8 / AC-2 |

> canonical 名は `screenshot-plan.json` と `phase11-capture-metadata.json` で完全一致（命名一貫性厳守）。

## 4. capture script 契約（FB-MSO-003）

実 capture script は `try { ... } finally { browser.close(); server.close(); }` を厳守する。finally ブロックを省略しない。詳細は phase-11.md §11.3。

## 5. 証跡の主ソース

| ソース | 内容 |
| --- | --- |
| VISUAL screenshot | 上記 8 枚（未取得。`outputs/phase-11/screenshots/` に PNG 0 件） |
| 自動テスト | `pnpm exec vitest run apps/web/src/features/admin/attendance --root .` PASS（8 files / 23 tests）。`AttendanceDetailTabs` は SafeResult 部分失敗時の degrade 継続を追加検証 |

## 6. user-gated 境界

- staging deploy / admin bearer mint / 実 capture（8 枚）は user 承認後のみ。
- ローカル実装は完了済みだが、認証済み runtime capture が未取得のため visual evidence は pending。

## 7. discovered-issues サマリ

- スコープ内発見: 8 canonical PNG が未配置。認証済み staging capture が必要なため `pending_visual_capture` として明示。

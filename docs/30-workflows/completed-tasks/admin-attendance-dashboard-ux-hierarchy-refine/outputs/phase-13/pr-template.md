# Phase 13 — PR 本文テンプレート

> ステータス: `implemented_local_checks_pass_visual_capture_pending`。base = `dev`。commit / PR は user 明示承認後のみ。

---

## タイトル案

```
feat(admin): 出席ダッシュボードを 3 層階層（PRIMARY/TREND/DETAIL）へリファイン
```

---

## PR 本文（雛形）

### 背景

`/admin/dashboard/attendance` は 8 セクション（KPI 5 枚・トレンド・回数帯分布・セッション表・会員表・TOP10・欠席者アラート）がフラットに縦積みされ、視覚的階層・情報の優先順位・「このページで何を判断すべきか」のナラティブが欠如していた（ユーザー報告: 「めちゃくちゃ見にくい・パッと見て何をしたいか分からない」）。機能不足ではなく情報過多が真因。

### 変更内容

データ取得（6 endpoint bundle）・API・D1・shared 型は不変のまま、表現層（`apps/web/src/features/admin/attendance/`）のみを Apple HIG 準拠の 3 層に再構成:

- **PRIMARY ゾーン**: ①全体出席率（特大タイポ `--ubm-text-3xl` + 前期比 delta + ユニーク出席率）、②要フォロー対象数を主役 2 枚で配置。件数に応じて `data-attendance-follow`（none/warn）トーン切替。
- **TREND ゾーン**: トレンドチャート + 回数帯分布を 2 カラムでカード統一。
- **DETAIL ゾーン**: セッション別 / 会員別 / TOP10 を `Segmented`（既存 primitive）タブで排他統合し初期スクロール量を削減。
- 新規: `AttendanceDetailTabs`（feature ローカル・internal state）/ `attendanceFollowLevel` 純粋関数。新規 primitive・新規 token・新規 endpoint はゼロ。

### 受入条件チェックリスト

- [ ] AC-1 PRIMARY ヒーロー（出席率特大 + 要フォロー 2 枚）
- [ ] AC-2 3 層階層（h1>h2>h3 / 余白 / サーフェス区別）
- [ ] AC-3 DETAIL Segmented タブ統合・スクロール削減
- [ ] AC-4 要フォロートーン切替（0=success / 1+=warning / `data-attendance-follow`）
- [ ] AC-5 OKLch トークンのみ（HEX 0 件・`verify-design-tokens` PASS）
- [ ] AC-6 新規 primitive 0 件
- [ ] AC-7 API / D1 / Form / shared 型 diff 0 件
- [ ] AC-8 レスポンシブ（mobile 1 / desktop 2 カラム）
- [ ] AC-9 a11y（見出し階層 / aria / focus ring / WCAG AA）
- [ ] AC-10 既存機能温存（フィルタ / CSV / drilldown modal / degrade / フッター）

### スクリーンショット（pending）

> 現時点では `outputs/phase-11/screenshots/` に PNG 実体なし。PR 作成時点でも未取得なら、このセクションは削除する（CLAUDE.md フロー準拠）。

| 状態 | 画像 |
| --- | --- |
| 3 層全体（desktop） | `outputs/phase-11/screenshots/attendance-dashboard-full.png` |
| PRIMARY ヒーロー・要フォロー 0 件 | `outputs/phase-11/screenshots/attendance-primary-hero-followup-ok.png` |
| PRIMARY ヒーロー・要フォロー 1+ 件 | `outputs/phase-11/screenshots/attendance-primary-hero-followup-warn.png` |
| TREND ゾーン | `outputs/phase-11/screenshots/attendance-trend-zone.png` |
| DETAIL タブ（セッション別） | `outputs/phase-11/screenshots/attendance-detail-tabs-session.png` |
| DETAIL タブ（会員別） | `outputs/phase-11/screenshots/attendance-detail-tabs-member.png` |
| DETAIL タブ（TOP10） | `outputs/phase-11/screenshots/attendance-detail-tabs-top10.png` |
| モバイル幅 | `outputs/phase-11/screenshots/attendance-dashboard-mobile.png` |

### テスト結果

| コマンド | 結果 |
| --- | --- |
| `pnpm exec vitest run apps/web/src/features/admin/attendance --root .` | PASS（8 files / 23 tests） |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS（9 tests） |
| `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine --strict --json` | PASS（errors 0 / warnings 0） |

| スイート | 件数 | 結果 |
| --- | --- | --- |
| 出席 feature component / lib spec | — | — |
| token gate（HEX 0） | — | — |
| typecheck / lint | — | — |
| next build --webpack | — | — |

### スコープ外（本 PR では扱わない）

- 会員ごとの直近 N 回セッション出席フラグ一覧（新 endpoint 要）
- 月別「出席率」サーバ集計（新 endpoint 要）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

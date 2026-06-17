# Phase 13 — PR 本文テンプレート

> ステータス: `spec_created`。base = `dev`。commit / PR は user 明示承認後のみ。実装サイクル完了後に「結果」欄を埋める。

---

## タイトル案

```
feat(admin): 出席ダッシュボードの英語表記・専門語を非エンジニア向け日本語へ統一
```

---

## PR 本文（雛形）

### 背景

`/(admin)/admin/dashboard/attendance`（出席ダッシュボード）は、見出し・ラベル・補助文に英語表記（`PRIMARY` / `TREND` / `DETAIL` / `ADMIN / DASHBOARD` / `TOP10` / `3M` / `6M` / `1Y` / `CSV`）とエンジニア寄りの日本語専門語（セッション / トレンド / ユニーク出席率 / 区画 / KPI / pt）が混在し、非エンジニアの会員・管理者が「何の数字か・どう読むか」を直感的に把握できなかった（ユーザー報告: 「英語表記は直感的に分からない、もっと分かりやすい日本語にしてほしい」）。情報そのものは十分で、**表現（言葉）が伝わっていない**ことが真因。

### 変更内容

データ取得（6 endpoint bundle）・API・D1・Google Form schema・`packages/shared` 型は不変のまま、表現層（`apps/web/src/features/admin/attendance/` + 同 route `page.tsx` + `globals.css` 軽微調整）の**文言のみ**を平易な日本語へ置換:

- **英語表記の日本語化**: `PRIMARY/TREND/DETAIL`→`全体の状況/出席の移り変わり/くわしい一覧`、`TOP10`→`出席が多い順`、`3M/6M/1Y`→`3か月/6か月/1年`、`CSVエクスポート`→`表計算ファイルで書き出す`、eyebrow `ADMIN / DASHBOARD`→`管理 / ダッシュボード`。
- **「セッション」→「開催回」統一**: 「直近 N セッション連続欠席」→「直近 N 回つづけて欠席」など。
- **専門語の平易化**: 「ユニーク出席率」→「一度でも参加した人の割合」、「pt」→「ポイント」（`formatDelta` の単位表記のみ・計算不変）、「区画」「帯」「トレンド」「KPI」を除去。
- **見やすさ微調整**: 要フォロー行のリズム調整・長文言のはみ出し回避（DOM 構造・testid・href 不変・`var(--ubm-color-*)` のみ）。

3 ゾーン構造の骨格は維持。新規 primitive・新規 component・新規 token・新規 endpoint はゼロ。

### 受入条件チェックリスト

- [ ] AC-1 英語表記（PRIMARY/TREND/DETAIL/TOP10/CSV 等）が日本語へ置換（grep 0 件）
- [ ] AC-2 「セッション」が「開催回」系へ置換（grep 0 件）
- [ ] AC-3 専門語（トレンド/ユニーク/KPI/区画/帯/pt）が平易日本語へ置換
- [ ] AC-4 見やすさ微調整（DOM 構造/testid/href 不変）
- [ ] AC-5 OKLch トークンのみ（HEX 0 件・`verify-design-tokens` PASS）
- [ ] AC-6 新規 primitive / component 0 件
- [ ] AC-7 API / D1 / Form / shared 型 diff 0 件
- [ ] AC-8 testid/`data-*`/`href`/`role`/`aria-*` の構造保持（aria-label 文言は意図的変更）
- [ ] AC-9 既存テスト（T-01〜T-06）が After 文言へ追従 + 回帰テスト追加・focused vitest PASS
- [ ] AC-10 既存機能温存（フィルタ / 表計算ファイル書き出し / drilldown modal / degrade）

### スクリーンショット

> `outputs/phase-11/screenshots/` に 6 canonical PNG（local Playwright fixture・実体あり）を取得済み。PR 本文に下記 6 枚を添付する。authenticated staging baseline は別境界（user-gated）。

| 状態 | 画像 |
| --- | --- |
| 3 ゾーン全体（desktop・after） | `outputs/phase-11/screenshots/attendance-dashboard-full-jp.png` |
| 「全体の状況」ゾーン | `outputs/phase-11/screenshots/attendance-overview-zone-jp.png` |
| 「出席の移り変わり」ゾーン | `outputs/phase-11/screenshots/attendance-trend-zone-jp.png` |
| 「くわしい一覧」タブ | `outputs/phase-11/screenshots/attendance-detail-tabs-jp.png` |
| フィルタバー | `outputs/phase-11/screenshots/attendance-filter-bar-jp.png` |
| モバイル幅 | `outputs/phase-11/screenshots/attendance-dashboard-mobile-jp.png` |

### テスト結果（実装後に埋める）

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__` | — |
| `mise exec -- pnpm typecheck` | — |
| `mise exec -- pnpm lint` | — |
| `mise exec -- pnpm verify:tokens` | — |
| `git diff --name-only -- apps/api packages/shared`（空であること） | — |

### スコープ外（本 PR では扱わない）

- 3 ゾーン構造の作り替え・カード配置の大規模変更・チャート表現の刷新（Q3 は「微調整」を選択）。
- 新 endpoint を要する集計・データ追加（会員ごとの直近 N 回出席フラグ一覧 等）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

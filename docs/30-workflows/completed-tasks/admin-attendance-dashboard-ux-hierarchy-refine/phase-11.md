# Phase 11: 手動テスト / 視覚証跡（VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト・VISUAL screenshot |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 10（最終レビュー / Go 判定） |
| 下流 | Phase 12（ドキュメント更新） |
| 状態 | pending_visual_capture |
| visualScope | **VISUAL** |
| visualEvidence | `VISUAL_CAPTURE_PENDING`（実装・ローカル機械検証済み、8 PNG 未取得） |

## 目的

出席ダッシュボード `/admin/dashboard/attendance` の 3 層リファイン（PRIMARY ヒーロー / TREND / DETAIL タブ統合 / 要フォロートーン強調）について、**3 層評価（Semantic / Visual / AI UX）の観点・capture 対象 screenshot の canonical 命名・取得手順（Playwright・staging 認証済み admin）を固定**する。実装・ローカル機械検証は完了済みだが、staging admin bearer を用いた実 screenshot 8 枚は未取得。AC-1〜AC-10 のうち視覚で確認すべき項目（AC-1 ヒーロー / AC-2 階層 / AC-3 タブ / AC-4 トーン / AC-8 レスポンシブ / AC-9 a11y）を Phase 11 の評価観点に対応付ける。

## VISUAL 宣言

- 本タスクは出席ダッシュボード `/admin/dashboard/attendance` の表現層（3 層レイアウト・ヒーロー・タブ統合・トーン強調）を変更する **UI 変更**であるため **VISUAL** である。screenshot は必須。
- 本 Phase は「capture 対象・canonical 命名・取得手順・3 層評価観点」を固定し、未取得の 8 PNG を明示する。
- staging 認証済み admin 画面（`/admin/dashboard/attendance`）での実 capture は、staging deploy を伴うため **user-gated** とする。

## 11.1 評価の 3 層構造

| 層 | 観点 | 確認内容 |
| --- | --- | --- |
| Semantic | 構造・機能 | h1>h2>h3 の見出し階層、PRIMARY/TREND/DETAIL の DOM 分割、Segmented タブの `role="radiogroup"` / `role="radio"`、要フォロー数に応じた `data-attendance-follow`（none/warn）属性、SafeResult error 時のゾーン単位 degrade |
| Visual | 見た目・token | 出席率の特大タイポ（`--ubm-text-3xl`）、ゾーン間の余白リズム（`--ubm-space-*`）、card/border/shadow によるサーフェス区別、要フォロー warn トーン（`warning` Badge）、OKLch トークンのみ（HEX 0 件）、mobile 1 カラム / desktop 2 カラム grid |
| AI UX | ユーザー体験 | 一目で「全体出席率の健全性」と「要フォロー対象の有無」が判断できること、初期スクロール量が現状比で削減されること、DETAIL タブ切替で段階的開示が自然に成立すること |

## 11.2 capture 対象 screenshot（canonical 名）

実装サイクルで下記を staging 認証済み admin 画面の Playwright runtime で `outputs/phase-11/screenshots/` へ保存する。canonical 命名は `<component>-<state>.png` 形式（TC 番号は `phase11-capture-metadata.json` の `tc` フィールドのみに記す）。

| # | canonical 名 | 検証 AC | viewport | state |
| --- | --- | --- | --- | --- |
| ① | `attendance-dashboard-full.png` | AC-2 / AC-3 / AC-8 | desktop | 3 層全体（before/after 比較を意図・after 状態） |
| ② | `attendance-primary-hero-followup-ok.png` | AC-1 / AC-4 | desktop | PRIMARY ヒーロー・要フォロー 0 件（neutral/success トーン） |
| ③ | `attendance-primary-hero-followup-warn.png` | AC-1 / AC-4 | desktop | PRIMARY ヒーロー・要フォロー 1+ 件（warning トーン） |
| ④ | `attendance-trend-zone.png` | AC-2 / AC-8 | desktop | TREND ゾーン（トレンドチャート + 回数帯分布の 2 カラム） |
| ⑤ | `attendance-detail-tabs-session.png` | AC-3 | desktop | DETAIL タブ = セッション別 表示 |
| ⑥ | `attendance-detail-tabs-member.png` | AC-3 | desktop | DETAIL タブ = 会員別 表示 |
| ⑦ | `attendance-detail-tabs-top10.png` | AC-3 | desktop | DETAIL タブ = TOP10 表示 |
| ⑧ | `attendance-dashboard-mobile.png` | AC-8 / AC-2 | mobile | モバイル幅・3 層が 1 カラム縦積みで成立 |

> canonical 名は `outputs/phase-11/screenshot-plan.json` と `outputs/phase-11/phase11-capture-metadata.json` で完全一致させる（命名一貫性の厳守）。

## 11.3 capture 手順（Playwright・staging 認証済み admin）

### 環境

| 項目 | 値 |
| --- | --- |
| 対象 route | `/admin/dashboard/attendance`（admin gate 通過必須） |
| staging | `https://ubm-hyogo-web-staging...workers.dev/`（user-gated deploy 後） |
| 認証 | admin role bearer（staging mint。`scripts/smoke` 系の認証手順に準拠） |
| viewport | desktop（1280×800 目安）/ mobile（390×844 目安） |

### capture script パターン（FB-MSO-003 準拠 / 厳守）

capture script には必ず `try { ... } finally { browser.close(); server.close(); }` を入れる。finally ブロックを省略しない（前サイクル教訓 [FB-MSO-003] / L-MSO-003）。

```js
// 擬似コード（実装サイクルで apps/web/playwright/tests/ 配下に実体化）
const browser = await chromium.launch();
const server = /* 必要時のみ起動。staging 直接 capture では未使用 */ null;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // 1) admin 認証 cookie / bearer を注入
  // 2) /admin/dashboard/attendance へ遷移
  // 3) 要フォロー 0 件 / 1+ 件は filter または seed で状態を作る
  // 4) DETAIL タブを Segmented で session/member/top10 に切替えつつ capture
  await page.screenshot({ path: "outputs/phase-11/screenshots/attendance-dashboard-full.png", fullPage: true });
  // ... 各 canonical 名で capture
} finally {
  await browser.close();        // 必ず finally で close
  if (server) await server.close();
}
```

### 要フォロー 0 / 1+ 状態の作り方

- 0 件状態（②）: absentees endpoint が空配列を返すフィルタ / seed 条件で capture。
- 1+ 件状態（③）: absentees endpoint が 1 件以上返す条件で capture。`data-attendance-follow="warn"` 属性と `warning` Badge トーンが反映されることを確認。

## 11.4 staging / 環境ブロッカー（user-gated）

| 操作 | 区分 |
| --- | --- |
| staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`） | user-gated |
| admin role bearer mint（staging） | user-gated |
| 実 staging admin 画面の screenshot capture（8 枚） | user-gated |

> 実装・ローカル機械検証は完了済み。staging admin bearer / user 承認が揃い次第、8 canonical PNG を capture する。

## 11.5 手動テストチェックリスト連携

- Apple HIG 観点（視覚的階層・焦点・余白リズム・タイポスケール・コントラスト・タップ/クリック領域・一目での理解しやすさ）は `outputs/phase-11/manual-test-checklist.md` に固定する。
- VISUAL 証跡の記録テンプレートは `outputs/phase-11/manual-test-result.md`、スコープ外発見は `outputs/phase-11/discovered-issues.md`（0 件でも記録）。

## 実行タスク

1. capture 対象 8 screenshot の canonical 名を `screenshot-plan.json`（`mode: "VISUAL"`）と `phase11-capture-metadata.json` で一致させる。
2. 3 層評価（Semantic / Visual / AI UX）観点を固定する。
3. Apple HIG チェックリストを `manual-test-checklist.md` に固定する。
4. VISUAL 証跡記録テンプレートと discovered-issues を作成する（実 capture は後続サイクル）。

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` | screenshot 対象の 3 層構造・canonical state を導出 |
| Phase 5 | `outputs/phase-05/main.md` / `outputs/phase-05/runbook.md` | 実装済み UI の capture 手順へ接続 |
| Phase 6 | `outputs/phase-06/main.md` / `outputs/phase-06/failure-cases.md` | error/degrade と要フォロー 0/1+ の手動確認に接続 |
| Phase 7 | `outputs/phase-07/main.md` / `outputs/phase-07/ac-matrix.md` | AC↔screenshot の網羅性確認 |
| Phase 8 | `outputs/phase-08/main.md` / `outputs/phase-08/before-after.md` | Before/After で視覚回帰の対象を固定 |
| Phase 9 | `outputs/phase-09/main.md` / `outputs/phase-09/token-audit.md` | token gate PASS 後の VISUAL 証跡として capture |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-10/go-no-go.md | Go 判定 / Phase 11 進行条件 |
| 必須 | outputs/phase-10/main.md | AC↔screenshot マッピング |
| 必須 | _shared-context.md（§6 AC / §10） | AC / 裏取り（Badge tone=`warning`/`success`、Segmented=`radiogroup`、`data-attendance-follow`） |
| 参考 | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/phase-11.md` | FB-MSO-003 capture パターン先例 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | screenshot canonical 名を implementation-guide.md `## 視覚証跡` に参照 |
| Phase 13 | PR 本文に screenshot 参照（実 capture 取得後） |

## 多角的チェック観点（AIが判断）

| 観点 | AC | 確認内容 |
| --- | --- | --- |
| 焦点成立 | AC-1 | ②③ で出席率特大タイポと要フォロー強調が一目で識別できる |
| トーン切替 | AC-4 | ②（0 件）と③（1+ 件）で `data-attendance-follow` / Badge トーンが切り替わる |
| 段階的開示 | AC-3 | ⑤⑥⑦ で 3 テーブルが排他表示される |
| レスポンシブ | AC-8 | ①（desktop 2 カラム）と⑧（mobile 1 カラム）で grid が成立 |
| token 正本 | AC-5 | 全 screenshot 中の色が OKLch トークン由来（HEX 0 件） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | screenshot-plan.json（VISUAL・8 枚） | 11 | pending_visual_capture | canonical 名固定 |
| 2 | phase11-capture-metadata.json | 11 | pending_visual_capture | tc / route / viewport / state |
| 3 | 3 層評価観点 | 11 | completed | main.md |
| 4 | Apple HIG チェックリスト | 11 | completed | manual-test-checklist.md |
| 5 | VISUAL 証跡記録テンプレート | 11 | pending_visual_capture | manual-test-result.md |
| 6 | discovered-issues（VIS-1 記録） | 11 | pending_visual_capture | discovered-issues.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | VISUAL 総括 |
| メタ | outputs/phase-11/screenshot-plan.json | `mode: "VISUAL"` / 8 canonical 名 |
| メタ | outputs/phase-11/phase11-capture-metadata.json | taskId / 各 screenshot の name/tc/route/viewport/state |
| ドキュメント | outputs/phase-11/manual-test-checklist.md | Apple HIG 観点チェックリスト |
| ドキュメント | outputs/phase-11/manual-test-result.md | VISUAL 証跡記録テンプレート |
| ドキュメント | outputs/phase-11/discovered-issues.md | スコープ外発見（0 件でも記録） |

## 完了条件

- [ ] `screenshot-plan.json` が `mode: "VISUAL"` で 8 canonical 名を固定している
- [ ] `phase11-capture-metadata.json` が `taskId` と各 screenshot の `{name, tc, route, viewport, state}` を持ち、canonical 名が screenshot-plan.json と一致している
- [ ] 3 層評価（Semantic / Visual / AI UX）が main.md に固定されている
- [ ] capture script の `try/finally { browser.close(); server.close(); }` パターンが明記されている（FB-MSO-003）
- [ ] Apple HIG チェックリストが manual-test-checklist.md に固定されている
- [x] 実 capture が user-gated であり、8 PNG 未取得であることが明記されている
- [ ] discovered-issues.md が実体ファイルとして存在する（0 件でも「0 件」と記録）

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] outputs/phase-11/* の 6 成果物が実体ファイルとして配置済み
- [ ] screenshot canonical 名が screenshot-plan.json と phase11-capture-metadata.json で完全一致している（不一致 0 件）
- [ ] VISUAL 宣言と user-gated capture 境界が記録されている
- [x] artifacts.json の Phase 11 ステータスが pending_visual_capture に整合している

## 次Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ事項: screenshot canonical 名 8 件 / 3 層評価結果 / discovered-issues
- ブロック条件: capture 対象または canonical 命名が未確定の場合は本 Phase に留まる

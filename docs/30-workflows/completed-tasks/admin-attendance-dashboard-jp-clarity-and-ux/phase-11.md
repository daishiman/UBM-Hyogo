# Phase 11: 手動テスト / 視覚証跡（VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト・VISUAL screenshot |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 10（最終レビュー / GO 判定） |
| 下流 | Phase 12（ドキュメント更新） |
| 状態 | completed |
| visualScope | **VISUAL** |
| visualEvidence | `VISUAL`（`phase11-capture-metadata.json` の `status=captured_local_fixture`。6 canonical PNG は admin 認証 gate 配下・Playwright staging 専用のためlocal fixture で取得済み、staging baseline capture は user-gated） |

## 目的

出席ダッシュボード `/admin/dashboard/attendance` の**英語表記・専門語の日本語化と軽微 UX 調整**について、**3 層評価（Semantic / Visual / AI UX）の観点・capture 対象 screenshot の canonical 命名・取得結果**を固定する。本タスクは実装・ローカル機械検証・local Playwright fixture capture 6 PNG まで完了済みであり、staging admin 認証後の baseline capture のみ user-gated とする。AC-1〜AC-4（日本語見出し / 専門語消失 / 見やすさ）を視覚で確認する項目として Phase 11 の評価観点に対応付ける。

## VISUAL 宣言

- 本タスクは出席ダッシュボードの表現層（見出し・ラベル・補助文の日本語化、要フォロー行・長い文言の軽微なリズム調整）を変更する **UI 変更**であるため **VISUAL** である。screenshot は必須。
- 本 Phase は「capture 対象・canonical 命名・取得結果・3 層評価観点」を固定し、6 PNG の実体を保存する。
- staging 認証済み admin 画面（`/admin/dashboard/attendance`）での baseline capture は、staging deploy を伴うため **user-gated** とする。staging PNG は擬似生成しない。

## 11.1 評価の 3 層構造

| 層 | 観点 | 確認内容 |
| --- | --- | --- |
| Semantic | 構造・機能 | h1>h2>h3 の見出し階層が日本語見出し（全体の状況 / 出席の移り変わり / くわしい一覧）で維持される、Segmented タブの `role="radiogroup"` / `role="radio"` が日本語ラベル（開催回ごと / 会員別 / 出席が多い順）で機能、aria-label の**値**が日本語化されても属性キー・役割が不変、SafeResult error 時のゾーン単位 degrade が維持される |
| Visual | 見た目・token | 日本語見出し・補助文が読みやすく配置される、長い文言（表計算ファイルで書き出す 等）がはみ出さない、要フォロー行のリズムが整う、OKLch トークンのみ（HEX 0 件）、mobile 1 カラム / desktop の grid が破綻しない |
| AI UX | ユーザー体験 | 非エンジニアが一目で「全体の出席状況」「対応が必要な人がいるか」「詳しく見る導線」を日本語で迷わず把握できる、英語・専門語に詰まらない、フィルタ/書き出しの操作意図が言葉から分かる |

## テストケース

| TC-ID | 内容 | 証跡 |
| --- | --- | --- |
| TC-V-01 | desktop full page で 3 ゾーン全体が日本語見出しで表示される | `screenshots/attendance-dashboard-full-jp.png` |
| TC-V-02 | desktop の全体の状況ゾーンで KPI / 要フォロー対象が日本語表示される | `screenshots/attendance-overview-zone-jp.png` |
| TC-V-03 | desktop の出席の移り変わりゾーンで chart / 分布が日本語表示される | `screenshots/attendance-trend-zone-jp.png` |
| TC-V-04 | desktop のくわしい一覧タブで 3 タブが日本語表示される | `screenshots/attendance-detail-tabs-jp.png` |
| TC-V-05 | desktop のフィルタで期間・累計出席回数・書き出しが日本語表示される | `screenshots/attendance-filter-bar-jp.png` |
| TC-V-06 | mobile 390px で 1 カラム表示と詳細テーブルが読める | `screenshots/attendance-dashboard-mobile-jp.png` |

## 画面カバレッジマトリクス

| TC-ID | 画面 / 領域 | スクリーンショット |
| --- | --- | --- |
| TC-V-01 | full page desktop | `screenshots/attendance-dashboard-full-jp.png` |
| TC-V-02 | overview zone desktop | `screenshots/attendance-overview-zone-jp.png` |
| TC-V-03 | trend zone desktop | `screenshots/attendance-trend-zone-jp.png` |
| TC-V-04 | detail tabs desktop | `screenshots/attendance-detail-tabs-jp.png` |
| TC-V-05 | filter bar desktop | `screenshots/attendance-filter-bar-jp.png` |
| TC-V-06 | full page mobile | `screenshots/attendance-dashboard-mobile-jp.png` |

## 11.2 capture 対象 screenshot（canonical 名）

実装サイクルで下記を local Playwright admin fixture で `outputs/phase-11/screenshots/` へ保存した。canonical 命名は `screenshot-plan.json` / `phase11-capture-metadata.json` と完全一致させる。

| # | canonical 名 | tc | 検証 AC | viewport | state |
| --- | --- | --- | --- | --- | --- |
| ① | `attendance-dashboard-full-jp.png` | TC-V-01 | AC-1 / AC-2 / AC-3 / AC-4 | desktop | 3 ゾーン全体（全体の状況 / 出席の移り変わり / くわしい一覧）が日本語見出しで表示される after 状態 |
| ② | `attendance-overview-zone-jp.png` | TC-V-02 | AC-1 / AC-2 / AC-3 | desktop | 「全体の状況」ゾーン（全体出席率 / 前の期間とくらべて / 一度でも参加した人の割合 / 開催回数 / 要フォロー対象）が日本語表示 |
| ③ | `attendance-trend-zone-jp.png` | TC-V-03 | AC-1 / AC-3 | desktop | 「出席の移り変わり」ゾーン（月ごとの移り変わり + 出席回数べつの人数）が日本語表示 |
| ④ | `attendance-detail-tabs-jp.png` | TC-V-04 | AC-1 / AC-2 | desktop | 「くわしい一覧」タブ（開催回ごと / 会員別 / 出席が多い順）が日本語ラベルで切替表示 |
| ⑤ | `attendance-filter-bar-jp.png` | TC-V-05 | AC-1 / AC-3 | desktop | フィルタ（期間: 全期間/今月/3か月/6か月/1年・累計の出席回数・表計算ファイルで書き出す）が日本語表示 |
| ⑥ | `attendance-dashboard-mobile-jp.png` | TC-V-06 | AC-4 | mobile | モバイル幅・3 ゾーンが 1 カラム縦積みで日本語表示が成立 |

> canonical 名は `outputs/phase-11/screenshot-plan.json` と `outputs/phase-11/phase11-capture-metadata.json` で完全一致済み。

## 11.3 capture 手順（Playwright・local admin fixture）

### 環境

| 項目 | 値 |
| --- | --- |
| 対象 route | `/admin/dashboard/attendance`（admin gate 通過必須） |
| runtime | local Next dev + Playwright admin mock fixture |
| 認証 | `adminPage` fixture |
| viewport | desktop（1280×800 目安）/ mobile（390×844 目安） |

### capture script パターン（FB-MSO-003 準拠 / 厳守）

capture script には必ず `try { ... } finally { browser.close(); server.close(); }` を入れる。finally ブロックを省略しない（[FB-MSO-003] / L-MSO-003）。

```js
// 実体: apps/web/playwright/tests/admin-attendance-dashboard-ux.spec.ts
const browser = await chromium.launch();
const server = /* staging 直接 capture では未使用 */ null;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // 1) admin 認証 cookie / bearer を注入
  // 2) /admin/dashboard/attendance へ遷移
  // 3) DETAIL タブを Segmented で 開催回ごと/会員別/出席が多い順 に切替えつつ capture
  await page.screenshot({ path: "outputs/phase-11/screenshots/attendance-dashboard-full-jp.png", fullPage: true });
  // ... 各 canonical 名で capture
} finally {
  await browser.close();        // 必ず finally で close
  if (server) await server.close();
}
```

## 11.4 staging / 環境ブロッカー（user-gated）

| 操作 | 区分 |
| --- | --- |
| staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`） | user-gated |
| admin role bearer mint（staging） | user-gated |
| local admin fixture screenshot capture（6 枚） | completed |
| staging admin 画面の baseline screenshot capture（6 枚） | user-gated |

> apps/web 実装・ローカル機械検証は完了済み。6 canonical PNG は対象 route が admin 認証 gate 配下・Playwright config が staging 専用（local webServer 不起動）のためlocal fixture で取得済み。staging admin bearer / user 承認が揃い次第、6 canonical PNG を capture する。

## 11.5 手動テストチェックリスト連携

- 手動確認の主ソースと「authenticated staging screenshot を pending にする理由」は `outputs/phase-11/manual-test-result.md` の冒頭メタに固定する。
- Apple HIG / 文言分かりやすさ観点の視覚レビュー基準は `outputs/phase-11/ui-sanity-visual-review.md` に固定する（冒頭に VISUAL 宣言）。

## 実行タスク

1. capture 対象 6 screenshot の canonical 名が `screenshot-plan.json`（`mode: "VISUAL"`）と `phase11-capture-metadata.json`（作成済み）で一致していることを確認する（上書きしない）。
2. 3 層評価（Semantic / Visual / AI UX）観点を `outputs/phase-11/main.md` に固定する。
3. 手動確認チェックリスト（日本語見出し表示・専門語消失・フィルタ/書き出し挙動不変）を `manual-test-result.md` に固定する。
4. VISUAL 視覚レビュー基準を `ui-sanity-visual-review.md` に固定する（実 capture は user-gated）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-10/go-no-go.md | GO 判定 / Phase 11 進行条件 |
| 必須 | outputs/phase-10/main.md | AC↔screenshot マッピング |
| 必須 | _shared-context.md（§2 リネーム正本表 / §5 AC） | 日本語化文言 / AC の裏取り |
| 必須 | outputs/phase-11/phase11-capture-metadata.json（作成済み） | canonical 名 / state / AC（上書き禁止） |
| 必須 | outputs/phase-11/screenshot-plan.json（作成済み） | canonical 名 / output パス（上書き禁止） |
| 参考 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/phase-11.md | FB-MSO-003 capture パターン先例 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定（ブロック A〜E）を受けて VISUAL capture 進行条件を満たす |
| Phase 12 | screenshot canonical 名を implementation-guide.md `## 視覚証跡` に参照 |
| Phase 13 | PR 本文に screenshot 参照（実 capture 取得後・PNG 取得済みのためセクション削除） |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 1 | `outputs/phase-01/rename-map.md` | 日本語化後の文言を screenshot state へ反映 |
| Phase 9 | `outputs/phase-09/{main,token-audit}.md` | token gate PASS / 英語残存ゼロを VISUAL 証跡の前提にする |
| Phase 10 | `outputs/phase-10/{main,go-no-go}.md` | GO 判定 / AC↔screenshot マッピング |

## 多角的チェック観点（AIが判断）

| 観点 | AC | 確認内容 |
| --- | --- | --- |
| 日本語見出し成立 | AC-1 | ①②③④⑤ で英語見出し（PRIMARY/TREND/DETAIL/TOP10/CSV 等）が消え日本語見出しが表示される |
| 専門語消失 | AC-2 / AC-3 | ②④ で「セッション」「開催回」、③⑤ で「トレンド/ユニーク/区画/帯」消失が視認できる |
| 見やすさ改善 | AC-4 | ①⑥ で長い文言のはみ出しがなく、要フォロー行・モバイル縦積みが読みやすい |
| token 正本 | AC-5 | 全 screenshot 中の色が OKLch トークン由来（HEX 0 件） |
| 機能温存 | AC-10 | ④⑤ でフィルタ / タブ切替 / 書き出しリンクが日本語ラベルのまま動作する |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | screenshot-plan.json（VISUAL・6 枚）整合確認 | 11 | completed | 作成済み |
| 2 | phase11-capture-metadata.json 整合確認 | 11 | completed | 作成済み |
| 3 | 3 層評価観点 | 11 | completed | main.md |
| 4 | 手動確認チェックリスト + screenshot evidence | 11 | completed | manual-test-result.md |
| 5 | VISUAL 視覚レビュー基準 | 11 | completed | ui-sanity-visual-review.md |
| 6 | screenshot coverage | 11 | completed | screenshot-coverage.md + screenshots/*.png |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | VISUAL 総括（3 層評価 / 6 canonical 名 / user-gated 境界） |
| メタ | outputs/phase-11/screenshot-plan.json | `mode: "VISUAL"` / 6 canonical 名（作成済み・上書き禁止） |
| メタ | outputs/phase-11/phase11-capture-metadata.json | taskId / 各 screenshot の name/tc/route/viewport/state（作成済み・上書き禁止） |
| ドキュメント | outputs/phase-11/manual-test-result.md | 証跡の主ソース + NON実capture理由メタ + 手動確認チェックリスト |
| ドキュメント | outputs/phase-11/ui-sanity-visual-review.md | VISUAL 宣言 + 6 screenshot の意図と AC 対応の視覚レビュー基準 |

## 完了条件

- [ ] `screenshot-plan.json` が `mode: "VISUAL"` で 6 canonical 名を固定している（作成済み・整合確認）
- [ ] `phase11-capture-metadata.json` が `taskId` と各 screenshot の `{name, tc, route, viewport, state}` を持ち、canonical 名が screenshot-plan.json と一致している（作成済み・整合確認）
- [ ] 3 層評価（Semantic / Visual / AI UX）が main.md に固定されている
- [ ] capture script の `try/finally { browser.close(); server.close(); }` パターンが明記されている（FB-MSO-003）
- [ ] `manual-test-result.md` に証跡の主ソース（focused vitest 結果）と authenticated staging screenshot pending 理由が冒頭メタとして書かれている
- [ ] `ui-sanity-visual-review.md` の冒頭に VISUAL 宣言があり、6 screenshot の意図と AC 対応が記録されている
- [x] 実 capture が user-gated であり、6 PNG が取得済みであることが明記されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] outputs/phase-11/* の成果物（main.md / manual-test-result.md / ui-sanity-visual-review.md + 作成済み 2 json）が実体ファイルとして配置済み
- [ ] screenshot canonical 名が screenshot-plan.json と phase11-capture-metadata.json で完全一致している（不一致 0 件）
- [ ] VISUAL 宣言と user-gated capture 境界が記録されている
- [ ] 既存 `outputs/phase-11/*.json` を上書きしていない（読んで整合させるのみ）
- [x] artifacts.json の Phase 11 ステータスが completed に整合している

## 次Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ事項: screenshot canonical 名 6 件 / 3 層評価観点 / user-gated capture 境界
- ブロック条件: capture 対象または canonical 命名が未確定の場合、または 2 json と本 Phase の canonical 名が不一致の場合は本 Phase に留まる

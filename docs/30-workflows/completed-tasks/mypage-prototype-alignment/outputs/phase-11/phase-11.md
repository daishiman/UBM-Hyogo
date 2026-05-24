# Phase 11: 手動テスト（3層評価 / VISUAL）

> workflow: mypage-prototype-alignment
> **タスク種別: UI task（VISUAL）** — screenshot 必須。Phase 1 §1.1 の分類（UI task / VISUAL）を再確認済み、変更なし。
> 撮影は後続実装サイクル（`03.実装.md`）で行う前提。本仕様書では撮影計画・canonical screenshot 名・3層評価の観点・Playwright 撮影手順を定義する。

## 11.1 タスク種別宣言（冒頭固定）

本タスクは **VISUAL タスク**である。`/profile` の UI コンポーネント（page-head / status banner / visibility summary / profile preview / fields / danger-zone / RevalidateModal / MemberHeader 動線）を追加・変更するため、Phase 11 では representative state の screenshot 撮影と Apple UI/UX 視覚レビューを必須とする。`screenshots/.gitkeep` は VISUAL タスクのため保持する（実 PNG は実装サイクルで配置）。

## 11.2 canonical screenshot 名（`<component>-<state>.png`）

screenshot ファイル名は以下 4 か所で同一 canonical 値を共有する（[FB-LLM-MOD-05-001]）:
1. 本ファイル（テストケース表 / 画面カバレッジマトリクス）
2. capture script のファイル名定数
3. `phase11-capture-metadata.json`（`file` / `output` フィールド）
4. `outputs/phase-12/implementation-guide.md`（Phase 11 screenshot 参照）

| canonical 名 | 対象コンポーネント | 状態 | tc |
|--------------|-------------------|------|----|
| `profile-page-default.png` | `/profile` ページ全体 | デフォルト表示（7 領域すべて） | TC-11-01 |
| `status-banner-public.png` | StatusBanner | publishState=public（success tone） | TC-11-02 |
| `visibility-summary.png` | VisibilitySummary | Stat grid-3（public/member/admin 件数） | TC-11-03 |
| `revalidate-modal-open.png` | RevalidateModal | open 状態（フォームを開く CTA 表示） | TC-11-04 |
| `member-header-nav.png` | MemberHeader | nav 展開（マイページ / 公開ページ / ログアウト） | TC-11-05 |

> 内部テストケース番号（TC-11-NN）は `phase11-capture-metadata.json` の `tc` フィールドにのみ残し、ファイル名には使わない。canonical 名は Phase 1/4 で確定済みとして drift させない。

## 11.3 screenshot-plan.json（`mode: "VISUAL"`）

`outputs/phase-11/screenshot-plan.json` を実装サイクルで以下構造で生成する（[Feedback W1-02b-1] により `mode: "VISUAL"` をデフォルト）:

```json
{
  "mode": "VISUAL",
  "taskId": "mypage-prototype-alignment",
  "baseUrl": "http://127.0.0.1:3000",
  "route": "/profile",
  "viewport": { "width": 1280, "height": 900 },
  "shots": [
    { "tc": "TC-11-01", "name": "profile-page-default.png", "selector": "main[data-route='member']", "fullPage": true },
    { "tc": "TC-11-02", "name": "status-banner-public.png", "selector": "[aria-label='公開状態']", "fullPage": false },
    { "tc": "TC-11-03", "name": "visibility-summary.png", "selector": "[aria-label='公開範囲サマリ']", "fullPage": false },
    { "tc": "TC-11-04", "name": "revalidate-modal-open.png", "selector": "[role='dialog']", "fullPage": false, "action": "openRevalidateModal" },
    { "tc": "TC-11-05", "name": "member-header-nav.png", "selector": "[data-testid='member-header']", "fullPage": false }
  ]
}
```

> `taskId` は現行タスク ID（`mypage-prototype-alignment`）と一致させる。着手前に `jq '.taskId' outputs/phase-11/phase11-capture-metadata.json` で確認する。

## 11.4 phase11-capture-metadata.json（実装サイクルで生成）

撮影実行時の evidence inventory。各 shot の `tc` / `file` / `output` / 撮影日時 / viewport を記録する。`file` と `output` は §11.2 の canonical 名と完全一致させる。

```json
{
  "taskId": "mypage-prototype-alignment",
  "mode": "VISUAL",
  "capturedAt": "<実装サイクルで記入>",
  "shots": [
    { "tc": "TC-11-01", "file": "profile-page-default.png", "output": "screenshots/profile-page-default.png" },
    { "tc": "TC-11-02", "file": "status-banner-public.png", "output": "screenshots/status-banner-public.png" },
    { "tc": "TC-11-03", "file": "visibility-summary.png", "output": "screenshots/visibility-summary.png" },
    { "tc": "TC-11-04", "file": "revalidate-modal-open.png", "output": "screenshots/revalidate-modal-open.png" },
    { "tc": "TC-11-05", "file": "member-header-nav.png", "output": "screenshots/member-header-nav.png" }
  ]
}
```

## 11.5 3層評価マトリクス

### Semantic 層（アクセシビリティ / 構造）

| 観点 | 確認内容 | 期待 |
|------|----------|------|
| aria-label / role | 各領域の `<section aria-label="...">`、StatusBanner の role=status/alert（tone 連動）、RevalidateModal の `aria-modal` | 全領域に意味ある aria-label。Modal は focus trap + Escape |
| 見出し階層 | h1（page-head「マイページ」）→ 各領域 h2 の階層が飛ばない | h1 → h2 が論理順。skip なし |
| 無効リンクの semantic | 「公開ページを見る」が hidden/member_only 時 `aria-disabled="true"` + 理由 title | スクリーンリーダーで無効理由が読める |
| キーボード操作 | RevalidateModal の open/close（Escape / backdrop / キャンセル）、フォーカス可視 | 全 dismiss 経路でキーボード到達可能 |

### Visual 層（OKLch tokens / prototype リズム / レスポンシブ）

| 観点 | 確認内容 | 期待 |
|------|----------|------|
| OKLch tokens 適用 | 全配色が `tokens.css` の OKLch 変数経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件 | `verify-design-tokens` gate PASS |
| prototype 余白リズム再現 | page-head / Card / Stat grid / danger-zone の spacing が `pages-member.jsx` MyProfilePage（L219-371）のリズムと一致 | 余白・grid gap が prototype 準拠 |
| レスポンシブ | desktop（1280px）/ mobile（375px）で Stat grid-3 が縦積みへ、btn-row が折り返す | 両 viewport で破綻なし |
| hierarchy / primary action | primary（情報を更新する）と destructive（公開停止/退会）が視覚的に分離 | 主要アクションが一目で分かる |

### AI UX 層（編集導線の発見性 / 公開状態の理解しやすさ / Apple HIG）

| 観点 | 確認内容 | 期待 |
|------|----------|------|
| 編集導線の発見性 | 「情報を更新する」が page-head に primary で配置され、fields 近傍にも inline 導線がある。RevalidateModal が「Form 再回答」モデルを文言で説明 | 初見ユーザーが「どこから更新するか」を迷わない |
| 公開状態の理解しやすさ | StatusBanner（tone で公開/会員限定/非公開）+ VisibilitySummary（件数）で「自分が今どう見えるか」が把握できる | 公開状態が1画面で把握可能 |
| Apple HIG 観点 | hierarchy 明確 / contrast 十分 / whitespace 自然 / destructive と primary 非混在 / dismiss 導線が視覚追跡可能（§phase-11-screenshot-guide Apple UI/UX 観点） | HIG チェックリスト全項目クリア |

## 11.6 Playwright 撮影手順（実装サイクルで実行）

撮影は OpenNext/Next.js dev server + Playwright で行う。ポート解放を確実にするため `try { ... } finally { browser.close(); server.close(); }` パターンを標準とする。

```
1. dev server 起動: mise exec -- pnpm --filter @ubm-hyogo/web dev（127.0.0.1:3000）
   - 認証セッションが必要なため、テストアカウント（一般会員）でログイン状態を用意するか、
     msw / mock セッションで /profile を render する。
2. 疎通確認: curl -I http://127.0.0.1:3000/profile
3. capture: Playwright で screenshot-plan.json の各 shot を撮影
   - RevalidateModal は action="openRevalidateModal"（「情報を更新する」click → [role='dialog'] 待機）後に撮影
   - responsive で desktop/mobile DOM が同時存在する場合は visible container を特定してから selector 適用（strict mode 回避）
4. finally: browser.close() / server.close() でポート解放
5. validate: node .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js
```

撮影スクリプト雛形（責務: capture のみ、判定はしない）:

```javascript
const { chromium } = require("playwright");
async function main() {
  const browser = await chromium.launch();
  let server; // dev server ハンドル（別起動の場合は null）
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto("http://127.0.0.1:3000/profile", { waitUntil: "networkidle" });
    await page.locator("main[data-route='member']").screenshot({ path: "screenshots/profile-page-default.png" });
    await page.getByRole("button", { name: "情報を更新する" }).first().click();
    await page.locator("[role='dialog']").waitFor();
    await page.locator("[role='dialog']").screenshot({ path: "screenshots/revalidate-modal-open.png" });
    // ... 残り shot
  } finally {
    await browser.close();
    if (server) await new Promise((r) => server.close(r));
  }
}
main();
```

> CAPTURE_BLOCKED（dev server 起動不可 / 認証セッション用意不可）の場合は、ダミー PNG 作成を禁止（false green 防止）し、component test / unit test の PASS を代替 evidence として記録、`docs/30-workflows/unassigned-task/` に capture 未完を formalize する。

## 11.7 画面カバレッジマトリクス

| 領域（Phase 2 topology） | screenshot | Semantic | Visual | AI UX |
|--------------------------|------------|----------|--------|-------|
| ProfileHeader（page-head + 動線） | `profile-page-default.png` | ✅ | ✅ | ✅（編集導線発見性） |
| StatusBanner | `status-banner-public.png` | ✅（role） | ✅（tone） | ✅（公開状態理解） |
| VisibilitySummary | `visibility-summary.png` | ✅ | ✅（grid-3） | ✅（公開状態理解） |
| ProfilePreview | `profile-page-default.png` | ✅ | ✅（Avatar） | — |
| ProfileFields | `profile-page-default.png` | ✅ | ✅（Card/KVList） | — |
| RevalidateModal | `revalidate-modal-open.png` | ✅（aria-modal） | ✅ | ✅（編集導線発見性） |
| RequestActionPanel（danger-zone） | `profile-page-default.png` | ✅ | ✅（destructive 分離） | ✅（HIG） |
| MemberHeader 動線 | `member-header-nav.png` | ✅ | ✅ | ✅ |

## 11.8 フィードバックループ（HIGH 問題は BLOCKER）

- 3層評価で `HIGH`（重大）問題を発見した場合、本タスクの `BLOCKER` として Phase 10 へ差し戻す。未タスク化で先送りしない。
- 例: OKLch 違反（HEX 残存）、Modal の focus trap 不全、公開状態が読み取れない、編集導線が発見不能 — これらは HIGH。
- `MINOR`（改善推奨だが機能影響なし）は同一サイクル修正を先に検討し、修正すると破綻する場合だけ Phase 12 Task 12-4 の MINOR 追跡テーブルへ理由付きで記録する。
- 環境起因のブロッカー（dev server 起動不可等）は製品コードの問題と分離して記録する（[WEEKGRD-01]）。

## 11.9 必須証跡（実装サイクルで生成）

| 成果物 | パス | 状態 |
|--------|------|------|
| 手動テスト結果（正本） | `outputs/phase-11/manual-test-result.md` | 実装サイクルで作成 |
| 手動テストレポート | `outputs/phase-11/manual-test-report.md` | 実装サイクルで作成 |
| 発見課題 | `outputs/phase-11/discovered-issues.md` | 実装サイクルで作成（0 件でも記録） |
| 視覚レビュー | `outputs/phase-11/ui-sanity-visual-review.md` | 実装サイクルで作成（Apple UI/UX 観点） |
| 撮影計画 | `outputs/phase-11/screenshot-plan.json`（`mode: "VISUAL"`） | 実装サイクルで作成 |
| 撮影メタデータ | `outputs/phase-11/phase11-capture-metadata.json` | 実装サイクルで作成 |
| screenshot | `outputs/phase-11/screenshots/*.png`（§11.2 の 5 枚） | 実装サイクルで配置 |

> 本仕様書段階では `screenshots/.gitkeep` のみ存在（VISUAL タスクのためディレクトリ保持）。実 PNG は撮影実行時に配置する。

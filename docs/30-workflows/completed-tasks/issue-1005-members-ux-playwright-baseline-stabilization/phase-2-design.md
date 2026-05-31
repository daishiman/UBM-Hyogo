<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 2 -->

[実装区分: 実装仕様書]

# Phase 2 — 設計

## 1. 全体方針

既存 `isMembersPrototypeAlignment` 分岐（ready URL を `/login` にして cold-compile を起動時に強制する先行例）と同型の `isMembersUxClarityBaseline` 分岐を `playwright.config.ts` に追加する。これにより config 側で「webServer 起動完了 = `/members` compile 完了」を保証し、spec 側にも二重防御として `beforeAll` warm-up を入れる。出力先 path は補正し、evidence flag 未設定時は冗長 project 実行を除外する。

## 2. `apps/web/playwright.config.ts` 差分設計

### 2.1 evidence flag 追加（既存 `is*` フラグ群に追従）

```ts
const isMembersUxClarityBaseline =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'members-ux-clarity-baseline' ||
  process.argv.some((arg) => arg.includes('members-ux-clarity.spec.ts'))
```

> 既存 `isMembersPrototypeAlignment`（L57-60）と同じ「env flag OR argv 部分一致」パターン。standalone 実行（`playwright test apps/web/playwright/tests/members-ux-clarity.spec.ts`）で必ず true になる。

### 2.2 EVIDENCE_DIR 分岐（補正後 path）

`EVIDENCE_DIR` の三項演算子チェーンに以下を追加する（`isMembersPrototypeAlignment` の隣）:

```ts
: isMembersUxClarityBaseline
  ? '../../docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11'
```

> evidence は元 workflow の completed-tasks dir 配下（`members-list-ux-clarity/outputs/phase-11`）へ集約する。これにより config 経由の `PLAYWRIGHT_SCREENSHOT_DIR`（dev server env）と spec 側 `workflowRoot` の指す先を一致させる。

### 2.3 webServer ready URL の `/members` 化

```ts
const localServerReadyURL =
  isTask18RegressionGate ||
  isAttendanceVisualSmoke ||
  isMembersPrototypeAlignment ||
  isPublicDashboardPrototypeAlignment
    ? `${localBaseURL}/login`
    : isMembersUxClarityBaseline
      ? `${localBaseURL}/members`
      : localBaseURL
```

> Playwright の webServer は `url` が 200 を返すまで test を開始しない。`/members` を ready URL にすると、dev server 起動完了時点で `/members` の on-demand compile が済んでおり、RC-1 の cold-compile race を根本から除去する。

### 2.4 webServer command 分岐（webpack 明示）

`isMembersPrototypeAlignment` と同様、`next dev --webpack` を明示する分岐を追加（`dev:webpack` でも可だが、ポート明示で既存先行例に合わせる）:

```ts
: isMembersUxClarityBaseline
  ? `${localEnv} pnpm --filter @ubm-hyogo/web exec next dev --webpack -p ${localPort}`
```

### 2.5 冗長 project 実行の除外（RC-3）

evidence flag 未設定時は default 3 project から除外する。`fixtureGatedTestIgnore` と同じ仕組みを使う:

```ts
if (!isMembersUxClarityBaseline) {
  fixtureGatedTestIgnore.push('**/members-ux-clarity.spec.ts')
}
```

> `fixtureGatedTestIgnore` は desktop-chromium / desktop-firefox / mobile-webkit / staging の各 `testIgnore` に既に spread されている（L194 等）。これにより通常 run では実行されず、evidence run（flag true）時のみ desktop-chromium project で 1 回実行される。
>
> evidence run 時の単一 project 実行を担保するため、`members-ux-clarity.spec.ts` を mobile-webkit / desktop-firefox の `testIgnore` にも明示追加し、desktop-chromium のみで撮る。

### 2.6 config 不変条件

- `workers: 1`（shared mock-api state の競合回避）は維持。
- `expect.toHaveScreenshot.maxDiffPixelRatio` 等の既存値は変更しない。
- 既存 evidence flag（`isMembersPrototypeAlignment` 等）の挙動を一切変えない（追加のみ）。

## 3. `members-ux-clarity.spec.ts` 差分設計

### 3.1 `workflowRoot` path 補正 + env override（RC-2）

```ts
const workflowRoot =
  process.env.MEMBERS_UX_EVIDENCE_DIR !== undefined
    ? resolve(process.env.MEMBERS_UX_EVIDENCE_DIR)
    : join(
        process.cwd(),
        "../../docs/30-workflows/completed-tasks/members-list-ux-clarity",
      );
```

> ハードコードを補正後 path（`completed-tasks/...`）へ変更し、将来の dir 移動に備えて env override を許容する。override は `resolve()` で絶対/相対パス双方を正規化する。`screenshotDir` / `runtimeNotesPath` は `workflowRoot` 由来のため自動追従する。

### 3.2 `beforeAll` warm-up navigation（RC-1 二重防御）

matrix 開始前に `/members` と空状態クエリへ 1 回ずつ navigate し、route compile と mock API readiness を確定させる:

```ts
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto("/members", { waitUntil: "domcontentloaded" });
    await page.getByRole("search", { name: "メンバー絞り込み" }).waitFor({ state: "visible", timeout: 60_000 });
    await page.goto("/members?q=zzz_no_match_zzz", { waitUntil: "domcontentloaded" });
    await page.locator('[data-component="empty-state"]').waitFor({ state: "visible", timeout: 60_000 });
  } finally {
    await page.close();
  }
});
```

> config 側 ready URL `/members` と合わせ、初回コンパイル race を排除。`beforeAll` は `mockApi` fixture に依存できないため `browser` から page を生成する（mock API は `ensureMockApi()` が各 test fixture で起動する。warm-up は compile 目的のため SSR 描画到達で十分）。
> 注: `baseURL` は config の `use.baseURL` で解決されるため相対 `/members` で良い。

### 3.3 runtime-notes 文言更新（RC-4）

`afterAll` の runtime-notes に「cold start で direct script 補完不要」「warm-up は config ready URL `/members` + `beforeAll` で担保」を追記する:

```ts
"- Stabilized: cold start passes without direct-script complement (config ready URL `/members` + spec beforeAll warm-up).",
"- Evidence path: docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/.",
```

### 3.4 既存ロジックの保持

- `expandFiltersIfCollapsed` の hydration retry（3 回）はそのまま維持（filter expand の race は別レイヤー）。
- viewport / density matrix、screenshot 命名、`mask: pagination-meta` は変更しない（baseline 互換維持）。

## 4. データフロー（warm-up 防御の2層）

```
[config webServer] 起動
   └─ ready URL /members が 200 を返すまで待機  ← RC-1 第1層（route compile 完了保証）
       └─ Playwright test 開始
            └─ beforeAll: /members + empty クエリへ warm navigate  ← RC-1 第2層（SSR/hydration 確定）
                 └─ matrix 12 test 実行 → 24 PNG を補正後 path へ出力  ← RC-2
                      └─ afterAll: runtime-notes（補完不要を明記）  ← RC-4
```

## 5. 入出力・副作用

- 入力: なし（mock API が固定 fixture を返す。`/members?...&tag=ai` / `?q=zzz_no_match_zzz` の query）。
- 出力（副作用）: 24 PNG + `runtime-notes.md` を `completed-tasks/members-list-ux-clarity/outputs/phase-11/` 配下へ書き込み。
- ネットワーク: local mock API（127.0.0.1:8787）のみ。外部通信なし。

## DoD

- [x] config の 5 箇所差分（flag / EVIDENCE_DIR / ready URL / command / testIgnore）を設計
- [x] spec の 3 箇所差分（workflowRoot / beforeAll / runtime-notes）を設計
- [x] warm-up を config + spec の 2 層で defense する根拠を明示
- [x] baseline 互換（命名 / mask / matrix）維持を明記

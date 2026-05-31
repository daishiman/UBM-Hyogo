<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 5 -->

[実装区分: 実装仕様書]

# Phase 5 — 実装手順

## 1. 変更対象ファイル一覧（CONST_005-1）

| パス | 変更種別 |
|------|---------|
| `apps/web/playwright.config.ts` | 編集（追加分岐のみ） |
| `apps/web/playwright/tests/members-ux-clarity.spec.ts` | 編集（path 補正 + warm-up + notes 文言） |

> 新規ファイルは作らない（INV-5）。API・D1・Google Form 仕様は不変（INV-1）。

## 2. 主要差分の構造／シグネチャ（CONST_005-2）

### config 側 5 箇所（既存 `isMembersPrototypeAlignment` L57-60 を先行例とする）

**step 1. evidence flag 追加**（既存 `is*` flag 群の直後に追記）

```ts
const isMembersUxClarityBaseline =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'members-ux-clarity-baseline' ||
  process.argv.some((arg) => arg.includes('members-ux-clarity.spec.ts'))
```

**step 2. EVIDENCE_DIR 三項チェーンに分岐追加**（`isMembersPrototypeAlignment` 分岐の隣）

```ts
: isMembersUxClarityBaseline
  ? '../../docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11'
```

**step 3. `localServerReadyURL`（L106-112）に `/members` 分岐追加**

```ts
const localServerReadyURL =
  isTask18RegressionGate ||
  isAttendanceVisualSmoke ||
  isMembersPrototypeAlignment ||
  isMembersUxClarityBaseline ||
  isPublicDashboardPrototypeAlignment
    ? isMembersUxClarityBaseline
      ? `${localBaseURL}/members`
      : `${localBaseURL}/login`
    : localBaseURL
```

**step 3.5. members UX clarity の webServer timeout を 180s に拡張**

```ts
timeout: isAttendanceVisualSmoke || isMembersUxClarityBaseline ? 180_000 : 120_000
```

**step 4. webServer command に webpack 明示分岐追加**（`isMembersPrototypeAlignment` と同型）

```ts
: isMembersUxClarityBaseline
  ? `${localEnv} pnpm --filter @ubm-hyogo/web exec next dev --webpack -p ${localPort}`
```

**step 5. 冗長 project 除外（RC-3）**（`fixtureGatedTestIgnore` 定義の直後）

```ts
if (!isMembersUxClarityBaseline) {
  fixtureGatedTestIgnore.push('**/members-ux-clarity.spec.ts')
}
```

加えて、evidence run 時の単一 project 実行を担保するため、`members-ux-clarity.spec.ts` を
**desktop-firefox / mobile-webkit project の `testIgnore` 配列にも明示追加**し（`fixtureGatedTestIgnore` の spread に続けて）、desktop-chromium のみで撮影する。

### spec 側 3 箇所

**step 6. `workflowRoot` 補正 + env override（RC-2）**

```ts
const workflowRoot =
  process.env.MEMBERS_UX_EVIDENCE_DIR !== undefined
    ? resolve(process.env.MEMBERS_UX_EVIDENCE_DIR)
    : join(
        process.cwd(),
        "../../docs/30-workflows/completed-tasks/members-list-ux-clarity",
      );
```

> 旧 `docs/30-workflows/members-list-ux-clarity`（stale）から `completed-tasks/...` へ補正。`MEMBERS_UX_EVIDENCE_DIR` は `resolve()` で絶対/相対パス双方を受ける。`screenshotDir` / `runtimeNotesPath` は `workflowRoot` 由来で自動追従する。

**step 7. `beforeAll` warm-up navigation（RC-1 二重防御）**（matrix test の前に追加）

```ts
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto("/members", { waitUntil: "domcontentloaded" });
    await page
      .getByRole("search", { name: "メンバー絞り込み" })
      .waitFor({ state: "visible", timeout: 60_000 });
    await page.goto("/members?q=zzz_no_match_zzz", { waitUntil: "domcontentloaded" });
    await page
      .locator('[data-component="empty-state"]')
      .waitFor({ state: "visible", timeout: 60_000 });
  } finally {
    await page.close();
  }
});
```

> `beforeAll` は fixture（`mockApi`）に依存できないため `browser` から page 生成。warm-up は compile 確定が目的で SSR 到達で十分。

**step 8. mobile filter expansion fallback（RC-5）**

```ts
await summary.click();
await expect(root).toHaveAttribute("data-expanded", "true", { timeout: 3_000 });
await expect(body).toBeVisible({ timeout: 3_000 });
```

クリック state が cold-start hydration 直後に反映されない場合は、visual baseline 取得目的に限定して
`data-expanded="true"` / `aria-expanded="true"` を DOM 属性で固定する。toggle 挙動は component test の責務。

**step 9. `afterAll` runtime-notes 文言更新（RC-4）**（既存 notes 配列に行追加）

```ts
"- Stabilized: cold start passes without direct-script complement (config ready URL `/members` + spec beforeAll warm-up).",
"- Evidence path: docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/.",
```

### fallback（ready URL が 5xx を返す場合）

config step 3 の `/members` 分岐を削除して既存 default（`localBaseURL` = `/`）に戻し、RC-1 防御を spec step 7 の `beforeAll` warm-up のみに委ねる。この場合も AC-1〜AC-5 は warm-up 単層で成立する想定。

## 3. 入力・出力・副作用（CONST_005-3）

- 入力: なし（mock API が固定 fixture を返す。query `?...&tag=ai` / `?q=zzz_no_match_zzz`）。
- 出力（副作用）: 24 PNG + `runtime-notes.md` を `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/` 配下へ書き込み。
- ネットワーク: local mock API（127.0.0.1:8787）のみ。外部通信なし。

## 4. テスト方針（CONST_005-4）

- 新規 test ファイルは作らない（INV-5）。検証 step は Phase 4 / Phase 6 を参照。
- 既存 spec の matrix（4 viewport × 3 density × 2 state = 12 test / 24 PNG）と命名・mask は不変。

## 5. ローカル実行・検証コマンド（CONST_005-5）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
# cold start 検証（CI 相当で reuseExistingServer 無効化）
CI=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-ux-clarity.spec.ts --project=desktop-chromium
# PNG 数確認
find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots -name 'members-ux-clarity-*.png' | wc -l
# 旧 dir 非生成確認
test ! -d docs/30-workflows/members-list-ux-clarity && echo OK
```

## DoD（CONST_005-6）

- [ ] build / typecheck / lint GREEN
- [ ] cold start で 24 PNG が spec 本体から生成（direct script 補完不要）
- [ ] PNG / runtime-notes が補正後 path（completed-tasks/.../outputs/phase-11）へ出力
- [ ] 旧 `docs/30-workflows/members-list-ux-clarity/` を新規生成しない
- [ ] evidence run が単一 project（desktop-chromium）で 1 回実行
- [ ] config の既存 flag・default project 挙動が無変更

# Phase 4: テスト計画（TDD Red 設計）

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09 / mode: `new`

## 0. 入口 gate（Phase 3 §6 由来）

| 項目 | 確認手段 | 結果 |
|------|---------|------|
| Q1: `GET /api/me` の actual response shape | `apps/web/src/app/profile/page.tsx` および client component の Read | Phase 4 §3 に記録 |
| Q2: `responseEmail` を含む fixture seed 不足 | `apps/web/playwright/fixtures/d1-seed.ts` の Read | §4 で受容方針確定 |
| Q3: `auth.ts` `signSession` TODO_PLACEHOLDER | 既存 spec も同条件で運用 | 対象外、Phase 8 §R-4 観測のみ |

## 1. テスト計画スコープ

| サブタスク | spec ファイル | 追加 test 件数 | TDD フェーズ |
|-----------|--------------|---------------|-------------|
| 1a | `apps/web/playwright/tests/public-flow.spec.ts:42` | 1 | Red（assertion から先行） |
| 1b-A | `apps/web/playwright/tests/profile-visibility-request.spec.ts:78` | 1 | Red |
| 1b-B | `apps/web/playwright/tests/profile-delete-request.spec.ts:61` | 1 | Red |

## 2. TDD Red 段階の前提

本サイクルは E2E 既存 spec への regression assertion 追加であり、production code は変更しない（CONST_007 / index.md §範囲外）。Red 段階は次のいずれかが成立すれば達成とみなす:

| Red 達成パターン | 例 |
|-----------------|----|
| 既知欠陥が露出して fail | `responseEmail` が API response にあり public route に漏れている場合 |
| sentinel 不在で vacuous pass（受容） | leak が無く `not.toContainText` が trivially pass — Phase 1 §5 / Phase 3 R-1 で受容 |
| mock が hook され state が persist | 1b は production 実装が server-driven なら pass、client-only なら fail |

> Red→Green 強制ではなく「regression-guard が成立するか」を Phase 7-8 で観測する。

## 3. `GET /api/me` shape 確定（Q1）

| 項目 | 値 / 出典 |
|------|----------|
| endpoint | `GET /api/me`（`apps/api/src/routes/me.ts` 想定） |
| response 想定 shape | `{ profile: {...}, pendingRequests: Array<{queueId: string, type: 'visibility_request' \| 'delete_request', status: 'pending' \| 'processing', createdAt: string}> }` |
| profile 画面 fetch 経路 | `apps/web/src/app/profile/page.tsx` の server component or client hook（Phase 4 実装着手時に Read で確定） |
| mock pattern | `page.route('**/api/me', route => route.fulfill({...}))` |

> shape 確認は phase-5 着手 1st action で実施。差異があれば本 phase doc を retro-fit せず phase-5 §1 に diff を残す。

## 4. fixture seed 戦略（Q2）

| 戦略 | 採否 | 理由 |
|------|------|-----|
| `d1-seed.ts` に `LEAK_PROBE_EMAIL` 持ち member を追加 | 不採用（本 stage） | seed 拡張は副作用大、Stage 2 以降の課題に送る |
| spec 内定数のみ（vacuous 受容） | 採用 | regression-guard として未来の seed 拡張時に自動的に有効化される |
| Phase 12 未タスク化 | yes | 「Stage 2: leak fixture seed 拡張」を未タスクへ |

## 5. test file list と挿入位置

| spec | 挿入位置（line） | 形式 |
|------|----------------|------|
| `public-flow.spec.ts` | `:42` 直前（describe 閉じ前） | `test('regression: responseEmail must not leak on public routes', async ({ anonymousPage }) => {...})` |
| `profile-visibility-request.spec.ts` | `:78` 直前 | `test('TC-E-07: visibility pending sticky after round-trip', async ({ memberPage }) => {...})` |
| `profile-delete-request.spec.ts` | `:61` 直前 | `test('TC-E-10: delete pending sticky after round-trip', async ({ memberPage }) => {...})` |

## 6. API mock pattern（1b 共通）

```ts
// spec ファイル冒頭付近に inline 配置（CONST_007 単一サイクル原則）
async function mockMeWithPending(
  page: Page,
  type: 'visibility_request' | 'delete_request',
) {
  await page.route('**/api/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: { /* minimal */ },
        pendingRequests: [
          {
            queueId: `mock-${type}-1`,
            type,
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    });
  });
}
```

| 観点 | 値 |
|------|----|
| route pattern | `**/api/me`（末尾 `/` 無し / query 無し） |
| 登録タイミング | submit 202 直後・round-trip `goto('/')` 前 |
| 解除 | Playwright auto-unroute（test 終了時） |

## 7. assertion 設計

### 1a

| step | 操作 | assertion |
|------|------|----------|
| 1 | `anonymousPage.goto('/')` | `expect(body).not.toContainText(LEAK_PROBE_EMAIL)` |
| 2 | `goto('/members')` | 同上 + `expect(body).not.toContainText(/@/)` |
| 3 | `goto('/members/m-1')` | 同上 |

### 1b-A / 1b-B

| step | 操作 | assertion |
|------|------|----------|
| 1 | `memberPage.goto('/profile')` | `[data-pending-type=<type>]` 不在 |
| 2 | submit + 202 mock | `[data-pending-type=<type>]` visible |
| 3 | `mockMeWithPending(page, type)` 登録 | — |
| 4 | `goto('/')` → `goto('/profile')` | `[data-pending-type=<type>]` 依然 visible |

## 8. 命名規則整合チェック

| 規則 | 出典 | 本 phase 整合 |
|------|------|--------------|
| `regression: <failure-mode> <route>` | Phase 1 §1a-4 | OK |
| `TC-E-<num>: <subject>` | Phase 1 §1b-4 | OK（07 / 10 採番） |
| `LEAK_PROBE_EMAIL` UPPER_SNAKE | Phase 1 §1a-4 | OK |
| `mockMeWithPending` camelCase helper | Phase 2 §2 | OK |

## 9. flaky 抑制策

| リスク | 対策 |
|-------|------|
| `/@/` regex で footer email に hit | 初回 sentinel-only に縮退（probe は assertion comment で disable トグル可能な構造） |
| round-trip 後の hydration race | `await expect(locator).toBeVisible({ timeout: 5000 })` で標準 wait |
| mock 順序ずれ | `await page.route(...)` を必ず `goto` 前に await |

## 10. Phase 5 入口条件

- [ ] 本 phase の挿入位置 line が production code 改修なしで insertable と確認済
- [ ] `mockMeWithPending` helper 雛形を spec に inline 配置可能
- [ ] `LEAK_PROBE_EMAIL` 定数値が確定（`system+responseEmail@example.test`）

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 4
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。


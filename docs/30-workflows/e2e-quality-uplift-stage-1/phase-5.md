# Phase 5: テスト実装（Red 着地）

> workflow: `e2e-quality-uplift-stage-1` / 着手日: 2026-05-09 / `implementation_mode: "new"`

## 1. 編集対象ファイル一覧

| ファイル | 種別 | 触る行 | 差分量 |
|---------|------|-------|-------|
| `apps/web/playwright/tests/public-flow.spec.ts` | 編集 | `:42` 直前に test 追加・冒頭に `LEAK_PROBE_EMAIL` 定数追加 | +25 行前後 |
| `apps/web/playwright/tests/profile-visibility-request.spec.ts` | 編集 | `:78` 直前に TC-E-07 追加・冒頭付近に `mockMeWithPending` helper 追加 | +35 行前後 |
| `apps/web/playwright/tests/profile-delete-request.spec.ts` | 編集 | `:61` 直前に TC-E-10 追加・冒頭付近に `mockMeWithPending` helper 追加 | +35 行前後 |
| `apps/web/playwright/fixtures/auth.ts` | 参照のみ | — | 0 |
| `apps/web/playwright/fixtures/d1-seed.ts` | 参照のみ | — | 0 |
| `apps/web/src/app/profile/page.tsx` | 参照のみ（shape 確認） | — | 0 |
| `apps/api/src/routes/me.ts` | 参照のみ（shape 確認） | — | 0 |

> production code（`apps/api/**`, `apps/web/src/**`）への変更は **絶対に発生させない**。

## 2. 1a 差分概要

| 項目 | 内容 |
|------|------|
| 追加 import | なし（既存 `expect`, `test`, page object のみ） |
| 追加定数 | `const LEAK_PROBE_EMAIL = 'system+responseEmail@example.test';`（`describe` ブロック直前） |
| 追加 test | `test('regression: responseEmail must not leak on public routes', async ({ anonymousPage }) => { ... })` |
| 主要 assertion | `expect(anonymousPage.locator('body')).not.toContainText(LEAK_PROBE_EMAIL)`（3 route） + `not.toContainText(/@/)`（probe） |

## 3. 1b 共通差分（A / B 同形）

| 項目 | 内容 |
|------|------|
| 追加 import | `import type { Page } from '@playwright/test'`（未 import の場合のみ） |
| 追加 helper | `mockMeWithPending(page, type)` を spec ファイル冒頭に inline 定義 |
| 追加 test 名 | A: `TC-E-07: visibility pending sticky after round-trip` / B: `TC-E-10: delete pending sticky after round-trip` |
| 主要 assertion | `await expect(memberPage.locator('[data-pending-type=<type>]')).toBeVisible()`（round-trip 後） |

## 4. test 雛形（実装時の参考スケッチ）

### 4.1 1a — public-flow.spec.ts 追加 test

```ts
const LEAK_PROBE_EMAIL = 'system+responseEmail@example.test';

test('regression: responseEmail must not leak on public routes', async ({ anonymousPage }) => {
  for (const path of ['/', '/members', '/members/m-1']) {
    await anonymousPage.goto(path);
    const body = anonymousPage.locator('body');
    await expect(body).not.toContainText(LEAK_PROBE_EMAIL);
    await expect(body).not.toContainText(/@/);
  }
});
```

### 4.2 1b-A — profile-visibility-request.spec.ts 追加 test

```ts
async function mockMeWithPending(page: Page, type: 'visibility_request' | 'delete_request') {
  await page.route('**/api/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pendingRequests: [{
          queueId: `mock-${type}-1`,
          type,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }],
      }),
    });
  });
}

test('TC-E-07: visibility pending sticky after round-trip', async ({ memberPage }) => {
  // 1. submit + 202 mock（既存 TC-E-01 と同じ pattern）
  // 2. expect [data-pending-type=visibility_request] visible
  // 3. mockMeWithPending(memberPage, 'visibility_request')
  // 4. memberPage.goto('/') → memberPage.goto('/profile')
  // 5. expect [data-pending-type=visibility_request] still visible
});
```

### 4.3 1b-B — profile-delete-request.spec.ts 追加 test

`mockMeWithPending` を同形で配置し、type を `'delete_request'` で実行する。selector は `[data-pending-type=delete_request]`。

## 5. 命名・selector 整合確認

| 規則 | 適用箇所 | 備考 |
|------|---------|------|
| 既存 selector `[data-pending-type=...]` を再利用 | 1b | 新規 testId 追加なし（INV-PROTO 整合） |
| page object 新設なし | 1a | 既存 `HomePage` / `MembersListPage` / `MemberDetailPage` で十分 |
| describe 改変なし | 全 | 既存 describe の閉じ括弧前に append のみ |

## 6. Red 観測ガイド

| 観点 | 期待 |
|------|------|
| 1a が fail | 現実装で `responseEmail` を含む public payload があれば fail（regression 顕在化） |
| 1a が trivially pass | leak が無い場合、vacuous で pass（規定どおり受容） |
| 1b A/B が fail | profile 画面の pending 表示が client-only state に依存している場合 fail |
| 1b A/B が pass | server-driven render が既に実装されていれば pass（regression-guard として残置） |

## 7. CONST_007 単一サイクル整合確認

| 観点 | 結果 |
|------|------|
| 触る spec ファイル | 3（既存） |
| 新規ファイル | 0 |
| production code 変更 | 0 |
| schema 変更 | 0 |
| 新 critical route 範囲 | 既存内（`/`, `/members`, `/members/[id]`, `/profile`） |

## 8. 実装後 self-check

- [ ] `pnpm --filter @ubm/web exec playwright test public-flow profile-visibility-request profile-delete-request` がローカル run 可能
- [ ] 既存 TC-E-01..06 / 09 を破壊していない
- [ ] `git diff main...HEAD --name-only` が 3 ファイルのみを示す
- [ ] `apps/api/**` および `apps/web/src/**` の diff が空

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 5
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


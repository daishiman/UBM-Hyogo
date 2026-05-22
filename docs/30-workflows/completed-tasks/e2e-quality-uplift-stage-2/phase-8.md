# Phase 8: リファクタリング

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 焦点 | 3 spec 共通 helper の抽出 / `page.route()` mock helper |

> 本 Phase は spec 仕様レベルでの「抽出方針」を確定する。実コード抽出は実装タスクで実行。

---

## 1. 抽出対象 helper 一覧

| # | helper 名 | 配置 | 抽出元 spec |
|---|---------|------|-----------|
| 1 | `mockAdminListGet(page, urlPattern, fixture)` | `apps/web/playwright/helpers/admin-mocks.ts` | 2a / 2b / 2c の `beforeEach` 共通 |
| 2 | `mockMutation(page, urlPattern, handler)` | 同上 | POST mutation 系の共通骨子 |
| 3 | `withMutationCounter(page, urlPattern, perCall)` | 同上 | 2a race 検証 / 2b ALREADY_MERGED 検証 |
| 4 | `assertAdminAccess(page, role)` | 同上 | 認可 3 ロール × 3 routes の 9 assertion 共通 |
| 5 | `auditFixture(action, targetId)` | 同上 | 2c audit entry fixture builder |

---

## 2. helper 仕様（型シグネチャ）

| helper | 入力 | 出力 / 副作用 |
|-------|------|-------------|
| `mockAdminListGet` | `page: Page, pattern: string \| RegExp, fixture: unknown` | `page.route()` を登録、JSON 200 で fulfill |
| `mockMutation` | `page: Page, pattern, handler: (req) => { status, body }` | request body assert / fulfill |
| `withMutationCounter` | `page, pattern, perCall: Array<{status, body}>` | 第 N 回呼び出しに応じて分岐 |
| `assertAdminAccess` | `page: Page, role: 'admin'\|'member'\|'anonymous'` | URL/DOM 期待を OR で吸収する `expect.poll` |
| `auditFixture` | `action: string, targetId: string` | `{ auditId, actorId, actorEmail, action, targetType, targetId, createdAt }` |

---

## 3. リファクタの観測可能効果

| 観点 | Before | After |
|------|--------|-------|
| `page.route()` 呼び出し総行数 | 3 spec × 5-7 ブロック ≒ 80 行 | helper 経由で 30 行未満 |
| race counter のロジック重複 | 2a / 2b で 2 箇所 | 1 箇所（helper） |
| 認可 assertion の重複 | 3 spec × 2 ロール = 6 箇所 | 1 helper + 6 呼び出し |
| audit fixture の手書き | 2c に inline | helper 1 箇所 |

---

## 4. 不変条件（リファクタ後も維持）

| # | 不変条件 | 確認方法 |
|---|---------|---------|
| 1 | fixture 追加禁止（`auth.ts` 拡張なし） | helper は **fixture ではなく純関数** |
| 2 | D1 直接アクセスなし | helper は `page.route()` mock のみ |
| 3 | OKLch トークン直書きなし | helper は色値非依存 |
| 4 | spec ファイル名規則維持 | helper 抽出はファイル名に影響しない |
| 5 | TypeScript strict 通過 | `pnpm typecheck` green |

---

## 5. 抽出後の spec 例（before / after）

```text
# Before（2a beforeEach）
test.beforeEach(async ({ adminPage }) => {
  await adminPage.route('**/admin/requests*', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ items: [...] }) })
  })
})

# After
import { mockAdminListGet } from '../helpers/admin-mocks'
test.beforeEach(async ({ adminPage }) => {
  await mockAdminListGet(adminPage, '**/admin/requests*', requestsListFixture)
})
```

---

## 6. リファクタ完了定義

- [x] 抽出対象 5 helper の所在 / シグネチャ確定
- [x] Before / After 比較で重複削減の定量化
- [x] 不変条件 5 件すべて維持
- [x] fixture 追加禁止ルールに違反しない（helper は純関数）

> Phase 9 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 8
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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


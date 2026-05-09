# Phase 5: 実装（TDD Green）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| Implementation Mode | `new` |
| 対象 | sub-task 2a / 2b / 2c / 2d |

> **本ワークフローは spec verified**。本 Phase は「コード実装が完了した状態 = Green」となるための差分概要・受け入れ基準を仕様として確定する。実コード生成は Stage 2 の範囲外で、dependency と evidence を明示する。

---

## 1. 新規/修正ファイル一覧

| # | path | 種別 | 状態 | 行数目安 |
|---|------|------|------|----------|
| 1 | `apps/web/playwright/e2e/admin-requests.spec.ts` | E2E | 新規 | 180-220 |
| 2 | `apps/web/playwright/e2e/admin-identity-conflicts.spec.ts` | E2E | 新規 | 200-240 |
| 3 | `apps/web/playwright/e2e/admin-member-delete.spec.ts` | E2E | 新規 | 180-220 |
| 4 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | Vitest | 新規 | 200-260 |
| 5 | `apps/api/src/routes/admin/member-delete.ts` | route | **既存・参照のみ** | — |

> 修正対象なし。**全 4 ファイルが新規追加**（`implementation_mode: "new"`）。

---

## 2. コード差分概要（spec のみ）

### 2.1 共通骨子

```text
- import { expect } from '@playwright/test'
- import { test } from '../fixtures/auth'
- test.describe('<route> × admin mutation flow', () => { ... })
```

### 2.2 mock helper の所在

| helper | 配置 | Phase 8 で抽出 |
|-------|------|--------------|
| `mockAdminListGet(page, pattern, fixture)` | spec 内 inline → Phase 8 で `apps/web/playwright/helpers/admin-mocks.ts` へ抽出 | Yes |
| `withMutationCounter(page, pattern, handler)` | 同上 | Yes |

> Phase 5 段階では **inline で書く**（重複許容）。Phase 8 リファクタで抽出。

---

## 3. 各 spec の test 構造（実装版）

### 3.1 `admin-requests.spec.ts`

```text
test.describe('/admin/requests × mutation', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.route('**/admin/requests*', fulfillJson(listFixture))
  })
  test('成功系: pending list 表示', ...)
  test('成功系: approve', ...)
  test('成功系: reject + 理由必須', ...)
  test('失敗系: race（二重 approve は 409）', ...)
  test('認可: member は 403 page', ...)
  test('認可: anonymous は /login redirect', ...)
})
```

### 3.2 `admin-identity-conflicts.spec.ts`

```text
test.describe('/admin/identity-conflicts × mutation', () => {
  test.beforeEach(...)  // GET list mock
  test('成功系: 一覧表示', ...)
  test('成功系: merge → targetMemberId 返却', ...)
  test('成功系: dismiss', ...)
  test('DB 整合: merge 後の members 再 fetch', ...)
  test('認可: member 403', ...)
  test('認可: anonymous redirect', ...)
})
```

### 3.3 `admin-member-delete.spec.ts`

```text
test.describe('/admin/members × delete', () => {
  test.beforeEach(...)  // GET list mock
  test('成功系: 二段確認 → 削除', ...)
  test.skip('cascade preview（API 未実装）', ...)  // TODO(stage-3)
  test('失敗系: reason 空 → 422', ...)
  test('audit log entry 連動', ...)
  test('認可: member 403', ...)
  test('認可: anonymous redirect', ...)
})
```

### 3.4 `contract-stage-2.test.ts`

```text
import { describe, expect, test } from 'vitest'
import {
  MergeIdentityRequestZ,
  DismissIdentityConflictRequestZ,
} from '@ubm-hyogo/shared/schemas/identity-conflict'

describe('GET /admin/requests', ...)
describe('POST /admin/requests/:id/resolve', ...)
describe('GET /admin/identity-conflicts', ...)
describe('POST /admin/identity-conflicts/:id/merge', ...)
describe('POST /admin/identity-conflicts/:id/dismiss', ...)
describe('POST /admin/members/:id/delete', ...)
describe('GET /admin/audit', ...)
```

---

## 4. fixture object の標準形（4 spec 共通）

| 名前 | 形 |
|------|-----|
| `adminRequestItem` | `{ noteId, memberId, status:'pending', createdAt }` |
| `identityConflictItem` | `{ id:'<src>:<tgt>', sourceMemberId, targetMemberId, similarity }` |
| `memberDeleteResponse` | `{ id, isDeleted:true, deletedAt }` |
| `auditEntry` | `{ auditId, actorId, action:'admin.member.deleted', targetId, createdAt }` |

> `mergedMemberId` は **使用しない**（Phase 4 §1 Q2 結論）。merge response fixture は `{ targetMemberId, sourceMemberId, mergedAt }`。

---

## 5. Green 達成の受け入れ基準

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | 4 ファイル追加コミット存在 | `git diff --name-only main...HEAD` |
| 2 | `pnpm --filter @ubm-hyogo/web test:e2e` で 4 spec が green | CI log |
| 3 | `pnpm --filter @ubm-hyogo/api test` で contract-stage-2.test.ts が green | CI log |
| 4 | skip された 2c-2 が `test.skip` として明示されている（fail/error ではない） | spec inspect |
| 5 | fixture object に zod parse 失敗 0 件 | contract test 自体の green |

---

## 6. Phase 5 完了定義

- [x] 新規 4 ファイルの path / 行数目安 確定
- [x] test 構造（describe/test 名）が確定
- [x] fixture object の標準形が決定
- [x] 2c-2 が skip + Stage 3 持越しコメント設計済み
- [x] schema は `@ubm-hyogo/shared/schemas` 参照で重複定義なし
- [x] `implementation_mode: "new"` 確認

> Phase 6 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 5
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


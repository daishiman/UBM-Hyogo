# Stage 2 サブタスク 実装仕様書インデックス

| 項目 | 値 |
|------|-----|
| 親 workflow | [`e2e-quality-uplift-stage-2`](../completed-tasks/e2e-quality-uplift-stage-2/index.md) |
| 起点日 | 2026-05-09 |
| Implementation Mode | `new`（4 サブタスクすべて新規） |
| 単一サイクル方針 | CONST_007 適用 — 全 4 仕様書を後続実装プロンプトの **1 サイクル内で完了**させる |

---

## 仕様書一覧

| ID | 仕様書 | 対象成果物（実コード） | 種別 | 行数目安 | 実装区分 |
|----|--------|------------------------|------|---------|---------|
| 2a | [`2a-admin-requests.md`](./2a-admin-requests.md) | `apps/web/playwright/tests/admin-requests.spec.ts` | E2E (Playwright) | 180-220 | 実装仕様書 |
| 2b | [`2b-admin-identity-conflicts.md`](./2b-admin-identity-conflicts.md) | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | E2E (Playwright) | 200-240 | 実装仕様書 |
| 2c | [`2c-admin-member-delete.md`](./2c-admin-member-delete.md) | `apps/web/playwright/tests/admin-member-delete.spec.ts` | E2E (Playwright) | 180-220 | 実装仕様書 |
| 2d | [`2d-contract-stage-2.md`](./2d-contract-stage-2.md) | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | Vitest contract | 200-260 | 実装仕様書 |

---

## 実装区分判定（CONST_004）

親 workflow `artifacts.json` は `taskType: "docs-only"` の仕様書パッケージとして正しい。一方、本サブタスク群が後続実装サイクルで生成させる成果物はすべて **実コード（`.spec.ts` / `.test.ts`）** であるため、CONST_004 の「ラベルより実態優先」原則に従い **すべて実装仕様書として作成**した。各仕様書冒頭にも、parent docs-only と sub-task implementation-spec の境界を明記している。

---

## 並列実行・依存関係

| 仕様書 | 並列可否 | 依存 |
|-------|---------|------|
| 2a | 並列可 | なし |
| 2b | 並列可 | なし（ただし下記 §「正本補正事項」§で fixture shape を 2d 側正本に合わせる） |
| 2c | 並列可 | なし |
| 2d | 2a/2b/2c の fixture object と整合 | route 側 zod schema の `export` を 1 行追加（仕様書 §3 参照） |

> 2a/2b/2c は完全独立で並列実装可。2d は他 3 つの fixture object 形を contract で検証する性質上、最終整合は **CI が green になる時点で同一**となる。

---

## 正本補正事項（実装着手前に確認）

### 1. merge response shape の正本訂正（2b ↔ 2d）

親 workflow の `phase-4.md` §1 Q2 / `phase-5.md` §4 では merge response を `{ targetMemberId, sourceMemberId, mergedAt }` と記載しているが、実体である `packages/shared/src/schemas/identity-conflict.ts:34-39` の `MergeIdentityResponseZ` は次の shape である:

```ts
{
  mergedAt: string,
  targetMemberId: string,
  archivedSourceMemberId: string,  // ← phase-4/5 の sourceMemberId ではない
  auditId: string,                  // ← phase-4/5 に未掲載
}
```

- **正本**: `packages/shared/src/schemas/identity-conflict.ts` の `MergeIdentityResponseZ`
- **2d 仕様書**: 既に shared schema 正本に整合済（§5 / §13 参照）
- **2b 仕様書**: 実装着手時に fixture 形を `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` へ揃えること（仕様書本文の `sourceMemberId` 記述を読み替える）。phase-4/5.md は workflow 側の記述ミスとして 2d の contract test green が決着判定となる
- 親 workflow への補正は本サイクル外（必要なら別 task で phase-4/5 を訂正）

### 2. route 側 zod schema の named export（2d 起点・1 行追加 ×3）

2d contract test を CONST_007（schema 重複定義禁止）で書くため、以下 3 schema を route 内 inline → named `export const` 化する 1 行修正が必要:

| schema | 配置 | 修正方針 |
|--------|------|---------|
| `DeleteBodyZ` | `apps/api/src/routes/admin/member-delete.ts:10` | `export const DeleteBodyZ = ...` に変更 |
| `ListQueryZ` (requests) | `apps/api/src/routes/admin/requests.ts` | named export 化 |
| `QueryZ` (audit) | `apps/api/src/routes/admin/audit.ts` | named export 化 |

> 既に `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` は `packages/shared` で named export 済。`DeleteBodyZ` の shared 昇格は Stage 2 範囲外（phase-4 §1 Q6 結論）。

---

## 受け入れ基準（4 仕様書共通の DoD 集約）

各仕様書の DoD を満たしたうえで、サイクル全体として:

1. 4 ファイル新規追加 + route 側 3 行（named export）差分存在
2. `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e` で 2a/2b/2c が green（cascade preview のみ `test.skip`）
3. `mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` で 2d が green
4. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` 全 pass
5. critical route smoke 成功率 100%、line coverage >= 70%（standard tier）
6. `apps/web` から D1 直接アクセス 0（CLAUDE.md 不変条件 5）
7. 新規 API endpoint・D1 schema 変更・Google Form 仕様変更 0（CLAUDE.md UI alignment 不変条件 1）

---

## 単一サイクル原則（CONST_007）

- 全 4 仕様書 + 上記「正本補正事項」§2 の route 3 行修正は、**後続実装プロンプト（`03.実装.md`）の 1 サイクル内で完了**させる前提
- 先送り対象は次の 1 件のみ（CONST_007 例外条件 1+2 該当）:

| 先送り項目 | 仕様書 | 理由 | 実施場所 |
|-----------|--------|------|---------|
| `cascade preview` test 有効化 | 2c §test 構造表 | API endpoint (`/admin/members/:id/delete-preview`) が **未実装**（grep 0 件、phase-4 §1 Q5）。本サイクルで API を追加すると Stage 2 のスコープ（既存 endpoint surface のみ利用）を逸脱する | Stage 3 workflow（`docs/30-workflows/e2e-quality-uplift-stage-3/`） |

> 「分量が多い」「複雑」「念のため切り出す」等の理由で先送りは一切していない。

---

## 不変条件（4 仕様書横断・CLAUDE.md 整合）

| # | 不変条件 | 出典 |
|---|---------|------|
| 1 | 既存 API endpoint surface のみ利用、新 endpoint・D1 schema 変更禁止 | CLAUDE.md UI alignment §不変条件 1 |
| 2 | OKLch トークン正本（HEX 直書き禁止）。test selector も色値依存にしない | CLAUDE.md UI alignment §不変条件 2 |
| 3 | プロトタイプ正本順位（design tokens 正本） | CLAUDE.md UI alignment §不変条件 3 |
| 4 | `apps/web` から D1 binding 直接アクセス禁止 | CLAUDE.md 重要不変条件 5 |
| 5 | Auth fixture は `apps/web/playwright/fixtures/auth.ts` の `adminPage` / `memberPage` / `anonymousPage` 再利用、新 fixture 禁止 | 親 workflow `index.md` |
| 6 | `page.route()` で API mock し決定論性を保証、D1 直接アクセス回避 | 親 workflow `index.md` |
| 7 | `test.skip` は cascade preview の 1 件のみ許容、それ以外の skip 禁止 | 親 workflow + CONST_007 |

---

## 実装順序の推奨

1. **route 3 schema named export**（1 行 ×3 = 3 行差分。2d を unblock）
2. **2a / 2b / 2c を並列実装**（fixture object は 2d の正本 shape に合わせる）
3. **2d 実装** — fixture を共有し、shape 同型を contract で確認
4. **CI green 確認 → PR 作成（base = `dev`）**

---

## 参照

- 親 workflow: [`docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md`](../completed-tasks/e2e-quality-uplift-stage-2/index.md)
- 設計（Phase 1-3）: [`phase-1.md`](../completed-tasks/e2e-quality-uplift-stage-2/phase-1.md) / [`phase-2.md`](../completed-tasks/e2e-quality-uplift-stage-2/phase-2.md) / [`phase-3.md`](../completed-tasks/e2e-quality-uplift-stage-2/phase-3.md)
- TDD Red 設計: [`phase-4.md`](../completed-tasks/e2e-quality-uplift-stage-2/phase-4.md)
- 実装版 test 構造: [`phase-5.md`](../completed-tasks/e2e-quality-uplift-stage-2/phase-5.md)
- 共有 schema: `packages/shared/src/schemas/identity-conflict.ts`
- Auth fixture: `apps/web/playwright/fixtures/auth.ts`

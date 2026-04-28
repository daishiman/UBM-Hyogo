# Phase 4: テスト戦略 — main

## 1. 目的

実装より先に **テストの形** を確定し、AC-1〜AC-11 を verify suite として定義する。boundary tooling（dep-cruiser / ESLint）の自動 test を含める。

詳細は `outputs/phase-04/verify-suite.md`。

## 2. テスト戦略の核

| カテゴリ | tool | 検証対象 |
| --- | --- | --- |
| unit test | vitest + miniflare D1 | repository 5 ファイルのロジック |
| boundary test | dep-cruiser CI / ESLint | 不変条件 #5 / cross-domain rules |
| invariant test | vitest (型 + 振る舞い) | append-only / single-use / 状態遷移 |
| type test | tsc (`expectError`) | adminNotes の view model 不在、auditLog UPDATE 不在 |
| fixture / loader test | vitest | `setupD1()` が 02a/02b/02c で共通利用可能 |

## 3. AC ↔ test マッピング

| AC | 要件 | 検証 test | ファイル |
| --- | --- | --- | --- |
| AC-1 | 5 repo unit pass | unit test 5 種 | `*.test.ts` |
| AC-2 | adminNotes が view model に混ざらない | type test + dep-cruiser | `adminNotes.test.ts` + `repo-no-cross-domain-2a-to-2c` |
| AC-3 | apps/web → repository 禁止 | boundary lint | `scripts/lint-boundaries.mjs` / `apps/web/src/lib/__tests__/boundary.test.ts` |
| AC-4 | apps/web → D1Database 禁止 | boundary lint | 同上 |
| AC-5 | dep-cruiser 0 violation | dep-cruiser CI | `.dependency-cruiser.cjs` |
| AC-6 | auditLog append-only | type test (UPDATE/DELETE 関数不在) | `auditLog.test.ts` |
| AC-7 | magicTokens single-use | invariant test (二重 consume → already_used) | `magicTokens.test.ts` |
| AC-8 | syncJobs status 一方向 | invariant test (`fail → succeed` で throw) | `syncJobs.test.ts` |
| AC-9 | in-memory loader 共通利用 | `_setup.test.ts` で 02a/02b fixture も load 確認 | `__tests__/_setup.test.ts` |
| AC-10 | prototype 昇格防止 | fixture の dev only 確認 + bundle exclude 検証 | `__fixtures__/*.fixture.ts` |
| AC-11 | 02a/02b 相互 import 0 | dep-cruiser cross-domain rules | `.dependency-cruiser.cjs` |

すべての AC に対応する test がマップされている。

## 4. boundary test の自動化

CI gate:

```bash
# pnpm script: ci:boundary
pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web --output-type err
pnpm --filter apps/web lint
pnpm --filter apps/api lint
pnpm --filter apps/api test repository
```

CI で `ci:boundary` が必須通過。

意図的な **violation snippet** を `apps/web/__tests__/__snapshots__/` に置き、ESLint / dep-cruiser がそれを検出することを確認する（test 中で snippet を一時 ESLint 実行 → error 出力をアサート）。

## 5. invariant test の例

| シナリオ | 期待動作 | 検証ポイント |
| --- | --- | --- |
| `auditLog.test.ts` で UPDATE / DELETE 関数を呼ぼうとする | 関数不在で型エラー（API 不在で守る） | `// @ts-expect-error` を test に書く |
| `magicTokens.consume` を 2 回呼ぶ | 2 回目は `{ ok: false, reason: "already_used" }` | 振る舞いテスト |
| `magicTokens.consume` を expired 後に呼ぶ | `{ ok: false, reason: "expired" }` | 振る舞いテスト |
| `syncJobs.succeed("not_found_id", {})` | `Error: sync_job ... not found` | 振る舞いテスト |
| `syncJobs.fail` を `succeeded` 状態の job に対して呼ぶ | throw `IllegalStateTransition` | 振る舞いテスト |
| `(p: PublicMemberProfile).adminNotes` | プロパティ存在しない型エラー | `// @ts-expect-error` |

## 6. fixture / setup loader の signature 合意

```ts
// __tests__/_setup.ts（02a/02b/02c 共通）
export interface InMemoryD1 {
  ctx: DbCtx;
  loadFixtures: (paths: string[]) => Promise<void>;
  reset: () => Promise<void>;
}

export const setupD1: () => Promise<InMemoryD1>;
```

利用例:
```ts
const env = await setupD1();
await env.loadFixtures([
  "apps/api/src/repository/__fixtures__/admin.fixture.ts",   // 02c
  "apps/api/src/repository/__fixtures__/members.fixture.ts", // 02a
]);
const u = await adminUsers.findByEmail(env.ctx, adminEmail("owner@example.com"));
```

## 7. サブタスク完了確認

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | unit test 一覧（6 ファイル） | completed |
| 2 | boundary test (dep-cruiser/ESLint, 6 ケース) | completed |
| 3 | invariant test（6 シナリオ） | completed |
| 4 | fixture / setup loader（02a/02b 共通利用） | completed |
| 5 | type test snippet（3 ケース） | completed |
| 6 | AC マッピング（AC-1〜AC-11） | completed |

## 8. 完了条件チェック

- [x] verify suite 表が AC-1〜AC-11 を網羅
- [x] boundary test が dep-cruiser / ESLint 双方を持つ
- [x] fixture / setup loader signature が 02a/02b 共通利用可能
- [x] dep-cruiser ルール案が pseudo config として記述

## 9. 次 Phase 引き継ぎ事項

- verify suite / fixture / setup loader / dep-cruiser config
- Phase 5 で実装 placeholder と sanity check を順序付き runbook に展開

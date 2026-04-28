# Phase 6: 異常系検証 — main

## 1. 目的

repository 層 / boundary tooling の異常系を実装上で検証し、Phase 4 の verify-suite と Phase 5 runbook の placeholder を実コードに展開して **異常系テストが green であること** を確認した。

## 2. 実装サマリー

| 区分 | ファイル | 件数 |
| --- | --- | --- |
| repository | `apps/api/src/repository/{adminUsers,adminNotes,auditLog,syncJobs,magicTokens}.ts` | 5 |
| _shared | `apps/api/src/repository/_shared/{db,brand}.ts` | 2 |
| 共通 test loader | `apps/api/src/repository/__tests__/_setup.ts` | 1 |
| dev fixture | `apps/api/src/repository/__fixtures__/admin.fixture.ts` | 1（dev only コメント） |
| unit test | `__tests__/{adminUsers,adminNotes,auditLog,syncJobs,magicTokens,_setup}.test.ts` | 6 |
| boundary test | `apps/web/src/lib/__tests__/boundary.test.ts` | 1 |
| boundary tooling | `.dependency-cruiser.cjs` / `scripts/lint-boundaries.mjs` 強化 | 2 |

## 3. テスト結果

```
Test Files  16 passed (16)
Tests       162 passed (162)
```

repository 層単独では **29 件 unit test 全 pass**。

| テストファイル | 件数 | 状態 |
| --- | --- | --- |
| `adminUsers.test.ts` | 4 | pass |
| `adminNotes.test.ts` | 7 | pass |
| `auditLog.test.ts` | 4 | pass |
| `syncJobs.test.ts` | 6 | pass |
| `magicTokens.test.ts` | 6 | pass（`not_found` は別途 6 件目の追加 case） |
| `_setup.test.ts` | 1 | pass |
| `apps/web/.../boundary.test.ts` | 3 | pass |

## 4. 異常系で検証したケース

詳細は `failure-cases.md`。要点:

- `findByEmail` / `findById` で存在しない key → null
- `update` / `remove` で存在しない id → null / false
- `auditLog` で UPDATE / DELETE 関数を呼ぼうとすると **TS2339 / @ts-expect-error** が green
- `magicTokens.consume` 二重呼出で `{ ok: false, reason: "already_used" }`
- `magicTokens.consume` expired で `{ ok: false, reason: "expired" }`
- `magicTokens.consume` not_found で `{ ok: false, reason: "not_found" }`
- `syncJobs.fail` を `succeeded` 状態に対して呼ぶと `IllegalStateTransition` throw
- `syncJobs.succeed` を `failed` 状態に対して呼ぶと `IllegalStateTransition` throw
- 存在しない job_id で `succeed` / `fail` → `SyncJobNotFound`
- `apps/web` から `D1Database` を `import` する snippet で `lint-boundaries` が exit 1
- `apps/web` から `@ubm-hyogo/api` を `import` する snippet で `lint-boundaries` が exit 1

## 5. boundary tooling 状態

- `.dependency-cruiser.cjs` を repo root に配置済み（5 forbidden rule）。実バイナリ `dependency-cruiser` は本タスクでは未インストール。
  Phase 9 / 11 で `pnpm add -D dependency-cruiser` を Wave 2 統合 PR で実施する想定。
- 既存 `scripts/lint-boundaries.mjs` が grep ベースで `D1Database` / `apps/api` / `@ubm-hyogo/api` を検出。AC-3 / AC-4 を実質的に満たす。
- `boundary.test.ts` が違反 snippet を tmp dir に書き、`scripts/lint-boundaries.mjs` を spawn して exit code 1 を assert。

## 6. 完了条件チェック

- [x] 5 repository が unit test pass
- [x] in-memory D1 loader（miniflare 4）で 02a/02b/02c の fixture を seed 可能
- [x] `IllegalStateTransition` / `SyncJobNotFound` / `ConsumeResult` discriminated union が実装済み
- [x] `auditLog` UPDATE / DELETE API 不在を `@ts-expect-error` で構造的に検証
- [x] AC-2: `PublicMemberProfile` に adminNotes プロパティが存在しないことを type 検証
- [x] boundary 違反 snippet で lint が error 返却を assert

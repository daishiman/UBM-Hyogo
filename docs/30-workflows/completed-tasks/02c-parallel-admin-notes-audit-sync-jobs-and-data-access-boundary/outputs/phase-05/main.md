# Phase 5: 実装ランブック — main

## 1. 目的

実装エージェント（Phase 6 以降）が **コードを書かずに本仕様書だけで作業着手できる** 状態を作る。
順序付き runbook + コード placeholder + sanity check + boundary tooling config placeholder で構成する。

詳細な手順は `outputs/phase-05/runbook.md` を参照。

## 2. 配置するファイル一覧（実装 Phase 6 で作成）

### 2.1 repository（5 ファイル）

| # | パス | 概要 |
| --- | --- | --- |
| 1 | `apps/api/src/repository/adminUsers.ts` | findByEmail / listAll / touchLastSeen |
| 2 | `apps/api/src/repository/adminNotes.ts` | listByMemberId / create / update / remove |
| 3 | `apps/api/src/repository/auditLog.ts` | append / listRecent / listByActor / listByTarget（**UPDATE/DELETE 不在**） |
| 4 | `apps/api/src/repository/syncJobs.ts` | start / succeed / fail / findLatest / listRecent + ALLOWED_TRANSITIONS |
| 5 | `apps/api/src/repository/magicTokens.ts` | issue / verify / consume（single-use） |

### 2.2 共有資産（02c が正本管理）

| # | パス | 概要 |
| --- | --- | --- |
| 6 | `apps/api/src/repository/_shared/brand.ts` | MemberId / ResponseId / StableKey / AdminEmail / MagicTokenValue |
| 7 | `apps/api/src/repository/_shared/db.ts` | DbCtx + ctx() factory |
| 8 | `apps/api/src/repository/_shared/sql.ts` | SQL helpers（必要に応じ） |

### 2.3 test 基盤

| # | パス | 概要 |
| --- | --- | --- |
| 9 | `apps/api/src/repository/__tests__/_setup.ts` | in-memory D1 loader（02a/02b/02c 共通） |
| 10 | `apps/api/src/repository/__fixtures__/admin.fixture.ts` | dev only fixture |

### 2.4 boundary tooling

| # | パス | 概要 |
| --- | --- | --- |
| 11 | `.dependency-cruiser.cjs`（リポジトリ root） | 4 rule（apps/web → repo / D1, cross-domain 3 種） |
| 12 | `apps/web/eslint.config.js`（更新） | no-restricted-imports patterns + paths |

## 3. placeholder 一覧

すべての placeholder は `outputs/phase-05/runbook.md` の Step 2 〜 Step 9 に集約。

主要 placeholder:
- `_shared/brand.ts`: 5 種 brand + smart constructor
- `_shared/db.ts`: DbCtx interface + `ctx()` factory
- `adminUsers.ts`: findByEmail / listAll / touchLastSeen の SQL placeholder
- `adminNotes.ts`: CRUD の SQL placeholder
- `auditLog.ts`: append + read のみ、UPDATE/DELETE 関数なし
- `syncJobs.ts`: ALLOWED_TRANSITIONS + IllegalStateTransition + assertTransition helper
- `magicTokens.ts`: issue/verify/consume + 楽観 lock UPDATE
- `__tests__/_setup.ts`: setupD1 + loadFixtures + reset
- `.dependency-cruiser.cjs`: 4 forbidden rule
- `apps/web/eslint.config.js`: 2 rule（patterns + paths）

## 4. sanity check（5 項目）

| # | 確認項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | TS コンパイル | `mise exec -- pnpm --filter apps/api typecheck` | 0 error |
| 2 | repository unit test | `mise exec -- pnpm --filter apps/api test repository` | 全 pass |
| 3 | dep-cruiser | `mise exec -- pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web` | 0 violation |
| 4 | ESLint (web) | `mise exec -- pnpm --filter apps/web lint` | 0 error（意図的 violation snippet で error 確認） |
| 5 | bundle size | `mise exec -- pnpm --filter apps/api build && du -sh apps/api/dist/` | < 1MB |

## 5. 実装順序の推奨

下流タスクの blocking を避けるため:

1. Step 0 前提確認（01a / 01b 完了確認）
2. Step 2 `_shared/brand.ts` + `_shared/db.ts`（02a/02b が即 import 可能）
3. Step 7 `__tests__/_setup.ts`（02a/02b が test 着手可能）
4. Step 8 `.dependency-cruiser.cjs`（CI gate を先に立ち上げる）
5. Step 9 `apps/web/eslint.config.js`（apps/web チームが先行作業可能）
6. Step 3〜6 repository 5 ファイル（独立並列）
7. Step 10 sanity check

`_shared/` と boundary tooling を先に確定 → 02a/02b/04c/05a/05b/07c が即時並列着手可能。

## 6. 不変条件遵守の構造的根拠

| # | 不変条件 | placeholder での扱い |
| --- | --- | --- |
| 5 | apps/web → D1 直接禁止 | `.dependency-cruiser.cjs` Step 8 + `apps/web/eslint.config.js` Step 9 |
| 6 | GAS prototype 昇格防止 | `__fixtures__/admin.fixture.ts` 先頭コメント `// dev only — 不変条件 #6` |
| 11 | admin が他人本文を直接編集できない | adminNotes / auditLog の SQL に `member_responses` を 1 行も書かない（runbook で明記） |
| 12 | adminNotes が view model に混ざらない | adminNotes.ts のコメント「builder 経路には絶対に呼ばれない」+ dep-cruiser の `repo-no-cross-domain-2a-to-2c` |

## 7. サブタスク完了確認

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | runbook 転記（10 ステップ） | completed |
| 2 | placeholder 整理（5 repo + brand + db + setup） | completed |
| 3 | dep-cruiser config（4 rule） | completed |
| 4 | ESLint config（2 rule） | completed |
| 5 | sanity check 表（5 項目） | completed |

## 8. 完了条件チェック

- [x] 10 step runbook が完成
- [x] placeholder が 5 repo + brand + db + setup 分書かれている
- [x] dep-cruiser config 4 rule、ESLint config 2 rule
- [x] sanity check 5 項目

## 9. 次 Phase 引き継ぎ事項

- 10 step runbook / placeholder / boundary tooling config
- Phase 6 では runbook を異常系（同一 token 二重 consume / 02a/02b 経路の violation 検出 等）で叩く

## 10. 注意事項

- **本 Phase ではコードを書かない**。Phase 6 以降の実装エージェントが runbook と placeholder を見て実装する
- dep-cruiser config と ESLint rule は **placeholder（仕様）として記述**。実際の `.dependency-cruiser.cjs` ファイル作成は Phase 6
- `_shared/` の正本所在は 02c。02a / 02b の Phase 1-2 とこの合意が一致していることが Phase 6 着手前提

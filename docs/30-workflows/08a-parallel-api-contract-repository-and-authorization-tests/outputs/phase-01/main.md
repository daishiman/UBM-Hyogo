# Phase 1 成果物 — 要件定義 (08a)

## 1. 真の論点 (true issue)

本タスクは `apps/api` における **contract test / repository unit test / authorization (authz) 境界 test / type test / 不変条件 test** の 5 軸を 1 つの task に集約する。通常これらは別 task に分離されるが、以下の理由で 1 task 集約を妥当と判断した。

1. **fixture / helper / brand 型 import の重複排除**: 5 軸はいずれも `members` / `responses` / `meetings` 等の D1 fixture と `responseId` / `memberId` の brand 型を共有する。task を分割すると fixture と命名規約の重複が必ず発生し、保守時に整合性が崩れるリスクが大きい。
2. **AC と verify suite の 1:1 対応**: AC-1〜7 を 1 task 内 Phase 4 verify suite と直接マッピングできる。task を分けると AC が分断されてトレース困難になる。
3. **不変条件の網羅責任の所在**: 不変条件 #1 / #2 / #5 / #6 / #7 / #11 はそれぞれ contract / repository / authz / lint / type の異なる test 軸で表現される。1 task に集約しないと「どの不変条件をどの task で守るか」が曖昧になる。

論点として残るのは以下：

- **type test を「実テスト」として扱うか「ドキュメント代用」とするか** → 本タスクは vitest type-check (`@ts-expect-error` + 型違反パターン) を実コミットし、CI 上で **コンパイル時 fail を必ず観測** する方針。詳細は AC-4。
- **endpoint 約 30 を 100% カバーすると test 数が膨らむ** → fixture と app helper を Phase 8 で集約することで重複を抑制する。
- **D1 mock の選択 (msw 全面 / miniflare D1 / in-memory sqlite)** → Phase 2 / 3 で評価。本 Phase では選択肢の存在のみ open question として記録。

## 2. 依存境界

| 種別 | 対象 | 引き取るもの (input) | 渡すもの (output) |
| --- | --- | --- | --- |
| 上流 | 06a-public-landing | 公開 endpoint の view model schema | contract test の zod expect schema |
| 上流 | 06b-member-pages | `/me/*` の view model | contract test |
| 上流 | 06c-admin-pages | `/admin/*` の view model | contract test |
| 上流 | 07a-tag-queue-resolve | `POST /admin/tags/queue/:queueId/resolve` workflow | contract / authz test |
| 上流 | 07b-schema-alias-assign | `POST /admin/schema/aliases` workflow | contract / authz test |
| 上流 | 07c-attendance-audit | attendance + audit hook 仕様 | contract / authz test |
| 下流 | 09a-staging-deploy-smoke | `pnpm test --filter @ubm-hyogo/api` pass を staging deploy gate | CI workflow yml |
| 下流 | 09b-release-runbook | CI workflow を release runbook に組込 | api-tests.yml |
| 並列 | 08b (E2E) | endpoint 一覧と認可境界の同期 | contract 観点 |

## 3. 実体把握 (apps/api/src の実コード grep 結果)

### endpoint 実体一覧 (auth resolve / gate-state を含めて 30 件)

**public (4)**
- `GET /public/stats`
- `GET /public/members`
- `GET /public/members/:memberId` (member-profile.ts)
- `GET /public/form-preview`

**auth (5)**
- `POST /auth/magic-link`
- `POST /auth/magic-link/verify`
- `POST /auth/resolve-session`
- `GET /auth/session-resolve`
- `GET /auth/gate-state`

**me (3)**
- `GET /me/` (root → profile resolution)
- `GET /me/profile`
- `POST /me/visibility-request` (services 経由・schemas.ts に存在を要確認)

> 注: 仕様書 index に列挙された `/me/visibility-request`, `/me/delete-request` は実コードでは `me/services.ts` 経由で resolve される。Phase 2 で実体を再確認し、ない場合は実装側との open question として 06b へ戻す。

**admin (約 18)**
- `GET /admin/dashboard`
- `GET /admin/members`
- `GET /admin/members/:memberId`
- `PATCH /admin/members/:memberId/status`
- `POST /admin/members/:memberId/notes`
- `PATCH /admin/members/:memberId/notes/:noteId`
- `POST /admin/members/:memberId/delete`
- `POST /admin/members/:memberId/restore`
- `GET /admin/tags/queue`
- `POST /admin/tags/queue/:queueId/resolve`
- `GET /admin/schema/diff`
- `POST /admin/schema/aliases`
- `GET /admin/meetings`
- `POST /admin/meetings`
- `GET /admin/meetings/:sessionId/attendance/candidates`
- `POST /admin/meetings/:sessionId/attendance`
- `DELETE /admin/meetings/:sessionId/attendance/:memberId`
- `POST /admin/sync` (`sync.ts`)
- `POST /admin/sync/schema`
- `POST /admin/sync/responses`

**合計** = 4 (public) + 5 (auth) + 3 (me) + 20 (admin) = **約 32 endpoint**。仕様書の概算「約 30」の範囲内。AC-1 の base 値として 32 を採用する。

### repository 実体一覧 (24 ファイル — `apps/api/src/repository/*.ts` 直下、`_shared` / `__fixtures__` / `__tests__` を除く)

`adminNotes`, `adminUsers`, `attendance`, `auditLog`, `dashboard`, `fieldVisibility`, `identities`, `magicTokens`, `meetings`, `members`, `memberTags`, `publicMembers`, `responseFields`, `responses`, `responseSections`, `schemaDiffQueue`, `schemaQuestions`, `schemaVersions`, `status`, `syncJobs`, `tagDefinitions`, `tagQueue`

→ 実体 **22 種**。仕様書「約 16 種」を上回るため、AC-2 は **22 種に修正** する（仕様書の記述を上書き）。

### 既存テスト (apps/api/src/repository/__tests__/)

`adminNotes`, `adminUsers`, `auditLog`, `brand`, `builder`, `fieldVisibility`, `identities`, `magicTokens`, `members`, `memberTags`, `responseFields`, `responses`, `responseSections`, `status`, `syncJobs` (15 件)

→ 未カバー repository: `attendance`, `dashboard`, `meetings`, `publicMembers`, `schemaDiffQueue`, `schemaQuestions`, `schemaVersions`, `tagDefinitions`, `tagQueue` (9 件)。Phase 5 runbook で実装対象。

## 4. AC-1〜7 quantitative 定義

| AC | 定義 | 計測方法 |
| --- | --- | --- |
| **AC-1** | apps/api 全 endpoint 32 件の **contract test 100% green** (zod parse 成功 + status code 一致) | `vitest run --reporter=json` で `*.contract.spec.ts` の test 数 ≥ 32 件 / pass = 100% |
| **AC-2** | 全 repository 22 種の unit test pass、各 CRUD で fixture を **5 件以上**使った test が存在 | `vitest --coverage` で `apps/api/src/repository/*.ts` 全 22 ファイルが coverage に登場、各 fixture seed で 5 row 以上 |
| **AC-3** | 認可境界 9 マトリクス (anonymous × member × admin) × (public / member / admin endpoint) を **401 / 403 / 200 (or 201/204)** で断定 | authz spec で 9 ケース exact、status code を `toBe(401)` / `toBe(403)` / `toBeLessThan(300)` で固定 |
| **AC-4** | `responseId` ≠ `memberId` の brand 型違反を **`@ts-expect-error` 1 ケース以上**で記述 | `packages/shared/src/__tests__/type-tests.ts` に `// @ts-expect-error` directive ≥ 1 (削除すると tsc が pass しない設計) |
| **AC-5** | 不変条件 #1 / #2 / #5 / #6 / #7 / #11 各 **1 test 以上** | 6 spec ファイル or 6 describe block を ID 付きで列挙 |
| **AC-6** | vitest run + coverage で **statements ≥ 85% / branches ≥ 80%** | `pnpm --filter @ubm-hyogo/api test:coverage` の `coverage/coverage-summary.json` を CI で閾値判定 |
| **AC-7** | CI workflow placeholder `.github/workflows/api-tests.yml` を outputs に配置、`pnpm --filter @ubm-hyogo/api test` を 1 step で実行 | `.github/workflows/api-tests.yml` (or outputs/phase-11/evidence/ci-workflow.yml) に該当 step が存在 |

## 5. 4 条件評価表

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| **価値性** | 不変条件 #1 / #2 / #5 / #6 / #7 / #11 を test として恒久固定するか | **PASS** | 6 不変条件にそれぞれ 1 spec を割当 (#1=contract extraFields, #2=zod responseEmail enum, #5=authz 9, #6=lint import-boundary, #7=deleted_member contract, #11=`PATCH /me/profile` で 404 contract)。後続 task が壊せば CI fail する |
| **実現性** | vitest + msw + in-memory sqlite で実装可能か | **PASS** | apps/api は既に vitest 2.1 / miniflare 4 を devDeps に持ち (`apps/api/package.json` 確認済)、`__fakes__/fakeD1.ts` も存在。in-memory sqlite または fakeD1 で D1 binding を mock 可能 |
| **整合性** | 上流 06a/b/c, 07a/b/c の AC と矛盾しないか | **PASS** | endpoint 32 件・repository 22 種を実コードから列挙。仕様書「16 種」「約 30」より厳密化したが、上書き方向であり矛盾はない |
| **運用性** | CI で必ず実行・rollback で test 戻し可能か | **PASS** | `.github/workflows/api-tests.yml` placeholder、coverage 閾値 CI gate、`pnpm test --filter @ubm-hyogo/api` 単一コマンドで再現可能。failure 時は前 commit に戻すだけで test も同期復帰 |

## 6. 真の論点に対する決定事項

| 論点 | 決定 | 非採用案 | 理由 |
| --- | --- | --- | --- |
| 5 軸を 1 task 集約 vs 分割 | **集約** | task 4 分割 | fixture / brand 型 / 命名規約の一貫性、AC と verify の 1:1 対応 |
| type test を実コミット vs ドキュメント | **実コミット** (`@ts-expect-error`) | tsd / dts | CI で必ず実行され、削除や型緩和を機械検知できる |
| D1 mock 戦略 | **in-memory sqlite + msw (Forms API のみ)** を Phase 3 確定候補 | A msw 全面 / B miniflare D1 | 速度 / 無料枠 / 実装シンプル。詳細評価は Phase 3 |
| 不足 endpoint (`/me/visibility-request` 等) の扱い | Phase 2 で実コード再確認、無ければ 06b へ open question | 即座に追加 | 上流仕様の正本性を尊重 |

## 7. Phase 2 への open question

1. **D1 mock 採用方針**: `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` が既存。これを基盤に in-memory sqlite と二択 / 併用するか？ → Phase 2 で benchmarking 不要、Phase 3 alternative 比較で確定。
2. **Forms API mock**: msw を採用するか、`apps/api/tests/fixtures/forms-get.ts` の local fixture 流用か？ → Forms = msw、D1 = fakeD1/sqlite で分担を Phase 2 で確定。
3. **CI runner image**: `ubuntu-latest` (Node 24) で問題ないか？ better-sqlite3 native build の native gyp 依存を確認。
4. **type test の配置**: `packages/shared/src/__tests__/type-tests.ts` か `apps/api/src/_shared/__tests__/types.test-d.ts` か。
5. **`/me/visibility-request`, `/me/delete-request` 実体不在**: 上流 06b の AC を再確認。実装が schemas.ts / services.ts に endpoint 化済か Phase 2 冒頭で verify。
6. **coverage 閾値の `coverage.exclude` 範囲**: `__fixtures__` / `__fakes__` / `_setup.ts` は除外するか。

## 8. 完了条件チェック

- [x] AC-1〜7 quantitative 化完了 (§4)
- [x] 真の論点と非採用案を §6 に記録
- [x] 4 条件評価 (§5) 全 PASS
- [x] Phase 2 open question を §7 に列挙
- [x] 実コードベースの endpoint 数 (32) / repository 数 (22) を grep で確認し、仕様書の概算と差分を明示

## 9. 次 Phase への引き継ぎ

- endpoint 実体 32 件 + repository 22 種 + authz マトリクス 9 セルを Phase 2 design 入力とする
- 既存 fakeD1 / __fixtures__ 資産を Phase 2 layout に組み込む
- §7 open question 6 件を Phase 2 冒頭で resolve

# Phase 2 成果物 — 設計 (08a)

## 1. 目的と Phase 1 引き取り

Phase 1 で確定した endpoint 32 件 / repository 22 種 / authz 9 マトリクス / 不変条件 6 種を、test architecture (vitest configuration / fixture / helper / msw / in-memory D1) に翻訳する。Phase 4 verify suite の入力データを揃えることが目的。

## 2. test 種別と対象

| 種別 | 対象 | 配置 (前提案) | 数量目安 |
| --- | --- | --- | --- |
| **contract test** | `apps/api/src/routes/**` 32 endpoint の zod parse + status code | `apps/api/src/routes/<layer>/__tests__/*.contract.spec.ts` | 32 件 |
| **repository unit test** | `apps/api/src/repository/*.ts` 22 種 | `apps/api/src/repository/__tests__/*.test.ts` (既存 15 + 新規 9) | 22 件 |
| **authz boundary test** | `admin-gate` / `session-guard` / `require-admin` / `internal-auth` middleware と各 endpoint の組合せ | `apps/api/src/middleware/__tests__/*.authz.test.ts` + 各 route 内 authz block | 9 行列 + middleware 4 |
| **type test** | brand 型 (`responseId` / `memberId` / `meetingSessionId` 他) | `apps/api/src/_shared/__tests__/brand.type.test-d.ts` | 1 ファイル / `@ts-expect-error` ≥ 3 |
| **lint / boundary test** | apps/web から D1 binding 直接 import 禁止 (#6) | `apps/api/tests/lint/import-boundary.test.ts` | 1 件 |
| **invariant test** | 不変条件 #1 / #2 / #5 / #6 / #7 / #11 | `apps/api/tests/invariants/*.test.ts` (集約) または該当層に配置 | 6 ID 付き |

## 3. test architecture サマリ

```
                ┌──────────────────────────┐
                │ vitest (root config)     │
                │   workspace=apps/api     │
                └──────────┬───────────────┘
                           │
        ┌──────────────────┼──────────────────────┐
        ▼                  ▼                      ▼
┌──────────────┐  ┌────────────────┐   ┌───────────────────┐
│ contract     │  │ repository     │   │ authz / boundary  │
│ (Hono client)│  │ (fakeD1 /      │   │ (test app +       │
│ + zod parse  │  │  in-memory)    │   │  signed cookie)   │
└──────┬───────┘  └────────┬───────┘   └─────────┬─────────┘
       │                   │                     │
       └────────────┬──────┴───────────┬─────────┘
                    ▼                  ▼
          ┌───────────────────┐  ┌──────────────────┐
          │ test/helpers      │  │ test/fixtures    │
          │ (app, auth, seed) │  │ (members, tags…) │
          └─────────┬─────────┘  └─────────┬────────┘
                    ▼                      ▼
          ┌───────────────────┐  ┌──────────────────┐
          │ test/mocks        │  │ packages/shared  │
          │ (Forms API msw)   │  │ brand 型 (type)  │
          └───────────────────┘  └──────────────────┘
```

ランナーは vitest 2.1 (既存 devDeps)。type-check は `vitest --typecheck.enabled` 経由で `*.test-d.ts` を tsc check 走行。Forms API は msw、D1 は fakeD1 / in-memory sqlite (Phase 3 で確定) のハイブリッド。

## 4. 既存資産との接続

| 既存 | 役割 | 本タスクでの利用 |
| --- | --- | --- |
| `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` | D1 binding の手書き fake | repository unit test の base |
| `apps/api/src/repository/__fixtures__/{admin,members,d1mock}.ts` | fixture seed | 拡張: meetings / tags / responseSections / schemaVersions / queue / audit を追加 |
| `apps/api/src/repository/__tests__/*.test.ts` (15) | unit 既存 | 不足 9 ファイルを新規 (`attendance`, `dashboard`, `meetings`, `publicMembers`, `schemaDiffQueue`, `schemaQuestions`, `schemaVersions`, `tagDefinitions`, `tagQueue`) |
| `apps/api/tests/fixtures/forms-get.ts` | Forms API local fixture | msw handler の payload 生成元として再利用 |
| `apps/api/src/middleware/require-admin.test.ts` | authz 既存 | 9 マトリクスの 1 セル。形式を `*.authz.test.ts` に揃える方向で検討 |

## 5. test directory layout (確定案)

`outputs/phase-02/test-directory-layout.md` 参照。**既存構造を尊重** し、新規追加は最小に留める。

## 6. env / dependency matrix

### env

| キー | 値 | 配置 | 理由 |
| --- | --- | --- | --- |
| `TEST_D1_PATH` | `:memory:` | `vitest.config.ts` の `test.env` | in-memory sqlite (better-sqlite3) |
| `TEST_AUTH_SECRET` | 32 byte hex (test 専用 dummy) | vitest setup | session cookie 署名 |
| `FORMS_API_BASE_URL` | `http://localhost.msw` | vitest setup | msw が intercept |
| `NODE_ENV` | `test` | vitest 既定 | — |

新規 secret 導入は **なし** (msw / fixture で完結)。

### dependency

| ファイル | 役割 | 依存元 | 依存先 | 新規 / 既存 |
| --- | --- | --- | --- | --- |
| root `vitest.config.ts` | runner 設定 (typecheck enabled) | `apps/api/package.json` scripts (`--root=../.. --config=vitest.config.ts`) | helpers / mocks | 既存活用 |
| `apps/api/test/helpers/app.ts` | Hono test app (D1 binding 注入) | routes / middleware | hono test client | 新規 |
| `apps/api/test/helpers/auth.ts` | admin / member cookie 生成 | adminUsers / magicTokens | jose | 新規 |
| `apps/api/test/helpers/seed.ts` | fakeD1 / sqlite に fixture 注入 | `repository/__fixtures__/*` | fakeD1 | 新規 |
| `apps/api/test/mocks/server.ts` | msw setupServer | mocks/handlers | msw 2.x | 新規 |
| `apps/api/test/mocks/forms-api.handlers.ts` | Forms API mock | `tests/fixtures/forms-get.ts` | msw | 新規 |
| `apps/api/tests/lint/import-boundary.test.ts` | apps/web → D1 禁止 | tsconfig + grep | apps/web src | 新規 |
| `packages/shared/src/__tests__/brand.type.test-d.ts` | brand 型違反 | brand 型 | vitest typecheck | 新規 |

## 7. msw vs local fixture 採用方針

| 観点 | msw | local fixture | 採否 |
| --- | --- | --- | --- |
| Forms API (Google Forms HTTP) mock | HTTP 層で intercept、production client コードに改変不要、不変条件 #1 (extraFields 経路) 観測しやすい | client wrapper を直接置換、HTTP semantics 失う | **msw 採用** |
| D1 binding mock | binding を HTTP 化する shim が必要、複雑 | `fakeD1.ts` 既存、in-memory sqlite で本番 SQL 互換 | **local fixture (fakeD1 / in-memory sqlite) 採用** |
| msw secret | 不要 (HTTP mock) | — | secret hygiene OK |

→ **Forms API は msw、D1 は local fixture**。両者を `test/mocks/` と `test/helpers/seed.ts` で分担。

## 8. endpoint × authz マトリクス (9 セル)

| endpoint レイヤ | anonymous | member | admin | 不変条件 |
| --- | --- | --- | --- | --- |
| `GET /public/*` (4 件) | 200 | 200 | 200 | #5 |
| `GET /me/*`, `POST /me/*` (3 件) | **401** | 200 | 200 | #5 #11 |
| `GET /admin/*`, `POST/PATCH/DELETE /admin/*` (20 件) | **401** | **403** | 200 / 201 / 204 | #5 |
| `POST /auth/magic-link`, `/verify`, `/resolve-session` | 200 / 422 (rate-limit 429 含む) | 200 | 200 | — |
| `GET /auth/gate-state` | 200 (anonymous gate) | 200 | 200 | — |

→ 横軸 3 (anon / member / admin) × 縦軸 3 (public / me / admin) の 9 マトリクス。auth は別軸で扱う (rate-limit / 422 をカバー)。

## 9. 不変条件 → test 種別マッピング

| 不変条件 | test 種別 | 配置 | 観測点 |
| --- | --- | --- | --- |
| **#1** schema 固定しすぎない | contract (msw) | `routes/admin/__tests__/sync.contract.spec.ts` | msw が unknown field 含む Forms 応答を返したとき `extraFields` に保存される |
| **#2** consent キーは `publicConsent` / `rulesConsent` のみ | repository / contract | `repository/__tests__/responses.test.ts` (既存) + `routes/me/__tests__/profile.contract.spec.ts` | zod enum で他キー reject |
| **#5** 公開 / 会員 / 管理 3 層分離 | authz | 9 マトリクス (§8) | status code 断定 |
| **#6** apps/web → D1 直 import 禁止 | lint | `tests/lint/import-boundary.test.ts` | apps/web 配下 grep で 0 件 |
| **#7** 論理削除 | repository / contract | `repository/__tests__/members.test.ts` (deleted) + `routes/admin/__tests__/member-delete.contract.spec.ts` | 物理 DELETE 0 / `deleted_at` 設定 |
| **#11** profile 直接編集 endpoint なし | contract | `routes/me/__tests__/profile-edit-not-found.contract.spec.ts` | `PATCH /me/profile` → 404 (route 未登録) |

## 10. Phase 3 への引き継ぎ事項

- alternative 3 案 (A: msw 全面 / B: miniflare D1 / C: in-memory sqlite + msw) の比較材料は本 Phase で揃った
- 採用前提は **C** (本 Phase の §7 / §8 と整合)
- MINOR は「D1 固有 SQL (JSON1 / fts5) の sqlite ビルドフラグ吸収」のみ
- 既存 `fakeD1.ts` を C 案の base にするか、better-sqlite3 :memory: に統一するかは Phase 3 で決定

## 11. 完了条件チェック

- [x] test architecture を Mermaid (`test-architecture.mmd`) と本 main.md §3 に記述
- [x] test directory layout を確定 (`test-directory-layout.md`)
- [x] fixture seeder の構造設計 (§4 / §6)
- [x] env / dependency matrix (§6)
- [x] msw vs local fixture 判定根拠 (§7)
- [x] endpoint × authz マトリクス (§8)
- [x] 不変条件 → test 種別マッピング (§9)

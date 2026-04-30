# Phase 4 成果物 — テスト戦略 (08a)

## 1. 目的と Phase 3 引き取り

Phase 3 で採用案 **C (in-memory sqlite + msw)** を確定。本 Phase は Phase 1 の AC-1〜7 と Phase 2 の test 種別 6 軸を **5 種 verify suite** へ集約し、各 suite の test signature・coverage 目標・1 endpoint あたり最低ケース数を確定する。`apps/api` の現状実装（endpoint 32 / repository 22）を起点に、不足分は「補強リスト」として明示する。

## 2. 5 種 verify suite

| # | suite | 配置パターン | 役割 | 主担当 AC | 主担当不変条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | contract | `apps/api/src/routes/<layer>/__tests__/*.contract.spec.ts`（既存は `<route>.test.ts` を順次 rename） | endpoint 入出力を zod parse + status code 断定 | AC-1, AC-5 | #1 #2 #5 #7 #11 |
| 2 | repository unit | `apps/api/src/repository/__tests__/*.test.ts` | 22 repository × CRUD/list/edge を fakeD1 / sqlite で固定 | AC-2 | #2 #7 |
| 3 | authz boundary | `apps/api/src/middleware/__tests__/authz.spec.ts`（新規） | 9 マトリクス（anon/member/admin × public/me/admin）+ middleware 単体 | AC-3, AC-5 | #5 #11 |
| 4 | type test | `packages/shared/src/__tests__/brand.type-test.ts`（新規） | brand 型違反を `@ts-expect-error` で固定 | AC-4, AC-5 | #2 |
| 5 | lint / boundary | `apps/api/tests/lint/import-boundary.test.ts`（新規） | `apps/web` から D1 / repository への直接 import 禁止 | AC-5, AC-7 | #6 |

> 不変条件 test は 5 種 suite の横断責務として扱う。Phase 2 §9 のマッピングで「どの不変条件をどの suite で観測するか」が確定済み。

## 3. 既存資産と補強リスト

### 3.1 contract test（AC-1）

| endpoint レイヤ | 件数 | 現状 | 補強要件 |
| --- | --- | --- | --- |
| `/public/*` | 4 | view-models に snapshot 系既存（`view-models/public/__tests__/*`） | route 直下の contract spec を別途 4 本（zod parse + status code） |
| `/me/*` | 3〜4 | route test 不在 | 全 endpoint contract spec 新規作成 |
| `/auth/*` | 5 | `auth-routes.test.ts` / `session-resolve.test.ts` 存在 | gate-state / magic-link / verify を `*.contract.spec.ts` 命名に整理し zod parse 強化 |
| `/admin/*` | 20 | route 別に `<route>.test.ts` が個別存在（schema, members, meetings, sync, attendance, dashboard, member-status, member-notes, member-delete, tags-queue, sync-schema, responses-sync 等） | 各 test を contract spec として **zod parse + 不変条件 assert** を追加（既存 status code 中心のため強化が中心） |

**補強リスト（contract）**
1. `/me` 系 4 endpoint contract spec を新規（AC-1 ギャップ最大）
2. `/public/*` route 直下 4 spec を新規（view-model snapshot とは別）
3. 既存 `/admin/*` 20 件に zod schema parse を追加（response shape 固定）
4. `extraFields` を含む sync 応答の contract（#1）を `responses-sync.test.ts` に追加
5. `PATCH /me/profile` を `app.request` で叩いて 404 を返す test（#11）を新規

### 3.2 repository unit（AC-2）

| 状態 | repository |
| --- | --- |
| 既存テスト有 | `adminNotes`, `adminUsers`, `auditLog`, `brand`, `builder`, `fieldVisibility`, `identities`, `magicTokens`, `members`, `memberTags`, `responseFields`, `responses`, `responseSections`, `status`, `syncJobs`, `meetings`, `schemaVersions`, `schemaQuestions`, `tagQueue`, `schemaDiffQueue`, `attendance`, `tagDefinitions` |
| 未テスト | `dashboard`, `publicMembers` |

**補強リスト（repo unit）**
1. `dashboard` repository unit test を新規（集計クエリ 5 ケース）
2. `publicMembers` repository unit test を新規（consent / deleted フィルタ 5 ケース）
3. 既存 22 件のうち、CRUD `each` パターンが 5 ケース未満のものは fixture を 5 件以上に拡張

### 3.3 authz boundary（AC-3）

| 現状 | 補強要件 |
| --- | --- |
| `middleware/require-admin.test.ts` あり | 単一 middleware 単位 |
| `middleware/__tests__/rate-limit-magic-link.test.ts` あり | rate-limit のみ |
| 9 マトリクス集約 spec | 不在 → **新規作成** |

**補強リスト（authz）**
1. `middleware/__tests__/authz.spec.ts` を新規（9 セルを `it.each` で固定）
2. `admin-gate` / `session-guard` / `internal-auth` を 1 マトリクスに統合
3. anonymous + `/me/*` → 401、member + `/admin/*` → 403、admin + `/admin/*` → 200/201/204 を **必ず exact match** で固定

### 3.4 type test（AC-4）

| 現状 | 補強要件 |
| --- | --- |
| `repository/__tests__/brand.test.ts` 存在（runtime test） | `@ts-expect-error` ベースの compile-time test 不在 |

**補強リスト（type）**
1. `packages/shared/src/__tests__/brand.type-test.ts` を新規（vitest typecheck）
2. `ResponseId` → `MemberId` 代入で `@ts-expect-error`
3. `responseEmail` を form fields enum に含める試みで `@ts-expect-error`（#2）
4. `MeetingSessionId` ↔ `MemberId` 混同もカバー（attendance 周辺）

### 3.5 lint / boundary（AC-5 #6）

| 現状 | 補強要件 |
| --- | --- |
| eslint 実装はあるが test 化されていない | grep ベースの test を新規 |

**補強リスト（lint）**
1. `apps/api/tests/lint/import-boundary.test.ts` を新規
2. `apps/web` 配下から `D1Database` / `drizzle-orm/d1` / `apps/api/src/repository/*` への import が 0 件であることを grep で固定
3. eslint rule `no-restricted-imports` を Phase 9 で恒久ガードとして追加提案

## 4. coverage 目標と 1 endpoint あたり最低ケース

### 4.1 coverage 閾値（vitest.config 既存に上書き）

```ts
// root vitest.config.ts (apps/api package scripts から参照)
coverage: {
  provider: 'v8',
  thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
  include: [
    'src/routes/**',
    'src/repository/**',
    'src/middleware/**',
    'src/use-cases/**',
    'src/view-models/**',
    'src/workflows/**',
  ],
  exclude: [
    '**/__tests__/**',
    '**/__fixtures__/**',
    '**/__fakes__/**',
    '**/*.test.ts',
    '**/*.contract.spec.ts',
    '**/*.spec.ts',
    'src/**/index.ts', // re-export
  ],
}
```

### 4.2 1 endpoint あたり最低テストケース

| layer | contract | authz | 合計 |
| --- | --- | --- | --- |
| public (4) | 正常 1 + 不変条件 1〜2 = 2〜3 | 共通 1 | 12〜16 |
| me (3〜4) | 正常 1 + 401 1 + 不変条件 1 = 3 | 共通 1 | 12〜16 |
| auth (5) | 正常 1 + AuthGateState 4 = 5 | — | 25 |
| admin (20) | 正常 1 + 422 1 + 不変条件 1 = 3 | 共通 1 | 60〜80 |
| **合計** | — | — | **約 110〜140** |

> 既存 test とあわせて 200 件超を見込む。AC-1 の必要件数 ≥ 32 endpoint contract pass を充分上回る。

## 5. AC × suite 1:1 割当（要点）

詳細は `verify-suite-matrix.md`。

| AC | 主 suite | 副 suite |
| --- | --- | --- |
| AC-1 全 endpoint contract green | contract | — |
| AC-2 全 repo unit pass | repository unit | — |
| AC-3 認可 9 マトリクス | authz | contract |
| AC-4 brand 型違反 type test | type | — |
| AC-5 不変条件 #1/#2/#5/#6/#7/#11 | 6 不変条件を 4 suite に分散（contract / authz / type / lint）| — |
| AC-6 coverage ≥ 85% / 80% | vitest threshold（全 suite） | — |
| AC-7 CI workflow yml | placeholder（lint suite で gate）| — |

## 6. 不変条件カバレッジ（要点）

| 不変条件 | suite | 観測点 |
| --- | --- | --- |
| #1 schema 固定しすぎない | contract | msw が `extraFields` を含む Forms 応答を返したとき、sync 系 endpoint が破綻せず保存する |
| #2 consent / responseEmail | contract + type | zod enum で `responseEmail` 拒絶、type test で fields enum 違反を `@ts-expect-error` |
| #5 3 層分離 | authz + contract | 9 マトリクスの exact 断定 |
| #6 apps/web → D1 直 import 禁止 | lint | grep 0 件 |
| #7 論理削除 | contract + repo unit | `is_deleted=1` 行が `/public/members` で除外、`deleted_members` row が増える |
| #11 profile 編集 endpoint なし | contract + authz | `PATCH /me/profile` および `PATCH /admin/members/:id/profile` で 404 |

## 7. test signature の代表例（詳細は Phase 5）

詳細擬似コードは `outputs/phase-05/test-signatures.md`。本 Phase ではタスク仕様 phase-04.md に記載の 5 種 signature をそのまま採用し、Phase 5 で実 file path に bind する。

## 8. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 5 種 signature を file path / 命名に展開、補強リストを runbook step に翻訳 |
| Phase 6 | failure cases を 5 種 suite に逆配賦 |
| Phase 7 | AC × suite × failure を ac-matrix.md にトレース |
| Phase 8 | suite 共通の fixture / helper / brand 型 import を DRY 化 |
| Phase 9 | coverage 閾値 / secret hygiene / lint rule の最終固定 |

## 9. 完了条件チェック

- [x] 5 種 verify suite signature 確定（§2 / §3）
- [x] AC × suite matrix 全行マッピング（§5 + verify-suite-matrix.md）
- [x] coverage 閾値 placeholder 記述（§4.1）
- [x] 1 endpoint あたり最低ケース定量化（§4.2）
- [x] 補強リストを suite 別に列挙（§3）

## 10. 次 Phase への引き継ぎ

- 5 種 suite signature と補強リスト計 16 項目を Phase 5 runbook step へ展開
- coverage 閾値 / typecheck enabled の vitest.config 差分は Phase 5 で配置
- `*.contract.spec.ts` 命名統一は Phase 8 DRY 化で実施（既存 `<route>.test.ts` を rename）

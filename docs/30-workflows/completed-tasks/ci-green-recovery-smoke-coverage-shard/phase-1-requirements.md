# Phase 1: 要件定義

## 0. 実装区分の判定（CONST_004）

`[実装区分: 実装仕様書]`。3 lane すべてが新規 script / 既存 script 修正 / CI workflow 修正を伴うため、docs-only ではない。即時運用の secret 再発行のみがユーザー gated 操作（手順は記述するが本仕様では実行しない）。

## 1. タスク分類

- タスク種別: **CI recovery / NON_VISUAL**（UI/UX 変更なし）。Phase 11 は screenshot 不要、自動テスト + CI 観測を代替証跡とする。
- `implementation_mode`: `new`（mint helper・coverage-guard 改修・workflow 改修は新規実装）。

## 2. 受入条件（Acceptance Criteria）

- **AC-1**（Lane A）: `runtime-smoke-staging / smoke` の `admin-list` が HTTP 200 + `.members | type == "array"` を満たし、`me-root` / `me-profile` / `me-attendance` も PASS する。bearer 失効が原理的に起きない供給方式になっている。
- **AC-2**（Lane A）: mint helper が発行した admin JWT は `verifySessionJwt`（`packages/shared/src/auth.ts:127`）で `claims.isAdmin === true`、me JWT は `claims.isAdmin === false` として検証通過する（parity test で保証）。
- **AC-3**（Lane A）: secret 実値・署名鍵・JWT 文字列が CI ログ / 成果物 / docs に平文で出力されない（`::add-mask::` 適用、redaction grep gate を通過）。
- **AC-4**（Lane A）: `STAGING_AUTH_SECRET` 未設定環境では既存の静的 `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` を使う後方互換 fallback が動作する。
- **AC-5**（Lane C）: `ci.yml` に top-level `permissions: contents: read` が存在し、`coverage-gate-shard` の checkout が明示 token を持つ。`actionlint` が PASS する。
- **AC-6**（Lane B/C）: `coverage-gate-shard (packages)` が PASS した場合、`coverage-gate` の集約 `--no-run` が `packages/{contracts,integrations,shared,integrations/google}` の coverage-summary.json を検出し exit 0 になる。
- **AC-7**（Lane B/C）: いずれかの shard が失敗した場合、`coverage-gate` は **誤解を招く MISSING 出力ではなく**「upstream shard X failed — coverage artifacts unavailable」という明確なエラーを先に出して fail する。
- **AC-8**（全体）: required status check の context 名（`coverage-gate` / `runtime smoke staging / smoke`）が変わっていない。
- **AC-9**（全体）: `pnpm typecheck` / `pnpm lint` / 新規・既存 unit テストが全 PASS。

## 3. inventory（現状確定事実）

### 3.1 Lane A 関連

| 項目 | 現状 |
|---|---|
| smoke runner | `scripts/smoke/runtime-attendance-provider.sh`。`admin-list` = `GET $BASE/admin/members` に `authorization: Bearer $STAGING_ADMIN_BEARER`（L206）。401 時 `{"error":"auth misconfigured"}` のみ `reason=auth-secret-binding-missing` 化（L165-168）、その他 401 は reason なし。 |
| smoke workflow | `.github/workflows/runtime-smoke-staging.yml`。env に 4 secret 注入（L27-31）、checkout のみで node setup 無し（L33）。 |
| secret provisioning | `scripts/smoke/provision-staging-secrets.sh`。1Password → GitHub env `staging-runtime-smoke` に 5 secret 投入。 |
| 署名/検証 | `packages/shared/src/auth.ts`：`signSessionJwt(secret, {memberId,email,isAdmin,name?,nowSeconds?,ttlSeconds?})`（L93, 純粋 Web Crypto HS256）、`verifySessionJwt(token,secret,nowSeconds?)`（L127）、`SESSION_JWT_TTL_SECONDS=86400`（L42）。 |
| shared 解決 | `@ubm-hyogo/shared` exports `.` = `./src/index.ts`（TS 直 export, build 不要）。`tsx ^4.19.0` が root devDep に存在。 |
| admin 認証 | `apps/api/src/middleware/require-admin.ts`：AUTH_SECRET falsy→500（L122-124）、token 無し→401（L126-128）、verify 失敗（改ざん/失効）→401（L130-132）、isAdmin=false→403（L134-136）。 |

### 3.2 Lane B/C 関連

| 項目 | 現状 |
|---|---|
| coverage-gate-shard | `.github/workflows/ci.yml:135-194`。matrix group=[web,api-unit,api-d1,packages]、checkout（L147 素の token 無し）→ readiness → setup-project（L162）→ `coverage-guard.sh --group $group`（L183）→ artifact upload（L185-194）。 |
| coverage-gate | `ci.yml:196-263`。`needs:[coverage-gate-shard]`, `if: always()`。download-artifact（L224-229）→ api unit/d1 merge（L231-240）→ `coverage-guard.sh --no-run`（L242-246）→ shard 失敗時 fail closed（L248-252）。 |
| coverage-guard | `scripts/coverage-guard.sh`。`--no-run` は全 package discover し summary 欠落で `MISSING` log + exit 1（L304-338）。group モードは L241-265。 |
| vitest reporter | `vitest.config.ts:78` = `["text","json-summary","json","lcov","html"]` → json-summary が coverage-summary.json を生成。 |
| ci.yml permissions | top-level `permissions:` ブロック**無し**（`on:`→`jobs:`）。 |
| setup-project | `.github/actions/setup-project/action.yml`：**checkout を行わない** composite（node/pnpm/install のみ）。 |

## 4. 命名規則（既存コードベース分析）

- shell script: kebab-case（`runtime-attendance-provider.sh` / `provision-staging-secrets.sh`）。新規 mint helper は `mint-staging-bearers.mts`。
- Node script 拡張子: 既存は `.mjs`（`coverage-merge.mjs`, `tag-queue-race.mjs`）。ただし TS 型（`SignJwtInput` / `MemberId`）を使い `@ubm-hyogo/shared` を import するため、**`.mts` + `tsx` 実行**を採用（型安全と shared parity を優先）。
- test ファイル: `*.spec.ts`（CLAUDE.md 不変条件 #8）。新規は `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`。
- workflow step 名: 既存に倣い英語動詞句（"mint staging bearers" 等）。

## 5. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に以下のシステム仕様を確認し既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
|---|---|---|
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | session JWT / admin gate / Magic Link の正本 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP の bearer / session 方針 |
| シークレット管理 | `CLAUDE.md`（シークレット管理セクション） | `::add-mask::` / op 参照 / 平文禁止 |

### 既存 workflow / runbook

| 参照資料 | パス | 内容 |
|---|---|---|
| 旧 500 recovery 教訓 | `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/outputs/lessons-learned-auth-secret-true-cause.md` | AUTH_SECRET binding falsy の真因記録 |
| secret 投入 runbook | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 5 secret の投入・確認・ローテーション |
| CI 分割仕様 | `docs/30-workflows/completed-tasks/issue-617-ci-test-time-reduction-split/` | shard / aggregate coverage gate の設計正本 |

## 6. 成果物

- `outputs/phase-1/requirements.md`（本 Phase の確定事項サマリ）

## 7. 完了条件（DoD）

- [x] 実装区分が実装仕様書と判定され index.md に明記されている
- [x] AC-1〜AC-9 が列挙され、各 lane に紐づいている
- [x] 現状 inventory がパス:行で確定している
- [x] 命名規則（mint helper の `.mts` + tsx、test は `*.spec.ts`）が確定している
- [x] 参照資料（system spec + 既存 runbook）が列挙されている

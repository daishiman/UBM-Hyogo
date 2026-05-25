# Phase 4: テスト計画

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | runtime-smoke-staging-mint-recurrence-fix |
| Phase | 4 / 13 |
| 実装区分 | 実装仕様書（CONST_004 デフォルト） |
| タスク分類 | NON_VISUAL / CI recurrence prevention |
| implementation_mode | new（新規 `bearer-freshness-gate.mts` を含む） |
| 入力 | phase-2-design.md（C-1〜C-6）/ phase-3-design-review.md（GATE PASS）|
| 出力 | TDD Red の期待値・テストケース表・実行コマンド |

## 目的

Phase 2 §C-1（`bearer-freshness-gate.mts` の `decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer`）と §C-4（mint 自己検証）に対する TDD 期待値を、入力と期待出力で確定する。本 Phase は実装済みコードと同期済みで、Phase 5 実装後に Green へ遷移済み。

## TDD Red の前提（実装前に必ず失敗する状態）

1. `scripts/smoke/bearer-freshness-gate.mts` は Phase 4 時点で**未作成**であり、`scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` から import すると module not found で全ケースが Red になる。
2. `scripts/smoke/mint-staging-bearers.mts` は Phase 4 時点で `signSessionJwt` 直呼び（自己検証なし）であり、self-verify ケースは「自己検証関数が存在しない / 呼ばれていない」ことで Red になる。
3. 純粋関数は `Date.now()` / `process.env` を内部で直接読まず、`nowSeconds` / `thresholdSeconds` を引数で受ける設計（Phase 2 §C-1 の test 可能化方針）。これにより固定値注入で決定論的に Red→Green を判定できる。

## テスト方針（純粋関数の test 可能化）

| 方針 | 内容 |
|---|---|
| 引数注入 | `classifyBearerFreshness(token, nowSeconds, thresholdSeconds)` と `explainAuthFailureFromBearer(token, nowSeconds)` は現在時刻を引数 `nowSeconds` で受ける。`decodeJwtExp(token)` は token 文字列のみを受ける。いずれも `Date.now()` / `process.env` を関数内で直接読まない |
| ダミー token 生成 | テストは実 secret を fixture に置かず、`@ubm-hyogo/shared` の `signSessionJwt("test-secret", { ... ttlSeconds })` でダミー JWT を生成するか、payload を base64url 手組みした非署名 token を使う（`decodeJwtExp` は署名検証しないため非署名 token でも exp を読める）|
| 固定 nowSeconds | 境界値テストは `iat` と `exp` を固定し、`nowSeconds` を `exp - threshold` の前後 1 秒で振って境界を突く |
| token 非出力検証 | stdout / stderr に token 文字列が含まれないことの assert は Phase 6（回帰 guard）で扱う。本 Phase は戻り値の正しさに限定する |

## テストケース一覧

### 1. `decodeJwtExp(token: string): number | null`（C-1）

| ID | 対象関数 | 入力 | 期待出力 |
|---|---|---|---|
| D-1 | `decodeJwtExp` | 正常 JWT（`signSessionJwt("test-secret", { ttlSeconds: 600, ... })` で生成、`iat=1_700_000_000`） | `number` 型で `1_700_000_600`（= iat + 600） |
| D-2 | `decodeJwtExp` | セグメント 2 個の文字列（`"aaa.bbb"`、ドット 1 個） | `null` |
| D-3 | `decodeJwtExp` | payload セグメントが base64url の不正 JSON（例: `header.` + `bm90LWpzb24` (= "not-json") + `.sig`） | `null` |
| D-4 | `decodeJwtExp` | payload に `exp` が文字列（`{"exp":"soon"}` を base64url 化した 3 セグメント token） | `null`（`exp` が `number` でない） |
| D-5 | `decodeJwtExp` | payload に `exp` キーが無い（`{"memberId":"m1"}`） | `null` |
| D-6 | `decodeJwtExp` | 空文字列 `""` | `null` |

### 2. `classifyBearerFreshness(token, nowSeconds, thresholdSeconds): JwtFreshness`（C-1, AC-1）

`JwtFreshness = { label: string; exp: number | null; secondsRemaining: number | null; status: "fresh" | "stale" | "expired" | "invalid" }`。token は `exp=1_700_000_600` の正常 JWT を基準とし、`thresholdSeconds=21600`（6h）で検証する。

| ID | 対象関数 | 入力（nowSeconds, threshold） | 期待出力 |
|---|---|---|---|
| A-1 | `classifyBearerFreshness` | now=`1_700_000_600 - 21601`（残り 21601 秒、threshold 超）、threshold=21600 | `{ status: "fresh", secondsRemaining: 21601 }` |
| A-2 | `classifyBearerFreshness` | now=`1_700_000_600 - 21600`（残りちょうど 21600 秒）、threshold=21600 | `{ status: "fresh", secondsRemaining: 21600 }`（境界: ちょうど threshold は fresh）|
| A-3 | `classifyBearerFreshness` | now=`1_700_000_600 - 21599`（残り 21599 秒、threshold 未満だが exp は未来）、threshold=21600 | `{ status: "stale", secondsRemaining: 21599 }` |
| A-4 | `classifyBearerFreshness` | now=`1_700_000_600`（残り 0 秒、exp == now）、threshold=21600 | `{ status: "expired", secondsRemaining: 0 }` |
| A-5 | `classifyBearerFreshness` | now=`1_700_000_601`（exp < now、失効済み、残り -1 秒）、threshold=21600 | `{ status: "expired", secondsRemaining: -1 }` |
| A-6 | `classifyBearerFreshness` | token=`"aaa.bbb"`（decode 不能）、now=任意、threshold=21600 | `{ status: "invalid", secondsRemaining: null }` |

> 境界値の確定（A-2 vs A-3）: `fresh` は `exp - nowSeconds >= thresholdSeconds` で `true`。残り時間がちょうど threshold（A-2）は `fresh: true`、threshold より 1 秒少ない（A-3）は `fresh: false`。

### 3. `explainAuthFailureFromBearer(token, nowSeconds): ExpStatus`（C-1, AC-3）

`explainAuthFailureFromBearer` は 401 後の復旧 reason（`"auth-token-expired" | "auth-secret-drift"`）を返す。token は `exp=1_700_000_600` の正常 JWT を基準とする。

| ID | 対象関数 | 入力（nowSeconds） | 期待出力 |
|---|---|---|---|
| C-1 | `explainAuthFailureFromBearer` | now=`1_700_000_601`（exp < now、失効済み） | `"auth-token-expired"` |
| C-2 | `explainAuthFailureFromBearer` | now=`1_700_000_600`（exp == now） | `"auth-token-expired"`（境界: `exp <= now` を expired とする）|
| C-3 | `explainAuthFailureFromBearer` | now=`1_700_000_599`（exp > now、有効） | `"auth-secret-drift"` |
| C-4 | `explainAuthFailureFromBearer` | token=`"aaa.bbb"`（decode 不能）、now=任意 | `"auth-secret-drift"` |

> 境界値の確定（C-2 vs C-3）: `exp <= now` を `auth-token-expired`、`exp > now` を `auth-secret-drift` とする。C-2（exp == now）は expired 側。

### 4. mint self-verify（C-4, AC-4 / `mint-staging-bearers.spec.ts` 追加）

Phase 5 で `mintStagingBearers` 内の署名後に `verifySessionJwt(token, authSecret)` による自己検証を追加する。本 Phase で期待値を確定する。

| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| M-1 | `mintStagingBearers`（正しい secret で署名→自己検証通過） | `authSecret="test-secret-mint-parity"`、admin/me identity 正常 | reject せず resolve。返り値 `adminBearer` / `meBearer` が `verifySessionJwt(token, "test-secret-mint-parity")` で非 null（self-verify が成功し token を返す）|
| M-2 | `mintStagingBearers`（admin/me 両 bearer が self-verify を通過していること） | M-1 と同入力 | `verifySessionJwt(adminBearer, secret)!.isAdmin === true` かつ `verifySessionJwt(meBearer, secret)!.isAdmin === false`（self-verify 後も claim parity が維持される）|
| M-3 | self-verify 失敗時の throw 経路（理論上の不整合） | 内部 verify で `null` を受ける状況を module mock で再現（`verifySessionJwt` を `null` 返却に差し替え） | `mintStagingBearers` が reject する。reject の `Error.message` に token 文字列や secret を含まない |

> M-3 の補足: `verifySessionJwt` は正しい secret + 正常 claim では実コードで `null` を返さない（auth.ts:147-154 の検証は通過する）ため、self-verify 失敗の throw 経路は `vi.spyOn` / module mock で `verifySessionJwt` を `null` 固定にして到達させる。これにより「self-verify が null なら throw する」ロジックの存在を Red→Green で固定する。

## テスト実行コマンド

`vitest.config.ts` の `include` に `scripts/**/*.spec.ts`（L49）が含まれるため、`scripts/smoke/__tests__/*.spec.ts` は root vitest config で実行される。`pnpm exec vitest run <path>` で対象ファイルのみ実行する。

| 目的 | command |
|---|---|
| freshness gate 純粋関数 unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` |
| mint self-verify unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` |
| smoke 配下 spec 一括 | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__` |
| 型チェック | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |

### shell 側 reason 分岐の検証（bats 非導入のため手動 dry-run）

`runtime-attendance-provider.sh` の 401 reason 細分化（C-3）は shell script のため Vitest 対象外であり、本リポジトリに bats は導入されていない（`scripts/smoke/__tests__/` の shell test は `node --test` 形式ではなく独自 `.test.sh`）。よって reason 分岐は以下の手動 dry-run で検証する。

| ケース | 手動 dry-run 手順 | 期待 |
|---|---|---|
| 401 + exp ≤ now | `runtime-attendance-provider.test.sh` の T-4-8 が fake curl の 401 と過去 exp bearer を注入 | `reason=auth-token-expired` |
| 401 + exp > now | `runtime-attendance-provider.test.sh` の T-4-7 が fake curl の 401 と未来 exp bearer を注入 | `reason=auth-secret-drift` |
| 401 + decode 不能 | `explainAuthFailureFromBearer({ token: "aaa.bbb" })` の unit で drift 導線へ寄せる | `auth-secret-drift` |

> runner 統合は `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` で fake curl を使って検証する。実 staging への通信は CI 限定。

## 受入条件との対応

| AC | 担保するテスト |
|---|---|
| AC-1（鮮度ゲート） | A-1〜A-6（境界 A-2/A-3 含む）+ D-1〜D-6 |
| AC-3（reason 細分化） | C-1〜C-4 + shell 手動 dry-run 3 ケース |
| AC-4（mint 自己検証） | M-1, M-2, M-3 |
| AC-7（token 非出力） | Phase 6 回帰 guard（本 Phase は戻り値の正しさに限定） |

## 実行タスク

1. `decodeJwtExp` の D-1〜D-6 を入力と期待出力で確定する（本 Phase で完了）。
2. `classifyBearerFreshness` の A-1〜A-6（境界 A-2 / A-3 を含む）を確定する。
3. `explainAuthFailureFromBearer` の C-1〜C-4（境界 C-2 / C-3 を含む）を確定する。
4. mint self-verify の M-1〜M-3 を確定する。
5. vitest 実行コマンドを実 config（`vitest.config.ts:49` の `scripts/**/*.spec.ts`）に基づいて確定する。
6. shell reason 分岐を bats 非導入のため手動 dry-run 3 ケースで代替することを宣言する。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 5（実装手順） | D-1〜D-6 / A-1〜A-6 / C-1〜C-4 / M-1〜M-3 を Red 状態の正本とし、実装後に Green へ遷移させる | phase-5-implementation.md |
| Phase 6（テスト追加） | token 非出力（AC-7）の回帰 guard と fail path を本計画の戻り値テストへ追加する | phase-6-test-additions.md |
| Phase 7（カバレッジ） | 本計画のケースで C-1 純粋関数の分岐網羅を可視化する | phase-7-coverage.md |
| smoke runner 統合 | shell reason 分岐（C-3）は helper function の reason 出力（`auth-token-expired` / `auth-secret-drift`）と runner の 401 分岐を結線して検証する | scripts/smoke/runtime-attendance-provider.sh ↔ scripts/smoke/bearer-freshness-gate.mts |

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
|---|---|---|
| エラーハンドリング | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-loud / 診断可能性の方針 |
| 認証/セキュリティ core | `.claude/skills/aiworkflow-requirements/references/architecture-auth-security-core.md` | session 検証境界 |
| セキュリティ運用 | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | secret 取り扱い・漏洩防止 |

### プロジェクト仕様 / コードアンカー

| 参照資料 | パス:行 | 内容 |
|---|---|---|
| 設計 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-2-design.md` | C-1〜C-6 |
| 署名/検証/TTL | `packages/shared/src/auth.ts:42,93,127` | `SESSION_JWT_TTL_SECONDS` / `signSessionJwt` / `verifySessionJwt` |
| 既存 mint unit | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | parity / TTL / 鍵不一致 unit の既存パターン |
| vitest include | `vitest.config.ts:49`（`scripts/**/*.spec.ts`） | smoke spec の実行経路 |

## 成果物

- 本ファイル（`phase-4-test-plan.md`）: TDD Red の期待値・テストケース表（D-1〜D-6 / A-1〜A-6 / C-1〜C-4 / M-1〜M-3）・実行コマンド。

## 完了条件

- [x] `decodeJwtExp` の正常 / セグメント不足 / 不正 JSON / exp 非数値ケースが入力と期待出力で確定している。
- [x] `classifyBearerFreshness` の fresh / stale / expired / invalid と境界値（ちょうど threshold）が確定している。
- [x] `explainAuthFailureFromBearer` の `auth-token-expired` / `auth-secret-drift` と境界値（exp == now）が確定している。
- [x] mint self-verify の通過 / throw ケースが確定している。
- [x] vitest 実行コマンドがリポジトリの実 config（`scripts/**/*.spec.ts`）に基づいて記載されている。
- [x] shell reason 分岐は bats 非導入のため手動 dry-run 手順で代替する旨を明記した。
- [x] 純粋関数を引数注入で test 可能にする方針を明記した。

# Phase 6: テスト拡充（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | runtime-smoke-staging-mint-recurrence-fix |
| Phase | 6 / 13 |
| 実装区分 | 実装仕様書（CONST_004 デフォルト） |
| implementation_mode | new |
| 入力 | phase-4-test-plan.md（正常系・基本系）/ phase-5-implementation.md（実装手順）|
| 出力 | fail path / 回帰 guard / token 非出力 guard の追加ケース |

## 目的

Phase 4 の正常系・基本系に対し、(1) CLI gate の exit code、(2) smoke runner のauth-secret-drift、(3) token 非出力の回帰 guard を拡充する。新規 test は `*.spec.ts` のみ（CLAUDE.md 不変条件 #8）。

## 1. freshness gate CLI の exit code（`bearer-freshness-gate.mts` の direct CLI）

CLI の exit code は純粋関数 `classifyBearerFreshness` の `fresh` / `reason` から決まる。unit では純粋関数の戻り値で exit 分岐ロジックを固定し、CLI の実 exit code は子プロセス起動でも検証する。

| ID | 検証対象 | 入力 | 期待 |
|---|---|---|---|
| G-1 | fresh → exit 0 | `classifyBearerFreshness({ token: <exp が threshold より先の token>, nowSeconds: now, thresholdSeconds: 21600 })` | `status: "fresh"`。CLI 経路は exit 0、stderr に `::error::` を出さない |
| G-2 | stale / expired → exit 1 | `classifyBearerFreshness({ token: <exp - now < 21600 の token>, nowSeconds: now, thresholdSeconds: 21600 })` | `status: "stale"` または `"expired"`。CLI 経路は exit 1、stderr に `seconds_remaining=<N>` を含む `::error::` |
| G-3 | invalid → exit 1 | `classifyBearerFreshness({ label: "admin", token: "aaa.bbb", nowSeconds: now, thresholdSeconds: 21600 })` | `status: "invalid", secondsRemaining: null`。CLI 経路は exit 1 |
| G-4 | 401 reason helper | `explainAuthFailureFromBearer({ token })` を expired / future-exp / invalid token で呼ぶ | expired は `auth-token-expired`、future-exp / invalid token は `auth-secret-drift` |

> CLI の実 exit code 検証は `node:child_process` の `spawnSync("pnpm", ["exec","tsx", "scripts/smoke/bearer-freshness-gate.mts"], { env: { ...process.env, STAGING_ADMIN_BEARER: <token>, STAGING_ME_BEARER: <token>, FRESHNESS_THRESHOLD_SECONDS: "21600" } })` の `status` を assert する。子プロセスを起動できない CI lane では純粋関数戻り値での exit 分岐固定（G-1〜G-3 の戻り値部）で代替する。

## 2. smoke runner のauth-secret-drift（`runtime-attendance-provider.sh` の reason 分岐）

実 staging 通信は CI 限定のため、reason 細分化は helper function の出力確認 + runner の `case` 分岐目視 + 構文チェックで担保する。

| ID | 検証対象 | 手段 | 期待 |
|---|---|---|---|
| R-1 | 401 + exp ≤ now → `auth-token-expired` | `runtime-attendance-provider.test.sh` T-4-8 が fake curl 401 と過去 exp bearer を注入 | `failure_reason=auth-token-expired` |
| R-2 | 401 + exp > now → `auth-secret-drift` | `runtime-attendance-provider.test.sh` T-4-7 が fake curl 401 と未来 exp bearer を注入 | `failure_reason=auth-secret-drift` |
| R-3 | 401 + decode 不能 → auth-secret-drift分類 | `explainAuthFailureFromBearer({ token: "aaa.bbb" })` unit | `auth-secret-drift`（decode 不能は secret drift 導線）|
| R-4 | `pnpm exec tsx -e` argv 契約 | `pnpm exec tsx -e "console.log(JSON.stringify(process.argv))" abc` で argv[1] が user token 位置になることを確認 | `classify_unauthorized_bearer "$bearer"` が token を `process.argv[1]` で受け取れる |
| R-5 | 500 / 403 既存分岐の回帰 | `runtime-attendance-provider.test.sh` T-4-6 / T-4-9 | 既存 `auth-secret-binding-missing` と `auth-not-admin` が新規 401 分割で誤分類されない |

## 3. mint self-verify の fail path（`mint-staging-bearers-self-verify.spec.ts` 追加）

| ID | 検証対象 | 入力 | 期待 |
|---|---|---|---|
| MF-1 | self-verify null で throw | module mock で `verifySessionJwt` を `null` 返却に固定し `mintStagingBearers(baseEnv)` | reject する（self verification が `null` で throw）|
| MF-2 | throw message に token を含まない | MF-1 の reject `Error.message` | `/mint self-verify failed/` にマッチし、`Error.message` が JWT 形式（`xxx.yyy.zzz` の 3 セグメント base64url）を含まない |
| MF-3 | admin / me 両方で self-verify が走る | 正常 secret で mint し `verifySessionJwt` 呼び出し回数を spy | admin / me の 2 回 self-verify が実行される（両 bearer が検証経路を通る）|

## 4. token 非出力の回帰 guard（不変条件 5/6・AC-7）

最重要回帰: 新規 / 変更コードが JWT 文字列・secret・署名鍵を stdout / stderr / 戻り値キー / Error.message に漏らさないこと。

| ID | 検証対象 | 手段 | 期待 |
|---|---|---|---|
| T-1 | freshness gate CLI が token を出さない（not fresh 時） | `spawnSync` で direct CLI を `STAGING_ADMIN_BEARER=<長い token> STAGING_ME_BEARER=<fresh token>` で起動し exit 1 を得る | `stdout` + `stderr` を結合した文字列に token 文字列が**含まれない**ことを `expect(combined).not.toContain(token)` で assert。`seconds_remaining=` / `threshold=` / `status` のみ含む |
| T-2 | helper function が token を出さない | `explainAuthFailureFromBearer({ token })` の戻り値を検証 | 戻り値が `auth-token-expired` / `auth-secret-drift` のいずれかで、token 文字列を含まない |
| T-3 | mint self-verify throw が token を出さない | MF-2 と同（`Error.message` を検査） | `Error.message` に token 文字列を含まない |
| T-4 | freshness gate 戻り値に token / claim が混入しない | `classifyBearerFreshness` の戻り値キー集合 | `Object.keys(result).sort()` が `["fresh","reason","secondsRemaining"]`。token / `exp` 以外の claim（memberId / email / isAdmin）を含まない |
| T-5 | mint 戻り値キーの回帰（既存 T-A8 維持） | `mintStagingBearers` 戻り値キー | `["adminBearer","meBearer","memberId"]`（self-verify 追加で増減しない）|
| T-6 | grep gate（リポジトリ全体の漏洩パターン） | `git grep -nE 'eyJ[A-Za-z0-9_-]{10,}\.' scripts/smoke/bearer-freshness-gate.mts scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` | 一致 0 件（JWT リテラルの平文埋め込みが無い。テストは `signSessionJwt` 生成 token を変数で持ち、リテラルで書かない）|
| T-7 | workflow の既存 redaction grep gate 維持 | `runtime-smoke-staging.yml` L97-100 の `redaction grep gate` step を目視 | `Bearer [A-Za-z0-9_-]{20,}` 等の漏洩検出 gate が ci-evidence/ に対し維持され、新規 step 追加で削除されていない |

## 5. command suite（拡充分）

| 目的 | command |
|---|---|
| freshness gate unit（fail path 含む） | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` |
| mint self-verify unit（fail path 含む） | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` |
| freshness gate CLI 想定動作（not fresh → exit 1） | `STAGING_ADMIN_BEARER="<exp 過去 token>" STAGING_ME_BEARER="<fresh token>" FRESHNESS_THRESHOLD_SECONDS=21600 mise exec -- pnpm exec tsx scripts/smoke/bearer-freshness-gate.mts; echo "exit=$?"` |
| helper function 想定動作 | `pnpm exec tsx -e "import { explainAuthFailureFromBearer } from './scripts/smoke/bearer-freshness-gate.mts'; console.log(explainAuthFailureFromBearer({ token: process.argv[1] ?? '' }));" "<token>"` |
| runner 構文 | `bash -n scripts/smoke/runtime-attendance-provider.sh` |
| workflow 妥当性 | `actionlint .github/workflows/runtime-smoke-staging.yml` |
| 漏洩 grep | `git grep -nE 'eyJ[A-Za-z0-9_-]{10,}\.' scripts/smoke/bearer-freshness-gate.mts scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` |

## 6. 受入条件との対応

| AC | 担保するテスト |
|---|---|
| AC-1（鮮度ゲート exit code） | G-1, G-2, G-3 |
| AC-3（reason 細分化・auth-secret-drift） | R-1, R-2, R-3, R-4, R-5 |
| AC-4（mint 自己検証 fail path） | MF-1, MF-2, MF-3 |
| AC-7（token 非出力） | T-1〜T-7 |

## 実行タスク

1. freshness gate CLI の exit code（fresh→0 / stale・expired・invalid→1）を G-1〜G-4 で確定する（本 Phase で完了）。
2. smoke runner のauth-secret-drift（decode 不能時 drift 導線）を R-1〜R-5 で確定する。
3. mint self-verify の fail path（throw / message に token を含まない）を MF-1〜MF-3 で確定する。
4. token 非出力の回帰 guard（stdout / stderr / 戻り値キー / Error.message / grep gate）を T-1〜T-7 で確定する。
5. 各テストの command を実 config（vitest / tsx / actionlint / git grep）で確定する。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 4（テスト計画） | 戻り値テスト（D/A/C/M 群）を入力とし、本 Phase で fail path・回帰 guard を上乗せする | phase-4-test-plan.md |
| Phase 7（カバレッジ） | G-1〜G-4 / R-1〜R-5 / MF-1〜MF-3 / T-1〜T-7 で網羅した分岐を coverage 可視化の入力とする | phase-7-coverage.md |
| Phase 9（QA） | T-1〜T-7 の token 非出力 guard と git grep gate を QA の漏洩 gate（G-7）へ結線する | phase-9-qa.md |
| freshness gate CLI ↔ workflow | G-1〜G-4 の exit code が C-2 workflow の pre-flight fail と一致することを統合確認する | scripts/smoke/bearer-freshness-gate.mts ↔ .github/workflows/runtime-smoke-staging.yml |

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
|---|---|---|
| エラーハンドリング | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-loud / exit code 設計 |
| セキュリティ運用 | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | token / secret 非露出 |

### プロジェクト仕様 / コードアンカー

| 参照資料 | パス:行 | 内容 |
|---|---|---|
| テスト計画 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-4-test-plan.md` | D/A/C/M ケース |
| 実装手順 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-5-implementation.md` | CLI / runner / mint の差分方針 |
| smoke runner | `scripts/smoke/runtime-attendance-provider.sh:139,167-180` | bearer 保持 / reason 分岐 |
| workflow redaction gate | `.github/workflows/runtime-smoke-staging.yml:97-100` | 既存漏洩検出 step |
| 既存 mint unit | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts:81-84` | 戻り値キー回帰の既存 T-A8 |

## 成果物

- 本ファイル（`phase-6-test-additions.md`）: gate exit code（G-1〜G-4）/ auth-secret-drift（R-1〜R-5）/ mint self-verify fail path（MF-1〜MF-3）/ token 非出力 guard（T-1〜T-7）。

## 完了条件

- [x] gate exit code（fresh→0 / stale・expired・invalid→1）が G-1〜G-3 で確定している。
- [x] smoke runner のauth-secret-drift（decode 不能時 drift 導線）が R-3, R-4 で確定している。
- [x] token 非出力の回帰 guard（stdout/stderr に token 文字列が含まれないことの assert）が T-1, T-2, T-3 で確定している。
- [x] mint self-verify の fail path（throw / message に token を含まない）が MF-1〜MF-3 で確定している。
- [x] 各テストの command が実 config（vitest / tsx / actionlint / git grep）で記載されている。

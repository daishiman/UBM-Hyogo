# Phase 9: 品質保証（QA）

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | runtime-smoke-staging-mint-recurrence-fix |
| Phase | 9 / 13 |
| 実装区分 | 実装仕様書（CONST_004） |
| タスク分類 | NON_VISUAL / CI recurrence prevention |
| 採用方針 | Option C（静的 fallback 維持＋鮮度ゲート） |
| 入力 | phase-7-coverage.md / phase-8-refactor.md |

## 目的

変更した 1 module + 既存 3 ファイル + doc 2 件の実装が緑になる前提条件を、commit 前にローカルで検証する手順を確定する。本タスクは `typecheck` / `lint` / 新規 module vitest / shellcheck / actionlint / token・secret 非漏洩 grep gate / required status context 名の不変確認 / RV-1 CI 時間証跡を gate とする。remote CI でしか確定できない `runtime-smoke-staging / smoke` の実 status は Phase 11 の user-gated 観測へ残す。

## 実行タスク

1. G-1〜G-10 を PASS 基準付きの表で確定する。
2. 実行順序（§2）を確定し、FAIL 時の差し戻し先を明示する。
3. token/secret 非漏洩 grep gate（§3）を既存 redaction grep gate と整合させて確定する。
4. required status context 名 `runtime smoke staging / smoke` の不変確認手順（§4）を確定する。
5. RV-1（setup-project 常時化）の CI 時間証跡方針（§5）を確定する。
6. NON_VISUAL 代替証跡（§6）を Phase 11 へ引き継ぐ。

## 1. QA gate 一覧（PASS 基準表）

| # | gate | 実行コマンド | 対象 | PASS 基準 |
|---|---|---|---|---|
| G-1 | typecheck | `mise exec -- pnpm typecheck` | 全 workspace（`.mts` 含む） | exit 0。`bearer-freshness-gate.mts` の `JwtFreshness` / `ExpStatus` 型、`mint-staging-bearers.mts` の `@ubm-hyogo/shared` import（`signSessionJwt` / `verifySessionJwt`）が型解決。エラー 0 件 |
| G-2 | lint | `mise exec -- pnpm lint`（失敗時はまず `mise exec -- pnpm lint --fix`） | 全 workspace + scripts | exit 0。`--fix` 適用後も残違反 0。新規 `bearer-freshness-gate.mts` / `bearer-freshness-gate.spec.ts` が lint 対象に含まれる |
| G-3 | freshness gate unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` | 新規 module | 全 case PASS。`decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer` の境界値・null 経路ケースが緑（Phase 7 マトリクス） |
| G-4 | mint self-verify unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` | mint helper | 全 case PASS。parity / TTL / self-verify fail path（throw, token 非含有）が緑（AC-4） |
| G-5 | shellcheck | `shellcheck scripts/smoke/runtime-attendance-provider.sh` | 修正 .sh | exit 0（または既存 baseline と同等）。reason 細分化・`` 委譲による新規 warning 0 |
| G-6 | actionlint | `bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7 && ./actionlint -color .github/workflows/runtime-smoke-staging.yml` | 修正 .yml | exit 0。`setup-project` の `if` 撤去・auth-path notice step・freshness-gate step の YAML が valid |
| G-7 | token/secret 非漏洩 grep gate | §3 の grep 群 | 変更ファイル全件 | 平文 JWT / 署名鍵 / secret 実値が 0 件 |
| G-8 | required status context 名 不変確認 | §4 | `runtime-smoke-staging.yml` | job 名 / `name:` から導出される context `runtime smoke staging / smoke` が不変 |
| G-9 | naming drift（reason ⇔ SSOT） | Phase 8 §3.1 の N-1〜N-3 | runner + SSOT | reason 4 文字列が完全一致（集合差分 0） |
| G-10 | RV-1 CI 時間証跡 | §5 | smoke job | `setup-project` 常時化後の job 実時間を記録（`timeout-minutes: 10` 内） |

> G-3 / G-4 の vitest 実行は、helper 本体が `pnpm exec tsx` 実行を想定する場合でも `.spec.ts` は vitest runner で実行する（CLAUDE.md 不変条件 #8: `*.spec.ts` のみ）。`vitest.config.ts:49` の `test.include` が `scripts/**/*.spec.ts` を含むため、`mise exec -- pnpm test` でも当該 spec は実行される。

## 2. 実行手順（順序）

1. `mise exec -- pnpm install`（worktree 独立の `node_modules` のため必須）
2. `mise exec -- pnpm typecheck`（G-1）
3. `mise exec -- pnpm lint`（G-2。失敗時はまず `mise exec -- pnpm lint --fix`）
4. `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts`（G-3）
5. `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts`（G-4）
6. `shellcheck scripts/smoke/runtime-attendance-provider.sh`（G-5）
7. actionlint で `runtime-smoke-staging.yml`（G-6）
8. token/secret 非漏洩 grep gate（G-7 / §3）
9. required status context 名 不変確認（G-8 / §4）
10. naming drift 検証 N-1〜N-3（G-9 / Phase 8 §3.1）
11. RV-1 CI 時間証跡（G-10 / §5）

いずれかが FAIL の場合は Phase 8 / Phase 5 へ差し戻し、修正後に該当 gate から再実行する。

> 代替バンドル: `mise exec -- pnpm observation:lint` は `bash -n` + `shellcheck scripts/observation/*.sh` + actionlint `.github/workflows/*.yml` を一括実行する（`package.json` scripts）。本タスクの actionlint は同経路でも全 workflow を valid 判定できるが、対象を限定する G-6 個別コマンドを正本とする。

## 3. token/secret 非漏洩 grep gate（G-7 詳細）

mint した JWT・署名鍵・secret 実値が log / 成果物 / docs / コードに出ないことを構造的に検証する。**実値の grep ではなく、平文 JWT パターン / 危険な出力経路の不在を grep する**（既存 redaction grep gate と整合: `scripts/redaction-check.sh` / `scripts/__tests__/redaction-check.test.sh`）。

| 検査 | コマンド | 合格基準 |
|---|---|---|
| C-1 平文 JWT パターン不在 | `grep -rEl 'Bearer [A-Za-z0-9_-]{20,}' scripts/smoke/bearer-freshness-gate.mts scripts/smoke/mint-staging-bearers.mts scripts/smoke/runtime-attendance-provider.sh .github/workflows/runtime-smoke-staging.yml docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | 出力 0 件（マッチファイル無し） |
| C-2 base64url JWT 本体パターン不在 | `grep -rE 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' scripts/smoke/bearer-freshness-gate.mts scripts/smoke/mint-staging-bearers.mts docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/` | 0 件（テストフィクスチャ JWT もハードコードしない） |
| C-3 gate / helper の token console 出力経路不在 | `grep -nE 'console\.(log\|error\|warn)\|process\.stdout\.write' scripts/smoke/bearer-freshness-gate.mts scripts/smoke/mint-staging-bearers.mts` で抽出し、出力対象に bearer / token 変数が含まれないことを目視 | bearer / token 変数を出す経路 0 件。gate は `label` + `secondsRemaining` + reason のみ、mint は `GITHUB_OUTPUT` / `GITHUB_ENV` 追記のみ |
| C-4 runner の bearer / Authorization ヘッダ log 不在 | `grep -nE 'Authorization\|\$bearer\|\$STAGING_.*_BEARER' scripts/smoke/runtime-attendance-provider.sh` で抽出し、reason 出力が `jq` の `.error` 種別 / `classify` 結果文字列のみであることを目視 | bearer 文字列の log 経路 0 件 |
| C-5 SSOT / runbook に実値転記なし | `grep -rEl 'Bearer [A-Za-z0-9_-]{20,}\|eyJ[A-Za-z0-9_-]{10,}\.' docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 0 件。op 参照（`op://...`）と手順のみ |
| C-6 mint step の mask 順序 | `runtime-smoke-staging.yml` の mint step が `::add-mask::` を `GITHUB_ENV` export より前に適用しているか目視 | mint→mask→export が同一 step に閉じている（不変条件 1） |

## 4. required status check context 名 不変確認（G-8 詳細）

| 手順 | 内容 | 期待結果 |
|---|---|---|
| P-1 | `runtime-smoke-staging.yml` の workflow `name:` と job `name:` を確認（context は `<workflow name> / <job name>` で導出） | `runtime smoke staging / smoke` を構成する `name:` 値が本タスクで変更されていない |
| P-2 | 本タスクの diff に workflow `name:` / job key / job `name:` の変更が含まれないことを確認 | step の挿入・`if` 撤去のみで、context 導出に関わる `name:` は不変 |
| P-3 | branch protection の required status check 一覧（`gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` 参照、read-only） | `runtime smoke staging / smoke` が required のまま（本タスクで context 名を変えないため再設定不要） |

> P-3 の `gh api` は read-only の事前 evidence 取得に限定する。branch protection の変更（`-X PUT`）は本タスクで実行しない（CLAUDE.md / 不変条件 2）。

## 5. RV-1（setup-project 常時化）CI 時間証跡（G-10 詳細）

Phase 3 RV-1（MINOR）「`setup-project` の `if` 撤去で静的 fallback 時も `pnpm install` が走り CI 時間が増える」の実時間影響を、ここで証跡化する。

| 手順 | 内容 | 合格基準 |
|---|---|---|
| T-1 | `runtime-smoke-staging.yml` の smoke job `timeout-minutes:` 値を確認 | `timeout-minutes: 10`（既存値、本タスクで変更しない） |
| T-2 | Phase 11 で実 CI run の smoke job 総実時間を記録（`setup-project` 常時化後） | 総実時間が `timeout-minutes: 10` 内に収まる |
| T-3 | `setup-project` step 単体の実時間（`pnpm install` 増分）を記録 | 増分が job 総時間の許容範囲内であり timeout に抵触しない |

> 実 CI 観測値は Phase 11 の NON_VISUAL 代替証跡として記録する（secret 投入後・user-gated のため本 Phase では expected 手順のみ）。

## 6. NON_VISUAL 代替証跡（Phase 11 引き継ぎ）

UI 変更が無いため screenshot は取得しない。代替証跡として以下を Phase 11 で記録する。

| 証跡 | 内容 |
|---|---|
| freshness gate unit ログ | `vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` の PASS 出力 |
| mint self-verify unit ログ | `vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` の PASS 出力 |
| shellcheck 結果 | `runtime-attendance-provider.sh` エラー 0 |
| actionlint 結果 | `runtime-smoke-staging.yml` エラー 0 |
| auth path notice dry-run | `runtime-smoke auth path: minted` / `runtime-smoke auth path: static-fallback` の出力（secret 値非含有） |
| freshness gate dry-run | 失効間近 token で exit 1 + `::error::` の redact 済みメッセージ |
| CI 観測 | `runtime smoke staging / smoke` の admin-list 200 + `.members` array（実 CI run・secret 投入後・user-gated）/ RV-1 実時間 |

> secret 実値・JWT 文字列は証跡に含めない（`::add-mask::` 前提 / 不変条件 1）。CI ログは mask 済みのものを参照する。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 6（テスト追加） | T-1〜T-7 の token 非出力 guard を G-7 漏洩 grep gate の入力とする | phase-6-test-additions.md |
| Phase 8（リファクタ） | §5 の不変条件確認を QA gate（exp decode 一元化・reason ⇔ SSOT 一致）として検証する | phase-8-refactor.md |
| Phase 11（手動テスト） | §6 の NON_VISUAL 代替証跡（unit ログ / shellcheck / actionlint / dry-run）を Phase 11 検証計画へ引き継ぐ | phase-11-manual-test.md |
| CI gate 統合 | G-8 の required status context 名（`runtime smoke staging / smoke`）不変と G-10 の RV-1 実時間を実 CI run（secret 投入後・user-gated）で結線確認する | .github/workflows/runtime-smoke-staging.yml |

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| lint scripts 正本 | `package.json` | `lint` / `typecheck` / `smoke:test` / `observation:lint` の実コマンド |
| vitest include 設定 | `vitest.config.ts` | `test.include` に `scripts/**/*.spec.ts`（L49） |
| 既存 actionlint / shellcheck gate | `.github/workflows/ci.yml` | shellcheck（L50）/ actionlint `.github/workflows/*.yml`（L56） |
| 既存 redaction grep gate | `scripts/redaction-check.sh` / `scripts/__tests__/redaction-check.test.sh` | 平文 JWT パターン検出の整合先 |
| reason ⇔ SSOT drift チェック | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-8-refactor.md` | N-1〜N-3 検証手順 |
| 設計レビュー RV-1 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-3-design-review.md` | setup 常時化の CI 時間影響 |
| フォーマット参照 | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/phase-9-qa.md` | 先行タスクの QA gate 構成 |

## 成果物

- 本ファイル（`phase-9-qa.md`）: G-1〜G-10 の PASS 基準表、実行手順、token/secret 非漏洩 grep gate、required status context 不変確認、RV-1 CI 時間証跡方針。

## 完了条件

- [x] `pnpm typecheck` / `pnpm lint`（`--fix`）/ 新規 module vitest / shellcheck / actionlint の実コマンドをリポジトリ設定確認の上で記載した。
- [x] token/secret 非漏洩 grep gate（`grep -rEl 'Bearer [A-Za-z0-9_-]{20,}'` 等で平文 JWT 0 件）を既存 redaction grep gate と整合させて記載した。
- [x] required status check context 名 `runtime smoke staging / smoke` を変更していないことの確認手順（P-1〜P-3）を記載した。
- [x] Phase 3 RV-1（setup-project 常時化による CI 時間増）の実時間証跡を取る方針（T-1〜T-3）を記載した。
- [x] reason ⇔ SSOT naming drift 検証（G-9）を引き継いだ。
- [x] すべて「expected な QA 手順」として具体値で記述した（曖昧語を排し、実コマンド・期待 exit code・件数で表現した）。

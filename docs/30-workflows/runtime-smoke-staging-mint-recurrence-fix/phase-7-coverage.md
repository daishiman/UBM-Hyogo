# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | runtime-smoke-staging-mint-recurrence-fix |
| Phase | 7 / 13 |
| 実装区分 | 実装仕様書（CONST_004） |
| タスク分類 | NON_VISUAL / CI recurrence prevention |
| implementation_mode | new（新規 `bearer-freshness-gate.mts`） |
| 採用方針 | Option C（静的 fallback 維持＋鮮度ゲート） |
| 入力 | phase-4-test-plan.md / phase-5-implementation.md / phase-6-test-additions.md |

## 目的

本タスクで**変更したファイル / 追加したブロックに限定**して line / branch カバレッジを確認する（全体一律の広域 % 目標は設定しない。skill feedback BEFORE-QUIT-002 / feedback 5 準拠）。具体的には、新規 module `scripts/smoke/bearer-freshness-gate.mts` の純粋関数 3 つ（`decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer`）の line / branch を網羅し、`scripts/smoke/mint-staging-bearers.mts` に追加した自己検証分岐（`verifySessionJwt` null / claim mismatch throw 経路）をカバーする。shell（`.sh`）/ yaml（`.yml`）は Vitest カバレッジ計測対象外であることを明示し、代替検証経路を参照する。

## 実行タスク

1. カバレッジ対象を「変更したファイル / ブロックに限定」と確定する（全体一律の広域 % にしない）。
2. 新規 module の 3 純粋関数（`decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer`）の branch 網羅マトリクスを境界値・null 経路込みで確定する。
3. mint 自己検証の追加分岐（成功 return / 失敗 throw）のカバレッジを確定する。
4. shell（`.sh`）/ yaml（`.yml`）の計測対象外を宣言し、代替検証（Phase 9 / Phase 11）へ参照を張る。
5. 変更行の line / branch 実測値の証跡方針と実行コマンドを確定する。

## カバレッジ対象範囲（変更範囲限定）

| 対象 | 種別 | カバレッジ計測 | 目標 | 担保手段 |
|---|---|---|---|---|
| `scripts/smoke/bearer-freshness-gate.mts` の `decodeJwtExp` | 新規 純粋関数 | line / branch 実測 | line 100% / branch 100% | `bearer-freshness-gate.spec.ts`（Phase 6） |
| `scripts/smoke/bearer-freshness-gate.mts` の `classifyBearerFreshness` | 新規 純粋関数 | line / branch 実測 | line 100% / branch 100% | 同上 |
| `scripts/smoke/bearer-freshness-gate.mts` の `explainAuthFailureFromBearer` | 新規 純粋関数 | line / branch 実測 | line 100% / branch 100% | 同上 |
| `scripts/smoke/mint-staging-bearers.mts` の self verification（追加分岐） | 修正 | branch 実測 | 追加分岐（`claims === null` / claim mismatch throw / 正常 return）カバー | `mint-staging-bearers.spec.ts` + `mint-staging-bearers-self-verify.spec.ts` |
| `scripts/smoke/runtime-attendance-provider.sh`（401 reason 細分化） | 修正 .sh | **計測対象外** | — | Phase 9 shellcheck + Phase 11 dry-run |
| `.github/workflows/runtime-smoke-staging.yml`（auth-path notice + freshness-gate step + setup 常時化） | 修正 .yml | **計測対象外** | — | Phase 9 actionlint + Phase 11 dry-run |

> 本タスクで `vitest.config.ts` の coverage 設定は変更しない。同 config の `coverage.include` は `apps/**/src` / `apps/**/app` / `apps/web/proxy.ts` / `packages/**/src` のみで、`scripts/smoke/**` は **include 外**である（`vitest.config.ts:80-85`）。したがって新規 `bearer-freshness-gate.mts` は v8 の集計 coverage 数値（`coverage-guard.sh` の 80% threshold 判定対象）には乗らない。代わりに、下記 §「実行コマンド」で `--coverage.include` を当該ファイルに限定した一時計測を行い、line / branch 実測値を Phase 11 証跡へ残す。

## 純粋関数 3 つの branch 網羅マトリクス（境界値・null 経路）

### `decodeJwtExp(token: string): number | null`

| 入力ケース | 期待 | branch |
|---|---|---|
| 正常 3 セグメント JWT（`exp` 数値） | `exp` の number | 正常経路 |
| セグメント数 ≠ 3（`""` / `"a.b"` / `"a.b.c.d"`） | `null` | セグメント不足 throw 回避経路 |
| payload base64url decode 失敗 | `null` | decode catch → null |
| payload が JSON 不正 | `null` | JSON.parse catch → null |
| payload に `exp` キー無し | `null` | `exp === undefined` 経路 |
| `exp` が非数値（string / null） | `null` | `typeof exp !== "number"` 経路 |

### `classifyBearerFreshness(input): JwtFreshness`

| 入力ケース | `exp - now` | 期待 `status` | 期待 `secondsRemaining` |
|---|---|---|---|
| decode 不能 token | — | `"invalid"` | `null` |
| `exp - now == thresholdSeconds`（境界・等号） | `= threshold` | `"fresh"` | `threshold` |
| `exp - now == thresholdSeconds - 1`（境界直下） | `< threshold` | `"stale"` | `threshold - 1` |
| `exp - now == 0`（exp == now） | `0` | `"expired"` | `0` |
| `exp - now < 0`（失効済み） | 負値 | `"expired"` | 負値 |
| `exp - now >> threshold`（十分新鮮） | `>> threshold` | `"fresh"` | 正の大値 |

### `explainAuthFailureFromBearer(input): reason`

| 入力ケース | 期待 |
|---|---|
| decode 不能 token | `"auth-secret-drift"` |
| `exp <= now`（exp == now を含む境界） | `"auth-token-expired"` |
| `exp > now` | `"auth-secret-drift"` |

> 上記マトリクスは Phase 4 / Phase 6 のテストケースと 1:1 で対応し、3 関数の全 branch（境界値の等号・null 経路を含む）を到達させる。純粋関数のため到達不能経路は無く、line / branch 100% を満たす。

## mint 自己検証の追加分岐カバレッジ

| 分岐 | 条件 | 期待 | 担保ケース |
|---|---|---|---|
| self-verify 成功 | admin / me claims が期待値と一致 | bearer を return | admin / me parity ケース（既存）が同経路を通る |
| self-verify 失敗 | `verifySessionJwt` が `null` または claim mismatch | `throw new Error("minted bearer self verification failed")`（token 文字列は含めない） | `mint-staging-bearers-self-verify.spec.ts` |

> self verification の成功 return / 失敗 throw を両方カバーする。throw メッセージに JWT 文字列を含めないことを branch ごとに確認する（不変条件 5）。

## 変更行の line / branch 実測値の証跡方針

- 広域 coverage %（全 workspace 一律 80% の集計値）を本タスクの目標値にしない（skill feedback 5）。本タスクの coverage 判定は **変更したファイルの当該関数の line / branch 実測値**に限定する。
- 実測値は Phase 11 の代替証跡（NON_VISUAL）として `--coverage.include` を `scripts/smoke/bearer-freshness-gate.mts` / `scripts/smoke/mint-staging-bearers.mts` に限定した一時計測の `text` reporter 出力を記録する。
- 集計 coverage threshold（`coverage-guard.sh` の 80%、`scripts/coverage-guard.sh:22`）は本タスクで変更しない（issue-617 / coverage-80-enforcement 正本維持）。`scripts/smoke/**` は集計 include 外のため、本タスクの新規 module が集計値を変動させないことを確認する。

## shell / yaml の計測対象外宣言と代替検証

| 対象 | 計測対象外の理由 | 代替検証（参照先） |
|---|---|---|
| `scripts/smoke/runtime-attendance-provider.sh` | `.sh` は v8 coverage 計測不能。Vitest の include / coverage.include いずれも `.sh` を対象にしない | Phase 9 G-shellcheck（`shellcheck scripts/smoke/runtime-attendance-provider.sh`）＋ Phase 11 dry-run（401 reason 分岐の擬似 body 確認） |
| `.github/workflows/runtime-smoke-staging.yml` | `.yml` は v8 coverage 計測不能 | Phase 9 actionlint（`./actionlint -color .github/workflows/runtime-smoke-staging.yml`）＋ Phase 11 dry-run（auth-path notice / freshness-gate step の出力確認） |

## 実行コマンド（リポジトリ coverage 設定確認済み）

| # | 目的 | コマンド |
|---|---|---|
| 1 | 新規 spec の実行（calc 対象外の機能確認含む） | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` |
| 2 | 変更ファイル限定の line / branch 実測 | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts --coverage --coverage.include='scripts/smoke/bearer-freshness-gate.mts' --coverage.include='scripts/smoke/mint-staging-bearers.mts' --coverage.reporter=text` |
| 3 | 集計 coverage threshold が不変であることの確認（参考・本タスクで変更しない） | `bash scripts/coverage-guard.sh --no-run` |

> コマンド 2 の `--coverage.include` 上書きは、`vitest.config.ts` の `coverage.include`（`apps/**` / `packages/**` のみ）を当該タスク計測に限り `scripts/smoke/` 配下へ向けるための一時指定であり、config ファイル自体は編集しない。`vitest.config.ts:49` の `test.include` が `scripts/**/*.spec.ts` を含むため、新規 spec はデフォルトの `mise exec -- pnpm test` でも実行される。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 6（テスト追加） | 追加した分岐テストを branch 網羅マトリクスの計測対象とする | phase-6-test-additions.md |
| Phase 8（リファクタ） | exp decode 一元化後も branch 網羅が維持されることを確認する | phase-8-refactor.md |
| Phase 9（QA） | 変更行の line / branch 実測値を QA gate の品質証跡へ引き継ぐ | phase-9-qa.md |
| coverage 設定統合 | `--coverage.include` 一時上書きが `vitest.config.ts` の既定 include（`apps/**` / `packages/**`）を壊さず、`scripts/smoke/` を当該タスク計測へ向けることを確認する | vitest.config.ts ↔ scripts/smoke/__tests__/ |

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| vitest 設定（include / coverage） | `vitest.config.ts` | `test.include` に `scripts/**/*.spec.ts`（L49）、`coverage.include` は `apps/**` / `packages/**` のみ（L80-85） |
| coverage threshold 正本 | `scripts/coverage-guard.sh` | 80% 一律強制（L2, L22）。本タスクで変更しない |
| テスト計画 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-4-test-plan.md` | 純粋関数 / reason 分岐 / mint 自己検証の test 設計 |
| テスト拡充 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-6-test-additions.md` | fail path / 回帰 guard のケース |
| 設計（module 仕様） | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-2-design.md` | C-1 関数シグネチャ / C-4 mint 自己検証 |
| フォーマット参照 | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/phase-7-coverage.md` | 先行タスクの coverage 確認構成 |

## 成果物

- 本ファイル（`phase-7-coverage.md`）: 変更範囲限定のカバレッジ対象 / branch 網羅マトリクス / 実測値証跡方針 / shell・yaml 計測対象外宣言 / 実行コマンド。

## 完了条件

- [x] カバレッジ対象を「変更したファイル / ブロックに限定」と明示した（全体一律ではない）。
- [x] `decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer` の line / branch 100% 目標を境界値・null 経路を含めて記述した。
- [x] mint 自己検証の追加分岐（成功 return / 失敗 throw）をカバーするケースを記述した。
- [x] 変更行の line / branch 実測値を証跡に残す方針（広域 % 目標にしない）を明記した。
- [x] shell（`.sh`）/ yaml（`.yml`）が計測対象外であることと代替検証（Phase 9 shellcheck / actionlint, Phase 11 dry-run）を参照した。
- [x] 実行コマンドをリポジトリの coverage 設定（`vitest.config.ts` / `coverage-guard.sh`）確認の上で正確に記載した。

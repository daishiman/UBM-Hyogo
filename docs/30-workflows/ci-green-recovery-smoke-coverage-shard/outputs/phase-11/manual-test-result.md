# Phase 11 手動テスト結果（NON_VISUAL 代替証跡）

> **UI/UX 変更なしのため Phase 11 スクリーンショット不要。**
> 本タスクは CI workflow / shell script / mint helper の変更であり、画面・スタイル・導線を変更しない。撮影対象が存在しないため、代替証跡（CI 実行ログ・mint parity test 結果・summary.json の `reason` フィールド）で DoD を満たす。

---

## 0. 現在の状態

| 項目 | 値 |
|---|---|
| status | `implemented`（実コード変更済み・ローカル検証 green） |
| visual_category | `NON_VISUAL` |
| ローカル検証日 | 2026-05-23 |
| 証跡取得タイミング | ローカルで検証可能な項目は本ファイルに記録済み。実 staging を要する項目（MT-A1/A2/A3, MT-C1, MT-B1）は CI 実行時に確定する |

---

## 1. 3層評価（NON_VISUAL 版）

| 層 | 評価 | 状態 |
|---|---|---|
| Semantic（型/契約） | 主評価軸。mint シグネチャ / parity / smoke contract / coverage-guard 判定不変 / actionlint | local PASS（remote CI は user-gated） |
| Visual | N/A（UI/UX 変更なし） | — |
| AI UX | N/A（画面体験の変更なし） | — |

---

## 2. 代替証跡記録欄

### 2.1 Lane A — runtime-smoke staging

| ID | 確認内容 | 期待 | 結果 | 証跡パス / run URL |
|---|---|---|---|---|
| MT-A1 | `runtime-smoke-staging / smoke` job 緑 | success | ⏸ CI 実行待ち（要 `STAGING_AUTH_SECRET` 投入） | CI run |
| MT-A2 | `admin-list` http=200 / `.members \| type=="array"` | PASS | ⏸ CI 実行待ち | CI run |
| MT-A3 | `me-root` / `me-profile` / `me-attendance` PASS | PASS | ⏸ CI 実行待ち | CI run |
| MT-A4 | mint parity test（admin isAdmin=true / me isAdmin=false） | PASS | ✅ PASS（8 tests passed） | `vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts` |
| MT-A5 | mint helper が JWT を console/stdout に出さない | GITHUB_OUTPUT/ENV のみ | ✅ コードレビュー済（`appendFileSync` のみ、`console.*` 不在） | `scripts/smoke/mint-staging-bearers.mts` |
| MT-A6 | fallback（`STAGING_AUTH_SECRET` 未設定時）静的 bearer 経路 | mint step skip | ✅ `if: env.STAGING_AUTH_SECRET != ''` で skip（構造レビュー済。local actionlint は未実行: command not found） | `runtime-smoke-staging.yml` |

### 2.2 Lane B/C — coverage

| ID | 確認内容 | 期待 | 結果 | 証跡パス / run URL |
|---|---|---|---|---|
| MT-C1 | `coverage-gate-shard (packages)` checkout 成功 | success（exit 128 解消） | ⏸ CI 実行待ち（hardening は適用済） | CI run |
| MT-C2 | `ci.yml` top-level permissions + workflow lint | PASS | ⏸ local actionlint 未実行（command not found）。permissions/token/step 順序は構造レビュー済 | `ci.yml` / `runtime-smoke-staging.yml` |
| MT-B1 | 全 shard 成功時 `coverage-gate` exit 0 | 緑 | ⏸ CI 実行待ち | CI run |
| MT-B2 | shard 失敗時の明確エラー（MISSING 誤検知でない） | upstream shard failed メッセージ先行 | ✅ step 順序入れ替え済（Fail closed → merge → no-run）+ coverage-guard HINT 追記 | `ci.yml` / `coverage-guard.sh` |

### 2.3 全体回帰

| ID | 確認内容 | 期待 | 結果 |
|---|---|---|---|
| MT-G1 | required context 名不変 | 不変 | ✅ `coverage-gate` / `coverage-gate-shard (...)` job name 不変（grep 確認） |
| MT-G2 | typecheck / lint / unit テスト | 全 PASS | ✅ typecheck PASS / lint PASS / smoke:test 全 PASS / workflow-secrets PASS / mint vitest 8 passed |

---

## 3. summary.json `reason` 検証欄

| HTTP / body | 期待 reason | 観測 reason | 結果 |
|---|---|---|---|
| 500 `auth misconfigured` | `auth-secret-binding-missing` | `auth-secret-binding-missing`（T-4-6） | ✅ PASS |
| 401 `unauthorized` | `auth-token-invalid-or-expired` | `auth-token-invalid-or-expired`（T-4-7） | ✅ PASS |
| 403 `forbidden` | `auth-not-admin` | `auth-not-admin`（T-4-8） | ✅ PASS |
| 200 | （なし） | reason 無し（PASS 経路） | ✅ PASS |

> JWT 文字列は出力に含めない（redact 済み body から error 種別のみを `jq` で読む）。

---

## 4. 結論

- Visual / AI UX は N/A、Semantic を主評価軸とする。
- スクリーンショットは UI/UX 変更なしのため不要。ローカルで検証可能な mint parity / summary.json reason / shell smoke は PASS。remote CI ログは staging secret 投入後の user-gated 観測で確定する。

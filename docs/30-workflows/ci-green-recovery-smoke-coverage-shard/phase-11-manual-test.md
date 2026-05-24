# Phase 11: 手動テスト（NON_VISUAL・代替証跡）

> visual_category: **NON_VISUAL**（UI/UX 変更なし）
> 本タスクは CI workflow / shell script / mint helper の変更であり、画面・スタイル・導線を一切変更しない。
> **したがって Phase 11 のスクリーンショットは不要**（撮影対象が存在しない）。代替として CI 実行ログ・mint parity test 結果・summary.json の `reason` フィールドを証跡とする。

---

## 0. NON_VISUAL 判定根拠

| 観点 | 判定 |
|---|---|
| 変更ファイルに `apps/web/src` 配下の component / style / tokens.css が含まれるか | 含まれない（変更対象は `scripts/smoke/`・`scripts/coverage-guard.sh`・`.github/workflows/*.yml`・runbook docs） |
| OKLch トークン / primitives / レイアウトの変更があるか | なし |
| ユーザーが知覚する画面挙動の変更があるか | なし（CI 緑化と診断改善のみ） |
| 結論 | **NON_VISUAL**。スクリーンショット不要。代替証跡で DoD を満たす |

---

## 1. 3層評価（NON_VISUAL 版）

| 層 | 本タスクでの扱い | 評価方法 |
|---|---|---|
| **Semantic（意味・型・契約）** | 主評価軸 | mint helper の型契約（`mintStagingBearers` シグネチャ）、`signSessionJwt`/`verifySessionJwt` の parity、smoke contract `.members \| type == "array"`、coverage-guard の MISSING 判定不変、actionlint 構文 |
| **Visual（視覚）** | **N/A** | UI/UX 変更なしのため評価対象外 |
| **AI UX（体験品質）** | **N/A** | 画面体験の変更なしのため評価対象外。CI 運用者の DX 改善（reason 分類・診断メッセージ）は Semantic 層で評価 |

---

## 2. 手動テスト項目（代替証跡で確認）

> コード・CI config・runbook は本サイクルで実装済み。以下はローカルで取得済みの代替証跡と、CI 上でしか確定できない user-gated 証跡の定義であり、結果は `outputs/phase-11/manual-test-result.md` に記録する。

### 2.1 Lane A — runtime-smoke staging admin 401 の解消

| ID | 確認内容 | 期待結果 | 証跡 |
|---|---|---|---|
| MT-A1 | `runtime-smoke-staging / smoke` job 全体 | 緑（exit 0） | CI run の job conclusion = success |
| MT-A2 | `admin-list` step | `http=200` かつ contract `.members \| type == "array"` PASS | smoke 標準出力ログ（JWT は redact 済み） |
| MT-A3 | `me-root` / `me-profile` / `me-attendance` | いずれも PASS | 同上 |
| MT-A4 | mint parity test（`scripts/smoke/__tests__/mint-staging-bearers.spec.ts`） | mint→`verifySessionJwt` で admin は `isAdmin===true`、me は `isAdmin===false` を検証通過 | vitest 実行ログ（PASS） |
| MT-A5 | secret / 署名鍵 / JWT 文字列の平文露出が無い | CI ログ・成果物・docs に平文 0 件（`***` マスク済み） | redaction grep gate ログ（`::add-mask::` 適用確認） |
| MT-A6 | 後方互換 fallback（`STAGING_AUTH_SECRET` 未設定時） | 既存静的 bearer 経路で smoke が動作 | mint step が `if:` でスキップされた run ログ |

### 2.2 Lane B/C — coverage-gate / coverage-gate-shard

| ID | 確認内容 | 期待結果 | 証跡 |
|---|---|---|---|
| MT-C1 | `coverage-gate-shard (packages)` の checkout | `could not read Username` が再発しない（exit 128 → success） | CI run の shard job conclusion |
| MT-C2 | `ci.yml` の top-level `permissions: contents: read` | workflow lint PASS | local actionlint は command not found のため未実行。構造レビューと remote/CI 再実行で確認 |
| MT-B1 | 全 shard 成功時の `coverage-gate` | `packages/{contracts,integrations,shared,integrations/google}` の coverage-summary.json を検出し exit 0 | coverage-gate job ログ（緑） |
| MT-B2 | いずれかの shard 失敗時の `coverage-gate` | **MISSING 誤検知ではなく**「upstream shard X failed — coverage artifacts unavailable」を先に出して fail | shard を擬似失敗させた run、または diagnostics メッセージ確認 |

### 2.3 全体回帰

| ID | 確認内容 | 期待結果 |
|---|---|---|
| MT-G1 | required status check の context 名（`coverage-gate` / `runtime smoke staging / smoke`） | 変更なし（branch protection 維持） |
| MT-G2 | `pnpm typecheck` / `pnpm lint` / 新規・既存 unit テスト | 全 PASS |

---

## 3. summary.json `reason` フィールド検証（診断強化の証跡）

Lane A の reason 分類追加（`runtime-attendance-provider.sh`）により、401/403/500 を切り分け可能になった。shell unit は smoke が出力する summary.json の `reason` 値を確認済み。

| HTTP / body | 期待 `reason` | 意味 |
|---|---|---|
| 500 `{"error":"auth misconfigured"}` | `auth-secret-binding-missing` | AUTH_SECRET binding 欠落 |
| 401 `{"error":"unauthorized"}` | `auth-token-invalid-or-expired` | bearer 失効/改ざん（mint 化で恒久解消対象） |
| 403 `{"error":"forbidden"}` | `auth-not-admin` | isAdmin=false |
| 200 | （reason なし） | 正常 |

> `reason` は redact 済み body から `jq` で error 種別のみを読む。JWT 文字列は出力に含めない（不変条件 3 維持）。

---

## 4. 成果物

- `outputs/phase-11/manual-test-result.md`（NON_VISUAL 代替証跡記録。ローカル結果は記録済み、remote CI 緑化結果は user-gated）

## 5. 完了条件（DoD）

- [x] NON_VISUAL 判定とスクリーンショット不要の根拠が明記されている
- [x] 3層評価の Visual / AI UX が N/A、Semantic が主評価軸として定義されている
- [x] 代替証跡（CI ログ / mint parity test / summary.json reason）の確認項目が列挙されている
- [x] 証跡記録テンプレ（`outputs/phase-11/manual-test-result.md`）への引き渡しが定義されている

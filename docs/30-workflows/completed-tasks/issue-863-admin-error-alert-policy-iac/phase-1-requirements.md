# Phase 1: 要件定義 — issue-863 admin error.boundary.caught Sentry alert policy IaC 化

> 実装区分: 実装仕様書
> タスク種別: NON_VISUAL（backend / IaC / logger 変更のみ。UI レンダリング・スクリーンショット対象なし）
> Source issue: [#863](https://github.com/daishiman/UBM-Hyogo/issues/863)（CLOSED のまま仕様書化）
> Parent workflow: `docs/30-workflows/fix-admin-server-components-render-error-stg/`（親 digest=167275886 / 親 PR #849）
> Predecessor one-pager: `docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy.md`

---

## 1. P50 前提確認チェック

| 確認項目 | 結果 | 根拠 | 対応 |
|---|---|---|---|
| current branch に実装が存在するか | **一部存在** | `error.tsx` の emit（`event:"error.boundary.caught", scope:"admin", digest, err`）は実装済（issue-801 由来）。`logger.ts` の Sentry tag 昇格・`infra/sentry-alerts/` IaC・drift CI・runbook・CODEOWNERS は **未実装** | emit 追加はスコープ外。tag 昇格 + IaC 群を新規実装 |
| upstream（dev / main）にマージ済みか | **emit のみマージ済** | `error.tsx` は dev に存在。alert IaC 部分は dev に存在しない | emit 部分は再実装不要を明記。IaC 部分は新規 |
| 前提タスク（依存タスク）が完了済みか | **完了済** | task-03 sentry-workers-sdk-unify（`capture.ts` 提供）/ 09b-A sentry-slack-prod-extension（Slack 連携）/ issue-801（emit）はいずれも dev にマージ済 | 依存解消タスク不要 |

### implementation_mode の決定

- **`implementation_mode: "new"`** とする。
- 理由: 本タスクの価値の核は **(1) `logger.ts` の Sentry tag 昇格（新規コード変更）** と **(2) `infra/sentry-alerts/` IaC 群（完全新規）** であり、両者とも RED/GREEN サイクルで新規実装する。`error.tsx` の emit は既実装だが「emit 追加」はスコープ外のため `verify_existing` 扱いにはしない。
- Phase 5 冒頭に「既実装（emit）= 差分確認のみ / 新規（tag 昇格・IaC）= 通常実装」の二分を明記する。

---

## 2. 背景と解決する根本問題

### 2-1. 背景（親 digest=167275886 の事故経緯）

親タスク `TASK-FIX-ADMIN-SCR-ERR-STG-001`（PR #849）で、admin scope（`/admin/**`）の Server Components render error（digest=167275886）が発生した。この事故は **手動操作で初めて検知**された。本来は alert で能動検知すべきだが、以下の構造的問題があった:

1. admin scope 専用の error 検知 policy が未定義で、public/member shell の error noise に埋もれる。
2. error 検知を手動コンソール設定すると drift し、governance 外（CODEOWNERS 管轄外）になる。
3. production build では Next.js が `error.message` を omit するため、**digest hash が唯一の手掛かり**。digest を一次キーにした集計が必須。

### 2-2. 解決する根本問題

「admin scope の Server Components render error 同型 regression を、deploy 直後に**能動的かつ宣言的（IaC）に**検知できない」こと。

現在のコードへ最適化した根本解決:

| 施策 | 内容 |
|---|---|
| (1) tag 昇格 | `logger.ts` の `emit()` で `scope`/`digest` を Sentry の `extras` 止まりから **`tags` へ昇格**。Sentry alert rule が `scope=admin` でフィルタ可能にする |
| (2) IaC 整備 | Sentry alert rule を `infra/cloudflare-alerts/` と同型の宣言的 IaC `infra/sentry-alerts/` として整備 |
| (3) drift CI | `.github/workflows/sentry-alerts-drift.yml` で repo 宣言と Sentry actual の drift を検知 |
| (4) runbook | `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` で初動対応を文書化 |
| (5) CODEOWNERS | `infra/sentry-alerts/**` に owner 明示 |

### 2-3. telemetry 正本を Sentry に一本化する理由（因果）

- `infra/cloudflare-alerts/` は `alert_type: "billing_usage_alert"` 専用（D1/Workers/KV/R2/Pages の使用量しきい値）であり、**error event を検知できない構造**。billing メトリクスと error イベントは Cloudflare API のリソース系統が別。
- 一方 Sentry は task-03 で Workers SDK 統一、09b-A で Slack インシデント連携済み。`capture.ts` が error/message 双方を送出する正本。
- したがって error telemetry の正本を **Sentry に一本化**し、Cloudflare alerts は billing 専用のまま据え置く。二重 emit（Cloudflare と Sentry へ同一 error を送る）は作らない（CONST_002）。

---

## 3. 受け入れ条件（AC-1..AC-6）

issue #863 の DoD を現状コードへ最適化して引用する。

| ID | 受け入れ条件 | 現状最適化後の判定基準 |
|---|---|---|
| AC-1 | admin scope alert policy IaC がコミットされている | `infra/sentry-alerts/policies/admin-error-boundary.json` + schema + lib + README が存在し、schema-contract test が PASS |
| AC-2 | digest tag + `scope=admin` で閾値発火する | policy JSON の `filters` に `{field:event,value:error.boundary.caught}` と `{field:scope,value:admin}` を持ち、`frequency.window_minutes=5` と `threshold=3` で Sentry issue frequency を監視。`logger.ts` が `scope`/`digest` を **tag** で送出し、`scope` は filter、`digest` は通知 tag と一次切り分けに使う|
| AC-3 | staging で通知到達 evidence が 1 件存在する | Phase 11 で staging 強制エラー → Sentry alert 発火 → Slack `#ubm-hyogo-incidents` 受信を evidence 化（実適用は Phase 13 / user-gated）|
| AC-4 | 初動 runbook が `docs/30-workflows/` 配下に存在する | `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` |
| AC-5 | CODEOWNERS に owner が明示されている | `.github/CODEOWNERS` の governance 領域に `infra/sentry-alerts/** @daishiman` |
| AC-6 | drift が CI で検知される | `.github/workflows/sentry-alerts-drift.yml`（PR では manifest/CLI unit test、schedule/dispatch で read-only drift diff）|

> AC-2 補足: 当初 issue は「Cloudflare alert / Sentry alert で IaC 化（手段は Terraform / analytics_engine / Sentry rule JSON から選択）」と曖昧だった。現状コードでは Cloudflare で error 検知不可のため **Sentry rule JSON IaC に確定**する。

---

## 4. Inventory（変更 / 新規ファイル一覧）— CONST_005

| パス | 種別 | 責務 |
|---|---|---|
| `apps/web/src/lib/logger.ts` | 修正 | `emit()` 内で `scope`/`digest` を Sentry `tags` へ昇格。関数シグネチャ変更なし |
| `apps/web/src/lib/__tests__/logger.spec.ts` | 修正 | `scope`/`digest` が tag として `captureException`/`captureMessage` に渡る検証 case を追加 |
| `infra/sentry-alerts/policies/admin-error-boundary.json` | 新規 | admin scope error.boundary.caught alert policy 宣言 |
| `infra/sentry-alerts/schema/policy.schema.json` | 新規 | policy JSON Schema（`additionalProperties:false` で id 直書き禁止）|
| `infra/sentry-alerts/lib/types.ts` | 新規 | `CanonicalSentryPolicy` 等の共通型 |
| `infra/sentry-alerts/lib/load.ts` | 新規 | `policies/*.json` 読込 + canonical 化 |
| `infra/sentry-alerts/lib/diff.ts` | 新規 | expected/actual の drift 全件列挙（純関数）|
| `infra/sentry-alerts/lib/api-client.ts` | 新規 | Sentry API（alert rules）+ mock fixture 切替。token は env 経由 |
| `infra/sentry-alerts/lib/canonicalize.ts` | 新規 | API response と repo JSON を同一 canonical form に変換 |
| `infra/sentry-alerts/lib/cli.ts` | 新規 | `list`/`diff`/`apply`/`plan` サブコマンド |
| `infra/sentry-alerts/lib/__tests__/schema-contract.spec.ts` | 新規 | policy manifest が server id / 平文 token を含まない検証 |
| `infra/sentry-alerts/lib/__tests__/load.spec.ts` | 新規 | load + canonical 化の検証 |
| `infra/sentry-alerts/lib/__tests__/diff.spec.ts` | 新規 | missing/extra/changed の drift 検出検証 |
| `infra/sentry-alerts/README.md` | 新規 | 構成・op 構成・利用例・不変条件 |
| `.github/workflows/sentry-alerts-drift.yml` | 新規 | drift CI（PR=unit / schedule=drift diff）|
| `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` | 新規 | 初動対応 runbook |
| `.github/CODEOWNERS` | 修正 | governance 領域に `infra/sentry-alerts/** @daishiman` 追加 |
| `package.json` | 修正 | `sentry-alerts:{list,diff,apply}` script 追加 |

---

## 5. 既存命名規則の分析記録（FB-SDK-07-4 / FB-01）

`infra/cloudflare-alerts/` をミラーするため、既存命名規則を以下に固定する。

| 対象 | 既存規則（cloudflare-alerts） | 本タスクでの採用 |
|---|---|---|
| lib ファイル名 | `types.ts` / `load.ts` / `diff.ts` / `api-client.ts` / `canonicalize.ts` / `cli.ts`（kebab-case ファイル、camelCase export）| 同一構成をミラー |
| policy JSON 名 | kebab-case（`workers-kv-stored-bytes.json` / `d1-read-queries.json`）| `admin-error-boundary.json`（kebab-case）|
| policy `name` フィールド | kebab-case + schema pattern `^[a-z0-9-]+$` | `admin-error-boundary`（同 pattern 準拠）|
| export 関数名 | camelCase（`canonicalizePolicy` / `loadExpected` / `diffPolicy` / `listPolicies`）| `canonicalizeSentryPolicy` / `loadExpected` / `diffPolicy` / `listAlertRules` 等の camelCase |
| 型名 | PascalCase（`CanonicalPolicy` / `CanonicalConditions`）| `CanonicalSentryPolicy` / `CanonicalSentryFilter` 等 PascalCase |
| test ファイル | `*.spec.ts`（`schema-contract.spec.ts` / `load.spec.ts` / `diff.spec.ts`）| 同名・`*.spec.ts` のみ（`*.test.ts` 禁止 = CLAUDE.md 不変条件8）|
| pnpm script | `cf:alerts:{list,diff,apply}` / `test:alerts` | `sentry-alerts:{list,diff,apply}` / 既存 `test:alerts` への追記または `test:sentry-alerts`（Phase 2 で確定）|
| CLI exit code | `0`=success/no-drift、`2`=drift、`64`=usage、`78`=config | 同一 exit code 規約をミラー |

> 命名ドリフトは Phase 3 レビューゲートの MINOR 指摘主因。cloudflare-alerts の `camelCase export / kebab-case ファイル・policy 名` を厳守する。

---

## 6. スコープ

### 含む

- `logger.ts` の `scope`/`digest` の Sentry tag 昇格（内部実装変更のみ）
- `logger.spec.ts` への tag 検証 case 追加
- `infra/sentry-alerts/`（policy / schema / lib / lib tests / README）の新規作成
- `.github/workflows/sentry-alerts-drift.yml` の drift CI
- `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` の runbook
- `.github/CODEOWNERS` への path 追加
- `package.json` への script 追加

### 含まない（scope out / 未タスク化候補）

- `error.tsx` への emit 追加（既実装・issue-801 由来）
- 新規 D1 schema 変更 / Google Form 仕様変更（CLAUDE.md 不変条件）
- Cloudflare alerts への error event 検知追加（構造的に不可・billing 専用据え置き）
- public/member scope 向け error alert policy（admin scope に限定。将来拡張は別タスク）
- Sentry alert rule の実適用・staging 疎通の本番反映（Phase 13 / user-gated）
- Issue 自動起票連携（Slack 通知を初期 sink とし、Issue 連携は将来拡張）

---

## 7. 不変条件（タスク全体）

1. `apps/web` env 参照は `getEnv()`/`getPublicEnv()` 経由のみ。`process.env.*` 直接参照を**増やさない**（既存 `logger.ts` の `RUNTIME_TAG` は runtime 検知用の既存例外で、本変更では新規 `process.env` を追加しない）。
2. Sentry を error telemetry の唯一の正本とし、Cloudflare との二重 emit を作らない。
3. 機密値（Sentry API token / DSN）は IaC に焼き込まず op:// 参照 + Cloudflare/GitHub Secrets 経由。
4. `infra/cloudflare-alerts/` パターンをミラーし、新規 primitive を増やさない。
5. 閾値は false-positive < 1 件/日 で緩く初期化（`threshold:3 / window:5min`）。digest は Sentry tag と Slack 通知 tag に含め、一次切り分けキーにする。
6. テストは `*.spec.ts` のみ（`*.test.ts` 禁止）。
7. スコープは 1 実装サイクルで完了可能（CONST_007）。先送り禁止。

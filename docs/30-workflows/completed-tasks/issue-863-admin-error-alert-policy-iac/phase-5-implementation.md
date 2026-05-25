# Phase 5: 実装手順（logger tag 昇格 + sentry-alerts IaC）

> 入力: [phase-4-test-plan.md](phase-4-test-plan.md)
> 出力: `outputs/phase-5/implementation.md`
> 原則 [Feedback RT-03]: 「新規作成」「修正」ファイルパス一覧を必須記載する。

## 5-0. ファイルパス一覧（RT-03 必須）

### 修正ファイル

| パス | 変更内容 |
|---|---|
| `apps/web/src/lib/logger.ts` | `emit()` 内で `merged.scope` / `merged.digest` を Sentry `tags` へ昇格（string のときのみ） |
| `apps/web/src/lib/__tests__/logger.spec.ts` | TC-LOG-01..04 を追加 |
| `package.json` | `sentry-alerts:{list,diff,apply}` script + `test:sentry-alerts` script 追加 |
| `.github/CODEOWNERS` | `infra/sentry-alerts/** @daishiman` 追加 |

### 新規作成ファイル

| パス | 内容 |
|---|---|
| `infra/sentry-alerts/policies/admin-error-boundary.json` | admin scope alert rule 宣言 |
| `infra/sentry-alerts/schema/policy.schema.json` | alert rule policy JSON schema |
| `infra/sentry-alerts/lib/types.ts` | 共通型定義 |
| `infra/sentry-alerts/lib/canonicalize.ts` | local/remote を同一 canonical form へ正規化する純関数 |
| `infra/sentry-alerts/lib/load.ts` | `policies/` 配下 JSON 読み込み + canonicalize |
| `infra/sentry-alerts/lib/diff.ts` | local vs remote の drift 列挙純関数 |
| `infra/sentry-alerts/lib/api-client.ts` | Sentry API / mock fixture 切替層 |
| `infra/sentry-alerts/lib/cli.ts` | `list/diff/plan/apply` subcommand dispatch |
| `infra/sentry-alerts/lib/__tests__/schema-contract.spec.ts` | TC-IAC-01,02 |
| `infra/sentry-alerts/lib/__tests__/load.spec.ts` | TC-IAC-03,04 |
| `infra/sentry-alerts/lib/__tests__/diff.spec.ts` | TC-IAC-05,06,07 |
| `infra/sentry-alerts/README.md` | IaC 運用ドキュメント |
| `.github/workflows/sentry-alerts-drift.yml` | drift 検知 CI |

## 5-1. `logger.ts` の差分方針（★核心コード変更）

`emit()` 内、`payload` 構築直後・`captureException`/`captureMessage` 呼び出し前に `sentryTags` を組み立てる。`merged` は既存の `{ ...base, ...fields }`。

### Before（現状 `emit()` の capture ブロック）

```ts
const merged = { ...base, ...fields };
const safe = redact(merged) as Record<string, unknown>;
const payload = {
  level,
  ts: new Date().toISOString(),
  runtime: RUNTIME_TAG(),
  ...safe,
};
// ...console 出力...
try {
  if (level === "error") {
    void captureException(fields.error ?? fields.err ?? new Error(fields.event), {
      level: "error",
      tags: { event: fields.event, runtime: String(payload.runtime) },
      extras: payload,
    });
  } else if (level === "warn") {
    void captureMessage(fields.event, {
      level: "warning",
      tags: { event: fields.event },
      extras: payload,
    });
  }
} catch {
  // ...
}
```

### After（scope/digest 昇格を追加）

```ts
const merged = { ...base, ...fields };
const safe = redact(merged) as Record<string, unknown>;
const payload = {
  level,
  ts: new Date().toISOString(),
  runtime: RUNTIME_TAG(),
  ...safe,
};
// ...console 出力（変更なし）...

// Sentry alert rule で scope=admin / digest フィルタを可能にするため tag へ昇格。
// 値は string のときのみ追加（PII / 型不定値の混入を防ぐ）。
const sentryTags: Record<string, string> = {
  event: fields.event,
  runtime: String(payload.runtime),
};
if (typeof merged.scope === "string") sentryTags.scope = merged.scope;
if (typeof merged.digest === "string") sentryTags.digest = merged.digest;

try {
  if (level === "error") {
    void captureException(fields.error ?? fields.err ?? new Error(fields.event), {
      level: "error",
      tags: sentryTags,
      extras: payload,
    });
  } else if (level === "warn") {
    void captureMessage(fields.event, {
      level: "warning",
      tags: sentryTags,
      extras: payload,
    });
  }
} catch {
  // capture 側が同期 throw しても logger は throw しない（fail-soft 維持）。
}
```

> 注意:
> - `warn` 経路の tags はこれまで `{ event }` のみだったが、`sentryTags` 共有により `runtime` も付与される。これは観測性向上の意図的変更で TC-LOG-04 で確認する。runtime tag 追加で既存 alert rule を壊さないこと（既存 rule は event でフィルタ）。
> - `merged.scope` / `merged.digest` は `LogFields` の index signature（`[key: string]: unknown`）由来なので `typeof` guard が型安全。
> - `extras: payload` は従来どおり（scope/digest は extras にも残る）。tag は alert フィルタ用、extras は調査用。

**検証**:
```bash
mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/logger.spec.ts
mise exec -- pnpm typecheck
```

## 5-2. `infra/sentry-alerts/policies/admin-error-boundary.json`（完全な内容）

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "admin-error-boundary",
  "description": "Admin scope error.boundary.caught alert (regression guard for SSR render error digest=167275886)",
  "filters": [
    { "field": "event", "value": "error.boundary.caught" },
    { "field": "scope", "value": "admin" }
  ],
  "frequency": {
    "window_minutes": 5,
    "threshold": 3
  },
  "notification_interval_minutes": 5,
  "actions": [
    { "type": "slack", "target": "#ubm-hyogo-incidents", "workspace_id_env": "SENTRY_SLACK_WORKSPACE_ID", "tags": ["environment", "event", "scope", "digest"] }
  ],
  "environment": "production"
}
```

## 5-3. `infra/sentry-alerts/schema/policy.schema.json`（主要フィールド型）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ubm-hyogo.invalid/schema/sentry-alerts/policy.schema.json",
  "title": "SentryAlertPolicy",
  "type": "object",
  "required": ["name", "environment", "action_match", "filter_match", "filters", "frequency", "notification_interval_minutes", "actions"],
  "additionalProperties": false,
  "properties": {
    "$schema": { "type": "string" },
    "name": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "description": { "type": "string", "maxLength": 200 },
    "filters": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["field", "value"],
        "additionalProperties": false,
        "properties": {
          "field": { "type": "string", "enum": ["event", "scope", "runtime", "digest"] },
          "value": { "type": "string" }
        }
      }
    },
    "frequency": {
      "type": "object",
      "required": ["window_minutes", "threshold"],
      "additionalProperties": false,
      "properties": {
        "window_minutes": { "type": "integer", "minimum": 1 },
        "threshold": { "type": "integer", "minimum": 1 },
      }
    },
    "actions": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["type", "target"],
        "additionalProperties": false,
        "properties": {
          "type": { "type": "string", "enum": ["slack"] },
          "target": { "type": "string" }
        }
      }
    },
    "environment": { "type": "string", "enum": ["production", "staging"] }
  }
}
```

## 5-4. lib 各ファイルの関数シグネチャ

### `types.ts`

```ts
export interface PolicyFilter { field: "event" | "scope" | "runtime" | "digest"; value: string; }
export interface PolicyFrequency { window_minutes: number; threshold: number; }
export interface PolicyAction { type: "slack"; target: string; }
export interface Policy {
  name: string;
  description?: string;
  filters: PolicyFilter[];
  frequency: PolicyFrequency;
  actions: PolicyAction[];
  environment: "production" | "staging";
}
export interface RuleListEntry { id: string; name: string; }
```

### `canonicalize.ts`

```ts
import type { Policy } from "./types.ts";
/** Sentry API response と repo JSON を同一 canonical form へ。server 生成キー（id/dateCreated/$schema）を除去、キー sort、filters は field+value で sort、description trimEnd。 */
export function canonicalize(input: unknown): Policy;
```

- `POLICY_STRIP_KEYS = new Set(["id", "dateCreated", "dateUpdated", "$schema", "actorId"])`（cloudflare 側 `POLICY_STRIP_KEYS` をミラー）。
- `filters` は `[...].sort((a,b)=> (a.field+a.value).localeCompare(b.field+b.value))` で順序非依存比較を可能にする。

### `load.ts`

```ts
import type { Policy } from "./types.ts";
/** dir 配下の *.json を昇順で読み、canonicalize 済み Policy[] を返す。dir 不在なら []。 */
export function loadPolicies(dir: string): Policy[];
```

- cloudflare 側 `listJsonFiles`（`fs.existsSync` false で `[]`）を踏襲。`readJson` → `canonicalize`。

### `diff.ts`

```ts
import type { Policy } from "./types.ts";
export type PolicyDiff =
  | { kind: "missing"; name: string }
  | { kind: "extra"; name: string }
  | { kind: "changed"; name: string; path: string; expected: unknown; actual: unknown };
/** local（repo expected）vs remote（Sentry actual）の drift を全件列挙。空配列なら drift なし。 */
export function diffPolicies(local: Policy[], remote: Policy[]): PolicyDiff[];
```

- cloudflare 側 `diffPolicy` の `deepDiff` / name-keyed Map / missing/extra/changed の3分類をそのまま移植。

### `api-client.ts`

```ts
import type { Policy, RuleListEntry } from "./types.ts";
/** Sentry alert rule の read/apply トークンモード切替（cloudflare 側 setAlertTokenMode ミラー）。 */
export function setRuleTokenMode(mode: "read" | "apply"): void;
/** GET alert rules。SENTRY_ALERTS_MOCK_DIR があれば fixture を返す。 */
export function listRules(): Promise<unknown[]>;
/** POST alert rule。mock dir では write-log.txt 追記のみ。 */
export function createRule(body: unknown): Promise<void>;
/** PUT alert rule。 */
export function updateRule(id: string, body: unknown): Promise<void>;
```

- 実 API token は `process.env.SENTRY_AUTH_TOKEN` から読む（Node script なので env 経由）。**ただし値の供給は op:// 経由**で、`scripts/cf.sh` と同様の wrapper（`op run --env-file=.env`）で実行時に揮発注入する。lib コード自体は env を読むだけで op:// 参照を保持しない。
- mock 切替は `SENTRY_ALERTS_MOCK_DIR`（cloudflare の `CF_ALERTS_MOCK_DIR` ミラー）。
- API base: `https://sentry.io/api/0/`。account/org slug は `process.env.SENTRY_ORG` / `SENTRY_PROJECT` から。

### `cli.ts`

```ts
export async function runCli(argv: string[]): Promise<number>;
```

- subcommand dispatch（cloudflare 側 `runCli` の switch をミラー）:
  - `list` → expected(repo) と actual(Sentry) を一覧。exit 0。
  - `diff` → `diffPolicies` で比較。drift あれば exit 2、なければ 0。
  - `plan` → diff と同判定だが exit 常に 0（CI plan 出力用）。
  - `apply` → rule upsert を冪等適用（default dry-run、`--yes` で実適用）。
  - 不明 subcommand → usage 出力 + exit 64。
- entry guard: `process.argv[1].endsWith("/cli.ts")` のときのみ `runCli(...).then(code => process.exit(code))`（vitest からは import のみ）。

## 5-5. `package.json` 追加 script 行

既存 `cf:alerts:*`（58-61行）の直後に追加する。

```json
    "sentry-alerts:list": "bash scripts/cf.sh sentry-alerts list",
    "sentry-alerts:diff": "bash scripts/cf.sh sentry-alerts diff",
    "sentry-alerts:apply": "bash scripts/cf.sh sentry-alerts apply",
    "test:sentry-alerts": "vitest run infra/sentry-alerts/lib/__tests__",
```

> `scripts/cf.sh` を再利用すると op run + esbuild 解決込みで実行できる（CLAUDE.md の Cloudflare CLI ルール準拠）。`cf.sh` に `sentry-alerts` subcommand dispatch を1分岐追加し、`infra/sentry-alerts/lib/cli.ts` を `mise exec -- node` で起動する。`cf.sh` 改修が過剰なら最小として `"sentry-alerts:test": "vitest run infra/sentry-alerts/lib/__tests__"` のみ追加し、list/diff/apply は `bash scripts/with-env.sh node infra/sentry-alerts/lib/cli.ts <cmd>` を直接 script 化してもよい（op 注入は with-env.sh が担保）。

## 5-6. `.github/workflows/sentry-alerts-drift.yml`（job 構成）

`cloudflare-alerts-drift.yml` をミラー。drift が出たら fail（exit 2）。

```yaml
name: sentry-alerts-drift
on:
  schedule:
    - cron: "0 0 1 * *"
  workflow_dispatch:
  pull_request:
    paths:
      - "infra/sentry-alerts/**"
      - "apps/web/src/lib/logger.ts"
      - ".github/workflows/sentry-alerts-drift.yml"
permissions:
  contents: read
jobs:
  validate:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - name: Validate sentry alert manifests and CLI
        run: pnpm test:sentry-alerts
  diff:
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
      SENTRY_ORG: ${{ vars.SENTRY_ORG }}
      SENTRY_PROJECT: ${{ vars.SENTRY_PROJECT }}
      SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN_READ }}
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - name: Run drift diff (read-only)
        id: drift
        run: |
          set +e
          bash scripts/with-env.sh node infra/sentry-alerts/lib/cli.ts diff --ci --json > drift.json
          status=$?
          echo "status=$status" >> "$GITHUB_OUTPUT"
          cat drift.json
          exit $status
      - name: Upload drift artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: sentry-alerts-drift-${{ github.run_id }}
          path: drift.json
          if-no-files-found: ignore
```

> 不変条件: `diff` job は read-only token（`SENTRY_AUTH_TOKEN_READ`）のみ使用。`apply` は CI から実行しない（write scope token を CI Secret に入れない）。

## 5-7. `.github/CODEOWNERS` 追加行

CLAUDE.md「最終マッチ勝ち仕様」に従い、既存 `.github/workflows/**` 等 governance path 群の近傍へ1行追加する。

```
infra/sentry-alerts/** @daishiman
```

**構文検証**:
```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors   # {"errors":[]} を期待
```

## 5-8. ステップ別検証コマンド

| ステップ | 検証コマンド | 期待 |
|---|---|---|
| 5-1 logger 修正 | `mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/logger.spec.ts` | TC-LOG-01..04 GREEN + 既存全 PASS |
| 5-2/5-3 policy+schema | `mise exec -- pnpm exec vitest run infra/sentry-alerts/lib/__tests__/schema-contract.spec.ts` | TC-IAC-01,02 GREEN |
| 5-4 load/diff | `mise exec -- pnpm exec vitest run infra/sentry-alerts/lib/__tests__` | TC-IAC-03..07 GREEN |
| 5-5 package.json | `mise exec -- pnpm test:sentry-alerts` | lib テスト走行 |
| 5-6 workflow yml | `mise exec -- pnpm exec actionlint .github/workflows/sentry-alerts-drift.yml`（任意） | syntax OK |
| 5-7 CODEOWNERS | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` | `{"errors":[]}` |
| 全体 | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` | green |

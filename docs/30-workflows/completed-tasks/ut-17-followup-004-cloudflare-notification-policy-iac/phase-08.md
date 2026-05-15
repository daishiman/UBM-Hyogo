# Phase 8: 実装本体

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (UT-17-Followup-004) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 実装本体 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 7 (テスト実装) |
| 次 Phase | 9 (品質ゲート) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 親 workflow | ut-17-cloudflare-analytics-alerts |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は `infra/cloudflare-alerts/` 配下の JSON 宣言ファイル、`scripts/cf.sh alerts` サブコマンドのシェル実装、Node 純関数（canonicalize / diff / resolve / quota-base 合成）の実コードを生成する Phase。実装の具体仕様を固定するため実装仕様書扱い。`wrangler` 直接禁止条件下で `scripts/cf.sh` 経由のみで完結させる。 |

---

## 目的

Phase 7 のテストを green にできる実装本体を、以下 3 層で固定する:

1. **宣言ファイル層**: `infra/cloudflare-alerts/policies/*.json` + `webhooks/*.json` + `quota-base.json`
2. **Node 純関数層**: `infra/cloudflare-alerts/lib/*.ts`（canonicalize / diff / resolve / quota-base 合成）
3. **シェル統合層**: `scripts/cf.sh alerts {list,diff,apply,plan}` サブコマンド

すべての I/O は `scripts/cf.sh` ラッパー経由のみ。`wrangler` 直接呼び出しおよび `curl` の素呼びは禁止（`cf_alerts_api()` 関数に集約）。

---

## 8-1. ディレクトリ構成

```
infra/cloudflare-alerts/
├── README.md
├── quota-base.json
├── policies/
│   ├── workers-requests.json
│   ├── d1-read-queries.json
│   ├── d1-write-queries.json
│   ├── pages-build.json
│   └── r2-class-a.json
├── webhooks/
│   └── ut-17-relay.json
├── schema/
│   ├── policy.schema.json
│   ├── webhook.schema.json
│   └── quota-base.schema.json
└── lib/
    ├── canonicalize.ts
    ├── diff.ts
    ├── resolve.ts
    ├── quota-base.ts
    ├── load.ts                # 全 JSON を読み込み quota-base 適用済み expected を返す
    ├── api-client.ts          # cf_alerts_api 相当（Node 側）。CF_ALERTS_MOCK_DIR を見る
    ├── cli.ts                 # Node 実装本体（cf.sh から exec される）
    └── __tests__/
        └── (Phase 7 参照)
```

---

## 8-2. `quota-base.json` の完全構造

```json
{
  "$schema": "../schema/quota-base.schema.json",
  "version": 1,
  "source": "https://developers.cloudflare.com/workers/platform/limits/",
  "snapshotAt": "2026-05-09",
  "values": {
    "workers_requests_per_day": 100000,
    "d1_read_queries_per_day": 5000000,
    "d1_write_queries_per_day": 100000,
    "pages_requests_per_month": 100000,
    "r2_class_a_per_month": 1000000,
    "r2_class_b_per_month": 10000000
  }
}
```

monthly healthcheck runbook で「Cloudflare 公式値の差分確認」を行い、変動があればこのファイルを更新する（苦戦箇所 6.3 対応）。

---

## 8-3. policy JSON の完全構造例

### `infra/cloudflare-alerts/policies/workers-requests.json`

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "workers-requests",
  "description": "Workers Requests 80% of free-tier daily quota",
  "alert_type": "billing_usage_alert",
  "enabled": true,
  "conditions": {
    "metric": "workers_requests_per_day",
    "percentage": 0.8
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

> `threshold` は repo に書かない。`computeThreshold(percentage, quotaBase[metric])` で実行時生成する。これにより無料枠値の改定が `quota-base.json` 1 ファイル変更で反映される（苦戦箇所 6.3 解消）。
> `mechanisms.webhooks[]` には ID ではなく `name` のみ書く（苦戦箇所 6.2 解消）。

### `infra/cloudflare-alerts/policies/d1-read-queries.json`

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "d1-read-queries",
  "description": "D1 read queries 80% of free-tier daily quota",
  "alert_type": "billing_usage_alert",
  "enabled": true,
  "conditions": {
    "metric": "d1_read_queries_per_day",
    "percentage": 0.8
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

### `infra/cloudflare-alerts/policies/d1-write-queries.json`

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "d1-write-queries",
  "description": "D1 write queries 80% of free-tier daily quota",
  "alert_type": "billing_usage_alert",
  "enabled": true,
  "conditions": {
    "metric": "d1_write_queries_per_day",
    "percentage": 0.8
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

### `infra/cloudflare-alerts/policies/pages-build.json`

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "pages-build",
  "description": "Pages Build 80% of free-tier monthly quota",
  "alert_type": "billing_usage_alert",
  "enabled": true,
  "conditions": {
    "metric": "pages_requests_per_month",
    "percentage": 0.8
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

### `infra/cloudflare-alerts/policies/r2-class-a.json`

R2 は Class A と Class B で課金体系が分離しているため、1 policy に 2 conditions（OR 結合）を持つ唯一の例外:

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "r2-class-a",
  "description": "R2 Class A + Class B operations 80% of free-tier monthly quota",
  "alert_type": "billing_usage_alert",
  "enabled": true,
  "conditions": {
    "anyOf": [
      { "metric": "r2_class_a_per_month", "percentage": 0.8 },
      { "metric": "r2_class_b_per_month", "percentage": 0.8 }
    ]
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

---

## 8-4. webhook JSON の完全構造

### `infra/cloudflare-alerts/webhooks/ut-17-relay.json`

```json
{
  "$schema": "../schema/webhook.schema.json",
  "name": "ut-17-relay",
  "type": "generic",
  "urlRef": "op://Vault/UT-17-Relay/url",
  "secretHeader": {
    "name": "cf-webhook-auth",
    "valueRef": "op://Vault/UT-17-Relay/cf-webhook-auth"
  }
}
```

> `url` / `secret` 実値は repo に書かない。`urlRef` / `valueRef` で 1Password 参照のみ保持し、`cf.sh alerts apply` 実行時に `op read` で動的解決する。これにより GitHub Secret スキャン・grep 検知の対象から完全に除外できる。

---

## 8-5. JSON Schema 定義

### `infra/cloudflare-alerts/schema/policy.schema.json`（抜粋）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["name", "alert_type", "enabled", "conditions", "mechanisms"],
  "properties": {
    "name": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "description": { "type": "string", "maxLength": 200 },
    "alert_type": { "type": "string", "enum": ["billing_usage_alert"] },
    "enabled": { "type": "boolean" },
    "conditions": {
      "oneOf": [
        {
          "type": "object",
          "required": ["metric", "percentage"],
          "properties": {
            "metric": { "type": "string" },
            "percentage": { "type": "number", "minimum": 0, "exclusiveMaximum": 1 }
          }
        },
        {
          "type": "object",
          "required": ["anyOf"],
          "properties": {
            "anyOf": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "required": ["metric", "percentage"],
                "properties": {
                  "metric": { "type": "string" },
                  "percentage": { "type": "number", "minimum": 0, "exclusiveMaximum": 1 }
                }
              }
            }
          }
        }
      ]
    },
    "mechanisms": {
      "type": "object",
      "required": ["webhooks"],
      "properties": {
        "webhooks": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "required": ["name"],
            "additionalProperties": false,
            "properties": { "name": { "type": "string" } }
          }
        }
      }
    }
  },
  "additionalProperties": false
}
```

> `mechanisms.webhooks[].id` を `additionalProperties: false` で禁止 → 苦戦箇所 6.2「ID 直書き禁止 lint」を Schema レイヤで強制（Phase 9 で ajv validate を gate 化）。

### `infra/cloudflare-alerts/schema/webhook.schema.json`（抜粋）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["name", "type", "urlRef"],
  "properties": {
    "name": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "type": { "type": "string", "enum": ["generic", "slack"] },
    "urlRef": { "type": "string", "pattern": "^op://" },
    "secretHeader": {
      "type": "object",
      "required": ["name", "valueRef"],
      "properties": {
        "name": { "type": "string" },
        "valueRef": { "type": "string", "pattern": "^op://" }
      }
    }
  },
  "additionalProperties": false
}
```

> `url` / `secret` という素のキーを Schema レベルで禁止し、Ref しか書けない構造にすることで「実値混入」事故を構造的に防ぐ。

---

## 8-6. Node 純関数層 — 関数シグネチャと疑似コード

### `infra/cloudflare-alerts/lib/canonicalize.ts`

```ts
export interface CanonicalPolicy {
  name: string;
  description: string;
  alert_type: "billing_usage_alert";
  enabled: boolean;
  conditions: Record<string, unknown>;
  mechanisms: { webhooks: Array<{ name: string }> };
}

const STRIP_KEYS = new Set(["id", "created", "modified", "account_id"]);

export function canonicalizePolicy(input: unknown, webhookIdToName?: Record<string, string>): CanonicalPolicy {
  if (!input || typeof input !== "object") throw new TypeError("policy is not object");
  const o = input as Record<string, unknown>;
  // 1) strip server-generated
  for (const k of STRIP_KEYS) delete o[k];
  // 2) webhook id → name
  const webhooks = ((o.mechanisms as any)?.webhooks ?? []).map((w: any) => {
    if (w.name) return { name: w.name };
    if (w.id && webhookIdToName?.[w.id]) return { name: webhookIdToName[w.id] };
    throw new Error(`cannot resolve webhook ref: ${JSON.stringify(w)}`);
  });
  // 3) threshold 数値化（API 由来）
  const conditions = normalizeConditions(o.conditions);
  // 4) description trim
  const description = String(o.description ?? "").trimEnd();
  return sortKeys({
    name: String(o.name),
    description,
    alert_type: o.alert_type as "billing_usage_alert",
    enabled: Boolean(o.enabled),
    conditions,
    mechanisms: { webhooks },
  });
}
```

### `infra/cloudflare-alerts/lib/diff.ts`

```ts
export type Drift =
  | { kind: "missing"; name: string }
  | { kind: "extra"; name: string }
  | { kind: "changed"; name: string; path: string; expected: unknown; actual: unknown };

export function diffPolicy(expected: CanonicalPolicy[], actual: CanonicalPolicy[]): Drift[] {
  const drifts: Drift[] = [];
  const byNameE = new Map(expected.map((p) => [p.name, p]));
  const byNameA = new Map(actual.map((p) => [p.name, p]));
  for (const [n, e] of byNameE) {
    const a = byNameA.get(n);
    if (!a) drifts.push({ kind: "missing", name: n });
    else drifts.push(...deepDiff(n, "", e, a));
  }
  for (const [n] of byNameA) if (!byNameE.has(n)) drifts.push({ kind: "extra", name: n });
  return drifts;
}
```

### `infra/cloudflare-alerts/lib/resolve.ts`

```ts
export function resolveWebhookId(name: string, list: Array<{ id: string; name: string }>): string {
  const hits = list.filter((w) => w.name === name);
  if (hits.length === 0) throw new Error(`webhook not found: ${name}`);
  if (hits.length > 1) throw new Error(`ambiguous webhook name: ${name}`);
  return hits[0].id;
}

export function computeThreshold(percentage: number, base: number): number {
  if (base <= 0) throw new RangeError("base must be > 0");
  if (percentage <= 0 || percentage >= 1) throw new RangeError("percentage must be in (0, 1)");
  return Math.floor(base * percentage);
}
```

### `infra/cloudflare-alerts/lib/quota-base.ts`

```ts
export function applyQuotaBase(template: PolicyTemplate, base: QuotaBase): CanonicalPolicy {
  const c = template.conditions;
  if ("anyOf" in c) {
    const expanded = c.anyOf.map((leaf) => ({
      metric: leaf.metric,
      threshold: computeThreshold(leaf.percentage, requireBase(base, leaf.metric)),
    }));
    return { ...template, conditions: { anyOf: expanded } };
  }
  return {
    ...template,
    conditions: {
      metric: c.metric,
      threshold: computeThreshold(c.percentage, requireBase(base, c.metric)),
    },
  };
}

function requireBase(base: QuotaBase, metric: string): number {
  const v = (base.values as Record<string, number>)[metric];
  if (v === undefined) throw new Error(`quota base not defined for metric: ${metric}`);
  return v;
}
```

### `infra/cloudflare-alerts/lib/load.ts`

```ts
export function loadExpected(repoRoot: string): { policies: CanonicalPolicy[]; webhooks: CanonicalWebhook[] } {
  const base = readJson(path.join(repoRoot, "infra/cloudflare-alerts/quota-base.json"));
  const policyFiles = glob.sync("infra/cloudflare-alerts/policies/*.json", { cwd: repoRoot });
  const policies = policyFiles.map((f) => applyQuotaBase(readJson(path.join(repoRoot, f)), base));
  const webhookFiles = glob.sync("infra/cloudflare-alerts/webhooks/*.json", { cwd: repoRoot });
  const webhooks = webhookFiles.map((f) => readJson(path.join(repoRoot, f)));
  return { policies: policies.map((p) => canonicalizePolicy(p)), webhooks: webhooks.map(canonicalizeWebhook) };
}
```

---

## 8-7. `scripts/cf.sh alerts` サブコマンド実装骨格

既存 `scripts/cf.sh` の冒頭引数解析 (`if [ "$#" -eq 0 ]`) の直後に **alerts 専用分岐** を差し込む。`wrangler` には流さない。

```bash
# scripts/cf.sh （該当部分の追加骨格）

if [ "$1" = "alerts" ]; then
  shift
  cf_alerts_main "$@"
  exit $?
fi

cf_alerts_main() {
  local sub="${1:-}"; shift || true
  case "$sub" in
    list)   cf_alerts_run list   "$@" ;;
    diff)   cf_alerts_run diff   "$@" ;;
    plan)   cf_alerts_run plan   "$@" ;;
    apply)  cf_alerts_run apply  "$@" ;;
    "")     cf_alerts_usage; return 64 ;;
    *)      echo "[cf.sh] unknown subcommand: $sub" >&2; cf_alerts_usage; return 64 ;;
  esac
}

cf_alerts_usage() {
  cat >&2 <<'EOF'
usage: cf.sh alerts {list|diff|apply|plan} [--json] [--yes] [--ci]
  list             expected (repo) と actual (Cloudflare) を一覧表示
  diff             expected と actual を比較。drift があれば exit 2
  plan             diff と同じ判定だが exit 常に 0（CI plan 出力用）
  apply            webhook destination → policy の順に冪等適用 (dry-run by default)
                   --yes で実適用 / --ci で op run をスキップ
EOF
}

cf_alerts_run() {
  local cmd="$1"; shift
  # CI モード: op run を skip し、CLOUDFLARE_ALERTS_TOKEN_READ を直接利用
  if [[ "$*" == *"--ci"* ]]; then
    if [ -z "${CLOUDFLARE_ALERTS_TOKEN_READ:-}" ]; then
      echo "[cf.sh] CLOUDFLARE_ALERTS_TOKEN_READ is required in --ci mode" >&2
      return 78
    fi
    echo "[cf.sh] CI mode: skipping op run" >&2
    export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_ALERTS_TOKEN_READ"
    mise exec -- node "$REPO_ROOT/infra/cloudflare-alerts/lib/cli.ts" "$cmd" "$@"
    return $?
  fi
  # 通常モード: op run 経由で CLOUDFLARE_ALERTS_TOKEN_READ を 1Password から動的注入
  bash "$REPO_ROOT/scripts/with-env.sh" \
    mise exec -- node "$REPO_ROOT/infra/cloudflare-alerts/lib/cli.ts" "$cmd" "$@"
}
```

`with-env.sh` 側で `.env` に `CLOUDFLARE_ALERTS_TOKEN_READ=op://Vault/UBM-Hyogo Alerts Apply Token/credential` を 1 行追記する（苦戦箇所 6.1 — apply/diff 用は別 token、deploy 用 token とは分離）。

---

## 8-8. `infra/cloudflare-alerts/lib/cli.ts` の主要ロジック疑似コード

```ts
import { loadExpected } from "./load.js";
import { listPolicies, listWebhooks, createWebhook, updateWebhook, createPolicy, updatePolicy } from "./api-client.js";

async function main(cmd: string, argv: string[]) {
  const flags = parseFlags(argv); // { json, yes, ci }
  const { policies: exp, webhooks: expWh } = loadExpected(process.cwd());

  if (cmd === "list") {
    const actualP = (await listPolicies()).map(canonicalizePolicy);
    print(exp, actualP, expWh, flags);
    return 0;
  }

  if (cmd === "diff" || cmd === "plan") {
    const webhookList = await listWebhooks();
    const idMap = Object.fromEntries(webhookList.map((w) => [w.id, w.name]));
    const actualP = (await listPolicies()).map((p) => canonicalizePolicy(p, idMap));
    const actualW = webhookList.map(canonicalizeWebhook);
    const drifts = [...diffWebhook(expWh, actualW), ...diffPolicy(exp, actualP)];
    flags.json ? console.log(JSON.stringify(drifts)) : printHuman(drifts);
    if (cmd === "plan") return 0;
    return drifts.length === 0 ? 0 : 2;
  }

  if (cmd === "apply") {
    // 1) webhook destination upsert（先）
    const webhookList = await listWebhooks();
    for (const w of expWh) {
      const url = await resolveRef(w.urlRef);                // op read
      const headerVal = w.secretHeader ? await resolveRef(w.secretHeader.valueRef) : undefined;
      const existing = webhookList.find((x) => x.name === w.name);
      if (!flags.yes) { console.log("[dry-run]", existing ? "PUT" : "POST", "webhook", w.name); continue; }
      existing ? await updateWebhook(existing.id, w, url, headerVal) : await createWebhook(w, url, headerVal);
    }
    // 2) policy upsert（後 — webhook ID 解決を経由）
    const refreshedWebhooks = await listWebhooks();
    const policyList = await listPolicies();
    for (const p of exp) {
      const payload = renderPolicyPayload(p, refreshedWebhooks); // resolveWebhookId で id 埋め
      const existing = policyList.find((x) => x.name === p.name);
      if (!flags.yes) { console.log("[dry-run]", existing ? "PUT" : "POST", "policy", p.name); continue; }
      existing ? await updatePolicy(existing.id, payload) : await createPolicy(payload);
    }
    return 0;
  }
}
```

### diff 出力フォーマット

human-readable（デフォルト）:

```
drift detected: 2 item(s)
  - changed: workers-requests conditions.threshold expected=80000 actual=90000
  - missing: pages-build
```

JSON（`--json`）:

```json
[
  {"kind":"changed","name":"workers-requests","path":"conditions.threshold","expected":80000,"actual":90000},
  {"kind":"missing","name":"pages-build"}
]
```

---

## 8-9. `infra/cloudflare-alerts/lib/api-client.ts` — API + Mock 切替

```ts
const MOCK = process.env.CF_ALERTS_MOCK_DIR;

export async function listPolicies(): Promise<Policy[]> {
  if (MOCK) return readJson(path.join(MOCK, "api-list-policies.json")).result;
  return cfRequest("GET", `/accounts/${accountId()}/alerting/v3/policies`).then((r) => r.result);
}

export async function createPolicy(body: unknown) {
  if (MOCK) { appendLog("POST", "/alerting/v3/policies", body); return; }
  return cfRequest("POST", `/accounts/${accountId()}/alerting/v3/policies`, body);
}
// updatePolicy / listWebhooks / createWebhook / updateWebhook も同形
```

`appendLog` は `${CF_ALERTS_MOCK_DIR}/write-log.txt` に追記。Phase 7 の S8 / S9 がこの log を assertion する。

---

## 8-10. `infra/cloudflare-alerts/README.md` の必須項目

| 節 | 内容 |
| --- | --- |
| 概要 | 4 category / 5 policy + 1 webhook の IaC 化目的（UT-17 連携） |
| 前提 | 1Password Vault Item `UBM-Hyogo Alerts Apply Token`（scope: `Account.Notifications:Edit`）と `UBM-Hyogo Alerts Read Token`（CI 用、`Account.Notifications:Read`）の発行手順 |
| 利用例 | `bash scripts/cf.sh alerts list` / `diff` / `apply --yes` / `apply` (dry-run) |
| trouble shooting | 6.1（scope 不足エラー）/ 6.2（webhook ID 解決失敗）/ 6.3（quota-base ズレ）の症状と対応 |
| 関連 | UT-17 monthly healthcheck runbook へのリンク |

---

## 8-11. CONST_007 への対応

「テスト先送り禁止」原則に従い、本 Phase 着手と同時に Phase 7 のテストを実装する。テスト red を確認してから実装 green 化する TDD 順とする。

| 順序 | アクション |
| --- | --- |
| 1 | Phase 7 で定義した vitest テストを `infra/cloudflare-alerts/lib/__tests__/` に空実装 + skeleton で配置 |
| 2 | Phase 7 で定義した bats テストを `scripts/__tests__/cf-alerts.bats` に配置（最初は全 fail 想定） |
| 3 | 8-2〜8-5 の JSON / Schema を配置 → ajv validate が pass する状態にする |
| 4 | 8-6 の純関数を実装 → vitest が green になる |
| 5 | 8-7〜8-9 のシェル / Node CLI を実装 → bats が green になる |
| 6 | Phase 9 品質ゲート へ |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md | 推奨アプローチ・苦戦箇所 |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-07.md | テスト仕様 |
| 必須 | scripts/cf.sh | 拡張対象（alerts サブコマンド追加点） |
| 必須 | scripts/with-env.sh | 1Password 動的注入経路 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | wrangler 直接禁止 / scripts/cf.sh 経由必須 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | API スキーマ |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/implementation-spec.md | 8-1〜8-11 の確定版 |
| ドキュメント | outputs/phase-08/json-examples.md | 8-2〜8-5 の完全 JSON 例 |
| ドキュメント | outputs/phase-08/cli-pseudocode.md | 8-7〜8-9 の疑似コード |
| メタ | artifacts.json | phase-08 を completed に更新 |

---

## 完了条件

- [ ] `infra/cloudflare-alerts/` 配下のディレクトリ構成が 8-1 と一致する仕様で固定
- [ ] `quota-base.json` の構造が 8-2 で確定
- [ ] 4 category / 5 policy + 1 R2 anyOf policy + 1 webhook の JSON 構造例が 8-3 / 8-4 で確定
- [ ] policy / webhook / quota-base の JSON Schema が `additionalProperties:false` 含めて 8-5 で確定
- [ ] Node 純関数 5 種のシグネチャと疑似コードが 8-6 で確定
- [ ] `scripts/cf.sh alerts` の 4 サブコマンドのシェル骨格が 8-7 で確定（wrangler 直接呼び出しがない）
- [ ] `cli.ts` の主要ロジック疑似コードが 8-8 で確定（webhook → policy の順序が明示）
- [ ] mock 切替経路（`CF_ALERTS_MOCK_DIR`）が 8-9 で確定
- [ ] CONST_007 TDD 順序が 8-11 で確定
- [ ] webhook destination は `name` を key にして ID 解決する設計（苦戦箇所 6.2 解消）が Schema レベルで強制
- [ ] threshold 絶対値は repo に書かず `percentage × quotaBase` で生成する設計（苦戦箇所 6.3 解消）

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-08 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 9（品質ゲート）
- 引き継ぎ事項:
  - Phase 9 の ajv validate gate は本 Phase の `schema/*.schema.json` を参照する
  - Phase 9 の secret scan は本 Phase の `urlRef` / `valueRef` 設計が前提（実 URL が grep にヒットしないこと）
  - Phase 10 リリース準備は本 Phase の `apply` 順序（webhook → policy）を SOP に転記する
- ブロック条件: 1Password に `UBM-Hyogo Alerts Apply Token`（apply 用 / Edit scope）と `UBM-Hyogo Alerts Read Token`（CI 用 / Read scope）の 2 つを発行できない場合は Phase 10 リリース不可

# Phase 2: 設計 — issue-863 admin error.boundary.caught Sentry alert policy IaC 化

> 実装区分: 実装仕様書 / タスク種別: NON_VISUAL
> 前提: [phase-1-requirements.md](phase-1-requirements.md) の inventory・命名規則を正本とする

---

## 1. telemetry 正本決定（Sentry 一本化）の因果

```
[error.boundary.caught が emit される]
        │
        ├─ Cloudflare alerts (infra/cloudflare-alerts/) で受けられるか？
        │     └─ NO: alert_type は "billing_usage_alert" 固定。
        │            条件は metric(D1/Workers/KV/R2/Pages 使用量) × percentage のみ。
        │            error event / digest / scope を表現する filter slot が存在しない。
        │            → 構造的に admin error 検知に使えない（リソース系統が billing API）
        │
        └─ Sentry で受けられるか？
              └─ YES: logger.ts → capture.ts → captureException が既に送出済み。
                       task-03 で Workers SDK 統一、09b-A で Slack 連携済み。
                       alert rule は event tag / frequency / actions を宣言できる。
                       → error telemetry の正本は Sentry に確定
```

**決定**: error telemetry の正本を **Sentry** に一本化する。Cloudflare alerts は billing 専用のまま据え置き、本タスクで error 検知を Cloudflare 側へ追加しない（CONST_002: 二重 emit 回避）。

ただし「error の宣言的 IaC・drift CI・CODEOWNERS・op:// secret 規律」という**運用 governance パターンは `infra/cloudflare-alerts/` が確立済み**であるため、その topology をミラーして `infra/sentry-alerts/` を作る（API クライアントの向き先だけ Sentry に差し替える）。

---

## 2. `logger.ts` の Sentry tag 昇格設計

### 2-1. 現状（変更前）

`apps/web/src/lib/logger.ts` の `emit()`（L96-109）は以下のように tags を組む:

```ts
// error
void captureException(fields.error ?? fields.err ?? new Error(fields.event), {
  level: "error",
  tags: { event: fields.event, runtime: String(payload.runtime) },  // ← scope/digest なし
  extras: payload,                                                    // ← scope/digest はここ止まり
});
// warn
void captureMessage(fields.event, {
  level: "warning",
  tags: { event: fields.event },                                      // ← scope/digest なし
  extras: payload,
});
```

`capture.ts` の `withContext()`（L58-70）は `ctx.tags` を `scope.setTag(k, v)` で Sentry tag に設定する。一方 `extras` は `setExtra` 止まりで、**Sentry alert rule の filter は tag に対してのみ機能する**。よって `scope=admin` の alert filter と digest の通知 tag 表示を実現するには `scope`/`digest` を tag に昇格する必要がある。

### 2-2. 変更後の設計（内部実装変更のみ・シグネチャ不変）

`emit()` 内で merged から tag を組み立てる。`merged.scope` / `merged.digest` が **string のときだけ** tag に追加する（`digest` は production で `string | undefined`）。

```ts
function emit(level, base, fields) {
  const merged = { ...base, ...fields };
  const safe = redact(merged) as Record<string, unknown>;
  const payload = { level, ts: ..., runtime: RUNTIME_TAG(), ...safe };

  // ... console 出力（変更なし）...

  // Sentry tag を組む（string のみ tag 化。number/object は extras 止まり）
  const tags: Record<string, string> = {
    event: fields.event,
    runtime: String(payload.runtime),
  };
  if (typeof merged.scope === "string") tags.scope = merged.scope;
  if (typeof merged.digest === "string") tags.digest = merged.digest;

  try {
    if (level === "error") {
      void captureException(fields.error ?? fields.err ?? new Error(fields.event), {
        level: "error",
        tags,           // ← scope/digest を含む
        extras: payload,
      });
    } else if (level === "warn") {
      void captureMessage(fields.event, {
        level: "warning",
        tags,           // ← warn も同じ tag を渡す（warn は event のみ→ scope/digest 追加）
        extras: payload,
      });
    }
  } catch { /* fail-soft 維持 */ }
}
```

### 2-3. 入出力・副作用

| 項目 | 内容 |
|---|---|
| 入力 | `LogFields`（`event` 必須、`scope`/`digest` は任意の自由 field）|
| 出力（観測可能な副作用）| `captureException`/`captureMessage` へ `tags.scope` / `tags.digest` が渡る（string のとき）|
| シグネチャ変更 | **なし**。`Logger` interface・`emit` の引数は不変。呼び出し側（`error.tsx`）の変更不要 |
| redact 整合 | `scope`/`digest` は `REDACT_KEYS`（email/name/token/secret/dsn/password/authorization）に含まれず PII でない。redact 後も string のまま保持される |
| fail-soft | `try/catch` で capture 例外を握り潰す現行挙動を維持（CONST: logger は throw しない）|
| `digest` undefined 時 | tag を**付けない**（`typeof !== "string"` で skip）。alert rule 側は digest tag 欠落でも event+scope で発火可能 |

> 注: `digest` を tag 値にすると Sentry の tag cardinality が増える。digest は hash で有限・短命のため許容範囲とし、alert 通知の切り分け tag として使う。Sentry Issue Alert API の native 形状では任意 tag group-by は宣言しない。

---

## 3. `infra/sentry-alerts/` IaC topology

### 3-1. ディレクトリ構成（cloudflare-alerts ミラー）

```
infra/sentry-alerts/
├── README.md
├── policies/
│   └── admin-error-boundary.json     # 唯一の policy（admin scope 限定）
├── schema/
│   └── policy.schema.json            # additionalProperties:false で id 直書き禁止
└── lib/
    ├── types.ts
    ├── load.ts
    ├── diff.ts
    ├── api-client.ts
    ├── canonicalize.ts
    ├── cli.ts
    └── __tests__/
        ├── schema-contract.spec.ts
        ├── load.spec.ts
        └── diff.spec.ts
```

> cloudflare-alerts に存在する `quota-base.json` / `webhooks/` / `resolve.ts` は **本タスクでは不要**。理由: Sentry alert は billing しきい値（quota-base）も webhook destination 解決（resolve）も持たず、notification は Sentry 側 integration（Slack）の名前参照で済むため。新規 primitive を増やさない原則（CONST_004）に従い、必要最小の lib に絞る。

### 3-2. policy JSON 構造（`policies/admin-error-boundary.json`）

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "admin-error-boundary",
  "description": "admin scope Server Components render error (error.boundary.caught) regression detection",
  "environment": "staging",
  "action_match": "all",
  "filter_match": "all",
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
    {
      "type": "slack",
      "target": "#ubm-hyogo-incidents",
      "workspace_id_env": "SENTRY_SLACK_WORKSPACE_ID",
      "tags": ["environment", "event", "scope", "digest"]
    }
  ]
}
```

| フィールド | 意味 | 設計根拠 |
|---|---|---|
| `name` | policy 識別子（kebab-case / pattern `^[a-z0-9-]+$`）| cloudflare-alerts と同 pattern |
| `description` | 用途説明（maxLength 200）| schema 制約 |
| `environment` | 対象環境。初期 `staging`（AC-3 が staging 疎通）| production 拡張は別宣言で追加 |
| `action_match` | `all`=condition をすべて満たしたら action | Sentry Issue Alert API の `actionMatch` へ変換 |
| `filter_match` | `all`=AND（event AND scope の両方一致）| admin scope に厳密限定 |
| `filters[]` | `{field,value}` の tag filter。`event=error.boundary.caught` + `scope=admin` | §2 の tag 昇格があって初めて機能する（依存関係）|
| `frequency.window_minutes:5 / threshold:3` | 5 分内に 3 件で発火 | CONST: false-positive < 1 件/日 で緩く初期化 |
| `digest` tag | Slack 通知に表示 | production は message omit、digest が一次切り分けの手掛かり |
| `actions[].type:slack / target:#ubm-hyogo-incidents` | 既存 Slack インシデント連携へ通知 | 09b-A で provisioning 済みチャンネルを再利用（新規 sink を作らない）|
| `notification_interval_minutes` | `5` | Sentry action cooldown。実適用は Phase 13 user-gated |

### 3-3. lib 責務分担

| ファイル | 責務 | cloudflare-alerts 対応 |
|---|---|---|
| `types.ts` | `CanonicalSentryPolicy` / `CanonicalSentryFilter` / `CanonicalFrequency` / `CanonicalAction` / `AlertRuleListEntry` を定義 | `types.ts`（`CanonicalPolicy` 等）|
| `load.ts` | `policies/*.json` を読み込み、`canonicalizeSentryPolicy` を通して expected `CanonicalSentryPolicy[]` を返す。`loadExpected(repoRoot)` | `load.ts`（`loadExpected`）。quota-base 適用は不要なので削減 |
| `canonicalize.ts` | API response と repo JSON を同一 canonical form へ変換（server id / created / modified を strip、filter を key 昇順 sort、threshold を number 化）。`canonicalizeSentryPolicy(input)` | `canonicalize.ts`（`canonicalizePolicy`）。diff 安定化のため key sort を流用 |
| `diff.ts` | expected/actual から `Drift[]`（missing/extra/changed）を全件列挙する純関数。`diffPolicy(expected, actual)` | `diff.ts`（`diffPolicy` / `deepDiff`）をほぼそのまま流用 |
| `api-client.ts` | Sentry API（alert rules）と mock fixture の切替層。`SENTRY_ALERTS_MOCK_DIR` で fixture、write は log のみ。token は `SENTRY_AUTH_TOKEN`（env 経由）。`listAlertRules` / `createAlertRule` / `updateAlertRule` | `api-client.ts`（`listPolicies` 等）。向き先を Sentry API に差し替え |
| `cli.ts` | `list`/`diff`/`plan`/`apply` サブコマンド。exit code 0/2/64/78 | `cli.ts`（`runCli`）をミラー。webhook upsert 段は不要なので policy upsert のみ |
| `__tests__/schema-contract.spec.ts` | policy manifest が server id / 平文 token / DSN を含まない検証 | `schema-contract.spec.ts` |
| `__tests__/load.spec.ts` | load + canonical 化の検証 | `load.spec.ts` |
| `__tests__/diff.spec.ts` | missing/extra/changed の検出検証 | `diff.spec.ts` |

### 3-4. api-client の Sentry 認証（CONST_003）

- token は `SENTRY_AUTH_TOKEN`（Cloudflare/GitHub Secrets 経由）。`.env` には op:// 参照のみ（`op://UBM-Hyogo/Sentry Alerts Token/credential`）。
- 実値を IaC JSON / README / コメントに焼き込まない。
- read scope（`org:read` / `project:read`）と apply scope（`project:write` / `alerts:write`）を分離。CI（drift diff）には read scope のみ。apply token は CI Secret に入れない（cloudflare-alerts の token 分離原則をミラー）。
- mock fixture モード（`SENTRY_ALERTS_MOCK_DIR`）では実 API を呼ばず、write 系は `write-log.txt` に追記するのみ。これにより PR の unit test は secret なしで動く。

### 3-5. CLI の pnpm script / cf.sh 経由判断（Phase 5 で確定）

- 候補A: `scripts/cf.sh` に `sentry-alerts` サブコマンドを追加（op 注入を再利用）。
- 候補B: 専用ラッパー（Sentry は Cloudflare とは認証系統が別のため、`cf.sh` 拡張は責務混在のリスク）。
- **本設計の推奨**: `package.json` に `sentry-alerts:{list,diff,apply}` script を追加し、内部で `op run --env-file=.env -- node infra/sentry-alerts/lib/cli.ts <cmd>` 相当を呼ぶ薄いラッパー（`scripts/sentry-alerts.sh` 新規 or 既存 with-env.sh 再利用）。`cf.sh` は Cloudflare 専用に保つ（責務分離）。最終形は Phase 5 で確定し、Phase 1 inventory の `package.json` 修正に反映する。

---

## 4. 状態所有権と drift CI 判定ロジック

### 4-1. 状態所有権

| レイヤ | 役割 | 正本性 |
|---|---|---|
| `infra/sentry-alerts/policies/*.json` | alert rule の宣言 | **正本（source of truth）** |
| Sentry console（actual alert rules）| 実際に稼働する rule | **従（repo に追従させる）** |
| `logger.ts` の tag | filter が機能する前提条件 | コード側正本（policy filter が参照する tag を供給）|

drift が出た場合の意思決定権: **repo を正とし、`apply` で Sentry を repo に収束させる**（手動コンソール変更は drift として検知し是正）。

### 4-2. drift CI 判定ロジック（`.github/workflows/sentry-alerts-drift.yml`）

cloudflare-alerts-drift.yml をミラー:

| トリガ | job | 内容 | secret 利用 |
|---|---|---|---|
| `pull_request`（paths: `infra/sentry-alerts/**` 等）| `validate` | manifest + CLI unit test のみ（`pnpm test:sentry-alerts` 相当）| なし（mock fixture）|
| `schedule`（月次 `cron: 0 0 1 * *`）/ `workflow_dispatch` | `diff` | read-only token で `sentry-alerts diff --ci --json`。drift があれば exit 2 で job fail | read token のみ |

- `apply` は本 workflow から**絶対に実行しない**（apply scope token を CI Secret に入れない）。
- diff job は drift.json を artifact upload（`if: always()`）。
- `permissions: contents: read`。

---

## 5. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 既存コンポーネント | 再利用可否 | 判断 |
|---|---|---|
| `capture.ts`（`captureException`/`captureMessage`/`CaptureContext`）| **そのまま再利用** | `CaptureContext.tags` が既に `Record<string,string>` を受け、`withContext` が `setTag` する。tag 昇格は `logger.ts` 側で tags に詰めるだけで済み、`capture.ts` 変更不要 |
| `cloudflare-alerts/lib/diff.ts`（`deepDiff`/`diffPolicy`）| **ロジック流用（複製 or 共有化）** | drift 検出ロジックは alert provider 非依存。型だけ差し替えれば流用可能 |
| `cloudflare-alerts/lib/canonicalize.ts`（`sortKeys`/`isObject`/strip keys）| **ロジック流用** | key sort・server key strip は provider 非依存 |
| `cloudflare-alerts/lib/cli.ts`（exit code 規約 / `runCli` 構造）| **構造流用** | サブコマンド・exit code は同一規約 |
| `cloudflare-alerts/lib/api-client.ts`（mock fixture 切替パターン）| **パターン流用** | API 向き先のみ Sentry に差し替え |

### 共有 util 化の判断（Phase 8 候補として明記）

- 初回（本タスク）は **複製（duplicate）**で実装する。理由: Sentry と Cloudflare の canonical 形・filter モデルが異なり、無理に共通化すると型が緩くなる。1 実装サイクル完了（CONST_007）を優先。
- ただし `deepDiff`（純粋な再帰 diff）と `sortKeys`/`isObject`（汎用ユーティリティ）は provider 非依存で重複が明白。**Phase 8（リファクタリング）で `infra/_shared/iac-diff.ts` への共有 util 抽出を検討**する。本タスクでは Phase 8 候補として記録し、初回スコープでは複製で閉じる。
- 抽出する場合の境界: 共有してよいのは「型を取らない汎用 diff/sort/isObject」のみ。`diffPolicy`（型付き）・`canonicalizeXxxPolicy`（provider 固有）は各 lib に残す。

---

## 6. データフロー全体図

```
[admin/error.tsx] logger.error({ event:"error.boundary.caught", scope:"admin", digest, err })
        │
        ▼
[logger.ts emit()]  tags = { event, runtime, scope, digest(string時) }   ← 本タスクの変更点
        │
        ▼
[capture.ts captureException]  withContext → scope.setTag(scope, "admin"), setTag(digest, "...")
        │
        ▼
[Sentry]  alert rule "admin-error-boundary" が filters(event AND scope) + frequency(threshold:3/5min) + digest notification tag で評価
        │
        ▼
[Slack #ubm-hyogo-incidents]  通知

────── 別系統（IaC governance）──────
[infra/sentry-alerts/policies/admin-error-boundary.json]  ← 正本
        │ load → canonicalize
        ▼
[cli diff]  expected vs Sentry actual(canonicalize) → Drift[]
        │
        ▼
[sentry-alerts-drift.yml]  PR=unit test / schedule=read-only drift diff (exit 2 if drift)
```

# Phase 2: 設計

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase は当初「後続実装者向け設計」として作成されたが、CONST_004/005 に基づき今回サイクルで実装まで完了した。以下の設計は実装済みの `binding-policy-drift.ts` / `cli.ts` / `cf.sh` / CI gate / tests の正本設計として読む。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056） |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-06-02 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |

## 目的

Phase 1 の AC-1〜AC-9 を、後続実装者がそのまま着手できる粒度の **モジュール構成・関数シグネチャ・データ構造・CLI 配線・変更ファイル一覧** に落とし込む。検知は read-only な純関数群 + 薄い CLI ラッパで構成し、policy `enabled` は既存 `load.ts` を再利用、binding 活性はコメント尊重 line parser で取得する。

## アーキテクチャ概要

```
apps/api/wrangler.toml ──┐
                         ├─(line parser)→ ActiveBindingSet {kv:boolean, r2:boolean, names:[]}
                         │
infra/cloudflare-alerts/ │
  policies/*.json ──(load.ts loadExpected)→ CanonicalPolicy[] {name, enabled}
                         │
                         ▼
   buildBindingPolicyDrift(bindings, policies, BINDING_POLICY_MAP)
                         │
                         ▼
            BindingPolicyDrift[]  ──(cli.ts cmdBindingDrift)→ stdout + exit 0|2
```

- 全経路 read-only（ファイル read のみ）。Cloudflare API・op CLI・secret を一切呼ばない。
- 既存 `cmdList`/`cmdDiff`/`cmdApply`（`setAlertTokenMode` + `loadActual` で Cloudflare API を叩く）とは独立した経路で、`binding-drift` は `loadActual` を呼ばない。

## モジュール設計: `infra/cloudflare-alerts/lib/binding-policy-drift.ts`（新規）

### 型定義

```ts
import type { CanonicalPolicy } from "./types.ts";

/** binding の種別。free-tier quota は account 単位のため kind 粒度で集約する。 */
export type BindingKind = "kv" | "r2";

/** wrangler.toml から抽出した「いずれかの env で active な binding」集合。 */
export interface ActiveBindingSet {
  /** active な KV namespace binding が 1 つ以上あるか */
  kv: boolean;
  /** active な R2 bucket binding が 1 つ以上あるか */
  r2: boolean;
  /** active な binding 名（report 用。env prefix は除去し binding 名のみ） */
  kvNames: string[];
  r2Names: string[];
}

/** kind ↔ 監視 policy 名の対応表エントリ。 */
export interface BindingPolicyMapping {
  kind: BindingKind;
  /** この kind が active なら enabled であるべき policy 名 */
  policies: string[];
  /** 棚卸し・report 用の人間可読ラベル */
  label: string;
}

/** 検知された drift。read-only な事実列挙であり mutation を一切含まない。 */
export type BindingPolicyDrift =
  | {
      kind: "MONITORING_GAP";
      bindingKind: BindingKind;
      policy: string;
      activeBindings: string[];
      message: string;
    }
  | {
      kind: "STALE_MONITORING";
      bindingKind: BindingKind;
      policy: string;
      message: string;
    };
```

### 対応表（mapping const）

```ts
/**
 * binding kind ↔ alert policy 対応表。
 * KV/R2 の free-tier quota は account 単位（per-binding ではない）ため、
 * 「kind が 1 binding でも active なら対応 policy は enabled であるべき」とする。
 * policy 名は infra/cloudflare-alerts/policies/<name>.json の "name" と一致させる。
 */
export const BINDING_POLICY_MAP: readonly BindingPolicyMapping[] = [
  {
    kind: "kv",
    label: "Workers KV (account-wide quota)",
    policies: ["workers-kv-writes-per-day", "workers-kv-stored-bytes"],
  },
  {
    kind: "r2",
    label: "R2 (account-wide Class A/B quota)",
    policies: ["r2-class-a"],
  },
] as const;
```

### wrangler.toml line parser

```ts
/**
 * wrangler.toml を行走査し、active な KV / R2 binding を抽出する。
 * - `#` から始まる行（先頭空白を trim 後）は comment = inactive とみなす（ALERT_DEDUP_KV 対策）。
 *   TOML ライブラリは comment block を捨てるため使わず、コメント可視な自作 line parser を使う。
 * - `[[...kv_namespaces]]` / `[[...r2_buckets]]` テーブルヘッダで現在の kind を切り替え、
 *   直後の active な `binding = "<NAME>"` 行を収集する。
 * - production / staging の両 env を横断し、いずれかで active なら active と集約する
 *   （quota は account 単位のため env 区別なく合算判定）。
 */
export function parseActiveBindings(tomlText: string): ActiveBindingSet;
```

パーサ状態機械（擬似仕様）:

1. 入力を改行で分割し 1 行ずつ走査。
2. `const trimmed = line.replace(/^\s+/, "")`。`trimmed.startsWith("#")` なら **skip**（inactive）。
3. `trimmed` が `[[` を含むテーブルヘッダなら:
   - `kv_namespaces` を含む → `currentKind = "kv"`
   - `r2_buckets` を含む → `currentKind = "r2"`
   - それ以外（`d1_databases` / `services` / `queues` / `assets` 等）→ `currentKind = null`
4. `currentKind` が非 null かつ `binding = "..."` に一致する非コメント行なら、binding 名を該当 kind の集合へ追加。
5. 走査後、`kv = kvNames.length > 0` / `r2 = r2Names.length > 0`。重複名は dedupe。

> 注: `binding = "DB"`（d1）/ `"ASSETS"` / `"API_SERVICE"` / `"SYNC_ALERTS"`（queue）等は kv/r2 テーブル外なので currentKind=null で無視される。`UBM_AUDIT_COLD_STORAGE` 等は `[[env.*.r2_buckets]]` 配下なので r2 として収集される。

### drift 純関数

```ts
/**
 * active binding 集合と canonical policy 群を BINDING_POLICY_MAP で突合し、drift を全件列挙する。
 * 戻り値が空配列なら drift なし。mutation は一切行わない（read-only）。
 */
export function buildBindingPolicyDrift(
  bindings: ActiveBindingSet,
  policies: CanonicalPolicy[],
  map: readonly BindingPolicyMapping[] = BINDING_POLICY_MAP,
): BindingPolicyDrift[];
```

判定ロジック:

```
enabledByName = new Map(policies.map(p => [p.name, p.enabled]))
for each mapping in map:
  active = bindings[mapping.kind]   // kv or r2
  activeNames = mapping.kind === "kv" ? bindings.kvNames : bindings.r2Names
  for each policyName in mapping.policies:
    enabled = policyByName.get(policyName)?.enabled ?? false   // policy 不在は disabled 扱い
    if active && !enabled:
      → MONITORING_GAP { bindingKind, policy: policyName, activeBindings: activeNames,
          message: `${mapping.label} binding active (${activeNames.join(",")}) だが監視 policy '${policyName}' が enabled:false` }
    else if !active && enabled:
      → STALE_MONITORING { bindingKind, policy: policyName,
          message: `監視 policy '${policyName}' は enabled だが ${mapping.label} binding が inactive` }
    // active && enabled / !active && !enabled は drift なし
```

### 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `parseActiveBindings` | wrangler.toml の文字列 | `ActiveBindingSet` | なし（純関数） |
| `buildBindingPolicyDrift` | bindings + policies + map | `BindingPolicyDrift[]` | なし（純関数） |
| `loadActiveBindings(repoRoot)`（薄い IO helper） | repoRoot | `ActiveBindingSet` | `apps/api/wrangler.toml` の read のみ |

## CLI 配線: `infra/cloudflare-alerts/lib/cli.ts`（編集）

### 追加サブコマンド

```ts
import { loadActiveBindings, buildBindingPolicyDrift, type BindingPolicyDrift } from "./binding-policy-drift.ts";

function printBindingDrifts(drifts: BindingPolicyDrift[], flags: Flags): void {
  if (flags.json) { console.log(JSON.stringify(drifts)); return; }
  if (drifts.length === 0) { console.log("no binding-policy drift detected"); return; }
  console.log(`binding-policy drift detected: ${drifts.length} item(s)`);
  for (const d of drifts) console.log(`  - ${d.kind}: ${d.message}`);
}

async function cmdBindingDrift(flags: Flags): Promise<number> {
  // read-only / local-only: setAlertTokenMode も loadActual も呼ばない（Cloudflare API 非接触）
  const { policies } = loadExpected(process.cwd());
  const bindings = loadActiveBindings(process.cwd());
  const drifts = buildBindingPolicyDrift(bindings, policies);
  printBindingDrifts(drifts, flags);
  return drifts.length === 0 ? 0 : 2;
}
```

`runCli` の switch に `case "binding-drift": return cmdBindingDrift(flags);` を追加し、`usage()` に 1 行追記。

> 設計判断: `loadExpected(process.cwd())` は repoRoot が cwd 前提（既存 `cmdDiff` と同じ）。`loadActiveBindings` も `path.join(repoRoot, "apps/api/wrangler.toml")` を read。CI / cf.sh は repo root から実行されるため整合。

## CLI 入口: `scripts/cf.sh`（編集）

- `alerts` サブコマンド allowlist（case 文・:182 付近）に `binding-drift` を追加し unknown 弾きを通す。
- `binding-drift` は read-only のため `--ci` で apply 禁止分岐（:199）に抵触せず、既存 `list`/`diff`/`plan` と同じ tsx 実行経路（:210-222）を通る。secret/op を要求しない（`loadExpected` + wrangler read のみ）。
- usage ヒアドキュメント（:169）に `binding-drift` 行を追記。

## package.json（編集）

```jsonc
"cf:alerts:binding-drift": "bash scripts/cf.sh alerts binding-drift",
// test:alerts は既に infra/cloudflare-alerts/lib/__tests__ 全体を対象にするため
// 新規 spec(binding-policy-drift.spec.ts)は自動で含まれる（明示追加不要・確認のみ）。
```

## CI gate: `.github/workflows/cloudflare-alerts-drift.yml`（編集）

- `on.pull_request.paths` に `apps/api/wrangler.toml` を追加（binding 活性変更時に発火）。
- `validate` job（`if: pull_request` / secret 不要）に step を追加:
  ```yaml
  - name: Verify binding ↔ alert-policy consistency (local-only)
    run: pnpm cf:alerts:binding-drift --ci
  ```
- `diff` job（schedule / dispatch・secret 使用）は変更しない。binding-drift は local-only のため PR で完結。

## 変更ファイル一覧（今回実装済み）

| # | パス | 種別 | 変更内容 |
| --- | --- | --- | --- |
| 1 | infra/cloudflare-alerts/lib/binding-policy-drift.ts | 新規 | 型 + `BINDING_POLICY_MAP` + `parseActiveBindings` + `buildBindingPolicyDrift` + `loadActiveBindings` |
| 2 | infra/cloudflare-alerts/lib/cli.ts | 編集 | `cmdBindingDrift` / `printBindingDrifts` 追加、switch + usage 追記 |
| 3 | infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts | 新規 | 回帰 spec（AC-6 の (a)〜(f)） |
| 4 | scripts/cf.sh | 編集 | alerts allowlist + usage に `binding-drift` |
| 5 | package.json | 編集 | `cf:alerts:binding-drift` script 追加 |
| 6 | .github/workflows/cloudflare-alerts-drift.yml | 編集 | paths に wrangler.toml、validate job に binding-drift step |
| 7 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 編集 | binding↔policy 対応表 + UT-17-followup-006 責務境界追記 |

## 設計上の選択と根拠

| 論点 | 選択 | 根拠 |
| --- | --- | --- |
| binding 活性判定 | 自作 line parser（コメント尊重） | TOML ライブラリは `#` コメント block を捨て active/commented を区別不能。ALERT_DEDUP_KV 判定に必須 |
| policy enabled 取得 | 既存 `loadExpected().policies` 再利用 | canonical 化 + quota-base 適用済。JSON 再パース重複を排除 |
| mapping 粒度 | kind 単位（KV/R2） | free-tier quota が account 単位のため per-binding 1:1 は不正確 |
| drift 型 | 新規 `BindingPolicyDrift`（既存 `Drift` と別） | 突合軸が異なる（宣言 vs デプロイ ≠ 活性 vs enabled）。混線回避 |
| CLI 配置 | `alerts binding-drift` サブコマンド | `cf.sh alerts` の正本経路に同型追加。exit code 規約踏襲 |
| CI 配置 | secret 不要の PR `validate` job | local-only 検知のため全 PR で強制でき、コスト追加なし（CONST_007） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] `binding-policy-drift.ts` の型 / mapping / parser / drift 純関数の構造が確定している
- [x] `parseActiveBindings` の状態機械（コメント尊重 / env 横断集約）が擬似仕様で記述されている
- [x] `buildBindingPolicyDrift` の判定ロジック（MONITORING_GAP / STALE_MONITORING）が記述されている
- [x] CLI サブコマンド `cmdBindingDrift`（Cloudflare API 非呼び出し・exit 0/2）の配線が記述されている
- [x] `cf.sh` allowlist / `package.json` / workflow の編集箇所が特定されている
- [x] 変更ファイル 7 件が一覧化されている
- [x] 設計上の選択がすべて根拠付きで記録されている

## タスク100%実行確認【必須】

- 全関数シグネチャ（`parseActiveBindings` / `buildBindingPolicyDrift` / `loadActiveBindings` / `cmdBindingDrift`）が定義済み
- read-only（mutation なし）が型と CLI 設計の双方で保証されている
- 変更ファイル 7 件が `outputs/phase-02/main.md` と一致
- artifacts.json の `phases[1].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項: 関数シグネチャ 4 件、drift 型 2 種、変更ファイル 7 件、設計選択 6 件
- ブロック条件: 既存 `alerts diff` との排他性に MAJOR、parser のコメント判定に穴

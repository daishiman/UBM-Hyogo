# Phase 2 成果物: 設計

issue #1056 の設計主成果物。関数シグネチャ・データ構造・CLI 配線・変更ファイルの詳細は `../../phase-02.md` を正本とする。

## アーキテクチャ

```
wrangler.toml ─(parseActiveBindings: line parser, comment-aware)→ ActiveBindingSet{kv,r2,kvNames,r2Names}
policies/*.json ─(loadExpected, 既存再利用)→ CanonicalPolicy[]{name,enabled}
        └→ buildBindingPolicyDrift(bindings, policies, BINDING_POLICY_MAP) → BindingPolicyDrift[]
                 └→ cmdBindingDrift (read-only, Cloudflare API 非接触) → stdout + exit 0|2
```

## 主要シグネチャ（新規 `binding-policy-drift.ts`）

- `type BindingKind = "kv" | "r2"`
- `interface ActiveBindingSet { kv: boolean; r2: boolean; kvNames: string[]; r2Names: string[] }`
- `type BindingPolicyDrift = {kind:"MONITORING_GAP";...} | {kind:"STALE_MONITORING";...}`
- `const BINDING_POLICY_MAP`：kv → [workers-kv-writes-per-day, workers-kv-stored-bytes] / r2 → [r2-class-a]
- `parseActiveBindings(tomlText): ActiveBindingSet`（`#` コメント行 inactive・env 横断集約）
- `buildBindingPolicyDrift(bindings, policies, map): BindingPolicyDrift[]`（純関数・mutation なし）
- `loadActiveBindings(repoRoot): ActiveBindingSet`（wrangler.toml read のみ）

## drift 判定

- `MONITORING_GAP`：kind active かつ対応 policy `enabled:false`
- `STALE_MONITORING`：kind inactive かつ対応 policy `enabled:true`
- policy 不在は `?? false`（disabled）扱いにし、active binding があれば `MONITORING_GAP` として検出

## CLI / 配線

- `cli.ts`：`cmdBindingDrift` + `printBindingDrifts` 追加、switch に `binding-drift`、usage 追記。`loadActual`/`setAlertTokenMode` 非呼び出し。
- `cf.sh`：alerts allowlist + usage に `binding-drift`。read-only ゆえ `--ci` でも secret 不要。
- `package.json`：`cf:alerts:binding-drift` 追加（`test:alerts` は __tests__ 全体対象で自動包含）。
- `cloudflare-alerts-drift.yml`：paths に `apps/api/wrangler.toml`、`validate` job に `pnpm cf:alerts:binding-drift --ci` step。

## 変更ファイル 7 件

1. `infra/cloudflare-alerts/lib/binding-policy-drift.ts`（新規）
2. `infra/cloudflare-alerts/lib/cli.ts`（編集）
3. `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`（新規）
4. `scripts/cf.sh`（編集）
5. `package.json`（編集）
6. `.github/workflows/cloudflare-alerts-drift.yml`（編集）
7. `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（編集）

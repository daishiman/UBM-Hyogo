# Phase 2 成果物 — 設計

## 1. 設計方針 D-1〜D-7

phase-02.md「設計方針 D-1〜D-7」を正本とする。要点:

- D-1: TOML ライブラリ不採用（コメント block を applied:false 捕捉できないため自作行パーサ）
- D-2/D-3/D-4: 行走査 → kind 正規化 → 同名 binding を `{name,kind}` で 1 エントリ集約（`envs` / `applied`）
- D-5: env.ts 突合=applied 全 kind / 棚卸し突合=applied 全 kind（D1 / Analytics 含む）
- D-6: wrangler → env.ts 片方向 fail（型先行宣言を誤検出しない）
- D-7: read-only（readFileSync のみ・ネットワーク/書き込み/child_process 禁止）

## 2. データ構造

```ts
type WranglerBinding = { name: string; kind: "d1"|"kv"|"r2"|"analytics"|"queue"; applied: boolean; envs: string[] };
type InventoryRow = { name: string; kind: string; state: "active"|"not-applied"|"optional-or-commented"|"unknown" };
type Drift = { code: "ENV_TYPE_MISSING"|"INVENTORY_MISSING"|"INVENTORY_KIND_MISMATCH"|"INVENTORY_ORPHAN"; binding: string; detail: string };
```

## 3. 関数シグネチャ

```ts
function parseWranglerBindings(tomlText: string): WranglerBinding[];
function parseEnvInterfaceProps(envTsText: string): Set<string>;
function parseInventoryRows(deploymentMdText: string): InventoryRow[];
function reconcile(bindings: WranglerBinding[], envProps: Set<string>, inventory: InventoryRow[]): Drift[];
function main(): number; // 0 / 1 (read-only)
```

## 4. 三者突合マトリクス

phase-02.md「三者突合マトリクス」を正本とする（8 行）。現行 repo（是正前）では `MEMBER_PHOTOS` が `INVENTORY_MISSING` で 1 件 FAIL。AC-10 の棚卸し表追記後は exit 0。棚卸し表の Kind 不一致は `INVENTORY_KIND_MISMATCH` として fail させる。

## 5. パーサ走査の擬似コード（実装サイクルの参考）

```text
parseWranglerBindings(text):
  for line in text.split("\n"):
    m = match /^(#\s*)?\[\[(?:env\.([a-z]+)\.)?(d1_databases|kv_namespaces|r2_buckets|analytics_engine_datasets|queues\.\w+)\]\]/
    if m: cur = { commented: !!m[1], env: m[2] ?? "default", kind: normalizeKind(m[3]) }; continue
    b = match /^(#\s*)?binding\s*=\s*"([^"]+)"/
    if b and cur:
      name = b[2]; commented = !!b[1] || cur.commented
      upsert(map, key=name+kind, { name, kind: cur.kind, env: cur.env, applied: !commented })
  return aggregate(map)  // envs[] と applied(OR) を集約
```

## 6. 変更ファイル一覧（5 件）

phase-02.md「変更ファイル一覧」を正本とする。解析対象 `wrangler.toml` / `env.ts` は非編集。

## 7. レイヤ責務

parse*（テキスト→構造体・判断しない）/ reconcile（純粋関数・I/O しない）/ main（read + exit code）。

## 8. 結論

設計は AC-1〜AC-11 を全カバー。新規依存ゼロ・read-only。Phase 3 設計レビューへ。

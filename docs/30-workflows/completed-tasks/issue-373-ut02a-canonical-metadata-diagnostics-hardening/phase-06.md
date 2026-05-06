# Phase 6: 異常系検証 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 5 で実装した hardening 機能の異常系挙動を、(a) 再現手順、(b) 期待挙動、(c) assertion、(d) 検証コマンド、(e) 切り分け、で機械検証可能に列挙する。runtime / CI / dev local の 3 経路に副作用が及ぶため、CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| spec | docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/ |
| phase | 6 / 13 |
| wave | ut-02a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 依存 phase | 1, 2, 3, 4, 5 |
| 成果物 | `outputs/phase-06/main.md` |
| user_approval_required | false |

## 目的

stale detection / 決定論的再生成 / 構造化ログ / adapter contract の 4 機能について、想定される異常系を 6 シナリオに分け、(a) 再現手順、(b) 期待挙動、(c) assertion、を Phase 11 evidence で実測可能な粒度に確定する。各シナリオは repo ローカルで完結する（ネットワーク / D1 / Cloudflare API 不要）。

## 実行タスク

- sourceSpecHash drift、invalid schema、source spec 欠損を再現する
- adapter failure と unknown stable key 大量検出を検証する
- non-deterministic output regression の検出手順を固定する

## 異常系シナリオ一覧

| ID | カテゴリ | シナリオ | 関連機能 |
| --- | --- | --- | --- |
| AB-01 | sourceSpecHash drift | source spec を改変したが manifest 未再生成 | verify-static-manifest |
| AB-02 | invalid manifest schema | manifest JSON が壊れている / 必須フィールド欠落 | verify-static-manifest |
| AB-03 | source spec 欠損 | source spec ファイルが存在しないパス | verify-static-manifest |
| AB-04 | adapter dryRun failure | alias queue adapter が `{ ok: false, reason }` を返す | alias-queue-adapter contract |
| AB-05 | unknown stable key 大量検出 | builder で unknown stable key が >0 件発生 | buildSectionsWithDiagnostics + logWarn |
| AB-06 | non-deterministic output 検出 | regenerate スクリプトが non-deterministic な出力を出す（regression detection） | regenerate-static-manifest |

## AB-01: sourceSpecHash drift

### 再現手順

```bash
# 1. 健全状態を確認
mise exec -- pnpm verify:static-manifest  # → exit 0, "OK"

# 2. source spec を改変（末尾に空白行を 1 つ追加）
echo "" >> docs/00-getting-started-manual/specs/01-api-schema.md

# 3. 検証
mise exec -- pnpm verify:static-manifest  # → exit 1
```

### 期待挙動

- exit code: 1
- stderr に以下を含む:
  - `[verify-static-manifest] FAIL reason=sourceSpecHashDrift`
  - JSON body に `expected: "sha256:..."` / `actual: "sha256:..."`（異なる値）
- CI 上では verify-static-manifest job が fail し、PR が merge ブロックされる

### assertion

```bash
mise exec -- pnpm verify:static-manifest 2> /tmp/stderr.log; ec=$?
[ "$ec" -eq 1 ] || { echo "FAIL: expected exit 1, got $ec"; exit 1; }
grep -q 'sourceSpecHashDrift' /tmp/stderr.log || { echo "FAIL: drift reason not found"; exit 1; }
```

### 復旧手順

```bash
git checkout -- docs/00-getting-started-manual/specs/01-api-schema.md
# あるいは（spec 変更が正当なら）
mise exec -- pnpm regenerate:static-manifest
git add apps/api/src/repository/_shared/generated/static-manifest.json
```

### 切り分け

- `expected` と `actual` の hash 差が出ていない場合 → Step 3 の canonicalize ロジック不整合 → Phase 5 Step 2 / Step 3 を見直し

## AB-02: invalid manifest schema

### 再現手順

```bash
# tmp dir に sourceSpecHash 欠落 manifest を書き込み、verify を呼ぶ
mkdir -p /tmp/badmanifest
jq 'del(.sourceSpecHash)' apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/badmanifest/static-manifest.json

mise exec -- node -e "
import('./scripts/verify-static-manifest.mjs').then(m =>
  m.verifyStaticManifest({ manifestPath: '/tmp/badmanifest/static-manifest.json' })
).then(r => { console.log(JSON.stringify(r)); process.exit(r.ok ? 0 : 1) })
"
```

### 期待挙動

- exit 1
- stdout: `{"ok":false,"reason":"invalidSchema","details":{...}}`
- `details` に欠落フィールド名 `sourceSpecHash` を含む

### assertion

```bash
out=$(mise exec -- node -e "..." 2>&1) || true
echo "$out" | grep -q '"reason":"invalidSchema"'
echo "$out" | grep -q 'sourceSpecHash'
```

### 切り分け

- 欠落フィールドが detail に出ない場合 → Phase 5 Step 3 の schema 検証ロジックを `Required` field チェックに修正

## AB-03: source spec 欠損

### 再現手順

```bash
mise exec -- node -e "
import('./scripts/verify-static-manifest.mjs').then(m =>
  m.verifyStaticManifest({ sourceSpecPath: 'docs/does-not-exist.md' })
).then(r => { console.log(JSON.stringify(r)); process.exit(r.ok ? 0 : 1) })
"
```

### 期待挙動

- exit 1
- stdout: `{"ok":false,"reason":"missingSourceSpec","path":"docs/does-not-exist.md"}`

### assertion

```bash
out=$(...)
echo "$out" | grep -q '"reason":"missingSourceSpec"'
echo "$out" | grep -q '"path":"docs/does-not-exist.md"'
```

### 切り分け

- `ENOENT` が握り潰されて `invalidSchema` になっている場合 → Step 3 の `try/catch` 順序を見直し（fs read エラーは `missingSourceSpec` として早期 return する）

## AB-04: adapter dryRun failure

### 再現手順

`alias-queue-adapter.contract.test.ts` の DT-12 ケースを再現する。

```ts
const adapter = {
  dryRunAlias: vi.fn().mockResolvedValue({ ok: false, reason: "no_alias_found" }),
};
const resolver = createMetadataResolver({ adapter });
const result = await resolver.resolveStableKey("bad_key");
```

### 期待挙動

- `result` が `{ ok: false, error: { kind: "aliasFailed", stableKey: "bad_key", reason: "no_alias_found" } }` 相当
- `logWarn` が `code: "UBM-MANIFEST-UNKNOWN-KEY"` で 1 回呼ばれる（unknownStableKey transit 経路）
- adapter.dryRunAlias が 1 回呼ばれる

### assertion

```ts
expect(result.ok).toBe(false);
expect(result.error).toMatchObject({ kind: "aliasFailed", reason: "no_alias_found" });
expect(adapter.dryRunAlias).toHaveBeenCalledTimes(1);
```

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts -t "DT-12" --reporter=verbose
```

### 切り分け

- adapter が呼ばれない → Step 5 / Step 7 の resolver 注入経路に欠落 → factory `createMetadataResolver({ adapter })` の引数受け渡し確認

## AB-05: unknown stable key 大量検出 + logWarn

### 再現手順

```ts
import { vi } from "vitest";
vi.mock("../../lib/logger", () => ({ logWarn: vi.fn() }));

const rows = [
  { stableKey: "unknown_x_1", /* ... */ },
  { stableKey: "unknown_x_2", /* ... */ },
  { stableKey: "unknown_x_3", /* ... */ },
];
const result = buildSectionsWithDiagnostics(rows, defaultMetadataResolver);
```

### 期待挙動

- `logWarn` が **ちょうど 1 回** 呼ばれる（diagnostics 確定後の単一呼び出し）
- 引数: `{ code: "UBM-MANIFEST-UNKNOWN-KEY", count: 3, stableKeys: ["unknown_x_1","unknown_x_2","unknown_x_3"], note: "..." }`
- 戻り値 `result.diagnostics.unknownStableKeys.length === 3`
- `result.diagnostics.unknownStableKeys` と `logWarn` 引数の `stableKeys` が同一配列内容

### assertion

```ts
expect(logWarn).toHaveBeenCalledTimes(1);
expect(logWarn).toHaveBeenCalledWith(expect.objectContaining({
  code: "UBM-MANIFEST-UNKNOWN-KEY",
  count: 3,
  stableKeys: expect.arrayContaining(["unknown_x_1","unknown_x_2","unknown_x_3"]),
}));
expect(result.diagnostics.unknownStableKeys).toHaveLength(3);
```

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared/__tests__/builder.diagnostics.test.ts --reporter=verbose
```

### 切り分け

- logWarn が 0 回 → builder.ts の Step 6 の if ガード位置が不正、または import 漏れ
- count と戻り値長さが不一致 → diagnostics 構築タイミングと logWarn 呼び出しの間に副作用が混入

## AB-06: non-deterministic output regression detection

### 再現手順

```bash
mise exec -- pnpm regenerate:static-manifest
sha256sum apps/api/src/repository/_shared/generated/static-manifest.json | tee /tmp/manifest-1.sha
sleep 2  # wall clock を進める（決定論性なら影響しないはず）
mise exec -- pnpm regenerate:static-manifest
sha256sum apps/api/src/repository/_shared/generated/static-manifest.json | tee /tmp/manifest-2.sha
diff /tmp/manifest-1.sha /tmp/manifest-2.sha
```

### 期待挙動

- diff 出力なし（exit 0）
- `/tmp/manifest-1.sha` と `/tmp/manifest-2.sha` の hash 値が完全一致

### assertion

```bash
diff /tmp/manifest-1.sha /tmp/manifest-2.sha || { echo "FAIL: non-deterministic output detected"; exit 1; }
```

### regression パターン（NG 例）

| パターン | 症状 | 修正箇所 |
| --- | --- | --- |
| `Date.now()` 混入 | `generatedAt` が wall clock 由来で毎回変化 | Step 2 で git log の commit ISO に固定 |
| `Object.keys()` 順序依存 | 環境/Node 版で fields 順序ばらつき | `Object.fromEntries(entries.sort())` 強制 |
| `JSON.stringify` 末尾改行抜け | `\n` 有無で diff | `JSON.stringify(...) + "\n"` を強制 |
| `\r\n` 混入 | OS 別改行差 | canonicalize で `\r\n` → `\n` 変換必須 |

### 切り分け

- diff が出る場合 → 上表のパターンを順に検証 → Phase 5 Step 2 のロジック修正

## ローカル実行コマンド一式

```bash
# AB-01 drift
echo "" >> docs/00-getting-started-manual/specs/01-api-schema.md
mise exec -- pnpm verify:static-manifest 2> /tmp/ab01.log; echo "exit=$?"
git checkout -- docs/00-getting-started-manual/specs/01-api-schema.md

# AB-02 invalid
jq 'del(.sourceSpecHash)' apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/badmanifest/static-manifest.json
mise exec -- node -e "..."

# AB-03 missing
mise exec -- node -e "..."

# AB-04 / AB-05 adapter / unknown
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose

# AB-06 determinism
mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m1
mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m2
diff /tmp/m1 /tmp/m2
```

## 失敗時の判定基準

| シナリオ | 失敗パターン | 切り分け |
| --- | --- | --- |
| AB-01 | exit 0 のまま fail しない | Step 3 の hash 計算が canonicalize されていない / hash 比較が string 等価でなく substring | Step 3 比較ロジック確認 |
| AB-02 | reason が `sourceSpecHashDrift` になる | schema 検証より先に hash 比較が走っている | Step 3 で schema 検証 → hash 比較の順を担保 |
| AB-04 | adapter が呼ばれない | resolver factory に adapter を注入する経路が無い | Step 5 / Step 7 |
| AB-05 | logWarn が複数回呼ばれる | diagnostics 構築過程で重複 emit | Step 6 で if ガードを diagnostics 確定後 1 箇所に限定 |
| AB-06 | hash 不一致 | 上表 NG 例のいずれか | Step 2 のロジック修正 + 再 evidence |

## 不変条件マッピング

| 不変条件 | 対応シナリオ |
| --- | --- |
| #1 schema 固定しすぎない | AB-01 / AB-06（spec → manifest 一方向のみで drift を即検出） |
| #5 D1 / apps/api 境界 | AB-04 / AB-05（contract test は fake adapter のみ・apps/web を import しない） |
| #14 free-tier | 全シナリオ repo ローカルで完結し Cloudflare 課金なし |

## DoD

- [ ] AB-01〜AB-06 6 シナリオがそれぞれ「再現手順 / 期待挙動 / assertion / 切り分け」を持つ
- [ ] 各シナリオが repo ローカルで完結（ネットワーク / D1 / Cloudflare 不要）
- [ ] regression パターン表（AB-06）が non-deterministic output の典型 4 種を網羅
- [ ] 不変条件 #1 / #5 / #14 への対応シナリオが明示
- [ ] CONST_007: 先送り表現なし

## 完了条件

- [ ] 全異常系シナリオで期待挙動が再現される
- [ ] Phase 11 で各シナリオの実測 log を `outputs/phase-11/evidence/` に保存できる粒度
- [ ] 復旧手順（drift 修復 etc）が記載

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-04.md`（DT 定義）
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-05.md`（Step 1〜9）
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts`
- `apps/api/src/lib/logger.ts`
- `scripts/verify-static-manifest.mjs` / `regenerate-static-manifest.mjs`（Phase 5 実装後）

## 統合テスト連携

- 上流: Phase 5 実装ランブック（実装完了が前提）
- 下流: Phase 7 AC マトリクス（AB-XX を AC-XX 検証コマンドに落とす）／ Phase 11 evidence

## 多角的チェック観点

- 異常系の網羅性: drift / invalid schema / missing spec / adapter failure / unknown 大量 / non-deterministic の 6 系統
- 復旧経路の明記: AB-01 / AB-06 で具体的な git checkout / regenerate コマンドが書かれている
- assertion の機械検証可能性: 各シナリオで grep / jq / vitest expect で確認できる
- 不変条件 #1 / #5 / #14 への抵触なし

## サブタスク管理

- [ ] AB-01〜AB-06 を Phase 11 で実測し、各 log を `outputs/phase-11/evidence/abnormal/AB-XX.log` として保存
- [ ] 切り分けで Phase 5 step に戻る経路を維持（regression 時の rollback 経路）
- [ ] `outputs/phase-06/main.md` を Phase 11 で実測値とともに作成

## 成果物

- `outputs/phase-06/main.md`

## 次 Phase への引き渡し

Phase 7 へ:

- AB-01〜AB-06 の期待挙動を AC-01〜AC-06 の「異常系で fail することを assert」項として組み込み
- 各シナリオの assertion コマンドを AC マトリクスの検証コマンド列に転記
- 不変条件 #1 / #5 / #14 マッピングを Phase 7 で再掲

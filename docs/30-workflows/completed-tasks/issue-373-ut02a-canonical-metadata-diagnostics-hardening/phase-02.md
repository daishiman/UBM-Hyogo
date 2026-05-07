# Phase 2: 設計 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: Phase 1 の 11 件成果物・6 件機能要件・3 件不変条件制約を、(a) スクリプトの関数シグネチャ・配置、(b) `static-manifest.json` schema 拡張、(c) `buildSectionsWithDiagnostics()` の構造化ログ統合方法、(d) `AliasQueueAdapter` contract test ケース、(e) CI gate 配置、(f) retirement 条件正本反映先、として確定する。実装変更を伴うため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| phase | 2 / 13 |
| wave | ut-02a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の機能要件・制約を、最小差分で実装可能な (a) スクリプト関数シグネチャ、(b) JSON schema 拡張、(c) ログ呼び出し点、(d) test ケース列挙、(e) CI workflow patch 案、(f) spec 追記文面案、まで落とし込み、Phase 5 実装ランブックがそのまま実行できる粒度にする。

## 実行タスク

- manifest 検証 / 再生成スクリプトの入出力と失敗コードを決める
- `static-manifest.json` schema 拡張と後方互換の読み込み方針を決める
- diagnostics log、contract test、CI gate、retirement spec の配置を決める

## 成果物

- Phase 5 が参照する実装アーキテクチャ
- スクリプト / manifest / logger / test / CI / spec 追記の設計表
- Phase 3 設計レビューに渡す判断材料

## 実行アーキテクチャ

```
[developer / CI]
        │
        │ pnpm regenerate:static-manifest
        ▼
  scripts/regenerate-static-manifest.mjs
        │  read: docs/00-getting-started-manual/specs/01-api-schema.md
        │  parse: section / field 表 → 内部表現
        │  hash:  sha256(canonicalized source markdown)
        │  emit:  apps/api/src/repository/_shared/generated/static-manifest.json
        ▼
   static-manifest.json (sourceSpecHash, sourceSpecVersion 含む)
        │
        │ pnpm verify:static-manifest（CI gate / 開発ローカル）
        ▼
  scripts/verify-static-manifest.mjs
        │  read: manifest.sourceSpecHash
        │  recompute: sha256(source spec markdown)
        │  diff:  drift があれば exit 1
        ▼
   GitHub Actions verify-static-manifest job ─→ PR fail / pass

[runtime: apps/api Worker]
        │
        ▼
  buildSectionsWithDiagnostics(rows, resolver)
        │  unknown stable key を検出
        ▼
  apps/api/src/lib/logger.ts (logWarn)
        │  code: "UBM-MANIFEST-UNKNOWN-KEY"
        │  payload: { count, stableKeys, sectionKey }
        ▼
  Workers structured log
```

## アーキテクチャ判断

### 1. スクリプト配置: `scripts/` 配下

判断: `scripts/verify-static-manifest.mjs` / `scripts/regenerate-static-manifest.mjs` を `scripts/` 配下に置く。
理由:

- 既存 `scripts/lint-stablekey-literal.mjs` / `scripts/lint-boundaries.mjs` と同じ運用パターン。
- workspace package（apps/api）に閉じると CI から呼びにくいため repo root の `scripts/` が適切。
- pnpm workspace の dev-time tool として `package.json#scripts` で公開する。

### 2. manifest schema 拡張

既存フィールド（`source` / `generatedAt` / `regenerateCommand` / `retirementCondition` / `sections` / `fields`）は維持し、以下を追加する:

```json
{
  "source": "docs/00-getting-started-manual/specs/01-api-schema.md",
  "sourceSpecVersion": "<source spec の最終 commit short SHA または semver タグ>",
  "sourceSpecHash": "sha256:<hex>",
  "generatedAt": "<source spec の最終 commit ISO timestamp（決定論的）>",
  ...既存フィールド...
}
```

- `sourceSpecHash`: source markdown を canonicalize（改行 LF 統一・末尾改行付与）した上で sha256。stale 検出の主軸。
- `sourceSpecVersion`: 人間可読な version 表示用。
- `generatedAt`: `Date.now()` を使わず、source spec の git log 最終 commit ISO 時刻（fallback: source ファイルの mtime ではなく **固定文字列** `"deterministic"`）を使うことで再生成出力の決定論性を担保。

### 3. 関数シグネチャ案

#### `scripts/verify-static-manifest.mjs`

```js
// 公開関数（テスト可能化のため export）
export async function verifyStaticManifest(opts = {}) {
  const sourceSpecPath = opts.sourceSpecPath ?? "docs/00-getting-started-manual/specs/01-api-schema.md";
  const manifestPath = opts.manifestPath ?? "apps/api/src/repository/_shared/generated/static-manifest.json";
  // returns:
  //  { ok: true }
  //  | { ok: false, reason: "sourceSpecHashDrift", expected, actual }
  //  | { ok: false, reason: "missingSourceSpec", path }
  //  | { ok: false, reason: "invalidSchema", details }
}

// CLI entry: process.exit(result.ok ? 0 : 1) + stderr に reason を出力
```

#### `scripts/regenerate-static-manifest.mjs`

```js
export async function regenerateStaticManifest(opts = {}) {
  const sourceSpecPath = opts.sourceSpecPath ?? "...";
  const outputPath = opts.outputPath ?? "...";
  // 1. source markdown を読み、section / field 定義の構造化抽出
  // 2. sha256(canonicalized markdown) を計算
  // 3. JSON.stringify(manifest, null, 2) + "\n" を outputPath に書き込む
  // 4. determinism: 同入力で同バイト出力（キー順固定 / Map ではなく Object literal で keys ordered）
  return { ok: true, manifestPath: outputPath, sourceSpecHash };
}
```

### 4. `buildSectionsWithDiagnostics()` への構造化ログ統合

現状 `builder.ts` は diagnostics を関数戻り値として伝搬している（`{ sections, diagnostics: { unknownStableKeys, ... } }` 想定）。本タスクでは `apps/api/src/lib/logger.ts` を import し、diagnostics 確定時点で以下を呼ぶ:

```ts
import { logWarn } from "../../lib/logger";

if (diagnostics.unknownStableKeys.length > 0) {
  logWarn({
    code: "UBM-MANIFEST-UNKNOWN-KEY",
    count: diagnostics.unknownStableKeys.length,
    stableKeys: diagnostics.unknownStableKeys,
    note: "static-manifest does not include these stable keys; alias queue adapter required",
  });
}
```

- 戻り値構造は既存呼び出し側互換のため変更しない（diagnostics は引き続き返す）。
- ログ化はあくまで観測性追加であり、制御フローを変えない。

### 5. `AliasQueueAdapter` contract test

ファイル: `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`

ケース:

| # | ケース | fake adapter の挙動 | アサーション |
| --- | --- | --- | --- |
| 1 | dryRun success | `dryRunAlias("future_key")` → `{ ok: true, resolvedKey: "future_key_v2" }` | `MetadataResolver` 経由で resolvedKey が伝搬。`logWarn` は呼ばれない |
| 2 | dryRun failure | `dryRunAlias("bad_key")` → `{ ok: false, reason: "no_alias_found" }` | resolver 戻り値が `err({ kind: "aliasFailed", stableKey: "bad_key", reason: "no_alias_found" })` |
| 3 | unknownStableKey transit | `static-manifest.fields["x"]` 未定義 + adapter 注入 | resolver は adapter.dryRunAlias を呼び、結果に応じて `aliasFailed` または resolved を返す |
| 4 | adapter 未注入時 | `defaultMetadataResolver`（adapter なし） | unknownStableKey で `err({ kind: "unknownStableKey" })` のみ。adapter は呼ばれない |

実装は `vi.fn()` ベース fake adapter のみ。D1 / fetch を一切使わない。

### 6. CI gate 配置

判断: 既存 `.github/workflows/backend-ci.yml` に `verify-static-manifest` step を追加（apps/api 関連 workflow に統合）。`ci.yml` には placeholder 程度に留める。

```yaml
# .github/workflows/backend-ci.yml の job 内に追加
- name: Verify static manifest
  run: pnpm verify:static-manifest
```

`package.json` に:

```json
{
  "scripts": {
    "verify:static-manifest": "node scripts/verify-static-manifest.mjs",
    "regenerate:static-manifest": "node scripts/regenerate-static-manifest.mjs"
  }
}
```

### 7. retirement 条件正本反映先

判断: `docs/00-getting-started-manual/specs/01-api-schema.md` の末尾に「Static Manifest Retirement」節を追加。`08-free-database.md` には参照リンクのみ。

文面案（本タスクで実装時に追記する内容）:

> ## Static Manifest Retirement Condition
>
> `apps/api/src/repository/_shared/generated/static-manifest.json` は 03a alias queue / forms schema sync 完成までの暫定 baseline である。以下条件を**すべて**満たした時点で削除する:
>
> 1. 03a forms schema sync が D1 `schema_questions` テーブルを populate している
> 2. `MetadataResolver` が D1 から resolveSectionKey / resolveFieldKind / resolveLabel を返す実装に差し替わっている
> 3. `alias-queue-adapter.contract.test.ts` の D1-backed 実装版が PASS している
> 4. `pnpm verify:static-manifest` が「manifest 不要」モードで PASS する（または job 自体が削除される）
>
> retirement 実行は別 task で行い、削除と同時に本仕様の本節も削除する。

## データ構造変更

### `static-manifest.json` 既存

- `source: string`
- `generatedAt: string (ISO)`
- `regenerateCommand: string`
- `retirementCondition: string`
- `sections: Section[]`
- `fields: Record<string, ManifestField>`

### 追加

- `sourceSpecHash: string`（`"sha256:<hex>"` 形式）
- `sourceSpecVersion: string`（commit short SHA または semver）

### キー順序（決定論性）

- top-level keys: `$comment` → `source` → `sourceSpecVersion` → `sourceSpecHash` → `generatedAt` → `regenerateCommand` → `retirementCondition` → `sections` → `fields`
- `sections[]` は `position` 昇順
- `fields` は stableKey 辞書順

## テスト方針

| テスト | ファイル | 観点 |
| --- | --- | --- |
| manifest 検証 PASS | `metadata.test.ts` | 健全 manifest で `verifyStaticManifest()` が `{ ok: true }` |
| manifest 検証 FAIL (drift) | `metadata.test.ts` | hash 不一致を含む temp manifest で `{ ok: false, reason: "sourceSpecHashDrift" }` |
| regenerate 決定論性 | `scripts/__tests__/regenerate-static-manifest.test.ts` | 2 回連続実行で出力 byte-identical |
| diagnostics 構造化ログ | `builder.test.ts` | `logWarn` mock を spy し `code: "UBM-MANIFEST-UNKNOWN-KEY"` 呼び出しをアサート |
| adapter contract: success | `alias-queue-adapter.contract.test.ts` | dryRun success 経路 |
| adapter contract: failure | 同上 | dryRun failure 経路 |
| adapter contract: unknown transit | 同上 | unknownStableKey が adapter を経由 |
| adapter contract: 未注入 | 同上 | adapter なし時 unknownStableKey error のみ |

## 実行コマンド

```bash
# 開発ローカル
mise exec -- pnpm install
mise exec -- pnpm regenerate:static-manifest
mise exec -- pnpm verify:static-manifest
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# CI（GitHub Actions backend-ci.yml に統合）
pnpm verify:static-manifest
```

## DoD

- [ ] スクリプト 2 本の関数シグネチャと CLI exit code 規約が確定
- [ ] manifest schema 追加フィールド 2 件のキー順・hash アルゴリズム・version source が確定
- [ ] `buildSectionsWithDiagnostics()` の logWarn 呼び出し点が 1 箇所に確定し、戻り値互換が維持されている
- [ ] adapter contract test 4 ケースが列挙され、fake adapter の挙動が表で確定
- [ ] CI gate 配置先（`backend-ci.yml`）と `package.json#scripts` 2 行が確定
- [ ] retirement 条件追記先と文面案が確定
- [ ] 不変条件 #1 / #5 / #14 への抵触がないことが各判断の理由と紐付いている

## 完了条件

- [ ] Phase 5 実装ランブックがそのまま実行できる粒度で関数シグネチャ・テストケース・コマンドが揃っている
- [ ] CONST_007 の先送り表現が無い
- [ ] visualEvidence = NON_VISUAL で integration evidence が test log のみで成立する設計

## 次 Phase への引き渡し

Phase 3 設計レビューへ:

- 4 つのアーキテクチャ判断（スクリプト配置 / schema 拡張 / log 統合点 / CI gate 位置）
- contract test 4 ケースの十分性判定
- retirement 条件文面の正本適合性レビュー
- 決定論性（`Date.now()` 排除・キー順固定）の十分性レビュー

## 参照資料

- `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md`
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` / `generated/static-manifest.json`
- `apps/api/src/lib/logger.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `.github/workflows/backend-ci.yml` / `ci.yml`
- `scripts/lint-stablekey-literal.mjs`（既存スクリプトのパターン参照）

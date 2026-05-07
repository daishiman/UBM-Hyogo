# Phase 8: DRY 化 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 5 で実装した 9 step のうち、(a) verify / regenerate スクリプト間で重複する hash / canonicalize ロジック、(b) manifest schema 型定義の散在、(c) logWarn の `code` 文字列リテラル散在、を共通化する。コード変更（新規 module 追加 + 既存 import 経路の差し替え）を伴うため CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| spec | docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/ |
| phase | 8 / 13 |
| wave | ut-02a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 依存 phase | 1, 2, 3, 4, 5, 6, 7 |
| 成果物 | `outputs/phase-08/main.md` |
| user_approval_required | false |

## 目的

Phase 5 実装ランブックで配置した module 群について、(1) 重複している純関数（hash / canonicalize）の共通化、(2) manifest schema 型定義の集約、(3) logWarn `code` 定数の集約、を実施し、再利用率 100% を達成する。AC マトリクス（Phase 7）の GREEN 状態を維持したまま行う。

## 実行タスク

- hash / canonicalize / default path の重複を抽出する
- manifest schema 型定義と log code 定数の配置を決める
- DRY 化後に AC 検証コマンドを再実行する

## 重複検出

### D-01: hash / canonicalize ロジック（verify / regenerate に重複）

`scripts/verify-static-manifest.mjs` と `scripts/regenerate-static-manifest.mjs` の双方が以下を含む:

- markdown を `\r\n` → `\n` 正規化、末尾改行 1 個に丸める canonicalize 処理
- `crypto.createHash("sha256").update(canonicalized).digest("hex")` 計算
- 結果を `"sha256:" + hex` 形式に整形

→ 共通モジュール化対象。

### D-02: manifest schema 型定義（metadata.ts 内に inline 定義）

現状 `apps/api/src/repository/_shared/metadata.ts` 内で manifest の型を inline で記述。`builder.ts` も同型を import するが、(a) 公開 export がない、(b) script 側からは型参照不可、状態。

→ `apps/api/src/repository/_shared/manifest-schema.ts` に集約候補（または `metadata.ts` で `export interface StaticManifest` として公開）。

### D-03: logWarn の `code` 文字列リテラル（builder.ts / metadata.ts に散在）

Phase 5 で追加する logWarn 呼び出しは以下 2 箇所:

- `metadata.ts` の `UBM-MANIFEST-INVALID-SCHEMA`
- `builder.ts` の `UBM-MANIFEST-UNKNOWN-KEY`

将来 retirement や 03a 完成時に code が追加される見込み。タイポ防止と grep 容易性のため定数集約候補。

### D-04: regenerate / verify が同じ source spec 既定パスをハードコード

両スクリプトで `"docs/00-getting-started-manual/specs/01-api-schema.md"` をデフォルト引数に持つ。

→ 共通定数化（`scripts/lib/manifest-paths.mjs` 候補）。

## 統合方針

### S-01: `scripts/lib/manifest-hash.mjs` 新設（D-01 / D-04 解消）

```js
// scripts/lib/manifest-hash.mjs
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const DEFAULT_SOURCE_SPEC_PATH = "docs/00-getting-started-manual/specs/01-api-schema.md";
export const DEFAULT_MANIFEST_PATH = "apps/api/src/repository/_shared/generated/static-manifest.json";

/**
 * source markdown を canonicalize（CRLF → LF / 末尾改行 1 個）
 * @param {string} raw
 * @returns {string}
 */
export function canonicalizeSourceSpec(raw) {
  const lf = raw.replace(/\r\n/g, "\n");
  return lf.endsWith("\n") ? lf : lf + "\n";
}

/**
 * canonicalize 済 markdown から sha256 hash を返す
 * @param {string} canonical
 * @returns {string} `"sha256:" + hex`
 */
export function computeSourceSpecHash(canonical) {
  return "sha256:" + createHash("sha256").update(canonical).digest("hex");
}

/**
 * 一括便利関数: path → canonicalize → hash
 * @param {string} sourceSpecPath
 * @returns {Promise<{ canonical: string; hash: string }>}
 */
export async function readAndHashSourceSpec(sourceSpecPath) {
  const raw = await readFile(sourceSpecPath, "utf8");
  const canonical = canonicalizeSourceSpec(raw);
  return { canonical, hash: computeSourceSpecHash(canonical) };
}
```

`verify-static-manifest.mjs` / `regenerate-static-manifest.mjs` は本 module から import する形に書き換える。

### S-02: `apps/api/src/repository/_shared/manifest-schema.ts` 新設（D-02 解消）

既存 `metadata.ts` から型定義のみを抽出し、`StaticManifest` / `ManifestField` / `ManifestSection` を `export` する。

```ts
// apps/api/src/repository/_shared/manifest-schema.ts
export interface StaticManifestSection {
  key: string;
  position: number;
  label: string;
}

export interface StaticManifestField {
  stableKey: string;
  sectionKey: string;
  kind: string;
  label: string;
}

export interface StaticManifest {
  $comment?: string;
  source: string;
  sourceSpecVersion: string;
  sourceSpecHash: string;
  generatedAt: string;
  regenerateCommand: string;
  retirementCondition: string;
  sections: StaticManifestSection[];
  fields: Record<string, StaticManifestField>;
}
```

`metadata.ts` / `builder.ts` は本 module から import に統一。

### S-03: `apps/api/src/lib/log-codes.ts` 新設（または既存に追記、D-03 解消）

```ts
// apps/api/src/lib/log-codes.ts
export const LogCode = {
  ManifestUnknownKey: "UBM-MANIFEST-UNKNOWN-KEY",
  ManifestInvalidSchema: "UBM-MANIFEST-INVALID-SCHEMA",
  ManifestStale: "UBM-MANIFEST-STALE",
} as const;

export type LogCodeValue = (typeof LogCode)[keyof typeof LogCode];
```

既存 `apps/api/src/lib/logger.ts` 周辺に同等定義があれば再利用し、本ファイルを新設しない。**Phase 11 実装時に既存 import を grep で確認し、ある場合は既存に追記する**（CONST_007 の先送り表現には該当しない / 実装時に決定する technical detail）。

`metadata.ts` / `builder.ts` の logWarn 呼び出しは:

```ts
import { LogCode } from "../../lib/log-codes";
logWarn({ code: LogCode.ManifestUnknownKey, count, stableKeys, note });
```

の形に書き換える。

## 削減量見積もり

| 共通化対象 | 削減見込み行数 | 根拠 |
| --- | --- | --- |
| D-01 hash / canonicalize | 約 25 行 × 1（duplicate 削除） | 2 スクリプトで 25 行ずつ重複していたものを 1 module に統合 |
| D-02 manifest 型定義 | 約 15 行（散在 → 1 ファイル集約） | inline → 共有 interface 化 |
| D-03 log code 定数 | 約 5 行（リテラル 3 箇所 + tagged const 化） | grep 容易性が主目的 |
| D-04 デフォルトパス | 約 4 行（重複 default 引数 → 共通 const） | DEFAULT_* 定数 |
| 合計 | 約 49 行 | repo 全体の代理指標 |

## DRY 化前後のテスト互換性

| テスト | DRY 化の影響 | 対応 |
| --- | --- | --- |
| DT-01〜DT-04 (verify) | import 経路変更のみ。挙動同一 | テスト変更不要 |
| DT-05〜DT-07 (regenerate) | 同上 | テスト変更不要 |
| DT-08〜DT-10 (builder diagnostics) | logWarn 引数の `code` プロパティが文字列 → 定数参照に。値は同一 | テスト assertion で `LogCode.ManifestUnknownKey` を import すると安全だが、文字列比較のままでも互換 |
| DT-11〜DT-14 (adapter contract) | 影響なし | 変更不要 |
| DT-15〜DT-18 (既存テスト追加) | manifest-schema.ts import 経路変更のみ | テスト変更不要 |

DRY 化により AC マトリクス（Phase 7）の GREEN 状態は維持される。

## 実行ステップ

```
Step A. scripts/lib/manifest-hash.mjs 新設
   ↓
Step B. verify-static-manifest.mjs / regenerate-static-manifest.mjs を import 経路に書き換え
   ↓
Step C. apps/api/src/repository/_shared/manifest-schema.ts 新設 + metadata.ts / builder.ts の type を import に
   ↓
Step D. apps/api/src/lib/log-codes.ts 新設（or 既存追記）+ logWarn 呼び出しを定数参照に
   ↓
Step E. AC マトリクス（Phase 7）コマンド一括を再実行 → 全 GREEN 確認
```

## 検証コマンド

```bash
# DRY 化後の typecheck
mise exec -- pnpm typecheck

# DRY 化後の test
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose
mise exec -- pnpm test:scripts

# AC 一括（Phase 7）
mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m1
mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m2
diff /tmp/m1 /tmp/m2
mise exec -- pnpm verify:static-manifest

# 重複コード grep 検出（DRY 化後 0 件期待）
grep -rn "createHash..sha256" scripts/verify-static-manifest.mjs scripts/regenerate-static-manifest.mjs || echo "OK: hash logic centralized"
grep -rn 'UBM-MANIFEST-' apps/api/src/repository/_shared/ apps/api/src/lib/ | grep -v 'log-codes.ts'  # 残存箇所が定数参照になっているか確認
```

## DoD

- [ ] D-01 / D-02 / D-03 / D-04 の重複検出が「重複箇所」「統合先」「import 書き換え対象」の 3 列で確定
- [ ] `scripts/lib/manifest-hash.mjs` の export interface が確定
- [ ] `apps/api/src/repository/_shared/manifest-schema.ts` の export interface が確定
- [ ] `apps/api/src/lib/log-codes.ts`（または既存への追記）の方針が確定
- [ ] DRY 化前後で DT-01〜DT-18 / AC-01〜AC-06 すべて GREEN を維持
- [ ] 削減見積もり約 49 行が記載
- [ ] CONST_007 の先送り表現なし

## 完了条件

- [ ] 重複コード 0 件（grep で hash 計算 / log code リテラル / type 定義の散在が検出されない）
- [ ] shared util の再利用率 100%（verify / regenerate 双方が manifest-hash.mjs を利用 / metadata / builder 双方が manifest-schema.ts を利用）
- [ ] visualEvidence = NON_VISUAL

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-04.md`〜`phase-07.md`
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts`
- `apps/api/src/lib/logger.ts`
- `scripts/verify-static-manifest.mjs` / `regenerate-static-manifest.mjs`（Phase 5 実装後）
- `CLAUDE.md`（pnpm workspace / TypeScript 構成）

## 統合テスト連携

- 上流: Phase 5 実装ランブック（重複コード基底）/ Phase 7 AC マトリクス（GREEN 維持の基準）
- 下流: Phase 9 品質保証（DRY 化後の typecheck / lint / test 全 PASS）／ Phase 10 最終レビュー（共通化の妥当性レビュー）

## 多角的チェック観点

- 共通化対象 4 件（D-01〜D-04）が repo 全体で漏れなく統合されている
- DRY 化により既存テストが regression していない（DT / AC が GREEN 維持）
- 不変条件 #1: type 定義集約は schema duplication ではなく逆に schema source 一元化なので #1 強化
- 不変条件 #5: log-codes.ts は apps/api 内に閉じる（apps/web へ漏らさない）
- import 循環（circular dependency）が発生していないか typecheck で検証

## サブタスク管理

- [ ] Step A〜E を Phase 11 evidence 取得時に実行
- [ ] grep による重複検出を `outputs/phase-08/dedup-grep.log` に保存
- [ ] DRY 化前後の test results を `outputs/phase-08/test-before-after.log` に保存
- [ ] `outputs/phase-08/main.md` を Phase 11 で実測値とともに作成

## 成果物

- `outputs/phase-08/main.md`

## 次 Phase への引き渡し

Phase 9 へ:

- DRY 化後の module 構成（manifest-hash.mjs / manifest-schema.ts / log-codes.ts）
- 重複コード 0 件の grep 結果
- AC-01〜AC-06 GREEN 維持の根拠（DRY 前後で test 結果変化なし）
- Phase 9 typecheck / lint / test / verify gate の起点

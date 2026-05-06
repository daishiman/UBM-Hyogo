# Phase 4: テスト戦略 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: Phase 3 GO 判定を受け、本 Phase は (a) 追加テスト 4 ファイルのケース定義、(b) 既存テスト 2 ファイルへの追加ケース、(c) coverage 目標と測定コマンド、(d) テスト実行コマンド契約、を確定する。テスト実装は Phase 5 で行うが、ケース粒度・期待値・assertion 文面まで本 Phase で固定し、Phase 5 ランブックがそのまま実行できる状態にする。docs-only ではなくランタイムロジック（diagnostics 構造化ログ・stale detection スクリプト）への新規テストを伴うため CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| spec | docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/ |
| phase | 4 / 13 |
| wave | ut-02a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 依存 phase | 1, 2, 3 |
| 成果物 | `outputs/phase-04/main.md` |
| user_approval_required | false |

## 目的

Phase 3 が GO 判定した hardening 設計を機械検証可能にするため、(1) `verifyStaticManifest()` / `regenerateStaticManifest()` の純関数テスト、(2) `buildSectionsWithDiagnostics()` の構造化ログ assertion、(3) `AliasQueueAdapter` の contract test 4 ケース、(4) 既存 `metadata.test.ts` / `builder.test.ts` への追加ケース、を一意に列挙する。Phase 5 実装ランブックは本 Phase の test ID（DT-01〜DT-12）に従って TDD で進める。

## 実行タスク

- DT-01〜DT-18 のテスト観点をファイル単位で列挙する
- 既存 `metadata.test.ts` / `builder.test.ts` の追加範囲を決める
- Phase 11 evidence 名と実行コマンドを Phase 7 / 11 と整合させる

## テストピラミッド適用

```
        ┌──────────────────┐
        │  contract test   │  alias-queue-adapter.contract.test.ts
        │   (1 file × 4)   │  fake adapter / interface 契約固定
        └──────────────────┘
       ┌────────────────────┐
       │  integration test   │  static-manifest.verify.test.ts
       │   (1 file × 4)      │  scripts ↔ JSON ↔ source spec
       │  regenerate-static-manifest.test.mjs
       │   (1 file × 3)      │  determinism / canonicalization
       └────────────────────┘
   ┌─────────────────────────┐
   │      unit test           │  builder.diagnostics.test.ts (1 × 3)
   │                          │  既存 metadata.test.ts 追加 (× 2)
   │                          │  既存 builder.test.ts 追加 (× 2)
   └─────────────────────────┘
```

unit / integration / contract の三層に分け、下層から fail-fast で実行する。本タスクは NON_VISUAL のため Playwright 等 E2E 層は対象外。

## 追加テストファイル一覧

### DT-01〜DT-04: `apps/api/src/repository/_shared/__tests__/static-manifest.verify.test.ts`（新規・integration）

`scripts/verify-static-manifest.mjs` から `verifyStaticManifest()` を import し純関数として検証する。

| ID | ケース | セットアップ | 期待値 |
| --- | --- | --- | --- |
| DT-01 | 健全 manifest | repo 同梱の実 `static-manifest.json` + 実 `01-api-schema.md` | `{ ok: true }` |
| DT-02 | sourceSpecHash drift | tmp dir に source spec のコピー（末尾に空白追加で hash 変化）+ 既存 manifest を渡す | `{ ok: false, reason: "sourceSpecHashDrift", expected, actual }` |
| DT-03 | source spec 欠損 | tmp dir に manifest のみ配置、source path に存在しないパスを指定 | `{ ok: false, reason: "missingSourceSpec", path }` |
| DT-04 | invalid manifest schema | tmp dir に `sourceSpecHash` フィールドを欠落させた manifest を書き込む | `{ ok: false, reason: "invalidSchema", details }` |

### DT-05〜DT-07: `scripts/__tests__/regenerate-static-manifest.test.mjs`（新規・integration）

`regenerateStaticManifest()` の決定論性を検証する。

| ID | ケース | セットアップ | 期待値 |
| --- | --- | --- | --- |
| DT-05 | determinism: 同入力 2 回連続で byte-identical | tmp dir に source spec を書き、outputPath を 2 つ用意して連続実行 | 2 ファイルの SHA256 が一致 / `Buffer.compare = 0` |
| DT-06 | キー順序固定 | 出力 JSON を `JSON.parse` 後 `Object.keys(top)` を取得 | `["$comment","source","sourceSpecVersion","sourceSpecHash","generatedAt","regenerateCommand","retirementCondition","sections","fields"]` の順 |
| DT-07 | sections position 昇順 / fields stableKey 辞書順 | 出力 JSON を parse | `sections.map(s => s.position)` が strictly ascending、`Object.keys(fields)` が `localeCompare` 結果で sorted |

### DT-08〜DT-10: `apps/api/src/repository/_shared/__tests__/builder.diagnostics.test.ts`（新規・unit）

`buildSectionsWithDiagnostics()` の構造化ログ出力を検証する。

| ID | ケース | セットアップ | 期待値 |
| --- | --- | --- | --- |
| DT-08 | unknown stable key 検出時 logWarn 呼び出し | `vi.mock("../../lib/logger")` で `logWarn` を spy、unknown stable key を含む rows を渡す | `logWarn` が `{ code: "UBM-MANIFEST-UNKNOWN-KEY", count: N, stableKeys: [...] }` で 1 回呼ばれる |
| DT-09 | unknown stable key が 0 件のとき logWarn 非呼び出し | manifest に存在する stable key のみ含む rows | `logWarn` 呼び出し回数 0 |
| DT-10 | 戻り値構造の互換性維持 | 既存テストと同じ rows | 戻り値 `{ sections, diagnostics: { unknownStableKeys } }` の shape が既存と同じ（key 不足/追加なし） |

### DT-11〜DT-14: `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`（新規・contract）

`AliasQueueAdapter` interface の dryRun 経路の契約テスト。fake adapter は `vi.fn()` で構築し D1 / fetch を一切使わない。

| ID | ケース | fake adapter 挙動 | 期待値 |
| --- | --- | --- | --- |
| DT-11 | dryRun success 経路 | `dryRunAlias("future_key")` → `{ ok: true, resolvedKey: "future_key_v2" }` | `MetadataResolver` が resolvedKey を返却、`logWarn(UBM-MANIFEST-UNKNOWN-KEY)` は呼ばれない |
| DT-12 | dryRun failure 経路 | `dryRunAlias("bad_key")` → `{ ok: false, reason: "no_alias_found" }` | resolver 戻り値が `err({ kind: "aliasFailed", stableKey: "bad_key", reason: "no_alias_found" })` |
| DT-13 | unknownStableKey transit | manifest 未定義 stableKey + adapter 注入 | adapter.dryRunAlias が呼ばれ、結果に応じて `aliasFailed` または resolved を返す |
| DT-14 | adapter 未注入時 | `defaultMetadataResolver`（adapter なし） | unknown stableKey で `err({ kind: "unknownStableKey" })`、adapter は呼ばれない（呼び出し回数 0） |

## 既存テスト改修

### `apps/api/src/repository/_shared/metadata.test.ts` 追加ケース

| ID | ケース | 説明 |
| --- | --- | --- |
| DT-15 | manifest hash drift simulation | `verifyStaticManifest({ sourceSpecPath: tmpDriftSpec })` で `{ ok: false, reason: "sourceSpecHashDrift" }` を assert |
| DT-16 | retirement comment grep | `metadata.ts` のコメントから `01-api-schema.md` の retirement 節へのリンクが存在することを正規表現でアサート |

### `apps/api/src/repository/_shared/builder.test.ts` 追加ケース

| ID | ケース | 説明 |
| --- | --- | --- |
| DT-17 | logger mock spy: unknown 件数 | `vi.mock("../../lib/logger")` を declare し、既存 `buildSectionsWithDiagnostics` 経由テスト群で logWarn が unknown 件数と完全一致することを assert |
| DT-18 | logger 呼び出しと戻り値の整合 | logWarn の `count` と 戻り値 `diagnostics.unknownStableKeys.length` が同値 |

## カバレッジ目標

対象 4 ファイル（`metadata.ts` / `builder.ts` / `verify-static-manifest.mjs` / `regenerate-static-manifest.mjs`）について以下を達成する。

| 指標 | 閾値 | 測定 |
| --- | --- | --- |
| line | ≥ 90% | Vitest c8 reporter |
| branch | ≥ 80% | Vitest c8 reporter |
| function | ≥ 90% | Vitest c8 reporter |

contract test ファイルは fake adapter 主体のため自身の line coverage は対象外（`AliasQueueAdapter` interface 側のみ計測）。

## テスト実行コマンド

```bash
# 単体（apps/api 配下、_shared scope のみ）
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose

# scripts 側（mjs テスト、node:test または vitest 経由）
mise exec -- pnpm test:scripts  # package.json#scripts.test:scripts で node --test scripts/__tests__/*.test.mjs を呼ぶ

# 全体カバレッジ
mise exec -- pnpm --filter @ubm/api test --coverage --reporter=verbose

# verify (CI gate と同等)
mise exec -- pnpm verify:static-manifest

# regenerate determinism check (Phase 11 evidence 取得用)
mise exec -- pnpm regenerate:static-manifest
sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m1
mise exec -- pnpm regenerate:static-manifest
sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m2
diff /tmp/m1 /tmp/m2  # 出力なしが PASS
```

## redaction / 副作用ポリシー

- 全 test は repo ローカル fixtures + tmp dir で完結する。Cloudflare API / D1 / fetch を一切呼ばない。
- contract test の fake adapter は `vi.fn()` のみで、ネットワーク I/O を持たない。
- `regenerate` script は `scripts/__tests__/` 配下では `tmpdir()` を outputPath に指定し、repo 内 manifest を上書きしない（Phase 11 evidence 取得時のみ実 manifest を上書きする）。
- 構造化ログには PII を含めない（schema label / stableKey のみ）。

## 失敗時の判定基準

| カテゴリ | 失敗条件 | 切り分け |
| --- | --- | --- |
| DT-01 fail | 健全 manifest で `{ ok: true }` 以外 | `01-api-schema.md` が改変されたまま regenerate 未実行 → Phase 5 Step 2 を再実行 |
| DT-05 fail | 2 回出力が byte-identical でない | `Date.now()` / random / Map 順序依存が混入 → Phase 5 Step 2 のキー順序ロジック見直し |
| DT-08 fail | logWarn が呼ばれない | builder 側で logger import 漏れ、または unknown 件数 0 のテストデータ → Phase 5 Step 6 を見直し |
| DT-11 fail | resolver が adapter を呼ばない | resolver 側で adapter 注入経路未実装 → Phase 5 Step 5 を見直し |

## DoD

- [ ] 追加テストファイル 4 件のケース ID（DT-01〜DT-14）が、ファイル / ケース名 / セットアップ / 期待値の 4 列で確定
- [ ] 既存テスト追加ケース（DT-15〜DT-18）の挿入先と assertion が確定
- [ ] coverage 目標 line ≥ 90% / branch ≥ 80% が対象 4 ファイルに紐づいている
- [ ] テスト実行コマンドが `mise exec --` プレフィックス付きで全件記載
- [ ] redaction / 副作用ポリシーが「ネットワーク禁止 / tmp dir のみ」で確定
- [ ] failure 時の切り分けと Phase 5 Step との対応が記載

## 完了条件

- [ ] DT-01〜DT-18 が 18 件すべて記述されている
- [ ] CONST_005: 実装仕様書必須項目（テスト戦略 / 実行コマンド / pass 条件 / coverage / redaction）が漏れなく記載
- [ ] CONST_007: 先送り表現なし（03a 本体実装は scope out 済み）
- [ ] visualEvidence = NON_VISUAL の方針が再確認されている

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-01.md` / `phase-02.md` / `phase-03.md`
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` / `metadata.test.ts` / `builder.test.ts` / `generated/static-manifest.json`
- `apps/api/src/lib/logger.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- Vitest v1 公式 (`vi.mock` / `vi.fn` / coverage c8)
- `CLAUDE.md`（mise exec / pnpm workspace）

## 統合テスト連携

- 上流: Phase 3 設計レビュー（GO 判定済み）
- 下流: Phase 5 実装ランブック（DT-01〜DT-18 を TDD 順序で消化）／ Phase 7 AC マトリクス（AC-01〜AC-06 と DT を 1:N 対応）／ Phase 11 evidence（test-results.log / regenerate-determinism.log）

## 多角的チェック観点

- contract test の十分性: success / failure / unknown transit / 未注入 の 4 系統で網羅
- 決定論性検証: 2 回連続実行 + キー順序 + sections position の 3 観点
- 構造化ログ assertion: 件数 0 / 件数 N / 戻り値整合 の 3 観点
- 不変条件 #1: コードに schema duplication が増えていないこと（DT-16 で metadata.ts コメントから retirement spec へのリンク存在を assert）
- 不変条件 #5: contract test が apps/api 内で完結し apps/web を import していないこと
- redaction: tmp dir 利用で repo manifest 非破壊 + ネットワーク I/O 禁止

## サブタスク管理

- [ ] DT-01〜DT-18 の test ID と Phase 5 Step の対応表を Phase 5 で展開
- [ ] coverage 閾値を `vitest.config.ts` に反映するか、CI step で `--coverage` を渡すかを Phase 5 で決定
- [ ] `outputs/phase-04/main.md` を Phase 11 で実測値とともに作成

## 成果物

- `outputs/phase-04/main.md`

## 次 Phase への引き渡し

Phase 5 へ:

- DT-01〜DT-18 の 18 ケース
- テスト実行コマンド 5 種（`pnpm --filter @ubm/api test` / `pnpm test:scripts` / `pnpm verify:static-manifest` / `pnpm regenerate:static-manifest` × 2）
- coverage 目標（line ≥ 90% / branch ≥ 80%）
- redaction / 副作用ポリシー（ネットワーク禁止 / tmp dir）
- 失敗時切り分けと Phase 5 Step 対応

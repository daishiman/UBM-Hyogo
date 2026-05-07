# Phase 1: 要件定義 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本タスクは `apps/api` 配下の TypeScript / JSON 成果物の追加・変更（`metadata.ts` / `builder.ts` / `static-manifest.json` 拡張 / 新規 contract test ファイル）、および `scripts/` 配下の検証・再生成スクリプト追加、CI workflow 追加を伴う。docs-only ではなくランタイムロジック（diagnostics 構造化ログ・stale detection）と CI gate を実装するため、CONST_004 に従い実装仕様書として扱う。

> 本タスクは UT-02A baseline の **hardening サイクル** であり、03a alias queue adapter の本体実装は含まない（contract test の interface 側のみ整備する）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373（CLOSED 状態だが独立 spec として確立） |
| spec | docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/ |
| phase | 1 / 13 |
| wave | ut-02a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| priority | medium |
| scale | medium |

## 目的

UT-02A 完了後 hardening スコープとして以下 5 項目を 1 つの実装サイクルで完結させる:

1. `static-manifest.json` の stale detection（`scripts/verify-static-manifest.mjs` + CI gate）
2. manifest 再生成手順の決定論化（`scripts/regenerate-static-manifest.mjs`、同入力で同バイト出力）
3. `buildSectionsWithDiagnostics()` の unknown stable key 件数の構造化ログ + テスト evidence 化
4. `AliasQueueAdapter` interface の contract test 追加（dryRun success / failure / unknownStableKey transit）
5. static manifest retirement 条件の正本仕様（`docs/00-getting-started-manual/specs/01-api-schema.md` または `08-free-database.md`）への反映

## 実行タスク

- 元 follow-up の完了条件 5 項目を本 workflow の AC へ展開する
- `taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` を確定する
- scope in/out、依存、禁止事項、Phase 2 への入力を固定する

## 入力

| 種別 | 値 |
| --- | --- |
| 元 unassigned task spec | `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` |
| 対象コード | `apps/api/src/repository/_shared/metadata.ts` (96行) / `apps/api/src/repository/_shared/builder.ts` (440行) |
| 対象 manifest | `apps/api/src/repository/_shared/generated/static-manifest.json`（56行・section 7・field 31） |
| 既存テスト | `apps/api/src/repository/_shared/metadata.test.ts` / `apps/api/src/repository/_shared/builder.test.ts` |
| 仕様正本 | `docs/00-getting-started-manual/specs/01-api-schema.md`（form schema 正本） |
| ロガー | `apps/api/src/lib/logger.ts`（構造化ログユーティリティ） |
| CI 候補 | `.github/workflows/ci.yml` / `.github/workflows/backend-ci.yml` |

## 出力（成果物）

| # | 種別 | パス |
| --- | --- | --- |
| 1 | manifest 検証スクリプト | `scripts/verify-static-manifest.mjs` |
| 2 | manifest 再生成スクリプト | `scripts/regenerate-static-manifest.mjs` |
| 3 | manifest schema 拡張 | `apps/api/src/repository/_shared/generated/static-manifest.json`（`sourceSpecHash` / `sourceSpecVersion` 追加） |
| 4 | diagnostics 構造化ログ統合 | `apps/api/src/repository/_shared/builder.ts` |
| 5 | metadata test 拡張 | `apps/api/src/repository/_shared/metadata.test.ts` |
| 6 | builder test 拡張 | `apps/api/src/repository/_shared/builder.test.ts` |
| 7 | adapter contract test | `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts` |
| 8 | CI gate | `.github/workflows/ci.yml`（または `backend-ci.yml`）に `verify-static-manifest` job 追加 |
| 9 | npm scripts | `package.json` の `scripts.verify:static-manifest` / `scripts.regenerate:static-manifest` |
| 10 | 正本 spec 追記 | `docs/00-getting-started-manual/specs/01-api-schema.md`（retirement 条件節） |
| 11 | Phase 11 evidence | `outputs/phase-11/evidence/{verify-static-manifest,regenerate-determinism,test-results,diagnostics-sample}.log` |

## 機能要件

1. **manifest stale detection**: `pnpm verify:static-manifest` 実行時、`static-manifest.json` の `sourceSpecHash` が `docs/00-getting-started-manual/specs/01-api-schema.md` から計算した hash と一致しない場合、exit code 非0 で失敗し、原因（`sourceSpecHashDrift` / `missingSourceSpec` / `invalidSchema`）を stderr に出す。
2. **決定論的再生成**: `pnpm regenerate:static-manifest` を 2 回連続実行しても出力が byte-identical（diff 0）。`generatedAt` などの非決定論フィールドは固定タイムスタンプ（source spec の最終更新時刻）または build-time 固定値で生成する。
3. **diagnostics 構造化ログ**: `buildSectionsWithDiagnostics()` が unknown stable key を検出した際、`apps/api/src/lib/logger.ts` 経由で `code: "UBM-MANIFEST-UNKNOWN-KEY"` と件数・stableKey 配列を含む構造化ログを出力する。テストで `logger` の mock を観察してアサーションする。
4. **adapter contract test**: `AliasQueueAdapter#dryRunAlias()` interface に対して、(a) success（`{ ok: true, resolvedKey }`）、(b) failure（`{ ok: false, reason }`）、(c) `MetadataResolver` 経由で unknownStableKey が adapter に伝搬する経路、の最低 3 ケースを in-memory fake で検証する。
5. **CI gate**: PR / push のたびに `verify-static-manifest` が CI で実行され、stale 検出時は CI fail。
6. **retirement 条件正本反映**: `docs/00-getting-started-manual/specs/01-api-schema.md`（または `08-free-database.md`）に「03a forms schema sync が D1 `schema_questions` を populate し、`MetadataResolver` が D1 から resolve できる契約テストが PASS した時点で static-manifest.json を削除する」旨を明文化。

## 非機能要件

| 観点 | 要求 |
| --- | --- |
| 決定論性 | regenerate スクリプトが同入力で同バイト出力。`Date.now()` / 環境依存の値を出力に混ぜない |
| 安全性 | manifest 検証失敗時に CI を fail させ、stale な manifest がリリースに乗らないこと |
| 不変条件 #1 | manifest source の正本は `docs/00-getting-started-manual/specs/01-api-schema.md`。コード側に schema を duplicate しない |
| 不変条件 #5 | diagnostics ログは `apps/api` 内で完結。`apps/web` 側に diagnostics API を露出しない |
| 不変条件 #14 | CI gate 1 つ追加のみ。Cloudflare 課金枠への影響なし。Workers runtime 内では新規外部呼び出しを行わない |
| 観測性 | unknown stable key 件数 / stableKey 配列 / sectionKey が構造化ログから抽出可能 |
| redaction | manifest の値・diagnostics ログには PII を含めない（schema label / stableKey のみ）。redact 不要 |

## 制約条件

1. **03a 本体実装禁止**: D1 backed alias queue adapter の本体実装は scope out。本タスクは contract test の interface 側のみ。
2. **D1 migration 実行禁止**: 本タスクは D1 schema 変更を伴わない。
3. **本番データへの副作用禁止**: スクリプト実行は repo ローカルのみ。Cloudflare API token は不要。
4. **CONST_007**: 「Phase XX で対応」「将来タスク」「別 PR」の先送り表現を残さない。03a 本体は最初から scope out として明示するため先送りには該当しない。
5. **不変条件 #1**: source spec を正本とし、コード側で schema を再定義しない。
6. **不変条件 #5**: diagnostics は apps/api 層に閉じる。
7. **lefthook / branch protection**: 既存 hook を改変しない（`pnpm install` 経由で `lefthook install` が走るのは前提）。

## DoD（Phase 1 チェックリスト展開）

- [ ] 11 件の出力成果物のパスと役割が確定している
- [ ] 6 件の機能要件が、Phase 2 で関数シグネチャ / データ構造に落とし込める粒度で記述されている
- [ ] 不変条件 #1 / #5 / #14 への影響が「触らない / 触る場合の制約」で言及されている
- [ ] 03a 本体実装が scope out として明示されている（CONST_007 に整合）
- [ ] visualEvidence = NON_VISUAL であることを明示

## 参照資料

- 元 unassigned task: `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md`
- 対象コード: `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` / `generated/static-manifest.json`
- 既存テスト: `apps/api/src/repository/_shared/metadata.test.ts` / `builder.test.ts`
- 仕様正本: `docs/00-getting-started-manual/specs/01-api-schema.md` / `08-free-database.md`
- ロガー: `apps/api/src/lib/logger.ts`
- CI: `.github/workflows/ci.yml` / `.github/workflows/backend-ci.yml`
- `CLAUDE.md`（mise exec / pnpm workspace / branch 戦略）

## 多角的チェック観点

- 不変条件 #1: コード側に schema duplication が増えていないか
- 不変条件 #5: diagnostics ログ経路が apps/web に漏れていないか
- 不変条件 #14: CI gate 追加で free-tier 内に収まっているか
- 決定論性: regenerate 出力に `Date.now()` / random / 環境依存値が混入していないか
- contract test の十分性: success / failure / unknown 経路の 3 系統を網羅しているか
- retirement 条件の operability: 03a 完成後にチェックすべきテスト名・grep キーワードが正本 spec に書かれているか

## サブタスク管理

- [ ] manifest 既存フィールド（`generatedAt` / `regenerateCommand` / `retirementCondition`）の維持方針を Phase 2 に渡す
- [ ] `sourceSpecHash` の hash アルゴリズム（sha256 推奨）を Phase 2 で確定
- [ ] CI gate を `ci.yml` 統合と `backend-ci.yml` 追加のどちらにするか Phase 2 で決定
- [ ] retirement 条件を `01-api-schema.md` / `08-free-database.md` のどちらに記載するか Phase 2 で決定
- [ ] `outputs/phase-01/main.md` を作成

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [ ] DoD 全項目が満たされている
- [ ] Phase 2 設計が要件・制約・成果物 11 件をすべて受け取れる粒度で記述されている
- [ ] CONST_007 の先送り表現が含まれていない

## タスク100%実行確認

- [ ] 必須セクションが埋まっている
- [ ] 03a 本体実装が scope out として明示されている
- [ ] 本 Phase で実装変更（commit / push / PR）を実行していない（仕様書のみ）

## 次 Phase への引き渡し

Phase 2 へ:

- 11 件の成果物パス
- 6 件の機能要件（関数シグネチャ・JSON schema 追加・テストケース粒度に落とす）
- 決定論性の制約（`Date.now()` 禁止 / source spec hash を固定タイムスタンプ源にする）
- contract test の最低 3 ケース（success / failure / unknown transit）
- CI gate 配置候補と retirement 条件追記先候補

## 統合テスト連携

- 上流: UT-02A baseline（`MetadataResolver` / `static-manifest.json` 既に merged）
- 下流: 03a alias queue adapter 本体実装（contract test を本タスクで先行配備しておくことで unblock 可能）／ static manifest retirement task（03a 完成後）

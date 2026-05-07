# Phase 12: implementation-guide (PR本文ソース)

タスク: `UT-02A-FU-DIAG-001` / issue #373
区分: NON_VISUAL hardening sprint / implemented-local

## 概要

UT-02A canonical metadata baseline の follow-up として、static manifest の drift 検出 / 決定的再生成 / 構造化 diagnostics / AliasQueueAdapter contract / retirement condition 明文化の 5 点を実装した。

## 主要変更

### 1. static manifest stale 検出 (`scripts/verify-static-manifest.mjs`)
- source spec (`docs/00-getting-started-manual/specs/01-api-schema.md`) を canonicalize → sha256 し、manifest 内 `sourceSpecHash` と突合
- 戻り値: `{ ok: true } | { ok: false, reason: "sourceSpecHashDrift"|"missingSourceSpec"|"invalidSchema", ... }`
- CLI: 失敗時 exit 1 + stderr。CI gate (`.github/workflows/ci.yml`) に組み込み済み

### 2. 決定的再生成 (`scripts/regenerate-static-manifest.mjs`)
- top-level key 順序固定: `$comment, source, sourceSpecVersion, sourceSpecHash, generatedAt, regenerateCommand, retirementCondition, sections, fields`
- sections は `position` 昇順、fields は `stableKey` 辞書順
- 同入力で byte-identical (DT-05 で 3 連続 sha256 一致を確認)

### 3. 構造化 diagnostics (`apps/api/src/repository/_shared/builder.ts`)
- `buildSectionsWithDiagnostics()` で unknown stableKey 検出時に `logWarn({ code: "UBM-MANIFEST-UNKNOWN-KEY", count, stableKeys, note })` を発火
- `apps/api/src/lib/logger.ts` を新設（最小構造化ロガー、sink 差し替え可能）

### 4. AliasQueueAdapter contract test
- `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`
- D1/network 非依存 (`vi.fn()` fake) で 4 ケース (DT-11..DT-14)

### 5. retirement condition 明文化
- `docs/00-getting-started-manual/specs/01-api-schema.md` に `## Static Manifest Retirement Condition` セクション追加
- `apps/api/src/repository/_shared/metadata.ts` 冒頭コメントから当該セクションへ参照

## AC マトリクス

| AC | 内容 | 検証 |
|----|------|------|
| AC-1 | manifest drift 検出可 | DT-01/DT-02 PASS |
| AC-2 | 決定的再生成 | DT-05/DT-06/DT-07 PASS |
| AC-3 | 各 field は 1 section のみ | builder.test.ts AC-3 PASS |
| AC-4 | consent kind 解決 | metadata.test.ts AC-4 PASS |
| AC-5 | label が stable_key を露出しない | metadata.test.ts AC-5 PASS |
| AC-6 | unknown stableKey は `__unknown__` 隔離 | builder.test.ts AC-6 PASS |
| AC-7 | AliasQueueAdapter hook 提供 | DT-11..DT-14 PASS |
| AC-8 | retirement condition 明文化 | DT-16 PASS |

## 不変条件チェック (CLAUDE.md §重要な不変条件)

- (1) schema 過剰固定回避: source spec hash で drift 検出する設計、コード側は resolver 経由
- (2) consent キー統一: `publicConsent` / `rulesConsent` を `CONSENT_KIND_OVERRIDE` で固定
- (3) `responseEmail` は system field 扱い: `SYSTEM_FIELDS` で manifest に注入し、`__system__` section へ
- (4) admin-managed data 分離: 本タスクは Google Form 由来 schema のみ対象
- (5) D1 直接アクセス境界: `apps/api` 内に閉じる（変更箇所はすべて `apps/api/src/repository/_shared/`）

## evidence 参照

- `outputs/phase-11/evidence/verify-static-manifest.log` — clean PASS / drift FAIL ログ
- `outputs/phase-11/evidence/regenerate-determinism.log` — 3 連続 sha256 一致
- `outputs/phase-11/evidence/test-results.log` — focused Vitest 5 files / 32 tests GREEN

## 検証コマンド結果

| コマンド | 結果 |
|----------|------|
| `pnpm verify:static-manifest` | PASS |
| `pnpm typecheck` | PASS (5 workspace projects) |
| `pnpm lint` | PASS (existing stablekey literal warnings in `identity-conflict.ts` only; command exit 0) |
| `pnpm vitest run apps/api/src/repository/_shared/metadata.test.ts apps/api/src/repository/_shared/builder.test.ts apps/api/src/repository/_shared/__tests__/static-manifest.verify.test.ts apps/api/src/repository/_shared/__tests__/builder.diagnostics.test.ts apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts` | PASS (5 files / 32 tests) |
| `pnpm --filter @ubm-hyogo/api test apps/api/src/repository/_shared` | Not used for pass/fail: package script widened scope to all `apps/api` tests and hit existing unrelated hook timeouts. |

## スクリーンショット

NON_VISUAL タスク (routes / UI 変更ゼロ) のため対象外。

# Phase 9 — 品質保証（QA）

> Task: issue-863-admin-error-alert-policy-iac
> 区分: 実装仕様書 / visual: **NON_VISUAL**
> 目的: 実装サイクルで実行する QA コマンド群と PASS/FAIL gate を確定する。
> 本仕様作成時点ではコード未実装のため、各コマンドは「実装後に実行する手順」として定義する。

---

## 9-1. QA 実行コマンド（順序固定）

すべて `mise exec --` 経由で Node 24 / pnpm 10 を保証する。

| # | コマンド | 目的 | AC |
|---|----------|------|----|
| 1 | `mise exec -- pnpm install --force` | lockfile 整合（`package.json` scripts 追加分） | - |
| 2 | `mise exec -- pnpm typecheck` | logger.ts tag 昇格 + infra/sentry-alerts/lib の型整合 | AC-2 |
| 3 | `mise exec -- pnpm lint`（失敗時 `pnpm lint --fix` → 残違反を手修正） | logger.ts / lib / workflow yml の lint | - |
| 4 | `mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/logger.spec.ts` | scope/digest tag 昇格の単体検証 | AC-2 |
| 5 | `mise exec -- pnpm exec vitest run infra/sentry-alerts` | IaC lib（schema-contract / load / diff）green | AC-1, AC-6 |
| 6 | `mise exec -- pnpm test:sentry-alerts` | 上記 5 を package.json script 経由でも実行可能か確認（CI 経路と同一） | AC-1 |
| 7 | `mise exec -- pnpm sentry-alerts:diff --ci`（drift CI ローカル dry-run） | repo 宣言 vs canonical の drift=0 を read-only で確認。`SENTRY_ALERTS_MOCK_DIR` を使い実 API を叩かない | AC-6 |

> コマンド 7 の `--ci` は read-only 境界を破る apply を exit 78 で拒否する（cloudflare-alerts の `--ci` 規約を踏襲）。実 Sentry API への接続は user-gated（Phase 11）。

---

## 9-2. PASS / FAIL gate

| gate | PASS 基準 | FAIL 時の扱い |
|------|-----------|--------------|
| G1: typecheck | exit 0 | unused import / 型注釈漏れ / export 不整合を最小差分修正後に再実行 |
| G2: lint | exit 0（`--fix` 適用後の残違反 0） | OKLch トークン / `process.env` 直参照混入がないことも兼ねる |
| G3: logger spec | scope/digest tag 検証テストが green | tag 昇格ロジック修正 |
| G4: sentry-alerts lib unit | schema-contract / load / diff の全 spec green | 個別 lib 修正 |
| G5: schema validation | `infra/sentry-alerts/policies/*.json` が `schema/policy.schema.json` を pass（schema-contract.spec.ts 内で AJV 検証） | policy JSON または schema 修正 |
| G6: drift dry-run | `sentry-alerts:diff --ci` が drift=0（exit 0） | canonicalize / 宣言 JSON の乖離を修正 |
| G7: ファイル削除なし | `git diff --diff-filter=D dev...HEAD --name-only` が空（新規追加のみ） | 削除が出たら誤操作。元に戻す |

---

## 9-3. schema-contract gate の具体内容（AC-1 / AC-6 直結）

`infra/sentry-alerts/lib/__tests__/schema-contract.spec.ts` は以下を検証する:

1. `policies/admin-error-boundary.json` が `schema/policy.schema.json` を AJV で pass する。
2. policy の `filter` 相当に `tags.scope == "admin"` と `digest` 頻度条件が含まれる（AC-2 の閾値定義が宣言に存在する）。
3. `additionalProperties: false` により Sentry server-generated 鍵（`id` / `dateCreated`）の直書きを schema が拒否する（IaC 正本性 = AC-6）。
4. 機密参照（API token / DSN）が JSON に**素値で存在しない**（`op://` 参照または env 経由のみ）ことを正規表現 gate で確認。

---

## 9-4. ファイル削除なし（新規追加のみ）の PASS 基準

本タスクは logger.ts / logger.spec.ts / package.json / CODEOWNERS の **既存ファイル修正**と、
`infra/sentry-alerts/**` / workflow yml / runbook の **新規追加**のみで構成される。

PASS 基準: `git diff --diff-filter=D dev...HEAD --name-only` の出力が空であること。
削除が検出された場合は QA を FAIL とし、削除の意図を Phase 10 へエスカレーションする。

---

## 9-5. QA 完了の定義

G1..G7 がすべて PASS かつ、Phase 7 で確定した変更行 line/branch カバレッジ閾値を満たすこと。
実 Sentry API 接続を要する apply 検証（AC-3 staging 疎通 / AC-1 実 rule 適用）は
Phase 11 の user-gated 手動テストへ委譲し、本 Phase の gate には含めない。

# Phase 11: evidence 取得 (NON_VISUAL)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 11 / 13 |
| Phase 名称 | evidence 取得 (NON_VISUAL) |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (ロールアウト / 後続連携) |
| 次 Phase | 12 (close-out) |
| 状態 | completed |
| visualEvidence | NON_VISUAL |
| user_approval_required | false |

## 目的

`Env` interface 新規作成と `ctx()` refactor（02c `_shared/db.ts`）の正しさを、コード変更なしで観測可能な 4 種の log evidence によって裏付け、AC-1〜AC-7 のうち AC-3 / AC-5 / AC-6 を Phase 8 / 9 と独立に再検証する。本タスクは binding 型 refactor のみであり deploy 前段階なので、`WorkerPreflightEvidence` 4 軸（health / config / logs / runtime）のうち本 Phase で取得すべきは **config 軸 (typecheck / lint) と logs 軸 (test / boundary lint)** の 2 軸のみで、health / runtime（production preflight）は **本タスク範囲外**（後続 09b production-deploy 責務）。

## 必須 evidence 8 種

| # | ファイル | 取得コマンド | 期待観測 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck` | `Env` 型解決成功 / `ctx(Pick<Env, "DB">)` 型エラーなし / exit 0 |
| 2 | `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint` | ESLint / biome warning 0 / exit 0 |
| 3 | `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm test --filter @ubm/api` | 02c repository 既存 unit test all PASS / exit 0 |
| 4 | `outputs/phase-11/evidence/boundary-lint-negative.log` | `apps/web` temporary relative import probe + `mise exec -- node scripts/lint-boundaries.mjs` | `apps/web` → `apps/api/src/env` relative import が error 検出 |
| 5 | `outputs/phase-11/evidence/file-existence.log` | `test -f ...` | `env.ts` / `_shared/db.ts` / guide / boundary lint script が存在 |
| 6 | `outputs/phase-11/evidence/binding-mapping-check.log` | `wrangler.toml` ↔ `Env` 手動照合 | `DB` / `SHEET_ID` / Forms vars / sync vars / secrets の対応を記録 |
| 7 | `outputs/phase-11/evidence/guide-diff.txt` | guide 更新差分確認 | implementation-guide / 02c guide / 08-free-database の反映先を記録 |
| 8 | `outputs/phase-11/evidence/secret-hygiene.log` | `grep -iE ... apps/api/src/env.ts` | 実値 0 件、field 名・コメントのみ |

## 任意補助 evidence

| # | ファイル | 内容 |
| --- | --- | --- |
| A1 | `outputs/phase-11/evidence/env-ts-snapshot.md` | `apps/api/src/env.ts` の **構造 snapshot のみ**（`interface Env { ... }` の field 名 / 型名 / 対応 binding コメント要約）。**実コード行は転記しない**（secret 値混入回避のため、識別子と型カテゴリ列挙に留める） |

## WorkerPreflightEvidence 4 軸の該当判定

| 軸 | 本タスクでの該当 | 備考 |
| --- | --- | --- |
| health | **N/A** | deploy 前 stage。production health endpoint 観測は 09b 責務 |
| config | **必須**（typecheck.log / lint.log） | `Env` interface と wrangler.toml binding 表の同期確認 |
| logs | **必須**（test.log / boundary-lint.log） | unit test + boundary lint の出力 |
| runtime | **N/A** | Worker runtime 観測は 09b production-deploy で取得 |

## runbook（取得順序 / 期待出力 / 失敗時対応）

### Step 1: typecheck

```bash
cd <repo-root>
mise exec -- pnpm typecheck \
  | tee docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-11/evidence/typecheck.log
```

- 期待: 末尾に "Done" 相当 + exit 0
- 失敗時: `Env` field 不足 / `Pick<Env, "DB">` ミスマッチを Phase 5 runbook に差し戻し

### Step 2: lint

```bash
mise exec -- pnpm lint \
  | tee docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-11/evidence/lint.log
```

- 期待: warning / error 0 件
- 失敗時: 該当ファイルを修正、再取得

### Step 3: test

```bash
mise exec -- pnpm test --filter @ubm/api \
  | tee docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-11/evidence/test.log
```

- 期待: 02c で導入された `_shared/db.ts` 周辺 unit test all PASS
- 失敗時: AC-3 違反 → Phase 2 設計差し戻し

### Step 4: boundary lint negative test

```bash
mise exec -- node scripts/lint-boundaries.mjs \
  | tee docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-11/evidence/boundary-lint-negative.log
```

- 期待: temporary fixture `import type { Env } from "../../api/src/env"` が relative path 解決で error として検出され、fixture 削除後は exit 0
- 失敗時: AC-5 違反 → `scripts/lint-boundaries.mjs` の禁止トークンに `apps/api/src/env` を追加

### Step 5: secret hygiene 再確認

```bash
grep -iE '(token|cookie|authorization|bearer|set-cookie|secret|api[_-]?key)' \
  docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-11/evidence/*.log \
  || echo 'PASS'
```

- 期待: `PASS`（0 hit）
- 失敗時: 該当 log 行を redaction、再取得

## secret hygiene 再確認

- 4 種 log には wrangler.toml の binding **名** は出るが **値**（API token / OAuth secret 等）は出ない設計。Step 5 grep で確証する。
- `env-ts-snapshot.md` には field 名と型カテゴリのみを記載し、コメント内の例示値や本番値は転記しない。

## 実取得後の扱い

本 close-out では実装差分と NON_VISUAL evidence を同一 wave で取得済み。`metadata.workflow_state` は `implemented-local`、Phase 11 / 12 は `completed`、Phase 13 は `pending_user_approval` として扱う。

## observation note（実取得時に `outputs/phase-11/main.md` に追記）

各 evidence について以下を記録:

- 取得時刻（UTC）
- 実行 Node / pnpm バージョン（`mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2）
- AC-3 / AC-5 / AC-6 の充足判定（PASS / FAIL）
- secret hygiene grep 結果（PASS / FAIL）
- anomaly があれば記述

## 異常時処理

| 事象 | 対応 |
| --- | --- |
| typecheck 失敗 | `env.ts` の field 過不足 / `Pick<Env, "DB">` 型を Phase 2 設計に照合し修正 |
| test 失敗 | 02c 既存テストとの後方互換違反 → `ctx()` 引数仕様を再点検 |
| boundary lint pass しない | `scripts/lint-boundaries.mjs` 禁止トークンに `apps/api/src/env` を追加し再実行 |
| secret hygiene fail | log を再生成（redaction / 取得コマンド見直し） |

## 完了条件

- [x] 必須 evidence 8 ファイル取得済み
- [x] secret hygiene grep PASS
- [x] observation note を `outputs/phase-11/main.md` に記録
- [x] artifacts.json の phase 11 status を `completed`

## 次 Phase

- 次: Phase 12 (close-out)
- 引き継ぎ: 4 ファイル evidence + observation note（実取得後）

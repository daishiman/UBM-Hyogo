# Phase 5: 実装

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **implementation_mode: new**
**対象 Issue: #1146 [FU-SASR-002]（CLOSED 維持・`Refs #1146` のみ）**

## 1. 変更対象ファイル一覧（パス + 変更種別）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `.github/workflows/verify-no-localhost-bake.yml` | 編集 | `on.pull_request.paths` ブロックを除去し常時実行化する。`push` / `pull_request.branches` / `jobs` は不変 |

> 上記 1 ファイル以外のコード変更はない。`scripts/verify-no-localhost-bake.sh` / `scripts/verify-no-localhost-bake.spec.ts`
> は **無変更**（grep LOGIC・self-test ともに不変）。

### 新規作成 / 修正ファイルパス一覧（Feedback RT-03）

- **新規作成**: なし
- **修正**: `.github/workflows/verify-no-localhost-bake.yml`（`on.pull_request.paths` 除去のみ）

## 2. 根本最適化の理由（なぜ paths を除去するか）

required status check は `on.pull_request.paths` フィルタを持つと、**非該当 PR（例: docs-only / `apps/api` のみの PR）に
対し workflow が起動しない**。GitHub の branch protection は「required context の status が無い」状態を
`Expected — Waiting for status` として扱い、**永久に merge をブロック**する。

既存 required check 全 workflow（`ci` / `Validate Build` / `e2e-tests` / `lighthouse-ci`）は `paths` を持たず常時実行で
あることを確認済み。`verify-no-localhost-bake` を required 化するには、同じ no-paths 規約へ揃える必要がある。

## 3. yml の Before / After（コードブロック明示）

### Before（現状）

```yaml
name: verify-no-localhost-bake

on:
  pull_request:
    branches: [main, dev]
    paths:
      - "apps/web/src/**"
      - "apps/web/app/**"
      - "apps/web/wrangler.toml"
      - "scripts/verify-no-localhost-bake.sh"
      - "scripts/verify-no-localhost-bake.spec.ts"
      - ".github/workflows/verify-no-localhost-bake.yml"
  push:
    branches: [main, dev]
```

### After（paths ブロック除去・常時実行化）

```yaml
name: verify-no-localhost-bake

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]
```

> 除去するのは `pull_request.paths:` の 7 行（`paths:` 行 + 6 つの glob エントリ）のみ。
> `pull_request.branches: [main, dev]` と `push.branches: [main, dev]` は保持する。
> `permissions` / `concurrency` / `jobs`（self-test step・source grep gate step）は**完全に不変**。

## 4. 入出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | PR イベント（base = main/dev）/ push（main/dev） |
| 出力 | job `verify-no-localhost-bake` の status（success / failure） |
| 副作用 1: 常時起動 | 全 PR（docs-only / api-only 含む）で workflow が起動する。これにより required check が `Expected — Waiting` で stuck しなくなる |
| 副作用 2: merge ブロック条件 | required 登録後、`bash scripts/verify-no-localhost-bake.sh --src-only` が違反検出（exit 非0）した PR は merge ブロックされる |
| 副作用 3: CI コスト | 1 job = `pnpm install --frozen-lockfile` + `vitest run`（self-test）+ `bash ... --src-only`（grep）。数分程度で既存 `ci` / `Validate Build` と同等。timeout-minutes: 10 の範囲内 |

## 5. gate self-test step（不変・参考）

yml 内の以下 2 step は本タスクで**変更しない**。

```yaml
      - name: self-test
        run: mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts
      - name: source grep gate
        run: bash scripts/verify-no-localhost-bake.sh --src-only
```

## 6. branch protection 登録手順（user-gated・Phase 13 実行）

> **実行は user 承認後のみ。** read-only GET（before evidence）は pre-gate で取得可。
> dev / main は**個別に GET → 個別に PUT** する（一括処理しない）。

### 6.1 before GET（現 contexts 取得・read-only）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'
# 期待（実測）: ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]
```

### 6.2 contexts 配列に追加（擬似 PUT payload）

既存 5 context を保持したまま `verify-no-localhost-bake` を追加する。strict 等その他の
`required_status_checks` 設定値は現行 GET の値を**そのまま再投入**し、drift を生まない。

```text
新 contexts（dev / main 共通・6 件）:
["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate","verify-no-localhost-bake"]
```

```bash
# user 承認後のみ実行（dev → fresh GET → main → fresh GET の順で個別 PUT）
# payload は before GET の full protection 構造を踏襲し、required_status_checks.contexts のみ 6 件へ拡張する
gh api -X PUT --input outputs/phase-13/branch-protection-payload-dev.json \
  repos/daishiman/UBM-Hyogo/branches/dev/protection
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-13/branch-protection-after-dev.json

gh api -X PUT --input outputs/phase-13/branch-protection-payload-main.json \
  repos/daishiman/UBM-Hyogo/branches/main/protection
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-13/branch-protection-after-main.json
```

> `required_status_checks` 部分 PUT 例は採用しない。Phase 13 と同じ full `/branches/{branch}/protection`
> payload に一本化し、`required_pull_request_reviews=null` / `lock_branch=false` /
> `enforce_admins=true` など branch protection 全体の drift を before/after で監査する。

### 6.3 after GET（登録確認）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'
# 期待: 上記 6 件（verify-no-localhost-bake を含む）
```

## 7. 実装手順（実装者が辿る順序）

1. `.github/workflows/verify-no-localhost-bake.yml` の `on.pull_request.paths:` ブロック（paths 行 + 6 glob）を除去する。
2. `actionlint` / yamllint で構文 0 エラーを確認する。
3. `mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts`（self-test）が全 pass を確認する。
4. `bash scripts/verify-no-localhost-bake.sh --src-only` が exit 0（現 src に違反なし）を確認する。
5. （user 承認後）before GET → dev/main 個別 PUT → after GET で required 登録を完了する。

## 8. DoD（Definition of Done）

| 項目 | 基準 |
| --- | --- |
| yml 変更 | `on.pull_request.paths` が存在しない / `pull_request.branches` / `push.branches` / `jobs` が不変 |
| self-test | `vitest run scripts/verify-no-localhost-bake.spec.ts` 全 pass |
| grep gate | `bash scripts/verify-no-localhost-bake.sh --src-only` が exit 0 |
| 構文 | actionlint / yamllint エラー 0 |
| required 登録（user-gated） | dev/main の contexts が 6 件（既存 5 + `verify-no-localhost-bake`）/ governance drift 0 |

## 完了条件（Phase 5）

- [x] 変更対象ファイル一覧（表）を冒頭に置いた
- [x] yml の Before/After をコードブロックで明示した（paths 除去・push / branches / jobs 保持）
- [x] 入出力・副作用（常時起動 / merge ブロック / CI コスト）を記載した
- [x] branch protection 登録手順（個別 GET → 追加 → 個別 PUT）を user-gated として記述した
- [x] 新規作成 / 修正ファイルパス一覧（RT-03）を記載した

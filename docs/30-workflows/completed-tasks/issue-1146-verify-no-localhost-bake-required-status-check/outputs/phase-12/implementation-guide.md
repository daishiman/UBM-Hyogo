# 実装ガイド（Implementation Guide）

## Part 1: やさしい説明（なぜ必要か → 何をするか）

背景（なぜ必要か）:
マンションの入口に、警備員（チェックの仕組み = gate）が立っているところを想像してください。
この警備員は「ローカル用の住所（localhost / 127.0.0.1）を本番の設定にこっそり焼き込んでいないか」を見張る係です。
ところが今は困ったことに、**警備員は立っているのに「その警備員のチェックを通らなくても部屋に入れてしまう（PR をマージできてしまう）」状態**です。
警備員が「これはダメです」と言っても、住人はそれを無視して入居（マージ）できるので、せっかくの見張りが意味を持ちません。
だから、まず「この警備員のチェックを必ず通らないと入居できない」というルール（required status check）を、マンションの 2 つの棟（`dev` 棟と `main` 棟）に登録する **必要** があります。これが **なぜ** この作業をするのかの理由です。

もう一つ気をつけることがあります。今の警備員は「web まわりの荷物を持った人だけチェックする」という変わったクセを持っています（paths フィルタ）。
このまま「必ず通れ」のルールにすると、web の荷物を持っていない人が来たとき、警備員は「自分の担当じゃない」と席を立ってしまい、いつまでも「チェック待ち（Waiting for status）」のまま、その人は永久に入居できなくなります。
たとえば、書類だけ直しに来た人（ドキュメントだけの PR）が、ずっと入口で待たされて二度と中に入れない、というイメージです。
だから先に、警備員を「来た人は全員チェックする」係に直してから、必須ルールを登録します。

要約（何をするか）:
この作業では、(1) 警備員を「全員チェックする」係に直し（workflow の paths フィルタを外す）、(2) `dev` 棟と `main` 棟の両方に「この警備員のチェックは必須」と登録します（branch protection に context を 1 つ追加）。
チェックの中身（どう見張るか = grep のロジック）は一切変えません。見た目（画面）も何も変わりません。

### 今回作ったもの

1. `verify-no-localhost-bake` という警備員（CI チェック）を「全員チェック」に直す設定変更（workflow の paths フィルタ除去）。
2. `dev` と `main` の入居ルール（branch protection）に「この警備員のチェックは必須」を 1 つ追加（既存の 5 つのチェックはそのまま残す）。

---

## Part 2: 技術者向けノート

要約:
`verify-no-localhost-bake` gate（`scripts/verify-no-localhost-bake.sh` の `--src-only` grep + `scripts/verify-no-localhost-bake.spec.ts` self-test）は親 workflow で landed 済みだが、
`dev` / `main` の `required_status_checks.contexts` に未登録のため merge ブロックが効かない。
本タスクは (1) `.github/workflows/verify-no-localhost-bake.yml` の `on.pull_request.paths` ブロック除去で常時実行化（grep LOGIC 不変）、
(2) `gh api -X PUT` で dev/main 個別に既存 5 context 保持のまま `verify-no-localhost-bake` を末尾追加する。

### 型・シグネチャ（branch protection PUT payload）

branch protection PUT は全体上書き API のため、payload の構造を型で固定し、既存フィールドの逐語再投入を明示する。

```ts
// GitHub branch protection PUT payload（required_status_checks のみ変更し他は GET 値を逐語再投入）
interface BranchProtectionRequiredStatusChecks {
  strict: boolean;
  contexts: string[]; // 既存 5 件 + "verify-no-localhost-bake"
}

interface BranchProtectionPutPayload {
  required_status_checks: BranchProtectionRequiredStatusChecks | null;
  enforce_admins: boolean;                 // = true（drift 禁止）
  required_pull_request_reviews: null;     // solo 運用ポリシー（= null・drift 禁止）
  restrictions: null;
  required_linear_history?: boolean;       // = true（drift 禁止）
  required_conversation_resolution?: boolean; // = true（drift 禁止）
  lock_branch?: boolean;                   // = false（drift 禁止）
  allow_force_pushes?: boolean;            // = false
  allow_deletions?: boolean;               // = false
}

// 追加する context 名（実 workflow の job name / context 名と一致）
type AddedContext = "verify-no-localhost-bake";
```

### CLIシグネチャ

```bash
# GET（before / after evidence）
gh api repos/{owner}/{repo}/branches/{branch}/protection
# 例: gh api repos/daishiman/UBM-Hyogo/branches/dev/protection

# PUT（payload は branch 別・全体上書き）
gh api -X PUT repos/{owner}/{repo}/branches/{branch}/protection --input <payload.json>
# 例: gh api -X PUT --input outputs/phase-13/branch-protection-payload-dev.json \
#       repos/daishiman/UBM-Hyogo/branches/dev/protection
```

### 使用例

dev / main それぞれ Before/After の contexts 配列（固定値）:

```bash
# Before（dev / main 共通・実測）
["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]

# After（dev / main 共通・末尾に追加）
["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate","verify-no-localhost-bake"]
```

workflow の paths 除去 Before/After:

```yaml
# Before: .github/workflows/verify-no-localhost-bake.yml（paths フィルタ付き）
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

```yaml
# After: paths ブロックのみ除去（常時実行化・grep LOGIC / job step は不変）
on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]
```

### エラーハンドリング

| リスク | 原因 | 対策 |
| --- | --- | --- |
| 既存 context 消失 | PUT は全体上書き。`contexts` に追加分だけ書くと既存 5 件が消える | before GET の `contexts` を逐語コピーし末尾に 1 件追加した payload を作る |
| permanent pending | context 名が実 job name とずれる（例: `verify-no-localhost-bake ` の空白混入や旧名） | workflow の `jobs.<id>.name` / `name:` と完全一致させる（`verify-no-localhost-bake`） |
| governance drift | `required_pull_request_reviews` などを payload に書き忘れて API が null/default に倒す | before GET の全フィールドを逐語再投入し after GET で一致確認 |
| 422 Unprocessable | payload schema 不正（型不一致・必須欠落） | 型 `BranchProtectionPutPayload` に従い、`restrictions:null` 等の必須キーを明示 |

### エッジケース

| ケース | 挙動 / 対応 |
| --- | --- |
| paths-filter 残存のまま required 化 | 非 web PR で gate が起動せず `Expected — Waiting for status` のまま永久 merge ブロック。→ AC-1 の paths 除去が必須前提 |
| dev と main の contexts が将来分岐 | branch 別に GET → branch 別 payload で PUT（dev payload を main に使い回さない）。本タスクでは両者同一だが手順は分離 |
| 片側 branch だけ drift（例: main の enforce_admins が false 化） | dev/main 個別 GET で検知し、after GET で `enforce_admins=true` を branch 別に確認 |
| gate が flaky（self-test 失敗） | gate LOGIC は本タスク対象外（grep 不変）。required 化は gate の安定性を前提とし、不安定なら別 issue で扱う（B-3 baseline） |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| 追加 context 名 | `verify-no-localhost-bake`（workflow の job name / `name:` と一致） |
| 対象 branch | `dev`, `main`（個別 GET / 個別 PUT） |
| 保持必須 context | `ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate` |
| 保持必須 protection フィールド | `enforce_admins=true` / `required_pull_request_reviews=null` / `required_linear_history=true` / `required_conversation_resolution=true` / `lock_branch=false` |
| 変更対象ファイル | `.github/workflows/verify-no-localhost-bake.yml`（paths ブロック除去のみ） |
| 不変ファイル | `scripts/verify-no-localhost-bake.sh` / `scripts/verify-no-localhost-bake.spec.ts`（grep LOGIC 不変） |
| evidence 出力先 | `outputs/phase-13/branch-protection-{current,payload,after}-{dev,main}.json` + `user-approval-issue-1146-<timestamp>.md` |

### テスト構成

| 検証 | 手段 | 実行区分 |
| --- | --- | --- |
| paths 除去後の常時実行化 | edit 後 yml に `paths:` ブロック不在を grep 確認 | local 実装済み |
| grep LOGIC 不変 | `.sh` / `.spec.ts` の diff が空 | local 実装済み |
| self-test gate 健全性 | `mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts` | gate 既存・本タスクで LOGIC 不変 |
| dev/main after contexts | after GET evidence に 6 context（既存 5 + 追加 1） | user-gated 後 |
| governance drift なし | after GET の保持必須フィールドが before と一致 | user-gated 後 |

検証コマンド（user-gated 後）:

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'
grep -n "paths:" .github/workflows/verify-no-localhost-bake.yml   # → ヒット 0 を期待
```

既知の制限:
- 本ガイドは implemented_local_runtime_pending。`gh api -X PUT` / commit / PR はすべて user-gated であり本サイクルでは実行しない。
- branch protection PUT は PR diff に現れないため、before/after evidence と approval marker で監査可能性を担保する。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショットは不要。
代替証跡として read-only 調査再現を記録した `../phase-11/manual-test-result.md`（NON_VISUAL 証跡メタ）を参照する。
mutation 後の after evidence は `outputs/phase-13/branch-protection-after-{dev,main}.json`（user-gated 後）に記録する。

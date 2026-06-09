# Phase 9: 品質保証

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **implementation_mode: new**
**対象 Issue: #1146 [FU-SASR-002]（CLOSED 維持・`Refs #1146` のみ）**

## 1. ローカル品質保証コマンドと期待結果

| 種別 | コマンド | 期待結果 |
| --- | --- | --- |
| yamllint | `yamllint .github/workflows/verify-no-localhost-bake.yml` | エラー / 警告 0（インデント・構文正常） |
| actionlint | `./actionlint -color .github/workflows/verify-no-localhost-bake.yml` | エラー 0（paths 除去後も `pull_request` / `push` が有効 trigger） |
| self-test | `mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts` | TC-VNLB-01 / 02 全 pass |
| source grep gate | `bash scripts/verify-no-localhost-bake.sh --src-only` | exit 0（現 `apps/web/src` `apps/web/app` に未許容 localhost なし） |
| script self-test | `bash scripts/verify-no-localhost-bake.sh --self-test` | `self-test passed`（dirty/clean/allow 3 fixture） |
| trigger 構造 assert | `grep -nE '^[[:space:]]*paths:' .github/workflows/verify-no-localhost-bake.yml` | 出力なし（paths 不在） |

## 2. branch protection 検証（runtime・user-gated）

> read-only GET は pre-gate 可。PUT は user 承認後（Phase 13）のみ。

```bash
# before / after GET（dev / main 個別）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'
# after 期待: ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate","verify-no-localhost-bake"]

# governance drift 0 の確認（CLAUDE.md ブランチ戦略）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  | grep -E 'required_pull_request_reviews|lock_branch|enforce_admins'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | grep -E 'required_pull_request_reviews|lock_branch|enforce_admins'
# 期待: required_pull_request_reviews=null / lock_branch=false / enforce_admins=true（drift なし）
```

## 3. 本タスク非該当の QA 項目（明示）

| 項目 | 該当 | 理由 |
| --- | --- | --- |
| mirror parity（`.agents/skills` symlink diff） | 非該当 | 本タスクは skill ファイルを変更しない（yml 1 ファイルのみ） |
| design-token gate / visual smoke | 非該当 | NON_VISUAL・UI 変更なし |
| D1 migration / schema 検証 | 非該当 | DB 非変更 |

## 4. DoD チェックリスト

| 項目 | 基準 |
| --- | --- |
| yml に paths 無し | `grep -nE '^[[:space:]]*paths:' .github/workflows/verify-no-localhost-bake.yml` が空 |
| branches 保持 | `pull_request.branches:[main,dev]` / `push.branches:[main,dev]` が不変 |
| jobs 不変 | self-test step / source grep gate step が無変更 |
| self-test PASS | `vitest run scripts/verify-no-localhost-bake.spec.ts` 全 pass |
| grep gate PASS | `bash scripts/verify-no-localhost-bake.sh --src-only` exit 0 / `--self-test` で `self-test passed` |
| yamllint / actionlint | エラー 0 |
| 既存 5 context 保持の payload 設計確定 | PUT payload が `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]` + `verify-no-localhost-bake` = 6 件 |
| governance drift 0 の確認手順確定 | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` を before/after GET で確認 |

## 5. user-gated 事項（実行はすべて user 承認後）

- `gh api -X PUT .../protection`（dev / main 個別）
- commit / push / PR 作成

注: yml edit（`on.pull_request.paths` 除去）は今回サイクル内の local 実装として完了済み。user-gated ではない。

## 完了条件（Phase 9）

- [x] yamllint / actionlint / self-test / source grep gate の実行コマンドと期待結果を記載した
- [x] mirror parity 等は本タスク非該当（skill 変更なし）と明記した
- [x] DoD チェックリスト（paths 無し / self-test PASS / grep gate PASS / 既存 5 context 保持 payload / governance drift 0）を定義した
- [x] user-gated 事項を列挙した

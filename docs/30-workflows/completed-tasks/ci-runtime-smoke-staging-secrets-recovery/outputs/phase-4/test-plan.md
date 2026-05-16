# Phase 4: テスト作成（TDD Red）

## テストファイル

`scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh`（plain bash + assert、`scripts/coverage-guard.sh` と同方針）

## テストケース（実装済み）

| ID | 条件 | 期待 | 実行結果 |
|----|------|------|---------|
| TC-01 | 全 workflow doc refs 実在 | exit 0 | PASS |
| TC-02 | missing path 検出 | exit 1 + missing 出力 | PASS |
| TC-03 | URL 形式 (`https://.../docs/foo.md`) を除外 | exit 0 | PASS |
| TC-04 | URL と repository-local missing path が同一行に混在 | external URL は除外し local missing は検出 | PASS |
| TC-05 | anchor 付き (`docs/foo.md#section`) を anchor 除去後に判定 | PASS | PASS |
| TC-06 | 入力 dir 不存在 | exit 2 | PASS |
| TC-07 | 現リポジトリ実体 | exit 0 | PASS |

## fixture 配置

```
scripts/ci/__tests__/fixtures/
├── ok/         (workflows/sample.yml + docs/runbook.md)
├── missing/    (workflows/sample.yml で missing path 参照)
├── url/        (URL 形式のみ)
└── anchor/     (docs/foo.md#section)
```

## TDD Red 確認

実装前は `verify-workflow-doc-refs.sh` 未存在で全 TC FAIL。Phase 5 実装後 GREEN。

## 実行コマンド / 結果

```
$ bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh
[PASS] TC-01 all refs exist
[PASS] TC-02 missing ref detected
[PASS] TC-03 URL refs ignored
[PASS] TC-04 mixed URL and local missing detected
[PASS] TC-05 anchors stripped
[PASS] TC-06 missing workflows dir exits 2
[PASS] TC-07 repository workflows pass
SUMMARY: 7 passed / 0 failed
```

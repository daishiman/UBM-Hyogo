# Phase 4: テスト作成（TDD Red）

## 対象

`scripts/ci/verify-workflow-doc-refs.sh` の shell test。テスト framework は他 script との一貫性のため **plain bash + assert**（既存 `scripts/coverage-guard.sh` と同方針）。

## テストファイル

`scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh`

## テストケース

| ID | 条件 | 期待結果 |
|----|------|---------|
| TC-01 | fixture: 全 workflow の `docs/.../*.md` 参照が実在 | exit 0、stdout に `OK (N references checked across M files)` |
| TC-02 | fixture: 1 件の workflow YAML が存在しない `docs/missing/runbook.md` を参照 | exit 1、stdout に該当 `<workflow>:<line>` と missing path が含まれる |
| TC-03 | fixture: `https://example.com/docs/foo.md` URL 形式 | exit 0（URL は除外） |
| TC-04 | fixture: `docs/foo.md#section` のアンカー付き | アンカー除去後に `docs/foo.md` の実在のみ判定 |
| TC-05 | 入力 dir 不存在 | exit 2、stderr にエラー |
| TC-06 | 現リポジトリの `.github/workflows/` 実体に対して実行（修正後） | exit 0 |
| TC-07 | runtime evidence 生成先（`outputs/phase-11/evidence/*.md`） | generated evidence として repository-local existence check 対象外 |

## fixture 配置

```
scripts/ci/__tests__/fixtures/
├── ok/
│   ├── workflows/sample.yml          # 実在 docs ファイルを参照
│   └── docs/runbook.md
├── missing/
│   ├── workflows/sample.yml          # docs/missing/runbook.md を参照
│   └── docs/.gitkeep
├── url/
│   └── workflows/sample.yml          # URL 形式のみ
└── anchor/
    ├── workflows/sample.yml          # docs/foo.md#section
    └── docs/foo.md
```

## 実行コマンド

```bash
bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh
```

## 期待出力フォーマット

```
[PASS] TC-01: all refs exist
[PASS] TC-02: missing ref detected
...
SUMMARY: 7 passed / 0 failed
```

## TDD RED 確認

Phase 5 の実装前に、`verify-workflow-doc-refs.sh` 未作成の状態でテストを実行すると全 TC が FAIL することを確認する（RED）。

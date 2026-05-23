# Phase 4: テスト設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 4 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## テストレベル

| レベル | 対象 | 採否 |
| --- | --- | --- |
| Unit（schema） | local validator / valid・invalid JSON | 採用 |
| Unit（validator CLI） | exit code / stderr 出力 / 引数 parse | 採用 |
| Integration | issue-549 実 JSON での dry-run | 採用 |
| E2E | （該当なし） | 不採用 |

## テストファイル

`.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs`

実行: 既存 test 規約に合わせて `node --test` または `vitest`（既存 `validate-phase11-screenshot-coverage.test.mjs` の方式を踏襲）。

## テストケース

| ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| T-1 | 正常系 | temp manifest | exit 0 |
| T-2 | kind enum 違反 | kind=`screenshot` | exit 1 + JSON report に `kind` |
| T-3 | 必須項目欠落 | `command` 欠落 | exit 1 + JSON report に `command` |
| T-4 | 重複 id | id=`typecheck` を 2 件 | exit 1 + JSON report に `duplicate evidence id` |
| T-5 | path pattern 違反 | path=`outputs/phase-12/foo.log` | exit 1 + stderr に `pattern` |
| T-6 | `--check-existence` 不存在 | valid.json + 実体なし path | exit 2 |
| T-7 | additionalProperties 違反 | root/evidence に未定義キー | exit 1 |
| T-8 | path traversal | `outputs/phase-11/evidence/../typecheck.log` | exit 1 |
| T-9 | workflowDir traversal | `docs/30-workflows/../x` | exit 1 |
| T-10 | `--workflow` 引数欠落 | `--workflow` のみ | exit 3 + usage |
| T-11 | optional field 型違反 | `requiredForCloseout: "yes"` / `notes: 123` | exit 1 |

## fixture 構成

テストは `node:fs` の temporary directory と `docs/30-workflows/fixture-*` の一時 workflow を作成して実行し、`test.after()` で削除する。固定 fixture ファイルは追加しない。

## 検証コマンド

```bash
# テスト実行
mise exec -- node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs

# 既存 vitest 経由（vitest.config.ts が拾う場合）
mise exec -- pnpm vitest run .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs
```

実行方式は既存 `validate-phase11-screenshot-coverage.test.mjs` の方式に合わせる。

## カバレッジ目標

- schema 全 enum / 必須項目に対し 1 ケース以上
- validator の全 exit code（0/1/2/3）が少なくとも 1 ケースで検証される
- `--check-existence` 経路と非 `--check-existence` 経路の双方で正常 / 異常をカバー

## 完了条件

- [x] テストレベルが選定されている
- [x] テストケース T-1〜T-11 が列挙されている
- [x] fixture 構成が列挙されている
- [x] 検証コマンドが記載されている

## 成果物

- `outputs/phase-04/main.md`

## 参照資料

- `phase-02.md`（schema / validator 設計）
- `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-screenshot-coverage.test.mjs`

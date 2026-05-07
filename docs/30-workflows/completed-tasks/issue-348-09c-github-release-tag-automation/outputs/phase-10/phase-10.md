# Phase 10: 単体テスト実装仕様（bats / actionlint / shellcheck）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | completed_local_fallback_pass_optional_tools_unavailable |
| 親 Issue | #348 (CLOSED) — 09c release tag からの GitHub Release 自動作成 |

## 目的

Phase 5-9 で実装した release note 生成スクリプト（`scripts/release/generate-release-notes.sh`）、`gh release create` ラッパー（`scripts/release/create-github-release.sh`）、GitHub Actions workflow（`.github/workflows/release-create.yml`）、template（`scripts/release/release-notes.template.md`）に対して、決定論性 / tag format バリデーション / changelog fallback / actionlint clean / shellcheck clean を保証する単体テストを整備する。

## Step 0: P50 チェック（必須）

- [ ] Phase 5 / 6 / 7 の実装ファイルが実体配置済
- [ ] `bats` / `actionlint` / `shellcheck` がローカルで実行可能（`which bats actionlint shellcheck`）
- [ ] Phase 4 で設計したテスト I/F（input fixture path / 期待出力）が確定済

## bats テストケース仕様（`scripts/release/__tests__/generate-release-notes.bats`）

| # | test case 名 | 入力 | 期待 exit | 期待出力 / assertion |
| --- | --- | --- | --- | --- |
| TC-01 | `tag_format_valid_passes` | `TAG=v20260506-1530` | 0 | stdout に release note markdown / stderr 空 |
| TC-02 | `tag_format_invalid_fails` | `TAG=release-001` | 非 0 | stderr に `tag format must match vYYYYMMDD-HHMM` を含む |
| TC-03 | `tag_format_invalid_missing_v_fails` | `TAG=20260506-1530` | 非 0 | stderr に format error 含む |
| TC-04 | `changelog_path_present_renders` | 既存 `documentation-changelog.md` を fixture 配下に配置 | 0 | stdout に changelog 本文の代表行が含まれる |
| TC-05 | `changelog_path_absent_falls_back` | changelog path を存在しないパスに指定 | 0 | stdout の changelog セクションが固定 fallback 文言（例: `_changelog not found; see commit log_`）に置換される / exit 0 維持 |
| TC-06 | `placeholder_all_replaced` | template 内 placeholder（`{{TAG}}` `{{COMMIT}}` `{{CHANGELOG}}` `{{EVIDENCE_URL}}` `{{ROLLBACK_URL}}` `{{KNOWN_FOLLOWUPS}}`）すべてに値を渡す | 0 | stdout 内に `{{` / `}}` が一切残らない（`grep -c '{{' = 0`） |
| TC-07 | `dry_run_deterministic_same_input_no_diff` | 同一入力で 2 回 `--dry-run` 実行 | 0 / 0 | 2 回の stdout を `diff` した結果が空（決定論性） |
| TC-08 | `dry_run_no_side_effect` | `--dry-run` 実行後 `gh release` API が呼ばれていないこと | 0 | mock 経由で `gh` 未呼び出し確認 |

### 実行コマンド

```bash
mkdir -p outputs/phase-10
mise exec -- bats scripts/release/__tests__/generate-release-notes.bats \
  | tee outputs/phase-10/bats-result.log
echo "exit=$?" | tee -a outputs/phase-10/bats-result.log
# 期待: 全 TC PASS / exit=0
```

## actionlint 仕様

```bash
actionlint .github/workflows/release-create.yml \
  | tee outputs/phase-10/actionlint.log
echo "exit=$?" | tee -a outputs/phase-10/actionlint.log
# 期待: 出力 0 行 / exit=0
```

検証観点:

- `on.push.tags` パターンが `v[0-9]*-[0-9]*` で正規化されていること
- `permissions: contents: write` が release 作成最小権限で指定されていること
- 全 step に `name` が付与されていること
- shell action 内で `${{ ... }}` の不適切な script 注入が無いこと

## shellcheck 仕様

```bash
shellcheck -S style scripts/release/*.sh \
  | tee outputs/phase-10/shellcheck.log
echo "exit=$?" | tee -a outputs/phase-10/shellcheck.log
# 期待: SC0 / exit=0
```

検証観点: `set -euo pipefail` 必須 / 未クォート変数 0 / `[[ ]]` で test / `local` 変数明示。

## coverage AC

- bats: 全 TC PASS（TC-01 〜 TC-08）
- actionlint: 警告 / error 0 行
- shellcheck: SC0（severity=style 含めて 0 件）

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）
- `outputs/phase-10/bats-result.log`（Phase 11 実行で生成）
- `outputs/phase-10/actionlint.log`（同上）
- `outputs/phase-10/shellcheck.log`（同上）

## 次 Phase の前提条件

bats / actionlint / shellcheck が exit 0 となること。

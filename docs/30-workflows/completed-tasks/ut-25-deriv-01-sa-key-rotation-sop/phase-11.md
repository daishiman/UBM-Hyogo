[実装区分: 実装仕様書]

# Phase 11: 手動テスト (NON_VISUAL 代替証跡)

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 10（最終レビュー PASS） |
| 次 Phase | Phase 12（ドキュメント更新） |
| visualEvidence | NON_VISUAL |

## 冒頭固定句

**UI/UX 変更なしのため Phase 11 スクリーンショット不要。** 本タスクは CLI helper（bash）と Markdown SOP のみで構成され、視覚的 UI を持たない。代替証跡として helper の dry-run 実行ログ、bats テスト結果、SOP の手順 walkthrough を記録する。`screenshots/.gitkeep` は作成しない。

参照: `.claude/skills/task-specification-creator/references/phase-template-audit-task.md` / `phase-11-non-visual-alternative-evidence.md`

## 目的

NON_VISUAL タスクの代替証跡として、helper の dry-run 実行、bats テスト出力、shellcheck / markdownlint 結果、値漏洩 grep 結果、SOP walkthrough を `outputs/phase-11/` 配下に保存する。

## 変更対象ファイル（実装時に作成）

| パス | 種別 |
| --- | --- |
| `outputs/phase-11/manual-test-result.md` | 新規（証跡サマリー） |
| `outputs/phase-11/dry-run-log.txt` | 新規（helper dry-run 実行ログ） |
| `outputs/phase-11/bats-output.txt` | 新規（bats 実行結果） |
| `outputs/phase-11/shellcheck-output.txt` | 新規 |
| `outputs/phase-11/markdownlint-output.txt` | 新規 |
| `outputs/phase-11/leak-grep-output.txt` | 新規（値漏洩 grep が 0 件である証跡） |
| `outputs/phase-11/sop-walkthrough.md` | 新規（SOP §5 を上から手順順に「ここで何が起こる」を逐次解説） |

## 代替証跡の収集手順

```bash
# 1) dry-run 実行ログ
echo '{"placeholder":"dummy"}' \
  | mise exec -- scripts/cf-rotate-sa-key.sh put-staging \
      --op-ref "op://Vault/Item/Field" \
      --fingerprint "0123456789abcdef" \
      --env staging --dry-run \
  > outputs/phase-11/dry-run-log.txt 2>&1

# 2) bats
mise exec -- bats scripts/__tests__/cf-rotate-sa-key.bats \
  > outputs/phase-11/bats-output.txt 2>&1

# 3) shellcheck
mise exec -- shellcheck scripts/cf-rotate-sa-key.sh \
  > outputs/phase-11/shellcheck-output.txt 2>&1 || true

# 4) markdownlint
mise exec -- pnpm exec markdownlint \
    docs/30-workflows/runbooks/sa-key-rotation-sop.md \
    docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md \
  > outputs/phase-11/markdownlint-output.txt 2>&1

# 5) 値漏洩 grep（0 件であることが期待）
grep -rE 'BEGIN PRIVATE KEY|"private_key":' \
    docs/30-workflows/runbooks/ scripts/cf-rotate-sa-key.sh \
  > outputs/phase-11/leak-grep-output.txt 2>&1 || true
```

## manual-test-result.md の構成

```
# Phase 11 手動テスト結果（NON_VISUAL 代替証跡）

UI/UX 変更なしのため Phase 11 スクリーンショット不要。

## 1. dry-run 実行
## 2. bats 24/24 PASS
## 3. shellcheck PASS
## 4. markdownlint PASS
## 5. 値漏洩 grep 0 件
## 6. SOP §5 walkthrough（手順順に意図と期待結果を明示）
## 7. Phase 11 evidence 棚卸し
```

## DoD

- [ ] 冒頭固定句「UI/UX 変更なしのため Phase 11 スクリーンショット不要」が明記されている
- [ ] dry-run / bats / shellcheck / markdownlint / leak-grep の 5 証跡が保存されている
- [ ] SOP walkthrough が §5 全 step をカバーしている
- [ ] `screenshots/.gitkeep` が作成されていない

## 次 Phase

Phase 12（ドキュメント更新）

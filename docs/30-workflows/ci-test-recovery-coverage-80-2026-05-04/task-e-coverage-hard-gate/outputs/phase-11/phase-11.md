# Phase 11: 手動テスト / runtime evidence（NON_VISUAL 縮約テンプレ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL タスクとして、`coverage-gate` job の hard gate 化が実 CI 上で機能することを **runtime evidence** として記録する。スクリーンショットは取得しない。

## NON_VISUAL evidence 必須ファイル（3 点）

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-11/coverage-result.md` | `bash scripts/coverage-guard.sh` ローカル実行 + CI 上の `coverage-gate` job log 抜粋（exit 0 確認） |
| 2 | `outputs/phase-11/regression-check.md` | typecheck / lint / yamllint / gh workflow view の実測ログ抜粋（変更前後の差分含む） |
| 3 | `outputs/phase-11/manual-evidence.md` | 本タスクブランチを push して `coverage-gate` job が PASS したことの `gh run view <id>` 出力抜粋 + URL |

## 取得手順

```bash
# 1) ローカル coverage-guard
bash scripts/coverage-guard.sh 2>&1 | tee outputs/phase-11/coverage-guard-local.log
echo "exit=$?" >> outputs/phase-11/coverage-guard-local.log

# 2) push 後の CI 確認
git push -u origin feat/ci-recover-task-e-coverage-gate-hard
gh run list --branch feat/ci-recover-task-e-coverage-gate-hard --workflow ci.yml --limit 1
gh run view <RUN_ID> --log --job coverage-gate | tee outputs/phase-11/ci-coverage-gate.log

# 3) workflow yml 表示（coverage-gate 範囲の continue-on-error 不在確認）
gh workflow view ci.yml | tee outputs/phase-11/workflow-view.log
awk '/^  coverage-gate:/{in_gate=1} in_gate && /^  [A-Za-z0-9_-]+:/{if ($1 != "coverage-gate:") in_gate=0} in_gate && /^[[:space:]]*continue-on-error:/{print; found=1} END{exit found ? 1 : 0}' .github/workflows/ci.yml \
  | tee outputs/phase-11/grep-continue-on-error.log
echo "exit=$?" >> outputs/phase-11/grep-continue-on-error.log

# 4) regression: typecheck / lint
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/typecheck.log
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/lint.log
pnpm exec vitest run scripts/coverage-guard.test.ts 2>&1 | tee outputs/phase-11/coverage-guard-static-test.log
```

## ネガティブ dry-run（任意 / Phase 1 GO 判定で実施可否決定）

dry-run を実施した場合のみ:
- `outputs/phase-11/dry-run-negative.md` に「test を 1 件 skip して push → coverage-gate fail」を記録
- 確認後、当該コミットを revert したことも明記

## redaction ルール

- `gh run view --log` 出力中の token / secret らしき文字列は `***` でマスク
- 個人 email / repo 内 path 以外のセンシティブ値は記録しない

## 成果物（必須 3 点 + 実行ログ）

- `outputs/phase-11/coverage-result.md`
- `outputs/phase-11/regression-check.md`
- `outputs/phase-11/manual-evidence.md`
- 実行ログ: `coverage-guard-local.log` / `ci-coverage-gate.log` / `workflow-view.log` / `grep-continue-on-error.log` / `typecheck.log` / `lint.log`

## 完了条件

- [ ] 必須 3 点が実体として `outputs/phase-11/` に配置されている
- [ ] CI 上で `coverage-gate` job が PASS した evidence URL 記録
- [ ] `coverage-gate` job 範囲に YAML key `continue-on-error:` が 0 hit
- [ ] `pnpm exec vitest run scripts/coverage-guard.test.ts` が PASS
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（apps/api / apps/web / packages/* 全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] coverage-result.md / regression-check.md / manual-evidence.md の冒頭に PASS / BLOCKED 判定行あり
- [ ] redaction 適用済

## 次 Phase

Phase 12（ドキュメント更新 / 7 必須成果物）。

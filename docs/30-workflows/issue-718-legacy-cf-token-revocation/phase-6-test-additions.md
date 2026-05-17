# Phase 6: テスト追加・実行

## メタ情報

- phase: 6 / test-additions
- prev: phase-5-implementation
- next: phase-7-coverage

## 目的

Phase 4 計画と Phase 5 実装に基づくテスト追加を完了させ、CI で常時 green になることを確認する。

## 実行内容

### TC-1 / TC-2: workflow-env-scope.test.sh

Phase 5 Step 5.3 で実装済みのセクションを実行する。

```bash
bash scripts/__tests__/workflow-env-scope.test.sh
```

期待: 全 assertion pass、exit 0。

意図的に legacy 名へ一時的に戻し、fail することを確認する負例試験を 1 回行うこと（git checkout で復元）:

```bash
# 負例試験（手動・確認後すぐ revert）
git stash
sed -i.bak 's/CF_TOKEN_D1_STAGING/CLOUDFLARE_API_TOKEN/' .github/workflows/backend-ci.yml
bash scripts/__tests__/workflow-env-scope.test.sh && echo "BUG: gate did not catch regression" || echo "OK: gate caught regression"
git checkout -- .github/workflows/backend-ci.yml
git stash pop || true
```

### TC-3: rotation reminder grep 互換性

```bash
bash scripts/check-cf-rotation-reminder.sh --dry-run 2>&1 | tee outputs/phase-6/rotation-reminder-output.log
```

期待: rename 後の secret 名が reminder 対象に含まれること（手動レビュー）。

### 既存 test の regression 検証

```bash
bash scripts/__tests__/cf-token-arg.test.sh
bash scripts/__tests__/redaction-check.test.sh
```

期待: 全 exit 0。

## 成果物

- `outputs/phase-6/test-results.md`（各 test の exit code とサマリ）
- `outputs/phase-6/regression-negative-case.md`（負例試験の記録）
- `outputs/phase-6/rotation-reminder-output.log`

## 完了条件

- [ ] TC-1 / TC-2 が pass
- [ ] 負例試験で gate が fail を返したことを確認
- [ ] TC-3 / 既存 test 2 件が pass
- [ ] `bash scripts/coverage-guard.sh` は workflow-only 変更のため skip 判定（changed-mode の merge コミット条件にマッチ）

## タスク100%実行確認【必須】

- [ ] 成果物 3 ファイル作成
- [ ] 全 test の exit code が記録済み

## 次Phase

phase-7-coverage.md

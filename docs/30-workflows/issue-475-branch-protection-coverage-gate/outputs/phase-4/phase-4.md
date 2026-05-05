# Phase 4: テスト設計（検証シナリオ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

repo settings 適用は unit test が書けないため、`gh api` GET / PUT による drift 検証と、coverage 未達 PR で merge button が disabled になる **挙動検証** を設計する。

## テスト方針

| カテゴリ | 採否 | 理由 |
| --- | --- | --- |
| 新規 unit test | ✗ | 対象がリポジトリ設定（外部 API state）。コード変更なし |
| `gh api` GET スナップショット diff | ✓ | 適用前後で drift が `coverage-gate` 追加 1 件のみであることを確認 |
| invariant 検証 | ✓ | fresh GET の non-target fields が PUT 前後で同値であることを normalized diff で確認 |
| 既存 contexts 維持検証 | ✓ | baseline の contexts 配列が PUT 後も部分集合であることを `jq` で確認 |
| coverage 未達 dry-run PR | ✓（1 件） | 検証用 throwaway branch で `scripts/coverage-guard.sh` の対象 coverage summary を 80% 未満にする決定論的差分を作り、merge button が disabled になることを `gh pr view --json mergeable,mergeStateStatus,statusCheckRollup` で確認 |
| ポジティブ確認 | ✓ | 通常状態の PR で `coverage-gate` が success → mergeable になることを確認 |

## 検証シナリオ詳細

### シナリオ 1: drift 検証（必須）

```bash
diff <(jq -S . outputs/phase-1/main-protection-baseline.json) \
     <(jq -S '{contexts: .required_status_checks.contexts, reviews: .required_pull_request_reviews, lock: .lock_branch.enabled, admins: .enforce_admins.enabled}' outputs/phase-11/main-protection-after.json) \
  | tee outputs/phase-11/main-drift.diff
```

### シナリオ 2: invariant 検証（必須）

```bash
diff -u \
  <(jq -S 'del(.required_status_checks.contexts)' outputs/phase-1/main-protection-baseline.json) \
  <(jq -S 'del(.required_status_checks.contexts)' outputs/phase-11/main-protection-after-full.json)
```

### シナリオ 3: 既存 contexts 維持（必須）

```bash
jq --argjson before "$(jq '.required_status_checks.contexts' outputs/phase-1/main-protection-baseline.json)" \
   '.required_status_checks.contexts as $after
    | ($before - $after) as $missing
    | if ($missing | length) == 0 then "OK" else error("missing: \($missing)") end' \
  outputs/phase-11/main-protection-after-full.json
```

### シナリオ 4: coverage 未達 PR の merge gate 挙動（user 承認後）

1. throwaway branch `chore/verify-coverage-gate-475` を作成
2. `scripts/coverage-guard.sh --no-run` が読む coverage summary の対象 package metric を throwaway branch 上で一時的に 79.99% 相当に落とす、または coverage threshold を一時的に 101% に上げる検証専用差分を作る
3. push して PR を起票
4. `gh pr view <num> --json mergeable,mergeStateStatus` を確認
5. `mergeStateStatus` が `BLOCKED` または `BEHIND` で `coverage-gate` が failing であることを確認
6. PR を close、branch を削除（main にはマージしない）

### シナリオ 5: ポジティブ確認

- 本タスクの spec PR 自身が `coverage-gate` を満たして mergeable であることを Phase 11 で確認

## 成果物

- `outputs/phase-4/test-scenarios.md`
- 各 dry-run スクリプト雛形は Phase 11 で実行

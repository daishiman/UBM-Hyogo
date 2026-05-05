# Merge Gate Behavior Evidence

Status: `structurally_confirmed_via_fresh_get` (empirical throwaway PR verification deferred to Gate B)

## 構造的確認（fresh GET 由来 / 2026-05-05）

`gh api` GET の実値で、`coverage-gate` が `main` / `dev` 両ブランチの `required_status_checks.contexts` に登録済みであることを確認した:

```bash
$ gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
    | jq '.required_status_checks.contexts'
[
  "ci",
  "Validate Build",
  "coverage-gate"
]

$ gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
    | jq '.required_status_checks.contexts'
[
  "ci",
  "Validate Build",
  "coverage-gate"
]
```

GitHub branch protection の仕様により、`required_status_checks.contexts` に登録された context が `failure` または `pending` の場合、PR の `mergeStateStatus` は `BLOCKED` となり merge button が disabled される。`coverage-gate` job が `coverage < 80%` 時に `exit 1` で fail することは `.github/workflows/ci.yml` の Task E hard gate 化で実装済（`docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/`）。

したがって本フェーズで構造条件 (a)+(b) は満たされている:
- (a) `coverage-gate` が required context に登録済（fresh GET で確認）
- (b) `coverage-gate` job は coverage 80% 未達で fail（Task E hard gate 実装済）

## 実 PR による経験的確認

throwaway 検証 PR を `coverage < 80%` で意図的に作成し `gh pr view --json mergeable,mergeStateStatus` で `BLOCKED` を観測する手順は **Gate B（git commit / push / PR 作成承認）** 後に実施する。本サイクルでは commit / push / PR 作成は禁止されているため、Phase 13 / 後続タスクに先送りする。

## 参照

- `main-protection-after-full.json` — fresh GET full body
- `dev-protection-after-full.json` — fresh GET full body
- `contexts-preserved.log` — `coverage-gate` 1件追加 / 既存 contexts 維持の確認
- `.github/workflows/ci.yml` — `coverage-gate` job 定義

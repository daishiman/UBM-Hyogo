# Phase 5: 実装（PUT 実行 + SSOT 更新）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

Phase 2 設計に従い `gh api PUT` を main → dev の順で適用し、`deployment-branch-strategy.md` の current applied 表を更新する。2026-05-05 時点では Gate A 外部適用は fresh GET evidence で観測済みのため、追加 PUT は実行しない。Gate B（commit / push / PR approval）は Phase 13 で別途確認する。

## 変更対象ファイル一覧

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| (外部) `repos/daishiman/UBM-Hyogo/branches/main/protection` | PUT | `required_status_checks.contexts` に `coverage-gate` append |
| (外部) `repos/daishiman/UBM-Hyogo/branches/dev/protection` | PUT | 同上（main 安定確認後） |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | 編集 | current applied 表に `coverage-gate` を反映、適用日 `2026-05-05` と Issue #475 参照を併記 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 再生成 | `pnpm indexes:rebuild` で SSOT 更新を反映 |
| `docs/30-workflows/issue-475-branch-protection-coverage-gate/outputs/phase-5/*.{json,log,md}` | 新規 | 適用 evidence |

## 実行タスク

### Task 5-1: 適用前 fresh GET（drift 防止）

```bash
mkdir -p outputs/phase-5
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-5/main-protection-before-full.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-5/dev-protection-before-full.json
```

### Task 5-2: PUT body 生成 + non-target diff 確認

Phase 2 の `build_put_body` 関数を実行し `outputs/phase-2/{main,dev}-put-body.json` を生成。

`outputs/phase-2/{main,dev}-preflight-nontarget.diff` が空であることを確認する。空でない場合は `coverage-gate` 追加以外の branch protection drift を起こすため PUT 禁止。

### Task 5-3: main へ PUT 適用（user 承認必須）

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input outputs/phase-2/main-put-body.json \
  | tee outputs/phase-5/main-put-response.json
```

完了後、Phase 11 シナリオ 1-3 を main について実行し PASS を確認。

### Task 5-4: dev へ PUT 適用（main 安定確認後）

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input outputs/phase-2/dev-put-body.json \
  | tee outputs/phase-5/dev-put-response.json
```

### Task 5-5: SSOT ドキュメント更新

`.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の current applied 表を編集:

```diff
 ## Current Applied (branch protection)

-| branch | required contexts | reviews | lock | admins |
-| --- | --- | --- | --- | --- |
-| main | ci, Validate Build | (fresh GET 値) | (fresh GET 値) | (fresh GET 値) |
-| dev  | ci, Validate Build | (fresh GET 値) | (fresh GET 値) | (fresh GET 値) |
+| branch | required contexts | reviews | lock | admins | last applied |
+| --- | --- | --- | --- | --- | --- |
+| main | ci, Validate Build, **coverage-gate** | (fresh GET 値を保持) | (fresh GET 値を保持) | (fresh GET 値を保持) | (Phase 5 実行日) (Issue #475) |
+| dev  | ci, Validate Build, **coverage-gate** | (fresh GET 値を保持) | (fresh GET 値を保持) | (fresh GET 値を保持) | (Phase 5 実行日) (Issue #475) |
```

> 実列名は実 SSOT の現状に合わせて Phase 5 実行時に再確認すること。

### Task 5-6: skill indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/indexes/
```

## DoD（Definition of Done）

- [ ] `outputs/phase-5/{main,dev}-put-response.json` 取得済（200 OK 相当）
- [ ] SSOT 表に `coverage-gate` と適用日が反映済
- [ ] `pnpm indexes:rebuild` 完了
- [ ] Phase 11 検証シナリオ 1-3 PASS（fresh GET）

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm indexes:rebuild
mise exec -- pnpm sync:check
```

## ロールバック

```bash
jq '{
  required_status_checks: .required_status_checks,
  enforce_admins: .enforce_admins.enabled,
  required_pull_request_reviews: .required_pull_request_reviews,
  restrictions: .restrictions,
  required_linear_history: .required_linear_history.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled,
  required_conversation_resolution: .required_conversation_resolution.enabled,
  lock_branch: .lock_branch.enabled,
  allow_fork_syncing: (.allow_fork_syncing.enabled // false)
}' outputs/phase-5/main-protection-before-full.json \
  | gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection --input -
```

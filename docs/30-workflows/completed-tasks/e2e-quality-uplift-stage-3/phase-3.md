# Phase 3: 設計レビュー

## レビュー観点

### R-1: CLAUDE.md 不変条件との整合

| 項目 | 期待値 | 設計値 | 判定 |
|------|--------|--------|------|
| `required_pull_request_reviews` | `null` | `null` | OK |
| `enforce_admins.enabled` | `true` | `true` | OK |
| `lock_branch.enabled` | `false` | `false` | OK |
| `required_linear_history.enabled` | `true` | `true` | OK |
| `required_conversation_resolution.enabled` | `true` | `true` | OK |
| `allow_force_pushes.enabled` | `false` | `false` | OK |
| `allow_deletions.enabled` | `false` | `false` | OK |

### R-2: 現行値 vs 設計値の drift

`gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の 2026-05-11 時点スナップショット:

```json
{
  "enforce_admins": {"enabled": false},
  "required_linear_history": {"enabled": false},
  "required_conversation_resolution": {"enabled": true}
}
```

**問題**: 現状 `enforce_admins=false` / `required_linear_history=false` であり、CLAUDE.md の宣言と drift している。

**判断**: 本 stage の主対象は `required_status_checks.contexts` だが、PUT payload は GitHub branch protection の全体形を要求するため、CLAUDE.md で明示済みの governance invariants (`required_pull_request_reviews=null`, `enforce_admins=true`, `required_linear_history=true`, `lock_branch=false`) は同時に正規化する。その他の optional fields は fresh GET の現行値を保持する。

> 却下した案: desired manifest に full PUT body を置き、GitHub branch protection 全フィールドを repo 側 JSON で固定する。Issue #608 の目的外変更が混ざり、rollback と監査の境界が曖昧になる。

### R-3: required context 名の一致

GitHub Actions の status check context 名は **`jobs.<job_id>.name` の評価後の文字列**。E2E は matrix shard 個別の `e2e (<project>)` ではなく、集約 job `e2e-tests-coverage-gate` を required context とする。理由は、集約 job が全 shard 成功と coverage gate をまとめて検証し、branch protection 側の required context 数を最小化できるため。

### R-4: lighthouse の検証経路

`lighthouse.yml` は dev 向け PR と `workflow_dispatch` で起動する。`lighthouse-ci` を dev/main の desired contexts に含める場合、main 側の実 PR で pending にならないよう、Phase 8 で `workflow_dispatch` または dev 向け PR による fresh run evidence を取得してから apply する。

### R-5: PR ブロッキング動作の検証経路

1. apply 後、`dev` 向けの dummy PR を作る or 既存 open PR を更新
2. 新規 contexts が "Required" 表示されることを確認
3. snapshot を post として保存

### R-6: rollback 経路

- pre snapshot に `required_status_checks.contexts` のみを抜粋して `apply.sh` 形式に変換し、再 PUT で復元可能
- ただし `enforce_admins` / `required_linear_history` の drift 修正は意図的変更のため、rollback は要慎重判断

## 設計承認

| レビュー項目 | 結果 |
|------------|------|
| 機能要件カバー | FR-1 〜 FR-5 すべて設計に反映 |
| 非機能要件カバー | secrets 不混入 / idempotent / drift 不発生を担保 |
| CLAUDE.md 整合 | R-1 OK、R-2 で drift 修正方針を明記 |
| 受け入れ条件カバー | Phase 1 受け入れ条件 5 件すべて検証手順あり |

**承認**: 実装フェーズへ移行可。

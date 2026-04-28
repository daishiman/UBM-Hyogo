# Phase 5 — 実装ランブック（runbook）

## Status
done

> 本書は **後続実装タスクの実行台本** である。本タスク（docs-only）の中ではコマンドを実行しない。
> 全コマンドは GitHub Admin 権限を持つアカウントで `gh auth status` が valid な状態で実行する想定。

---

## 0. 前提条件チェック（実行前）

```bash
gh auth status                                # logged in & admin scope
gh api user | jq .login                       # 実行者の確認
gh api repos/:owner/:repo | jq '.permissions' # admin: true を確認
which jq && jq --version                      # jq 1.6+
```

| 条件 | 必須 |
| --- | --- |
| repo Admin 権限 | ◯ |
| `gh` v2.40+ | ◯ |
| `jq` 利用可 | ◯ |
| Phase 2 草案 4 ファイルの canonical 名で手元に存在 | ◯ |
| MEMORY 制約: `wrangler` 直叩き禁止 / .env 中身を読まない | ◯ |

---

## 1. snapshot 取得（rollback 準備）

所要時間: **5 分**

```bash
mkdir -p .runbook-tmp     # コミット禁止ディレクトリ
gh api repos/:owner/:repo/branches/main/protection > .runbook-tmp/main.protection.before.json
gh api repos/:owner/:repo/branches/dev/protection  > .runbook-tmp/dev.protection.before.json
gh api repos/:owner/:repo                          > .runbook-tmp/repo.settings.before.json
```

> ⚠️ `.runbook-tmp/` は `.gitignore` 済みであることを確認。MEMORY: 設定値をドキュメントに残さない。

---

## 2. CODEOWNERS 配置

所要時間: **10 分**

1. feature ブランチで `.github/CODEOWNERS` を追加（main 用 reviewer team / user を記述）
2. PR を **dev → main** の順で squash-merge
3. `gh api repos/:owner/:repo/contents/.github/CODEOWNERS` で main に存在することを確認

検証:

```bash
gh api repos/:owner/:repo/contents/.github/CODEOWNERS?ref=main | jq -r .path
# => .github/CODEOWNERS
```

---

## 3. Repository setting 適用（squash-only）

所要時間: **5 分**

```bash
gh api -X PATCH repos/:owner/:repo \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=PR_BODY
```

検証（Phase 4 P-01..P-05）:

```bash
gh api repos/:owner/:repo \
  | jq '{allow_squash_merge,allow_merge_commit,allow_rebase_merge,delete_branch_on_merge,squash_merge_commit_title,squash_merge_commit_message}'
```

---

## 4. dev branch protection 適用

所要時間: **5 分**

```bash
gh api -X PUT repos/:owner/:repo/branches/dev/protection \
  --input branch-protection.dev.json   # Phase 2 §3 の draft を canonical 名にリネームして使用
```

検証（D-01..D-06）:

```bash
gh api repos/:owner/:repo/branches/dev/protection \
  | jq '{count:.required_pull_request_reviews.required_approving_review_count,
         co:.required_pull_request_reviews.require_code_owner_reviews,
         linear:.required_linear_history,
         contexts:.required_status_checks.contexts}'
```

期待: `count=1`, `co=false`, `linear=true`, `contexts` の長さ 8。

---

## 5. workflow YAML 配置

所要時間: **15 分**

1. feature ブランチで以下を配置:
   - `.github/workflows/auto-rebase.yml`（Phase 2 §5 草案）
   - `.github/workflows/pr-target-safety-gate.yml`（Phase 2 §6 草案）
2. lefthook / typecheck / lint / docs-link-check が green であることを確認
3. PR を dev → main へ順次 squash-merge

検証（A-01..A-07 / S-01..S-09）:

```bash
actionlint .github/workflows/auto-rebase.yml
actionlint .github/workflows/pr-target-safety-gate.yml
yq '.permissions' .github/workflows/pr-target-safety-gate.yml   # => "{}"
```

---

## 6. main branch protection 適用（最後）

所要時間: **5 分**

> ⚠️ 本ステップは **最後に実行**。先に実行するとセルフロックする（Phase 6 FC-MAIN-LOCK 参照）。

```bash
gh api -X PUT repos/:owner/:repo/branches/main/protection \
  --input branch-protection.main.json
```

検証（M-01..M-07）:

```bash
gh api repos/:owner/:repo/branches/main/protection \
  | jq '{count:.required_pull_request_reviews.required_approving_review_count,
         enforce_admins:.enforce_admins.enabled,
         linear:.required_linear_history,
         lock:.lock_branch.enabled,
         contexts:.required_status_checks.contexts}'
```

期待: `count=2`, `enforce_admins=true`, `linear=true`, `lock=false`, contexts 長 8。

---

## 7. 凍結時運用（lock_branch スイッチ）

| 発火条件 | 実行コマンド | 承認者 | 解除条件 |
| --- | --- | --- | --- |
| 本番障害でリリース凍結 | `gh api -X PATCH …/branches/main/protection -F lock_branch=true` | Admin 2 名連名（issue にコメントで明示） | 障害復旧の post-mortem 起票後 |
| セキュリティ事故 | 同上 | CTO 相当 + Admin | 是正完了の確認後 |

> 解除時は `lock_branch=false` に戻し、必ず `gh api …/protection` で diff を取り snapshot を更新する。

---

## 8. ロールバック手順

```bash
# repository setting
gh api -X PATCH repos/:owner/:repo --input .runbook-tmp/repo.settings.before.json

# branch protection は GET response をそのまま PUT しない。
# 後続実装タスクで PUT schema へ正規化した payload を生成してから適用する。
jq '{
  required_status_checks,
  enforce_admins: .enforce_admins.enabled,
  required_pull_request_reviews,
  restrictions,
  required_linear_history,
  allow_force_pushes,
  allow_deletions,
  required_conversation_resolution,
  lock_branch
}' .runbook-tmp/main.protection.before.json > .runbook-tmp/main.protection.rollback.put.json

gh api -X PUT repos/:owner/:repo/branches/main/protection --input .runbook-tmp/main.protection.rollback.put.json
```

完了確認後、`.runbook-tmp/` を削除（`shred -u` 推奨）。

---

## 9. 適用後の最終 sign-off チェックリスト

- [ ] 検証コマンド §3 / §4 / §6 がすべて期待値を返す
- [ ] auto-rebase ワークフローが test PR で `auto-rebase` ラベル付与時のみ起動する
- [ ] pr-target-safety-gate ワークフローが fork PR で `permissions: {}` のまま起動することを確認
- [ ] snapshot ファイルがコミットされていない（`git status .runbook-tmp/` が untracked）
- [ ] Phase 13 ユーザー承認ゲートに沿ってオーナー承認を得た

---

## 10. 所要時間サマリ

| 区間 | 合計目安 |
| --- | --- |
| 0〜2（事前 + snapshot + CODEOWNERS） | 約 20 分 |
| 3〜5（setting + dev + workflow） | 約 25 分 |
| 6〜9（main + 検証 + sign-off） | 約 20 分 |
| 計 | **約 65 分**（PR レビュー待ち時間を除く） |

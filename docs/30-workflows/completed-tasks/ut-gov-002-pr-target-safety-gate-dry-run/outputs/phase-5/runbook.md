# Phase 5 — 実装ランブック（runbook）

## Status

spec_created

> **役割分担（重要）**: 本書は **後続実装タスクの実行台本** である。本タスク（docs-only）の中ではコマンドを実行しない。
> 実 workflow 編集 / dry-run 実走 / secrets review は **後続実装タスク（別 PR）** が担当する（AC-8）。
>
> 親タスク runbook（`docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-5/runbook.md`）を母本とし、本タスクは `pull_request_target` safety gate に特化した手順を仕様化する。

---

## 0. 入力の継承

| 入力 | 用途 |
| --- | --- |
| 親タスク `outputs/phase-5/runbook.md` | snapshot / branch protection / actionlint コマンドの母本（Step 5・6 の検査コマンド継承） |
| 本タスク `outputs/phase-2/design.md` §3 | YAML 草案（`pr-target-safety-gate.yml` / `pr-untrusted-build.yml`） |
| 本タスク `outputs/phase-4/test-matrix.md` | 静的検査・動的検査・F-1〜F-4 |
| `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md` | required status checks 名同期前提 |
| `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md` | SHA pin 前提 |

---

## Step 1. 事前確認（所要 5 分）

実装タスク開始前に以下 3 件をチェックする。

```bash
# (1) 親タスク完了の確認
ls docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-5/runbook.md

# (2) UT-GOV-001 適用済み（required status checks 名同期）
gh api repos/:owner/:repo/branches/main/protection \
  | jq '.required_status_checks.contexts'

# (3) UT-GOV-007 SHA pin 完了
grep -nE 'uses: [^@]+@(v[0-9]|main|master)' .github/workflows/*.yml
# 期待: 0 件（タグ / ブランチ参照が残っていれば NO-GO N-3）
```

> いずれか欠ける場合は Phase 3 NO-GO 条件 N-1〜N-3 のいずれかに該当 → 進行不可。

---

## Step 2. 棚卸し（所要 10 分）

`.github/workflows/*.yml` を機械抽出し、責務分離前後の差分を表化する。

```bash
# pull_request_target を使用している workflow の列挙
grep -RnlE '^\s*pull_request_target\s*:' .github/workflows/

# pull_request を使用している workflow の列挙
grep -RnlE '^\s*pull_request\s*:' .github/workflows/

# workflow_run を使用している workflow（理想は 0 件）
grep -RnlE '^\s*workflow_run\s*:' .github/workflows/
```

棚卸し結果を実装 PR の description に表として転記する。

| workflow ファイル | 現 trigger | 移行後 trigger | 用途 |
| --- | --- | --- | --- |
| (Step 2 で埋める) | … | … | … |

---

## Step 3. 草案反映（所要 15 分）

> ⚠️ **workflow 編集は別 PR**。本タスクではコミットしない。

1. feature ブランチを作成: `git switch -c feat/pr-target-safety-gate`
2. 親タスク Phase 2 §6 の `pr-target-safety-gate.workflow.yml.draft` を `.github/workflows/pr-target-safety-gate.yml` に移植
3. `.github/workflows/pr-untrusted-build.yml` を本タスク `outputs/phase-2/design.md` §3 草案から新規作成
4. 既存 `pull_request_target` 使用 workflow が triage 専用化されていない場合、Step 2 の棚卸しに従って移行
5. lefthook / typecheck / lint / docs-link-check が green であることを確認

> 全コミットを **1 つに集約**（squash 想定）し、`git revert <SHA>` 単一コマンドでロールバックできる粒度を維持する（AC-9）。

---

## Step 4. 静的検査（所要 10 分）

Phase 4 test-matrix.md §3 の 3 系統を順に実行。

```bash
# (a) actionlint
actionlint .github/workflows/*.yml
# => exit 0 期待

# (b) yq による permissions / persist-credentials 検査
yq '.permissions' .github/workflows/pr-target-safety-gate.yml
# => "{}" or null

yq '.jobs[].steps[]
    | select(.uses | test("actions/checkout"))
    | .with."persist-credentials"' .github/workflows/*.yml
# => 全件 "false"

# (c) grep による pwn request パターン検出
grep -lE '^\s*pull_request_target\s*:' .github/workflows/*.yml > /tmp/prt.list
grep -nE 'github\.event\.pull_request\.head\.(ref|sha)' $(cat /tmp/prt.list)
# => 0 件（1 件以上 → F-1 MAJOR）

grep -nE '^\s*workflow_run\s*:' .github/workflows/*.yml
# => 0 件

grep -nE '\$\{\{\s*github\.event\.pull_request\.(head\.|title|body)' .github/workflows/*.yml
# => env: 経由のみ。run: 直接展開は MAJOR

grep -L 'persist-credentials:' .github/workflows/*.yml
# => actions/checkout を含む workflow 全てで明示
```

いずれかの検査で違反が出たら **F-1〜F-4** のいずれかに分類し、Phase 9 quality-gate に連携。

---

## Step 5. dry-run 実走（所要 30 分）

Phase 4 test-matrix.md §4 の D-1〜D-6 に従う。

1. **D-1**: テスト用 fork repo を一時作成し、軽微な変更で fork PR を起票。
2. **D-2**: `gh run list --workflow=pr-target-safety-gate.yml --limit 5` で起動を確認。
3. **D-3**: `gh run view <run-id> --log` を取得し、以下 grep を実行：
   ```bash
   gh run view <run-id> --log | grep -iE 'secret|GITHUB_TOKEN|aws_|cloudflare_api_token|op://' || echo "OK: no leakage"
   ```
   出力 `OK: no leakage` を期待。
4. **D-4**: maintainer が `needs-review` ラベルを付与、`pull_request_target.types: [labeled]` triage が `pull-requests: write` のみで完走することを確認。
5. **D-5**: `gh run rerun <run-id>` を実行し、再実行で token / secret の露出が変化しないことを確認（T-5）。
6. **D-6**: 一時 fork repo を archive または削除し、痕跡を残さない。

ログは `outputs/phase-9/quality-gate.md`（T-1 / T-3 / T-4）および `outputs/phase-11/manual-smoke-log.md`（T-2 / T-5）へ転記。

---

## Step 6. security review 記録（所要 15 分）

Phase 3 review.md §3 "pwn request 非該当 5 箇条" を再検証し、`outputs/phase-9/quality-gate.md` の security 節へ集約。

| # | 5 箇条 | 検証コマンド | 結果 |
| --- | --- | --- | --- |
| 1 | PR head を checkout しない | Step 4 (c) 1 行目 grep | 0 件 |
| 2 | `workflow_run` 経由で secrets 橋渡ししない | Step 4 (c) 2 行目 grep | 0 件 |
| 3 | `head.*` / `title` / `body` を `run:` で eval しない | Step 4 (c) 3 行目 grep | 0 件 |
| 4 | 全 `actions/checkout` に `persist-credentials: false` | Step 4 (b) 後段 yq | 全件 false |
| 5 | workflow デフォルト `permissions: {}` ＋ job 単位最小昇格 | Step 4 (b) 前段 yq | `{}` |

S-1〜S-5（Phase 3 review.md §4）も同節に再掲。

---

## ロールバック手順（単一 revert コミット粒度・AC-9）

### 通常ロールバック

```bash
# Step 3 の squash コミット SHA を特定
git log --oneline --grep='pr-target-safety-gate' -n 5

# 単一コミットを revert
git revert <safety-gate-commit-sha>
git push origin main  # 通常の PR フローで適用
```

### required status checks 名のドリフト確認

```bash
gh api repos/:owner/:repo/branches/main/protection \
  | jq '.required_status_checks.contexts'
# UT-GOV-001 の branch protection JSON と job 名が一致していることを確認
```

> job 名を変更した場合は UT-GOV-001 の branch protection JSON 更新 PR と同期して適用する（design.md §5.2 / Phase 3 NO-GO N-2）。

### ロールバック判断トリガ（design.md §5.3 を再掲）

- fork PR シナリオで GITHUB_TOKEN / secrets 露出が観測された
- triage job が untrusted code を評価したインシデント
- required status checks 名のドリフトで dev / main がブロックされた

---

## Red Lines（実装タスクが守るべき禁止事項）

実装 PR は以下を **絶対に行わない**。違反検出時は即座に PR をブロック・revert する。

1. **`force push to main / dev`**: branch protection を bypass する force push。`allow_force_pushes=false` で物理的に阻止されるが、admin override で回避しない。
2. **branch protection の admin override**: `enforce_admins=true` を一時無効化しての merge。例外時は Phase 11 manual smoke で記録した上で Admin 2 名連名承認。
3. **secrets の意図しない露出**: `${{ secrets.* }}` を `pull_request_target` workflow / fork PR 経路に通すこと、ログに secrets 値を出力すること。
4. **`workflow_run` の新規導入**: 代替案 D が MAJOR で却下済み。fork PR build の artifact / output を triage workflow が信頼してはならない。
5. **PR head の checkout を `pull_request_target` 配下で行うこと**: F-1（pwn request 典型）。

---

## 連携タスク

| タスク | 関係 | 連携内容 |
| --- | --- | --- |
| 親タスク `task-github-governance-branch-protection` | 上流 | safety gate 草案・runbook 母本の継承 |
| UT-GOV-001（github-branch-protection-apply） | 上流 | required status checks 名同期 |
| UT-GOV-007（github-actions-action-pin-policy） | 上流 | `uses:` SHA pin |
| 本ワークフロー Phase 12 unassigned-task-detection | 下流 | runbook 実走で発見した残課題の差し戻し先 |
| 後続実装タスク（別途起票） | 下流 | 本 runbook を input として workflow 実編集 / dry-run 実走 / security review 実施 |

---

## 完了条件

- [x] Step 1〜6 が記述されている。
- [x] ロールバック手順（単一 revert コミット）が記述されている。
- [x] 役割分担（docs-only vs 実装タスク）が冒頭に重複明記されている。
- [x] red lines が 5 項目列挙されている。
- [x] 連携タスクが末尾に配置されている。
- [x] 親タスク runbook を input として明示している。

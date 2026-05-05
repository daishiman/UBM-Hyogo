# Phase 5 — 実装ランブック（runbook）

## Status

spec_created

> 本書は **本タスク（UT-GOV-002-IMPL）の実装実行台本** である。`spec_created` 時点では Step 1〜7 を仕様として固定し、commit / push / PR 作成は Phase 13 ユーザー承認後に限る。
>
> 上流 dry-run の `completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-5/runbook.md` を母本とし、本タスクは実 workflow 投入と required status checks 同期（Step 7）を追加する。

---

## 0. 入力の継承

| 入力 | 用途 |
| --- | --- |
| 上流 dry-run runbook | Step 1〜6 母本（事前確認 / 棚卸し / 草案反映 / 静的検査 / dry-run / security review） |
| `outputs/phase-2/design.md` §2〜§6 | 実 workflow YAML 構造 / required status checks 同期方針 |
| `outputs/phase-3/review.md` §3〜§5 | 5 箇条 / S-1〜S-6 / ロールバックレビュー |
| `outputs/phase-4/test-matrix.md` | 静的検査 5 コマンド / 動的検査 D-1〜D-6 / F-1〜F-5 |
| `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md` | required status checks 名同期前提 |
| `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md` | SHA pin 前提 |

---

## Step 1. 事前確認（所要 5 分）

```bash
# (1) UT-GOV-002 dry-run 仕様完成
ls docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-5/runbook.md

# (2) UT-GOV-001 適用済み（branch protection 設定済み）
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'

# (3) UT-GOV-007 SHA pin 完了（全 uses: が 40 桁 SHA）
grep -RnE 'uses: [^@]+@(v[0-9]+|main|master)$' .github/workflows/
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

# actions/checkout 使用箇所と persist-credentials 設定の有無
grep -RnE 'actions/checkout' .github/workflows/
grep -L 'persist-credentials:' .github/workflows/*.yml
```

棚卸し結果を実装 PR の description に表として転記する：

| workflow ファイル | 現 trigger | 移行後 trigger | 用途 | persist-credentials |
| --- | --- | --- | --- | --- |
| (実走時に埋める) | … | … | … | … |

---

## Step 3. 実 workflow 編集（所要 15 分）

> **本タスクでは Phase 5 の `Write` で 2 ファイルを作成済み**。Step 3 は spec_created 段階では「ファイル作成済みであることの確認」と「既存 workflow への `persist-credentials: false` 補完が必要かの判断」を行うのみ。commit / push / PR 作成は Phase 13 ユーザー承認後に行う。

1. 作成済みファイルの確認:
   - `.github/workflows/pr-target-safety-gate.yml`（triage workflow / `pull_request_target`）
   - `.github/workflows/pr-build-test.yml`（untrusted build workflow / `pull_request`）
2. 既存 `pull_request_target` 使用 workflow が triage 専用化されていない場合、Step 2 棚卸し結果に従って移行（本タスクではゼロ件想定）。
3. 既存の `actions/checkout` で `persist-credentials: false` が欠落しているものに対し、補完 PR を準備（本タスク内の単一 commit に集約 = AC-6 ロールバック粒度維持）。
4. lefthook / typecheck / lint / docs-link-check が green であることをローカルで確認（commit 前検証）。

> 全変更を **1 つの commit に集約**（squash 想定）し、`git revert <SHA>` 単一コマンドでロールバックできる粒度を維持する（AC-6）。

---

## Step 4. 静的検査（所要 10 分）

Phase 4 test-matrix.md §3 の 5 コマンドを順に実行。結果を `outputs/phase-5/static-check-log.md` に保存。

```bash
# (1) actionlint
actionlint .github/workflows/*.yml
# => exit 0 期待

# (2) yq による triage workflow の permissions 検査
yq '.permissions' .github/workflows/pr-target-safety-gate.yml
# => "{}" or null

# (3) yq による build-test workflow の permissions 検査
yq '.permissions' .github/workflows/pr-build-test.yml
# => "{}" or "{contents: read}"

# (4) grep による persist-credentials 存在確認
grep -RnE 'persist-credentials:\s*false' .github/workflows/
# => 全 actions/checkout で hit

# (5) grep による head.* eval パターン検出
grep -RnE 'github\.event\.pull_request\.head\.(ref|sha)' .github/workflows/
# => trusted (pull_request_target) で 0 件、pull_request の checkout step の with.ref のみ許容
```

補助:

```bash
# workflow_run 不使用の確認
grep -RnE '^\s*workflow_run\s*:' .github/workflows/   # => 0 件
# run: 内での head.* / title / body 直接展開検出
grep -RnE '\$\{\{\s*github\.event\.pull_request\.(head\.|title|body)' .github/workflows/   # => trusted job で 0 件
```

いずれかの検査で違反が出たら **F-1〜F-5** のいずれかに分類し、Phase 9 quality-gate に連携。

---

## Step 5. dry-run 実走（所要 30 分）

Phase 4 test-matrix.md §4 の D-1〜D-6 に従い、T-1〜T-5 を実走する。

1. **D-1**: テスト用 fork repo を一時作成し、軽微な変更で fork PR を起票。
2. **D-2**: 起動確認:
   ```bash
   gh run list --workflow=pr-target-safety-gate.yml --limit 5
   gh run list --workflow=pr-build-test.yml --limit 5
   ```
3. **D-3**: secrets / token 露出チェック:
   ```bash
   gh run view <run-id> --log | grep -iE 'secret|GITHUB_TOKEN|aws_|cloudflare_api_token|op://' || echo "OK: no leakage"
   ```
   `OK: no leakage` を期待。
4. **D-4**: maintainer が `needs-review` ラベルを付与し、`pull_request_target.types: [labeled]` triage が `pull-requests: write` のみで完走することを確認（T-3）。
5. **D-5**: `gh run rerun <run-id>` を実行し、再実行で token / secret の露出が変化しないことを確認（T-5）。
6. **D-6**: 一時 fork repo を archive または削除し、痕跡を残さない。

ログは `outputs/phase-11/manual-smoke-log.md` の T-1〜T-5 セクションに転記する。

---

## Step 6. VISUAL evidence 取得（所要 15 分）

Phase 4 test-matrix.md §6 の命名規約に従う。

1. T-1〜T-5 各 run について、GitHub Actions UI で run summary / job permissions 表示画面を開く。
2. `outputs/phase-11/screenshots/<scenario>-actions-ui-<YYYY-MM-DD>.png` で保存（例: `same-repo-pr-actions-ui-2026-04-30.png`）。
3. branch protection 画面（Settings → Branches → main / dev）の required status checks 一覧を `outputs/phase-11/screenshots/branch-protection-{main,dev}-required-checks-<YYYY-MM-DD>.png` で保存。
4. 各 screenshot に secrets 値・PR contributor private 情報が映っていないことを目視確認。

---

## Step 7. required status checks 同期（所要 10 分）

新 job 名（`triage` / `build-test`）と branch protection の `contexts` が一致することを確認する。

```bash
# main 側 contexts 取得
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'

# dev 側 contexts 取得
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'
```

期待値（本タスク適用後）:

- `triage`（`pr-target-safety-gate.yml` の job 名）
- `build-test`（`pr-build-test.yml` の job 名）
- 既存の必須 contexts（UT-GOV-001 で適用済み）と整合

drift（F-5 MAJOR）が検知された場合:

- UT-GOV-001 の branch protection JSON 更新 PR と本タスクのロールバック PR を **同期して** 適用する（design.md §5.2）
- Phase 12 unassigned-task-detection に UT-GOV-004 追従タスクを起票

---

## ロールバック手順（単一 revert コミット粒度・AC-6）

### 通常ロールバック

```bash
# Step 3 の squash コミット SHA を特定
git log --oneline --grep='pr-target-safety-gate' -n 5

# 単一コミットを revert（merge commit の場合は -m 1 を付与）
git revert <safety-gate-commit-sha>
# または: git revert -m 1 <merge-commit-sha>

# 通常の PR フローで dev → main に適用
git push origin <branch>
```

### ロールバック後の確認

```bash
# 旧 required status checks 名（UT-GOV-001 適用時の元状態）が再び required になっているか
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'
```

### ロールバック判断トリガ（design.md §5.3 を再掲）

- fork PR シナリオで `GITHUB_TOKEN` / secrets 露出が観測された
- triage job が untrusted code を評価したインシデント
- required status checks 名 drift で dev / main がブロックされた

---

## Red Lines（実装タスクが守るべき禁止事項）

実装 PR は以下を **絶対に行わない**。違反検出時は即座に PR をブロック・revert する。

1. **`force push to main / dev`**: branch protection を bypass する force push。`allow_force_pushes=false` で物理的に阻止されるが、admin override で回避しない。
2. **branch protection の admin override**: `enforce_admins=true` を一時無効化しての merge。例外時は Phase 11 manual smoke で記録した上で Admin 2 名連名承認（solo 運用では本人 + 別 device の 2 段階確認）。
3. **secrets 値を runbook / ログに転記する行為**: `${{ secrets.* }}` を `pull_request_target` workflow / fork PR 経路に通すこと、ログに secrets 値を出力すること。
4. **`pull_request_target` workflow への `actions/checkout` で PR head 参照**: F-1（pwn request 典型）。
5. **`workflow_run` の新規導入**: 代替案 D が MAJOR で却下済み。fork PR build の artifact / output を triage workflow が信頼してはならない。

---

## 連携タスク

| タスク | 関係 | 連携内容 |
| --- | --- | --- |
| UT-GOV-002（dry-run 仕様） | 上流 | safety gate 設計・runbook 母本の継承 |
| UT-GOV-001（github-branch-protection-apply） | 上流 / 下流 | required status checks 名同期（Step 7） |
| UT-GOV-007（github-actions-action-pin-policy） | 上流 | `uses:` SHA pin 前提（Step 1 (3)） |
| UT-GOV-004（required status checks 追従） | 下流 | job 名変更時の追従 PR 起票先 |
| 本ワークフロー Phase 12 unassigned-task-detection | 下流 | 実走で発見した残課題 / drift の差し戻し先 |

---

## 完了条件

- [x] Step 1〜7 が記述されている
- [x] ロールバック手順（単一 revert コミット）が記述されている
- [x] red lines が 5 項目列挙されている
- [x] 連携タスク（UT-GOV-001 / 004 / 007 + Phase 12）が末尾に配置されている
- [x] commit / push / PR 作成は Phase 13 ユーザー承認後に行う旨を冒頭に明記

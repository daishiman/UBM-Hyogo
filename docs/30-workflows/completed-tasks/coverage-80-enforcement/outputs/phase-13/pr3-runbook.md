# PR③ Runbook — hard gate 化 + lefthook 統合 + 正本同期 + branch protection contexts 登録

## 目的

PR① / PR② sub PR 全 merge 完了後、`coverage-gate` を **hard gate（required）** に切り替え、lefthook pre-push に `coverage-guard --changed` を統合し、aiworkflow-requirements / coverage-standards 正本を同期し、branch protection の `required_status_checks.contexts` に `coverage-gate` を登録する。

## 前提条件

- PR① merge 済（soft gate / tooling 投入完了）
- PR② sub PR-A〜E 全 merge 済（全 package で baseline 80% 達成）
- ローカル `bash scripts/coverage-guard.sh` exit 0 を再確認済
- **UT-GOV-004 completed の再確認**（`required_status_checks.contexts` 同期の上流前提 / 5 重明記の 5 箇所目）
  - 未完了の場合: 2 段階適用に切替（後述）
- 並行 open PR をすべて rebase して coverage 80% 達成を確認済
- **user の明示承認（多段）**:
  1. 「PR③ を作成してよい」
  2. 「PR③ を merge してよい」
  3. 「branch protection の contexts に coverage-gate を追加してよい」
  4. 「`mise exec -- pnpm indexes:rebuild` を実行してよい」

## スコープ（変更ファイル）

| 操作 | パス | 内容 |
| --- | --- | --- |
| 編集 | .github/workflows/ci.yml | `continue-on-error: true` 行を削除（hard gate 化） |
| 編集 | lefthook.yml | pre-push に `coverage-guard --changed` 統合 |
| 編集 | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | apps=80% / packages=65% → 全 package 80% 一律へ更新 |
| 編集 | .claude/skills/task-specification-creator/references/coverage-standards.md | scripts/coverage-guard.sh 参照を強制経路へ追記 |
| 確認のみ | codecov.yml | 既存 80% / threshold=1% との整合確認（変更なし） |

## lefthook.yml diff

```diff
  pre-commit:
    parallel: true
    commands:
      ...

+ pre-push:
+   parallel: false
+   commands:
+     coverage-guard:
+       run: bash scripts/coverage-guard.sh --changed
+       stage_fixed: false
+       skip:
+         - merge
+         - rebase
```

## .github/workflows/ci.yml diff

```diff
    coverage-gate:
      runs-on: ubuntu-latest
      needs: [setup]
-     continue-on-error: true   # PR① では true / PR③ で削除
      steps:
        ...
```

## aiworkflow-requirements diff

`outputs/phase-12/system-spec-update-summary.md` の Step 2 diff を Phase 13 PR③ commit に同梱する。

## コマンド列（user 承認後のみ実行）

```bash
# 1. ブランチ作成
git switch dev
git pull origin dev
git switch -c feat/coverage-80-pr3-hard-gate

# 2. 各ファイルを編集（実装は別オペレーション）

# 3. 明示 add
git add .github/workflows/ci.yml \
        lefthook.yml \
        .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md \
        .claude/skills/task-specification-creator/references/coverage-standards.md

# 4. commit
git commit -m "$(cat <<'EOF'
feat(coverage): switch coverage-gate to hard + lefthook integration + canon sync (PR3/3)

- .github/workflows/ci.yml: continue-on-error: true を削除 (hard gate / required)
- lefthook.yml: pre-push に coverage-guard --changed を追加 (skip: merge/rebase)
- .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md:
  apps=80% / packages=65% → 全 package 80% 一律へ更新
- .claude/skills/task-specification-creator/references/coverage-standards.md:
  scripts/coverage-guard.sh 参照を強制経路へ追記

merge 後に user 承認を経て branch protection contexts へ coverage-gate を登録し、
mise exec -- pnpm indexes:rebuild で aiworkflow-requirements indexes を再生成する。

Refs #<issue>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 5. push + PR
git push -u origin feat/coverage-80-pr3-hard-gate

gh pr create \
  --base dev \
  --title "feat(coverage): hard gate + lefthook + canon sync (PR3/3)" \
  --body "$(cat <<'EOF'
## 概要
3 段階導入の最終段（PR3/3）。`coverage-gate` を **hard gate（required）** に切替、lefthook pre-push に統合、aiworkflow-requirements / coverage-standards を正本同期する。

## 前提
- PR1/3 merge 済 / PR2/3 sub PR-A〜E 全 merge 済
- 全 package で baseline 80% 達成
- UT-GOV-004 completed 再確認済
- 並行 open PR を全 rebase 済（hard gate 化後の一斉 block 回避）

## 変更内容
- .github/workflows/ci.yml: continue-on-error 削除
- lefthook.yml: pre-push.commands.coverage-guard 追加
- aiworkflow-requirements quality-requirements-advanced.md: 80% 一律へ更新
- coverage-standards.md: coverage-guard.sh 参照追記

## merge 後の別オペレーション（user 承認後）
1. branch protection contexts に coverage-gate を追加（dev / main 独立 PUT）
2. mise exec -- pnpm indexes:rebuild
3. drift 検証（CLAUDE.md ↔ vitest.config ↔ codecov.yml ↔ aiworkflow-requirements）

Refs #<issue>
EOF
)"
```

## branch protection contexts 登録手順（PR③ merge 後 / user 承認後の別オペレーション）

UT-GOV-001 / UT-GOV-004 連携。**本タスクでは仕様記述のみ。実 PUT は別オペレーションで実施。**

```bash
# === STEP 0: 認証確認 ===
gh auth status   # administration:write スコープ

# === STEP 1: dev 現状取得 → adapter で contexts に coverage-gate 追加 → 再 PUT ===
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-13/branch-protection-snapshot-dev-pre-coverage.json

# adapter（jq）で contexts に coverage-gate 追加した payload を生成
jq '.required_status_checks.contexts |= (. + ["coverage-gate"] | unique)
    | .required_status_checks.checks |= (. + [{"context":"coverage-gate","app_id":-1}] | unique_by(.context))' \
  outputs/phase-13/branch-protection-snapshot-dev-pre-coverage.json \
  > outputs/phase-13/branch-protection-payload-dev-add-coverage.json

# UT-GOV-001 の adapter で GET 形 → PUT 形に正規化（enforce_admins.enabled → bool 等）
# 詳細は ut-gov-001 の implementation-guide Part 2 § adapter 擬似コード参照

# 実 PUT（user 承認後のみ）
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input outputs/phase-13/branch-protection-payload-dev-add-coverage.json

# === STEP 2: main 同様（独立 PUT） ===
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-13/branch-protection-snapshot-main-pre-coverage.json

jq '.required_status_checks.contexts |= (. + ["coverage-gate"] | unique)
    | .required_status_checks.checks |= (. + [{"context":"coverage-gate","app_id":-1}] | unique_by(.context))' \
  outputs/phase-13/branch-protection-snapshot-main-pre-coverage.json \
  > outputs/phase-13/branch-protection-payload-main-add-coverage.json

gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input outputs/phase-13/branch-protection-payload-main-add-coverage.json

# === STEP 3: GET 検証 ===
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'
# 期待: 出力に "coverage-gate" が含まれる
```

> **dev / main は bulk 化禁止 / 独立 PUT × 2**。片方失敗時の影響分離を維持する。
> UT-GOV-001 と整合。本タスクでは仕様記述のみで実 PUT は別オペレーション。

## aiworkflow-requirements 更新コマンド

```bash
# PR③ merge 後、user 承認後のみ実行
mise exec -- pnpm indexes:rebuild
```

実行タイミング:

| 操作 | タイミング |
| --- | --- |
| `pnpm indexes:rebuild` | PR③ merge 完了後、`quality-requirements-advanced.md` の更新内容が dev に反映された状態で実行 |
| 実行場所 | dev ブランチ最新を pull した worktree |
| 期待結果 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` 等が再生成され、CI `verify-indexes-up-to-date` gate が green |

## drift 検証（PR③ merge + contexts 登録 + indexes:rebuild すべて完了後）

```bash
# 1. vitest.config.ts threshold 確認
rg -A2 "thresholds:" vitest.config.ts

# 2. codecov.yml threshold 確認
rg "target:|threshold:" codecov.yml

# 3. aiworkflow-requirements 80% 確認
rg "lines | 80" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md

# 4. branch protection 実値確認
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'

# 5. CLAUDE.md ↔ 実値整合
rg "coverage-gate|coverage 80" CLAUDE.md
```

drift 検出時は **GitHub 実値 / vitest.config / 実 CI 出力ではなく、CLAUDE.md / aiworkflow-requirements を訂正**（正本は実値、ドキュメントは参照）。

## 期待結果

| 項目 | 期待値 |
| --- | --- |
| `coverage-gate` job | required（continue-on-error なし。FAIL で merge block） |
| ローカル `git push` | coverage-guard 未達時 push block |
| branch protection contexts | dev / main 両方に `coverage-gate` 含まれる |
| aiworkflow-requirements | 全 package 80% 一律で正本化 |
| `pnpm indexes:rebuild` | 成功 / verify-indexes-up-to-date gate green |
| 4 系正本 drift | 0 |

## 失敗時 rollback

| ケース | 対応 |
| --- | --- |
| PR③ merge 後に大量 PR が一斉 block | branch protection から `coverage-gate` contexts を一時的に外す（再 PUT で contexts から削除）→ 原因 PR を rebase / coverage 達成 → contexts 再登録 |
| lefthook で push 詰み | `LEFTHOOK=0 git push`（緊急時のみ。CI hard gate で同等 check が走るため事実上抜け道なし） |
| `pnpm indexes:rebuild` 失敗 | indexes 差分を git で確認 / 再 install / mise install 確認 / 該当 reference の構造エラー修正 |
| aiworkflow-requirements 更新で skill が壊れる | revert PR で `quality-requirements-advanced.md` を旧形に戻す → 修正再 push |
| UT-GOV-004 未完了で contexts 登録できない | **2 段階適用**: PR③ merge までは実施し、`coverage-gate` を CI required（FAIL で merge block）として運用。UT-GOV-004 完了後に contexts 登録のみ追加 |

## branch protection 操作タイミングまとめ

| 段階 | 操作 |
| --- | --- |
| PR① / PR② | branch protection 操作なし |
| PR③ 作成・push・review | branch protection 操作なし |
| PR③ merge 直後 | branch protection 操作なし（CI hard gate のみ先行有効化） |
| PR③ merge 後 + user 承認④ | dev / main 独立に `gh api PUT` で contexts に `coverage-gate` を追加 |
| contexts 登録後 + user 承認⑤ | `mise exec -- pnpm indexes:rebuild` |
| 全完了後 | drift 検証 → artifacts.json Phase 13 = `completed` |

## user 承認チェック

| 段階 | 承認内容 |
| --- | --- |
| ① | 「PR③ を作成してよい」 |
| ② | 「PR③ を merge してよい」 |
| ③ | 「branch protection contexts に `coverage-gate` を追加してよい」（dev / main 独立に確認）|
| ④ | 「`mise exec -- pnpm indexes:rebuild` を実行してよい」 |

> 4 段階の独立承認。一括承認禁止。

## 完了判定

- [ ] PR③ merge 済
- [ ] dev / main の branch protection contexts に `coverage-gate` 登録済
- [ ] `pnpm indexes:rebuild` 実行済 / `verify-indexes-up-to-date` gate green
- [ ] drift 検証で 4 系正本一致確認済
- [ ] artifacts.json Phase 13 = `completed`
- [ ] U-4 / U-5 を別タスクとして formalize 検討

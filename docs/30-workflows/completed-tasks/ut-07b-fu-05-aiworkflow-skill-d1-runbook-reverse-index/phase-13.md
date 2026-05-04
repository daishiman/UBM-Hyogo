[実装区分: 実装仕様書]

# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（workflow 完了） |
| 状態 | blocked-until-user-approval |
| Source Issue | #438 |
| TaskType | implementation |
| VisualEvidence | NON_VISUAL |
| user_approval_required | **true（最重要）** |
| Issue 参照方式 | **`Refs #438`**（`Closes` 禁止。Issue lifecycle 維持） |
| ブランチ名 | `docs/issue-438-ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index` |
| ベースブランチ | `dev`（feature/* → dev → main） |
| merge 戦略 | solo dev / CI gate 通過後 squash |

---

## 目的

Phase 1〜12 で完成した aiworkflow-requirements skill 逆引き整備一式（resource-map / quick-reference / topic-map / LOGS.md × 2 / SKILL.md / 完了タスク台帳）を、
**user の明示承認後** に commit / push し、`dev` ブランチをベースとする PR を作成して CI を確認する。
Claude は user 承認前に commit / push / PR 作成を**実行しない**（曖昧合意では実行禁止）。

CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）の PASS が本タスクの最終受入条件である。

---

## ルール（必須）

1. user の明示承認がない限り blocked のままにする
2. ローカルチェック（typecheck / lint / `pnpm indexes:rebuild` × 2 / build）を省略しない
3. commit / PR / push を自動で作らない
4. PR body / commit message ともに **`Refs #438`** を採用する（`Closes #438` 禁止）
5. `--no-verify` での hook skip は使用しない（main 取り込み merge commit 以外）

---

## 実行タスク

1. Phase 1〜12 完了と Phase 12 7成果物 / artifacts parity を確認する
2. `local-check-result.md` にローカル検証ログを記録する
3. 機密情報 grep / apps/web → D1 境界 grep を実行する（境界 grep は本タスクでは差分 0 件が当然だが必ず実行）
4. `change-summary.md` を作成し、user に提示する
5. user の明示承認後のみ commit / push / PR 作成を実行する
6. CI 結果と PR 情報を `pr-info.md` / `pr-creation-result.md` に記録する

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 前 Phase | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 7成果物 / same-wave sync / artifacts parity の gate |
| 前 Phase | `outputs/phase-12/implementation-guide.md` | PR コメント投稿用の実装ガイド |
| 前 Phase | `outputs/phase-12/documentation-changelog.md` | 変更ファイル / validator 結果 |
| スキル | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | user approval / PR blocked ルール |
| GitHub | Issue #438 | `Refs #438` 参照のみ |
| CI | `.github/workflows/verify-indexes.yml` | required status check |

---

## Phase 13 必須成果物（4 点）

| # | 成果物 | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-13/local-check-result.md` | typecheck / lint / `pnpm indexes:rebuild` × 2 / build のローカル検証ログ（**最重要・最初に作成**） |
| 2 | `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前に user に提示する草案） |
| 3 | `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI 結果 |
| 4 | `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |

---

## 実行手順

### ステップ 1: 前提確認

- Phase 1〜12 が completed
- artifacts.json の `phase: 12, status: completed` が root と outputs で一致
- Phase 12 の 7 outputs 全て実在
- planned wording 0 / parity drift 0
- `pnpm indexes:rebuild` 2 回目で diff 0 件（冪等性）
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS（Phase 10 で確定済）

### ステップ 2: ローカルチェック（`outputs/phase-13/local-check-result.md`）

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| install | `mise exec -- pnpm install --frozen-lockfile` | exit 0 |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| indexes rebuild (1 回目) | `mise exec -- pnpm indexes:rebuild` | exit 0 |
| indexes rebuild (2 回目 / 冪等) | `mise exec -- pnpm indexes:rebuild` | exit 0 + git diff 0 件 |
| `verify-indexes` 相当 | `git status --porcelain .claude/skills/aiworkflow-requirements/indexes/` | 2 回目 rebuild 後は空 |
| build | `mise exec -- pnpm build` | exit 0 |
| 全 test | `mise exec -- pnpm test` | exit 0（コード変更なしのため非影響） |

各コマンドの実行ログ（exit code / 所要時間 / 実行日時）を `local-check-result.md` に記録する。

### ステップ 3: 機密情報 grep + 境界 grep

```bash
# 機密情報 grep
git diff --cached | grep -nE "ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}" || echo "OK"
git diff --cached | grep -nE "CLOUDFLARE_API_TOKEN=[A-Za-z0-9]{16,}" || echo "OK"

# 境界 grep（apps/web から D1 binding 直参照: 不変条件 #5）— 本タスクは apps/ 不触のため必ず OK
git diff --cached --name-only | xargs rg -l "D1Database" 2>/dev/null | grep "apps/web" && echo "NG" || echo "OK"

# apps/ / packages/ への意図せぬ touch がないこと（docsOnly=true の確認）
git diff --cached --name-only | rg "^(apps|packages)/" && echo "NG: docsOnly violated" || echo "OK"
```

### ステップ 4: change-summary 作成

`outputs/phase-13/change-summary.md` に以下を記述:

```markdown
## 変更概要

UT-07B-FU-05 aiworkflow-requirements skill から D1 migration runbook + scripts を逆引きできる index 整備

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` に D1 migration runbook（UT-07B-FU-03）/ `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` 逆引き 1〜2 行追記
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` に `bash scripts/cf.sh d1:apply-prod` 1 行追記
- `pnpm indexes:rebuild` で `topic-map.md` 再生成
- aiworkflow-requirements / task-specification-creator の LOGS.md と aiworkflow-requirements の SKILL.md 変更履歴を更新
- 完了タスク台帳（docs/30-workflows/LOGS.md）に UT-07B-FU-05 行追加

## 変更ファイル一覧（カテゴリ別）

| カテゴリ | ファイル |
| --- | --- |
| spec | docs/30-workflows/ut-07b-fu-05-.../phase-*.md / index.md / artifacts.json |
| outputs | docs/30-workflows/ut-07b-fu-05-.../outputs/phase-01〜13/ |
| skill index | .claude/skills/aiworkflow-requirements/indexes/resource-map.md / quick-reference.md / topic-map.md |
| skill metadata | .claude/skills/aiworkflow-requirements/SKILL.md / LOGS.md / .claude/skills/task-specification-creator/LOGS.md |
| LOGS row | docs/30-workflows/LOGS.md |

## test plan

- [ ] typecheck / lint exit 0
- [ ] `pnpm indexes:rebuild` 1 回目 exit 0
- [ ] `pnpm indexes:rebuild` 2 回目で git diff 0 件（冪等）
- [ ] `verify-indexes-up-to-date` CI gate ローカル PASS
- [ ] build exit 0
- [ ] 機密情報 grep 0 件
- [ ] apps/ / packages/ への touch 0 件（docsOnly=true）
- [ ] resource-map に D1 runbook / scripts/d1 / d1-migration-verify.yml が存在することを grep で確認
- [ ] quick-reference に `bash scripts/cf.sh d1:apply-prod` が存在することを grep で確認

## Linked Issue

Refs #438（参照のみ）

## Risk / 後方互換性

- skill index への追記のみ。コード実装変更なし
- `pnpm indexes:rebuild` の冪等性で再生成リスクなし
- 失敗時 rollback: `dev` への merge revert で skill index を一括戻し可能
```

### ステップ 5: user 承認ゲート（**必須・実行前ブロック**）

- ステップ 2〜4 の結果を user に提示
- 提示内容: `local-check-result.md` 要約 + `change-summary.md` + 変更ファイル一覧 + test plan + Risk
- user の **明示承認文言**（例: 「PR 作って良い」「approve」「OK」など曖昧でない指示）を待つ
- 承認取得まで commit / push / PR 作成は**実行禁止**

### ステップ 6: コミット粒度（user 承認後のみ）

solo dev / docs-only タスクのため squash 1 commit を推奨。粒度を分ける場合の目安:

| # | コミット message 例 | 含むファイル |
| --- | --- | --- |
| 1 | `docs(workflows): ut-07b-fu-05 phase 1-13 specifications` | `docs/30-workflows/ut-07b-fu-05-.../phase-*.md` / `index.md` / `artifacts.json` |
| 2 | `docs(workflows): ut-07b-fu-05 outputs (phase-01〜13)` | `outputs/phase-01〜13/` |
| 3 | `docs(skills): ut-07b-fu-05 aiworkflow resource-map / quick-reference D1 reverse index` | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` / `topic-map.md` |
| 4 | `docs(skills): ut-07b-fu-05 LOGS / SKILL update` | `.claude/skills/aiworkflow-requirements/SKILL.md` / `LOGS.md` / `.claude/skills/task-specification-creator/LOGS.md` |
| 5 | `docs(workflows): ut-07b-fu-05 LOGS row` | `docs/30-workflows/LOGS.md` |

```bash
git commit -m "$(cat <<'EOF'
<subject>

<body>

Refs #438

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

> `Closes #438` は使用しない。

### ステップ 7: push と PR 作成

```bash
# branch push
git push -u origin docs/issue-438-ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index

# PR 作成
gh pr create \
  --title "docs(ut-07b-fu-05): aiworkflow-requirements から D1 migration runbook を逆引きできる index 整備" \
  --base dev \
  --head docs/issue-438-ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index \
  --body "$(cat <<'EOF'
## Summary

- aiworkflow-requirements skill の resource-map に D1 migration runbook（UT-07B-FU-03）/ `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` 逆引き行を追記
- quick-reference に `bash scripts/cf.sh d1:apply-prod` 1 行を追記
- `pnpm indexes:rebuild` で `topic-map.md` を再生成（手書き禁止 / 冪等性確認済み）
- 上流 UT-07B-FU-03 の skill-feedback-report の指摘を本 PR で消化

## 変更ファイル

- .claude/skills/aiworkflow-requirements/indexes/resource-map.md
- .claude/skills/aiworkflow-requirements/indexes/quick-reference.md
- .claude/skills/aiworkflow-requirements/indexes/topic-map.md（自動再生成）
- .claude/skills/aiworkflow-requirements/SKILL.md / LOGS.md
- .claude/skills/task-specification-creator/LOGS.md
- docs/30-workflows/LOGS.md
- docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index/

## Test plan

- [ ] typecheck / lint exit 0
- [ ] `pnpm indexes:rebuild` 1 回目 exit 0、2 回目 git diff 0 件（冪等）
- [ ] `verify-indexes-up-to-date` CI gate PASS
- [ ] build exit 0
- [ ] 機密情報 grep 0 件 / apps/ packages/ touch 0 件（docsOnly=true）
- [ ] resource-map / quick-reference の grep で追記文言を 1 行以上検出

## Linked Issue

Refs #438（参照のみ）

## Risk / 後方互換性

- skill metadata 追記のみ。コード変更なし
- 失敗時 rollback: dev merge revert で skill index を一括戻し可能

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### ステップ 8: CI 確認

```bash
gh pr checks <PR番号>
gh pr view <PR番号> --json mergeStateStatus,statusCheckRollup
```

- 全 required status check が PASS
- 特に `verify-indexes-up-to-date` が PASS していること（本タスクの最終受入条件）
- `mergeStateStatus` が `CLEAN` または `BEHIND`（rebase で解消）
- CI 失敗時は原因を解析し、新規 commit で修正（`--amend` 禁止）

### ステップ 9: implementation-guide コメント投稿

`/ai:diff-to-pr` が利用可能な場合は自動投稿。手動の場合は:

```bash
gh pr comment <PR番号> --body-file outputs/phase-12/implementation-guide.md
```

### ステップ 10: pr-info / pr-creation-result 記録

- `outputs/phase-13/pr-info.md`: PR URL / branch / base / merge state / CI 結果サマリ（特に `verify-indexes-up-to-date` 結果）
- `outputs/phase-13/pr-creation-result.md`: 実行ログ全文 + user 承認時刻 + 各 commit hash

---

## post-merge アクション

| # | アクション | コマンド / 操作 |
| --- | --- | --- |
| 1 | 必要時 indexes 再生成 | `mise exec -- pnpm indexes:rebuild`（drift があれば追加 PR） |
| 2 | Issue #438 へ PR リンクコメント | `gh issue comment 438 --body "UT-07B-FU-05 PR merged: <PR URL>。"` |
| 3 | 完了タスク移動 | `mv docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index/ docs/30-workflows/completed-tasks/` |
| 4 | 移動コミット | `git add docs/30-workflows/ && git commit -m "docs(workflows): ut-07b-fu-05 を completed-tasks に移動"` + push |
| 5 | 後続 D1 migration 実走判定 | aiworkflow-requirements skill から runbook へ逆引きできる状態が確定したことを `docs/30-workflows/unassigned-task/` で再確認 |

---

## ローカルチェック手順表（ステップ 2 詳細）

| # | 種別 | コマンド | 期待 exit | 主証跡記録項目 |
| --- | --- | --- | --- | --- |
| 1 | install | `mise exec -- pnpm install --frozen-lockfile` | 0 | hook install 完了 |
| 2 | typecheck | `mise exec -- pnpm typecheck` | 0 | エラー件数 0 |
| 3 | lint | `mise exec -- pnpm lint` | 0 | warning / error 件数 |
| 4 | indexes rebuild #1 | `mise exec -- pnpm indexes:rebuild` | 0 | topic-map 再生成あり |
| 5 | indexes rebuild #2 | `mise exec -- pnpm indexes:rebuild` | 0 | git diff 0 件（冪等） |
| 6 | verify-indexes 相当 | `git status --porcelain .claude/skills/aiworkflow-requirements/indexes/` | 空 | 2 回目 rebuild 後 |
| 7 | build | `mise exec -- pnpm build` | 0 | apps/api / apps/web 成果物存在 |
| 8 | 機密情報 grep | 上記 step 3 参照 | OK 出力 | 0 件 |
| 9 | 境界 grep | 上記 step 3 参照 | OK 出力 | 0 件 |
| 10 | docsOnly grep | apps/ packages/ touch 確認 | OK 出力 | 0 件 |

---

## PR テンプレート要約

| 項目 | 値 |
| --- | --- |
| title | `docs(ut-07b-fu-05): aiworkflow-requirements から D1 migration runbook を逆引きできる index 整備` |
| base | `dev` |
| head | `docs/issue-438-ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index` |
| body 必須セクション | Summary / 変更ファイル / Test plan / Linked Issue (`Refs #438`) / Risk |
| Issue 参照 | `Refs #438`（**`Closes` 禁止**） |
| auto-merge | 無効（CI gate 通過後に手動 squash） |
| reviewer | 自分（solo dev / required reviews = 0） |
| 必須 CI gate | `verify-indexes-up-to-date` PASS が最終受入条件 |

---

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 9 | typecheck / lint / `pnpm indexes:rebuild` green を再走で確認 |
| Phase 12 | implementation-guide.md を PR コメントとして投稿 |
| 上流 UT-07B-FU-03 | `skill-feedback-report.md` の改善要求を本 PR の merge をもって消化 |
| post-merge | 後続 D1 migration 実走の前提条件として「aiworkflow-requirements skill から runbook 逆引き可能」を引き渡す |

---

## 多角的チェック観点

- 不変条件 #5: apps/web から D1 binding 直参照が混入していないこと（境界 grep）
- 不変条件 #6: 追記対象の参照先に GAS prototype が含まれていないこと
- 機密情報: API token / OAuth / 1Password 参照値の平文混入が 0 件
- Issue ライフサイクル: `Refs #438` のみ使用し `Closes` を使わない
- docsOnly=true の保証: `apps/` / `packages/` への touch が 0 件
- topic-map 手書き禁止: `pnpm indexes:rebuild` 経由でのみ生成

---

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | local-check-result.md 作成 | pending | 10 種コマンドログ |
| 2 | 機密情報 / 境界 / docsOnly grep | pending | 0 件確認 |
| 3 | change-summary.md 作成 | pending | user 提示用草案 |
| 4 | user 明示承認取得 | pending | 曖昧合意では実行しない |
| 5 | commit（粒度別 or squash 対応）| pending | 承認後のみ |
| 6 | push + PR 作成 | pending | base=dev / Refs #438 |
| 7 | CI 確認 | pending | `verify-indexes-up-to-date` PASS 必須 |
| 8 | implementation-guide コメント投稿 | pending | `/ai:diff-to-pr` または手動 |
| 9 | pr-info.md / pr-creation-result.md 記録 | pending | URL + CI + 承認時刻 |
| 10 | post-merge: Issue #438 へコメント | pending | PR リンクのみ |
| 11 | post-merge: completed-tasks 移動 | pending | mv + 追加コミット |

---

## 成果物

| 種別 | パス | 必須 | 説明 |
| --- | --- | --- | --- |
| ドキュメント | `outputs/phase-13/local-check-result.md` | ✅ | ローカル検証ログ |
| ドキュメント | `outputs/phase-13/change-summary.md` | ✅ | 変更サマリー（user 提示用） |
| ドキュメント | `outputs/phase-13/pr-info.md` | ✅ | PR URL / CI 結果 |
| ドキュメント | `outputs/phase-13/pr-creation-result.md` | ✅ | PR 作成プロセスログ |

---

## 完了条件

- [ ] `outputs/phase-13/local-check-result.md` が 10 種コマンド全て exit 0 で記録済み
- [ ] `pnpm indexes:rebuild` 2 回目で diff 0 件（冪等）を確認済み
- [ ] 機密情報 grep 0 件 / 境界 grep 0 件 / docsOnly grep 0 件
- [ ] `outputs/phase-13/change-summary.md` を user に提示済み
- [ ] user の **明示承認** を取得済み
- [ ] commit / push 実施済み
- [ ] `gh pr create` で PR 作成済み（base=dev / head=docs/issue-438-... / `Refs #438`）
- [ ] CI 全 required status check が PASS
- [ ] 特に `verify-indexes-up-to-date` が PASS
- [ ] implementation-guide.md を PR コメントに投稿済み
- [ ] `outputs/phase-13/pr-info.md` / `pr-creation-result.md` を記録済み
- [ ] post-merge: Issue #438 へ PR リンクコメント追加
- [ ] post-merge: タスクディレクトリを `docs/30-workflows/completed-tasks/` に移動済み
- [ ] artifacts.json の phase 13 を completed に更新
- [ ] **本 Phase 内の全作業を 100% 完了**

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 4 必須成果物 + post-merge アクション完遂
- workflow 全 13 phase が completed
- artifacts.json の workflow_state を `completed` に更新（docsOnly=true / skill metadata 同 wave sync 完了）

---

## workflow 完了

Phase 13 の post-merge アクションをもって workflow `ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index` は完了する。
本 PR の merge をもって、aiworkflow-requirements skill から D1 migration runbook / `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` への逆引きが確立し、後続 D1 migration 実走タスクの前提条件が満たされる。

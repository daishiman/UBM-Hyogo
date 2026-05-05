# Phase Template Phase13 詳細

> 親ファイル: [phase-templates.md](phase-templates.md)
> 骨格: [phase-template-phase13.md](phase-template-phase13.md)

## 対象

Phase 13: PR作成の詳細テンプレート（変更サマリー提示・PR作成・CI確認・タスク完了処理）。

---

## 詳細テンプレート

````markdown
# Phase 13: PR作成

## メタ情報

| 項目   | 値               |
| ------ | ---------------- |
| Phase  | 13               |
| 機能名 | {{FEATURE_NAME}} |
| 作成日 | {{CREATED_DATE}} |

## 目的

変更をコミットし、ユーザーの明示的な許可を得てからPull Requestを作成し、CIを確認する。

## 実行タスク

- ローカル動作確認依頼: ユーザーにローカルでの動作確認を依頼
- 変更サマリー提示: 変更内容のサマリーを提示しPR作成の許可を確認
- PR作成: ユーザーの許可後に`/ai:diff-to-pr`を実行
- CI確認: CIが通過したことを確認

## 参照資料

| 資料名       | パス                                          | 説明           |
| ------------ | --------------------------------------------- | -------------- |
| 最終レビュー | `outputs/phase-10/final-review-result.md`     | Phase 10成果物 |
| 手動テスト   | `outputs/phase-11/manual-test-result.md`      | Phase 11成果物 |
| ドキュメント | `outputs/phase-12/documentation-changelog.md` | Phase 12成果物 |

## 実行手順

### 1. ユーザーにローカル動作確認を依頼【必須】

PR作成前に、ユーザーにローカル環境での動作確認を依頼する。

### 2. 変更サマリーの提示と許可確認【必須】

変更内容のサマリーを提示し、PRを作成してよいかユーザーに確認する。

**重要**: ユーザーから明示的な許可を得るまでPR作成を実行しないこと。

### 3. `/ai:diff-to-pr` を実行

ユーザーの許可を得た後、PR作成を実行する。

```
/ai:diff-to-pr
```

**PR作成時の自動投稿内容（`/ai:diff-to-pr`）**:

1. **PR本文**（`.github/pull_request_template.md` 準拠）:
   概要・変更内容・変更タイプ・テスト・関連 Issue・破壊的変更・（UI/UX変更時のみ）スクリーンショット・チェックリスト・その他
2. **PRコメント1**: 実装の詳細・レビュー注意点・テスト方法・参考資料
3. **PRコメント2**（Phase 12成果物あり時）: implementation-guide.md の全文
4. **PRコメント3**（Phase 11スクリーンショットあり時）: スクリーンショットギャラリー

**PR本文セクション連携ルール（必須）**:

- `/ai:diff-to-pr` の Phase 3.6 で、staged差分から `TARGET_WORKFLOW_DIR` を1件特定する
- Phase 11/12成果物パスは `TARGET_WORKFLOW_DIR` 配下のみ参照する
- PR本文 `## その他` に、Phase 12 実装ガイド反映元パスと要点（Part 1/Part 2）を必ず記載する
- `implementation-guide.md` の全文を PRコメントとして必ず投稿する
- UI/UX変更時は `outputs/phase-11/screenshots/*.png` を検出し、PR本文 `## スクリーンショット` に画像リンクを自動挿入する
- PR本文/PRコメントで画像を埋め込む場合は `raw.githubusercontent.com/<repo>/<commit>/<path>` の絶対URLを使う（相対パス直貼りは禁止）
- UI/UX変更がない場合は PR本文 `## スクリーンショット` セクションを削除する
- workflow候補が複数ある場合は、PR作成前にユーザーへ対象workflowを確認する

### 4. 実行結果の確認

- PRが作成されていること
- CIが通過していること

### 5. フォールバック（必要時）

`/ai:diff-to-pr` が使えない場合は、git/gh CLIで手動対応する。

## 成果物

| 成果物 | パス                          | 説明     |
| ------ | ----------------------------- | -------- |
| PR情報 | `outputs/phase-13/pr-info.md` | PR URL等 |

## 完了条件

- [ ] ユーザーにローカル動作確認を依頼している
- [ ] 変更サマリーを提示しPR作成の許可を得ている
- [ ] 全変更がコミットされている
- [ ] PRが作成されている
- [ ] CIが通過している
- [ ] レビュー準備が完了している
- [ ] タスクディレクトリがcompleted-tasksに移動されている
- [ ] **本Phase内の全作業を100%完了（PR作成・CI確認・移動）**

## タスク完了処理【必須】

**PRが作成され、CIが通過した後、タスクディレクトリを完了タスクフォルダに移動する。**

```bash
# タスクディレクトリをcompleted-tasksに移動
mv docs/30-workflows/{{TASK_NAME}}/ docs/30-workflows/completed-tasks/

# 移動を確認
ls docs/30-workflows/completed-tasks/ | grep {{TASK_NAME}}

# 変更をコミット
git add docs/30-workflows/
git commit -m "docs(workflows): {{TASK_NAME}}をcompleted-tasksに移動"
git push
```
````

## 変数一覧

| 変数 | 意味 |
| --- | --- |
| `{{TASK_ID}}` | workflow 全体の task ID |
| `{{FEATURE_NAME}}` | workflow ディレクトリ名 |
| `{{PHASE_NAME}}` | phase 名称 |
| `{{ARTIFACT_PATH}}` | `outputs/phase-N/...` の相対パス |
| `{{SYSTEM_SPEC_PATH}}` | aiworkflow-requirements 側の更新対象 |

## 関連テンプレート

- [../assets/phase-spec-template.md](../assets/phase-spec-template.md)
- [../assets/main-task-template.md](../assets/main-task-template.md)
- [../assets/review-result-template.md](../assets/review-result-template.md)
- [../assets/implementation-guide-template.md](../assets/implementation-guide-template.md)
- [../assets/documentation-changelog-template.md](../assets/documentation-changelog-template.md)

## approval-gated NON_VISUAL implementation 詳細手順

> 適用条件: `taskType=implementation` / `visualEvidence=NON_VISUAL` / 不可逆 API（branch protection PUT / Cloudflare deploy / D1 migration apply 等）の Phase 13 実行。
> 骨格は [phase-template-phase13.md](phase-template-phase13.md) §「approval-gated NON_VISUAL implementation パターン」を参照。
> 実例: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md`（全手順がこのパターンの正本）。

### メタ情報追加項目

通常の Phase 13 メタ情報に加え、以下を **必須** で記述する。

| 項目 | 値の例 |
| --- | --- |
| user_approval_required | `true（最重要）` |
| Issue 参照方式 | `Refs #<issue>`（`Closes` 禁止） |
| 不可逆 API | `gh api -X PUT .../protection` / `wrangler deploy` / `d1 migrations apply` |
| rollback payload location | 上流タスクの `outputs/phase-05/rollback-payload-*.json`（再利用のみ） |
| admin / privileged token 取得経路 | `op://Vault/Item/Field`（CLAUDE.md secret hygiene 準拠） |

### 実行手順（user 承認後にのみ実行）

#### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 1〜12 完了 / 4 条件 PASS / MAJOR 0 件 / Phase 10 GO / Phase 12 全 PASS を確認。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認。
3. 上流タスク（first stage）の完了および前提タスク（context source / payload source）の完了を再確認。
4. `outputs/phase-13/change-summary.md` + 実行 plan（不可逆 API 呼び出しの順序 / rollback payload location / privileged token 取得経路）を user に提示し、**明示承認** を待つ。
5. 承認取得後にステップ 2 へ。否承認 / 保留時はここで close-out（`spec_created` を維持）。

> Claude Code は user 明示承認前にステップ 4 以降を実行しない。曖昧な合意では実行しない。

#### ステップ 2: ローカル検証（`outputs/phase-13/local-check-result.md`）

- `apps/` / `packages/` 差分が無い governance / infra タスクでは `lint / typecheck / build` を **N/A: docs and REST API only** と明記。
- spec validate（`validate-phase-output.js` / `verify-all-specs.js`）は必須。
- `pnpm install --frozen-lockfile` exit 0 を記録（hook 状態維持のため）。

#### ステップ 3: 機密情報 grep + implementation 境界 grep

```bash
# 機密情報 grep
git diff --cached | grep -nE "ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}" || echo "OK"
git diff --cached | grep -nE "<TOKEN_NAME>=[A-Za-z0-9]{16,}" || echo "OK"

# implementation 境界 grep（governance タスクは apps/packages/migrations/wrangler.toml を含めない）
git diff --cached --name-only | grep -E "^(apps/|packages/|migrations/|wrangler\.toml)" && echo "NG" || echo "OK"
```

#### ステップ 4: 適用前 GET（fresh）

```bash
gh api repos/<owner>/<repo>/branches/<branch>/protection \
  > outputs/phase-13/branch-protection-current-<branch>.json
```

> 適用前 GET は Phase 13 で改めて取得する。Phase 5 / Phase 11 の GET は applied evidence として採用しない。

#### ステップ 5 / 6: 不可逆 API 実行 → fresh 検証 GET → 集合一致確認

dev / main など複数対象がある場合は **直列実行**（同時 PUT 禁止）。片側成功 / 片側失敗の場合は失敗側のみ rollback。

```bash
# 例: dev PUT
gh api -X PUT repos/<owner>/<repo>/branches/<branch>/protection \
  --input outputs/phase-13/branch-protection-payload-<branch>.json

# 直後に fresh 検証 GET
gh api repos/<owner>/<repo>/branches/<branch>/protection \
  > outputs/phase-13/branch-protection-applied-<branch>.json

# 集合一致確認（順序不問）
diff <(jq -S '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-applied-<branch>.json) \
     <(jq -S '. | sort' outputs/phase-02/expected-contexts-<branch>.json)
```

#### ステップ 7: drift 最終確認

正本（CLAUDE.md / deployment-branch-strategy.md / 該当 references）と applied GET を比較。drift 検出時は rollback ではなく **別タスク起票**（drift-fix unassigned-task）。

#### ステップ 8: change-summary 作成

`outputs/phase-13/change-summary.md` に PR description 草案 + 変更ファイルリスト + コミット粒度 5 単位を記述。

#### ステップ 9: コミット粒度 5 単位（user 承認後のみ）

| # | コミット message 例 | 含むファイル |
| --- | --- | --- |
| 1 | `docs(workflows): <task> phase 1-13 specifications` | `docs/30-workflows/<task>/phase-*.md` / `index.md` / `artifacts.json` |
| 2 | `docs(workflows): <task> outputs (design / runbook / drift)` | `outputs/phase-01..phase-12/` |
| 3 | `chore(<area>): <task> applied evidence (fresh GET)` | `outputs/phase-13/*.json` + `local-check-result.md` |
| 4 | `docs(skills): <task> same-wave sync (SKILL / resource-map / active guide)` | `.claude/skills/**` |
| 5 | `docs(workflows): <task> LOGS.md completion row` | `docs/30-workflows/LOGS.md` |

```bash
git commit -m "$(cat <<'EOF'
<subject>

<body>

Refs #<issue>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

> `Closes #<issue>` は使用しない。Issue は CLOSED のまま `Refs` で参照のみ。

#### ステップ 10: PR 作成（user 承認後のみ）

```bash
gh pr create \
  --title "<type>(<scope>): <subject> (Refs #<issue>)" \
  --base dev \
  --head feat/<task-branch> \
  --body "$(cat <<'EOF'
## Summary
- ...
## Test plan
- [ ] applied GET と expected が集合一致
- [ ] drift N 値が正本と一致
- [ ] validate-phase-output.js / verify-all-specs.js exit 0
- [ ] 機密情報 grep 0 件 / implementation 境界 grep 0 件
## Linked Issue
Refs #<issue> (CLOSED — 再オープンしない / 参照のみ)
## Risk / 後方互換性
- 破壊的変更なし
- 失敗時 rollback 経路: <rollback payload location>
EOF
)"
```

#### ステップ 11: CI / branch protection 動作確認

```bash
gh pr checks <PR番号>
gh pr view <PR番号> --json mergeStateStatus,statusCheckRollup
```

#### ステップ 12: Issue 二段階目クローズアウトコメント

```bash
gh issue comment <issue> --body "<task> 実 PUT 完了 / fresh GET 集合一致 PASS / PR: <URL>。Issue は CLOSED のまま。"
```

### rollback 判断基準（merge 前 / merge 後で分離）

| タイミング | 事象 | 操作 |
| --- | --- | --- |
| merge **前** | applied GET の不一致 / 422 schema error / admin block | 上流 first-stage の rollback payload で即時 revert（**上書き禁止 / 再利用のみ**） |
| merge **前** | 片側成功 / 片側失敗 | 失敗側のみ rollback、成功側は維持 |
| merge **前** | drift 検出 | rollback せず drift-fix unassigned-task 起票 |
| merge **後** | 後発 typo / 設定不備 | 別タスク（third-stage / correction）起票 |
| merge **後** | references 反映による drift | references-reflect unassigned-task で吸収 |

> rollback payload は **上流タスクのものを再利用** し、**新規生成 / 上書きをしない**（Phase 3 運用ルール）。本タスク独自の rollback が必要なら別ファイル名で保存。

### 完了条件への追加項目

通常の完了条件に加え、以下を必須化:

- [ ] 承認ゲート（user 明示承認）が PASS
- [ ] 機密情報 grep 0 件 / implementation 境界 grep 0 件
- [ ] 適用前 GET（fresh）が `outputs/phase-13/*-current-*.json` に保全
- [ ] 不可逆 API 後の fresh GET が `outputs/phase-13/*-applied-*.json` に保全
- [ ] applied GET と expected が集合一致
- [ ] drift 各値が正本と一致
- [ ] コミット粒度 5 単位で分離
- [ ] PR body / commit message が `Refs #<issue>` を採用（`Closes` 不使用）
- [ ] Issue 二段階目クローズアウトコメント追記
- [ ] rollback payload 上書きが発生していない（git diff で確認）

## 変更履歴

| Date | Changes |
| --- | --- |
| 2026-04-30 | UT-GOV-001 second-stage reapply 由来の approval-gated NON_VISUAL implementation パターン（三役ゲート / rollback payload 上書き禁止 / コミット粒度 5 単位 / Phase 13 fresh GET / `Refs #<issue>` 採用）を反映 |
| 2026-03-12 | 1818行の monolith から family file 構成へ再編 |

## 関連ガイド

- [phase-template-phase13.md](phase-template-phase13.md) — Phase 13 骨格・blocked ルール
- [review-gate-criteria.md](review-gate-criteria.md)
- [commands.md](commands.md)

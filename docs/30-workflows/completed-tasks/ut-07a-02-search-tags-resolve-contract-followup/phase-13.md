# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（workflow 完了） |
| 状態 | blocked-until-user-approval |
| Source Issue | #297 |
| TaskType | implementation |
| VisualEvidence | NON_VISUAL |
| user_approval_required | **true（最重要）** |
| Issue 参照方式 | **`Refs #297`**（`Closes` 禁止。Issue は CLOSED のまま参照のみ） |
| ブランチ名 | `feat/ut-07a-02-search-tags-resolve-contract-followup` |
| ベースブランチ | `dev`（feature/* → dev → main） |
| merge 戦略 | solo dev / CI gate 通過後 squash |

---

## 目的

Phase 1〜12 で完成した resolve API contract follow-up 一式（apps/api / apps/web / packages/shared / contract test / 正本仕様 / implementation-guide / 完了タスク台帳）を、
**user の明示承認後** に commit / push し、`dev` ブランチをベースとする PR を作成して CI を確認する。
Claude は user 承認前に commit / push / PR 作成を**実行しない**（曖昧合意では実行禁止）。

---

## ルール（必須）

1. user の明示承認がない限り blocked のままにする
2. ローカルチェック（typecheck / lint / contract test / build）を省略しない
3. commit / PR / push を自動で作らない
4. PR body / commit message ともに **`Refs #297`** を採用する（`Closes #297` 禁止: Issue が CLOSED のまま運用されているため）
5. `--no-verify` での hook skip は使用しない（main 取り込み merge commit 以外）

---

## 実行タスク

1. Phase 1〜12 完了と Phase 12 7成果物 / artifacts parity を確認する
2. local-check-result.md にローカル検証ログを記録する
3. 機密情報 grep / apps/web → D1 境界 grep を実行する
4. change-summary.md を作成し、user に提示する
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
| GitHub | Issue #297 | `Refs #297` 参照のみ（reopen / close しない） |

---

## Phase 13 必須成果物（4 点）

| # | 成果物 | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-13/local-check-result.md` | typecheck / lint / contract test / build のローカル検証ログ（**最重要・最初に作成**） |
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
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS（Phase 10 で確定済）

### ステップ 2: ローカルチェック（`outputs/phase-13/local-check-result.md`）

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| contract test | `mise exec -- pnpm --filter @repo/api test:run apps/api/test/contract/admin-tags-queue-resolve.test.ts` | TC-01〜TC-06 PASS |
| 全 unit / integration test | `mise exec -- pnpm test` | exit 0 |
| build | `mise exec -- pnpm build` | exit 0 |
| indexes | `mise exec -- pnpm indexes:rebuild` | exit 0 + git diff 0 件 |
| pnpm install | `mise exec -- pnpm install --frozen-lockfile` | exit 0 |

各コマンドの実行ログ（exit code / 所要時間 / 実行日時）を `local-check-result.md` に記録する。

### ステップ 3: 機密情報 grep + 境界 grep

```bash
# 機密情報 grep（API token / OAuth / secret 値の混入確認）
git diff --cached | grep -nE "ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}" || echo "OK"
git diff --cached | grep -nE "CLOUDFLARE_API_TOKEN=[A-Za-z0-9]{16,}" || echo "OK"

# 境界 grep（apps/web から D1 binding 直参照の混入確認: 不変条件 #5）
git diff --cached --name-only | xargs rg -l "D1Database" 2>/dev/null | grep "apps/web" && echo "NG" || echo "OK"
```

### ステップ 4: change-summary 作成

`outputs/phase-13/change-summary.md` に以下を記述:

```markdown
## 変更概要

UT-07A-02 search-tags resolve API contract follow-up

- shared zod schema 新設: `packages/shared/src/schemas/admin/tag-queue-resolve.ts`
- apps/api route が shared schema を参照
- apps/web admin client `resolveTagQueue(queueId, body)` の引数型を discriminated union に追従
- 08a contract test 6 ケース追加（confirmed / rejected / idempotent / 400 / 409 / 422）
- 正本仕様（12-search-tags.md）/ api-endpoints.md / architecture-admin-api-client.md / implementation-guide を同 wave 同期

## 変更ファイル一覧（カテゴリ別）

| カテゴリ | ファイル |
| --- | --- |
| spec | docs/30-workflows/ut-07a-02-.../phase-*.md / index.md / artifacts.json |
| outputs | docs/30-workflows/ut-07a-02-.../outputs/phase-01〜13/ |
| impl | packages/shared/src/schemas/admin/tag-queue-resolve.ts / apps/api/src/routes/admin/tags/queue/resolve.ts / apps/web/src/lib/api/admin.ts |
| test | apps/api/test/contract/admin-tags-queue-resolve.test.ts |
| docs / skill sync | docs/00-getting-started-manual/specs/12-search-tags.md / .claude/skills/aiworkflow-requirements/references/api-endpoints.md / architecture-admin-api-client.md / SKILL.md / LOGS.md |
| LOGS row | docs/30-workflows/LOGS.md |

## test plan

- [ ] typecheck / lint exit 0
- [ ] contract test TC-01〜TC-06 PASS
- [ ] full test suite exit 0
- [ ] build exit 0
- [ ] indexes rebuild 0 drift
- [ ] 機密情報 grep 0 件
- [ ] apps/web → D1 binding 直参照 0 件

## Linked Issue

Refs #297（CLOSED — 再オープンしない / 参照のみ）

## Risk / 後方互換性

- 旧契約（空 body）を呼ぶ client コードは Phase 1 drift inventory で検出済 → 全て新契約に追従
- 後方互換破壊なし（apps/web 呼び出し全箇所を同 PR で更新）
- 失敗時 rollback: `dev` への merge revert で全層を一括戻し可能
```

### ステップ 5: user 承認ゲート（**必須・実行前ブロック**）

- ステップ 2〜4 の結果を user に提示
- 提示内容: `local-check-result.md` 要約 + `change-summary.md` + 変更ファイル一覧 + test plan + Risk
- user の **明示承認文言**（例: 「PR 作って良い」「approve」「OK」など曖昧でない指示）を待つ
- 承認取得まで commit / push / PR 作成は**実行禁止**

### ステップ 6: コミット粒度（user 承認後のみ）

solo dev / 一般 implementation タスクのため「spec / outputs / impl / test / docs sync / LOGS」の 6 単位を推奨。1 PR 1 commit の squash でも可。

| # | コミット message 例 | 含むファイル |
| --- | --- | --- |
| 1 | `docs(workflows): ut-07a-02 phase 1-13 specifications` | `docs/30-workflows/ut-07a-02-.../phase-*.md` / `index.md` / `artifacts.json` |
| 2 | `docs(workflows): ut-07a-02 outputs (design / runbook / evidence)` | `outputs/phase-01〜13/` |
| 3 | `feat(api): ut-07a-02 admin tag queue resolve contract follow-up` | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` / `apps/api/src/routes/admin/tags/queue/resolve.ts` |
| 4 | `feat(web): ut-07a-02 admin client resolveTagQueue discriminated union` | `apps/web/src/lib/api/admin.ts` |
| 5 | `test(api): ut-07a-02 admin tag queue resolve contract test` | `apps/api/test/contract/admin-tags-queue-resolve.test.ts` |
| 6 | `docs(skills): ut-07a-02 same-wave sync (spec / api-endpoints / admin-api-client)` | `docs/00-getting-started-manual/specs/12-search-tags.md` / `.claude/skills/aiworkflow-requirements/references/*.md` / SKILL.md / LOGS.md |
| 7 | `docs(workflows): ut-07a-02 LOGS row` | `docs/30-workflows/LOGS.md` |

```bash
git commit -m "$(cat <<'EOF'
<subject>

<body>

Refs #297

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

> `Closes #297` は使用しない。

### ステップ 7: push と PR 作成

```bash
# branch push
git push -u origin feat/ut-07a-02-search-tags-resolve-contract-followup

# PR 作成
gh pr create \
  --title "feat(ut-07a-02): search-tags resolve API contract follow-up" \
  --base dev \
  --head feat/ut-07a-02-search-tags-resolve-contract-followup \
  --body "$(cat <<'EOF'
## Summary

- shared zod schema を SSOT に admin tag queue resolve API の discriminated union 契約を 4 層（spec / api / web / test）に伝播
- 08a contract test を 6 ケース（confirmed / rejected / idempotent / 400 / 409 / 422）で網羅
- 正本仕様 ↔ implementation-guide ↔ apps/web ↔ apps/api の文字列レベル一致を Phase 12 で確定

## 変更ファイル

- packages/shared/src/schemas/admin/tag-queue-resolve.ts（新設）
- apps/api/src/routes/admin/tags/queue/resolve.ts（shared schema 参照）
- apps/web/src/lib/api/admin.ts（resolveTagQueue 引数型）
- apps/api/test/contract/admin-tags-queue-resolve.test.ts（6 ケース）
- docs/00-getting-started-manual/specs/12-search-tags.md（alias 表）
- .claude/skills/aiworkflow-requirements/references/api-endpoints.md / architecture-admin-api-client.md
- docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/

## Test plan

- [ ] typecheck / lint exit 0
- [ ] contract test TC-01〜TC-06 PASS
- [ ] build exit 0
- [ ] indexes rebuild 0 drift
- [ ] 機密情報 grep 0 件 / apps/web→D1 直参照 0 件
- [ ] user による local 動作確認（任意）

## Linked Issue

Refs #297 (CLOSED — 再オープンしない / 参照のみ)

## Risk / 後方互換性

- 後方互換破壊なし（旧契約呼び出し箇所は drift inventory で全件追従）
- 失敗時 rollback: dev merge revert で全層を一括戻し可能

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
- `mergeStateStatus` が `CLEAN` または `BEHIND`（rebase で解消）
- CI 失敗時は原因を解析し、新規 commit で修正（`--amend` 禁止）

### ステップ 9: implementation-guide コメント投稿

`/ai:diff-to-pr` が利用可能な場合は自動投稿。手動の場合は:

```bash
gh pr comment <PR番号> --body-file outputs/phase-12/implementation-guide.md
```

### ステップ 10: pr-info / pr-creation-result 記録

- `outputs/phase-13/pr-info.md`: PR URL / branch / base / merge state / CI 結果サマリ
- `outputs/phase-13/pr-creation-result.md`: 実行ログ全文 + user 承認時刻 + 各 commit hash

---

## post-merge アクション

| # | アクション | コマンド / 操作 |
| --- | --- | --- |
| 1 | 必要時 indexes 再生成 | `mise exec -- pnpm indexes:rebuild`（drift があれば追加 PR） |
| 2 | Issue #297 へ PR リンクコメント | `gh issue comment 297 --body "UT-07A-02 PR merged: <PR URL>。Issue は CLOSED のまま参照。"` |
| 3 | 完了タスク移動 | `mv docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/ docs/30-workflows/completed-tasks/` |
| 4 | 移動コミット | `git add docs/30-workflows/ && git commit -m "docs(workflows): ut-07a-02 を completed-tasks に移動"` + push |
| 5 | UT-07A-03 着手判定 | staging smoke タスクの実行可否を `docs/30-workflows/unassigned-task/` で再確認 |

---

## ローカルチェック手順表（ステップ 2 詳細）

| # | 種別 | コマンド | 期待 exit | 主証跡記録項目 |
| --- | --- | --- | --- | --- |
| 1 | install | `mise exec -- pnpm install --frozen-lockfile` | 0 | hook install 完了 |
| 2 | typecheck | `mise exec -- pnpm typecheck` | 0 | エラー件数 0 |
| 3 | lint | `mise exec -- pnpm lint` | 0 | warning / error 件数 |
| 4 | contract test | `mise exec -- pnpm --filter @repo/api test:run apps/api/test/contract/admin-tags-queue-resolve.test.ts` | 0 | TC-01〜TC-06 PASS |
| 5 | 全 test | `mise exec -- pnpm test` | 0 | 全 N/N PASS |
| 6 | build | `mise exec -- pnpm build` | 0 | apps/api / apps/web 成果物存在 |
| 7 | indexes rebuild | `mise exec -- pnpm indexes:rebuild` | 0 | git diff `.claude/skills/.../indexes/` 0 件 |
| 8 | 機密情報 grep | 上記 step 3 参照 | OK 出力 | 0 件 |
| 9 | 境界 grep | 上記 step 3 参照 | OK 出力 | 0 件 |

---

## PR テンプレート要約

| 項目 | 値 |
| --- | --- |
| title | `feat(ut-07a-02): search-tags resolve API contract follow-up` |
| base | `dev` |
| head | `feat/ut-07a-02-search-tags-resolve-contract-followup` |
| body 必須セクション | Summary / 変更ファイル / Test plan / Linked Issue (`Refs #297`) / Risk |
| Issue 参照 | `Refs #297`（**`Closes` 禁止**） |
| auto-merge | 無効（CI gate 通過後に手動 squash） |
| reviewer | 自分（solo dev / required reviews = 0） |

---

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 9 | typecheck / lint / contract test green を再走で確認 |
| Phase 12 | implementation-guide.md を PR コメントとして投稿 |
| post-merge | UT-07A-03 staging smoke の前提条件として本 PR の merge 完了を引き渡す |

---

## 多角的チェック観点

- 不変条件 #11: PR diff に member 本文編集経路が混入していないこと（境界 grep）
- 不変条件 #5: apps/web から D1 binding 直参照が混入していないこと（境界 grep）
- 機密情報: API token / OAuth / 1Password 参照値の平文混入が 0 件
- Issue ライフサイクル: `Refs #297` のみ使用し `Closes` を使わない（CLOSED 状態維持）
- main 取り込み merge: 本タスクは `dev` をベースとする feature PR のため main merge ハック不要

---

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | local-check-result.md 作成 | pending | 9 種コマンドログ |
| 2 | 機密情報 / 境界 grep | pending | 0 件確認 |
| 3 | change-summary.md 作成 | pending | user 提示用草案 |
| 4 | user 明示承認取得 | pending | 曖昧合意では実行しない |
| 5 | commit（粒度別 or squash 対応）| pending | 承認後のみ |
| 6 | push + PR 作成 | pending | base=dev / Refs #297 |
| 7 | CI 確認 | pending | 全 required PASS |
| 8 | implementation-guide コメント投稿 | pending | `/ai:diff-to-pr` または手動 |
| 9 | pr-info.md / pr-creation-result.md 記録 | pending | URL + CI + 承認時刻 |
| 10 | post-merge: Issue #297 へコメント | pending | PR リンクのみ・reopen しない |
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

- [ ] `outputs/phase-13/local-check-result.md` が 9 種コマンド全て exit 0 で記録済み
- [ ] 機密情報 grep 0 件 / 境界 grep 0 件
- [ ] `outputs/phase-13/change-summary.md` を user に提示済み
- [ ] user の **明示承認** を取得済み
- [ ] commit / push 実施済み
- [ ] `gh pr create` で PR 作成済み（base=dev / head=feat/ut-07a-02-... / `Refs #297`）
- [ ] CI 全 required status check が PASS
- [ ] implementation-guide.md を PR コメントに投稿済み
- [ ] `outputs/phase-13/pr-info.md` / `pr-creation-result.md` を記録済み
- [ ] post-merge: Issue #297 へ PR リンクコメント追加（**reopen しない**）
- [ ] post-merge: タスクディレクトリを `docs/30-workflows/completed-tasks/` に移動済み
- [ ] artifacts.json の phase 13 を completed に更新
- [ ] **本 Phase 内の全作業を 100% 完了**

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 4 必須成果物 + post-merge アクション完遂
- workflow 全 13 phase が completed
- artifacts.json の workflow_state を `completed` に更新（実装混入ありの場合）

---

## workflow 完了

Phase 13 の post-merge アクションをもって workflow `ut-07a-02-search-tags-resolve-contract-followup` は完了する。
後続 UT-07A-03 staging smoke は別 workflow として `docs/30-workflows/unassigned-task/` から起票する。

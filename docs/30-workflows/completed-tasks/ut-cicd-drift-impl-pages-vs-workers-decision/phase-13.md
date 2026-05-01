# Phase 13: PR 作成（pending_user_approval）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし（最終 Phase） |
| 状態 | **pending_user_approval** |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |
| ブランチ | `feat/issue-287-ut-cicd-drift-impl-pages-vs-workers-decision-task-spec` |

---

## ⚠️ 最重要原則

**PR は user の明示的な承認後にのみ作成すること。** Phase 12 完了をもって自動的に commit / push / PR 作成へ進んではならない。

task-specification-creator skill 規約: 「PR 作成は自動実行しない。必ずユーザーの明示的な許可を得てから実行すること。」

---

## 目的

Phase 1〜12 で生成したタスク仕様書一式（index.md / artifacts.json / phase-01.md〜phase-13.md / outputs/）を含む差分を、user 明示承認後に commit / push / PR 作成する。PR 文面では Issue #287 を CLOSED 維持のため `Closes #287` を **使わず** `Refs #287` のみ使用する。

## 事前確認（user 承認待ちの間に Claude Code が確認可能な項目）

| # | 項目 | 確認方法 |
| --- | --- | --- |
| 1 | Phase 12 完了 | artifacts.json `phases[11].status` が Phase 12 実行完了状態。workflow root は docs-only / `spec_created` 維持 |
| 2 | Phase 12 canonical 7 ファイル実在 | `ls outputs/phase-12/` で 7 ファイル確認 |
| 3 | 不変条件 #5 抵触ゼロ | `rg -n "^\[\[d1_databases\]\]" apps/web/wrangler.toml` |
| 4 | 現在ブランチ | `git branch --show-current` = `feat/issue-287-...-task-spec` |
| 5 | 未 commit 差分の範囲 | `git status --short` で `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` 内に閉じる |
| 6 | LOGS.md 2 ファイル更新済 | `git diff --stat` で確認 |
| 7 | aiworkflow-requirements 側 doc 更新済 | 同上 |

## PR 作成手順（user 承認後にのみ実行）

### Step 1: staged-task-dir-guard 確認

`scripts/hooks/staged-task-dir-guard.sh` が現ブランチ slug と staging task dir の一致を確認する。本ブランチ slug `feat/issue-287-ut-cicd-drift-impl-pages-vs-workers-decision-task-spec` に対し staging task dir は `ut-cicd-drift-impl-pages-vs-workers-decision` となるため、guard を通過する想定。

### Step 2: pre-push hook（coverage-guard）想定

本タスクは docs-only のためコード変更ゼロ。`coverage-guard` は changed-only モードで coverage 対象なしと判定し PASS する想定。失敗時も `--no-verify` は使わず原因調査。

### Step 3: commit

```bash
git add docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/ \
        .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
        .claude/skills/aiworkflow-requirements/LOGS.md \
        .claude/skills/task-specification-creator/LOGS.md \
        CLAUDE.md \
        docs/00-getting-started-manual/specs/adr/  # 新規ADR
```

> 注: 実 wrangler.toml / web-cd.yml の書き換えは別タスク（migration-001）で実施。本 PR には含めない。

コミットメッセージ例:

```
docs(ut-cicd-drift): add ADR for Pages vs Workers deploy target decision

Issue #287 を ADR として正式起票。task-specification-creator skill に従い
Phase 1-12 仕様書を生成し、deployment-cloudflare.md 判定表 / CLAUDE.md スタック表
を ADR Decision に整合させる。実 cutover 作業は task-impl-opennext-workers-migration-001
へ委譲。不変条件 #5 維持を ADR Consequences で明文化。

Refs #287
```

### Step 4: push & PR 作成

```bash
git push -u origin feat/issue-287-ut-cicd-drift-impl-pages-vs-workers-decision-task-spec
gh pr create --base main --title "docs(ut-cicd-drift): ADR for Pages vs Workers deploy target (Refs #287)" --body "$(cat <<'EOF'
## Summary
- `apps/web` の deploy target を ADR で確定（cutover / 保留 / 段階移行 のいずれか、Phase 3 で base case 確定）
- `deployment-cloudflare.md` 判定表 / `CLAUDE.md` スタック表 / `apps/web/wrangler.toml` 冒頭コメント を ADR への参照に整合
- 実 cutover 作業は別タスク（`task-impl-opennext-workers-migration-001`）へ委譲
- 不変条件 #5（apps/web に `[[d1_databases]]` を追加しない）を ADR Consequences で明文化

## Scope
- 含む: ADR 起票、判定表更新、CLAUDE.md 整合、Phase 1-12 仕様書
- 含まない: `apps/web/wrangler.toml` の Pages → Workers 書き換え、`web-cd.yml` の deploy step 切替、Cloudflare 側 project / script 切替

## Test plan
- [ ] ADR 5 セクション（Status / Context / Decision / Consequences / Related）grep 確認
- [ ] `deployment-cloudflare.md` 判定表「現状 / 将来 / 根拠リンク / 更新日」更新差分確認
- [ ] CLAUDE.md スタック表が ADR Decision と整合
- [ ] `rg -n "^\[\[d1_databases\]\]" apps/web/wrangler.toml` = 0 件（不変条件 #5）
- [ ] 関連タスク（migration-001 / UT-GOV-006）の責務分離が ADR Related に明記

Refs #287
EOF
)"
```

## レビュー観点（PR レビュー時）

| # | 観点 | 確認方法 |
| --- | --- | --- |
| 1 | 不変条件 #5 維持 | `apps/web/wrangler.toml` に `[[d1_databases]]` 追加なし |
| 2 | docs-only 純度 | 本 PR に `apps/web/wrangler.toml` / `web-cd.yml` の実書き換えが含まれていない |
| 3 | ADR 配置先妥当性 | Phase 3 軸 B 採択結果と一致 |
| 4 | base case 一貫性 | ADR Decision / 判定表 / CLAUDE.md が同じ deploy target を指す |
| 5 | 関連タスク責務分離 | ADR Related で 3 タスク（本 ADR / migration-001 / UT-GOV-006）の責務が明文化 |
| 6 | Refs vs Closes | PR 文面と commit メッセージが `Refs #287`（`Closes #287` 不在） |
| 7 | Phase 12 canonical 7 ファイル | `outputs/phase-12/` に 7 ファイル全存在 |

## 完了条件チェックリスト（user 承認後）

- [ ] user の明示承認確認済（Phase 13 の自走禁止）
- [ ] staged-task-dir-guard PASS
- [ ] pre-push coverage-guard PASS（または明示的に skip 不要）
- [ ] commit 作成（`Refs #287` のみ）
- [ ] push 完了
- [ ] PR 作成 + URL 取得
- [ ] PR 文面に Closes #287 不在
- [ ] レビュー観点 7 件が PR description に反映

## 実行タスク（user 承認後）

1. 事前確認 7 項目を改めて確認。
2. user に最終確認を求める（PR 文面ドラフトを提示し承認を得る）。
3. commit / push / PR 作成を順次実行。
4. PR URL を user に報告。
5. CI 状況を `gh pr checks` で確認し、FAIL あれば原因調査（`--no-verify` は使わない）。

## 多角的チェック観点

- **自動化禁止**: Phase 12 完了 → Phase 13 進行は **user 承認待ち**。skill 規約遵守。
- **Refs vs Closes**: Issue #287 は CLOSED 維持。`Closes` 使用は drift 再発の原因（Issue を再度 close しても reopen ループ可能性）。
- **PR スコープ純度**: 実 wrangler.toml / web-cd.yml 書き換えを混入させない。混入時は別 PR に分離。
- **branch protection 整合**: solo 運用ポリシーに従い `required_pull_request_reviews=null` のため self-merge 可能だが、CI gate / linear history / conversation resolution / no force push は維持。
- **hook 強制**: `--no-verify` 使用禁止。hook 失敗時は CLAUDE.md `sync-merge` セクション該当外のため原因調査。

## サブタスク管理（user 承認後に着手）

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | user 明示承認取得 | 13 | pending_user_approval |
| 2 | 事前確認 7 項目再走査 | 13 | pending |
| 3 | commit 作成（Refs #287） | 13 | pending |
| 4 | push | 13 | pending |
| 5 | gh pr create 実行 | 13 | pending |
| 6 | PR URL 報告 | 13 | pending |
| 7 | gh pr checks 確認 | 13 | pending |

## 成果物

PR は外部成果物（GitHub 上）。本リポジトリ内の `outputs/phase-13/` には成果物を配置しない（artifacts.json も `outputs: []`）。

| 種別 | パス | 説明 |
| --- | --- | --- |
| 外部 | GitHub PR URL | PR 作成結果（URL は user に直接報告） |
| メタ | artifacts.json | `phases[12].status` を実 PR 作成完了後に更新（user 承認後） |

## タスク 100% 実行確認【必須・user 承認後】

- user 明示承認取得済
- 事前確認 7 項目すべて PASS
- staged-task-dir-guard / coverage-guard PASS
- commit `Refs #287` 形式
- PR 作成完了（URL 取得済）
- レビュー観点 7 件が description 反映
- artifacts.json の `phases[12].status` 更新

## 注記

- Issue #287 は CLOSED 維持。本 PR で reopen / 再 close 操作はしない。
- 本タスク完了後の cutover 採択時の連動 PR（migration-001 等）は別タスクで実施し、本 PR とは分離する。
- `gh pr merge` の自動実行はしない（user の明示判断に委ねる）。

## 参照資料

- `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`

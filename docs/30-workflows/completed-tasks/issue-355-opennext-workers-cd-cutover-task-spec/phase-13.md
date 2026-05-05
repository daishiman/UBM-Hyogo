# Phase 13: 承認ゲート / PR 作成

> **【最重要 / 冒頭明記】コミット・push・PR 作成・実 deploy は本仕様書段階では一切禁止。**
> approval gate を通過するまで `git commit` / `git push` / `gh pr create` / `wrangler deploy` を Claude Code から実行しない。
> 実 PR 作成・実 deploy はユーザーの **明示的な承認** 取得後のみ。

## production 副作用ゼロ再宣言【Phase 10 / 11 / 13 重複明記】

> 本タスク（task-impl-opennext-workers-migration-001）の **spec PR**（本タスクが生成する PR）は、production 環境への mutation を一切実行しない。
> CD workflow 改修・実 deploy・custom domain 切替・Pages project deactivation・rollback drill は **実装 follow-up** の責務。
> spec PR には Phase 1-13 タスク仕様書と `outputs/` 配下の設計成果物のみ含める。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web OpenNext Workers CD cutover (task-impl-opennext-workers-migration-001) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | 承認ゲート / PR 作成 |
| 作成日 | 2026-05-02 |
| 前 Phase | 12（ドキュメント close-out） |
| 状態 | blocked（user 承認まで） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true** |
| blockedReason | ユーザー明示承認まで commit / push / PR / 実 deploy を実行しない |
| ブランチ（提案） | `feat/issue-355-opennext-workers-cd-cutover-spec` |
| ベース | `main` |
| GitHub Issue | #355（CLOSED）→ **`Refs #355` 採用 / `Closes` 禁止** |

## CLOSED Issue への対応方針【重要】

GitHub Issue #355 は既に CLOSED されている。本タスク仕様書は user 明示指示により `spec_created` で作成しているが、以下を厳守する:

- **Issue #355 を再 open しない**（CLOSED 状態を尊重）
- PR description には `Closes #355` を **書かない**（自動再 close を防止）
- 代わりに `Refs #355` を採用し、関連性のみ示す
- 実装 follow-up タスクは別 Issue で fork するか、PR description で `Refs #355` を参照のみとする

## 三役ゲート（必須）

本タスクは以下 3 ゲートを **すべて** 通過するまで PR 作成 / 実 deploy を行わない。

| ゲート | 内容 | 通過判定者 |
| --- | --- | --- |
| ゲート 1: user 承認 | spec PR 作成・push の明示的承認 | user |
| ゲート 2: 実 deploy 承認 | CD workflow merge と staging cutover 実行の明示的承認 | user（実装 follow-up での別ゲート） |
| ゲート 3: push & PR 承認 | spec PR push と PR 作成の明示的承認 | user |

> 本タスク（spec_created）はゲート 1 / ゲート 3 のみが対象。ゲート 2 は実装 follow-up 側。

## 境界

本 Phase は承認待ちで停止する。以下は禁止。

- commit
- push
- PR 作成
- production / staging 実 deploy
- Cloudflare route / custom domain mutation
- Pages project Pause / Delete 操作
- secret put / delete
- `wrangler login` 実行

## commit 粒度設計（5 単位）

approval 取得後の commit 構成案。1 commit = 1 関心事の単一責務原則に従う。

| # | commit 単位 | 含めるファイル | コミットメッセージ案 |
| --- | --- | --- | --- |
| C-1 | CD workflow（実装 follow-up で実施） | `.github/workflows/web-cd.yml` | `ci(web): switch deploy from pages to wrangler --env <stage>` |
| C-2 | wrangler.toml（実装 follow-up、変更不要なら省略） | `apps/web/wrangler.toml` | `chore(web): keep wrangler.toml in OpenNext form (no-op verification)` |
| C-3 | package.json（実装 follow-up、変更不要なら省略） | `apps/web/package.json` | `chore(web): keep build:cloudflare canonical (no-op verification)` |
| C-4 | runbook docs（**本 spec PR 範囲**） | `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/**` | `docs(workflow): add task spec for opennext workers CD cutover (Refs #355)` |
| C-5 | smoke evidence（実装 follow-up） | `outputs/phase-11/web-cd-deploy-log.md` 等 | `docs(evidence): record staging cutover smoke results (Refs #355)` |

> 本 spec PR は **C-4 のみ** を含む単一 commit が canonical。C-1 / C-2 / C-3 / C-5 は実装 follow-up PR の責務。

## PR 作成手順（approval 取得後）

### Step 1: ローカル check（本仕様書範囲）

```bash
# typecheck / lint は spec docs のみのため軽量
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git status --porcelain
git diff main...HEAD --name-only
```

### Step 2: branch / commit

```bash
git switch -c feat/issue-355-opennext-workers-cd-cutover-spec
git add docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/
git commit -m "$(cat <<'EOF'
docs(workflow): add task spec for opennext workers CD cutover

Refs #355

Phase 1-13 task specification for apps/web Pages -> Workers CD cutover.
This PR contains specification documents only; CD workflow changes and
production deploy are deferred to implementation follow-up.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Step 3: push & PR

```bash
git push -u origin feat/issue-355-opennext-workers-cd-cutover-spec
gh pr create --title "docs(workflow): apps/web OpenNext Workers CD cutover task spec (Refs #355)" \
  --body "$(cat <<'EOF'
## Summary

- apps/web の Cloudflare 配信形態を Pages → OpenNext on Workers に切替える CD cutover タスク仕様書 Phase 1-13 を追加
- spec_created（実 deploy / CD workflow 改修は実装 follow-up へ委譲）
- Refs #355（CLOSED Issue のため再 open せず関連付けのみ）

## Phase 構成

- Phase 1-3: 要件 / 技術設計 / テスト計画
- Phase 4-7: タスク分解 / 実装テンプレ / 設計レビュー / API 連携
- Phase 8-10: CI/CD ゲート / staging QA / セキュリティレビュー
- Phase 11: NON_VISUAL 受入 evidence 設計
- Phase 12: documentation close-out（strict 7 files）
- Phase 13: 承認ゲート（本 PR）

## 含まないもの

- `.github/workflows/web-cd.yml` 実改修
- `apps/web/wrangler.toml` 変更
- 実 staging / production deploy
- Cloudflare 側手動オペ（custom domain 切替 / Pages dormant 化）

## Test plan

- [ ] Phase 1 AC-1〜AC-6 が検証可能形で記載
- [ ] Phase 11 evidence E-1〜E-5 が NON_VISUAL 縮約に整合
- [ ] Phase 12 strict 7 files が `outputs/phase-12/` に配置
- [ ] outputs/artifacts.json が valid JSON
- [ ] index.md に Phase 1-13 が表で記載

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## rollback payload 上書き禁止【merge 前後分離】

| タイミング | 取り扱い |
| --- | --- |
| merge 前（spec PR） | `outputs/phase-11/rollback-readiness.md` は **placeholder** のみ。実 VERSION_ID は記載しない |
| merge 後（実装 follow-up） | staging cutover 実証時の VERSION_ID を **追記**（上書き禁止）。merge 前 placeholder を残しつつ実値を別行で追加 |
| rollback 実行時 | 実 rollback の旧/新 VERSION_ID を別 evidence ファイルに分離記録 |

> rollback 履歴の改ざんを防ぐため、placeholder と実値を **同じ行で上書きしない**。append-only。

## approval gate 構成

| gate | 入力 | 通過条件 |
| --- | --- | --- |
| gate-A: Phase 10 Design GO | Phase 10 security review が PASS | spec PR 作成可能 |
| gate-B: Phase 11 evidence 設計揃い | E-1〜E-5 配置設計済み | spec PR 作成可能 |
| gate-C: Phase 12 文書揃い | strict 7 files 配置済み | spec PR 作成可能 |
| gate-D: user 承認 | user 明示の「spec PR 作成許可」 | 実 PR 作成 |

> gate-A〜C は spec_created で機械的に判定可能。gate-D は user による明示承認のみ。

## Phase 13 Evidence

| ファイル | 状態 | 説明 |
| --- | --- | --- |
| `outputs/phase-13/local-check-result.md` | spec_created | typecheck / lint / status の結果記録 placeholder |
| `outputs/phase-13/change-summary.md` | spec_created | 変更サマリ（spec 5 ファイル + outputs 設計成果物） |
| `outputs/phase-13/pr-info.md` | spec_created | branch / base / commit message / PR title / body |
| `outputs/phase-13/pr-creation-result.md` | spec_created | PR URL / number（実行は approval 後） |
| `outputs/phase-13/approval-gate-status.md` | spec_created | gate-A〜D の状態 |

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 10 | gate-A の入力 |
| Phase 11 | gate-B の入力（E-1〜E-5 配置） |
| Phase 12 | gate-C の入力（strict 7 files） |
| 実装 follow-up | C-1 / C-2 / C-3 / C-5 commit と staging / production cutover 実行 |

## 多角的チェック観点

- 価値性: spec PR で AC-1〜AC-6 検証経路を確定
- 実現性: spec_created 範囲で 5 ファイル + outputs 設計のみ
- 整合性: CLOSED Issue への `Refs #` 採用方針が明確
- 運用性: 三役ゲート + commit 5 単位設計で実装 follow-up が独立進行可能
- Secret hygiene: PR description に Account ID / API Token を含めない

## 完了条件

- [ ] commit / push / PR / 実 deploy が **未実行** であることを明記
- [ ] CLOSED Issue (#355) への `Refs #` 採用方針が記載
- [ ] 三役ゲート（user 承認 / 実 deploy / push & PR）が記載
- [ ] commit 粒度 5 単位設計が記載
- [ ] PR 作成手順が approval 取得後の流れで記載
- [ ] rollback payload 上書き禁止（merge 前後分離）が記載
- [ ] approval gate 構成（gate-A〜D）が記載
- [ ] blocked 状態と理由が artifacts に反映予定

[実装区分: 実装仕様書]

> CONST_004 判定根拠: 本サブタスク 2a の最終成果物が Playwright `.spec.ts`（実コード）であり、Phase 13 はその実コードを `dev` ブランチへ統合する PR 作成手順を定める。docs-only ではなく **実装仕様書**。

# Phase 13: PR 作成 — サブタスク 2a 単体

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 推奨 Branch（提案） | `feat/e2e-quality-uplift-stage-2-2a` |
| Base | `dev`（CLAUDE.md「既定ブランチは dev」+ MEMORY.md） |
| 準拠 | `CLAUDE.md` § PR 作成の完全自律フロー / `.claude/commands/ai/diff-to-pr.md` |
| visualEvidence | `NON_VISUAL`（Screenshot セクション作成しない） |
| 親 phase | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-13.md` |

---

## 1. ブランチ命名（提案）

| 候補 | 採用根拠 | 状態 |
|------|---------|------|
| `feat/e2e-quality-uplift-stage-2-2a` | 親 workflow `feat/e2e-quality-uplift` + Stage 2 + サブタスク 2a を反映 | **推奨** |
| `feat/e2e-quality-uplift-stage-2` | 親 phase-13.md の `feat/e2e-quality-uplift` 系統に揃える | 代替（4 サブタスクをまとめて 1 PR にする場合） |
| `test/admin-requests-e2e` | 種別ベース | 簡潔だが Stage 2 文脈が消える |

> **最終決定は実装者に委ねる**。サブタスク 2a 単独で PR を分ける運用なら `feat/e2e-quality-uplift-stage-2-2a` を、4 サブタスク一括 PR なら `feat/e2e-quality-uplift-stage-2` を採用する。現在の作業ブランチ `feat/task-spec-e2e-stage-2` は **spec 作成専用**なので実装 PR では使用しない（spec 用 PR と実装用 PR は分離する）。

---

## 2. PR 作成手順（CLAUDE.md 自律フロー §実行順序 1-9 準拠）

| step | 操作 | 補足 |
|------|------|------|
| 1 | 現在ブランチと変更状況を確認 | `git status` / `git branch --show-current` |
| 2 | `git fetch origin dev` でリモート同期 | `pnpm sync:check` 併用可 |
| 3 | ローカル `dev` を `origin/dev` に fast-forward | `git checkout dev && git pull --ff-only` |
| 4 | 作業ブランチ（例 `feat/e2e-quality-uplift-stage-2-2a`）に戻り `dev` を merge | コンフリクト時は CLAUDE.md「コンフリクト解消の既定方針」表に従う |
| 5 | 品質検証 3 コマンド | `pnpm install --force` / `pnpm typecheck` / `pnpm lint`（最大 3 回自動修復） |
| 6 | サブタスク固有検証 | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts`（6/6 green / skip 0） |
| 7 | `git status --porcelain` 空を確認 | 未コミット差分があれば `git add -A && git commit` |
| 8 | `git diff dev...HEAD --name-only` で対象ファイル取得 | PR 本文の漏れなし確認に使用 |
| 9 | `gh pr create --base dev` で PR 作成 | base = `dev` を明示 |

> production リリース時の `dev → main` は本サブタスクの責務外。

---

## 3. コミット粒度（推奨）

| # | commit message（例） | 含まれる差分 |
|---|---------------------|-------------|
| 1 | `test(e2e): add admin-requests mutation flow with mock + race + auth (sub-task 2a)` | `apps/web/playwright/tests/admin-requests.spec.ts`（新規） |
| 2 | `docs(workflow): add Phase 11-13 spec for sub-task 2a admin-requests e2e` | `docs/30-workflows/task-spec-2a-admin-requests-e2e/phase-{11,12,13}.md` |
| 3 | `docs(workflow): add Phase 12 implementation-guide for sub-task 2a` | `outputs/phase-12/implementation-guide.md` |

> 1 commit にまとめても可。レビュー容易性を優先する場合は上記 3 分割。`Co-Authored-By` trailer はユーザーが明示的に commit を求めた時のみ付与。

---

## 4. PR タイトル（70 文字以内）

```
test(e2e): admin-requests mutation flow + race + auth (sub-task 2a)
```

文字数: 65 字。

---

## 5. PR 本文骨子

```markdown
## Summary
- `/admin/requests` の mutation flow（approve / reject + stale approve race + 3 ロール認可）を Playwright + `page.route()` mock で 6 件の e2e として追加。
- visualEvidence: `NON_VISUAL`（mock 駆動・スクリーンショット不要）。実 D1 / 実 Google API への到達 0 件。
- 親 workflow: `e2e-quality-uplift-stage-2` のサブタスク 2a 単体 PR。

## Scope
- `apps/web/playwright/tests/admin-requests.spec.ts`（新規 / 実装に応じた最小行数）
- 既存 fixture (`apps/web/playwright/fixtures/auth.ts`) の `adminPage` / `memberPage` / `anonymousPage` を再利用。新 fixture 追加なし。

## Test 構造（6 件 / skip 0）
| # | test | 主 assertion |
|---|------|-------------|
| 1 | pending list 表示 | row 3 件、pending バッジ |
| 2 | approve 成功 | POST body `{ resolution: 'approve' }`、行消失 |
| 3 | reject + reason 必須 | 空 submit で inline error → 入力後 行消失 |
| 4 | stale approve race | stale 409 mock で 2 回目 409 `already_resolved` |
| 5 | member は `/login?gate=admin_required` redirect | 認可境界 |
| 6 | anonymous は `/login` redirect | 認可境界 |

## 不変条件
- 既存 API endpoint surface のみ利用（新 endpoint・D1 schema 変更・Google Form 仕様変更なし）
- `apps/web` からの D1 直接アクセス 0 件（mock 経由のみ）
- HEX 直書き / `bg-[#xxx]` 0 件、`getByRole` / `getByLabel` 優先
- 新 fixture 追加なし、`test.skip` 0 件

## Implementation Guide
- `docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-12/implementation-guide.md`
  - Part 1: 中学生レベル概念説明（管理者・申請・approve/reject・race・認可・mock）
  - Part 2: 実装詳細（test 構造 / mock 戦略 / counter race / 認可境界 / DoD）

## Test plan
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` で 6/6 green / skip 0
- [ ] `grep -c "test\.skip" apps/web/playwright/tests/admin-requests.spec.ts` == 0
- [ ] `grep "mergedMemberId" apps/web/playwright/tests/admin-requests.spec.ts` == 0

## Phase 11 evidence
- visualEvidence: NON_VISUAL のため screenshot 添付なし
- 代替 evidence: `outputs/phase-11/playwright-report/` / `outputs/phase-11/results.json` / `outputs/phase-11/typecheck.txt` / `outputs/phase-11/lint.txt`

## Carryover (Stage 3 候補)
- focus trap / keyboard nav の Semantic 自動化
- helpers/admin-mocks.ts への mock 抽出（Phase 8）
```

> **Screenshots セクションは作らない**（visualEvidence: NON_VISUAL のため。CLAUDE.md PR 自律フロー§PR 作成前チェック「画像がない場合、PR 本文にスクリーンショット専用セクションを残さないこと」に整合）。

---

## 6. gh コマンド例

```bash
# heredoc で本文を渡す（CLAUDE.md 推奨様式）
gh pr create --base dev --title "test(e2e): admin-requests mutation flow + race + auth (sub-task 2a)" --body "$(cat <<'EOF'
## Summary
- `/admin/requests` の mutation flow（approve / reject + stale approve race + 3 ロール認可）を Playwright + `page.route()` mock で 6 件の e2e として追加。
- visualEvidence: `NON_VISUAL`（mock 駆動・スクリーンショット不要）。
- 親 workflow: `e2e-quality-uplift-stage-2` のサブタスク 2a 単体 PR。

## Scope
- `apps/web/playwright/tests/admin-requests.spec.ts`（新規 / 実装に応じた最小行数）

## Test plan
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` で 6/6 green

## Phase 11 evidence
- visualEvidence: NON_VISUAL のため screenshot 添付なし
- 代替: outputs/phase-11/playwright-report/ / results.json / typecheck.txt / lint.txt

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

> `Co-Authored-By` trailer はユーザーが明示的に commit を求めた時のみ付与（CLAUDE.md ルール）。本 PR 本文では commit ではないため `🤖 Generated with` フッターのみ。

---

## 7. PR 作成前チェック（CLAUDE.md §PR 作成前チェックに整合）

| # | 項目 | 期待 |
|---|------|------|
| 1 | `git status --porcelain` 空 | OK |
| 2 | `git diff dev...HEAD --name-only` で `admin-requests.spec.ts` + Phase 11/12/13 docs を網羅 | OK |
| 3 | `outputs/phase-12/implementation-guide.md` の Part 1/2 主要見出しが PR 本文に反映 | OK |
| 4 | `outputs/phase-11/` 配下の `png/jpg/jpeg/gif/webp` 数 == PR 本文の画像参照数 == 0 | OK（NON_VISUAL） |
| 5 | scope 外ファイル変更（D1 schema / 新 endpoint / 新 fixture）なし | OK |

---

## 8. solo dev レビューポリシー

| 観点 | 設定 |
|------|------|
| required reviews | 0（CLAUDE.md branch 戦略） |
| required status checks | typecheck / lint / vitest / playwright / verify-design-tokens 等 |
| linear history | required |
| force-push | 禁止（main / dev） |

---

## 9. 最終レポート様式（PR 作成後）

| 項目 | 内容 |
|------|------|
| PR URL | (実行時に記録) |
| 採用ブランチ | `feat/e2e-quality-uplift-stage-2-2a` → `dev`（または実装者が選定したブランチ） |
| 自動修復 | (実行時に記録：typecheck/lint 失敗時の修復差分) |
| 解消したコンフリクト | (実行時に記録) |
| Phase 11 evidence | NON_VISUAL（playwright-report / results.json / typecheck.txt / lint.txt） |
| 残課題 | focus trap 自動化 / mock helper 抽出（Stage 3 候補） |

---

## 10. Phase 13 完了定義

- [x] PR 手順が CLAUDE.md 自律フロー §実行順序 1-9 に準拠
- [x] base = `dev` を明示（main 直行禁止）
- [x] 推奨ブランチ名を提案、最終決定は実装者に委ねる旨を注記
- [x] PR タイトル 70 文字以内
- [x] PR 本文骨子に Summary / Scope / Test 構造 / 不変条件 / Implementation Guide 参照 / Test plan / Phase 11 evidence を網羅
- [x] **Screenshots セクションを作らない方針**を明記（NON_VISUAL）
- [x] gh コマンド例を heredoc 様式で提示
- [x] PR 作成前チェック 5 件
- [x] solo dev レビューポリシー
- [x] 最終レポート様式

> Stage 2 サブタスク 2a の Phase 11-13 仕様書一式完了。

---

## 参照

| 用途 | path |
|------|------|
| 主入力 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 親 Phase 13 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-13.md` |
| PR 自律フロー | `CLAUDE.md` § PR 作成の完全自律フロー |
| diff-to-pr 規定 | `.claude/commands/ai/diff-to-pr.md`（存在時） |

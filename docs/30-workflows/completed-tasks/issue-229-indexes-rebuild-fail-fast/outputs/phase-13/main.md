# Phase 13 成果物 — PR 作成（PR 本文案・承認待ち）

> **commit / push / PR 作成はユーザー明示承認後にのみ実行する。** 本ファイルは PR 準備（本文案 + 差分サマリー）に閉じる。base ブランチは `dev`。

## 1. 承認状態

| 項目 | 状態 |
| --- | --- |
| Phase 13 状態 | pending_user_approval |
| commit | 未実行（承認待ち） |
| push | 未実行（承認待ち） |
| PR 作成 | 未実行（承認待ち） |
| base ブランチ | dev（production リリース時のみ main） |
| Issue #229 | CLOSED 維持（reopen しない） |

## 2. PR 種別と境界

| 範囲 | 本 PR | 後続 PR |
| --- | --- | --- |
| 仕様書整備（Phase 1〜13・docs のみ） | ✓ 本 PR | — |
| 実コード hardening（`generate-index.js` 編集） | — | 今回の実装サイクル |
| 新規 spec test（`scripts/__tests__/generate-index-fail-fast.spec.ts`） | — | 今回の実装サイクル |

> 本変更は workflow docs と generate-index.js hardening と回帰 spec test を含む implemented_local_evidence_captured PR。ローカル実装完了を主張し、commit / push / PR 作成のみユーザー承認待ちとする。

## 3. PR 本文案（ドラフト）

### タイトル

```
docs(issue-229): pnpm indexes:rebuild fail-fast / atomic write / decisive log タスク仕様書整備
```

### 本文

```
## 概要

issue #229「pnpm indexes:rebuild の非ゼロ exit 保証」を最新コードへ写像した実装仕様書
（Phase 1〜13）を整備し、`generate-index.js` hardening と回帰 spec test を同梱する。
Issue #229 は CLOSED のまま（reopen しない）。

## スコープ

- 対象: docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/ 配下のみ
- 含まない: generate-index.js の実編集 / 新規 spec test の実コード（今回サイクル）

## AC（仕様書での定義）

- AC-1: 生成途中 throw で必ず非ゼロ exit
- AC-2: atomic write（tmp → 全成功後 rename、途中失敗で tmp 全削除・部分書き込みなし）
- AC-3: decisive log（[generate-index] <skill> / <index-file> <step> 失敗: <message>）
- AC-4: 既存 hook / CI 回帰維持 + 出力 byte-identical（drift 0）
- AC-5: extractHeadings silent catch を ENOENT 継続 / その他 throw に分離
- AC-6: scope 再最適化（単一 skill 経路 / task-spec-creator は scope 外）を index.md に明記
- AC-7: 回帰 spec test scripts/__tests__/generate-index-fail-fast.spec.ts（PASS）
- AC-8: 4 条件（価値性 / 実現性 / 整合性 / 運用性）PASS

## 実装サイクルでの検証計画（本 PR では未実走）

- mise exec -- pnpm typecheck
- mise exec -- pnpm lint
- mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts
- mise exec -- pnpm indexes:rebuild → git diff 0（byte-identical / drift 0）

## 残リスク

- rename atomicity は同一 FS 前提（tmp を indexes/ 同一 dir へ置いて回避）
- byte-identical 維持（出力文字列・JSON シリアライズを不変、書き込み経路のみ atomic 化）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. 差分サマリー（PR 確定時に取得）

承認後、以下を取得して PR 本文の漏れなし確認とする。

```bash
git status --short
git diff dev...HEAD --name-only
git diff --stat
```

想定差分: `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/` 配下のみ（apps/ / .claude/skills/ / scripts/ は非接触）。

## 5. 承認後の実行手順（ユーザー承認後のみ）

```bash
# 1. 作業ブランチ作成（dev 直上の場合）
git switch -c docs/issue-229-indexes-rebuild-fail-fast-spec

# 2. dev 同期
git fetch origin dev
git switch dev && git merge --ff-only origin/dev
git switch docs/issue-229-indexes-rebuild-fail-fast-spec
git merge dev

# 3. commit
git add docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast
git commit  # Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

# 4. push + PR（base=dev）
git push -u origin HEAD
gh pr create --base dev --title "..." --body "..."
```

## 6. 完了条件

- [x] PR 本文案が作成されている
- [x] ユーザー承認前に commit / push / PR 作成を実行していない
- [x] Phase 13 の承認待ち状態が明記されている
- [x] base=dev / Issue #229 CLOSED 維持が明記されている

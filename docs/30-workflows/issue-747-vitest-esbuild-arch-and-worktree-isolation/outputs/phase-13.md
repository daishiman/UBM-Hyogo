# Phase 13: Commit / PR / 承認ゲート

## 13.1 ステータス

`blocked_pending_user_approval`

本 Phase はユーザー明示承認後にのみ実行する。AI は本仕様書の段階では commit / push / PR を作成しない。

## 13.2 承認ゲート（G1〜G3）

| Gate | 内容 | 承認形式 |
| --- | --- | --- |
| G1 | ローカル全 AC（AC-1〜11）exit 0 を確認 | ユーザーが evidence を確認後「commit OK」と明示 |
| G2 | commit 作成 + push | ユーザーが「push OK」と明示 |
| G3 | PR 作成（base: `dev`） | ユーザーが「PR OK」と明示 |

> G1〜G3 をまとめて 1 度の承認で済ますことは **禁止**（governance: 段階承認）。

## 13.3 commit 構成案

| commit | 内容 |
| --- | --- |
| 1 | `feat(verify): add esbuild arch/isolation/version verifiers` (3 scripts + package.json) |
| 2 | `chore(hooks): wire verify-esbuild into lefthook pre-push` |
| 3 | `ci: add verify-esbuild workflow (ubuntu + macos-14 matrix)` |
| 4 | `chore(mise): add postinstall arch verifier hook` |
| 5 | `docs(workflows): add issue-747 runbook and consume legacy spec (Refs #747)` |

各 commit は trailer に `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` を含める。

## 13.4 PR title 案

```
fix(test-env): resolve Vitest esbuild arch + worktree isolation (Refs #747)
```

## 13.5 PR body 必須項目

- Summary（真因 3 層と対策 3 verify + 2 gate）
- Test plan（Phase 8 AC を checklist 化）
- Evidence URL（Phase 11 evidence + CI run URL）
- Refs #747（issue は CLOSED 維持、reopen しない）

## 13.6 完了条件（Phase 13）

- G1〜G3 通過後、PR URL がユーザーへ報告される
- CI `verify-esbuild` の ubuntu / macos-14 両 job が緑
- 既存 required status checks が緑のまま

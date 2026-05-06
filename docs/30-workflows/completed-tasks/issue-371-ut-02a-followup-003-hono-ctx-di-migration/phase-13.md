# Phase 13: commit / PR 承認ゲート

実装区分: 実装仕様書

## 13.1 ゲート構成

本タスクは spec → 実装 → PR の流れであり、**spec フェーズ（本ドキュメント群）と 実装フェーズ（03.実装.md）を分離**する。
本 Phase 13 は実装フェーズ完了後に発火する。

| Gate | 対象 | 承認者 | 内容 |
| --- | --- | --- | --- |
| G1 | spec PR | ユーザー | 本タスク仕様書一式（docs/30-workflows/issue-371-...）の PR |
| G2 | code PR | ユーザー | 実装 PR（apps/api/src/middleware + builder + routes + tests + outputs/phase-11/12） |

G1 / G2 は分離可能（spec を先に merge してから実装 PR を起こす運用も可）。
ただし solo dev のため、両者を 1 PR に束ねてもよい。その場合は PR description で「spec + code」を明示する。

## 13.2 PR 作成前チェックリスト

- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` が exit 0
- [ ] `pnpm --filter @ubm-hyogo/api test` 全 PASS、新規テスト T1-T8 含む
- [ ] Phase 9 grep gate G1〜G5 全 PASS
- [ ] Phase 11 evidence (E1-E5) が `outputs/phase-11/evidence/` に存在
- [ ] Phase 12 7 ファイルが `outputs/phase-12/` に存在
- [ ] `git status --porcelain` が空（全変更コミット済み）
- [ ] `git diff main...HEAD --name-only` で意図しないファイルが含まれていない

## 13.3 推奨ブランチ・PR タイトル

```
branch: feat/issue-371-hono-ctx-repository-provider-migration
title:  feat(api): migrate repository provider DI to Hono ctx (issue-371)
```

PR body には以下を含める:

- 概要: builder の `deps?` 経路を `c.var.attendanceProvider` 経路へ移行
- 動機: ut-02a Phase 12 で起票された followup-003 の解消（issue #371、closed）
- 主要変更: middleware 新設 / builder シグネチャ縮小 / fallback throw 化
- テスト: T1-T8 追加、既存 regression なし
- ADR: `docs/30-workflows/issue-371-.../outputs/phase-03/adr-di-strategy.md`
- スクリーンショット: なし（NON_VISUAL）
- close 関係: `Refs #371`（既に closed のため `Closes #371` ではなく `Refs` を使用）

## 13.4 Issue 連携（CLOSED issue への扱い）

Issue #371 は既に CLOSED である。本 PR で再 open はせず、以下のとおり trace を残す:

- PR body に `Refs #371` を含める（GitHub は closed issue へも cross-reference を付ける）
- 必要に応じて `gh issue comment 371 --body "spec + code merged via PR #<n>"` で comment を残す（ユーザー判断）

## 13.5 実行禁止事項（本 spec 作成プロンプト範囲）

本 spec 作成プロンプトでは以下を **絶対に実行しない**:

- `git commit`（spec ファイル commit はユーザー指示時のみ）
- `git push`
- `gh pr create`
- Issue の re-open / comment

ユーザー指示があった場合のみ、CLAUDE.md の「PR作成の完全自律フロー」に沿って実行する。

## 13.6 完了条件

- 13.2 チェックリスト全 ✅
- ユーザーが G1 / G2 を承認
- PR が作成され URL が記録されている

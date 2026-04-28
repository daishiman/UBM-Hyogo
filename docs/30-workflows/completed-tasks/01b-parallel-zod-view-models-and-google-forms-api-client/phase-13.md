# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 13 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 12 (ドキュメント更新) |
| 下流 Phase | （Wave 2 a/b/c 着手可能 / Wave 3 a/b 着手可能） |
| 状態 | pending（user approval 必須） |

## 目的

ユーザー承認後に PR を作成。

## ⚠️ Approval Gate

**user 承認なしに実行禁止**。

## 実行タスク

1. local-check
2. change-summary
3. PR template
4. user 承認
5. gh pr create
6. outputs

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/documentation-changelog.md | 変更点 |
| 必須 | outputs/phase-12/implementation-guide.md | レビュー観点 |
| 必須 | CLAUDE.md | branch 戦略 |

## 実行手順

```bash
pnpm -w typecheck && pnpm -w lint && pnpm -w test
git status
git diff --stat
gh pr create --base dev --head feature/02-app-impl-01b-zod-and-forms-client \
  --title "feat(app/01b): shared types/zod + Google Forms API client" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| Wave 2 | この PR が dev に入り次第着手 |
| Wave 3 | この PR が dev に入り次第着手 |

## 多角的チェック観点（不変条件参照）

- PR description に不変条件 #1, #2, #3, #5, #6, #7 を明記

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1〜6 | 上記 | 13 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-13/main.md |
| ドキュメント | outputs/phase-13/pr-template.md |
| evidence | outputs/phase-13/local-check.log |
| メタ | artifacts.json |

## 完了条件

- [ ] user 承認
- [ ] PR URL 記録

## タスク 100% 実行確認【必須】

- [ ] 全 6 サブタスク completed
- [ ] PR URL artifacts.json
- [ ] **user 承認**

## 次 Phase

- なし（タスク完了）
- 引き継ぎ: Wave 2 a/b/c, Wave 3 a/b, Wave 4 a/b/c, Wave 5 a/b, Wave 6 a/b/c

## PR Template

```markdown
## Summary
- packages/shared に 4 層型（schema / response / identity / viewmodel 10 種）+ branded 7 種 + zod schema 配置
- packages/integrations/google に Forms API クライアント（getForm / listResponses + service account auth + backoff）
- ESLint boundary rule で `apps/web → integrations/google` を import 禁止

## Changes
- doc/02-application-implementation/01b-parallel-... 15 ファイル
- 実装コード: なし（spec_created）

## Invariants
- #1 schema 抽象（FormSchema を generic struct 化）
- #2 consent キー統一（normalizer で publicConsent / rulesConsent 強制）
- #3 responseEmail system field（response 層独立）
- #5 apps/web → integrations/google 禁止（ESLint）
- #6 GAS prototype field 0 件
- #7 MemberId / ResponseId branded distinct

## Test Plan
- [ ] outputs/phase-04/test-strategy.md の 4 軸確認
- [ ] outputs/phase-09/free-tier-estimate.md secret hygiene 確認
- [ ] outputs/phase-11/ evidence 確認

## Downstream Unblocked
- Wave 2 (02a/02b/02c repository)
- Wave 3 (03a/03b sync)
- Wave 4 (04a/04b/04c API endpoints)
- Wave 5 (05a/05b auth)
- Wave 6 (06a/06b/06c pages)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

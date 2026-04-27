# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 13 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 12 (ドキュメント更新) |
| 下流 Phase | （Wave 2 a/b/c 着手可能） |
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
wrangler d1 migrations apply ubm-hyogo-db-staging --local
git status
git diff --stat
gh pr create --base dev --head feature/02-app-impl-01a-d1-migrations \
  --title "feat(app/01a): D1 migrations + tag_definitions seed" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| Wave 2 | この PR が dev に入り次第着手 |

## 多角的チェック観点（不変条件参照）

- PR description に不変条件 #1, #2, #3, #4, #5, #7, #10, #15 を明記

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1〜6 | 上記 | 13 | completed |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-13/main.md |
| ドキュメント | outputs/phase-13/pr-template.md |
| evidence | outputs/phase-13/local-check.log |
| evidence | outputs/phase-13/migrations-apply.log |
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
- 引き継ぎ: Wave 2 a/b/c

## PR Template

```markdown
## Summary
- D1 migrations 4 本（init / admin_managed / auth_support / seed_tags）
- 20 physical tables + 1 view + 7 INDEX + tag_definitions 6 カテゴリ × 41 行 seed
- `apps/api/wrangler.toml` の `[[d1_databases]]` binding 確定
- 無料枠（5GB / 500k reads / 100k writes）試算で全枠 < 1% 使用

## Changes
- docs/30-workflows/01a-parallel-d1-database-schema-migrations-and-tag-seed 15 ファイル
- 実装コード: apps/api/migrations/ と apps/api/wrangler.toml 更新済み

## Invariants
- #1 schema_questions に stable_key column
- #2 public_consent / rules_consent
- #3 response_email column
- #4 profile_overrides 不在
- #5 apps/web に D1 binding なし
- #7 response_id / member_id 別 PK
- #10 無料枠余裕
- #15 member_attendance PRIMARY KEY

## Test Plan
- [ ] outputs/phase-04/migration-tests.md の 5 軸確認
- [ ] outputs/phase-09/free-tier-estimate.md 試算確認
- [ ] outputs/phase-11/ evidence 確認

## Downstream Unblocked
- Wave 2 (02a/02b/02c repository)
- Wave 3 (03a/03b sync)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終） |
| 状態 | pending（ユーザー承認後に実行） |

## 目的

公開 4 ルート実装の PR を `feature/* → dev → main` の戦略に沿って作成し、6 種ドキュメントと AC を description に貼る。**承認 gate（user explicit yes）に達するまで実行しない**。

## 実行タスク

1. approval gate
2. branch / commit
3. PR description
4. labels / reviewers
5. merge 戦略

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC |
| 必須 | outputs/phase-09/main.md | 品質 |
| 必須 | outputs/phase-10/main.md | GO 判定 |
| 必須 | outputs/phase-11/main.md | smoke evidence |
| 必須 | outputs/phase-12/ | 6 種ドキュメント |
| 参考 | CLAUDE.md | branch 戦略 |

## 実行手順

### ステップ 1: approval gate

- 本 phase は user explicit yes が無ければ実行しない（CLAUDE.md commit 規約）
- AC-1〜AC-12 の green が前提（条件付き green は上流確定後）
- blocker B-01 / B-02 が解消済みであること

### ステップ 2: branch / commit

| 項目 | 値 |
| --- | --- |
| branch | `feature/06a-public-landing-directory-and-registration-pages` |
| base | `dev` |
| commit 規約 | conventional commits（`feat(web/public): …`） |
| Co-Authored-By | `Claude Opus 4.7 <noreply@anthropic.com>` |

### ステップ 3: PR description（テンプレート）

```md
## Summary
- `/`, `/members`, `/members/[id]`, `/register` の 4 公開ルートを Next.js App Router + `@opennextjs/cloudflare` で実装
- URL query 正本（`q/zone/status/tag/sort/density`）+ stableKey 参照 + window.UBM 不採用
- 04a public API 4 endpoint を fetch（D1 は apps/api に閉じる）

## Linked specs
- doc/00-getting-started-manual/specs/05-pages.md
- doc/00-getting-started-manual/specs/09-ui-ux.md
- doc/00-getting-started-manual/specs/12-search-tags.md
- doc/00-getting-started-manual/specs/16-component-library.md

## AC
- AC-1〜AC-12 完全トレース → outputs/phase-07/ac-matrix.md

## Test
- typecheck / lint / unit / contract / E2E / a11y / secret scan: pass
- manual smoke M-01〜M-09: outputs/phase-11/main.md

## Free tier
- Workers req 5,000 / day（無料枠 100,000 / day）
- D1 reads 10,000 / day（無料枠 5,000,000 / day）

## Documents
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## Invariants
- #1 stableKey only / #5 D1 only via apps/api / #6 no window.UBM / #8 URL query as source of truth / #9 no /no-access / #10 free-tier safe

## Test plan
- [ ] CI green
- [ ] dev deploy で /members?density=list が 200
- [ ] /register が responderUrl にリンク
```

### ステップ 4: labels / reviewers

| 種別 | 値 |
| --- | --- |
| labels | `area/web`, `wave-6`, `parallel`, `public` |
| reviewers | dev: 1 名 |
| reviewers | main: 2 名（CLAUDE.md より） |

### ステップ 5: merge 戦略

| 項目 | 値 |
| --- | --- |
| dev merge | `Squash and merge` |
| main merge | `Create a merge commit`（履歴保全） |
| 自動デプロイ | dev → Cloudflare staging / main → production |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 09a | staging deploy 確認 |
| 09b | production deploy 確認 |

## 多角的チェック観点

- 不変条件 #1: PR description に明示
- 不変条件 #5: PR description に明示
- 不変条件 #6: PR description に明示
- 不変条件 #8: PR description に明示
- 不変条件 #9: PR description に明示
- 不変条件 #10: PR description に明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | approval gate | 13 | pending | user yes |
| 2 | branch / commit | 13 | pending | feature/06a-* |
| 3 | PR description | 13 | pending | テンプレ準拠 |
| 4 | labels / reviewers | 13 | pending | dev:1 / main:2 |
| 5 | merge 戦略 | 13 | pending | squash → merge |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR メタ + URL |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] approval gate 通過
- [ ] PR が dev に open
- [ ] description に AC + 6 種ドキュメント link 含む
- [ ] CI green

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- PR URL を outputs/phase-13/main.md に記録
- 不変条件 #1, #5, #6, #8, #9, #10 への対応が PR に明示
- merge 後の dev staging 確認は 09a へ引継ぎ

## 次 Phase

- 次: なし（最終）
- 引き継ぎ事項: PR URL を後続 Wave に共有
- ブロック条件: approval gate 未通過

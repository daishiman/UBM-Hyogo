# Phase 13: PR 作成（ユーザー承認 gate）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋ドキュメント作成 task）

## ユーザー承認確認文（冒頭必須）

- 本 Phase は **ユーザーの明示承認がある場合のみ** 実行する。
- 明示許可なしでの `git push` / PR 作成は禁止。
- 承認待ちの間、root `metadata.workflow_state` は `spec_created` 据え置き（`blocked_until_user_approval` 相当として扱う）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成（ユーザー承認 gate） |
| 作成日 | 2026-05-07 |
| 前 Phase | 12（ドキュメンテーション 6 必須タスク） |
| 次 Phase | なし |
| 状態 | blocked_pending_user_approval |
| タスク種別 | docs-only / NON_VISUAL |
| implementation_mode | docs |
| user_approval_required | **true** |
| workflow_state | spec_created 据え置き（PR merge 後も task-10 完了まで維持） |

## 目的

Phase 12 までの成果物（09c-primitives.md + workflow package）をブランチ戦略に従い PR 化し、CI gate（markdown lint / verify-indexes 等）を通過させた上で merge する。実装（task-10）は本 PR の責務外。

## ブランチ戦略（CLAUDE.md 準拠）

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

| ブランチ | 環境 | レビュー（solo dev） |
| --- | --- | --- |
| `feature/*` | localhost | 不要 |
| `dev` | Cloudflare staging | CI gate のみ（required reviews=null） |
| `main` | Cloudflare production | CI gate + 履歴保護のみ（required reviews=null） |

本 task は docs-only。worktree のブランチ（例: `feat/task-19-primitives-full-spec`）から `main` へ直接 PR を出す（本リポジトリの ui-prototype-alignment workflow が main 直 PR 運用のため）。

## 変更対象（diff scope 規律）

本 PR の `git diff --name-only main...HEAD` は **以下のみで構成されること**:

| 区分 | path | 概要 |
| --- | --- | --- |
| C（新規） | `docs/00-getting-started-manual/specs/09c-primitives.md` | primitive 完全仕様（600〜1200 行） |
| C（新規） | `docs/30-workflows/task-19-w2-primitives-full-spec/phase-{01..13}.md` | workflow phase 仕様書 |
| C（新規） | `docs/30-workflows/task-19-w2-primitives-full-spec/index.md` | workflow index |
| C（新規） | `docs/30-workflows/task-19-w2-primitives-full-spec/artifacts.json` | workflow メタ |
| C（新規） | `docs/30-workflows/task-19-w2-primitives-full-spec/outputs/**` | 各 phase の成果物 |

範囲外（`apps/`, `scripts/`, `.claude/skills/`, `09-ui-ux.md` 等）に diff が混入していないことを以下コマンドで確認:

```bash
git diff --name-only main...HEAD | sort
git diff --name-only main...HEAD | grep -vE '^(docs/00-getting-started-manual/specs/09c-primitives\.md$|docs/30-workflows/task-19-w2-primitives-full-spec/)' && echo "範囲外混入: NG" || echo "範囲外混入: なし"
```

範囲外混入があれば `git checkout HEAD -- <path>` または `git restore --source=main <path>` で復旧してから commit する（SCOPE.md §6 / archive rule 遵守）。

## 実行タスク

- ユーザー明示承認の取得
- diff scope 検証（変更対象表 5 区分のみであること）
- 変更サマリー生成
- PR タイトル / body の作成
- CI gate 通過（markdown lint / verify-indexes / verify-design-tokens 等）
- close-out チェックリストの達成

## PR タイトル / body 雛形

| 項目 | 内容 |
| --- | --- |
| title | `docs(specs): add 09c-primitives.md (task-19 primitives-full-spec)` |
| base | `main` |
| head | `feat/task-19-primitives-full-spec`（実 worktree branch 名） |

PR body テンプレ:

```
## Summary
- 17 primitive + §99 不採用の完全仕様書 `docs/00-getting-started-manual/specs/09c-primitives.md` を新規追加（600〜1200 行）
- task-19 workflow package（phase-01..13 + outputs）を同梱
- 実装は task-10 ui-primitives で別 PR として実施（本 PR は contract-only）

## Changes
- C: `docs/00-getting-started-manual/specs/09c-primitives.md`
- C: `docs/30-workflows/task-19-w2-primitives-full-spec/**`

## Evidence
- Phase 11 grep gate: HEX / oklch / px / `bg-[` すべて 0 件（`outputs/phase-11/evidence/grep-gate.log`）
- Phase 11 markdown lint: error 0（`outputs/phase-11/evidence/markdown-lint.log`）
- Phase 11 heading 数: §1〜§18 + §99 + JSX block 17+（`outputs/phase-11/evidence/heading-count.log`）

## Test plan
- [ ] CI: markdown lint pass
- [ ] CI: verify-indexes pass
- [ ] CI: verify-design-tokens pass（09c に HEX / oklch / px / `bg-[` 0 件）
- [ ] diff scope: 09c + workflow package 配下のみ

## Risks / Rollback
- docs-only / contract-only。rollback は revert PR で対応。
- workflow_state: `spec_created` 据え置き（task-10 完了時に completed 昇格）。
```

## CI gate チェック項目

- markdown lint（`pnpm lint:md`）
- `verify-indexes`（`.github/workflows/verify-indexes.yml`）
- `verify-design-tokens`（task-18 / 09c の grep gate を再実行）
- `pnpm exec vitest run apps/api/src/repository/__tests__/identity-conflict.test.ts apps/api/src/routes/admin/identity-conflicts.test.ts`（隣接 apps/api diff の focused verification）
- `pnpm lint`（同上）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md | ブランチ戦略 / diff scope 規律 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | §6 diff scope 規律 / archive rule |
| 必須 | outputs/phase-12/documentation-changelog.md | PR body 反映元 |
| 必須 | outputs/phase-11/evidence/*.log | PR Evidence セクション |
| 参考 | .claude/commands/ai/diff-to-pr.md | PR 自律フロー |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | 6 成果物を PR body / 添付に同梱 |
| Phase 11 | 3 evidence の link を PR body に貼る |
| task-10 | merge 後、task-10 着手の green light を出す |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認取得 | 13 | pending | 明示承認必須 |
| 2 | diff scope 検証 | 13 | pending | 5 区分のみ |
| 3 | branch push | 13 | pending | feat/task-19-primitives-full-spec |
| 4 | PR 作成 | 13 | pending | base=main |
| 5 | CI gate 通過確認 | 13 | pending | markdown lint / verify-indexes / verify-design-tokens |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| ドキュメント | outputs/phase-13/local-check-result.md | CI / lint ローカル結果 |
| ドキュメント | outputs/phase-13/diff-scope-verification.md | diff scope 5 区分のみ確認ログ |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- [ ] ユーザー明示承認済み
- [ ] `git diff --name-only main...HEAD` が変更対象表 5 区分のみで構成
- [ ] PR が `main` に向けて作成され CI gate 全 PASS
- [ ] markdown lint / verify-indexes / verify-design-tokens すべて PASS
- [ ] PR body に Phase 11 evidence link / Phase 12 6 成果物が反映済み
- [ ] root `metadata.workflow_state = spec_created` 据え置き

## close-out チェックリスト

- [ ] ユーザー承認あり
- [ ] outputs/phase-13/local-check-result.md がある
- [ ] outputs/phase-13/change-summary.md がある
- [ ] outputs/phase-13/diff-scope-verification.md がある
- [ ] Phase 12 close-out 済み
- [ ] CI 全 PASS
- [ ] PR URL を `outputs/phase-13/change-summary.md` に記録

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の該当 phase を completed に更新（**root workflow_state は spec_created 維持**）

## 次 Phase

- 次: なし（task-19 は本 PR merge で contract closure）
- 引き継ぎ事項: task-10（ui-primitives 実装）に green light を出す。task-06 / 07 / 08 / 20 / 21 / 22 に 09c の確定を共有。
- ブロック条件: ユーザー承認・CI gate 未完了の場合は merge を行わない。

## 失敗時の戻り先（逆引き表）

| 問題 | 戻り先 |
| --- | --- |
| diff scope 範囲外混入 | Phase 12（commit を分割し、範囲外 path を `git restore`） |
| markdown lint error | Phase 11 → Phase 6（09c 本文修正） |
| verify-design-tokens fail | Phase 11 → Phase 6（HEX / oklch / px / `bg-[` を 0 件化） |
| verify-indexes fail | `pnpm indexes:rebuild` 実行後 commit 追加 |
| ユーザー承認未取得 | 本 Phase pending のまま据え置き |

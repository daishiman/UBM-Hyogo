# Phase 13: PR 作成 — ut-web-cov-01-admin-components-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 13 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5〜12 の成果物を 1 本の PR に集約し、`main` 向けに作成する。CI green を確認するまでを Phase 13 のスコープとする。

> 本仕様書は PR 作成の手順を仕様化するのみで、本プロンプト実行内では PR を作成しない。

## 変更対象ファイルと変更種別

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-13/main.md` | 新規 | PR URL、CI 状態、最終チェックリスト |
| `outputs/phase-13/pr-body.md` | 新規 | `gh pr create --body-file` で利用する PR 本文 |

> production code / test の変更はこの Phase で発生しない。発生する場合は Phase 5〜9 へ差し戻す。

## ブランチ命名

- 推奨: `feat/ut-web-cov-01-admin-components-coverage`
- 注意: 現行 worktree のブランチは `feat/03b-followup-001-email-conflict-identity-merge` で当タスクと不一致。Phase 13 実行前に下記いずれかを選択:
  1. 当該変更分を新規ブランチ `feat/ut-web-cov-01-admin-components-coverage` へ cherry-pick する
  2. ut-web-cov-01 の変更のみを含む新ワークツリーを作成し、そこから PR を起票
- いずれを選択しても PR の base は `main`、squash merge を前提とする。

## PR タイトル

```
test(web/admin): cover MembersClient/TagQueuePanel/AdminSidebar plus 4 panels to ≥85% lines
```

## PR 本文構成（pr-body.md テンプレート）

```markdown
## Summary
- admin component 7 ファイル (MembersClient / TagQueuePanel / AdminSidebar / SchemaDiffPanel / MemberDrawer / MeetingPanel / AuditLogPanel) に Vitest UT を追加・補強し、Stmts/Lines/Funcs ≥85% / Branches ≥80% を達成。
- 共通 DRY ヘルパは作成せず、component ごとの fixture / mock reset を test file 内に局所化。production code は変更しない。
- 既存 web spec に regression なし。NON_VISUAL タスクのため screenshot は添付しない。

## Coverage 改善表
| File | Before (L/B) | After (L/B) |
| --- | --- | --- |
| MembersClient.tsx | 0 / 0 | ≥85 / ≥80 |
| TagQueuePanel.tsx | 0 / 0 | 100 / 96.15 |
| AdminSidebar.tsx | 0 / 0 | ≥85 / ≥80 |
| SchemaDiffPanel.tsx | 58.62 / 38.46 | ≥85 / ≥80 |
| MemberDrawer.tsx | 63.68 / 50 | ≥85 / ≥80 |
| MeetingPanel.tsx | 66.44 / 33.33 | ≥85 / ≥80 |
| AuditLogPanel.tsx | 98.5 / 74.19 | ≥85 / ≥80 |

## AC マトリクス
（Phase 10 の AC matrix をそのまま転記）

## Evidence
- Vitest log: `docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/vitest-run.log`
- coverage snapshot: `docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/coverage-summary.snapshot.json`
- target files: `docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/coverage-target-files.txt`

## Test plan
- [ ] `pnpm --filter @ubm-hyogo/web typecheck`
- [ ] `pnpm --filter @ubm-hyogo/web lint`
- [x] `pnpm --filter @ubm-hyogo/web test:coverage`（21 files / 196 tests PASS）
- [ ] CI 全 job green
```

## PR 作成コマンド（Phase 13 実行時）

```bash
# 1. ブランチ確認・必要なら作成
git switch -c feat/ut-web-cov-01-admin-components-coverage

# 2. Phase 12 完了後に push
git push -u origin feat/ut-web-cov-01-admin-components-coverage

# 3. PR 作成
gh pr create \
  --base main \
  --head feat/ut-web-cov-01-admin-components-coverage \
  --title "test(web/admin): cover MembersClient/TagQueuePanel/AdminSidebar plus 4 panels to ≥85% lines" \
  --body-file docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-13/pr-body.md

# 4. CI 状態確認
gh pr checks --watch
```

## 入出力・副作用

- 入力: Phase 11 evidence、Phase 12 implementation-guide.md
- 出力: GitHub PR、`outputs/phase-13/main.md`、`outputs/phase-13/pr-body.md`
- 副作用: GitHub 上に PR が作成される（CI が起動）

## テスト方針

- Phase 9 / Phase 11 で既に PASS 確認済み。Phase 13 では CI 上で再実行されることを `gh pr checks --watch` で監視。
- CI が fail した場合は最小修復をローカルで行い、追加コミットを push（`--amend` は使わない）。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

## 完了条件 (DoD)

- [ ] PR が `main` を base に作成済み
- [ ] PR 本文に Coverage 改善表・AC マトリクス・evidence link を含む
- [ ] `gh pr checks` が全 green
- [ ] `outputs/phase-13/main.md` に PR URL と CI 結果サマリ
- [ ] artifacts.json の phase-13 status を `completed` に更新

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`
- `outputs/phase-12/implementation-guide.md`
- `CLAUDE.md`「PR作成の完全自律フロー」

## サブタスク管理

- [ ] ブランチ整備
- [ ] pr-body.md 作成
- [ ] gh pr create 実行
- [ ] CI 監視 + 修復
- [ ] outputs/phase-13/main.md 完成

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/pr-body.md`
- GitHub PR

## タスク100%実行確認

- [ ] 必須セクション充足
- [ ] 本プロンプト実行では PR を作成していない（仕様化のみ）
- [ ] 実 PR 作成は Phase 13 実行担当の責務として明示

## 次 Phase への引き渡し

タスク終了。Phase 13 完了後は close-task ワークフローへ移行。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

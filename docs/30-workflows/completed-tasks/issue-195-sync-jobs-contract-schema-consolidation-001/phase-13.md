# Phase 13: PR 作成準備（Refs #435・user approval required）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成準備（Refs #435・user approval required） |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback) |
| 次 Phase | なし |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

Phase 12 の `implementation-guide.md` を元に PR 本文を生成し、`Refs #435`（Issue は CLOSED のため `Closes` 不可）を付ける。PR 作成は user approval required とし、ユーザーの明示承認前に `gh pr create` を実行しない。

## 目的

Phase 12 の `implementation-guide.md` を PR 本文として流用し、承認後にそのまま使える `outputs/phase-13/pr-body.md` を作成する。

## 実行タスク

1. ブランチ確認（feat/issue-195-sync-jobs-contract-schema-consolidation または同等）
2. `git fetch origin main` → ローカル `main` を fast-forward
3. 作業ブランチに `main` を merge
4. コンフリクト解消（CLAUDE.md の既定方針に従う）
5. `mise exec -- pnpm install --force` / `typecheck` / `lint` 実行・必要に応じ自動修復
6. `git status --porcelain` を確認し、PR 対象 diff を記録
7. `outputs/phase-13/pr-body.md` 生成
8. 明示承認待ち状態として停止し、`gh pr create` コマンドは予約手順に留める
9. ユーザー承認後のみ PR URL を最終レポートに記録
10. PR 作成後のみ、`unassigned-task/task-issue195-...` の `resolved-pr` フィールドに PR URL を追記

## `outputs/phase-13/pr-body.md` 雛形

```md
## Summary

- `_design/sync-jobs-spec.md` に **ADR-001 runtime SSOT 配置**（`apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持 / `packages/shared` 不採用）を追加し、Decision の根拠（CLAUDE.md 不変条件 5 / `apps/web` 参照ゼロ / `packages/shared` 参照ゼロ / 03b-followup-005 既配置）を明文化
- `_design/sync-shared-modules-owner.md` の owner 表に `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 行を追加（owner: 03a / co-owner: 03b）
- `_design/sync-jobs-spec.md` §2 / §3 / §5 に owner 表 + runtime SSOT への 1-hop 参照リンクを追記
- `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` の canonical contract カバレッジ（`SYNC_JOB_TYPES` 値断言 / `SYNC_LOCK_TTL_MS === 600000` / PII 拒否）を補強（不足分のみ）
- `unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` の status を `unassigned` → `resolved` に更新

## 変更ファイル

- 編集: `docs/30-workflows/_design/sync-jobs-spec.md`
- 編集: `docs/30-workflows/_design/sync-shared-modules-owner.md`
- 編集（条件付き）: `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`
- 編集（条件付き）: `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- 編集: `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md`

## Test plan

- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses`（回帰なし）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-sheets-to-d1`（回帰なし）
- [ ] `mise exec -- pnpm indexes:rebuild`（drift 0 件）
- [ ] `rg -n "ADR-001 runtime SSOT 配置" docs/30-workflows/_design/sync-jobs-spec.md`（1+ 行）
- [ ] `rg -n "sync-jobs-schema\\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md`（1+ 行）

## Refs

Refs #435

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行コマンド

```bash
# Phase 13 ステップ 1-6
git fetch origin main
git checkout main && git pull --ff-only origin main
git checkout feat/issue-195-sync-jobs-contract-schema-consolidation   # または該当ブランチ
git merge main
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git status --porcelain   # 0 行であること

# PR 作成（ユーザー明示承認後のみ）
gh pr create --title "feat(sync): consolidate sync_jobs runtime contract with ADR + owner table + canonical tests" \
  --body-file docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/outputs/phase-13/pr-body.md
```

## 注意事項

- Issue #435 は CLOSED のため、本文では `Refs #435` を使用し、`Closes #435` は使わない
- スクリーンショットセクションは含めない（NON_VISUAL）
- `outputs/phase-11/` に画像はないため、PR 本文に画像参照を加えない
- PR 作成後のみ、`unassigned-task/task-issue195-...` の `resolved-pr` フィールドに PR URL を追記してコミットを追加（C4 と同コミットでも、追加コミットでも可）

## DoD

- [ ] `outputs/phase-13/pr-body.md` が作成され、PR 作成は user approval required として停止している
- [ ] PR 本文に変更ファイル一覧と test plan が含まれる
- [ ] `Refs #435` が含まれている
- [ ] `Closes #435` が含まれていない
- [ ] CI（typecheck / lint / verify-indexes）が通る見込み
- [ ] `unassigned-task` に `resolved-pr` URL が記入されている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文 |
| メタ | artifacts.json | Phase 13 を completed に更新（実行時） |
| 外部 | GitHub PR | ユーザー明示承認後のみ URL を最終レポートに記録 |

## 統合テスト連携

- 本タスクの最終ゲートは GitHub Actions の CI（`verify-indexes-up-to-date` / typecheck / lint / test）
- CI fail があれば本 PR 内で修正

## 完了条件

- [ ] PR 本文ドラフトが作成済み
- [ ] CI 実行前提のローカル検証結果が記録済み
- [ ] `gh pr create` はユーザー明示承認まで未実行

## 次 Phase

- なし（タスク完了）
- 後続: `unassigned-task-detection.md` で起票推奨と判定された候補があれば別タスクとして起票（本 PR スコープ外）

## 参照資料

- `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/outputs/phase-13/pr-body.md`
- `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md`

## 依存 Phase 参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`
- Phase 11: `outputs/phase-11/main.md`
- Phase 12: `outputs/phase-12/main.md`

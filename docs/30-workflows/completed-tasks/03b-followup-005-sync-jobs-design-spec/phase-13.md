# Phase 13: PR 作成（Refs #198）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成（Refs #198） |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 12 (実装ガイド + skill feedback) |
| 次 Phase | なし |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

Phase 12 の `implementation-guide.md` を元に PR 本文を生成し、`Refs #198`（Issue は CLOSED のため `Closes` 不可）で PR を作成する。CLAUDE.md「PR作成の完全自律フロー」に準拠。

## 実行タスク

1. ブランチ確認（`docs/issue-198-sync-jobs-design-spec` または同等）
2. `git fetch origin main` → ローカル `main` を fast-forward
3. 作業ブランチに `main` を merge
4. コンフリクト解消（CLAUDE.md の既定方針に従う）
5. `mise exec -- pnpm install --force` / `typecheck` / `lint` 実行・必要に応じ自動修復
6. `git status --porcelain` がクリーンであることを確認
7. `outputs/phase-13/pr-body.md` 生成
8. `gh pr create` で PR 作成
9. PR URL を最終レポートに記録

## `outputs/phase-13/pr-body.md` 雛形

```md
## Summary

- `apps/api/src/jobs/_shared/sync-jobs-schema.ts` を新規作成し、`sync_jobs` の `job_type` enum / lock TTL（10 分）/ `metrics_json` schema を TS ランタイム正本として一元化
- 既存 3 ファイル（`sync-forms-responses.ts` / `repository/syncJobs.ts` / `cursor-store.ts`）のリテラル散在を共有 module 経由参照に差し替え（既存テスト破壊なし）
- `_design/sync-jobs-spec.md` を markdown 論理正本として維持し、TS 正本へのリンクを §3 / §5 / lock 章に追記
- `database-schema.md` の `sync_jobs` 節を `_design/` + TS 正本参照に統一

## 変更ファイル

- 新規: `apps/api/src/jobs/_shared/sync-jobs-schema.ts`
- 新規: `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`
- 編集: `apps/api/src/jobs/sync-forms-responses.ts`
- 編集: `apps/api/src/repository/syncJobs.ts`
- 編集: `apps/api/src/jobs/cursor-store.ts`
- 編集: `docs/30-workflows/_design/sync-jobs-spec.md`
- 編集: `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## Test plan

- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-sheets-to-d1`
- [x] `mise exec -- pnpm lint`
- [x] `mise exec -- pnpm indexes:rebuild`（drift 0 件）
- [x] `rg -n "DEFAULT_LOCK_TTL_MS" apps/api/src/jobs/sync-forms-responses.ts` が 0 件

## Refs

Refs #198

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行コマンド

```bash
# Phase 13 ステップ 1-6
git fetch origin main
git checkout main && git pull --ff-only origin main
git checkout docs/issue-198-sync-jobs-design-spec   # または該当ブランチ
git merge main
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git status --porcelain   # 0 行であること

# PR 作成
gh pr create --title "feat(sync): unify sync_jobs job_type / lock TTL / metrics schema in TS shared module" \
  --body-file docs/30-workflows/03b-followup-005-sync-jobs-design-spec/outputs/phase-13/pr-body.md
```

## 注意事項

- Issue #198 は CLOSED のため、本文では `Refs #198` を使用し、`Closes #198` は使わない
- スクリーンショットセクションは含めない（NON_VISUAL）
- `outputs/phase-11/` に画像はないため、PR 本文に画像参照を加えない

## DoD

- [ ] PR が作成され URL が取得できている
- [ ] PR 本文に変更ファイル一覧と test plan が含まれる
- [ ] `Refs #198` が含まれている
- [ ] `Closes #198` が含まれていない
- [ ] CI（typecheck / lint / verify-indexes）が通る見込み

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文 |
| メタ | artifacts.json | Phase 13 を completed に更新 |
| 外部 | GitHub PR | URL を最終レポートに記録 |

## 統合テスト連携

- 本タスクの最終ゲートは GitHub Actions の CI（`verify-indexes-up-to-date` / typecheck / lint / test）
- CI fail があれば本 PR 内で修正

## 完了条件

- [ ] PR URL が取得済み
- [ ] CI green（または red の場合の対応記録）

## 次 Phase

- なし（タスク完了）
- 後続: `unassigned-task-detection.md` は未タスク 0 件。`assertNoPii` は `syncJobs.succeed()` の metrics_json 書き込み前検証として今回サイクル内に完了

# Phase 13: PR 作成 — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 13 / 13 |
| wave | 05a-followup |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

PR title 案 / body テンプレを確定し、user 明示承認後に PR を作成する。Issue #388 は CLOSED のため `Closes #388` ではなく **`Refs #388`** で参照する。

## PR 作成の前提条件

- AC-1〜AC-6 すべて GO（Phase 10 / 11 で確認）。2026-05-05 review 時点では AC-1〜AC-3 が runtime blocked のため PR 作成不可
- Phase 12 strict 7 files が揃っている
- `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test` がすべて green
- **user の明示承認**（「PR 作成して」「PR 出して」等）

## 実行タスク

1. PR title / body / Test plan を `Refs #388` 前提で確定する。
2. user 明示承認を確認する。
3. 承認後のみ `gh pr create` を実行し、PR URL を `outputs/phase-13/pr-description.md` に記録する。

## PR title 候補

- `fix(public): add /public/form-preview 503 diagnostics and regression tests`
- 代替案: `fix(api): resolve UBM-5500 on staging /public/form-preview`

> 70 文字制限を意識。日本語タイトルは目視で 50 文字以内を目安にする。

## PR body テンプレ（HEREDOC）

```bash
gh pr create --title "fix(public): add /public/form-preview 503 diagnostics and regression tests" --body "$(cat <<'EOF'
## Summary

- `/public/form-preview` の HTTP 503 root cause を `schema_versions` active manifest 欠落として固定し、`UBM-5500` structured warn を追加。
- staging / production curl は 2026-05-05 review 実測で 503 のため、D1 write / production mutation は user approval gate 後の runtime operation として残す。
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` に schema 欠落、正常 manifest、env fallback、choice JSON fallback、structured log payload の regression を追加。

## 関連 Issue

Refs #388

## 変更内容

- backend: `apps/api/src/use-cases/public/get-form-preview.ts` 503 分岐に structured log 追加
- backend test: schema 欠落 / 空 fields / env fallback / choice JSON fallback / route 503 mapping / structured log payload を追加
- データ運用: staging D1 `schema_versions.state='active'` 確認・投入 runbook を `outputs/phase-12/implementation-guide.md` に記載（未実行）

## 不変条件

- API response shape 不変（不変条件 #1）
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）
- schema 集約点 `schema_versions` × `schema_questions` 不変（不変条件 #14）

## Test plan

- [ ] `mise exec -- pnpm typecheck` が green
- [ ] `mise exec -- pnpm lint` が green
- [ ] `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` が green
- [ ] staging `curl https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` が 200
- [ ] production `curl https://ubm-hyogo-api.daishimanju.workers.dev/public/form-preview` が 200
- [ ] staging `/register` page が 200

## Documentation

- `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術詳細 / runbook）
- `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-11/manual-test-result.md`（curl + vitest evidence）

## NON_VISUAL 宣言

本 PR は **NON_VISUAL**（API HTTP status verification）。スクリーンショット添付なし。代替証跡として curl 実測ログ + vitest 出力を `outputs/phase-11/manual-test-result.md` に格納。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 参照資料

- `outputs/phase-10/main.md`
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実行手順

1. user の明示承認を待つ。
2. 承認後、`git status` / `git diff main...HEAD` で差分を確認。
3. ローカル main を origin/main に同期し、作業ブランチに main をマージ。
4. 三点 gate（typecheck / lint / test）を再実行。
5. 上記 HEREDOC で `gh pr create` 実行。
6. PR URL を user に報告。

## 統合テスト連携

- 上流: Phase 12 全成果物
- 下流: PR review / merge（feature → dev → main の段階的昇格）

## 多角的チェック観点

- `Closes #388` を使わない（CLOSED Issue のため）
- `Refs #388` で参照のみ
- 不変条件 #1 / #5 / #14 を PR body に明記

## サブタスク管理

- [ ] PR title 確定
- [ ] PR body の Test plan / Documentation / Refs #388 記載
- [ ] user 承認取得
- [ ] PR 作成
- [ ] PR URL を outputs/phase-13/pr-description.md に追記

## 成果物

- `outputs/phase-13/pr-description.md`

## 完了条件

- PR が作成され、URL が記録される
- `Refs #388` で記載されている
- Test plan の項目がすべて check 可能な形式

## タスク100%実行確認

- [ ] user 明示承認なしに PR を作成していない
- [ ] `Closes #388` を誤って使っていない
- [ ] 不変条件 #1 / #5 / #14 の遵守を PR body に明記している

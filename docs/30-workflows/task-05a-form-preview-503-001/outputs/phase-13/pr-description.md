# pr-description — task-05a-form-preview-503-001

## PR title

`fix(public): add /public/form-preview 503 diagnostics and regression tests`

## 関連 Issue

- GitHub Issue #388（CLOSED）→ PR 本文では **`Refs #388`**（`Closes #388` は使わない）

## PR body（実 PR で使う本文）

```markdown
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

- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` green
- [ ] staging `curl https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` 200
- [ ] production `curl https://ubm-hyogo-api.daishimanju.workers.dev/public/form-preview` 200
- [ ] staging `/register` page 200

## Documentation

- `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術詳細 / runbook）
- `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-11/manual-test-result.md`（curl + vitest evidence）

## NON_VISUAL 宣言

本 PR は NON_VISUAL（API HTTP status verification）。スクリーンショット添付なし。代替証跡として curl 実測ログ + vitest 出力を `outputs/phase-11/manual-test-result.md` に格納。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 作成コマンド（参考）

```bash
gh pr create \
  --title "fix(public): add /public/form-preview 503 diagnostics and regression tests" \
  --body-file docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-13/pr-description-body.md
```

> または phase-13.md の HEREDOC をそのまま使う。

## 作成後の追記欄（実装サイクルで埋める）

| 項目 | 値 |
| --- | --- |
| PR URL | _未作成_ |
| 作成日時 | _未作成_ |
| マージ先ブランチ | dev → main |
| user 承認の文言 | _記録欄_ |

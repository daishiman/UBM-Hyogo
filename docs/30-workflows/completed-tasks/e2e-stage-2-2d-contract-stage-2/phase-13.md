# Phase 13: PR 作成

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

> 本 Phase は CLAUDE.md「PR 作成の完全自律フロー」に準拠するが、commit / push / PR 作成はユーザー明示承認後のみ実行する。base ブランチは **`dev`**（既定）。

## 1. 事前条件

| # | 条件 | 確認 |
|---|------|------|
| 1 | Phase 11 PASS（7 evidence + 7 観点 PASS） | `outputs/phase-11/main.md` |
| 2 | Phase 12 PASS（7 outputs + 12 点 compliance + dirty-code gate） | `outputs/phase-12/main.md` |
| 3 | `git status --porcelain` が想定差分のみ（contract test 1 ファイル + route 3 ファイル + workflow docs） | `git status` |
| 4 | 作業ブランチが `dev` 直上に整合 | `git fetch origin dev && git merge origin/dev`（コンフリクトなしを期待） |
| 5 | ユーザーが commit / push / PR 作成を明示承認済み | 承認文を `outputs/phase-13/user-approval.txt` に記録 |

## 2. 作業ブランチ命名

差分の主題が **新規 Vitest contract test 追加** のため:

```
feat/e2e-stage-2-2d-contract-spec
```

> 既に作業中ブランチがある場合は再利用。ブランチが `dev` 直上の場合のみ新規作成。

## 3. 品質検証コマンド（PR 作成前）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts
```

すべて exit 0 を確認。失敗時は最大 3 回まで自動修復し、修復差分を別コミットで作成。

## 4. PR 本文テンプレート

```markdown
## Summary
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` を新規追加し、Stage 2 の 2a/2b/2c Playwright fixture object と admin route の zod schema 同型性を CI gate として担保
- 7 describe（`/admin/requests` GET / POST resolve / `/admin/identity-conflicts` GET / merge / dismiss / `/admin/members/:id/delete` / `/admin/audit` GET）すべて green、skip 0
- shared `MergeIdentityResponseZ` 正本に揃え、fixture に `archivedSourceMemberId` + `auditId` を含む shape を固定
- route 3 ファイル（`member-delete.ts` / `requests.ts` / `audit.ts`）に named export を +1 字句〜+1 行で付与（CONST_007 schema 重複禁止のため）。`identity-conflicts.ts` は変更なし
- D1 schema / `apps/web` / `packages/shared` は変更なし

## 親 umbrella
- Issue #607（e2e-quality-uplift-stage-2）

## Phase 12 outputs
- `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/`（7 ファイル）

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api lint`
- [ ] `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（7 describe / 全 it pass / skip 0）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test`（全体回帰、既存 test への regress なし）
- [ ] grep gate: `z.object(` = 0 / `test.skip` = 0 / `apps/web` import = 0
- [ ] dirty-code gate: contract test + route 3 ファイル + workflow docs のみ
```

## 5. 作成コマンド

```bash
gh pr create --base dev --title "feat(api): Stage 2 contract test (2d) を追加" --body "$(cat <<'EOF'
（§4 の本文）
EOF
)"
```

実行禁止: 上記 `gh pr create` はユーザー承認があるまで実行しない。

## 6. PR 作成後

| # | アクション | 備考 |
|---|----------|------|
| 1 | PR URL を記録 | `outputs/phase-13/pr-url.txt` |
| 2 | CI 結果を観測 | typecheck / lint / `apps/api` Vitest / verify-design-tokens / verify-indexes |
| 3 | CI fail 時は **同一 PR に追加 commit** で対応 | 別 PR 化禁止（CONST_007・先送り禁止原則） |
| 4 | merge 後の `DeleteBodyZ` shared 昇格 task は作らない | unassigned-task-detection.md で no-op 判定済 |
| 5 | umbrella Issue #607 はサブタスク完了後も OPEN 維持 | 全 sub-task 完了後に umbrella 側で closeout |

## 7. 禁止事項

- `--no-verify` の使用（lefthook hook を skip しない）
- `git push --force` を `dev` / `main` に対して実行
- main 直接 PR（base は必ず `dev`）
- 大規模差分の分割 PR 化（CONST_007 違反）
- shared schema / `apps/web` / D1 migration の同梱コミット（本 PR スコープ外）

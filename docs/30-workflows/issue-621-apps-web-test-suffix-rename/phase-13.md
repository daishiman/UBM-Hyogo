# Phase 13 — PR 作成（Refs #621）

## 1. PR 基本仕様

| 項目 | 値 |
| --- | --- |
| base branch | `dev` |
| PR 種別 | 通常 PR（draft 不要） |
| commit 数 | 3（Phase 10 §2 参照） |
| merge 方式 | merge commit（squash 禁止 — 3 commit 構造を保つ） |
| Issue 参照 | `Refs #621`（**`Closes` 禁止**: Issue close 操作はユーザーが管理） |
| screenshot | なし（NON_VISUAL） |
| G1-G4 multi-stage approval | **不要**（test 規約のみで runtime 影響なし） |

## 2. PR タイトル例

```
refactor(web): suffix-classify apps/web tests to *.spec.ts(x) (Refs #621)
```

## 3. PR 本文テンプレート

```markdown
## Summary

- `apps/web/**/*.test.ts(x)` 70 ファイルを apps/web 用 suffix 規約に rename（rename commit は pure rename）
- glob 同期: `apps/web/package.json:19` の `verify-design-tokens` script を `tokens.test.ts` → `tokens.runtime.spec.ts` に追従
- self-reference / guard 同期: static invariant 自己除外と lint scripts の `.spec` 除外を追従
- apps/web 用 suffix 規約 ADR を `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/test-file-suffix-adr-apps-web.md` に確定（apps/api ADR との対比表を含む）

Refs #621
Refs #325（apps/api 側 suffix 規約導入元）

## 分類内訳

| 分類 | 件数 | suffix |
| --- | --- | --- |
| component | 36 | `*.component.spec.tsx` |
| route | 4 | `*.route.spec.ts` |
| page | 1 | `*.page.spec.ts` |
| runtime | 5 | `*.runtime.spec.ts` |
| lib-unit | 24 | `*.spec.ts` |
| 合計 | 70 | — |

## Commit 構成

1. `refactor(web): rename *.test.ts(x) to suffix-classified *.spec.ts(x) (Refs #621)` — `git mv` 70 件のみ
2. `chore(web): sync test glob to *.spec.ts(x) (Refs #621)` — `apps/web/package.json:19` 同期 + `.github/workflows/ci.yml:159` コメント追従 + static invariant / lint guard 同期
3. `docs(web): add apps/web test file suffix ADR (Refs #621)` — apps/web 用 ADR + Phase 11/12 evidence

## 関連 task

- 親 Issue #325（apps/api 側完了）: `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/`
- followup-002（packages rename）: 別 issue 化済み・scope-out
- followup-003（vitest config 収斂）: 別 issue 化済み・scope-out

## Test plan

- [ ] `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | wc -l` = 0
- [ ] `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | wc -l` = 87
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` green / 件数 rename 前と一致
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` exit 0
- [ ] commit 1 が pure rename（`git log -1 --diff-filter=R --summary HEAD | wc -l` = 70、`+`/`-` = 0）
- [ ] `rg -n "apps/web.*\.test\." --glob '!**/node_modules/**' --glob '!docs/**'` ヒット 0 件

## Phase 11 evidence

`docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/main.md` を参照。

## Notes

- Issue #621 は OPEN 状態のまま運用する（ユーザー指示）。本 PR は `Refs #621` のみで連携し、`Closes #621` は使用しない
- merge 方式は merge commit（squash 禁止）。3 commit 構造を保つことでレビュー / rollback の機械的検証を可能にする
```

## 4. PR 作成コマンド

```bash
# 事前: dev に sync
git fetch origin dev
git checkout feat/issue-621-apps-web-test-suffix-rename  # またはタスクブランチ名
git merge origin/dev --no-ff  # コンフリクト時は CLAUDE.md の sync-merge ポリシーに従う

# Phase 6 §2.1〜2.6 を実行（rename / config / ADR / evidence の 3 commit）
# （詳細は phase-06.md 参照）

# push
git push -u origin HEAD

# PR 作成
gh pr create --base dev --title "refactor(web): suffix-classify apps/web tests to *.spec.ts(x) (Refs #621)" \
  --body "$(cat <<'EOF'
## Summary

- `apps/web/**/*.test.ts(x)` 70 ファイルを apps/web 用 suffix 規約に rename（rename commit は pure rename）
- glob 同期: `apps/web/package.json:19` の `verify-design-tokens` script を `tokens.test.ts` → `tokens.runtime.spec.ts` に追従
- apps/web 用 suffix 規約 ADR を `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/test-file-suffix-adr-apps-web.md` に確定

Refs #621
Refs #325

(以下 §3 のテンプレート全文)
EOF
)"
```

## 5. PR 作成後の手動操作禁止事項

| 操作 | 可否 | 理由 |
| --- | --- | --- |
| Issue #621 を Close | **禁止** | ユーザー指示。`Refs` のみで連携 |
| squash merge | **禁止** | 3 commit 構造を保つため merge commit を使う |
| Force push | **禁止** | 履歴破壊禁止（CLAUDE.md ガバナンス） |
| `--no-verify` で push | **禁止** | hook 失敗時は hook 自体を改善する |

## 6. PR レビュー時の機械確認コマンド

レビュアーは以下を順に実行して機械的に確認できる:

```bash
# 1. pure rename 確認
git log -1 --diff-filter=R --summary <commit-1-sha> | wc -l   # 70
git diff --stat <commit-1-sha>~..<commit-1-sha>               # +/- 0

# 2. config 同期確認
git diff <commit-2-sha>~..<commit-2-sha> -- 'apps/web/src/**' | wc -l   # 0
rg -n "tokens\.runtime\.spec\.ts" apps/web/package.json                  # 1

# 3. ADR 確認
ls docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/

# 4. 件数完全一致
diff docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/test-count-{before,after}.txt
```

## 7. 完了条件チェック

- [ ] PR が base `dev` で作成されている
- [ ] PR タイトルに `Refs #621` を含む
- [ ] PR 本文に Summary / 分類内訳 / Commit 構成 / 関連 task / Test plan / Notes が含まれる
- [ ] commit 数が 3 で構造（rename / config / ADR）が保たれている
- [ ] `Closes #621` を使っていない
- [ ] squash merge / force push / `--no-verify` を使っていない
- [ ] Phase 11 evidence へのリンクが PR 本文に含まれる

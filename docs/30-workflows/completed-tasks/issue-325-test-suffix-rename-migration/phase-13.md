# Phase 13 — PR 作成（Refs #325）

## 1. PR 基本仕様

| 項目 | 値 |
| --- | --- |
| base branch | `dev` |
| PR 種別 | 通常 PR（draft 不要） |
| commit 数 | 3（Phase 10 §2 参照） |
| merge 方式 | merge commit（squash 禁止 — 3 commit 構造を保つ）|
| Issue 参照 | `Refs #325`（**`Closes` 禁止**: Issue #325 は CLOSED のまま） |
| screenshot | なし（NON_VISUAL）|
| G1-G4 multi-stage approval | **不要**（test 規約のみで runtime 影響なし）|

## 2. PR タイトル例

```
refactor(api): suffix-classify all *.test.ts → *.{contract,authz,repository,unit}.spec.ts (Refs #325)
```

## 3. PR 本文テンプレート

```markdown
## Summary

- `apps/api/src/**/*.test.ts` 132 ファイルを suffix 規約に rename（`git mv` のみ・内容変更ゼロ）
- glob 同期: `vitest.config.ts` / `package.json` / `lefthook.yml` / `.github/workflows/*.yml`
- suffix 規約 ADR を `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` に確定

Refs #325

## 分類内訳

| 分類 | 件数 | suffix |
| --- | --- | --- |
| contract | 41 | `*.contract.spec.ts` |
| authz | 4 | `*.authz.spec.ts` |
| repository | 38 | `*.repository.spec.ts` |
| unit | 49 | `*.spec.ts` |
| 合計 | 132 | — |

## Commit 構成

1. `refactor(api): rename *.test.ts to suffix-classified *.spec.ts (Refs #325)` — `git mv` 132 件のみ
2. `chore(test): sync test glob to *.spec.ts (Refs #325)` — config 同期
3. `docs(test): add test file suffix ADR (Refs #325)` — ADR 追加

## Test plan

- [ ] `find apps/api/src -name '*.test.ts' | wc -l` = 0
- [ ] `find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l` = 132
- [ ] vitest reporter `Tests` 数値が rename 前後で同一
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` exit 0
- [ ] `rg -n '\.test\.ts' vitest.config.ts apps/api/package.json package.json lefthook.yml .github/workflows/` で `apps/api` 関連の `*.test.ts` 単独参照が 0 件
- [ ] Commit 1 の `git log -1 --diff-filter=R --summary` が 132 件 rename のみ
- [ ] Commit 1 の `git diff --stat` で `+`/`-` 合計 0

## Rollback

- 全 revert: `git revert -m 1 <merge-sha>`
- glob のみ revert: `git revert <commit-2-sha>`
- rename のみ revert: `git revert <commit-1-sha>`

## スクリーンショット

なし（NON_VISUAL — テストファイル rename のみ）
```

> スクリーンショットセクションは「なし（NON_VISUAL）」明示で残す。空欄削除はしない（CLAUDE.md PR 自律フローで明記される運用に整合）。

## 4. Issue close 操作なし

- Issue #325 は **CLOSED のまま**
- PR 本文に `Closes #325` / `Fixes #325` / `Resolves #325` を **絶対に書かない**（GitHub の自動 close 動作で再 close されると履歴に余計なイベントが残る）
- `Refs #325` のみで連携

## 5. merge 後 follow-up checklist

merge 成立後、以下を実施する。これは PR 作成 Phase の完了条件には含めない。

1. `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` の下部に「本仕様書 (`docs/30-workflows/issue-325-test-suffix-rename-migration/`) で実装済み・PR #<番号> でマージ」trace を追記
2. `docs/30-workflows/issue-325-test-suffix-rename-migration/` 配下に `outputs/phase-13/main.md` を追加し、PR URL / merge sha / 実 evidence へのリンクを記録

## 6. G1-G4 multi-stage approval gate

- **不要**
- 根拠: G1-G4 は「runtime 影響あり / セキュリティ境界変更 / データ移行を伴うタスク」に適用する gate。本タスクは test ファイル名規約のみで、runtime / 境界 / データに無影響

## 7. 完了条件チェック

- [ ] PR が 3 commit 構成で push 済み
- [ ] PR 本文に `Refs #325` を含み、`Closes` が含まれない
- [ ] スクリーンショットセクションは「なし（NON_VISUAL）」明示
- [ ] CI 全 gate green
- [ ] merge 後 follow-up checklist はPR完了条件外として分離済み
- [ ] Issue #325 は CLOSED のまま（再 open / 再 close されていない）

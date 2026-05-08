# Phase 13: PR 作成 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 13 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| user_approval_required | true |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

task-07 末尾「diff scope 規律」を遵守して PR を作成する。`git diff --name-only main...HEAD` が `09a-prototype-map.md`、`docs/30-workflows/task-07-prototype-mapping-table/`、`scripts/verify-09a-prototype-line-ranges.sh`、`09-ui-ux.md` backlink、aiworkflow-requirements 同期ファイルだけで構成されることを保証する。

## 実行タスク（user approval 後のみ）

1. `git fetch origin main` → ローカル `main` を fast-forward 同期する。
2. 作業ブランチに main をマージする。コンフリクトがあれば CLAUDE.md の方針で自律解消。
3. `git diff --name-only main...HEAD` を取得し、想定外パスがゼロか確認する。
4. `mise exec -- pnpm install --force` → `pnpm typecheck` → `pnpm lint` を実行（docs-only ながら CI 互換確認のため）。
5. `bash scripts/verify-09a-prototype-line-ranges.sh` exit 0 を確認。
6. PR 本文を `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様で作成。
7. `gh pr create` で通常 PR を作成。

## 想定 diff scope

```
docs/00-getting-started-manual/specs/09a-prototype-map.md                               (C)
docs/30-workflows/task-07-prototype-mapping-table/index.md                              (C)
docs/30-workflows/task-07-prototype-mapping-table/artifacts.json                        (C)
docs/30-workflows/task-07-prototype-mapping-table/phase-01.md ... phase-13.md           (C, 13 files)
docs/30-workflows/task-07-prototype-mapping-table/outputs/phase-01/main.md ... 13/main.md (C)
docs/30-workflows/task-07-prototype-mapping-table/outputs/phase-12/{implementation-guide,...}.md (C)
scripts/verify-09a-prototype-line-ranges.sh                                             (C)
.claude/skills/aiworkflow-requirements/references/...                                   (M, indexes)
```

`apps/` 配下 / `wrangler.toml` / D1 migration / package.json の dependency 変更が混入していないことを必ず確認。

## diff scope 規律（task-07 末尾より）

- `git diff --name-only main...HEAD` が本 task §3「変更対象ファイル」 + 本 task package配下 + same-wave aiworkflow/index sync のみで構成
- 完了済み workflow dir 整理は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（純削除禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit

## PR 本文

`.claude/commands/ai/diff-to-pr.md` Phase 13 規定 + `outputs/phase-12/implementation-guide.md` の主要見出しを反映。スクリーンショット項目は NON_VISUAL のため設けない。

PR 本文セクション:
- ## Summary（3 bullet 程度）
- ## Scope / Out-of-Scope
- ## DoD（task-07 §8 11 項目チェック結果）
- ## Verifier evidence（grep / wc / sed ログ）
- ## Test plan（reviewer 用 grep コマンド一覧）

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`
- task-07 §「diff scope 規律」
- CLAUDE.md「PR作成の完全自律フロー」

## 依存 Phase 成果物参照

- Phase 12 outputs（implementation-guide.md ほか 6 ファイル）
- Phase 11 受け入れログ
- Phase 10 品質ゲート PASS ログ

## 多角的チェック観点

- 範囲外パスが diff に混入していない
- markdown lint 0 / verifier exit 0 / typecheck OK / lint OK
- PR 本文に DoD 11 項目チェック結果と verifier evidence が含まれる

## サブタスク管理

- [ ] user approval 取得
- [ ] main 同期 + マージ
- [ ] diff scope 確認
- [ ] CI 互換確認（typecheck / lint）
- [ ] verifier 実行
- [ ] PR 本文作成
- [ ] `gh pr create` 実行
- [ ] outputs/phase-13/main.md に PR URL を記録

## 成果物

- outputs/phase-13/main.md（PR URL / 採用ブランチ / 自動修復履歴 / 残課題）

## 完了条件

- [ ] PR が作成され URL が記録される
- [ ] `git diff --name-only main...HEAD` が想定 scope 内に収まる
- [ ] CI が green（typecheck / lint / verify-indexes）
- [ ] reviewer が grep コマンドで evidence を再現可能

## 次 Phase

なし（最終 phase）。merge 後は workflow を `docs/30-workflows/completed-tasks/` へ `git mv` でアーカイブする。

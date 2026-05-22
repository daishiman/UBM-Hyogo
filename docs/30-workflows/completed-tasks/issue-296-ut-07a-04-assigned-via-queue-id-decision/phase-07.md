# Phase 7: 差分ゼロ宣言

## 目的

Phase 5 / Phase 6 の grep verification を踏まえ、本タスクが `apps/` および `packages/` 配下に対してコード差分を **一切生成しない**ことを宣言し、evidence として `git diff --stat` 結果を記録する。Phase 8 以降の docs 更新のみが PR 差分に含まれることを確定させる。

## 入力

- Phase 5 成果物 `outputs/phase-05/grep-verification.md`
- Phase 6 成果物 `outputs/phase-06/test-grep-verification.md`
- 作業中ブランチの `git status` / `git diff --stat`

## 作業手順

1. 作業ブランチで `git status --porcelain` を実行し、`apps/` または `packages/` 配下に未コミット変更が無いことを確認する。
2. `git diff dev...HEAD --stat -- apps/ packages/` を実行し、差分が 0 件であることを確認する。
3. 仮にこのタイミングで apps/ packages/ に差分があった場合は、本タスクスコープ外の変更として stash または別 PR への移動を user に提案する手順を `outputs/phase-07/zero-diff-declaration.md` に明記する。
4. docs 側 (`docs/`, `.claude/skills/aiworkflow-requirements/references/`) は Phase 8 で更新されるため、Phase 7 時点では未更新で OK。
5. 差分ゼロ宣言を成果物として記録する。

## 出力成果物

- `outputs/phase-07/zero-diff-declaration.md`
  - `git status --porcelain` 結果
  - `git diff dev...HEAD --stat -- apps/ packages/` 結果（期待: 空）
  - 差分ゼロ宣言（署名 = 担当 + 日付）

## 検証コマンド

```bash
# (1) 未コミット変更が apps/ packages/ に無いこと
git status --porcelain -- apps/ packages/ || true

# (2) dev からの差分が apps/ packages/ に無いこと
git diff dev...HEAD --stat -- apps/ packages/

# (3) docs 側のみ差分があることを確認（Phase 8 以降）
git diff dev...HEAD --stat -- docs/ .claude/skills/aiworkflow-requirements/references/
```

## DoD

- [ ] `git status --porcelain -- apps/ packages/` が空であることを確認した
- [ ] `git diff dev...HEAD --stat -- apps/ packages/` が空であることを確認した
- [ ] 差分ゼロ宣言を `outputs/phase-07/zero-diff-declaration.md` に記録した
- [ ] Phase 8 以降で docs 側のみ差分が発生する旨を明記した

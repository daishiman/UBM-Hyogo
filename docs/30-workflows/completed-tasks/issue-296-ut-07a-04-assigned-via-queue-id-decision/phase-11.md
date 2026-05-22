# Phase 11: NON_VISUAL evidence

## 目的

本タスクは UI 変更を含まないため visual verification は skip する。代わりに「コード差分ゼロ + docs 差分のみ」を定量的に示す evidence を記録する。

## 入力

- Phase 7 差分ゼロ宣言
- Phase 8 docs 更新差分

## 作業手順

1. `git diff dev...HEAD --stat` 全体を取得し、変更対象が `docs/` および `.claude/skills/aiworkflow-requirements/references/` 配下に限定されることを確認する。
2. `git diff dev...HEAD --stat -- apps/ packages/` の出力が空であることを再確認する。
3. docs 差分の文字数 / 追加行数 / 削除行数を `git diff dev...HEAD --shortstat -- docs/ .claude/` で取得し記録する。
4. visual verification skip 理由を明記する: 「UI 変更なし / route 変更なし / token 変更なし / プロトタイプ参照変更なし」
5. evidence を `outputs/phase-11/visual-verification-skip.md` に集約する。

## 出力成果物

- `outputs/phase-11/visual-verification-skip.md`
  - `git diff --stat` 全体
  - apps/ packages/ 差分ゼロの証拠
  - docs 差分の shortstat
  - visual skip 理由

## 検証コマンド

```bash
# (1) 全体差分
git diff dev...HEAD --stat

# (2) apps/ packages/ 差分ゼロ
git diff dev...HEAD --stat -- apps/ packages/

# (3) docs 差分 shortstat
git diff dev...HEAD --shortstat -- docs/ .claude/

# (4) Playwright / visual regression が trigger されないことの根拠（UI route なし）
git diff dev...HEAD --name-only | grep -E 'apps/web/src/app/' || echo "OK: no UI route changes"
```

## DoD

- [ ] 全体差分 stat を取得した
- [ ] apps/ packages/ 差分ゼロを再確認した
- [ ] docs 差分の shortstat を記録した
- [ ] UI route 変更ゼロを記録した
- [ ] visual skip 理由を明記した
- [ ] `outputs/phase-11/visual-verification-skip.md` を作成した

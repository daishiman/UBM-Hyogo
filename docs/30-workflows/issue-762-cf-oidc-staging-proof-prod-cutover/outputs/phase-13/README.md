# outputs/phase-13/

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Phase: 13（PR 作成 / blocked_user_approval）
> implementation_mode: `conditional_implementation_with_peripheral_hardening`

---

## 用途

PR 本文ドラフトの保管。`gh pr create --body "$(cat outputs/phase-13/pr-body-draft.md)"` から直接読み込ませる用途のため、Markdown を gh CLI に渡せる形式で保持する。

## 格納ファイル一覧（Phase 5-12 実装後に生成）

| ファイル | 内容 | 生成タイミング |
|---|---|---|
| `pr-body-draft.md` | `phase-13-pr.md` §4 のテンプレートを基に、実 commit ハッシュ・実 diff ファイル一覧・Test plan の実行結果を埋め込んだ最終版 | Phase 12 完了後、PR 作成直前 |

## 作成手順

1. `phase-13-pr.md` §4 の PR 本文テンプレートをコピー。
2. `git diff --name-only origin/dev...HEAD` で **変更ファイル一覧** セクションを実体化。
3. Phase 11 の手動検証実行結果（PASS / FAIL）を **Test plan** チェックボックスに反映。
4. `outputs/phase-13/pr-body-draft.md` として保存。
5. ユーザー明示承認後、`gh pr create --base dev --title "<§3 のタイトル>" --body "$(cat outputs/phase-13/pr-body-draft.md)"` を実行。

## 不変条件

- base ブランチは **`dev`**（既定 PR フロー準拠）。`main` への直接 PR は本サイクルで作成しない。
- PR 作成は **ユーザー明示承認後のみ** 実行。
- OIDC token 値・JWT 実値・Account ID・Secret 値を PR body に含めない。
- 「実 OIDC 切替を本 PR で行った」と読み取れる表現を含めない（CONST_007 例外を明示的に記載）。

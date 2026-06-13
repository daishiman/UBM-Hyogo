# Phase 13 — PR 作成（user-gated・pending）

> 本 Phase は `_shared-context.md`（SSOT）§3 変更ファイル・§4 DoD を正本として参照する。
> **commit / push / PR 作成は user の明示承認後にのみ実施する**（本サイクルでは pending）。
> 本タスクは implemented_local_evidence_captured であり、実装・テスト実行・スクリーンショット取得が完了し
> user 承認が得られた後に、本 Phase の pr-template.md を用いて PR を作成する。

## 目的

ホーム画面の英語表記日本語化・eyebrow 削除の実装が完了した後に作成する PR の本文テンプレートを確定する。
base ブランチは `dev`。タイトル・変更概要・変更ファイル一覧・テスト・スクリーンショット欄・不変条件チェックを
あらかじめ用意し、実装後に user 承認のもとでそのまま `gh pr create --base dev` に使える状態にする。

## 成果物

### PR メタ（確定案）

| 項目 | 値 |
| --- | --- |
| base | `dev` |
| タイトル案 | `feat(web): ホーム画面の英語表記を非エンジニア向け日本語へ整える（overline削除＋統計ラベル日本語化）` |
| 変更範囲 | apps/web 内のみ（実装7 + テスト6） |
| スクリーンショット | 実装後に添付（home-localized-full/stats/about） |

### 関連成果物
- `outputs/phase-13/main.md` — PR 作成手順・user-gated 境界の明記。
- `outputs/phase-13/pr-template.md` — PR 本文テンプレート（base=dev）。

## user-gated 境界

以下は user の明示承認後にのみ実施する（本 Phase では未実施・pending）:

- F1〜F7 + T1〜T6 と focused vitest / typecheck / lint / verify:tokens の実行は完了
- ローカル実スクリーンショット取得済み。staging 反映と追加 staging/crop capture
- `git add` / `git commit` / `git push`
- `gh pr create --base dev`

## 完了条件

- [ ] pr-template.md に PR 本文テンプレ（base=dev / タイトル案 / 変更概要 / 変更ファイル一覧 / テスト / スクリーンショット欄 / 不変条件チェック）が記載されている
- [ ] commit/push/PR は user の明示承認後のみである旨が main.md と pr-template.md に明記されている
- [ ] base が `dev` であることが明記されている（production リリースの dev→main は対象外）
- [ ] 変更ファイル一覧が SSOT §3（実装7 + テスト6）と一致している
- [ ] スクリーンショット欄が「実装後に添付」であり、implemented_local_evidence_captured 段階で捏造画像を貼らないことが明記されている

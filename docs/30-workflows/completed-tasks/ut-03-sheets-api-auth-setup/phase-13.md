# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |
| user_approval_required | **true** |

## 目的

仕様書 PR を `feat/issue-52-ut-03-sheets-api-auth-task-spec` → `main` で作成する。**ユーザー明示承認なしには実行しない**。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-13/main.md | PR 作成手順 |
| outputs/phase-13/local-check-result.md | typecheck / lint / build 結果（spec のみのため limited） |
| outputs/phase-13/change-summary.md | 変更ファイル一覧 |
| outputs/phase-13/pr-template.md | PR タイトル / 本文テンプレ |

## 完了条件（実行時）

- [ ] ユーザーから明示的な PR 作成許可を受けている
- [ ] `git status` clean
- [ ] CI required status checks がすべて green
- [ ] PR 本文に Issue #52 への参照（`Closes #52` ではなく `Refs #52`、Issue は既にクローズのため）

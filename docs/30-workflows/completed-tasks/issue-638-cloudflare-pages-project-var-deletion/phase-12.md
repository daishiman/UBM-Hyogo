# Phase 12: 実装ガイド（中学生レベル概念説明 + 1 PR scope）

## 12.1 このタスクを中学生に説明すると

GitHub という「ソースコード置き場」には、**Variable（変数）** という名前のメモ帳があります。「このプロジェクトでよく使う設定値（例: AWS のアカウント ID とか）」をそこに書いておくと、自動デプロイの仕組みが読み取って使えます。

このメモ帳に `CLOUDFLARE_PAGES_PROJECT` という変数があって、値は `ubm-hyogo-web` でした。これは「Cloudflare Pages という古いデプロイ先のプロジェクト名」を覚えておくためのメモでした。

ところが、私たちは前のお片付け（Issue #331）で、Cloudflare Pages を使うのをやめて **Cloudflare Workers** という新しい仕組みに引っ越しました。引っ越したので、このメモはもう誰も読まなくなりました。

「読まないメモが残っていると紛らわしい」「片付け忘れがあると、新しく入った人が『これ何だろう?』と勘違いする」ので、**今回そのメモを捨てる** のがこのタスクです。

捨てる前後で「ちゃんと 1 個だけ消えて、他のメモは残ってる」ことを写真（evidence の JSON ファイル）に撮って残します。

## 12.2 専門用語との対応表

| 中学生向け表現 | 専門用語 |
| --- | --- |
| メモ帳 | GitHub Actions Variables |
| メモ | repository variable |
| 古いデプロイ先 | Cloudflare Pages |
| 新しいデプロイ先 | Cloudflare Workers (`@opennextjs/cloudflare`) |
| メモを捨てる | `gh api -X DELETE` |
| 写真 | evidence (JSON file) |
| 写真の保管場所 | `outputs/phase-11/` |
| 「片付いてるか確認」する仕組み | grep gate (`rg CLOUDFLARE_PAGES_PROJECT .github/`) |

## 12.3 1 PR scope (CONST_007 整合)

本タスクは **1 PR で完結** する。先送り条項は一切なし。ただし GitHub Variable DELETE、rollback POST、commit、push、PR 作成は `outputs/phase-11/evidence/user-approval-marker.md` 保存後にのみ実行する。

PR に含むコミット例:

```
1. docs(issue-638): add Phase 1-13 task spec for CLOUDFLARE_PAGES_PROJECT deletion
2. docs(issue-638): mark issue-331-followup-001 as superseded
3. chore(issue-638): execute variable deletion + evidence capture
```

実行範囲:

| 項目 | 範囲 |
| --- | --- |
| GitHub Variable mutation | 1 件削除 (`CLOUDFLARE_PAGES_PROJECT`) |
| ファイル追加 | `docs/30-workflows/issue-638-.../` 配下 14 spec + 6 evidence + 1 deletion-log |
| ファイル編集 | `unassigned-task/issue-331-followup-001-*.md` に SUPERSEDED marker 追記のみ |
| コード変更 | なし |

## 12.4 実装着手時の最短手順

```bash
# 1. 本仕様ブランチに切替
git checkout docs/issue-638-cloudflare-pages-project-var-deletion

# 2. Phase 7 を上から順に実行（外部 mutation 含む）

# 3. user approval marker があることを確認してから evidence と log を commit
test -s docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/phase-11/evidence/user-approval-marker.md
git add docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/
git add docs/30-workflows/unassigned-task/issue-331-followup-001-*.md
git commit -m "chore(issue-638): delete CLOUDFLARE_PAGES_PROJECT + evidence"

# 4. PR 作成 (Phase 13)
gh pr create --base dev ...
```

## 12.5 つまずきポイント (FAQ)

| Q | A |
| --- | --- |
| Issue #638 が CLOSED なのに作業していいの? | はい。削除前は Variable 本体が未削除のまま残っていたため、ユーザー承認後に削除した。Issue 状態は触らない |
| `gh variable delete` が動かない | `gh` バージョンによって CLI サブコマンドが未実装。`gh api -X DELETE` を使用 |
| `outputs/` を commit していいの? | はい。evidence は audit trail として repo に残す方針 (Phase 4.4 / Phase 8.3) |
| typecheck/lint が失敗したら? | docs 変更のみなので本タスク起因ではないはず。Phase 8.5 の対応 |
| 環境変数 scope は確認した? | Gate G3 (Phase 5.1) で必ず staging/production の不在を確認 |

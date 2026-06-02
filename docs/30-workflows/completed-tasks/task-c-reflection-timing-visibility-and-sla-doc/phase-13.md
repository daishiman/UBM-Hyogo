# Phase 13: PR 作成（PR Creation）

> `implementation_mode: verify_existing`。実装は PR #1064 / commit 745c95115 で dev に landed 済み。
> 本 Phase は **ユーザー明示承認後のみ実施**（CONST_002）。commit / push / PR / staging deploy / authenticated screenshot は承認まで禁止。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 13 |
| 名称 | PR 作成 |
| 種別 | close-out |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 12（ドキュメント更新） |

## 目的

base = `dev` で spec docs 追加のみの PR を作成する手順を記述する。reflection timing 実装本体は PR #1064 / `745c95115` で landed 済みのため、本タスクの PR は本 workflow ディレクトリの spec docs 追加に限定される。

## 実行タスク

- base = `dev`（production 時のみ main）を明記する。
- landed 済み（PR #1064 / `745c95115`）のため spec docs 追加のみの PR になる旨を記述する。
- PR 本文要素（verify_existing / landed commit / AC-C1〜C4 / screenshot user-gated）を列挙する。
- commit / push / PR が未実行（user-gated）である旨を明記する。

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`
- `docs/30-workflows/completed-tasks/task-c-reflection-timing-visibility-and-sla-doc/`（本 workflow）
- 親 workflow: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/`

## 成果物

- 本 Phase 13 close-out 文書（base ブランチ / PR 性質 / PR 本文要素 / 実行状態 user-gated）。

## base ブランチ

- base = **`dev`**（開発統合ブランチ）。`main` への PR は production リリース時の `dev → main` のみ。
- 作業ブランチ = `docs/task-c-reflection-timing-sla-spec`。

## PR の性質（landed 済み）

reflection timing 実装本体は **PR #1064 / commit 745c95115 で既に dev へ landed 済み**。
そのため本タスク仕様書単体の PR は **「spec docs（本 workflow ディレクトリ）の追加」のみ** になる。`git diff dev...HEAD -- apps/ docs/00-getting-started-manual/` は空（実装差分なし）。

## PR 本文に含める要素

- 実装区分: **verify_existing**（landed 実装の正本記述）。
- landed commit: **745c95115**（PR #1064）。
- AC 充足: **AC-C1〜C4**（reflection timing 表示 / 反映 SLA doc / 公開一覧と本人マイページの差異を doc・UI 両明示）。
- screenshot: **user-gated**（`/profile` 認証必須 + CONST_002 により deferred。承認後に取得）。
- 変更範囲: spec docs（`docs/30-workflows/completed-tasks/task-c-reflection-timing-visibility-and-sla-doc/`）のみ。apps/ 差分ゼロ。

## 実行状態

- commit: **未実行**（user-gated）。
- push: **未実行**（user-gated）。
- `gh pr create --base dev`: **未実行**（user-gated）。

ユーザーが「PR 作成」を明示指示した時点で、CLAUDE.md の「PR作成の完全自律フロー」に従い base=`dev` で作成する。

## 完了条件

- [x] base = `dev`（production 時のみ main）を明記済み。
- [x] landed 済み（PR #1064 / 745c95115）のため spec docs 追加のみの PR になる旨を記述済み。
- [x] PR 本文要素（verify_existing / landed commit / AC-C1〜C4 / screenshot user-gated）を列挙済み。
- [x] commit / push / PR が未実行（user-gated）である旨を明記済み。

# Phase 13: PR作成（user-gated）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-06-02 |
| 状態 | spec_created |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| タスク種別 | implementation / NON_VISUAL |
| user_approval_required | **true** |

## 目的

実装・テスト・ドキュメントが完了した変更を、**ユーザーの明示承認後にのみ** PR 化する。
本 Phase は承認まで PR 本文の準備に留め、commit / push / `gh pr create` を自動実行しない。

## 重要原則（CONST_002 / CONST_006）

- commit・push・PR 作成は **ユーザーの明示指示があるまで実行禁止**。
- base ブランチ = **dev**（CLAUDE.md PR フロー / `feature/* → dev → main`）。
- 作業ブランチ: `feat/issue-1059-public-members-fields-batch-n1`。

## PR 本文骨子（準備のみ）

```
## 概要
公開 members list use-case (`list-public-members.ts`) に残っていた summary fields の N+1 を、
`response_id IN (...)` の 1 batch query へ置換して解消（issue #1059 / #224 follow-up-001）。

## 変更ファイル
- apps/api/src/repository/responseFields.ts（listFieldsByResponseIds 追加）
- apps/api/src/use-cases/public/list-public-members.ts（ループ → Map groupBy 置換）
- apps/api/src/repository/__tests__/responseFields.repository.spec.ts（テスト追加）
- apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts（回帰テスト追加）
- docs/30-workflows/completed-tasks/issue-1059-public-members-fields-batch-fetch-n1-prevention/**（タスク仕様書）

## テスト結果
- typecheck / lint 緑
- 対象 vitest（responseFields + list-public-members）全 PASS
- fields クエリ回数 ≦ 1 の回帰 guard PASS（AC-3）
- 出力 PublicMemberListResponse 形状・値不変（AC-4）

## AC チェック
- [x] AC-1 listFieldsByResponseIds 追加
- [x] AC-2 Map(key=response_id) groupBy
- [x] AC-3 fields クエリ ≦ 1 回帰テスト
- [x] AC-4 出力不変
- [x] AC-5 スコープ外不変（tags/schema/endpoint/Google Form/apps/web）
- [x] AC-6 typecheck/lint/vitest 緑

## スクリーンショット
NON_VISUAL（UI/UX 変更なし）のため添付なし。

Closes #1059
```

## 実行タスク

1. ユーザーの PR 作成承認を待つ（完了条件: 明示承認の取得）。
2. 承認後、CLAUDE.md「PR作成の完全自律フロー」に従い dev 同期 → 検証 4 コマンド → PR 作成（完了条件: PR URL 取得）。
3. issue #1059 の状態は user-gated。close する場合も明示承認後のみ（完了条件: 状態変更は承認下のみ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/commands/ai/diff-to-pr.md | PR 本文仕様 |
| 必須 | CLAUDE.md | PR作成の完全自律フロー / base=dev |
| 必須 | outputs/phase-12/implementation-guide.md | PR 本文の主内容 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 準備記録（承認待ち状態 / 本文骨子） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| なし | 最終 Phase |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] ユーザーの明示承認を取得している（未取得時は PR を作成しない）
- [ ] 承認後、base=dev で PR が作成されている
- [ ] PR 本文に AC チェックとテスト結果が反映されている
- [ ] issue #1059 の状態変更は承認下でのみ実施

## タスク100%実行確認【必須】

- PR は user 承認後のみ作成
- 成果物 `outputs/phase-13/main.md` が配置済み
- artifacts.json の `phases[12].status` が PR 作成時に更新される

## 次 Phase への引き渡し

- 次 Phase: なし（ワークフロー完了）
- 残課題: なし（未タスク検出は Phase 12 で 0 件想定）
- ブロック条件: ユーザー承認が得られるまで PR を作成しない

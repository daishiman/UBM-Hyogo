# UT-07A-FU-01 memberTags.assignTagsToMember cleanup

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | ut-07a-01-member-tags-assign-cleanup |
| source issue | #294（CLOSED 維持、`Refs #294` のみ） |
| source completed task | `docs/30-workflows/completed-tasks/COMPLETED-UT-07A-01-member-tags-assign-cleanup.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| evidence_state | LOCAL_EVIDENCE_CAPTURED |
| 実装対象 | `apps/api/src/repository/memberTags.ts`; `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`; `apps/api/src/repository/__tests__/memberTags.repository.spec.ts` |
| 作成日 | 2026-05-15 |
| Phase 13 | blocked_pending_user_approval |

## Summary

Issue #294 の「production caller なし」という前提は、現行コードでは `apps/api/src/workflows/tagQueueResolve.ts` が唯一の production caller として存在するため stale である。
そのため `assignTagsToMember` は削除せず、`tagQueueResolve` workflow 専用 helper として本体コード上で明示する。
実装差分は `apps/api/src/repository/memberTags.ts` のファイル冒頭コメント、関数 JSDoc、provider interface JSDoc と、`memberTags` 境界を固定する focused tests に限定する。

## Scope

### 含む

- `assignTagsToMember` が `tagQueueResolve` workflow 専用 helper であり、直接呼び出し禁止であることを JSDoc に明記する
- `memberTags.readonly.test-d.ts` で `assignTagsToMember` 以外の `assign*` 派生 export を禁止する
- `memberTags.repository.spec.ts` で production caller を `repository/memberTags.ts` と `workflows/tagQueueResolve.ts` に限定する
- `rg "assignTagsToMember" apps/api/src packages/shared/src` で caller topology を確認する
- Phase 11/12 evidence と aiworkflow-requirements の task workflow / index / artifact inventory を同一 wave で同期する
- source completed task を `completed-tasks/COMPLETED-...` として consumed trace に更新する

### 含まない

- `assignTagsToMember` の削除
- 関数名、引数、戻り値、SQL、D1 schema の変更
- commit / push / PR 作成

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-01.md` | completed |
| 2 | `outputs/phase-02.md` | completed |
| 3 | `outputs/phase-03.md` | completed |
| 4 | `outputs/phase-04.md` | completed |
| 5 | `outputs/phase-05.md` | completed |
| 6 | `outputs/phase-06.md` | completed |
| 7 | `outputs/phase-07.md` | completed |
| 8 | `outputs/phase-08.md` | completed |
| 9 | `outputs/phase-09.md` | completed |
| 10 | `outputs/phase-10.md` | completed |
| 11 | `outputs/phase-11.md` | completed |
| 12 | `outputs/phase-12.md` + `outputs/phase-12/*.md` | completed |
| 13 | `outputs/phase-13.md` | blocked_pending_user_approval |

## DoD

- `apps/api/src/repository/memberTags.ts` の JSDoc/comment 3 箇所のみが runtime code diff
- typecheck / lint / focused tests がローカルで成功
- Phase 12 strict 7 files と root/output `artifacts.json` が存在
- `docs/30-workflows/completed-tasks/COMPLETED-UT-07A-01-member-tags-assign-cleanup.md` が consumed trace を持つ
- commit / push / PR はユーザー承認まで未実行

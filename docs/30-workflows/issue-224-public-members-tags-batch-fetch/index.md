# issue-224-public-members-tags-batch-fetch

## 概要

公開 `GET /public/members` に `expand=tags` を追加し、公開 member 一覧の tags を既存 batch helper
`listTagsByMemberIds` で一括取得する実装仕様。目的は tags 取得の N+1 回帰を防ぎつつ、`expand` 未指定時の
現行 response shape を維持すること。

- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
- implementation_status: `implemented_local_evidence_captured`
- Phase 12 strict 7: `outputs/phase-12/` に配置
- Phase 13: commit / push / PR は user-gated

## 実装区分の判定根拠

本 workflow は `apps/api` と `packages/shared` の型・zod・use-case 配線を変更する実装仕様書である。
現サイクルで Phase 5 の対象ファイルへ code/test diff を反映し、Phase 11 の自動テスト証跡を取得済み。
状態は `implemented_local_evidence_captured` / `implementation_complete_pending_pr` とする。

## 受け入れ条件

| ID | 条件 | 根拠 |
| --- | --- | --- |
| AC-1 | `/public/members?expand=tags` で `items[].tags` が返る | `phase-2.md` / `phase-5.md` |
| AC-2 | tags 取得が member 件数に比例しない | `phase-4.md` / `phase-6.md` |
| AC-3 | `expand` 未指定時は tags key を出さず query も増やさない | `phase-2.md` / `outputs/phase-11/main.md` |
| AC-4 | visibility filter 通過後の memberId のみで tags を取得する | `outputs/phase-1/requirements.md` |
| AC-5 | contract / use-case test で N+1 回帰を検知する | `phase-9.md` |

## 対象ファイル

| 区分 | パス | 状態 |
| --- | --- | --- |
| query parser | `apps/api/src/_shared/search-query-parser.ts` | 実装済み |
| shared zod | `packages/shared/src/zod/viewmodel.ts` | 実装済み |
| shared type | `packages/shared/src/types/viewmodel/index.ts` | 実装済み |
| view-model | `apps/api/src/view-models/public/public-member-list-view.ts` | 実装済み |
| use-case | `apps/api/src/use-cases/public/list-public-members.ts` | 実装済み |
| repository helper | `apps/api/src/repository/memberTags.ts` | 再利用・無改変 |
| contract spec | `apps/api/src/routes/public/index.contract.spec.ts` | 実装済み |
| use-case spec | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 実装済み |

## Phase 構成

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/requirements.md` | completed |
| 2 | `phase-2.md` | completed |
| 3 | `phase-3.md` | completed |
| 4 | `phase-4.md` | completed |
| 5 | `phase-5.md` | completed |
| 6 | `phase-6.md` | completed |
| 7 | `phase-7.md` | completed |
| 8 | `phase-8.md` | completed |
| 9 | `phase-9.md` | completed |
| 10 | `phase-10.md` / `outputs/phase-10/final-review-result.md` | completed |
| 11 | `phase-11.md` / `outputs/phase-11/*` | completed |
| 12 | `outputs/phase-12/*` | completed |
| 13 | `phase-13.md` | blocked: user approval required |

## 依存関係

Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 の直列。
実装時は Phase 4 の failing tests を先に追加し、Phase 5 の code diff、Phase 6/7 の追加回帰 guard の順に進める。

## NON_VISUAL 境界

UI rendering / CSS / screenshot は対象外。検証は `apps/api` contract spec、use-case unit spec、
manual smoke 手順で行う。`apps/web` の tags 表示は #1006 等の UI レーンに委譲する。

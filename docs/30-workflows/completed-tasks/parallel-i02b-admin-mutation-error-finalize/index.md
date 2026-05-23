# parallel-i02b-admin-mutation-error-finalize — AdminMutationError クラス完全削除 / panel 統合

**[実装区分: 実装仕様書]** — コード変更を伴う（class 名 mechanical 置換 + 1 class 定義削除）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | parallel-i02b-admin-mutation-error-finalize |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02b-admin-mutation-error-finalize/spec.md` |
| 親 spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md`（前提・本 spec 完了で DoD 143 を達成し completed locally に到達） |
| taskType | implementation |
| visualEvidence | NON_VISUAL（internal error class の置換のみ・UI 出力に観測差分なし） |
| implementationCategory | standard |
| 実装対象 | `apps/web/src/features/admin/hooks/useAdminMutation.ts`、`apps/web/src/components/admin/{MeetingPanel,SchemaDiffPanel,RequestQueuePanel}.tsx` |
| 検証対象 spec | `apps/web/src/components/admin/__tests__/{MeetingPanel,SchemaDiffPanel,RequestQueuePanel}.component.spec.tsx`、`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` |
| 作成日 | 2026-05-22 |
| ブランチ | 現行 worktree（HEAD） |
| workflow_state | implemented_local_evidence_captured |
| implementation_status | implementation_complete_pending_pr |

## 判定根拠（実装区分）

source spec `parallel-i02b-admin-mutation-error-finalize/spec.md` §判定根拠 のとおり、baseline では `useAdminMutation.ts:28-36` に `AdminMutationError` クラスが現存し、3 panel が import / throw / instanceof していた。2026-05-23 の同一サイクル実装で i02 spec DoD 143（AdminMutationError class 削除）は完了した。

## Summary

`apps/web/src/features/admin/hooks/useAdminMutation.ts` の `AdminMutationError` クラス定義を削除し、3 consumer panel（および `MeetingPanel` 内 local helper `unwrapAdminResult`）の import / throw / `instanceof` 判定を `FetchAuthedError`（`apps/web/src/lib/fetch/errors.ts`）に統合した。`FetchAuthedError.message` は固定文言のため、旧 UI fallback と同じ表示を保つ箇所では `bodyText` を読む。

## 変更対象ファイル

| Path | 種別 | 変更箇所 | 件数 |
| --- | --- | --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | modify | line 28-36（class 定義削除） | 1 |
| `apps/web/src/components/admin/MeetingPanel.tsx` | modify | line 18 / 54 / 164 / 165 | 4 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | modify | line 26 / 122 / 203 / 210 | 4 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | modify | line 11 / 68 / 130 | 3 |
| 合計 | | | 12 |

## 受け入れ条件（AC）

| ID | 内容 |
| --- | --- |
| AC-1 | `useAdminMutation.ts` から `AdminMutationError` クラス定義が削除されている |
| AC-2 | 3 panel の `AdminMutationError` 参照（import / throw / instanceof）がすべて `FetchAuthedError` に置換されている |
| AC-3 | `grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx'` が **0 件** |
| AC-4 | `mise exec -- pnpm typecheck` が PASS |
| AC-5 | `mise exec -- pnpm lint` が PASS |
| AC-6 | 4 spec（MeetingPanel / SchemaDiffPanel / RequestQueuePanel / useAdminMutation）が回帰なく PASS |
| AC-7 | `useAdminMutation` の public API シグネチャ（`UseAdminMutationReturn<T>.error: Error \| null`）に変更がない |
| AC-8 | `integration-fixes/index.md` の検出表で i02b を `completed locally`、i02 を `completed locally`（DoD 143 達成）に更新 |

## Phase 構成

| Phase | 種別 | 目的 |
| --- | --- | --- |
| 1 | 分析 | baseline grep / 12 箇所 確認 / 隠れ参照（`e.message` 等）有無確認 |
| 2 | 設計 | 置換マッピング表確定 / 実装順序固定 |
| 3 | システム仕様整合 | `apps/web/src/lib/fetch/errors.ts`・`apps/web/src/lib/admin/api.ts` の read-only 参照確認 |
| 4 | 実装 | panel 3 → typecheck → hook class 削除 → typecheck の順で適用 |
| 5 | 単体テスト | 4 spec を focused 実行し回帰なし確認 |
| 6 | 静的検証 | typecheck / lint / grep 0 件 gate |
| 7 | 統合テスト | panel 3 spec を統合実行（既存 component spec のみ） |
| 8 | 受入検証 | AC-1〜AC-7 を機械検証 |
| 9 | パフォーマンス | runtime overhead なし（mechanical rename）→ 確認のみ |
| 10 | ガバナンス | branch protection / required check に変更なし（read-only 確認） |
| 11 | エビデンス収集 | typecheck / lint / grep / focused test ログを `outputs/phase-11/` に保存 |
| 12 | ドキュメント整合 | i02 / i02b spec / integration-fixes/index.md / 本 index.md の同期 |
| 13 | 完了承認 | 承認ゲート（commit / push / PR はユーザー承認後に別タスクで実施） |

## 不変条件

1. `apps/web/src/lib/fetch/errors.ts` の `FetchAuthedError` シグネチャ変更禁止
2. `apps/web/src/lib/admin/api.ts` の `AdminMutationResult` / `AdminMutationOk` / `AdminMutationErr` 型は削除対象**ではない**（`AdminMutationError` クラスとは別概念）
3. 新 error class の追加禁止
4. 既存 test の assertion 修正禁止（toast 文言で検証する設計が正本）
5. API endpoint 側の error response 変更禁止

## 単一実装サイクル完了の根拠（CONST_007）

- 編集 4 ファイル / 置換 12 箇所すべて mechanical
- 新規 spec 追加なし / 既存 test assertion 修正なし
- 外部依存なし / 合意未済の分岐なし
- 「将来 PR」「バックログ送り」要素なし — i02 closeout として本サイクルで完了する

## 参照

- source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02b-admin-mutation-error-finalize/spec.md`
- 前提 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md`
- 共有 error class: `apps/web/src/lib/fetch/errors.ts:1-17`
- 型定義: `apps/web/src/lib/admin/api.ts:11-22`

## Phase Links

- [Phase 1](phase-1.md)
- [Phase 2](phase-2.md)
- [Phase 3](phase-3.md)
- [Phase 4](phase-4.md)
- [Phase 5](phase-5.md)
- [Phase 6](phase-6.md)
- [Phase 7](phase-7.md)
- [Phase 8](phase-8.md)
- [Phase 9](phase-9.md)
- [Phase 10](phase-10.md)
- [Phase 11](phase-11.md)
- [Phase 12](phase-12.md)
- [Phase 13](phase-13.md)

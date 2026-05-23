# Phase 5: 単体テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 種別 | テスト |
| 入力 | Phase 4 実装結果 |
| 出力 | focused vitest 実行ログ（全 PASS） |

## 目的

`AdminMutationError` → `FetchAuthedError` への内部 throw 置換が、既存 spec の error path assertion に回帰を起こさないことを focused に確認する。

## 対象 spec

| Spec | 確認観点 |
| --- | --- |
| `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` | 422 / 409 / 500 path で toast 文言（削除済み会員 / 既に出席登録 / generic）が回帰なし |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 403 / 422 / 409 path / UI-02..UI-06 で `data-feedback-kind` 属性が回帰なし |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | TC-25（409）で「他 admin 処理済」toast が回帰なし |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | `FetchAuthedError` / `AuthRequiredError` assert（i02 で更新済）が引き続き PASS |

## 実行手順

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run "(MeetingPanel|SchemaDiffPanel|RequestQueuePanel|useAdminMutation)"
```

ログは `outputs/phase-11/evidence/test-focused.log` に保存する。

## 既存 spec への変更

**なし**。3 panel spec は `AdminMutationError` を直接 import / assert していないため（source spec §テスト方針 で grep 確認済）、assertion 修正不要。

## 追加 spec

**なし**。CONST_007 / source spec §テスト方針 §追加テスト に従い、本 spec では追加 spec を作成しない。

## 完了条件


- [x] Phase 5 の完了条件を満たす証跡が保存されている。
- 4 spec が full PASS
- skipped / todo が新規発生していない
- 既存 assertion に変更が入っていない（`git diff -- '**/__tests__/'` が空）

## 失敗時の対応

| 症状 | 対応 |
| --- | --- |
| toast 文言不一致 | Phase 4 §Step 1-3 の hardcode 文言を再確認（変更してはならない） |
| `instanceof` 判定が常に false | import path が `FetchAuthedError` re-export 経由か確認 |
| `e.message` 参照で値が違う | Phase 1 §3 を再実行し隠れ参照を再特定 → Phase 2 に戻る |

## 参照資料

- source spec §テスト方針, §入出力・副作用
- Phase 4 実装結果

## 実行タスク

- Phase 5 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。

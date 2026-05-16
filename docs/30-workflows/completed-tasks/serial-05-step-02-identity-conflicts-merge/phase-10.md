# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 機能名 | serial-05-step-02-identity-conflicts-merge |
| 実装区分 | 実装仕様書 |
| 作成日 | 2026-05-16 |
| 前提Phase | Phase 9（品質保証） |

## 目的

既存 `IdentityConflictRow` hardening が API contract / shared schema / design token /
a11y / 400・409 error handling を満たすことを最終判定する。

## DoD チェックリスト

- [ ] `IdentityConflictRow.tsx` の `callJson()` が撤去され、`useAdminMutation` を使っている
- [ ] `page.tsx` は server component のまま `fetchAdmin<ListIdentityConflictsResponse>()` を使う
- [ ] merge body は `{ targetMemberId: item.candidateTargetMemberId, reason: reason.trim() }`
- [ ] response 型は `MergeIdentityResponse`（`mergedAt` / `targetMemberId` / `archivedSourceMemberId` / `auditId`）
- [ ] 400 `TARGET_MEMBER_MISMATCH` / 409 `ALREADY_MERGED` の表示がテストされている
- [ ] reason 空 submit が disabled
- [ ] design token gate が clean
- [ ] focused unit / smoke / typecheck / lint が green

## API contract drift 検証

```bash
rg -n "MergeIdentityRequestZ|TARGET_MEMBER_MISMATCH|ALREADY_MERGED" apps/api/src/routes/admin/identity-conflicts.ts packages/shared/src/schemas/identity-conflict.ts
rg -n "identity-conflicts/.*/merge|candidateTargetMemberId|useAdminMutation|callJson" apps/web/src/components/admin/IdentityConflictRow.tsx
```

## 多角的チェック観点

| 観点 | 確認内容 | 結果 |
| --- | --- | --- |
| API contract | request/response が shared schema と一致 | `{{RESULT}}` |
| server-client boundary | page server / row client の境界維持 | `{{RESULT}}` |
| useAdminMutation | `trigger` / `isLoading` / `error` surface を使用 | `{{RESULT}}` |
| a11y | label / `role=alert` / disabled state / keyboard 操作 | `{{RESULT}}` |
| PII redact | raw email を表示せず `responseEmailMasked` のみ | `{{RESULT}}` |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 最終レビュー結果 | `outputs/phase-10/final-review-result.md` | 判定結果 |
| API contract diff | `outputs/phase-10/api-contract-check.md` | drift 検証 |
| DoD checklist 結果 | `outputs/phase-10/dod-checklist.md` | DoD 評価 |

## 完了条件

- [ ] DoD 全項目が確認済
- [ ] API contract drift が 0 件
- [ ] `callJson()` / 新規 `_components` 前提が残っていない
- [ ] 判定（completed / runtime_pending / spec_created）が `final-review-result.md` に記録済

## 次のPhase

Phase 11: VISUAL evidence。

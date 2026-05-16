# Phase 8: 統合テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 機能名 | serial-05-step-02-identity-conflicts-merge |
| 実装区分 | 実装仕様書 |
| 作成日 | 2026-05-16 |
| 前提Phase | Phase 7（refactor / focused unit green） |

## 目的

既存 `/admin/identity-conflicts` 画面で、server component の list fetch と client
`IdentityConflictRow` の merge / dismiss mutation が結合して動くことを確認する。

## 実行タスク

- [ ] `page.tsx` が `fetchAdmin<ListIdentityConflictsResponse>()` を使い、D1 直接アクセスを持たないことを確認
- [ ] `IdentityConflictRow` が `useAdminMutation` 経由で merge / dismiss を呼ぶことを focused test で確認
- [ ] Playwright smoke で `/admin/identity-conflicts` の初期表示と merge-confirm 表示を確認
- [ ] 400 / 409 の mock response で UI が閉じず reason を保持することを確認

## 実行手順

```bash
rg -n "fetchAdmin<ListIdentityConflictsResponse>|IdentityConflictRow" apps/web/app/\(admin\)/admin/identity-conflicts/page.tsx
rg -n "callJson|useAdminMutation|candidateTargetMemberId" apps/web/src/components/admin/IdentityConflictRow.tsx
pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx
pnpm --filter @ubm-hyogo/web e2e:smoke
```

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 統合テスト結果 | `outputs/phase-08/integration-test-report.md` | focused unit + smoke 結果 |
| API 境界確認 | `outputs/phase-08/server-client-boundary.md` | page server / row client の境界 |

## 完了条件

- [ ] `callJson()` が残っていない
- [ ] `useAdminMutation` の `trigger` が merge / dismiss 両方で使われている
- [ ] merge payload が `{ targetMemberId: item.candidateTargetMemberId, reason: reason.trim() }`
- [ ] smoke で `/admin/identity-conflicts` 経路が green
- [ ] `outputs/phase-08/integration-test-report.md` に command / exit code / 件数を記録

## 次のPhase

Phase 9: 品質保証。

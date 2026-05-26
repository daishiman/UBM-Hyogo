# Phase 7: カバレッジ

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 7 / 13 |
| coverage tool | vitest --coverage（apps/web） |

## 目標カバレッジ

| ファイル | branch | line | function |
|---|---|---|---|
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | 100% | 100% | 100% |
| `apps/web/src/lib/admin/safe-server-fetch.ts`（re-export 後） | 既存維持（90% 以上） | 既存維持 | 既存維持 |
| `apps/web/src/components/public/SectionError.tsx` | 100% | 100% | 100% |
| `apps/web/src/components/member/SectionError.tsx` | 100% | 100% | 100% |
| `apps/web/app/profile/page.tsx` の degrade branch | section degrade 経路 1 case 以上 | — | — |
| `apps/web/app/(public)/members/page.tsx` | 同上 | — | — |
| `apps/web/app/(public)/members/[id]/page.tsx` | 同上 | — | — |

## 検証コマンド

```bash
mise exec -- pnpm --dir apps/web exec vitest run --coverage \
  src/lib/server-fetch \
  src/components/public/__tests__/SectionError.spec.tsx \
  src/components/member/__tests__/SectionError.spec.tsx
```

## 未達時の対応

- branch 100% 未達 → 該当 case を Phase 6 に追加
- admin spec regression → admin re-export 層の signature を見直す（共通 helper の `codePrefix` パラメータの初期値ハンドリングが疑い）

## 成果物

- 本ファイル

## 完了条件

- カバレッジ目標が定量的に設定されている
- 未達時のフォロー手順が明記されている

# Implementation Guide — issue-879 safeServerFetch 横展開

> 実装済み差分の索引。Phase 5 の手順、変更ファイル一覧、DoD、検証コマンドを 1 か所に集約する。

## 変更ファイル一覧

| ファイル | 種別 |
|---|---|
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | 新規 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 新規 |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | 改変（re-export 化） |
| `apps/web/src/components/public/SectionError.tsx` | 新規 |
| `apps/web/src/components/public/__tests__/SectionError.spec.tsx` | 新規 |
| `apps/web/src/components/member/SectionError.tsx` | 新規 |
| `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | 新規 |
| `apps/web/app/profile/page.tsx` | 改変 |
| `apps/web/app/profile/page.spec.tsx` | 改変（PR-1〜PR-5 追加） |
| `apps/web/app/(public)/members/page.tsx` | 改変 |
| `apps/web/app/(public)/members/page.spec.tsx` | 新規 or 改変（PM-1, PM-2） |
| `apps/web/app/(public)/members/[id]/page.tsx` | 改変 |
| `apps/web/app/(public)/members/[id]/page.spec.tsx` | 改変（PD-1〜PD-4） |

## 実装順序

1. `safe-fetch.ts` 新設＋spec（Phase 5 S-1 / S-8）
2. admin re-export 化（Phase 5 S-2）→ admin spec を回帰
3. SectionError public / member 新設＋spec（Phase 5 S-3 / S-4 / S-8）
4. page 置換 3 件＋spec（Phase 5 S-5〜S-7 / S-8）
5. 全 vitest / typecheck / lint
6. unassigned-task spec の移動 or 補注（Phase 12 system spec 更新判定）

## DoD

- AC-1〜AC-8 充足
- 検証コマンド（Phase 9 集約）が全 green
- admin 既存 spec 無修正
- HEX 直書き 0 件 / 新規 primitive 0 件

## 検証コマンド

Phase 9 §「検証コマンド集約」を参照。

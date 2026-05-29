# Phase 1 — 要件定義

## 1. タスク分類

- **UI task** (VISUAL): profile / admin / public 3面の UI 改修。Phase 11 screenshot 必須。
- 設計フェーズ NOT docs-only。3 Track 並列実装可能。

## 2. 真の論点（システム思考）

**論点**: 元 unassigned-task spec は「H3 (allHiddenByPublishState===true)」の修復として提示されているが、staging runtime evidence は未取得。よって本タスクは「H3 が万一発生したとき、UX 上の不可視性・運用負荷・離脱誘発を最小化する 3 つの独立改修」として定義する（条件未確認でも UX 価値あり = trigger-independent value）。

### 因果（強化ループ）

```
publicConsent=false 多発
  → public members 一覧空（H3）
  → 来訪者離脱 + 既存会員の同意モチベ低下
  → publicConsent 修正導線無し
  → 再帰
```

### バランスループ（本タスクが追加）

```
Track A: profile に CTA → Form 再回答 → publicConsent=true 増 → public 可視数 +
Track B: admin bulk republish → publishState=public 増 → public 可視数 +
Track C: 「公開対象 0 件」専用 fallback → 来訪者に「壊れていない」signal → 離脱抑制
```

### 責務境界・状態所有権

| Surface | 状態所有 | 更新経路 |
|---------|---------|---------|
| `members.public_consent` | D1（正本）/ Google Form（入力源） | `responses-sync` only |
| `member_status.publish_state` | D1 | admin `PATCH /admin/members/:memberId/status`（既存）/ 本人 `POST /me/visibility-request` 経由の queue（既存）|
| profile UI state | Server Component 由来 + Client state（dialog） | `/me/profile` GET |
| admin UI state | Client component + `useAdminMutation` | 同上 PATCH |
| public UI state | Server Component | `/public/members` + `/public/stats` GET |

**重要**: 本タスクで状態所有権は一切変更しない。INV-4 を遵守。

## 3. 価値とコスト

| Track | 初回価値 | 初回コスト | 将来拡張余地 |
|-------|---------|----------|------------|
| A | 高（会員が自分の状態を理解できる） | 低（callout 1コンポーネント） | publicConsent toggle direct API（本タスク外） |
| B | 中（運用負荷削減） | 中（drawer + sequential mutation） | 真の bulk endpoint（本タスク外） |
| C | 高（来訪者離脱抑止） | 低（fallback 1コンポーネント） | analytics 計測（本タスク外） |

## 4. 4 条件評価

- **価値性**: 会員 / 管理者 / 来訪者の 3 ペルソナそれぞれの「公開状態の不可視性」コストを下げる。✅
- **実現性**: 既存 API のみで完結。新 D1 schema / 新 endpoint なし。✅
- **整合性**: INV-1〜7 全遵守。INV-4 reconcile 戦略は CTA 誘導のみで mutation API 追加なし。✅
- **運用性**: Phase 11 screenshot で UX 検証可能。staging 配信後の verify 経路明確。✅

## 5. 既存コードベース調査結果（命名規則・参照点）

### apps/web

| 既存 | 役割 | 命名規則 |
|------|------|---------|
| `app/(member)/profile/_components/StatusSummary.tsx` | publicConsent label 表示 | PascalCase コンポーネント |
| `app/(member)/profile/_components/RequestActionPanel.tsx` | publishState 申請 panel（本タスク変更なし） | PascalCase |
| `src/lib/api/me-types.ts` `MeProfileStatusSummary` | profile summary 型 | PascalCase + suffix Z |
| `src/components/feedback/EmptyState.tsx` | 既存汎用 empty | PascalCase |
| `src/components/ui/Callout` | callout primitive（OKLch tokens） | 既存 primitive |
| `src/features/admin/hooks/useAdminMutation.ts` | admin mutation hook | camelCase hook |
| `src/components/admin/FormField` | admin form input 標準 | PascalCase |
| `src/lib/api/public.ts` `getPublicStats` | public stats fetcher | camelCase function |
| `STABLE_KEY` from `@ubm-hyogo/shared` | publicConsent / rulesConsent key 正本 | constant SCREAMING_SNAKE |

### apps/api（変更禁止 / 参照のみ）

| 既存 | 役割 |
|------|------|
| `PATCH /admin/members/:memberId/status` | `publishState` 更新（INV-1 適合の bulk 反復先） |
| `GET /me/profile` | profile summary（`publicConsent` 含む） |
| `GET /public/stats` | `memberCount` / `publicMemberCount`（Track C 判別根拠） |
| `resolveEditResponseUrl(ctx, memberId)` | edit URL 解決（fallback: `responderUrl`） |

### Google Form 固定値（参照のみ・CLAUDE.md より）

- `responderUrl`: `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform`

## 6. スコープ確定

[index.md §スコープ](index.md#スコープ) に従う。

## 7. 受入条件

[index.md §受入条件](index.md#受入条件-acceptance-criteria) AC-1〜AC-9。

## 8. carry-over 確認

- 直前完了: `bf6efe49f feat(admin-ui): /admin/members fetch+visual followup-001 (404 fix + prototype alignment)` (#968)
- 親 workflow: `google-form-reflection-diagnostics`（completed-tasks 配置済）の Spec-B-3。診断基盤コードは既に dev に存在し、本タスクは UI 層のみ追加。
- 衝突する変更なし。

## 9. targeted run リスト（FB-UI-02-2 対応）

Phase 4/6 で実行する vitest 対象:

```
apps/web/src/components/profile/__tests__/PublicConsentCallout.spec.tsx
apps/web/app/(member)/profile/_components/__tests__/PublicConsentCallout.integration.spec.tsx
apps/web/src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx
apps/web/src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts
apps/web/src/components/public/__tests__/AllHiddenFallback.spec.tsx
apps/web/app/(public)/members/page.spec.tsx  # 既存に分岐 case 追加
```

実行コマンド:
```bash
mise exec -- pnpm --filter @repo/web exec vitest run --no-coverage \
  src/components/profile/__tests__/PublicConsentCallout.spec.tsx \
  src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx \
  src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts \
  src/components/public/__tests__/AllHiddenFallback.spec.tsx
```

## 完了条件

- [x] 真の論点 / 因果 / 価値コスト / 4 条件評価が記載されている
- [x] 既存コードの命名規則 / 参照点が記録されている
- [x] スコープ・AC が `index.md` と一致する
- [x] targeted run リストが Phase 4/6 で使える

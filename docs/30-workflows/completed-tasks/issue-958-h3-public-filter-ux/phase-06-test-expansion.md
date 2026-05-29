# Phase 6 — テスト拡充

## 1. 失敗パス / 回帰 guard

### Track A
- A-E1: `responderUrl=""`（fallback 空）→ CTA は `responderUrl` 空でも render エラーにならない（ただし fallback href は空文字、テストで明示）
- A-E2: `editResponseUrl` が外部以外（`javascript:` 等）→ Phase 5 で whitelist チェック追加（http/https のみ render、それ以外は responderUrl）
- A-R1: `RequestActionPanel` が依然 mount される（既存機能の回帰なし）

### Track B
- B-E1: ネットワーク総失敗（全 mutation reject）→ `succeeded=0, failed=N`, drawer 自動 close せず
- B-E2: candidates 0 件 → 「一括公開復帰」ボタン disabled
- B-E3: 同一 memberId が重複 → 重複排除（`Set` 化）して送信
- B-R1: 既存 admin members 表の挙動（pagination/sort）に影響なし（snapshot or DOM 構造維持）

### Track C
- C-E1: `getPublicStats` が timeout → safe fallback → 既存 EmptyState
- C-E2: `memberCount=10, publicMemberCount=10` で `items.length=0` （filter で hit 0） → EmptyState（allHidden=false）
- C-R1: 既存 `MemberGrid` render path に影響なし

## 2. 補助 command（Phase 9 grep gate 用）

```bash
# INV-1: 新 endpoint 無し
git diff dev -- apps/api/src/routes/ | grep -E '^\+.*\.(get|post|put|patch|delete)\(' && exit 1 || true

# INV-7: 直接 fetch なし（Bulk hook 関連）
grep -nE "fetch\(['\"]/api/admin/members" apps/web/src/features/admin/hooks/useBulkRepublish.ts && exit 1 || true

# INV-2: HEX 直書きなし（新規ファイル）
grep -nE "#[0-9a-fA-F]{3,8}" apps/web/src/components/public/AllHiddenFallback.tsx \
  apps/web/app/\(member\)/profile/_components/PublicConsentCallout.tsx \
  apps/web/src/components/admin/BulkRepublishDrawer.tsx && exit 1 || true
```

## 3. integration spec

`apps/web/app/(member)/profile/_components/__tests__/PublicConsentCallout.integration.spec.tsx`:
- 実 `MeProfileResponseZ` で parse した object を渡し、render が成立すること

## 4. 完了条件

- [x] 失敗パス / 回帰 guard 列挙
- [x] grep gate 整備
- [x] integration 1 件

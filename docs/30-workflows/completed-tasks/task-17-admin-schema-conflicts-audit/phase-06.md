# Phase 6: テスト拡充

[実装区分: 実装仕様書]

## 目的

happy path 以外の fail path / 境界値 / 回帰 guard を補強する。

## 追加テストケース

### `apps/web/src/lib/admin/__tests__/api.test.ts`

- 409 (apply 競合) で error code が `SCHEMA_APPLY_CONFLICT` に正規化される
- backfill `affectedCount` 0 / 1 / 9999 の境界値で UI を破綻させない
- `postSchemaAlias` が 404 を返したとき `ASSIGN_NOT_AVAILABLE` 相当の UI 分岐に接続できる

### `IdentityConflictRow.test.tsx`

- merge で reason が空文字なら client validate で reject (server fetch 行かない)
- merge body は `{ targetMemberId, reason }` であり、`keepMemberId` を使わない
- dismiss body は `{ reason }`

### `AuditLogPanel.test.tsx` / `audit/page.test.ts`

- `pageSize` 上限 (例: 200) を超える値は client 側で clamp
- `from > to` の date 入力は client validate でエラー、URL に反映しない
- ISO8601 (UTC) ↔ JST 変換境界 (例: `2026-05-10T15:00:00Z` → JST 翌日)

### `SchemaDiffPanel.test.tsx`

- stableKey 入力中の連打 (busy 中の onClick) で fetch が 1 回しか呼ばれない
- 失敗後の再 submit で error 文言がリセットされる

- ESC で modal close
- 適用中 (busy=true) で「キャンセル」ボタン disabled

### `IdentityConflictRow.test.tsx`

- merge 成功直後に `pair` が変わったとき stale state が表示されない (FB-STATE-DETAIL-002 / `useEffect`-based prop sync)
- pending 中に「キャンセル」で modal close + state 初期化

### `AuditLogPanel.test.tsx`

- targetType=`""` (option すべて) で URL から `targetType` 削除
- date 範囲指定で `from`/`to` が UTC ISO で URL 反映

### `AuditLogPanel.test.tsx`

- 同一日付 (JST) の複数 entry が正しく同一 group に集約
- `actorEmail=null` で表示が "system" にフォールバック
- `targetId` の slice(0, 8) が正しく動作

### a11y 回帰

- 全 modal で focus trap (`Modal` primitive 保証) を `userEvent.tab()` で確認
- date input の `aria-label` 設定確認

## 補助 command

```bash
# 拡充後の Green 確認
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
```

## DoD

- [ ] 上記追加ケースが全 Green
- [ ] fail path テストが canonical helper/component で最低 2 件追加
- [ ] a11y 回帰テストで focus trap が検証済み

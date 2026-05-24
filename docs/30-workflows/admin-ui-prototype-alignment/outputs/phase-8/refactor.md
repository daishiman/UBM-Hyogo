# Phase 8: リファクタ

## 適用

- 10 admin page.tsx で重複していた `try { fetchAdmin } catch { throw }` パターンを `safeServerFetch + SafeResult` に統一。`audit/page.tsx` の手書き try/catch も同一 helper に集約。
- error boundary 戦略を「page 全体 throw → error.tsx」から「per-section AdminSectionError degrade」へ正本変更。`error.tsx` は真の uncaught error (renderer crash) のみを受ける役割に縮小。
- `_shared` barrel `index.ts` で 6 component + 各 Props/type を export。`@/features/admin/components/_shared` 1 import で集約。

## 持ち越し (本サイクル外)

| 項目 | 理由 |
| --- | --- |
| 既存 `*Panel.tsx` の内部実装を `AdminTable` / `AdminQueuePanel` で書き直す | UI degrade 基盤導入を優先。Panel surface は不変 |
| `TagsClientShell` / `RequestsClientShell` への分離 | 既存 Panel に selection state が内包されており、移行は別 PR |
| `KpiCard` → `AdminStat` への統合 | Phase 8 仕様書でも persistent な判断保留事項として記載 |

これらは regression なし・API surface 不変で持ち越せるため、別 task として登録する。

# Phase 8 — リファクタリング / DRY 化

## 評価
本タスクは新規 1 route + 1 component + 1 repository helper の追加で、既存コードへの侵食は最小限。以下を確認:

| 観点 | 結論 |
|------|------|
| route 内 helper 抽出 | `sanitizePayload` / `decodeCursor` / `encodeCursor` を route ファイル内 private 関数として配置（再利用先がないため module scope に留める） |
| repository helper の重複 | `markResolved` / `markRejected` は既存（04b-followup-001）。本タスクでは route 側で D1 batch を直接組み立てるため、subquery-gated UPDATE は route に閉じた（理由: member_status と原子化するため repository で共通化しにくい） |
| Web component の再利用 | `RequestQueuePanel` は他画面で使われない単一画面コンポーネント。MembersTable 等との共通化は行わない |
| API client | `resolveAdminRequest` は `call(...)` を介す。既存 `patchMemberStatus` 等と同じ pattern |

## DRY 化の対象とした項目
- ✅ admin proxy 経由 fetch の共通化: `call()` をそのまま利用
- ✅ confirmation modal の自前実装: 既存 admin 画面に共通 modal が無いため、本タスクでは route 内に閉じた。将来 3 画面以上で再現する場合に共通化を検討（今回は YAGNI）

## 結論
追加の refactor 作業なし。

# Phase 6: テスト拡充

Phase 4 で Red を定義し Phase 5 で Green にした後、fail path・後方互換 regression guard を補強する。
対象: `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`。

---

## 6.1 fail path / fallback 補強ケース

Phase 4 で TC-BAB-TAG-07（member fallback / tag label 未解決 fallback）を定義済み。Phase 6 では以下を追加検証として確認する（必要に応じてケース化）。

| ID | 目的 | 入力 | 期待 | AC |
|----|------|------|------|----|
| TC-BAB-TAG-10 | `membersById={}`（空 Record）でも全行 fallback | `results=[{memberId:"m_del",tagId:"tag_eng",status:"skipped_deleted"}]`, `membersById={}` | skipped 行に `m_del`（fallback） | AC-4 |
| TC-BAB-TAG-11 | skipped と notFound が混在しても各々独立に解決 | `results=[{memberId:"m_del",tagId:"tag_eng",status:"skipped_deleted"},{memberId:"a",tagId:"tag_mgr",status:"tag_not_found"}]`, `membersById=MEMBERS_BY_ID` | skipped 行=`退会 花子`、notFound 行=`経営者` | AC-1+AC-2 |

注: TC-BAB-TAG-10/11 はコア仕様の追加担保であり、Phase 4 の TC-06..09 で line/branch が既に充足する場合は冗長化を避け省略可。実装サイクルで Phase 7 のカバレッジ結果を見て要否を判断する。

---

## 6.2 後方互換 regression guard

| ID | 確認内容 |
|----|----------|
| TC-BAB-TAG-03（既存・無変更） | `membersById` prop を渡さず testid 存在のみ検証。実装後も green であることを確認（生 ID 表示の従来経路が壊れていない証跡） |
| TC-BAB-01..05（既存） | publish / hide / soft-delete / 初回ロード / trigger / disabled の挙動が無変更 |
| TC-BAB-TAG-01..02, 04..05（既存） | picker 描画 / trigger payload / unassign / disabled が無変更 |
| a11y violations 0（既存） | `membersById` 追加で a11y 違反が増えないこと（li / ul 構造不変のため影響なしを確認） |

---

## 6.3 既存 TC 非 regression の確認方針

- 既存ケースは **一切編集しない**（テキスト assert を追加した新規ケースのみで表示名検証を担保する）。
- `beforeEach` の `bulkTrigger.mockResolvedValue({ batchId, results: [] })` 既定値は維持。新規ケースは各 `it` 内で `bulkTrigger.mockResolvedValue(...)` を上書きする（既存 TC-BAB-TAG-03 と同パターン）。
- `MEMBERS_BY_ID` fixture はテストファイル冒頭の定数として追加し、既存 `AVAILABLE` と並置する。
- 検証コマンド: `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx` で全ケース green を確認する。

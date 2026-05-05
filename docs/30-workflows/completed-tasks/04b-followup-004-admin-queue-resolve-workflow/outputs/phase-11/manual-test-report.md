# Phase 11 — Manual Test Report (詳細)

## 環境
- Node 24 / pnpm 10 (mise)
- Vitest + miniflare D1（in-memory）
- @testing-library/react

## 実施シナリオと結果

### シナリオ 1: pending list FIFO 表示
- 自動: API TC-02。created_at ASC, note_id ASC で 2 件返却を確認
- repository: RP-1（FIFO + status/type 絞り）/ RP-2（cursor pagination）
- 結果: ✅ PASS

### シナリオ 2: visibility approve flow
- 自動: API TC-04（approve → publish_state=hidden / note resolved / body 末尾 `[resolved]`）
- 自動: Web TC-22（modal open）
- 結果: ✅ PASS

### シナリオ 3: delete approve flow
- 自動: API TC-05（approve → is_deleted=1 + deleted_members 1 行 + note resolved）
- 自動: Web TC-23（`論理削除` warning）
- 結果: ✅ PASS

### シナリオ 4: reject flow
- 自動: API TC-06（member_status 不変 / note rejected / body 末尾 `[rejected]`）
- 結果: ✅ PASS

### シナリオ 5: 二重 resolve / 楽観ロック
- 自動: API TC-08（1回目 200 / 2回目 409）
- 自動: Web TC-25（409 toast「他の管理者が既に処理済み」+ router.refresh）
- 結果: ✅ PASS

### シナリオ 6: バリデーション境界
- 自動: API TC-09（resolutionNote > 500 → 400）
- 自動: API +422 ケース（visibility approve で desiredState 不正）
- 自動: API TC-10（未知 noteId → 404）
- 結果: ✅ PASS

### シナリオ 7: PII 非露出
- 自動: Web TC-PII（raw email を payload に渡しても DOM に出ない）
- 設計: API `sanitizePayload` で email/phone/name 等を strip
- 結果: ✅ PASS

## 結論
全シナリオ機能的 PASS。screenshot 証跡は staging deploy 後に取得する delegated evidence とする。

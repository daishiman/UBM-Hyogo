---
実装区分: 実装成果物
状態: implementation_reviewed
Phase: 12
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [../../phase-12-documentation.md](../../phase-12-documentation.md)
---

# Unassigned Task Detection (Phase 12-4)

## Detected unassigned tasks: 0 件

本 task で正式起票が必要な未タスク化候補は **0 件**。

## 候補と却下理由

| 候補 | 却下理由 |
| --- | --- |
| `Last sync` を relative time formatter で「数分前」表現にする (FU-1) | 未タスクではなく scope-out。既存 `lastSyncLabel` / 固定 label の範囲で prototype 意図を満たせるため、今回サイクルで新規 formatter を作らない |
| `Meetings/yr` を API から取得する (FU-2) | 未タスクではなく不採用。API 拡張は本ワークフローの不変条件 #1 / W1 で禁止。値は UI 定数 `MEETINGS_PER_YEAR=12` で十分 |
| Hero serif を web font CDN ロードする (FU-3) | 未タスクではなく不採用。dependency / network policy 影響があり、`ui-serif, Georgia, serif` で視覚要件を満たせる |
| `ZoneIntro.tsx` を削除する (FU-4) | 未タスクではなく不採用。`app/page.tsx` からの call 削除で重複は解消でき、物理削除は import 利用者確認コストに対して価値が小さい |

## 判定根拠

- 上記 4 候補はいずれも「未タスク化」ではなく、今回の受入条件を満たすうえで不要または不採用と判断済み
- 本 workflow のスコープは「prototype `pages-public.jsx` L4-152 への `/` 視覚整合」に限定
- 不変条件 W1 (API endpoint 追加禁止) / W4 (API contract 拡張禁止) に抵触する候補は本サイクル外と確定

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 12-4

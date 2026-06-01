# Phase 4: テスト作成方針（設計書 / タスク横断）

各タスクの追加 spec は各タスク仕様書の「テスト方針」章を正本とする。本 phase はタスク横断のテスト方針を集約する。

| Task | 追加 spec（`*.spec.{ts,tsx}` のみ・不変条件 #8） | 主ケース |
|------|----------------------------------------------|---------|
| A | `BackfillPublishStatePanel.client.spec.tsx`, `backfill.spec.ts`(zod) | dry-run 表示 / apply 件数 / pending 無効化 / error 表示 |
| B | `ManualFormResyncPanel.client.spec.tsx` | sync 実行→件数表示 / 409 競合表示 / 全件 backfill confirm |
| C | `ReflectionTimingNote.spec.tsx` | lastSyncAt 表示 / 反映目安計算 / null fail-soft |
| D | `shell-config.spec.ts` 拡張 + `SidebarNavItem.spec.tsx` | external item が `<a target=_blank>` / href 定数一致 / 内部は `<Link>` |

- 全タスクとも mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10）、admin form は `FormField`（#9）。
- 共通前提（Task A/B）: sync 系 endpoint は `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`）。web proxy のトークン注入は **Task B §認証経路に集約**し、A はそれに依存する（後述 phase-9 共通課題）。

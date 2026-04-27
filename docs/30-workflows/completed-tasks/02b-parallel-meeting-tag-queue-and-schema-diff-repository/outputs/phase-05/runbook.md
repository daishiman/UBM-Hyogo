# Phase 5: runbook

## 実装ファイル順序
1. `_shared/db.ts` — `DbCtx` 型と SQL バインドヘルパー
2. `_shared/brand.ts` — branded 型の re-export
3. `_shared/__fakes__/fakeD1.ts` — 偽 D1（unit テスト専用）
4. `meetings.ts`
5. `attendance.ts` — `_shared/status-readonly.ts` の interface 定義込み
6. `tagDefinitions.ts`
7. `tagQueue.ts` — 状態遷移マップを純粋関数 export
8. `schemaVersions.ts`
9. `schemaQuestions.ts`
10. `schemaDiffQueue.ts`
11. unit テスト 7 本
12. `pnpm typecheck && pnpm test` 緑化

## 検証コマンド
```bash
mise exec -- pnpm typecheck
mise exec -- pnpm test apps/api
```

## placeholder / TODO
- `_shared/status-readonly.ts` の正式実装は 02a 担当。本タスク内では `attendance.ts` 用に必要なクエリ実体を内蔵する（`member_status` から read-only join のみ）。02a 統合時に内蔵 SQL を helper 関数差し替え。

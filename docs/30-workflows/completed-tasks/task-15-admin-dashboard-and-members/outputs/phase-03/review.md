# Phase 3: 設計レビュー (outputs)

> 仕様書: `../../phase-03.md`。本ファイルは GO/NO-GO 判定。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| Phase 1 scope と Phase 2 topology の整合 | GO | 新規 20 / 修正 6 が phase-01 §4 と phase-05 §1.1/1.2 で一致 |
| 既存 baseline (apps/web/src/components/admin/*) の置換戦略 | GO | Phase 8 で旧 dir を削除、移行先 features/admin/components/_*/ を Phase 5 で先に確立 |
| API client 既存 surface 維持 | GO | `src/lib/admin/api.ts` の `patchMemberStatus`/`deleteMember`/`restoreMember` 既存、追加なし |
| `@ubm-hyogo/shared` 不変条件 | GO | viewmodel.ts schema は変更せず、UI mapper を web local 化 |
| `apps/api` 差分 0 行 | GO | 既存 endpoint surface のみ利用、新規追加なし |
| OKLch tokens 専用 | GO | tokens.css に 18 oklch 定義済み |
| a11y / role 契約 | GO | jest-axe Phase 6 で実装、Phase 4 では todo |
| W5 fan-out gate | GO | task-16/17 着手前に layout merge 完了させる順序を Phase 5 で明示 |
| カバレッジ目標 | GO | 既存 vitest config + happy-dom + @testing-library/react 完備 |

## 判定: **GO（Phase 4 進行可）**

## リスク・懸念事項

| リスク | 緩和策 |
|-------|--------|
| 旧 MembersClient の test/snapshot 衝突 | Phase 8 で削除、Phase 5 で features/admin に独立配置 |
| `byZone`/`byStatus` API 未提供 | mapper で placeholder fallback |
| layout merge と task-16/17 並行 | W5 後に task-16/17 着手（CLAUDE.md task-16/17 と整合） |

## 完了
- [x] GO 判定
- [x] リスク登録

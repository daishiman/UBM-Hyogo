# Phase 9: 品質保証

実装区分: 実装仕様書

## 9.1 quality gates

| Gate | 内容 | コマンド | 合格条件 |
| --- | --- | --- | --- |
| G1 | typecheck 全通過 | `mise exec -- pnpm typecheck` | 0 errors |
| G2 | lint 全通過 | `mise exec -- pnpm lint` | 0 errors / 0 warnings (lint-only ルール) |
| G3 | build 成功 | `mise exec -- pnpm build` | exit 0 |
| G4 | apps/api 全テスト PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test` | 全 test PASS |
| G5 | 02a / read path regression | `pnpm --filter @ubm-hyogo/api test attendance-provider` | 既存テスト全 PASS |
| G6 | coverage 維持 | `pnpm --filter @ubm-hyogo/api test --coverage` | 既存 baseline 以上 |
| G7 | admin gate 経路カバレッジ | route テストで `admin gate 未通過` ケースを 1 件以上含む | T13 |
| G8 | apps/web から D1 直接アクセスがない | `grep -rn "D1Database\\|c.env.DB" apps/web/src` | 0 hits |
| G9 | curl evidence 4 件取得 | `ls outputs/phase-11/evidence/api-curl/*.json \| wc -l` | 4 |
| G10 | audit log 記録テスト PASS | `pnpm --filter @ubm-hyogo/api test admin/audit` | 全 PASS |

## 9.2 regression check matrix

| 既存テスト | 変更影響 | 検査方法 |
| --- | --- | --- |
| `apps/api/src/repository/attendance.test.ts`（read 部分） | シグネチャ変更（`MeetingSessionId` 導入） | typecheck で検出 |
| `apps/api/src/repository/__tests__/attendance-provider.test.ts` | read path 動作不変 | T14, T15 で write 後 read を確認 |
| `apps/api/src/routes/admin/audit.test.ts` | `attendance.add` / `attendance.remove` event の前提 | 既存ケース PASS を維持 |
| `apps/api/src/routes/admin/meetings.test.ts` | `POST /meetings/:id/attendances` の挙動 | 既存ケース PASS + 新ケース追加 |
| `apps/api/src/repository/_shared/builder.test.ts`（02a） | `MemberProfile.attendance` 型契約 | 型 / 値ともに不変 |

## 9.3 N+1 / bind 上限 metric

- write path は単発操作のため N+1 リスクなし
- read path (`AttendanceProvider`) は本タスクで触らない（02a の bind chunk 戦略を維持）
- 統合テスト T14 で write 後 read を実行し、read 側が依然として `IN (?,?,...)` バッチで動くことを確認

## 9.4 セキュリティ

- 全 admin route が `app.use("/admin/*", adminGate)` 経由（grep gate）
- `prepare().bind()` 利用率 100%（SQL injection 対策）
- `actor_email` の信頼源は middleware の `c.get("adminContext").email` のみ

## 9.5 性能

- upsert / softRemove は単発 D1 query のため latency baseline 不要
- audit_log INSERT は既存 audit 経路を踏襲、追加コストなし

## 9.6 GO 判定（→ Phase 10）

G1〜G10 全 PASS で Phase 10（最終レビュー）に進む。

## 9.7 DoD

- G1〜G10 全合格
- regression matrix 全 cell 不変
- Phase 10 GO 判定の根拠が `outputs/phase-09/regression-check.md` に記録

# Phase 7: カバレッジ確認

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-7/phase-7.md` |

## 目的
変更レイヤのカバレッジが既存 baseline を下回らないことを確認する。

## 対象レイヤ / 期待カバレッジ
| Layer | File | 期待 |
| --- | --- | --- |
| repository | `apps/api/src/repository/attendance.ts` | line ≥ 既存値、新規 `findByMemberId` 経路 100% |
| builder | `apps/api/src/repository/_shared/builder.ts` | 注入分岐 / 未注入分岐の両分岐 covered |
| route | `apps/api/src/routes/me/index.ts` | `/me/attendance` の 200 / 400 path covered |
| route | `apps/api/src/routes/admin/members.ts` | attendance endpoint の 200 / 400 / 401 / 403 path covered |
| shared | `packages/shared/src/zod/viewmodel.ts` | `attendanceMeta` schema covered |

## 参照資料
- `outputs/phase-7/phase-7.md`
- `outputs/phase-6/green-evidence.txt`

## 成果物
- `outputs/phase-7/coverage-summary.md`（before/after/delta 表）
- `outputs/phase-7/coverage-report/` （vitest --coverage 出力）

## 完了条件
- 各レイヤで line coverage の delta ≥ 0%。
- `scripts/coverage-guard.sh --changed` 相当のチェックで FAIL なし。

## 実行タスク
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` を実行し summary を保存する。
- [ ] coverage-guard を走らせて結果を保存する。

## 統合テスト連携
- coverage 不足があれば Phase 6 に戻りテスト追加。

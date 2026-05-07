# Phase 9: 品質保証

実装区分: 実装仕様書（CONST_004 デフォルト適用 — admin attendance 集計可視化ダッシュボードの実装仕様）

## 9.1 quality gates

| Gate | 内容 | コマンド | 合格条件 |
| --- | --- | --- | --- |
| G1 | api typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | 0 errors |
| G2 | api lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | 0 errors / 0 warnings |
| G3 | api test (run mode) | `mise exec -- pnpm --filter @ubm-hyogo/api test:run` | 全 test PASS |
| G4 | api build | `mise exec -- pnpm --filter @ubm-hyogo/api build` | exit 0 |
| G5 | web typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 errors |
| G6 | web lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | 0 errors |
| G7 | web build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 |
| G8 | e2e (admin attendance dashboard) | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-attendance-dashboard` | 全 spec PASS |
| G9 | EXPLAIN QUERY PLAN gate | `attendance-analytics.test.ts` 内で `assertNoFullScan(plan)` | `SCAN member_attendance` / `SCAN meeting_sessions` 検出 → fail（INDEX 利用 → pass） |
| G10 | apps/web から D1 直接アクセスがない | `grep -rn "D1Database\\|c.env.DB\\|env.DB" apps/web/src apps/web/app` | 0 hits |
| G11 | migration 番号衝突なし | `ls apps/api/migrations/ \| sort \| uniq -c -w 4 \| awk '$1>1'` | 出力 0 行（02b と同番号でないことを確認） |
| G12 | chunk pattern が集計関数に混入していない | `grep -nE "IN \\(\\?(,\\?)+\\)" apps/api/src/repository/attendance.ts \| grep -v "// chunk"` の aggregate 関数範囲 | 0 hits（aggregate scope） |
| G13 | N+1 metric（query count assertion） | `dashboard.test.ts` の各 endpoint で query 実行回数を spy / counter で検証 | overview = 1 query / sessions = 1 query / ranking = 1 query |

## 9.2 カバレッジ目標

| 対象 | baseline | 目標 |
| --- | --- | --- |
| `apps/api/src/repository/attendance.ts`（aggregate 追加部） | followup-001 完了時点 | baseline 維持以上、aggregate 3 関数の line / branch ともに 90% 以上 |
| `apps/api/src/routes/admin/dashboard.ts`（attendance route 追加部） | 既存 dashboard route baseline | line 90% / branch 85% 以上 |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 0%（新規） | e2e で AC カバー（unit カバレッジは要求しない） |

baseline 算出: `mise exec -- pnpm --filter @ubm-hyogo/api test:run -- --coverage` を main / 本ブランチで実行し、line/branch coverage が main 比で **下がっていない**ことを確認。

## 9.3 EXPLAIN QUERY PLAN 自動 gate

### 検査対象 SQL

| 関数 | 期待 plan |
| --- | --- |
| `computeAttendanceOverview` | `SEARCH TABLE member_attendance USING INDEX <analytics_idx>` または `SCAN ... USING INDEX` を含むこと |
| `listSessionAttendanceStats` | session_id を軸にした GROUP BY で `USING INDEX` を含むこと |
| `listMemberAttendanceRanking` | member_id を軸にした GROUP BY で `USING INDEX` を含むこと |

### test util

`apps/api/src/repository/__tests__/_setup.ts` に追加:

```ts
export function assertNoFullScan(plan: string, sqlLabel: string) {
  // 対象大規模表の full scan で "USING INDEX" を伴わない行が 1 つでもあれば fail
  const offenders = plan
    .split("\n")
    .filter((l) => /SCAN (?:TABLE )?(member_attendance|meeting_sessions)/i.test(l) && !/USING (?:COVERING )?INDEX/i.test(l));
  if (offenders.length > 0) {
    throw new Error(`[${sqlLabel}] full scan detected:\n${offenders.join("\n")}`);
  }
}
```

各 aggregate test は `EXPLAIN QUERY PLAN <sql>` を実行 → `assertNoFullScan(plan, label)` を呼ぶ。

## 9.4 regression check matrix

| 既存テスト | 変更影響 | 検査方法 |
| --- | --- | --- |
| `apps/api/src/repository/attendance.test.ts`（既存 read / write） | aggregate 関数末尾追記による既存関数挙動への影響なし | 全 PASS 維持 |
| `apps/api/src/repository/__tests__/attendance-provider.test.ts`（02a） | read path / chunk pattern 不変 | 全 PASS 維持 |
| followup-001 関連 test（add/remove） | write path 不変 | 全 PASS 維持 |
| `apps/api/src/routes/admin/audit.test.ts`（05a） | admin route 追加だが audit 経路は本タスク無関係 | 全 PASS 維持 |
| `apps/web` 既存 e2e | 新規 page 追加のみ、既存導線不変 | 既存 spec 全 PASS |

## 9.5 followup-001 / 02a / 02b regression check 手順

1. `git diff origin/main -- apps/api/src/repository/attendance.ts` で aggregate 関数のみが末尾追記であることを確認（既存関数のシグネチャ / 本体が改変されていないこと）
2. `mise exec -- pnpm --filter @ubm-hyogo/api test:run -- attendance` で attendance 関連 suite 全 PASS
3. `MemberProfile.attendance` の interface 不変を typecheck で担保（`apps/api/src/repository/_shared/builder.ts` を grep し変更がないことを確認）
4. `meeting_sessions.deleted_at` の semantics が aggregate 関数で正しく `IS NULL` フィルタされていることを test で確認

## 9.6 migration 番号衝突 check

```bash
ls /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-185256-wt-8/apps/api/migrations/
```

- 新規 migration `00XX_attendance_analytics_indexes.sql` の `XX` が **02b の予約番号と重複しない**こと
- 02b PR が先行 merge された場合は本タスク側で番号を採番し直す（最新採番ルール: 既存最大番号 + 1）
- CI 上では `G11` gate（重複検出）で fail させる

## 9.7 N+1 / query count assertion

`dashboard.test.ts` 内で D1 binding を spy 化し、各 endpoint 呼び出しで実行された SQL 数を counter で確認:

| endpoint | 期待 query 回数 |
| --- | --- |
| `GET /admin/dashboard/attendance/overview` | 1 |
| `GET /admin/dashboard/attendance/sessions` | 1 |
| `GET /admin/dashboard/attendance/ranking` | 1 |

2 回以上発行されている場合は **chunk pattern の誤流用または N+1 の混入**として fail。

## 9.8 D1 直接アクセス検査

```bash
grep -rnE "D1Database|c\\.env\\.DB|env\\.DB" \\
  /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-185256-wt-8/apps/web/src \\
  /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-185256-wt-8/apps/web/app
```

- 0 hits を期待
- `apps/web` からは `apps/api` の `/admin/dashboard/attendance/*` endpoint 経由のみアクセス
- CLAUDE.md 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）の遵守

## 9.9 セキュリティ

- 全 dashboard route が `app.use("/admin/*", adminGate)` 経由（grep gate）
- `prepare().bind()` 利用率 100%（aggregate SQL でも `LIMIT ?` を bind 化）
- aggregate 結果に PII（email 等）が含まれる場合は admin gate 通過済み context 内のみで返却

## 9.10 性能

- aggregate SQL は GROUP BY 単発のため D1 1 query / endpoint
- `00XX_attendance_analytics_indexes.sql` で composite index を導入済み（`(session_id)` / `(member_id)` の covering pattern）
- 大量データ時の latency 上限は Phase 10 リスク欄で扱う

## 9.11 GO 判定（→ Phase 10）

G1〜G13 全 PASS、9.4 / 9.5 regression なし、9.6 番号衝突なし、9.8 D1 直接アクセス 0 hits を満たした時点で Phase 10 に進む。

## 9.12 DoD

- G1〜G13 全合格
- regression matrix（9.4）全 cell 不変
- EXPLAIN QUERY PLAN gate（9.3）が test 内で自動実行され PASS
- chunk pattern が aggregate に混入していないことを G12 で確認
- Phase 10 GO 判定の根拠が `outputs/phase-09/regression-check.md` に記録

# Phase 13: PR 作成

実装区分: 実装仕様書（CONST_004 デフォルト適用 — admin 出席ダッシュボード実装の PR 作成手順を実装仕様書として明記）

## 13.1 user approval gate

このフェーズは **user 承認後にのみ実行可** （`artifacts.json#phases[13].user_approval_required: true`）。
Phase 12 までの全成果物が完備されていることを user に提示し、PR 作成許可を得てから 13.4 以降に進む。Issue #370 は **CLOSED のまま reopen しない**（Refs のみ参照）。

## 13.2 approval gate 表

| Gate | 名称 | 内容 | Pass 条件 |
| --- | --- | --- | --- |
| G1 | local check | typecheck / lint / build / test / coverage / EXPLAIN gate / regression | 全 exit 0 |
| G2 | spec compliance | Phase 11 evidence ledger 完備 + Phase 12 7 ファイル ledger 完備 + CONST 適合 | 全 ✅ |
| G3 | user approval | user に最終確認しPR 作成許可を取得 | 明示的承認 |
| G4 | PR create | `gh pr create` 実行 + URL 記録 | PR URL 取得 |

## 13.3 outputs 一覧

| 成果物 | 配置 | 内容 |
| --- | --- | --- |
| local-check-result | `outputs/phase-13/local-check-result.md` | typecheck / lint / build / test / coverage / EXPLAIN gate / regression の最終結果 |
| change-summary | `outputs/phase-13/change-summary.md` | 変更ファイル一覧 + LOC + 依存関係 graph |
| pr-template | `outputs/phase-13/pr-template.md` | PR title / body テンプレート |

## 13.4 ローカル最終チェック（G1, user 承認後実行）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-attendance-dashboard

# EXPLAIN gate（既存 idx_member_attendance_session / idx_meeting_sessions_active_held_on と新規 idx_member_attendance_member 使用確認）
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local --command \
  "EXPLAIN QUERY PLAN SELECT s.session_id, COUNT(ma.member_id) \
   FROM meeting_sessions s \
   LEFT JOIN member_attendance ma ON ma.session_id = s.session_id \
   WHERE s.deleted_at IS NULL \
   GROUP BY s.session_id;"
```

`outputs/phase-13/local-check-result.md` の構造:

| 項目 | 結果 | 備考 |
| --- | --- | --- |
| typecheck | exit 0 | |
| lint | exit 0 | |
| build | exit 0 | |
| test (api) | exit 0 | 新規 attendance-analytics.test.ts / 既存 dashboard.test.ts 追記分を含む |
| coverage | baseline 維持以上 | issue-475 gate |
| EXPLAIN gate | `idx_member_attendance_session` / `idx_member_attendance_member` / `idx_meeting_sessions_active_held_on` の利用確認 | AC-9 |
| regression (既存 02a / read path / audit) | 全 PASS | |
| Playwright admin-attendance-dashboard | pending | VISUAL screenshot 採取は user-approved runtime capture cycle で実行 |

## 13.5 change-summary（G2）

`git diff main...HEAD --name-only` の結果を分類し `outputs/phase-13/change-summary.md` に記載する。

| 区分 | ファイル | 概算 LOC |
| --- | --- | --- |
| 仕様書 | `docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/**` | +1500 |
| migration | `apps/api/migrations/00XX_attendance_analytics_indexes.sql` | +20 |
| 実装 (api repo) | `apps/api/src/repository/attendance.ts`（aggregate 関数末尾追記） | +120 |
| 実装 (api route) | `apps/api/src/routes/admin/dashboard.ts`（既存 route 拡張） | +180 |
| 実装 (web) | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | +220 |
| テスト (api) | `apps/api/src/repository/__tests__/attendance-analytics.test.ts`, `apps/api/src/routes/admin/dashboard.test.ts` | +400 |
| テスト (web e2e) | pending: runtime capture cycle で追加/実行 | 0 |
| spec / index 同期 | `docs/00-getting-started-manual/specs/01-api-schema.md`, `08-free-database.md`, aiworkflow-requirements `indexes/**` / `changelog/**` | +250 |

依存関係 graph（簡易）:

```
migration (analytics indexes)
  └─> repository/attendance.ts (aggregate 関数)
        └─> routes/admin/dashboard.ts
              └─> apps/web .../admin/dashboard/attendance/page.tsx
                    └─> playwright e2e
```

## 13.6 PR template（G4）

### branch 名
```
feat/issue-370-attendance-dashboard-analytics
```

### title
```
feat(issue-370): admin 出席ダッシュボード / 集計可視化を実装
```

### body
```markdown
## Summary
- ut-02a-followup-002 (Refs #370): admin 向け attendance 集計可視化ダッシュボードを新設
- aggregate API 3 本（overview / by-session / ranking）を `/admin/dashboard/attendance/*` に追加
- D1 analytics 専用 index 1 本（`idx_member_attendance_member`）を新設し、既存 `idx_member_attendance_session` / `idx_meeting_sessions_active_held_on` を流用して p95 < 300ms を担保
- admin UI 画面 `/admin/dashboard/attendance` を Next.js Server Component で実装
- VISUAL タスクの Playwright screenshot は `outputs/phase-11/evidence/ui-smoke/` に採取予定。現時点では未取得であり、PR body では PASS 扱いしない

## Refs
- Refs #370（CLOSED のまま参照、reopen しない）
- 親仕様: `docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/`

## Changes
（13.5 change-summary を貼付）

## AC checklist
- [x] AC-1〜AC-9 local implementation scope 充足（`phase-07.md` 参照）
- [ ] curl evidence 4 件（`outputs/phase-11/evidence/api-curl/`）
- [x] EXPLAIN evidence（Vitest gate）
- [ ] UI screenshot 件（`outputs/phase-11/evidence/ui-smoke/`）
- [x] 既存 02a / read path / audit / meetings テスト regression なし（api test execution）

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm build`
- [x] `pnpm --filter @ubm-hyogo/api test`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage`（baseline 維持以上）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-attendance-dashboard`
- [x] EXPLAIN gate（Vitest で index 使用確認）
- [ ] curl / UI smoke evidence 採取（Phase 11）

## Invariants touched
- #4 admin-managed data 分離（dashboard は admin gate 経由のみ）
- #5 D1 直接アクセスは apps/api に閉じる（apps/web は API fetch のみ）
- admin gate 中継（route 単体迂回禁止）
- chunk pattern 流用禁止（GROUP BY aggregate と pagination chunk は別パターン）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

> 注: PR body は **`Closes #370` を使用しない**。Issue #370 は CLOSED のまま `Refs` のみで参照する。

## 13.7 PR 作成コマンド（G4, user 承認後）

```bash
git checkout -b feat/issue-370-attendance-dashboard-analytics
git push -u origin feat/issue-370-attendance-dashboard-analytics

gh pr create \
  --title "feat(issue-370): admin 出席ダッシュボード / 集計可視化を実装" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## 13.8 CI 確認

- branch protection の required_status_checks（typecheck / lint / build / test / coverage / verify-indexes）が全 green
- coverage gate（issue-475）が baseline 以上
- Issue #370 は CLOSED のまま（PR merge でも reopen しない）

## 13.9 完了

- PR URL を `outputs/phase-13/main.md` に記録
- ライフサイクル状態を `completed` へ更新（`artifacts.json#metadata.workflow_state`）
- aiworkflow-requirements changelog の `wave` を `merged` へ昇格

## 13.10 DoD

- G1 local check 全 PASS
- G2 spec compliance 全 ✅
- G3 user 明示承認取得済み
- G4 PR 作成完了 + URL 取得
- 13.8 CI 全 green
- 13.9 lifecycle 更新済み
- Issue #370 CLOSED 維持（reopen していない）

# Phase 11: 実装 smoke / evidence

実装区分: 実装仕様書（CONST_004 デフォルト適用 — admin 出席ダッシュボード新設は実装を伴う VISUAL タスクであり、契約レビューではなく実装仕様書として扱う）

判定: VISUAL_ON_EXECUTION / implemented-local 段階では local repository / route / EXPLAIN tests を証跡化し、runtime curl / UI screenshot は未取得として残す。close-out 状態語彙は `local_tests_passed_visual_runtime_pending`。

本 Phase 11 は admin 出席ダッシュボードの aggregate API 3 本（overview / by-session / ranking）と admin UI 画面の **runtime 実測 evidence** を契約として定義する。VISUAL タスクのため UI スクリーンショットは推奨 30 枚以上を目安とする。spec 作成段階では runtime PASS にせず、次の実行サイクルで本契約に従って evidence を採取する。

## 11.1 evidence 取得計画

| # | evidence | 種別 | 保存先 | AC ref |
| --- | --- | --- | --- | --- |
| E1 | `GET /admin/dashboard/attendance/overview` 200 | API curl JSON | `outputs/phase-11/evidence/api-curl/dashboard-attendance-overview-ok.json` | AC-1, AC-7 |
| E2 | `GET /admin/dashboard/attendance/by-session` 200 | API curl JSON | `outputs/phase-11/evidence/api-curl/dashboard-attendance-by-session-ok.json` | AC-2, AC-7 |
| E3 | `GET /admin/dashboard/attendance/ranking` 200 | API curl JSON | `outputs/phase-11/evidence/api-curl/dashboard-attendance-ranking-ok.json` | AC-3, AC-7 |
| E4 | admin token 無し 401 | API curl JSON | `outputs/phase-11/evidence/api-curl/dashboard-attendance-unauthorized-401.json` | AC-8 |
| E5 | `overview` クエリ EXPLAIN QUERY PLAN | text | `outputs/phase-11/evidence/explain/overview-explain.txt` | AC-9 |
| E6 | `by-session` クエリ EXPLAIN QUERY PLAN | text | `outputs/phase-11/evidence/explain/by-session-explain.txt` | AC-9 |
| E7 | `ranking` クエリ EXPLAIN QUERY PLAN | text | `outputs/phase-11/evidence/explain/ranking-explain.txt` | AC-9 |
| E8 | admin attendance dashboard 通常状態 | UI screenshot | `outputs/phase-11/evidence/ui-smoke/admin-attendance-dashboard.png` | AC-4, AC-5 |
| E9 | データ 0 件状態 | UI screenshot | `outputs/phase-11/evidence/ui-smoke/admin-attendance-dashboard-empty.png` | AC-6 |
| E10 | 大量データ状態（50 sessions / 200 members） | UI screenshot | `outputs/phase-11/evidence/ui-smoke/admin-attendance-dashboard-large.png` | AC-4, AC-9 |

VISUAL タスク方針: E8〜E10 を中心に画面状態 / レンジ切替 / ranking top10 表示 / by-session グラフ / loading skeleton / error state / focus 状態など **30 枚以上** をディレクトリ配下に配置することを推奨する（命名は `admin-attendance-dashboard-<state>-<NN>.png`）。

## 11.2 取得手順（E1〜E4）API curl

`apps/api` をローカル起動し、admin token を 1Password 経由で注入して curl を実行する。Cloudflare API Token / wrangler 認証は **`bash scripts/cf.sh`** ラッパー経由のみ。

```bash
# api ローカル起動
mise exec -- pnpm --filter @ubm-hyogo/api dev

# admin token を 1Password から動的注入し curl 実行
bash scripts/with-env.sh -- curl -s \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://127.0.0.1:8787/admin/dashboard/attendance/overview" \
  | tee outputs/phase-11/evidence/api-curl/dashboard-attendance-overview-ok.json | jq '.'

bash scripts/with-env.sh -- curl -s \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://127.0.0.1:8787/admin/dashboard/attendance/by-session?limit=50" \
  | tee outputs/phase-11/evidence/api-curl/dashboard-attendance-by-session-ok.json | jq '.'

bash scripts/with-env.sh -- curl -s \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://127.0.0.1:8787/admin/dashboard/attendance/ranking?limit=10" \
  | tee outputs/phase-11/evidence/api-curl/dashboard-attendance-ranking-ok.json | jq '.'

# 401 (token 無し)
curl -s -o outputs/phase-11/evidence/api-curl/dashboard-attendance-unauthorized-401.json -w "%{http_code}\n" \
  "http://127.0.0.1:8787/admin/dashboard/attendance/overview"
```

### 期待値テンプレート

#### E1: `dashboard-attendance-overview-ok.json`
```json
{
  "totalSessions": 12,
  "totalMembers": 84,
  "overallRate": 0.61
}
```

#### E2: `dashboard-attendance-by-session-ok.json`
```json
[
  { "sessionId": "s1", "title": "...", "heldOn": "2026-04-12", "attendeeCount": 47, "rate": 0.56 }
]
```

#### E3: `dashboard-attendance-ranking-ok.json`
```json
[
  { "memberId": "m1", "displayName": "...", "attendedCount": 11, "rate": 0.92 }
]
```

#### E4: `dashboard-attendance-unauthorized-401.json`
HTTP 401
```json
{ "ok": false, "reason": "unauthorized" }
```

## 11.3 EXPLAIN QUERY PLAN 取得（E5〜E7）

既存 index `idx_member_attendance_session` / `idx_meeting_sessions_active_held_on` と新規 index `idx_member_attendance_member` が aggregate query で使用されることを EXPLAIN で確認する。

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local --command \
  "EXPLAIN QUERY PLAN SELECT s.session_id, COUNT(ma.member_id) \
   FROM meeting_sessions s \
   LEFT JOIN member_attendance ma ON ma.session_id = s.session_id \
   WHERE s.deleted_at IS NULL \
   GROUP BY s.session_id;" \
  | tee outputs/phase-11/evidence/explain/by-session-explain.txt
```

期待: `idx_member_attendance_session` または `idx_meeting_sessions_active_held_on` の利用を含むこと。`SCAN member_attendance` / `SCAN meeting_sessions`（全表 scan）が出た場合は AC-9 違反。

## 11.4 UI smoke 取得手順（E8〜E10）

VISUAL タスク方針: Playwright で `/admin/dashboard/attendance` を訪問し、状態別に screenshot を採取する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-attendance-dashboard
```

採取シナリオ:
1. admin としてログイン（`scripts/with-env.sh` で test admin credentials を注入）
2. `/admin/dashboard/attendance` を訪問 → E8（通常状態）
3. range filter を「データ 0 件期間」に設定 → E9（empty state）
4. seed で 50 sessions × 200 members を投入した state → E10（large）
5. ranking top10 / by-session bar / overview KPI カード / loading skeleton / error toast / mobile breakpoint など 30 枚以上を採取
6. 全 png を `outputs/phase-11/evidence/ui-smoke/` に配置

## 11.5 evidence contract completeness check

- E1〜E4 JSON 4 件 / E5〜E7 EXPLAIN 3 件 / E8〜E10 を含む UI screenshot 30 枚以上が存在
- 各 API JSON は AC-1〜AC-3, AC-7, AC-8 と紐付く
- EXPLAIN は新規 index 使用を確認し AC-9 を満たす
- runtime capture 前は evidence ファイルを実測 PASS と混同しない
- 実行サイクルで採取後、close-out 状態を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` へ更新する

## 11.6 audit / observability ログ

aggregate API は read 系のため audit_log には書かないが、Cloudflare Logs / Workers Analytics の sampled trace で latency p95 < 300ms を観測対象とする。長期的には issue-484（Cloudflare Analytics export）と統合する想定で、本 Phase では契約のみ記述。

## 11.7 DoD

- evidence ledger (E1〜E10+) の保存先パス契約が完全
- runtime 採取手順がコピペ実行可能
- VISUAL タスクとして UI screenshot 30 枚以上の方針を明示
- spec_created 段階では runtime PASS としない（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）
- 実行サイクルで全 evidence が採取された時点で本 Phase を `PASS_RUNTIME_VERIFIED` へ昇格

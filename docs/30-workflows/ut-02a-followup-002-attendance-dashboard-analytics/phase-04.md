# Phase 4: テスト戦略

実装区分: 実装仕様書（CONST_004 デフォルト適用 — 既存実装の拡張のため新規テストのみ design_locked、既存テストは regression として扱う）

## 4.1 test matrix（layer × case）

| # | テスト | 対象ファイル | 種別 | AC ref |
| --- | --- | --- | --- | --- |
| T1 | `computeAttendanceOverview` 通常データ → `{ totalSessions, totalMembers, overallRate }` | `apps/api/src/repository/__tests__/attendance-analytics.test.ts` | 単体 | AC-1, AC-5 |
| T2 | `computeAttendanceOverview` 空テーブル → `{ totalSessions: 0, totalMembers: 0, overallRate: 0 }`（zero-division 防御） | 同上 | 単体 | AC-1, AC-5 |
| T3 | `computeAttendanceOverview` 削除済み session / member は集計から除外 | 同上 | 単体 | AC-1 |
| T4 | `listSessionAttendanceStats` `held_on DESC` 順、`{ sessionId, title, heldOn, attendeeCount, rate }` を返す | 同上 | 単体 | AC-1, AC-5 |
| T5 | `listSessionAttendanceStats` `limit` オプションで件数制限 | 同上 | 単体 | AC-1 |
| T6 | `listSessionAttendanceStats` 削除済み session 除外 | 同上 | 単体 | AC-1 |
| T7 | `listMemberAttendanceRanking` `attendedCount DESC` 順 + `{ memberId, displayName, attendedCount, rate }` | 同上 | 単体 | AC-1, AC-5 |
| T8 | `listMemberAttendanceRanking` 削除済み member 除外 | 同上 | 単体 | AC-1 |
| T9 | `EXPLAIN QUERY PLAN computeAttendanceOverview` に対象表の full scan を含まない | 同上 | 単体（index 検証） | AC-3, AC-4 |
| T10 | `EXPLAIN QUERY PLAN listSessionAttendanceStats` に対象表の full scan を含まない | 同上 | 単体 | AC-3, AC-4 |
| T11 | `EXPLAIN QUERY PLAN listMemberAttendanceRanking` に対象表の full scan を含まない | 同上 | 単体 | AC-3, AC-4 |
| T12 | aggregate 3 関数いずれも GROUP BY 単発クエリで完結し、in-memory chunk loop を使わないこと（grep / typecheck） | 単体 + grep | 静的 | AC-1 |
| T13 | `GET /admin/dashboard/attendance/overview` 200 + JSON shape | `apps/api/src/routes/admin/dashboard.test.ts` | route | AC-2, AC-5 |
| T14 | `GET /admin/dashboard/attendance/by-session` 200 + array shape | 同上 | route | AC-2, AC-5 |
| T15 | `GET /admin/dashboard/attendance/ranking` 200 + array shape | 同上 | route | AC-2, AC-5 |
| T16 | 未認証 → 401（admin gate 経由） | 同上 | route | AC-2 |
| T17 | 一般会員（admin role 不足）→ 403 | 同上 | route | AC-2 |
| T18 | admin UI page が overview / by-session / ranking の 3 カードを描画 | `apps/web/playwright/tests/admin-attendance-dashboard.spec.ts` | E2E smoke | AC-6, AC-7 |
| T19 | typecheck / lint / build / focused test 全 PASS、既存 attendance write / read regression なし | CI | 自動 | AC-10 |
| T20 | `MemberProfile.attendance` 型契約不変（grep + typecheck） | typecheck | 静的 | AC-9 |
| T21 | `apps/web` から D1 直接 import なし（grep `D1Database` in `apps/web`） | 静的 | grep | AC-8 |
| T22 | 大量データ（1000 sessions × 1000 members）でも単発クエリ p95 < 500ms（参考値） | 単体（perf） | 単体 | AC-3 |

## 4.2 AC × test mapping

| AC | tests |
| --- | --- |
| AC-1 | T1, T2, T3, T4, T5, T6, T7, T8, T12 |
| AC-2 | T13, T14, T15, T16, T17 |
| AC-3 | T9, T10, T11, T22 |
| AC-4 | T9, T10, T11（migration の存在は Phase 5 Step 1 で目視確認） |
| AC-5 | T1, T4, T7, T13, T14, T15 |
| AC-6 | T18 |
| AC-7 | T1〜T17（unit + route）+ T18（UI smoke） |
| AC-8 | T21 |
| AC-9 | T20 |
| AC-10 | T19 |
| AC-11 | Phase 11 contract placeholder（runtime curl は 09a evidence gate に委譲） |

## 4.3 カバレッジ目標

- `apps/api` package coverage baseline 維持（既存ライン coverage 比 ±0pt 以上）
- 新規追加 `attendance-analytics.test.ts` / 既存 `dashboard.test.ts` 追記分の関数カバレッジ 100%
- 既存 02a / 02a-followup-001 attendance test に regression なし（CI で focused diff 実行）

## 4.4 EXPLAIN QUERY PLAN 自動検証手順（T9〜T11）

D1 fakeD1（miniflare）で migration 適用後、以下を test 内で実行:

```ts
const stmt = `EXPLAIN QUERY PLAN ${SQL_FOR_OVERVIEW}`;
const plan = await env.DB.prepare(stmt).all();
const planText = plan.results.map((r) => r.detail).join("\n");
expect(planText).not.toMatch(/SCAN (?:TABLE )?(member_attendance|meeting_sessions)\b/);
expect(planText).toMatch(/USING (INDEX|COVERING INDEX)/);
```

- すべての aggregate SQL（overview / by-session / ranking）に対して同様のアサートを実行
- `member_attendance` / `meeting_sessions` の full scan を 1 回でも検出した時点で test fail
- index 名は migration ファイルに固定し、test 側で名前一致もチェック（任意・regression 検知強化）

## 4.5 mock 方針

- D1 は miniflare 提供の fake D1 を使用（既存 `apps/api/src/repository/__tests__/_fixtures/` パターンを踏襲）
- admin gate は middleware を直接通す（`createTestAdminApp()` ヘルパ経由）。`adminContext` を mock 注入
- 集計対象データは fixture seeder で投入（sessions / members / member_attendance を直接 INSERT）
- ATTENDANCE_BIND_CHUNK_SIZE=80 chunk pattern は **集計層に流用しない**。aggregate は GROUP BY 単発クエリで完結し、bind 変数は `limit` 等の少数のみ。chunk pattern は 02a-followup-001 read path でのみ使用される。

## 4.6 chunk pattern 非流用の再確認（重要）

- 集計 3 関数は `IN (?, ?, ...)` 形式の bind を使用しない
- `member_attendance.member_id IN (chunk)` で分割実行する read path とは異なり、aggregate は `GROUP BY session_id` / `GROUP BY member_id` で N 行をサーバ側に集約する
- chunk pattern を流用した場合、partial result の合算ロジックが必要になり AC-1 / AC-3 を満たせない
- T12 で grep + 構造的に検証

## 4.7 ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:run -- attendance-analytics
mise exec -- pnpm --filter @ubm-hyogo/api test:run -- dashboard
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-attendance-dashboard
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 4.8 evidence contract テンプレート

`outputs/phase-11/evidence/api-curl/` 配下に以下 JSON を保存する。runtime capture 前は未取得として扱い、local test PASS と混同しない:
- `dashboard-attendance-overview-ok.json`: 200 / `{ totalSessions, totalMembers, overallRate }`
- `dashboard-attendance-by-session-ok.json`: 200 / `[{ sessionId, title, heldOn, attendeeCount, rate }, ...]`
- `dashboard-attendance-ranking-ok.json`: 200 / `[{ memberId, displayName, attendedCount, rate }, ...]`
- `dashboard-attendance-unauthorized-401.json`: 401 / `{ error: "unauthorized" }`

## 4.9 DoD

- T1〜T22 全 PASS（または contract-only として明示）
- EXPLAIN QUERY PLAN 自動検証で対象表 full scan 0 件
- 既存 02a / 02a-followup-001 regression なし
- chunk pattern 非流用が grep + 単体テストで保証されている

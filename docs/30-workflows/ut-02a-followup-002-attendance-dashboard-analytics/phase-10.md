# Phase 10: 最終レビュー

実装区分: 実装仕様書（CONST_004 デフォルト適用 — admin attendance 集計可視化ダッシュボードの実装仕様）

## 10.1 GO / NO-GO 判定基準

| 基準 | 判定 | 根拠 |
| --- | --- | --- |
| 依存 02a の AC 充足 | GO | `MemberProfile.attendance` interface 不変、read path / chunk pattern 影響なし |
| 依存 02b の AC 充足 | GO | `meeting_sessions.deleted_at IS NULL` フィルタを aggregate 関数で踏襲、schema 変更なし |
| 依存 05a の AC 充足 | GO | 既存 admin gate middleware を流用。route 単体での gate 迂回なし |
| schema 制約: `member_attendance` PK | GO | PK (`session_id`, `member_id`) を前提に GROUP BY 構成。schema 変更なし |
| schema 制約: `meeting_sessions.deleted_at` | GO | aggregate 関数すべてで `deleted_at IS NULL` フィルタを掛ける |
| `MemberProfile.attendance` interface 不変 | GO | aggregate 戻り値は別 type（`AttendanceOverview` / `SessionAttendanceRow` / `MemberAttendanceRanking`） |
| chunk pattern 流用なし（aggregate のみ） | GO | Phase 9 G12 gate で aggregate 範囲に `IN (?,?,...)` が無いことを確認 |
| admin gate 経由 | GO | 新規 route が `app.use("/admin/*", adminGate)` 配下にマウントされる |
| migration 番号衝突なし | GO | Phase 9 G11 gate で 02b との重複検出が PASS |
| AC 充足（aggregate 3 endpoint + admin UI + e2e） | GO | unit / route / e2e で網羅 |
| Phase 9 quality gates G1〜G13 | GO | 全 PASS を Phase 9 evidence に記録 |
| Phase 11 evidence（curl + ui-smoke） | GO with placeholder | runtime smoke は本 workflow で PASS 扱いせず、08b / 09a gate に委譲 |

## 10.2 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値（admin が attendance 全体傾向を把握できる） | GO | overview / session / ranking の 3 軸で集計可視化が達成される |
| 実現（D1 capacity / 既存 schema で完結） | GO | composite index 1 migration で対応、追加 binding なし |
| 整合（既存 02a / 02b / 05a / followup-001 と矛盾しない） | GO | read-only 拡張のみ、write path / interface 不変 |
| 運用（rollback / monitoring 容易） | GO | コード revert + migration revert で完全復旧。read-only のためデータ汚染なし |

## 10.3 リリース影響範囲

| 範囲 | 影響 |
| --- | --- |
| public API | なし（admin route のみ） |
| public site | なし |
| admin UI | 新規 dashboard ページ 1 つ追加。既存導線への影響なし |
| データ | aggregate read のみ。row 追加 / 更新 / 削除なし |
| index | `00XX_attendance_analytics_indexes.sql` で composite index 追加。既存 query plan に副作用が出ないことを Phase 9 G9 で確認済み |
| 監査 | 本タスクは read-only のため audit_log 記録なし |

## 10.4 ロールバック戦略

- コード revert で route / UI を即時無効化可能
- migration revert: `00XX_attendance_analytics_indexes.sql` の `DROP INDEX` を別 migration として用意（命名規則: `00YY_drop_attendance_analytics_indexes.sql`）
- index drop はデータに副作用なし。query plan が migration 前 baseline に戻るのみ
- Cloudflare wrangler rollback 経路（`scripts/cf.sh rollback`）が利用可能

## 10.5 残リスクと対処方針

| リスク | priority | 対処方針 |
| --- | --- | --- |
| 大量データ時の aggregate latency が想定超過 | low | Phase 11 で curl evidence に latency を記録。p95 > 500ms の場合は materialized snapshot 化を followup task で検討 |
| composite index の効果が想定未満（cardinality 不足） | low | EXPLAIN QUERY PLAN gate（G9）で対象表 full scan 検出時 fail。実データに対しては Phase 11 で再検証 |
| admin UI のチャート表示 perf | low | 初版は table + 軽量 sparkline のみ。重い chart lib（recharts 等）は導入しない |
| 02b migration との番号衝突 | medium | Phase 9 G11 gate で都度検出。merge 直前にも再採番 check |
| ranking endpoint の上限なし利用 | low | `limit` opts default を 100 に固定し、UI 側で pagination 化は followup-004 に委譲 |

## 10.6 GO 宣言条件

以下が全て満たされた時点で GO:

1. Phase 1〜9 の output 全成果物が `outputs/phase-XX/` に存在
2. Phase 9 G1〜G13 全 PASS
3. 既存 02a / 02b / 05a / followup-001 既存テストに regression なし
4. `apps/web` から D1 直接アクセスがないこと（G10）
5. chunk pattern が aggregate に混入していないこと（G12）
6. migration 番号衝突なし（G11）
7. EXPLAIN QUERY PLAN gate で対象表 full scan 検出ゼロ（G9）

## 10.7 GO 判定文

上記 10.1 / 10.2 / 10.6 を全て満たした時点で、本タスク（ut-02a-followup-002 出席ダッシュボード / 集計可視化）は **Phase 11 へ進行可能（GO）** とする。chunk pattern を aggregate に流用せず、GROUP BY 単発クエリ + composite index で完結する設計であることを最終確認した。

署名: task-specification-creator agent / Phase 10 review

## 10.8 DoD

- 10.1 全項目 GO
- 10.2 4 条件すべて GO
- 10.6 GO 宣言条件全充足
- 10.7 GO 判定文が記録されている
- Phase 11（contract / runtime evidence 取得）に進める状態

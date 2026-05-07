# Phase 3: 設計レビュー

実装区分: 実装仕様書

## 3.1 alternative comparison

### Option A: aggregate SQL（GROUP BY 単発）路線（採用）

| 観点 | 評価 |
| --- | --- |
| クエリ回数 | ◎ 各 endpoint で 1 クエリ |
| index 利用 | ◎ EXPLAIN で `SEARCH ... USING INDEX` を担保しやすい |
| read path との独立性 | ◎ chunk pattern を流用しないため Issue #370 苦戦箇所と直接整合 |
| 実装複雑度 | ○ SQL 設計が中心、TypeScript 側はシンプル |
| 運用 | ◎ on-demand 集計でキャッシュ層なし、整合性の検討が不要 |

→ **採用**。Issue #370 苦戦箇所「chunk pattern 流用禁止」と整合。

### Option B: 既存 `ATTENDANCE_BIND_CHUNK_SIZE = 80` chunk pattern を流用（不採用）

| 観点 | 評価 |
| --- | --- |
| クエリ回数 | ✕ メンバー数 / 80 件のチャンク単位で複数回 |
| index 利用 | △ chunk 内で IN(?) が膨大、index hit が不安定 |
| Issue #370 整合 | ✕ 苦戦箇所そのもの。流用禁止と明示されている |
| 実装複雑度 | △ aggregation を application 側で組む必要 |

→ **不採用**。AC-1 で明示的に禁止。

### Option C: endpoint 1 本に統合し response で 3 view を同梱（不採用）

| 観点 | 評価 |
| --- | --- |
| HTTP ラウンドトリップ | ◎ 1 回 |
| 単一責務 | ✕ response shape が肥大、limit パラメータも混線 |
| EXPLAIN 検証 | ✕ クエリ単位の独立 EXPLAIN が取りにくい |
| UI 段階レンダリング | ✕ 一括ロード必須 |

→ **不採用**。Phase 1 Q2 の決定通り 3 endpoint に分割。

### Option D: materialized view / cron 集計テーブル化（不採用 / 将来拡張）

| 観点 | 評価 |
| --- | --- |
| 大規模時のレスポンス | ◎ |
| 整合性管理 | ✕ write 直後の同期、cron 失敗時のフォールバック等 |
| MVP 適合性 | ✕ 過剰設計。member 規模 100〜1000 程度では on-demand で十分 |
| schema 影響 | ✕ 02b 領域への侵入 |

→ **scope out**。Phase 2 の「将来拡張点」として文書化のみ。

### Option E: ranking 用 index を追加するか / 既存 index で足りるか

| 候補 | 評価 |
| --- | --- |
| E1: 新規 `idx_member_attendance_member` を追加（採用） | ranking で `GROUP BY member_id` を行うため `member_id` 単独 index が必要。PK 内 `member_id` は composite PK の先頭であれば不要だが、現 PK 順は `(member_id, session_id)` のため使える可能性もある |
| E2: 既存 PK のみで index 不要 | composite PK `(member_id, session_id)` の左端 prefix で `member_id` GROUP BY を満たせる場合はあり。EXPLAIN で確認後、対象表の full scan が出るなら E1 を採用 |

→ Phase 5 で `EXPLAIN QUERY PLAN` を実行し、E2 で `SEARCH ... USING INDEX (PRIMARY KEY)` が出るならファイル追加を見送る。対象表の full scan が出る場合のみ E1 を採用する判断点を Phase 5 に渡す。**現時点の設計は E1 採用で進める**（保守的）。

## 3.2 PASS / MINOR / MAJOR 判定

| 判定対象 | 結果 | コメント |
| --- | --- | --- |
| aggregate SQL 設計 | PASS | GROUP BY 単発で完結、`meeting_sessions.deleted_at` / `member_status.is_deleted` を全クエリで条件化 |
| chunk pattern 非流用 | PASS | aggregate 関数から `ATTENDANCE_BIND_CHUNK_SIZE` を import しない。Phase 9 grep gate で検証 |
| endpoint 分割（3 本） | PASS | 単一責務、limit パラメータが各 endpoint で独立 |
| admin gate 結線 | PASS | 既存 `app.use("*", requireAdmin)` を踏襲。route 単体迂回なし |
| index 追加 owner 範囲 | MINOR | E1 / E2 の最終判断は Phase 5 EXPLAIN 結果に委ねる。02b と migration 番号衝突可能性を Phase 5 で再確認 |
| UI 配置 | PASS | 既存 `(admin)` レイアウト流用、新規ルートのみ追加 |
| 型契約 | PASS | `MemberProfile.attendance` interface 不変、aggregate 戻り値は独立 DTO |
| EXPLAIN 検証ゲート | PASS | Phase 9 で対象表の full scan 検出を fail 条件として固定 |

MAJOR 該当なし → 設計 PASS。

## 3.3 依存契約レビュー

| 依存 | 契約 | 本タスクでの遵守確認 |
| --- | --- | --- |
| 02a `MemberProfile.attendance: AttendanceRecord[]` | interface 不変 | aggregate 関数は独立 DTO（`AttendanceOverview` / `SessionAttendanceRow` / `MemberAttendanceRanking`）を返す。`AttendanceRecord` 型は変更しない |
| 02a `AttendanceProvider.findByMemberIds` / `ATTENDANCE_BIND_CHUNK_SIZE` | read path 動作不変 | aggregate path は独立系統。chunk 定数は import しない |
| followup-001 `addAttendance` / `removeAttendance` | write path 動作不変 | aggregate は read-only、write には触れない |
| 02b `meeting_sessions.deleted_at` semantics | NULL = active | 全 aggregate クエリで `deleted_at IS NULL` を必須条件化 |
| 02b migration 番号空間 | 番号衝突回避 | 新規 migration は Phase 5 開始時点で番号最終確定（02b の最新コミット確認後） |
| 05a admin gate middleware | route 単体迂回禁止 | 全 admin attendance dashboard route で `app.use("*", requireAdmin)` 経由 |

## 3.4 Risk register

| リスク | 確率 | 影響 | 対策 |
| --- | --- | --- | --- |
| 02b と migration 番号衝突 | 中 | 中 | Phase 5 開始時に `git log apps/api/migrations/` で最新番号を確認、本タスクは末尾番号採用 |
| `EXPLAIN QUERY PLAN` で対象表の full scan が解消できない | 低 | 高 | Phase 5 で E1（新規 index）を即採用、必要なら部分 index を追加。Phase 9 で gate 化 |
| ranking クエリの大規模時遅延 | 低 | 中 | MVP 規模では発生しない想定。Phase 6 で 1000 件相当の負荷シナリオ確認、必要なら Option D を follow-up タスク化 |
| admin gate middleware 仕様変更 | 低 | 中 | 05a 完了済み。万一の場合は既存 `dashboard.ts` の使用方法を完全に踏襲 |
| UI 側で D1 直接アクセスを誤って導入 | 低 | 高 | 不変条件 #5 違反。Phase 9 で `apps/web` 配下に D1 binding 直接利用 import が無いことを grep gate |
| `MemberProfile.attendance` への破壊的変更 | 低 | 高 | aggregate 関数は独立 DTO のみ。Phase 9 で interface diff を検査 |

## 3.5 GO 判定

→ **GO**: Phase 4（テスト戦略）に進む。

## 3.6 次フェーズへの引き渡し

- Phase 4 では Phase 2.6 の変更ファイル一覧 × AC-1〜11 の test matrix を作る
- Phase 5 では Phase 2.9 のローカル実行コマンドを runbook 化、migration 番号を最終確定、E1/E2 の最終判断を EXPLAIN で実施
- Phase 9 では (a) `ATTENDANCE_BIND_CHUNK_SIZE` 非流用 grep gate、(b) `EXPLAIN QUERY PLAN` の対象表 full scan 不在 gate、(c) `apps/web` から D1 binding への直接 import 不在 gate を機械化
- Phase 11 では Phase 2.7 の入出力定義を curl evidence 4 件の期待値として固定

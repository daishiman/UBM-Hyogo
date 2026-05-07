# Phase 3: 設計レビュー

実装区分: 実装仕様書

## 3.1 alternative comparison

### Option A: Writer interface 化 + 既存関数 thin wrapper（採用）

| 観点 | 評価 |
| --- | --- |
| 後方互換 | ◎ 既存 `addAttendance` / `removeAttendance` 利用箇所は無改変 |
| read path との対称性 | ◎ `AttendanceProvider` と factory パターンが揃う |
| test seam | ◎ Writer を mock 可能、route テストが軽量化 |
| 工数 | ○ 中（factory 1 個 + シグネチャ調整 + テスト追加） |

### Option B: 関数群維持、route 層から直接呼び出し（不採用）

| 観点 | 評価 |
| --- | --- |
| 後方互換 | ◎ |
| read path との対称性 | ✕ provider と非対称、test seam が異なる |
| test seam | △ route テストで D1 mock が必要 |
| 工数 | ◎ 最小 |

→ read path との対称性と test seam を優先し Option A を採用。

### Option C: hard delete を soft delete (`deleted_at` 列追加) へ刷新（不採用 / 将来拡張）

| 観点 | 評価 |
| --- | --- |
| 監査可能性 | ◎ |
| schema 影響 | ✕ 02b と migration 競合、本タスク scope 逸脱 |
| read path 影響 | ✕ INNER JOIN 条件追加が必要 |

→ scope out。Phase 2 の「将来拡張点」として文書化のみ。

### Option D: route URL 命名 — `/admin/meetings/:id/attendances` vs `/admin/attendances`

| 観点 | A: meeting nested (採用) | B: flat |
| --- | --- | --- |
| 既存 admin route 慣習 | ◎ `/meetings/:id/...` で揃う | ✕ 既存と非対称 |
| RESTful resource | ◎ session 配下の attendance | ○ |
| 認可スコープ | ◎ session id で一括 | △ route 単位で複数権限 |

→ A を採用（既存 `apps/api/src/routes/admin/meetings.test.ts` が既に POST `/meetings/:id/attendances` を前提としており、これを正規化）。

## 3.2 PASS / MINOR / MAJOR 判定

| 判定対象 | 結果 | コメント |
| --- | --- | --- |
| Writer contract 設計 | PASS | read path と対称、test seam 確立 |
| 楽観排他方式 | PASS | 既存 `isUniqueConstraintError` 経路を踏襲、新 helper 不要 |
| admin gate 結線 | PASS | 05a の確定 middleware を route 単体で迂回しない |
| audit log 結線 | PASS | 既存 `audit.test.ts` の前提と一致 |
| branded type 展開 | MINOR | write 関数シグネチャへ `MeetingSessionId` 導入 — read 側からの呼び出しで cast helper が必要になる箇所を Phase 5 で洗い出す |
| schema 変更 | PASS | 本タスクでは行わない（scope out 明確化） |
| error mapping (`duplicate` → 409 conflict) | PASS | 06c-E / 07c の既存 route contract に合わせ、repository は duplicate reason + existing、HTTP は 409 `attendance_already_recorded` に統一する |

MAJOR 該当なし → 設計 PASS。

## 3.3 依存契約レビュー

| 依存 | 契約 | 本タスクでの遵守確認 |
| --- | --- | --- |
| 02a `MemberProfile.attendance: AttendanceRecord[]` | interface 不変 | Writer の戻り値は別 type (`MemberAttendanceRow`) を使用、`AttendanceRecord` 型は変更しない |
| 02a `AttendanceProvider.findByMemberIds` | read path 動作不変 | Writer 経由の write 後、即時 read で `held_on DESC` 順序を維持して観測可能 |
| 02b `meeting_sessions.deleted_at` semantics | NULL = active | `addAttendance` の事前チェックで遵守 |
| 05a admin gate middleware | route 単体迂回禁止 | 全 admin attendance route で `app.use("/admin/*", adminGate)` 経由 |
| `audit_log` event schema | `action` / `actor_email` / `target_type` / `target_id` | `attendance.add` / `attendance.remove` で記録 |

## 3.4 Risk register

| リスク | 確率 | 影響 | 対策 |
| --- | --- | --- | --- |
| 既存 `addAttendance` 呼び出し箇所のシグネチャ非互換 | 低 | 中 | Phase 5 で grep し全呼び出し箇所を Writer 経由 or branded type cast に書き換え。typecheck で検出 |
| audit log 結線漏れ | 中 | 高 | route 層で `attendance.add` / `attendance.remove` を **必ず** 発火させる integration test を追加 (AC-5) |
| read-after-write の race | 低 | 低 | D1 は single-region single-isolate write のため race なし。テストは sequential await |
| admin gate middleware の export 不安定 | 低 | 中 | 05a 完了済みのため低リスク。万一の場合は route 内部で gate adapter を導入 |

## 3.5 GO 判定

→ **GO**: Phase 4（テスト戦略）に進む。

## 3.6 次フェーズへの引き渡し

- Phase 4 では Phase 2.5 の変更ファイル一覧 × AC-1〜11 の test matrix を作る
- Phase 5 では Phase 2.7 のローカル実行コマンドを実装手順に展開
- Phase 11 では Phase 2.6 の入出力定義を curl evidence の期待値として固定

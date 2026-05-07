# タスク仕様書: Issue #372 — 大量出席履歴のページング対応

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-372-attendance-pagination |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/372 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md` |
| 上流 wave | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/`（read path 正本。本タスクはページング拡張） |
| 配置先 | `docs/30-workflows/issue-372-attendance-pagination/` |
| 作成日 | 2026-05-06 |
| 状態 | implemented-local / Phase 11 visual evidence pending |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 | **[実装区分: 実装]** — Issue 本文 AC（「ページング endpoint 新設」「既存仕様の `attendanceMeta` 追加」「repository に optional `limit` / `cursor` 引数」）に対する物理コード変更（`apps/api/src/repository/attendance.ts` / `apps/api/src/repository/_shared/builder.ts` / `apps/api/src/routes/me/index.ts` / `apps/api/src/routes/admin/members.ts` / `packages/shared/src/types/viewmodel/index.ts` / `apps/web` profile・admin 詳細 UI）を実装済み。Issue は CLOSED だが、ユーザー指示により実装レビューサイクル内で local 実装まで完了した。 |
| 優先度 | LOW（Issue ラベル `priority:low`） |
| 想定 PR 数 | 1（backend repository / route / shared 型 / web UI / API schema docs / runbook を一括） |
| coverage AC | 既存 read path テストの regression なし + ページング新規ケース PASS（`apps/api` `attendance` / `builder` / `routes/me` / `routes/admin/members`） |

## 目的

`MemberProfile.attendance` を「直近 N 件 + cursor 継続取得」モデルに切り出し、長期会員（数百件以上）の出席履歴で `/me/profile` レスポンスサイズと Cloudflare Workers の CPU/レスポンスサイズ制約を吸収する。後方互換のため、既存 `findByMemberIds(ids)` は無変更で維持し、個人特化 API として `findByMemberId(id, { limit, cursor })` を新設する。`MemberProfile.attendance: AttendanceRecord[]` 型契約は破壊せず、`attendanceMeta?: { hasMore, nextCursor }` を optional field として追加する。

## スコープ

### 含む

- `apps/api/src/repository/attendance.ts`:
  - `findByMemberId(memberId, opts?: { limit?: number; cursor?: AttendanceCursor })` メソッドを `AttendanceProvider` インタフェースに追加。
  - `AttendanceCursor` 型（`{ heldOn: string; sessionId: MeetingSessionId }` の base64url JSON エンコード）と encode/decode ヘルパ。
  - 定数 `ATTENDANCE_PAGE_DEFAULT_LIMIT = 50` / `ATTENDANCE_PAGE_MAX_LIMIT = 200`。
  - `findByMemberIds(ids)` は無変更（後方互換維持）。
- `apps/api/src/repository/_shared/builder.ts`:
  - `buildMemberProfile(c, mid, deps?)` / `buildAdminMemberDetailView(c, mid, notes, deps?)` の `deps` に optional `attendancePage?: { limit?: number; cursor?: string }` を追加（encoded cursor string。repository 呼び出し前に decode）。
  - 注入時は `findByMemberId` 経路で取得し `attendanceMeta` を埋める。未注入時は既存挙動（`findByMemberIds` 経由）を維持。
- `packages/shared/src/types/viewmodel/index.ts`:
  - `MemberProfile.attendanceMeta?: { hasMore: boolean; nextCursor: string | null }` を optional 追加。
- `apps/api/src/routes/me/index.ts`:
  - 既存 `/me/profile` は default limit (50) で先頭ページ + `attendanceMeta` を返す。
  - 新規 `GET /me/attendance?limit=&cursor=` を追加し、追加読み込みを担う。
- `apps/api/src/routes/admin/members.ts`:
  - 既存 `/admin/members/:memberId` は default limit (50) で先頭ページ + `attendanceMeta` を返す。
  - 新規 `GET /admin/members/:memberId/attendance?limit=&cursor=` を追加。
- `apps/web` profile attendance セクション / admin 会員詳細 attendance セクションの「もっと見る」UI（`hasMore` 時に next cursor で fetch）。
- `packages/shared/src/zod/viewmodel.ts` の Zod schema に `attendanceMeta` 追加。
- `docs/00-getting-started-manual/specs/01-api-schema.md` のレスポンス例とパラメータ表を更新。
- 単体テスト（`attendance-provider.test.ts` / `builder.test.ts`）と route 統合テスト（`me/index.test.ts` / `admin/members.test.ts`）にページング新規ケースを追加。
- E2E (Playwright) で profile 「もっと見る」スモーク（VISUAL evidence）。
- Phase 12 runbook: cursor encoding 仕様 / クライアント実装ガイド。
- Phase 11 staging visual evidence は Cloudflare / authenticated browser runtime が必要なため未取得。local 実装・focused tests・正本同期は本サイクルで完了済み。

### 含まない

- `findByMemberIds(ids)` 一括 API のページング化（複数 member × member 別 cursor は設計困難。Issue 苦戦箇所と整合する明示スコープ外であり、先送り未タスクではない）。
- 集計 / ダッシュボード（[ut-02a-followup-002](../completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-002-attendance-dashboard-analytics.md)）。
- write path（[ut-02a-followup-001](../completed-tasks/ut-02a-followup-001-attendance-write-operations/)）。
- 仮想スクロール / プリフェッチ等の UX 高度化。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `ut-02a-attendance-profile-integration` (merged) | `findByMemberIds` / `MemberProfile.attendance` / `AttendanceRecord` の型契約が確定済 |
| 関連 | `ut-02a-followup-001` (write) | write 後の cursor 一意性に影響なし（held_on DESC + sessionId tiebreak で順序安定） |
| 下流 | `ut-02a-followup-002` (dashboard) | dashboard 集計は本ページング API を利用しない（全件集計は別経路） |

## Phase ファイル一覧

| Phase | ファイル | 役割 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義・GO 判定（Issue AC 確認・evidence ゲート評価） |
| 2 | [phase-02.md](phase-02.md) | 設計（cursor format / API shape / 型契約 / UI 導線） |
| 3 | [phase-03.md](phase-03.md) | 設計レビューゲート |
| 4 | [phase-04.md](phase-04.md) | テスト雛形作成（RED） |
| 5 | [phase-05.md](phase-05.md) | 実装（repository / builder / shared 型 / route / web UI） |
| 6 | [phase-06.md](phase-06.md) | テスト拡充（GREEN・統合・E2E） |
| 7 | [phase-07.md](phase-07.md) | カバレッジ確認（attendance / builder / routes/me / routes/admin/members） |
| 8 | [phase-08.md](phase-08.md) | リファクタリング |
| 9 | [phase-09.md](phase-09.md) | 品質保証（typecheck / lint / build / vitest run） |
| 10 | [phase-10.md](phase-10.md) | 最終レビューゲート |
| 11 | [phase-11.md](phase-11.md) | 手動実機検証（Playwright VISUAL + curl evidence） |
| 12 | [phase-12.md](phase-12.md) | ドキュメント更新（必須 6 タスク + cursor runbook） |
| 13 | [phase-13.md](phase-13.md) | PR 作成（diff-to-pr） |

## 実装区分判定根拠

ユーザー指示: 「Issue #372 (CLOSED) のタスク仕様書を Phase 1-13 で作成」。Issue 本文の AC は「endpoint 新設 / 仕様変更」「repository への引数追加」「UI 改修」を含み、ドキュメントのみで完結しない。CONST_004 に従い、Issue が CLOSED であり priority:low であっても、目的達成に物理コード変更が必須であるため **実装仕様書** として作成する。

## CONST_007 スコープ宣言

本仕様書は単一 PR 1 サイクル内で完了するスコープ。backend (repository / builder / route)、shared 型、apps/web UI、API schema docs、テスト、Phase 12 runbook を一括で含む。先送りタスクなし。`findByMemberIds` 一括 API のページング化は、個人特化 `findByMemberId` を追加することで要件を満たすため、未タスク化せずスコープ外として閉じる。

> **Issue 元の「実 evidence 出現後に着手」記載について**: 2026-05-07 のユーザー指示（実装レビューサイクル内で検出漏れを原則修正完了）を Phase 1 GO 判断として扱い、local 実装まで進めた。staging / production runtime evidence、commit、push、PR は引き続きユーザー承認ゲートに従う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md` | 起票元仕様 / 苦戦箇所 / AC |
| 必須 | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md` | 上流 read path 実装サマリ / 変更ファイル正本 |
| 必須 | `apps/api/src/repository/attendance.ts` | 変更対象（`AttendanceProvider` / `AttendanceRecord` / `ATTENDANCE_BIND_CHUNK_SIZE`） |
| 必須 | `apps/api/src/repository/_shared/builder.ts` | 変更対象（builder への deps 追加） |
| 必須 | `apps/api/src/routes/me/index.ts` | 変更対象（`/me/profile` + 新規 `/me/attendance`） |
| 必須 | `apps/api/src/routes/admin/members.ts` | 変更対象（`/admin/members/:id` + 新規 attendance endpoint） |
| 必須 | `packages/shared/src/types/viewmodel/index.ts` | 変更対象（`attendanceMeta` 追加） |
| 必須 | `packages/shared/src/zod/viewmodel.ts` | 変更対象（schema に `attendanceMeta`） |
| 関連 | `docs/00-getting-started-manual/specs/01-api-schema.md` | API schema 正本 |
| 関連 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 制約 / bind chunk 上限 |

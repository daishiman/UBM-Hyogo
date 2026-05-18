# ut-07c-followup-001-attendance-csv-import - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api` に新 endpoint `POST /admin/meetings/:sessionId/attendance/import` を追加し、`use-cases/admin/import-attendance-bulk.ts` 新規 service、`repository/attendance.ts` への新規 lookup 関数追加、`apps/web` 側に CSV upload → preview → confirm の 3 ステップ wizard panel (`AttendanceCsvImportPanel.tsx`)、CSV parse util (`apps/web/src/lib/csv/parse-attendance.ts`)、`papaparse` 依存追加を伴うコード実装タスク。ドキュメントや CI 設定単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-07C-FU-001 |
| タスク名 | meeting attendance CSV 一括 import |
| ディレクトリ | docs/30-workflows/ut-07c-followup-001-attendance-csv-import |
| 親タスク | UT-07C (meeting attendance audit API, 単一 add/remove + audit_log 既実装済) |
| GitHub Issue | #312 |
| 作成日 | 2026-05-18 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation / VISUAL |
| 実装 mode | new |
| 優先度 | MEDIUM |

## workflow state

| 項目 | 値 |
| --- | --- |
| root status | implemented_local_evidence_captured |
| metadata.workflow_state | implemented_local_evidence_captured |
| implementation_status | implemented_local_evidence_captured |
| 状態語彙の根拠 | `apps/api` / `apps/web` の実装差分、focused API/Web tests、Phase 11 local Playwright screenshot 4 枚、Phase 12 strict 7 成果物が同一 wave で揃った。commit / push / PR は Phase 13 の user approval gate に残す。 |

## 目的

admin が CSV upload で大量の出席登録を一括処理できるようにする。誤投入リスクを抑えるため、
upload → dry-run preview → confirm の 3 ステップ wizard を提供し、行別エラー分類 (`ok` /
`duplicate` / `deleted_member` / `unknown_member` / `invalid`) と audit_log 統合を必須とする。

これにより、既存 UT-07C の単一 add/remove API + 手動 UI 操作では非現実的な
「meeting 後の数十〜数百名 attendance 登録」を 1 操作で完了可能にする。

## スコープ

### 含む

- `apps/api/src/routes/admin/attendance.ts` への新 endpoint `POST /admin/meetings/:sessionId/attendance/import?dryRun=true|false` 追加
- `apps/api/src/use-cases/admin/import-attendance-bulk.ts`（新規）: bulk import service
- `apps/api/src/repository/attendance.ts` に `listExistingAttendanceMemberIds` 追加
- 行別判定: `ok` / `duplicate` / `deleted_member` / `unknown_member` / `invalid`
- audit_log 統合: 成功行ごとに `action='attendance.import.add'` で 1 record
- D1 batch insert を `ATTENDANCE_BIND_CHUNK_SIZE = 80` で分割
- import 上限 500 行（超過時 413 Payload Too Large）
- admin UI 3 ステップ wizard (`AttendanceCsvImportPanel.tsx` 新規)
- CSV parse はクライアント側 (`papaparse`)、API には parse 済 JSON を送る
- 既存 `MeetingAttendancePanel` sibling として配置（既存 panel は変更しない）

### 含まない

- 新 D1 schema / 新テーブル
- Google Form schema 変更
- 単一 add/remove endpoint の挙動変更（後方互換維持）
- attendance 一括 **削除** API（本タスクは add のみ）
- multipart/form-data によるサーバ側 CSV parse（MVP では JSON 配列で受ける分担）
- 親 UT-07C の AC 再検証

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/routes/admin/attendance.ts | 既存 single add/remove route surface |
| 必須 | apps/api/src/repository/attendance.ts | `addAttendance` / `removeAttendance` / `ATTENDANCE_BIND_CHUNK_SIZE = 80` |
| 必須 | apps/api/src/repository/__tests__/auditLog.repository.spec.ts | audit_log schema 継承 |
| 必須 | apps/api/src/middleware/require-admin.ts | `requireAdmin` 流用 |
| 必須 | apps/api/src/repository/_shared/brand.ts | `asMemberId` / `asAdminId` / `auditAction` |
| 必須 | apps/web/app/(admin)/admin/meetings/[id]/page.tsx | panel 配置先 |
| 必須 | apps/web/src/lib/env.ts | `getEnv()` 経由のみ参照（CLAUDE.md 不変条件） |
| 参考 | CLAUDE.md | apps/web から D1 直接アクセス禁止 / `*.spec.ts` 強制 |
| 参考 | https://www.papaparse.com/ | クライアント側 CSV parse ライブラリ |

## 受入条件 (AC) — Issue #312 完了条件

- **AC-1**: `POST /admin/meetings/:sessionId/attendance/import?dryRun=true` が副作用なしで row 別判定結果を返す。
- **AC-2**: `POST /admin/meetings/:sessionId/attendance/import?dryRun=false` で commit 経路が D1 batch insert を `ATTENDANCE_BIND_CHUNK_SIZE = 80` で分割実行し、成功行ごとに audit_log を 1 record 出力する。
- **AC-3**: admin UI で upload → preview → confirm の 3 ステップ wizard が動作し、preview 段階で行別エラーが可視化される。
- **AC-4**: 500 行超過時に 413、actor 未認証 401、non-admin 403 を返す。

## Phase 一覧（本仕様書の対象範囲）

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{api-design,service-design,ui-design}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | テスト作成 (RED) | phase-04.md | completed | outputs/phase-04/test-plan.md |
| 5 | 実装 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-06/test-augmentation.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-07/coverage-report.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-08/refactor-log.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/qa-report.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/final-review.md |
| 11 | 手動テスト (VISUAL) | phase-11.md | completed | outputs/phase-11/manual-test-result.md ほか |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/{main.md + 6 補助成果物} |
| 13 | PR作成 | phase-13.md | pending_user_approval | outputs/phase-13/pr-summary.md |

## 不変条件

1. **apps/web から D1 直接アクセス禁止**: CSV parse はクライアント、D1 access は `apps/api` の新 endpoint 経由のみ。
2. **test ファイルは `*.spec.{ts,tsx}` のみ**: `*.test.*` は禁止（lefthook / GHA で reject）。
3. **env 参照は `getEnv()` 経由のみ**: `apps/web` 側で `process.env.*` 直接参照禁止。
4. **既存 endpoint surface を破壊しない**: 単一 add/remove はそのまま、新 endpoint を **追加** する。
5. **UI prototype alignment workflow の制約とは別タスク**: 本タスクは新 endpoint 追加を伴うため、`新 endpoint 追加禁止` 制約は適用されない。
6. **import 上限 500 行**: メモリ上突合の上限。超過は 413 で reject。
7. **CONST_005 遵守**: Phase 5 仕様書に変更対象ファイル一覧 / 関数シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD を含める。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| 重複 attendance の発生 | dry-run 必須化 + `listExistingAttendanceMemberIds` でメモリ突合 |
| D1 batch insert の部分失敗 | `ATTENDANCE_BIND_CHUNK_SIZE = 80` で分割 + chunk 単位でエラー切り分け |
| audit_log の整合性破綻 | 成功行ごとに 1 record・count assertion をテストで担保 |
| CSV malformed / 巨大ファイル | クライアント側 papaparse + 500 行上限 + 413 |
| email lookup の大文字小文字 / 全角差 | NFKC 正規化 + lowercase 比較（service 層 helper） |
| deleted_member の誤登録 | `member_status.is_deleted = 1` を `deleted_member` に分類して reject |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (設計)
  ├─ outputs/phase-02/api-design.md
  ├─ outputs/phase-02/service-design.md
  └─ outputs/phase-02/ui-design.md
       │
       ▼
phase-03 (設計レビュー) → phase-04 (RED テスト)
       │
       ▼
phase-05 (実装) → phase-06 (テスト拡充) → phase-07 (カバレッジ)
       │
       ▼
phase-08 (リファクタ) → phase-09 (品質保証) → phase-10 (最終レビュー)
       │
       ▼
phase-11 (VISUAL evidence) → phase-12 (ドキュメント strict 7 成果物) → phase-13 (PR / user-gated)
```

## 注意点

- 本仕様書は **コード未実装** の状態。Phase 4 で RED test を物理作成し、Phase 5 以降で実コードへ反映する。実装着手後は root `metadata.workflow_state` を `spec_created` のままにしない。
- 親 UT-07C は単一 add/remove + audit_log 既実装済を前提とする（本 followup は新 endpoint を追加するのみ）。
- Phase 13 の commit / push / PR は CLAUDE.md 「PR作成の完全自律フロー」に従いユーザー明示承認後に実行する。
